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
    List,
    ListItem,
    ListItemText,
    Avatar,
} from "@mui/material";
import {
    Save,
    Numbers,
    Search,
    ContentPasteGo,
    Shield,
    Dataset,
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
    };
}

export default function VknEkle({ kullanici }) {
    const [permLoading, setPermLoading] = useState(true);
    const [perm, setPerm] = useState({
        ekranGorunur: false,
        ekranYazma: false,
        btn: {},
    });

    const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });
    const [form, setForm] = useState(initialForm());
    const [loading, setLoading] = useState(false);
    const [hata, setHata] = useState("");
    const [basari, setBasari] = useState("");

    const [vknList, setVknList] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [search, setSearch] = useState("");

    const showSnack = useCallback((msg, sev = "info") => setSnack({ open: true, msg, sev }), []);
    const closeSnack = useCallback(() => setSnack((p) => ({ ...p, open: false })), []);

    const can = useCallback(
        (btnKod) => {
            if (!perm.ekranGorunur) return false;
            return perm.btn?.[btnKod] === true;
        },
        [perm]
    );

    const updatedByName = useMemo(() => {
        return kullanici?.kullanici || kullanici?.ad || kullanici?.mail?.split("@")?.[0] || "";
    }, [kullanici]);

    const filteredList = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return vknList;
        return vknList.filter((x) => String(x).toLowerCase().includes(q));
    }, [search, vknList]);

    const loadVknList = useCallback(async () => {
        try {
            setListLoading(true);

            const { data, error } = await supabase
                .from("plakalar")
                .select("vkn")
                .not("vkn", "is", null)
                .order("vkn", { ascending: true });

            if (error) throw error;

            const uniqueList = [...new Set((data || []).map((x) => String(x.vkn || "").trim()).filter(Boolean))];

            setVknList(uniqueList);
        } catch (e) {
            console.error("VKN list load error:", e);
            setVknList([]);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        let alive = true;

        async function loadPerms() {
            try {
                setPermLoading(true);

                const raw = localStorage.getItem("bapsis_user");
                const lsUser = raw ? JSON.parse(raw) : null;
                const userId = lsUser?.id;

                if (!userId) {
                    if (alive) setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
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
                    if (alive) setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
                    return;
                }

                const ekranId = await fetchEkranIdByKod({ supabase, ekranKod: EKRAN_KOD });
                if (!ekranId) {
                    if (alive) setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
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
                if (alive) setPerm({ ekranGorunur: false, ekranYazma: false, btn: {} });
            } finally {
                if (alive) setPermLoading(false);
            }
        }

        loadPerms();

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (perm.ekranGorunur) {
            loadVknList();
        }
    }, [perm.ekranGorunur, loadVknList]);

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
            };

            const { error } = await supabase.from("plakalar").insert([payload]);
            if (error) throw error;

            setBasari("VKN başarıyla eklendi.");
            showSnack("VKN eklendi.", "success");
            setForm(initialForm());
            setHata("");

            await loadVknList();
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
            <Box sx={pageSx}>
                <Box sx={containerSx}>
                    <Paper sx={loadingCardSx}>
                        <Stack spacing={1.4} alignItems="center" justifyContent="center" sx={{ py: 8 }}>
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
            <Box sx={pageSx}>
                <Box sx={containerSx}>
                    <Paper sx={loadingCardSx}>
                        <Stack spacing={1.5} alignItems="center" sx={{ py: 4 }}>
                            <Avatar
                                sx={{
                                    width: 62,
                                    height: 62,
                                    bgcolor: "rgba(239,68,68,0.14)",
                                    color: "#fda4af",
                                }}
                            >
                                <Shield />
                            </Avatar>
                            <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>
                                Erişim Yok
                            </Typography>
                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,0.65)",
                                    fontSize: 14,
                                    textAlign: "center",
                                    maxWidth: 500,
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
        <Box sx={pageSx}>
            <Box sx={containerSx}>
                <Box sx={heroSx}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                                <Avatar
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        bgcolor: "rgba(59,130,246,0.18)",
                                        color: "#93c5fd",
                                        border: "1px solid rgba(59,130,246,0.28)",
                                    }}
                                >
                                    <ContentPasteGo fontSize="small" />
                                </Avatar>
                                <Chip
                                    label="VKN Yönetimi"
                                    size="small"
                                    sx={heroChipSx}
                                />
                            </Stack>

                            <Typography
                                sx={{
                                    color: "#fff",
                                    fontWeight: 900,
                                    fontSize: { xs: "1.5rem", md: "2rem" },
                                    lineHeight: 1.15,
                                }}
                            >
                                Modern VKN Kayıt Ekranı
                            </Typography>

                            <Typography
                                sx={{
                                    mt: 1.1,
                                    color: "rgba(191,219,254,0.86)",
                                    fontSize: "0.95rem",
                                    maxWidth: 760,
                                }}
                            >
                                Sadece <b>plakalar.vkn</b> alanına kayıt ekler ve sistemde bulunan benzersiz VKN listesini modern bir görünümle gösterir.
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                                label={updatedByName ? `Kullanıcı: ${updatedByName}` : "Kullanıcı"}
                                size="small"
                                sx={statChipBlue}
                            />
                            <Chip
                                label={`${vknList.length} benzersiz kayıt`}
                                size="small"
                                sx={statChipGreen}
                            />
                            {!perm.ekranYazma && (
                                <Chip
                                    label="Sadece görüntüleme"
                                    size="small"
                                    sx={statChipRed}
                                />
                            )}
                        </Stack>
                    </Box>
                </Box>

                <Grid container spacing={2.5}>
                    <Grid item xs={12} lg={5}>
                        <Paper sx={cardSx}>
                            <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mb: 2.5 }}>
                                <Avatar sx={sectionAvatarSx}>
                                    <Numbers fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.02rem" }}>
                                        Yeni VKN Ekle
                                    </Typography>
                                    <Typography sx={{ color: "rgba(148,163,184,0.85)", fontSize: "0.82rem" }}>
                                        Tek alanlı hızlı kayıt formu
                                    </Typography>
                                </Box>
                            </Stack>

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
                                sx={modernFieldSx}
                            />

                            <Typography sx={{ mt: 1.2, color: "rgba(148,163,184,0.72)", fontSize: "0.78rem" }}>
                                Kaydet butonu yalnızca <b>plakalar</b> tablosundaki <b>vkn</b> alanına yeni satır ekler.
                            </Typography>

                            <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.06)" }} />

                            <Stack direction="row" spacing={1.4} justifyContent="flex-end">
                                {can(BTN.CLEAR) && (
                                    <Button
                                        variant="outlined"
                                        disabled={loading || !perm.ekranYazma}
                                        onClick={resetForm}
                                        sx={clearBtnSx}
                                    >
                                        Temizle
                                    </Button>
                                )}

                                {can(BTN.SAVE) && (
                                    <Button
                                        variant="contained"
                                        startIcon={
                                            loading ? (
                                                <CircularProgress size={16} sx={{ color: "#fff" }} />
                                            ) : (
                                                <Save />
                                            )
                                        }
                                        disabled={loading || !perm.ekranYazma}
                                        onClick={handleKaydet}
                                        sx={saveBtnSx}
                                    >
                                        {loading ? "Kaydediliyor…" : "Kaydet"}
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={7}>
                        <Paper sx={cardSx}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    mb: 2.2,
                                }}
                            >
                                <Stack direction="row" spacing={1.4} alignItems="center">
                                    <Avatar sx={sectionAvatarSx}>
                                        <Dataset fontSize="small" />
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: "1.02rem" }}>
                                            Benzersiz VKN Listesi
                                        </Typography>
                                        <Typography sx={{ color: "rgba(148,163,184,0.85)", fontSize: "0.82rem" }}>
                                            Plakalar tablosundaki tekrar etmeyen VKN değerleri
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Chip
                                    label={`${filteredList.length} gösteriliyor`}
                                    size="small"
                                    sx={statChipBlue}
                                />
                            </Box>

                            <TextField
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Listede ara..."
                                fullWidth
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ color: "rgba(148,163,184,0.9)" }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ ...modernFieldSx, mb: 2 }}
                            />

                            {listLoading ? (
                                <Stack spacing={1.2} alignItems="center" justifyContent="center" sx={{ py: 7 }}>
                                    <CircularProgress size={26} />
                                    <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
                                        VKN listesi yükleniyor…
                                    </Typography>
                                </Stack>
                            ) : filteredList.length === 0 ? (
                                <Box
                                    sx={{
                                        border: "1px dashed rgba(255,255,255,0.10)",
                                        borderRadius: "20px",
                                        py: 6,
                                        px: 3,
                                        textAlign: "center",
                                        bgcolor: "rgba(15,23,42,0.25)",
                                    }}
                                >
                                    <Typography sx={{ color: "#fff", fontWeight: 800, mb: 0.8 }}>
                                        Gösterilecek kayıt bulunamadı
                                    </Typography>
                                    <Typography sx={{ color: "rgba(148,163,184,0.82)", fontSize: "0.9rem" }}>
                                        Arama filtresini temizleyin veya yeni bir VKN ekleyin.
                                    </Typography>
                                </Box>
                            ) : (
                                <List
                                    sx={{
                                        p: 0.5,
                                        maxHeight: 500,
                                        overflow: "auto",
                                    }}
                                >
                                    {filteredList.map((item, index) => (
                                        <ListItem
                                            key={`${item}-${index}`}
                                            sx={{
                                                mb: 1,
                                                borderRadius: "18px",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                                bgcolor: "rgba(15,23,42,0.34)",
                                                transition: "all 0.18s ease",
                                                "&:hover": {
                                                    transform: "translateY(-1px)",
                                                    borderColor: "rgba(59,130,246,0.28)",
                                                    bgcolor: "rgba(30,41,59,0.5)",
                                                },
                                            }}
                                            secondaryAction={
                                                <Chip
                                                    label={`#${index + 1}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "rgba(59,130,246,0.12)",
                                                        color: "#93c5fd",
                                                        fontWeight: 800,
                                                        border: "1px solid rgba(59,130,246,0.2)",
                                                    }}
                                                />
                                            }
                                        >
                                            <ListItemText
                                                primary={item}
                                                secondary="Benzersiz VKN kaydı"
                                                primaryTypographyProps={{
                                                    sx: { color: "#f8fafc", fontWeight: 800, letterSpacing: 0.3 },
                                                }}
                                                secondaryTypographyProps={{
                                                    sx: { color: "rgba(148,163,184,0.78)", fontSize: "0.78rem" },
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

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
        </Box>
    );
}

/* =========================
   🎨 STYLES
========================= */

const pageSx = {
    minHeight: "100%",
    p: { xs: 2, md: 4 },
    background:
        "radial-gradient(circle at top left, rgba(59,130,246,0.10), transparent 28%), radial-gradient(circle at top right, rgba(16,185,129,0.08), transparent 25%), linear-gradient(180deg, #0b1120 0%, #111827 100%)",
};

const containerSx = {
    maxWidth: 1180,
    mx: "auto",
};

const heroSx = {
    mb: 2.5,
    p: { xs: 2.5, md: 3.2 },
    borderRadius: "30px",
    position: "relative",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
        "linear-gradient(135deg, rgba(30,41,59,0.88) 0%, rgba(15,23,42,0.78) 45%, rgba(29,78,216,0.16) 100%)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 30px 70px rgba(0,0,0,0.34)",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -100,
        right: -60,
        width: 240,
        height: 240,
        borderRadius: "50%",
        background: "rgba(59,130,246,0.16)",
        filter: "blur(40px)",
    },
};

const cardSx = {
    height: "100%",
    p: { xs: 2.2, md: 2.8 },
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(2,6,23,0.72) 100%)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
};

const loadingCardSx = {
    p: 4,
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(2,6,23,0.72) 100%)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
};

const modernFieldSx = {
    "& .MuiInputLabel-root": {
        color: "rgba(148,163,184,0.92)",
        fontWeight: 600,
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#93c5fd",
    },
    "& .MuiOutlinedInput-root": {
        color: "#e2e8f0",
        borderRadius: "18px",
        background: "rgba(15,23,42,0.48)",
        transition: "all 0.2s ease",
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.08)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(59,130,246,0.35)",
        },
        "&.Mui-focused": {
            boxShadow: "0 0 0 4px rgba(59,130,246,0.10)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "rgba(59,130,246,0.55)",
        },
    },
};

const saveBtnSx = {
    borderRadius: "16px",
    px: 2.8,
    py: 1.2,
    textTransform: "none",
    fontWeight: 900,
    bgcolor: "#2563eb",
    backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    boxShadow: "0 18px 36px rgba(37,99,235,0.32)",
    "&:hover": {
        bgcolor: "#1d4ed8",
        boxShadow: "0 20px 38px rgba(37,99,235,0.38)",
    },
    "&.Mui-disabled": {
        opacity: 0.5,
        color: "#fff",
    },
};

const clearBtnSx = {
    borderRadius: "16px",
    px: 2.4,
    py: 1.2,
    textTransform: "none",
    fontWeight: 800,
    color: "rgba(226,232,240,0.92)",
    borderColor: "rgba(148,163,184,0.28)",
    background: "rgba(148,163,184,0.04)",
    "&:hover": {
        borderColor: "rgba(148,163,184,0.45)",
        background: "rgba(148,163,184,0.08)",
    },
};

const sectionAvatarSx = {
    width: 42,
    height: 42,
    bgcolor: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.24)",
};

const heroChipSx = {
    bgcolor: "rgba(59,130,246,0.12)",
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.26)",
    fontWeight: 800,
};

const statChipBlue = {
    bgcolor: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    border: "1px solid rgba(59,130,246,0.24)",
    fontWeight: 800,
};

const statChipGreen = {
    bgcolor: "rgba(16,185,129,0.10)",
    color: "#6ee7b7",
    border: "1px solid rgba(16,185,129,0.22)",
    fontWeight: 800,
};

const statChipRed = {
    bgcolor: "rgba(239,68,68,0.10)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,0.22)",
    fontWeight: 800,
};