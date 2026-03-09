import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Alert,
    Chip,
    Divider,
    InputAdornment,
    CircularProgress,
    Stack,
    Snackbar,
} from "@mui/material";
import {
    Save,
    Badge,
    DirectionsCar,
    LocalShipping,
    Person,
    Phone,
    Numbers,
} from "@mui/icons-material";

import { supabase } from "../supabase";

/* =========================
   ✅ EKRAN / BUTON KODLARI
========================= */
const EKRAN_KOD = "vkn_ekle";

const BTN = {
    CLEAR: "vkn_ekle.clear",
    SAVE: "vkn_ekle.save",
};

async function fetchEkranIdByKod({ supabase, ekranKod }) {
    const { data, error } = await supabase
        .from("ekranlar")
        .select("id,kod")
        .eq("kod", ekranKod)
        .eq("aktif", true)
        .maybeSingle();

    if (error) throw error;
    return data?.id || null;
}

async function fetchEffectiveEkranIzin({ supabase, ekranId, userId, roleId }) {
    const [{ data: uE, error: uErr }, { data: rE, error: rErr }] = await Promise.all([
        supabase
            .from("kullanici_ekran_yetkileri")
            .select("izin")
            .eq("kullanici_id", userId)
            .eq("ekran_id", ekranId)
            .maybeSingle(),
        supabase
            .from("rol_ekran_yetkileri")
            .select("izin")
            .eq("rol_id", roleId)
            .eq("ekran_id", ekranId)
            .maybeSingle(),
    ]);

    if (uErr) throw uErr;
    if (rErr) throw rErr;

    return (uE?.izin ?? rE?.izin) === true;
}

async function fetchButtonMaps({ supabase, ekranId, userId, roleId }) {
    const { data: btns, error: btnErr } = await supabase
        .from("butonlar")
        .select("id,kod")
        .eq("ekran_id", ekranId)
        .eq("aktif", true);

    if (btnErr) throw btnErr;

    const buttonRows = btns || [];
    const idToKod = new Map(buttonRows.map((b) => [b.id, String(b.kod || "").trim()]));
    const allIds = buttonRows.map((b) => b.id);

    const [{ data: uB, error: uErr }, { data: rB, error: rErr }] = await Promise.all([
        supabase
            .from("kullanici_buton_yetkileri")
            .select("buton_id,izin")
            .eq("kullanici_id", userId),
        supabase
            .from("rol_buton_yetkileri")
            .select("buton_id,izin")
            .eq("rol_id", roleId),
    ]);

    if (uErr) throw uErr;
    if (rErr) throw rErr;

    const userMap = {};
    (uB || []).forEach((x) => {
        userMap[x.buton_id] = !!x.izin;
    });

    const roleMap = {};
    (rB || []).forEach((x) => {
        roleMap[x.buton_id] = !!x.izin;
    });

    const kodIzin = {};
    allIds.forEach((id) => {
        const kod = idToKod.get(id);
        if (!kod) return;

        if (Object.prototype.hasOwnProperty.call(userMap, id)) kodIzin[kod] = userMap[id];
        else if (Object.prototype.hasOwnProperty.call(roleMap, id)) kodIzin[kod] = roleMap[id];
        else kodIzin[kod] = false;
    });

    return kodIzin;
}

function initialForm() {
    return {
        vkn: "",
        cekici: "",
        dorse: "",
        ad_soyad: "",
        tc_no: "",
        telefon: "",
        istasyon: "",
        statu: "aktif",
        notlar: "",
    };
}

