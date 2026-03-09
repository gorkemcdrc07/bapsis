import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    Divider,
    IconButton,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    Timeline,
    AssignmentLate,
    CheckCircleOutline,
    Speed,
    TrendingUp,
    NotificationsNone,
    InfoOutlined,
    OpenInNew,
    ArrowForwardIos,
} from "@mui/icons-material";
import { motion } from "framer-motion";

import { supabase } from "../supabase";

export default function Anasayfa({ kullanici }) {
    const isim =
        kullanici?.kullanici || kullanici?.mail?.split("@")[0]?.toUpperCase() || "KULLANICI";

    const [loading, setLoading] = useState(true);
    const [hata, setHata] = useState("");

    // plakalar = master tablo (aktif/pasif filo vs için)
    const [plakalarRows, setPlakalarRows] = useState([]);

    // plaka_atamalar = operasyon kayıtları
    const [atamalarRows, setAtamalarRows] = useState([]);

    useEffect(() => {
        let alive = true;

        async function yukle() {
            setLoading(true);
            setHata("");

            try {
                const [plakalarRes, atamalarRes] = await Promise.all([
                    supabase
                        .from("plakalar")
                        .select("id,cekici,dorse,ad_soyad,telefon,tc_no,statu,updated_at")
                        .order("updated_at", { ascending: false })
                        .limit(1000),

                    supabase
                        .from("plaka_atamalar")
                        .select(
                            "id,batch_id,seferno,sevktarihi,yukleyendepo,kalkis,araccinsi,cekici,dorse,tc,surucu,telefon,faturavkn,varis1,varis2,varis3,irsaliyeno,datalogerno,navlun,teslimattarihsaat,updated_at,updated_by_email,updated_by_name,line_no"
                        )
                        .order("updated_at", { ascending: false })
                        .limit(2000),
                ]);

                if (plakalarRes.error) throw plakalarRes.error;
                if (atamalarRes.error) throw atamalarRes.error;

                if (!alive) return;
                setPlakalarRows(plakalarRes.data || []);
                setAtamalarRows(atamalarRes.data || []);
            } catch (e) {
                if (!alive) return;
                setHata(e?.message || "Veriler yüklenirken hata oluştu.");
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

    const hesap = useMemo(() => {
        const now = new Date();
        const normalize = (v) => (v ?? "").toString().trim();

        // ✅ İSTENEN: Günlük sefer = tabloda kaç satır varsa
        const gunlukSefer = atamalarRows.length;

        // ✅ İSTENEN: Bekleyen = cekici ve dorse BOŞ olan satırlar
        // (Sadece biri boşsa sayma demişsin; ikisi de boş olanları sayıyoruz)
        const bekleyen = atamalarRows.filter(
            (r) => !normalize(r.cekici) && !normalize(r.dorse)
        ).length;

        // ✅ Tamamlanan: teslimattarihsaat doluysa
        const tamamlanan = atamalarRows.filter((r) => !!normalize(r.teslimattarihsaat)).length;

        // ✅ Aktif filo: atamalarda geçen benzersiz çekici sayısı
        // (çekici yoksa plakalar.statu='aktif' yedek)
        const uniqueCekici = new Set(atamalarRows.map((r) => normalize(r.cekici)).filter(Boolean));
        let aktifFilo = uniqueCekici.size;

        if (aktifFilo === 0) {
            const activePlates = plakalarRows.filter((p) => {
                const st = normalize(p.statu).toLowerCase();
                return st === "aktif" || st === "active" || st === "on" || st === "1";
            });
            const setA = new Set(activePlates.map((p) => normalize(p.cekici)).filter(Boolean));
            aktifFilo = setA.size;
        }

        // Canlı akış: son güncellenen 8 atama
        const liveFeed = atamalarRows.slice(0, 8).map((r) => {
            const critical = !normalize(r.cekici) || !normalize(r.dorse);
            const sefer = normalize(r.seferno) || normalize(r.line_no) || normalize(r.id) || "—";

            const driverName = normalize(r.surucu) || "—";
            const driverPhone = normalize(r.telefon) || "—";
            const driverTc = normalize(r.tc) || "—";

            const title = `Sefer #${sefer} • ${normalize(r.kalkis) || "—"} → ${normalize(r.varis1) || "—"}`;
            const sub = [
                `Sürücü: ${driverName} (Tel: ${driverPhone}, TC: ${driverTc})`,
                `Çekici: ${normalize(r.cekici) || "—"} • Dorse: ${normalize(r.dorse) || "—"}`,
                normalize(r.yukleyendepo) ? `Yükleyen Depo: ${normalize(r.yukleyendepo)}` : null,
            ]
                .filter(Boolean)
                .join("  |  ");

            return {
                id: r.id,
                critical,
                title,
                sub,
                updatedAt: r.updated_at ? new Date(r.updated_at) : null,
            };
        });

        const minutesAgoText = (d) => {
            if (!d) return "—";
            const diffMs = now.getTime() - d.getTime();
            const mins = Math.max(0, Math.round(diffMs / 60000));
            if (mins < 60) return `${mins} dk önce`;
            const hrs = Math.round(mins / 60);
            return `${hrs} sa önce`;
        };

        // Skor (basit, tamamen opsiyonel)
        const hedefGunluk = 30;
        const deliveryRate = gunlukSefer ? tamamlanan / gunlukSefer : 0;
        const assignmentHealth = gunlukSefer ? 1 - bekleyen / gunlukSefer : 0;
        const goalHealth = Math.min(1, gunlukSefer / hedefGunluk);
        const skor = Math.round((deliveryRate * 0.45 + assignmentHealth * 0.35 + goalHealth * 0.2) * 100);

        const pctAssignment = Math.max(0, Math.min(100, Math.round(assignmentHealth * 100)));
        const pctDelivery = Math.max(0, Math.min(100, Math.round(deliveryRate * 100)));

        return {
            hedefGunluk,
            gunlukSefer,
            bekleyen,
            tamamlanan,
            aktifFilo,
            liveFeed,
            minutesAgoText,
            skor,
            pctAssignment,
            pctDelivery,
        };
    }, [plakalarRows, atamalarRows]);

    return (
        <Box sx={stil.anaKonteyner}>
            {/* Dinamik Arka Plan */}
            <Box sx={stil.arkaPlanEfektleri}>
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    style={stil.parlama1}
                />
                <motion.div
                    animate={{ scale: [1.3, 1, 1.3], rotate: [90, 0, 90], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    style={stil.parlama2}
                />
            </Box>

            <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
                {/* Üst Bar */}
                <Box sx={stil.ustBar}>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <Typography variant="h3" sx={stil.baslik}>
                            ODAK <span style={{ color: "#3b82f6" }}>LOJİSTİK</span>
                        </Typography>
                        <Typography sx={stil.altBaslik}>
                            Operasyonel Komuta Merkezi • <span style={{ color: "#fff" }}>{isim}</span>
                        </Typography>
                    </motion.div>

                    <Box sx={{ display: "flex", gap: 2 }}>
                        <IconButton sx={stil.ustButon}>
                            <NotificationsNone />
                        </IconButton>
                        <IconButton sx={stil.ustButon}>
                            <InfoOutlined />
                        </IconButton>
                    </Box>
                </Box>

                {hata ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {hata}
                    </Alert>
                ) : null}

                {loading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
                        <CircularProgress size={20} />
                        <Typography sx={{ color: "#94a3b8" }}>Veriler yükleniyor…</Typography>
                    </Box>
                ) : null}

                {/* Dashboard Kartları */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <ModernKart
                            ikon={<Timeline />}
                            baslik="GÜNLÜK SEFER"
                            deger={String(hesap.gunlukSefer).padStart(2, "0")}
                            alt="plaka_atamalar satır sayısı"
                            renk="#3b82f6"
                            delay={0.1}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <ModernKart
                            ikon={<AssignmentLate />}
                            baslik="BEKLEYEN"
                            deger={String(hesap.bekleyen).padStart(2, "0")}
                            alt="çekici + dorse boş"
                            renk="#f59e0b"
                            delay={0.2}
                            alert
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <ModernKart
                            ikon={<CheckCircleOutline />}
                            baslik="TAMAMLANAN"
                            deger={String(hesap.tamamlanan).padStart(2, "0")}
                            alt="teslimattarihsaat dolu"
                            renk="#10b981"
                            delay={0.3}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <ModernKart
                            ikon={<Speed />}
                            baslik="AKTİF FİLO"
                            deger={String(hesap.aktifFilo).padStart(2, "0")}
                            alt="benzersiz çekici"
                            renk="#8b5cf6"
                            delay={0.4}
                        />
                    </Grid>
                </Grid>

                {/* Operasyon & Analiz */}
                <Grid container spacing={4}>
                    <Grid item xs={12} lg={7}>
                        <PanelKarti baslik="Canlı Operasyon Akışı" alt="Son güncellenen atamalar (sürücü detaylı)">
                            <Box sx={stil.listeKonteyner}>
                                {hesap.liveFeed.length === 0 ? (
                                    <Typography sx={{ color: "#64748b" }}>Kayıt bulunamadı.</Typography>
                                ) : (
                                    hesap.liveFeed.map((row) => (
                                        <motion.div key={row.id} whileHover={{ x: 10 }} style={stil.listeEleman}>
                                            <Box
                                                sx={{
                                                    ...stil.durumNokta,
                                                    bgcolor: row.critical ? "#ef4444" : "#10b981",
                                                }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={stil.listeMetin}>{row.title}</Typography>
                                                <Typography sx={stil.listeAltMetin}>{row.sub}</Typography>
                                            </Box>
                                            <Typography sx={stil.zamanMetin}>{hesap.minutesAgoText(row.updatedAt)}</Typography>
                                            <IconButton size="small" sx={{ color: "#3b82f6" }}>
                                                <OpenInNew fontSize="inherit" />
                                            </IconButton>
                                        </motion.div>
                                    ))
                                )}
                            </Box>
                        </PanelKarti>
                    </Grid>

                    <Grid item xs={12} lg={5}>
                        <PanelKarti baslik="Operasyon Skoru" alt="Basit performans özeti">
                            <Box sx={stil.performansKonteyner}>
                                <Box sx={stil.skorDaire}>
                                    <Typography variant="h2" sx={{ fontWeight: 900, color: "#10b981" }}>
                                        {Number.isFinite(hesap.skor) ? hesap.skor : 0}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                        PUAN
                                    </Typography>
                                </Box>

                                <Box sx={{ width: "100%", mt: 3 }}>
                                    <Typography sx={stil.progressLabel}>
                                        Atama Sağlığı <span>%{hesap.pctAssignment}</span>
                                    </Typography>
                                    <Box sx={stil.progressLine}>
                                        <Box
                                            sx={{
                                                ...stil.progressFill,
                                                width: `${hesap.pctAssignment}%`,
                                                bgcolor: "#10b981",
                                            }}
                                        />
                                    </Box>

                                    <Typography sx={{ ...stil.progressLabel, mt: 2 }}>
                                        Teslim Oranı <span>%{hesap.pctDelivery}</span>
                                    </Typography>
                                    <Box sx={stil.progressLine}>
                                        <Box
                                            sx={{
                                                ...stil.progressFill,
                                                width: `${hesap.pctDelivery}%`,
                                                bgcolor: "#3b82f6",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </PanelKarti>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

// --- ALT BİLEŞENLER ---

const ModernKart = ({ ikon, baslik, deger, alt, renk, delay, alert }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 100 }}
        whileHover={{ scale: 1.02, translateY: -5 }}
    >
        <Paper sx={{ ...stil.modernKart, borderTop: `4px solid ${renk}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                    <Typography sx={stil.kartEtiket}>{baslik}</Typography>
                    <Typography sx={stil.kartDeger}>{deger}</Typography>
                </Box>
                <Box sx={{ ...stil.ikonDaire, bgcolor: `${renk}20`, color: renk }}>{ikon}</Box>
            </Box>
            <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp sx={{ fontSize: 16, color: alert ? "#ef4444" : "#10b981" }} />
                <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>{alt}</Typography>
            </Box>
        </Paper>
    </motion.div>
);

const PanelKarti = ({ children, baslik, alt }) => (
    <Paper sx={stil.anaPanel}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
                <Typography sx={stil.panelBaslik}>{baslik}</Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>{alt}</Typography>
            </Box>
            <IconButton size="small" sx={{ color: "#3b82f6" }}>
                <ArrowForwardIos fontSize="inherit" />
            </IconButton>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", mb: 3 }} />
        {children}
    </Paper>
);

// --- STİLLER ---

const stil = {
    anaKonteyner: { minHeight: "100vh", bgcolor: "#020617", pt: 4, pb: 8, position: "relative", overflow: "hidden" },
    arkaPlanEfektleri: { position: "absolute", inset: 0, zIndex: 0, filter: "blur(120px)" },
    parlama1: { position: "absolute", top: "-5%", right: "5%", width: "35vw", height: "35vw", borderRadius: "50%", background: "rgba(59, 130, 246, 0.12)" },
    parlama2: { position: "absolute", bottom: "5%", left: "5%", width: "25vw", height: "25vw", borderRadius: "50%", background: "rgba(139, 92, 246, 0.08)" },
    ustBar: { mb: 6, display: "flex", justifyContent: "space-between", alignItems: "center" },
    baslik: { color: "#fff", fontWeight: 900, letterSpacing: "-1.5px" },
    altBaslik: { color: "#64748b", fontSize: "1rem", mt: 0.5 },
    ustButon: { bgcolor: "rgba(255,255,255,0.03)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.05)", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" } },

    modernKart: { p: 3, borderRadius: "24px", bgcolor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" },
    kartEtiket: { color: "#94a3b8", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "1px" },
    kartDeger: { color: "#fff", fontSize: "2.2rem", fontWeight: 900, lineHeight: 1.2, mt: 0.5 },
    ikonDaire: { width: 48, height: 48, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },

    anaPanel: { p: 4, borderRadius: "32px", bgcolor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.03)", minHeight: "400px" },
    panelBaslik: { color: "#fff", fontWeight: 800, fontSize: "1.3rem" },
    listeKonteyner: { display: "flex", flexDirection: "column", gap: 1.5 },
    listeEleman: { p: 2, borderRadius: "18px", bgcolor: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 2, border: "1px solid rgba(255,255,255,0.03)" },
    durumNokta: { width: 10, height: 10, borderRadius: "50%", boxShadow: "0 0 10px currentColor" },
    listeMetin: { color: "#e2e8f0", fontWeight: 600, fontSize: "0.95rem" },
    listeAltMetin: { color: "#64748b", fontSize: "0.8rem" },
    zamanMetin: { color: "#475569", fontSize: "0.75rem", fontWeight: 600 },

    performansKonteyner: { display: "flex", flexDirection: "column", alignItems: "center", pt: 2 },
    skorDaire: { width: 140, height: 140, borderRadius: "50%", border: "8px solid rgba(16, 185, 129, 0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.1)" },

    progressLabel: { color: "#fff", fontSize: "0.9rem", mb: 1, display: "flex", justifyContent: "space-between" },
    progressLine: { width: "100%", height: 6, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 10 },
};