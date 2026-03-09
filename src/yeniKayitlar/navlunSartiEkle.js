import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Switch,
    FormControlLabel,
    Button,
    Snackbar,
    Alert,
    Stack,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    MenuItem,
    Drawer,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    InputAdornment,
    alpha,
} from "@mui/material";
import {
    LocalShipping,
    Save,
    Refresh,
    Delete,
    Edit,
    Add,
    Close,
    Search,
    Route,
    TrendingUp,
} from "@mui/icons-material";
import { createClient } from "@supabase/supabase-js";

const EKRAN_KOD = "navlun_sarti_ekle";

const BTN = {
    CREATE: "navlun_sarti_ekle.create",
    REFRESH: "navlun_sarti_ekle.refresh",
    EDIT: "navlun_sarti_ekle.edit",
    DELETE: "navlun_sarti_ekle.delete",
    CLEAR: "navlun_sarti_ekle.clear",
    SAVE: "navlun_sarti_ekle.save",
};

export default function NavlunSartiEkle({ kullanici }) {
    const supabase = useMemo(() => {
        const url = process.env.REACT_APP_SUPABASE_URL;
        const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
        if (!url || !key) return null;
        return createClient(url, key);
    }, []);

    const emptyForm = useMemo(
        () => ({
            nokta_sayisi: "TEK",
            nokta1: "",
            nokta2: "",
            nokta3: "",
            navlun: "",
            aktif: true,
        }),
        []
    );

    const [form, setForm] = useState(emptyForm);
    const [rows, setRows] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [snack, setSnack] = useState({
        open: false,
        severity: "success",
        message: "",
    });

    const [panelOpen, setPanelOpen] = useState(false);
    const [mode, setMode] = useState("create");
    const [editingId, setEditingId] = useState(null);

    const [confirm, setConfirm] = useState({ open: false, id: null });

    const [permLoading, setPermLoading] = useState(true);
    const [buttonPerms, setButtonPerms] = useState({});
    const [canShowPage, setCanShowPage] = useState(true);

    const closeSnack = () => setSnack((p) => ({ ...p, open: false }));

    const kaydedenText =
        kullanici?.kullaniciAdi || kullanici?.adSoyad || kullanici?.email || "unknown";

    const can = useCallback(
        (kod) => {
            if (!kod) return false;
            return buttonPerms[kod] === true;
        },
        [buttonPerms]
    );

    useEffect(() => {
        let alive = true;

        async function loadPerms() {
            if (!supabase) {
                if (alive) {
                    setPermLoading(false);
                    setCanShowPage(true);
                }
                return;
            }

            try {
                setPermLoading(true);

                const raw = localStorage.getItem("bapsis_user");
                const lsUser = raw ? JSON.parse(raw) : null;
                const userId = lsUser?.id;

                if (!userId) {
                    if (!alive) return;
                    setButtonPerms({});
                    setCanShowPage(true);
                    return;
                }

                const { data: ekranRow, error: ekranErr } = await supabase
                    .from("ekranlar")
                    .select("id,kod")
                    .eq("kod", EKRAN_KOD)
                    .eq("aktif", true)
                    .maybeSingle();

                if (ekranErr) throw ekranErr;
                if (!alive) return;

                if (!ekranRow?.id) {
                    setButtonPerms({});
                    setCanShowPage(true);
                    return;
                }

                const { data: ekranIzinRow, error: ekranIzinErr } = await supabase
                    .from("v_kullanici_ekran_izinleri")
                    .select("izin")
                    .eq("kullanici_id", userId)
                    .eq("ekran_kod", EKRAN_KOD)
                    .maybeSingle();

                if (ekranIzinErr && ekranIzinErr.code !== "PGRST116") throw ekranIzinErr;

                const ekranIzin = ekranIzinRow?.izin !== false;
                setCanShowPage(ekranIzin);

                const { data: btnRows, error: btnErr } = await supabase
                    .from("v_kullanici_buton_izinleri")
                    .select("buton_kod, izin")
                    .eq("kullanici_id", userId)
                    .eq("ekran_kod", EKRAN_KOD);

                if (btnErr && btnErr.code !== "PGRST116") throw btnErr;

                const map = {};
                (btnRows || []).forEach((r) => {
                    map[r.buton_kod] = r.izin === true;
                });

                if (!alive) return;
                setButtonPerms(map);
            } catch (e) {
                console.error("Navlun şartı buton yetki load error:", e);
                if (!alive) return;
                setButtonPerms({});
                setCanShowPage(true);
            } finally {
                if (alive) setPermLoading(false);
            }
        }

        loadPerms();

        return () => {
            alive = false;
        };
    }, [supabase]);

    const openCreatePanel = () => {
        if (!can(BTN.CREATE)) return;
        setMode("create");
        setEditingId(null);
        setForm(emptyForm);
        setPanelOpen(true);
    };

    const openEditPanel = (row) => {
        if (!can(BTN.EDIT)) return;
        setMode("edit");
        setEditingId(row.id);
        setForm({
            nokta_sayisi: String(row.nokta_sayisi ?? "TEK"),
            nokta1: row.nokta1 ?? "",
            nokta2: row.nokta2 ?? "",
            nokta3: row.nokta3 ?? "",
            navlun: row.navlun ?? "",
            aktif: !!row.aktif,
        });
        setPanelOpen(true);
    };

    const onChange = (key) => (e) => {
        const val = key === "aktif" ? e.target.checked : e.target.value;

        setForm((prev) => {
            const next = { ...prev, [key]: val };

            const has1 = !!String(next.nokta1 || "").trim();
            const has2 = !!String(next.nokta2 || "").trim();
            const has3 = !!String(next.nokta3 || "").trim();

            if (has1 && !has2 && !has3) {
                next.nokta_sayisi = "TEK";
            } else if (has1 && (has2 || has3)) {
                next.nokta_sayisi = "COK";
            } else {
                next.nokta_sayisi = "TEK";
            }

            return next;
        });
    };

    const validate = () => {
        const ns = String(form.nokta_sayisi || "").trim();
        const has1 = !!form.nokta1.trim();
        const has2 = !!form.nokta2.trim();
        const has3 = !!form.nokta3.trim();

        if (!has1) return "1. varış noktası zorunludur.";
        if (!String(form.navlun ?? "").trim()) return "Navlun zorunludur.";

        if (ns === "TEK" && (has2 || has3)) {
            return "Tek noktada yalnızca Varış 1 girilmelidir.";
        }

        if (ns === "COK" && !has2 && !has3) {
            return "Çok nokta için en az Varış 1 ve Varış 2 girilmelidir.";
        }

        return null;
    };

    const fetchRows = useCallback(async () => {
        if (!supabase) {
            setSnack({
                open: true,
                severity: "warning",
                message: "Supabase ENV eksik: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY",
            });
            return;
        }

        setLoadingList(true);
        try {
            const { data, error } = await supabase
                .from("navlun_sartlari")
                .select("id, nokta_sayisi, nokta1, nokta2, nokta3, navlun, kaydeden, kayit_tarihi, aktif")
                .order("kayit_tarihi", { ascending: false })
                .limit(300);

            if (error) throw error;
            setRows(data || []);
        } catch (e) {
            setSnack({
                open: true,
                severity: "error",
                message: e?.message || "Liste çekilemedi.",
            });
        } finally {
            setLoadingList(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (permLoading) return;
        if (!canShowPage) return;
        fetchRows();
    }, [fetchRows, permLoading, canShowPage]);

    const formatTRY = (val) => {
        if (val === null || val === undefined) return "";
        const s = String(val).trim();
        if (!s) return "";
        const num = Number(s.replace(/\./g, "").replace(/,/g, ".").replace(/[^\d.]/g, ""));
        if (!Number.isFinite(num)) return s;
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const filteredRows = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((r) =>
            [r.id, r.nokta_sayisi, r.nokta1, r.nokta2, r.nokta3, r.navlun, r.kaydeden]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [rows, searchText]);

    const stats = useMemo(() => {
        const aktifCount = rows.filter((r) => r.aktif).length;
        const pasifCount = rows.filter((r) => !r.aktif).length;
        return {
            total: rows.length,
            aktif: aktifCount,
            pasif: pasifCount,
        };
    }, [rows]);

    const handleSubmit = async () => {
        if (!can(BTN.SAVE)) return;

        const err = validate();
        if (err) {
            setSnack({ open: true, severity: "warning", message: err });
            return;
        }

        if (!supabase) {
            setSnack({
                open: true,
                severity: "warning",
                message: "Supabase ENV eksik: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY",
            });
            return;
        }

        setLoadingSave(true);
        try {
            const ns = String(form.nokta_sayisi);

            const payload = {
                nokta_sayisi: form.nokta_sayisi,
                nokta1: form.nokta1.trim(),
                nokta2: form.nokta2.trim() || null,
                nokta3: form.nokta3.trim() || null,
                navlun: String(form.navlun ?? "").trim(),
                kaydeden: kaydedenText,
                aktif: !!form.aktif,
            };

            if (mode === "create") {
                const { error } = await supabase.from("navlun_sartlari").insert(payload);
                if (error) throw error;
                setSnack({ open: true, severity: "success", message: "Kayıt eklendi." });
            } else {
                const { error } = await supabase
                    .from("navlun_sartlari")
                    .update(payload)
                    .eq("id", editingId);
                if (error) throw error;
                setSnack({ open: true, severity: "success", message: "Kayıt güncellendi." });
            }

            setPanelOpen(false);
            setForm(emptyForm);
            setEditingId(null);
            setMode("create");
            await fetchRows();
        } catch (e) {
            setSnack({
                open: true,
                severity: "error",
                message: e?.message || "İşlem başarısız.",
            });
        } finally {
            setLoadingSave(false);
        }
    };

    const askDelete = (id) => {
        if (!can(BTN.DELETE)) return;
        setConfirm({ open: true, id });
    };

    const cancelDelete = () => setConfirm({ open: false, id: null });

    const doDelete = async () => {
        if (!supabase || !confirm.id || !can(BTN.DELETE)) return;

        try {
            const { error } = await supabase.from("navlun_sartlari").delete().eq("id", confirm.id);
            if (error) throw error;

            setSnack({ open: true, severity: "success", message: "Kayıt silindi." });
            cancelDelete();
            await fetchRows();
        } catch (e) {
            setSnack({
                open: true,
                severity: "error",
                message: e?.message || "Silme işlemi başarısız.",
            });
            cancelDelete();
        }
    };

    const ns = String(form.nokta_sayisi);

    if (permLoading) {
        return (
            <PageShell>
                <CenterState
                    title="Yetkiler yükleniyor"
                    desc="Ekran ve buton izinleri kontrol ediliyor..."
                    loading
                />
            </PageShell>
        );
    }

    if (!canShowPage) {
        return (
            <PageShell>
                <CenterState
                    title="Erişim yok"
                    desc="Bu ekrana giriş yetkiniz bulunmuyor."
                />
            </PageShell>
        );
    }

    return (
        <PageShell>
            <Paper elevation={0} sx={styles.mainCard}>
                <Box sx={styles.hero}>
                    <Box sx={styles.heroGlowA} />
                    <Box sx={styles.heroGlowB} />

                    <Stack
                        direction={{ xs: "column", lg: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", lg: "center" }}
                        sx={{ position: "relative", zIndex: 1 }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={styles.heroIconWrap}>
                                <LocalShipping sx={{ color: "#dbeafe", fontSize: 28 }} />
                            </Box>

                            <Box>
                                <Typography sx={styles.heroTitle}>Navlun Şartları</Typography>
                                <Typography sx={styles.heroSub}>
                                    Daha modern görünüm, hızlı işlem akışı ve filtrelenebilir liste
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} width={{ xs: "100%", lg: "auto" }}>
                            {can(BTN.CREATE) && (
                                <Button
                                    onClick={openCreatePanel}
                                    startIcon={<Add />}
                                    variant="contained"
                                    sx={styles.primaryBtn}
                                >
                                    Yeni Kayıt
                                </Button>
                            )}

                            {can(BTN.REFRESH) && (
                                <Button
                                    onClick={fetchRows}
                                    startIcon={loadingList ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                                    disabled={loadingList}
                                    variant="outlined"
                                    sx={styles.secondaryBtn}
                                >
                                    Yenile
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.5}
                        sx={{ mt: 3, position: "relative", zIndex: 1 }}
                    >
                        <StatCard icon={<Route />} label="Toplam Kayıt" value={stats.total} />
                        <StatCard icon={<TrendingUp />} label="Aktif" value={stats.aktif} success />
                        <StatCard icon={<Close />} label="Pasif" value={stats.pasif} muted />
                    </Stack>
                </Box>

                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                    alignItems={{ xs: "stretch", lg: "center" }}
                    sx={{ mb: 2.5 }}
                >
                    <Box>
                        <Typography sx={styles.sectionTitle}>Kayıt Listesi</Typography>
                        <Typography sx={styles.sectionSub}>
                            Nokta bilgisi, navlun tutarı ve durum detayları tek bakışta
                        </Typography>
                    </Box>

                    <TextField
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="ID, nokta, navlun veya kaydeden ara..."
                        size="small"
                        sx={{ ...fieldSx, minWidth: { xs: "100%", lg: 320 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: "rgba(148,163,184,0.9)", fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Stack>

                <TableContainer component={Paper} elevation={0} sx={styles.tableWrap}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={styles.headRow}>
                                <TableCell>ID</TableCell>
                                <TableCell>Tip</TableCell>
                                <TableCell>1. Nokta</TableCell>
                                <TableCell>2. Nokta</TableCell>
                                <TableCell>3. Nokta</TableCell>
                                <TableCell>Navlun</TableCell>
                                <TableCell>Kaydeden</TableCell>
                                <TableCell>Tarih</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell align="right">İşlemler</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody sx={styles.bodyRow}>
                            {loadingList ? (
                                <TableRow>
                                    <TableCell colSpan={10} sx={{ py: 4 }}>
                                        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="center">
                                            <CircularProgress size={18} />
                                            <Typography sx={{ color: "rgba(148,163,184,0.9)", fontWeight: 700 }}>
                                                Kayıtlar yükleniyor...
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} sx={{ py: 5, textAlign: "center" }}>
                                        <Typography sx={{ color: "rgba(148,163,184,0.95)", fontWeight: 700 }}>
                                            {searchText ? "Aramana uygun kayıt bulunamadı." : "Henüz kayıt bulunmuyor."}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRows.map((r) => (
                                    <TableRow key={r.id} hover sx={styles.tableHoverRow}>
                                        <TableCell>
                                            <Chip label={`#${r.id}`} size="small" sx={styles.idChip} />
                                        </TableCell>
                                        <TableCell>{r.nokta_sayisi ?? ""}</TableCell>
                                        <TableCell>{r.nokta1 ?? ""}</TableCell>
                                        <TableCell>{r.nokta2 ?? "-"}</TableCell>
                                        <TableCell>{r.nokta3 ?? "-"}</TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 900, color: "#f8fafc" }}>{formatTRY(r.navlun)}</Typography>
                                        </TableCell>
                                        <TableCell>{r.kaydeden ?? ""}</TableCell>
                                        <TableCell>
                                            {r.kayit_tarihi ? new Date(r.kayit_tarihi).toLocaleString("tr-TR") : ""}
                                        </TableCell>
                                        <TableCell>
                                            {r.aktif ? (
                                                <Chip size="small" label="Aktif" sx={chipActiveSx} />
                                            ) : (
                                                <Chip size="small" label="Pasif" sx={chipPassiveSx} />
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                                                {can(BTN.EDIT) && (
                                                    <Tooltip title="Düzenle">
                                                        <span>
                                                            <IconButton size="small" onClick={() => openEditPanel(r)} sx={styles.editBtn}>
                                                                <Edit fontSize="inherit" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                )}

                                                {can(BTN.DELETE) && (
                                                    <Tooltip title="Sil">
                                                        <span>
                                                            <IconButton size="small" onClick={() => askDelete(r.id)} sx={styles.deleteBtn}>
                                                                <Delete fontSize="inherit" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {!supabase && (
                    <Alert severity="warning" sx={{ mt: 2.5, borderRadius: 3 }}>
                        Supabase bağlantısı yok. .env dosyana REACT_APP_SUPABASE_URL ve REACT_APP_SUPABASE_ANON_KEY eklemelisin.
                    </Alert>
                )}
            </Paper>

            <Drawer
                anchor="right"
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
                PaperProps={{
                    sx: styles.drawerPaper,
                }}
            >
                <Box sx={styles.drawerHeader}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "#fff", fontSize: "1.02rem" }}>
                            {mode === "create" ? "Yeni Navlun Kaydı" : `Kayıt Düzenle (#${editingId})`}
                        </Typography>
                        <Typography sx={{ color: "rgba(148,163,184,0.9)", fontSize: "0.84rem", mt: 0.5 }}>
                            Form alanlarını doldurup kaydı hızlıca tamamlayabilirsin
                        </Typography>
                    </Box>

                    <IconButton onClick={() => setPanelOpen(false)} sx={styles.closeBtn}>
                        <Close />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 2 }} />

                <Stack spacing={2}>
                    <TextField
                        label="Nokta Tipi"
                        value={form.nokta_sayisi}
                        fullWidth
                        disabled
                        helperText="Varış alanlarına göre otomatik belirlenir"
                        InputLabelProps={{ sx: { color: "rgba(148,163,184,0.9)" } }}
                        FormHelperTextProps={{ sx: { color: "rgba(148,163,184,0.72)" } }}
                        sx={fieldSx}
                    />

                    <TextField
                        label="Navlun"
                        value={form.navlun}
                        onChange={onChange("navlun")}
                        placeholder="Örn: 1500"
                        fullWidth
                        InputLabelProps={{ sx: { color: "rgba(148,163,184,0.9)" } }}
                        sx={fieldSx}
                    />

                    <TextField
                        label="Varış 1"
                        value={form.nokta1}
                        onChange={onChange("nokta1")}
                        placeholder="Örn: İstanbul"
                        fullWidth
                        InputLabelProps={{ sx: { color: "rgba(148,163,184,0.9)" } }}
                        sx={fieldSx}
                    />

                    <TextField
                        label="Varış 2"
                        value={form.nokta2}
                        onChange={onChange("nokta2")}
                        placeholder="Örn: Ankara"
                        fullWidth
                        InputLabelProps={{ sx: { color: "rgba(148,163,184,0.9)" } }}
                        sx={fieldSx}
                    />

                    <TextField
                        label="Varış 3"
                        value={form.nokta3}
                        onChange={onChange("nokta3")}
                        placeholder="Örn: İzmir"
                        fullWidth
                        InputLabelProps={{ sx: { color: "rgba(148,163,184,0.9)" } }}
                        sx={fieldSx}
                    />

                    <Paper elevation={0} sx={styles.switchCard}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.aktif}
                                    onChange={onChange("aktif")}
                                    sx={{
                                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#3b82f6" },
                                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                            bgcolor: "#3b82f6",
                                        },
                                    }}
                                />
                            }
                            label={<Typography sx={{ color: "#e2e8f0", fontWeight: 800 }}>Aktif kayıt</Typography>}
                            sx={{ m: 0, justifyContent: "space-between", width: "100%" }}
                            labelPlacement="start"
                        />
                    </Paper>

                    <Stack direction="row" spacing={1.2} justifyContent="flex-end" sx={{ pt: 1 }}>
                        {can(BTN.CLEAR) && (
                            <Button variant="outlined" disabled={loadingSave} onClick={() => setForm(emptyForm)} sx={styles.secondaryBtn}>
                                Temizle
                            </Button>
                        )}

                        {can(BTN.SAVE) && (
                            <Button
                                variant="contained"
                                startIcon={loadingSave ? <CircularProgress size={16} color="inherit" /> : <Save />}
                                disabled={loadingSave}
                                onClick={handleSubmit}
                                sx={styles.primaryBtn}
                            >
                                {loadingSave ? "Kaydediliyor..." : mode === "create" ? "Kaydet" : "Güncelle"}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Drawer>

            <Dialog
                open={confirm.open}
                onClose={cancelDelete}
                PaperProps={{ sx: styles.dialogPaper }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Kaydı sil?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "rgba(148,163,184,0.92)" }}>
                        ID: <b>{confirm.id}</b> olan kayıt kalıcı olarak silinecek.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={cancelDelete} variant="outlined" sx={styles.secondaryBtn}>
                        Vazgeç
                    </Button>

                    {can(BTN.DELETE) && (
                        <Button onClick={doDelete} variant="contained" startIcon={<Delete />} sx={styles.dangerBtn}>
                            Sil
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snack.open}
                autoHideDuration={3500}
                onClose={closeSnack}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ borderRadius: 2.5 }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </PageShell>
    );
}

function PageShell({ children }) {
    return (
        <Box
            sx={{
                minHeight: "100%",
                p: { xs: 2, md: 3 },
                background:
                    "radial-gradient(circle at top left, rgba(37,99,235,0.10), transparent 30%), radial-gradient(circle at top right, rgba(14,165,233,0.10), transparent 24%), linear-gradient(180deg, #060816 0%, #0b1020 100%)",
            }}
        >
            <Box sx={{ maxWidth: 1440, mx: "auto" }}>{children}</Box>
        </Box>
    );
}

function CenterState({ title, desc, loading = false }) {
    return (
        <Paper elevation={0} sx={styles.mainCard}>
            <Stack alignItems="center" spacing={1.5} py={6}>
                {loading && <CircularProgress />}
                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.05rem" }}>{title}</Typography>
                <Typography sx={{ color: "rgba(148,163,184,0.9)" }}>{desc}</Typography>
            </Stack>
        </Paper>
    );
}

function StatCard({ icon, label, value, success = false, muted = false }) {
    return (
        <Paper
            elevation={0}
            sx={{
                flex: 1,
                minWidth: 0,
                p: 2,
                borderRadius: 4,
                color: "#fff",
                background: muted
                    ? "rgba(15,23,42,0.52)"
                    : success
                        ? "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(6,182,212,0.10))"
                        : "rgba(15,23,42,0.58)",
                border: success ? "1px solid rgba(34,197,94,0.16)" : "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography sx={{ color: "rgba(148,163,184,0.9)", fontSize: "0.8rem", fontWeight: 700 }}>{label}</Typography>
                    <Typography sx={{ mt: 0.75, fontWeight: 900, fontSize: "1.45rem" }}>{value}</Typography>
                </Box>
                <Box
                    sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(255,255,255,0.06)",
                        color: success ? "#4ade80" : "#93c5fd",
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </Paper>
    );
}

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        bgcolor: "rgba(255,255,255,0.03)",
        color: "#e2e8f0",
        borderRadius: "14px",
        backdropFilter: "blur(10px)",
    },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.10)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(59,130,246,0.35)" },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3b82f6" },
    "& .MuiInputBase-input::placeholder": { color: "rgba(148,163,184,0.72)", opacity: 1 },
};

const chipActiveSx = {
    bgcolor: "rgba(34,197,94,0.14)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.24)",
    fontWeight: 800,
};

const chipPassiveSx = {
    bgcolor: "rgba(148,163,184,0.14)",
    color: "#cbd5e1",
    border: "1px solid rgba(148,163,184,0.24)",
    fontWeight: 800,
};

const styles = {
    mainCard: {
        p: { xs: 2, md: 3 },
        borderRadius: "28px",
        bgcolor: "rgba(7,12,25,0.80)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
        backdropFilter: "blur(18px)",
        color: "#e2e8f0",
    },
    hero: {
        position: "relative",
        overflow: "hidden",
        borderRadius: "24px",
        p: { xs: 2, md: 3 },
        mb: 3,
        background:
            "linear-gradient(135deg, rgba(37,99,235,0.22) 0%, rgba(14,165,233,0.14) 45%, rgba(15,23,42,0.72) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    heroGlowA: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: "50%",
        top: -60,
        right: -40,
        background: "rgba(59,130,246,0.22)",
        filter: "blur(40px)",
    },
    heroGlowB: {
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: "50%",
        bottom: -40,
        left: 40,
        background: "rgba(6,182,212,0.16)",
        filter: "blur(40px)",
    },
    heroIconWrap: {
        width: 58,
        height: 58,
        borderRadius: 4,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, rgba(96,165,250,0.30), rgba(37,99,235,0.38))",
        border: "1px solid rgba(147,197,253,0.30)",
        boxShadow: "0 10px 30px rgba(37,99,235,0.25)",
    },
    heroTitle: {
        fontWeight: 950,
        color: "#fff",
        fontSize: { xs: "1.2rem", md: "1.5rem" },
        letterSpacing: "-0.02em",
    },
    heroSub: {
        color: "rgba(226,232,240,0.82)",
        fontSize: "0.92rem",
        mt: 0.5,
    },
    sectionTitle: {
        fontWeight: 900,
        color: "#fff",
        fontSize: "1rem",
    },
    sectionSub: {
        mt: 0.4,
        color: "rgba(148,163,184,0.95)",
        fontSize: "0.84rem",
    },
    tableWrap: {
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "22px",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
    },
    headRow: {
        "& th": {
            bgcolor: "rgba(255,255,255,0.04)",
            color: "rgba(241,245,249,0.96)",
            fontWeight: 900,
            borderColor: "rgba(255,255,255,0.08)",
            fontSize: "0.79rem",
        },
    },
    bodyRow: {
        "& td": {
            borderColor: "rgba(255,255,255,0.06)",
            color: "rgba(226,232,240,0.88)",
            fontSize: "0.8rem",
        },
    },
    tableHoverRow: {
        transition: "all 0.18s ease",
        "&:hover td": {
            bgcolor: "rgba(255,255,255,0.03)",
        },
    },
    idChip: {
        fontWeight: 800,
        color: "#dbeafe",
        bgcolor: "rgba(59,130,246,0.16)",
        border: "1px solid rgba(59,130,246,0.22)",
    },
    primaryBtn: {
        borderRadius: "14px",
        px: 2,
        py: 1.1,
        fontWeight: 900,
        textTransform: "none",
        bgcolor: "#2563eb",
        boxShadow: "0 10px 24px rgba(37,99,235,0.30)",
        "&:hover": { bgcolor: "#1d4ed8" },
    },
    secondaryBtn: {
        borderRadius: "14px",
        px: 2,
        py: 1.05,
        textTransform: "none",
        borderColor: "rgba(255,255,255,0.14)",
        color: "#cbd5e1",
        bgcolor: "rgba(255,255,255,0.02)",
        "&:hover": {
            borderColor: "rgba(59,130,246,0.45)",
            color: "#93c5fd",
            bgcolor: alpha("#2563eb", 0.06),
        },
    },
    dangerBtn: {
        borderRadius: "14px",
        fontWeight: 900,
        textTransform: "none",
        bgcolor: "rgba(244,63,94,0.95)",
        "&:hover": { bgcolor: "rgba(244,63,94,0.85)" },
    },
    editBtn: {
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#93c5fd",
        borderRadius: 2.5,
        "&:hover": { bgcolor: "rgba(59,130,246,0.12)" },
    },
    deleteBtn: {
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(251,113,133,0.95)",
        borderRadius: 2.5,
        "&:hover": { bgcolor: "rgba(244,63,94,0.12)" },
    },
    drawerPaper: {
        width: { xs: "100%", sm: 500 },
        bgcolor: "rgba(7,12,25,0.96)",
        color: "#e2e8f0",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        p: 2.25,
        backdropFilter: "blur(18px)",
        backgroundImage:
            "radial-gradient(circle at top right, rgba(37,99,235,0.12), transparent 25%), linear-gradient(180deg, rgba(10,15,29,0.98), rgba(8,11,20,0.98))",
    },
    drawerHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
    },
    closeBtn: {
        color: "#94a3b8",
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 3,
    },
    switchCard: {
        p: 1.4,
        borderRadius: 4,
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
    },
    dialogPaper: {
        bgcolor: "#0b1220",
        color: "#e2e8f0",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.08)",
        minWidth: 360,
    },
};
