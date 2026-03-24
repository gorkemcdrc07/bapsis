import React from "react";
import {
    Box,
    Paper,
    Stack,
    Typography,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    CircularProgress,
    Chip,
    Divider,
    InputAdornment,
    IconButton,
    Tooltip,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import {
    AddRounded,
    LocalShippingRounded,
    PlaceRounded,
    StoreRounded,
    SaveRounded,
    AutoAwesomeRounded,
    RefreshRounded,
    CalendarMonthRounded,
    Inventory2Rounded,
} from "@mui/icons-material";
import { supabase } from "../supabase";

const TABLES = {
    source: "donusler_musteri",
    plateOrders: "donusler_plaka_atama",
};

const todayString = () =>
    new Date().toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

const cardSx = {
    borderRadius: 4,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
    backdropFilter: "blur(14px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
};

const inputSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: 3,
        background: "rgba(255,255,255,0.035)",
        transition: "all .2s ease",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.10)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(255,255,255,0.20)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#38bdf8",
            boxShadow: "0 0 0 4px rgba(56,189,248,0.10)",
        },
    },
    "& .MuiInputLabel-root": {
        color: "rgba(255,255,255,0.68)",
    },
    "& .MuiInputBase-input": {
        color: "#fff",
    },
    "& .MuiSvgIcon-root": {
        color: "rgba(255,255,255,0.65)",
    },
};

const tableHeadCellSx = {
    color: "#e2e8f0",
    fontWeight: 800,
    fontSize: 13,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    whiteSpace: "nowrap",
};

const tableBodyCellSx = {
    color: "#fff",
    fontSize: 13,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    whiteSpace: "nowrap",
};

const infoCardSx = {
    p: 2,
    borderRadius: 3,
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.07)",
    minHeight: 96,
};

const normalizeText = (value) => String(value || "").trim();

const uniqueOptions = (rows, field) => {
    const values = [
        ...new Set((rows || []).map((r) => normalizeText(r[field])).filter(Boolean)),
    ];

    return values
        .sort((a, b) => a.localeCompare(b, "tr"))
        .map((label, index) => ({
            id: `${field}-${index}-${label}`,
            label,
        }));
};

const formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("tr-TR");
};

