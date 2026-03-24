import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Stack,
    Button,
    Chip,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
    InputAdornment,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Avatar,
    Collapse,
    List,
    ListItemButton,
    ListItemText,
    Badge,
    alpha,
} from "@mui/material";
import {
    Add,
    Edit,
    Delete,
    Refresh,
    Search,
    LocalShipping,
    AutoAwesome,
    Close,
    Save,
    Business,
    ExpandLess,
    ExpandMore,
    Route,
    CheckCircle,
    PauseCircle,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { supabase } from "../supabase";

const TABLE_NAME = "donusler_musteri";
const PK_FIELD = "id";

const emptyForm = {
    musteri_adi: "",
    yukleme_yeri: "",
    teslim_yeri: "",
    navlun: "",
    aktif: true,
    aciklama: "",
};

function RecordDialog({
    open,
    mode,
    formValues,
    loading,
    onClose,
    onChange,
    onSave,
}) {
    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: 5,
                    background:
                        "linear-gradient(180deg, rgba(10,15,28,0.98) 0%, rgba(7,12,22,0.99) 100%)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
                    backdropFilter: "blur(18px)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    pb: 1.4,
                }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, #8b5cf6, #2563eb)",
                            boxShadow: "0 16px 36px rgba(37,99,235,0.28)",
                        }}
                    >
                        {mode === "create" ? <Add /> : <Edit />}
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                            {mode === "create" ? "Yeni Navlun Kaydı" : "Navlun Kaydını Düzenle"}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.56)", fontSize: 13 }}>
                            Form alanlarını doldurup kaydı güvenle saklayabilirsiniz.
                        </Typography>
                    </Box>
                </Stack>

                <IconButton onClick={onClose} disabled={loading} sx={{ color: "white" }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

            <DialogContent sx={{ pt: 2.5 }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 2,
                    }}
                >
                    <TextField
                        label="Müşteri Adı"
                        value={formValues.musteri_adi}
                        onChange={(e) => onChange("musteri_adi", e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={dialogInputSx}
                    />

                    <TextField
                        label="Navlun"
                        value={formValues.navlun}
                        onChange={(e) => onChange("navlun", e.target.value)}
                        fullWidth
                        type="number"
                        InputLabelProps={{ shrink: true }}
                        sx={dialogInputSx}
                    />

                    <TextField
                        label="Yükleme Yeri"
                        value={formValues.yukleme_yeri}
                        onChange={(e) => onChange("yukleme_yeri", e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={dialogInputSx}
                    />

                    <TextField
                        label="Teslim Yeri"
                        value={formValues.teslim_yeri}
                        onChange={(e) => onChange("teslim_yeri", e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={dialogInputSx}
                    />

                    <TextField
                        label="Açıklama"
                        value={formValues.aciklama}
                        onChange={(e) => onChange("aciklama", e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        InputLabelProps={{ shrink: true }}
                        sx={{ ...dialogInputSx, gridColumn: { xs: "1 / -1", md: "1 / -1" } }}
                    />

                    <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!formValues.aktif}
                                    onChange={(e) => onChange("aktif", e.target.checked)}
                                    sx={modernSwitchSx}
                                />
                            }
                            label="Aktif"
                            sx={{ color: "white" }}
                        />
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.4 }}>
                <Button onClick={onClose} disabled={loading} sx={ghostBtnSx}>
                    Vazgeç
                </Button>
                <Button
                    onClick={onSave}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
                    variant="contained"
                    sx={primaryBtnSx}
                >
                    Kaydet
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function DeleteDialog({ open, row, loading, onClose, onConfirm }) {
    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    borderRadius: 5,
                    background:
                        "linear-gradient(180deg, rgba(25,10,10,0.98) 0%, rgba(12,8,8,0.99) 100%)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 30px 90px rgba(0,0,0,0.4)",
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 900 }}>Kaydı sil</DialogTitle>
            <DialogContent>
                <Alert
                    severity="warning"
                    sx={{
                        bgcolor: "rgba(245,158,11,0.12)",
                        color: "white",
                        border: "1px solid rgba(245,158,11,0.18)",
                    }}
                >
                    Bu kayıt kalıcı olarak silinecek.
                </Alert>

                <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.75)" }}>
                    Silinecek kayıt:
                </Typography>

                <Paper
                    sx={{
                        mt: 1.5,
                        p: 1.75,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "white",
                    }}
                >
                    <Typography sx={{ fontWeight: 800 }}>
                        {row?.musteri_adi || `Kayıt #${row?.id}`}
                    </Typography>
                    <Typography sx={{ fontSize: 13, opacity: 0.65 }}>ID: {row?.id}</Typography>
                </Paper>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.4 }}>
                <Button onClick={onClose} disabled={loading} sx={ghostBtnSx}>
                    Vazgeç
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    color="error"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Delete />}
                    sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
                >
                    Sil
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function NoRowsOverlay() {
    return (
        <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ height: "100%", color: "rgba(255,255,255,0.78)" }}
        >
            <Typography sx={{ fontWeight: 900, mb: 0.7 }}>Kayıt bulunamadı</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.7 }}>
                Arama filtresini güncelleyin veya yeni kayıt ekleyin.
            </Typography>
        </Stack>
    );
}