export default function VknEkle({ kullanici }) {
    const [permLoading, setPermLoading] = useState(true);
    const [perm, setPerm] = useState({
        ekranGorunur: false,
        ekranYazma: false,
        btn: {},
    });

    const can = useCallback(
        (btnKod) => {
            if (!perm.ekranGorunur) return false;
            return perm.btn?.[btnKod] === true;
        },
        [perm]
    );

    useEffect(() => {
        let alive = true;

        async function loadPerms() {
            try {
                setPermLoading(true);

                const raw = localStorage.getItem("bapsis_user");
                const lsUser = raw ? JSON.parse(raw) : null;
                const userId = lsUser?.id;

                if (!userId) {
                    if (alive) {
                        setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                    }
                    return;
                }

                const { data: uRow, error: uErr } = await supabase
                    .from("kullanicilar")
                    .select("id,rol_id")
                    .eq("id", userId)
                    .maybeSingle();

                if (uErr) throw uErr;

                const roleId = uRow?.rol_id;
                if (!roleId) {
                    if (alive) {
                        setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                    }
                    return;
                }

                const ekranId = await fetchEkranIdByKod({ supabase, ekranKod: EKRAN_KOD });
                if (!ekranId) {
                    if (alive) {
                        setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                    }
                    return;
                }

                const ekranIzin = await fetchEffectiveEkranIzin({
                    supabase,
                    ekranId,
                    userId,
                    roleId,
                });

                const btnMap = await fetchButtonMaps({
                    supabase,
                    ekranId,
                    userId,
                    roleId,
                });

                if (alive) {
                    setPerm({
                        ekranGorunur: ekranIzin,
                        ekranYazma: ekranIzin,
                        btn: btnMap || {},
                    });
                }
            } catch (e) {
                console.error("VknEkle permission load error:", e);
                if (alive) {
                    setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                }
            } finally {
                if (alive) setPermLoading(false);
            }
        }

        loadPerms();

        return () => {
            alive = false;
        };
    }, []);

    const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });
    const showSnack = useCallback((msg, sev = "info") => setSnack({ open: true, msg, sev }), []);
    const closeSnack = useCallback(() => setSnack((p) => ({ ...p, open: false })), []);

    const [form, setForm] = useState(initialForm());
    const [loading, setLoading] = useState(false);
    const [hata, setHata] = useState("");
    const [basari, setBasari] = useState("");

    const updatedByName = useMemo(() => {
        return kullanici?.kullanici || kullanici?.ad || kullanici?.mail?.split("@")?.[0] || "";
    }, [kullanici]);

    const onChange = (key) => (e) => {
        if (!perm.ekranYazma) return;
        setBasari("");
        setHata("");
        setForm((p) => ({ ...p, [key]: e.target.value }));
    };

    const validate = () => {
        const vkn = form.vkn.trim();
        if (!vkn) return "VKN zorunlu.";
        return "";
    };

    const resetForm = useCallback(() => {
        if (!perm.ekranYazma || !can(BTN.CLEAR)) return;
        setHata("");
        setBasari("");
        setForm(initialForm());
    }, [perm.ekranYazma, can]);

    const handleKaydet = async () => {
        if (!perm.ekranYazma || !can(BTN.SAVE)) return;

        setBasari("");
        setHata("");

        const err = validate();
        if (err) {
            setHata(err);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                vkn: form.vkn.trim(),
                cekici: form.cekici.trim() || null,
                dorse: form.dorse.trim() || null,
                ad_soyad: form.ad_soyad.trim() || null,
                tc_no: form.tc_no.trim() || null,
                telefon: form.telefon.trim() || null,
                istasyon: form.istasyon.trim() || null,
                statu: form.statu.trim() || null,
                notlar: form.notlar.trim() || null,
            };

            const { error } = await supabase.from("plakalar").insert([payload]);
            if (error) throw error;

            setBasari("Kayıt başarıyla eklendi.");
            showSnack("Kayıt eklendi.", "success");
            setForm(initialForm());
            setHata("");
        } catch (e) {
            const msg = e?.message || "Kayıt sırasında hata oluştu.";
            setHata(msg);
            showSnack(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    if (permLoading) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ maxWidth: 980, mx: "auto" }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: "24px",
                            bgcolor: "rgba(15, 23, 42, 0.55)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            backdropFilter: "blur(18px)",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        }}
                    >
                        <Stack spacing={1.2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                            <CircularProgress />
                            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>
                                Yetkiler yükleniyor…
                            </Typography>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
        );
    }

    if (!perm.ekranGorunur) {
        return (
            <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ maxWidth: 980, mx: "auto" }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: "24px",
                            bgcolor: "rgba(15, 23, 42, 0.55)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            backdropFilter: "blur(18px)",
                            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        }}
                    >
                        <Stack spacing={1.2} alignItems="center">
                            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>
                                Erişim Yok
                            </Typography>
                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,0.65)",
                                    fontSize: 13,
                                    textAlign: "center",
                                    maxWidth: 440,
                                }}
                            >
                                Bu ekrana erişim yetkiniz bulunmuyor. Yönetici panelinden “VKN Ekle” ekran izni verilmelidir.
                            </Typography>
                        </Stack>
                    </Paper>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ maxWidth: 980, mx: "auto" }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3 },
                        borderRadius: "24px",
                        bgcolor: "rgba(15, 23, 42, 0.55)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backdropFilter: "blur(18px)",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        mb: 2.5,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    color: "#fff",
                                    fontWeight: 900,
                                    fontSize: { xs: "1.2rem", md: "1.5rem" },
                                }}
                            >
                                VKN Ekle
                            </Typography>
                            <Typography
                                sx={{
                                    mt: 0.5,
                                    color: "rgba(148,163,184,0.95)",
                                    fontSize: "0.9rem",
                                }}
                            >
                                Yeni çekici/dorse kaydı oluşturup VKN bilgisini <b>plakalar.vkn</b> alanına kaydeder.
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Chip
                                label={updatedByName ? `Kullanıcı: ${updatedByName}` : "Kullanıcı"}
                                size="small"
                                sx={{
                                    bgcolor: "rgba(59,130,246,0.12)",
                                    color: "#93c5fd",
                                    border: "1px solid rgba(59,130,246,0.25)",
                                    fontWeight: 700,
                                }}
                            />

                            <Chip
                                label={form.statu || "aktif"}
                                size="small"
                                sx={{
                                    bgcolor: "rgba(16,185,129,0.10)",
                                    color: "#6ee7b7",
                                    border: "1px solid rgba(16,185,129,0.22)",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                }}
                            />

                            {!perm.ekranYazma && (
                                <Chip
                                    label="Sadece Görüntüleme"
                                    size="small"
                                    sx={{
                                        bgcolor: "rgba(239,68,68,0.10)",
                                        color: "#fca5a5",
                                        border: "1px solid rgba(239,68,68,0.22)",
                                        fontWeight: 800,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3.5 },
                        borderRadius: "28px",
                        bgcolor: "rgba(2, 6, 23, 0.55)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                    }}
                >
                    {hata ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {hata}
                        </Alert>
                    ) : null}

                    {basari ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {basari}
                        </Alert>
                    ) : null}

                    <Grid container spacing={2.2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.vkn}
                                onChange={onChange("vkn")}
                                label="VKN"
                                placeholder="Örn: 1234567890"
                                fullWidth
                                required
                                disabled={loading || !perm.ekranYazma}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Numbers sx={{ color: "rgba(148,163,184,0.9)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.statu}
                                onChange={onChange("statu")}
                                label="Statü"
                                placeholder="aktif / pasif"
                                fullWidth
                                disabled={loading || !perm.ekranYazma}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.cekici}
                                onChange={onChange("cekici")}
                                label="Çekici Plaka"
                                placeholder="Örn: 34 ABC 123"
                                fullWidth
                                disabled={loading || !perm.ekranYazma}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DirectionsCar sx={{ color: "rgba(148,163,184,0.9)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.dorse}
                                onChange={onChange("dorse")}
                                label="Dorse"
                                placeholder="Örn: 34 XYZ 987"
                                fullWidth
                                disabled={loading || !perm.ekranYazma}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocalShipping sx={{ color: "rgba(148,163,184,0.9)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.ad_soyad}
                                onChange={onChange("ad_soyad")}
                                label="Sürücü Ad Soyad"
                                placeholder="Örn: Ahmet Yılmaz"
                                fullWidth
                                disabled={loading || !perm.ekranYazma}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: "rgba(148,163,184,0.9)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.tc_no}
                                onChange={onChange("tc_no")}
                                label="TC No"
                                placeholder="Örn: 12345678901"
                                fullWidth
                                disabled={loading || !perm.ekranYazma}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Badge sx={{ color: "rgba(148,163,184,0.9)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.telefon}
                                onChange={onChange("telefon")}
                                label="Telefon"
                                placeholder="Örn: 05xx xxx xx xx"
                                fullWidth
                                disabled={loading || !perm.ekranYazma}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone sx={{ color: "rgba(148,163,184,0.9)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                value={form.istasyon}
                                onChange={onChange("istasyon")}
                                label="İstasyon"
                                placeholder="Örn: Gebze"
                                fullWidth
                                disabled={loading || !perm.ekranYazma}
                                sx={fieldSx}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                value={form.notlar}
                                onChange={onChange("notlar")}
                                label="Notlar"
                                placeholder="Ek notlar…"
                                fullWidth
                                multiline
                                minRows={3}
                                disabled={loading || !perm.ekranYazma}
                                sx={fieldSx}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.06)" }} />

                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {can(BTN.CLEAR) ? (
                            <Button
                                variant="outlined"
                                disabled={loading || !perm.ekranYazma}
                                onClick={resetForm}
                                sx={{
                                    borderRadius: "14px",
                                    borderColor: "rgba(148,163,184,0.35)",
                                    color: "rgba(148,163,184,0.95)",
                                    px: 2.2,
                                    py: 1.2,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    "&:hover": {
                                        borderColor: "rgba(148,163,184,0.55)",
                                        bgcolor: "rgba(148,163,184,0.06)",
                                    },
                                    "&.Mui-disabled": { opacity: 0.5 },
                                }}
                            >
                                Temizle
                            </Button>
                        ) : null}

                        {can(BTN.SAVE) ? (
                            <Button
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <Save />}
                                disabled={loading || !perm.ekranYazma}
                                onClick={handleKaydet}
                                sx={{
                                    borderRadius: "14px",
                                    px: 2.6,
                                    py: 1.2,
                                    textTransform: "none",
                                    fontWeight: 900,
                                    bgcolor: "#3b82f6",
                                    "&:hover": { bgcolor: "#2563eb" },
                                    boxShadow: "0 16px 30px rgba(59,130,246,0.25)",
                                    "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
                                }}
                            >
                                {loading ? "Kaydediliyor…" : "Kaydet"}
                            </Button>
                        ) : null}
                    </Box>

                    <Typography sx={{ mt: 2, color: "rgba(148,163,184,0.7)", fontSize: "0.78rem" }}>
                        * Kaydet butonu <b>plakalar</b> tablosuna yeni bir satır ekler.
                    </Typography>
                </Paper>
            </Box>

            <Snackbar
                open={snack.open}
                autoHideDuration={3200}
                onClose={closeSnack}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={closeSnack} severity={snack.sev} variant="filled" sx={{ borderRadius: 2 }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

const fieldSx = {
    "& .MuiInputLabel-root": { color: "rgba(148,163,184,0.9)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#93c5fd" },
    "& .MuiOutlinedInput-root": {
        color: "#e2e8f0",
        bgcolor: "rgba(15,23,42,0.35)",
        borderRadius: "16px",
        "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
        "&:hover fieldset": { borderColor: "rgba(59,130,246,0.35)" },
        "&.Mui-focused fieldset": { borderColor: "rgba(59,130,246,0.55)" },
    },
};