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
    Chip,
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
    Bolt,
    AutoAwesome,
    FiberManualRecord,
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
                                    <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontSize: "0.84rem",
                                            fontWeight: active ? 900 : 700,
                                        }}
                                    />
                                    {active && (
                                        <FiberManualRecord sx={{ fontSize: 10, color: "#60a5fa" }} />
                                    )}
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
                        spacing={1.2}
                    >
                        {expanded ? (
                            <Stack direction="row" alignItems="center" spacing={1.3} sx={{ minWidth: 0 }}>
                                <Box sx={styles.logoBox}>
                                    <Dashboard sx={{ color: "#fff", fontSize: 22 }} />
                                </Box>

                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={styles.logoTitle}>BAPSİS</Typography>
                                    <Typography sx={styles.logoSubTitle}>
                                        Logistics Command Panel
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                                <Box sx={styles.logoBox}>
                                    <Dashboard sx={{ color: "#fff", fontSize: 22 }} />
                                </Box>
                            </Box>
                        )}

                        {!isMobile && expanded && (
                            <IconButton onClick={() => setOpen(false)} sx={styles.toggleBtn}>
                                <ChevronLeft />
                            </IconButton>
                        )}
                    </Stack>

                    {expanded ? (
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.4 }}>
                            <Chip icon={<Bolt sx={{ fontSize: 15 }} />} label="Ultra UI" sx={styles.miniBadge} />
                            <Chip
                                icon={<AutoAwesome sx={{ fontSize: 15 }} />}
                                label="Modern"
                                sx={styles.miniBadge}
                            />
                        </Stack>
                    ) : null}
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
                                                <>
                                                    <ListItemText
                                                        primary={item.text}
                                                        primaryTypographyProps={{
                                                            fontSize: "0.92rem",
                                                            fontWeight: 900,
                                                            color: "#fff",
                                                        }}
                                                    />
                                                    {active && (
                                                        <FiberManualRecord
                                                            sx={{ fontSize: 10, color: "#bfdbfe" }}
                                                        />
                                                    )}
                                                </>
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
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                            <Avatar sx={styles.footerAvatar} variant="rounded">
                                B
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>
                                    BAPSİS Panel
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 11 }}>
                                    Smart navigation experience
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
        background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 22%), radial-gradient(circle at bottom right, rgba(139,92,246,0.10), transparent 24%), linear-gradient(180deg, #050914 0%, #08101d 45%, #070e18 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        color: "#94a3b8",
        overflowX: "hidden",
        boxShadow: "16px 0 50px rgba(0,0,0,0.30)",
        backdropFilter: "blur(18px)",
        position: "relative",
        "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.00) 18%, rgba(255,255,255,0.02) 100%)",
        },
    },

    shell: (expanded) => ({
        position: "relative",
        zIndex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: expanded ? 2 : 1.5,
        py: 1.8,
        gap: 1.5,
    }),

    topCard: {
        borderRadius: 4,
        p: 1.5,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))",
        boxShadow: "0 16px 36px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
    },

    logoBox: {
        width: 44,
        height: 44,
        borderRadius: 3,
        background: "linear-gradient(135deg, #3b82f6, #2563eb 60%, #60a5fa)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 16px 30px rgba(37,99,235,0.34)",
        flexShrink: 0,
    },

    logoTitle: {
        color: "#fff",
        fontWeight: 950,
        fontSize: "1rem",
        letterSpacing: 1.4,
        lineHeight: 1.1,
    },

    logoSubTitle: {
        color: "rgba(255,255,255,0.48)",
        fontSize: 11,
        mt: 0.3,
    },

    toggleBtn: {
        color: "#dbeafe",
        width: 40,
        height: 40,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.045)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        "&:hover": { background: "rgba(255,255,255,0.08)" },
    },

    miniBadge: {
        height: 24,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 800,
        fontSize: 11,
    },

    sectionTitle: (expanded) => ({
        px: expanded ? 0.6 : 0,
        mt: 0.2,
        mb: 0.5,
        color: "rgba(255,255,255,0.34)",
        fontWeight: 900,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        textAlign: expanded ? "left" : "center",
    }),

    scrollArea: (expanded) => ({
        overflowY: "auto",
        pr: expanded ? 0.2 : 0,
        flex: 1,
    }),

    topMenuBtn: (active, expanded) => ({
        minHeight: 56,
        borderRadius: 4,
        px: expanded ? 1.4 : 0,
        mb: 1.1,
        justifyContent: expanded ? "initial" : "center",
        background: active
            ? "linear-gradient(135deg, rgba(59,130,246,0.28), rgba(37,99,235,0.18))"
            : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: active
            ? "1px solid rgba(96,165,250,0.35)"
            : "1px solid rgba(255,255,255,0.08)",
        boxShadow: active
            ? "0 14px 28px rgba(37,99,235,0.18)"
            : "0 10px 20px rgba(0,0,0,0.12)",
        transition: "all .18s ease",
        "&:hover": {
            background: "rgba(255,255,255,0.08)",
            transform: "translateY(-1px)",
        },
    }),

    topMenuIcon: (active) => ({
        width: 38,
        height: 38,
        borderRadius: 2.8,
        background: active
            ? "linear-gradient(135deg, #3b82f6, #2563eb)"
            : "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.12))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: active ? "0 12px 24px rgba(37,99,235,0.28)" : "none",
        color: "#fff",
        flexShrink: 0,
    }),

    groupCard: {
        mb: 1.1,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
        boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
        overflow: "hidden",
        backdropFilter: "blur(14px)",
    },

    groupBtn: (expanded) => ({
        minHeight: 58,
        borderRadius: 0,
        px: expanded ? 1.4 : 0,
        justifyContent: expanded ? "initial" : "center",
        transition: "all .2s ease",
        "&:hover": { background: "rgba(255,255,255,0.04)" },
    }),

    groupIconWrap: (accent) => ({
        width: 38,
        height: 38,
        borderRadius: 2.8,
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
        color: "#fff",
        flexShrink: 0,
    }),

    groupTitle: {
        color: "#eef6ff",
        fontWeight: 900,
        fontSize: "0.88rem",
        lineHeight: 1.1,
        letterSpacing: 0.2,
    },

    groupCaption: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 11,
        mt: 0.35,
    },

    childBtn: (active) => ({
        minHeight: 48,
        borderRadius: 3,
        px: 1.4,
        mx: 1,
        mb: 0.75,
        background: active
            ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(37,99,235,0.08))"
            : "transparent",
        border: active ? "1px solid rgba(96,165,250,0.22)" : "1px solid transparent",
        color: active ? "#fff" : "#9fb0c7",
        boxShadow: active ? "0 10px 24px rgba(0,0,0,0.18)" : "none",
        transition: "all .18s ease",
        "& .MuiListItemIcon-root": {
            color: active ? "#93c5fd" : "rgba(255,255,255,0.58)",
        },
        "&:hover": {
            background: "rgba(255,255,255,0.055)",
            color: "#fff",
            transform: "translateX(2px)",
            "& .MuiListItemIcon-root": { color: "#c4dbff" },
        },
    }),

    collapsedIconBtn: (active) => ({
        minHeight: 50,
        borderRadius: 3,
        justifyContent: "center",
        mb: 0.7,
        background: active ? "rgba(59,130,246,0.16)" : "rgba(255,255,255,0.02)",
        border: active
            ? "1px solid rgba(96,165,250,0.24)"
            : "1px solid rgba(255,255,255,0.05)",
        "&:hover": { background: "rgba(255,255,255,0.06)" },
    }),

    footer: {
        mt: "auto",
        borderRadius: 4,
        p: 1.4,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
    },

    footerAvatar: {
        width: 38,
        height: 38,
        borderRadius: 2.5,
        background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
        fontWeight: 900,
        boxShadow: "0 12px 24px rgba(37,99,235,0.28)",
    },

    footerAvatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 2.5,
        background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
        fontWeight: 900,
    },
};