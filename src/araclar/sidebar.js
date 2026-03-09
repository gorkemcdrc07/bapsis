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
    Divider,
    IconButton,
    Collapse,
    Tooltip,
    Avatar,
    Chip,
    Stack,
} from "@mui/material";
import {
    Dashboard,
    Assignment,
    LocalShipping,
    ChevronLeft,
    Menu,
    ExpandLess,
    ExpandMore,
    ManageAccounts,
    DirectionsCar,
    CarRepair,
    Bolt,
    AutoAwesome,
    FiberManualRecord,
} from "@mui/icons-material";

const groups = [
    {
        key: "kullaniciIslemleri",
        title: "Kullanıcı İşlemleri",
        caption: "Operasyon akışı",
        icon: <ManageAccounts />,
        accent: "linear-gradient(135deg, #3b82f6, #2563eb)",
        items: [
            { key: "siparisacilis", text: "Sipariş Açılış", icon: <Assignment /> },
            { key: "plakaatama", text: "Plaka Atama", icon: <LocalShipping /> },
            { key: "tamamlanan_seferler", text: "Tamamlanan Seferler", icon: <LocalShipping /> },
        ],
    },
    {
        key: "aracYonetimi",
        title: "Araç Yönetimi",
        caption: "Filo görünümü",
        icon: <DirectionsCar />,
        accent: "linear-gradient(135deg, #10b981, #059669)",
        items: [{ key: "aracbilgileri", text: "Araç Bilgileri", icon: <CarRepair /> }],
    },
    {
        key: "yeniKayitlar",
        title: "Yeni Kayıtlar",
        caption: "Tanım ekranları",
        icon: <Assignment />,
        accent: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
        items: [
            { key: "vkn_ekle", text: "VKN Ekle", icon: <ManageAccounts /> },
            { key: "ugrama_sarti_ekle", text: "Uğrama Şartı Ekle", icon: <LocalShipping /> },
            { key: "navlun_sarti_ekle", text: "Navlun Şartı Ekle", icon: <LocalShipping /> },
        ],
    },
];

function NavAction({ open, active, icon, label, onClick, primary = false }) {
    return (
        <ListItem disablePadding sx={{ mb: 1 }}>
            <Tooltip title={!open ? label : ""} placement="right" arrow>
                <ListItemButton
                    onClick={onClick}
                    sx={{
                        minHeight: 50,
                        borderRadius: 3.5,
                        px: open ? 2 : 0,
                        justifyContent: open ? "initial" : "center",
                        background: active
                            ? primary
                                ? "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.14))"
                                : "linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.05))"
                            : "rgba(255,255,255,0.025)",
                        border: active ? "1px solid rgba(96,165,250,0.30)" : "1px solid rgba(255,255,255,0.06)",
                        color: active ? "#fff" : "#94a3b8",
                        boxShadow: active ? "0 14px 30px rgba(0,0,0,0.22)" : "none",
                        transition: "all .22s ease",
                        "& .MuiListItemIcon-root": {
                            color: active ? "#93c5fd" : "rgba(255,255,255,0.62)",
                        },
                        "&:hover": {
                            transform: "translateY(-1px)",
                            background: primary
                                ? "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(37,99,235,0.10))"
                                : "rgba(255,255,255,0.06)",
                            color: "#fff",
                            borderColor: "rgba(255,255,255,0.11)",
                            "& .MuiListItemIcon-root": { color: "#c4dbff" },
                        },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.8 : 0, justifyContent: "center" }}>{icon}</ListItemIcon>
                    {open && (
                        <ListItemText
                            primary={label}
                            primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 900, letterSpacing: 0.15 }}
                        />
                    )}
                </ListItemButton>
            </Tooltip>
        </ListItem>
    );
}

