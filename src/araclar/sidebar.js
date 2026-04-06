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
    Divider,
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
                    background: "#fafafa",
                    borderRight: "1px solid #e5e5e5",
                    transition: isMobile ? "none" : "width 200ms ease",
                },
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <Box sx={{ 
                    p: 2, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: expanded ? "space-between" : "center",
                    minHeight: 64,
                }}>
                    {expanded ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                background: "#171717",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <Dashboard sx={{ color: "#fff", fontSize: 18 }} />
                            </Box>
                            <Typography sx={{ 
                                fontWeight: 600, 
                                fontSize: 15,
                                color: "#171717",
                                letterSpacing: -0.3,
                            }}>
                                BAPSiS
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            background: "#171717",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Dashboard sx={{ color: "#fff", fontSize: 18 }} />
                        </Box>
                    )}
                    
                    {!isMobile && expanded && (
                        <IconButton 
                            onClick={() => setOpen(false)} 
                            size="small"
                            sx={{ 
                                color: "#737373",
                                "&:hover": { background: "#f5f5f5" },
                            }}
                        >
                            <ChevronLeft sx={{ fontSize: 20 }} />
                        </IconButton>
                    )}
                </Box>

                <Divider sx={{ borderColor: "#e5e5e5" }} />

                {/* Navigation */}
                <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
                    <List disablePadding>
                        {menuData.map((item) => {
                            if (item.type === "single") {
                                const isActive = selected === item.key;
                                return (
                                    <ListItem key={item.key} disablePadding sx={{ px: 1 }}>
                                        <Tooltip title={!expanded ? item.text : ""} placement="right">
                                            <ListItemButton
                                                onClick={() => handleSelect(item.key)}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    minHeight: 40,
                                                    px: expanded ? 1.5 : 0,
                                                    justifyContent: expanded ? "flex-start" : "center",
                                                    background: isActive ? "#171717" : "transparent",
                                                    color: isActive ? "#fff" : "#525252",
                                                    "&:hover": {
                                                        background: isActive ? "#171717" : "#f5f5f5",
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ 
                                                    minWidth: expanded ? 32 : 0, 
                                                    color: isActive ? "#fff" : "#737373",
                                                    justifyContent: "center",
                                                }}>
                                                    {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                                                </ListItemIcon>
                                                {expanded && (
                                                    <ListItemText 
                                                        primary={item.text}
                                                        primaryTypographyProps={{
                                                            fontSize: 13,
                                                            fontWeight: isActive ? 500 : 400,
                                                        }}
                                                    />
                                                )}
                                            </ListItemButton>
                                        </Tooltip>
                                    </ListItem>
                                );
                            }

                            // Group item
                            const isGroupOpen = openGroups[item.key];
                            const hasActiveChild = item.items.some(child => selected === child.key);

                            return (
                                <Box key={item.key} sx={{ mb: 0.5 }}>
                                    <ListItem disablePadding sx={{ px: 1 }}>
                                        <Tooltip title={!expanded ? item.text : ""} placement="right">
                                            <ListItemButton
                                                onClick={() => expanded && toggleGroup(item.key)}
                                                sx={{
                                                    borderRadius: 1.5,
                                                    minHeight: 40,
                                                    px: expanded ? 1.5 : 0,
                                                    justifyContent: expanded ? "flex-start" : "center",
                                                    color: hasActiveChild ? "#171717" : "#525252",
                                                    "&:hover": { background: "#f5f5f5" },
                                                }}
                                            >
                                                <ListItemIcon sx={{ 
                                                    minWidth: expanded ? 32 : 0, 
                                                    color: hasActiveChild ? "#171717" : "#737373",
                                                    justifyContent: "center",
                                                }}>
                                                    {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                                                </ListItemIcon>
                                                {expanded && (
                                                    <>
                                                        <ListItemText 
                                                            primary={item.text}
                                                            primaryTypographyProps={{
                                                                fontSize: 13,
                                                                fontWeight: hasActiveChild ? 500 : 400,
                                                            }}
                                                        />
                                                        {isGroupOpen ? (
                                                            <ExpandLess sx={{ fontSize: 18, color: "#a3a3a3" }} />
                                                        ) : (
                                                            <ExpandMore sx={{ fontSize: 18, color: "#a3a3a3" }} />
                                                        )}
                                                    </>
                                                )}
                                            </ListItemButton>
                                        </Tooltip>
                                    </ListItem>

                                    {/* Children */}
                                    <Collapse in={expanded && isGroupOpen} timeout="auto">
                                        <List disablePadding sx={{ pl: expanded ? 3 : 0 }}>
                                            {item.items.map((child) => {
                                                const isChildActive = selected === child.key;
                                                return (
                                                    <ListItem key={child.key} disablePadding sx={{ px: 1 }}>
                                                        <ListItemButton
                                                            onClick={() => handleSelect(child.key)}
                                                            sx={{
                                                                borderRadius: 1.5,
                                                                minHeight: 36,
                                                                px: 1.5,
                                                                background: isChildActive ? "#f5f5f5" : "transparent",
                                                                color: isChildActive ? "#171717" : "#737373",
                                                                "&:hover": { background: "#f5f5f5" },
                                                            }}
                                                        >
                                                            <ListItemText 
                                                                primary={child.text}
                                                                primaryTypographyProps={{
                                                                    fontSize: 13,
                                                                    fontWeight: isChildActive ? 500 : 400,
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>

                                    {/* Collapsed state - show children as icons */}
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
                                                                    borderRadius: 1.5,
                                                                    minHeight: 36,
                                                                    justifyContent: "center",
                                                                    background: isChildActive ? "#171717" : "transparent",
                                                                    color: isChildActive ? "#fff" : "#737373",
                                                                    "&:hover": {
                                                                        background: isChildActive ? "#171717" : "#f5f5f5",
                                                                    },
                                                                }}
                                                            >
                                                                <ListItemIcon sx={{ 
                                                                    minWidth: 0, 
                                                                    color: isChildActive ? "#fff" : "#a3a3a3",
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

                {/* Toggle Button for collapsed state */}
                {!isMobile && !expanded && (
                    <Box sx={{ p: 1, borderTop: "1px solid #e5e5e5" }}>
                        <IconButton 
                            onClick={() => setOpen(true)}
                            sx={{ 
                                width: "100%",
                                borderRadius: 1.5,
                                color: "#737373",
                                "&:hover": { background: "#f5f5f5" },
                            }}
                        >
                            <ChevronRight sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>
                )}

                {/* Footer */}
                {expanded && (
                    <Box sx={{ 
                        p: 2, 
                        borderTop: "1px solid #e5e5e5",
                    }}>
                        <Typography sx={{ 
                            fontSize: 11, 
                            color: "#a3a3a3",
                            textAlign: "center",
                        }}>
                            BAPSiS v1.0
                        </Typography>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
