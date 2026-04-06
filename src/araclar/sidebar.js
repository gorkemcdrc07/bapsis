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
    Stack,
    useMediaQuery,
} from "@mui/material";
import {
    Dashboard,
    Assignment,
    LocalShipping,
    ChevronLeft,
    ExpandLess,
    ExpandMore,
    ManageAccounts,
    DirectionsCar,
    CarRepair,
    UTurnLeft,
    Storefront,
    Route,
} from "@mui/icons-material";

const DRAWER_WIDTH = 302;
const COLLAPSED_WIDTH = 92;

const topItems = [
    {
        key: "planlama",
        text: "Planlama",
        icon: <Route />,
    },
];

const groups = [
    {
        key: "kullaniciIslemleri",
        title: "BİM AFYON",
        caption: "Ana operasyon yönetimi",
        icon: <Storefront />,
        accent: "linear-gradient(135deg, #22c55e, #16a34a)",
        items: [
            { key: "siparisacilis", text: "Bim Sipariş Açılış", icon: <Assignment /> },
            { key: "plakaatama", text: "Bim Plaka Atama", icon: <LocalShipping /> },
            { key: "tamamlanan_seferler", text: "Bim Tamamlanan Seferler", icon: <LocalShipping /> },
        ],
    },
    {
        key: "donusler",
        title: "DÖNÜŞLER",
        caption: "Dönüş operasyonları",
        icon: <UTurnLeft />,
        accent: "linear-gradient(135deg, #f59e0b, #ea580c)",
        items: [
            { key: "donus_siparis_acilis", text: "Dönüş Sipariş Açılış", icon: <Assignment /> },
            { key: "donus_plaka_atama", text: "Dönüş Plaka Atama", icon: <LocalShipping /> },
            { key: "donus_tamamlanan_seferler", text: "Dönüş Tamamlanan Seferler", icon: <LocalShipping /> },
            {
                key: "donus_navlunlar",
                text: "Navlunlar",
                icon: <LocalShipping />,
            }
        ],
    },
    {
        key: "aracYonetimi",
        title: "Araç Yönetimi",
        caption: "Filo görünümü",
        icon: <DirectionsCar />,
        accent: "linear-gradient(135deg, #06b6d4, #0891b2)",
        items: [
            { key: "aracbilgileri", text: "Araç Bilgileri", icon: <CarRepair /> },
        ],
    },
    {
        key: "yeniKayitlar",
        title: "Yeni Kayıtlar",
        caption: "Tanım ekranları",
        icon: <ManageAccounts />,
        accent: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
        items: [
            { key: "vkn_ekle", text: "VKN Ekle", icon: <ManageAccounts /> },
            { key: "ugrama_sarti_ekle", text: "Uğrama Şartı Ekle", icon: <LocalShipping /> },
            { key: "navlun_sarti_ekle", text: "Navlun Şartı Ekle", icon: <LocalShipping /> },
        ],
    },
];

