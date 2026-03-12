// src/plakaAtama/SeferDetayDrawer.js
import React from "react";
import Tesseract from "tesseract.js";
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

    const videoRef = React.useRef(null);
    const streamRef = React.useRef(null);

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

    const stopCamera = React.useCallback(() => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        } catch (e) {
            console.error("Camera stop error:", e);
        }
    }, []);

    const closeScanner = React.useCallback(() => {
        stopCamera();
        setScanOpen(false);
        setScanLoading(false);
        setScanError("");
    }, [stopCamera]);

    const startScanner = React.useCallback(async () => {
        if (!row?.id || !canEdit) return;

        try {
            setScanError("");
            setScanLoading(true);
            setScanOpen(true);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = stream;

            setTimeout(async () => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                    } catch (err) {
                        console.error("Video play error:", err);
                    }
                }
                setScanLoading(false);
            }, 200);
        } catch (e) {
            console.error("Camera start error:", e);
            setScanError(e?.message || "Kamera başlatılamadı.");
            setScanLoading(false);
        }
    }, [row, canEdit]);

    React.useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const captureFrame = React.useCallback(() => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return null;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        return canvas;
    }, []);

    const cropTableArea = React.useCallback((sourceCanvas) => {
        const sw = sourceCanvas.width;
        const sh = sourceCanvas.height;

        // Belgenin alt yarı/orta bölgesine odaklanır
        const sx = sw * 0.06;
        const sy = sh * 0.42;
        const sWidth = sw * 0.88;
        const sHeight = sh * 0.46;

        const canvas = document.createElement("canvas");
        canvas.width = sWidth;
        canvas.height = sHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(sourceCanvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

        return canvas;
    }, []);

    const extractIrsaliyeNoFromText = React.useCallback((rawText) => {
        const text = String(rawText || "")
            .replace(/İ/g, "I")
            .replace(/ı/g, "i")
            .replace(/\s+/g, " ")
            .trim();

        console.log("OCR TEXT:", text);

        const patterns = [
            /Irsaliye\s*No\s*[:\-]?\s*(BE[0-9A-Z]+)/i,
            /IRSALIYE\s*NO\s*[:\-]?\s*(BE[0-9A-Z]+)/i,
            /\b(BE[0-9A-Z]{8,})\b/i,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match?.[1]) {
                return match[1].trim();
            }
        }

        return "";
    }, []);

    const handleReadTable = React.useCallback(async () => {
        if (!row?.id || !canEdit) return;

        try {
            setScanLoading(true);
            setScanError("");

            const fullCanvas = captureFrame();
            if (!fullCanvas) {
                setScanError("Kamera görüntüsü alınamadı.");
                setScanLoading(false);
                return;
            }

            const tableCanvas = cropTableArea(fullCanvas);

            const result = await Tesseract.recognize(tableCanvas, "tur+eng", {
                logger: (m) => console.log(m),
            });

            const text = result?.data?.text || "";
            const irsaliyeNo = extractIrsaliyeNoFromText(text);

            if (!irsaliyeNo) {
                setScanError("Tabloda İrsaliye No bulunamadı.");
                setScanLoading(false);
                return;
            }

            handleChange(row.id, "irsaliye", irsaliyeNo);
            setSavedOpen(true);
            closeScanner();
        } catch (err) {
            console.error("OCR read error:", err);
            setScanError("Tablo okunamadı.");
            setScanLoading(false);
        }
    }, [row, canEdit, captureFrame, cropTableArea, extractIrsaliyeNoFromText, handleChange, closeScanner]);

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
                                            {scanLoading ? "Açılıyor..." : "Tablodan Oku"}
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
                    İrsaliye Tablodan Oku
                </DialogTitle>

                <DialogContent>
                    <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.68)", mb: 1.5 }}>
                        Belgenin alt tarafındaki tabloyu kameraya gösterin. Sistem <b>İrsaliye No</b> alanını okuyup otomatik doldurur.
                    </Typography>

                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.60)", mb: 1.5 }}>
                        Belgeyi düz zemine koyun, iyi ışık verin ve tabloyu mümkün olduğunca ekranın alt-orta bölümüne getirin.
                    </Typography>

                    <Box
                        sx={{
                            width: "100%",
                            minHeight: 360,
                            borderRadius: 2,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            position: "relative",
                        }}
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: "100%",
                                height: "360px",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />

                        <Box
                            sx={{
                                position: "absolute",
                                left: "8%",
                                top: "42%",
                                width: "84%",
                                height: "46%",
                                border: "2px dashed rgba(120,160,255,0.9)",
                                borderRadius: 2,
                                pointerEvents: "none",
                                boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.08)",
                            }}
                        />
                    </Box>

                    {scanLoading ? (
                        <Typography sx={{ mt: 1.2, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                            {videoRef.current?.srcObject ? "Tablo okunuyor..." : "Kamera açılıyor..."}
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

                    <Button
                        variant="contained"
                        onClick={handleReadTable}
                        disabled={scanLoading || !canEdit}
                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                        }}
                    >
                        {scanLoading ? "Okunuyor..." : "Tabloyu Tara"}
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