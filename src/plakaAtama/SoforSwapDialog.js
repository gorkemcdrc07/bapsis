// src/plakaAtama/SoforSwapDialog.js
import React, { useMemo, useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    List,
    ListItemButton,
    ListItemText,
    Button,
    InputBase,
    Divider,
    Chip,
    TextField,
    Stack,
    CircularProgress,
    Fade,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

export default function SoforSwapDialog({
    open,
    onClose,
    s,
    sourceRow,
    sourcePlaka,
    query,
    setQuery,
    targets = [],
    targetPlakaId,
    setTargetPlakaId,
    onSwap,
    canEdit = true,
    onCreateDriver,
}) {
    const [localTargets, setLocalTargets] = useState(targets);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorText, setErrorText] = useState("");

    const [form, setForm] = useState({
        ad_soyad: "",
        telefon: "",
        tc_no: "",
    });

    useEffect(() => {
        setLocalTargets(targets || []);
    }, [targets]);

    useEffect(() => {
        if (!open) {
            setShowCreateForm(false);
            setSaving(false);
            setErrorText("");
            setForm({
                ad_soyad: "",
                telefon: "",
                tc_no: "",
            });
        }
    }, [open]);

    const filteredTargets = useMemo(() => {
        const q = (query || "").trim().toLocaleLowerCase("tr");

        if (!q) return localTargets;

        return localTargets.filter((p) => {
            const values = [
                p?.cekici,
                p?.dorse,
                p?.ad_soyad,
                p?.telefon,
                p?.tc_no,
            ]
                .filter(Boolean)
                .map((v) => String(v).toLocaleLowerCase("tr"));

            return values.some((v) => v.includes(q));
        });
    }, [localTargets, query]);

    useEffect(() => {
        if ((query || "").trim() && filteredTargets.length === 0) {
            setForm((prev) => ({
                ...prev,
                ad_soyad: prev.ad_soyad || query,
            }));
        }
    }, [query, filteredTargets.length]);

    const selectedTarget = useMemo(() => {
        return (
            filteredTargets.find((x) => x.id === targetPlakaId) ||
            localTargets.find((x) => x.id === targetPlakaId)
        );
    }, [filteredTargets, localTargets, targetPlakaId]);

    const noResult = canEdit && !!(query || "").trim() && filteredTargets.length === 0;

    const handleFormChange = (field) => (e) => {
        setErrorText("");
        setForm((prev) => ({
            ...prev,
            [field]: e.target.value,
        }));
    };

    const handleCreateDriver = async () => {
        if (!onCreateDriver) {
            setErrorText("Şoför ekleme fonksiyonu tanımlı değil.");
            return;
        }

        const payload = {
            ad_soyad: form.ad_soyad?.trim(),
            telefon: form.telefon?.trim(),
            tc_no: form.tc_no?.trim(),
        };

        if (!payload.ad_soyad || !payload.telefon || !payload.tc_no) {
            setErrorText("Lütfen ad soyad, telefon ve TC alanlarını doldurun.");
            return;
        }

        try {
            setSaving(true);
            setErrorText("");

            const created = await onCreateDriver(payload);

            if (!created?.id) {
                throw new Error("Kayıt sonrası geçerli veri dönmedi.");
            }

            setLocalTargets((prev) => {
                const exists = prev.some((x) => x.id === created.id);
                return exists
                    ? prev.map((x) => (x.id === created.id ? created : x))
                    : [created, ...prev];
            });

            setTargetPlakaId(created.id);
            setShowCreateForm(false);
            setQuery("");

            setForm({
                ad_soyad: "",
                telefon: "",
                tc_no: "",
            });
        } catch (error) {
            console.error("Şoför ekleme hatası:", error);
            setErrorText(error?.message || "Şoför kaydedilirken bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: "24px",
                    overflow: "hidden",
                    background:
                        "linear-gradient(180deg, rgba(10,15,30,0.98) 0%, rgba(17,24,39,0.98) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 28px 90px rgba(0,0,0,0.48)",
                    backdropFilter: "blur(16px)",
                    ...(s?.swapDialogPaper || {}),
                },
            }}
        >
            <DialogTitle
                sx={{
                    px: 3,
                    py: 2.2,
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    background:
                        "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.10))",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    ...(s?.swapDialogTitle || {}),
                }}
            >
                <SwapHorizRoundedIcon sx={{ color: "#60a5fa" }} />
                Şoför Değiştir
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    px: 3,
                    py: 2.5,
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "transparent",
                    ...(s?.swapDialogContent || {}),
                }}
            >
                {!canEdit ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>
                        Bu işlem için yazma yetkiniz yok.
                    </Typography>
                ) : !sourceRow ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.75)" }}>
                        Kaynak satır bulunamadı.
                    </Typography>
                ) : !sourcePlaka ? (
                    <Typography
                        component="div"
                        sx={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}
                    >
                        <div>Bu satırdaki araç plakalar tablosunda bulunamadı.</div>
                        <div>
                            Çekici: <b>{sourceRow?.cekici || "-"}</b>
                        </div>
                        <div>
                            Dorse: <b>{sourceRow?.dorse || "-"}</b>
                        </div>
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
                            gap: 2,
                            alignItems: "start",
                        }}
                    >
                        <Box>
                            <Typography
                                component="div"
                                sx={{
                                    color: "#e5e7eb",
                                    fontWeight: 800,
                                    mb: 1.2,
                                    fontSize: 13,
                                    letterSpacing: 0.3,
                                }}
                            >
                                KAYNAK ARAÇ
                            </Typography>

                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: "20px",
                                    background:
                                        "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(255,255,255,0.03))",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                                    ...(s?.swapCard || {}),
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <LocalShippingOutlinedIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                                    <Typography
                                        component="div"
                                        sx={{ color: "#fff", fontWeight: 900, fontSize: 15 }}
                                    >
                                        {sourcePlaka.cekici || "-"} • {sourcePlaka.dorse || "-"}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                                    <PersonOutlineIcon
                                        sx={{ color: "rgba(255,255,255,0.75)", fontSize: 18 }}
                                    />
                                    <Typography
                                        component="div"
                                        sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 700 }}
                                    >
                                        {sourcePlaka.ad_soyad || "-"}
                                    </Typography>
                                </Box>

                                <Typography
                                    component="div"
                                    sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}
                                >
                                    Telefon: <b>{sourcePlaka.telefon || "-"}</b>
                                </Typography>
                                <Typography
                                    component="div"
                                    sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}
                                >
                                    TC: <b>{sourcePlaka.tc_no || "-"}</b>
                                </Typography>
                            </Box>

                            {selectedTarget && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 1.6,
                                        borderRadius: "16px",
                                        background: "rgba(34,197,94,0.10)",
                                        border: "1px solid rgba(34,197,94,0.22)",
                                    }}
                                >
                                    <Typography
                                        component="div"
                                        sx={{ color: "#bbf7d0", fontWeight: 800, fontSize: 13 }}
                                    >
                                        Seçilen Hedef
                                    </Typography>
                                    <Typography
                                        component="div"
                                        sx={{ color: "#fff", fontWeight: 800, mt: 0.5 }}
                                    >
                                        {selectedTarget.cekici || "-"} • {selectedTarget.dorse || "-"}
                                    </Typography>
                                    <Typography
                                        component="div"
                                        sx={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}
                                    >
                                        {selectedTarget.ad_soyad || "-"} | {selectedTarget.telefon || "-"} |{" "}
                                        {selectedTarget.tc_no || "-"}
                                    </Typography>
                                </Box>
                            )}

                            <Typography
                                component="div"
                                sx={{
                                    mt: 2,
                                    color: "rgba(255,255,255,0.5)",
                                    fontSize: 12,
                                    lineHeight: 1.7,
                                }}
                            >
                                * Bu işlem sadece <b>ad_soyad</b>, <b>telefon</b> ve <b>tc_no</b>{" "}
                                alanlarını iki araç arasında karşılıklı değiştirir.
                            </Typography>
                        </Box>

                        <Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 1.5,
                                    py: 1.1,
                                    borderRadius: "16px",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    background: "rgba(255,255,255,0.04)",
                                    transition: "all .2s ease",
                                    "&:focus-within": {
                                        border: "1px solid rgba(59,130,246,0.45)",
                                        boxShadow: "0 0 0 4px rgba(59,130,246,0.10)",
                                        background: "rgba(255,255,255,0.05)",
                                    },
                                    ...(s?.search || {}),
                                }}
                            >
                                <SearchIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                                <InputBase
                                    placeholder="Hedef aracı ara (çekici / dorse / isim / tc / tel)"
                                    sx={{
                                        flex: 1,
                                        color: "#fff",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        ...(s?.searchInput || {}),
                                    }}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                {!!query && (
                                    <Chip
                                        label={`${filteredTargets.length} sonuç`}
                                        size="small"
                                        sx={{
                                            bgcolor: "rgba(59,130,246,0.14)",
                                            color: "#93c5fd",
                                            fontWeight: 800,
                                            border: "1px solid rgba(59,130,246,0.25)",
                                        }}
                                    />
                                )}
                            </Box>

                            <Divider sx={{ my: 1.8, borderColor: "rgba(255,255,255,0.06)" }} />

                            {noResult && (
                                <Fade in>
                                    <Box
                                        sx={{
                                            mb: 1.6,
                                            p: 2,
                                            borderRadius: "18px",
                                            border: "1px solid rgba(245,158,11,0.25)",
                                            background:
                                                "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(255,255,255,0.03))",
                                        }}
                                    >
                                        <Stack spacing={1.4}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <PersonAddAlt1RoundedIcon sx={{ color: "#fbbf24" }} />
                                                <Typography
                                                    component="div"
                                                    sx={{ color: "#fff", fontWeight: 900 }}
                                                >
                                                    Aranan veri bulunamadı
                                                </Typography>
                                            </Box>

                                            <Typography
                                                component="div"
                                                sx={{ color: "rgba(255,255,255,0.74)", fontSize: 14 }}
                                            >
                                                Sisteme yeni bir şoför eklemek ister misiniz?
                                            </Typography>

                                            {!showCreateForm ? (
                                                <Box sx={{ display: "flex", gap: 1 }}>
                                                    <Button
                                                        onClick={() => setShowCreateForm(true)}
                                                        startIcon={<AddCircleOutlineRoundedIcon />}
                                                        variant="contained"
                                                        sx={{
                                                            textTransform: "none",
                                                            fontWeight: 800,
                                                            borderRadius: "12px",
                                                            background:
                                                                "linear-gradient(135deg, #f59e0b, #fbbf24)",
                                                            color: "#111827",
                                                            "&:hover": {
                                                                background:
                                                                    "linear-gradient(135deg, #d97706, #f59e0b)",
                                                            },
                                                        }}
                                                    >
                                                        Evet, ekle
                                                    </Button>

                                                    <Button
                                                        onClick={() => setShowCreateForm(false)}
                                                        sx={{
                                                            textTransform: "none",
                                                            fontWeight: 800,
                                                            borderRadius: "12px",
                                                            color: "rgba(255,255,255,0.82)",
                                                            background: "rgba(255,255,255,0.05)",
                                                            border: "1px solid rgba(255,255,255,0.08)",
                                                        }}
                                                    >
                                                        Vazgeç
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        p: 1.6,
                                                        borderRadius: "16px",
                                                        background: "rgba(255,255,255,0.03)",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                    }}
                                                >
                                                    <Stack spacing={1.2}>
                                                        <TextField
                                                            label="Ad Soyad"
                                                            value={form.ad_soyad}
                                                            onChange={handleFormChange("ad_soyad")}
                                                            fullWidth
                                                            size="small"
                                                            InputLabelProps={{
                                                                sx: { color: "rgba(255,255,255,0.65)" },
                                                            }}
                                                            sx={darkFieldSx}
                                                        />

                                                        <TextField
                                                            label="Telefon"
                                                            value={form.telefon}
                                                            onChange={handleFormChange("telefon")}
                                                            fullWidth
                                                            size="small"
                                                            InputLabelProps={{
                                                                sx: { color: "rgba(255,255,255,0.65)" },
                                                            }}
                                                            sx={darkFieldSx}
                                                        />

                                                        <TextField
                                                            label="TC No"
                                                            value={form.tc_no}
                                                            onChange={handleFormChange("tc_no")}
                                                            fullWidth
                                                            size="small"
                                                            InputLabelProps={{
                                                                sx: { color: "rgba(255,255,255,0.65)" },
                                                            }}
                                                            sx={darkFieldSx}
                                                        />

                                                        {!!errorText && (
                                                            <Typography
                                                                component="div"
                                                                sx={{
                                                                    color: "#fca5a5",
                                                                    fontSize: 13,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {errorText}
                                                            </Typography>
                                                        )}

                                                        <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
                                                            <Button
                                                                onClick={handleCreateDriver}
                                                                disabled={
                                                                    saving ||
                                                                    !form.ad_soyad?.trim() ||
                                                                    !form.telefon?.trim() ||
                                                                    !form.tc_no?.trim()
                                                                }
                                                                startIcon={
                                                                    saving ? (
                                                                        <CircularProgress size={16} color="inherit" />
                                                                    ) : (
                                                                        <CheckCircleRoundedIcon />
                                                                    )
                                                                }
                                                                variant="contained"
                                                                sx={{
                                                                    textTransform: "none",
                                                                    fontWeight: 900,
                                                                    borderRadius: "12px",
                                                                    px: 2,
                                                                    background:
                                                                        "linear-gradient(135deg, #2563eb, #3b82f6)",
                                                                }}
                                                            >
                                                                {saving ? "Kaydediliyor..." : "Kaydet"}
                                                            </Button>

                                                            <Button
                                                                onClick={() => setShowCreateForm(false)}
                                                                disabled={saving}
                                                                sx={{
                                                                    textTransform: "none",
                                                                    fontWeight: 800,
                                                                    borderRadius: "12px",
                                                                    color: "rgba(255,255,255,0.82)",
                                                                    background: "rgba(255,255,255,0.05)",
                                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                                }}
                                                            >
                                                                İptal
                                                            </Button>
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Box>
                                </Fade>
                            )}

                            <Box sx={{ maxHeight: 420, overflow: "auto", pr: 0.3 }}>
                                {filteredTargets.length === 0 ? (
                                    <Box
                                        sx={{
                                            py: 4,
                                            textAlign: "center",
                                            borderRadius: "18px",
                                            border: "1px dashed rgba(255,255,255,0.10)",
                                            background: "rgba(255,255,255,0.02)",
                                        }}
                                    >
                                        <Typography
                                            component="div"
                                            sx={{ color: "rgba(255,255,255,0.58)", fontWeight: 700 }}
                                        >
                                            Sonuç bulunamadı.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List dense sx={{ p: 0, display: "grid", gap: 1 }}>
                                        {filteredTargets.map((p) => {
                                            const selected = targetPlakaId === p.id;

                                            return (
                                                <ListItemButton
                                                    key={p.id}
                                                    onClick={() => setTargetPlakaId(p.id)}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: "18px",
                                                        alignItems: "flex-start",
                                                        border: selected
                                                            ? "1px solid rgba(59,130,246,0.40)"
                                                            : "1px solid rgba(255,255,255,0.06)",
                                                        background: selected
                                                            ? "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(255,255,255,0.04))"
                                                            : "rgba(255,255,255,0.03)",
                                                        transition: "all .18s ease",
                                                        "&:hover": {
                                                            background:
                                                                "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(255,255,255,0.04))",
                                                            transform: "translateY(-1px)",
                                                            borderColor: "rgba(59,130,246,0.22)",
                                                        },
                                                        ...(s?.listItemBtn || {}),
                                                    }}
                                                >
                                                    <ListItemText
                                                        primaryTypographyProps={{ component: "div" }}
                                                        secondaryTypographyProps={{ component: "div" }}
                                                        primary={
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "space-between",
                                                                    gap: 1,
                                                                }}
                                                            >
                                                                <Typography
                                                                    component="div"
                                                                    sx={{
                                                                        color: "#fff",
                                                                        fontWeight: 900,
                                                                        fontSize: 14,
                                                                    }}
                                                                >
                                                                    {p.cekici || "-"} • {p.dorse || "-"}
                                                                </Typography>

                                                                {selected && (
                                                                    <Chip
                                                                        label="Seçildi"
                                                                        size="small"
                                                                        sx={{
                                                                            height: 24,
                                                                            bgcolor: "rgba(59,130,246,0.18)",
                                                                            color: "#bfdbfe",
                                                                            fontWeight: 800,
                                                                            border:
                                                                                "1px solid rgba(59,130,246,0.28)",
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box sx={{ mt: 0.6 }}>
                                                                <Typography
                                                                    component="div"
                                                                    sx={{
                                                                        color: "rgba(255,255,255,0.82)",
                                                                        fontWeight: 700,
                                                                        fontSize: 13,
                                                                    }}
                                                                >
                                                                    {p.ad_soyad || "-"}
                                                                </Typography>
                                                                <Typography
                                                                    component="div"
                                                                    sx={{
                                                                        color: "rgba(255,255,255,0.58)",
                                                                        fontWeight: 600,
                                                                        fontSize: 12,
                                                                        mt: 0.2,
                                                                    }}
                                                                >
                                                                    {p.telefon || "-"} | {p.tc_no || "-"}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItemButton>
                                            );
                                        })}
                                    </List>
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    gap: 1,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                }}
            >
                <Button
                    onClick={onClose}
                    sx={{
                        color: "rgba(255,255,255,0.85)",
                        px: 2,
                        py: 1,
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 800,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        "&:hover": { background: "rgba(255,255,255,0.08)" },
                        ...(s?.secondaryBtn || {}),
                    }}
                >
                    Vazgeç
                </Button>

                <Button
                    onClick={onSwap}
                    variant="contained"
                    disabled={!canEdit || !sourcePlaka?.id || !targetPlakaId}
                    sx={{
                        px: 2.2,
                        py: 1,
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 900,
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        boxShadow: "0 10px 24px rgba(37,99,235,0.30)",
                        "&:hover": {
                            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                        },
                        "&.Mui-disabled": {
                            background: "rgba(255,255,255,0.10)",
                            color: "rgba(255,255,255,0.35)",
                        },
                        ...(s?.primaryBtn || {}),
                    }}
                >
                    Değiştir
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const darkFieldSx = {
    "& .MuiOutlinedInput-root": {
        color: "#fff",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.03)",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.10)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(59,130,246,0.32)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#60a5fa",
        },
    },
    "& .MuiInputBase-input::placeholder": {
        color: "rgba(255,255,255,0.45)",
        opacity: 1,
    },
};