function CustomerGroupList({ groups, selectedCustomer, onSelectCustomer }) {
    const [open, setOpen] = useState(true);

    return (
        <Paper sx={sidePanelSx}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    p: 2.2,
                    pb: 1.4,
                    flexShrink: 0,
                    minHeight: 76,
                }}
            >
                <Stack direction="row" spacing={1.1} alignItems="center">
                    <Box sx={sideIconWrapSx}>
                        <Business sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "white" }}>
                            Müşteri Grupları
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.56)" }}>
                            Müşteri adına göre hızlı filtre
                        </Typography>
                    </Box>
                </Stack>

                <IconButton
                    size="small"
                    onClick={() => setOpen((v) => !v)}
                    sx={{ color: "white" }}
                >
                    {open ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
            </Stack>

            {open && (
                <Box
                    sx={{
                        height: "calc(100% - 76px)",
                        overflowY: "auto",
                        overflowX: "hidden",
                        px: 1.2,
                        pb: 1.2,
                        pr: 0.8,
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(96,165,250,0.35) rgba(255,255,255,0.04)",
                        "&::-webkit-scrollbar": {
                            width: 8,
                        },
                        "&::-webkit-scrollbar-track": {
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 999,
                        },
                        "&::-webkit-scrollbar-thumb": {
                            background: "rgba(96,165,250,0.30)",
                            borderRadius: 999,
                        },
                        "&::-webkit-scrollbar-thumb:hover": {
                            background: "rgba(96,165,250,0.45)",
                        },
                    }}
                >
                    <List dense sx={{ p: 0 }}>
                        <ListItemButton
                            onClick={() => onSelectCustomer("all")}
                            selected={selectedCustomer === "all"}
                            sx={getCustomerItemSx(selectedCustomer === "all")}
                        >
                            <ListItemText
                                primary="Tüm Müşteriler"
                                secondary={`${groups.reduce((acc, g) => acc + g.count, 0)} kayıt`}
                                primaryTypographyProps={{ fontWeight: 800 }}
                                secondaryTypographyProps={{
                                    color: "rgba(255,255,255,0.52)",
                                    fontSize: 12,
                                }}
                            />
                        </ListItemButton>

                        {groups.map((group) => (
                            <ListItemButton
                                key={group.name}
                                onClick={() => onSelectCustomer(group.name)}
                                selected={selectedCustomer === group.name}
                                sx={getCustomerItemSx(selectedCustomer === group.name)}
                            >
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1.2}
                                    sx={{ width: "100%" }}
                                >
                                    <Avatar sx={groupAvatarSx}>
                                        {getInitials(group.name)}
                                    </Avatar>

                                    <ListItemText
                                        primary={group.name}
                                        secondary={`${group.count} kayıt • ${formatCurrency(group.totalNavlun)}`}
                                        primaryTypographyProps={{ fontWeight: 800 }}
                                        secondaryTypographyProps={{
                                            color: "rgba(255,255,255,0.52)",
                                            fontSize: 12,
                                        }}
                                    />

                                    <Badge
                                        badgeContent={group.activeCount}
                                        color="primary"
                                    />
                                </Stack>
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
} export default function Navlunlar() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState("create");
    const [formValues, setFormValues] = useState(emptyForm);
    const [editingRow, setEditingRow] = useState(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingRow, setDeletingRow] = useState(null);

    const [searchText, setSearchText] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("all");
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const showMessage = useCallback((message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const fetchRows = useCallback(async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select("*")
            .order("musteri_adi", { ascending: true })
            .limit(500);

        setLoading(false);

        if (error) {
            console.error("Supabase fetchRows hata:", error);
            showMessage(`Veriler alınamadı: ${error.message}`, "error");
            return;
        }

        setRows(data || []);
    }, [showMessage]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const groupedCustomers = useMemo(() => {
        const map = new Map();

        rows.forEach((row) => {
            const name = row.musteri_adi?.trim() || "Müşteri adı girilmemiş";
            if (!map.has(name)) {
                map.set(name, {
                    name,
                    count: 0,
                    activeCount: 0,
                    totalNavlun: 0,
                });
            }
            const current = map.get(name);
            current.count += 1;
            current.activeCount += row.aktif ? 1 : 0;
            current.totalNavlun += Number(row.navlun || 0);
        });

        return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "tr")
        );
    }, [rows]);

    const filteredRows = useMemo(() => {
        let result = rows;

        if (selectedCustomer !== "all") {
            result = result.filter(
                (row) =>
                    (row.musteri_adi?.trim() || "Müşteri adı girilmemiş") === selectedCustomer
            );
        }

        if (searchText.trim()) {
            const q = searchText.toLowerCase().trim();
            result = result.filter((row) =>
                [
                    row.id,
                    row.musteri_adi,
                    row.yukleme_yeri,
                    row.teslim_yeri,
                    row.navlun,
                    row.aciklama,
                ].some((v) => String(v ?? "").toLowerCase().includes(q))
            );
        }

        return result;
    }, [rows, searchText, selectedCustomer]);

    const handleAddOpen = useCallback(() => {
        setDialogMode("create");
        setEditingRow(null);
        setFormValues(emptyForm);
        setDialogOpen(true);
    }, []);

    const handleEditOpen = useCallback((row) => {
        setDialogMode("edit");
        setEditingRow(row);
        setFormValues({
            musteri_adi: row.musteri_adi ?? "",
            yukleme_yeri: row.yukleme_yeri ?? "",
            teslim_yeri: row.teslim_yeri ?? "",
            navlun: row.navlun ?? "",
            aktif: row.aktif ?? true,
            aciklama: row.aciklama ?? "",
        });
        setDialogOpen(true);
    }, []);

    const handleDeleteOpen = useCallback((row) => {
        setDeletingRow(row);
        setDeleteOpen(true);
    }, []);

    const handleDialogClose = useCallback(() => {
        if (saving) return;
        setDialogOpen(false);
        setEditingRow(null);
        setFormValues(emptyForm);
    }, [saving]);

    const handleDeleteClose = useCallback(() => {
        if (saving) return;
        setDeleteOpen(false);
        setDeletingRow(null);
    }, [saving]);

    const handleFieldChange = useCallback((key, value) => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleSave = useCallback(async () => {
        setSaving(true);

        const payload = {
            musteri_adi: formValues.musteri_adi || null,
            yukleme_yeri: formValues.yukleme_yeri || null,
            teslim_yeri: formValues.teslim_yeri || null,
            navlun: formValues.navlun === "" ? null : Number(formValues.navlun),
            aktif: !!formValues.aktif,
            aciklama: formValues.aciklama || null,
        };

        let result;

        if (dialogMode === "create") {
            result = await supabase.from(TABLE_NAME).insert([payload]).select().single();
        } else {
            result = await supabase
                .from(TABLE_NAME)
                .update(payload)
                .eq(PK_FIELD, editingRow?.[PK_FIELD])
                .select()
                .single();
        }

        setSaving(false);

        if (result.error) {
            console.error(result.error);
            showMessage(`Kayıt işlemi başarısız: ${result.error.message}`, "error");
            return;
        }

        showMessage(
            dialogMode === "create"
                ? "Kayıt başarıyla eklendi"
                : "Kayıt başarıyla güncellendi"
        );

        handleDialogClose();
        fetchRows();
    }, [dialogMode, editingRow, fetchRows, formValues, handleDialogClose, showMessage]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deletingRow?.id) return;

        setSaving(true);

        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq("id", deletingRow.id);

        setSaving(false);

        if (error) {
            console.error(error);
            showMessage(`Silme işlemi başarısız: ${error.message}`, "error");
            return;
        }

        showMessage("Kayıt başarıyla silindi");
        handleDeleteClose();
        fetchRows();
    }, [deletingRow, fetchRows, handleDeleteClose, showMessage]);

    const columns = useMemo(
        () => [
            {
                field: "id",
                headerName: "ID",
                minWidth: 90,
                flex: 0.55,
                renderCell: (params) => (
                    <Typography sx={cellTextSx}>{params.value}</Typography>
                ),
            },
            {
                field: "musteri_adi",
                headerName: "Müşteri",
                minWidth: 240,
                flex: 1.25,
                renderCell: (params) => (
                    <Stack
                        direction="row"
                        spacing={1.1}
                        alignItems="center"
                        sx={{ minWidth: 0, py: 0.8 }}
                    >
                        <Avatar sx={miniAvatarSx}>{getInitials(params.value)}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ ...cellTextSx, fontWeight: 800 }}>
                                {params.value || "-"}
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, color: "rgba(229,238,252,0.58)" }}>
                                Müşteri kaydı
                            </Typography>
                        </Box>
                    </Stack>
                ),
            },
            {
                field: "route",
                headerName: "Güzergâh",
                minWidth: 280,
                flex: 1.45,
                sortable: false,
                valueGetter: (_, row) => `${row.yukleme_yeri || "-"} → ${row.teslim_yeri || "-"}`,
                renderCell: (params) => (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Route sx={{ color: "#60a5fa", fontSize: 18 }} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={cellTextSx}>{params.row.yukleme_yeri || "-"}</Typography>
                            <Typography sx={{ fontSize: 11.5, color: "rgba(229,238,252,0.58)" }}>
                                {params.row.teslim_yeri || "-"}
                            </Typography>
                        </Box>
                    </Stack>
                ),
            },
            {
                field: "navlun",
                headerName: "Navlun",
                minWidth: 150,
                flex: 0.8,
                renderCell: (params) => (
                    <Typography sx={{ ...cellTextSx, fontWeight: 800, color: "#bfdbfe" }}>
                        {params.value == null ? "-" : formatCurrency(params.value)}
                    </Typography>
                ),
            },
            {
                field: "aktif",
                headerName: "Durum",
                minWidth: 130,
                flex: 0.7,
                renderCell: (params) => (
                    <Chip
                        size="small"
                        icon={
                            params.value ? (
                                <CheckCircle sx={{ fontSize: 15 }} />
                            ) : (
                                <PauseCircle sx={{ fontSize: 15 }} />
                            )
                        }
                        label={params.value ? "Aktif" : "Pasif"}
                        sx={{
                            fontWeight: 800,
                            color: params.value ? "#dcfce7" : "#fee2e2",
                            bgcolor: params.value
                                ? "rgba(34,197,94,0.14)"
                                : "rgba(239,68,68,0.14)",
                            border: params.value
                                ? "1px solid rgba(34,197,94,0.22)"
                                : "1px solid rgba(239,68,68,0.22)",
                            "& .MuiChip-icon": { color: "inherit" },
                        }}
                    />
                ),
            },
            {
                field: "__actions__",
                headerName: "İşlemler",
                minWidth: 160,
                flex: 0.82,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderCell: (params) => (
                    <Stack direction="row" spacing={0.8}>
                        <Tooltip title="Düzenle">
                            <IconButton
                                size="small"
                                onClick={() => handleEditOpen(params.row)}
                                sx={editIconBtnSx}
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Sil">
                            <IconButton
                                size="small"
                                onClick={() => handleDeleteOpen(params.row)}
                                sx={deleteIconBtnSx}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ),
            },
        ],
        [handleDeleteOpen, handleEditOpen]
    );

    return (
        <Box
            sx={{
                minHeight: "100%",
                p: { xs: 1.5, md: 2.5 },
                background:
                    "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 24%), radial-gradient(circle at bottom right, rgba(139,92,246,0.10), transparent 22%), linear-gradient(180deg, #060a12 0%, #0b1020 100%)",
            }}
        >
            <Stack spacing={2.2}>
                <Card sx={heroCardSx}>
                    <Box sx={heroGlowSx} />
                    <CardContent sx={{ p: { xs: 2.2, md: 3 }, position: "relative", zIndex: 1 }}>
                        <Stack
                            direction={{ xs: "column", xl: "row" }}
                            justifyContent="space-between"
                            spacing={2.2}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box sx={heroIconWrapSx}>
                                    <LocalShipping sx={{ color: "#fff", fontSize: 28 }} />
                                </Box>

                                <Box>
                                    <Typography
                                        sx={{ fontSize: { xs: 23, md: 30 }, fontWeight: 950, letterSpacing: 0.3 }}
                                    >
                                        Dönüş Navlunları
                                    </Typography>
                                    <Typography
                                        sx={{ color: "rgba(255,255,255,0.62)", mt: 0.5, maxWidth: 780 }}
                                    >
                                        Daha modern bir kullanım için müşteri grupları ve geliştirilmiş tablo
                                        görünümü ile dönüş müşteri kayıtlarını yönetin.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip icon={<AutoAwesome />} label="Glassmorphism" sx={heroChipSx} />
                                <Chip label={`${groupedCustomers.length} müşteri`} sx={heroChipSx} />
                                <Chip label={`${rows.length} kayıt`} sx={heroChipSx} />
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", xl: "310px minmax(0, 1fr)" },
                        gridAutoRows: "minmax(0, auto)",
                        gap: 2,
                        alignItems: "start",
                    }}
                >
                    <CustomerGroupList
                        groups={groupedCustomers}
                        selectedCustomer={selectedCustomer}
                        onSelectCustomer={setSelectedCustomer}
                    />

                    <Paper sx={tableWrapSx}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1.2}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", md: "center" }}
                            sx={{
                                p: 2,
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                            }}
                        >
                            <Stack spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
                                <TextField
                                    placeholder="Tabloda ara..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    sx={searchFieldSx}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ color: "rgba(255,255,255,0.55)" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                {selectedCustomer !== "all" && (
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                                            Seçili grup:
                                        </Typography>
                                        <Chip
                                            label={selectedCustomer}
                                            onDelete={() => setSelectedCustomer("all")}
                                            sx={{
                                                color: "white",
                                                bgcolor: "rgba(59,130,246,0.14)",
                                                border: "1px solid rgba(96,165,250,0.20)",
                                            }}
                                        />
                                    </Stack>
                                )}
                            </Stack>

                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Button
                                    onClick={fetchRows}
                                    startIcon={<Refresh />}
                                    variant="outlined"
                                    sx={actionBtnSx}
                                >
                                    Yenile
                                </Button>
                                <Button
                                    onClick={handleAddOpen}
                                    startIcon={<Add />}
                                    variant="contained"
                                    sx={primaryBtnSx}
                                >
                                    Yeni Kayıt
                                </Button>
                            </Stack>
                        </Stack>

                        <Box sx={gridAreaSx}>
                            <DataGrid
                                rows={filteredRows}
                                columns={columns}
                                loading={loading}
                                getRowId={(row) => row.id}
                                disableRowSelectionOnClick
                                pageSizeOptions={[10, 25, 50, 100]}
                                initialState={{
                                    pagination: {
                                        paginationModel: { pageSize: 25, page: 0 },
                                    },
                                }}
                                slots={{
                                    noRowsOverlay: NoRowsOverlay,
                                }}
                                sx={dataGridSx}
                            />
                        </Box>
                    </Paper>
                </Box>
            </Stack>

            <RecordDialog
                open={dialogOpen}
                mode={dialogMode}
                formValues={formValues}
                loading={saving}
                onClose={handleDialogClose}
                onChange={handleFieldChange}
                onSave={handleSave}
            />

            <DeleteDialog
                open={deleteOpen}
                row={deletingRow}
                loading={saving}
                onClose={handleDeleteClose}
                onConfirm={handleDeleteConfirm}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

