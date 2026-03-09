import React, { useCallback, useMemo, useState } from "react";
import { supabase } from "../supabase";

import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableBody,
    IconButton,
    Card,
    Stack,
    Chip,
    Modal,
    Fade,
    LinearProgress,
    Grid,
    Container,
} from "@mui/material";

import {
    CloudUpload,
    Delete,
    LocationOn,
    TaskAlt,
    AutoAwesome,
    RocketLaunch,
    UploadFile,
} from "@mui/icons-material";

import { motion, AnimatePresence } from "framer-motion";

const PREVIEW_LIMIT = 300;
const INSERT_CHUNK_SIZE = 500;

export default function SiparisAcilis() {
    // ✅ Permission kaldırıldı → her zaman açık
    useMemo(() => ({ gorunur: true, yazma: true }), []);

    const [siparisler, setSiparisler] = useState([]);
    const [islemDurumu, setIslemDurumu] = useState("bekliyor"); // bekliyor | hazir | kaydediliyor | tamamlandi | hata
    const [isDragging, setIsDragging] = useState(false);
    const [currentBatchId, setCurrentBatchId] = useState(null);
    const [kayitHataMesaji, setKayitHataMesaji] = useState("");
    const [progress, setProgress] = useState(0);

    const splitBolgeToVaris = (bolgeRaw) => {
        const parts = String(bolgeRaw || "")
            .split("+")
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 3);

        return {
            varis1: parts[0] ?? null,
            varis2: parts[1] ?? null,
            varis3: parts[2] ?? null,
        };
    };

    const chunkArray = (arr, size) => {
        const out = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    };

    const parseHtmlTable = (html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const table = doc.querySelector("table");
        if (!table) return null;
        return Array.from(table.querySelectorAll("tr"))
            .map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => c.textContent.trim()))
            .filter((r) => r.length > 0);
    };

    const parsePlainText = (text) =>
        text
            .split("\n")
            .filter((l) => l.trim())
            .map((l) =>
                l
                    .split(/\t|\||\s{2,}/)
                    .map((x) => x.trim())
                    .filter(Boolean)
            );

    const toSiparisler = (grid) => {
        const header = grid[0].map((h) => (h || "").toLowerCase());
        const findIdx = (keywords) => header.findIndex((h) => keywords.some((k) => h.includes(k)));

        const idxTarih = findIdx(["tarih", "gün", "date"]);
        const idxBolge = findIdx(["bölge", "bolge", "şehir", "sehir", "varış", "varis", "destination"]);
        const idxArac = findIdx(["araç", "arac", "tip", "truck", "type"]);

        return grid
            .slice(1)
            .map((r, i) => ({
                id: `id_${Date.now()}_${i}`,
                yuklemeTarihi: r[idxTarih !== -1 ? idxTarih : 0] || "-",
                bolge: r[idxBolge !== -1 ? idxBolge : 1] || "Belirtilmedi",
                aracTipi: r[idxArac !== -1 ? idxArac : 2] || "Standart",
            }))
            .filter((s) => s.bolge !== "Belirtilmedi");
    };

    const handleDataProcessing = useCallback((html, text) => {
        const grid = text ? parsePlainText(text) : html ? parseHtmlTable(html) : null;

        if (grid) {
            const list = toSiparisler(grid);
            if (list.length) {
                setSiparisler(list);
                setIslemDurumu("hazir");
                return;
            }
        }

        alert("Tablo yapısı anlaşılamadı. Lütfen geçerli bir veri yapıştırın.");
    }, []);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const text = e.dataTransfer.getData("text/plain");
        const html = e.dataTransfer.getData("text/html");
        handleDataProcessing(html, text);
    };

    const siparislerPreview = useMemo(() => siparisler.slice(0, PREVIEW_LIMIT), [siparisler]);

    const kaydet = async () => {
        if (!siparisler.length) return;

        setKayitHataMesaji("");
        setProgress(0);
        setIslemDurumu("kaydediliyor");

        await new Promise(requestAnimationFrame);

        const oturum = JSON.parse(localStorage.getItem("bapsis_oturum") || "{}");

        // ✅ ESLint uyumlu UUID üretimi
        const uuid =
            typeof window !== "undefined" &&
                window.crypto &&
                typeof window.crypto.randomUUID === "function"
                ? window.crypto.randomUUID()
                : `batch_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const batch = uuid;
        setCurrentBatchId(batch);

        const payload = siparisler.map((s, idx) => {
            const { varis1, varis2, varis3 } = splitBolgeToVaris(s.bolge);

            return {
                batch_id: String(batch),
                line_no: idx + 1,
                sevktarihi: s.yuklemeTarihi ?? null,
                araccinsi: s.aracTipi ?? null,
                varis1,
                varis2,
                varis3,
                updated_by_email: oturum?.mail ?? null,
                updated_by_name: oturum?.mail ?? null,
            };
        });

        const parts = chunkArray(payload, INSERT_CHUNK_SIZE);
        const total = parts.length;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            const { error } = await supabase.from("plaka_atamalar").insert(part);

            if (error) {
                console.error("Supabase Insert Hatası:", error);
                setKayitHataMesaji(error.message || "Kayıt hatası");
                setIslemDurumu("hata");
                return;
            }

            const pct = Math.round(((i + 1) / total) * 100);
            setProgress(pct);

            await new Promise(requestAnimationFrame);
        }

        setIslemDurumu("tamamlandi");
    };

    const closeResultModal = () => {
        setIslemDurumu("hazir");
        setKayitHataMesaji("");
        setProgress(0);
    };

    return (
        <Box sx={stil.anaKapsayici}>
            <Box sx={stil.glowEfekt} />
            <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ mb: 5, display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={stil.logoBox}>
                        <UploadFile />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={stil.baslik}>
                            SİPARİŞ <span style={{ color: "#818cf8" }}>GİRİŞİ</span>
                        </Typography>
                        <Typography sx={{ color: "#475569", fontWeight: 500 }}>
                            Sürükle-Bırak veya Yapıştır (Hızlı Aktarım)
                        </Typography>
                    </Box>
                </Box>

                <AnimatePresence mode="wait">
                    {islemDurumu === "bekliyor" ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Paper
                                onPaste={(e) => {
                                    handleDataProcessing(
                                        e.clipboardData.getData("text/html"),
                                        e.clipboardData.getData("text/plain")
                                    );
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                sx={{
                                    ...stil.dropZone,
                                    borderColor: isDragging ? "#818cf8" : "rgba(255,255,255,0.05)",
                                    bgcolor: isDragging ? "rgba(129, 140, 248, 0.08)" : "rgba(15, 23, 42, 0.3)",
                                }}
                            >
                                <Box sx={stil.dropContent}>
                                    <Box sx={stil.uploadCircle}>
                                        <CloudUpload sx={{ fontSize: 45, color: "#fff" }} />
                                    </Box>
                                    <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900, mb: 1 }}>
                                        {isDragging ? "Şimdi Bırakın" : "Veriyi Buraya Atın"}
                                    </Typography>
                                    <Typography sx={{ color: "#94a3b8", mb: 4 }}>
                                        Excel'den kopyalayın veya dosyayı sürükleyin
                                    </Typography>
                                    <Stack direction="row" spacing={2}>
                                        <Chip
                                            label="Sürükle & Bırak"
                                            variant="outlined"
                                            sx={stil.helperChip}
                                            icon={<TaskAlt style={{ color: "#10b981" }} />}
                                        />
                                        <Chip
                                            label="Akıllı Eşleme"
                                            variant="outlined"
                                            sx={stil.helperChip}
                                            icon={<AutoAwesome style={{ color: "#818cf8" }} />}
                                        />
                                    </Stack>
                                </Box>
                            </Paper>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <OzetKart icon={<RocketLaunch />} label="YÜKLENECEK" value={siparisler.length} color="#6366f1" />
                                <OzetKart
                                    icon={<LocationOn />}
                                    label="TOPLAM BÖLGE"
                                    value={new Set(siparisler.map((s) => s.bolge)).size}
                                    color="#f43f5e"
                                />
                            </Grid>

                            <Card sx={stil.tableCard}>
                                <Box sx={stil.tableHeader}>
                                    <Typography sx={{ color: "#fff", fontWeight: 800 }}>Önizleme Listesi</Typography>

                                    <Stack direction="row" spacing={2}>
                                        <Button
                                            onClick={() => {
                                                setSiparisler([]);
                                                setIslemDurumu("bekliyor");
                                                setCurrentBatchId(null);
                                                setKayitHataMesaji("");
                                                setProgress(0);
                                            }}
                                            sx={{ color: "#64748b" }}
                                            disabled={islemDurumu === "kaydediliyor"}
                                        >
                                            TEMİZLE
                                        </Button>

                                        <Button
                                            variant="contained"
                                            onClick={kaydet}
                                            sx={stil.mainBtn}
                                            endIcon={<RocketLaunch />}
                                            disabled={islemDurumu === "kaydediliyor" || siparisler.length === 0}
                                        >
                                            SİSTEME KAYDET
                                        </Button>
                                    </Stack>
                                </Box>

                                <TableContainer sx={{ maxHeight: 500 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={stil.th}>YÜKLEME TARİHİ</TableCell>
                                                <TableCell sx={stil.th}>BÖLGE</TableCell>
                                                <TableCell sx={stil.th}>ARAÇ TİPİ</TableCell>
                                                <TableCell sx={stil.th} align="right">
                                                    İŞLEM
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {siparislerPreview.map((item) => (
                                                <TableRow key={item.id} sx={stil.tr}>
                                                    <TableCell sx={stil.td}>{item.yuklemeTarihi}</TableCell>
                                                    <TableCell sx={stil.td}>
                                                        <Chip label={item.bolge} size="small" sx={stil.bolgeChip} />
                                                    </TableCell>
                                                    <TableCell sx={stil.td}>{item.aracTipi}</TableCell>
                                                    <TableCell sx={stil.td} align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setSiparisler((p) => p.filter((s) => s.id !== item.id))}
                                                            sx={{ color: "#475569" }}
                                                            disabled={islemDurumu === "kaydediliyor"}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {siparisler.length > PREVIEW_LIMIT && (
                                    <Typography sx={{ color: "#94a3b8", px: 3, py: 2 }}>
                                        Önizleme ilk {PREVIEW_LIMIT} satır. Toplam kayıt: {siparisler.length}
                                    </Typography>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Container>

            <Modal
                open={islemDurumu === "kaydediliyor" || islemDurumu === "tamamlandi" || islemDurumu === "hata"}
                BackdropProps={{ sx: { backdropFilter: "blur(10px)" } }}
            >
                <Fade in={islemDurumu === "kaydediliyor" || islemDurumu === "tamamlandi" || islemDurumu === "hata"}>
                    <Box sx={stil.modal}>
                        {islemDurumu === "kaydediliyor" ? (
                            <Box sx={{ py: 4 }}>
                                <LinearProgress
                                    color="inherit"
                                    variant={progress > 0 ? "determinate" : "indeterminate"}
                                    value={progress}
                                />
                                <Typography sx={{ color: "#fff", mt: 2 }}>
                                    Kaydediliyor... {progress > 0 ? `%${progress}` : ""}
                                </Typography>
                            </Box>
                        ) : islemDurumu === "hata" ? (
                            <>
                                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 900, mb: 1 }}>
                                    Kayıt Başarısız
                                </Typography>
                                <Typography sx={{ color: "#94a3b8", mb: 3 }}>
                                    {kayitHataMesaji || "Bilinmeyen hata"}
                                </Typography>
                                <Button fullWidth variant="contained" onClick={closeResultModal} sx={stil.mainBtn}>
                                    Tamam
                                </Button>
                            </>
                        ) : (
                            <>
                                <TaskAlt sx={{ fontSize: 60, color: "#10b981", mb: 2 }} />
                                <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900 }}>
                                    BAŞARILI
                                </Typography>
                                <Typography sx={{ color: "#94a3b8", mt: 1, mb: 3 }}>
                                    Siparişiniz açıldı.
                                </Typography>

                                <Button fullWidth variant="contained" onClick={closeResultModal} sx={stil.mainBtn}>
                                    Tamam
                                </Button>
                            </>
                        )}
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
}

// --- Yardımcılar ---
const OzetKart = ({ icon, label, value, color }) => (
    <Grid item xs={12} sm={6}>
        <Paper sx={stil.statCard}>
            <Box sx={{ ...stil.statIcon, color, bgcolor: `${color}10` }}>{icon}</Box>
            <Box>
                <Typography sx={{ color: "#64748b", fontSize: "0.7rem", fontWeight: 800 }}>{label}</Typography>
                <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900 }}>
                    {value}
                </Typography>
            </Box>
        </Paper>
    </Grid>
);

const stil = {
    anaKapsayici: {
        minHeight: "100vh",
        bgcolor: "#020617",
        py: 6,
        position: "relative",
        overflow: "hidden",
    },
    glowEfekt: {
        position: "absolute",
        top: 0,
        right: 0,
        width: "40vw",
        height: "40vw",
        background: "radial-gradient(circle, rgba(129, 140, 248, 0.06) 0%, transparent 70%)",
    },
    baslik: { color: "#fff", fontWeight: 900 },
    logoBox: {
        bgcolor: "rgba(129, 140, 248, 0.1)",
        p: 1.5,
        borderRadius: "16px",
        color: "#818cf8",
    },
    dropZone: {
        height: 400,
        borderRadius: "40px",
        border: "2px dashed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "0.3s",
        cursor: "pointer",
    },
    dropContent: {
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    uploadCircle: {
        width: 80,
        height: 80,
        borderRadius: "24px",
        bgcolor: "#818cf8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mb: 3,
    },
    helperChip: { color: "#94a3b8", borderColor: "rgba(255,255,255,0.08)" },
    statCard: {
        p: 3,
        bgcolor: "rgba(15, 23, 42, 0.5)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 3,
    },
    statIcon: {
        width: 50,
        height: 50,
        borderRadius: "15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    tableCard: {
        bgcolor: "rgba(15, 23, 42, 0.8)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
    },
    tableHeader: { p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" },
    mainBtn: {
        bgcolor: "#818cf8",
        fontWeight: 800,
        borderRadius: "12px",
        "&:hover": { bgcolor: "#6366f1" },
    },
    th: {
        bgcolor: "#0f172a !important",
        color: "#475569",
        fontWeight: 900,
        fontSize: "0.7rem",
    },
    td: { color: "#f8fafc", py: 2 },
    tr: { "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } },
    bolgeChip: {
        bgcolor: "rgba(129, 140, 248, 0.1)",
        color: "#818cf8",
        fontWeight: 700,
    },
    modal: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 420,
        bgcolor: "#020617",
        borderRadius: "32px",
        p: 6,
        textAlign: "center",
        border: "1px solid rgba(129, 140, 248, 0.2)",
    },
    finalBtn: {
        bgcolor: "#10b981",
        py: 1.5,
        borderRadius: "12px",
        fontWeight: 900,
        "&:hover": { bgcolor: "#0ea371" },
    },
};