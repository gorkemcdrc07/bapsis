import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    InputAdornment,
    Fade,
    Avatar,
    Stack,
} from "@mui/material";

import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import MailIcon from "@mui/icons-material/Mail";
import LockIcon from "@mui/icons-material/Lock";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import Groups2Icon from "@mui/icons-material/Groups2";
import BadgeIcon from "@mui/icons-material/Badge";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import PersonOffRoundedIcon from "@mui/icons-material/PersonOffRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import { supabase } from "../../supabase";

export default function KullanicilarSayfasi() {
    const [form, setForm] = useState({
        kullanici: "",
        mail: "",
        sifre: "",
        rol: "",
    });

    const [rows, setRows] = useState([]);
    const [roles, setRoles] = useState([]);
    const [arama, setArama] = useState("");
    const [loading, setLoading] = useState(true);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const showMsg = (type, text) => {
        setMessage({ type, text });
        window.clearTimeout(showMsg._t);
        showMsg._t = window.setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const normalizeRoleCode = (value) => String(value || "").trim().toUpperCase();
    const isAdminRole = (value) => normalizeRoleCode(value) === "ADMIN";

    const fetchRoles = async () => {
        setRolesLoading(true);

        const { data, error } = await supabase
            .from("roller")
            .select("id, kod, ad, aktif, olusturma_tarihi")
            .eq("aktif", true)
            .order("ad", { ascending: true });

        if (error) {
            showMsg("error", `Roller alınamadı: ${error.message}`);
            setRoles([]);
        } else {
            const list = (data ?? [])
                .filter((r) => r && r.id && r.kod && r.ad)
                .filter((r) => !isAdminRole(r.kod));

            setRoles(list);

            setForm((prev) => {
                const mevcutRolGecerli = list.some((r) => r.kod === prev.rol);
                if (mevcutRolGecerli) return prev;

                return {
                    ...prev,
                    rol: list.length > 0 ? list[0].kod : "",
                };
            });
        }

        setRolesLoading(false);
    };

    const fetchUsers = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("kullanicilar")
            .select("id, kullanici, mail, sifre, rol, rol_id, olusturma_tarihi")
            .order("olusturma_tarihi", { ascending: false });

        if (error) {
            showMsg("error", error.message);
            setRows([]);
        } else {
            setRows(data ?? []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchRoles();
        fetchUsers();
    }, []);

    const filteredRows = useMemo(() => {
        const q = arama.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((u) => {
            const kullanici = String(u.kullanici || "").toLowerCase();
            const mail = String(u.mail || "").toLowerCase();
            const rol = String(u.rol || "").toLowerCase();
            return kullanici.includes(q) || mail.includes(q) || rol.includes(q);
        });
    }, [rows, arama]);

    const getRoleLabel = (kod) => {
        const role = roles.find((r) => r.kod === kod);
        return role ? role.ad : kod || "—";
    };

    const submit = async () => {
        const selectedRole = roles.find((r) => r.kod === form.rol);

        const payload = {
            kullanici: form.kullanici.trim(),
            mail: form.mail.trim(),
            sifre: form.sifre,
            rol: String(form.rol || "").trim(),
            rol_id: selectedRole?.id || null,
        };

        if (!payload.kullanici || !payload.mail || !payload.sifre || !payload.rol) {
            showMsg("error", "Lütfen tüm alanları eksiksiz doldurun.");
            return;
        }

        if (isAdminRole(payload.rol)) {
            showMsg("error", "Admin rolü bu ekrandan atanamaz.");
            return;
        }

        const roleKodlari = roles.map((r) => r.kod);
        if (roleKodlari.length > 0 && !roleKodlari.includes(payload.rol)) {
            showMsg("error", "Seçilen rol listede yok. Lütfen tekrar deneyin.");
            return;
        }

        if (!payload.rol_id) {
            showMsg("error", "Seçilen role ait rol_id bulunamadı.");
            return;
        }

        setSaving(true);

        const { error } = await supabase.from("kullanicilar").insert([payload]);

        if (error) {
            showMsg("error", error.message);
        } else {
            showMsg("success", "Yeni kullanıcı başarıyla tanımlandı.");
            setForm((p) => ({
                ...p,
                kullanici: "",
                mail: "",
                sifre: "",
            }));
            await fetchUsers();
        }

        setSaving(false);
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;

        const { error } = await supabase.from("kullanicilar").delete().eq("id", id);

        if (error) {
            showMsg("error", error.message);
        } else {
            showMsg("success", "Kullanıcı silindi.");
            fetchUsers();
        }
    };

    const refreshAll = async () => {
        await fetchRoles();
        await fetchUsers();
    };

    const roleChipSx = (role) => {
        const r = normalizeRoleCode(role);

        if (r === "YONETICI" || r === "YÖNETİCİ") {
            return {
                fontWeight: 800,
                bgcolor: "rgba(16, 185, 129, 0.16)",
                color: "#86efac",
                border: "1px solid rgba(16,185,129,0.24)",
            };
        }

        if (r === "TAKIP") {
            return {
                fontWeight: 800,
                bgcolor: "rgba(168, 85, 247, 0.16)",
                color: "#d8b4fe",
                border: "1px solid rgba(168,85,247,0.24)",
            };
        }

        if (r === "ADMIN") {
            return {
                fontWeight: 800,
                bgcolor: "rgba(239, 68, 68, 0.16)",
                color: "#fca5a5",
                border: "1px solid rgba(239,68,68,0.24)",
            };
        }

        return {
            fontWeight: 800,
            bgcolor: "rgba(59, 130, 246, 0.16)",
            color: "#93c5fd",
            border: "1px solid rgba(59,130,246,0.24)",
        };
    };

    return (
        <Box sx={styles.page}>
            <Box sx={styles.glowOne} />
            <Box sx={styles.glowTwo} />

            <Paper sx={styles.heroCard}>
                <Box sx={styles.heroContent}>
                    <Stack spacing={1.1} sx={{ maxWidth: 760 }}>
                        <Typography sx={styles.eyebrow}>USER MANAGEMENT PANEL</Typography>
                        <Typography sx={styles.title}>
                            Kullanıcı ve Rol Yönetimini
                            <Box component="span" sx={styles.titleAccent}>
                                {" "}
                                daha temiz, modern ve okunabilir{" "}
                            </Box>
                            hale getirin
                        </Typography>
                        <Typography sx={styles.subtitle}>
                            Kullanıcı ekleme, rol atama ve mevcut kayıtları yönetme işlemleri tek ekranda,
                            daha sade kart yapısı ve güçlü görsel hiyerarşi ile sunulur.
                        </Typography>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                        <Button
                            startIcon={<RefreshIcon />}
                            onClick={refreshAll}
                            sx={styles.btnSecondary}
                            disabled={loading || rolesLoading}
                        >
                            Verileri Yenile
                        </Button>
                    </Stack>
                </Box>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={styles.metricCard}>
                            <Box sx={styles.metricIconBlue}>
                                <Groups2Icon />
                            </Box>
                            <Box>
                                <Typography sx={styles.metricValue}>{rows.length}</Typography>
                                <Typography sx={styles.metricLabel}>Toplam Kullanıcı</Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={styles.metricCard}>
                            <Box sx={styles.metricIconGreen}>
                                <VerifiedUserRoundedIcon />
                            </Box>
                            <Box>
                                <Typography sx={styles.metricValue}>{roles.length}</Typography>
                                <Typography sx={styles.metricLabel}>Aktif Rol</Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={styles.metricCard}>
                            <Box sx={styles.metricIconAmber}>
                                <ShieldRoundedIcon />
                            </Box>
                            <Box>
                                <Typography sx={styles.metricValue}>ADMIN Kısıtlı</Typography>
                                <Typography sx={styles.metricLabel}>Güvenlik politikası açık</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>

            {message.text && (
                <Fade in={!!message.text}>
                    <Alert severity={message.type} sx={styles.alert}>
                        {message.text}
                    </Alert>
                </Fade>
            )}

            <Grid container spacing={3} alignItems="stretch">
                <Grid item xs={12} lg={5} xl={4.5}>
                    <Paper sx={styles.formCard}>
                        <Box sx={styles.sectionHeaderCompact}>
                            <Box sx={styles.sectionHeaderIconBlue}>
                                <PersonAddAltIcon />
                            </Box>
                            <Box>
                                <Typography sx={styles.sectionTitle}>Yeni Kullanıcı Oluştur</Typography>
                                <Typography sx={styles.sectionSubTitle}>
                                    Kullanıcı tanımlayın ve güvenli rol atayın
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={styles.divider} />

                        <Box sx={styles.formContentDense}>
                            <TextField
                                fullWidth
                                label="Kullanıcı Adı"
                                value={form.kullanici}
                                onChange={(e) => setForm((p) => ({ ...p, kullanici: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: "#94a3b8" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={styles.input}
                            />

                            <TextField
                                fullWidth
                                label="E-posta Adresi"
                                value={form.mail}
                                onChange={(e) => setForm((p) => ({ ...p, mail: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MailIcon sx={{ color: "#94a3b8" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={styles.input}
                            />

                            <TextField
                                fullWidth
                                label="Şifre"
                                type="password"
                                value={form.sifre}
                                onChange={(e) => setForm((p) => ({ ...p, sifre: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon sx={{ color: "#94a3b8" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={styles.input}
                            />

                            <Select
                                fullWidth
                                value={form.rol}
                                onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                                sx={styles.select}
                                displayEmpty
                                renderValue={(val) => {
                                    if (!val) return rolesLoading ? "ROLLER YÜKLENİYOR..." : "ROL SEÇİN";
                                    const selected = roles.find((r) => r.kod === val);
                                    return selected ? `${selected.ad} (${selected.kod})` : String(val);
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            bgcolor: "#081120",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "18px",
                                            backdropFilter: "blur(20px)",
                                            mt: 1,
                                            "& .MuiMenuItem-root": { color: "#fff", py: 1.2 },
                                            "& .MuiMenuItem-root.Mui-selected": {
                                                bgcolor: "rgba(59,130,246,0.16)",
                                            },
                                            "& .MuiMenuItem-root:hover": {
                                                bgcolor: "rgba(255,255,255,0.06)",
                                            },
                                        },
                                    },
                                }}
                            >
                                {rolesLoading ? (
                                    <MenuItem disabled value="">
                                        Roller yükleniyor...
                                    </MenuItem>
                                ) : roles.length === 0 ? (
                                    <MenuItem disabled value="">
                                        Uygun rol bulunamadı
                                    </MenuItem>
                                ) : (
                                    roles.map((r) => (
                                        <MenuItem key={r.id} value={r.kod}>
                                            {r.ad} ({r.kod})
                                        </MenuItem>
                                    ))
                                )}
                            </Select>

                            <Paper elevation={0} sx={styles.securityNoteCompact}>
                                <Box sx={styles.securityIconWrap}>
                                    <ShieldRoundedIcon sx={{ fontSize: 18 }} />
                                </Box>
                                <Box>
                                    <Typography sx={styles.securityTitle}>Güvenlik Notu</Typography>
                                    <Typography sx={styles.securityText}>
                                        <b>ADMIN</b> rolü bu ekrandan atanamaz.
                                    </Typography>
                                </Box>
                            </Paper>

                            <Button
                                fullWidth
                                onClick={submit}
                                disabled={saving || rolesLoading || roles.length === 0}
                                variant="contained"
                                sx={styles.btnPrimary}
                                startIcon={!saving ? <AdminPanelSettingsIcon /> : null}
                            >
                                {saving ? <CircularProgress size={22} color="inherit" /> : "Kullanıcıyı Oluştur"}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={7} xl={7.5}>
                    <Paper sx={styles.tableCardLarge}>
                        <Box sx={styles.sectionHeaderTableWide}>
                            <Box sx={styles.sectionHeaderIconGreen}>
                                <BadgeIcon />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={styles.sectionTitle}>Kullanıcı Listesi</Typography>
                                <Typography sx={styles.sectionSubTitle}>
                                    Masaüstü kullanımına uygun geniş görünüm
                                </Typography>
                            </Box>

                            <TextField
                                size="small"
                                placeholder="Kullanıcı, mail veya rol ara..."
                                value={arama}
                                onChange={(e) => setArama(e.target.value)}
                                sx={styles.searchInputWide}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon sx={{ color: "#64748b", fontSize: 18 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Divider sx={styles.divider} />

                        <Box sx={styles.tableWrapDesktop}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={styles.tableHeadRow}>
                                        <TableCell sx={styles.th}>Kullanıcı</TableCell>
                                        <TableCell sx={styles.th}>Rol</TableCell>
                                        <TableCell sx={styles.th}>Rol ID</TableCell>
                                        <TableCell sx={styles.th}>Oluşturulma Tarihi</TableCell>
                                        <TableCell sx={styles.th} align="right">
                                            İşlem
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 10, borderBottom: 0 }}>
                                                <CircularProgress size={30} sx={{ color: "#60a5fa" }} />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 10, borderBottom: 0 }}>
                                                <Stack alignItems="center" spacing={1.2}>
                                                    <Box sx={styles.emptyIconWrap}>
                                                        <PersonOffRoundedIcon sx={{ color: "#64748b", fontSize: 34 }} />
                                                    </Box>
                                                    <Typography sx={{ color: "#cbd5e1", fontWeight: 700 }}>
                                                        Gösterilecek kullanıcı bulunamadı
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRows.map((u) => (
                                            <TableRow key={u.id} hover sx={styles.tableRow}>
                                                <TableCell sx={styles.td}>
                                                    <Box sx={styles.userCell}>
                                                        <Avatar sx={styles.avatar}>
                                                            {String(u.kullanici || "?").charAt(0).toUpperCase()}
                                                        </Avatar>

                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography sx={styles.userName}>{u.kullanici}</Typography>
                                                            <Typography sx={styles.userMail}>{u.mail}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                <TableCell sx={styles.td}>
                                                    <Chip
                                                        label={String(getRoleLabel(u.rol) || "—").toUpperCase()}
                                                        size="small"
                                                        sx={{ ...styles.roleChip, ...roleChipSx(u.rol) }}
                                                    />
                                                </TableCell>

                                                <TableCell sx={styles.td}>
                                                    <Typography sx={styles.metaText}>{u.rol_id || "—"}</Typography>
                                                </TableCell>

                                                <TableCell sx={styles.td}>
                                                    <Typography sx={styles.dateText}>
                                                        {u.olusturma_tarihi
                                                            ? new Date(u.olusturma_tarihi).toLocaleString("tr-TR")
                                                            : "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell sx={styles.td} align="right">
                                                    <Tooltip title="Sil">
                                                        <IconButton onClick={() => deleteUser(u.id)} sx={styles.deleteBtn}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Box>

                        <Divider sx={styles.divider} />

                        <Box sx={styles.footerInfo}>
                            <ChevronRightRoundedIcon sx={{ fontSize: 18, color: "#3b82f6", mt: "2px" }} />
                            <Typography sx={styles.footerText}>
                                Roller <b>roller</b> tablosundan okunur. Kullanıcı eklenirken <b>rol</b> ve{" "}
                                <b>rol_id</b> birlikte yazılır. <b>ADMIN</b> rolü güvenlik nedeniyle listeden çıkarılır.
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

const glassPanel = {
    background: "linear-gradient(180deg, rgba(10,18,33,0.92), rgba(15,23,42,0.84))",
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 24px 80px rgba(2, 8, 23, 0.42)",
    backdropFilter: "blur(18px)",
};

const styles = {
    page: {
        position: "relative",
        px: { xs: 1.5, md: 3 },
        py: { xs: 2, md: 3.5 },
        maxWidth: 1480,
        mx: "auto",
        minHeight: "100%",
        overflow: "hidden",
        background:
            "radial-gradient(circle at 0% 0%, rgba(37,99,235,0.12), transparent 24%), radial-gradient(circle at 100% 10%, rgba(52,211,153,0.10), transparent 22%), linear-gradient(180deg, #020617 0%, #081120 100%)",
    },
    glowOne: {
        position: "absolute",
        top: -120,
        left: -80,
        width: 260,
        height: 260,
        borderRadius: "50%",
        background: "rgba(37,99,235,0.18)",
        filter: "blur(90px)",
        pointerEvents: "none",
    },
    glowTwo: {
        position: "absolute",
        right: -100,
        top: 80,
        width: 260,
        height: 260,
        borderRadius: "50%",
        background: "rgba(16,185,129,0.14)",
        filter: "blur(100px)",
        pointerEvents: "none",
    },
    heroCard: {
        ...glassPanel,
        position: "relative",
        zIndex: 1,
        borderRadius: "26px",
        p: { xs: 2, md: 3 },
        mb: 2.5,
        overflow: "hidden",
        minHeight: 250,
    },
    heroContent: {
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
        alignItems: "flex-start",
        mb: 2.5,
    },
    eyebrow: {
        color: "#60a5fa",
        fontSize: "0.76rem",
        fontWeight: 900,
        letterSpacing: "0.34em",
        textTransform: "uppercase",
    },
    title: {
        color: "#f8fafc",
        fontSize: { xs: "1.8rem", md: "2.8rem", xl: "3.1rem" },
        fontWeight: 900,
        lineHeight: 1.02,
        letterSpacing: "-0.05em",
        maxWidth: 900,
    },
    titleAccent: {
        color: "#34d399",
        textShadow: "0 0 24px rgba(52,211,153,0.16)",
    },
    subtitle: {
        color: "#94a3b8",
        mt: 0.5,
        fontSize: { xs: "0.95rem", md: "1rem" },
        lineHeight: 1.7,
    },
    metricCard: {
        ...glassPanel,
        borderRadius: "20px",
        p: 1.8,
        display: "flex",
        alignItems: "center",
        gap: 1.4,
        height: "100%",
        minHeight: 92,
    },
    metricIconBlue: {
        width: 52,
        height: 52,
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        color: "#93c5fd",
        background: "rgba(59,130,246,0.14)",
        border: "1px solid rgba(59,130,246,0.20)",
    },
    metricIconGreen: {
        width: 52,
        height: 52,
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        color: "#6ee7b7",
        background: "rgba(16,185,129,0.14)",
        border: "1px solid rgba(16,185,129,0.20)",
    },
    metricIconAmber: {
        width: 52,
        height: 52,
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        color: "#fcd34d",
        background: "rgba(245,158,11,0.14)",
        border: "1px solid rgba(245,158,11,0.20)",
    },
    metricValue: {
        color: "#fff",
        fontWeight: 900,
        fontSize: "1.3rem",
        lineHeight: 1.05,
    },
    metricLabel: {
        color: "#94a3b8",
        fontSize: "0.84rem",
        mt: 0.35,
    },
    alert: {
        position: "relative",
        zIndex: 1,
        mb: 3,
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(15,23,42,0.92)",
        color: "#fff",
    },
    formCard: {
        ...glassPanel,
        position: "relative",
        zIndex: 1,
        borderRadius: "24px",
        overflow: "hidden",
        height: "100%",
        minHeight: 100,
    },
    tableCard: {
        ...glassPanel,
        position: "relative",
        zIndex: 1,
        borderRadius: "24px",
        overflow: "hidden",
    },
    tableCardLarge: {
        ...glassPanel,
        position: "relative",
        zIndex: 1,
        borderRadius: "24px",
        overflow: "hidden",
        minHeight: 640,
    },
    sectionHeader: {
        p: 2.25,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
    },
    sectionHeaderCompact: {
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
    },
    sectionHeaderTable: {
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
    },
    sectionHeaderTableWide: {
        p: 2.1,
        display: "flex",
        alignItems: "center",
        gap: 1.2,
    },
    sectionHeaderIconBlue: {
        width: 50,
        height: 50,
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        color: "#93c5fd",
        background: "rgba(59,130,246,0.12)",
        border: "1px solid rgba(59,130,246,0.20)",
        flexShrink: 0,
    },
    sectionHeaderIconGreen: {
        width: 50,
        height: 50,
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        color: "#6ee7b7",
        background: "rgba(16,185,129,0.12)",
        border: "1px solid rgba(16,185,129,0.20)",
        flexShrink: 0,
    },
    sectionTitle: {
        color: "#fff",
        fontWeight: 900,
        fontSize: "1.05rem",
        lineHeight: 1.1,
    },
    sectionSubTitle: {
        color: "#64748b",
        fontSize: "0.84rem",
        mt: 0.35,
    },
    divider: {
        borderColor: "rgba(255,255,255,0.06)",
    },
    formContent: {
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        gap: 2,
    },
    formContentDense: {
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.2,
    },
    input: {
        "& .MuiInputLabel-root": { color: "#94a3b8" },
        "& .MuiInputLabel-root.Mui-focused": { color: "#cbd5e1" },
        "& .MuiOutlinedInput-root": {
            borderRadius: "16px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "#fff",
            transition: "all .2s ease",
            "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset": { borderColor: "rgba(96,165,250,0.35)" },
            "&.Mui-focused": {
                bgcolor: "rgba(15,23,42,0.88)",
                boxShadow: "0 0 0 4px rgba(59,130,246,0.10)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
            },
        },
        "& .MuiInputBase-input": { color: "#fff" },
    },
    select: {
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.03)",
        color: "#fff",
        minHeight: 56,
        "& .MuiSelect-select": { color: "#fff", display: "flex", alignItems: "center" },
        "& .MuiSvgIcon-root": { color: "#94a3b8" },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.08)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(96,165,250,0.35)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3b82f6",
        },
    },
    securityNote: {
        display: "flex",
        gap: 1.4,
        p: 1.6,
        borderRadius: "18px",
        background: "linear-gradient(180deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))",
        border: "1px solid rgba(245,158,11,0.14)",
    },
    securityNoteCompact: {
        display: "flex",
        gap: 1.1,
        p: 1.2,
        borderRadius: "14px",
        background: "linear-gradient(180deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))",
        border: "1px solid rgba(245,158,11,0.14)",
    },
    securityIconWrap: {
        width: 34,
        height: 34,
        borderRadius: "12px",
        display: "grid",
        placeItems: "center",
        color: "#fbbf24",
        background: "rgba(245,158,11,0.12)",
        flexShrink: 0,
    },
    securityTitle: {
        color: "#fef3c7",
        fontWeight: 800,
        fontSize: "0.84rem",
        mb: 0.35,
    },
    securityText: {
        color: "#cbd5e1",
        fontSize: "0.82rem",
        lineHeight: 1.65,
    },
    btnPrimary: {
        py: 1.6,
        borderRadius: "16px",
        fontWeight: 800,
        textTransform: "none",
        fontSize: "0.98rem",
        background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 55%, #60a5fa 100%)",
        boxShadow: "0 16px 30px rgba(37,99,235,0.32)",
        "&:hover": {
            background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 55%, #60a5fa 100%)",
            transform: "translateY(-1px)",
            boxShadow: "0 20px 34px rgba(37,99,235,0.36)",
        },
        "&.Mui-disabled": {
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.08)",
        },
    },
    btnSecondary: {
        color: "#e2e8f0",
        textTransform: "none",
        fontWeight: 700,
        borderRadius: "14px",
        px: 2,
        py: 1.1,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        "&:hover": {
            bgcolor: "rgba(255,255,255,0.08)",
            borderColor: "rgba(96,165,250,0.30)",
        },
    },
    searchInput: {
        width: { xs: "100%", sm: 260 },
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "#fff",
            "& fieldset": {
                borderColor: "rgba(255,255,255,0.08)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(96,165,250,0.35)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
            },
        },
        "& .MuiInputBase-input": {
            color: "#fff",
        },
    },
    searchInputWide: {
        width: { xs: "100%", md: 320 },
        minWidth: { md: 260 },
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "#fff",
            "& fieldset": {
                borderColor: "rgba(255,255,255,0.08)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(96,165,250,0.35)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
            },
        },
        "& .MuiInputBase-input": {
            color: "#fff",
        },
    },
    tableWrapDesktop: {
        width: "100%",
        overflowX: "auto",
    },
    tableHeadRow: {
        bgcolor: "rgba(255,255,255,0.02)",
    },
    th: {
        color: "#64748b",
        fontWeight: 900,
        fontSize: "0.72rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        borderColor: "rgba(255,255,255,0.06)",
        py: 1.8,
    },
    td: {
        borderColor: "rgba(255,255,255,0.06)",
        py: 2,
        color: "#e2e8f0",
    },
    tableRow: {
        transition: "all .18s ease",
        "&:hover": {
            bgcolor: "rgba(255,255,255,0.03) !important",
        },
    },
    userCell: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minWidth: 0,
    },
    avatar: {
        width: 44,
        height: 44,
        fontSize: "0.95rem",
        fontWeight: 900,
        color: "#fff",
        background: "linear-gradient(135deg, #2563eb, #34d399)",
        boxShadow: "0 10px 22px rgba(37,99,235,0.24)",
    },
    userName: {
        fontWeight: 800,
        fontSize: "0.95rem",
        color: "#f8fafc",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userMail: {
        fontSize: "0.81rem",
        color: "#64748b",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        mt: 0.25,
    },
    roleChip: {
        borderRadius: "999px",
        px: 0.4,
        fontSize: "0.72rem",
        letterSpacing: "0.02em",
    },
    dateText: {
        fontSize: "0.84rem",
        color: "#94a3b8",
        fontWeight: 500,
    },
    metaText: {
        fontSize: "0.84rem",
        color: "#cbd5e1",
        fontWeight: 600,
    },
    deleteBtn: {
        color: "#f87171",
        border: "1px solid rgba(248,113,113,0.14)",
        background: "rgba(239,68,68,0.06)",
        "&:hover": {
            bgcolor: "rgba(239,68,68,0.14)",
        },
    },
    emptyIconWrap: {
        width: 70,
        height: 70,
        borderRadius: "22px",
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    footerInfo: {
        p: 2,
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
    },
    footerText: {
        color: "#64748b",
        fontSize: 12.5,
        lineHeight: 1.7,
    },
};