function getInitials(text) {
    const safeText = String(text || "?").trim();
    if (!safeText) return "?";
    const parts = safeText.split(" ").filter(Boolean);
    return parts
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

function formatCurrency(value) {
    const number = Number(value || 0);
    return number.toLocaleString("tr-TR") + " ₺";
}

const dialogInputSx = {
    "& .MuiOutlinedInput-root": {
        color: "white",
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.035)",
        "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
        "&.Mui-focused fieldset": { borderColor: "#60a5fa" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.62)" },
};

const heroCardSx = {
    borderRadius: 5,
    color: "white",
    background: "linear-gradient(135deg, rgba(15,23,42,0.94), rgba(17,24,39,0.88))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
    overflow: "hidden",
    position: "relative",
    backdropFilter: "blur(18px)",
};

const heroGlowSx = {
    position: "absolute",
    inset: 0,
    background:
        "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.18), transparent 24%), radial-gradient(circle at 85% 20%, rgba(168,85,247,0.16), transparent 18%)",
    pointerEvents: "none",
};

const heroIconWrapSx = {
    width: 58,
    height: 58,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    boxShadow: "0 16px 34px rgba(59,130,246,0.32)",
};

const heroChipSx = {
    height: 31,
    borderRadius: 999,
    color: "white",
    bgcolor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: 800,
    backdropFilter: "blur(10px)",
};

const sidePanelSx = {
    borderRadius: 5,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(9,14,25,0.96), rgba(8,12,22,0.98))",
    boxShadow: "0 24px 60px rgba(0,0,0,0.26)",
    height: "calc(100vh - 330px)",
    minHeight: 500,
    maxHeight: "calc(100vh - 330px)",
    display: "flex",
    flexDirection: "column",
};
const tableWrapSx = {
    borderRadius: 5,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(9,14,25,0.96), rgba(8,12,22,0.98))",
    boxShadow: "0 24px 60px rgba(0,0,0,0.26)",
};

