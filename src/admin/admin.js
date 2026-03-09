import React, { useState, useEffect } from "react";
import {
    Box, Grid, Paper, Typography, Avatar, IconButton,
    Button, Divider, Switch, Tooltip, Badge
} from "@mui/material";
import {
    People, LocalShipping, Assessment, Settings,
    History, AdminPanelSettings, Visibility, VisibilityOff,
    LockOpen, Lock, DeleteForever, Refresh
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSayfasi() {
    // 1. Veritabanı Değerlerini Simüle Eden State'ler
    const [stats, setStats] = useState([
        { id: 1, title: "Toplam Kullanıcı", value: 142, icon: <People />, color: "#3b82f6" },
        { id: 2, title: "Aktif Siparişler", value: 85, icon: <LocalShipping />, color: "#10b981" },
        { id: 3, title: "Aylık Verimlilik", value: "%94", icon: <Assessment />, color: "#a855f7" },
    ]);

    // 2. Ekran ve Buton Yetki Yönetimi Datası
    const [moduller, setModuller] = useState([
        { id: 1, ad: "Müşteri Paneli", gorunur: true, yazmaYetkisi: true, sonGuncelleme: "10 dk önce" },
        { id: 2, ad: "Finansal Raporlar", gorunur: true, yazmaYetkisi: false, sonGuncelleme: "1 saat önce" },
        { id: 3, ad: "Stok Düzenleme", gorunur: false, yazmaYetkisi: false, sonGuncelleme: "Dün" },
    ]);

    // Yetki Değiştirme Fonksiyonları
    const toggleGorunurluk = (id) => {
        setModuller(prev => prev.map(m => m.id === id ? { ...m, gorunur: !m.gorunur } : m));
    };

    const toggleYazma = (id) => {
        setModuller(prev => prev.map(m => m.id === id ? { ...m, yazmaYetkisi: !m.yazmaYetkisi } : m));
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#0f172a", color: "#fff" }}>
            {/* ÜST BAŞLIK */}
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, background: "linear-gradient(90deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Yönetim Merkezi
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b" }}>Sistem yetkilerini ve modülleri buradan kontrol edin.</Typography>
                </Box>
                <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success">
                    <Avatar sx={{ bgcolor: "#3b82f6", width: 52, height: 52, boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)" }}>
                        <AdminPanelSettings />
                    </Avatar>
                </Badge>
            </Box>

            {/* İSTATİSTİK KARTLARI */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={4} key={stat.id}>
                        <motion.div whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Paper sx={{ ...stil.kart, borderLeft: `4px solid ${stat.color}` }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography sx={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>{stat.title}</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>{stat.value}</Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: `${stat.color}15`, color: stat.color }}>{stat.icon}</Box>
                                </Box>
                            </Paper>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* SOL: EKRAN VE BUTON YETKİLERİ */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={stil.buyukKart}>
                        <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Modül ve Erişim Yönetimi</Typography>
                            <Tooltip title="Listeyi Yenile">
                                <IconButton sx={{ color: "#64748b" }}><Refresh /></IconButton>
                            </Tooltip>
                        </Box>
                        <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
                        <Box sx={{ p: 1 }}>
                            <AnimatePresence>
                                {moduller.map((modul) => (
                                    <Box key={modul.id} sx={stil.listeSatir}>
                                        <Grid container alignItems="center" spacing={2}>
                                            <Grid item xs={4}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{modul.ad}</Typography>
                                                <Typography variant="caption" sx={{ color: "#64748b" }}>Sinc: {modul.sonGuncelleme}</Typography>
                                            </Grid>
                                            <Grid item xs={4} sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                                {/* GÖRÜNÜRLÜK ANAHTARI */}
                                                <Tooltip title={modul.gorunur ? "Ekran Aktif" : "Ekran Gizli"}>
                                                    <IconButton onClick={() => toggleGorunurluk(modul.id)} sx={{ color: modul.gorunur ? "#3b82f6" : "#475569" }}>
                                                        {modul.gorunur ? <Visibility /> : <VisibilityOff />}
                                                    </IconButton>
                                                </Tooltip>
                                                {/* YAZMA/DÜZENLEME YETKİSİ */}
                                                <Tooltip title={modul.yazmaYetkisi ? "Düzenleme Açık" : "Sadece Okunur"}>
                                                    <IconButton onClick={() => toggleYazma(modul.id)} sx={{ color: modul.yazmaYetkisi ? "#10b981" : "#ef4444" }}>
                                                        {modul.yazmaYetkisi ? <LockOpen /> : <Lock />}
                                                    </IconButton>
                                                </Tooltip>
                                            </Grid>
                                            <Grid item xs={4} sx={{ textAlign: "right" }}>
                                                <Box sx={stil.durumBadge(modul.gorunur)}>
                                                    {modul.gorunur ? "YAYINDA" : "PASİF"}
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                ))}
                            </AnimatePresence>
                        </Box>
                    </Paper>
                </Grid>

                {/* SAĞ: KRİTİK AYARLAR */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={stil.buyukKart}>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Hızlı Aksiyonlar</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Button fullWidth startIcon={<People />} sx={stil.aksiyonButon("#3b82f6")}>
                                    Yeni Admin Ekle
                                </Button>
                                <Button fullWidth startIcon={<History />} sx={stil.aksiyonButon("#94a3b8")}>
                                    Log Kayıtlarını İndir
                                </Button>
                                <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", my: 1 }} />
                                <Button fullWidth startIcon={<DeleteForever />} sx={stil.aksiyonButon("#ef4444")}>
                                    Sistemi Bakıma Al
                                </Button>
                                <Typography variant="caption" sx={{ color: "#64748b", textAlign: "center", mt: 1 }}>
                                    Dikkat: Bakım modu tüm kullanıcı erişimini keser.
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

// STİL TANIMLAMALARI
const stil = {
    kart: {
        p: 3,
        borderRadius: "20px",
        bgcolor: "rgba(30, 41, 59, 0.5)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
    },
    buyukKart: {
        borderRadius: "24px",
        bgcolor: "rgba(30, 41, 59, 0.3)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        height: "100%",
        overflow: "hidden"
    },
    listeSatir: {
        p: 2,
        m: 1,
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.02)",
        transition: "0.3s",
        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" }
    },
    durumBadge: (aktif) => ({
        display: "inline-block",
        px: 1.5, py: 0.5,
        borderRadius: "8px",
        fontSize: "0.65rem",
        fontWeight: 800,
        bgcolor: aktif ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
        color: aktif ? "#10b981" : "#ef4444",
        border: `1px solid ${aktif ? "#10b98140" : "#ef444440"}`
    }),
    aksiyonButon: (renk) => ({
        justifyContent: "flex-start",
        borderRadius: "14px",
        color: "#fff",
        bgcolor: `${renk}15`,
        border: `1px solid ${renk}30`,
        py: 1.5,
        px: 2,
        textTransform: "none",
        fontSize: "0.9rem",
        "&:hover": { bgcolor: renk, boxShadow: `0 0 15px ${renk}50` }
    })
};