import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Stack,
    InputAdornment,
    Drawer,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Tooltip,
    Avatar,
    ToggleButtonGroup,
    ToggleButton,
    CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    Search,
    Add,
    Edit,
    DeleteOutline,
    DirectionsCarRounded,
    FilterList,
    Close,
    InfoOutlined,
    CheckCircleRounded,
    PauseCircleRounded,
    LocalShippingRounded,
} from "@mui/icons-material";

import { supabase } from "../supabase";

/** --- EKRAN / BUTON KODLARI --- */
const EKRAN_KOD = "aracbilgileri";

const BTN = {
    CREATE: "aracbilgileri.create",
    OPEN_DETAIL: "aracbilgileri.open_detail",
    EDIT: "aracbilgileri.edit",
    DELETE: "aracbilgileri.delete",
    FILTER: "aracbilgileri.filter",
};

/** --- Sabitler --- */
const STATUS_OPTIONS = ["AKTİF", "PASİF", "VAR", "YOK"];
const REQUIRED_FIELDS = ["cekici", "ad_soyad", "tc_no"];

/** Tablo kolonlarını tek yerden yönet */
const COLUMNS = [
    { key: "plaka", label: "PLAKA", sortable: false, width: 220 },
    { key: "statu", label: "STATÜ", sortable: true, width: 120 },
    { key: "tc_no", label: "TC", sortable: true, width: 140 },
    { key: "ad_soyad", label: "AD SOYAD", sortable: true, width: 220 },
    { key: "telefon", label: "TELEFON", sortable: true, width: 140 },
    { key: "ise_baslama_tarihi", label: "İŞE BAŞLAMA", sortable: true, width: 140 },
    { key: "vkn", label: "VKN", sortable: true, width: 140 },
    { key: "muayene", label: "MUAYENE", sortable: true, width: 140 },
    { key: "notlar", label: "NOT", sortable: true, width: 220 },
    { key: "hgs", label: "HGS", sortable: true, width: 110 },
    { key: "yakit", label: "YAKIT", sortable: true, width: 110 },
    { key: "gps", label: "GPS", sortable: true, width: 110 },
    { key: "isi_sensoru", label: "ISI SENSÖRÜ", sortable: true, width: 130 },
    { key: "istasyon", label: "İSTASYON", sortable: true, width: 160 },
];

async function fetchButtonPermsForUser(userId) {
    const { data, error } = await supabase
        .from("v_kullanici_buton_izinleri")
        .select("buton_kod, izin")
        .eq("kullanici_id", userId)
        .eq("ekran_kod", EKRAN_KOD);

    if (error) throw error;

    const map = {};
    (data || []).forEach((x) => {
        map[String(x.buton_kod || "").trim()] = x.izin === true;
    });

    return map;
}

