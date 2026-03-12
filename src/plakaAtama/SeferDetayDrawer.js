// src/plakaAtama/SeferDetayDrawer.js
import React from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
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
                <Typography sx={{ fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)" }}>
                        {subtitle}
                    </Typography>
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
    canEdit = true,
}) {
    const [savedOpen, setSavedOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    const [scanOpen, setScanOpen] = React.useState(false);
    const [scanError, setScanError] = React.useState("");
    const [scanLoading, setScanLoading] = React.useState(false);

    const qrRef = React.useRef(null);
    const qrStartingRef = React.useRef(false);
    const qrRegionId = "irsaliye-qr-reader";

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
        "& .MuiInputBase-input.Mui-disabled": {
            WebkitTextFillColor: "rgba(255,255,255,0.72)",
        },
        "& .MuiSvgIcon-root": {
            color: "rgba(255,255,255,0.75)",
        },
    });

    const extractIrsaliyeNo = React.useCallback((rawText) => {
        const text = String(rawText ?? "").trim();
        console.log("RAW QR TEXT:", text);

        try {
            const parsed = JSON.parse(text);
            if (parsed?.no) {
                return String(parsed.no).trim();
            }
        } catch (_) {
            // JSON değilse fallback
        }

        const patterns = [
            /"no"\s*:\s*"([^"]+)"/i,
            /'no'\s*:\s*'([^']+)'/i,
            /\bno\b\s*[:=]\s*"([^"]+)"/i,
            /\bno\b\s*[:=]\s*'([^']+)'/i,
            /\bno\b\s*[:=]\s*([A-Z0-9]+)/i,
            /\b(BE[0-9A-Z]+)\b/i,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match?.[1]) return String(match[1]).trim();
            if (match?.[0]?.startsWith("BE")) return String(match[0]).trim();
        }

        return "";
    }, []);

    const stopScanner = React.useCallback(async () => {
        try {
            if (qrRef.current) {
                try {
                    await qrRef.current.stop();
                } catch (_) { }

                try {
                    await qrRef.current.clear();
                } catch (_) { }

                qrRef.current = null;
            }
        } catch (e) {
            console.error("QR stop error:", e);
        } finally {
            qrStartingRef.current = false;
        }
    }, []);

    const closeScanner = React.useCallback(async () => {
        await stopScanner();
        setScanOpen(false);
        setScanLoading(false);
        setScanError("");
    }, [stopScanner]);

    const startScanner = React.useCallback(async () => {
        if (!row?.id || !canEdit) return;
        if (qrStartingRef.current || qrRef.current) return;

        qrStartingRef.current = true;
        setScanError("");
        setScanLoading(true);
        setScanOpen(true);

        setTimeout(async () => {
            try {
                const qrContainer = document.getElementById(qrRegionId);
                if (!qrContainer) {
                    setScanError("QR alanı hazırlanamadı.");
                    setScanLoading(false);
                    qrStartingRef.current = false;
                    return;
                }

                const cameras = await Html5Qrcode.getCameras();

                if (!cameras || cameras.length === 0) {
                    setScanError("Kamera bulunamadı.");
                    setScanLoading(false);
                    qrStartingRef.current = false;
                    return;
                }

                const backCamera =
                    cameras.find((cam) => /back|rear|environment/gi.test(cam.label || "")) ||
                    cameras[cameras.length - 1] ||
                    cameras[0];

                const qr = new Html5Qrcode(qrRegionId, {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false,
                });

                qrRef.current = qr;

                await qr.start(
                    { deviceId: { exact: backCamera.id } },
                    {
                        fps: 12,
                        qrbox: { width: 320, height: 320 },
                        aspectRatio: 1.0,
                        disableFlip: false,
                        videoConstraints: {
                            deviceId: { exact: backCamera.id },
                            facingMode: "environment",
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                        },
                    },
                    async (decodedText) => {
                        try {
                            console.log("QR OKUNDU:", decodedText);

                            const irsaliyeNo = extractIrsaliyeNo(decodedText);
                            console.log("AYIKLANAN IRSALIYE:", irsaliyeNo);

                            if (!irsaliyeNo) {
                                setScanError(
                                    `QR içinde "no" alanı bulunamadı. Okunan veri: ${decodedText}`
                                );
                                return;
                            }

                            handleChange(row.id, "irsaliye", irsaliyeNo);
                            setSavedOpen(true);
                            await closeScanner();
                        } catch (err) {
                            console.error("QR decode handling error:", err);
                            setScanError("QR verisi işlenemedi.");
                        }
                    },
                    () => {
                        // decode başarısız callback'i sessiz bırakıldı
                    }
                );

                setScanLoading(false);
                qrStartingRef.current = false;
            } catch (e) {
                console.error("QR start error:", e);
                setScanError(e?.message || "Kamera başlatılamadı.");
                setScanLoading(false);
                qrStartingRef.current = false;
            }
        }, 350);
    }, [row, canEdit, extractIrsaliyeNo, handleChange, closeScanner]);

    React.useEffect(() => {
        return () => {
            stopScanner();
        };
    }, [stopScanner]);

    const handleSave = async () => {
        if (!row || !canEdit) return;

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
                    maxWidth: "100vw",
                    borderRadius: { xs: 0, sm: "18px 0 0 18px" },
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    background:
                        "radial-gradient(1200px 600px at 20% 0%, rgba(120,160,255,0.18), transparent 50%)," +
                        "linear-gradient(180deg, rgba(18,20,26,0.96), rgba(14,16,22,0.96))",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                },
            }}
        >
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 5,
                    px: 2,
                    pt: 2,
                    pb: 1.5,
                    flexShrink: 0,
                    backdropFilter: "blur(12px)",
                    background: "rgba(10,12,18,0.78)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 1 }}>
                            <Typography
                                sx={{
                                    fontSize: 16,
                                    fontWeight: 800,
                                    letterSpacing: 0.2,
                                    color: "#fff",
                                }}
                            >
                                Sefer Detayı
                            </Typography>

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

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 0.9, flexWrap: "wrap", rowGap: 1 }}
                        >
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
                                flexShrink: 0,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                color: "#fff",
                                "&:hover": { background: "rgba(255,255,255,0.10)" },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    p: 2.2,
                    pb: 2,
                    pr: 1.4,
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.18) transparent",
                    "&::-webkit-scrollbar": {
                        width: 8,
                    },
                    "&::-webkit-scrollbar-track": {
                        background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "rgba(255,255,255,0.16)",
                        borderRadius: 999,
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                        background: "rgba(255,255,255,0.24)",
                    },
                }}
            >
                {!row ? (
                    <Box
                        sx={{
                            p: 2.2,
                            borderRadius: 3,
                            border: "1px dashed rgba(255,255,255,0.18)",
                            background: "rgba(255,255,255,0.04)",
                        }}
                    >
                        <Typography sx={{ color: "rgba(255,255,255,0.70)" }}>
                            Bir satır seçin.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                p: 2.2,
                                borderRadius: 3,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background:
                                    "linear-gradient(135deg, rgba(120,160,255,0.16), rgba(255,255,255,0.04))",
                                backdropFilter: "blur(10px)",
                                boxShadow: "0 16px 40px rgba(0,0,0,0.30)",
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", sm: "flex-start" }}
                                spacing={2}
                            >
                                <Box sx={{ minWidth: 0, width: "100%" }}>
                                    <Typography
                                        sx={{
                                            fontSize: 18,
                                            fontWeight: 900,
                                            color: "#fff",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {row.sefer || "Sefer"}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 0.3,
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.70)",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {row.sevk ? `Sevk: ${row.sevk}` : "Sevk: -"}
                                    </Typography>

                                    <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: "wrap", rowGap: 1 }}>
                                        <Chip size="small" label={`Çekici: ${row.cekici || "-"}`} sx={{ borderRadius: 999 }} />
                                        <Chip size="small" label={`Dorse: ${row.dorse || "-"}`} sx={{ borderRadius: 999 }} />
                                        <Chip size="small" label={`TC: ${row.tc || "-"}`} sx={{ borderRadius: 999 }} />
                                    </Stack>
                                </Box>

                                <Box
                                    sx={{
                                        textAlign: { xs: "left", sm: "right" },
                                        minWidth: { xs: "100%", sm: 140 },
                                    }}
                                >
                                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                                        Sürücü
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            color: "#fff",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {row.surucu || "-"}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: 12.5,
                                            color: "rgba(255,255,255,0.70)",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {row.tel || "-"}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        <Stack spacing={2.2} sx={{ mt: 2.2 }}>
                            <Section
                                title="Araç & Sürücü"
                                subtitle="Araç ve sürücü bilgilerini seçerek güncelleyin."
                                icon={<LocalShippingOutlinedIcon fontSize="small" />}
                            >
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1.4,
                                    }}
                                >
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

                            <Section
                                title="Varışlar"
                                subtitle="Teslimat noktalarını düzenleyin."
                                icon={<PlaceOutlinedIcon fontSize="small" />}
                            >
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1.4,
                                    }}
                                >
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

                            <Section
                                title="Evrak & Ücret"
                                subtitle="İrsaliye, navlun ve teslimat bilgileri."
                                icon={<ReceiptLongOutlinedIcon fontSize="small" />}
                            >
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                        gap: 1.4,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr auto",
                                            gap: 1,
                                            alignItems: "start",
                                            gridColumn: { xs: "1 / -1", sm: "auto" },
                                        }}
                                    >
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

                                        <Button
                                            variant="outlined"
                                            onClick={startScanner}
                                            disabled={!canEdit || scanLoading}
                                            sx={{
                                                minWidth: 130,
                                                height: 40,
                                                borderRadius: 2.2,
                                                textTransform: "none",
                                                fontWeight: 700,
                                                borderColor: "rgba(255,255,255,0.22)",
                                                color: "rgba(255,255,255,0.90)",
                                                "&:hover": { borderColor: "rgba(255,255,255,0.35)" },
                                            }}
                                        >
                                            {scanLoading ? "Açılıyor..." : "İrsaliye Okut"}
                                        </Button>
                                    </Box>

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

                            <Section
                                title="Sistem"
                                subtitle="Otomatik alanlar."
                                icon={<InfoOutlinedIcon fontSize="small" />}
                                sx={{ opacity: 0.9 }}
                            >
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

            <Box
                sx={{
                    position: "sticky",
                    bottom: 0,
                    zIndex: 6,
                    flexShrink: 0,
                    p: 2,
                    backdropFilter: "blur(14px)",
                    background: "rgba(10,12,18,0.92)",
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

            <Dialog
                open={scanOpen}
                onClose={closeScanner}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: "rgba(15,23,42,0.98)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.08)",
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>
                    İrsaliye QR Okut
                </DialogTitle>

                <DialogContent>
                    <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.68)", mb: 1.5 }}>
                        Kamerayı QR koda tutun. QR içindeki <b>no</b> değeri otomatik olarak irsaliye alanına yazılır.
                    </Typography>

                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.60)", mb: 1.5 }}>
                        Belgeyi düz zemine koyun, iyi ışık verin, çok yaklaştırmayın. QR ekranın ortasında ve net görünmeli.
                    </Typography>

                    <Box
                        id={qrRegionId}
                        sx={{
                            width: "100%",
                            minHeight: 360,
                            borderRadius: 2,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.10)",
                        }}
                    />

                    {scanLoading ? (
                        <Typography sx={{ mt: 1.2, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                            Kamera açılıyor...
                        </Typography>
                    ) : null}

                    {scanError ? (
                        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
                            {scanError}
                        </Alert>
                    ) : null}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                        onClick={closeScanner}
                        sx={{
                            color: "rgba(255,255,255,0.78)",
                            borderRadius: 2,
                        }}
                    >
                        Kapat
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={savedOpen}
                autoHideDuration={2500}
                onClose={() => setSavedOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity="success"
                    variant="filled"
                    onClose={() => setSavedOpen(false)}
                    sx={{ width: "100%", borderRadius: 2 }}
                >
                    Sefer başarıyla kaydedildi
                </Alert>
            </Snackbar>
        </Drawer>
    );
}