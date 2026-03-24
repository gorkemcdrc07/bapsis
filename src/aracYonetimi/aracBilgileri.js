import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    Add,
    Close,
    DeleteOutline,
    DirectionsCarFilledRounded,
    Edit,
    FilterListRounded,
    InfoOutlined,
    Inventory2Rounded,
    LocalShippingRounded,
    RefreshRounded,
    Search,
    ViewAgendaRounded,
    ViewModuleRounded,
    TuneRounded,
    PersonRounded,
    TimelineRounded,
    CheckCircleRounded,
    WarningAmberRounded,
    ChevronLeftRounded,
    ChevronRightRounded,
} from "@mui/icons-material";

import { supabase } from "../supabase";

const EKRAN_KOD = "aracbilgileri";
const PAGE_SIZE = 50;

const BTN = {
    CREATE: "aracbilgileri.create",
    OPEN_DETAIL: "aracbilgileri.open_detail",
    EDIT: "aracbilgileri.edit",
    DELETE: "aracbilgileri.delete",
    FILTER: "aracbilgileri.filter",
};

const STATUS_OPTIONS = ["AKTİF", "PASİF", "VAR", "YOK"];
const REQUIRED_FIELDS_VEHICLE = ["cekici", "ad_soyad", "tc_no"];
const REQUIRED_FIELDS_DRIVER = ["ad_soyad", "tc_no"];
const SEGMENTS = [
    { key: "all", label: "Tümü" },
    { key: "cekici", label: "Çekici" },
    { key: "dorse", label: "Dorse" },
    { key: "driver", label: "Sürücü" },
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

export default function AracBilgileriModern() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [permLoading, setPermLoading] = useState(true);
    const [canShow, setCanShow] = useState(false);
    const [btnPerms, setBtnPerms] = useState({});

    const [activeSegment, setActiveSegment] = useState("all");
    const [viewMode, setViewMode] = useState("list");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedStation, setSelectedStation] = useState("Hepsi");
    const [selectedStatus, setSelectedStatus] = useState("Hepsi");
    const [selectedGps, setSelectedGps] = useState("Hepsi");
    const [showOnlyAttention, setShowOnlyAttention] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    const [sort, setSort] = useState({ key: "updated_at", dir: "desc" });
    const [detail, setDetail] = useState(null);

    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("create");
    const [createType, setCreateType] = useState("vehicle");
    const [form, setForm] = useState(blankForm());

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [snack, setSnack] = useState({ open: false, type: "success", msg: "" });

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const can = useCallback(
        (btnKod) => {
            if (!canShow) return false;
            return btnPerms?.[btnKod] === true;
        },
        [btnPerms, canShow]
    );

    const canWrite = useMemo(() => can(BTN.CREATE) || can(BTN.EDIT) || can(BTN.DELETE), [can]);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 300);

        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(0);
    }, [activeSegment, selectedStation, selectedStatus, selectedGps, debouncedSearch, sort, showOnlyAttention]);

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
            } catch (error) {
                console.error("Yetki yükleme hatası:", error);
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

    const loadRows = useCallback(async () => {
        if (!canShow) return;

        try {
            setLoading(true);
            setLoadError("");

            let query = supabase.from("plakalar").select("*", { count: "exact" });

            if (activeSegment === "cekici") {
                query = query.not("cekici", "is", null).neq("cekici", "");
            }

            if (activeSegment === "dorse") {
                query = query.not("dorse", "is", null).neq("dorse", "");
            }

            if (activeSegment === "driver") {
                query = query.or("ad_soyad.not.is.null,tc_no.not.is.null");
            }

            if (selectedStation !== "Hepsi") {
                query = query.eq("istasyon", selectedStation);
            }

            if (selectedStatus !== "Hepsi") {
                query = query.eq("statu", selectedStatus);
            }

            if (selectedGps !== "Hepsi") {
                if (selectedGps === "VAR") {
                    query = query.in("gps", ["VAR", "var", "Aktif", "AKTİF", "aktif", "true", "1", "Evet", "EVET", "evet", "Yes", "YES"]);
                } else {
                    query = query.or("gps.is.null,gps.eq.,gps.eq.YOK,gps.eq.yok,gps.eq.false,gps.eq.0");
                }
            }

            if (debouncedSearch) {
                const q = escapeLike(debouncedSearch);
                query = query.or(
                    [
                        `cekici.ilike.%${q}%`,
                        `dorse.ilike.%${q}%`,
                        `ad_soyad.ilike.%${q}%`,
                        `tc_no.ilike.%${q}%`,
                        `telefon.ilike.%${q}%`,
                        `vkn.ilike.%${q}%`,
                        `istasyon.ilike.%${q}%`,
                        `muayene.ilike.%${q}%`,
                        `notlar.ilike.%${q}%`,
                    ].join(",")
                );
            }

            const sortKey = ["id", "cekici", "dorse", "statu", "tc_no", "ad_soyad", "telefon", "istasyon", "updated_at", "created_at"].includes(sort.key)
                ? sort.key
                : "updated_at";

            query = query.order(sortKey, {
                ascending: sort.dir === "asc",
                nullsFirst: false,
            });

            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            let result = (data || []).map(normalizeRow);

            if (showOnlyAttention) {
                result = result.filter(needsAttention);
            }

            setRows(result);
            setTotalCount(count || 0);
        } catch (error) {
            console.error(error);
            setLoadError(error?.message || "Veri çekilemedi");
        } finally {
            setLoading(false);
        }
    }, [
        canShow,
        activeSegment,
        selectedStation,
        selectedStatus,
        selectedGps,
        debouncedSearch,
        sort,
        page,
        showOnlyAttention,
    ]);

    useEffect(() => {
        if (canShow) loadRows();
    }, [canShow, loadRows]);

    const stationOptions = useMemo(() => {
        const set = new Set(rows.map((r) => r.istasyon).filter(Boolean));
        return ["Hepsi", ...Array.from(set).sort((a, b) => a.localeCompare(b, "tr"))];
    }, [rows]);

    const processed = rows;

    const kpis = useMemo(() => {
        const total = totalCount;
        const active = rows.filter((r) => r.statu === "AKTİF").length;
        const dorseCount = rows.filter((r) => !!r.dorse).length;
        const cekiciCount = rows.filter((r) => !!r.cekici).length;
        const gpsVar = rows.filter((r) => isTruthyText(r.gps)).length;
        const attention = rows.filter(needsAttention).length;
        return { total, active, dorseCount, cekiciCount, gpsVar, attention };
    }, [rows, totalCount]);

    const smartCounts = useMemo(
        () => ({
            cekici: processed.filter((r) => !!r.cekici).length,
            dorse: processed.filter((r) => !!r.dorse).length,
            driver: processed.filter((r) => !!r.ad_soyad).length,
        }),
        [processed]
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    function openCreate(type = "vehicle") {
        if (!can(BTN.CREATE)) return;
        setCreateType(type);
        setFormMode("create");
        setForm(blankForm());
        setFormOpen(true);
    }

    function openEdit(row) {
        if (!can(BTN.EDIT)) return;
        setCreateType("vehicle");
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

        const requiredFields = createType === "driver" ? REQUIRED_FIELDS_DRIVER : REQUIRED_FIELDS_VEHICLE;
        const missing = requiredFields.find((key) => !String(form[key] ?? "").trim());

        if (missing) {
            setSnack({
                open: true,
                type: "warning",
                msg:
                    createType === "driver"
                        ? "Sürücü Adı ve Sürücü TC zorunlu."
                        : "Çekici, Sürücü Adı ve Sürücü TC zorunlu.",
            });
            return;
        }

        try {
            setLoading(true);
            const payload = pickPlakaPayload(form);

            if (formMode === "create") {
                delete payload.id;
                delete payload.created_at;
                delete payload.updated_at;
                if (!String(payload.statu ?? "").trim()) payload.statu = "AKTİF";

                const { data, error } = await supabase.from("plakalar").insert(payload).select("*").single();
                if (error) throw error;

                setRows((prev) => [normalizeRow(data), ...prev.slice(0, PAGE_SIZE - 1)]);
                setSnack({
                    open: true,
                    type: "success",
                    msg: createType === "driver" ? "Şoför kaydı eklendi." : "Araç kaydı eklendi.",
                });
            } else {
                const rowId = payload.id;
                if (!rowId) {
                    setSnack({ open: true, type: "error", msg: "ID bulunamadı (edit)." });
                    return;
                }

                delete payload.id;
                delete payload.created_at;
                payload.updated_at = new Date().toISOString();

                const { data, error } = await supabase
                    .from("plakalar")
                    .update(payload)
                    .eq("id", rowId)
                    .select("*")
                    .single();

                if (error) throw error;

                const normalized = normalizeRow(data);

                setRows((prev) => prev.map((r) => (r.id === normalized.id ? normalized : r)));
                if (detail?.id === normalized.id) setDetail(normalized);
                setSnack({ open: true, type: "success", msg: "Kayıt güncellendi." });
            }

            setFormOpen(false);
        } catch (error) {
            console.error(error);
            setSnack({ open: true, type: "error", msg: error?.message || "Kaydedilemedi" });
        } finally {
            setLoading(false);
        }
    }

    async function doDelete() {
        if (!can(BTN.DELETE) || !deleteTarget?.id) return;

        try {
            setLoading(true);
            const { error } = await supabase.from("plakalar").delete().eq("id", deleteTarget.id);
            if (error) throw error;

            setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            if (detail?.id === deleteTarget.id) setDetail(null);

            setDeleteTarget(null);
            setSnack({ open: true, type: "success", msg: "Kayıt silindi." });

            if (page > 0 && rows.length === 1) {
                setPage((p) => Math.max(0, p - 1));
            } else {
                loadRows();
            }
        } catch (error) {
            console.error(error);
            setSnack({ open: true, type: "error", msg: error?.message || "Silme işlemi başarısız" });
        } finally {
            setLoading(false);
        }
    }

    function resetFilters() {
        setSelectedStation("Hepsi");
        setSelectedStatus("Hepsi");
        setSelectedGps("Hepsi");
        setShowOnlyAttention(false);
        setSearch("");
    }

    if (permLoading) {
        return (
            <Box sx={styles.pageCenter}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress />
                    <Typography sx={styles.loadingText}>Yetkiler yükleniyor...</Typography>
                </Stack>
            </Box>
        );
    }

    if (!canShow) {
        return (
            <Box sx={styles.pageCenter}>
                <Typography sx={styles.loadingText}>Bu ekrana erişim yetkiniz yok.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={styles.page}>
            <Box sx={styles.shell}>
                <Box sx={styles.hero}>
                    <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={3}>
                        <Stack spacing={2.2} sx={{ minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Box sx={styles.heroIcon}>
                                    <DirectionsCarFilledRounded />
                                </Box>
                                <Box>
                                    <Typography sx={styles.heroTitle}>Filo Yönetim Merkezi</Typography>
                                    <Typography sx={styles.heroSubtitle}>
                                        Çekici, dorse ve sürücü kayıtlarını tek akışta yönetin. Hızlı erişim, akıllı filtre ve modern detay paneli.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                                <SoftStat icon={<LocalShippingRounded />} label="Toplam Kayıt" value={kpis.total} />
                                <SoftStat icon={<CheckCircleRounded />} label="Sayfadaki Aktif" value={kpis.active} />
                                <SoftStat icon={<Inventory2Rounded />} label="Sayfadaki Dorse" value={kpis.dorseCount} />
                                <SoftStat
                                    icon={<TimelineRounded />}
                                    label="Sayfadaki Dikkat"
                                    value={kpis.attention}
                                    danger={kpis.attention > 0}
                                />
                            </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignSelf={{ lg: "flex-start" }}>
                            {can(BTN.CREATE) && (
                                <>
                                    <Button
                                        startIcon={<Add />}
                                        variant="contained"
                                        disableElevation
                                        sx={styles.primaryButton}
                                        onClick={() => openCreate("vehicle")}
                                    >
                                        Yeni Araç
                                    </Button>
                                    <Button
                                        startIcon={<PersonRounded />}
                                        variant="outlined"
                                        sx={styles.secondaryButton}
                                        onClick={() => openCreate("driver")}
                                    >
                                        Şoför Ekle
                                    </Button>
                                </>
                            )}
                            <Tooltip title="Yenile">
                                <span>
                                    <IconButton sx={styles.iconButton} onClick={loadRows} disabled={loading}>
                                        <RefreshRounded />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Box>

                <Card sx={styles.workspace}>
                    {loading && <LinearProgress sx={styles.progress} />}

                    <Box sx={styles.toolbar}>
                        <Tabs
                            value={activeSegment}
                            onChange={(_, value) => setActiveSegment(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={styles.tabs}
                        >
                            {SEGMENTS.map((item) => (
                                <Tab
                                    key={item.key}
                                    value={item.key}
                                    label={
                                        item.key === "cekici"
                                            ? `${item.label} • ${smartCounts.cekici}`
                                            : item.key === "dorse"
                                                ? `${item.label} • ${smartCounts.dorse}`
                                                : item.key === "driver"
                                                    ? `${item.label} • ${smartCounts.driver}`
                                                    : item.label
                                    }
                                />
                            ))}
                        </Tabs>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ width: { xs: "100%", xl: "auto" } }}>
                            <TextField
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Plaka, sürücü, TC, telefon, VKN, istasyon ara..."
                                size="small"
                                sx={styles.searchField}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: "rgba(255,255,255,0.5)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Stack direction="row" spacing={1.1}>
                                <Tooltip title="Filtreler">
                                    <IconButton sx={styles.iconButton} onClick={() => setFilterOpen(true)}>
                                        <TuneRounded />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Kart görünümü">
                                    <IconButton sx={viewMode === "cards" ? styles.iconButtonActive : styles.iconButton} onClick={() => setViewMode("cards")}>
                                        <ViewModuleRounded />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Liste görünümü">
                                    <IconButton sx={viewMode === "list" ? styles.iconButtonActive : styles.iconButton} onClick={() => setViewMode("list")}>
                                        <ViewAgendaRounded />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Box>

                    <Box sx={styles.quickFiltersRow}>
                        <Chip label={`İstasyon: ${selectedStation}`} sx={styles.filterChip} />
                        <Chip label={`Statü: ${selectedStatus}`} sx={styles.filterChip} />
                        <Chip label={`GPS: ${selectedGps}`} sx={styles.filterChip} />
                        {showOnlyAttention && <Chip label="Sadece dikkat gereken" sx={styles.attentionChip} />}
                        <Chip label={`${processed.length} kayıt / sayfa`} sx={styles.counterChip} />
                    </Box>

                    {loadError && (
                        <Alert severity="error" sx={styles.alertBox}>
                            {loadError}
                        </Alert>
                    )}

                    <Box sx={styles.contentArea}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {processed.length === 0 && !loading ? (
                                <Box sx={styles.emptyState}>
                                    <WarningAmberRounded sx={{ fontSize: 36, color: "#fbbf24" }} />
                                    <Typography sx={{ fontWeight: 900, color: "#fff" }}>Kayıt bulunamadı</Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.58)", textAlign: "center", maxWidth: 420 }}>
                                        Filtreleri sadeleştirin veya yeni araç / şoför kaydı ekleyin.
                                    </Typography>
                                    <Button variant="outlined" sx={styles.secondaryButton} onClick={resetFilters}>
                                        Filtreleri Sıfırla
                                    </Button>
                                </Box>
                            ) : viewMode === "cards" ? (
                                <Box sx={styles.cardsGrid}>
                                    {processed.map((row) => (
                                        <VehicleCard
                                            key={row.id}
                                            row={row}
                                            can={can}
                                            onOpen={openDetail}
                                            onEdit={openEdit}
                                            onDelete={setDeleteTarget}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Stack spacing={1.2}>
                                    {processed.map((row) => (
                                        <VehicleListRow
                                            key={row.id}
                                            row={row}
                                            can={can}
                                            onOpen={openDetail}
                                            onEdit={openEdit}
                                            onDelete={setDeleteTarget}
                                        />
                                    ))}
                                </Stack>
                            )}

                            <Box sx={styles.paginationWrap}>
                                <Stack direction="row" spacing={1.2} justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Typography sx={styles.paginationInfo}>
                                        Toplam: <b>{totalCount}</b> kayıt • Sayfa <b>{page + 1}</b> / <b>{totalPages}</b>
                                    </Typography>

                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            startIcon={<ChevronLeftRounded />}
                                            variant="outlined"
                                            sx={styles.secondaryButton}
                                            disabled={loading || page === 0}
                                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        >
                                            Önceki
                                        </Button>

                                        <Button
                                            endIcon={<ChevronRightRounded />}
                                            variant="outlined"
                                            sx={styles.secondaryButton}
                                            disabled={loading || page + 1 >= totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                        >
                                            Sonraki
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Box>

                        <Box sx={styles.sideInsights}>
                            <Typography sx={styles.panelTitle}>Canlı Özet</Typography>
                            <InsightCard title="Çekici Kayıtları" value={smartCounts.cekici} subtitle="Sayfadaki filtre sonucuna göre" icon={<DirectionsCarFilledRounded />} />
                            <InsightCard title="Dorse Kayıtları" value={smartCounts.dorse} subtitle="Sayfadaki filtre sonucuna göre" icon={<Inventory2Rounded />} />
                            <InsightCard title="GPS Takılı" value={processed.filter((r) => isTruthyText(r.gps)).length} subtitle="Sayfadaki filtre sonucu" icon={<TimelineRounded />} />
                            <InsightCard title="Eksik Bilgi" value={processed.filter(needsAttention).length} subtitle="Sayfadaki dikkat gereken kayıt" icon={<WarningAmberRounded />} danger />
                        </Box>
                    </Box>
                </Card>
            </Box>

            <Drawer anchor="right" open={filterOpen} onClose={() => setFilterOpen(false)} PaperProps={{ sx: styles.drawerPaper }}>
                <Box sx={styles.drawerHeader}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <FilterListRounded />
                        <Typography sx={styles.drawerTitle}>Akıllı Filtreler</Typography>
                    </Stack>
                    <IconButton sx={styles.drawerClose} onClick={() => setFilterOpen(false)}>
                        <Close />
                    </IconButton>
                </Box>
                <Divider sx={styles.divider} />

                <Stack spacing={2.2} sx={{ p: 2.2 }}>
                    <SelectField label="İstasyon" value={selectedStation} onChange={setSelectedStation} options={stationOptions} />
                    <SelectField label="Statü" value={selectedStatus} onChange={setSelectedStatus} options={["Hepsi", "AKTİF", "PASİF"]} />
                    <SelectField label="GPS" value={selectedGps} onChange={setSelectedGps} options={["Hepsi", "VAR", "YOK"]} />
                    <Button
                        variant={showOnlyAttention ? "contained" : "outlined"}
                        sx={showOnlyAttention ? styles.primaryButton : styles.secondaryButton}
                        onClick={() => setShowOnlyAttention((p) => !p)}
                        startIcon={<WarningAmberRounded />}
                    >
                        {showOnlyAttention ? "Dikkat Filtresi Açık" : "Sadece Dikkat Gerekenler"}
                    </Button>

                    <Stack direction="row" spacing={1.2}>
                        <Button fullWidth variant="contained" disableElevation sx={styles.primaryButton} onClick={() => setFilterOpen(false)}>
                            Uygula
                        </Button>
                        <Button fullWidth variant="outlined" sx={styles.secondaryButton} onClick={resetFilters}>
                            Sıfırla
                        </Button>
                    </Stack>
                </Stack>
            </Drawer>

            <Drawer anchor="right" open={Boolean(detail)} onClose={() => setDetail(null)} PaperProps={{ sx: styles.detailDrawer }}>
                {detail && (
                    <Box>
                        <Box sx={styles.detailHero}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                                <Stack direction="row" spacing={1.4} alignItems="center">
                                    <Avatar sx={styles.detailAvatar}>{safeText(detail.ad_soyad).charAt(0)}</Avatar>
                                    <Box>
                                        <Typography sx={styles.detailName}>{safeText(detail.ad_soyad)}</Typography>
                                        <Typography sx={styles.detailSub}>
                                            {safeText(detail.tc_no)} • {safeText(detail.telefon)}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <IconButton sx={styles.drawerClose} onClick={() => setDetail(null)}>
                                    <Close />
                                </IconButton>
                            </Stack>

                            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" useFlexGap>
                                {StatuChip(detail.statu)}
                                {TextChip(detail.gps, "GPS")}
                                {TextChip(detail.hgs, "HGS")}
                                {TextChip(detail.yakit, "Yakıt")}
                            </Stack>
                        </Box>

                        <Box sx={{ p: 2.2 }}>
                            <Typography sx={styles.panelTitle}>Kayıt Özeti</Typography>
                            <DetailGrid row={detail} />

                            {(can(BTN.EDIT) || can(BTN.DELETE)) && (
                                <Stack direction="row" spacing={1.2} mt={2.2}>
                                    {can(BTN.EDIT) && (
                                        <Button fullWidth variant="contained" disableElevation sx={styles.primaryButton} startIcon={<Edit />} onClick={() => openEdit(detail)}>
                                            Düzenle
                                        </Button>
                                    )}
                                    {can(BTN.DELETE) && (
                                        <Button fullWidth variant="outlined" sx={styles.dangerButton} startIcon={<DeleteOutline />} onClick={() => setDeleteTarget(detail)}>
                                            Sil
                                        </Button>
                                    )}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}
            </Drawer>

            <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: styles.dialogPaper }}>
                <DialogTitle sx={styles.dialogTitle}>
                    {formMode === "create" ? (createType === "driver" ? "Yeni Şoför Kaydı" : "Yeni Araç Kaydı") : "Kaydı Düzenle"}
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Stack spacing={2}>
                        {createType !== "driver" && (
                            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                <StyledField label="Çekici Plaka" value={form.cekici} onChange={(value) => setForm((p) => ({ ...p, cekici: value }))} />
                                <StyledField label="Dorse Plaka" value={form.dorse} onChange={(value) => setForm((p) => ({ ...p, dorse: value }))} />
                            </Stack>
                        )}

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <StyledField label="Sürücü TC" value={form.tc_no} onChange={(value) => setForm((p) => ({ ...p, tc_no: value }))} />
                            <StyledField label="Sürücü Adı" value={form.ad_soyad} onChange={(value) => setForm((p) => ({ ...p, ad_soyad: value }))} />
                            <StyledField label="Telefon" value={form.telefon} onChange={(value) => setForm((p) => ({ ...p, telefon: value }))} />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <StyledField label="İşe Başlama Tarihi" value={form.ise_baslama_tarihi} onChange={(value) => setForm((p) => ({ ...p, ise_baslama_tarihi: value }))} />
                            <StyledField label="VKN" value={form.vkn} onChange={(value) => setForm((p) => ({ ...p, vkn: value }))} />
                            <StyledField label="Muayene" value={form.muayene} onChange={(value) => setForm((p) => ({ ...p, muayene: value }))} />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <SelectField label="Statü" value={form.statu ?? "AKTİF"} onChange={(value) => setForm((p) => ({ ...p, statu: value }))} options={["AKTİF", "PASİF"]} />
                            <SelectField
                                label="İstasyon"
                                value={form.istasyon ?? ""}
                                onChange={(value) => setForm((p) => ({ ...p, istasyon: value }))}
                                options={stationOptions.filter((x) => x !== "Hepsi")}
                                allowEmpty
                            />
                            <SelectField label="HGS" value={form.hgs ?? ""} onChange={(value) => setForm((p) => ({ ...p, hgs: value }))} options={STATUS_OPTIONS} allowEmpty />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <SelectField label="Yakıt" value={form.yakit ?? ""} onChange={(value) => setForm((p) => ({ ...p, yakit: value }))} options={STATUS_OPTIONS} allowEmpty />
                            <SelectField label="GPS" value={form.gps ?? ""} onChange={(value) => setForm((p) => ({ ...p, gps: value }))} options={STATUS_OPTIONS} allowEmpty />
                            <SelectField
                                label="Isı Sensörü"
                                value={form.isi_sensoru ?? ""}
                                onChange={(value) => setForm((p) => ({ ...p, isi_sensoru: value }))}
                                options={STATUS_OPTIONS}
                                allowEmpty
                            />
                        </Stack>

                        <TextField
                            label="Notlar"
                            multiline
                            minRows={3}
                            value={form.notlar ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, notlar: e.target.value }))}
                            sx={styles.field}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.2 }}>
                    <Button onClick={() => setFormOpen(false)} sx={styles.secondaryButton}>
                        Vazgeç
                    </Button>
                    {canWrite && (
                        <Button variant="contained" disableElevation sx={styles.primaryButton} onClick={saveForm}>
                            Kaydet
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: styles.confirmDialog }}>
                <DialogTitle sx={styles.dialogTitle}>Silme Onayı</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                        <b>{deleteTarget?.ad_soyad || deleteTarget?.cekici || "Kayıt"}</b> kalıcı olarak silinecek. Emin misiniz?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2.2 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={styles.secondaryButton}>
                        Vazgeç
                    </Button>
                    <Button color="error" variant="contained" disableElevation onClick={doDelete}>
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snack.open}
                autoHideDuration={2600}
                onClose={() => setSnack((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert severity={snack.type} variant="filled" onClose={() => setSnack((p) => ({ ...p, open: false }))}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

function VehicleCard({ row, can, onOpen, onEdit, onDelete }) {
    const attention = needsAttention(row);

    return (
        <Card sx={styles.vehicleCard}>
            <CardContent sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.2}>
                    <Stack spacing={1} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <PlateBadge label={safeText(row.cekici)} accent="blue" />
                            <PlateBadge label={safeText(row.dorse)} accent="slate" />
                        </Stack>
                        <Typography sx={styles.vehicleName}>{safeText(row.ad_soyad)}</Typography>
                        <Typography sx={styles.vehicleMeta}>
                            {safeText(row.tc_no)} • {safeText(row.telefon)}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.8}>
                        {can(BTN.OPEN_DETAIL) && (
                            <Tooltip title="Detay">
                                <IconButton sx={styles.rowAction} onClick={() => onOpen(row)}>
                                    <InfoOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {can(BTN.EDIT) && (
                            <Tooltip title="Düzenle">
                                <IconButton sx={styles.rowAction} onClick={() => onEdit(row)}>
                                    <Edit fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {can(BTN.DELETE) && (
                            <Tooltip title="Sil">
                                <IconButton sx={styles.rowDanger} onClick={() => onDelete(row)}>
                                    <DeleteOutline fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1.5}>
                    {StatuChip(row.statu)}
                    {TextChip(row.gps, "GPS")}
                    {TextChip(row.hgs, "HGS")}
                    {TextChip(row.yakit, "Yakıt")}
                </Stack>

                <Box sx={styles.cardInfoGrid}>
                    <MiniInfo label="İstasyon" value={safeText(row.istasyon)} />
                    <MiniInfo label="VKN" value={safeText(row.vkn)} />
                    <MiniInfo label="Muayene" value={safeText(row.muayene)} />
                    <MiniInfo label="İşe Başlama" value={safeText(row.ise_baslama_tarihi)} />
                </Box>

                {attention && (
                    <Box sx={styles.attentionBox}>
                        <WarningAmberRounded sx={{ fontSize: 18, color: "#f59e0b" }} />
                        <Typography sx={styles.attentionText}>Bu kayıtta eksik veya kontrol edilmesi gereken bilgi var.</Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

function VehicleListRow({ row, can, onOpen, onEdit, onDelete }) {
    return (
        <Card sx={styles.listRow}>
            <Box sx={styles.listRowInner}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" sx={{ width: "100%" }}>
                    <Stack spacing={1} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <PlateBadge label={safeText(row.cekici)} accent="blue" />
                            <PlateBadge label={safeText(row.dorse)} accent="slate" />
                            {StatuChip(row.statu)}
                        </Stack>
                        <Typography sx={styles.vehicleName}>{safeText(row.ad_soyad)}</Typography>
                        <Typography sx={styles.vehicleMeta}>
                            {safeText(row.tc_no)} • {safeText(row.telefon)} • {safeText(row.istasyon)}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        {TextChip(row.gps, "GPS")}
                        {TextChip(row.hgs, "HGS")}
                        {can(BTN.OPEN_DETAIL) && (
                            <Button size="small" sx={styles.inlineButton} onClick={() => onOpen(row)}>
                                Detay
                            </Button>
                        )}
                        {can(BTN.EDIT) && (
                            <Button size="small" sx={styles.inlineButton} onClick={() => onEdit(row)}>
                                Düzenle
                            </Button>
                        )}
                        {can(BTN.DELETE) && (
                            <Button size="small" sx={styles.inlineDangerButton} onClick={() => onDelete(row)}>
                                Sil
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Box>
        </Card>
    );
}

function DetailGrid({ row }) {
    const items = [
        ["Çekici", safeText(row.cekici)],
        ["Dorse", safeText(row.dorse)],
        ["Sürücü", safeText(row.ad_soyad)],
        ["Sürücü TC", safeText(row.tc_no)],
        ["Telefon", safeText(row.telefon)],
        ["İstasyon", safeText(row.istasyon)],
        ["İşe Başlama", safeText(row.ise_baslama_tarihi)],
        ["VKN", safeText(row.vkn)],
        ["Muayene", safeText(row.muayene)],
        ["Isı Sensörü", safeText(row.isi_sensoru)],
        ["Not", safeText(row.notlar)],
    ];

    return (
        <Box sx={styles.detailGrid}>
            {items.map(([label, value]) => (
                <Box key={label} sx={styles.detailItem}>
                    <Typography sx={styles.detailLabel}>{label}</Typography>
                    <Typography sx={styles.detailValue}>{value}</Typography>
                </Box>
            ))}
        </Box>
    );
}

function InsightCard({ title, value, subtitle, icon, danger = false }) {
    return (
        <Card sx={danger ? styles.insightCardDanger : styles.insightCard}>
            <CardContent sx={{ p: 1.8 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography sx={styles.insightTitle}>{title}</Typography>
                        <Typography sx={styles.insightValue}>{value}</Typography>
                        <Typography sx={styles.insightSub}>{subtitle}</Typography>
                    </Box>
                    <Box sx={danger ? styles.insightIconDanger : styles.insightIcon}>{icon}</Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function SoftStat({ label, value, icon, danger = false }) {
    return (
        <Box sx={danger ? styles.softStatDanger : styles.softStat}>
            {icon}
            <Box>
                <Typography sx={styles.softStatLabel}>{label}</Typography>
                <Typography sx={styles.softStatValue}>{value}</Typography>
            </Box>
        </Box>
    );
}

function SelectField({ label, value, onChange, options, allowEmpty = false }) {
    return (
        <FormControl fullWidth>
            <InputLabel sx={styles.inputLabel}>{label}</InputLabel>
            <Select
                value={value}
                label={label}
                onChange={(e) => onChange(e.target.value)}
                sx={styles.select}
                MenuProps={{ PaperProps: { sx: styles.menuPaper } }}
            >
                {allowEmpty && <MenuItem value="">(Boş)</MenuItem>}
                {options.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

function StyledField({ label, value, onChange }) {
    return (
        <TextField
            label={label}
            fullWidth
            value={value}
            onChange={(e) => onChange(e.target.value)}
            sx={styles.field}
        />
    );
}

function PlateBadge({ label, accent = "blue" }) {
    const map = {
        blue: {
            bg: "rgba(59,130,246,0.12)",
            border: "rgba(59,130,246,0.28)",
            color: "#bfdbfe",
        },
        slate: {
            bg: "rgba(148,163,184,0.12)",
            border: "rgba(148,163,184,0.2)",
            color: "#e2e8f0",
        },
    };
    const c = map[accent] || map.blue;

    return <Chip label={label} sx={{ ...styles.plateBadge, background: c.bg, borderColor: c.border, color: c.color }} />;
}

function MiniInfo({ label, value }) {
    return (
        <Box sx={styles.miniInfoBox}>
            <Typography sx={styles.miniInfoLabel}>{label}</Typography>
            <Typography sx={styles.miniInfoValue}>{value}</Typography>
        </Box>
    );
}

function TextChip(v, prefix = "") {
    const raw = String(v ?? "").trim() || "—";
    const label = prefix ? `${prefix}: ${raw}` : raw;
    const active = isTruthyText(raw);
    return <Chip size="small" label={label} sx={active ? styles.successChip : styles.mutedChip} />;
}

function StatuChip(v) {
    const s = String(v ?? "AKTİF").trim().toUpperCase() || "AKTİF";
    return <Chip size="small" label={s} sx={s === "AKTİF" ? styles.activeChip : styles.passiveChip} />;
}

function normalizeRow(row) {
    return {
        ...row,
        cekici: String(row?.cekici ?? "").trim(),
        dorse: String(row?.dorse ?? "").trim(),
        statu: String(row?.statu ?? "AKTİF").trim().toUpperCase(),
        tc_no: String(row?.tc_no ?? "").trim(),
        ad_soyad: String(row?.ad_soyad ?? "").trim(),
        telefon: String(row?.telefon ?? "").trim(),
        istasyon: String(row?.istasyon ?? "").trim(),
        gps: String(row?.gps ?? "").trim(),
        hgs: String(row?.hgs ?? "").trim(),
        yakit: String(row?.yakit ?? "").trim(),
        muayene: String(row?.muayene ?? "").trim(),
        vkn: String(row?.vkn ?? "").trim(),
        notlar: String(row?.notlar ?? "").trim(),
        isi_sensoru: String(row?.isi_sensoru ?? "").trim(),
        ise_baslama_tarihi: String(row?.ise_baslama_tarihi ?? "").trim(),
        updated_at: row?.updated_at || row?.created_at || "",
    };
}

function needsAttention(row) {
    const noPlate = !row?.cekici && !row?.dorse;
    const noPhone = !String(row?.telefon ?? "").trim();
    const noStation = !String(row?.istasyon ?? "").trim();
    const noGps = !String(row?.gps ?? "").trim() || normalizedBinaryLabel(row?.gps) === "YOK";
    return noPlate || noPhone || noStation || noGps;
}

function normalizedBinaryLabel(v) {
    return isTruthyText(v) ? "VAR" : "YOK";
}

function isTruthyText(v) {
    const s = String(v ?? "").trim().toLowerCase();
    return ["aktif", "var", "true", "1", "evet", "yes"].includes(s);
}

function safeText(v) {
    const s = String(v ?? "").trim();
    return s || "—";
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

function escapeLike(text) {
    return String(text ?? "")
        .replaceAll("%", "")
        .replaceAll(",", " ")
        .trim();
}

const glass = "rgba(255,255,255,0.06)";
const border = "1px solid rgba(255,255,255,0.08)";

const styles = {
    page: {
        minHeight: "100vh",
        p: { xs: 2, md: 3 },
        background: "radial-gradient(circle at top left, #182033 0%, #090b12 42%, #05070d 100%)",
        color: "#fff",
    },
    pageCenter: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(circle at top left, #182033 0%, #090b12 42%, #05070d 100%)",
        color: "#fff",
    },
    loadingText: {
        fontWeight: 900,
        color: "#fff",
    },
    shell: {
        display: "grid",
        gap: 2,
    },
    hero: {
        p: { xs: 2, md: 3 },
        borderRadius: "28px",
        border,
        background: "linear-gradient(135deg, rgba(27,36,59,0.95), rgba(8,12,22,0.92))",
        boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
    },
    heroIcon: {
        width: 58,
        height: 58,
        borderRadius: "18px",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        boxShadow: "0 20px 50px rgba(37,99,235,0.35)",
        "& svg": { fontSize: 28 },
    },
    heroTitle: {
        fontSize: { xs: 26, md: 34 },
        fontWeight: 950,
        letterSpacing: "-0.03em",
    },
    heroSubtitle: {
        mt: 0.6,
        color: "rgba(255,255,255,0.65)",
        maxWidth: 760,
        lineHeight: 1.6,
    },
    softStat: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.4,
        py: 1.1,
        borderRadius: "16px",
        background: "rgba(255,255,255,0.06)",
        border,
        "& svg": { color: "#93c5fd" },
    },
    softStatDanger: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.4,
        py: 1.1,
        borderRadius: "16px",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.16)",
        "& svg": { color: "#fca5a5" },
    },
    softStatLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.58)",
        fontWeight: 800,
    },
    softStatValue: {
        fontSize: 18,
        fontWeight: 950,
    },
    workspace: {
        p: { xs: 1.4, md: 1.8 },
        borderRadius: "28px",
        border,
        background: "linear-gradient(180deg, rgba(10,14,23,0.95), rgba(5,8,14,0.97))",
        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        overflow: "hidden",
        position: "relative",
    },
    progress: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        background: "transparent",
        "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #3b82f6, #22c55e)" },
    },
    toolbar: {
        display: "flex",
        flexDirection: { xs: "column", xl: "row" },
        gap: 1.4,
        justifyContent: "space-between",
        alignItems: { xs: "stretch", xl: "center" },
        mb: 1.6,
    },
    tabs: {
        minHeight: 48,
        "& .MuiTabs-indicator": {
            height: 36,
            borderRadius: 999,
            background: "rgba(59,130,246,0.18)",
            border: "1px solid rgba(59,130,246,0.22)",
        },
        "& .MuiTab-root": {
            minHeight: 48,
            color: "rgba(255,255,255,0.62)",
            textTransform: "none",
            fontWeight: 900,
            zIndex: 1,
        },
        "& .Mui-selected": {
            color: "#fff !important",
        },
    },
    searchField: {
        minWidth: { xs: "100%", md: 380 },
        "& .MuiOutlinedInput-root": {
            color: "#fff",
            borderRadius: "16px",
            background: glass,
            "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
        },
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: "14px",
        color: "#fff",
        background: glass,
        border,
    },
    iconButtonActive: {
        width: 42,
        height: 42,
        borderRadius: "14px",
        color: "#fff",
        background: "rgba(59,130,246,0.18)",
        border: "1px solid rgba(59,130,246,0.24)",
    },
    primaryButton: {
        textTransform: "none",
        fontWeight: 900,
        borderRadius: "14px",
        px: 2.2,
        py: 1.15,
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    },
    secondaryButton: {
        textTransform: "none",
        fontWeight: 900,
        borderRadius: "14px",
        color: "#fff",
        borderColor: "rgba(255,255,255,0.16)",
        background: glass,
    },
    quickFiltersRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        mb: 1.8,
    },
    filterChip: {
        color: "#e5e7eb",
        background: "rgba(255,255,255,0.06)",
        border,
        fontWeight: 800,
    },
    attentionChip: {
        color: "#fde68a",
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.2)",
        fontWeight: 900,
    },
    counterChip: {
        ml: { md: "auto" },
        color: "#fff",
        background: "rgba(59,130,246,0.14)",
        border: "1px solid rgba(59,130,246,0.22)",
        fontWeight: 900,
    },
    alertBox: {
        mb: 1.5,
        borderRadius: "16px",
    },
    contentArea: {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 320px" },
        gap: 1.6,
        alignItems: "start",
    },
    cardsGrid: {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", "2xl": "repeat(3, minmax(0,1fr))" },
        gap: 1.4,
    },
    vehicleCard: {
        borderRadius: "22px",
        border,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
    },
    vehicleName: {
        color: "#fff",
        fontWeight: 900,
        fontSize: 16,
        lineHeight: 1.2,
    },
    vehicleMeta: {
        color: "rgba(255,255,255,0.58)",
        fontSize: 13,
    },
    rowAction: {
        width: 34,
        height: 34,
        color: "#cbd5e1",
        background: "rgba(255,255,255,0.06)",
    },
    rowDanger: {
        width: 34,
        height: 34,
        color: "#fca5a5",
        background: "rgba(239,68,68,0.12)",
    },
    cardInfoGrid: {
        mt: 1.6,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0,1fr))",
        gap: 1,
    },
    miniInfoBox: {
        p: 1.2,
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    miniInfoLabel: {
        color: "rgba(255,255,255,0.48)",
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
    miniInfoValue: {
        mt: 0.3,
        fontWeight: 800,
        color: "#fff",
        fontSize: 13,
    },
    attentionBox: {
        mt: 1.5,
        p: 1.2,
        borderRadius: "14px",
        display: "flex",
        gap: 1,
        alignItems: "center",
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.16)",
    },
    attentionText: {
        color: "#fde68a",
        fontWeight: 700,
        fontSize: 12.5,
    },
    listRow: {
        borderRadius: "20px",
        border,
        background: "rgba(255,255,255,0.03)",
    },
    listRowInner: {
        p: 1.5,
        display: "flex",
        alignItems: "center",
    },
    inlineButton: {
        textTransform: "none",
        color: "#bfdbfe",
        borderRadius: "12px",
        background: "rgba(59,130,246,0.12)",
        fontWeight: 900,
    },
    inlineDangerButton: {
        textTransform: "none",
        color: "#fca5a5",
        borderRadius: "12px",
        background: "rgba(239,68,68,0.12)",
        fontWeight: 900,
    },
    sideInsights: {
        display: "grid",
        gap: 1.2,
        position: { xl: "sticky" },
        top: { xl: 16 },
    },
    panelTitle: {
        color: "#fff",
        fontWeight: 900,
        fontSize: 15,
    },
    insightCard: {
        borderRadius: "18px",
        border,
        background: "rgba(255,255,255,0.035)",
    },
    insightCardDanger: {
        borderRadius: "18px",
        border: "1px solid rgba(239,68,68,0.16)",
        background: "rgba(239,68,68,0.06)",
    },
    insightTitle: {
        color: "rgba(255,255,255,0.54)",
        fontSize: 12,
        fontWeight: 800,
    },
    insightValue: {
        color: "#fff",
        fontSize: 24,
        fontWeight: 950,
        lineHeight: 1.2,
    },
    insightSub: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
    },
    insightIcon: {
        width: 42,
        height: 42,
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        color: "#bfdbfe",
        background: "rgba(59,130,246,0.12)",
    },
    insightIconDanger: {
        width: 42,
        height: 42,
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        color: "#fca5a5",
        background: "rgba(239,68,68,0.12)",
    },
    drawerPaper: {
        width: { xs: "100%", sm: 390 },
        background: "linear-gradient(180deg, rgba(14,18,32,0.98), rgba(7,10,18,0.98))",
        color: "#fff",
        borderLeft: border,
    },
    detailDrawer: {
        width: { xs: "100%", sm: 430 },
        background: "linear-gradient(180deg, rgba(14,18,32,0.98), rgba(7,10,18,0.98))",
        color: "#fff",
        borderLeft: border,
    },
    drawerHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 2.2,
    },
    drawerTitle: {
        fontWeight: 900,
        fontSize: 16,
    },
    drawerClose: {
        color: "#fff",
        background: "rgba(255,255,255,0.06)",
        border,
    },
    divider: {
        borderColor: "rgba(255,255,255,0.08)",
    },
    detailHero: {
        p: 2.2,
        background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(15,23,42,0.25))",
        borderBottom: border,
    },
    detailAvatar: {
        width: 48,
        height: 48,
        borderRadius: "16px",
        background: "rgba(59,130,246,0.2)",
        color: "#fff",
        fontWeight: 950,
    },
    detailName: {
        fontWeight: 950,
        fontSize: 18,
    },
    detailSub: {
        color: "rgba(255,255,255,0.58)",
        fontSize: 12.5,
    },
    detailGrid: {
        mt: 1.2,
        display: "grid",
        gap: 1,
    },
    detailItem: {
        p: 1.2,
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    detailLabel: {
        color: "rgba(255,255,255,0.48)",
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
    detailValue: {
        mt: 0.5,
        color: "#fff",
        fontWeight: 800,
    },
    dialogPaper: {
        borderRadius: "26px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
        border,
        color: "#fff",
    },
    confirmDialog: {
        borderRadius: "22px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
        border,
        color: "#fff",
    },
    dialogTitle: {
        color: "#fff",
        fontWeight: 950,
    },
    field: {
        "& .MuiOutlinedInput-root": {
            color: "#fff",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "14px",
            "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
        },
        "& .MuiInputLabel-root": {
            color: "rgba(255,255,255,0.62)",
        },
        "& .MuiInputBase-input, & textarea": {
            color: "#fff",
        },
    },
    inputLabel: {
        color: "rgba(255,255,255,0.62)",
    },
    select: {
        color: "#fff",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
        "& .MuiSvgIcon-root": { color: "#fff" },
    },
    menuPaper: {
        background: "#0f172a",
        color: "#fff",
        border,
    },
    dangerButton: {
        textTransform: "none",
        fontWeight: 900,
        borderRadius: "14px",
        color: "#fca5a5",
        borderColor: "rgba(239,68,68,0.22)",
        background: "rgba(239,68,68,0.08)",
    },
    successChip: {
        borderRadius: "999px",
        fontWeight: 900,
        color: "#86efac",
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.18)",
    },
    mutedChip: {
        borderRadius: "999px",
        fontWeight: 900,
        color: "#cbd5e1",
        background: "rgba(255,255,255,0.06)",
        border,
    },
    activeChip: {
        borderRadius: "999px",
        fontWeight: 950,
        color: "#86efac",
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.18)",
    },
    passiveChip: {
        borderRadius: "999px",
        fontWeight: 950,
        color: "#fca5a5",
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.18)",
    },
    plateBadge: {
        borderRadius: "12px",
        fontWeight: 900,
        border: "1px solid",
        fontFamily: "'Roboto Mono', monospace",
    },
    emptyState: {
        minHeight: 320,
        display: "grid",
        placeItems: "center",
        alignContent: "center",
        gap: 1.2,
        borderRadius: "22px",
        border,
        background: "rgba(255,255,255,0.03)",
    },
    paginationWrap: {
        mt: 2,
        p: 1.5,
        borderRadius: "18px",
        border,
        background: "rgba(255,255,255,0.03)",
    },
    paginationInfo: {
        color: "rgba(255,255,255,0.72)",
        fontWeight: 700,
    },
};