const gridAreaSx = {
    height: "calc(100vh - 330px)",
    minHeight: 500,
    background: "#0b1120",
};

const searchFieldSx = {
    minWidth: { xs: "100%", md: 350 },
    "& .MuiOutlinedInput-root": {
        color: "white",
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.04)",
        "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.20)" },
        "&.Mui-focused fieldset": { borderColor: "#60a5fa" },
    },
};

const dataGridSx = {
    border: "none",
    color: "#e5eefc",
    backgroundColor: "#0b1120",
    "& .MuiDataGrid-main": {
        backgroundColor: "#0b1120",
    },
    "& .MuiDataGrid-columnHeaders": {
        background: "linear-gradient(180deg, #111827, #0f172a)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
    },
    "& .MuiDataGrid-columnHeader": {
        background: "transparent",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
        fontWeight: 900,
        fontSize: 13,
        color: "#dbeafe",
    },
    "& .MuiDataGrid-row": {
        backgroundColor: "#0b1120",
        transition: "all 0.18s ease",
    },
    "& .MuiDataGrid-cell": {
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#e5eefc",
        backgroundColor: "#0b1120",
    },
    "& .MuiDataGrid-virtualScroller": {
        backgroundColor: "#0b1120",
    },
    "& .MuiDataGrid-footerContainer": {
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "#0f172a",
        color: "#e5eefc",
    },
    "& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
    {
        color: "#e5eefc",
    },
    "& .MuiSvgIcon-root": {
        color: "rgba(255,255,255,0.75)",
    },
    "& .MuiDataGrid-row:hover": {
        backgroundColor: "rgba(59,130,246,0.08)",
    },
    "& .MuiDataGrid-overlay": {
        backgroundColor: "#0b1120",
    },
    "& .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover": {
        backgroundColor: "rgba(59,130,246,0.10)",
    },
};

