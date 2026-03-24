import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabase";

import SeferDetayDrawer from "../plakaAtama/SeferDetayDrawer";
import SoforSwapDialog from "../plakaAtama/SoforSwapDialog";
import DonusPlakaAtamaGrid from "../plakaAtama/DonusPlakaAtamaGrid";
import { columns } from "../plakaAtama/donusPlakaAtama.columns";
import { s } from "../plakaAtama/plakaAtama.styles";

import VknDegistirme from "../plakaAtama/vknDegistirme.js";
import IadeOlusturDialog from "../plakaAtama/IadeOlusturDialog";

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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
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
    KeyboardReturn as KeyboardReturnIcon,
} from "@mui/icons-material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const DATA_TABLE = "donusler_plaka_atama";

/* =========================================================
   ✅ YETKİ SİSTEMİ (Ekran + Buton + Grid Kolon)
========================================================= */
const EKRAN_KOD = "donus_plaka_atama";
const GRID_KOD = "donus_grid";

const BTN = {
    SAVE: "donusler.plakaatama.save",
    EXPORT: "donusler.plakaatama.export_excel",
    REFRESH: "donusler.plakaatama.refresh",
    COMPLETE_SELECTED: "donusler.plakaatama.complete_selected",
    DELETE_SELECTED: "donusler.plakaatama.delete_selected",

    ROW_EDIT: "donusler.plakaatama.row.edit",
    ROW_OPEN_DETAILS: "donusler.plakaatama.row.open_details",
    ROW_SWAP_DRIVER: "donusler.plakaatama.row.swap_driver",
    ROW_OPEN_VKN: "donusler.plakaatama.row.open_vkn",
    ROW_OPEN_LISTBOX: "donusler.plakaatama.row.open_listbox",
    ROW_CREATE_IADE: "donusler.plakaatama.row.create_iade",
};
const ARAC_DURUMU_OPTIONS = ["DEPODA", "SAAT EKLE"];

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

async function fetchEffectiveGridKolonPerms({ supabase, gridId, userId, roleId }) {
    const { data: cols, error: cErr } = await supabase
        .from("grid_kolonlar")
        .select("id,kod,aktif")
        .eq("grid_id", gridId);

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

    const byKod = {};
    colList.forEach((c) => {
        const eff = userMap[c.id] ?? roleMap[c.id] ?? { gorebilir: true, duzenleyebilir: false };
        byKod[String(c.kod || "").trim()] = {
            ...eff,
            aktif: c.aktif !== false,
        };
    });

    return byKod;
}

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

