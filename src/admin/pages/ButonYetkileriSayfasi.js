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
    Chip,
    alpha,
    ToggleButton,
    ToggleButtonGroup,
    Button,
    Avatar,
    Tooltip,
    Fade,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import {
    SearchRounded,
    AdminPanelSettingsRounded,
    GridViewRounded,
    AppsRounded,
    ShieldRounded,
    PersonRounded,
    CheckCircleRounded,
    TuneRounded,
    VisibilityRounded,
    EditRounded,
    KeyboardArrowRightRounded,
    ExpandMoreRounded,
    DoneAllRounded,
    BlockRounded,
    AutoFixHighRounded,
} from "@mui/icons-material";
import { supabase } from "../../supabase";

const EKRAN_KOD = "admin_buton_yetkileri";

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

function StatCard({ icon, label, value, accent = "#7dd3fc" }) {
    return (
        <Paper elevation={0} sx={statCardSx(accent)}>
            <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar sx={statIconSx(accent)}>{icon}</Avatar>
                <Box>
                    <Typography sx={statLabelSx}>{label}</Typography>
                    <Typography sx={statValueSx}>{value}</Typography>
                </Box>
            </Stack>
        </Paper>
    );
}

function SegmentedMode({ value, onChange, options }) {
    return (
        <ToggleButtonGroup
            exclusive
            value={value}
            onChange={(_, v) => v && onChange(v)}
            sx={segmentedSx}
        >
            {options.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value} sx={segmentedButtonSx}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {opt.icon}
                        <span>{opt.label}</span>
                    </Stack>
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

function PermissionSwitch({
    checked,
    onChange,
    loading,
    label,
    hint,
    accent = "#38bdf8",
}) {
    return (
        <Tooltip title={hint || ""} arrow TransitionComponent={Fade}>
            <Paper elevation={0} sx={permissionSwitchCardSx(checked, accent)}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={permissionSwitchIconSx(checked, accent)}>
                        <CheckCircleRounded sx={{ fontSize: 15 }} />
                    </Avatar>
                    <Box>
                        <Typography sx={permissionSwitchTitleSx}>{label}</Typography>
                        <Typography sx={permissionSwitchHintSx}>
                            {checked ? "Açık" : "Kapalı"}
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                    {loading && <CircularProgress size={14} />}
                    <Switch checked={checked} onChange={onChange} />
                </Stack>
            </Paper>
        </Tooltip>
    );
}

function BulkActionButton({ icon, label, onClick, color = "primary", disabled = false }) {
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            variant="outlined"
            startIcon={icon}
            color={color}
            sx={bulkActionBtnSx}
        >
            {label}
        </Button>
    );
}

export default function YetkilerSayfasi() {
    const [permLoading, setPermLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    const [yetkiTipi, setYetkiTipi] = useState("BUTON");
    const [mode, setMode] = useState("ROL");

    const [roller, setRoller] = useState([]);
    const [kullanicilar, setKullanicilar] = useState([]);
    const [ekranlar, setEkranlar] = useState([]);

    const [butonlar, setButonlar] = useState([]);
    const [rolButonMap, setRolButonMap] = useState({});
    const [userButonMap, setUserButonMap] = useState({});

    const [gridler, setGridler] = useState([]);
    const [kolonlar, setKolonlar] = useState([]);
    const [gridId, setGridId] = useState("");
    const [rolKolonMap, setRolKolonMap] = useState({});
    const [userKolonMap, setUserKolonMap] = useState({});

    const [rolId, setRolId] = useState("");
    const [kullaniciId, setKullaniciId] = useState("");

    const [query, setQuery] = useState("");
    const [onlyAllowed, setOnlyAllowed] = useState(false);
    const [savingKey, setSavingKey] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    const norm = (s) =>
        String(s || "")
            .toLocaleLowerCase("tr")
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "");

    const isAdminEkran = (ek) => {
        const kod = String(ek?.kod || "").toLowerCase();
        const grup = String(ek?.grup || "").toLowerCase();
        return kod.startsWith("admin") || kod.startsWith("admin_") || grup === "admin";
    };

    useEffect(() => {
        let alive = true;

        async function loadPerm() {
            try {
                setPermLoading(true);

                const raw = localStorage.getItem("bapsis_user");
                const lsUser = raw ? JSON.parse(raw) : null;
                const userId = lsUser?.id;

                if (!userId) {
                    if (alive) setHasAccess(false);
                    return;
                }

                const { data: uRow, error: uErr } = await supabase
                    .from("kullanicilar")
                    .select("id, rol_id")
                    .eq("id", userId)
                    .maybeSingle();

                if (uErr) throw uErr;

                const roleId = uRow?.rol_id;
                if (!roleId) {
                    if (alive) setHasAccess(false);
                    return;
                }

                const ekranId = await fetchEkranIdByKod({ supabase, ekranKod: EKRAN_KOD });
                if (!ekranId) {
                    if (alive) setHasAccess(false);
                    return;
                }

                const izin = await fetchEffectiveEkranIzin({ supabase, ekranId, userId, roleId });
                if (alive) setHasAccess(izin);
            } catch (e) {
                console.error("Admin ekran izin load error:", e);
                if (alive) setHasAccess(false);
            } finally {
                if (alive) setPermLoading(false);
            }
        }

        loadPerm();

        return () => {
            alive = false;
        };
    }, []);

    const selectedUser = useMemo(
        () => kullanicilar.find((x) => String(x.id) === String(kullaniciId)),
        [kullanicilar, kullaniciId]
    );

    const selectedRole = useMemo(
        () => roller.find((x) => String(x.id) === String(rolId)),
        [roller, rolId]
    );

    const ekranById = useMemo(() => {
        const m = {};
        ekranlar.forEach((e) => {
            m[e.id] = e;
        });
        return m;
    }, [ekranlar]);

    const gridById = useMemo(() => {
        const m = {};
        gridler.forEach((g) => {
            m[g.id] = g;
        });
        return m;
    }, [gridler]);

    const visibleGridler = useMemo(() => {
        return gridler.filter((g) => {
            const ek = ekranById[g.ekran_id];
            return !isAdminEkran(ek);
        });
    }, [gridler, ekranById]);

    const fetchAll = useCallback(async () => {
        setLoading(true);

        const basePromises = [
            supabase.from("roller").select("id,kod,ad").order("ad", { ascending: true }),
            supabase
                .from("kullanicilar")
                .select("id,kullanici,mail,rol_id")
                .order("kullanici", { ascending: true }),
            supabase
                .from("ekranlar")
                .select("id,kod,ad,grup,aktif,sira")
                .eq("aktif", true)
                .order("sira", { ascending: true }),
        ];

        const butonPromises = [
            supabase
                .from("butonlar")
                .select("id,kod,ad,ekran_id,aktif,sira")
                .eq("aktif", true)
                .order("sira", { ascending: true }),
            supabase.from("rol_buton_yetkileri").select("rol_id,buton_id,izin"),
            supabase.from("kullanici_buton_yetkileri").select("kullanici_id,buton_id,izin"),
        ];

        const kolonPromises = [
            supabase
                .from("ekran_gridler")
                .select("id,ekran_id,kod,ad,aktif,sira")
                .eq("aktif", true)
                .order("sira", { ascending: true }),
            supabase
                .from("grid_kolonlar")
                .select("id,grid_id,kod,ad,aktif,sira")
                .eq("aktif", true)
                .order("sira", { ascending: true }),
            supabase
                .from("rol_grid_kolon_yetkileri")
                .select("rol_id,kolon_id,gorebilir,duzenleyebilir"),
            supabase
                .from("kullanici_grid_kolon_yetkileri")
                .select("kullanici_id,kolon_id,gorebilir,duzenleyebilir"),
        ];

        const promises =
            yetkiTipi === "BUTON"
                ? [...basePromises, ...butonPromises]
                : [...basePromises, ...kolonPromises];

        const res = await Promise.all(promises);

        const rRes = res[0];
        const kRes = res[1];
        const eRes = res[2];

        const anyBaseErr = rRes.error || kRes.error || eRes.error;
        if (anyBaseErr) {
            console.error("Fetch base error:", {
                roller: rRes.error?.message,
                kullanicilar: kRes.error?.message,
                ekranlar: eRes.error?.message,
            });
            setLoading(false);
            return;
        }

        const r = rRes.data || [];
        const k = kRes.data || [];
        const e = eRes.data || [];

        setRoller(r);
        setKullanicilar(k);
        setEkranlar(e);

        if (!rolId && r.length > 0) setRolId(String(r[0].id));
        if (!kullaniciId && k.length > 0) setKullaniciId(String(k[0].id));

        if (yetkiTipi === "BUTON") {
            const bRes = res[3];
            const rbRes = res[4];
            const ubRes = res[5];

            const anyErr = bRes.error || rbRes.error || ubRes.error;
            if (anyErr) {
                console.error("Fetch buton error:", {
                    butonlar: bRes.error?.message,
                    rolButon: rbRes.error?.message,
                    userButon: ubRes.error?.message,
                });
                setLoading(false);
                return;
            }

            setButonlar(bRes.data || []);

            const rbm = {};
            (rbRes.data || []).forEach((x) => {
                if (!rbm[x.rol_id]) rbm[x.rol_id] = {};
                rbm[x.rol_id][x.buton_id] = !!x.izin;
            });
            setRolButonMap(rbm);

            const ubm = {};
            (ubRes.data || []).forEach((x) => {
                if (!ubm[x.kullanici_id]) ubm[x.kullanici_id] = {};
                ubm[x.kullanici_id][x.buton_id] = !!x.izin;
            });
            setUserButonMap(ubm);
        } else {
            const gRes = res[3];
            const cRes = res[4];
            const rgRes = res[5];
            const ugRes = res[6];

            const anyErr = gRes.error || cRes.error || rgRes.error || ugRes.error;
            if (anyErr) {
                console.error("Fetch kolon error:", {
                    gridler: gRes.error?.message,
                    kolonlar: cRes.error?.message,
                    rolKolon: rgRes.error?.message,
                    userKolon: ugRes.error?.message,
                });
                setLoading(false);
                return;
            }

            const grids = gRes.data || [];
            const cols = cRes.data || [];

            setGridler(grids);
            setKolonlar(cols);

            if (!gridId) {
                const firstVisible = grids.find((g) => {
                    const ek = e.find((x) => x.id === g.ekran_id);
                    return !isAdminEkran(ek);
                });
                if (firstVisible) setGridId(String(firstVisible.id));
            }

            const rkm = {};
            (rgRes.data || []).forEach((x) => {
                if (!rkm[x.rol_id]) rkm[x.rol_id] = {};
                rkm[x.rol_id][x.kolon_id] = {
                    gorebilir: x.gorebilir !== false,
                    duzenleyebilir: x.duzenleyebilir === true,
                };
            });
            setRolKolonMap(rkm);

            const ukm = {};
            (ugRes.data || []).forEach((x) => {
                if (!ukm[x.kullanici_id]) ukm[x.kullanici_id] = {};
                ukm[x.kullanici_id][x.kolon_id] = {
                    gorebilir: x.gorebilir !== false,
                    duzenleyebilir: x.duzenleyebilir === true,
                };
            });
            setUserKolonMap(ukm);
        }

        setLoading(false);
    }, [yetkiTipi, rolId, kullaniciId, gridId]);

    useEffect(() => {
        if (permLoading) return;
        if (!hasAccess) return;
        fetchAll();
    }, [permLoading, hasAccess, fetchAll]);

    const getEffectiveButonIzin = (butonId) => {
        if (mode === "ROL") return !!rolButonMap?.[rolId]?.[butonId];

        const overrideMap = userButonMap?.[kullaniciId] || {};
        if (Object.prototype.hasOwnProperty.call(overrideMap, butonId)) {
            return !!overrideMap[butonId];
        }

        const userRolId = selectedUser?.rol_id;
        return !!rolButonMap?.[userRolId]?.[butonId];
    };

    const getEffectiveKolonPerm = (kolonId) => {
        const fallback = { gorebilir: true, duzenleyebilir: false };

        if (mode === "ROL") return rolKolonMap?.[rolId]?.[kolonId] ?? fallback;

        const overrideMap = userKolonMap?.[kullaniciId] || {};
        if (Object.prototype.hasOwnProperty.call(overrideMap, kolonId)) {
            return overrideMap[kolonId] ?? fallback;
        }

        const userRolId = selectedUser?.rol_id;
        return rolKolonMap?.[userRolId]?.[kolonId] ?? fallback;
    };

    const upsertRolButon = async (butonId, izin) => {
        const { error } = await supabase
            .from("rol_buton_yetkileri")
            .upsert(
                { rol_id: rolId, buton_id: butonId, izin: !!izin },
                { onConflict: "rol_id,buton_id" }
            );

        if (error) throw error;

        setRolButonMap((prev) => {
            const out = { ...(prev || {}) };
            out[rolId] = { ...(out[rolId] || {}), [butonId]: !!izin };
            return out;
        });
    };

    const upsertUserButon = async (butonId, izin) => {
        const { error } = await supabase
            .from("kullanici_buton_yetkileri")
            .upsert(
                { kullanici_id: kullaniciId, buton_id: butonId, izin: !!izin },
                { onConflict: "kullanici_id,buton_id" }
            );

        if (error) throw error;

        setUserButonMap((prev) => {
            const out = { ...(prev || {}) };
            out[kullaniciId] = { ...(out[kullaniciId] || {}), [butonId]: !!izin };
            return out;
        });
    };

    const toggleButonIzin = async (butonId, nextVal) => {
        if (mode === "ROL" && !rolId) return;
        if (mode === "KULLANICI" && !kullaniciId) return;

        setSavingKey(butonId);
        try {
            if (mode === "ROL") await upsertRolButon(butonId, nextVal);
            else await upsertUserButon(butonId, nextVal);
        } catch (e) {
            console.error("Kaydetme hatası:", e?.message || e);
            await fetchAll();
        } finally {
            setSavingKey(null);
        }
    };

    const upsertRolKolon = async (kolonId, gorebilir, duzenleyebilir) => {
        const g = duzenleyebilir ? true : !!gorebilir;
        const d = !!duzenleyebilir;

        const { error } = await supabase
            .from("rol_grid_kolon_yetkileri")
            .upsert(
                { rol_id: rolId, kolon_id: kolonId, gorebilir: g, duzenleyebilir: d },
                { onConflict: "rol_id,kolon_id" }
            );

        if (error) throw error;

        setRolKolonMap((prev) => {
            const out = { ...(prev || {}) };
            out[rolId] = {
                ...(out[rolId] || {}),
                [kolonId]: { gorebilir: g, duzenleyebilir: d },
            };
            return out;
        });
    };

    const upsertUserKolon = async (kolonId, gorebilir, duzenleyebilir) => {
        const g = duzenleyebilir ? true : !!gorebilir;
        const d = !!duzenleyebilir;

        const { error } = await supabase
            .from("kullanici_grid_kolon_yetkileri")
            .upsert(
                { kullanici_id: kullaniciId, kolon_id: kolonId, gorebilir: g, duzenleyebilir: d },
                { onConflict: "kullanici_id,kolon_id" }
            );

        if (error) throw error;

        setUserKolonMap((prev) => {
            const out = { ...(prev || {}) };
            out[kullaniciId] = {
                ...(out[kullaniciId] || {}),
                [kolonId]: { gorebilir: g, duzenleyebilir: d },
            };
            return out;
        });
    };

    const setKolonPerm = async (kolonId, next) => {
        if (mode === "ROL" && !rolId) return;
        if (mode === "KULLANICI" && !kullaniciId) return;

        setSavingKey(kolonId);
        try {
            if (mode === "ROL") {
                await upsertRolKolon(kolonId, next.gorebilir, next.duzenleyebilir);
            } else {
                await upsertUserKolon(kolonId, next.gorebilir, next.duzenleyebilir);
            }
        } catch (e) {
            console.error("Kaydetme hatası:", e?.message || e);
            await fetchAll();
        } finally {
            setSavingKey(null);
        }
    };

    const filteredButonlar = useMemo(() => {
        const q = norm(query.trim());

        return butonlar
            .filter((b) => {
                const ek = ekranById[b.ekran_id];
                if (!ek) return false;
                if (isAdminEkran(ek)) return false;
                return true;
            })
            .filter((b) => {
                if (!q) return true;
                const ek = ekranById[b.ekran_id];
                const text = `${ek?.ad || ""} ${b.ad || ""} ${b.kod || ""}`;
                return norm(text).includes(q);
            })
            .filter((b) => (!onlyAllowed ? true : getEffectiveButonIzin(b.id)));
    }, [
        butonlar,
        ekranById,
        query,
        onlyAllowed,
        mode,
        rolId,
        kullaniciId,
        rolButonMap,
        userButonMap,
        selectedUser,
    ]);

    const groupedButonlar = useMemo(() => {
        const g = {};

        filteredButonlar.forEach((b) => {
            const ek = ekranById[b.ekran_id];
            if (!ek) return;

            const grup = ek?.grup || "Diğer";
            if (!g[grup]) g[grup] = {};
            if (!g[grup][ek.id]) g[grup][ek.id] = { ekran: ek, butonlar: [] };
            g[grup][ek.id].butonlar.push(b);
        });

        const grupKeys = Object.keys(g).sort((a, b) => a.localeCompare(b, "tr"));

        return grupKeys.map((gr) => {
            const ekranObj = g[gr];
            const ekranList = Object.values(ekranObj).sort((a, b) =>
                String(a.ekran?.ad || "").localeCompare(String(b.ekran?.ad || ""), "tr")
            );

            ekranList.forEach((x) => {
                x.butonlar.sort(
                    (a, b) =>
                        (a.sira ?? 0) - (b.sira ?? 0) ||
                        String(a.ad || "").localeCompare(String(b.ad || ""), "tr")
                );
            });

            return { grup: gr, ekranlar: ekranList };
        });
    }, [filteredButonlar, ekranById]);

    const filteredKolonlar = useMemo(() => {
        const q = norm(query.trim());

        return kolonlar
            .filter((k) => (gridId ? String(k.grid_id) === String(gridId) : true))
            .filter((k) => {
                if (!q) return true;
                const g = gridById[k.grid_id];
                const ek = ekranById[g?.ekran_id];
                const text = `${ek?.ad || ""} ${g?.ad || ""} ${k.ad || ""} ${k.kod || ""}`;
                return norm(text).includes(q);
            })
            .filter((k) => {
                if (!onlyAllowed) return true;
                const p = getEffectiveKolonPerm(k.id);
                return p.gorebilir === true || p.duzenleyebilir === true;
            });
    }, [
        kolonlar,
        gridId,
        query,
        onlyAllowed,
        gridById,
        ekranById,
        mode,
        rolId,
        kullaniciId,
        rolKolonMap,
        userKolonMap,
        selectedUser,
    ]);

    const groupedKolonlar = useMemo(() => {
        const out = {};

        filteredKolonlar.forEach((k) => {
            const gr = gridById[k.grid_id];
            const ek = ekranById[gr?.ekran_id];
            if (!gr || !ek) return;

            const grup = ek?.grup || "Diğer";
            if (!out[grup]) out[grup] = {};
            if (!out[grup][ek.id]) out[grup][ek.id] = { ekran: ek, gridler: {} };
            if (!out[grup][ek.id].gridler[gr.id]) {
                out[grup][ek.id].gridler[gr.id] = { grid: gr, kolonlar: [] };
            }

            out[grup][ek.id].gridler[gr.id].kolonlar.push(k);
        });

        return Object.keys(out)
            .sort((a, b) => a.localeCompare(b, "tr"))
            .map((grup) => {
                const ekranMap = out[grup];
                const ekranList = Object.values(ekranMap).sort((a, b) =>
                    String(a.ekran?.ad || "").localeCompare(String(b.ekran?.ad || ""), "tr")
                );

                ekranList.forEach((ek) => {
                    const grids = Object.values(ek.gridler).sort(
                        (a, b) =>
                            (a.grid?.sira ?? 0) - (b.grid?.sira ?? 0) ||
                            String(a.grid?.ad || "").localeCompare(String(b.grid?.ad || ""), "tr")
                    );

                    grids.forEach((gg) => {
                        gg.kolonlar.sort(
                            (a, b) =>
                                (a.sira ?? 0) - (b.sira ?? 0) ||
                                String(a.ad || "").localeCompare(String(b.ad || ""), "tr")
                        );
                    });

                    ek.gridList = grids;
                });

                return { grup, ekranlar: ekranList };
            });
    }, [filteredKolonlar, gridById, ekranById]);

    const totalVisibleItems =
        yetkiTipi === "BUTON" ? filteredButonlar.length : filteredKolonlar.length;

    const totalAllowedItems = useMemo(() => {
        if (yetkiTipi === "BUTON") {
            return filteredButonlar.filter((x) => getEffectiveButonIzin(x.id)).length;
        }

        return filteredKolonlar.filter((x) => {
            const p = getEffectiveKolonPerm(x.id);
            return p.gorebilir || p.duzenleyebilir;
        }).length;
    }, [
        yetkiTipi,
        filteredButonlar,
        filteredKolonlar,
        mode,
        rolId,
        kullaniciId,
        rolButonMap,
        userButonMap,
        rolKolonMap,
        userKolonMap,
        selectedUser,
    ]);

    const totalEditableColumns = useMemo(() => {
        if (yetkiTipi !== "KOLON") return 0;
        return filteredKolonlar.filter((x) => getEffectiveKolonPerm(x.id).duzenleyebilir).length;
    }, [
        yetkiTipi,
        filteredKolonlar,
        mode,
        rolId,
        kullaniciId,
        rolKolonMap,
        userKolonMap,
        selectedUser,
    ]);

    const subjectLabel =
        mode === "ROL"
            ? selectedRole
                ? `${selectedRole.ad} (${selectedRole.kod})`
                : "Rol seçin"
            : selectedUser
                ? selectedUser.mail
                    ? `${selectedUser.kullanici} • ${selectedUser.mail}`
                    : selectedUser.kullanici
                : "Kullanıcı seçin";

    const canAct = mode === "ROL" ? !!rolId : !!kullaniciId;

    const bulkUpsertButonlar = async (ids, izin) => {
        if (!ids.length) return;

        const rows =
            mode === "ROL"
                ? ids.map((id) => ({ rol_id: rolId, buton_id: id, izin: !!izin }))
                : ids.map((id) => ({
                    kullanici_id: kullaniciId,
                    buton_id: id,
                    izin: !!izin,
                }));

        const table =
            mode === "ROL" ? "rol_buton_yetkileri" : "kullanici_buton_yetkileri";
        const conflict =
            mode === "ROL" ? "rol_id,buton_id" : "kullanici_id,buton_id";

        const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
        if (error) throw error;

        if (mode === "ROL") {
            setRolButonMap((prev) => {
                const out = { ...(prev || {}) };
                out[rolId] = { ...(out[rolId] || {}) };
                ids.forEach((id) => {
                    out[rolId][id] = !!izin;
                });
                return out;
            });
        } else {
            setUserButonMap((prev) => {
                const out = { ...(prev || {}) };
                out[kullaniciId] = { ...(out[kullaniciId] || {}) };
                ids.forEach((id) => {
                    out[kullaniciId][id] = !!izin;
                });
                return out;
            });
        }
    };

    const bulkUpsertKolonlar = async (ids, nextFactory) => {
        if (!ids.length) return;

        const rows = ids.map((id) => {
            const next = nextFactory(id);
            const gorebilir = next.duzenleyebilir ? true : !!next.gorebilir;
            const duzenleyebilir = !!next.duzenleyebilir;

            return mode === "ROL"
                ? {
                    rol_id: rolId,
                    kolon_id: id,
                    gorebilir,
                    duzenleyebilir,
                }
                : {
                    kullanici_id: kullaniciId,
                    kolon_id: id,
                    gorebilir,
                    duzenleyebilir,
                };
        });

        const table =
            mode === "ROL"
                ? "rol_grid_kolon_yetkileri"
                : "kullanici_grid_kolon_yetkileri";

        const conflict =
            mode === "ROL" ? "rol_id,kolon_id" : "kullanici_id,kolon_id";

        const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
        if (error) throw error;

        if (mode === "ROL") {
            setRolKolonMap((prev) => {
                const out = { ...(prev || {}) };
                out[rolId] = { ...(out[rolId] || {}) };
                rows.forEach((row) => {
                    out[rolId][row.kolon_id] = {
                        gorebilir: row.gorebilir,
                        duzenleyebilir: row.duzenleyebilir,
                    };
                });
                return out;
            });
        } else {
            setUserKolonMap((prev) => {
                const out = { ...(prev || {}) };
                out[kullaniciId] = { ...(out[kullaniciId] || {}) };
                rows.forEach((row) => {
                    out[kullaniciId][row.kolon_id] = {
                        gorebilir: row.gorebilir,
                        duzenleyebilir: row.duzenleyebilir,
                    };
                });
                return out;
            });
        }
    };

    const runBulkButon = async (izin) => {
        if (!canAct || !filteredButonlar.length) return;

        setBulkLoading(true);
        try {
            await bulkUpsertButonlar(
                filteredButonlar.map((x) => x.id),
                izin
            );
        } catch (e) {
            console.error("Toplu buton yetki hatası:", e?.message || e);
            await fetchAll();
        } finally {
            setBulkLoading(false);
        }
    };

    const runBulkKolonView = async (gorebilir) => {
        if (!canAct || !filteredKolonlar.length) return;

        setBulkLoading(true);
        try {
            await bulkUpsertKolonlar(filteredKolonlar.map((x) => x.id), (id) => {
                const current = getEffectiveKolonPerm(id);
                return {
                    gorebilir,
                    duzenleyebilir: gorebilir ? current.duzenleyebilir : false,
                };
            });
        } catch (e) {
            console.error("Toplu kolon görüntüleme hatası:", e?.message || e);
            await fetchAll();
        } finally {
            setBulkLoading(false);
        }
    };

    const runBulkKolonEdit = async (duzenleyebilir) => {
        if (!canAct || !filteredKolonlar.length) return;

        setBulkLoading(true);
        try {
            await bulkUpsertKolonlar(filteredKolonlar.map((x) => x.id), (id) => {
                const current = getEffectiveKolonPerm(id);
                return {
                    gorebilir: duzenleyebilir ? true : current.gorebilir,
                    duzenleyebilir,
                };
            });
        } catch (e) {
            console.error("Toplu kolon düzenleme hatası:", e?.message || e);
            await fetchAll();
        } finally {
            setBulkLoading(false);
        }
    };

    if (permLoading) {
        return (
            <Box sx={pageSx}>
                <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }} spacing={2}>
                    <CircularProgress />
                    <Typography sx={{ color: "#cbd5e1", fontWeight: 800 }}>
                        Yetkiler yükleniyor…
                    </Typography>
                </Stack>
            </Box>
        );
    }

    if (!hasAccess) {
        return (
            <Box sx={pageSx}>
                <Paper elevation={0} sx={lockedPanelSx}>
                    <Avatar sx={lockedAvatarSx}>
                        <AdminPanelSettingsRounded />
                    </Avatar>
                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>
                        Erişim Yok
                    </Typography>
                    <Typography
                        sx={{
                            color: "rgba(255,255,255,0.68)",
                            mt: 1,
                            fontSize: 14,
                            maxWidth: 560,
                        }}
                    >
                        Bu sayfaya erişim yetkiniz yok. Yönetici panelinden bu ekran için rol veya
                        kullanıcı bazlı izin tanımlanmalıdır.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={pageSx}>
            <Stack spacing={2}>
                <Box sx={heroSx}>
                    <Stack
                        direction={{ xs: "column", xl: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", xl: "center" }}
                        justifyContent="space-between"
                    >
                        <Stack spacing={1.1} sx={{ maxWidth: 820 }}>
                            <Chip
                                icon={<ShieldRounded sx={{ color: "#7dd3fc !important" }} />}
                                label="Yetki Yönetim Merkezi"
                                sx={heroChipSx}
                            />
                            <Typography variant="h3" sx={heroTitleSx}>
                                Yetki yönetimini daha
                                <Box component="span" sx={{ color: "#7dd3fc" }}>
                                    {" "}
                                    sade ve hızlı{" "}
                                </Box>
                                hale getirin.
                            </Typography>
                            <Typography sx={heroDescSx}>
                                Rol veya kullanıcı bazında buton ve kolon yetkilerini yönetin.
                                Arama ile filtreleyin, tek tek güncelleyin veya toplu işlem ile
                                anında açıp kapatın.
                            </Typography>
                        </Stack>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.1}
                            sx={{ width: { xs: "100%", xl: "auto" } }}
                        >
                            <StatCard
                                icon={yetkiTipi === "BUTON" ? <AppsRounded /> : <GridViewRounded />}
                                label="Görünen kayıt"
                                value={loading ? "..." : totalVisibleItems}
                            />
                            <StatCard
                                icon={<CheckCircleRounded />}
                                label="İzinli kayıt"
                                value={loading ? "..." : totalAllowedItems}
                                accent="#34d399"
                            />
                            <StatCard
                                icon={<EditRounded />}
                                label="Düzenleme"
                                value={loading ? "..." : yetkiTipi === "KOLON" ? totalEditableColumns : "—"}
                                accent="#a78bfa"
                            />
                        </Stack>
                    </Stack>
                </Box>

                <Paper elevation={0} sx={shellSx}>
                    <Box sx={toolbarWrapSx}>
                        <Stack spacing={1.5}>
                            <Stack
                                direction={{ xs: "column", xl: "row" }}
                                spacing={1.4}
                                alignItems={{ xl: "center" }}
                                justifyContent="space-between"
                            >
                                <Stack spacing={1.1}>
                                    <Typography sx={toolbarTitleSx}>Kontrol Paneli</Typography>

                                    <Stack
                                        direction={{ xs: "column", md: "row" }}
                                        spacing={1.1}
                                        alignItems={{ md: "center" }}
                                    >
                                        <SegmentedMode
                                            value={yetkiTipi}
                                            onChange={(v) => {
                                                setYetkiTipi(v);
                                                setQuery("");
                                                setOnlyAllowed(false);
                                                setSavingKey(null);
                                            }}
                                            options={[
                                                {
                                                    value: "BUTON",
                                                    label: "Buton",
                                                    icon: <AppsRounded sx={{ fontSize: 18 }} />,
                                                },
                                                {
                                                    value: "KOLON",
                                                    label: "Kolon",
                                                    icon: <GridViewRounded sx={{ fontSize: 18 }} />,
                                                },
                                            ]}
                                        />

                                        <SegmentedMode
                                            value={mode}
                                            onChange={setMode}
                                            options={[
                                                {
                                                    value: "ROL",
                                                    label: "Rol",
                                                    icon: <ShieldRounded sx={{ fontSize: 18 }} />,
                                                },
                                                {
                                                    value: "KULLANICI",
                                                    label: "Kullanıcı",
                                                    icon: <PersonRounded sx={{ fontSize: 18 }} />,
                                                },
                                            ]}
                                        />
                                    </Stack>
                                </Stack>

                                <Paper elevation={0} sx={contextBadgeSx}>
                                    <Typography sx={contextLabelSx}>
                                        {mode === "ROL" ? "Aktif rol" : "Aktif kullanıcı"}
                                    </Typography>
                                    <Typography sx={contextValueSx}>{subjectLabel}</Typography>
                                </Paper>
                            </Stack>

                            <Stack
                                direction={{ xs: "column", xl: "row" }}
                                spacing={1.1}
                                alignItems={{ xl: "center" }}
                            >
                                {mode === "ROL" ? (
                                    <FormControl sx={{ minWidth: { xs: "100%", md: 260 } }}>
                                        <InputLabel sx={inputLabelSx}>Rol</InputLabel>
                                        <Select
                                            value={rolId}
                                            label="Rol"
                                            onChange={(e) => setRolId(e.target.value)}
                                            sx={selectSxModern}
                                        >
                                            {roller.map((r) => (
                                                <MenuItem key={r.id} value={String(r.id)}>
                                                    {r.ad} ({r.kod})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <FormControl sx={{ minWidth: { xs: "100%", md: 360 } }}>
                                        <InputLabel sx={inputLabelSx}>Kullanıcı</InputLabel>
                                        <Select
                                            value={kullaniciId}
                                            label="Kullanıcı"
                                            onChange={(e) => setKullaniciId(e.target.value)}
                                            sx={selectSxModern}
                                            renderValue={(val) => {
                                                const u = kullanicilar.find(
                                                    (x) => String(x.id) === String(val)
                                                );
                                                if (!u) return "Kullanıcı seçin";
                                                return u.mail
                                                    ? `${u.kullanici} (${u.mail})`
                                                    : u.kullanici;
                                            }}
                                        >
                                            {kullanicilar.map((u) => (
                                                <MenuItem key={u.id} value={String(u.id)}>
                                                    {u.mail
                                                        ? `${u.kullanici} (${u.mail})`
                                                        : u.kullanici}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                {yetkiTipi === "KOLON" && (
                                    <FormControl sx={{ minWidth: { xs: "100%", md: 340 } }}>
                                        <InputLabel sx={inputLabelSx}>Grid</InputLabel>
                                        <Select
                                            value={gridId}
                                            label="Grid"
                                            onChange={(e) => setGridId(e.target.value)}
                                            sx={selectSxModern}
                                        >
                                            {visibleGridler.map((g) => {
                                                const ek = ekranById[g.ekran_id];
                                                const label = ek ? `${ek.ad} / ${g.ad}` : g.ad;
                                                return (
                                                    <MenuItem key={g.id} value={String(g.id)}>
                                                        {label} ({g.kod})
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                )}

                                <TextField
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={
                                        yetkiTipi === "BUTON"
                                            ? "Buton, ekran veya kod ara…"
                                            : "Kolon, grid veya kod ara…"
                                    }
                                    size="small"
                                    sx={searchSxModern}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchRounded />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Button
                                    onClick={() => setOnlyAllowed((p) => !p)}
                                    variant={onlyAllowed ? "contained" : "outlined"}
                                    startIcon={<TuneRounded />}
                                    sx={filterBtnSx(onlyAllowed)}
                                >
                                    Sadece izinli
                                </Button>

                                <Box sx={{ flex: 1 }} />

                                <Chip
                                    label={
                                        loading
                                            ? "Yükleniyor..."
                                            : `${totalVisibleItems} ${yetkiTipi === "BUTON" ? "kayıt" : "kolon"
                                            }`
                                    }
                                    sx={countChipSx}
                                />
                            </Stack>

                            <Paper elevation={0} sx={bulkPanelSx}>
                                <Stack spacing={1.1}>
                                    <Stack
                                        direction={{ xs: "column", md: "row" }}
                                        spacing={1}
                                        alignItems={{ md: "center" }}
                                        justifyContent="space-between"
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar sx={bulkAvatarSx}>
                                                <AutoFixHighRounded sx={{ fontSize: 18 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography sx={bulkTitleSx}>
                                                    Toplu İşlem Alanı
                                                </Typography>
                                                <Typography sx={bulkSubSx}>
                                                    Filtrelenen kayıtlar üzerinde işlem uygular.
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        {bulkLoading && (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CircularProgress size={16} />
                                                <Typography sx={bulkSubSx}>
                                                    Toplu işlem uygulanıyor…
                                                </Typography>
                                            </Stack>
                                        )}
                                    </Stack>

                                    <Stack
                                        direction={{ xs: "column", lg: "row" }}
                                        spacing={1}
                                        flexWrap="wrap"
                                        useFlexGap
                                    >
                                        {yetkiTipi === "BUTON" ? (
                                            <>
                                                <BulkActionButton
                                                    icon={<DoneAllRounded />}
                                                    label="Filtrelenen butonları aç"
                                                    onClick={() => runBulkButon(true)}
                                                    disabled={!canAct || !filteredButonlar.length || bulkLoading}
                                                />
                                                <BulkActionButton
                                                    icon={<BlockRounded />}
                                                    label="Filtrelenen butonları kapat"
                                                    onClick={() => runBulkButon(false)}
                                                    disabled={!canAct || !filteredButonlar.length || bulkLoading}
                                                    color="error"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <BulkActionButton
                                                    icon={<VisibilityRounded />}
                                                    label="Görüntülemeyi aç"
                                                    onClick={() => runBulkKolonView(true)}
                                                    disabled={!canAct || !filteredKolonlar.length || bulkLoading}
                                                />
                                                <BulkActionButton
                                                    icon={<BlockRounded />}
                                                    label="Görüntülemeyi kapat"
                                                    onClick={() => runBulkKolonView(false)}
                                                    disabled={!canAct || !filteredKolonlar.length || bulkLoading}
                                                    color="error"
                                                />
                                                <BulkActionButton
                                                    icon={<EditRounded />}
                                                    label="Düzenlemeyi aç"
                                                    onClick={() => runBulkKolonEdit(true)}
                                                    disabled={!canAct || !filteredKolonlar.length || bulkLoading}
                                                    color="secondary"
                                                />
                                                <BulkActionButton
                                                    icon={<BlockRounded />}
                                                    label="Düzenlemeyi kapat"
                                                    onClick={() => runBulkKolonEdit(false)}
                                                    disabled={!canAct || !filteredKolonlar.length || bulkLoading}
                                                />
                                            </>
                                        )}
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Stack>
                    </Box>

                    <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                    <Box sx={{ p: { xs: 1.2, md: 1.6 } }}>
                        {loading ? (
                            <Stack alignItems="center" sx={{ py: 10 }} spacing={1.5}>
                                <CircularProgress />
                                <Typography sx={{ color: "#94a3b8", fontWeight: 800 }}>
                                    Veriler yükleniyor…
                                </Typography>
                            </Stack>
                        ) : yetkiTipi === "BUTON" ? (
                            groupedButonlar.length === 0 ? (
                                <Paper elevation={0} sx={emptyPaperSx}>
                                    <Typography sx={{ color: "#cbd5e1", fontWeight: 800 }}>
                                        Sonuç bulunamadı.
                                    </Typography>
                                </Paper>
                            ) : (
                                <Stack spacing={1.2}>
                                    {groupedButonlar.map((g) => (
                                        <Accordion key={g.grup} defaultExpanded disableGutters sx={accordionSx}>
                                            <AccordionSummary expandIcon={<ExpandMoreRounded sx={{ color: "#94a3b8" }} />}>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    sx={{ width: "100%", pr: 1 }}
                                                >
                                                    <Typography sx={sectionTitleSx}>{g.grup}</Typography>
                                                    <Chip
                                                        size="small"
                                                        label={`${g.ekranlar.length} ekran`}
                                                        sx={miniChipSx}
                                                    />
                                                </Stack>
                                            </AccordionSummary>

                                            <AccordionDetails sx={{ pt: 0.5 }}>
                                                <Stack spacing={1.1}>
                                                    {g.ekranlar.map(({ ekran, butonlar: blist }) => (
                                                        <Paper key={ekran.id} elevation={0} sx={groupCardSx}>
                                                            <Stack spacing={1}>
                                                                <Stack
                                                                    direction={{ xs: "column", md: "row" }}
                                                                    alignItems={{ xs: "flex-start", md: "center" }}
                                                                    justifyContent="space-between"
                                                                    spacing={1}
                                                                >
                                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                                        <Avatar sx={groupAvatarSx}>
                                                                            <AppsRounded sx={{ fontSize: 18 }} />
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Typography sx={groupTitleSx}>{ekran.ad}</Typography>
                                                                            <Typography sx={groupSubSx}>{ekran.kod}</Typography>
                                                                        </Box>
                                                                    </Stack>
                                                                    <Chip
                                                                        size="small"
                                                                        label={`${blist.length} buton`}
                                                                        sx={miniChipSx}
                                                                    />
                                                                </Stack>

                                                                <Box sx={tableWrapSx}>
                                                                    {blist.map((b, index) => {
                                                                        const izin = getEffectiveButonIzin(b.id);

                                                                        return (
                                                                            <Box
                                                                                key={b.id}
                                                                                sx={{
                                                                                    ...rowSx,
                                                                                    borderBottom:
                                                                                        index === blist.length - 1
                                                                                            ? "none"
                                                                                            : "1px solid rgba(255,255,255,0.06)",
                                                                                }}
                                                                            >
                                                                                <Stack
                                                                                    direction={{ xs: "column", md: "row" }}
                                                                                    spacing={1}
                                                                                    alignItems={{ md: "center" }}
                                                                                    justifyContent="space-between"
                                                                                >
                                                                                    <Stack spacing={0.5}>
                                                                                        <Typography sx={itemTitleSx}>{b.ad}</Typography>
                                                                                        <Stack
                                                                                            direction="row"
                                                                                            spacing={0.8}
                                                                                            alignItems="center"
                                                                                            flexWrap="wrap"
                                                                                            useFlexGap
                                                                                        >
                                                                                            <Chip
                                                                                                size="small"
                                                                                                label={b.kod || b.id}
                                                                                                sx={codeChipSx}
                                                                                            />
                                                                                            <Typography sx={mutedTinySx}>
                                                                                                Buton erişimi
                                                                                            </Typography>
                                                                                        </Stack>
                                                                                    </Stack>

                                                                                    <PermissionSwitch
                                                                                        checked={izin}
                                                                                        loading={savingKey === b.id}
                                                                                        onChange={(ev) =>
                                                                                            toggleButonIzin(
                                                                                                b.id,
                                                                                                ev.target.checked
                                                                                            )
                                                                                        }
                                                                                        label="Erişim"
                                                                                        hint="Bu butonun görünür veya kullanılabilir olmasını kontrol eder."
                                                                                    />
                                                                                </Stack>
                                                                            </Box>
                                                                        );
                                                                    })}
                                                                </Box>
                                                            </Stack>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            </AccordionDetails>
                                        </Accordion>
                                    ))}
                                </Stack>
                            )
                        ) : groupedKolonlar.length === 0 ? (
                            <Paper elevation={0} sx={emptyPaperSx}>
                                <Typography sx={{ color: "#cbd5e1", fontWeight: 800 }}>
                                    Sonuç bulunamadı.
                                </Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={1.2}>
                                {groupedKolonlar.map((g) => (
                                    <Accordion key={g.grup} defaultExpanded disableGutters sx={accordionSx}>
                                        <AccordionSummary expandIcon={<ExpandMoreRounded sx={{ color: "#94a3b8" }} />}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                                sx={{ width: "100%", pr: 1 }}
                                            >
                                                <Typography sx={sectionTitleSx}>{g.grup}</Typography>
                                                <Chip
                                                    size="small"
                                                    label={`${g.ekranlar.length} ekran`}
                                                    sx={miniChipSx}
                                                />
                                            </Stack>
                                        </AccordionSummary>

                                        <AccordionDetails sx={{ pt: 0.5 }}>
                                            <Stack spacing={1.1}>
                                                {g.ekranlar.map(({ ekran, gridList }) => (
                                                    <Stack key={ekran.id} spacing={1}>
                                                        {gridList.map(({ grid, kolonlar: klist }) => (
                                                            <Paper key={grid.id} elevation={0} sx={groupCardSx}>
                                                                <Stack spacing={1}>
                                                                    <Stack
                                                                        direction={{ xs: "column", md: "row" }}
                                                                        alignItems={{ xs: "flex-start", md: "center" }}
                                                                        justifyContent="space-between"
                                                                        spacing={1}
                                                                    >
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            <Avatar sx={groupAvatarSx}>
                                                                                <GridViewRounded sx={{ fontSize: 18 }} />
                                                                            </Avatar>
                                                                            <Box>
                                                                                <Typography sx={groupTitleSx}>{ekran.ad}</Typography>
                                                                                <Stack
                                                                                    direction="row"
                                                                                    spacing={0.5}
                                                                                    alignItems="center"
                                                                                    flexWrap="wrap"
                                                                                >
                                                                                    <Typography sx={groupSubSx}>{grid.ad}</Typography>
                                                                                    <KeyboardArrowRightRounded
                                                                                        sx={{ fontSize: 15, color: "#64748b" }}
                                                                                    />
                                                                                    <Typography sx={groupSubSx}>{grid.kod}</Typography>
                                                                                </Stack>
                                                                            </Box>
                                                                        </Stack>
                                                                        <Chip
                                                                            size="small"
                                                                            label={`${klist.length} kolon`}
                                                                            sx={miniChipSx}
                                                                        />
                                                                    </Stack>

                                                                    <Box sx={tableWrapSx}>
                                                                        {klist.map((k, index) => {
                                                                            const p = getEffectiveKolonPerm(k.id);

                                                                            return (
                                                                                <Box
                                                                                    key={k.id}
                                                                                    sx={{
                                                                                        ...rowSx,
                                                                                        borderBottom:
                                                                                            index === klist.length - 1
                                                                                                ? "none"
                                                                                                : "1px solid rgba(255,255,255,0.06)",
                                                                                    }}
                                                                                >
                                                                                    <Stack spacing={1}>
                                                                                        <Stack
                                                                                            direction={{ xs: "column", md: "row" }}
                                                                                            spacing={1}
                                                                                            alignItems={{ md: "center" }}
                                                                                            justifyContent="space-between"
                                                                                        >
                                                                                            <Stack spacing={0.5}>
                                                                                                <Typography sx={itemTitleSx}>
                                                                                                    {k.ad}
                                                                                                </Typography>
                                                                                                <Stack
                                                                                                    direction="row"
                                                                                                    spacing={0.8}
                                                                                                    alignItems="center"
                                                                                                    flexWrap="wrap"
                                                                                                    useFlexGap
                                                                                                >
                                                                                                    <Chip
                                                                                                        size="small"
                                                                                                        label={k.kod}
                                                                                                        sx={codeChipSx}
                                                                                                    />
                                                                                                    <Typography sx={mutedTinySx}>
                                                                                                        Kolon görünürlük ve düzenleme
                                                                                                    </Typography>
                                                                                                </Stack>
                                                                                            </Stack>

                                                                                            <Stack
                                                                                                direction={{ xs: "column", sm: "row" }}
                                                                                                spacing={1}
                                                                                            >
                                                                                                <PermissionSwitch
                                                                                                    checked={p.gorebilir === true}
                                                                                                    loading={savingKey === k.id}
                                                                                                    onChange={(ev) => {
                                                                                                        const nextGor = ev.target.checked;
                                                                                                        setKolonPerm(k.id, {
                                                                                                            gorebilir: nextGor,
                                                                                                            duzenleyebilir: nextGor
                                                                                                                ? p.duzenleyebilir
                                                                                                                : false,
                                                                                                        });
                                                                                                    }}
                                                                                                    label="Görüntüleme"
                                                                                                    hint="Kapalıysa kolon kullanıcıya gösterilmez."
                                                                                                    accent="#38bdf8"
                                                                                                />

                                                                                                <PermissionSwitch
                                                                                                    checked={p.duzenleyebilir === true}
                                                                                                    loading={savingKey === k.id}
                                                                                                    onChange={(ev) => {
                                                                                                        const nextEdit = ev.target.checked;
                                                                                                        setKolonPerm(k.id, {
                                                                                                            gorebilir: nextEdit
                                                                                                                ? true
                                                                                                                : p.gorebilir,
                                                                                                            duzenleyebilir: nextEdit,
                                                                                                        });
                                                                                                    }}
                                                                                                    label="Düzenleme"
                                                                                                    hint="Açıldığında görüntüleme izni otomatik açılır."
                                                                                                    accent="#a78bfa"
                                                                                                />
                                                                                            </Stack>
                                                                                        </Stack>
                                                                                    </Stack>
                                                                                </Box>
                                                                            );
                                                                        })}
                                                                    </Box>
                                                                </Stack>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </Paper>
            </Stack>
        </Box>
    );
}

const pageSx = {
    minHeight: "100%",
    p: { xs: 1.5, md: 3 },
    background:
        "radial-gradient(circle at top left, rgba(56,189,248,0.10), transparent 22%), radial-gradient(circle at top right, rgba(99,102,241,0.10), transparent 20%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
};

const heroSx = {
    p: { xs: 2.2, md: 3 },
    borderRadius: 5,
    border: "1px solid rgba(255,255,255,0.08)",
    background: `
        radial-gradient(circle at 10% 10%, rgba(56,189,248,0.18), transparent 26%),
        radial-gradient(circle at 90% 15%, rgba(168,85,247,0.14), transparent 22%),
        linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.76))
    `,
    boxShadow: "0 24px 80px rgba(2,6,23,0.38)",
    position: "relative",
    overflow: "hidden",
    "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.03), transparent)",
        pointerEvents: "none",
    },
};

const heroChipSx = {
    width: "fit-content",
    color: "#e0f2fe",
    fontWeight: 900,
    border: "1px solid rgba(125,211,252,0.18)",
    bgcolor: "rgba(125,211,252,0.08)",
    backdropFilter: "blur(8px)",
};

const heroTitleSx = {
    color: "#fff",
    fontWeight: 950,
    letterSpacing: "-0.04em",
    lineHeight: 1.02,
    fontSize: { xs: "2rem", md: "2.6rem" },
};

const heroDescSx = {
    color: "rgba(255,255,255,0.70)",
    fontSize: 14,
    lineHeight: 1.7,
    maxWidth: 760,
};

const shellSx = {
    borderRadius: 5,
    bgcolor: "rgba(15, 23, 42, 0.82)",
    border: "1px solid rgba(255,255,255,0.07)",
    overflow: "hidden",
    backdropFilter: "blur(18px)",
    boxShadow: "0 20px 60px rgba(2,6,23,0.28)",
};

const toolbarWrapSx = {
    p: { xs: 1.2, md: 2 },
    position: "sticky",
    top: 0,
    zIndex: 2,
    backdropFilter: "blur(18px)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(15,23,42,0.82))",
};

const toolbarTitleSx = {
    color: "#f8fafc",
    fontWeight: 900,
    fontSize: 18,
};

const segmentedSx = {
    gap: 0.8,
    p: 0.5,
    bgcolor: "rgba(255,255,255,0.04)",
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.08)",
    "& .MuiToggleButtonGroup-grouped": {
        border: "0 !important",
        borderRadius: "14px !important",
        overflow: "hidden",
    },
};

const segmentedButtonSx = {
    color: "#94a3b8",
    textTransform: "none",
    fontWeight: 900,
    px: 1.6,
    py: 1,
    minHeight: 42,
    "&.Mui-selected": {
        color: "#fff",
        background: "linear-gradient(135deg, rgba(59,130,246,0.30), rgba(56,189,248,0.18))",
        boxShadow: "inset 0 0 0 1px rgba(125,211,252,0.18)",
    },
};

const contextBadgeSx = {
    px: 1.8,
    py: 1.4,
    borderRadius: 3,
    bgcolor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    minWidth: { xs: "100%", lg: 280 },
};

const contextLabelSx = {
    color: "#7dd3fc",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
};

const contextValueSx = {
    color: "#f8fafc",
    fontWeight: 800,
    mt: 0.4,
    fontSize: 14,
};

const inputLabelSx = { color: "#94a3b8" };

const selectSxModern = {
    color: "#fff",
    bgcolor: "rgba(255,255,255,0.03)",
    borderRadius: 3,
    "& .MuiSvgIcon-root": { color: "#94a3b8" },
    "& fieldset": { borderColor: "rgba(255,255,255,0.10)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.18)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(56,189,248,0.45)" },
};

const searchSxModern = {
    minWidth: { xs: "100%", xl: 340 },
    "& .MuiInputBase-root": {
        borderRadius: 3,
        bgcolor: "rgba(2,6,23,0.55)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#e2e8f0",
        minHeight: 42,
    },
    "& .MuiSvgIcon-root": { color: "#94a3b8" },
};

const filterBtnSx = (active) => ({
    minHeight: 42,
    borderRadius: 3,
    textTransform: "none",
    fontWeight: 900,
    borderColor: active ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.12)",
    color: active ? "#d1fae5" : "#cbd5e1",
    bgcolor: active ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.02)",
    "&:hover": {
        borderColor: active ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.20)",
        bgcolor: active ? "rgba(52,211,153,0.16)" : "rgba(255,255,255,0.04)",
    },
});

const countChipSx = {
    bgcolor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#e2e8f0",
    fontWeight: 900,
    height: 36,
    borderRadius: 999,
};

const bulkPanelSx = {
    p: 1.2,
    borderRadius: 4,
    bgcolor: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
};

const bulkAvatarSx = {
    width: 32,
    height: 32,
    bgcolor: "rgba(125,211,252,0.10)",
    color: "#7dd3fc",
    border: "1px solid rgba(125,211,252,0.18)",
};

const bulkTitleSx = {
    color: "#f8fafc",
    fontWeight: 900,
    fontSize: 14,
};

const bulkSubSx = {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
};

const bulkActionBtnSx = {
    borderRadius: 3,
    textTransform: "none",
    fontWeight: 900,
    minHeight: 40,
};

const statCardSx = (accent) => ({
    minWidth: 150,
    px: 1.3,
    py: 1.2,
    borderRadius: 3,
    bgcolor: "rgba(255,255,255,0.05)",
    border: `1px solid ${alpha(accent, 0.16)}`,
    boxShadow: `inset 0 1px 0 ${alpha("#fff", 0.04)}`,
});

const statIconSx = (accent) => ({
    width: 38,
    height: 38,
    bgcolor: alpha(accent, 0.16),
    color: accent,
    border: `1px solid ${alpha(accent, 0.24)}`,
});

const statLabelSx = {
    color: "#94a3b8",
    fontWeight: 800,
    fontSize: 12,
};

const statValueSx = {
    color: "#fff",
    fontWeight: 950,
    fontSize: 20,
    lineHeight: 1.1,
    mt: 0.3,
};

const accordionSx = {
    bgcolor: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px !important",
    overflow: "hidden",
    boxShadow: "none",
    "&::before": { display: "none" },
    "& .MuiAccordionSummary-root": {
        minHeight: 56,
        bgcolor: "rgba(255,255,255,0.03)",
    },
    "& .MuiAccordionSummary-content": {
        my: 1.2,
    },
    "& .MuiAccordionDetails-root": {
        bgcolor: "rgba(2,6,23,0.12)",
    },
};

const sectionTitleSx = {
    color: "#7dd3fc",
    fontWeight: 900,
    letterSpacing: "0.14em",
    fontSize: "0.76rem",
    textTransform: "uppercase",
};

const miniChipSx = {
    bgcolor: alpha("#ffffff", 0.06),
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    fontWeight: 800,
};

const groupCardSx = {
    p: { xs: 1.1, md: 1.25 },
    borderRadius: 3.2,
    bgcolor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
};

const groupAvatarSx = {
    width: 36,
    height: 36,
    bgcolor: "rgba(125,211,252,0.10)",
    color: "#7dd3fc",
    border: "1px solid rgba(125,211,252,0.18)",
};

const groupTitleSx = {
    color: "#f8fafc",
    fontWeight: 900,
    fontSize: 15,
};

const groupSubSx = {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
};

const tableWrapSx = {
    borderRadius: 3,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    bgcolor: "rgba(2,6,23,0.28)",
};

const rowSx = {
    px: { xs: 1, md: 1.2 },
    py: 1.1,
};

const itemTitleSx = {
    color: "#f8fafc",
    fontWeight: 850,
    fontSize: 14,
};

const mutedTinySx = {
    color: "#64748b",
    fontSize: 11,
    fontWeight: 700,
};

const codeChipSx = {
    height: 22,
    borderRadius: 999,
    bgcolor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    fontFamily: "monospace",
    fontWeight: 800,
};

const permissionSwitchCardSx = (checked, accent) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minWidth: 182,
    px: 1.1,
    py: 0.9,
    borderRadius: 2.4,
    bgcolor: checked ? alpha(accent, 0.10) : "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderColor: checked ? alpha(accent, 0.22) : "rgba(255,255,255,0.06)",
});

const permissionSwitchIconSx = (checked, accent) => ({
    width: 28,
    height: 28,
    bgcolor: checked ? alpha(accent, 0.18) : "rgba(255,255,255,0.06)",
    color: checked ? accent : "#94a3b8",
    border: "1px solid",
    borderColor: checked ? alpha(accent, 0.24) : "rgba(255,255,255,0.08)",
});

const permissionSwitchTitleSx = {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: 900,
};

const permissionSwitchHintSx = {
    color: "#64748b",
    fontSize: 11,
    fontWeight: 700,
    mt: 0.15,
};

const emptyPaperSx = {
    p: 3,
    borderRadius: 3,
    bgcolor: "rgba(255,255,255,0.03)",
    border: "1px dashed rgba(255,255,255,0.10)",
};

const lockedPanelSx = {
    p: 4,
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: 5,
    bgcolor: "rgba(15,23,42,0.80)",
    border: "1px solid rgba(255,255,255,0.06)",
};

const lockedAvatarSx = {
    width: 68,
    height: 68,
    mb: 2,
    bgcolor: "rgba(125,211,252,0.10)",
    color: "#7dd3fc",
    border: "1px solid rgba(125,211,252,0.18)",
};