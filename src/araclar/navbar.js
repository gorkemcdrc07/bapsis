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
    Tooltip,
    useMediaQuery,
} from "@mui/material";
import {
    NotificationsNone,
    Search,
    Logout,
    AdminPanelSettings,
    AutoAwesome,
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
    const userName = kullanici?.kullanici || "Kullanıcı";
    const initials = userName?.charAt(0)?.toUpperCase() || "K";

    const isMobile = useMediaQuery("(max-width:900px)");
    const isTablet = useMediaQuery("(max-width:1200px)");

    return (
        <AppBar position="sticky" elevation={0} sx={styles.appBar}>
            <Toolbar sx={styles.toolbar}>
                <Box sx={styles.leftSection}>
                    <Tooltip title={sidebarOpen ? "Menüyü daralt" : "Menüyü aç"} arrow>
                        <IconButton onClick={onToggleSidebar} sx={styles.iconButton}>
                            {sidebarOpen ? <MenuOpen fontSize="small" /> : <Menu fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    <Box sx={styles.logoBox}>
                        <AutoAwesome sx={{ fontSize: 18, color: "#fff" }} />
                    </Box>
                </Box>

                <Box sx={styles.rightSection}>
                    {!isMobile && (
                        <Tooltip title="Arama" arrow>
                            <IconButton sx={styles.iconButton}>
                                <Search fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="Bildirimler" arrow>
                        <IconButton sx={styles.iconButton}>
                            <Badge variant="dot" color="error" overlap="circular">
                                <NotificationsNone fontSize="small" />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {isAdmin && !isMobile && (
                        <Button
                            variant="contained"
                            startIcon={<AdminPanelSettings />}
                            sx={styles.adminButton}
                            onClick={() => onSelect("admin")}
                        >
                            {isTablet ? "Yönetim" : "Yönetim Paneli"}
                        </Button>
                    )}

                    <Box sx={styles.profileCard}>
                        <Box
                            sx={{
                                display: { xs: "none", sm: "block" },
                                minWidth: 0,
                                maxWidth: isTablet ? 110 : 160,
                                mr: 1.2,
                            }}
                        >
                            <Typography sx={styles.userName}>{userName}</Typography>
                            <Typography sx={styles.userRole}>
                                {kullanici?.rol || "Kullanıcı"}
                            </Typography>
                        </Box>

                        <Avatar sx={styles.avatar}>{initials}</Avatar>

                        <Tooltip title="Çıkış Yap" arrow>
                            <IconButton onClick={onCikis} sx={styles.logoutButton}>
                                <Logout fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {isAdmin && isMobile && (
                        <Tooltip title="Yönetim Paneli" arrow>
                            <IconButton onClick={() => onSelect("admin")} sx={styles.adminMobileButton}>
                                <AdminPanelSettings fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

const styles = {
    appBar: {
        background: "rgba(10,14,24,0.72)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    },

    toolbar: {
        minHeight: { xs: 64, sm: 70, md: 74 },
        px: { xs: 1.2, sm: 1.8, md: 2.5 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },

    leftSection: {
        display: "flex",
        alignItems: "center",
        gap: 1.2,
    },

    rightSection: {
        display: "flex",
        alignItems: "center",
        gap: { xs: 0.6, sm: 1 },
    },

    logoBox: {
        width: 42,
        height: 42,
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
        boxShadow: "0 8px 20px rgba(59,130,246,0.28)",
        border: "1px solid rgba(255,255,255,0.12)",
    },

    iconButton: {
        width: 40,
        height: 40,
        borderRadius: "14px",
        color: "#cbd5e1",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "all .2s ease",
        "&:hover": {
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            transform: "translateY(-1px)",
        },
    },

    adminButton: {
        textTransform: "none",
        borderRadius: "999px",
        px: 2,
        minHeight: 40,
        fontWeight: 700,
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 22px rgba(139,92,246,0.28)",
        "&:hover": {
            filter: "brightness(1.07)",
            boxShadow: "0 10px 26px rgba(139,92,246,0.36)",
        },
    },

    adminMobileButton: {
        width: 40,
        height: 40,
        borderRadius: "14px",
        color: "#d8b4fe",
        background: "rgba(139,92,246,0.10)",
        border: "1px solid rgba(139,92,246,0.18)",
        "&:hover": {
            background: "rgba(139,92,246,0.18)",
            color: "#fff",
        },
    },

    profileCard: {
        display: "flex",
        alignItems: "center",
        borderRadius: "18px",
        padding: { xs: "4px 4px 4px 8px", sm: "5px 6px 5px 12px" },
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(14px)",
    },

    userName: {
        color: "#fff",
        fontSize: "0.9rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    userRole: {
        color: "#94a3b8",
        fontSize: "0.72rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },

    avatar: {
        width: 36,
        height: 36,
        borderRadius: "12px",
        fontSize: 14,
        fontWeight: 800,
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
    },

    logoutButton: {
        ml: 0.8,
        width: 36,
        height: 36,
        borderRadius: "12px",
        color: "#fda4af",
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.12)",
        "&:hover": {
            background: "rgba(248,113,113,0.18)",
            color: "#fff",
        },
    },
};