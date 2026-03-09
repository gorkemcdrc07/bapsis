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

import { supabase } from "../../supabase";

export default function KullanicilarSayfasi() {
    const [form, setForm] = useState({
        kullanici: "",
        mail: "",
        sifre: "",
        rol: "", // kullanicilar tablosuna yazılacak değer
    });

    const [rows, setRows] = useState([]);
    const [roles, setRoles] = useState([]); // [{ id, kod, ad, aktif, olusturma_tarihi }]
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

    const normalizeRoleCode = (value) =>
        String(value || "").trim().toUpperCase();

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
                .filter((r) => r && r.kod && r.ad)
                .filter((r) => !isAdminRole(r.kod)); // ADMIN rolü asla seçilemez

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
            .select("id, kullanici, mail, sifre, rol, olusturma_tarihi")
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
        const payload = {
            kullanici: form.kullanici.trim(),
            mail: form.mail.trim(),
            sifre: form.sifre,
            rol: String(form.rol || "").trim(), // DB’ye kod yazıyoruz
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
                fontSize: "0.72rem",
                bgcolor: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: "999px",
            };
        }

        if (r === "TAKIP") {
            return {
                fontWeight: 800,
                fontSize: "0.72rem",
                bgcolor: "rgba(168, 85, 247, 0.12)",
                color: "#a855f7",
                border: "1px solid rgba(168,85,247,0.25)",
                borderRadius: "999px",
            };
        }

        if (r === "ADMIN") {
            return {
                fontWeight: 800,
                fontSize: "0.72rem",
                bgcolor: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "999px",
            };
        }

        return {
            fontWeight: 800,
            fontSize: "0.72rem",
            bgcolor: "rgba(59, 130, 246, 0.12)",
            color: "#3b82f6",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: "999px",
        };
    };

    return (
        <Box sx={styles.page}>
            <Box sx={styles.hero}>
                <Box>
                    <Typography sx={styles.eyebrow}>USER MANAGEMENT</Typography>
                    <Typography sx={styles.title}>
                        Kullanıcı &{" "}
                        <Typography component="span" sx={styles.titleAccent}>
                            Rol Yönetimi
                        </Typography>
                    </Typography>
                    <Typography sx={styles.subtitle}>
                        Sistem kullanıcılarını yönetin, rollerini belirleyin ve sadece yetkili rolleri atayın.
                    </Typography>
                </Box>

                <Button
                    startIcon={<RefreshIcon />}
                    onClick={refreshAll}
                    sx={styles.btnGhost}
                    disabled={loading || rolesLoading}
                >
                    Yenile
                </Button>
            </Box>

            {message.text && (
                <Fade in={!!message.text}>
                    <Alert severity={message.type} sx={styles.alert}>
                        {message.text}
                    </Alert>
                </Fade>
            )}

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={styles.statCard}>
                        <Box sx={styles.statIconWrap}>
                            <Groups2Icon sx={{ color: "#60a5fa" }} />
                        </Box>
                        <Box>
                            <Typography sx={styles.statValue}>{rows.length}</Typography>
                            <Typography sx={styles.statLabel}>Toplam Kullanıcı</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={styles.statCard}>
                        <Box sx={styles.statIconWrap}>
                            <VerifiedUserRoundedIcon sx={{ color: "#34d399" }} />
                        </Box>
                        <Box>
                            <Typography sx={styles.statValue}>{roles.length}</Typography>
                            <Typography sx={styles.statLabel}>Seçilebilir Rol</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={styles.statCard}>
                        <Box sx={styles.statIconWrap}>
                            <ShieldRoundedIcon sx={{ color: "#fbbf24" }} />
                        </Box>
                        <Box>
                            <Typography sx={styles.statValue}>ADMIN Kapalı</Typography>
                            <Typography sx={styles.statLabel}>Güvenlik Kuralı Aktif</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={4}>
                    <Paper sx={styles.formCard}>
                        <Box sx={styles.cardHeader}>
                            <Box sx={styles.cardHeaderIcon}>
                                <PersonAddAltIcon sx={{ color: "#60a5fa" }} />
                            </Box>
                            <Box>
                                <Typography sx={styles.cardTitle}>Yeni Kullanıcı</Typography>
                                <Typography sx={styles.cardSubTitle}>
                                    Kullanıcı oluştur ve güvenli rol ata
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={styles.divider} />

                        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.2 }}>
                            <TextField
                                fullWidth
                                label="Kullanıcı Adı"
                                value={form.kullanici}
                                onChange={(e) => setForm((p) => ({ ...p, kullanici: e.target.value }))}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: "#64748b" }} />
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
                                            <MailIcon sx={{ color: "#64748b" }} />
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
                                            <LockIcon sx={{ color: "#64748b" }} />
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
                                            bgcolor: "#0b1220",
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "16px",
                                            backdropFilter: "blur(20px)",
                                            "& .MuiMenuItem-root": { color: "#fff" },
                                            "& .MuiMenuItem-root.Mui-selected": {
                                                bgcolor: "rgba(59,130,246,0.18)",
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

                            <Paper sx={styles.infoNote} elevation={0}>
                                <ShieldRoundedIcon sx={{ fontSize: 18, color: "#fbbf24" }} />
                                <Typography sx={styles.infoNoteText}>
                                    Güvenlik gereği <b>ADMIN</b> kodlu rol bu ekrandan seçilemez ve atanamaz.
                                </Typography>
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

                <Grid item xs={12} lg={8}>
                    <Paper sx={styles.tableCard}>
                        <Box sx={styles.cardHeader}>
                            <Box sx={styles.cardHeaderIcon}>
                                <BadgeIcon sx={{ color: "#34d399" }} />
                            </Box>

                            <Box sx={{ flex: 1 }}>
                                <Typography sx={styles.cardTitle}>Kullanıcı Listesi</Typography>
                                <Typography sx={styles.cardSubTitle}>
                                    Tanımlı kullanıcıları görüntüleyin ve yönetin
                                </Typography>
                            </Box>

                            <TextField
                                size="small"
                                placeholder="Kullanıcı, mail veya rol ara..."
                                value={arama}
                                onChange={(e) => setArama(e.target.value)}
                                sx={styles.searchInput}
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

                        <Box sx={{ overflowX: "auto" }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                                        <TableCell sx={styles.th}>Kullanıcı</TableCell>
                                        <TableCell sx={styles.th}>Rol</TableCell>
                                        <TableCell sx={styles.th}>Tarih</TableCell>
                                        <TableCell sx={styles.th} align="right">
                                            İşlem
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                                <CircularProgress size={30} sx={{ color: "#60a5fa" }} />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                                    <PersonOffRoundedIcon sx={{ color: "#334155", fontSize: 34 }} />
                                                    <Typography sx={{ color: "#94a3b8" }}>
                                                        Gösterilecek kullanıcı bulunamadı.
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRows.map((u) => (
                                            <TableRow key={u.id} hover sx={styles.tableRow}>
                                                <TableCell sx={styles.td}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                        <Avatar sx={styles.avatar}>
                                                            {String(u.kullanici || "?").charAt(0).toUpperCase()}
                                                        </Avatar>

                                                        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                                            <Typography sx={styles.userName}>
                                                                {u.kullanici}
                                                            </Typography>
                                                            <Typography sx={styles.userMail}>
                                                                {u.mail}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                <TableCell sx={styles.td}>
                                                    <Chip
                                                        label={String(getRoleLabel(u.rol) || "—").toUpperCase()}
                                                        size="small"
                                                        sx={roleChipSx(u.rol)}
                                                    />
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
                                                        <IconButton
                                                            onClick={() => deleteUser(u.id)}
                                                            sx={styles.deleteBtn}
                                                        >
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

                        <Box sx={styles.footerNote}>
                            Not: Roller <b>roller</b> tablosundan <b>id, kod, ad, aktif, olusturma_tarihi</b> alanlarıyla okunur. <b>ADMIN</b> kodlu rol listeden çıkarılır.
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

const styles = {
    page: {
        p: { xs: 1.5, md: 3.5 },
        maxWidth: 1450,
        margin: "0 auto",
        minHeight: "100%",
        background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 22%), radial-gradient(circle at top right, rgba(16,185,129,0.05), transparent 20%)",
    },
    hero: {
        mb: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
        flexWrap: "wrap",
    },
    eyebrow: {
        color: "#60a5fa",
        fontSize: "0.75rem",
        fontWeight: 900,
        letterSpacing: "0.35em",
        mb: 0.8,
    },
    title: {
        color: "#f8fafc",
        fontSize: { xs: "2rem", md: "2.8rem" },
        fontWeight: 900,
        lineHeight: 1.05,
        letterSpacing: "-0.04em",
    },
    titleAccent: {
        color: "#34d399",
        fontSize: "inherit",
        fontWeight: "inherit",
        textShadow: "0 0 22px rgba(52, 211, 153, 0.2)",
    },
    subtitle: {
        color: "#94a3b8",
        mt: 1.2,
        fontSize: "0.95rem",
    },
    alert: {
        mb: 3,
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    statCard: {
        p: 2.2,
        borderRadius: "24px",
        display: "flex",
        alignItems: "center",
        gap: 2,
        color: "#fff",
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(15,23,42,0.82))",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
    },
    statIconWrap: {
        width: 54,
        height: 54,
        borderRadius: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    statValue: {
        color: "#fff",
        fontWeight: 900,
        fontSize: "1.35rem",
        lineHeight: 1.05,
    },
    statLabel: {
        color: "#94a3b8",
        fontSize: "0.82rem",
        mt: 0.4,
    },
    formCard: {
        borderRadius: "26px",
        bgcolor: "#0f172a",
        backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        overflow: "hidden",
        height: "100%",
        backdropFilter: "blur(14px)",
    },
    tableCard: {
        borderRadius: "26px",
        bgcolor: "#0f172a",
        backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        overflow: "hidden",
        backdropFilter: "blur(14px)",
    },
    cardHeader: {
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
    },
    cardHeaderIcon: {
        width: 48,
        height: 48,
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
    },
    cardTitle: {
        color: "#fff",
        fontWeight: 900,
        fontSize: "1.05rem",
        lineHeight: 1.1,
    },
    cardSubTitle: {
        color: "#64748b",
        fontSize: "0.82rem",
        mt: 0.35,
    },
    divider: {
        borderColor: "rgba(255,255,255,0.06)",
    },
    input: {
        "& .MuiInputLabel-root": { color: "#94a3b8" },
        "& .MuiInputLabel-root.Mui-focused": { color: "#94a3b8" },
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.16)" },
            "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
                boxShadow: "0 0 0 4px rgba(59,130,246,0.08)",
            },
        },
        "& .MuiInputBase-input": { color: "#fff" },
    },
    select: {
        borderRadius: "14px",
        bgcolor: "rgba(255,255,255,0.03)",
        color: "#fff",
        "& .MuiSelect-select": { color: "#fff" },
        "& .MuiSvgIcon-root": { color: "#94a3b8" },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.08)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.16)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3b82f6",
            boxShadow: "0 0 0 4px rgba(59,130,246,0.08)",
        },
    },
    infoNote: {
        display: "flex",
        alignItems: "flex-start",
        gap: 1.2,
        p: 1.6,
        borderRadius: "16px",
        bgcolor: "rgba(251,191,36,0.06)",
        border: "1px solid rgba(251,191,36,0.12)",
    },
    infoNoteText: {
        color: "#cbd5e1",
        fontSize: "0.82rem",
        lineHeight: 1.6,
    },
    btnPrimary: {
        py: 1.5,
        borderRadius: "14px",
        fontWeight: 800,
        textTransform: "none",
        fontSize: "0.98rem",
        background: "linear-gradient(45deg, #2563eb, #3b82f6)",
        boxShadow: "0 12px 24px rgba(59, 130, 246, 0.28)",
        "&:hover": {
            background: "linear-gradient(45deg, #2563eb, #3b82f6)",
            transform: "translateY(-1px)",
        },
    },
    btnGhost: {
        color: "#94a3b8",
        textTransform: "none",
        fontWeight: 700,
        borderRadius: "12px",
        px: 2,
        py: 1,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.02)",
        "&:hover": {
            bgcolor: "rgba(255,255,255,0.05)",
            color: "#fff",
        },
    },
    searchInput: {
        minWidth: 250,
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "#fff",
            "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.16)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
        },
        "& input": {
            color: "#fff",
        },
        "& input::placeholder": {
            color: "#64748b",
            opacity: 1,
        },
    },
    th: {
        color: "#64748b",
        fontWeight: 800,
        fontSize: "0.74rem",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderColor: "rgba(255,255,255,0.06)",
        py: 2,
    },
    td: {
        borderColor: "rgba(255,255,255,0.06)",
        py: 2,
        color: "#e2e8f0",
    },
    tableRow: {
        "&:hover": {
            bgcolor: "rgba(255,255,255,0.025) !important",
        },
    },
    avatar: {
        width: 42,
        height: 42,
        fontSize: "0.95rem",
        fontWeight: 800,
        color: "#fff",
        background: "linear-gradient(135deg, #2563eb, #34d399)",
        boxShadow: "0 8px 18px rgba(37,99,235,0.25)",
    },
    userName: {
        fontWeight: 700,
        fontSize: "0.95rem",
        color: "#f8fafc",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    userMail: {
        fontSize: "0.8rem",
        color: "#64748b",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    dateText: {
        fontSize: "0.84rem",
        color: "#94a3b8",
    },
    deleteBtn: {
        color: "#ef4444",
        "&:hover": {
            bgcolor: "rgba(239,68,68,0.12)",
        },
    },
    footerNote: {
        p: 2,
        color: "#64748b",
        fontSize: 12,
    },
};