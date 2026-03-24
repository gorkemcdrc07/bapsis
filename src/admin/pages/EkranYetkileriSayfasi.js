import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    Stack,
    Select,
    MenuItem,
    Switch,
    TextField,
    InputAdornment,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    Fade,
    Chip,
    Button,
    IconButton,
    Tooltip,
} from "@mui/material";
import {
    SearchRounded,
    AdminPanelSettingsRounded,
    PersonRounded,
    InfoOutlined,
    GridViewRounded,
    CheckCircleRounded,
    TuneRounded,
    ArrowForwardRounded,
    DoneAllRounded,
    BlockRounded,
    RestartAltRounded,
} from "@mui/icons-material";
import { supabase } from "../../supabase";

/* =========================
   MENÜ
========================= */
const MENU = [
    {
        title: "ANA SAYFA",
        items: [{ kod: "anasayfa", label: "Ana Sayfa" }],
    },

    {
        title: "BİM AFYON",
        items: [
            { kod: "siparisacilis", label: "Bim Sipariş Açılış" },
            { kod: "plakaatama", label: "Bim Plaka Atama" },
            { kod: "tamamlanan_seferler", label: "Bim Tamamlanan Seferler" },
        ],
    },

    {
        title: "DÖNÜŞLER",
        items: [
            { kod: "donus_siparis_acilis", label: "Dönüş Sipariş Açılış" },
            { kod: "donus_plaka_atama", label: "Dönüş Plaka Atama" },
            { kod: "donus_tamamlanan_seferler", label: "Dönüş Tamamlanan Seferler" },
            { kod: "donus_navlunlar", label: "Navlunlar" },
        ],
    },
    {
        title: "ARAÇ YÖNETİMİ",
        items: [{ kod: "aracbilgileri", label: "Araç Bilgileri" }],
    },

    {
        title: "YENİ KAYITLAR",
        items: [
            { kod: "vkn_ekle", label: "VKN Ekle" },
            { kod: "ugrama_sarti_ekle", label: "Uğrama Şartı Ekle" },
            { kod: "navlun_sarti_ekle", label: "Navlun Şartı Ekle" },
        ],
    },
];

