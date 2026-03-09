// src/plakaAtama/SeferDetayDrawer.js
import React from "react";
import {
    Drawer,
    Box,
    Stack,
    Typography,
    Chip,
    IconButton,
    TextField,
    Button,
    Tooltip,
    Snackbar,
    Alert,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const Section = ({ title, subtitle, icon, children, sx }) => (
    <Box
        sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            ...sx,
        }}
    >
        <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    flex: "0 0 auto",
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{title}</Typography>
                {subtitle ? (
                    <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)" }}>{subtitle}</Typography>
                ) : null}
            </Box>
        </Stack>

        {children}
    </Box>
);

export default function SeferDetayDrawer({
    open,
    onClose,
    row,
    s,
    openListbox,
    handleChange,

    // ✅ YENİ
    canEdit = true,
}) {
    const [savedOpen, setSavedOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    const selectFieldSx = (clickable) => ({
        "& .MuiOutlinedInput-root": {
            borderRadius: 2.2,
            backgroundColor: clickable ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
            backdropFilter: "blur(8px)",
            transition: "all .15s ease",
            cursor: clickable ? "pointer" : "text",
            "& fieldset": { borderColor: "rgba(255,255,255,0.14)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.28)" },
            "&.Mui-focused fieldset": { borderColor: "rgba(130,170,255,0.85)" },
        },
        "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.65)" },
        "& .MuiInputBase-input": { color: "rgba(255,255,255,0.92)" },
    });

    const handleSave = async () => {
        if (!row) return;
        if (!canEdit) return;

        try {
            setSaving(true);
            await new Promise((r) => setTimeout(r, 350));
            setSavedOpen(true);
        } catch (err) {
            console.error("Save error:", err);
        } finally {
            setSaving(false);
        }
    };

    const openLb = (e, id, field) => {
        if (!canEdit) return;
        openListbox?.(e, id, field);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    ...(s?.drawerPaper || {}),
                    width: { xs: "100%", sm: 520 },
                    borderRadius: { xs: 0, sm: "18px 0 0 18px" },
                    overflow: "hidden",
                    background:
                        "radial-gradient(1200px 600px at 20% 0%, rgba(120,160,255,0.18), transparent 50%)," +
                        "linear-gradient(180deg, rgba(18,20,26,0.96), rgba(14,16,22,0.96))",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                },
            }}
        >
            {/* Sticky Header */}
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 5,
                    px: 2,
                    pt: 2,
                    pb: 1.5,
                    backdropFilter: "blur(12px)",
                    background: "rgba(10,12,18,0.70)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.2 }}>Sefer Detayı</Typography>

                            <Chip
                                size="small"
                                label={row?.sefer ? `#${row.sefer}` : "Sefer yok"}
                                sx={{
                                    height: 24,
                                    fontWeight: 700,
                                    borderRadius: 999,
                                    background: "rgba(120,160,255,0.14)",
                                    color: "rgba(220,235,255,0.95)",
                                    border: "1px solid rgba(120,160,255,0.22)",
                                }}
                            />
                            {!canEdit ? (
                                <Chip
                                    size="small"
                                    label="Sadece Görüntüleme"
                                    sx={{
                                        height: 24,
                                        fontWeight: 800,
                                        borderRadius: 999,
                                        background: "rgba(255,255,255,0.06)",
                                        color: "rgba(255,255,255,0.85)",
                                        border: "1px solid rgba(255,255,255,0.10)",
                                    }}
                                />
                            ) : null}
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.9, flexWrap: "wrap" }}>
                            <Chip
                                size="small"
                                label={row?.tc ? `TC: ${row.tc}` : "TC: -"}
                                sx={{
                                    height: 24,
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.06)",
                                    color: "rgba(255,255,255,0.85)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                }}
                            />
                            <Chip
                                size="small"
                                label={row?.sevk ? `Sevk: ${row.sevk}` : "Sevk: -"}
                                sx={{
                                    height: 24,
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.06)",
                                    color: "rgba(255,255,255,0.85)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                }}
                            />
                        </Stack>
                    </Box>

                    <Tooltip title="Kapat">
                        <IconButton
                            onClick={onClose}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                "&:hover": { background: "rgba(255,255,255,0.10)" },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            <Box sx={{ p: 2.2, pb: 10 }}>
                {!row ? (
                    <Box
                        sx={{
                            p: 2.2,
                            borderRadius: 3,
                            border: "1px dashed rgba(255,255,255,0.18)",
                            background: "rgba(255,255,255,0.04)",
                        }}
                    >
                        <Typography sx={{ color: "rgba(255,255,255,0.70)" }}>Bir satır seçin.</Typography>
                    </Box>
                ) : (
                    <>
                        {/* Hero */}
                        <Box
                            sx={{
                                p: 2.2,
                                borderRadius: 3,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "linear-gradient(135deg, rgba(120,160,255,0.16), rgba(255,255,255,0.04))",
                                backdropFilter: "blur(10px)",
                                boxShadow: "0 16px 40px rgba(0,0,0,0.30)",
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: 18, fontWeight: 900 }} noWrap>
                                        {row.sefer || "Sefer"}
                                    </Typography>
                                    <Typography sx={{ mt: 0.3, fontSize: 13, color: "rgba(255,255,255,0.70)" }} noWrap>
                                        {row.sevk ? `Sevk: ${row.sevk}` : "Sevk: -"}
                                    </Typography>

                                    <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: "wrap" }}>
                                        <Chip size="small" label={`Çekici: ${row.cekici || "-"}`} sx={{ borderRadius: 999 }} />
                                        <Chip size="small" label={`Dorse: ${row.dorse || "-"}`} sx={{ borderRadius: 999 }} />
                                        <Chip size="small" label={`TC: ${row.tc || "-"}`} sx={{ borderRadius: 999 }} />
                                    </Stack>
                                </Box>

                                <Box sx={{ textAlign: "right" }}>
                                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>Sürücü</Typography>
                                    <Typography sx={{ fontWeight: 800 }}>{row.surucu || "-"}</Typography>
                                    <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.70)" }}>{row.tel || "-"}</Typography>
                                </Box>
                            </Stack>
                        </Box>

                        <Stack spacing={2.2} sx={{ mt: 2.2 }}>
                            {/* Araç & Sürücü */}
                            <Section
                                title="Araç & Sürücü"
                                subtitle="Araç ve sürücü bilgilerini seçerek güncelleyin."
                                icon={<LocalShippingOutlinedIcon fontSize="small" />}
                            >
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.4 }}>
                                    <TextField
                                        fullWidth
                                        label="Çekici"
                                        value={row.cekici ?? ""}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <KeyboardArrowDownIcon sx={{ opacity: canEdit ? 0.85 : 0.35 }} />,
                                        }}
                                        onClick={(e) => openLb(e, row.id, "cekici")}
                                        sx={selectFieldSx(canEdit)}
                                        disabled={!canEdit}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Dorse"
                                        value={row.dorse ?? ""}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <KeyboardArrowDownIcon sx={{ opacity: canEdit ? 0.85 : 0.35 }} />,
                                        }}
                                        onClick={(e) => openLb(e, row.id, "dorse")}
                                        sx={selectFieldSx(canEdit)}
                                        disabled={!canEdit}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Sürücü"
                                        value={row.surucu ?? ""}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <KeyboardArrowDownIcon sx={{ opacity: canEdit ? 0.85 : 0.35 }} />,
                                        }}
                                        onClick={(e) => openLb(e, row.id, "surucu")}
                                        sx={selectFieldSx(canEdit)}
                                        disabled={!canEdit}
                                    />

                                    <TextField
                                        fullWidth
                                        label="Telefon"
                                        value={row.tel ?? ""}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <KeyboardArrowDownIcon sx={{ opacity: canEdit ? 0.85 : 0.35 }} />,
                                        }}
                                        onClick={(e) => openLb(e, row.id, "tel")}
                                        sx={selectFieldSx(canEdit)}
                                        disabled={!canEdit}
                                    />

                                    <TextField
                                        fullWidth
                                        label="T.C. Kimlik"
                                        value={row.tc ?? ""}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <KeyboardArrowDownIcon sx={{ opacity: canEdit ? 0.85 : 0.35 }} />,
                                        }}
                                        onClick={(e) => openLb(e, row.id, "tc")}
                                        sx={selectFieldSx(canEdit)}
                                        disabled={!canEdit}
                                    />

                                    <TextField
                                        fullWidth
                                        label="VKN"
                                        value={row.vkn ?? ""}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <KeyboardArrowDownIcon sx={{ opacity: canEdit ? 0.85 : 0.35 }} />,
                                        }}
                                        onClick={(e) => openLb(e, row.id, "vkn")}
                                        sx={selectFieldSx(canEdit)}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Section>

                            {/* Varışlar */}
                            <Section title="Varışlar" subtitle="Teslimat noktalarını düzenleyin." icon={<PlaceOutlinedIcon fontSize="small" />}>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.4 }}>
                                    <TextField
                                        fullWidth
                                        label="Varış 1"
                                        value={row.varis1 ?? ""}
                                        onChange={(e) => handleChange(row.id, "varis1", e.target.value)}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        sx={selectFieldSx(false)}
                                        disabled={!canEdit}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Varış 2"
                                        value={row.varis2 ?? ""}
                                        onChange={(e) => handleChange(row.id, "varis2", e.target.value)}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        sx={selectFieldSx(false)}
                                        disabled={!canEdit}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Varış 3"
                                        value={row.varis3 ?? ""}
                                        onChange={(e) => handleChange(row.id, "varis3", e.target.value)}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        sx={selectFieldSx(false)}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Section>

                            {/* Evrak & Ücret */}
                            <Section title="Evrak & Ücret" subtitle="İrsaliye, navlun ve teslimat bilgileri." icon={<ReceiptLongOutlinedIcon fontSize="small" />}>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.4 }}>
                                    <TextField
                                        fullWidth
                                        label="İrsaliye"
                                        value={row.irsaliye ?? ""}
                                        onChange={(e) => handleChange(row.id, "irsaliye", e.target.value)}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        sx={selectFieldSx(false)}
                                        disabled={!canEdit}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Navlun"
                                        value={row.navlun ?? ""}
                                        onChange={(e) => handleChange(row.id, "navlun", e.target.value)}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        sx={selectFieldSx(false)}
                                        disabled={!canEdit}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Teslimat"
                                        value={row.teslimat ?? ""}
                                        onChange={(e) => handleChange(row.id, "teslimat", e.target.value)}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        sx={selectFieldSx(false)}
                                        disabled={!canEdit}
                                    />
                                </Box>
                            </Section>

                            {/* Sistem */}
                            <Section title="Sistem" subtitle="Otomatik alanlar." icon={<InfoOutlinedIcon fontSize="small" />} sx={{ opacity: 0.9 }}>
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.4 }}>
                                    <TextField
                                        fullWidth
                                        label="Güncellendi"
                                        value={row.guncellendi ?? ""}
                                        size="small"
                                        variant="outlined"
                                        InputLabelProps={{ shrink: true }}
                                        sx={selectFieldSx(false)}
                                        disabled
                                    />
                                </Box>
                            </Section>
                        </Stack>
                    </>
                )}
            </Box>

            {/* Sticky Actions */}
            <Box
                sx={{
                    position: "fixed",
                    bottom: 0,
                    right: 0,
                    width: { xs: "100%", sm: 520 },
                    p: 2,
                    backdropFilter: "blur(14px)",
                    background: "rgba(10,12,18,0.75)",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Stack direction="row" spacing={1.2}>
                    <Button
                        fullWidth
                        startIcon={<SaveIcon />}
                        variant="contained"
                        onClick={handleSave}
                        disabled={!row || saving || !canEdit}
                        sx={{
                            borderRadius: 2.2,
                            py: 1.15,
                            fontWeight: 800,
                            textTransform: "none",
                            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                        }}
                    >
                        {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        sx={{
                            borderRadius: 2.2,
                            py: 1.15,
                            fontWeight: 800,
                            textTransform: "none",
                            borderColor: "rgba(255,255,255,0.22)",
                            color: "rgba(255,255,255,0.90)",
                            "&:hover": { borderColor: "rgba(255,255,255,0.35)" },
                        }}
                    >
                        Kapat
                    </Button>
                </Stack>
            </Box>

            <Snackbar open={savedOpen} autoHideDuration={2500} onClose={() => setSavedOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert severity="success" variant="filled" onClose={() => setSavedOpen(false)} sx={{ width: "100%", borderRadius: 2 }}>
                    Sefer başarıyla kaydedildi
                </Alert>
            </Snackbar>
        </Drawer>
    );
}