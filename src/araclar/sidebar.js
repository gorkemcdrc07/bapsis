import React from "react";
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    IconButton,
    Collapse,
    Tooltip,
    Avatar,
    useMediaQuery,
} from "@mui/material";
import {
    Dashboard,
    Assignment,
    LocalShipping,
    ChevronLeft,
    ChevronRight,
    ExpandLess,
    ExpandMore,
    ManageAccounts,
    DirectionsCar,
    CarRepair,
    UTurnLeft,
    Storefront,
    Route,
} from "@mui/icons-material";

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const menuData = [
    {
        key: "planlama",
        text: "Planlama",
        icon: <Route />,
        type: "single",
    },
    {
        key: "kullaniciIslemleri",
        text: "BIM Afyon",
        icon: <Storefront />,
        type: "group",
        items: [
            { key: "siparisacilis", text: "Siparis Acilis", icon: <Assignment /> },
            { key: "plakaatama", text: "Plaka Atama", icon: <LocalShipping /> },
            { key: "tamamlanan_seferler", text: "Tamamlanan Seferler", icon: <LocalShipping /> },
        ],
    },
    {
        key: "donusler",
        text: "Donusler",
        icon: <UTurnLeft />,
        type: "group",
        items: [
            { key: "donus_siparis_acilis", text: "Siparis Acilis", icon: <Assignment /> },
            { key: "donus_plaka_atama", text: "Plaka Atama", icon: <LocalShipping /> },
            { key: "donus_tamamlanan_seferler", text: "Tamamlanan Seferler", icon: <LocalShipping /> },
            { key: "donus_navlunlar", text: "Navlunlar", icon: <LocalShipping /> },
        ],
    },
    {
        key: "aracYonetimi",
        text: "Arac Yonetimi",
        icon: <DirectionsCar />,
        type: "group",
        items: [
            { key: "aracbilgileri", text: "Arac Bilgileri", icon: <CarRepair /> },
        ],
    },
    {
        key: "yeniKayitlar",
        text: "Yeni Kayitlar",
        icon: <ManageAccounts />,
        type: "group",
        items: [
            { key: "vkn_ekle", text: "VKN Ekle", icon: <ManageAccounts /> },
            { key: "ugrama_sarti_ekle", text: "Ugrama Sarti Ekle", icon: <LocalShipping /> },
            { key: "navlun_sarti_ekle", text: "Navlun Sarti Ekle", icon: <LocalShipping /> },
        ],
    },
];