export default function EkranYetkileriSayfasi() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [kullanicilar, setKullanicilar] = useState([]);
    const [ekranKodMap, setEkranKodMap] = useState({});
    const [kullaniciId, setKullaniciId] = useState("");
    const [userYetkiMap, setUserYetkiMap] = useState({});

    const [query, setQuery] = useState("");
    const [onlyAllowed, setOnlyAllowed] = useState(false);
    const [savingKey, setSavingKey] = useState(null);

    const norm = (s) =>
        String(s || "")
            .toLocaleLowerCase("tr")
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

    const fetchAll = useCallback(async () => {
        setLoading(true);

        try {
            const [eRes, uRes, ueRes] = await Promise.all([
                supabase.from("ekranlar").select("id,kod").eq("aktif", true),
                supabase
                    .from("kullanicilar")
                    .select("id, kullanici, mail")
                    .order("kullanici", { ascending: true }),
                supabase
                    .from("kullanici_ekran_yetkileri")
                    .select("kullanici_id, ekran_id, izin"),
            ]);

            if (eRes.error) throw eRes.error;
            if (uRes.error) throw uRes.error;
            if (ueRes.error) throw ueRes.error;

            const ekranMap = {};
            (eRes.data || []).forEach((x) => {
                const kod = String(x.kod || "").trim();
                if (kod) ekranMap[kod] = x.id;
            });

            const users = uRes.data || [];

            const izinMap = {};
            (ueRes.data || []).forEach((x) => {
                if (!izinMap[x.kullanici_id]) izinMap[x.kullanici_id] = {};
                izinMap[x.kullanici_id][x.ekran_id] = !!x.izin;
            });

            setEkranKodMap(ekranMap);
            setKullanicilar(users);
            setUserYetkiMap(izinMap);

            if (!kullaniciId && users.length > 0) {
                setKullaniciId(users[0].id);
            }
        } catch (err) {
            console.error("Veri çekme hatası:", err);
        } finally {
            setLoading(false);
        }
    }, [kullaniciId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const selectedUser = useMemo(
        () => kullanicilar.find((x) => x.id === kullaniciId),
        [kullanicilar, kullaniciId]
    );

    const getUserIzinByEkranId = useCallback(
        (ekranId) => !!userYetkiMap?.[kullaniciId]?.[ekranId],
        [userYetkiMap, kullaniciId]
    );

    const toggleIzin = async (ekranId, nextVal) => {
        if (!kullaniciId || !ekranId) return;

        setSavingKey(ekranId);
        try {
            const { error } = await supabase
                .from("kullanici_ekran_yetkileri")
                .upsert(
                    {
                        kullanici_id: kullaniciId,
                        ekran_id: ekranId,
                        izin: !!nextVal,
                    },
                    { onConflict: "kullanici_id,ekran_id" }
                );

            if (error) throw error;

            setUserYetkiMap((prev) => ({
                ...prev,
                [kullaniciId]: {
                    ...(prev[kullaniciId] || {}),
                    [ekranId]: !!nextVal,
                },
            }));
        } catch (e) {
            console.error("Yetki güncelleme hatası:", e);
        } finally {
            setSavingKey(null);
        }
    };

    const bulkSetPermissions = async (items, nextVal) => {
        if (!kullaniciId || !items?.length) return;

        const validItems = items
            .map((it) => ({
                ...it,
                ekranId: ekranKodMap[it.kod] || null,
            }))
            .filter((it) => it.ekranId);

        if (validItems.length === 0) return;

        setSaving(true);
        try {
            const payload = validItems.map((it) => ({
                kullanici_id: kullaniciId,
                ekran_id: it.ekranId,
                izin: !!nextVal,
            }));

            const { error } = await supabase
                .from("kullanici_ekran_yetkileri")
                .upsert(payload, { onConflict: "kullanici_id,ekran_id" });

            if (error) throw error;

            setUserYetkiMap((prev) => {
                const current = { ...(prev[kullaniciId] || {}) };
                validItems.forEach((it) => {
                    current[it.ekranId] = !!nextVal;
                });

                return {
                    ...prev,
                    [kullaniciId]: current,
                };
            });
        } catch (e) {
            console.error("Toplu yetki güncelleme hatası:", e);
        } finally {
            setSaving(false);
        }
    };

    const filteredMenu = useMemo(() => {
        const q = norm(query.trim());

        return MENU.map((group) => {
            const items = group.items
                .map((it) => {
                    const ekranId = ekranKodMap[it.kod] || null;
                    const izin = ekranId ? getUserIzinByEkranId(ekranId) : false;
                    return { ...it, ekranId, izin };
                })
                .filter((it) => {
                    const nameOk = !q || norm(it.label).includes(q);
                    const allowedOk = !onlyAllowed || it.izin === true;
                    return nameOk && allowedOk;
                });

            return { ...group, items };
        }).filter((g) => g.items.length > 0);
    }, [query, onlyAllowed, ekranKodMap, getUserIzinByEkranId]);

    const totalModuleCount = useMemo(
        () => MENU.reduce((acc, group) => acc + group.items.length, 0),
        []
    );

    const visibleModuleCount = useMemo(
        () => filteredMenu.reduce((acc, group) => acc + group.items.length, 0),
        [filteredMenu]
    );

    const allowedModuleCount = useMemo(() => {
        return MENU.reduce((acc, group) => {
            return (
                acc +
                group.items.reduce((sum, item) => {
                    const ekranId = ekranKodMap[item.kod] || null;
                    if (!ekranId) return sum;
                    return sum + (getUserIzinByEkranId(ekranId) ? 1 : 0);
                }, 0)
            );
        }, 0);
    }, [ekranKodMap, getUserIzinByEkranId]);

    const allMenuItems = useMemo(() => MENU.flatMap((g) => g.items), []);

    const selectedLabel = selectedUser
        ? `${selectedUser.kullanici} (${selectedUser.mail})`
        : "Kullanıcı seçilmedi";

    return (
        <Box sx={pageSx}>
            <Box sx={bgGlowTopSx} />
            <Box sx={bgGlowBottomSx} />

            <Paper elevation={0} sx={heroPaperSx}>
                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={3}
                    alignItems={{ xs: "flex-start", lg: "center" }}
                    justifyContent="space-between"
                >
                    <Stack direction="row" spacing={2.2} alignItems="center">
                        <Box sx={heroIconWrapSx}>
                            <AdminPanelSettingsRounded sx={{ color: "#fff", fontSize: 30 }} />
                        </Box>

                        <Box>
                            <Typography sx={heroTitleSx}>Ekran Yetkileri</Typography>
                            <Typography sx={heroDescSx}>
                                Sadece kullanıcı bazlı ekran erişimlerini yönetin.
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.6 }}>
                                <Chip
                                    icon={<PersonRounded />}
                                    label="Sadece Kullanıcı Bazlı"
                                    sx={heroChipPrimarySx}
                                />
                                <Chip
                                    icon={<ArrowForwardRounded />}
                                    label={selectedLabel}
                                    sx={heroChipNeutralSx}
                                />
                            </Stack>
                        </Box>
                    </Stack>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ width: { xs: "100%", lg: "auto" } }}
                    >
                        <StatCard icon={<GridViewRounded />} label="Toplam Modül" value={totalModuleCount} />
                        <StatCard icon={<CheckCircleRounded />} label="İzinli Modül" value={allowedModuleCount} />
                        <StatCard icon={<TuneRounded />} label="Listelenen" value={visibleModuleCount} />
                    </Stack>
                </Stack>
            </Paper>

            <Paper elevation={0} sx={mainPaperSx}>
                <Box sx={controlsWrapSx}>
                    <Stack spacing={2.5}>
                        <Stack
                            direction={{ xs: "column", xl: "row" }}
                            spacing={2}
                            alignItems={{ xl: "center" }}
                            justifyContent="space-between"
                        >
                            <Box sx={{ flex: 1, minWidth: 260 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ color: "#94a3b8" }}>Kullanıcı Seçin</InputLabel>
                                    <Select
                                        value={kullaniciId}
                                        label="Kullanıcı Seçin"
                                        onChange={(e) => setKullaniciId(e.target.value)}
                                        sx={selectSx}
                                    >
                                        {kullanicilar.map((u) => (
                                            <MenuItem key={u.id} value={u.id}>
                                                {u.kullanici} ({u.mail})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.5}
                                sx={{ width: { xs: "100%", xl: "auto" } }}
                            >
                                <TextField
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Modül ara..."
                                    size="small"
                                    sx={searchSx}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchRounded />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Paper elevation={0} sx={filterChipSx}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography sx={filterLabelSx}>SADECE İZİNLİ</Typography>
                                        <Switch
                                            size="small"
                                            checked={onlyAllowed}
                                            onChange={(e) => setOnlyAllowed(e.target.checked)}
                                            sx={modernSwitchSx}
                                        />
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Stack>

                        <Stack
                            direction={{ xs: "column", lg: "row" }}
                            spacing={1.2}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", lg: "center" }}
                        >
                            <Typography sx={subInfoTextSx}>
                                Seçilen kullanıcı için ekran erişimlerini tek tek veya toplu güncelleyebilirsiniz.
                            </Typography>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <Button
                                    startIcon={<DoneAllRounded />}
                                    onClick={() => bulkSetPermissions(allMenuItems, true)}
                                    disabled={!kullaniciId || saving}
                                    sx={bulkOpenBtnSx}
                                >
                                    Tümünü Aç
                                </Button>

                                <Button
                                    startIcon={<BlockRounded />}
                                    onClick={() => bulkSetPermissions(allMenuItems, false)}
                                    disabled={!kullaniciId || saving}
                                    sx={bulkCloseBtnSx}
                                >
                                    Tümünü Kapat
                                </Button>

                                <Tooltip title="Yenile">
                                    <span>
                                        <IconButton onClick={fetchAll} disabled={loading || saving} sx={refreshBtnSx}>
                                            <RestartAltRounded />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                <Box sx={contentWrapSx}>
                    {loading ? (
                        <Stack alignItems="center" justifyContent="center" sx={{ py: 14 }}>
                            <CircularProgress thickness={3} size={42} />
                            <Typography sx={{ mt: 2, color: "#94a3b8", fontWeight: 600 }}>
                                Yetki verileri yükleniyor...
                            </Typography>
                        </Stack>
                    ) : filteredMenu.length === 0 ? (
                        <Paper elevation={0} sx={emptyStateSx}>
                            <InfoOutlined sx={{ fontSize: 46, color: "#60a5fa", mb: 1.5 }} />
                            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>
                                Eşleşen modül bulunamadı
                            </Typography>
                            <Typography sx={{ color: "#94a3b8", mt: 0.5 }}>
                                Arama veya filtreyi değiştirerek tekrar deneyin.
                            </Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={3}>
                            {filteredMenu.map((group, index) => {
                                const groupItems = group.items.filter((x) => x.ekranId);

                                return (
                                    <Fade in timeout={300 + index * 100} key={group.title}>
                                        <Paper elevation={0} sx={groupCardSx}>
                                            <Stack
                                                direction={{ xs: "column", lg: "row" }}
                                                spacing={1.5}
                                                justifyContent="space-between"
                                                alignItems={{ xs: "flex-start", lg: "center" }}
                                                sx={{ mb: 2.2 }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={1.2}>
                                                    <Box sx={groupBadgeSx} />
                                                    <Typography sx={groupTitleSx}>{group.title}</Typography>
                                                    <Chip
                                                        size="small"
                                                        label={`${group.items.length} modül`}
                                                        sx={groupCountChipSx}
                                                    />
                                                </Stack>

                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                                    <Button
                                                        size="small"
                                                        onClick={() => bulkSetPermissions(groupItems, true)}
                                                        disabled={saving || groupItems.length === 0}
                                                        sx={groupOpenBtnSx}
                                                    >
                                                        Grubu Aç
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => bulkSetPermissions(groupItems, false)}
                                                        disabled={saving || groupItems.length === 0}
                                                        sx={groupCloseBtnSx}
                                                    >
                                                        Grubu Kapat
                                                    </Button>
                                                </Stack>
                                            </Stack>

                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: {
                                                        xs: "1fr",
                                                        md: "1fr 1fr",
                                                        xl: "1fr 1fr 1fr",
                                                    },
                                                    gap: 2,
                                                }}
                                            >
                                                {group.items.map((it) => {
                                                    const disabled = !it.ekranId;
                                                    const isActive = !!it.izin;

                                                    return (
                                                        <Paper
                                                            key={it.kod}
                                                            elevation={0}
                                                            sx={{
                                                                ...itemCardSx,
                                                                border: isActive
                                                                    ? "1px solid rgba(59,130,246,0.35)"
                                                                    : "1px solid rgba(255,255,255,0.07)",
                                                                background: isActive
                                                                    ? "linear-gradient(180deg, rgba(59,130,246,0.14) 0%, rgba(30,41,59,0.55) 100%)"
                                                                    : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(15,23,42,0.55) 100%)",
                                                            }}
                                                        >
                                                            <Stack
                                                                direction="row"
                                                                alignItems="flex-start"
                                                                justifyContent="space-between"
                                                                spacing={2}
                                                                sx={{ width: "100%" }}
                                                            >
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Stack
                                                                        direction="row"
                                                                        spacing={1}
                                                                        alignItems="center"
                                                                        flexWrap="wrap"
                                                                        useFlexGap
                                                                    >
                                                                        <Typography sx={moduleTitleSx}>
                                                                            {it.label}
                                                                        </Typography>

                                                                        <Chip
                                                                            size="small"
                                                                            label={
                                                                                disabled
                                                                                    ? "Tanımsız"
                                                                                    : isActive
                                                                                        ? "Açık"
                                                                                        : "Kapalı"
                                                                            }
                                                                            sx={
                                                                                disabled
                                                                                    ? statusChipErrorSx
                                                                                    : isActive
                                                                                        ? statusChipSuccessSx
                                                                                        : statusChipMutedSx
                                                                            }
                                                                        />
                                                                    </Stack>

                                                                    <Typography sx={moduleCodeSx}>
                                                                        Kod: {it.kod}
                                                                    </Typography>

                                                                    {disabled ? (
                                                                        <Typography sx={missingTextSx}>
                                                                            ekranlar tablosunda bu koda ait kayıt bulunamadı.
                                                                        </Typography>
                                                                    ) : (
                                                                        <Typography sx={moduleSubTextSx}>
                                                                            Bu ekran için kullanıcıya özel izin verilir.
                                                                        </Typography>
                                                                    )}
                                                                </Box>

                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 0.5 }}>
                                                                    {savingKey === it.ekranId && (
                                                                        <CircularProgress size={16} sx={{ color: "#60a5fa" }} />
                                                                    )}

                                                                    <Switch
                                                                        checked={isActive}
                                                                        disabled={disabled || saving}
                                                                        onChange={(ev) => toggleIzin(it.ekranId, ev.target.checked)}
                                                                        sx={modernSwitchSx}
                                                                    />
                                                                </Stack>
                                                            </Stack>
                                                        </Paper>
                                                    );
                                                })}
                                            </Box>
                                        </Paper>
                                    </Fade>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <Paper elevation={0} sx={statCardSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={statIconSx}>{icon}</Box>
                <Box>
                    <Typography sx={statValueSx}>{value}</Typography>
                    <Typography sx={statLabelSx}>{label}</Typography>
                </Box>
            </Stack>
        </Paper>
    );
}

/* STYLES */

const pageSx = {
    position: "relative",
    p: { xs: 2, md: 4 },
    minHeight: "100vh",
    background:
        "radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 30%), radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 25%), linear-gradient(180deg, #0b1120 0%, #111827 100%)",
    overflow: "hidden",
};

const bgGlowTopSx = {
    position: "absolute",
    top: -120,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(59,130,246,0.18)",
    filter: "blur(80px)",
    pointerEvents: "none",
};

const bgGlowBottomSx = {
    position: "absolute",
    right: -80,
    bottom: -120,
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "rgba(14,165,233,0.14)",
    filter: "blur(90px)",
    pointerEvents: "none",
};

const heroPaperSx = {
    position: "relative",
    zIndex: 1,
    mb: 3,
    p: { xs: 2.2, md: 3 },
    borderRadius: 5,
    background: "linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.72) 100%)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 60px rgba(0,0,0,0.28)",
};

const heroIconWrapSx = {
    width: 64,
    height: 64,
    borderRadius: "20px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
    boxShadow: "0 18px 36px rgba(37,99,235,0.35)",
    flexShrink: 0,
};

const heroTitleSx = {
    color: "#fff",
    fontWeight: 900,
    fontSize: { xs: "1.8rem", md: "2.2rem" },
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
};

const heroDescSx = {
    mt: 0.6,
    color: "#94a3b8",
    fontWeight: 500,
    fontSize: "0.98rem",
};

const heroChipPrimarySx = {
    color: "#dbeafe",
    bgcolor: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.18)",
    fontWeight: 700,
    "& .MuiChip-icon": { color: "#60a5fa" },
};

const heroChipNeutralSx = {
    color: "#e2e8f0",
    bgcolor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: 700,
    maxWidth: { xs: "100%", md: 420 },
    "& .MuiChip-label": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    "& .MuiChip-icon": { color: "#cbd5e1" },
};

const statCardSx = {
    minWidth: 150,
    px: 2,
    py: 1.6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
};

const statIconSx = {
    width: 40,
    height: 40,
    borderRadius: 2.5,
    display: "grid",
    placeItems: "center",
    color: "#93c5fd",
    bgcolor: "rgba(59,130,246,0.14)",
};

const statValueSx = {
    color: "#fff",
    fontSize: "1.3rem",
    fontWeight: 900,
    lineHeight: 1,
};

const statLabelSx = {
    mt: 0.4,
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
};

const mainPaperSx = {
    position: "relative",
    zIndex: 1,
    borderRadius: 5,
    bgcolor: "rgba(15, 23, 42, 0.72)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.45)",
    overflow: "hidden",
};

const controlsWrapSx = {
    p: { xs: 2, md: 3 },
    background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)",
};

