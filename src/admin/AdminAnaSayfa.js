import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { People, Security, ViewModule } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useAdminStore } from "./store/AdminStore";

export default function AdminAnaSayfa() {
    const { state } = useAdminStore();

    // ✅ state boş gelirse bile patlamasın
    const kullaniciSayisi = state?.kullanicilar?.length || 0;
    const rolSayisi = state?.roller?.length || 0;
    const ekranSayisi = state?.ekranlar?.length || 0;

    const stats = [
        { id: 1, title: "Toplam Kullanıcı", value: kullaniciSayisi, icon: <People />, color: "#3b82f6" },
        { id: 2, title: "Toplam Rol", value: rolSayisi, icon: <Security />, color: "#10b981" },
        { id: 3, title: "Toplam Ekran", value: ekranSayisi, icon: <ViewModule />, color: "#a855f7" },
    ];

    return (
        <Box sx={{ minHeight: "70vh" }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                Konsol
            </Typography>
            <Typography sx={{ color: "#94a3b8", mb: 3 }}>
                Genel sistem metrikleri ve hızlı özet.
            </Typography>

            <Grid container spacing={3}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={4} key={stat.id}>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                        >
                            <Paper sx={{ ...stil.kart, borderLeft: `4px solid ${stat.color}` }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography sx={stil.kucukBaslik}>{stat.title}</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: `${stat.color}15`, color: stat.color }}>
                                        {stat.icon}
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
    kart: {
        p: 3,
        borderRadius: "20px",
        bgcolor: "rgba(30, 41, 59, 0.35)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.14)",
        color: "#fff",
    },
    kucukBaslik: {
        color: "#94a3b8",
        fontSize: "0.75rem",
        fontWeight: 800,
        textTransform: "uppercase",
    },
};