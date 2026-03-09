import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Box,
    Paper,
    Typography,
    Avatar,
    Chip,
    Stack,
    Tooltip,
    IconButton,
    Container,
    Fade,
} from "@mui/material";
import {
    QueryStatsRounded,
    GroupRounded,
    VpnKeyRounded,
    GppGoodRounded,
    RadioButtonCheckedRounded,
    AutorenewRounded,
} from "@mui/icons-material";
import { useAdminStore } from "../store/AdminStore";

function normalizePath(p) {
    if (!p) return "/";
    return p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;
}

export default function AdminUstMenu() {
    const { sifirla } = useAdminStore();
    const location = useLocation();
    const aktifPath = normalizePath(location.pathname);

    // ✅ /admin prefix YOK! (MemoryRouter içinde admin root = "/")
    const menu = useMemo(
        () => [
            { to: "/", label: "Konsol", icon: <QueryStatsRounded /> },
            { to: "/kullanicilar", label: "Üyeler", icon: <GroupRounded /> },
            { to: "/roller", label: "Erişim", icon: <VpnKeyRounded /> },
            // ❌ Modüller kaldırıldı: { to: "/ekranlar", ... }
            { to: "/ekran-yetkileri", label: "Ekran Yetki", icon: <GppGoodRounded /> },
            { to: "/buton-yetkileri", label: "Buton Yetki", icon: <RadioButtonCheckedRounded /> },
        ],
        []
    );

    const isActive = (to) => {
        const a = normalizePath(to);
        return a === "/" ? aktifPath === "/" : aktifPath.startsWith(a);
    };

    return (
        <Fade in timeout={800}>
            <Paper sx={stil.kapsayici} elevation={0}>
                <Container maxWidth="lg">
                    <Box sx={stil.icKapsayici}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                            <Box sx={stil.logoGlow}>
                                <Avatar sx={stil.avatar}>
                                    <QueryStatsRounded sx={{ fontSize: 26 }} />
                                </Avatar>
                            </Box>

                            <Box>
                                <Typography component="h1" sx={stil.baslik}>
                                    Core
                                    <Typography component="span" sx={stil.baslikVurgu}>
                                        HQ
                                    </Typography>
                                </Typography>
                                <Typography sx={stil.altBaslik}>
                                    Sistem Mimari ve Yetki Yönetimi
                                </Typography>
                            </Box>
                        </Box>

                        <Tooltip title="Sistemi Yenile (Seed)" arrow>
                            <IconButton onClick={sifirla} sx={stil.refreshButton}>
                                <AutorenewRounded />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box sx={stil.menuAlan}>
                        <Stack direction="row" spacing={1.5} sx={stil.stack}>
                            {menu.map((m) => {
                                const active = isActive(m.to);
                                return (
                                    <Chip
                                        key={m.to}
                                        component={NavLink}
                                        to={m.to}
                                        clickable
                                        icon={m.icon}
                                        label={m.label}
                                        sx={{
                                            ...stil.chip,
                                            ...(active ? stil.chipAktif : stil.chipPasif),
                                        }}
                                    />
                                );
                            })}
                        </Stack>
                    </Box>
                </Container>
            </Paper>
        </Fade>
    );
}

const stil = {
    kapsayici: {
        position: "sticky",
        top: 0,
        zIndex: 1100,
        borderRadius: 0,
        backgroundColor: "rgba(10, 15, 25, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    },
    icKapsayici: {
        py: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    logoGlow: {
        position: "relative",
        "&::before": {
            content: '""',
            position: "absolute",
            inset: -4,
            borderRadius: "16px",
            background: "linear-gradient(45deg, #fbbf24, #f59e0b)",
            opacity: 0.15,
            filter: "blur(8px)",
        },
    },
    avatar: {
        bgcolor: "#1e293b",
        color: "#fbbf24",
        border: "1px solid rgba(251, 191, 36, 0.2)",
        width: 48,
        height: 48,
        borderRadius: "14px",
    },
    baslik: {
        fontWeight: 900,
        fontSize: "1.5rem",
        color: "#f8fafc",
        letterSpacing: "-0.05em",
        lineHeight: 1,
    },
    baslikVurgu: {
        color: "#fbbf24",
        fontSize: "inherit",
        fontWeight: "inherit",
        ml: 0.5,
    },
    altBaslik: {
        color: "#64748b",
        fontSize: "0.8rem",
        fontWeight: 500,
        mt: 0.5,
    },
    refreshButton: {
        bgcolor: "rgba(255,255,255,0.03)",
        color: "#94a3b8",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        transition: "all 0.4s ease",
        "&:hover": {
            color: "#fbbf24",
            bgcolor: "rgba(251, 191, 36, 0.1)",
            borderColor: "rgba(251, 191, 36, 0.4)",
            transform: "rotate(180deg)",
        },
    },
    menuAlan: {
        pb: 2,
        display: "flex",
        justifyContent: "center",
    },
    stack: {
        overflowX: "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
    },
    chip: {
        height: 40,
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "0.85rem",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        border: "1px solid transparent",
        "& .MuiChip-icon": {
            fontSize: 18,
            transition: "all 0.3s ease",
        },
    },
    chipAktif: {
        color: "#fbbf24",
        bgcolor: "rgba(251, 191, 36, 0.08)",
        borderColor: "rgba(251, 191, 36, 0.3)",
        boxShadow: "0 4px 15px rgba(251, 191, 36, 0.15)",
        "& .MuiChip-icon": { color: "#fbbf24" },
    },
    chipPasif: {
        color: "#94a3b8",
        bgcolor: "transparent",
        "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.05)",
            color: "#f1f5f9",
            transform: "translateY(-2px)",
        },
    },
};