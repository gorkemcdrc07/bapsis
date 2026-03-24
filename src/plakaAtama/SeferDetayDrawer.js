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
    Divider,
    Fade,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import DocumentScannerOutlinedIcon from "@mui/icons-material/DocumentScannerOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

const REQUIRED_IRSALIYE_LENGTH = 16;

const glassPanelSx = {
    border: "1px solid rgba(255,255,255,0.10)",
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
    backdropFilter: "blur(16px)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
};

const subtlePanelSx = {
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    backdropFilter: "blur(10px)",
};

const sectionIconWrapSx = {
    width: 38,
    height: 38,
    borderRadius: 2.5,
    display: "grid",
    placeItems: "center",
    background:
        "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
    flex: "0 0 auto",
};

const actionButtonSx = {
    borderRadius: 2.8,
    py: 1.15,
    textTransform: "none",
    fontWeight: 800,
    letterSpacing: 0.1,
};

const chipBaseSx = {
    height: 26,
    borderRadius: 999,
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.10)",
};

const Section = ({ title, subtitle, icon, children, sx }) => (
    <Box
        sx={{
            p: 2.1,
            borderRadius: 4,
            ...glassPanelSx,
            ...sx,
        }}
    >
        <Stack direction="row" spacing={1.3} alignItems="flex-start" sx={{ mb: 1.8 }}>
            <Box sx={sectionIconWrapSx}>{icon}</Box>

            <Box sx={{ minWidth: 0 }}>
                <Typography
                    sx={{
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.94)",
                        letterSpacing: 0.15,
                    }}
                >
                    {title}
                </Typography>

                {subtitle ? (
                    <Typography
                        sx={{
                            mt: 0.2,
                            fontSize: 12.5,
                            lineHeight: 1.45,
                            color: "rgba(255,255,255,0.62)",
                        }}
                    >
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>
        </Stack>

        {children}
    </Box>
);

const parseIrsaliyeList = (value) => {
    return String(value || "")
        .split("/")
        .map((item) => item.trim())
        .filter(Boolean);
};

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

    const [scanResultValue, setScanResultValue] = React.useState("");
    const [scanResultType, setScanResultType] = React.useState("");
    const [scanResultMessage, setScanResultMessage] = React.useState("");

    const videoRef = React.useRef(null);
    const streamRef = React.useRef(null);
    const savingRef = React.useRef(false);
    const autoSaveTimeoutRef = React.useRef(null);

    const currentIrsaliyeList = React.useMemo(() => {
        return parseIrsaliyeList(row?.irsaliye);
    }, [row?.irsaliye]);

    const selectFieldSx = (clickable) => ({
        "& .MuiOutlinedInput-root": {
            minHeight: 42,
            borderRadius: 2.8,
            background: clickable
                ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))"
                : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
            backdropFilter: "blur(10px)",
            transition: "all .18s ease",
            cursor: clickable ? "pointer" : "text",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            "& fieldset": {
                borderColor: "rgba(255,255,255,0.14)",
            },
            "&:hover": {
                transform: clickable ? "translateY(-1px)" : "none",
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.035))",
            },
            "&:hover fieldset": {
                borderColor: "rgba(255,255,255,0.28)",
            },
            "&.Mui-focused": {
                boxShadow:
                    "0 0 0 4px rgba(120,160,255,0.10), inset 0 1px 0 rgba(255,255,255,0.04)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "rgba(130,170,255,0.85)",
            },
        },
        "& .MuiInputLabel-root": {
            color: "rgba(255,255,255,0.62)",
            fontSize: 13,
        },
        "& .MuiInputBase-input": {
            color: "rgba(255,255,255,0.94)",
            fontWeight: 500,
        },
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
        setScanResultValue("");
        setScanResultType("");
        setScanResultMessage("");
    }, [stopCamera]);

    const autoSaveIrsaliye = React.useCallback(async () => {
        if (!row || !canEdit) return;
        if (savingRef.current) return;

        try {
            savingRef.current = true;
            setSaving(true);

            await new Promise((resolve) => setTimeout(resolve, 250));

            setSavedOpen(true);
        } catch (err) {
            console.error("Auto save error:", err);
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    }, [row, canEdit]);

    const scheduleAutoSaveIrsaliye = React.useCallback(() => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            autoSaveIrsaliye();
        }, 500);
    }, [autoSaveIrsaliye]);

    const startScanner = React.useCallback(async () => {
        if (!row?.id || !canEdit) return;

        try {
            setScanError("");
            setScanResultValue("");
            setScanResultType("");
            setScanResultMessage("");
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
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
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
                return match[1].trim().toUpperCase();
            }
        }

        return "";
    }, []);

    const handleReadTable = React.useCallback(async () => {
        if (!row?.id || !canEdit) return;

        try {
            setScanLoading(true);
            setScanError("");
            setScanResultValue("");
            setScanResultType("");
            setScanResultMessage("");

            const fullCanvas = captureFrame();
            if (!fullCanvas) {
                setScanError("Kamera görüntüsü alınamadı.");
                setScanResultType("error");
                setScanResultMessage("Kamera görüntüsü alınamadı.");
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
                setScanResultType("error");
                setScanResultMessage("Geçerli bir İrsaliye No bulunamadı.");
                setScanLoading(false);
                return;
            }

            setScanResultValue(irsaliyeNo);

            if (irsaliyeNo.length !== REQUIRED_IRSALIYE_LENGTH) {
                setScanError(
                    `Eksik karakter: ${irsaliyeNo.length}/${REQUIRED_IRSALIYE_LENGTH}. Okunan değer 16 karakter olmalı.`
                );
                setScanResultType("error");
                setScanResultMessage(
                    `Eksik karakter (${irsaliyeNo.length}/${REQUIRED_IRSALIYE_LENGTH})`
                );
                setScanLoading(false);
                return;
            }

            const existingList = parseIrsaliyeList(row?.irsaliye).map((x) => x.toUpperCase());
            const normalizedNew = irsaliyeNo.toUpperCase();

            if (existingList.includes(normalizedNew)) {
                setScanResultType("error");
                setScanResultMessage("Bu değer eklendi zaten.");
                setScanError("Bu değer eklendi zaten.");
                setScanLoading(false);
                return;
            }

            const updatedValue = row?.irsaliye?.trim()
                ? `${row.irsaliye.trim()} / ${irsaliyeNo}`
                : irsaliyeNo;

            handleChange(row.id, "irsaliye", updatedValue);
            await autoSaveIrsaliye();

            setScanResultType("success");
            setScanResultMessage("16 karakter tamam, değer otomatik kaydedildi.");
            setScanError("");
        } catch (err) {
            console.error("OCR read error:", err);
            setScanError("Tablo okunamadı.");
            setScanResultType("error");
            setScanResultMessage("Tablo okunamadı.");
        } finally {
            setScanLoading(false);
        }
    }, [
        row,
        canEdit,
        captureFrame,
        cropTableArea,
        extractIrsaliyeNoFromText,
        handleChange,
        autoSaveIrsaliye,
    ]);

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

    const handleIrsaliyeManualChange = (value) => {
        if (!row?.id || !canEdit) return;
        handleChange(row.id, "irsaliye", value);
        scheduleAutoSaveIrsaliye();
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
                    width: { xs: "100%", sm: 560 },
                    maxWidth: "100vw",
                    borderRadius: { xs: 0, sm: "24px 0 0 24px" },
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    background:
                        "radial-gradient(900px 500px at 10% 0%, rgba(104,144,255,0.20), transparent 52%), radial-gradient(700px 500px at 100% 20%, rgba(80,215,170,0.08), transparent 42%), linear-gradient(180deg, #0b1018 0%, #0c1119 35%, #0a0f17 100%)",
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "-24px 0 60px rgba(0,0,0,0.32)",
                },
            }}
        >
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 5,
                    px: 2.2,
                    pt: 2.2,
                    pb: 1.7,
                    flexShrink: 0,
                    backdropFilter: "blur(18px)",
                    background:
                        "linear-gradient(180deg, rgba(10,12,18,0.92), rgba(10,12,18,0.78))",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1.5}
                >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ flexWrap: "wrap", rowGap: 1 }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 18,
                                    fontWeight: 900,
                                    letterSpacing: 0.25,
                                    color: "#fff",
                                }}
                            >
                                Sefer Detayı
                            </Typography>

                            <Chip
                                size="small"
                                label={row?.sefer ? `#${row.sefer}` : "Sefer yok"}
                                sx={{
                                    ...chipBaseSx,
                                    background: "rgba(120,160,255,0.14)",
                                    color: "rgba(220,235,255,0.96)",
                                    border: "1px solid rgba(120,160,255,0.24)",
                                }}
                            />

                            {!canEdit ? (
                                <Chip
                                    size="small"
                                    label="Sadece Görüntüleme"
                                    sx={{
                                        ...chipBaseSx,
                                        background: "rgba(255,255,255,0.06)",
                                        color: "rgba(255,255,255,0.86)",
                                    }}
                                />
                            ) : null}
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}
                        >
                            <Chip
                                size="small"
                                label={row?.tc ? `TC: ${row.tc}` : "TC: -"}
                                sx={{
                                    ...chipBaseSx,
                                    background: "rgba(255,255,255,0.05)",
                                    color: "rgba(255,255,255,0.84)",
                                }}
                            />
                            <Chip
                                size="small"
                                label={row?.sevk ? `Sevk: ${row.sevk}` : "Sevk: -"}
                                sx={{
                                    ...chipBaseSx,
                                    background: "rgba(255,255,255,0.05)",
                                    color: "rgba(255,255,255,0.84)",
                                }}
                            />
                        </Stack>
                    </Box>

                    <Tooltip title="Kapat">
                        <IconButton
                            onClick={onClose}
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 2.8,
                                flexShrink: 0,
                                background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                                border: "1px solid rgba(255,255,255,0.10)",
                                color: "#fff",
                                "&:hover": {
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
                                },
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
                    pb: 2.2,
                    pr: 1.4,
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.16) transparent",
                    "&::-webkit-scrollbar": { width: 8 },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                        background: "rgba(255,255,255,0.14)",
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
                            p: 2.4,
                            borderRadius: 4,
                            border: "1px dashed rgba(255,255,255,0.18)",
                            background: "rgba(255,255,255,0.04)",
                        }}
                    >
                        <Typography sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 600 }}>
                            Bir satır seçin.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                p: 2.4,
                                borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background:
                                    "linear-gradient(135deg, rgba(120,160,255,0.18), rgba(255,255,255,0.05))",
                                backdropFilter: "blur(14px)",
                                boxShadow: "0 20px 44px rgba(0,0,0,0.30)",
                                position: "relative",
                                overflow: "hidden",
                                "&::before": {
                                    content: '""',
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(90deg, rgba(255,255,255,0.05), transparent 35%, transparent 65%, rgba(255,255,255,0.03))",
                                    pointerEvents: "none",
                                },
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
                                            fontSize: 20,
                                            fontWeight: 900,
                                            color: "#fff",
                                            wordBreak: "break-word",
                                            letterSpacing: 0.2,
                                        }}
                                    >
                                        {row.sefer || "Sefer"}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 0.4,
                                            fontSize: 13,
                                            color: "rgba(255,255,255,0.72)",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {row.sevk ? `Sevk: ${row.sevk}` : "Sevk: -"}
                                    </Typography>

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ mt: 1.4, flexWrap: "wrap", rowGap: 1 }}
                                    >
                                        <Chip
                                            size="small"
                                            label={`Çekici: ${row.cekici || "-"}`}
                                            sx={{
                                                ...chipBaseSx,
                                                background: "rgba(255,255,255,0.07)",
                                                color: "rgba(255,255,255,0.90)",
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`Dorse: ${row.dorse || "-"}`}
                                            sx={{
                                                ...chipBaseSx,
                                                background: "rgba(255,255,255,0.07)",
                                                color: "rgba(255,255,255,0.90)",
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`TC: ${row.tc || "-"}`}
                                            sx={{
                                                ...chipBaseSx,
                                                background: "rgba(255,255,255,0.07)",
                                                color: "rgba(255,255,255,0.90)",
                                            }}
                                        />
                                    </Stack>
                                </Box>

                                <Box
                                    sx={{
                                        textAlign: { xs: "left", sm: "right" },
                                        minWidth: { xs: "100%", sm: 150 },
                                        alignSelf: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            color: "rgba(255,255,255,0.60)",
                                            letterSpacing: 0.2,
                                        }}
                                    >
                                        Sürücü
                                    </Typography>
                                    <Typography
                                        sx={{
                                            mt: 0.35,
                                            fontWeight: 900,
                                            color: "#fff",
                                            wordBreak: "break-word",
                                            fontSize: 16,
                                        }}
                                    >
                                        {row.surucu || "-"}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: 12.5,
                                            color: "rgba(255,255,255,0.72)",
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
                                        gap: 1.5,
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
                                            endAdornment: (
                                                <KeyboardArrowDownIcon
                                                    sx={{ opacity: canEdit ? 0.85 : 0.35 }}
                                                />
                                            ),
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
                                            endAdornment: (
                                                <KeyboardArrowDownIcon
                                                    sx={{ opacity: canEdit ? 0.85 : 0.35 }}
                                                />
                                            ),
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
                                            endAdornment: (
                                                <KeyboardArrowDownIcon
                                                    sx={{ opacity: canEdit ? 0.85 : 0.35 }}
                                                />
                                            ),
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
                                            endAdornment: (
                                                <KeyboardArrowDownIcon
                                                    sx={{ opacity: canEdit ? 0.85 : 0.35 }}
                                                />
                                            ),
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
                                            endAdornment: (
                                                <KeyboardArrowDownIcon
                                                    sx={{ opacity: canEdit ? 0.85 : 0.35 }}
                                                />
                                            ),
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
                                            endAdornment: (
                                                <KeyboardArrowDownIcon
                                                    sx={{ opacity: canEdit ? 0.85 : 0.35 }}
                                                />
                                            ),
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
                                        gap: 1.5,
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
                                        gap: 1.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                                            gap: 1,
                                            alignItems: "start",
                                            gridColumn: { xs: "1 / -1", sm: "auto" },
                                        }}
                                    >
                                        <TextField
                                            fullWidth
                                            label="İrsaliye"
                                            value={row.irsaliye ?? ""}
                                            onChange={(e) => handleIrsaliyeManualChange(e.target.value)}
                                            size="small"
                                            variant="outlined"
                                            InputLabelProps={{ shrink: true }}
                                            helperText={
                                                saving
                                                    ? "İrsaliye otomatik kaydediliyor..."
                                                    : "İrsaliye otomatik kaydedilir"
                                            }
                                            sx={{
                                                ...selectFieldSx(false),
                                                "& .MuiFormHelperText-root": {
                                                    color: "rgba(255,255,255,0.58)",
                                                    ml: 0.2,
                                                },
                                            }}
                                            disabled={!canEdit}
                                        />

                                        <Button
                                            variant="outlined"
                                            onClick={startScanner}
                                            disabled={!canEdit || scanLoading}
                                            startIcon={<DocumentScannerOutlinedIcon />}
                                            sx={{
                                                ...actionButtonSx,
                                                minWidth: 154,
                                                height: 40,
                                                borderColor: "rgba(255,255,255,0.22)",
                                                color: "rgba(255,255,255,0.92)",
                                                background:
                                                    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                                                "&:hover": {
                                                    borderColor: "rgba(255,255,255,0.35)",
                                                    background:
                                                        "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                                                },
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
                                sx={{ opacity: 0.95 }}
                            >
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
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
                    backdropFilter: "blur(18px)",
                    background:
                        "linear-gradient(180deg, rgba(10,12,18,0.72), rgba(10,12,18,0.94))",
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
                            ...actionButtonSx,
                            background:
                                "linear-gradient(135deg, rgba(91,140,255,1), rgba(80,110,255,0.95))",
                            boxShadow: "0 14px 30px rgba(43,84,200,0.34)",
                        }}
                    >
                        {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        sx={{
                            ...actionButtonSx,
                            borderColor: "rgba(255,255,255,0.22)",
                            color: "rgba(255,255,255,0.90)",
                            background: "rgba(255,255,255,0.02)",
                            "&:hover": {
                                borderColor: "rgba(255,255,255,0.35)",
                                background: "rgba(255,255,255,0.05)",
                            },
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
                TransitionComponent={Fade}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: "hidden",
                        background:
                            "radial-gradient(700px 300px at 10% 0%, rgba(88,125,255,0.18), transparent 50%), linear-gradient(180deg, rgba(15,23,42,0.99), rgba(9,14,28,0.99))",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.09)",
                        boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
                    },
                }}
            >
                <DialogTitle sx={{ px: 2.5, pt: 2.2, pb: 1.4 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 2.5,
                                    display: "grid",
                                    placeItems: "center",
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                }}
                            >
                                <CameraAltOutlinedIcon />
                            </Box>

                            <Box>
                                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                                    İrsaliye Tablodan Oku
                                </Typography>
                                <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.68)" }}>
                                    OCR ile belge üzerindeki irsaliye numarasını algıla
                                </Typography>
                            </Box>
                        </Stack>

                        <IconButton
                            onClick={closeScanner}
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: 2,
                                background: "rgba(255,255,255,0.06)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ px: 2.5, pb: 1.5 }}>
                    <Box
                        sx={{
                            mb: 1.2,
                            p: 1.6,
                            borderRadius: 3,
                            ...subtlePanelSx,
                        }}
                    >
                        <Stack direction="row" spacing={1.2} alignItems="flex-start">
                            <AutoAwesomeRoundedIcon
                                sx={{ mt: "2px", color: "rgba(150,190,255,0.95)" }}
                            />
                            <Box sx={{ width: "100%" }}>
                                <Typography
                                    sx={{
                                        fontSize: 13.5,
                                        color: "rgba(255,255,255,0.90)",
                                        fontWeight: 800,
                                    }}
                                >
                                    Belgeyi alt-orta alana hizalayın
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 12.5,
                                        color: "rgba(255,255,255,0.64)",
                                        mt: 0.3,
                                    }}
                                >
                                    Sistem alt bölümdeki tabloyu okuyup <b>İrsaliye No</b> alanını
                                    otomatik bulur.
                                </Typography>

                                {(scanResultValue || scanResultMessage) ? (
                                    <Box
                                        sx={{
                                            mt: 1.2,
                                            px: 1.25,
                                            py: 1.05,
                                            borderRadius: 2.4,
                                            border:
                                                scanResultType === "success"
                                                    ? "1px solid rgba(102,224,163,0.25)"
                                                    : "1px solid rgba(255,143,143,0.22)",
                                            background:
                                                scanResultType === "success"
                                                    ? "rgba(102,224,163,0.08)"
                                                    : "rgba(255,143,143,0.08)",
                                        }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            sx={{ mb: scanResultValue ? 0.6 : 0 }}
                                        >
                                            {scanResultType === "success" ? (
                                                <CheckCircleOutlineRoundedIcon
                                                    sx={{ color: "#66e0a3", fontSize: 18 }}
                                                />
                                            ) : (
                                                <ErrorOutlineRoundedIcon
                                                    sx={{ color: "#ff8f8f", fontSize: 18 }}
                                                />
                                            )}

                                            <Typography
                                                sx={{
                                                    fontSize: 13,
                                                    fontWeight: 800,
                                                    color:
                                                        scanResultType === "success"
                                                            ? "rgba(210,255,228,0.96)"
                                                            : "rgba(255,220,220,0.96)",
                                                }}
                                            >
                                                {scanResultMessage}
                                            </Typography>
                                        </Stack>

                                        {scanResultValue ? (
                                            <>
                                                <Typography
                                                    sx={{
                                                        fontSize: 11.5,
                                                        color: "rgba(255,255,255,0.56)",
                                                    }}
                                                >
                                                    Okunan değer
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        mt: 0.15,
                                                        fontSize: 15,
                                                        fontWeight: 900,
                                                        letterSpacing: 0.35,
                                                        color: "#fff",
                                                        wordBreak: "break-all",
                                                    }}
                                                >
                                                    {scanResultValue}
                                                </Typography>
                                                <Typography
                                                    sx={{
                                                        mt: 0.4,
                                                        fontSize: 11.5,
                                                        color:
                                                            scanResultType === "success"
                                                                ? "rgba(210,255,228,0.78)"
                                                                : "rgba(255,220,220,0.78)",
                                                    }}
                                                >
                                                    Karakter sayısı: {scanResultValue.length}/
                                                    {REQUIRED_IRSALIYE_LENGTH}
                                                </Typography>
                                            </>
                                        ) : null}
                                    </Box>
                                ) : null}
                            </Box>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            width: "100%",
                            minHeight: 360,
                            borderRadius: 3,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            position: "relative",
                            boxShadow:
                                "inset 0 0 0 1px rgba(255,255,255,0.03), 0 12px 28px rgba(0,0,0,0.18)",
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
                                background: "#0b1220",
                            }}
                        />

                        <Box
                            sx={{
                                position: "absolute",
                                left: "8%",
                                top: "42%",
                                width: "84%",
                                height: "46%",
                                border: "2px dashed rgba(120,160,255,0.95)",
                                borderRadius: 2.2,
                                pointerEvents: "none",
                                boxShadow:
                                    "inset 0 0 0 9999px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.04)",
                            }}
                        />

                        <Box
                            sx={{
                                position: "absolute",
                                left: 14,
                                top: 14,
                                px: 1.2,
                                py: 0.6,
                                borderRadius: 999,
                                fontSize: 11.5,
                                fontWeight: 800,
                                background: "rgba(10,12,18,0.68)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                color: "rgba(255,255,255,0.92)",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            OCR Tarama Alanı
                        </Box>
                    </Box>

                    <Stack spacing={1.3} sx={{ mt: 1.7 }}>
                        {currentIrsaliyeList.length > 0 ? (
                            <Box
                                sx={{
                                    p: 1.4,
                                    borderRadius: 2.6,
                                    ...subtlePanelSx,
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 12.5,
                                        color: "rgba(255,255,255,0.66)",
                                        mb: 1,
                                        fontWeight: 700,
                                    }}
                                >
                                    Mevcut İrsaliye Değerleri
                                </Typography>

                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {currentIrsaliyeList.map((item, idx) => (
                                        <Chip
                                            key={`${item}-${idx}`}
                                            label={item}
                                            size="small"
                                            sx={{
                                                ...chipBaseSx,
                                                background: "rgba(120,160,255,0.14)",
                                                color: "rgba(230,240,255,0.96)",
                                                border: "1px solid rgba(120,160,255,0.20)",
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        ) : null}

                        {scanLoading ? (
                            <Box
                                sx={{
                                    p: 1.4,
                                    borderRadius: 2.6,
                                    ...subtlePanelSx,
                                }}
                            >
                                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.76)" }}>
                                    {videoRef.current?.srcObject
                                        ? "Tablo okunuyor..."
                                        : "Kamera açılıyor..."}
                                </Typography>
                            </Box>
                        ) : null}
                    </Stack>

                    <Divider sx={{ my: 1.8, borderColor: "rgba(255,255,255,0.08)" }} />

                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.56)" }}>
                        İrsaliye no tam olarak <b>16 karakter</b> olmalıdır. Eksik okunursa ekleme
                        yapılmaz.
                    </Typography>

                    {scanError ? (
                        <Typography
                            sx={{
                                mt: 1,
                                fontSize: 12,
                                color: "rgba(255,160,160,0.9)",
                                fontWeight: 700,
                            }}
                        >
                            {scanError}
                        </Typography>
                    ) : null}
                </DialogContent>

                <DialogActions sx={{ px: 2.5, pb: 2.3, pt: 0.5 }}>
                    <Button
                        onClick={closeScanner}
                        sx={{
                            color: "rgba(255,255,255,0.78)",
                            borderRadius: 2.2,
                            px: 2,
                            textTransform: "none",
                            fontWeight: 700,
                        }}
                    >
                        Kapat
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleReadTable}
                        disabled={scanLoading || !canEdit}
                        startIcon={<DocumentScannerOutlinedIcon />}
                        sx={{
                            ...actionButtonSx,
                            px: 2.3,
                            boxShadow: "0 10px 24px rgba(0,0,0,0.30)",
                        }}
                    >
                        {scanLoading ? "Okunuyor..." : "Tabloyu Tara"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={savedOpen}
                autoHideDuration={2000}
                onClose={() => setSavedOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity="success"
                    variant="filled"
                    onClose={() => setSavedOpen(false)}
                    sx={{ width: "100%", borderRadius: 2.5, fontWeight: 700 }}
                >
                    İrsaliye otomatik kaydedildi
                </Alert>
            </Snackbar>
        </Drawer>
    );
}