function GroupCard({
    group,
    expanded,
    isMobile,
    selected,
    isOpen,
    onToggle,
    onSelect,
}) {
    return (
        <Box sx={styles.groupCard}>
            <ListItem disablePadding>
                <Tooltip title={!expanded ? group.title : ""} placement="right" arrow>
                    <ListItemButton onClick={onToggle} sx={styles.groupBtn(expanded)}>
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: expanded ? 1.4 : 0,
                                justifyContent: "center",
                            }}
                        >
                            <Box sx={styles.groupIconWrap(group.accent)}>{group.icon}</Box>
                        </ListItemIcon>

                        {expanded && (
                            <>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography sx={styles.groupTitle}>{group.title}</Typography>
                                    <Typography sx={styles.groupCaption}>{group.caption}</Typography>
                                </Box>
                                {isOpen ? (
                                    <ExpandLess sx={{ color: "rgba(255,255,255,0.55)" }} />
                                ) : (
                                    <ExpandMore sx={{ color: "rgba(255,255,255,0.55)" }} />
                                )}
                            </>
                        )}
                    </ListItemButton>
                </Tooltip>
            </ListItem>

            <Collapse in={expanded ? isOpen : false} timeout="auto" unmountOnExit>
                <List sx={{ pb: 0.8 }}>
                    {group.items.map((item) => {
                        const active = selected === item.key;
                        return (
                            <ListItem key={item.key} disablePadding>
                                <ListItemButton onClick={() => onSelect(item.key)} sx={styles.childBtn(active)}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontSize: "0.8rem",
                                            fontWeight: active ? 600 : 400,
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Collapse>

            {!expanded && !isMobile && (
                <List sx={{ px: 1, pb: 1 }}>
                    {group.items.map((item) => {
                        const active = selected === item.key;
                        return (
                            <ListItem key={item.key} disablePadding>
                                <Tooltip title={item.text} placement="right" arrow>
                                    <ListItemButton
                                        onClick={() => onSelect(item.key)}
                                        sx={styles.collapsedIconBtn(active)}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                justifyContent: "center",
                                                color: active ? "#60a5fa" : "#94a3b8",
                                            }}
                                        >
                                            {item.icon}
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
}

export default function Sidebar({ open, setOpen, selected, onSelect }) {
    const isMobile = useMediaQuery("(max-width:768px)");
    const expanded = isMobile ? true : open;

    const [groupState, setGroupState] = React.useState({
        kullaniciIslemleri: true,
        donusler: true,
        aracYonetimi: true,
        yeniKayitlar: true,
    });

    const toggleGroup = (key) => {
        setGroupState((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSelect = (key) => {
        onSelect(key);
        if (isMobile) setOpen(false);
    };

    const drawerCurrentWidth = isMobile
        ? DRAWER_WIDTH
        : open
            ? DRAWER_WIDTH
            : COLLAPSED_WIDTH;

    return (
        <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={isMobile ? open : true}
            onClose={() => isMobile && setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: drawerCurrentWidth,
                flexShrink: 0,
                whiteSpace: "nowrap",
                boxSizing: "border-box",
                "& .MuiDrawer-paper": {
                    width: drawerCurrentWidth,
                    maxWidth: "82vw",
                    ...styles.drawerPaper,
                    ...(isMobile ? {} : { transition: "width 220ms ease" }),
                },
            }}
        >
            <Box sx={styles.shell(expanded)}>
                <Box sx={styles.topCard}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                    >
                        {expanded ? (
                            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                                <Box sx={styles.logoBox}>
                                    <Dashboard sx={{ color: "#fff", fontSize: 20 }} />
                                </Box>

                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={styles.logoTitle}>BAPSiS</Typography>
                                    <Typography sx={styles.logoSubTitle}>
                                        Lojistik Yonetim
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                                <Box sx={styles.logoBox}>
                                    <Dashboard sx={{ color: "#fff", fontSize: 20 }} />
                                </Box>
                            </Box>
                        )}

                        {!isMobile && expanded && (
                            <IconButton onClick={() => setOpen(false)} sx={styles.toggleBtn}>
                                <ChevronLeft sx={{ fontSize: 20 }} />
                            </IconButton>
                        )}
                    </Stack>
                </Box>

                <Box sx={styles.scrollArea(expanded)}>
                    {expanded && <Typography sx={styles.sectionTitle(expanded)}>Hızlı Erişim</Typography>}

                    <List sx={{ p: 0, mb: 1.2 }}>
                        {topItems.map((item) => {
                            const active = selected === item.key;
                            return (
                                <ListItem key={item.key} disablePadding>
                                    <Tooltip title={!expanded ? item.text : ""} placement="right" arrow>
                                        <ListItemButton
                                            onClick={() => handleSelect(item.key)}
                                            sx={styles.topMenuBtn(active, expanded)}
                                        >
                                            <ListItemIcon
                                                sx={{
                                                    minWidth: 0,
                                                    mr: expanded ? 1.4 : 0,
                                                    justifyContent: "center",
                                                    color: active ? "#ffffff" : "#93c5fd",
                                                }}
                                            >
                                                <Box sx={styles.topMenuIcon(active)}>
                                                    {item.icon}
                                                </Box>
                                            </ListItemIcon>

                                            {expanded && (
                                                <ListItemText
                                                    primary={item.text}
                                                    primaryTypographyProps={{
                                                        fontSize: "0.85rem",
                                                        fontWeight: active ? 600 : 500,
                                                        color: active ? "#fff" : "#94a3b8",
                                                    }}
                                                />
                                            )}
                                        </ListItemButton>
                                    </Tooltip>
                                </ListItem>
                            );
                        })}
                    </List>

                    {expanded && <Typography sx={styles.sectionTitle(expanded)}>Modüller</Typography>}

                    <List sx={{ p: 0 }}>
                        {groups.map((group) => (
                            <GroupCard
                                key={group.key}
                                group={group}
                                expanded={expanded}
                                isMobile={isMobile}
                                selected={selected}
                                isOpen={!!groupState[group.key]}
                                onToggle={() => toggleGroup(group.key)}
                                onSelect={handleSelect}
                            />
                        ))}
                    </List>
                </Box>

                <Box sx={styles.footer}>
                    {expanded ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={styles.footerAvatar} variant="rounded">
                                B
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>
                                    BAPSiS v1.0
                                </Typography>
                                <Typography sx={{ color: "#64748b", fontSize: 11 }}>
                                    Bakanlik Planlama Sistemi
                                </Typography>
                            </Box>
                        </Stack>
                    ) : (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Avatar sx={styles.footerAvatarSmall} variant="rounded">
                                B
                            </Avatar>
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
}

const styles = {
    drawerPaper: {
        background: "#0f172a",
        borderRight: "1px solid #1e293b",
        color: "#94a3b8",
        overflowX: "hidden",
    },

    shell: (expanded) => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: expanded ? 1.5 : 1,
        py: 2,
        gap: 2,
    }),

    topCard: {
        borderRadius: 2,
        p: 1.5,
        background: "#1e293b",
    },

    logoBox: {
        width: 40,
        height: 40,
        borderRadius: 2,
        background: "#3b82f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    logoTitle: {
        color: "#f1f5f9",
        fontWeight: 700,
        fontSize: "0.95rem",
        letterSpacing: 0.5,
        lineHeight: 1.2,
    },

    logoSubTitle: {
        color: "#64748b",
        fontSize: 11,
        mt: 0.25,
    },

    toggleBtn: {
        color: "#94a3b8",
        width: 36,
        height: 36,
        borderRadius: 1.5,
        "&:hover": { background: "#334155", color: "#f1f5f9" },
    },

    miniBadge: {
        height: 22,
        borderRadius: 1,
        bgcolor: "#334155",
        border: "none",
        color: "#94a3b8",
        fontWeight: 600,
        fontSize: 10,
        "& .MuiChip-icon": { color: "#3b82f6" },
    },

    sectionTitle: (expanded) => ({
        px: expanded ? 0.5 : 0,
        mt: 0.5,
        mb: 1,
        color: "#64748b",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        textAlign: expanded ? "left" : "center",
    }),

    scrollArea: (expanded) => ({
        overflowY: "auto",
        flex: 1,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": { background: "#334155", borderRadius: 2 },
    }),

    topMenuBtn: (active, expanded) => ({
        minHeight: 48,
        borderRadius: 2,
        px: expanded ? 1.25 : 0,
        mb: 0.5,
        justifyContent: expanded ? "initial" : "center",
        background: active ? "#1e40af" : "transparent",
        border: "none",
        transition: "all .15s ease",
        "&:hover": {
            background: active ? "#1e40af" : "#1e293b",
        },
    }),

    topMenuIcon: (active) => ({
        width: 34,
        height: 34,
        borderRadius: 1.5,
        background: active ? "rgba(255,255,255,0.15)" : "#334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "#fff" : "#94a3b8",
        flexShrink: 0,
    }),

    groupCard: {
        mb: 0.75,
        borderRadius: 2,
        background: "transparent",
        overflow: "hidden",
    },

    groupBtn: (expanded) => ({
        minHeight: 48,
        borderRadius: 2,
        px: expanded ? 1.25 : 0,
        justifyContent: expanded ? "initial" : "center",
        transition: "all .15s ease",
        "&:hover": { background: "#1e293b" },
    }),

    groupIconWrap: (accent) => ({
        width: 34,
        height: 34,
        borderRadius: 1.5,
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        flexShrink: 0,
        "& svg": { fontSize: 18 },
    }),

    groupTitle: {
        color: "#e2e8f0",
        fontWeight: 600,
        fontSize: "0.82rem",
        lineHeight: 1.2,
    },

    groupCaption: {
        color: "#64748b",
        fontSize: 10,
        mt: 0.2,
    },

    childBtn: (active) => ({
        minHeight: 40,
        borderRadius: 1.5,
        px: 1.25,
        ml: 5.5,
        mr: 0.5,
        mb: 0.25,
        background: active ? "#1e40af" : "transparent",
        border: "none",
        color: active ? "#fff" : "#94a3b8",
        transition: "all .15s ease",
        "& .MuiListItemIcon-root": {
            color: active ? "#93c5fd" : "#64748b",
            minWidth: 28,
            "& svg": { fontSize: 18 },
        },
        "&:hover": {
            background: active ? "#1e40af" : "#1e293b",
            color: "#f1f5f9",
            "& .MuiListItemIcon-root": { color: "#93c5fd" },
        },
    }),

    collapsedIconBtn: (active) => ({
        minHeight: 44,
        borderRadius: 1.5,
        justifyContent: "center",
        mb: 0.5,
        background: active ? "#1e40af" : "transparent",
        border: "none",
        "&:hover": { background: active ? "#1e40af" : "#1e293b" },
    }),

    footer: {
        mt: "auto",
        borderRadius: 2,
        p: 1.25,
        background: "#1e293b",
    },

    footerAvatar: {
        width: 34,
        height: 34,
        borderRadius: 1.5,
        background: "#3b82f6",
        fontWeight: 600,
        fontSize: 14,
    },

    footerAvatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 1.5,
        background: "#3b82f6",
        fontWeight: 600,
        fontSize: 13,
    },
};
