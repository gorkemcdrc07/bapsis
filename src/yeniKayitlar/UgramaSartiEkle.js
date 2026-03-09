import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    Alert,
    Avatar,
    Backdrop,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Drawer,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { Autocomplete } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
    Add,
    AutoAwesome,
    Close,
    DeleteOutline,
    LocalShipping,
    Notes,
    Payments,
    Refresh,
    Save,
    Search,
} from "@mui/icons-material";

import { supabase } from "../supabase";

/* =========================
   ✅ EKRAN / BUTON KODLARI
========================= */
const EKRAN_KOD = "ugrama_sarti_ekle";

const BTN = {
    REFRESH: "ugrama_sarti_ekle.refresh",
    CREATE: "ugrama_sarti_ekle.create",
    CLEAR: "ugrama_sarti_ekle.clear",
    SAVE: "ugrama_sarti_ekle.save",
    DELETE: "ugrama_sarti_ekle.delete",
};

const ALL_OPTION = "HEPSİ";
const WHITE = "#FFFFFF";

const UI = {
    bg: "#060816",
    panel: "rgba(10, 14, 30, 0.72)",
    text: "#F8FAFC",
    muted: "rgba(248,250,252,0.68)",
    primary: "#7C3AED",
    secondary: "#06B6D4",
    success: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
    shadow:
        "0 10px 30px rgba(0,0,0,0.22), 0 30px 80px rgba(0,0,0,0.34)",
    gradientPrimary:
        "linear-gradient(135deg, rgba(124,58,237,0.98), rgba(6,182,212,0.92))",
    gradientDanger:
        "linear-gradient(135deg, rgba(239,68,68,0.98), rgba(245,158,11,0.90))",
};

/* =========================
   ✅ YETKİ FONKSİYONLARI
========================= */
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
        supabase
            .from("kullanici_buton_yetkileri")
            .select("buton_id, izin")
            .eq("kullanici_id", userId),
        supabase
            .from("rol_buton_yetkileri")
            .select("buton_id, izin")
            .eq("rol_id", roleId),
    ]);

    if (uErr) throw uErr;
    if (rErr) throw rErr;

    const userMap = {};
    (uB || []).forEach((x) => {
        userMap[x.buton_id] = !!x.izin;
    });

    const roleMap = {};
    (rB || []).forEach((x) => {
        roleMap[x.buton_id] = !!x.izin;
    });

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

