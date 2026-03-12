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
    useMediaQuery,
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
    Menu,
    MenuOpen,
} from "@mui/icons-material";

export default function Navbar({
    kullanici,
    onCikis,
    onSelect,
    sidebarOpen,
    onToggleSidebar,
}) {
    const isAdmin = kullanici?.rol === "ADMİN" || kullanici?.rol === "ADMIN";
    const userName = kullanici?.mail?.split("@")[0] || "Kullanıcı";
    const initials = kullanici?.mail?.[0]?.toUpperCase() || "U";

    const isMobile = useMediaQuery("(max-width:900px)");
    const isTablet = useMediaQuery("(max-width:1200px)");

    return (
        <AppBar position="sticky" elevation={0} sx={stil.appBar}>
            <Toolbar sx={stil.toolbar}>
                <Box sx={stil.leftWrap}>
                    <Tooltip title={sidebarOpen ? "Menüyü daralt" : "Menüyü aç"} arrow>
                        <IconButton onClick={onToggleSidebar} sx={stil.menuBtn}>
                            {sidebarOpen ? <MenuOpen fontSize="small" /> : <Menu fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    <Box sx={stil.titleIconWrap}>
                        <AutoAwesome sx={{ fontSize: 18, color: "#fff" }} />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.6}
                            useFlexGap
                            flexWrap="wrap"
                        >
                            <Typography sx={stil.kicker}>BAPSİS CONTROL</Typography>

                            {!isMobile && (
                                <Chip
                                    icon={<Bolt sx={{ fontSize: 14 }} />}
                                    label="Premium UI"
                                    size="small"
                                    sx={stil.topChip}
                                />
                            )}
                        </Stack>

                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.8}
                            useFlexGap
                            flexWrap="wrap"
                            sx={{ mt: 0.45 }}
                        >
                            {!isMobile && (
                                <>
                                    <Typography sx={stil.crumb}>Sistem Paneli</Typography>
                                    <KeyboardArrowRight
                                        sx={{ fontSize: 16, color: "rgba(255,255,255,0.22)" }}
                                    />
                                </>
                            )}

                            <Typography sx={stil.activeCrumb}>
                                {isAdmin ? "Yönetim" : "Anasayfa"}
                            </Typography>

                            {!isMobile && (
                                <Chip
                                    icon={<Circle sx={{ fontSize: 10 }} />}
                                    label="Online"
                                    size="small"
                                    sx={stil.statusChip}
                                />
                            )}
                        </Stack>
                    </Box>
                </Box>

                <Box sx={stil.rightWrap}>
                    {isAdmin && !isMobile && (
                        <Button
                            variant="contained"
                            startIcon={<AdminPanelSettings />}
                            sx={stil.adminBtn}
                            onClick={() => onSelect("admin")}
                        >
                            {isTablet ? "Yönetim" : "Yönetim Paneli"}
                        </Button>
                    )}

                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                        {!isMobile && (
                            <Tooltip title="Arama" arrow>
                                <IconButton sx={stil.iconBtn}>
                                    <Search fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Bildirimler" arrow>
                            <IconButton sx={stil.iconBtn}>
                                <Badge variant="dot" color="error" overlap="circular">
                                    <NotificationsNone fontSize="small" />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Box sx={stil.profileCard}>
                        <Box
                            sx={{
                                textAlign: "right",
                                mr: 1.5,
                                display: { xs: "none", sm: "block" },
                                minWidth: 0,
                                maxWidth: isTablet ? 110 : 150,
                            }}
                        >
                            <Typography sx={stil.userName}>{userName}</Typography>

                            <Stack
                                direction="row"
                                spacing={0.8}
                                justifyContent="flex-end"
                                alignItems="center"
                            >
                                <Typography sx={stil.userRole}>
                                    {kullanici?.rol || "Kullanıcı"}
                                </Typography>
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

                    {isAdmin && isMobile && (
                        <Tooltip title="Yönetim Paneli" arrow>
                            <IconButton
                                onClick={() => onSelect("admin")}
                                sx={stil.mobileAdminBtn}
                            >
                                <AdminPanelSettings fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
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
        minHeight: { xs: 68, sm: 74, md: 80 },
        justifyContent: "space-between",
        gap: { xs: 1, md: 2 },
        px: { xs: 1.2, sm: 1.5, md: 2.5 },
        py: { xs: 0.7, md: 0.9 },
        position: "relative",
        zIndex: 1,
        flexWrap: "nowrap",
    },

    leftWrap: {
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, md: 1.5 },
        minWidth: 0,
        flex: 1,
        overflow: "hidden",
    },

    menuBtn: {
        color: "#dbeafe",
        width: { xs: 38, md: 42 },
        height: { xs: 38, md: 42 },
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        flexShrink: 0,
        "&:hover": {
            background: "rgba(255,255,255,0.09)",
            color: "#fff",
        },
    },

    titleIconWrap: {
        width: { xs: 40, md: 44 },
        height: { xs: 40, md: 44 },
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
        fontSize: { xs: 10, md: 11 },
        fontWeight: 900,
        letterSpacing: { xs: 1.2, md: 1.8 },
        lineHeight: 1,
        whiteSpace: "nowrap",
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
        fontSize: { xs: "0.78rem", md: "0.86rem" },
        fontWeight: 600,
        whiteSpace: "nowrap",
    },

    activeCrumb: {
        color: "#fff",
        fontSize: { xs: "0.82rem", md: "0.92rem" },
        fontWeight: 800,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
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
        gap: { xs: 0.7, sm: 1, md: 1.4 },
        flexWrap: "nowrap",
        justifyContent: "flex-end",
        flexShrink: 0,
        minWidth: "fit-content",
    },

    adminBtn: {
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        color: "#fff",
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 900,
        px: { sm: 1.6, md: 2.2 },
        py: 1,
        minHeight: 42,
        boxShadow: "0 18px 34px rgba(124,58,237,0.28)",
        border: "1px solid rgba(255,255,255,0.12)",
        whiteSpace: "nowrap",
        "&:hover": {
            background: "linear-gradient(135deg, #7376ff 0%, #9466ff 50%, #b866ff 100%)",
            boxShadow: "0 22px 36px rgba(124,58,237,0.34)",
        },
    },

    mobileAdminBtn: {
        width: 38,
        height: 38,
        color: "#c4b5fd",
        borderRadius: 3,
        background: "rgba(139,92,246,0.10)",
        border: "1px solid rgba(139,92,246,0.18)",
        "&:hover": {
            color: "#fff",
            background: "rgba(139,92,246,0.18)",
        },
    },

    iconBtn: {
        color: "#a7b4c7",
        width: { xs: 38, md: 42 },
        height: { xs: 38, md: 42 },
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
        p: { xs: "4px 4px 4px 8px", sm: "5px 6px 5px 12px", md: "5px 6px 5px 14px" },
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 16px 34px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(14px)",
        maxWidth: "100%",
        minWidth: 0,
    },

    userName: {
        color: "#fff",
        fontSize: "0.88rem",
        fontWeight: 800,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
    },

    userRole: {
        color: "#8ab4ff",
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: 0.35,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    },

    roleDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: "#34d399",
        boxShadow: "0 0 10px rgba(52,211,153,0.8)",
        flexShrink: 0,
    },

    avatar: {
        width: { xs: 34, sm: 36, md: 38 },
        height: { xs: 34, sm: 36, md: 38 },
        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
        borderRadius: "14px",
        fontWeight: 900,
        fontSize: 15,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 14px 24px rgba(37,99,235,0.24)",
        flexShrink: 0,
    },

    logoutBtn: {
        ml: { xs: 0.5, md: 1 },
        width: { xs: 34, sm: 36, md: 38 },
        height: { xs: 34, sm: 36, md: 38 },
        color: "#fca5a5",
        borderRadius: 3,
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.12)",
        transition: "all .18s ease",
        flexShrink: 0,
        "&:hover": {
            color: "#fff",
            background: "rgba(248,113,113,0.18)",
            transform: "translateY(-1px)",
        },
    },
};