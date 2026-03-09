import React, { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, useTheme } from "@mui/material";
import { People, Security, ViewModule, TrendingUp } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminStore } from "./store/AdminStore";

// Sayıların akarak artması için küçük bir alt bileşen
const CountUp = ({ value }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseInt(value);
        if (start === end) return;
        let totalMilisekonds = 1000;
        let incrementTime = (totalMilisekonds / end);
        let timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === end) clearInterval(timer);
        }, incrementTime);
        return () => clearInterval(timer);
    }, [value]);
    return <>{count}</>;
};

export default function AdminAnaSayfa() {
    const { state } = useAdminStore();

    const kullaniciSayisi = state?.kullanicilar?.length || 0;
    const rolSayisi = state?.roller?.length || 0;
    const ekranSayisi = state?.ekranlar?.length || 0;

    const stats = [
        { id: 1, title: "Kullanıcı Kitlesi", value: kullaniciSayisi, icon: <People fontSize="large" />, color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
        { id: 2, title: "Yetki Yapılandırması", value: rolSayisi, icon: <Security fontSize="large" />, color: "#10b981", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
        { id: 3, title: "Aktif Modüller", value: ekranSayisi, icon: <ViewModule fontSize="large" />, color: "#a855f7", gradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" },
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* Üst Başlık Alanı */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Typography variant="h3" sx={stil.anaBaslik}>
                    Sistem <span style={{ color: "#3b82f6" }}>Özeti</span>
                </Typography>
                <Typography sx={stil.altBaslik}>
                    Platformun anlık verileri ve operasyonel durumu aşağıda listelenmiştir.
                </Typography>
            </motion.div>

            <Grid container spacing={4} sx={{ mt: 2 }}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={4} key={stat.id}>
                        <motion.div
                            whileHover={{ y: -10, transition: { duration: 0.2 } }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                        >
                            <Paper sx={stil.modernKart}>
                                {/* Arka plan parlaması (Glow effect) */}
                                <Box sx={{ ...stil.glow, background: stat.color }} />

                                <Box sx={{ position: "relative", zIndex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                                        <Box sx={{ ...stil.ikonBox, background: stat.gradient }}>
                                            {stat.icon}
                                        </Box>
                                        <Box sx={stil.trendBadge}>
                                            <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                                            %12
                                        </Box>
                                    </Box>

                                    <Typography sx={stil.kartBaslik}>{stat.title}</Typography>

                                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                        <Typography sx={stil.kartDeger}>
                                            <CountUp value={stat.value} />
                                        </Typography>
                                        <Typography sx={{ color: "#64748b", fontWeight: 600 }}>Birim</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

const stil = {
    anaBaslik: {
        fontWeight: 900,
        letterSpacing: "-0.05em",
        fontSize: { xs: "2rem", md: "3.5rem" },
        color: "#f8fafc",
        mb: 1
    },
    altBaslik: {
        color: "#94a3b8",
        fontSize: "1.1rem",
        maxWidth: "600px",
        mb: 4
    },
    modernKart: {
        position: "relative",
        overflow: "hidden",
        p: 4,
        borderRadius: "32px",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        transition: "border-color 0.3s ease",
        "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.2)",
        }
    },
    glow: {
        position: "absolute",
        top: "-20%",
        right: "-20%",
        width: "120px",
        height: "120px",
        filter: "blur(60px)",
        opacity: 0.15,
        borderRadius: "50%",
    },
    ikonBox: {
        p: 2,
        borderRadius: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        boxShadow: "0 10px 20px -5px rgba(0,0,0,0.3)"
    },
    trendBadge: {
        display: "flex",
        alignItems: "center",
        px: 1.5,
        py: 0.5,
        borderRadius: "100px",
        bgcolor: "rgba(16, 185, 129, 0.1)",
        color: "#10b981",
        fontSize: "0.75rem",
        fontWeight: 700,
        border: "1px solid rgba(16, 185, 129, 0.2)"
    },
    kartBaslik: {
        color: "#94a3b8",
        fontSize: "0.875rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        mb: 1
    },
    kartDeger: {
        fontSize: "3rem",
        fontWeight: 800,
        color: "#fff",
        lineHeight: 1
    }
};