export default function UgramaSartlari({ kullanici }) {
    const theme = useTheme();
    const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
    const mountedRef = useRef(true);

    /* =========================
       ✅ PERMISSION STATE
    ========================= */
    const [permLoading, setPermLoading] = useState(true);
    const [perm, setPerm] = useState({
        ekranGorunur: false,
        ekranYazma: false,
        btn: {},
    });

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
                    }
                    return;
                }

                const ekranId = await fetchEkranIdByKod({ supabase, ekranKod: EKRAN_KOD });
                if (!ekranId) {
                    if (alive) {
                        setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                    }
                    return;
                }

                const ekranIzin = await fetchEffectiveEkranIzin({
                    supabase,
                    ekranId,
                    userId,
                    roleId,
                });

                const btnMap = await fetchButtonMaps({
                    supabase,
                    ekranId,
                    userId,
                    roleId,
                });

                if (alive) {
                    setPerm({
                        ekranGorunur: ekranIzin,
                        ekranYazma: ekranIzin,
                        btn: btnMap || {},
                    });
                }
            } catch (e) {
                console.error("UgramaSartlari permission load error:", e);
                if (alive) {
                    setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
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

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [form, setForm] = useState({ vkn: "", ugrama_bedeli: "", sart: "" });

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);

    const [rows, setRows] = useState([]);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const [vknLoading, setVknLoading] = useState(true);
    const [vknHata, setVknHata] = useState("");
    const [vknOptions, setVknOptions] = useState([ALL_OPTION]);

    const [snack, setSnack] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });

    const createdByName = useMemo(() => {
        return (
            kullanici?.kullanici ||
            kullanici?.ad ||
            kullanici?.mail?.split("@")?.[0] ||
            ""
        );
    }, [kullanici]);

    const showSnack = (message, severity = "success") =>
        setSnack({ open: true, message, severity });

    const closeSnack = () => setSnack((p) => ({ ...p, open: false }));

    const resetForm = useCallback(() => {
        if (!perm.ekranYazma || !can(BTN.CLEAR)) return;
        setForm({ vkn: "", ugrama_bedeli: "", sart: "" });
    }, [perm.ekranYazma, can]);

    const chunkArray = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };

    const validate = () => {
        const vkn = (form.vkn ?? "").toString().trim();
        if (!vkn) return "VKN zorunlu.";

        const u = (form.ugrama_bedeli ?? "").toString().trim();
        if (!u) return "Uğrama bedeli zorunlu.";

        const normalized = u.replace(",", ".");
        if (Number.isNaN(Number(normalized))) return "Uğrama bedeli sayı olmalı.";

        return "";
    };

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 220);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        mountedRef.current = true;

        async function loadVknsAll() {
            if (!perm.ekranGorunur) return;

            setVknLoading(true);
            setVknHata("");

            try {
                const pageSize = 1000;
                let from = 0;
                let all = [];

                while (true) {
                    const to = from + pageSize - 1;

                    const { data, error } = await supabase
                        .from("plakalar")
                        .select("vkn")
                        .range(from, to);

                    if (error) throw error;

                    const chunk = data || [];
                    all = all.concat(chunk);

                    if (chunk.length < pageSize) break;
                    from += pageSize;

                    if (!mountedRef.current) return;
                }

                const uniq = Array.from(
                    new Set(
                        all
                            .map((r) => (r?.vkn ?? "").toString().trim())
                            .filter(Boolean)
                    )
                ).sort((a, b) => a.localeCompare(b, "tr"));

                if (!mountedRef.current) return;
                setVknOptions([ALL_OPTION, ...uniq]);
            } catch (e) {
                if (!mountedRef.current) return;
                setVknHata(e?.message || "VKN listesi alınamadı.");
            } finally {
                if (!mountedRef.current) return;
                setVknLoading(false);
            }
        }

        if (!permLoading && perm.ekranGorunur) {
            loadVknsAll();
        }

        return () => {
            mountedRef.current = false;
        };
    }, [permLoading, perm.ekranGorunur]);

    const loadTable = useCallback(async () => {
        if (!perm.ekranGorunur) return;

        setTableLoading(true);
        try {
            const { data, error } = await supabase
                .from("ugrama_sartlari")
                .select("*")
                .order("id", { ascending: false });

            if (error) throw error;
            setRows(data || []);
        } catch (e) {
            showSnack(e?.message || "Kayıtlar alınamadı.", "error");
        } finally {
            setTableLoading(false);
        }
    }, [perm.ekranGorunur]);

    useEffect(() => {
        if (permLoading) return;
        if (!perm.ekranGorunur) return;
        loadTable();
    }, [permLoading, perm.ekranGorunur, loadTable]);

    const filteredRows = useMemo(() => {
        const q = (debouncedQuery || "").trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((r) => {
            const t = (r.tedarikci ?? "").toString().toLowerCase();
            const s = (r.sart ?? "").toString().toLowerCase();
            const u = (r.ugrama_bedeli ?? "").toString().toLowerCase();
            const c = (r.created_by_name ?? "").toString().toLowerCase();
            return t.includes(q) || s.includes(q) || u.includes(q) || c.includes(q);
        });
    }, [rows, debouncedQuery]);

    const bulkCount = useMemo(() => {
        if ((form.vkn || "").trim() !== ALL_OPTION) return 0;
        return Math.max(0, vknOptions.length - 1);
    }, [form.vkn, vknOptions]);

    const fmtMoney = (v) => {
        if (v === null || v === undefined || v === "") return "";
        const num = Number(v);
        if (Number.isNaN(num)) return String(v);
        return new Intl.NumberFormat("tr-TR").format(num);
    };

    const fmtDate = (v) => {
        if (!v) return "";
        try {
            return new Date(v).toLocaleString("tr-TR");
        } catch {
            return String(v);
        }
    };

    const initials = useMemo(() => {
        const s = (createdByName || "").trim();
        if (!s) return "U";
        const parts = s.split(" ").filter(Boolean);
        const a = parts?.[0]?.[0] || "U";
        const b = parts?.[1]?.[0] || "";
        return (a + b).toUpperCase();
    }, [createdByName]);

    const handleKaydet = async () => {
        if (!perm.ekranYazma || !can(BTN.SAVE)) return;

        const err = validate();
        if (err) {
            showSnack(err, "error");
            return;
        }

        setLoading(true);
        try {
            const vknInput = form.vkn.trim();
            const ugrama_bedeli = Number(
                form.ugrama_bedeli.toString().trim().replace(",", ".")
            );
            const sart = (form.sart ?? "").toString().trim() || null;

            const common = {
                ugrama_bedeli,
                sart,
                created_by_email: (kullanici?.mail ?? "").toString() || null,
                created_by_name: createdByName || null,
            };

            if (vknInput === ALL_OPTION) {
                const realVkns = vknOptions.filter((x) => x && x !== ALL_OPTION);

                if (realVkns.length === 0) {
                    showSnack("Kayıt yapılacak VKN bulunamadı.", "error");
                    return;
                }

                const payloadRows = realVkns.map((v) => ({
                    tedarikci: v,
                    ...common,
                }));

                const parts = chunkArray(payloadRows, 500);

                for (const part of parts) {
                    const { error } = await supabase.from("ugrama_sartlari").insert(part);
                    if (error) throw error;
                }

                showSnack(`Başarılı ✅ ${realVkns.length} VKN için kural kaydedildi.`, "success");
                setForm({ vkn: "", ugrama_bedeli: "", sart: "" });
                setDrawerOpen(false);
                await loadTable();
                return;
            }

            const payload = { tedarikci: vknInput, ...common };
            const { error } = await supabase.from("ugrama_sartlari").insert([payload]);
            if (error) throw error;

            showSnack("Kural başarıyla kaydedildi.", "success");
            setForm({ vkn: "", ugrama_bedeli: "", sart: "" });
            setDrawerOpen(false);
            await loadTable();
        } catch (e) {
            showSnack(e?.message || "Kayıt sırasında hata oluştu.", "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!perm.ekranYazma || !can(BTN.DELETE)) return;

        const row = deleteDialog.row;
        setDeleteDialog({ open: false, row: null });

        try {
            if (!row?.id) {
                showSnack("Silinecek kayıt id bulunamadı.", "error");
                return;
            }

            setLoading(true);
            const { error } = await supabase
                .from("ugrama_sartlari")
                .delete()
                .eq("id", row.id);

            if (error) throw error;

            showSnack("Kayıt silindi.", "success");
            await loadTable();
        } catch (e) {
            showSnack(e?.message || "Silme sırasında hata oluştu.", "error");
        } finally {
            setLoading(false);
        }
    };

    const openDrawer = () => {
        if (!perm.ekranYazma || !can(BTN.CREATE)) return;
        setDrawerOpen(true);
    };

    const bg =
        "radial-gradient(1200px 700px at 0% 0%, rgba(124,58,237,0.20) 0%, rgba(0,0,0,0) 55%)," +
        "radial-gradient(1000px 700px at 100% 0%, rgba(6,182,212,0.16) 0%, rgba(0,0,0,0) 58%)," +
        "radial-gradient(900px 600px at 50% 100%, rgba(16,185,129,0.10) 0%, rgba(0,0,0,0) 55%)," +
        "linear-gradient(180deg, #050816 0%, #070B17 45%, #050816 100%)";

    if (permLoading) {
        return (
            <Box sx={{ minHeight: "100vh", background: bg, color: WHITE, p: { xs: 2, md: 3 } }}>
                <Box sx={{ maxWidth: 1260, mx: "auto" }}>
                    <Paper elevation={0} sx={heroSx}>
                        <Stack spacing={1.25} alignItems="center" sx={{ py: 8 }}>
                            <CircularProgress />
                            <Typography sx={{ opacity: 0.92, fontWeight: 800 }}>
                                Yetkiler yükleniyor…
                            </Typography>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
        );
    }

    if (!perm.ekranGorunur) {
        return (
            <Box sx={{ minHeight: "100vh", background: bg, color: WHITE, p: { xs: 2, md: 3 } }}>
                <Box sx={{ maxWidth: 1260, mx: "auto" }}>
                    <Paper elevation={0} sx={heroSx}>
                        <Stack spacing={1.2} alignItems="center" sx={{ py: 8 }}>
                            <Typography sx={{ fontWeight: 1000, fontSize: 22 }}>
                                Erişim Yok
                            </Typography>
                            <Typography sx={{ opacity: 0.85, textAlign: "center", maxWidth: 460 }}>
                                Bu ekrana erişim yetkiniz bulunmuyor. Yönetici panelinden “Uğrama
                                Şartı Ekle” ekran izni verilmelidir.
                            </Typography>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", background: bg, color: WHITE, p: { xs: 2, md: 3 } }}>
            <Backdrop open={loading} sx={{ zIndex: 3000, color: WHITE, backdropFilter: "blur(8px)" }}>
                <Stack spacing={1.25} alignItems="center">
                    <CircularProgress />
                    <Typography sx={{ opacity: 0.92, fontWeight: 800 }}>İşlem yapılıyor…</Typography>
                </Stack>
            </Backdrop>

            <Box
                sx={{
                    maxWidth: 1260,
                    mx: "auto",
                    position: "relative",
                    "&::before": {
                        content: '""',
                        position: "fixed",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "linear-gradient(to bottom, rgba(255,255,255,0.015), rgba(255,255,255,0))",
                        maskImage: "radial-gradient(circle at center, black, transparent 80%)",
                    },
                }}
            >
                <Paper elevation={0} sx={heroSx}>
                    <Box sx={heroGlowSx} />

                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", md: "center" }}
                        justifyContent="space-between"
                        sx={{ position: "relative", zIndex: 1 }}
                    >
                        <Box>
                            <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                                <Typography
                                    sx={{
                                        fontWeight: 1000,
                                        fontSize: { xs: 22, md: 28 },
                                        lineHeight: 1.05,
                                        letterSpacing: "-0.04em",
                                        background:
                                            "linear-gradient(180deg, #FFFFFF 0%, #C7D2FE 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    Uğrama Şartları
                                </Typography>

                                <Chip label="ugrama_sartlari" size="small" sx={chipTagSx} />

                                <Chip
                                    icon={<AutoAwesome sx={{ fontSize: 16 }} />}
                                    label="Modern UI"
                                    size="small"
                                    sx={modernChipSx}
                                />

                                {vknHata ? (
                                    <Chip label="VKN listesi hatalı" size="small" sx={chipWarnSx} />
                                ) : null}

                                {!perm.ekranYazma ? (
                                    <Chip label="Sadece Görüntüleme" size="small" sx={chipWarnSx} />
                                ) : null}
                            </Stack>

                            <Typography sx={{ mt: 0.9, color: UI.muted, fontSize: 13.5, maxWidth: 760 }}>
                                Kayıtları görüntüleyin, arayın, yeni kural ekleyin veya silin.{" "}
                                <span style={{ opacity: 0.9 }}>
                                    HEPSİ seçeneği ile toplu kayıt yapabilirsiniz.
                                </span>
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center" flexWrap="wrap">
                                <Chip size="small" label={`Kayıt: ${rows.length}`} sx={chipSuccessSx} />
                                <Chip size="small" label={`Kullanıcı: ${createdByName || "-"}`} sx={chipSoftSx} />
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            {can(BTN.REFRESH) ? (
                                <Tooltip title="Yenile">
                                    <span>
                                        <IconButton
                                            onClick={loadTable}
                                            disabled={tableLoading || loading}
                                            sx={iconBtnSx}
                                        >
                                            <Refresh />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            ) : null}

                            {can(BTN.CREATE) ? (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={openDrawer}
                                    sx={{
                                        ...primaryBtnSx,
                                        "&.Mui-disabled": { opacity: 0.5, color: WHITE },
                                    }}
                                    disabled={!perm.ekranYazma}
                                >
                                    Yeni Kural
                                </Button>
                            ) : null}

                            <Avatar sx={avatarSx}>{initials}</Avatar>
                        </Stack>
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={cardSx}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", md: "center" }}
                        justifyContent="space-between"
                        sx={{ mb: 1.75 }}
                    >
                        <Box>
                            <Typography sx={{ fontWeight: 950, fontSize: 16, letterSpacing: "-0.02em" }}>
                                Kayıt Listesi
                            </Typography>
                            <Typography sx={{ color: UI.muted, fontSize: 13, mt: 0.25 }}>
                                Arama; VKN, şart, bedel veya oluşturan alanlarında çalışır.
                            </Typography>
                        </Box>

                        <TextField
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ara: VKN / şart / bedel / oluşturan"
                            size="small"
                            sx={searchSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ color: alpha(WHITE, 0.9) }}>
                                        <Search sx={{ opacity: 0.95 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>

                    <TableContainer sx={tableWrapSx}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={thSxModern}>VKN (Tedarikçi)</TableCell>
                                    <TableCell sx={thSxModern}>Uğrama Bedeli</TableCell>
                                    <TableCell sx={thSxModern}>Şart / Açıklama</TableCell>
                                    <TableCell sx={thSxModern}>Oluşturan</TableCell>
                                    <TableCell sx={thSxModern}>Tarih</TableCell>
                                    {can(BTN.DELETE) ? (
                                        <TableCell sx={thSxModern} align="center" width={92}>
                                            İşlem
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {tableLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={can(BTN.DELETE) ? 6 : 5} sx={{ py: 6, textAlign: "center" }}>
                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                <CircularProgress size={20} sx={{ color: alpha(WHITE, 0.9) }} />
                                                <Typography sx={{ opacity: 0.9, fontSize: 13.5 }}>Yükleniyor…</Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={can(BTN.DELETE) ? 6 : 5} sx={{ py: 6 }}>
                                            <Box sx={emptyStateSx}>
                                                <Typography sx={{ fontWeight: 950, fontSize: 14.5 }}>
                                                    Kayıt bulunamadı
                                                </Typography>
                                                <Typography sx={{ color: UI.muted, fontSize: 13 }}>
                                                    Arama terimini değiştirin veya yeni bir kural ekleyin.
                                                </Typography>
                                                {can(BTN.CREATE) ? (
                                                    <Button onClick={openDrawer} startIcon={<Add />} sx={ghostBtnSx}>
                                                        Kural Ekle
                                                    </Button>
                                                ) : null}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows.map((r, idx) => (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            sx={{
                                                transition: "all 180ms ease",
                                                bgcolor: idx % 2 ? alpha("#ffffff", 0.018) : "transparent",
                                                "&:hover": {
                                                    bgcolor: alpha("#7C3AED", 0.08),
                                                    transform: "scale(0.998)",
                                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                                                },
                                            }}
                                        >
                                            <TableCell sx={tdSxModern}>
                                                <Stack spacing={0.25}>
                                                    <Typography sx={{ fontWeight: 950, letterSpacing: "-0.01em" }}>
                                                        {r.tedarikci}
                                                    </Typography>
                                                    <Typography sx={{ opacity: 0.72, fontSize: 12 }}>
                                                        ID: {r.id}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            <TableCell sx={tdSxModern}>
                                                <Chip label={fmtMoney(r.ugrama_bedeli)} size="small" sx={moneyChipSx} />
                                            </TableCell>

                                            <TableCell sx={tdSxModern}>
                                                <Typography sx={{ opacity: 0.96 }}>{r.sart || "-"}</Typography>
                                            </TableCell>

                                            <TableCell sx={tdSxModern}>
                                                <Typography sx={{ opacity: 0.96 }}>{r.created_by_name || "-"}</Typography>
                                            </TableCell>

                                            <TableCell sx={tdSxModern}>
                                                <Typography sx={{ opacity: 0.88, fontSize: 12.5 }}>
                                                    {fmtDate(r.created_at)}
                                                </Typography>
                                            </TableCell>

                                            {can(BTN.DELETE) ? (
                                                <TableCell sx={tdSxModern} align="center">
                                                    <Tooltip title="Sil">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                disabled={loading || !perm.ekranYazma}
                                                                onClick={() => setDeleteDialog({ open: true, row: r })}
                                                                sx={{
                                                                    ...dangerIconBtnSx,
                                                                    "&.Mui-disabled": { opacity: 0.35, color: WHITE },
                                                                }}
                                                            >
                                                                <DeleteOutline fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </TableCell>
                                            ) : null}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={() => !loading && setDrawerOpen(false)}
                    PaperProps={{ sx: drawerPaperSx }}
                >
                    <Box sx={{ p: { xs: 2, sm: 2.5 }, position: "relative", minHeight: "100%" }}>
                        <Box sx={drawerTopGlowSx} />

                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                            <Box>
                                <Typography
                                    sx={{
                                        fontWeight: 1000,
                                        fontSize: 22,
                                        letterSpacing: "-0.03em",
                                        background:
                                            "linear-gradient(180deg, #FFFFFF 0%, #A5F3FC 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    Yeni Kural Ekle
                                </Typography>
                                <Typography sx={{ mt: 0.7, color: UI.muted, fontSize: 13.5 }}>
                                    Kayıtlar <b>ugrama_sartlari</b> tablosuna yazılır.
                                </Typography>
                            </Box>

                            <IconButton onClick={() => !loading && setDrawerOpen(false)} sx={iconBtnSx}>
                                <Close />
                            </IconButton>
                        </Stack>

                        <Divider sx={{ my: 2, borderColor: alpha("#fff", 0.08) }} />

                        {(form.vkn || "").trim() === ALL_OPTION ? (
                            <Alert severity="info" sx={bulkInfoAlertSx}>
                                HEPSİ seçili: <b>{bulkCount}</b> VKN için toplu kayıt yapılacak.
                            </Alert>
                        ) : null}

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={vknOptions}
                                    loading={vknLoading}
                                    value={form.vkn || null}
                                    onChange={(event, newValue) =>
                                        perm.ekranYazma && setForm((p) => ({ ...p, vkn: newValue || "" }))
                                    }
                                    freeSolo
                                    inputValue={form.vkn}
                                    onInputChange={(event, newInputValue) =>
                                        perm.ekranYazma && setForm((p) => ({ ...p, vkn: newInputValue || "" }))
                                    }
                                    disabled={loading || !perm.ekranYazma}
                                    sx={{
                                        "& .MuiAutocomplete-popupIndicator": { color: alpha(WHITE, 0.9) },
                                        "& .MuiAutocomplete-clearIndicator": { color: alpha(WHITE, 0.9) },
                                    }}
                                    PaperComponent={(props) => <Paper {...props} sx={autoPaperSx} />}
                                    ListboxProps={{ style: { padding: 6, color: WHITE } }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="VKN"
                                            placeholder="VKN seçin / yazın (HEPSİ ile toplu)"
                                            fullWidth
                                            required
                                            sx={inputModernSx}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start" sx={{ color: alpha(WHITE, 0.9) }}>
                                                        <LocalShipping sx={{ opacity: 0.95 }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <>
                                                        {vknLoading ? (
                                                            <CircularProgress size={18} sx={{ color: alpha(WHITE, 0.9), mr: 1 }} />
                                                        ) : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                                {vknHata ? (
                                    <Typography sx={{ mt: 0.75, color: alpha("#FCA5A5", 0.95), fontSize: 12.5 }}>
                                        {vknHata}
                                    </Typography>
                                ) : null}
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    value={form.ugrama_bedeli}
                                    onChange={(e) => setForm((p) => ({ ...p, ugrama_bedeli: e.target.value }))}
                                    label="Uğrama Bedeli"
                                    placeholder="Örn: 1500"
                                    fullWidth
                                    required
                                    disabled={loading || !perm.ekranYazma}
                                    sx={inputModernSx}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ color: alpha(WHITE, 0.9) }}>
                                                <Payments sx={{ opacity: 0.95 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    value={form.sart}
                                    onChange={(e) => setForm((p) => ({ ...p, sart: e.target.value }))}
                                    label="Şart / Açıklama"
                                    placeholder="Örn: Şehir içi uğrama +1500₺, ikinci uğrama +1000₺..."
                                    fullWidth
                                    multiline
                                    minRows={isSmDown ? 6 : 9}
                                    disabled={loading || !perm.ekranYazma}
                                    sx={inputModernSx}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment
                                                position="start"
                                                sx={{ alignSelf: "flex-start", mt: 1.6, color: alpha(WHITE, 0.9) }}
                                            >
                                                <Notes sx={{ opacity: 0.95 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={drawerFooterSx}>
                            <Divider sx={{ borderColor: alpha("#fff", 0.08) }} />
                            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 2 }}>
                                {can(BTN.CLEAR) ? (
                                    <Button
                                        variant="outlined"
                                        disabled={loading || !perm.ekranYazma}
                                        onClick={resetForm}
                                        sx={outlineBtnSx}
                                    >
                                        Temizle
                                    </Button>
                                ) : null}

                                {can(BTN.SAVE) ? (
                                    <Button
                                        variant="contained"
                                        startIcon={<Save />}
                                        disabled={loading || !perm.ekranYazma}
                                        onClick={handleKaydet}
                                        sx={{
                                            ...primaryBtnSx,
                                            backgroundImage:
                                                form.vkn.trim() === ALL_OPTION
                                                    ? "linear-gradient(135deg, rgba(245,158,11,0.98), rgba(239,68,68,0.92))"
                                                    : "linear-gradient(135deg, rgba(124,58,237,0.98), rgba(6,182,212,0.92))",
                                        }}
                                    >
                                        {loading
                                            ? "Kaydediliyor…"
                                            : form.vkn.trim() === ALL_OPTION
                                                ? "Toplu Kaydet"
                                                : "Kaydet"}
                                    </Button>
                                ) : null}
                            </Stack>
                        </Box>
                    </Box>
                </Drawer>

                <Dialog
                    open={deleteDialog.open}
                    onClose={() => !loading && setDeleteDialog({ open: false, row: null })}
                    PaperProps={{ sx: dialogPaperSx }}
                >
                    <DialogTitle sx={{ fontWeight: 1000, letterSpacing: "-0.02em" }}>Kaydı sil?</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ color: alpha(WHITE, 0.9) }}>
                            <b>{deleteDialog.row?.tedarikci || "-"}</b> için kayıt silinecek. Bu işlem geri alınamaz.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, pt: 0 }}>
                        <Button
                            onClick={() => setDeleteDialog({ open: false, row: null })}
                            disabled={loading}
                            sx={ghostTextBtnSx}
                        >
                            Vazgeç
                        </Button>

                        {can(BTN.DELETE) ? (
                            <Button
                                onClick={confirmDelete}
                                disabled={loading || !perm.ekranYazma}
                                variant="contained"
                                sx={dangerBtnSx}
                                startIcon={loading ? <CircularProgress size={16} sx={{ color: WHITE }} /> : <DeleteOutline />}
                            >
                                Sil
                            </Button>
                        ) : null}
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snack.open}
                    autoHideDuration={3500}
                    onClose={closeSnack}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                    <Alert
                        onClose={closeSnack}
                        severity={snack.severity}
                        sx={{ borderRadius: 2, color: WHITE, "& .MuiAlert-icon": { color: WHITE } }}
                        variant="filled"
                    >
                        {snack.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
}

/* ----------------- STYLES ----------------- */

const heroSx = {
    p: { xs: 2.2, md: 3 },
    borderRadius: "28px",
    position: "relative",
    overflow: "hidden",
    border: `1px solid ${alpha("#fff", 0.10)}`,
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    bgcolor: UI.panel,
    backdropFilter: "blur(18px)",
    boxShadow: UI.shadow,
};

const heroGlowSx = {
    position: "absolute",
    inset: 0,
    background:
        "radial-gradient(800px 300px at 10% 0%, rgba(124,58,237,0.22), transparent 60%)," +
        "radial-gradient(720px 280px at 95% 10%, rgba(6,182,212,0.18), transparent 60%)," +
        "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
    pointerEvents: "none",
};

const cardSx = {
    mt: 2.2,
    p: { xs: 2, md: 2.6 },
    borderRadius: "28px",
    border: `1px solid ${alpha("#fff", 0.10)}`,
    bgcolor: UI.panel,
    backdropFilter: "blur(16px)",
    boxShadow: UI.shadow,
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
    },
};

const chipTagSx = {
    bgcolor: alpha(UI.primary, 0.14),
    border: `1px solid ${alpha(UI.primary, 0.30)}`,
    color: UI.text,
    fontWeight: 900,
    borderRadius: "999px",
    height: 28,
    "& .MuiChip-label": { color: UI.text, px: 1.2 },
};

const modernChipSx = {
    bgcolor: alpha("#fff", 0.06),
    border: `1px solid ${alpha("#fff", 0.10)}`,
    color: UI.text,
    borderRadius: "999px",
    height: 28,
    "& .MuiChip-label": { px: 1.1 },
    "& .MuiChip-icon": { color: "#C4B5FD" },
};

const chipSoftSx = {
    bgcolor: alpha("#fff", 0.05),
    border: `1px solid ${alpha("#fff", 0.10)}`,
    color: UI.text,
    borderRadius: "999px",
    height: 28,
    "& .MuiChip-label": { color: UI.text, px: 1.2 },
};

const chipSuccessSx = {
    bgcolor: alpha(UI.success, 0.14),
    border: `1px solid ${alpha(UI.success, 0.28)}`,
    color: UI.text,
    borderRadius: "999px",
    fontWeight: 900,
    height: 28,
    "& .MuiChip-label": { color: UI.text, px: 1.2 },
};

const chipWarnSx = {
    bgcolor: alpha(UI.warning, 0.14),
    border: `1px solid ${alpha(UI.warning, 0.30)}`,
    color: UI.text,
    borderRadius: "999px",
    fontWeight: 900,
    height: 28,
    "& .MuiChip-label": { color: UI.text, px: 1.2 },
};

const avatarSx = {
    width: 40,
    height: 40,
    fontWeight: 1000,
    color: UI.text,
    bgcolor: alpha("#fff", 0.06),
    border: `1px solid ${alpha("#fff", 0.12)}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const iconBtnSx = {
    color: UI.text,
    border: `1px solid ${alpha("#fff", 0.10)}`,
    bgcolor: alpha("#fff", 0.04),
    borderRadius: "14px",
    transition: "all 180ms ease",
    backdropFilter: "blur(8px)",
    "&:hover": {
        bgcolor: alpha("#fff", 0.08),
        transform: "translateY(-1px)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.20)",
    },
};

const primaryBtnSx = {
    borderRadius: "16px",
    textTransform: "none",
    fontWeight: 1000,
    letterSpacing: "-0.01em",
    px: 2.3,
    py: 1.15,
    color: UI.text,
    backgroundImage: UI.gradientPrimary,
    boxShadow: "0 12px 28px rgba(124,58,237,0.28)",
    transition: "all 180ms ease",
    "&:hover": {
        transform: "translateY(-2px)",
        filter: "brightness(1.05)",
        boxShadow: "0 18px 40px rgba(124,58,237,0.34)",
    },
};

const searchSx = {
    width: { xs: "100%", md: 460 },
    "& .MuiOutlinedInput-root": {
        borderRadius: "18px",
        bgcolor: alpha("#fff", 0.045),
        color: UI.text,
        backdropFilter: "blur(10px)",
        border: `1px solid ${alpha("#fff", 0.08)}`,
        transition: "all 180ms ease",
        "& fieldset": { border: "none" },
        "&:hover": {
            transform: "translateY(-1px)",
            bgcolor: alpha("#fff", 0.06),
            boxShadow: "0 14px 30px rgba(0,0,0,0.18)",
        },
        "&.Mui-focused": {
            boxShadow: `0 0 0 1px ${alpha(UI.secondary, 0.55)}, 0 18px 38px rgba(0,0,0,0.22)`,
            bgcolor: alpha("#fff", 0.065),
        },
    },
    "& .MuiInputBase-input::placeholder": {
        color: alpha(UI.text, 0.52),
        opacity: 1,
    },
};

const tableWrapSx = {
    maxHeight: 720,
    overflowY: "auto",
    display: "block",
    borderRadius: "22px",
    border: `1px solid ${alpha("#fff", 0.08)}`,
    bgcolor: alpha("#030712", 0.50),
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    "&::-webkit-scrollbar": { width: 10, height: 10 },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: alpha("#fff", 0.14),
        borderRadius: 999,
    },
    "&::-webkit-scrollbar-thumb:hover": {
        backgroundColor: alpha("#fff", 0.24),
    },
};

const thSxModern = {
    bgcolor: "rgba(12,16,34,0.92)",
    color: UI.text,
    fontWeight: 1000,
    fontSize: 13,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    borderBottom: `1px solid ${alpha("#fff", 0.10)}`,
    position: "sticky",
    top: 0,
    zIndex: 2,
    backdropFilter: "blur(12px)",
};

const tdSxModern = {
    color: UI.text,
    borderBottom: `1px solid ${alpha("#fff", 0.05)}`,
    verticalAlign: "middle",
    py: 1.6,
    "& *": { color: "inherit" },
};

const moneyChipSx = {
    height: 30,
    borderRadius: "999px",
    fontWeight: 1000,
    color: UI.text,
    bgcolor: alpha(UI.success, 0.14),
    border: `1px solid ${alpha(UI.success, 0.24)}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    "& .MuiChip-label": { color: UI.text, px: 1.3 },
};

const dangerIconBtnSx = {
    color: UI.text,
    borderRadius: "14px",
    border: `1px solid ${alpha(UI.danger, 0.24)}`,
    bgcolor: alpha(UI.danger, 0.08),
    transition: "all 180ms ease",
    "&:hover": {
        bgcolor: alpha(UI.danger, 0.14),
        transform: "translateY(-1px)",
        boxShadow: "0 10px 24px rgba(239,68,68,0.16)",
    },
};

const emptyStateSx = {
    p: { xs: 3, md: 4 },
    borderRadius: "24px",
    border: `1px dashed ${alpha("#fff", 0.14)}`,
    bgcolor: alpha("#fff", 0.03),
    textAlign: "center",
    backdropFilter: "blur(10px)",
};

const ghostBtnSx = {
    mt: 1.5,
    borderRadius: "16px",
    textTransform: "none",
    fontWeight: 900,
    color: UI.text,
    bgcolor: alpha("#fff", 0.06),
    border: `1px solid ${alpha("#fff", 0.10)}`,
    "&:hover": { bgcolor: alpha("#fff", 0.10) },
};

const drawerPaperSx = {
    width: { xs: "100%", sm: 620 },
    bgcolor: "rgba(6,8,22,0.94)",
    color: UI.text,
    borderLeft: `1px solid ${alpha("#fff", 0.08)}`,
    backdropFilter: "blur(22px)",
    boxShadow: "-20px 0 50px rgba(0,0,0,0.35)",
    "& *": { color: "inherit" },
};

const drawerTopGlowSx = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
        "radial-gradient(720px 260px at 18% 0%, rgba(124,58,237,0.28), transparent 60%)," +
        "radial-gradient(620px 240px at 88% 10%, rgba(6,182,212,0.18), transparent 60%)",
};

const autoPaperSx = {
    bgcolor: "rgba(9,12,24,0.98)",
    color: UI.text,
    border: `1px solid ${alpha("#fff", 0.10)}`,
    borderRadius: "18px",
    overflow: "hidden",
    backdropFilter: "blur(16px)",
    boxShadow: UI.shadow,
};

const inputModernSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "18px",
        bgcolor: alpha("#fff", 0.045),
        color: UI.text,
        backdropFilter: "blur(10px)",
        transition: "all 180ms ease",
        "& fieldset": {
            borderColor: alpha("#fff", 0.09),
        },
        "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 14px 30px rgba(0,0,0,0.18)",
            bgcolor: alpha("#fff", 0.06),
        },
        "&:hover fieldset": {
            borderColor: alpha("#fff", 0.15),
        },
        "&.Mui-focused": {
            bgcolor: alpha("#fff", 0.07),
            boxShadow: `0 0 0 1px ${alpha(UI.primary, 0.52)}, 0 16px 36px rgba(0,0,0,0.20)`,
        },
        "&.Mui-focused fieldset": {
            borderColor: alpha(UI.primary, 0.52),
        },
    },
    "& .MuiInputLabel-root": { color: alpha(UI.text, 0.86) },
    "& .MuiInputLabel-root.Mui-focused": { color: UI.text },
    "& .MuiInputBase-input::placeholder": {
        color: alpha(UI.text, 0.54),
        opacity: 1,
    },
    "& textarea::placeholder": {
        color: alpha(UI.text, 0.54),
        opacity: 1,
    },
    "& .MuiInputAdornment-root": { color: alpha(UI.text, 0.88) },
};

const drawerFooterSx = {
    mt: 2.5,
    position: "sticky",
    bottom: 0,
    pb: 0.5,
    pt: 0,
    backdropFilter: "blur(16px)",
    borderRadius: "20px",
    background: "rgba(6,8,22,0.72)",
};

const outlineBtnSx = {
    borderRadius: "16px",
    textTransform: "none",
    fontWeight: 900,
    borderColor: alpha("#fff", 0.18),
    color: UI.text,
    bgcolor: alpha("#fff", 0.03),
    "&:hover": {
        borderColor: alpha("#fff", 0.28),
        bgcolor: alpha("#fff", 0.06),
    },
};

const dialogPaperSx = {
    borderRadius: "24px",
    bgcolor: "rgba(8,10,22,0.96)",
    border: `1px solid ${alpha("#fff", 0.10)}`,
    color: UI.text,
    backdropFilter: "blur(18px)",
    boxShadow: UI.shadow,
};

const ghostTextBtnSx = {
    borderRadius: "14px",
    textTransform: "none",
    color: alpha(UI.text, 0.90),
    "&:hover": { bgcolor: alpha("#fff", 0.06) },
};

const dangerBtnSx = {
    borderRadius: "16px",
    textTransform: "none",
    fontWeight: 1000,
    color: UI.text,
    backgroundImage: UI.gradientDanger,
    boxShadow: "0 12px 28px rgba(239,68,68,0.22)",
    "&:hover": {
        transform: "translateY(-1px)",
        filter: "brightness(1.04)",
    },
};

const bulkInfoAlertSx = {
    mb: 2,
    borderRadius: "18px",
    bgcolor: alpha(UI.primary, 0.12),
    border: `1px solid ${alpha(UI.primary, 0.22)}`,
    color: UI.text,
    "& .MuiAlert-icon": { color: UI.text },
};