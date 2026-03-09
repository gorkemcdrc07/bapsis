import React from "react";
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    IconButton,
    Badge,
    Avatar,
    Button,
    Chip,
    Tooltip,
    Stack,
} from "@mui/material";
import {
    NotificationsNone,
    Search,
    Logout,
    AdminPanelSettings,
    AutoAwesome,
    Bolt,
    KeyboardArrowRight,
    Circle,
} from "@mui/icons-material";

export default function Navbar({ kullanici, onCikis, onSelect }) {
    const isAdmin = kullanici?.rol === "ADMİN" || kullanici?.rol === "ADMIN";
    const userName = kullanici?.mail?.split("@")[0] || "Kullanıcı";
    const initials = kullanici?.mail?.[0]?.toUpperCase() || "U";

    return (
        <AppBar position="sticky" elevation={0} sx={stil.appBar}>
            <Toolbar sx={stil.toolbar}>
                <Box sx={stil.leftWrap}>
                    <Box sx={stil.titleIconWrap}>
                        <AutoAwesome sx={{ fontSize: 18, color: "#fff" }} />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.6} useFlexGap flexWrap="wrap">
                            <Typography sx={stil.kicker}>BAPSİS CONTROL</Typography>
                            <Chip icon={<Bolt sx={{ fontSize: 14 }} />} label="Premium UI" size="small" sx={stil.topChip} />
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.45, flexWrap: "wrap" }}>
                            <Typography sx={stil.crumb}>Sistem Paneli</Typography>
                            <KeyboardArrowRight sx={{ fontSize: 16, color: "rgba(255,255,255,0.22)" }} />
                            <Typography sx={stil.activeCrumb}>{isAdmin ? "Yönetim" : "Anasayfa"}</Typography>
                            <Chip
                                icon={<Circle sx={{ fontSize: 10 }} />}
                                label="Online"
                                size="small"
                                sx={stil.statusChip}
                            />
                        </Stack>
                    </Box>
                </Box>

                <Box sx={stil.rightWrap}>
                    {isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<AdminPanelSettings />}
                            sx={stil.adminBtn}
                            onClick={() => onSelect("admin")}
                        >
                            Yönetim Paneli
                        </Button>
                    )}

                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Tooltip title="Arama" arrow>
                            <IconButton sx={stil.iconBtn}>
                                <Search fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Bildirimler" arrow>
                            <IconButton sx={stil.iconBtn}>
                                <Badge variant="dot" color="error" overlap="circular">
                                    <NotificationsNone fontSize="small" />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Box sx={stil.profileCard}>
                        <Box sx={{ textAlign: "right", mr: 1.5, display: { xs: "none", sm: "block" }, minWidth: 0 }}>
                            <Typography sx={stil.userName}>{userName}</Typography>
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center">
                                <Typography sx={stil.userRole}>{kullanici?.rol || "Kullanıcı"}</Typography>
                                <Box sx={stil.roleDot} />
                            </Stack>
                        </Box>

                        <Avatar sx={stil.avatar}>{initials}</Avatar>

                        <Tooltip title="Çıkış Yap" arrow>
                            <IconButton onClick={onCikis} sx={stil.logoutBtn}>
                                <Logout fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

const stil = {
    appBar: {
        background:
            "linear-gradient(180deg, rgba(9,14,25,0.88) 0%, rgba(8,13,24,0.82) 100%)",
        backdropFilter: "blur(22px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
        position: "sticky",
        overflow: "hidden",
        "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
                "radial-gradient(420px 120px at 8% 0%, rgba(59,130,246,0.15), transparent 60%), radial-gradient(360px 120px at 92% 0%, rgba(168,85,247,0.10), transparent 60%)",
        },
    },
    toolbar: {
        minHeight: { xs: 74, md: 80 },
        justifyContent: "space-between",
        gap: 2,
        px: { xs: 1.5, md: 2.5 },
        position: "relative",
        zIndex: 1,
    },
    leftWrap: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minWidth: 0,
    },
    titleIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 3,
        background: "linear-gradient(135deg, #3b82f6, #2563eb 55%, #8b5cf6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 18px 30px rgba(37,99,235,0.28)",
        border: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
    },
    kicker: {
        color: "rgba(255,255,255,0.52)",
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: 1.8,
        lineHeight: 1,
    },
    topChip: {
        height: 22,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 800,
        fontSize: 11,
        "& .MuiChip-icon": { color: "#93c5fd" },
    },
    crumb: {
        color: "#64748b",
        fontSize: "0.86rem",
        fontWeight: 600,
    },
    activeCrumb: {
        color: "#fff",
        fontSize: "0.92rem",
        fontWeight: 800,
        letterSpacing: 0.2,
    },
    statusChip: {
        ml: { xs: 0, sm: 0.5 },
        height: 22,
        borderRadius: 999,
        bgcolor: "rgba(16,185,129,0.10)",
        border: "1px solid rgba(16,185,129,0.22)",
        color: "#86efac",
        fontWeight: 800,
        fontSize: 11,
        "& .MuiChip-icon": { color: "#34d399" },
    },
    rightWrap: {
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, md: 1.4 },
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },
    adminBtn: {
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        color: "#fff",
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 900,
        px: 2.2,
        py: 1,
        minHeight: 42,
        boxShadow: "0 18px 34px rgba(124,58,237,0.28)",
        border: "1px solid rgba(255,255,255,0.12)",
        "&:hover": {
            background: "linear-gradient(135deg, #7376ff 0%, #9466ff 50%, #b866ff 100%)",
            boxShadow: "0 22px 36px rgba(124,58,237,0.34)",
        },
    },
    iconBtn: {
        color: "#a7b4c7",
        width: 42,
        height: 42,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "all .18s ease",
        "&:hover": {
            color: "#fff",
            transform: "translateY(-1px)",
            background: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.12)",
        },
    },
    profileCard: {
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))",
        p: "5px 6px 5px 14px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 16px 34px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(14px)",
        maxWidth: "100%",
    },
    userName: {
        color: "#fff",
        fontSize: "0.88rem",
        fontWeight: 800,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 140,
    },
    userRole: {
        color: "#8ab4ff",
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: 0.35,
        textTransform: "uppercase",
    },
    roleDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: "#34d399",
        boxShadow: "0 0 10px rgba(52,211,153,0.8)",
    },
    avatar: {
        width: 38,
        height: 38,
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        borderRadius: "14px",
        fontWeight: 900,
        fontSize: 15,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 14px 24px rgba(37,99,235,0.24)",
    },
    logoutBtn: {
        ml: 1,
        width: 38,
        height: 38,
        color: "#fca5a5",
        borderRadius: 3,
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.12)",
        transition: "all .18s ease",
        "&:hover": {
            color: "#fff",
            background: "rgba(248,113,113,0.18)",
            transform: "translateY(-1px)",
        },
    },
};