export default function Sidebar({ open, setOpen, selected, onSelect }) {
    const isMobile = useMediaQuery("(max-width:768px)");
    const expanded = isMobile ? true : open;

    const [openGroups, setOpenGroups] = React.useState({
        kullaniciIslemleri: true,
        donusler: false,
        aracYonetimi: false,
        yeniKayitlar: false,
    });

    const toggleGroup = (key) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSelect = (key) => {
        onSelect(key);
        if (isMobile) setOpen(false);
    };

    const currentWidth = isMobile ? DRAWER_WIDTH : (open ? DRAWER_WIDTH : COLLAPSED_WIDTH);

    return (
        <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={isMobile ? open : true}
            onClose={() => isMobile && setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: currentWidth,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: currentWidth,
                    maxWidth: "85vw",
                    boxSizing: "border-box",
                    background: "linear-gradient(180deg, #0c1222 0%, #101827 100%)",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                    transition: isMobile ? "none" : "width 200ms ease",
                },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <Box sx={{ 
                    px: expanded ? 2.5 : 1.5, 
                    py: 2.5,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: expanded ? "space-between" : "center",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    {expanded ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                                variant="rounded"
                                sx={{
                                    width: 40,
                                    height: 40,
                                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                                }}
                            >
                                <Dashboard sx={{ color: "#fff", fontSize: 22 }} />
                            </Avatar>
                            <Box>
                                <Typography sx={{ 
                                    fontWeight: 700, 
                                    fontSize: 16,
                                    color: "#fff",
                                    letterSpacing: 0.5,
                                }}>
                                    BAPSiS
                                </Typography>
                                <Typography sx={{ 
                                    fontSize: 11,
                                    color: "#64748b",
                                    letterSpacing: 0.3,
                                }}>
                                    Lojistik Yonetim
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 40,
                                height: 40,
                                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                            }}
                        >
                            <Dashboard sx={{ color: "#fff", fontSize: 22 }} />
                        </Avatar>
                    )}
                    
                    {!isMobile && expanded && (
                        <IconButton 
                            onClick={() => setOpen(false)} 
                            size="small"
                            sx={{ 
                                color: "#64748b",
                                background: "rgba(255,255,255,0.04)",
                                "&:hover": { 
                                    background: "rgba(255,255,255,0.08)", 
                                    color: "#fff" 
                                },
                            }}
                        >
                            <ChevronLeft sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
                </Box>

                {/* Navigation */}
                <Box sx={{ 
                    flex: 1, 
                    overflowY: "auto", 
                    py: 2,
                    px: expanded ? 1.5 : 1,
                    "&::-webkit-scrollbar": { width: 4 },
                    "&::-webkit-scrollbar-thumb": { 
                        background: "rgba(255,255,255,0.1)", 
                        borderRadius: 2 
                    },
                }}>
                    {expanded && (
                        <Typography sx={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                            px: 1.5,
                            mb: 1.5,
                        }}>
                            Menu
                        </Typography>
                    )}
                    
                    <List disablePadding>
                        {menuData.map((item) => {
                            if (item.type === "single") {
                                const isActive = selected === item.key;
                                return (
                                    <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
                                        <Tooltip title={!expanded ? item.text : ""} placement="right" arrow>
                                            <ListItemButton
                                                onClick={() => handleSelect(item.key)}
                                                sx={{
                                                    borderRadius: 2,
                                                    minHeight: 46,
                                                    px: expanded ? 1.5 : 0,
                                                    justifyContent: expanded ? "flex-start" : "center",
                                                    background: isActive 
                                                        ? "linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)" 
                                                        : "transparent",
                                                    borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                                                    "&:hover": { 
                                                        background: isActive 
                                                            ? "linear-gradient(90deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)"
                                                            : "rgba(255,255,255,0.04)" 
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ 
                                                    minWidth: expanded ? 40 : 0, 
                                                    color: isActive ? "#3b82f6" : "#64748b",
                                                    justifyContent: "center",
                                                }}>
                                                    {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                                                </ListItemIcon>
                                                {expanded && (
                                                    <ListItemText 
                                                        primary={item.text}
                                                        primaryTypographyProps={{
                                                            fontSize: 14,
                                                            fontWeight: isActive ? 600 : 400,
                                                            color: isActive ? "#fff" : "#94a3b8",
                                                        }}
                                                    />
                                                )}
                                            </ListItemButton>
                                        </Tooltip>
                                    </ListItem>
                                );
                            }

                            // Group
                            const isGroupOpen = openGroups[item.key];
                            const hasActiveChild = item.items.some(child => selected === child.key);

                            return (
                                <Box key={item.key} sx={{ mb: 0.5 }}>
                                    <ListItem disablePadding>
                                        <Tooltip title={!expanded ? item.text : ""} placement="right" arrow>
                                            <ListItemButton
                                                onClick={() => expanded ? toggleGroup(item.key) : null}
                                                sx={{
                                                    borderRadius: 2,
                                                    minHeight: 46,
                                                    px: expanded ? 1.5 : 0,
                                                    justifyContent: expanded ? "flex-start" : "center",
                                                    background: hasActiveChild 
                                                        ? "rgba(59,130,246,0.08)" 
                                                        : "transparent",
                                                    "&:hover": { background: "rgba(255,255,255,0.04)" },
                                                }}
                                            >
                                                <ListItemIcon sx={{ 
                                                    minWidth: expanded ? 40 : 0, 
                                                    color: hasActiveChild ? "#3b82f6" : "#64748b",
                                                    justifyContent: "center",
                                                }}>
                                                    {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                                                </ListItemIcon>
                                                {expanded && (
                                                    <>
                                                        <ListItemText 
                                                            primary={item.text}
                                                            primaryTypographyProps={{
                                                                fontSize: 14,
                                                                fontWeight: hasActiveChild ? 600 : 400,
                                                                color: hasActiveChild ? "#fff" : "#94a3b8",
                                                            }}
                                                        />
                                                        <Box sx={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: 1,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            background: "rgba(255,255,255,0.04)",
                                                        }}>
                                                            {isGroupOpen ? (
                                                                <ExpandLess sx={{ fontSize: 16, color: "#64748b" }} />
                                                            ) : (
                                                                <ExpandMore sx={{ fontSize: 16, color: "#64748b" }} />
                                                            )}
                                                        </Box>
                                                    </>
                                                )}
                                            </ListItemButton>
                                        </Tooltip>
                                    </ListItem>

                                    {/* Children - expanded */}
                                    <Collapse in={expanded && isGroupOpen} timeout="auto">
                                        <List disablePadding sx={{ mt: 0.5, mb: 1 }}>
                                            {item.items.map((child) => {
                                                const isChildActive = selected === child.key;
                                                return (
                                                    <ListItem key={child.key} disablePadding>
                                                        <ListItemButton
                                                            onClick={() => handleSelect(child.key)}
                                                            sx={{
                                                                borderRadius: 1.5,
                                                                minHeight: 38,
                                                                ml: 6,
                                                                mr: 1,
                                                                px: 1.5,
                                                                position: "relative",
                                                                background: isChildActive 
                                                                    ? "rgba(59,130,246,0.12)" 
                                                                    : "transparent",
                                                                "&:hover": { 
                                                                    background: isChildActive 
                                                                        ? "rgba(59,130,246,0.12)"
                                                                        : "rgba(255,255,255,0.03)" 
                                                                },
                                                                "&::before": {
                                                                    content: '""',
                                                                    position: "absolute",
                                                                    left: -16,
                                                                    top: "50%",
                                                                    transform: "translateY(-50%)",
                                                                    width: 6,
                                                                    height: 6,
                                                                    borderRadius: "50%",
                                                                    background: isChildActive ? "#3b82f6" : "#334155",
                                                                },
                                                            }}
                                                        >
                                                            <ListItemText 
                                                                primary={child.text}
                                                                primaryTypographyProps={{
                                                                    fontSize: 13,
                                                                    fontWeight: isChildActive ? 500 : 400,
                                                                    color: isChildActive ? "#fff" : "#64748b",
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>

                                    {/* Children - collapsed (show as smaller icons) */}
                                    {!expanded && !isMobile && (
                                        <List disablePadding sx={{ mt: 0.5 }}>
                                            {item.items.map((child) => {
                                                const isChildActive = selected === child.key;
                                                return (
                                                    <ListItem key={child.key} disablePadding>
                                                        <Tooltip title={child.text} placement="right" arrow>
                                                            <ListItemButton
                                                                onClick={() => handleSelect(child.key)}
                                                                sx={{
                                                                    borderRadius: 1.5,
                                                                    minHeight: 36,
                                                                    justifyContent: "center",
                                                                    background: isChildActive 
                                                                        ? "rgba(59,130,246,0.12)" 
                                                                        : "transparent",
                                                                    "&:hover": { background: "rgba(255,255,255,0.04)" },
                                                                }}
                                                            >
                                                                <ListItemIcon sx={{ 
                                                                    minWidth: 0, 
                                                                    color: isChildActive ? "#3b82f6" : "#475569",
                                                                }}>
                                                                    {React.cloneElement(child.icon, { sx: { fontSize: 16 } })}
                                                                </ListItemIcon>
                                                            </ListItemButton>
                                                        </Tooltip>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    )}
                                </Box>
                            );
                        })}
                    </List>
                </Box>

                {/* Expand button - collapsed */}
                {!isMobile && !expanded && (
                    <Box sx={{ p: 1.5, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <IconButton 
                            onClick={() => setOpen(true)}
                            sx={{ 
                                width: "100%",
                                borderRadius: 2,
                                color: "#64748b",
                                background: "rgba(255,255,255,0.04)",
                                "&:hover": { 
                                    background: "rgba(255,255,255,0.08)", 
                                    color: "#fff" 
                                },
                            }}
                        >
                            <ChevronRight sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                )}

                {/* Footer */}
                {expanded && (
                    <Box sx={{ 
                        px: 2.5, 
                        py: 2, 
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(0,0,0,0.2)",
                    }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                                variant="rounded"
                                sx={{
                                    width: 36,
                                    height: 36,
                                    background: "#1e293b",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#94a3b8",
                                }}
                            >
                                B
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ 
                                    fontSize: 13, 
                                    fontWeight: 500,
                                    color: "#e2e8f0",
                                }}>
                                    Bakanlik Planlama
                                </Typography>
                                <Typography sx={{ 
                                    fontSize: 11, 
                                    color: "#64748b",
                                }}>
                                    v1.0.0
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