export default function SiparisOlustur() {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [adding, setAdding] = React.useState(false);

    const [sourceRows, setSourceRows] = React.useState([]);
    const [customers, setCustomers] = React.useState([]);
    const [createdOrders, setCreatedOrders] = React.useState([]);

    const [selectedCustomer, setSelectedCustomer] = React.useState(null);
    const [selectedLoadingPlace, setSelectedLoadingPlace] = React.useState(null);
    const [selectedDeliveryPlace, setSelectedDeliveryPlace] = React.useState(null);

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [newValues, setNewValues] = React.useState({
        customerName: "",
        loadingPlace: "",
        deliveryPlace: "",
        navlun: "",
    });

    const [snack, setSnack] = React.useState({
        open: false,
        severity: "success",
        message: "",
    });

    const showSnack = (message, severity = "success") => {
        setSnack({ open: true, message, severity });
    };

    const fetchSource = React.useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(TABLES.source)
                .select("id, musteri_adi, yukleme_yeri, teslim_yeri, navlun");

            if (error) throw error;

            const rows = data || [];
            setSourceRows(rows);
            setCustomers(uniqueOptions(rows, "musteri_adi"));
        } catch (error) {
            console.error("Veriler alınamadı:", error);
            showSnack("Müşteri verileri yüklenemedi.", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchSource();
    }, [fetchSource]);

    const customerMatchedRows = React.useMemo(() => {
        if (!selectedCustomer?.label) return [];
        return sourceRows.filter(
            (row) =>
                normalizeText(row.musteri_adi) ===
                normalizeText(selectedCustomer.label)
        );
    }, [sourceRows, selectedCustomer]);

    const loadingOptions = React.useMemo(() => {
        return uniqueOptions(customerMatchedRows, "yukleme_yeri");
    }, [customerMatchedRows]);

    const deliveryOptions = React.useMemo(() => {
        return uniqueOptions(customerMatchedRows, "teslim_yeri");
    }, [customerMatchedRows]);

    const selectedMatchedSourceRow = React.useMemo(() => {
        if (
            !selectedCustomer?.label ||
            !selectedLoadingPlace?.label ||
            !selectedDeliveryPlace?.label
        ) {
            return null;
        }

        return (
            sourceRows.find(
                (row) =>
                    normalizeText(row.musteri_adi) ===
                    normalizeText(selectedCustomer.label) &&
                    normalizeText(row.yukleme_yeri) ===
                    normalizeText(selectedLoadingPlace.label) &&
                    normalizeText(row.teslim_yeri) ===
                    normalizeText(selectedDeliveryPlace.label)
            ) || null
        );
    }, [
        sourceRows,
        selectedCustomer,
        selectedLoadingPlace,
        selectedDeliveryPlace,
    ]);

    React.useEffect(() => {
        setSelectedLoadingPlace(null);
        setSelectedDeliveryPlace(null);
    }, [selectedCustomer]);

    const resetDialog = () => {
        setNewValues({
            customerName: "",
            loadingPlace: "",
            deliveryPlace: "",
            navlun: "",
        });
    };

    const openAddDialog = () => {
        resetDialog();
        setDialogOpen(true);
    };

    const closeAddDialog = () => {
        setDialogOpen(false);
        resetDialog();
    };

    const handleNewValueChange = (field, value) => {
        setNewValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddNewValues = async () => {
        const payload = {
            musteri_adi: newValues.customerName.trim() || null,
            yukleme_yeri: newValues.loadingPlace.trim() || null,
            teslim_yeri: newValues.deliveryPlace.trim() || null,
            navlun: newValues.navlun.trim() || null,
        };

        if (!payload.musteri_adi || !payload.yukleme_yeri || !payload.teslim_yeri) {
            showSnack(
                "Müşteri adı, yükleme yeri ve teslim yeri zorunlu.",
                "warning"
            );
            return;
        }

        setAdding(true);
        try {
            const { error } = await supabase.from(TABLES.source).insert([payload]);
            if (error) throw error;

            await fetchSource();

            setSelectedCustomer({
                id: `m-${payload.musteri_adi}`,
                label: payload.musteri_adi,
            });

            closeAddDialog();
            showSnack("Yeni müşteri kaydı başarıyla eklendi.");
        } catch (error) {
            console.error("Yeni değer ekleme hatası:", error);
            showSnack("Yeni kayıt eklenemedi.", "error");
        } finally {
            setAdding(false);
        }
    };

    const handleSaveOrder = async () => {
        if (!selectedCustomer || !selectedLoadingPlace || !selectedDeliveryPlace) {
            showSnack(
                "Müşteri, yükleme yeri ve teslim yeri seçilmelidir.",
                "warning"
            );
            return;
        }

        setSaving(true);
        try {
            const payload = {
                sefer_no: "",
                sevk_tarihi: todayString(),
                musteri_adi: selectedCustomer.label,
                yukleme_yeri: selectedLoadingPlace.label,
                cekici: "",
                dorse: "",
                tc: "",
                surucu: "",
                telefon: "",
                vkn: "",
                varis1: selectedDeliveryPlace.label,
                varis2: "",
                irsaliyeno: "",
                navlun: selectedMatchedSourceRow?.navlun
                    ? String(selectedMatchedSourceRow.navlun)
                    : "",
                arac_durumu: "",
            };

            const { data, error } = await supabase
                .from(TABLES.plateOrders)
                .insert([payload])
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

            setCreatedOrders((prev) => [data, ...prev]);

            showSnack(
                "Sipariş oluşturuldu. Sevk tarihi otomatik bugünün tarihi olarak kaydedildi."
            );

            setSelectedCustomer(null);
            setSelectedLoadingPlace(null);
            setSelectedDeliveryPlace(null);
        } catch (error) {
            console.error("Sipariş kaydetme hatası:", error);
            showSnack("Sipariş kaydedilemedi.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                p: { xs: 2, md: 4 },
                background: `
                    radial-gradient(circle at top left, rgba(37,99,235,0.20), transparent 28%),
                    radial-gradient(circle at top right, rgba(14,165,233,0.14), transparent 24%),
                    radial-gradient(circle at bottom center, rgba(59,130,246,0.10), transparent 30%),
                    linear-gradient(180deg, #07111f 0%, #0f172a 45%, #111827 100%)
                `,
            }}
        >
            <Paper sx={{ ...cardSx, p: { xs: 2.4, md: 3.2 }, mb: 3 }}>
                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", lg: "center" }}
                    spacing={2}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 68,
                                height: 68,
                                borderRadius: "22px",
                                display: "grid",
                                placeItems: "center",
                                background:
                                    "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
                                boxShadow: "0 18px 42px rgba(37,99,235,0.38)",
                            }}
                        >
                            <AutoAwesomeRounded sx={{ color: "#fff", fontSize: 32 }} />
                        </Box>

                        <Box>
                            <Typography
                                sx={{
                                    color: "#fff",
                                    fontWeight: 900,
                                    fontSize: { xs: "1.8rem", md: "2.25rem" },
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.04em",
                                }}
                            >
                                Dönüş Sipariş Oluştur
                            </Typography>

                            <Typography
                                sx={{
                                    mt: 0.8,
                                    color: "#94a3b8",
                                    fontSize: "0.98rem",
                                    maxWidth: 780,
                                }}
                            >
                                Müşteri, yükleme ve teslim lokasyonunu seçin.
                                Sipariş kaydedildiğinde kayıt doğrudan dönüş plaka atama
                                tablosuna aktarılır ve sadece bu oturumda oluşturduklarınız
                                aşağıdaki listede görünür.
                            </Typography>

                            <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ mt: 1.6 }}
                            >
                                <Chip
                                    icon={<StoreRounded />}
                                    label="Müşteri"
                                    sx={chipPrimarySx}
                                />
                                <Chip
                                    icon={<LocalShippingRounded />}
                                    label="Yükleme"
                                    sx={chipMutedSx}
                                />
                                <Chip
                                    icon={<PlaceRounded />}
                                    label="Teslim"
                                    sx={chipMutedSx}
                                />
                                <Chip
                                    icon={<CalendarMonthRounded />}
                                    label={`Sevk: ${todayString()}`}
                                    sx={chipDateSx}
                                />
                            </Stack>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Kaynak listeyi yenile">
                            <span>
                                <IconButton
                                    onClick={fetchSource}
                                    disabled={loading}
                                    sx={refreshBtnSx}
                                >
                                    <RefreshRounded />
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Button
                            startIcon={<AddRounded />}
                            onClick={openAddDialog}
                            sx={addBtnSx}
                        >
                            Yeni Değer Ekle
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 2,
                    mb: 3,
                }}
            >
                <Paper sx={infoCardSx}>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <StoreRounded sx={{ color: "#60a5fa" }} />
                            <Typography
                                sx={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
                            >
                                Seçilen Müşteri
                            </Typography>
                        </Stack>
                        <Typography
                            sx={{ color: "#fff", fontWeight: 900, fontSize: 18 }}
                        >
                            {selectedCustomer?.label || "-"}
                        </Typography>
                    </Stack>
                </Paper>

                <Paper sx={infoCardSx}>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarMonthRounded sx={{ color: "#22c55e" }} />
                            <Typography
                                sx={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
                            >
                                Otomatik Sevk Tarihi
                            </Typography>
                        </Stack>
                        <Typography
                            sx={{ color: "#fff", fontWeight: 900, fontSize: 18 }}
                        >
                            {todayString()}
                        </Typography>
                    </Stack>
                </Paper>

                <Paper sx={infoCardSx}>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Inventory2Rounded sx={{ color: "#f59e0b" }} />
                            <Typography
                                sx={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
                            >
                                Bu Oturumda Oluşturulan Sipariş
                            </Typography>
                        </Stack>
                        <Typography
                            sx={{ color: "#fff", fontWeight: 900, fontSize: 18 }}
                        >
                            {createdOrders.length}
                        </Typography>
                    </Stack>
                </Paper>
            </Box>

            <Paper sx={{ ...cardSx, p: { xs: 2, md: 3 }, mb: 3 }}>
                {loading ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                        <CircularProgress thickness={3} size={42} />
                        <Typography
                            sx={{ mt: 2, color: "#94a3b8", fontWeight: 600 }}
                        >
                            Müşteri verileri yükleniyor...
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={3}>
                        <Typography
                            sx={{
                                color: "#fff",
                                fontWeight: 900,
                                fontSize: "1.12rem",
                            }}
                        >
                            Sipariş Bilgileri
                        </Typography>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "1fr 1fr",
                                    xl: "1fr 1fr 1fr",
                                },
                                gap: 2,
                            }}
                        >
                            <Autocomplete
                                options={customers}
                                value={selectedCustomer}
                                onChange={(_, value) => setSelectedCustomer(value)}
                                getOptionLabel={(option) => option?.label || ""}
                                isOptionEqualToValue={(option, value) =>
                                    option.label === value.label
                                }
                                noOptionsText="Müşteri bulunamadı"
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Müşteri Adı"
                                        placeholder="Müşteri seç"
                                        sx={inputSx}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <StoreRounded />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            <Autocomplete
                                options={loadingOptions}
                                value={selectedLoadingPlace}
                                onChange={(_, value) => setSelectedLoadingPlace(value)}
                                getOptionLabel={(option) => option?.label || ""}
                                isOptionEqualToValue={(option, value) =>
                                    option.label === value.label
                                }
                                noOptionsText={
                                    selectedCustomer
                                        ? "Bu müşteriye ait yükleme yeri yok"
                                        : "Önce müşteri seçin"
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Yükleme Yeri"
                                        placeholder="Yükleme yeri seç"
                                        sx={inputSx}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <LocalShippingRounded />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />

                            <Autocomplete
                                options={deliveryOptions}
                                value={selectedDeliveryPlace}
                                onChange={(_, value) =>
                                    setSelectedDeliveryPlace(value)
                                }
                                getOptionLabel={(option) => option?.label || ""}
                                isOptionEqualToValue={(option, value) =>
                                    option.label === value.label
                                }
                                noOptionsText={
                                    selectedCustomer
                                        ? "Bu müşteriye ait teslim yeri yok"
                                        : "Önce müşteri seçin"
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Teslim Yeri"
                                        placeholder="Teslim yeri seç"
                                        sx={inputSx}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <PlaceRounded />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.2,
                                borderRadius: 3,
                                background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <Stack spacing={1.1}>
                                <Typography sx={{ color: "#fff", fontWeight: 900 }}>
                                    Seçim Özeti
                                </Typography>
                                <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
                                    Müşteri:{" "}
                                    <b style={{ color: "#fff" }}>
                                        {selectedCustomer?.label || "-"}
                                    </b>
                                </Typography>
                                <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
                                    Yükleme:{" "}
                                    <b style={{ color: "#fff" }}>
                                        {selectedLoadingPlace?.label || "-"}
                                    </b>
                                </Typography>
                                <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
                                    Teslim / Varış 1:{" "}
                                    <b style={{ color: "#fff" }}>
                                        {selectedDeliveryPlace?.label || "-"}
                                    </b>
                                </Typography>
                                <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
                                    Sevk Tarihi:{" "}
                                    <b style={{ color: "#fff" }}>{todayString()}</b>
                                </Typography>
                                <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
                                    Navlun:{" "}
                                    <b style={{ color: "#fff" }}>
                                        {selectedMatchedSourceRow?.navlun || "-"}
                                    </b>
                                </Typography>
                            </Stack>
                        </Paper>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="flex-end"
                            spacing={1.2}
                        >
                            <Button
                                onClick={openAddDialog}
                                startIcon={<AddRounded />}
                                sx={secondaryBtnSx}
                            >
                                Yeni Değer Ekle
                            </Button>

                            <Button
                                onClick={handleSaveOrder}
                                disabled={saving}
                                startIcon={
                                    saving ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : (
                                        <SaveRounded />
                                    )
                                }
                                sx={saveBtnSx}
                            >
                                {saving ? "Kaydediliyor..." : "Siparişi Kaydet"}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Paper>

            <Paper sx={{ ...cardSx, p: { xs: 2, md: 3 } }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1.5}
                    sx={{ mb: 2 }}
                >
                    <Box>
                        <Typography
                            sx={{ color: "#fff", fontWeight: 900, fontSize: "1.1rem" }}
                        >
                            Bu Oturumda Oluşturulan Siparişler
                        </Typography>
                        <Typography
                            sx={{ color: "#94a3b8", fontSize: 14, mt: 0.5 }}
                        >
                            Bu listede sadece sayfa açıkken oluşturduğunuz siparişler
                            gösterilir. Sayfa kapanınca liste temizlenir.
                        </Typography>
                    </Box>

                    <Chip
                        label={`Toplam Kayıt: ${createdOrders.length}`}
                        sx={chipPrimarySx}
                    />
                </Stack>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />

                {createdOrders.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <Typography sx={{ color: "#94a3b8" }}>
                            Bu oturumda henüz sipariş oluşturulmadı.
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer
                        sx={{
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.02)",
                            overflowX: "auto",
                        }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={tableHeadCellSx}>Sefer No</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Sevk Tarihi</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Müşteri Adı</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Yükleme Yeri</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Çekici</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Dorse</TableCell>
                                    <TableCell sx={tableHeadCellSx}>TC</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Sürücü</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Telefon</TableCell>
                                    <TableCell sx={tableHeadCellSx}>VKN</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Varış 1</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Varış 2</TableCell>
                                    <TableCell sx={tableHeadCellSx}>İrsaliye No</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Navlun</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Araç Durumu</TableCell>
                                    <TableCell sx={tableHeadCellSx}>Oluşturulma</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {createdOrders.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        sx={{
                                            background:
                                                index % 2 === 0
                                                    ? "rgba(255,255,255,0.015)"
                                                    : "transparent",
                                            "&:hover": {
                                                background: "rgba(59,130,246,0.08)",
                                            },
                                        }}
                                    >
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.sefer_no || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.sevk_tarihi || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.musteri_adi || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.yukleme_yeri || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.cekici || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.dorse || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.tc || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.surucu || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.telefon || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.vkn || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.varis1 || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.varis2 || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.irsaliyeno || "-"}
                                        </TableCell>
                                        <TableCell
                                            sx={{ ...tableBodyCellSx, fontWeight: 800 }}
                                        >
                                            {row.navlun || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {row.arac_durumu || "-"}
                                        </TableCell>
                                        <TableCell sx={tableBodyCellSx}>
                                            {formatDateTime(row.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog
                open={dialogOpen}
                onClose={adding ? undefined : closeAddDialog}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        background:
                            "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(17,24,39,0.98))",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff",
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>
                    Yeni Müşteri Kaydı Ekle
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                    <Stack spacing={2}>
                        <TextField
                            label="Müşteri Adı"
                            value={newValues.customerName}
                            onChange={(e) =>
                                handleNewValueChange("customerName", e.target.value)
                            }
                            fullWidth
                            sx={inputSx}
                        />

                        <TextField
                            label="Yükleme Yeri"
                            value={newValues.loadingPlace}
                            onChange={(e) =>
                                handleNewValueChange("loadingPlace", e.target.value)
                            }
                            fullWidth
                            sx={inputSx}
                        />

                        <TextField
                            label="Teslim Yeri"
                            value={newValues.deliveryPlace}
                            onChange={(e) =>
                                handleNewValueChange("deliveryPlace", e.target.value)
                            }
                            fullWidth
                            sx={inputSx}
                        />

                        <TextField
                            label="Navlun"
                            value={newValues.navlun}
                            onChange={(e) =>
                                handleNewValueChange("navlun", e.target.value)
                            }
                            fullWidth
                            sx={inputSx}
                        />

                        <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                            Bu kayıt{" "}
                            <b style={{ color: "#fff" }}>donusler_musteri</b> tablosuna
                            eklenecek.
                        </Typography>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={closeAddDialog}
                        disabled={adding}
                        sx={secondaryBtnSx}
                    >
                        Vazgeç
                    </Button>
                    <Button
                        onClick={handleAddNewValues}
                        disabled={adding}
                        startIcon={
                            adding ? (
                                <CircularProgress size={18} color="inherit" />
                            ) : (
                                <SaveRounded />
                            )
                        }
                        sx={saveBtnSx}
                    >
                        {adding ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snack.open}
                autoHideDuration={2600}
                onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={snack.severity}
                    variant="filled"
                    onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
                    sx={{ borderRadius: 2 }}
                >
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

const chipPrimarySx = {
    color: "#dbeafe",
    bgcolor: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.18)",
    fontWeight: 700,
    "& .MuiChip-icon": { color: "#60a5fa" },
};

const chipMutedSx = {
    color: "#e2e8f0",
    bgcolor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: 700,
    "& .MuiChip-icon": { color: "#cbd5e1" },
};

const chipDateSx = {
    color: "#dcfce7",
    bgcolor: "rgba(34,197,94,0.16)",
    border: "1px solid rgba(74,222,128,0.18)",
    fontWeight: 800,
    "& .MuiChip-icon": { color: "#4ade80" },
};

const refreshBtnSx = {
    color: "#cbd5e1",
    bgcolor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    "&:hover": {
        bgcolor: "rgba(255,255,255,0.08)",
    },
};

const addBtnSx = {
    borderRadius: 2.7,
    textTransform: "none",
    fontWeight: 800,
    color: "#dbeafe",
    bgcolor: "rgba(37,99,235,0.14)",
    border: "1px solid rgba(59,130,246,0.18)",
    "&:hover": {
        bgcolor: "rgba(37,99,235,0.22)",
    },
};

const secondaryBtnSx = {
    borderRadius: 2.7,
    textTransform: "none",
    fontWeight: 800,
    color: "#e2e8f0",
    bgcolor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    "&:hover": {
        bgcolor: "rgba(255,255,255,0.08)",
    },
};

const saveBtnSx = {
    borderRadius: 2.7,
    textTransform: "none",
    fontWeight: 900,
    px: 2.2,
    color: "#fff",
    background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
    boxShadow: "0 16px 30px rgba(37,99,235,0.28)",
    "&:hover": {
        background: "linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)",
    },
};