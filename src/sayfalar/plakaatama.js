// src/sayfalar/plakaatama.js
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabase";

import SeferDetayDrawer from "../plakaAtama/SeferDetayDrawer";
import SoforSwapDialog from "../plakaAtama/SoforSwapDialog";
import PlakaAtamaGrid from "../plakaAtama/PlakaAtamaGrid";

import { s } from "../plakaAtama/plakaAtama.styles";
import { columns } from "../plakaAtama/plakaAtama.columns";

// ✅ IMPORTANT: uzantıyı .js ver (asset'e resolve olmasın diye)
import VknDegistirme from "../plakaAtama/vknDegistirme.js";

import {
    Box,
    Typography,
    InputBase,
    Chip,
    Button,
    Stack,
    Snackbar,
    Alert,
    Divider,
    CircularProgress,
    Popover,
    List,
    ListItemButton,
    ListItemText,
} from "@mui/material";

import {
    Save as SaveIcon,
    FileDownload as FileDownloadIcon,
    Search as SearchIcon,
    Timeline as TimelineIcon,
    Refresh as RefreshIcon,
    DoneAll as DoneAllIcon,
    DeleteOutline as DeleteOutlineIcon,
    Clear as ClearIcon,
} from "@mui/icons-material";

// ✅ Excel export için
import * as XLSX from "xlsx";

// ✅ navlun rules / typing engine
import { toNumber } from "../plakaAtama/navlunRules";
import { useNavlunTypingDiscount } from "../plakaAtama/useNavlunEngine";

/* =========================================================
   ✅ YETKİ SİSTEMİ (Ekran + Buton + Grid Kolon)
========================================================= */
const EKRAN_KOD = "plakaatama";
const GRID_KOD = "main";

const BTN = {
    SAVE: "plakaatama.save",
    EXPORT: "plakaatama.export_excel",
    REFRESH: "plakaatama.refresh",
    COMPLETE_SELECTED: "plakaatama.complete_selected",
    DELETE_SELECTED: "plakaatama.delete_selected",

    // satır aksiyonları
    ROW_EDIT: "plakaatama.row.edit",
    ROW_OPEN_DETAILS: "plakaatama.row.open_details",
    ROW_SWAP_DRIVER: "plakaatama.row.swap_driver",
    ROW_OPEN_VKN: "plakaatama.row.open_vkn",
    ROW_OPEN_LISTBOX: "plakaatama.row.open_listbox",
};

async function fetchEkranIdByKod({ supabase, ekranKod }) {
    const { data, error } = await supabase
        .from("ekranlar")
        .select("id,kod")
        .eq("kod", ekranKod)
        .eq("aktif", true)
        .maybeSingle();

    if (error) throw error;
    return data?.id || null;
}

async function fetchEffectiveEkranIzin({ supabase, ekranId, userId, roleId }) {
    const [{ data: uE, error: uErr }, { data: rE, error: rErr }] = await Promise.all([
        supabase
            .from("kullanici_ekran_yetkileri")
            .select("izin")
            .eq("kullanici_id", userId)
            .eq("ekran_id", ekranId)
            .maybeSingle(),
        supabase
            .from("rol_ekran_yetkileri")
            .select("izin")
            .eq("rol_id", roleId)
            .eq("ekran_id", ekranId)
            .maybeSingle(),
    ]);

    if (uErr) throw uErr;
    if (rErr) throw rErr;

    return (uE?.izin ?? rE?.izin) === true;
}

async function fetchButtonMaps({ supabase, ekranId, userId, roleId }) {
    const { data: btns, error: btnErr } = await supabase
        .from("butonlar")
        .select("id,kod")
        .eq("ekran_id", ekranId)
        .eq("aktif", true);

    if (btnErr) throw btnErr;

    const buttonRows = btns || [];
    const idToKod = new Map(buttonRows.map((b) => [b.id, String(b.kod || "").trim()]));
    const allIds = buttonRows.map((b) => b.id);

    const [{ data: uB, error: uErr }, { data: rB, error: rErr }] = await Promise.all([
        supabase.from("kullanici_buton_yetkileri").select("buton_id, izin").eq("kullanici_id", userId),
        supabase.from("rol_buton_yetkileri").select("buton_id, izin").eq("rol_id", roleId),
    ]);

    if (uErr) throw uErr;
    if (rErr) throw rErr;

    const userMap = {};
    (uB || []).forEach((x) => (userMap[x.buton_id] = !!x.izin));

    const roleMap = {};
    (rB || []).forEach((x) => (roleMap[x.buton_id] = !!x.izin));

    const kodIzin = {};
    allIds.forEach((id) => {
        const kod = idToKod.get(id);
        if (!kod) return;

        if (Object.prototype.hasOwnProperty.call(userMap, id)) kodIzin[kod] = userMap[id];
        else if (Object.prototype.hasOwnProperty.call(roleMap, id)) kodIzin[kod] = roleMap[id];
        else kodIzin[kod] = false;
    });

    return kodIzin;
}

/* =========================
   ✅ GRID / KOLON PERMS
========================= */
async function fetchGridIdByEkran({ supabase, ekranId, gridKod }) {
    const { data, error } = await supabase
        .from("ekran_gridler")
        .select("id,kod")
        .eq("ekran_id", ekranId)
        .eq("kod", gridKod)
        .eq("aktif", true)
        .maybeSingle();

    if (error) throw error;
    return data?.id || null;
}

