import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import {
    AltRoute,
    CheckCircle,
    InfoOutlined,
    Inventory2,
    LocalShipping,
    NotificationsNone,
    Route,
    WarningAmber,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { supabase } from "../supabase";

const MotionPaper = motion(Paper);

export default function Anasayfa() {
    const [loading, setLoading] = useState(true);
    const [hata, setHata] = useState("");
    const [aktifKullanici, setAktifKullanici] = useState("");
    const [gorunenAd, setGorunenAd] = useState("");
    const [atamalarRows, setAtamalarRows] = useState([]);
    const [tamamlananRows, setTamamlananRows] = useState([]);
    const [akisFiltre, setAkisFiltre] = useState("tum");

    const isMobile = useMediaQuery("(max-width:900px)");

    useEffect(() => {
        try {
            const rawUser = localStorage.getItem("bapsis_user");
            if (!rawUser) return;
            const parsed = JSON.parse(rawUser);
            const username = (parsed?.username || "").trim();
            const displayName = (parsed?.displayName || "").trim();
            setAktifKullanici(username);
            setGorunenAd(displayName || username);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        let alive = true;

        async function yukle() {
            setLoading(true);
            setHata("");

            try {
                const [atamalarRes, tamamlananRes] = await Promise.all([
                    supabase
                        .from("plaka_atamalar")
                        .select("*")
                        .order("updated_at", { ascending: false })
                        .limit(2000),
                    supabase
                        .from("tamamlanan_seferler")
                        .select("*")
                        .order("updated_at", { ascending: false })
                        .limit(2000),
                ]);

                if (atamalarRes.error) throw atamalarRes.error;
                if (tamamlananRes.error) throw tamamlananRes.error;

                if (!alive) return;
                setAtamalarRows(atamalarRes.data || []);
                setTamamlananRows(tamamlananRes.data || []);
            } catch (e) {
                if (!alive) return;
                setHata(e?.message || "Veriler yüklenemedi");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }

        yukle();
        return () => {
            alive = false;
        };
    }, []);

    const data = useMemo(() => {
        const now = new Date();
        const normalize = (v) => (v ?? "").toString().trim();

        const classify = (r) => {
            const cekiciBos = !normalize(r.cekici);
            const dorseBos = !normalize(r.dorse);
            const surucuBos = !normalize(r.surucu);
            const telefonBos = !normalize(r.telefon);
            const teslimVar = !!normalize(r.teslimattarihsaat);

            if (teslimVar) return "teslim";
            if (cekiciBos && dorseBos) return "bekliyor";
            if (cekiciBos || dorseBos || surucuBos || telefonBos) return "kritik";
            return "atandi";
        };

        const minutesAgoText = (d) => {
            if (!d) return "—";
            const dt = new Date(d);
            if (Number.isNaN(dt.getTime())) return "—";
            const diffMs = now.getTime() - dt.getTime();
            const mins = Math.max(0, Math.round(diffMs / 60000));
            if (mins < 60) return `${mins} dk önce`;
            const hrs = Math.round(mins / 60);
            if (hrs < 24) return `${hrs} sa önce`;
            return `${Math.round(hrs / 24)} gün önce`;
        };

        const toplamSefer = atamalarRows.length;
        const bekleyen = atamalarRows.filter((r) => classify(r) === "bekliyor").length;
        const kritik = atamalarRows.filter((r) => classify(r) === "kritik").length;
        const teslim = atamalarRows.filter((r) => classify(r) === "teslim").length || tamamlananRows.length;
        const aktifFilo = new Set(atamalarRows.map((r) => normalize(r.cekici)).filter(Boolean)).size;

        const kalite = toplamSefer
            ? Math.round(
                (atamalarRows.filter(
                    (r) =>
                        normalize(r.cekici) &&
                        normalize(r.dorse) &&
                        normalize(r.surucu) &&
                        normalize(r.telefon)
                ).length /
                    toplamSefer) *
                100
            )
            : 0;

        const logs = atamalarRows.slice(0, 14).map((r) => ({
            id: r.id,
            sefer: normalize(r.seferno) || normalize(r.line_no) || normalize(r.id) || "—",
            rota: `${normalize(r.kalkis) || "—"} → ${normalize(r.varis1) || "—"}`,
            surucu: normalize(r.surucu) || "Sürücü yok",
            arac: `${normalize(r.cekici) || "Çekici yok"} • ${normalize(r.dorse) || "Dorse yok"}`,
            durum: classify(r),
            updatedAt: r.updated_at,
        }));

        const visibleLogs = akisFiltre === "tum" ? logs : logs.filter((x) => x.durum === akisFiltre);

        const warningList = atamalarRows
            .filter((r) => ["kritik", "bekliyor"].includes(classify(r)))
            .slice(0, 6)
            .map((r) => ({
                id: r.id,
                text: `Sefer #${normalize(r.seferno) || normalize(r.line_no) || r.id} • ${normalize(r.kalkis) || "—"} → ${normalize(r.varis1) || "—"}`,
            }));

        const score = Math.round(
            (toplamSefer ? ((toplamSefer - bekleyen - kritik) / toplamSefer) * 45 : 0) +
            (toplamSefer ? (teslim / toplamSefer) * 25 : 0) +
            kalite * 0.3
        );

        return {
            toplamSefer,
            bekleyen,
            kritik,
            teslim,
            aktifFilo,
            kalite,
            score,
            visibleLogs,
            warningList,
            minutesAgoText,
        };
    }, [atamalarRows, tamamlananRows, akisFiltre]);

    const isim = (gorunenAd || aktifKullanici || "KULLANICI").toUpperCase();

    return (
        <Box sx={styles.page}>
            <Box sx={styles.gridBg} />
            <Box sx={styles.glowA} />
            <Box sx={styles.glowB} />

            <Container maxWidth="xl" sx={styles.container}>
                <Box sx={styles.topbar}>
                    <Box>
                        <Typography sx={styles.title}>ODAK LOJİSTİK</Typography>
                        <Typography sx={styles.subtitle}>Operasyon merkezi • {isim}</Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                        {!isMobile && <Chip label="Canlı görünüm" sx={styles.topChip} />}
                        <Tooltip title="Bildirimler">
                            <IconButton sx={styles.topButton}>
                                <NotificationsNone />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Bilgi">
                            <IconButton sx={styles.topButton}>
                                <InfoOutlined />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                {hata && (
                    <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>
                        {hata}
                    </Alert>
                )}

                {loading && (
                    <Box sx={styles.loadingWrap}>
                        <CircularProgress size={22} />
                        <Typography sx={{ color: "#94a3b8" }}>Veriler yükleniyor…</Typography>
                    </Box>
                )}

                <Grid container spacing={2.5} alignItems="start">
                    <Grid item xs={12} xl={4}>
                        <Stack spacing={2.5}>
                            <MotionPaper initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} sx={styles.heroCard}>
                                <Box sx={styles.heroTopRow}>
                                    <Box>
                                        <Typography sx={styles.heroTitle}>Genel Operasyon Özeti</Typography>
                                        <Typography sx={styles.heroSub}>Eşzamanlı operasyon metrikleri</Typography>
                                    </Box>
                                    <Box sx={styles.scoreBadge}>
                                        <Typography sx={styles.scoreBadgeValue}>{data.score}</Typography>
                                        <Typography sx={styles.scoreBadgeText}>Skor</Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={1.3} sx={{ mt: 0.5 }}>
                                    <Grid item xs={6} sm={3} xl={6}>
                                        <SummaryCard label="Toplam Sefer" value={data.toplamSefer} icon={<Route />} tone="blue" />
                                    </Grid>
                                    <Grid item xs={6} sm={3} xl={6}>
                                        <SummaryCard label="Teslim" value={data.teslim} icon={<CheckCircle />} tone="green" />
                                    </Grid>
                                    <Grid item xs={6} sm={3} xl={6}>
                                        <SummaryCard label="Bekleyen" value={data.bekleyen} icon={<Inventory2 />} tone="amber" />
                                    </Grid>
                                    <Grid item xs={6} sm={3} xl={6}>
                                        <SummaryCard label="Aktif Filo" value={data.aktifFilo} icon={<LocalShipping />} tone="purple" />
                                    </Grid>
                                </Grid>
                            </MotionPaper>

                            <MotionPaper initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} sx={styles.panelCompact}>
                                <Typography sx={styles.panelTitle}>Operasyon Sağlığı</Typography>
                                <Typography sx={styles.panelSub}>Anlık performans özeti</Typography>
                                <Divider sx={styles.divider} />

                                <Stack spacing={1.4}>
                                    <MetricStrip label="Veri Kalitesi" value={data.kalite} color="#14b8a6" compact />
                                    <MetricStrip
                                        label="Tamamlama Oranı"
                                        value={data.toplamSefer ? Math.round((data.teslim / data.toplamSefer) * 100) : 0}
                                        color="#3b82f6"
                                        compact
                                    />
                                    <MetricStrip
                                        label="Bekleyen Yük"
                                        value={data.toplamSefer ? Math.round((data.bekleyen / data.toplamSefer) * 100) : 0}
                                        color="#f59e0b"
                                        compact
                                    />
                                </Stack>
                            </MotionPaper>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={5} xl={3}>
                        <MotionPaper initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} sx={styles.sideCard}>
                            <Typography sx={styles.panelTitle}>Kritik Uyarılar</Typography>
                            <Typography sx={styles.panelSub}>Öncelikli kontrol gerektiren kayıtlar</Typography>
                            <Divider sx={styles.divider} />

                            <Stack spacing={1.1}>
                                {data.warningList.length === 0 ? (
                                    <Typography sx={styles.emptyText}>Kritik uyarı bulunmuyor.</Typography>
                                ) : (
                                    data.warningList.map((item) => (
                                        <Box key={item.id} sx={styles.warningRow}>
                                            <WarningAmber sx={{ fontSize: 18, color: "#f59e0b" }} />
                                            <Typography sx={styles.warningText}>{item.text}</Typography>
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        </MotionPaper>
                    </Grid>

                    <Grid item xs={12} md={7} xl={5}>
                        <MotionPaper initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} sx={styles.panelLogs}>
                            <Box sx={styles.panelHeader}>
                                <Box>
                                    <Typography sx={styles.panelTitle}>Canlı Operasyon Logları</Typography>
                                    <Typography sx={styles.panelSub}>Son hareketler ve araç atamaları</Typography>
                                </Box>
                                <Box sx={styles.filterWrap}>
                                    <MiniFilter label="Tümü" aktif={akisFiltre === "tum"} onClick={() => setAkisFiltre("tum")} />
                                    <MiniFilter label="Atandı" aktif={akisFiltre === "atandi"} onClick={() => setAkisFiltre("atandi")} />
                                    <MiniFilter label="Kritik" aktif={akisFiltre === "kritik"} onClick={() => setAkisFiltre("kritik")} />
                                    <MiniFilter label="Bekliyor" aktif={akisFiltre === "bekliyor"} onClick={() => setAkisFiltre("bekliyor")} />
                                    <MiniFilter label="Teslim" aktif={akisFiltre === "teslim"} onClick={() => setAkisFiltre("teslim")} />
                                </Box>
                            </Box>

                            <Divider sx={styles.divider} />

                            <Stack spacing={1.1}>
                                {data.visibleLogs.length === 0 ? (
                                    <Typography sx={styles.emptyText}>Kayıt bulunamadı.</Typography>
                                ) : (
                                    data.visibleLogs.map((row, index) => (
                                        <MotionPaper
                                            key={row.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            whileHover={{ x: 4 }}
                                            sx={styles.logCard}
                                        >
                                            <Box sx={{ ...styles.logIcon, ...statusTone(row.durum) }}>
                                                {row.durum === "teslim" ? (
                                                    <CheckCircle fontSize="small" />
                                                ) : row.durum === "kritik" ? (
                                                    <WarningAmber fontSize="small" />
                                                ) : row.durum === "bekliyor" ? (
                                                    <Inventory2 fontSize="small" />
                                                ) : (
                                                    <AltRoute fontSize="small" />
                                                )}
                                            </Box>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={styles.logTitle}>Sefer #{row.sefer}</Typography>
                                                <Typography sx={styles.logRoute}>{row.rota}</Typography>
                                                <Typography sx={styles.logMeta}>{row.surucu} • {row.arac}</Typography>
                                            </Box>

                                            <Box sx={styles.logRight}>
                                                <DurumChip durum={row.durum} />
                                                <Typography sx={styles.timeText}>{data.minutesAgoText(row.updatedAt)}</Typography>
                                            </Box>
                                        </MotionPaper>
                                    ))
                                )}
                            </Stack>
                        </MotionPaper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

function SummaryCard({ label, value, icon, tone }) {
    const toneMap = {
        blue: { color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
        green: { color: "#34d399", bg: "rgba(16,185,129,0.12)" },
        amber: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
        purple: { color: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
    };
    const cfg = toneMap[tone] || toneMap.blue;

    return (
        <Paper sx={styles.summaryCard}>
            <Box sx={{ ...styles.summaryIcon, color: cfg.color, bgcolor: cfg.bg }}>{icon}</Box>
            <Typography sx={styles.summaryLabel}>{label}</Typography>
            <Typography sx={styles.summaryValue}>{String(value).padStart(2, "0")}</Typography>
        </Paper>
    );
}

function MetricStrip({ label, value, color, compact = false }) {
    return (
        <Box sx={compact ? styles.metricStripCompact : styles.metricStrip}>
            <Typography sx={styles.metricLabel}>
                {label}
                <span>%{value}</span>
            </Typography>
            <LinearProgress
                variant="determinate"
                value={Math.min(value, 100)}
                sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.06)",
                    "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        bgcolor: color,
                    },
                }}
            />
        </Box>
    );
}

function MiniFilter({ label, aktif, onClick }) {
    return (
        <Chip
            label={label}
            onClick={onClick}
            size="small"
            sx={{
                color: aktif ? "#fff" : "#94a3b8",
                bgcolor: aktif ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.03)",
                border: aktif ? "1px solid rgba(59,130,246,0.35)" : "1px solid rgba(255,255,255,0.05)",
                fontWeight: 700,
                borderRadius: "999px",
                height: 28,
            }}
        />
    );
}

function DurumChip({ durum }) {
    const map = {
        teslim: { label: "Teslim", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
        bekliyor: { label: "Bekliyor", color: "#f59e0b", bg: "rgba(245,158,11,0.14)" },
        kritik: { label: "Kritik", color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
        atandi: { label: "Atandı", color: "#3b82f6", bg: "rgba(59,130,246,0.14)" },
    };
    const cfg = map[durum] || map.atandi;

    return (
        <Box
            sx={{
                px: 1.1,
                py: 0.5,
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: cfg.color,
                bgcolor: cfg.bg,
                whiteSpace: "nowrap",
            }}
        >
            {cfg.label}
        </Box>
    );
}

function statusTone(durum) {
    if (durum === "teslim") return { bgcolor: "rgba(16,185,129,0.14)", color: "#10b981" };
    if (durum === "kritik") return { bgcolor: "rgba(239,68,68,0.14)", color: "#ef4444" };
    if (durum === "bekliyor") return { bgcolor: "rgba(245,158,11,0.14)", color: "#f59e0b" };
    return { bgcolor: "rgba(59,130,246,0.14)", color: "#3b82f6" };
}

const styles = {
    page: {
        minHeight: "100vh",
        bgcolor: "#020617",
        pt: { xs: 2, md: 3 },
        pb: { xs: 3, md: 6 },
        position: "relative",
        overflow: "hidden",
    },
    gridBg: {
        position: "absolute",
        inset: 0,
        opacity: 0.05,
        backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(circle at center, black 24%, transparent 80%)",
    },
    glowA: {
        position: "absolute",
        top: -120,
        right: -60,
        width: 340,
        height: 340,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.16), transparent 70%)",
        filter: "blur(48px)",
    },
    glowB: {
        position: "absolute",
        left: -100,
        bottom: -120,
        width: 320,
        height: 320,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)",
        filter: "blur(48px)",
    },
    container: {
        position: "relative",
        zIndex: 1,
        px: { xs: "12px !important", sm: "20px !important", md: "24px !important" },
    },
    topbar: {
        mb: 2.5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
        flexWrap: "wrap",
    },
    title: {
        color: "#fff",
        fontWeight: 900,
        letterSpacing: "-1.4px",
        fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
        lineHeight: 1.05,
    },
    subtitle: {
        color: "#94a3b8",
        mt: 0.6,
        fontSize: { xs: "0.88rem", md: "0.98rem" },
    },
    topChip: {
        color: "#cbd5e1",
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        fontWeight: 700,
    },
    topButton: {
        width: 42,
        height: 42,
        bgcolor: "rgba(255,255,255,0.03)",
        color: "#94a3b8",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    loadingWrap: {
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 2.5,
        px: 2,
        py: 1.4,
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        width: "fit-content",
    },
    heroCard: {
        p: { xs: 2, md: 2.5 },
        borderRadius: "24px",
        background: "linear-gradient(180deg, rgba(8,15,33,0.9), rgba(8,15,33,0.78))",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
    },
    heroTopRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
        flexWrap: "wrap",
    },
    heroTitle: {
        color: "#fff",
        fontWeight: 800,
        fontSize: { xs: "1.05rem", md: "1.22rem" },
    },
    heroSub: {
        color: "#64748b",
        fontSize: "0.82rem",
        mt: 0.45,
    },
    scoreBadge: {
        minWidth: 86,
        px: 1.6,
        py: 1.2,
        borderRadius: "18px",
        background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.16)",
        textAlign: "center",
    },
    scoreBadgeValue: {
        color: "#10b981",
        fontWeight: 900,
        fontSize: "1.55rem",
        lineHeight: 1,
    },
    scoreBadgeText: {
        color: "#94a3b8",
        fontSize: "0.72rem",
        mt: 0.35,
    },
    summaryCard: {
        p: 1.6,
        borderRadius: "18px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
        height: "100%",
        boxShadow: "none",
    },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    summaryLabel: {
        color: "#8ea4c7",
        fontSize: "0.75rem",
        fontWeight: 700,
        mt: 1.2,
    },
    summaryValue: {
        color: "#fff",
        fontSize: "1.95rem",
        fontWeight: 900,
        lineHeight: 1.1,
        mt: 0.5,
    },
    metricStrip: {
        p: 1.3,
        borderRadius: "16px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
    },
    metricStripCompact: {
        p: 1.25,
        borderRadius: "16px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.05)",
    },
    metricLabel: {
        color: "#fff",
        fontSize: "0.88rem",
        mb: 0.8,
        display: "flex",
        justifyContent: "space-between",
        fontWeight: 600,
    },
    sideCard: {
        p: { xs: 2, md: 2.4 },
        borderRadius: "24px",
        background: "linear-gradient(180deg, rgba(8,15,33,0.9), rgba(8,15,33,0.78))",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
        minHeight: 320,
    },
    panel: {
        p: { xs: 2, md: 2.4 },
        borderRadius: "24px",
        background: "linear-gradient(180deg, rgba(8,15,33,0.9), rgba(8,15,33,0.78))",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
    },
    panelCompact: {
        p: { xs: 2, md: 2.2 },
        borderRadius: "24px",
        background: "linear-gradient(180deg, rgba(8,15,33,0.9), rgba(8,15,33,0.78))",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
    },
    panelLogs: {
        p: { xs: 2, md: 2.4 },
        borderRadius: "24px",
        background: "linear-gradient(180deg, rgba(8,15,33,0.9), rgba(8,15,33,0.78))",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
        minHeight: 620,
    },
    panelHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
        flexWrap: "wrap",
    },
    panelTitle: {
        color: "#fff",
        fontWeight: 800,
        fontSize: { xs: "1.02rem", md: "1.16rem" },
    },
    panelSub: {
        color: "#64748b",
        fontSize: { xs: "0.78rem", md: "0.82rem" },
        mt: 0.45,
    },
    divider: {
        borderColor: "rgba(255,255,255,0.05)",
        my: 2,
    },
    filterWrap: {
        display: "flex",
        gap: 0.8,
        flexWrap: "wrap",
    },
    logCard: {
        p: 1.25,
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "flex-start",
        gap: 1.2,
        flexWrap: "wrap",
        boxShadow: "none",
    },
    logIcon: {
        width: 34,
        height: 34,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    logTitle: {
        color: "#e2e8f0",
        fontWeight: 700,
        fontSize: { xs: "0.9rem", md: "0.95rem" },
    },
    logRoute: {
        color: "#93c5fd",
        fontSize: "0.8rem",
        fontWeight: 700,
        mt: 0.35,
    },
    logMeta: {
        color: "#72839d",
        fontSize: { xs: "0.78rem", md: "0.82rem" },
        mt: 0.45,
        lineHeight: 1.45,
    },
    logRight: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        ml: { xs: 0, md: "auto" },
        width: { xs: "100%", md: "auto" },
        pl: { xs: 4.6, md: 0 },
        flexWrap: "wrap",
    },
    timeText: {
        color: "#64748b",
        fontSize: "0.75rem",
        fontWeight: 700,
    },
    warningRow: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 1.05,
        borderRadius: "14px",
        bgcolor: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.16)",
    },
    warningText: {
        color: "#f8fafc",
        fontSize: { xs: "0.79rem", md: "0.82rem" },
        lineHeight: 1.4,
    },
    emptyText: {
        color: "#64748b",
    },
};