export default function PlakaAtamaPremiumGrid() {
    const theme = useTheme();
    const isTablet = useMediaQuery("(max-width:1200px)");
    const isMobile = useMediaQuery("(max-width:768px)");

    const [permLoading, setPermLoading] = useState(true);
    const [perm, setPerm] = useState({
        ekranGorunur: false,
        ekranYazma: false,
        btn: {},
    });

    const [gridId, setGridId] = useState(null);
    const [colPerms, setColPerms] = useState({});

    const can = useCallback(
        (btnKod) => {
            if (!perm.ekranGorunur) return false;
            return perm.btn?.[btnKod] === true;
        },
        [perm]
    );

    useEffect(() => {
        let alive = true;

        async function loadPerms() {
            try {
                setPermLoading(true);

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

                const gId = await fetchGridIdByEkran({ supabase, ekranId, gridKod: GRID_KOD });
                if (alive) setGridId(gId);

                if (gId) {
                    const permsByKod = await fetchEffectiveGridKolonPerms({
                        supabase,
                        gridId: gId,
                        userId,
                        roleId,
                    });
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

    const visibleColumnKeys = useMemo(() => {
        const hasAny = colPerms && Object.keys(colPerms).length > 0;
        if (!hasAny) return columns.map((c) => c.key);

        return columns
            .filter((c) => {
                const p = colPerms[c.key];
                if (!p) return true;
                if (p.aktif === false) return false;
                if (p.gorebilir === false) return false;
                return true;
            })
            .map((c) => c.key);
    }, [colPerms]);

    const responsiveVisibleColumnKeys = useMemo(() => {
        let keys = visibleColumnKeys;

        if (isTablet && !isMobile) {
            const tabletHidden = new Set([
                "varis2",
                "varis3",
                "guncellendi",
                "teslimat",
                "datalogerno",
            ]);
            keys = keys.filter((key) => !tabletHidden.has(key));
        }

        if (isMobile) {
            const mobileHidden = new Set([
                "sevk",
                "dorse",
                "tc",
                "tel",
                "varis2",
                "varis3",
                "guncellendi",
                "teslimat",
                "datalogerno",
                "arac_durumu",
            ]);
            keys = keys.filter((key) => !mobileHidden.has(key));
        }

        return keys;
    }, [visibleColumnKeys, isTablet, isMobile]);

    const editableColumnKeys = useMemo(() => {
        const forcedListboxFields = new Set(["cekici", "surucu", "vkn", "arac_durumu"]);
        const hasAny = colPerms && Object.keys(colPerms).length > 0;

        if (!hasAny) return columns.map((c) => c.key);

        return columns
            .filter((c) => {
                if (forcedListboxFields.has(String(c.key).trim())) return true;
                const p = colPerms[c.key];
                if (!p) return true;
                if (p.aktif === false) return false;
                if (p.gorebilir === false) return false;
                if (p.duzenleyebilir !== true) return false;
                return true;
            })
            .map((c) => c.key);
    }, [colPerms]);

    const AUTO_SAVE_DELAY_MS = 1500;

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

    useEffect(() => {
        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;

        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        return () => {
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
        };
    }, []);

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

    const [timeDlg, setTimeDlg] = useState({
        open: false,
        rowId: null,
        value: "",
    });

    const [swapDlg, setSwapDlg] = useState({
        open: false,
        rowId: null,
        query: "",
        targetPlakaId: null,
        sourcePlaka: null,
    });

    const [iadeDlg, setIadeDlg] = useState({
        open: false,
        rowId: null,
    });

    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastAutoSaveAt, setLastAutoSaveAt] = useState(null);

    const dirtyRowIdsRef = useRef(new Set());
    const autoSaveTimerRef = useRef(null);

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

    const normPlate = useCallback(
        (v) => String(v ?? "").toUpperCase().replace(/\s+/g, "").replace(/[-._]/g, "").trim(),
        []
    );
    const normDigits = useCallback((v) => String(v ?? "").replace(/\D/g, "").trim(), []);
    const normalizeSearchText = useCallback((v) => {
        return String(v ?? "")
            .toLocaleLowerCase("tr-TR")
            .replace(/\s+/g, "")
            .replace(/[-._]/g, "")
            .trim();
    }, []);

    const mapDbToRow = useCallback((r) => {
        const id = r?.id ?? `row_${Math.random()}`;

        return {
            id,

            sefer: r?.sefer_no ?? "",
            sevk: r?.sevk_tarihi ?? "",

            musteri_adi: r?.musteri_adi ?? "",
            yukleme_yeri: r?.yukleme_yeri ?? "",

            cekici: r?.cekici ?? "",
            dorse: r?.dorse ?? "",
            tc: r?.tc ?? "",
            surucu: r?.surucu ?? "",
            tel: r?.telefon ?? "",
            vkn: r?.vkn ?? "",

            arac_durumu: r?.arac_durumu ?? "",

            varis1: r?.varis1 ?? "",
            varis2: r?.varis2 ?? "",
            varis3: "",

            datalogerno: "",
            irsaliye: r?.irsaliyeno ?? "",
            navlun: r?.navlun ?? "",

            teslimat: "",
            guncellendi: r?.created_at ?? "",

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
                const qb = supabase
                    .from(DATA_TABLE)
                    .select(`
                        id,
                        sefer_no,
                        sevk_tarihi,
                        musteri_adi,
                        yukleme_yeri,
                        cekici,
                        dorse,
                        tc,
                        surucu,
                        telefon,
                        vkn,
                        varis1,
                        varis2,
                        irsaliyeno,
                        navlun,
                        arac_durumu,
                        created_at
                    `)
                    .order("id", { ascending: true })
                    .range(from, from + ROW_PAGE - 1);

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
    }, [mapDbToRow, perm.ekranGorunur]);

    const fetchPlakalar = useCallback(async () => {
        setPlakaLoading(true);
        try {
            const pageSize = 500;
            let from = 0;
            let all = [];

            while (true) {
                const to = from + pageSize - 1;

                const { data, error } = await supabase
                    .from("plakalar")
                    .select("id, cekici, dorse, tc_no, ad_soyad, telefon, vkn, tip")
                    .order("id", { ascending: true })
                    .range(from, to);

                if (error) {
                    console.error("fetchPlakalar error:", error);
                    setSnack({
                        open: true,
                        msg: error.message || "Plakalar yüklenemedi",
                        sev: "error",
                    });
                    all = [];
                    break;
                }

                const rows = data || [];
                all = all.concat(rows);

                if (rows.length === 0) break;
                if (rows.length < pageSize) break;

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

    const handleCreateDriver = useCallback(async (payload) => {
        const insertPayload = {
            cekici: "",
            dorse: "",
            ad_soyad: payload.ad_soyad?.trim() || "",
            telefon: payload.telefon?.trim() || "",
            tc_no: payload.tc_no?.trim() || "",
            vkn: "",
            tip: "",
        };

        const { data, error } = await supabase
            .from("plakalar")
            .insert([insertPayload])
            .select("id, cekici, dorse, tc_no, ad_soyad, telefon, vkn, tip")
            .single();

        if (error) {
            throw new Error(error.message || "Şoför kaydı oluşturulamadı.");
        }

        setPlakalar((prev) => [data, ...prev]);
        return data;
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
    }, [permLoading, perm.ekranGorunur, fetchRows]);

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

    const buildDbPayloadFromRow = useCallback((r) => {
        const obj = {
            sefer_no: r.sefer ?? "",
            sevk_tarihi: r.sevk ?? "",
            musteri_adi: r.musteri_adi ?? "",
            yukleme_yeri: r.yukleme_yeri ?? "",
            cekici: r.cekici ?? "",
            dorse: r.dorse ?? "",
            tc: r.tc ?? "",
            surucu: r.surucu ?? "",
            telefon: r.tel ?? "",
            vkn: r.vkn ?? "",
            varis1: r.varis1 ?? "",
            varis2: r.varis2 ?? "",
            irsaliyeno: r.irsaliye ?? "",
            navlun: r.navlun ?? "",
            arac_durumu: r.arac_durumu ?? "",
        };

        if (r.__db_id != null) obj.id = r.__db_id;
        return obj;
    }, []);

    const saveDirtyRows = useCallback(async () => {
        if (!perm.ekranYazma || !can(BTN.SAVE)) return;
        if (autoSaving || saving) return;

        const dirtyIds = Array.from(dirtyRowIdsRef.current);
        if (dirtyIds.length === 0) return;

        try {
            setAutoSaving(true);

            const dirtySet = new Set(dirtyIds);
            const currentRows = rowsRef.current;

            const payload = currentRows
                .filter((r) => dirtySet.has(r.id))
                .map((r) => buildDbPayloadFromRow(r));

            if (payload.length === 0) return;

            const UPSERT_CHUNK = 200;
            const parts = chunkArray(payload, UPSERT_CHUNK);

            for (const part of parts) {
                const { error } = await supabase
                    .from(DATA_TABLE)
                    .upsert(part, { onConflict: "id" });

                if (error) throw error;
            }

            dirtyIds.forEach((id) => dirtyRowIdsRef.current.delete(id));
            setLastAutoSaveAt(new Date());
        } catch (e) {
            console.error("autosave error:", e);
            setSnack({
                open: true,
                msg: e?.message || "Otomatik kaydetme hatası",
                sev: "error",
            });
        } finally {
            setAutoSaving(false);
        }
    }, [perm.ekranYazma, can, autoSaving, saving, buildDbPayloadFromRow]);

    const scheduleAutoSave = useCallback(
        (rowId) => {
            dirtyRowIdsRef.current.add(rowId);

            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

            autoSaveTimerRef.current = setTimeout(() => {
                autoSaveTimerRef.current = null;
                saveDirtyRows();
            }, AUTO_SAVE_DELAY_MS);
        },
        [saveDirtyRows]
    );

    const applyFromPlakaRecord = useCallback(
        (rowId, plakaRec) => {
            patchRow(rowId, (r) => ({
                cekici: plakaRec?.cekici ?? r.cekici ?? "",
                dorse: plakaRec?.dorse ?? r.dorse ?? "",
                tc: plakaRec?.tc_no ?? r.tc ?? "",
                surucu: plakaRec?.ad_soyad ?? r.surucu ?? "",
                tel: plakaRec?.telefon ?? r.tel ?? "",
                vkn: plakaRec?.vkn ?? r.vkn ?? "",
            }));

            scheduleAutoSave(rowId);
        },
        [patchRow, scheduleAutoSave]
    );

    const handleChange = useCallback(
        (id, field, value) => {
            if (!perm.ekranYazma || !can(BTN.ROW_EDIT)) return;

            const forcedListboxFields = new Set(["cekici", "surucu", "vkn", "arac_durumu"]);

            if (
                !forcedListboxFields.has(String(field).trim()) &&
                colPerms &&
                Object.prototype.hasOwnProperty.call(colPerms, field)
            ) {
                if (colPerms[field]?.duzenleyebilir !== true) return;
            }

            patchRow(id, { [field]: value });

            if (plakalar.length > 0) {
                let rec = null;

                if (field === "cekici") rec = plakaMaps.cekici.get(normPlate(value)) || null;
                if (field === "dorse") rec = plakaMaps.dorse.get(normPlate(value)) || null;
                if (field === "tc") rec = plakaMaps.tc.get(normDigits(value)) || null;
                if (field === "tel") rec = plakaMaps.tel.get(normDigits(value)) || null;
                if (field === "vkn") rec = plakaMaps.vkn.get(normDigits(value)) || null;

                if (rec) {
                    applyFromPlakaRecord(id, rec);
                    return;
                }
            }

            scheduleAutoSave(id);
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
            scheduleAutoSave,
        ]
    );

    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, []);

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
        "sevk",
        "musteri_adi",
        "yukleme_yeri",
        "cekici",
        "dorse",
        "surucu",
        "tc",
        "tel",
        "vkn",
        "arac_durumu",
        "varis1",
        "varis2",
        "irsaliye",
        "navlun",
        "guncellendi",
    ];

    const filteredRows = useMemo(() => {
        const query = normalizeSearchText(qDeb);

        return rows.filter((r) => {
            if (filterMissingPlate && String(r.tc || "").trim() !== "") return false;
            if (!query) return true;

            return SEARCH_KEYS.some((key) => {
                const val = normalizeSearchText(r[key]);
                return val.includes(query);
            });
        });
    }, [rows, qDeb, filterMissingPlate, normalizeSearchText]);

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
        (e, rowId, field) => {
            if (!can(BTN.ROW_OPEN_LISTBOX)) return;

            const forcedListboxFields = ["cekici", "surucu", "vkn", "arac_durumu"];
            const isForcedListboxField = forcedListboxFields.includes(String(field).trim());

            if (!isForcedListboxField && colPerms && Object.prototype.hasOwnProperty.call(colPerms, field)) {
                if (colPerms[field]?.duzenleyebilir !== true) return;
            }

            setLb({ open: true, anchorEl: e.currentTarget, rowId, field, query: "" });
        },
        [can, colPerms]
    );

    useEffect(() => {
        const needsRemoteList =
            lb.open &&
            ["cekici", "dorse", "tc", "surucu", "tel", "vkn"].includes(lb.field) &&
            String(lb.query || "").trim().length >= 2 &&
            !plakaLoading &&
            (!Array.isArray(plakalar) || plakalar.length === 0);

        if (needsRemoteList) fetchPlakalar();
    }, [lb.open, lb.field, lb.query, plakaLoading, plakalar, fetchPlakalar]);

    const closeListbox = () => setLb({ open: false, anchorEl: null, rowId: null, field: null, query: "" });

    const closeTimeDialog = useCallback(() => {
        setTimeDlg({ open: false, rowId: null, value: "" });
    }, []);

    const openTimeDialog = useCallback((rowId) => {
        const row = rowsRef.current.find((r) => r.id === rowId);
        const current = String(row?.arac_durumu ?? "").trim();
        const isTimeLike = /^\d{2}:\d{2}$/.test(current);

        setTimeDlg({
            open: true,
            rowId,
            value: isTimeLike ? current : "",
        });
    }, []);

    const plakaIndex = useMemo(() => {
        const idx = {
            cekici: [],
            dorse: [],
            tc_no: [],
            ad_soyad: [],
            telefon: [],
            vkn: [],
        };

        if (!Array.isArray(plakalar) || plakalar.length === 0) return idx;

        const vknSet = new Set();

        for (const p of plakalar) {
            const c = String(p?.cekici ?? "").trim();
            if (c) idx.cekici.push(c);

            const d = String(p?.dorse ?? "").trim();
            if (d) idx.dorse.push(d);

            const tc = String(p?.tc_no ?? "").trim();
            if (tc) idx.tc_no.push(tc);

            const ad = String(p?.ad_soyad ?? "").trim();
            if (ad) idx.ad_soyad.push(ad);

            const tel = String(p?.telefon ?? "").trim();
            if (tel) idx.telefon.push(tel);

            const vkn = String(p?.vkn ?? "").trim();
            if (vkn && !vknSet.has(vkn)) {
                vknSet.add(vkn);
                idx.vkn.push(vkn);
            }
        }

        return idx;
    }, [plakalar]);

    const debouncedLbQuery = useDebouncedValue(lb.query, 120);
    const LISTBOX_SEARCH_LIMIT = 100;

    const listboxSearchResult = useMemo(() => {
        if (!lb.open || !lb.field) return { options: [], totalMatches: 0 };

        let base = [];
        const isDirectListField = lb.field === "arac_durumu";

        if (lb.field === "arac_durumu") {
            base = ARAC_DURUMU_OPTIONS;
        } else {
            const key = fieldToPlakaKey(lb.field);
            if (!key) return { options: [], totalMatches: 0 };
            base = plakaIndex[key] || [];
        }

        const rawQuery = String(debouncedLbQuery || "").trim();

        if (isDirectListField) {
            return {
                options: base.slice(0, LISTBOX_SEARCH_LIMIT),
                totalMatches: base.length,
            };
        }

        if (rawQuery.length < 2) {
            return {
                options: [],
                totalMatches: 0,
            };
        }

        const qNorm = normalizeSearchText(rawQuery);
        const matches = [];

        for (let i = 0; i < base.length; i++) {
            const rawVal = String(base[i] ?? "").trim();
            if (!rawVal) continue;

            if (normalizeSearchText(rawVal).includes(qNorm)) {
                matches.push(rawVal);
                if (matches.length >= LISTBOX_SEARCH_LIMIT) break;
            }
        }

        return {
            options: matches,
            totalMatches: matches.length,
        };
    }, [lb.open, lb.field, debouncedLbQuery, plakaIndex, normalizeSearchText]);

    const listboxOptions = listboxSearchResult.options;
    const listboxTotalMatches = listboxSearchResult.totalMatches;

    const onPickListValue = useCallback(
        (pickedValue) => {
            const rowId = lb.rowId;
            const field = lb.field;
            if (!rowId || !field) return;

            if (field === "arac_durumu") {
                if (pickedValue === "DEPODA") {
                    handleChange(rowId, "arac_durumu", "DEPODA");
                    closeListbox();
                    return;
                }

                if (pickedValue === "SAAT EKLE") {
                    closeListbox();
                    openTimeDialog(rowId);
                    return;
                }
            }

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
        [
            lb.rowId,
            lb.field,
            plakaMaps,
            normPlate,
            normDigits,
            applyFromPlakaRecord,
            handleChange,
            openTimeDialog,
        ]
    );

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

    const openIadeDialog = useCallback(
        (rowId) => {
            if (!perm.ekranYazma || !can(BTN.ROW_CREATE_IADE)) return;
            setIadeDlg({ open: true, rowId });
        },
        [perm.ekranYazma, can]
    );

    const closeIadeDialog = useCallback(() => {
        setIadeDlg({ open: false, rowId: null });
    }, []);

    const onConfirmCreateIadeRow = useCallback(async () => {
        if (!perm.ekranYazma || !can(BTN.ROW_CREATE_IADE)) return;

        const sourceRowId = iadeDlg.rowId;
        const sourceRow = rowsRef.current.find((r) => r.id === sourceRowId);

        if (!sourceRow) {
            setSnack({ open: true, msg: "Kaynak satır bulunamadı.", sev: "warning" });
            return;
        }

        try {
            setSaving(true);

            const insertPayload = {
                sefer_no: sourceRow.sefer ?? "",
                sevk_tarihi: sourceRow.sevk ?? "",
                musteri_adi: sourceRow.musteri_adi ?? "",
                yukleme_yeri: sourceRow.varis1 ?? "",
                cekici: sourceRow.cekici ?? "",
                dorse: sourceRow.dorse ?? "",
                tc: sourceRow.tc ?? "",
                surucu: sourceRow.surucu ?? "",
                telefon: sourceRow.tel ?? "",
                vkn: sourceRow.vkn ?? "",
                varis1: sourceRow.yukleme_yeri ?? "",
                varis2: sourceRow.varis2 ?? "",
                irsaliyeno: sourceRow.irsaliye ?? "",
                navlun: sourceRow.navlun ?? "",
                arac_durumu: sourceRow.arac_durumu ?? "",
            };

            const { data, error } = await supabase
                .from(DATA_TABLE)
                .insert([insertPayload])
                .select(`
                    id,
                    sefer_no,
                    sevk_tarihi,
                    musteri_adi,
                    yukleme_yeri,
                    cekici,
                    dorse,
                    tc,
                    surucu,
                    telefon,
                    vkn,
                    varis1,
                    varis2,
                    irsaliyeno,
                    navlun,
                    arac_durumu,
                    created_at
                `)
                .single();

            if (error) throw error;

            const newRow = mapDbToRow(data);

            setRows((prev) => {
                const idx = prev.findIndex((r) => r.id === sourceRowId);
                if (idx === -1) return [...prev, newRow];

                const next = prev.slice();
                next.splice(idx + 1, 0, newRow);
                return next;
            });

            closeIadeDialog();

            setSnack({
                open: true,
                msg: "İade satırı oluşturuldu ✅",
                sev: "success",
            });
        } catch (e) {
            console.error("onConfirmCreateIadeRow error:", e);
            setSnack({
                open: true,
                msg: e?.message || "İade satırı oluşturulamadı",
                sev: "error",
            });
        } finally {
            setSaving(false);
        }
    }, [perm.ekranYazma, can, iadeDlg.rowId, mapDbToRow, closeIadeDialog]);

    const vknRow = useMemo(() => rows.find((r) => r.id === vknDlg.rowId) || null, [rows, vknDlg.rowId]);
    const iadeRow = useMemo(() => rows.find((r) => r.id === iadeDlg.rowId) || null, [rows, iadeDlg.rowId]);

    const onSave = useCallback(async () => {
        if (!can(BTN.SAVE) || !perm.ekranYazma) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }

        try {
            setSaving(true);

            const payload = rows.map((r) => buildDbPayloadFromRow(r));
            const UPSERT_CHUNK = 500;
            const parts = chunkArray(payload, UPSERT_CHUNK);

            for (const part of parts) {
                const { error } = await supabase.from(DATA_TABLE).upsert(part, { onConflict: "id" });
                if (error) {
                    console.error("Save error:", error);
                    setSnack({ open: true, msg: error.message || "Kaydetme hatası", sev: "error" });
                    return;
                }
            }

            dirtyRowIdsRef.current.clear();
            setLastAutoSaveAt(new Date());

            setSnack({ open: true, msg: "Kaydedildi ✅", sev: "success" });
            await fetchRows();
        } catch (e) {
            console.error("onSave exception:", e);
            setSnack({ open: true, msg: e?.message || "Kaydetme sırasında hata", sev: "error" });
        } finally {
            setSaving(false);
        }
    }, [can, perm.ekranYazma, rows, fetchRows, buildDbPayloadFromRow]);

    const onExport = useCallback(async () => {
        if (!can(BTN.EXPORT)) return;

        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "Bapsis";
            workbook.lastModifiedBy = "Bapsis";
            workbook.created = new Date();
            workbook.modified = new Date();

            const worksheet = workbook.addWorksheet("Dönüş Plaka Atama", {
                views: [{ state: "frozen", ySplit: 1 }],
            });

            const headers = [
                { header: "Sefer", key: "sefer", width: 14 },
                { header: "Sevk Tarihi", key: "sevk", width: 16 },
                { header: "Müşteri Adı", key: "musteri_adi", width: 24 },
                { header: "Yükleme Yeri", key: "yukleme_yeri", width: 24 },
                { header: "Çekici", key: "cekici", width: 16 },
                { header: "Dorse", key: "dorse", width: 16 },
                { header: "TC", key: "tc", width: 16 },
                { header: "Sürücü", key: "surucu", width: 24 },
                { header: "Telefon", key: "tel", width: 18 },
                { header: "VKN", key: "vkn", width: 18 },
                { header: "Araç Durumu", key: "arac_durumu", width: 18 },
                { header: "Varış 1", key: "varis1", width: 22 },
                { header: "Varış 2", key: "varis2", width: 22 },
                { header: "İrsaliye No", key: "irsaliye", width: 18 },
                { header: "Navlun", key: "navlun", width: 14 },
                { header: "Güncellendi", key: "guncellendi", width: 22 },
            ];
            worksheet.columns = headers;

            const headerRow = worksheet.getRow(1);
            headerRow.height = 24;
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
                cell.alignment = { vertical: "middle", horizontal: "center" };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF0F172A" },
                };
            });

            filteredRows.forEach((r) => {
                worksheet.addRow({
                    sefer: r.sefer ?? "",
                    sevk: r.sevk ?? "",
                    musteri_adi: r.musteri_adi ?? "",
                    yukleme_yeri: r.yukleme_yeri ?? "",
                    cekici: r.cekici ?? "",
                    dorse: r.dorse ?? "",
                    tc: r.tc ?? "",
                    surucu: r.surucu ?? "",
                    tel: r.tel ?? "",
                    vkn: r.vkn ?? "",
                    arac_durumu: r.arac_durumu ?? "",
                    varis1: r.varis1 ?? "",
                    varis2: r.varis2 ?? "",
                    irsaliye: r.irsaliye ?? "",
                    navlun: r.navlun ?? "",
                    guncellendi: r.guncellendi ?? "",
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const fileName = `donusler-plaka-atama_${new Date().toISOString().slice(0, 10)}.xlsx`;

            saveAs(
                new Blob([buffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                }),
                fileName
            );

            setSnack({ open: true, msg: "Excel indirildi ✅", sev: "success" });
        } catch (e) {
            console.error("onExport error:", e);
            setSnack({ open: true, msg: e?.message || "Excel dışa aktarma hatası", sev: "error" });
        }
    }, [can, filteredRows]);

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

        const validRows = toMove.filter((r) => String(r.sefer ?? "").trim() !== "");
        const invalidRows = toMove.filter((r) => String(r.sefer ?? "").trim() === "");

        if (validRows.length === 0) {
            setSnack({
                open: true,
                msg: "Sefer No boş olan satırlar tamamlanamaz.",
                sev: "warning",
            });
            return;
        }

        const dbIds = validRows.map((r) => r.__db_id).filter((x) => x != null);
        if (dbIds.length === 0) {
            setSnack({
                open: true,
                msg: "Tamamlanacak satırlarda DB id yok (işlem iptal).",
                sev: "warning",
            });
            return;
        }

        try {
            setSaving(true);

            const nowIso = new Date().toISOString();

            const payload = validRows.map((r) => ({
                sefer_no: r.sefer ?? "",
                sevk_tarihi: r.sevk ?? "",
                musteri_adi: r.musteri_adi ?? "",
                yukleme_yeri: r.yukleme_yeri ?? "",
                cekici: r.cekici ?? "",
                dorse: r.dorse ?? "",
                tc: r.tc ?? "",
                surucu: r.surucu ?? "",
                telefon: r.tel ?? "",
                vkn: r.vkn ?? "",
                varis1: r.varis1 ?? "",
                varis2: r.varis2 ?? "",
                irsaliyeno: r.irsaliye ?? "",
                navlun: r.navlun ?? "",
                arac_durumu: r.arac_durumu ?? "",
                created_at: nowIso,
            }));

            const INSERT_CHUNK = 500;
            for (let i = 0; i < payload.length; i += INSERT_CHUNK) {
                const part = payload.slice(i, i + INSERT_CHUNK);

                const { error } = await supabase
                    .from("donus_tamamlanan_seferler")
                    .insert(part);

                if (error) {
                    console.error("complete insert error:", error);
                    setSnack({
                        open: true,
                        msg: error.message || "Tamamlama (insert) hatası",
                        sev: "error",
                    });
                    return;
                }
            }
            const { error: delErr } = await supabase.from(DATA_TABLE).delete().in("id", dbIds);
            if (delErr) {
                console.error("complete delete error:", delErr);
                setSnack({
                    open: true,
                    msg: "Tamamlananlara eklendi ama kaynak tablodan silinemedi. ⚠️",
                    sev: "warning",
                });
            }

            setSnack({
                open: true,
                msg:
                    invalidRows.length > 0
                        ? `Sefer tamamlandı ✅ (${dbIds.length}) • ${invalidRows.length} satır Sefer No boş olduğu için atlandı`
                        : `Sefer tamamlandı ✅ (${dbIds.length})`,
                sev: "success",
            });

            clearSelection();
            await fetchRows();
        } catch (e) {
            console.error("onCompleteSelected exception:", e);
            setSnack({ open: true, msg: e?.message || "Sefer tamamlama sırasında hata", sev: "error" });
        } finally {
            setSaving(false);
        }
    }, [can, perm.ekranYazma, selectedIds, selectedRows, fetchRows, clearSelection]);

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

            const { error } = await supabase.from(DATA_TABLE).delete().in("id", ids);

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

    if (permLoading) {
        return (
            <Box
                sx={{
                    ...s.page,
                    height: "100dvh",
                    maxHeight: "100dvh",
                    minHeight: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 2,
                }}
            >
                <Stack spacing={1} alignItems="center">
                    <CircularProgress size={28} />
                    <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                        Yetkiler yükleniyor…
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (!perm.ekranGorunur) {
        return (
            <Box
                sx={{
                    ...s.page,
                    height: "100dvh",
                    maxHeight: "100dvh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 2,
                }}
            >
                <Stack
                    spacing={1.2}
                    alignItems="center"
                    sx={{ p: 3, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 }}
                >
                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>Erişim Yok</Typography>
                    <Typography
                        sx={{ color: "rgba(255,255,255,0.65)", fontSize: 13, textAlign: "center", maxWidth: 420 }}
                    >
                        Bu ekrana erişim yetkiniz bulunmuyor. Yönetici panelinden “Plaka Atama” ekran izni verilmelidir.
                    </Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                ...s.page,
                height: "100dvh",
                maxHeight: "100dvh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                px: { xs: 1, sm: 1.25, md: 1.5 },
            }}
        >
            <Box
                sx={{
                    ...s.hero,
                    py: { xs: 1, sm: 1.25 },
                    px: { xs: 1, sm: 1.5 },
                    mb: 1,
                    flexShrink: 0,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.2} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                    <Box sx={s.brandDot} />
                    <Typography sx={s.heroKicker}>LOGISTICS ENGINE • v5</Typography>

                    {plakaLoading ? (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
                            <CircularProgress size={14} />
                            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                                Plakalar yükleniyor…
                            </Typography>
                        </Stack>
                    ) : null}
                </Stack>

                <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "flex-end" }}
                    spacing={{ xs: 1.25, md: 0 }}
                >
                    <Box>
                        <Typography
                            sx={{
                                ...s.heroTitle,
                                fontSize: { xs: 20, sm: 24 },
                                lineHeight: 1.1,
                            }}
                        >
                            Dönüş Plaka Atama
                        </Typography>
                        <Typography
                            sx={{
                                ...s.heroSub,
                                fontSize: { xs: 11.5, sm: 12 },
                                mt: 0.25,
                            }}
                        >
                            Veriler donusler_plaka_atama tablosundan yüklenir.
                        </Typography>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{
                            mb: 0.5,
                            flexWrap: "wrap",
                            justifyContent: { xs: "flex-start", lg: "flex-end" },
                            rowGap: 1,
                            columnGap: 1,
                        }}
                    >
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
                            <Button
                                startIcon={<RefreshIcon />}
                                sx={s.secondaryBtn}
                                onClick={fetchRows}
                                disabled={loading || saving}
                            >
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

            <Stack
                direction="row"
                spacing={1}
                sx={{
                    mb: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                    flexShrink: 0,
                    rowGap: 1,
                    columnGap: 1,
                }}
            >
                <Box
                    sx={{
                        ...s.search,
                        width: { xs: "100%", md: 320, lg: 360 },
                        minWidth: 0,
                        flexShrink: 0,
                    }}
                >
                    <SearchIcon sx={{ color: "#3b82f6", fontSize: 20 }} />
                    <InputBase
                        placeholder="Hızlı ara..."
                        sx={s.searchInput}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </Box>

                <Chip icon={<TimelineIcon />} label="Canlı Akış" sx={s.pillActive} />

                <Chip
                    label="Eksik Kimlik (TC)"
                    onClick={() => setFilterMissingPlate((v) => !v)}
                    sx={filterMissingPlate ? s.pillActive : s.pill}
                />

                {selectedIds.size > 0 ? (
                    <Chip
                        label={`Seçili: ${selectedIds.size}`}
                        sx={s.pillActive}
                        onDelete={clearSelection}
                        deleteIcon={<ClearIcon />}
                    />
                ) : null}

                {loading ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
                        <CircularProgress size={16} />
                        <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                            Yükleniyor...
                        </Typography>
                    </Stack>
                ) : null}

                {autoSaving ? (
                    <Chip label="Otomatik kaydediliyor..." sx={s.pillActive} />
                ) : lastAutoSaveAt ? (
                    <Chip
                        label={`Otomatik kaydedildi: ${lastAutoSaveAt.toLocaleTimeString("tr-TR")}`}
                        sx={s.pill}
                    />
                ) : null}

                {!perm.ekranYazma ? (
                    <Chip
                        label="Sadece Görüntüleme"
                        sx={{ ...s.pill, borderColor: "rgba(248,113,113,0.5)", color: "#fca5a5" }}
                    />
                ) : null}

                {(!colPerms || Object.keys(colPerms).length === 0) && (
                    <Chip
                        label={`Kolon izinleri yok (grid:${gridId || "?"})`}
                        sx={{ ...s.pill, borderColor: "rgba(251,191,36,0.5)", color: "#fcd34d" }}
                    />
                )}
            </Stack>

            {!!loadErr ? <Typography sx={{ color: "#f87171", mb: 2, flexShrink: 0 }}>{loadErr}</Typography> : null}

            <Box
                sx={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    maxHeight: { xs: "68dvh", md: "74dvh" },
                    overflow: "auto",
                    display: "flex",
                    pb: { xs: 1, sm: 2 },
                    borderRadius: 3,
                }}
            >
                <DonusPlakaAtamaGrid
                    rows={filteredRows}
                    columns={columns}
                    s={s}
                    loading={loading}
                    onOpenDetails={openDetails}
                    onOpenSwap={openSwap}
                    onOpenVkn={openVknPanel}
                    onOpenListbox={openListbox}
                    onOpenIade={openIadeDialog}
                    onChange={handleChange}
                    selectedIds={selectedIds}
                    onToggleRow={toggleRow}
                    onToggleAll={toggleAll}
                    allSelected={allSelected}
                    someSelected={someSelected}
                    canEdit={perm.ekranYazma && can(BTN.ROW_EDIT)}
                    visibleColumnKeys={responsiveVisibleColumnKeys}
                    editableColumnKeys={editableColumnKeys}
                />
            </Box>

            <Popover
                open={lb.open}
                anchorEl={lb.anchorEl}
                onClose={() => setLb({ open: false, anchorEl: null, rowId: null, field: null, query: "" })}
                anchorOrigin={{ vertical: "bottom", horizontal: isMobile ? "center" : "left" }}
                transformOrigin={{ vertical: "top", horizontal: isMobile ? "center" : "left" }}
                PaperProps={{
                    sx: {
                        ...s.listboxPaper,
                        width: isMobile ? "calc(100vw - 24px)" : isTablet ? 360 : undefined,
                        maxWidth: "calc(100vw - 24px)",
                    },
                }}
            >
                <Box sx={{ p: 1.2, pb: 1 }}>
                    {lb.field !== "arac_durumu" ? (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <SearchIcon sx={{ color: "rgba(255,255,255,0.65)", fontSize: 18 }} />
                                <InputBase
                                    autoFocus
                                    placeholder="En az 2 karakter yazın..."
                                    value={lb.query}
                                    onChange={(e) => setLb((p) => ({ ...p, query: e.target.value }))}
                                    sx={s.listboxSearch}
                                />
                            </Stack>

                            <Typography sx={{ mt: 0.8, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                                {String(lb.query || "").trim()
                                    ? `Eşleşen: ${listboxTotalMatches} • Gösterilen: ${listboxOptions.length}`
                                    : `Toplam: ${listboxTotalMatches} • Gösterilen: ${listboxOptions.length}`}
                            </Typography>
                        </>
                    ) : (
                        <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                            Araç durumu seçin
                        </Typography>
                    )}
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
                    {listboxOptions.length === 0 ? (
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                                {plakaLoading
                                    ? "Yükleniyor..."
                                    : lb.field === "arac_durumu"
                                        ? "Seçenek bulunamadı."
                                        : String(lb.query || "").trim().length >= 2
                                            ? "Sonuç yok."
                                            : "Aramak için en az 2 karakter yazın."}
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

            <Dialog
                open={timeDlg.open}
                onClose={closeTimeDialog}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: "rgba(15,23,42,0.98)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                        backdropFilter: "blur(14px)",
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Saat Seç</DialogTitle>

                <DialogContent sx={{ pt: "8px !important" }}>
                    <TextField
                        fullWidth
                        type="time"
                        label="Saat"
                        value={timeDlg.value}
                        onChange={(e) => setTimeDlg((prev) => ({ ...prev, value: e.target.value }))}
                        inputProps={{ step: 300 }}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            mt: 1,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 2.5,
                                color: "#fff",
                                background: "rgba(255,255,255,0.04)",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255,255,255,0.14)",
                            },
                            "& .MuiInputLabel-root": {
                                color: "rgba(255,255,255,0.72)",
                            },
                            "& input": {
                                color: "#fff",
                            },
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={closeTimeDialog}
                        sx={{
                            color: "rgba(255,255,255,0.75)",
                            borderRadius: 2,
                        }}
                    >
                        Vazgeç
                    </Button>

                    <Button
                        variant="contained"
                        disabled={!String(timeDlg.value || "").trim()}
                        onClick={() => {
                            if (!timeDlg.rowId || !String(timeDlg.value || "").trim()) return;
                            handleChange(timeDlg.rowId, "arac_durumu", timeDlg.value);
                            closeTimeDialog();
                        }}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 800,
                            px: 2.2,
                        }}
                    >
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>

            <SoforSwapDialog
                open={swapDlg.open}
                onClose={() =>
                    setSwapDlg({
                        open: false,
                        rowId: null,
                        query: "",
                        targetPlakaId: null,
                        sourcePlaka: null,
                    })
                }
                s={s}
                sourceRow={rows.find((r) => r.id === swapDlg.rowId) || null}
                sourcePlaka={swapDlg.sourcePlaka}
                query={swapDlg.query}
                setQuery={(v) => setSwapDlg((p) => ({ ...p, query: v }))}
                targets={plakalar}
                targetPlakaId={swapDlg.targetPlakaId}
                setTargetPlakaId={(id) => setSwapDlg((p) => ({ ...p, targetPlakaId: id }))}
                onCreateDriver={handleCreateDriver}
                onSwap={() => {
                    if (!perm.ekranYazma || !can(BTN.ROW_SWAP_DRIVER)) return;

                    const tgt = plakalar.find((p) => p.id === swapDlg.targetPlakaId);
                    if (!tgt) {
                        setSnack({ open: true, msg: "Seçilen şoför bulunamadı.", sev: "warning" });
                        return;
                    }

                    patchRow(swapDlg.rowId, {
                        surucu: tgt.ad_soyad ?? "",
                        tel: tgt.telefon ?? "",
                        tc: tgt.tc_no ?? "",
                    });

                    scheduleAutoSave(swapDlg.rowId);

                    setSnack({ open: true, msg: "Şoför bilgisi güncellendi ✅", sev: "success" });
                    setSwapDlg({
                        open: false,
                        rowId: null,
                        query: "",
                        targetPlakaId: null,
                        sourcePlaka: null,
                    });
                }}
            />

            <VknDegistirme
                open={vknDlg.open}
                onClose={closeVknPanel}
                row={vknRow}
                rows={rows}
                setRows={setRows}
                supabase={supabase}
                batchId={null}
                onSaved={fetchRows}
                setSnack={setSnack}
                s={s}
            />

            <IadeOlusturDialog
                open={iadeDlg.open}
                onClose={closeIadeDialog}
                onConfirm={onConfirmCreateIadeRow}
                row={iadeRow}
            />

            {drawerOpen && (
                <SeferDetayDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    row={selectedRow}
                    s={s}
                    openListbox={openListbox}
                    handleChange={handleChange}
                    canEdit={perm.ekranYazma && can(BTN.ROW_EDIT)}
                />
            )}

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((p) => ({ ...p, open: false }))}>
                <Alert severity={snack.sev} variant="filled" sx={{ borderRadius: "12px" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}