export default function AracBilgileri() {
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");

    // Filters
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ istasyon: "Hepsi" });

    // Default: sadece AKTİF göster
    const [statuTab, setStatuTab] = useState("AKTİF"); // "AKTİF" | "PASİF"

    // Sort
    const [sort, setSort] = useState({ key: "cekici", dir: "asc" });

    // Details
    const [detail, setDetail] = useState(null);

    // Create/Edit
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [form, setForm] = useState(blankForm());

    // Soft-delete target
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Snack
    const [snack, setSnack] = useState({ open: false, type: "success", msg: "" });

    // Load
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(100);

    // Yetki
    const [permLoading, setPermLoading] = useState(true);
    const [canShow, setCanShow] = useState(false);
    const [btnPerms, setBtnPerms] = useState({});

    const can = useCallback(
        (btnKod) => {
            if (!canShow) return false;
            return btnPerms?.[btnKod] === true;
        },
        [canShow, btnPerms]
    );

    const canWrite = useMemo(() => {
        return can(BTN.CREATE) || can(BTN.EDIT) || can(BTN.DELETE);
    }, [can]);

    /** Yetkileri yükle */
    useEffect(() => {
        let alive = true;

        async function loadPerms() {
            try {
                setPermLoading(true);

                const raw = localStorage.getItem("bapsis_user");
                const user = raw ? JSON.parse(raw) : null;

                if (!user?.id) {
                    if (alive) {
                        setCanShow(false);
                        setBtnPerms({});
                    }
                    return;
                }

                const perms = await fetchButtonPermsForUser(user.id);

                if (!alive) return;

                setBtnPerms(perms || {});
                setCanShow(true);
            } catch (e) {
                console.error("Yetki yükleme hatası:", e);
                if (alive) {
                    setCanShow(false);
                    setBtnPerms({});
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

    /** Fetch (tüm kayıtları batch çek) */
    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setLoadError("");

            try {
                const pageSizeDb = 1000;
                let from = 0;
                let all = [];

                while (true) {
                    const to = from + pageSizeDb - 1;

                    const { data, error } = await supabase
                        .from("plakalar")
                        .select("*")
                        .order("id", { ascending: false })
                        .range(from, to);

                    if (error) throw error;

                    const chunk = data ?? [];
                    all = all.concat(chunk);

                    if (chunk.length < pageSizeDb) break;

                    from += pageSizeDb;
                    if (!alive) return;
                }

                if (alive) setRows(all);
            } catch (e) {
                console.error(e);
                if (alive) setLoadError(e?.message || "Veri çekilemedi");
            } finally {
                if (alive) setLoading(false);
            }
        }

        if (canShow) load();

        return () => {
            alive = false;
        };
    }, [canShow]);

    /** KPI */
    const kpi = useMemo(() => {
        if (!canShow) return { total: 0, istasyonCount: 0, gpsVar: 0, gpsYok: 0 };
        const total = rows.length;
        const istasyonCount = new Set(rows.map((r) => r.istasyon).filter(Boolean)).size;
        const gpsVar = rows.filter((r) => isTruthyText(r.gps)).length;
        const gpsYok = total - gpsVar;
        return { total, istasyonCount, gpsVar, gpsYok };
    }, [canShow, rows]);

    /** Options */
    const istasyonOptions = useMemo(() => {
        if (!canShow) return ["Hepsi"];
        const set = new Set(rows.map((r) => r.istasyon).filter(Boolean));
        return ["Hepsi", ...Array.from(set)];
    }, [canShow, rows]);

    /** Search + Filter + StatusTab + Sort */
    const processed = useMemo(() => {
        if (!canShow) return [];

        const s = search.trim().toLowerCase();

        let data = rows.filter((r) => {
            const matchIstasyon =
                filters.istasyon === "Hepsi" || (r.istasyon ?? "") === filters.istasyon;

            const rowStatu = (r.statu ?? "AKTİF").toUpperCase();
            const matchStatu = rowStatu === statuTab;

            if (!matchIstasyon || !matchStatu) return false;
            if (!s) return true;

            const haystack = makeSearchText(r);
            return haystack.includes(s);
        });

        const { key, dir } = sort;
        data.sort((a, b) => {
            const av = String(a?.[key] ?? "");
            const bv = String(b?.[key] ?? "");
            return dir === "asc" ? av.localeCompare(bv, "tr") : bv.localeCompare(av, "tr");
        });

        return data;
    }, [canShow, rows, search, filters, sort, statuTab]);

    const paged = useMemo(() => {
        if (!canShow) return [];
        const start = page * pageSize;
        return processed.slice(start, start + pageSize);
    }, [canShow, processed, page, pageSize]);

    useEffect(() => {
        setPage(0);
    }, [search, filters, statuTab, sort]);

    function openCreate() {
        if (!can(BTN.CREATE)) return;
        setFormMode("create");
        setForm(blankForm());
        setFormOpen(true);
    }

    function openEdit(row) {
        if (!can(BTN.EDIT)) return;
        setFormMode("edit");
        setForm({ ...blankForm(), ...row, statu: row?.statu ?? "AKTİF" });
        setFormOpen(true);
    }

    function openDetail(row) {
        if (!can(BTN.OPEN_DETAIL)) return;
        setDetail(row);
    }

    async function saveForm() {
        if (!canWrite) return;

        const missing = REQUIRED_FIELDS.find((k) => !String(form[k] ?? "").trim());
        if (missing) {
            setSnack({ open: true, type: "warning", msg: "Çekici, Ad Soyad ve TC zorunlu." });
            return;
        }

        try {
            setLoading(true);
            const payload = pickPlakaPayload(form);

            if (formMode === "create") {
                if (!can(BTN.CREATE)) return;

                delete payload.id;
                delete payload.created_at;
                delete payload.updated_at;

                if (!String(payload.statu ?? "").trim()) payload.statu = "AKTİF";

                const { data, error } = await supabase
                    .from("plakalar")
                    .insert(payload)
                    .select("*")
                    .single();

                if (error) throw error;

                setRows((prev) => [data, ...prev]);
                setSnack({ open: true, type: "success", msg: "Kayıt eklendi." });
            } else {
                if (!can(BTN.EDIT)) return;

                const rowId = payload.id;

                if (!rowId) {
                    setSnack({ open: true, type: "error", msg: "ID bulunamadı (edit)." });
                    return;
                }

                delete payload.id;
                delete payload.created_at; // istersen bunu da update etme
                payload.updated_at = new Date().toISOString();

                const { data, error } = await supabase
                    .from("plakalar")
                    .update(payload)
                    .eq("id", rowId)
                    .select("*")
                    .single();

                if (error) throw error;

                setRows((prev) => prev.map((r) => (r.id === data.id ? data : r)));
                if (detail?.id === data.id) setDetail(data);

                setSnack({ open: true, type: "success", msg: "Kayıt güncellendi." });
            }

            setFormOpen(false);
        } catch (e) {
            console.error(e);
            setSnack({ open: true, type: "error", msg: e?.message || "Kaydedilemedi" });
        } finally {
            setLoading(false);
        }
    }
    function confirmDelete(row) {
        if (!can(BTN.DELETE)) return;
        setDeleteTarget(row);
    }

    async function doDelete() {
        if (!can(BTN.DELETE)) return;
        if (!deleteTarget?.id) return;

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("plakalar")
                .update({ statu: "PASİF", updated_at: new Date().toISOString() })
                .eq("id", deleteTarget.id)
                .select("*")
                .single();

            if (error) throw error;

            setRows((prev) => prev.map((r) => (r.id === data.id ? data : r)));
            if (detail?.id === data.id) setDetail(null);

            setSnack({ open: true, type: "success", msg: "Kayıt PASİF'e alındı." });
            setDeleteTarget(null);
        } catch (e) {
            console.error(e);
            setSnack({ open: true, type: "error", msg: e?.message || "İşlem başarısız" });
        } finally {
            setLoading(false);
        }
    }

    function toggleSort(key) {
        if (key === "plaka") return;

        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const totalPages = useMemo(() => {
        if (!canShow) return 1;
        return Math.max(1, Math.ceil(processed.length / pageSize));
    }, [canShow, processed.length, pageSize]);

    if (permLoading) {
        return (
            <Box sx={styles.page}>
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <Stack alignItems="center" spacing={1.5}>
                        <CircularProgress />
                        <Typography sx={{ color: "#fff", fontWeight: 800 }}>
                            Yetkiler yükleniyor...
                        </Typography>
                    </Stack>
                </Box>
            </Box>
        );
    }

    if (!canShow) {
        return (
            <Box sx={styles.page}>
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 800 }}>
                        Bu ekrana erişim yetkiniz yok.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={styles.page}>
            {/* HEADER */}
            <Box sx={styles.header}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={styles.iconBox}>
                        <DirectionsCarRounded sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography sx={styles.title}>Araç Bilgileri</Typography>
                        <Typography sx={styles.subtitle}>
                            {kpi.total} Toplam • {kpi.istasyonCount} İstasyon
                        </Typography>
                    </Box>
                </Stack>

                {can(BTN.CREATE) && (
                    <Tooltip title="Yeni Kayıt">
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<Add />}
                            sx={styles.addButton}
                            onClick={openCreate}
                        >
                            Yeni Kayıt Ekle
                        </Button>
                    </Tooltip>
                )}
            </Box>

            {(loading || loadError) && (
                <Box sx={{ mb: 2 }}>
                    {loading && (
                        <Typography sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>
                            İşleniyor...
                        </Typography>
                    )}
                    {loadError && (
                        <Typography sx={{ color: "#ef4444", fontWeight: 900 }}>
                            Hata: {loadError}
                        </Typography>
                    )}
                </Box>
            )}

            {/* KPI */}
            <Box sx={styles.kpiGrid}>
                <KpiCard title="Toplam" value={kpi.total} icon={<DirectionsCarRounded />} accent="primary" />
                <KpiCard title="İstasyon" value={kpi.istasyonCount} icon={<LocalShippingRounded />} accent="info" />
                <KpiCard title="GPS Var" value={kpi.gpsVar} icon={<CheckCircleRounded />} accent="success" />
                <KpiCard title="GPS Yok" value={kpi.gpsYok} icon={<PauseCircleRounded />} accent="neutral" />
            </Box>

            {/* SEARCH + TAB + FILTER */}
            <Box sx={styles.filterRow}>
                <TextField
                    placeholder="Çekici, dorse, TC, ad soyad, telefon, VKN, istasyon..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: "rgba(255,255,255,0.55)" }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={styles.searchField}
                />

                <ToggleButtonGroup
                    exclusive
                    value={statuTab}
                    onChange={(_, v) => v && setStatuTab(v)}
                    sx={styles.segment}
                >
                    <ToggleButton value="AKTİF">Aktif</ToggleButton>
                    <ToggleButton value="PASİF">Pasif</ToggleButton>
                </ToggleButtonGroup>

                {can(BTN.FILTER) && (
                    <Tooltip title="Gelişmiş Filtreler">
                        <IconButton sx={styles.filterButton} onClick={() => setFilterOpen(true)}>
                            <FilterList />
                        </IconButton>
                    </Tooltip>
                )}

                <Typography sx={{ ml: "auto", color: "rgba(255,255,255,0.55)", fontWeight: 800 }}>
                    Gösterilen: {paged.length} / {processed.length}
                </Typography>
            </Box>

            {/* TABLE */}
            <TableContainer component={Card} sx={styles.tableCard}>
                <Table stickyHeader sx={{ minWidth: 1620 }}>
                    <TableHead>
                        <TableRow>
                            {COLUMNS.map((c) => (
                                <TableCell
                                    key={c.key}
                                    sx={{ ...styles.headCell, width: c.width }}
                                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                                >
                                    {c.label} {c.sortable ? sortHint(sort, c.key) : ""}
                                </TableCell>
                            ))}

                            <TableCell sx={{ ...styles.headCell, width: 140 }} align="right">
                                EYLEMLER
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paged.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={styles.tableRow}
                                onClick={() => {
                                    if (can(BTN.OPEN_DETAIL)) openDetail(row);
                                }}
                            >
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                        <Box sx={styles.plakaBadge}>{safeText(row.cekici)}</Box>
                                        <Box sx={styles.plakaBadge}>{safeText(row.dorse)}</Box>
                                    </Stack>
                                </TableCell>

                                <TableCell>{StatuChip(row.statu)}</TableCell>
                                <TableCell sx={styles.cellSoft}>{safeText(row.tc_no)}</TableCell>

                                <TableCell>
                                    <Stack direction="row" spacing={1.1} alignItems="center">
                                        <Avatar sx={styles.avatar}>
                                            {safeText(row.ad_soyad).charAt(0).toUpperCase() || "K"}
                                        </Avatar>
                                        <Typography sx={{ fontWeight: 900, color: "#fff" }}>
                                            {safeText(row.ad_soyad)}
                                        </Typography>
                                    </Stack>
                                </TableCell>

                                <TableCell sx={styles.cellSoft}>{safeText(row.telefon)}</TableCell>
                                <TableCell sx={styles.cellSoft}>{safeText(row.ise_baslama_tarihi)}</TableCell>
                                <TableCell sx={styles.cellSoft}>{safeText(row.vkn)}</TableCell>
                                <TableCell sx={styles.cellSoft}>{safeText(row.muayene)}</TableCell>

                                <TableCell sx={{ ...styles.cellSoft, maxWidth: 260 }}>
                                    <Box
                                        sx={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {safeText(row.notlar)}
                                    </Box>
                                </TableCell>

                                <TableCell>{TextChip(row.hgs)}</TableCell>
                                <TableCell>{TextChip(row.yakit)}</TableCell>
                                <TableCell>{TextChip(row.gps)}</TableCell>
                                <TableCell>{TextChip(row.isi_sensoru)}</TableCell>
                                <TableCell sx={styles.cellSoft}>{safeText(row.istasyon)}</TableCell>

                                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        {can(BTN.OPEN_DETAIL) && (
                                            <Tooltip title="Detay">
                                                <IconButton sx={styles.actionInfo} onClick={() => openDetail(row)}>
                                                    <InfoOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {can(BTN.EDIT) && (
                                            <Tooltip title="Düzenle">
                                                <IconButton sx={styles.actionEdit} onClick={() => openEdit(row)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}

                                        {can(BTN.DELETE) && (
                                            <Tooltip title="Pasif'e Al">
                                                <IconButton sx={styles.actionDelete} onClick={() => confirmDelete(row)}>
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}

                        {processed.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={COLUMNS.length + 1} sx={{ py: 6, borderBottom: "none" }}>
                                    <Box sx={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                                        Sonuç bulunamadı.
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* PAGINATION */}
            <Box
                sx={{
                    mt: 2,
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                }}
            >
                <Button
                    variant="outlined"
                    sx={styles.secondaryBtn}
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                    Önceki
                </Button>

                <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 900 }}>
                    Sayfa {page + 1} / {totalPages}
                </Typography>

                <Button
                    variant="contained"
                    disableElevation
                    sx={styles.primaryBtn}
                    disabled={(page + 1) * pageSize >= processed.length}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Sonraki
                </Button>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(0);
                        }}
                        sx={styles.select}
                    >
                        {[50, 100, 200, 500].map((n) => (
                            <MenuItem key={n} value={n}>
                                {n} / sayfa
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* FILTER DRAWER */}
            <Drawer
                anchor="right"
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                PaperProps={{ sx: styles.drawerPaper }}
            >
                <Box sx={styles.drawerHeader}>
                    <Typography sx={{ fontWeight: 900 }}>Gelişmiş Filtreler</Typography>
                    <IconButton onClick={() => setFilterOpen(false)} sx={styles.drawerClose}>
                        <Close />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Box sx={{ p: 2.5 }}>
                    <Stack spacing={2.25}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={styles.inputLabel}>İstasyon</InputLabel>
                            <Select
                                value={filters.istasyon}
                                label="İstasyon"
                                onChange={(e) => setFilters((p) => ({ ...p, istasyon: e.target.value }))}
                                sx={styles.select}
                            >
                                {istasyonOptions.map((x) => (
                                    <MenuItem key={x} value={x}>
                                        {x}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Stack direction="row" spacing={1.5}>
                            <Button
                                variant="contained"
                                disableElevation
                                sx={styles.primaryBtn}
                                onClick={() => setFilterOpen(false)}
                                fullWidth
                            >
                                Uygula
                            </Button>
                            <Button
                                variant="outlined"
                                sx={styles.secondaryBtn}
                                onClick={() => setFilters({ istasyon: "Hepsi" })}
                                fullWidth
                            >
                                Sıfırla
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Drawer>

            {/* DETAILS DRAWER */}
            <Drawer
                anchor="right"
                open={Boolean(detail)}
                onClose={() => setDetail(null)}
                PaperProps={{ sx: styles.detailPaper }}
            >
                {detail && (
                    <>
                        <Box sx={styles.drawerHeader}>
                            <Stack spacing={0.2}>
                                <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                                    {safeText(detail.ad_soyad)}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                                    {safeText(detail.cekici)} • {safeText(detail.dorse)} • {safeText(detail.istasyon)}
                                </Typography>
                            </Stack>
                            <IconButton onClick={() => setDetail(null)} sx={styles.drawerClose}>
                                <Close />
                            </IconButton>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        <Box sx={{ p: 2.5 }}>
                            <Stack spacing={1.5}>
                                <InfoRow label="Statü" value={StatuChip(detail.statu)} />
                                <InfoRow label="Çekici" value={safeText(detail.cekici)} />
                                <InfoRow label="Dorse" value={safeText(detail.dorse)} />
                                <InfoRow label="TC" value={safeText(detail.tc_no)} />
                                <InfoRow label="Telefon" value={safeText(detail.telefon)} />
                                <InfoRow label="İşe Başlama" value={safeText(detail.ise_baslama_tarihi)} />
                                <InfoRow label="VKN" value={safeText(detail.vkn)} />
                                <InfoRow label="Muayene" value={safeText(detail.muayene)} />
                                <InfoRow label="İstasyon" value={safeText(detail.istasyon)} />
                                <InfoRow label="HGS" value={TextChip(detail.hgs)} />
                                <InfoRow label="Yakıt" value={TextChip(detail.yakit)} />
                                <InfoRow label="GPS" value={TextChip(detail.gps)} />
                                <InfoRow label="Isı Sensörü" value={TextChip(detail.isi_sensoru)} />
                                <InfoRow label="Not" value={safeText(detail.notlar)} />

                                {(can(BTN.EDIT) || can(BTN.DELETE)) && (
                                    <>
                                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 1 }} />

                                        <Stack direction="row" spacing={1}>
                                            {can(BTN.EDIT) && (
                                                <Button
                                                    variant="contained"
                                                    disableElevation
                                                    sx={styles.primaryBtn}
                                                    onClick={() => openEdit(detail)}
                                                    fullWidth
                                                    startIcon={<Edit />}
                                                >
                                                    Düzenle
                                                </Button>
                                            )}

                                            {can(BTN.DELETE) && (
                                                <Button
                                                    variant="outlined"
                                                    sx={styles.dangerOutline}
                                                    onClick={() => confirmDelete(detail)}
                                                    fullWidth
                                                    startIcon={<DeleteOutline />}
                                                >
                                                    Pasif'e Al
                                                </Button>
                                            )}
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </Box>
                    </>
                )}
            </Drawer>

            {/* CREATE/EDIT DIALOG */}
            <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="md">
                <DialogTitle sx={styles.dialogTitle}>
                    {formMode === "create" ? "Yeni Kayıt Ekle" : "Kayıt Düzenle"}
                </DialogTitle>
                <DialogContent sx={styles.dialogContent}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                label="Çekici"
                                value={form.cekici}
                                onChange={(e) => setForm((p) => ({ ...p, cekici: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Dorse"
                                value={form.dorse}
                                onChange={(e) => setForm((p) => ({ ...p, dorse: e.target.value }))}
                                fullWidth
                            />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                label="TC"
                                value={form.tc_no}
                                onChange={(e) => setForm((p) => ({ ...p, tc_no: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Ad Soyad"
                                value={form.ad_soyad}
                                onChange={(e) => setForm((p) => ({ ...p, ad_soyad: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Telefon"
                                value={form.telefon}
                                onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))}
                                fullWidth
                            />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                label="İşe Başlama"
                                value={form.ise_baslama_tarihi}
                                onChange={(e) => setForm((p) => ({ ...p, ise_baslama_tarihi: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="VKN"
                                value={form.vkn}
                                onChange={(e) => setForm((p) => ({ ...p, vkn: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Muayene"
                                value={form.muayene}
                                onChange={(e) => setForm((p) => ({ ...p, muayene: e.target.value }))}
                                fullWidth
                            />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <SelectField
                                label="Statü"
                                value={form.statu ?? "AKTİF"}
                                onChange={(v) => setForm((p) => ({ ...p, statu: v }))}
                                options={["AKTİF", "PASİF"]}
                            />
                            <SelectField
                                label="İstasyon"
                                value={form.istasyon ?? ""}
                                onChange={(v) => setForm((p) => ({ ...p, istasyon: v }))}
                                options={istasyonOptions.filter((x) => x !== "Hepsi")}
                                allowEmpty
                            />
                            <SelectField
                                label="HGS"
                                value={form.hgs ?? ""}
                                onChange={(v) => setForm((p) => ({ ...p, hgs: v }))}
                                options={STATUS_OPTIONS}
                                allowEmpty
                            />
                            <SelectField
                                label="Yakıt"
                                value={form.yakit ?? ""}
                                onChange={(v) => setForm((p) => ({ ...p, yakit: v }))}
                                options={STATUS_OPTIONS}
                                allowEmpty
                            />
                            <SelectField
                                label="GPS"
                                value={form.gps ?? ""}
                                onChange={(v) => setForm((p) => ({ ...p, gps: v }))}
                                options={STATUS_OPTIONS}
                                allowEmpty
                            />
                            <SelectField
                                label="Isı Sensörü"
                                value={form.isi_sensoru ?? ""}
                                onChange={(v) => setForm((p) => ({ ...p, isi_sensoru: v }))}
                                options={STATUS_OPTIONS}
                                allowEmpty
                            />
                        </Stack>

                        <TextField
                            label="Not"
                            value={form.notlar ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, notlar: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={3}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={styles.dialogActions}>
                    <Button onClick={() => setFormOpen(false)} sx={styles.secondaryBtn}>
                        Vazgeç
                    </Button>

                    {canWrite && (
                        <Button onClick={saveForm} variant="contained" disableElevation sx={styles.primaryBtn}>
                            Kaydet
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* SOFT DELETE CONFIRM */}
            <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
                <DialogTitle sx={{ fontWeight: 900 }}>Pasif'e Alma Onayı</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "rgba(0,0,0,0.65)" }}>
                        <b>{deleteTarget?.ad_soyad}</b> kaydı PASİF'e alınacak. Emin misiniz?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Vazgeç</Button>

                    {can(BTN.DELETE) && (
                        <Button variant="contained" disableElevation color="error" onClick={doDelete}>
                            Pasif'e Al
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* SNACKBAR */}
            <Snackbar
                open={snack.open}
                autoHideDuration={2500}
                onClose={() => setSnack((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSnack((p) => ({ ...p, open: false }))}
                    severity={snack.type}
                    variant="filled"
                    sx={{ borderRadius: 2 }}
                >
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

/** --- Reusable Select --- */
function SelectField({ label, value, onChange, options, allowEmpty }) {
    return (
        <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select value={value} label={label} onChange={(e) => onChange(e.target.value)}>
                {allowEmpty && <MenuItem value="">(Boş)</MenuItem>}
                {options.map((x) => (
                    <MenuItem key={x} value={x}>
                        {x}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

function TextChip(v) {
    const label = String(v ?? "").trim() || "—";
    const positive = isTruthyText(label);

    return (
        <Chip
            size="small"
            label={label}
            sx={{
                borderRadius: "10px",
                fontWeight: 900,
                ...(positive
                    ? {
                        background: "rgba(34,197,94,0.12)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.22)",
                    }
                    : {
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.75)",
                        border: "1px solid rgba(255,255,255,0.12)",
                    }),
            }}
        />
    );
}

function StatuChip(v) {
    const s = String(v ?? "AKTİF").trim().toUpperCase();
    const isActive = s === "AKTİF";

    return (
        <Chip
            size="small"
            label={s || "AKTİF"}
            sx={{
                borderRadius: "10px",
                fontWeight: 950,
                ...(isActive
                    ? {
                        background: "rgba(34,197,94,0.12)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.22)",
                    }
                    : {
                        background: "rgba(239,68,68,0.12)",
                        color: "#fca5a5",
                        border: "1px solid rgba(239,68,68,0.22)",
                    }),
            }}
        />
    );
}

function isTruthyText(v) {
    const s = String(v ?? "").trim().toLowerCase();
    return s === "aktif" || s === "var" || s === "true" || s === "1" || s === "evet" || s === "yes";
}

function safeText(v) {
    const s = String(v ?? "").trim();
    return s ? s : "—";
}

function makeSearchText(r) {
    return [
        r.cekici,
        r.dorse,
        r.statu,
        r.tc_no,
        r.ad_soyad,
        r.telefon,
        r.ise_baslama_tarihi,
        r.vkn,
        r.muayene,
        r.notlar,
        r.hgs,
        r.yakit,
        r.gps,
        r.isi_sensoru,
        r.istasyon,
    ]
        .map((x) => String(x ?? ""))
        .join(" ")
        .toLowerCase();
}

function blankForm() {
    return {
        id: null,
        cekici: "",
        dorse: "",
        statu: "AKTİF",
        tc_no: "",
        ad_soyad: "",
        telefon: "",
        ise_baslama_tarihi: "",
        vkn: "",
        muayene: "",
        notlar: "",
        hgs: "",
        yakit: "",
        gps: "",
        isi_sensoru: "",
        istasyon: "",
        created_at: null,
        updated_at: null,
    };
}

function pickPlakaPayload(x) {
    return {
        id: x.id ?? null,
        cekici: x.cekici ?? "",
        dorse: x.dorse ?? "",
        statu: x.statu ?? "AKTİF",
        tc_no: x.tc_no ?? "",
        ad_soyad: x.ad_soyad ?? "",
        telefon: x.telefon ?? "",
        ise_baslama_tarihi: x.ise_baslama_tarihi ?? "",
        vkn: x.vkn ?? "",
        muayene: x.muayene ?? "",
        notlar: x.notlar ?? "",
        hgs: x.hgs ?? "",
        yakit: x.yakit ?? "",
        gps: x.gps ?? "",
        isi_sensoru: x.isi_sensoru ?? "",
        istasyon: x.istasyon ?? "",
        created_at: x.created_at ?? null,
        updated_at: x.updated_at ?? null,
    };
}

function sortHint(sort, key) {
    if (sort.key !== key) return "";
    return sort.dir === "asc" ? "▲" : "▼";
}

function KpiCard({ title, value, icon, accent = "primary" }) {
    const accentMap = {
        primary: { main: "#3b82f6", glow: "rgba(59,130,246,0.35)" },
        success: { main: "#22c55e", glow: "rgba(34,197,94,0.30)" },
        info: { main: "#06b6d4", glow: "rgba(6,182,212,0.30)" },
        neutral: { main: "#94a3b8", glow: "rgba(148,163,184,0.25)" },
    };
    const c = accentMap[accent] || accentMap.primary;

    return (
        <Card sx={styles.kpiCard}>
            <Box sx={styles.kpiInner}>
                <Box
                    sx={{
                        ...styles.kpiIcon,
                        background: `linear-gradient(135deg, ${c.main} 0%, ${alpha(c.main, 0.65)} 100%)`,
                        boxShadow: `0 14px 30px ${c.glow}`,
                    }}
                >
                    {icon}
                </Box>
                <Box>
                    <Typography sx={styles.kpiTitle}>{title}</Typography>
                    <Typography sx={styles.kpiValue}>{value}</Typography>
                </Box>
            </Box>
        </Card>
    );
}

function InfoRow({ label, value }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 700 }}>
                {label}
            </Typography>
            <Box sx={{ color: "#fff", fontWeight: 800, textAlign: "right" }}>{value}</Box>
        </Box>
    );
}

const styles = {
    page: {
        p: { xs: 2, md: 5 },
        background: "radial-gradient(circle at top left, #1a1c2c 0%, #02040a 100%)",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
        mb: 3,
    },
    title: {
        fontSize: "1.85rem",
        fontWeight: 900,
        letterSpacing: "-0.03em",
        background: "linear-gradient(90deg, #fff, #94a3b8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },
    subtitle: { fontSize: "0.9rem", color: "rgba(255,255,255,0.55)", mt: 0.3 },
    iconBox: {
        width: 54,
        height: 54,
        borderRadius: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        boxShadow: "0 10px 24px rgba(59, 130, 246, 0.32)",
        color: "#fff",
    },
    addButton: {
        textTransform: "none",
        fontWeight: 800,
        borderRadius: "14px",
        px: 3,
        py: 1.15,
        background: "#fff",
        color: "#0b1220",
        "&:hover": { background: "#e2e8f0" },
    },

    kpiGrid: {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
        gap: 2,
        mb: 3,
    },
    kpiCard: {
        background: "rgba(255, 255, 255, 0.035)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 45px rgba(0,0,0,0.38)",
        overflow: "hidden",
    },
    kpiInner: { p: 2.2, display: "flex", alignItems: "center", gap: 1.8 },
    kpiIcon: {
        width: 44,
        height: 44,
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        "& svg": { fontSize: 22, color: "#fff" },
    },
    kpiTitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 800 },
    kpiValue: { fontSize: 22, fontWeight: 950, letterSpacing: "-0.02em", mt: 0.2 },

    filterRow: { display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2.5, alignItems: "center" },
    searchField: {
        width: { xs: "100%", sm: 460 },
        "& .MuiOutlinedInput-root": {
            color: "#fff",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "14px",
            "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
        },
    },
    segment: {
        "& .MuiToggleButton-root": {
            color: "rgba(255,255,255,0.75)",
            borderColor: "rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "14px !important",
            px: 1.6,
            py: 0.9,
            textTransform: "none",
            fontWeight: 900,
            "&.Mui-selected": {
                color: "#fff",
                background: "rgba(59,130,246,0.22)",
                borderColor: "rgba(59,130,246,0.35)",
            },
            "&:hover": { background: "rgba(255,255,255,0.06)" },
        },
    },
    filterButton: {
        background: "rgba(255,255,255,0.06)",
        borderRadius: "14px",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)",
        "&:hover": { background: "rgba(255,255,255,0.09)" },
    },

    tableCard: {
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(14px)",
        borderRadius: "22px",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 22px 50px rgba(0,0,0,0.45)",
        overflow: "auto",
        maxHeight: { xs: "calc(100vh - 360px)", md: "calc(100vh - 330px)" },
        "&::-webkit-scrollbar": { height: 10, width: 10 },
        "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.14)", borderRadius: 20 },
        "&::-webkit-scrollbar-track": { background: "rgba(255,255,255,0.04)" },
    },

    headCell: {
        color: "rgba(255,255,255,0.55)",
        fontSize: "0.72rem",
        fontWeight: 900,
        letterSpacing: "0.12em",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(12,16,30,0.85)",
        backdropFilter: "blur(10px)",
        py: 1.8,
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        "&:hover": { color: "rgba(255,255,255,0.9)" },
    },
    tableRow: {
        "&:hover": { background: "rgba(255,255,255,0.03)" },
        "& td": { borderBottom: "1px solid rgba(255,255,255,0.05)", py: 1.7, verticalAlign: "top" },
        cursor: "pointer",
    },

    plakaBadge: {
        display: "inline-block",
        padding: "5px 12px",
        borderRadius: "10px",
        background: "rgba(30,41,59,0.65)",
        border: "1px solid rgba(51,65,85,0.55)",
        color: "#f8fafc",
        fontWeight: 900,
        fontSize: "0.92rem",
        fontFamily: "'Roboto Mono', monospace",
        whiteSpace: "nowrap",
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: "12px",
        background: "rgba(59,130,246,0.18)",
        border: "1px solid rgba(59,130,246,0.25)",
        color: "#fff",
        fontWeight: 900,
    },
    cellSoft: { color: "rgba(255,255,255,0.82)", fontWeight: 650, whiteSpace: "nowrap" },

    actionInfo: {
        color: "#94a3b8",
        background: "rgba(148, 163, 184, 0.12)",
        "&:hover": { background: "rgba(148, 163, 184, 0.20)" },
    },
    actionEdit: {
        color: "#3b82f6",
        background: "rgba(59, 130, 246, 0.12)",
        "&:hover": { background: "rgba(59, 130, 246, 0.20)" },
    },
    actionDelete: {
        color: "#ef4444",
        background: "rgba(239, 68, 68, 0.12)",
        "&:hover": { background: "rgba(239, 68, 68, 0.20)" },
    },

    drawerPaper: {
        width: { xs: "100%", sm: 380 },
        background: "linear-gradient(180deg, rgba(14,18,32,0.98) 0%, rgba(9,12,22,0.98) 100%)",
        color: "#fff",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
    },
    detailPaper: {
        width: { xs: "100%", sm: 420 },
        background: "linear-gradient(180deg, rgba(14,18,32,0.98) 0%, rgba(9,12,22,0.98) 100%)",
        color: "#fff",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
    },
    drawerHeader: { px: 2.5, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" },
    drawerClose: {
        color: "rgba(255,255,255,0.85)",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "12px",
        "&:hover": { background: "rgba(255,255,255,0.10)" },
    },
    inputLabel: { color: "rgba(255,255,255,0.65)" },
    select: {
        color: "#fff",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "14px",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.22)" },
    },

    primaryBtn: {
        textTransform: "none",
        fontWeight: 900,
        borderRadius: "14px",
        px: 2.2,
        py: 1.15,
        background: "#3b82f6",
        "&:hover": { background: "#2563eb" },
    },
    secondaryBtn: {
        textTransform: "none",
        fontWeight: 900,
        borderRadius: "14px",
        borderColor: "rgba(255,255,255,0.18)",
        color: "#0b1220",
        background: "#fff",
        "&:hover": { background: "#e2e8f0" },
    },
    dangerOutline: {
        textTransform: "none",
        fontWeight: 900,
        borderRadius: "14px",
        borderColor: "rgba(239,68,68,0.45)",
        color: "#ef4444",
        "&:hover": { borderColor: "rgba(239,68,68,0.75)", background: "rgba(239,68,68,0.08)" },
    },

    dialogTitle: { fontWeight: 950 },
    dialogContent: { background: "#fff" },
    dialogActions: { px: 3, pb: 2.5, background: "#fff" },
};