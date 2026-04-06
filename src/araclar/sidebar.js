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

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

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
                    background: "#111827",
                    borderRight: "1px solid #1f2937",
                    transition: isMobile ? "none" : "width 200ms ease",
                },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <Box sx={{ 
                    px: 2, 
                    py: 2.5,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: expanded ? "space-between" : "center",
                    borderBottom: "1px solid #1f2937",
                }}>
                    {expanded ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                background: "#3b82f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <Dashboard sx={{ color: "#fff", fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography sx={{ 
                                    fontWeight: 600, 
                                    fontSize: 15,
                                    color: "#f9fafb",
                                    lineHeight: 1.2,
                                }}>
                                    BAPSiS
                                </Typography>
                                <Typography sx={{ 
                                    fontSize: 11,
                                    color: "#6b7280",
                                }}>
                                    Lojistik Sistemi
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            background: "#3b82f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Dashboard sx={{ color: "#fff", fontSize: 20 }} />
                        </Box>
                    )}
                    
                    {!isMobile && expanded && (
                        <IconButton 
                            onClick={() => setOpen(false)} 
                            size="small"
                            sx={{ 
                                color: "#6b7280",
                                "&:hover": { background: "#1f2937", color: "#f9fafb" },
                            }}
                        >
                            <ChevronLeft sx={{ fontSize: 20 }} />
                        </IconButton>
                    )}
                </Box>

                {/* Navigation */}
                <Box sx={{ 
                    flex: 1, 
                    overflowY: "auto", 
                    py: 1.5,
                    "&::-webkit-scrollbar": { width: 4 },
                    "&::-webkit-scrollbar-thumb": { background: "#374151", borderRadius: 2 },
                }}>
                    <List disablePadding>
                        {menuData.map((item) => {
                            if (item.type === "single") {
                                const isActive = selected === item.key;
                                return (
                                    <ListItem key={item.key} disablePadding sx={{ px: 1, mb: 0.5 }}>
                                        <Tooltip title={!expanded ? item.text : ""} placement="right">
                                            <ListItemButton
                                                onClick={() => handleSelect(item.key)}
                                                sx={{
                                                    borderRadius: 1,
                                                    minHeight: 44,
                                                    px: expanded ? 1.5 : 0,
                                                    justifyContent: expanded ? "flex-start" : "center",
                                                    background: isActive ? "#1f2937" : "transparent",
                                                    "&:hover": { background: "#1f2937" },
                                                }}
                                            >
                                                <ListItemIcon sx={{ 
                                                    minWidth: expanded ? 36 : 0, 
                                                    color: isActive ? "#3b82f6" : "#9ca3af",
                                                    justifyContent: "center",
                                                }}>
                                                    {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                                                </ListItemIcon>
                                                {expanded && (
                                                    <ListItemText 
                                                        primary={item.text}
                                                        primaryTypographyProps={{
                                                            fontSize: 14,
                                                            fontWeight: isActive ? 500 : 400,
                                                            color: isActive ? "#f9fafb" : "#d1d5db",
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
                                    <ListItem disablePadding sx={{ px: 1 }}>
                                        <Tooltip title={!expanded ? item.text : ""} placement="right">
                                            <ListItemButton
                                                onClick={() => expanded ? toggleGroup(item.key) : null}
                                                sx={{
                                                    borderRadius: 1,
                                                    minHeight: 44,
                                                    px: expanded ? 1.5 : 0,
                                                    justifyContent: expanded ? "flex-start" : "center",
                                                    "&:hover": { background: "#1f2937" },
                                                }}
                                            >
                                                <ListItemIcon sx={{ 
                                                    minWidth: expanded ? 36 : 0, 
                                                    color: hasActiveChild ? "#3b82f6" : "#9ca3af",
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
                                                                fontWeight: hasActiveChild ? 500 : 400,
                                                                color: hasActiveChild ? "#f9fafb" : "#d1d5db",
                                                            }}
                                                        />
                                                        {isGroupOpen ? (
                                                            <ExpandLess sx={{ fontSize: 18, color: "#6b7280" }} />
                                                        ) : (
                                                            <ExpandMore sx={{ fontSize: 18, color: "#6b7280" }} />
                                                        )}
                                                    </>
                                                )}
                                            </ListItemButton>
                                        </Tooltip>
                                    </ListItem>

                                    {/* Children - expanded */}
                                    <Collapse in={expanded && isGroupOpen} timeout="auto">
                                        <List disablePadding>
                                            {item.items.map((child) => {
                                                const isChildActive = selected === child.key;
                                                return (
                                                    <ListItem key={child.key} disablePadding sx={{ px: 1 }}>
                                                        <ListItemButton
                                                            onClick={() => handleSelect(child.key)}
                                                            sx={{
                                                                borderRadius: 1,
                                                                minHeight: 38,
                                                                pl: 6,
                                                                pr: 1.5,
                                                                background: isChildActive ? "#1f2937" : "transparent",
                                                                "&:hover": { background: "#1f2937" },
                                                            }}
                                                        >
                                                            <ListItemText 
                                                                primary={child.text}
                                                                primaryTypographyProps={{
                                                                    fontSize: 13,
                                                                    fontWeight: isChildActive ? 500 : 400,
                                                                    color: isChildActive ? "#f9fafb" : "#9ca3af",
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>

                                    {/* Children - collapsed */}
                                    {!expanded && !isMobile && (
                                        <List disablePadding>
                                            {item.items.map((child) => {
                                                const isChildActive = selected === child.key;
                                                return (
                                                    <ListItem key={child.key} disablePadding sx={{ px: 1 }}>
                                                        <Tooltip title={child.text} placement="right">
                                                            <ListItemButton
                                                                onClick={() => handleSelect(child.key)}
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    minHeight: 38,
                                                                    justifyContent: "center",
                                                                    background: isChildActive ? "#1f2937" : "transparent",
                                                                    "&:hover": { background: "#1f2937" },
                                                                }}
                                                            >
                                                                <ListItemIcon sx={{ 
                                                                    minWidth: 0, 
                                                                    color: isChildActive ? "#3b82f6" : "#6b7280",
                                                                }}>
                                                                    {React.cloneElement(child.icon, { sx: { fontSize: 18 } })}
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
                    <Box sx={{ p: 1, borderTop: "1px solid #1f2937" }}>
                        <IconButton 
                            onClick={() => setOpen(true)}
                            sx={{ 
                                width: "100%",
                                borderRadius: 1,
                                color: "#6b7280",
                                "&:hover": { background: "#1f2937", color: "#f9fafb" },
                            }}
                        >
                            <ChevronRight sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                )}

                {/* Footer */}
                {expanded && (
                    <Box sx={{ 
                        px: 2, 
                        py: 1.5, 
                        borderTop: "1px solid #1f2937",
                    }}>
                        <Typography sx={{ 
                            fontSize: 11, 
                            color: "#6b7280",
                        }}>
                            v1.0.0
                        </Typography>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
