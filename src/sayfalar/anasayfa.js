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
    Chip,
    Tooltip,
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
    WarningAmber,
    PersonOutline,
    FactCheck,
    Autorenew,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { supabase } from "../supabase";

export default function Anasayfa() {
    const [aktifKullanici, setAktifKullanici] = useState("");
    const [gorunenAd, setGorunenAd] = useState("");

    const [loading, setLoading] = useState(true);
    const [hata, setHata] = useState("");

    const [plakalarRows, setPlakalarRows] = useState([]);
    const [atamalarRows, setAtamalarRows] = useState([]);
    const [tamamlananRows, setTamamlananRows] = useState([]);
    const [akışFiltre, setAkışFiltre] = useState("tum");

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
            console.error("localStorage kullanıcı okunamadı:", err);
        }
    }, []);

    const isim = (gorunenAd || aktifKullanici || "KULLANICI").toUpperCase();

    useEffect(() => {
        let alive = true;

        async function yukle() {
            setLoading(true);
            setHata("");

            try {
                const [plakalarRes, atamalarRes, tamamlananRes] = await Promise.all([
                    supabase
                        .from("plakalar")
                        .select("id,cekici,dorse,ad_soyad,telefon,tc_no,statu,updated_at")
                        .order("updated_at", { ascending: false })
                        .limit(1000),

                    supabase
                        .from("plaka_atamalar")
                        .select(
                            "id,batch_id,seferno,sevktarihi,yukleyendepo,kalkis,araccinsi,cekici,dorse,tc,surucu,telefon,faturavkn,varis1,varis2,varis3,irsaliyeno,datalogerno,navlun,teslimattarihsaat,updated_at,updated_by_name,line_no"
                        )
                        .order("updated_at", { ascending: false })
                        .limit(2000),

                    supabase
                        .from("tamamlanan_seferler")
                        .select("id,updated_at,teslimattarihsaat")
                        .order("updated_at", { ascending: false })
                        .limit(2000),
                ]);

                if (plakalarRes.error) throw plakalarRes.error;
                if (atamalarRes.error) throw atamalarRes.error;
                if (tamamlananRes.error) throw tamamlananRes.error;

                if (!alive) return;
                setPlakalarRows(plakalarRes.data || []);
                setAtamalarRows(atamalarRes.data || []);
                setTamamlananRows(tamamlananRes.data || []);
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

        const isSameDay = (dateA, dateB) =>
            dateA.getFullYear() === dateB.getFullYear() &&
            dateA.getMonth() === dateB.getMonth() &&
            dateA.getDate() === dateB.getDate();

        const gunlukSefer = atamalarRows.length;

        const bekleyen = atamalarRows.filter(
            (r) => !normalize(r.cekici) && !normalize(r.dorse)
        ).length;

        const tamamlanan = tamamlananRows.filter((r) => {
            if (!r?.updated_at) return false;
            const dt = new Date(r.updated_at);
            if (Number.isNaN(dt.getTime())) return false;
            return isSameDay(dt, now);
        }).length;

        const uniqueCekici = new Set(
            atamalarRows.map((r) => normalize(r.cekici)).filter(Boolean)
        );
        let aktifFilo = uniqueCekici.size;

        if (aktifFilo === 0) {
            const activePlates = plakalarRows.filter((p) => {
                const st = normalize(p.statu).toLowerCase();
                return st === "aktif" || st === "active" || st === "on" || st === "1";
            });
            const setA = new Set(
                activePlates.map((p) => normalize(p.cekici)).filter(Boolean)
            );
            aktifFilo = setA.size;
        }

        const minutesAgoText = (d) => {
            if (!d) return "—";
            const diffMs = now.getTime() - d.getTime();
            const mins = Math.max(0, Math.round(diffMs / 60000));
            if (mins < 60) return `${mins} dk önce`;
            const hrs = Math.round(mins / 60);
            if (hrs < 24) return `${hrs} sa önce`;
            const days = Math.round(hrs / 24);
            return `${days} gün önce`;
        };

        const classifyRow = (r) => {
            const cekiciBos = !normalize(r.cekici);
            const dorseBos = !normalize(r.dorse);
            const surucuBos = !normalize(r.surucu);
            const telefonBos = !normalize(r.telefon);
            const teslimVar = !!normalize(r.teslimattarihsaat);

            const kritik = cekiciBos || dorseBos || surucuBos || telefonBos;

            let durum = "guncel";
            if (teslimVar) durum = "teslim";
            else if (cekiciBos && dorseBos) durum = "bekliyor";
            else if (kritik) durum = "kritik";
            else if (normalize(r.cekici) || normalize(r.dorse)) durum = "atandi";

            return {
                kritik,
                durum,
                teslimVar,
            };
        };

        const liveFeedRaw = atamalarRows.slice(0, 12).map((r) => {
            const state = classifyRow(r);
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
                ...state,
                title,
                sub,
                updatedAt: r.updated_at ? new Date(r.updated_at) : null,
            };
        });

        const recentActions = atamalarRows.slice(0, 10).map((r) => {
            const userName = normalize(aktifKullanici) || "Bilinmeyen kullanıcı";
            const sefer = normalize(r.seferno) || normalize(r.line_no) || normalize(r.id) || "—";
            const state = classifyRow(r);

            let actionType = "Kayıt güncellendi";
            if (state.teslimVar) actionType = "Teslim bilgisi işlendi";
            else if (normalize(r.cekici) || normalize(r.dorse)) actionType = "Araç ataması yapıldı";
            else if (state.kritik) actionType = "Eksik veri ile kayıt güncellendi";

            return {
                id: `action-${r.id}`,
                userName,
                actionType,
                sefer,
                route: `${normalize(r.kalkis) || "—"} → ${normalize(r.varis1) || "—"}`,
                updatedAt: r.updated_at ? new Date(r.updated_at) : null,
                durum: state.durum,
            };
        });

        const currentUserName = normalize(gorunenAd) || normalize(aktifKullanici) || "Bilinmeyen kullanıcı";

        const userMap = new Map();
        userMap.set(currentUserName, {
            key: currentUserName,
            name: currentUserName,
            total: atamalarRows.length,
            teslim: atamalarRows.filter((r) => classifyRow(r).teslimVar).length,
            atama: atamalarRows.filter((r) => normalize(r.cekici) || normalize(r.dorse)).length,
            kritik: atamalarRows.filter((r) => classifyRow(r).kritik).length,
        });

        const topUsers = Array.from(userMap.values()).slice(0, 6);

        const kritikKayitlar = atamalarRows.filter((r) => classifyRow(r).kritik).length;

        const tamDoluKayitlar = atamalarRows.filter((r) => {
            return (
                normalize(r.cekici) &&
                normalize(r.dorse) &&
                normalize(r.surucu) &&
                normalize(r.telefon)
            );
        }).length;

        const veriKaliteOrani = gunlukSefer
            ? Math.round((tamDoluKayitlar / gunlukSefer) * 100)
            : 0;

        const hedefGunluk = 30;
        const deliveryRate = gunlukSefer ? tamamlanan / gunlukSefer : 0;
        const assignmentHealth = gunlukSefer ? 1 - bekleyen / gunlukSefer : 0;
        const goalHealth = Math.min(1, gunlukSefer / hedefGunluk);
        const kaliteHealth = veriKaliteOrani / 100;

        const skor = Math.round(
            (deliveryRate * 0.35 +
                assignmentHealth * 0.3 +
                goalHealth * 0.15 +
                kaliteHealth * 0.2) *
            100
        );

        const pctAssignment = Math.max(0, Math.min(100, Math.round(assignmentHealth * 100)));
        const pctDelivery = Math.max(0, Math.min(100, Math.round(deliveryRate * 100)));

        const kritikBekleyenler = atamalarRows
            .filter((r) => classifyRow(r).kritik)
            .slice(0, 5)
            .map((r) => {
                const sefer = normalize(r.seferno) || normalize(r.line_no) || normalize(r.id) || "—";
                return {
                    id: `kritik-${r.id}`,
                    text: `Sefer #${sefer} • ${normalize(r.kalkis) || "—"} → ${normalize(r.varis1) || "—"} • Eksik veri mevcut`,
                };
            });

        return {
            gunlukSefer,
            bekleyen,
            tamamlanan,
            aktifFilo,
            liveFeedRaw,
            recentActions,
            topUsers,
            kritikKayitlar,
            veriKaliteOrani,
            kritikBekleyenler,
            minutesAgoText,
            skor,
            pctAssignment,
            pctDelivery,
        };
    }, [plakalarRows, atamalarRows, tamamlananRows, aktifKullanici, gorunenAd]);

    const liveFeed = useMemo(() => {
        if (akışFiltre === "tum") return hesap.liveFeedRaw;
        if (akışFiltre === "kritik") {
            return hesap.liveFeedRaw.filter((x) => x.durum === "kritik" || x.durum === "bekliyor");
        }
        if (akışFiltre === "teslim") {
            return hesap.liveFeedRaw.filter((x) => x.durum === "teslim");
        }
        if (akışFiltre === "bekleyen") {
            return hesap.liveFeedRaw.filter((x) => x.durum === "bekliyor");
        }
        return hesap.liveFeedRaw;
    }, [hesap.liveFeedRaw, akışFiltre]);

    return (
        <Box sx={stil.anaKonteyner}>
            <Box sx={stil.arkaPlanEfektleri}>
                <motion.div
                    animate={{ scale: [1, 1.25, 1], rotate: [0, 90, 0], opacity: [0.25, 0.45, 0.25] }}
                    transition={{ duration: 20, repeat: Infinity }}
                    style={stil.parlama1}
                />
                <motion.div
                    animate={{ scale: [1.15, 1, 1.15], rotate: [90, 0, 90], opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    style={stil.parlama2}
                />
            </Box>

            <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={stil.ustBar}>
                    <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
                        <Typography variant="h3" sx={stil.baslik}>
                            ODAK <span style={{ color: "#3b82f6" }}>LOJİSTİK</span>
                        </Typography>
                        <Typography sx={stil.altBaslik}>
                            Operasyonel Komuta Merkezi • <span style={{ color: "#fff" }}>{isim}</span>
                        </Typography>
                    </motion.div>

                    <Box sx={{ display: "flex", gap: 1.25 }}>
                        <Tooltip title="Bildirimler">
                            <IconButton sx={stil.ustButon}>
                                <NotificationsNone />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Bilgilendirme">
                            <IconButton sx={stil.ustButon}>
                                <InfoOutlined />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {hata ? (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                        {hata}
                    </Alert>
                ) : null}

                {loading ? (
                    <Box sx={stil.loadingWrap}>
                        <CircularProgress size={22} />
                        <Typography sx={{ color: "#94a3b8" }}>Veriler yükleniyor…</Typography>
                    </Box>
                ) : null}

                <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <ModernKart
                            ikon={<Timeline />}
                            baslik="GÜNLÜK SEFER"
                            deger={String(hesap.gunlukSefer).padStart(2, "0")}
                            alt="plaka_atamalar satır sayısı"
                            renk="#3b82f6"
                            delay={0.03}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <ModernKart
                            ikon={<AssignmentLate />}
                            baslik="BEKLEYEN"
                            deger={String(hesap.bekleyen).padStart(2, "0")}
                            alt="çekici + dorse boş"
                            renk="#f59e0b"
                            delay={0.06}
                            alert
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <ModernKart
                            ikon={<CheckCircleOutline />}
                            baslik="TAMAMLANAN"
                            deger={String(hesap.tamamlanan).padStart(2, "0")}
                            alt="bugün tamamlanan seferler"
                            renk="#10b981"
                            delay={0.09}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <ModernKart
                            ikon={<Speed />}
                            baslik="AKTİF FİLO"
                            deger={String(hesap.aktifFilo).padStart(2, "0")}
                            alt="benzersiz çekici"
                            renk="#8b5cf6"
                            delay={0.12}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <ModernKart
                            ikon={<WarningAmber />}
                            baslik="KRİTİK KAYIT"
                            deger={String(hesap.kritikKayitlar).padStart(2, "0")}
                            alt="eksik araç / sürücü / telefon"
                            renk="#ef4444"
                            delay={0.15}
                            alert
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <ModernKart
                            ikon={<FactCheck />}
                            baslik="VERİ KALİTESİ"
                            deger={`%${hesap.veriKaliteOrani}`}
                            alt="tam dolu kayıt oranı"
                            renk="#14b8a6"
                            delay={0.18}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={2.5} sx={{ mb: 2 }}>
                    <Grid item xs={12} xl={8}>
                        <PanelKarti
                            baslik="Canlı Operasyon Akışı"
                            alt="Son güncellenen atamalar"
                            minHeight={430}
                            sagAlan={
                                <Box sx={stil.filtreAlan}>
                                    <MiniFilter
                                        label="Tümü"
                                        aktif={akışFiltre === "tum"}
                                        onClick={() => setAkışFiltre("tum")}
                                    />
                                    <MiniFilter
                                        label="Kritik"
                                        aktif={akışFiltre === "kritik"}
                                        onClick={() => setAkışFiltre("kritik")}
                                    />
                                    <MiniFilter
                                        label="Teslim"
                                        aktif={akışFiltre === "teslim"}
                                        onClick={() => setAkışFiltre("teslim")}
                                    />
                                    <MiniFilter
                                        label="Bekleyen"
                                        aktif={akışFiltre === "bekleyen"}
                                        onClick={() => setAkışFiltre("bekleyen")}
                                    />
                                </Box>
                            }
                        >
                            <Box sx={stil.listeKonteyner}>
                                {liveFeed.length === 0 ? (
                                    <Typography sx={{ color: "#64748b" }}>Kayıt bulunamadı.</Typography>
                                ) : (
                                    liveFeed.map((row) => (
                                        <motion.div
                                            key={row.id}
                                            whileHover={{ x: 4 }}
                                            style={stil.listeElemanMotion}
                                        >
                                            <Box sx={stil.feedItem}>
                                                <Box
                                                    sx={{
                                                        ...stil.durumNokta,
                                                        ...(row.durum === "teslim" && { bgcolor: "#10b981" }),
                                                        ...(row.durum === "bekliyor" && { bgcolor: "#f59e0b" }),
                                                        ...(row.durum === "kritik" && { bgcolor: "#ef4444" }),
                                                        ...(row.durum === "atandi" && { bgcolor: "#3b82f6" }),
                                                        ...(row.durum === "guncel" && { bgcolor: "#64748b" }),
                                                    }}
                                                />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={stil.listeMetin}>{row.title}</Typography>
                                                    <Typography sx={stil.listeAltMetin}>{row.sub}</Typography>
                                                </Box>

                                                <Box sx={stil.sagBilgiAlani}>
                                                    <DurumChip durum={row.durum} />
                                                    <Typography sx={stil.zamanMetin}>
                                                        {hesap.minutesAgoText(row.updatedAt)}
                                                    </Typography>
                                                    <IconButton size="small" sx={{ color: "#3b82f6" }}>
                                                        <OpenInNew fontSize="inherit" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    ))
                                )}
                            </Box>
                        </PanelKarti>
                    </Grid>

                    <Grid item xs={12} xl={4}>
                        <PanelKarti baslik="Operasyon Skoru" alt="Günlük performans özeti" minHeight={430}>
                            <Box sx={stil.performansKonteyner}>
                                <Box sx={stil.skorDaire}>
                                    <Typography variant="h2" sx={{ fontWeight: 900, color: "#10b981" }}>
                                        {Number.isFinite(hesap.skor) ? hesap.skor : 0}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#94a3b8", letterSpacing: 1 }}>
                                        PUAN
                                    </Typography>
                                </Box>

                                <Box sx={{ width: "100%", mt: 4 }}>
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

                                    <Typography sx={{ ...stil.progressLabel, mt: 2.5 }}>
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

                                    <Typography sx={{ ...stil.progressLabel, mt: 2.5 }}>
                                        Veri Kalitesi <span>%{hesap.veriKaliteOrani}</span>
                                    </Typography>
                                    <Box sx={stil.progressLine}>
                                        <Box
                                            sx={{
                                                ...stil.progressFill,
                                                width: `${hesap.veriKaliteOrani}%`,
                                                bgcolor: "#14b8a6",
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </PanelKarti>
                    </Grid>
                </Grid>

                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={6} xl={4}>
                        <PanelKarti
                            baslik="İşlem Geçmişi"
                            alt={`Son kim hangi kayıt üzerinde işlem yaptı${aktifKullanici ? ` • Aktif kullanıcı: ${aktifKullanici}` : ""}`}
                            minHeight={340}
                        >
                            <Box sx={stil.listeKonteyner}>
                                {hesap.recentActions.length === 0 ? (
                                    <Typography sx={{ color: "#64748b" }}>İşlem geçmişi bulunamadı.</Typography>
                                ) : (
                                    hesap.recentActions.map((item) => (
                                        <motion.div key={item.id} whileHover={{ x: 4 }} style={stil.listeElemanMotion}>
                                            <Box sx={stil.historyItem}>
                                                <Box
                                                    sx={{
                                                        ...stil.ikonMini,
                                                        bgcolor: "rgba(59,130,246,0.12)",
                                                        color: "#3b82f6",
                                                    }}
                                                >
                                                    <Autorenew fontSize="inherit" />
                                                </Box>

                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={stil.listeMetin}>
                                                        {item.userName} • {item.actionType}
                                                    </Typography>
                                                    <Typography sx={stil.listeAltMetin}>
                                                        Sefer #{item.sefer} • {item.route}
                                                    </Typography>

                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.2 }}>
                                                        <DurumChip durum={item.durum} />
                                                        <Typography sx={stil.zamanMetin}>
                                                            {hesap.minutesAgoText(item.updatedAt)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    ))
                                )}
                            </Box>
                        </PanelKarti>
                    </Grid>

                    <Grid item xs={12} md={6} xl={4}>
                        <PanelKarti baslik="Kullanıcı Aktivitesi" alt="Aktif oturum kullanıcısı baz alınmıştır" minHeight={340}>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.4 }}>
                                {hesap.topUsers.length === 0 ? (
                                    <Typography sx={{ color: "#64748b" }}>
                                        Kullanıcı aktivitesi bulunamadı.
                                    </Typography>
                                ) : (
                                    hesap.topUsers.map((user, i) => (
                                        <Box key={user.key} sx={stil.userRow}>
                                            <Box sx={stil.userBadge}>{getInitials(user.name)}</Box>

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={stil.listeMetin}>{user.name}</Typography>
                                                <Typography sx={stil.listeAltMetin}>
                                                    Toplam: {user.total} • Teslim: {user.teslim} • Atama: {user.atama} • Kritik: {user.kritik}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ textAlign: "right" }}>
                                                <Typography sx={stil.userValue}>{user.total}</Typography>
                                                <Typography sx={stil.userRank}>#{i + 1}</Typography>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </PanelKarti>
                    </Grid>

                    <Grid item xs={12} xl={4}>
                        <PanelKarti baslik="Kritik Uyarılar" alt="Hızlı müdahale gerektiren kayıtlar" minHeight={340}>
                            <Box sx={stil.uyariWrap}>
                                {hesap.kritikBekleyenler.length === 0 ? (
                                    <Typography sx={{ color: "#64748b" }}>
                                        Kritik uyarı bulunmuyor.
                                    </Typography>
                                ) : (
                                    hesap.kritikBekleyenler.map((item) => (
                                        <Box key={item.id} sx={stil.uyariPill}>
                                            <WarningAmber sx={{ fontSize: 18, color: "#f59e0b" }} />
                                            <Typography sx={stil.uyariText}>{item.text}</Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </PanelKarti>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

const ModernKart = ({ ikon, baslik, deger, alt, renk, delay, alert }) => (
    <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 110 }}
        whileHover={{ scale: 1.015, y: -3 }}
        style={{ height: "100%" }}
    >
        <Paper sx={{ ...stil.modernKart, borderTop: `3px solid ${renk}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                <Box>
                    <Typography sx={stil.kartEtiket}>{baslik}</Typography>
                    <Typography sx={stil.kartDeger}>{deger}</Typography>
                </Box>
                <Box sx={{ ...stil.ikonDaire, bgcolor: `${renk}18`, color: renk }}>{ikon}</Box>
            </Box>

            <Box sx={{ mt: 2.2, display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp sx={{ fontSize: 15, color: alert ? "#ef4444" : "#10b981" }} />
                <Typography sx={{ fontSize: "0.76rem", color: "#94a3b8", fontWeight: 500 }}>
                    {alt}
                </Typography>
            </Box>
        </Paper>
    </motion.div>
);

const PanelKarti = ({ children, baslik, alt, sagAlan, minHeight = 320 }) => (
    <Paper sx={{ ...stil.anaPanel, minHeight }}>
        <Box
            sx={{
                mb: 2.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
                flexWrap: "wrap",
            }}
        >
            <Box>
                <Typography sx={stil.panelBaslik}>{baslik}</Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.82rem", mt: 0.6 }}>{alt}</Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                }}
            >
                {sagAlan}
                <IconButton size="small" sx={{ color: "#3b82f6" }}>
                    <ArrowForwardIos fontSize="inherit" />
                </IconButton>
            </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", mb: 2.5 }} />
        {children}
    </Paper>
);

const MiniFilter = ({ label, aktif, onClick }) => (
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
            "&:hover": {
                bgcolor: aktif ? "rgba(59,130,246,0.24)" : "rgba(255,255,255,0.06)",
            },
        }}
    />
);

const DurumChip = ({ durum }) => {
    const map = {
        teslim: { label: "Teslim", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
        bekliyor: { label: "Bekliyor", color: "#f59e0b", bg: "rgba(245,158,11,0.14)" },
        kritik: { label: "Kritik", color: "#ef4444", bg: "rgba(239,68,68,0.14)" },
        atandi: { label: "Atandı", color: "#3b82f6", bg: "rgba(59,130,246,0.14)" },
        guncel: { label: "Güncel", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
    };

    const cfg = map[durum] || map.guncel;

    return (
        <Box
            sx={{
                px: 1.15,
                py: 0.5,
                borderRadius: "999px",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: cfg.color,
                bgcolor: cfg.bg,
                border: `1px solid ${cfg.bg}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
            }}
        >
            {cfg.label}
        </Box>
    );
};

function getInitials(name) {
    const text = (name || "").trim();
    if (!text) return <PersonOutline fontSize="inherit" />;

    const parts = text.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

const stil = {
    anaKonteyner: {
        minHeight: "100vh",
        bgcolor: "#020617",
        pt: { xs: 3, md: 4 },
        pb: 8,
        position: "relative",
        overflow: "hidden",
    },
    arkaPlanEfektleri: {
        position: "absolute",
        inset: 0,
        zIndex: 0,
        filter: "blur(120px)",
        pointerEvents: "none",
    },
    parlama1: {
        position: "absolute",
        top: "-8%",
        right: "2%",
        width: "32vw",
        height: "32vw",
        borderRadius: "50%",
        background: "rgba(59, 130, 246, 0.12)",
    },
    parlama2: {
        position: "absolute",
        bottom: "0%",
        left: "0%",
        width: "24vw",
        height: "24vw",
        borderRadius: "50%",
        background: "rgba(139, 92, 246, 0.08)",
    },

    ustBar: {
        mb: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
    },
    baslik: {
        color: "#fff",
        fontWeight: 900,
        letterSpacing: "-1.8px",
        textShadow: "0 10px 35px rgba(59,130,246,0.16)",
        fontSize: { xs: "2.1rem", md: "2.7rem" },
    },
    altBaslik: {
        color: "#64748b",
        fontSize: "0.98rem",
        mt: 0.6,
    },
    ustButon: {
        width: 44,
        height: 44,
        bgcolor: "rgba(255,255,255,0.03)",
        color: "#94a3b8",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        "&:hover": {
            bgcolor: "rgba(59, 130, 246, 0.1)",
            color: "#3b82f6",
        },
    },

    loadingWrap: {
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 4,
        px: 2,
        py: 1.5,
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        width: "fit-content",
    },

    modernKart: {
        p: 2.6,
        borderRadius: "22px",
        bgcolor: "rgba(8, 15, 33, 0.86)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
        height: "100%",
        minHeight: 138,
        position: "relative",
        overflow: "hidden",
        "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.025), transparent 42%)",
            pointerEvents: "none",
        },
    },
    kartEtiket: {
        color: "#8da2c0",
        fontSize: "0.68rem",
        fontWeight: 800,
        letterSpacing: "1.2px",
    },
    kartDeger: {
        color: "#fff",
        fontSize: "2.15rem",
        fontWeight: 900,
        lineHeight: 1.15,
        mt: 0.6,
    },
    ikonDaire: {
        width: 46,
        height: 46,
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
    },

    anaPanel: {
        p: 3,
        borderRadius: "26px",
        bgcolor: "rgba(8, 15, 33, 0.82)",
        backdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
        height: "100%",
    },
    panelBaslik: {
        color: "#fff",
        fontWeight: 800,
        fontSize: "1.22rem",
    },

    filtreAlan: {
        display: "flex",
        gap: 0.8,
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },

    listeKonteyner: {
        display: "flex",
        flexDirection: "column",
        gap: 1.2,
    },
    listeElemanMotion: {
        width: "100%",
    },
    feedItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 1.4,
        borderRadius: "18px",
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "all .2s ease",
        "&:hover": {
            bgcolor: "rgba(255,255,255,0.03)",
            borderColor: "rgba(59,130,246,0.18)",
        },
        flexWrap: "wrap",
    },
    historyItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: 1.2,
        p: 1.4,
        borderRadius: "18px",
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "all .2s ease",
        "&:hover": {
            bgcolor: "rgba(255,255,255,0.03)",
            borderColor: "rgba(59,130,246,0.18)",
        },
    },
    sagBilgiAlani: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        ml: "auto",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },
    listeMetin: {
        color: "#e2e8f0",
        fontWeight: 700,
        fontSize: "0.95rem",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    listeAltMetin: {
        color: "#72839d",
        fontSize: "0.81rem",
        mt: 0.45,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    zamanMetin: {
        color: "#64748b",
        fontSize: "0.75rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
        flexShrink: 0,
    },

    durumNokta: {
        width: 10,
        height: 10,
        borderRadius: "50%",
        boxShadow: "0 0 14px currentColor",
        flexShrink: 0,
        mt: 0.7,
    },

    performansKonteyner: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 1.5,
        height: "100%",
        justifyContent: "center",
    },
    skorDaire: {
        width: 168,
        height: 168,
        borderRadius: "50%",
        border: "10px solid rgba(16, 185, 129, 0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
            "inset 0 0 30px rgba(16, 185, 129, 0.08), 0 0 34px rgba(16,185,129,0.06)",
    },

    progressLabel: {
        color: "#fff",
        fontSize: "0.9rem",
        mb: 0.8,
        display: "flex",
        justifyContent: "space-between",
        fontWeight: 600,
    },
    progressLine: {
        width: "100%",
        height: 8,
        bgcolor: "rgba(255,255,255,0.06)",
        borderRadius: 999,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 999,
        transition: "width .35s ease",
    },

    ikonMini: {
        width: 34,
        height: 34,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        border: "1px solid rgba(255,255,255,0.04)",
        flexShrink: 0,
    },

    userRow: {
        display: "flex",
        alignItems: "center",
        gap: 1.4,
        p: 1.4,
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        transition: "all .2s ease",
        "&:hover": {
            transform: "translateY(-1px)",
            bgcolor: "rgba(255,255,255,0.03)",
            borderColor: "rgba(139,92,246,0.18)",
        },
    },
    userBadge: {
        minWidth: 40,
        width: 40,
        height: 40,
        borderRadius: "13px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(139,92,246,0.18)",
        color: "#b197fc",
        fontWeight: 800,
        fontSize: "0.8rem",
        flexShrink: 0,
        border: "1px solid rgba(167,139,250,0.16)",
    },
    userValue: {
        color: "#fff",
        fontWeight: 900,
        fontSize: "1rem",
        lineHeight: 1.1,
    },
    userRank: {
        color: "#64748b",
        fontSize: "0.75rem",
        fontWeight: 700,
        mt: 0.25,
    },

    uyariWrap: {
        display: "flex",
        flexDirection: "column",
        gap: 1.2,
    },
    uyariPill: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.4,
        py: 1.15,
        borderRadius: "16px",
        bgcolor: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.16)",
        maxWidth: "100%",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    uyariText: {
        color: "#f8fafc",
        fontSize: "0.82rem",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
};