export default function Sidebar({ open, setOpen, selected, onSelect }) {
    const drawerWidth = 298;
    const collapsedWidth = 92;

    const [expanded, setExpanded] = React.useState({
        kullaniciIslemleri: true,
        aracYonetimi: true,
        yeniKayitlar: true,
    });

    const toggleGroup = (key) => {
        setExpanded((p) => ({ ...p, [key]: !p[key] }));
    };

    const sx = {
        drawerPaper: {
            background:
                "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 22%), radial-gradient(circle at bottom right, rgba(139,92,246,0.10), transparent 24%), linear-gradient(180deg, #060913 0%, #0a1120 42%, #08111c 100%)",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            color: "#94a3b8",
            overflowX: "hidden",
            boxShadow: "16px 0 50px rgba(0,0,0,0.28)",
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
        shell: {
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            px: open ? 2 : 1.5,
            py: 1.8,
            gap: 1.5,
        },
        topCard: {
            borderRadius: 4,
            p: open ? 1.6 : 1.2,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
            boxShadow: "0 16px 36px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
            backdropFilter: "blur(16px)",
        },
        logoBox: {
            width: 42,
            height: 42,
            borderRadius: 3,
            background: "linear-gradient(135deg, #3b82f6, #2563eb 60%, #60a5fa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 16px 30px rgba(37,99,235,0.34)",
            flexShrink: 0,
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
        sectionTitle: {
            px: open ? 0.6 : 0,
            mt: 0.4,
            mb: 0.3,
            color: "rgba(255,255,255,0.34)",
            fontWeight: 900,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            textAlign: open ? "left" : "center",
        },
        groupCard: {
            mb: 1.1,
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
            boxShadow: "0 14px 28px rgba(0,0,0,0.16)",
            overflow: "hidden",
            backdropFilter: "blur(14px)",
        },
        groupBtn: {
            minHeight: 56,
            borderRadius: 0,
            px: open ? 1.4 : 0,
            justifyContent: open ? "initial" : "center",
            transition: "all .2s ease",
            "&:hover": { background: "rgba(255,255,255,0.04)" },
        },
        groupIconWrap: (accent) => ({
            width: 36,
            height: 36,
            borderRadius: 2.5,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
            color: "#fff",
            flexShrink: 0,
        }),
        childBtn: (active) => ({
            minHeight: 46,
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
            minHeight: 48,
            borderRadius: 3,
            justifyContent: "center",
            mb: 0.7,
            background: active ? "rgba(59,130,246,0.16)" : "rgba(255,255,255,0.02)",
            border: active ? "1px solid rgba(96,165,250,0.24)" : "1px solid rgba(255,255,255,0.05)",
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
    };

    return (
        <Drawer
            variant="permanent"
            open={open}
            sx={{
                width: open ? drawerWidth : collapsedWidth,
                flexShrink: 0,
                whiteSpace: "nowrap",
                boxSizing: "border-box",
                transition: (theme) =>
                    theme.transitions.create("width", {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                "& .MuiDrawer-paper": {
                    width: open ? drawerWidth : collapsedWidth,
                    transition: (theme) =>
                        theme.transitions.create("width", {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    ...sx.drawerPaper,
                },
            }}
        >
            <Box sx={sx.shell}>
                <Box sx={sx.topCard}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
                        {open ? (
                            <Stack direction="row" alignItems="center" spacing={1.3} sx={{ minWidth: 0 }}>
                                <Box sx={sx.logoBox}>
                                    <Dashboard sx={{ color: "#fff", fontSize: 22 }} />
                                </Box>

                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            color: "#fff",
                                            fontWeight: 950,
                                            fontSize: "1rem",
                                            letterSpacing: 1.4,
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        BAPSİS
                                    </Typography>
                                    <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 11, mt: 0.3 }}>
                                        Logistics Command Panel
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
                                <Box sx={sx.logoBox}>
                                    <Dashboard sx={{ color: "#fff", fontSize: 22 }} />
                                </Box>
                            </Box>
                        )}

                        {open && (
                            <IconButton onClick={() => setOpen(false)} sx={sx.toggleBtn}>
                                <ChevronLeft />
                            </IconButton>
                        )}
                    </Stack>

                    {open ? (
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.4 }}>
                            <Chip icon={<Bolt sx={{ fontSize: 15 }} />} label="Ultra UI" sx={sx.miniBadge} />
                            <Chip icon={<AutoAwesome sx={{ fontSize: 15 }} />} label="Modern" sx={sx.miniBadge} />
                        </Stack>
                    ) : (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 1.2 }}>
                            <IconButton onClick={() => setOpen(true)} sx={sx.toggleBtn}>
                                <Menu />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                <Box>
                    {open && <Typography sx={sx.sectionTitle}>Ana Navigasyon</Typography>}
                    <List sx={{ px: 0, py: 0.2 }}>
                        <NavAction
                            open={open}
                            active={selected === "anasayfa"}
                            label="Ana Sayfa"
                            icon={<Dashboard />}
                            onClick={() => onSelect("anasayfa")}
                            primary
                        />
                    </List>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

                <Box sx={{ overflowY: "auto", pr: open ? 0.2 : 0, flex: 1 }}>
                    {open && <Typography sx={sx.sectionTitle}>Modüller</Typography>}

                    <List sx={{ p: 0 }}>
                        {groups.map((group) => {
                            const isOpen = !!expanded[group.key];

                            return (
                                <Box key={group.key} sx={sx.groupCard}>
                                    <ListItem disablePadding>
                                        <Tooltip title={!open ? group.title : ""} placement="right" arrow>
                                            <ListItemButton onClick={() => toggleGroup(group.key)} sx={sx.groupBtn}>
                                                <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.4 : 0, justifyContent: "center" }}>
                                                    <Box sx={sx.groupIconWrap(group.accent)}>{group.icon}</Box>
                                                </ListItemIcon>

                                                {open && (
                                                    <>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography sx={{ color: "#eef6ff", fontWeight: 900, fontSize: "0.84rem", lineHeight: 1.1 }}>
                                                                {group.title}
                                                            </Typography>
                                                            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 11, mt: 0.35 }}>
                                                                {group.caption}
                                                            </Typography>
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

                                    <Collapse in={open ? isOpen : false} timeout="auto" unmountOnExit>
                                        <List sx={{ pb: 0.6 }}>
                                            {group.items.map((item) => {
                                                const active = selected === item.key;
                                                return (
                                                    <ListItem key={item.key} disablePadding>
                                                        <ListItemButton onClick={() => onSelect(item.key)} sx={sx.childBtn(active)}>
                                                            <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
                                                            <ListItemText
                                                                primary={item.text}
                                                                primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: active ? 900 : 700 }}
                                                            />
                                                            {active && <FiberManualRecord sx={{ fontSize: 10, color: "#60a5fa" }} />}
                                                        </ListItemButton>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>

                                    {!open && (
                                        <List sx={{ px: 1, pb: 1 }}>
                                            {group.items.map((item) => {
                                                const active = selected === item.key;
                                                return (
                                                    <ListItem key={item.key} disablePadding>
                                                        <Tooltip title={item.text} placement="right" arrow>
                                                            <ListItemButton onClick={() => onSelect(item.key)} sx={sx.collapsedIconBtn(active)}>
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
                        })}
                    </List>
                </Box>

                <Box sx={sx.footer}>
                    {open ? (
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                            <Avatar
                                variant="rounded"
                                sx={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 2.5,
                                    background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                    fontWeight: 900,
                                    boxShadow: "0 12px 24px rgba(37,99,235,0.28)",
                                }}
                            >
                                B
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>BAPSİS Panel</Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 11 }}>
                                    Smart navigation experience
                                </Typography>
                            </Box>
                        </Stack>
                    ) : (
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Avatar
                                variant="rounded"
                                sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 2.5,
                                    background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                                    fontWeight: 900,
                                }}
                            >
                                B
                            </Avatar>
                        </Box>
                    )}
                </Box>
            </Box>
        </Drawer>
    );
}
