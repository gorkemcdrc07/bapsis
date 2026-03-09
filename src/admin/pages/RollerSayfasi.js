import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    Tooltip,
    Chip,
    Divider,
    CircularProgress,
} from "@mui/material";
import {
    SecurityRounded,
    AddModeratorRounded,
    FingerprintRounded,
    HubRounded,
    AutoFixHighRounded,
    DeleteSweepRounded,
    SearchRounded,
    ShieldRounded,
    VerifiedUserRounded,
    DatasetRounded,
} from "@mui/icons-material";
import { supabase } from "../../supabase";

export default function RollerSayfasi() {
    const [roller, setRoller] = useState([]);
    const [ad, setAd] = useState("");
    const [arama, setArama] = useState("");
    const [loading, setLoading] = useState(true);
    const [kaydediliyor, setKaydediliyor] = useState(false);
    const [error, setError] = useState("");

    const filtreliRoller = useMemo(() => {
        const q = arama.trim().toLowerCase();
        if (!q) return roller;
        return roller.filter((r) =>
            String(r.ad || r.rol_adi || "").toLowerCase().includes(q)
        );
    }, [roller, arama]);

    const fetchRoller = async () => {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
            .from("roller")
            .select("*")
            .order("olusturma_tarihi", { ascending: false });

        if (error) {
            console.error("Roller çekilemedi:", error);
            setError(error.message || "Roller yüklenirken hata oluştu.");
            setRoller([]);
        } else {
            setRoller(data || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchRoller();
    }, []);

    const handleEkle = async () => {
        const yeniAd = ad.trim();
        if (!yeniAd) return;

        setKaydediliyor(true);
        setError("");

        const yeniKod = yeniAd
            .toUpperCase()
            .replace(/İ/g, "I")
            .replace(/İ/g, "I")
            .replace(/Ğ/g, "G")
            .replace(/Ü/g, "U")
            .replace(/Ş/g, "S")
            .replace(/Ö/g, "O")
            .replace(/Ç/g, "C")
            .replace(/[^A-Z0-9\s]/g, "")
            .replace(/\s+/g, "_");

        const { data, error } = await supabase
            .from("roller")
            .insert([
                {
                    ad: yeniAd,
                    kod: yeniKod,
                    aktif: true,
                },
            ])
            .select();

        console.log("Eklenen kayıt:", data);
        console.log("Insert hata:", error);

        if (error) {
            console.error("Rol eklenemedi:", error);
            setError(error.message || "Rol eklenemedi.");
        } else {
            setAd("");
            await fetchRoller();
        }

        setKaydediliyor(false);
    };

    const handleRolGuncelle = async (id, yeniAd) => {
        setRoller((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ad: yeniAd } : item))
        );

        const yeniKod = String(yeniAd || "")
            .trim()
            .toUpperCase()
            .replace(/İ/g, "I")
            .replace(/İ/g, "I")
            .replace(/Ğ/g, "G")
            .replace(/Ü/g, "U")
            .replace(/Ş/g, "S")
            .replace(/Ö/g, "O")
            .replace(/Ç/g, "C")
            .replace(/[^A-Z0-9\s]/g, "")
            .replace(/\s+/g, "_");

        const { error } = await supabase
            .from("roller")
            .update({
                ad: yeniAd,
                kod: yeniKod,
            })
            .eq("id", id);

        if (error) {
            console.error("Rol güncellenemedi:", error);
            setError(error.message || "Rol güncellenemedi.");
            await fetchRoller();
        }
    };

    const handleRolSil = async (id) => {
        const { error } = await supabase
            .from("roller")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Rol silinemedi:", error);
            setError(error.message || "Rol silinemedi.");
        } else {
            setRoller((prev) => prev.filter((x) => x.id !== id));
        }
    };

    return (
        <Box sx={stil.page}>
            <Box sx={stil.header}>
                <Box>
                    <Typography sx={stil.ustLabel}>ACCESS CONTROL</Typography>
                    <Typography sx={stil.anaBaslik}>
                        Rol &{" "}
                        <Typography component="span" sx={stil.vurgu}>
                            Yetki Yönetimi
                        </Typography>
                    </Typography>
                    <Typography sx={stil.altBilgi}>
                        Veriler doğrudan Supabase üzerindeki roller tablosundan getirilmektedir.
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={stil.statCard}>
                        <Box sx={stil.statIconWrap}>
                            <ShieldRounded sx={{ color: "#fbbf24" }} />
                        </Box>
                        <Box>
                            <Typography sx={stil.statValue}>{roller.length}</Typography>
                            <Typography sx={stil.statLabel}>Toplam Rol</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={stil.statCard}>
                        <Box sx={stil.statIconWrap}>
                            <VerifiedUserRounded sx={{ color: "#38bdf8" }} />
                        </Box>
                        <Box>
                            <Typography sx={stil.statValue}>{filtreliRoller.length}</Typography>
                            <Typography sx={stil.statLabel}>Görüntülenen Rol</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={stil.statCard}>
                        <Box sx={stil.statIconWrap}>
                            <DatasetRounded sx={{ color: "#4ade80" }} />
                        </Box>
                        <Box>
                            <Typography sx={stil.statValue}>
                                {loading ? "..." : roller.length > 0 ? "Aktif" : "Boş"}
                            </Typography>
                            <Typography sx={stil.statLabel}>Veri Kaynağı: Supabase</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={4}>
                    <Paper sx={stil.ekleCard} elevation={0}>
                        <Box sx={stil.cardHeader}>
                            <Box sx={stil.headerIconBox}>
                                <SecurityRounded sx={{ color: "#fbbf24" }} />
                            </Box>
                            <Box>
                                <Typography sx={stil.cardTitle}>Yeni Rol Tanımla</Typography>
                                <Typography sx={stil.cardSub}>
                                    Yeni kayıt doğrudan roller tablosuna yazılır
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                        <Box sx={{ p: 3 }}>
                            <TextField
                                fullWidth
                                placeholder="Örn: Operasyon Yöneticisi"
                                value={ad}
                                onChange={(e) => setAd(e.target.value)}
                                sx={stil.cyberInput}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <HubRounded sx={{ color: "#64748b", fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                fullWidth
                                onClick={handleEkle}
                                sx={stil.ekleBtn}
                                startIcon={<AddModeratorRounded />}
                                disabled={!ad.trim() || kaydediliyor}
                            >
                                {kaydediliyor ? "Kaydediliyor..." : "Rolü Kaydet"}
                            </Button>

                            <Box sx={stil.infoBox}>
                                <AutoFixHighRounded sx={{ fontSize: 16, color: "#fbbf24" }} />
                                <Typography
                                    sx={{
                                        fontSize: "0.78rem",
                                        color: "#94a3b8",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Burada sadece veritabanındaki gerçek kayıtlar gösterilir, örnek veri kullanılmaz.
                                </Typography>
                            </Box>

                            {error ? (
                                <Typography sx={{ color: "#f87171", mt: 2, fontSize: "0.85rem" }}>
                                    {error}
                                </Typography>
                            ) : null}
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={8}>
                    <Paper sx={stil.tableCard} elevation={0}>
                        <Box sx={stil.cardHeader}>
                            <Box sx={stil.headerIconBox}>
                                <FingerprintRounded sx={{ color: "#38bdf8" }} />
                            </Box>

                            <Box sx={{ flex: 1 }}>
                                <Typography sx={stil.cardTitle}>Roller Tablosu</Typography>
                                <Typography sx={stil.cardSub}>
                                    Supabase / roller tablosundaki kayıtlar
                                </Typography>
                            </Box>

                            <TextField
                                placeholder="Rol ara..."
                                value={arama}
                                onChange={(e) => setArama(e.target.value)}
                                size="small"
                                sx={stil.searchInput}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRounded sx={{ color: "#64748b", fontSize: 18 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                        {loading ? (
                            <Box sx={stil.loadingAlan}>
                                <CircularProgress size={28} sx={{ color: "#fbbf24" }} />
                                <Typography sx={{ color: "#94a3b8", mt: 2 }}>
                                    Roller yükleniyor...
                                </Typography>
                            </Box>
                        ) : filtreliRoller.length === 0 ? (
                            <Box sx={stil.bosAlan}>
                                <FingerprintRounded sx={{ fontSize: 42, color: "#334155", mb: 1 }} />
                                <Typography sx={{ color: "#cbd5e1", fontWeight: 800 }}>
                                    Kayıt bulunamadı
                                </Typography>
                                <Typography sx={{ color: "#64748b", fontSize: "0.9rem", mt: 0.5 }}>
                                    Roller tablosunda veri yoksa burada da boş görünür.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ overflowX: "auto" }}>
                                <Box sx={stil.tableHead}>
                                    <Box sx={{ minWidth: 260 }}>Rol Adı</Box>
                                    <Box sx={{ minWidth: 180 }}>ID</Box>
                                    <Box sx={{ minWidth: 150 }}>Durum</Box>
                                    <Box sx={{ minWidth: 140, textAlign: "right" }}>İşlemler</Box>
                                </Box>

                                <Stack spacing={1.5} sx={{ p: 2 }}>
                                    {filtreliRoller.map((r, index) => {
                                        const rolAdi = r.ad || "";
                                        return (
                                            <Paper key={r.id} sx={stil.rolSatir} elevation={0}>
                                                <Box sx={stil.rolRow}>
                                                    <Box sx={stil.colRole}>
                                                        <Box sx={stil.rolIdBadge}>
                                                            {String(rolAdi || "RL").substring(0, 2).toUpperCase()}
                                                        </Box>

                                                        <Box sx={{ minWidth: 0 }}>
                                                            <TextField
                                                                variant="standard"
                                                                value={rolAdi}
                                                                onChange={(e) => handleRolGuncelle(r.id, e.target.value)}
                                                                sx={stil.rolInput}
                                                                InputProps={{ disableUnderline: true }}
                                                            />
                                                            <Typography sx={stil.rowMeta}>
                                                                Sıra No: {index + 1}
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    <Box sx={stil.colCode}>
                                                        <Typography sx={stil.slugText}>
                                                            {String(r.id).substring(0, 10)}...
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={stil.colStatus}>
                                                        <Chip
                                                            label={r.aktif ? "Aktif" : "Pasif"}
                                                            size="small"
                                                            sx={stil.durumChip}
                                                        />
                                                    </Box>

                                                    <Box sx={stil.colActions}>
                                                        <Tooltip title="Sil">
                                                            <IconButton
                                                                sx={stil.rowDeleteBtn}
                                                                onClick={() => handleRolSil(r.id)}
                                                            >
                                                                <DeleteSweepRounded fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

const stil = {
    page: {
        minHeight: "100%",
        p: { xs: 2, md: 4 },
        background:
            "radial-gradient(circle at top left, rgba(251,191,36,0.06), transparent 25%), linear-gradient(180deg, #0b1120 0%, #111827 100%)",
    },
    header: {
        mb: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
    },
    ustLabel: {
        color: "#fbbf24",
        fontSize: "0.78rem",
        fontWeight: 900,
        letterSpacing: "0.35em",
        mb: 0.8,
        opacity: 0.9,
    },
    anaBaslik: {
        color: "#f8fafc",
        fontSize: { xs: "2rem", md: "2.8rem" },
        fontWeight: 900,
        letterSpacing: "-0.04em",
        lineHeight: 1.1,
    },
    vurgu: {
        color: "#fbbf24",
        fontSize: "inherit",
        fontWeight: "inherit",
        textShadow: "0 0 20px rgba(251, 191, 36, 0.25)",
    },
    altBilgi: {
        color: "#94a3b8",
        fontSize: "0.95rem",
        mt: 1.2,
    },
    statCard: {
        p: 2.2,
        borderRadius: "22px",
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.72))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    },
    statIconWrap: {
        width: 52,
        height: 52,
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    statValue: {
        color: "#f8fafc",
        fontWeight: 900,
        fontSize: "1.3rem",
        lineHeight: 1.1,
    },
    statLabel: {
        color: "#94a3b8",
        fontSize: "0.82rem",
        mt: 0.5,
    },
    ekleCard: {
        borderRadius: "28px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(15,23,42,0.80))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
        overflow: "hidden",
        height: "100%",
    },
    tableCard: {
        borderRadius: "28px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(15,23,42,0.82))",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
        overflow: "hidden",
    },
    cardHeader: {
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
    },
    headerIconBox: {
        width: 46,
        height: 46,
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
    },
    cardTitle: {
        color: "#fff",
        fontWeight: 900,
        fontSize: "1.05rem",
        lineHeight: 1.1,
    },
    cardSub: {
        color: "#64748b",
        fontSize: "0.82rem",
        mt: 0.4,
    },
    cyberInput: {
        mt: 1,
        "& .MuiOutlinedInput-root": {
            borderRadius: "16px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset": { borderColor: "rgba(251,191,36,0.25)" },
            "&.Mui-focused fieldset": {
                borderColor: "#fbbf24",
                boxShadow: "0 0 0 4px rgba(251,191,36,0.08)",
            },
        },
        "& input::placeholder": {
            color: "#64748b",
            opacity: 1,
        },
    },
    ekleBtn: {
        mt: 2.2,
        py: 1.6,
        borderRadius: "16px",
        fontWeight: 900,
        textTransform: "none",
        background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
        color: "#0f172a",
        fontSize: "0.98rem",
        boxShadow: "0 12px 24px rgba(251,191,36,0.20)",
        "&:hover": {
            background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
            transform: "translateY(-1px)",
            boxShadow: "0 18px 28px rgba(251,191,36,0.28)",
        },
        "&.Mui-disabled": {
            background: "rgba(255,255,255,0.06)",
            color: "#475569",
        },
    },
    infoBox: {
        mt: 2.2,
        p: 1.8,
        borderRadius: "14px",
        bgcolor: "rgba(251,191,36,0.05)",
        border: "1px solid rgba(251,191,36,0.08)",
        display: "flex",
        gap: 1.2,
        alignItems: "flex-start",
    },
    searchInput: {
        minWidth: 220,
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset": { borderColor: "rgba(56,189,248,0.25)" },
            "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
        },
        "& input": {
            color: "#e2e8f0",
        },
        "& input::placeholder": {
            color: "#64748b",
            opacity: 1,
        },
    },
    tableHead: {
        px: 2.5,
        py: 1.8,
        display: "grid",
        gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr",
        gap: 2,
        color: "#64748b",
        fontSize: "0.78rem",
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        bgcolor: "rgba(255,255,255,0.02)",
        minWidth: 760,
    },
    rolSatir: {
        borderRadius: "20px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(30,41,59,0.55))",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "all 0.25s ease",
        minWidth: 760,
        "&:hover": {
            transform: "translateY(-2px)",
            borderColor: "rgba(251,191,36,0.22)",
            boxShadow: "0 14px 28px rgba(0,0,0,0.22)",
        },
    },
    rolRow: {
        px: 2,
        py: 1.8,
        display: "grid",
        gridTemplateColumns: "2fr 1.2fr 1fr 0.8fr",
        gap: 2,
        alignItems: "center",
    },
    colRole: {
        display: "flex",
        alignItems: "center",
        gap: 1.6,
        minWidth: 0,
    },
    colCode: {
        display: "flex",
        alignItems: "center",
    },
    colStatus: {
        display: "flex",
        alignItems: "center",
    },
    colActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 1,
    },
    rolIdBadge: {
        width: 48,
        height: 48,
        borderRadius: "16px",
        bgcolor: "rgba(251,191,36,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fbbf24",
        fontWeight: 900,
        fontSize: "0.82rem",
        border: "1px solid rgba(251,191,36,0.18)",
        flexShrink: 0,
    },
    rolInput: {
        width: "100%",
        "& .MuiInputBase-input": {
            color: "#f8fafc",
            fontWeight: 800,
            fontSize: "1rem",
            py: 0.2,
            transition: "all 0.2s ease",
            "&:focus": {
                color: "#fbbf24",
            },
        },
    },
    rowMeta: {
        color: "#64748b",
        fontSize: "0.73rem",
        mt: 0.4,
    },
    slugText: {
        color: "#cbd5e1",
        fontSize: "0.8rem",
        fontWeight: 700,
        fontFamily: "monospace",
        px: 1.2,
        py: 0.8,
        borderRadius: "10px",
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "inline-flex",
    },
    durumChip: {
        bgcolor: "rgba(34,197,94,0.10)",
        color: "#4ade80",
        fontWeight: 800,
        border: "1px solid rgba(74,222,128,0.18)",
        borderRadius: "10px",
    },
    rowDeleteBtn: {
        color: "#94a3b8",
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.04)",
        "&:hover": {
            color: "#ef4444",
            bgcolor: "rgba(239,68,68,0.08)",
        },
    },
    bosAlan: {
        p: 7,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
    },
    loadingAlan: {
        p: 7,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
};