const actionBtnSx = {
    borderRadius: 3,
    textTransform: "none",
    fontWeight: 800,
    px: 2,
    color: "white",
    borderColor: "rgba(255,255,255,0.12)",
    bgcolor: "rgba(255,255,255,0.03)",
    "&:hover": {
        borderColor: "rgba(255,255,255,0.22)",
        bgcolor: "rgba(255,255,255,0.06)",
    },
};

const primaryBtnSx = {
    borderRadius: 3,
    px: 2.2,
    textTransform: "none",
    fontWeight: 800,
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    boxShadow: "0 12px 24px rgba(37,99,235,0.28)",
    border: "none",
};

const ghostBtnSx = {
    borderRadius: 3,
    color: "rgba(255,255,255,0.78)",
    textTransform: "none",
    fontWeight: 700,
};

const modernSwitchSx = {
    "& .MuiSwitch-switchBase.Mui-checked": {
        color: "#60a5fa",
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
        bgcolor: "#2563eb",
        opacity: 1,
    },
    "& .MuiSwitch-track": {
        bgcolor: "rgba(148,163,184,0.35)",
        opacity: 1,
        borderRadius: 20,
    },
};

const cellTextSx = {
    fontSize: 13,
    color: "#e5eefc",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const miniAvatarSx = {
    width: 34,
    height: 34,
    fontSize: 12,
    fontWeight: 900,
    color: "white",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    boxShadow: "0 8px 24px rgba(59,130,246,0.25)",
};

const groupAvatarSx = {
    width: 34,
    height: 34,
    fontSize: 12,
    fontWeight: 900,
    color: "white",
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
};

const sideIconWrapSx = {
    width: 36,
    height: 36,
    borderRadius: 2.5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(124,58,237,0.22))",
    color: "#dbeafe",
    border: "1px solid rgba(255,255,255,0.08)",
};

const editIconBtnSx = {
    color: "#93c5fd",
    bgcolor: "rgba(59,130,246,0.10)",
    border: "1px solid rgba(96,165,250,0.16)",
    "&:hover": { bgcolor: "rgba(59,130,246,0.18)" },
};

const deleteIconBtnSx = {
    color: "#fca5a5",
    bgcolor: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(248,113,113,0.16)",
    "&:hover": { bgcolor: "rgba(239,68,68,0.18)" },
};

const getCustomerItemSx = (selected) => ({
    borderRadius: 3,
    mx: 0.6,
    mb: 0.6,
    border: "1px solid rgba(255,255,255,0.06)",
    background: selected
        ? "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.14))"
        : "rgba(255,255,255,0.02)",
    color: "white",
    "&.Mui-selected": {
        background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.14))",
    },
    "&.Mui-selected:hover": {
        background: "linear-gradient(135deg, rgba(37,99,235,0.24), rgba(124,58,237,0.18))",
    },
    "&:hover": {
        background: selected
            ? "linear-gradient(135deg, rgba(37,99,235,0.24), rgba(124,58,237,0.18))"
            : alpha("#ffffff", 0.05),
    },
});