const selectSx = {
    color: "#fff",
    bgcolor: "rgba(255,255,255,0.035)",
    borderRadius: 2.5,
    "& .MuiSvgIcon-root": { color: "#60a5fa" },
    "& fieldset": { borderColor: "rgba(255,255,255,0.09)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.16) !important" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6 !important" },
};

const searchSx = {
    minWidth: { xs: "100%", sm: 260 },
    "& .MuiInputBase-root": {
        borderRadius: 2.5,
        bgcolor: "rgba(0,0,0,0.24)",
        color: "#fff",
        fontSize: 14,
        "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.16)" },
        "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    },
    "& .MuiSvgIcon-root": { color: "#94a3b8" },
};

const filterChipSx = {
    px: 1.6,
    py: 0.8,
    borderRadius: 2.5,
    bgcolor: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
};

const filterLabelSx = {
    color: "#cbd5e1",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.06em",
};

const subInfoTextSx = {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 500,
};

const contentWrapSx = {
    p: { xs: 2, md: 3 },
    maxHeight: "68vh",
    overflowY: "auto",
};

const emptyStateSx = {
    py: 10,
    px: 3,
    borderRadius: 4,
    textAlign: "center",
    background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
    border: "1px dashed rgba(148,163,184,0.22)",
};

const groupCardSx = {
    p: { xs: 2, md: 2.4 },
    borderRadius: 4,
    background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(15,23,42,0.22) 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
};

const groupBadgeSx = {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
    boxShadow: "0 0 18px rgba(59,130,246,0.6)",
};

const groupTitleSx = {
    color: "#e2e8f0",
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: "0.12em",
};

const groupCountChipSx = {
    color: "#93c5fd",
    bgcolor: "rgba(59,130,246,0.10)",
    border: "1px solid rgba(59,130,246,0.14)",
    fontWeight: 800,
    fontSize: 11,
};

const itemCardSx = {
    p: 2,
    borderRadius: 3.2,
    display: "flex",
    alignItems: "center",
    transition: "all 0.22s ease",
    backdropFilter: "blur(8px)",
};

const moduleTitleSx = {
    color: "#fff",
    fontWeight: 800,
    fontSize: "0.97rem",
    letterSpacing: "-0.01em",
};

const moduleCodeSx = {
    mt: 0.8,
    color: "#60a5fa",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
};

const moduleSubTextSx = {
    mt: 0.9,
    color: "#94a3b8",
    fontSize: 12.5,
    lineHeight: 1.5,
};

const missingTextSx = {
    color: "#fca5a5",
    fontSize: 12,
    mt: 0.9,
    fontWeight: 700,
    lineHeight: 1.45,
};

const statusChipSuccessSx = {
    height: 24,
    color: "#d1fae5",
    bgcolor: "rgba(16,185,129,0.14)",
    border: "1px solid rgba(16,185,129,0.18)",
    fontWeight: 800,
    fontSize: 11,
};

const statusChipMutedSx = {
    height: 24,
    color: "#cbd5e1",
    bgcolor: "rgba(148,163,184,0.10)",
    border: "1px solid rgba(148,163,184,0.12)",
    fontWeight: 800,
    fontSize: 11,
};

const statusChipErrorSx = {
    height: 24,
    color: "#fecaca",
    bgcolor: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.18)",
    fontWeight: 800,
    fontSize: 11,
};