// output: { [kolonKod]: { gorebilir: boolean, duzenleyebilir: boolean } }
async function fetchEffectiveGridKolonPerms({ supabase, gridId, userId, roleId }) {
    const { data: cols, error: cErr } = await supabase
        .from("grid_kolonlar")
        .select("id,kod,aktif")      // ✅ aktif de al
        .eq("grid_id", gridId);      // ✅ aktif filtresi YOK

    if (cErr) throw cErr;

    const colList = cols || [];
    const colIds = colList.map((x) => x.id);
    if (colIds.length === 0) return {};

    const [{ data: rRows, error: rErr }, { data: uRows, error: uErr }] = await Promise.all([
        supabase
            .from("rol_grid_kolon_yetkileri")
            .select("kolon_id,gorebilir,duzenleyebilir")
            .eq("rol_id", roleId)
            .in("kolon_id", colIds),
        supabase
            .from("kullanici_grid_kolon_yetkileri")
            .select("kolon_id,gorebilir,duzenleyebilir")
            .eq("kullanici_id", userId)
            .in("kolon_id", colIds),
    ]);

    if (rErr) throw rErr;
    if (uErr) throw uErr;

    const roleMap = {};
    (rRows || []).forEach((x) => {
        roleMap[x.kolon_id] = {
            gorebilir: x.gorebilir !== false,
            duzenleyebilir: x.duzenleyebilir === true,
        };
    });

    const userMap = {};
    (uRows || []).forEach((x) => {
        userMap[x.kolon_id] = {
            gorebilir: x.gorebilir !== false,
            duzenleyebilir: x.duzenleyebilir === true,
        };
    });

    // ✅ burada aktif bilgisini de map’e koy
    const byKod = {};
    colList.forEach((c) => {
        const eff = userMap[c.id] ?? roleMap[c.id] ?? { gorebilir: true, duzenleyebilir: false };
        byKod[String(c.kod || "").trim()] = {
            ...eff,
            aktif: c.aktif !== false, // ✅ aktif=false ise kapalı
        };
    });

    return byKod;
}
// ✅ küçük debounce hook
function useDebouncedValue(value, delayMs = 120) {
    const [deb, setDeb] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDeb(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return deb;
}

function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export default function PlakaAtamaPremiumGrid({ batchId = null }) {
    /* =========================
       ✅ PERMISSION STATE
    ========================= */
    const [permLoading, setPermLoading] = useState(true);
    const [perm, setPerm] = useState({
        ekranGorunur: false,
        ekranYazma: false,
        btn: {}, // kod -> boolean
    });

    // ✅ grid kolon perms
    const [gridId, setGridId] = useState(null);
    const [colPerms, setColPerms] = useState({}); // kolonKod -> { gorebilir, duzenleyebilir }

    const can = useCallback(
        (btnKod) => {
            if (!perm.ekranGorunur) return false;
            return perm.btn?.[btnKod] === true;
        },
        [perm]
    );

    // Perm yükle
    useEffect(() => {
        let alive = true;

        async function loadPerms() {
            try {
                setPermLoading(true);

                // ✅ localStorage login
                const raw = localStorage.getItem("bapsis_user");
                const lsUser = raw ? JSON.parse(raw) : null;

                const userId = lsUser?.id;
                if (!userId) {
                    if (alive) {
                        setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                        setGridId(null);
                        setColPerms({});
                    }
                    return;
                }

                // ✅ kullanicilar tablosundan rol_id al
                const { data: uRow, error: uErr } = await supabase
                    .from("kullanicilar")
                    .select("id, rol_id")
                    .eq("id", userId)
                    .maybeSingle();

                if (uErr) throw uErr;

                const roleId = uRow?.rol_id;
                if (!roleId) {
                    if (alive) {
                        setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                        setGridId(null);
                        setColPerms({});
                    }
                    return;
                }

                const ekranId = await fetchEkranIdByKod({ supabase, ekranKod: EKRAN_KOD });
                if (!ekranId) {
                    if (alive) {
                        setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                        setGridId(null);
                        setColPerms({});
                    }
                    return;
                }

                const ekranIzin = await fetchEffectiveEkranIzin({ supabase, ekranId, userId, roleId });
                const btnMap = await fetchButtonMaps({ supabase, ekranId, userId, roleId });

                // ✅ grid kolon izinleri
                const gId = await fetchGridIdByEkran({ supabase, ekranId, gridKod: GRID_KOD });
                if (alive) setGridId(gId);

                if (gId) {
                    const permsByKod = await fetchEffectiveGridKolonPerms({ supabase, gridId: gId, userId, roleId });
                    if (alive) setColPerms(permsByKod || {});
                } else {
                    if (alive) setColPerms({});
                }

                if (alive) setPerm({ ekranGorunur: ekranIzin, ekranYazma: ekranIzin, btn: btnMap });
            } catch (e) {
                console.error("perm load error:", e);
                if (alive) {
                    setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                    setGridId(null);
                    setColPerms({});
                }
            } finally {
                if (alive) setPermLoading(false);
            }
        }

        loadPerms();
        return () => {
            alive = false;
        };
    }, []);

    /* =========================
       ✅ GRID: görünür kolonlar
    ========================= */
    const visibleColumns = useMemo(() => {
        const hasAny = colPerms && Object.keys(colPerms).length > 0;
        if (!hasAny) return [];

        return columns.filter((c) => {
            const p = colPerms[c.key];
            if (!p) return false;
            if (p.aktif === false) return false;
            if (p.gorebilir === false) return false;
            return true;
        });
    }, [colPerms, columns]);

    const visibleColumnKeys = useMemo(() => {
        const hasAny = colPerms && Object.keys(colPerms).length > 0;
        if (!hasAny) return [];

        return columns
            .filter((c) => {
                const p = colPerms[c.key];
                if (!p) return false;
                if (p.aktif === false) return false;
                if (p.gorebilir === false) return false;
                return true;
            })
            .map((c) => c.key);
    }, [colPerms, columns]);

    const editableColumnKeys = useMemo(() => {
        const forcedListboxFields = new Set(["cekici", "surucu", "vkn"]);

        const hasAny = colPerms && Object.keys(colPerms).length > 0;
        if (!hasAny) return ["cekici", "surucu", "vkn"];

        return columns
            .filter((c) => {
                if (forcedListboxFields.has(String(c.key).trim())) return true;

                const p = colPerms[c.key];
                if (!p) return false;
                if (p.aktif === false) return false;
                if (p.gorebilir === false) return false;
                if (p.duzenleyebilir !== true) return false;
                return true;
            })
            .map((c) => c.key);
    }, [colPerms, columns]);
    const NAVLUN_TYPING_DELAY_MS = 1500;
    const RECOMPUTE_DELAY_MS = 900;

    const [q, setQ] = useState("");
    const qDeb = useDebouncedValue(q, 200);
    const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState(null);

    const [filterMissingPlate, setFilterMissingPlate] = useState(false);


    const [rows, setRows] = useState([]);
    const rowsRef = useRef([]);
    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    const rowIndexRef = useRef(new Map());
    useEffect(() => {
        const m = new Map();
        rows.forEach((r, i) => m.set(r.id, i));
        rowIndexRef.current = m;
    }, [rows]);

    const patchRow = useCallback((rowId, patch) => {
        setRows((prev) => {
            const idx = rowIndexRef.current.get(rowId);
            if (idx == null) return prev;

            const next = prev.slice();
            const cur = next[idx];
            const add = typeof patch === "function" ? patch(cur) : patch;

            next[idx] = { ...cur, ...add };
            return next;
        });
    }, []);

    const [loading, setLoading] = useState(false);
    const [loadErr, setLoadErr] = useState("");

    const [plakalar, setPlakalar] = useState([]);
    const [plakaLoading, setPlakaLoading] = useState(false);

    const [lb, setLb] = useState({ open: false, anchorEl: null, rowId: null, field: null, query: "" });
    const [swapDlg, setSwapDlg] = useState({
        open: false,
        rowId: null,
        query: "",
        targetPlakaId: null,
        sourcePlaka: null,
    });
    const [saving, setSaving] = useState(false);

    const [vknDlg, setVknDlg] = useState({ open: false, rowId: null });


    const openVknPanel = useCallback(
        (rowId) => {
            if (!can(BTN.ROW_OPEN_VKN)) return;
            setVknDlg({ open: true, rowId });
        },
        [can]
    );

    const closeVknPanel = useCallback(() => {
        setVknDlg({ open: false, rowId: null });
    }, []);

    const { scheduleNavlunDiscount } = useNavlunTypingDiscount({ rowsRef, setRows });

    const normPlate = useCallback(
        (v) => String(v ?? "").toUpperCase().replace(/\s+/g, "").replace(/[-._]/g, "").trim(),
        []
    );
    const normDigits = useCallback((v) => String(v ?? "").replace(/\D/g, "").trim(), []);

    const mapDbToRow = useCallback((r) => {
        const id = r?.id ?? `${r?.batch_id ?? "batch"}_${r?.line_no ?? Math.random()}`;
        const nav = r?.navlun ?? "";

        return {
            id,

            sefer: r?.seferno ?? "",
            sevk: r?.sevktarihi ?? "",

            cekici: r?.cekici ?? "",
            dorse: r?.dorse ?? "",
            tc: r?.tc ?? "",
            surucu: r?.surucu ?? "",
            tel: r?.telefon ?? "",
            vkn: r?.faturavkn ?? "",

            varis1: r?.varis1 ?? "",
            varis2: r?.varis2 ?? "",
            varis3: r?.varis3 ?? "",

            datalogerno: r?.datalogerno ?? "",

            irsaliye: r?.irsaliyeno ?? "",
            navlun: nav,
            teslimat: r?.teslimattarihsaat ?? "",

            guncellendi: r?.updated_at ?? "",

            __navlunBase: nav,
            __datalogerDiscountApplied: false,

            __batch_id: r?.batch_id ?? null,
            __line_no: r?.line_no ?? null,
            __db_id: r?.id ?? null,
        };
    }, []);

    const ROW_PAGE = 800;

    const fetchRows = useCallback(async () => {
        if (!perm.ekranGorunur) return;

        setLoading(true);
        setLoadErr("");
        try {
            let all = [];
            let from = 0;

            while (true) {
                let qb = supabase
                    .from("plaka_atamalar")
                    .select(
                        "id,batch_id,line_no,seferno,sevktarihi,cekici,dorse,tc,surucu,telefon,faturavkn,varis1,varis2,varis3,datalogerno,irsaliyeno,navlun,teslimattarihsaat,updated_at"
                    )
                    .order("line_no", { ascending: true })
                    .range(from, from + ROW_PAGE - 1);

                if (batchId) qb = qb.eq("batch_id", batchId);

                const { data, error } = await qb;
                if (error) throw error;

                all = all.concat(data || []);
                if (!data || data.length < ROW_PAGE) break;
                from += ROW_PAGE;
            }

            setRows(all.map(mapDbToRow));
            setSnack({ open: true, msg: `Veriler yenilendi (${all.length})`, sev: "success" });
        } catch (e) {
            console.error("fetchRows error:", e);
            setLoadErr(e?.message || "Veri çekme hatası");
            setSnack({ open: true, msg: e?.message || "Veri çekme hatası", sev: "error" });
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [batchId, mapDbToRow, perm.ekranGorunur]);

    const fetchPlakalar = useCallback(async () => {
        setPlakaLoading(true);
        try {
            const pageSize = 2000;
            let from = 0;
            let all = [];

            while (true) {
                const { data, error } = await supabase
                    .from("plakalar")
                    .select("id, cekici, dorse, tc_no, ad_soyad, telefon, vkn, tip")
                    .order("ad_soyad", { ascending: true })
                    .range(from, from + pageSize - 1);

                if (error) {
                    console.error("fetchPlakalar error:", error);
                    setSnack({ open: true, msg: error.message || "Plakalar yüklenemedi", sev: "error" });
                    all = [];
                    break;
                }

                all = all.concat(data || []);
                if (!data || data.length < pageSize) break;
                from += pageSize;
            }

            setPlakalar(all);
        } catch (e) {
            console.error("fetchPlakalar exception:", e);
            setSnack({ open: true, msg: "Plakalar yüklenirken hata", sev: "error" });
            setPlakalar([]);
        } finally {
            setPlakaLoading(false);
        }
    }, []);

    const ensurePlakalarLoaded = useCallback(async () => {
        if (plakaLoading) return;
        if (Array.isArray(plakalar) && plakalar.length > 0) return;
        await fetchPlakalar();
    }, [plakaLoading, plakalar, fetchPlakalar]);

    useEffect(() => {
        if (permLoading) return;
        if (!perm.ekranGorunur) return;
        fetchRows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permLoading, perm.ekranGorunur]);


    const fetchNavlunFromSartlari = useCallback(async ({ varis1, varis2, varis3 }) => {
        const clean = (x) => String(x ?? "").trim();

        const v1 = clean(varis1);
        const v2 = clean(varis2);
        const v3 = clean(varis3);

        if (!v1) return null;

        const getTekNavlun = async (nokta) => {
            const raw = clean(nokta);
            if (!raw) return null;

            const val = raw.split("-")[0].trim();
            if (!val) return null;

            const { data, error } = await supabase
                .from("navlun_sartlari")
                .select("navlun, id")
                .eq("aktif", true)
                .ilike("nokta_sayisi", "TEK")
                .ilike("nokta1", val)
                .order("id", { ascending: false })
                .limit(1);

            if (error) {
                console.error("getTekNavlun error:", error);
                return null;
            }

            return data?.[0]?.navlun ?? null;
        };

        const maxNavlun = (...vals) => {
            const nums = vals
                .map((x) => toNumber(x))
                .filter((x) => x != null);

            if (nums.length === 0) return null;
            return Math.max(...nums);
        };

        if (v1 && v2 && v3) {
            const { data, error } = await supabase
                .from("navlun_sartlari")
                .select("navlun, id")
                .eq("aktif", true)
                .ilike("nokta_sayisi", "COK")
                .ilike("nokta1", v1)
                .ilike("nokta2", v2)
                .ilike("nokta3", v3)
                .order("id", { ascending: false })
                .limit(1);

            if (error) {
                console.error("fetchNavlunFromSartlari COK(123) error:", error);
                return null;
            }

            const exactNav = data?.[0]?.navlun ?? null;
            if (exactNav != null && exactNav !== "") return exactNav;

            const [n1, n2, n3] = await Promise.all([
                getTekNavlun(v1),
                getTekNavlun(v2),
                getTekNavlun(v3),
            ]);

            return maxNavlun(n1, n2, n3);
        }

        if (v1 && v2) {
            const resNull = await supabase
                .from("navlun_sartlari")
                .select("navlun, id")
                .eq("aktif", true)
                .ilike("nokta_sayisi", "COK")
                .ilike("nokta1", v1)
                .ilike("nokta2", v2)
                .is("nokta3", null)
                .order("id", { ascending: false })
                .limit(1);

            const resEmpty = await supabase
                .from("navlun_sartlari")
                .select("navlun, id")
                .eq("aktif", true)
                .ilike("nokta_sayisi", "COK")
                .ilike("nokta1", v1)
                .ilike("nokta2", v2)
                .eq("nokta3", "")
                .order("id", { ascending: false })
                .limit(1);

            const candNull = resNull.data?.[0] ?? null;
            const candEmpty = resEmpty.data?.[0] ?? null;

            const bestExact =
                !candNull ? candEmpty :
                    !candEmpty ? candNull :
                        Number(candNull.id ?? 0) >= Number(candEmpty.id ?? 0) ? candNull : candEmpty;

            if (bestExact?.navlun != null && bestExact?.navlun !== "") {
                return bestExact.navlun;
            }

            const [n1, n2] = await Promise.all([
                getTekNavlun(v1),
                getTekNavlun(v2),
            ]);

            return maxNavlun(n1, n2);
        }

        return await getTekNavlun(v1);
    }, [supabase]);

    const fetchUgramaBedeli = useCallback(async (vkn) => {
        const cleanVkn = normDigits(vkn);
        if (!cleanVkn) return null;

        const { data, error } = await supabase
            .from("ugrama_sartlari")
            .select("ugrama_bedeli, tedarikci, id")
            .order("id", { ascending: false });

        if (error) {
            console.error("fetchUgramaBedeli error:", error);
            return null;
        }

        const match = (data || []).find((x) => normDigits(x?.tedarikci) === cleanVkn);

        console.log("UGRAMA MATCH SEARCH:", {
            inputVkn: vkn,
            cleanVkn,
            match,
            totalRows: (data || []).length,
        });

        return match?.ugrama_bedeli ?? null;
    }, [supabase, normDigits]);

    const recomputeNavlunForRow = useCallback(
        async (rowId) => {
            const row = rowsRef.current.find((r) => r.id === rowId);
            if (!row) return;

            const hasVaris1 = String(row.varis1 ?? "").trim() !== "";
            const hasVaris2 = String(row.varis2 ?? "").trim() !== "";
            const hasVaris3 = String(row.varis3 ?? "").trim() !== "";
            const hasAnyVaris = hasVaris1 || hasVaris2 || hasVaris3;

            if (!hasAnyVaris) return;

            console.log("RECOMPUTE ROW:", row);

            let baseNavlun = row.__navlunBase ?? row.navlun ?? "";

            const rotaNav = await fetchNavlunFromSartlari({
                varis1: row.varis1,
                varis2: row.varis2,
                varis3: row.varis3,
            });

            console.log("ROTA NAV:", {
                varis1: row.varis1,
                varis2: row.varis2,
                varis3: row.varis3,
                rotaNav,
            });

            if (rotaNav != null && rotaNav !== "") {
                baseNavlun = rotaNav;
            } else {
                const currentNav = toNumber(row.navlun);
                baseNavlun = currentNav != null ? currentNav : "";
            }

            let ugramaBedeliRaw = null;
            let ugramaBedeli = null;
            let navlunAfterUgrama = toNumber(baseNavlun);

            const cleanRowVkn = normDigits(row.vkn);

            if (cleanRowVkn && navlunAfterUgrama != null) {
                ugramaBedeliRaw = await fetchUgramaBedeli(cleanRowVkn);
                ugramaBedeli = toNumber(ugramaBedeliRaw);

                if (ugramaBedeli != null) {
                    if (hasVaris1 && hasVaris2 && hasVaris3) {
                        navlunAfterUgrama = navlunAfterUgrama + (ugramaBedeli * 2);
                    } else if (hasVaris1 && hasVaris2) {
                        navlunAfterUgrama = navlunAfterUgrama + ugramaBedeli;
                    }
                }
            }

            const finalBaseNavlun = navlunAfterUgrama != null ? navlunAfterUgrama : baseNavlun;

            const hasDataloger = String(row.datalogerno ?? "").trim() !== "";
            const baseChanged = String(row.__navlunBase ?? "") !== String(finalBaseNavlun ?? "");

            let nextNavlun = finalBaseNavlun;
            let nextApplied = false;

            if (hasDataloger) {
                const n = toNumber(finalBaseNavlun);
                if (n != null) {
                    if (!row.__datalogerDiscountApplied || baseChanged) {
                        nextNavlun = Math.max(0, n - 500);
                        nextApplied = true;
                    } else {
                        nextNavlun = row.navlun;
                        nextApplied = true;
                    }
                } else {
                    nextNavlun = finalBaseNavlun;
                    nextApplied = false;
                }
            } else {
                nextNavlun = finalBaseNavlun;
                nextApplied = false;
            }

            console.log("UGRAMA DEBUG:", {
                vkn: row.vkn,
                cleanRowVkn,
                hasVaris1,
                hasVaris2,
                hasVaris3,
                rotaNav,
                baseNavlun,
                ugramaBedeliRaw,
                ugramaBedeli,
                finalBaseNavlun,
                nextNavlun,
            });

            patchRow(rowId, {
                __navlunBase: finalBaseNavlun,
                navlun: nextNavlun,
                __datalogerDiscountApplied: nextApplied,
            });
        },
        [fetchNavlunFromSartlari, fetchUgramaBedeli, patchRow, normDigits]
    );
    const recomputeTimersRef = useRef(new Map());
    const scheduleRecompute = useCallback(
        (rowId, delay = RECOMPUTE_DELAY_MS) => {
            const m = recomputeTimersRef.current;
            if (m.has(rowId)) clearTimeout(m.get(rowId));
            const t = setTimeout(() => {
                m.delete(rowId);
                recomputeNavlunForRow(rowId);
            }, delay);
            m.set(rowId, t);
        },
        [recomputeNavlunForRow, RECOMPUTE_DELAY_MS]
    );

    const initialRecomputeDoneRef = useRef(false);

    useEffect(() => {
        if (!rows.length) return;
        if (initialRecomputeDoneRef.current) return;

        initialRecomputeDoneRef.current = true;

        const targets = rows
            .filter((r) => String(r?.navlun ?? "").trim() === "" && r?.id != null)
            .slice(0, 50); // ilk etapta en fazla 50 satır

        targets.forEach((r, i) => {
            scheduleRecompute(r.id, i * 150);
        });
    }, [rows, scheduleRecompute]);
    // ✅ plakalar için O(1) lookup index
    const plakaMaps = useMemo(() => {
        const m = {
            cekici: new Map(),
            dorse: new Map(),
            tc: new Map(),
            tel: new Map(),
            vkn: new Map(),
            surucu: new Map(),
        };

        for (const p of plakalar) {
            const c = normPlate(p?.cekici);
            if (c) m.cekici.set(c, p);

            const d = normPlate(p?.dorse);
            if (d) m.dorse.set(d, p);

            const tc = normDigits(p?.tc_no);
            if (tc) m.tc.set(tc, p);

            const tel = normDigits(p?.telefon);
            if (tel) m.tel.set(tel, p);

            const vkn = normDigits(p?.vkn);
            if (vkn) m.vkn.set(vkn, p);

            const ad = String(p?.ad_soyad ?? "").trim();
            if (ad) m.surucu.set(ad, p);
        }

        return m;
    }, [plakalar, normPlate, normDigits]);

    const applyFromPlakaRecord = useCallback(
        (rowId, plakaRec) => {
            const tip = String(plakaRec?.tip ?? "").trim().toUpperCase();

            patchRow(rowId, (r) => {
                const isFilo = tip === "FİLO" || tip === "FILO";
                const nextNav = isFilo ? "FİLO" : r.navlun ?? "";

                return {
                    cekici: plakaRec?.cekici ?? r.cekici ?? "",
                    dorse: plakaRec?.dorse ?? r.dorse ?? "",
                    tc: plakaRec?.tc_no ?? r.tc ?? "",
                    surucu: plakaRec?.ad_soyad ?? r.surucu ?? "",
                    tel: plakaRec?.telefon ?? r.tel ?? "",
                    vkn: plakaRec?.vkn ?? r.vkn ?? "",

                    navlun: nextNav,
                    __navlunBase: nextNav,
                    __datalogerDiscountApplied: false,
                };
            });

            setTimeout(() => recomputeNavlunForRow(rowId), 0);
        },
        [patchRow, recomputeNavlunForRow]
    );

    const handleChange = useCallback(
        (id, field, value) => {
            if (!perm.ekranYazma || !can(BTN.ROW_EDIT)) return;

            // ✅ kolon yetkisi varsa, sadece duzenleyebilir:true ise izin ver
            if (colPerms && Object.prototype.hasOwnProperty.call(colPerms, field)) {
                if (colPerms[field]?.duzenleyebilir !== true) return;
            }

            if (field === "navlun") {
                patchRow(id, { navlun: value, __navlunBase: value, __datalogerDiscountApplied: false });
            } else {
                patchRow(id, { [field]: value });
            }

            if (plakalar.length > 0) {
                let rec = null;

                if (field === "cekici") rec = plakaMaps.cekici.get(normPlate(value)) || null;
                if (field === "dorse") rec = plakaMaps.dorse.get(normPlate(value)) || null;
                if (field === "tc") rec = plakaMaps.tc.get(normDigits(value)) || null;
                if (field === "tel") rec = plakaMaps.tel.get(normDigits(value)) || null;
                if (field === "vkn") rec = plakaMaps.vkn.get(normDigits(value)) || null;

                if (rec) applyFromPlakaRecord(id, rec);
            }

            if (["varis1", "varis2", "varis3", "datalogerno", "vkn"].includes(field)) {
                scheduleRecompute(id, RECOMPUTE_DELAY_MS);
            }
            if (field === "navlun") {
                scheduleNavlunDiscount(id, NAVLUN_TYPING_DELAY_MS);
            }
        },
        [
            perm.ekranYazma,
            can,
            colPerms,
            patchRow,
            plakalar.length,
            plakaMaps,
            normPlate,
            normDigits,
            applyFromPlakaRecord,
            scheduleRecompute,
            scheduleNavlunDiscount,
            RECOMPUTE_DELAY_MS,
        ]
    );

    const selectedRow = useMemo(() => rows.find((r) => r.id === selectedRowId) || null, [rows, selectedRowId]);

    const openDetails = useCallback(
        (rowId) => {
            if (!can(BTN.ROW_OPEN_DETAILS)) return;
            setSelectedRowId(rowId);
            setDrawerOpen(true);
        },
        [can]
    );

    const SEARCH_KEYS = [
        "sefer",
        "cekici",
        "dorse",
        "surucu",
        "tc",
        "tel",
        "vkn",
        "varis1",
        "varis2",
        "varis3",
        "irsaliye",
        "datalogerno",
        "navlun",
    ];

    const filteredRows = useMemo(() => {
        const query = String(qDeb || "").trim().toLowerCase();

        return rows.filter((r) => {
            if (filterMissingPlate && String(r.tc || "").trim() !== "") return false;
            if (!query) return true;

            return SEARCH_KEYS.some((key) =>
                String(r[key] ?? "").toLowerCase().includes(query)
            );
        });
    }, [rows, qDeb, filterMissingPlate]);
    // =========================
    // ✅ SEÇİM (CHECKBOX)
    // =========================
    const [selectedIds, setSelectedIds] = useState(() => new Set());

    useEffect(() => {
        setSelectedIds((prev) => {
            if (!prev || prev.size === 0) return prev;
            const allowed = new Set(filteredRows.map((r) => r.id));
            const next = new Set([...prev].filter((id) => allowed.has(id)));
            return next;
        });
    }, [filteredRows]);

    const toggleRow = useCallback((id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);
    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    const allSelected = filteredRows.length > 0 && selectedIds.size === filteredRows.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const toggleAll = useCallback(() => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const ids = filteredRows.map((r) => r.id);
            const isAll = ids.length > 0 && ids.every((id) => next.has(id));

            if (isAll) ids.forEach((id) => next.delete(id));
            else ids.forEach((id) => next.add(id));

            return next;
        });
    }, [filteredRows]);

    const selectedRows = useMemo(() => {
        if (!selectedIds || selectedIds.size === 0) return [];
        const set = selectedIds;
        return rows.filter((r) => set.has(r.id));
    }, [rows, selectedIds]);

    // ====== LISTBOX ======
    const fieldToPlakaKey = (field) => {
        switch (field) {
            case "cekici":
                return "cekici";
            case "dorse":
                return "dorse";
            case "tc":
                return "tc_no";
            case "surucu":
                return "ad_soyad";
            case "tel":
                return "telefon";
            case "vkn":
                return "vkn";
            default:
                return null;
        }
    };

    const openListbox = useCallback(
        async (e, rowId, field) => {
            if (!can(BTN.ROW_OPEN_LISTBOX)) return;

            const forcedListboxFields = ["cekici", "surucu", "vkn"];
            const isForcedListboxField = forcedListboxFields.includes(String(field).trim());

            // sadece zorunlu listbox alanı değilse edit yetkisi kontrol et
            if (!isForcedListboxField && colPerms && Object.prototype.hasOwnProperty.call(colPerms, field)) {
                if (colPerms[field]?.duzenleyebilir !== true) return;
            }

            setLb({ open: true, anchorEl: e.currentTarget, rowId, field, query: "" });
            await ensurePlakalarLoaded();
        },
        [can, ensurePlakalarLoaded, colPerms]
    );
    const closeListbox = () => setLb({ open: false, anchorEl: null, rowId: null, field: null, query: "" });

    const plakaIndex = useMemo(() => {
        const idx = { cekici: [], dorse: [], tc_no: [], ad_soyad: [], telefon: [], vkn: [] };
        if (!Array.isArray(plakalar) || plakalar.length === 0) return idx;

        const sets = {
            cekici: new Set(),
            dorse: new Set(),
            tc_no: new Set(),
            ad_soyad: new Set(),
            telefon: new Set(),
            vkn: new Set(),
        };

        for (const p of plakalar) {
            const c = String(p?.cekici ?? "").trim();
            if (c) sets.cekici.add(c);

            const d = String(p?.dorse ?? "").trim();
            if (d) sets.dorse.add(d);

            const tc = String(p?.tc_no ?? "").trim();
            if (tc) sets.tc_no.add(tc);

            const ad = String(p?.ad_soyad ?? "").trim();
            if (ad) sets.ad_soyad.add(ad);

            const tel = String(p?.telefon ?? "").trim();
            if (tel) sets.telefon.add(tel);

            const vkn = String(p?.vkn ?? "").trim();
            if (vkn) sets.vkn.add(vkn);
        }

        idx.cekici = Array.from(sets.cekici);
        idx.dorse = Array.from(sets.dorse);
        idx.tc_no = Array.from(sets.tc_no);
        idx.ad_soyad = Array.from(sets.ad_soyad);
        idx.telefon = Array.from(sets.telefon);
        idx.vkn = Array.from(sets.vkn);

        return idx;
    }, [plakalar]);

    const debouncedLbQuery = useDebouncedValue(lb.query, 120);
    const LISTBOX_LIMIT = 300;

    const listboxOptions = useMemo(() => {
        if (!lb.open || !lb.field) return [];
        const key = fieldToPlakaKey(lb.field);
        if (!key) return [];

        const base = plakaIndex[key] || [];
        const qx = (debouncedLbQuery || "").trim().toLowerCase();

        const filtered = !qx ? base : base.filter((v) => String(v).toLowerCase().includes(qx));
        return filtered.slice(0, LISTBOX_LIMIT);
    }, [lb.open, lb.field, debouncedLbQuery, plakaIndex]);

    const onPickListValue = useCallback(
        (pickedValue) => {
            const rowId = lb.rowId;
            const field = lb.field;
            if (!rowId || !field) return;

            let rec = null;
            if (field === "cekici") rec = plakaMaps.cekici.get(normPlate(pickedValue)) || null;
            else if (field === "dorse") rec = plakaMaps.dorse.get(normPlate(pickedValue)) || null;
            else if (field === "tc") rec = plakaMaps.tc.get(normDigits(pickedValue)) || null;
            else if (field === "tel") rec = plakaMaps.tel.get(normDigits(pickedValue)) || null;
            else if (field === "vkn") rec = plakaMaps.vkn.get(normDigits(pickedValue)) || null;
            else if (field === "surucu") rec = plakaMaps.surucu.get(String(pickedValue).trim()) || null;

            if (rec) {
                applyFromPlakaRecord(rowId, rec);
                setSnack({ open: true, msg: "Bilgiler otomatik dolduruldu.", sev: "success" });
            } else {
                handleChange(rowId, field, pickedValue);
            }
            closeListbox();
        },
        [lb.rowId, lb.field, plakaMaps, normPlate, normDigits, applyFromPlakaRecord, handleChange]
    );

    // ====== SWAP ======
    const openSwap = useCallback(
        async (rowId) => {
            if (!can(BTN.ROW_SWAP_DRIVER)) return;

            const row = rows.find((r) => r.id === rowId);

            const hasVehicle = String(row?.cekici || "").trim() !== "" || String(row?.dorse || "").trim() !== "";
            if (!hasVehicle) {
                setSnack({ open: true, msg: "Önce bu satıra Çekici/Dorse seçmelisin.", sev: "warning" });
                openDetails(rowId);
                return;
            }

            await ensurePlakalarLoaded();

            if (plakaLoading) {
                setSnack({ open: true, msg: "Plakalar yükleniyor, lütfen bekleyin.", sev: "info" });
                return;
            }

            const c = normPlate(row?.cekici);
            const d = normPlate(row?.dorse);

            const sourcePlaka = (c && plakaMaps.cekici.get(c)) || (d && plakaMaps.dorse.get(d)) || null;

            setSwapDlg({ open: true, rowId, query: "", targetPlakaId: null, sourcePlaka });
        },
        [can, rows, ensurePlakalarLoaded, plakaLoading, normPlate, plakaMaps, openDetails]
    );

    const vknRow = useMemo(() => rows.find((r) => r.id === vknDlg.rowId) || null, [rows, vknDlg.rowId]);

    // =========================
    // ✅ YENİLE / KAYDET / EXCEL
    // =========================
    const onSave = useCallback(async () => {
        if (!can(BTN.SAVE) || !perm.ekranYazma) return;

        try {
            setSaving(true);

            const payload = rows.map((r, idx) => {
                const obj = {
                    batch_id: r.__batch_id ?? batchId ?? null,
                    line_no: r.__line_no ?? idx + 1,

                    seferno: r.sefer ?? "",
                    sevktarihi: r.sevk ?? "",

                    cekici: r.cekici ?? "",
                    dorse: r.dorse ?? "",

                    tc: r.tc ?? "",
                    surucu: r.surucu ?? "",
                    telefon: r.tel ?? "",
                    faturavkn: r.vkn ?? "",

                    varis1: r.varis1 ?? "",
                    varis2: r.varis2 ?? "",
                    varis3: r.varis3 ?? "",

                    datalogerno: r.datalogerno ?? "",

                    irsaliyeno: r.irsaliye ?? "",
                    navlun: r.navlun ?? "",
                    teslimattarihsaat: r.teslimat ?? "",
                };

                if (r.__db_id != null) obj.id = r.__db_id;
                return obj;
            });

            const UPSERT_CHUNK = 500;
            const parts = chunkArray(payload, UPSERT_CHUNK);

            for (const part of parts) {
                const { error } = await supabase.from("plaka_atamalar").upsert(part, { onConflict: "id" });
                if (error) {
                    console.error("Save error:", error);
                    setSnack({ open: true, msg: error.message || "Kaydetme hatası", sev: "error" });
                    return;
                }
            }

            setSnack({ open: true, msg: "Kaydedildi ✅", sev: "success" });
            await fetchRows();
        } catch (e) {
            console.error("onSave exception:", e);
            setSnack({ open: true, msg: e?.message || "Kaydetme sırasında hata", sev: "error" });
        } finally {
            setSaving(false);
        }
    }, [can, perm.ekranYazma, rows, batchId, fetchRows]);

    const onExport = useCallback(() => {
        if (!can(BTN.EXPORT)) return;

        try {
            const exportRows = filteredRows.map((r) => ({
                Sefer: r.sefer,
                Sevk: r.sevk,
                Cekici: r.cekici,
                Dorse: r.dorse,
                TC: r.tc,
                Surucu: r.surucu,
                Telefon: r.tel,
                VKN: r.vkn,
                Varis1: r.varis1,
                Varis2: r.varis2,
                Varis3: r.varis3,
                DatalogerNo: r.datalogerno,
                IrsaliyeNo: r.irsaliye,
                Navlun: r.navlun,
                Teslimat: r.teslimat,
                Guncellendi: r.guncellendi,
            }));

            const ws = XLSX.utils.json_to_sheet(exportRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "PlakaAtama");

            const fileName = `plaka-atama_${batchId || "tum"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);

            setSnack({ open: true, msg: "Excel indirildi ✅", sev: "success" });
        } catch (e) {
            console.error("onExport error:", e);
            setSnack({ open: true, msg: e?.message || "Excel dışa aktarma hatası", sev: "error" });
        }
    }, [can, filteredRows, batchId]);

    const onCompleteSelected = useCallback(async () => {
        if (!can(BTN.COMPLETE_SELECTED) || !perm.ekranYazma) return;

        if (selectedIds.size === 0) {
            setSnack({ open: true, msg: "Seçili satır yok.", sev: "info" });
            return;
        }

        const toMove = selectedRows;
        if (!toMove || toMove.length === 0) {
            setSnack({ open: true, msg: "Seçili satır bulunamadı.", sev: "warning" });
            return;
        }

        const dbIds = toMove.map((r) => r.__db_id).filter((x) => x != null);
        if (dbIds.length === 0) {
            setSnack({ open: true, msg: "Seçili satırlarda DB id yok (tamamlama iptal).", sev: "warning" });
            return;
        }

        try {
            setSaving(true);

            const nowIso = new Date().toISOString();

            const payload = toMove.map((r, idx) => ({
                batch_id: String(r.__batch_id ?? batchId ?? ""),
                line_no: r.__line_no ?? idx + 1,

                seferno: r.sefer ?? "",
                sevktarihi: r.sevk ?? "",
                yukleyendepo: r.yukleyendepo ?? "",
                kalkis: r.kalkis ?? "",

                araccinsi: r.araccinsi ?? "",
                cekici: r.cekici ?? "",
                dorse: r.dorse ?? "",

                tc: r.tc ?? "",
                surucu: r.surucu ?? "",
                telefon: r.tel ?? "",

                faturavkn: r.vkn ?? "",

                varis1: r.varis1 ?? "",
                varis2: r.varis2 ?? "",
                varis3: r.varis3 ?? "",

                irsaliyeno: r.irsaliye ?? "",
                datalogerno: r.datalogerno ?? "",

                navlun: r.navlun ?? "",
                teslimattarihsaat: r.teslimat ?? "",

                updated_at: nowIso,
                updated_by: null,
                updated_by_email: null,
                updated_by_name: null,
            }));

            const INSERT_CHUNK = 500;
            for (let i = 0; i < payload.length; i += INSERT_CHUNK) {
                const part = payload.slice(i, i + INSERT_CHUNK);
                const { error } = await supabase.from("tamamlanan_seferler").insert(part);
                if (error) {
                    console.error("complete insert error:", error);
                    setSnack({ open: true, msg: error.message || "Tamamlama (insert) hatası", sev: "error" });
                    return;
                }
            }

            const { error: delErr } = await supabase.from("plaka_atamalar").delete().in("id", dbIds);
            if (delErr) {
                console.error("complete delete error:", delErr);
                setSnack({
                    open: true,
                    msg: "Tamamlananlara eklendi ama kaynak tablodan silinemedi. (Çift kayıt olabilir) ⚠️",
                    sev: "warning",
                });
            }

            setSnack({ open: true, msg: `Sefer tamamlandı ✅ (${dbIds.length})`, sev: "success" });
            clearSelection();
            await fetchRows();
        } catch (e) {
            console.error("onCompleteSelected exception:", e);
            setSnack({ open: true, msg: e?.message || "Sefer tamamlama sırasında hata", sev: "error" });
        } finally {
            setSaving(false);
        }
    }, [can, perm.ekranYazma, selectedIds, selectedRows, batchId, fetchRows, clearSelection]);

    const onDeleteSelected = useCallback(async () => {
        if (!can(BTN.DELETE_SELECTED) || !perm.ekranYazma) return;

        if (selectedIds.size === 0) {
            setSnack({ open: true, msg: "Seçili satır yok.", sev: "info" });
            return;
        }

        const ids = selectedRows.map((r) => r.__db_id).filter((x) => x != null);
        if (ids.length === 0) {
            setSnack({ open: true, msg: "Seçili satırlarda DB id yok (silme iptal).", sev: "warning" });
            return;
        }

        setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));

        try {
            setSaving(true);

            const { error } = await supabase.from("plaka_atamalar").delete().in("id", ids);

            if (error) {
                console.error("delete error:", error);
                setSnack({ open: true, msg: error.message || "Silme hatası", sev: "error" });
                await fetchRows();
                return;
            }

            setSnack({ open: true, msg: `Silindi ✅ (${ids.length})`, sev: "success" });
            clearSelection();
            await fetchRows();
        } catch (e) {
            console.error("onDeleteSelected exception:", e);
            setSnack({ open: true, msg: e?.message || "Silme sırasında hata", sev: "error" });
            await fetchRows();
        } finally {
            setSaving(false);
        }
    }, [can, perm.ekranYazma, selectedIds, selectedRows, clearSelection, fetchRows]);

    /* =========================
       ✅ PERMISSION LOADING / NO ACCESS UI
    ========================= */
    if (permLoading) {
        return (
            <Box sx={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
                <Stack spacing={1} alignItems="center">
                    <CircularProgress size={28} />
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>Yetkiler yükleniyor…</Typography>
                </Stack>
            </Box>
        );
    }

    if (!perm.ekranGorunur) {
        return (
            <Box sx={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
                <Stack spacing={1.2} alignItems="center" sx={{ p: 3, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>Erişim Yok</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 13, textAlign: "center", maxWidth: 420 }}>
                        Bu ekrana erişim yetkiniz bulunmuyor. Yönetici panelinden “Plaka Atama” ekran izni verilmelidir.
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={s.page}>
            {/* HEADER */}
            <Box sx={s.hero}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <Box sx={s.brandDot} />
                    <Typography sx={s.heroKicker}>LOGISTICS ENGINE • v5</Typography>

                    {batchId ? <Chip size="small" label={`Batch: ${batchId}`} sx={{ ml: 1, ...s.pillActive }} /> : null}

                    {plakaLoading ? (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
                            <CircularProgress size={14} />
                            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Plakalar yükleniyor…</Typography>
                        </Stack>
                    ) : null}
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                    <Box>
                        <Typography sx={s.heroTitle}>Plaka Atama</Typography>
                        <Typography sx={s.heroSub}>Operasyonel verileri tek ekrandan güncelleyin.</Typography>
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {can(BTN.COMPLETE_SELECTED) ? (
                            <Button
                                startIcon={<DoneAllIcon />}
                                sx={s.secondaryBtn}
                                onClick={onCompleteSelected}
                                disabled={loading || saving || selectedIds.size === 0 || !perm.ekranYazma}
                            >
                                Sefer Tamamla
                            </Button>
                        ) : null}

                        {can(BTN.DELETE_SELECTED) ? (
                            <Button
                                startIcon={<DeleteOutlineIcon />}
                                sx={s.secondaryBtn}
                                onClick={onDeleteSelected}
                                disabled={loading || saving || selectedIds.size === 0 || !perm.ekranYazma}
                            >
                                Sil
                            </Button>
                        ) : null}

                        {can(BTN.REFRESH) ? (
                            <Button startIcon={<RefreshIcon />} sx={s.secondaryBtn} onClick={fetchRows} disabled={loading || saving}>
                                {loading ? "Yenileniyor..." : "Yenile"}
                            </Button>
                        ) : null}

                        {can(BTN.EXPORT) ? (
                            <Button
                                startIcon={<FileDownloadIcon />}
                                sx={s.secondaryBtn}
                                onClick={onExport}
                                disabled={loading || saving || filteredRows.length === 0}
                            >
                                Excel
                            </Button>
                        ) : null}

                        {can(BTN.SAVE) ? (
                            <Button
                                startIcon={<SaveIcon />}
                                variant="contained"
                                sx={s.primaryBtn}
                                onClick={onSave}
                                disabled={loading || saving || !perm.ekranYazma}
                            >
                                {saving ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                        ) : null}
                    </Stack>
                </Stack>
            </Box>

            {/* SEARCH + FILTERS */}
            <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                <Box sx={s.search}>
                    <SearchIcon sx={{ color: "#3b82f6", fontSize: 20 }} />
                    <InputBase placeholder="Hızlı ara..." sx={s.searchInput} value={q} onChange={(e) => setQ(e.target.value)} />
                </Box>

                <Chip icon={<TimelineIcon />} label="Canlı Akış" sx={s.pillActive} />

                <Chip
                    label="Eksik Kimlik (TC)"
                    onClick={() => setFilterMissingPlate((v) => !v)}
                    sx={filterMissingPlate ? s.pillActive : s.pill}
                />

                {selectedIds.size > 0 ? (
                    <Chip label={`Seçili: ${selectedIds.size}`} sx={s.pillActive} onDelete={clearSelection} deleteIcon={<ClearIcon />} />
                ) : null}

                {loading ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
                        <CircularProgress size={16} />
                        <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Yükleniyor...</Typography>
                    </Stack>
                ) : null}

                {!perm.ekranYazma ? (
                    <Chip label="Sadece Görüntüleme" sx={{ ...s.pill, borderColor: "rgba(248,113,113,0.5)", color: "#fca5a5" }} />
                ) : null}

                {/* Debug */}
                {(!colPerms || Object.keys(colPerms).length === 0) && (
                    <Chip
                        label={`Kolon izinleri yok (grid:${gridId || "?"})`}
                        sx={{ ...s.pill, borderColor: "rgba(251,191,36,0.5)", color: "#fcd34d" }}
                    />
                )}
            </Stack>

            {!!loadErr ? <Typography sx={{ color: "#f87171", mb: 2, flexShrink: 0 }}>{loadErr}</Typography> : null}

            {/* GRID */}
            <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
                <PlakaAtamaGrid
                    rows={filteredRows}
                    columns={columns}
                    s={s}
                    loading={loading}
                    onOpenDetails={openDetails}
                    onOpenSwap={openSwap}
                    onOpenVkn={openVknPanel}
                    onOpenListbox={openListbox}
                    onChange={handleChange}
                    selectedIds={selectedIds}
                    onToggleRow={toggleRow}
                    onToggleAll={toggleAll}
                    allSelected={allSelected}
                    someSelected={someSelected}
                    canEdit={perm.ekranYazma && can(BTN.ROW_EDIT)}
                    visibleColumnKeys={visibleColumnKeys}
                    editableColumnKeys={editableColumnKeys}
                />
            </Box>
            {/* LISTBOX POPOVER */}
            <Popover
                open={lb.open}
                anchorEl={lb.anchorEl}
                onClose={() => setLb({ open: false, anchorEl: null, rowId: null, field: null, query: "" })}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{ sx: s.listboxPaper }}
            >
                <Box sx={{ p: 1.2, pb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <SearchIcon sx={{ color: "rgba(255,255,255,0.65)", fontSize: 18 }} />
                        <InputBase
                            autoFocus
                            placeholder="Ara..."
                            value={lb.query}
                            onChange={(e) => setLb((p) => ({ ...p, query: e.target.value }))}
                            sx={s.listboxSearch}
                        />
                    </Stack>

                    <Typography sx={{ mt: 0.8, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                        Toplam: {listboxOptions.length}
                    </Typography>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
                    {listboxOptions.length === 0 ? (
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                                {plakaLoading ? "Yükleniyor..." : "Sonuç yok."}
                            </Typography>
                        </Box>
                    ) : (
                        listboxOptions.map((val) => (
                            <ListItemButton key={val} onClick={() => onPickListValue(val)} sx={s.listItemBtn}>
                                <ListItemText
                                    primary={val}
                                    primaryTypographyProps={{ sx: { color: "#fff", fontWeight: 700, fontSize: 13 } }}
                                />
                            </ListItemButton>
                        ))
                    )}
                </List>
            </Popover>

            {/* SWAP */}
            <SoforSwapDialog
                open={swapDlg.open}
                onClose={() => setSwapDlg({ open: false, rowId: null, query: "", targetPlakaId: null, sourcePlaka: null })}
                s={s}
                sourceRow={rows.find((r) => r.id === swapDlg.rowId) || null}
                sourcePlaka={swapDlg.sourcePlaka}
                query={swapDlg.query}
                setQuery={(v) => setSwapDlg((p) => ({ ...p, query: v }))}
                targets={plakalar}
                targetPlakaId={swapDlg.targetPlakaId}
                setTargetPlakaId={(id) => setSwapDlg((p) => ({ ...p, targetPlakaId: id }))}
                onSwap={() => {
                    if (!perm.ekranYazma || !can(BTN.ROW_SWAP_DRIVER)) return;

                    const tgt = plakalar.find((p) => p.id === swapDlg.targetPlakaId);
                    if (!tgt) return;

                    patchRow(swapDlg.rowId, {
                        surucu: tgt.ad_soyad ?? "",
                        tel: tgt.telefon ?? "",
                        tc: tgt.tc_no ?? "",
                    });

                    setSnack({ open: true, msg: "Şoför bilgisi güncellendi ✅ (Kaydet'e basmayı unutma)", sev: "success" });
                    setSwapDlg({ open: false, rowId: null, query: "", targetPlakaId: null, sourcePlaka: null });
                }}
            />

            {/* ✅ VKN DEĞİŞTİRME PANELİ */}
            <VknDegistirme
                open={vknDlg.open}
                onClose={closeVknPanel}
                row={vknRow}
                rows={rows}
                setRows={setRows}
                supabase={supabase}
                batchId={batchId}
                onSaved={fetchRows}
                setSnack={setSnack}
                s={s}
            />

            {/* ✅ DRAWER */}
            {drawerOpen && (
                <SeferDetayDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    row={selectedRow}
                    s={s}
                    openListbox={openListbox}
                    handleChange={handleChange}
                />
            )}

            {/* SNACK */}
            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((p) => ({ ...p, open: false }))}>
                <Alert severity={snack.sev} variant="filled" sx={{ borderRadius: "12px" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}