const modernSwitchSx = {
    "& .MuiSwitch-switchBase.Mui-checked": {
        color: "#60a5fa",
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
        bgcolor: "#2563eb",
        opacity: 1,
    },
    "& .MuiSwitch-track": {
        bgcolor: "rgba(148,163,184,0.35)",
        opacity: 1,
        borderRadius: 20,
    },
};

const bulkOpenBtnSx = {
    borderRadius: 2.5,
    textTransform: "none",
    fontWeight: 800,
    color: "#d1fae5",
    bgcolor: "rgba(16,185,129,0.14)",
    border: "1px solid rgba(16,185,129,0.2)",
    "&:hover": { bgcolor: "rgba(16,185,129,0.22)" },
};

const bulkCloseBtnSx = {
    borderRadius: 2.5,
    textTransform: "none",
    fontWeight: 800,
    color: "#fecaca",
    bgcolor: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.2)",
    "&:hover": { bgcolor: "rgba(239,68,68,0.22)" },
};

const refreshBtnSx = {
    color: "#cbd5e1",
    bgcolor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
};

const groupOpenBtnSx = {
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 700,
    color: "#bfdbfe",
    border: "1px solid rgba(59,130,246,0.18)",
    bgcolor: "rgba(59,130,246,0.10)",
};

const groupCloseBtnSx = {
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 700,
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.18)",
    bgcolor: "rgba(239,68,68,0.10)",
};