// src/plakaAtama/vknDegistirme.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Typography,
    TextField,
    Divider,
    Chip,
    Alert,
    CircularProgress,
    FormControlLabel,
    Switch,
    Popover,
    List,
    ListItemButton,
    ListItemText,
    InputBase,
    Box,
    IconButton,
} from "@mui/material";
import {
    Search as SearchIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Refresh as RefreshIcon,
    Business as BusinessIcon,
    ReceiptLong as ReceiptLongIcon,
    SaveOutlined as SaveOutlinedIcon,
    Tune as TuneIcon,
} from "@mui/icons-material";

export default function VknDegistirme({
    open,
    onClose,
    row,
    rows,
    setRows,
    supabase,
    batchId = null,
    onSaved,
    setSnack,
    s,
    canEdit = true,
}) {
    const inputRef = useRef(null);
    const justPickedRef = useRef(0);

    const oldVkn = useMemo(() => String(row?.vkn ?? "").trim(), [row]);

    const [newVkn, setNewVkn] = useState("");
    const [applyAllSameVkn, setApplyAllSameVkn] = useState(true);
    const [saveToDb, setSaveToDb] = useState(true);

    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const [uniqVkns, setUniqVkns] = useState([]);
    const [uniqLoading, setUniqLoading] = useState(false);
    const [uniqErr, setUniqErr] = useState("");

    const [vknLb, setVknLb] = useState({ open: false, anchorEl: null, query: "" });

    const normalize = useCallback((v) => String(v ?? "").trim(), []);
    const normPlate = useCallback(
        (v) => String(v ?? "").toUpperCase().replace(/\s+/g, "").replace(/[-._]/g, "").trim(),
        []
    );

    const isValid = useCallback((v) => normalize(v).length > 0, [normalize]);

    const fetchUniqueVkns = useCallback(async () => {
        if (!supabase) return;
        setUniqLoading(true);
        setUniqErr("");

        try {
            const { data, error } = await supabase.from("plakalar").select("vkn").limit(10000);
            if (error) throw error;

            const values = (data || [])
                .map((x) => normalize(x?.vkn))
                .filter((x) => x && x !== "null" && x !== "undefined");

            const uniq = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "tr"));
            setUniqVkns(uniq);
        } catch (e) {
            console.error("fetchUniqueVkns(plakalar) error:", e);
            setUniqErr(e?.message || "Plakalar tablosundan VKN listesi alınamadı.");
            setUniqVkns([]);
        } finally {
            setUniqLoading(false);
        }
    }, [supabase, normalize]);

    useEffect(() => {
        if (!open) return;

        setErr("");
        setBusy(false);

        setNewVkn(oldVkn);
        setApplyAllSameVkn(true);
        setSaveToDb(true);

        setVknLb({ open: false, anchorEl: null, query: "" });

        fetchUniqueVkns();
    }, [open, oldVkn, fetchUniqueVkns]);

    const affectedCount = useMemo(() => {
        if (!open) return 0;
        if (!applyAllSameVkn) return row ? 1 : 0;

        const ov = normalize(oldVkn);
        if (!ov) return row ? 1 : 0;

        return (rows || []).filter((r) => normalize(r?.vkn) === ov).length || (row ? 1 : 0);
    }, [open, applyAllSameVkn, rows, row, oldVkn, normalize]);

    const vknOptions = useMemo(() => {
        if (!vknLb.open) return [];

        const qx = normalize(vknLb.query).toLocaleLowerCase("tr");
        const base = uniqVkns || [];

        const filtered = !qx
            ? base
            : base.filter((v) => String(v).toLocaleLowerCase("tr").includes(qx));

        return filtered.slice(0, 300);
    }, [vknLb.open, vknLb.query, uniqVkns, normalize]);

    const openVknListbox = useCallback(
        (e) => {
            if (!canEdit) return;
            if (busy) return;
            if (Date.now() - (justPickedRef.current || 0) < 350) return;

            setErr("");
            setVknLb({ open: true, anchorEl: e.currentTarget, query: "" });
        },
        [busy, canEdit]
    );

    const closeVknListbox = useCallback(() => {
        setVknLb({ open: false, anchorEl: null, query: "" });
    }, []);

    const pickVkn = useCallback(
        (v) => {
            justPickedRef.current = Date.now();
            setNewVkn(normalize(v));
            closeVknListbox();

            setTimeout(() => {
                try {
                    inputRef.current?.blur?.();
                } catch { }
            }, 0);
        },
        [closeVknListbox, normalize]
    );

    const applyUiChange = useCallback(() => {
        if (!row?.id) return;

        const ov = normalize(oldVkn);
        const nv = normalize(newVkn);

        setRows((prev) =>
            (prev || []).map((r) => {
                if (!applyAllSameVkn) {
                    if (r.id !== row.id) return r;
                    return { ...r, vkn: nv };
                }

                if (ov && normalize(r?.vkn) === ov) return { ...r, vkn: nv };
                if (!ov && r.id === row.id) return { ...r, vkn: nv };

                return r;
            })
        );
    }, [row?.id, oldVkn, newVkn, applyAllSameVkn, setRows, normalize]);

    const findPlakaRecordForRow = useCallback(async () => {
        if (!supabase || !row) return null;

        const cekici = normPlate(row?.cekici);
        const dorse = normPlate(row?.dorse);

        if (cekici) {
            const { data, error } = await supabase
                .from("plakalar")
                .select("id, cekici, dorse, vkn")
                .eq("cekici", row.cekici)
                .limit(1);

            if (!error && data?.[0]) return data[0];
        }

        if (dorse) {
            const { data, error } = await supabase
                .from("plakalar")
                .select("id, cekici, dorse, vkn")
                .eq("dorse", row.dorse)
                .limit(1);

            if (!error && data?.[0]) return data[0];
        }

        const { data: all, error: e2 } = await supabase
            .from("plakalar")
            .select("id, cekici, dorse, vkn")
            .limit(5000);

        if (e2) return null;

        const rec =
            (all || []).find(
                (p) =>
                    (cekici && normPlate(p?.cekici) === cekici) ||
                    (dorse && normPlate(p?.dorse) === dorse)
            ) || null;

        return rec;
    }, [supabase, row, normPlate]);

    const updateDb = useCallback(async () => {
        if (!supabase) return;

        const nv = normalize(newVkn);
        const ov = normalize(oldVkn);

        const hasDbId = row?.__db_id != null;

        if (applyAllSameVkn) {
            if (ov) {
                let qb = supabase.from("plaka_atamalar").update({ faturavkn: nv }).eq("faturavkn", ov);
                if (batchId) qb = qb.eq("batch_id", batchId);

                const { error } = await qb;
                if (error) throw error;
            } else {
                if (row?.__db_id != null) {
                    const { error } = await supabase
                        .from("plaka_atamalar")
                        .update({ faturavkn: nv })
                        .eq("id", row.__db_id);
                    if (error) throw error;
                }
            }
        } else {
            if (hasDbId) {
                const { error } = await supabase
                    .from("plaka_atamalar")
                    .update({ faturavkn: nv })
                    .eq("id", row.__db_id);
                if (error) throw error;
            }
        }

        const plakaRec = await findPlakaRecordForRow();
        if (plakaRec?.id) {
            const { error } = await supabase.from("plakalar").update({ vkn: nv }).eq("id", plakaRec.id);
            if (error) throw error;
        } else {
            setSnack?.({
                open: true,
                sev: "warning",
                msg: "Plakalar tablosunda bu satıra ait araç bulunamadı. (Sadece plaka_atamalar güncellendi)",
            });
        }
    }, [
        supabase,
        newVkn,
        oldVkn,
        applyAllSameVkn,
        row?.__db_id,
        batchId,
        normalize,
        findPlakaRecordForRow,
        setSnack,
    ]);

    const handleCancel = useCallback(() => {
        if (busy) return;
        closeVknListbox();
        onClose?.();
    }, [busy, closeVknListbox, onClose]);

    const onSubmit = useCallback(async () => {
        if (!canEdit) return;

        setErr("");
        closeVknListbox();

        const nv = normalize(newVkn);
        if (!isValid(nv)) {
            setErr("Yeni VKN boş olamaz.");
            return;
        }

        try {
            setBusy(true);

            applyUiChange();

            if (saveToDb) {
                await updateDb();
            }

            setSnack?.({ open: true, msg: "VKN güncellendi ✅", sev: "success" });

            await onSaved?.();
            fetchUniqueVkns();
            onClose?.();
        } catch (e) {
            console.error("VknDegistirme onSubmit error:", e);
            const msg = e?.message || "VKN güncellenirken hata oluştu.";
            setErr(msg);
            setSnack?.({ open: true, msg, sev: "error" });
        } finally {
            setBusy(false);
        }
    }, [
        canEdit,
        closeVknListbox,
        newVkn,
        normalize,
        isValid,
        applyUiChange,
        saveToDb,
        updateDb,
        setSnack,
        onSaved,
        fetchUniqueVkns,
        onClose,
    ]);

    const paperSx = {
        borderRadius: "24px",
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(13,18,30,0.98) 0%, rgba(10,14,24,0.98) 100%)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
        backdropFilter: "blur(14px)",
        ...(s?.dialogPaper || {}),
    };

    const sectionSx = {
        p: 1.6,
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.025))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    };

    const selectedLabelSx = {
        color: "rgba(255,255,255,0.64)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.3,
    };

    return (
        <Dialog
            open={open}
            onClose={busy ? undefined : handleCancel}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: paperSx }}
        >
            <DialogTitle
                sx={{
                    px: 2.5,
                    py: 2.2,
                    color: "#fff",
                    background:
                        "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(99,102,241,0.08), rgba(255,255,255,0.02))",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <Stack spacing={1.2}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: "14px",
                                background: "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.14))",
                                border: "1px solid rgba(59,130,246,0.24)",
                            }}
                        >
                            <ReceiptLongIcon sx={{ color: "#93c5fd", fontSize: 22 }} />
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 950, fontSize: 19, letterSpacing: 0.2 }}>
                                VKN Değiştir
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.60)", fontSize: 12.5 }}>
                                Seçili kaydın VKN bilgisini güvenli şekilde güncelle
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                        <Chip
                            size="small"
                            label={`Sefer: ${row?.sefer ?? "-"}`}
                            sx={{
                                color: "#fff",
                                bgcolor: "rgba(59,130,246,0.22)",
                                fontWeight: 900,
                                border: "1px solid rgba(59,130,246,0.22)",
                            }}
                        />
                        <Chip
                            size="small"
                            label={`Satır: ${row?.__line_no ?? "-"}`}
                            sx={{
                                color: "#fff",
                                bgcolor: "rgba(255,255,255,0.08)",
                                fontWeight: 800,
                                border: "1px solid rgba(255,255,255,0.08)",
                            }}
                        />
                        {batchId ? (
                            <Chip
                                size="small"
                                label={`Batch: ${batchId}`}
                                sx={{
                                    color: "#d1fae5",
                                    bgcolor: "rgba(16,185,129,0.14)",
                                    fontWeight: 900,
                                    border: "1px solid rgba(16,185,129,0.20)",
                                }}
                            />
                        ) : null}
                        {!canEdit ? (
                            <Chip
                                size="small"
                                label="Sadece Görüntüleme"
                                sx={{
                                    color: "#fff",
                                    bgcolor: "rgba(245,158,11,0.14)",
                                    fontWeight: 900,
                                    border: "1px solid rgba(245,158,11,0.18)",
                                }}
                            />
                        ) : null}
                    </Stack>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, py: 2.2 }}>
                <Stack spacing={1.6}>
                    {err ? (
                        <Alert
                            severity="error"
                            variant="filled"
                            sx={{
                                borderRadius: "16px",
                                "& .MuiAlert-message": { fontWeight: 700 },
                            }}
                        >
                            {err}
                        </Alert>
                    ) : null}

                    {!canEdit ? (
                        <Alert
                            severity="warning"
                            variant="filled"
                            sx={{
                                borderRadius: "16px",
                                "& .MuiAlert-message": { fontWeight: 700 },
                            }}
                        >
                            Bu işlem için yazma yetkiniz yok.
                        </Alert>
                    ) : null}

                    <Box sx={sectionSx}>
                        <Stack spacing={1.4}>
                            <Stack direction="row" spacing={1.2} alignItems="center">
                                <BusinessIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>
                                    VKN Bilgisi
                                </Typography>
                            </Stack>

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.2}
                            >
                                <Box
                                    sx={{
                                        flex: 1,
                                        p: 1.4,
                                        borderRadius: "14px",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        background: "rgba(255,255,255,0.03)",
                                    }}
                                >
                                    <Typography sx={selectedLabelSx}>Mevcut VKN</Typography>
                                    <Typography sx={{ color: "#fff", fontWeight: 950, fontSize: 17, mt: 0.4 }}>
                                        {oldVkn || "— (boş)"}
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        flex: 1,
                                        p: 1.4,
                                        borderRadius: "14px",
                                        border: "1px solid rgba(59,130,246,0.16)",
                                        background:
                                            "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(255,255,255,0.03))",
                                    }}
                                >
                                    <Typography sx={selectedLabelSx}>Seçilen Yeni VKN</Typography>
                                    <Typography sx={{ color: "#bfdbfe", fontWeight: 950, fontSize: 17, mt: 0.4 }}>
                                        {newVkn || "—"}
                                    </Typography>
                                </Box>
                            </Stack>

                            <TextField
                                value={newVkn}
                                inputRef={inputRef}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    openVknListbox(e);
                                }}
                                label="Yeni VKN"
                                placeholder="Tıkla ve listeden seç"
                                disabled={busy || !canEdit}
                                fullWidth
                                inputProps={{ readOnly: true }}
                                helperText={
                                    uniqLoading
                                        ? "VKN listesi yükleniyor..."
                                        : canEdit
                                            ? "Alanı tıkla, açılan listeden VKN seç."
                                            : "Yetkisiz"
                                }
                                FormHelperTextProps={{
                                    sx: { color: "rgba(255,255,255,0.52)", fontWeight: 600 },
                                }}
                                sx={{
                                    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.72)" },
                                    "& .MuiOutlinedInput-root": {
                                        color: "#fff",
                                        borderRadius: "16px",
                                        background: "rgba(255,255,255,0.028)",
                                        transition: "all .18s ease",
                                        "& fieldset": { borderColor: "rgba(255,255,255,0.14)" },
                                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.24)" },
                                        "&.Mui-focused fieldset": { borderColor: "rgba(59,130,246,0.85)" },
                                    },
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton
                                            size="small"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                openVknListbox(e);
                                            }}
                                            disabled={busy || !canEdit}
                                            sx={{
                                                color: "rgba(255,255,255,0.85)",
                                                mr: 0.3,
                                            }}
                                        >
                                            <ArrowDownIcon />
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Stack>
                    </Box>

                    <Box sx={sectionSx}>
                        <Stack spacing={1.2}>
                            <Stack direction="row" spacing={1.1} alignItems="center">
                                <TuneIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>
                                    Uygulama Ayarları
                                </Typography>
                            </Stack>

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={applyAllSameVkn}
                                            onChange={(e) => setApplyAllSameVkn(e.target.checked)}
                                            disabled={busy || !canEdit}
                                        />
                                    }
                                    label={
                                        <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                                            Aynı VKN olanlara uygula
                                        </Typography>
                                    }
                                />

                                <Chip
                                    size="small"
                                    label={`Etkilenecek satır: ${affectedCount}`}
                                    sx={{
                                        color: "#dcfce7",
                                        bgcolor: "rgba(34,197,94,0.16)",
                                        fontWeight: 900,
                                        border: "1px solid rgba(34,197,94,0.20)",
                                    }}
                                />
                            </Stack>

                            <Box
                                sx={{
                                    p: 1.2,
                                    borderRadius: "14px",
                                    background: "rgba(255,255,255,0.025)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={saveToDb}
                                            onChange={(e) => setSaveToDb(e.target.checked)}
                                            disabled={busy || !canEdit}
                                        />
                                    }
                                    label={
                                        <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                                            Veritabanına da yaz
                                        </Typography>
                                    }
                                />
                                <Typography sx={{ color: "rgba(255,255,255,0.56)", fontSize: 12.5, mt: 0.2, ml: 0.2 }}>
                                    plaka_atamalar ve eşleşirse plakalar tablosu güncellenir.
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Popover
                        open={vknLb.open}
                        anchorEl={vknLb.anchorEl}
                        onClose={closeVknListbox}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        transformOrigin={{ vertical: "top", horizontal: "left" }}
                        disableRestoreFocus
                        PaperProps={{
                            sx: {
                                width: vknLb.anchorEl ? Math.min(620, vknLb.anchorEl.clientWidth + 40) : 500,
                                maxWidth: "92vw",
                                mt: 0.7,
                                background: "rgba(10,14,24,0.985)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                borderRadius: "18px",
                                overflow: "hidden",
                                boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
                                backdropFilter: "blur(12px)",
                            },
                        }}
                    >
                        <Box sx={{ p: 1.4 }}>
                            <Stack spacing={1.1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Box
                                        sx={{
                                            flex: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            px: 1.2,
                                            py: 0.9,
                                            borderRadius: "14px",
                                            bgcolor: "rgba(255,255,255,0.045)",
                                            border: "1px solid rgba(255,255,255,0.10)",
                                            "&:focus-within": {
                                                borderColor: "rgba(59,130,246,0.45)",
                                                boxShadow: "0 0 0 4px rgba(59,130,246,0.08)",
                                            },
                                        }}
                                    >
                                        <SearchIcon sx={{ color: "rgba(255,255,255,0.65)", fontSize: 18 }} />
                                        <InputBase
                                            autoFocus
                                            placeholder="VKN ara..."
                                            value={vknLb.query}
                                            onChange={(e) =>
                                                setVknLb((p) => ({ ...p, query: e.target.value }))
                                            }
                                            sx={{
                                                flex: 1,
                                                color: "#fff",
                                                fontSize: 13.5,
                                                fontWeight: 600,
                                            }}
                                        />
                                        {vknLb.query ? (
                                            <Chip
                                                size="small"
                                                label={`${vknOptions.length} sonuç`}
                                                sx={{
                                                    color: "#bfdbfe",
                                                    bgcolor: "rgba(59,130,246,0.12)",
                                                    fontWeight: 900,
                                                    border: "1px solid rgba(59,130,246,0.20)",
                                                }}
                                            />
                                        ) : null}
                                    </Box>

                                    <IconButton
                                        size="small"
                                        onClick={fetchUniqueVkns}
                                        disabled={uniqLoading}
                                        title="Yenile"
                                        sx={{
                                            color: "#fff",
                                            border: "1px solid rgba(255,255,255,0.10)",
                                            bgcolor: "rgba(255,255,255,0.04)",
                                            borderRadius: "12px",
                                            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                                        }}
                                    >
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                </Stack>

                                {uniqErr ? (
                                    <Alert
                                        severity="error"
                                        variant="outlined"
                                        sx={{
                                            color: "#fff",
                                            borderColor: "rgba(255,255,255,0.18)",
                                            borderRadius: "14px",
                                        }}
                                    >
                                        {uniqErr}
                                    </Alert>
                                ) : null}

                                {uniqLoading ? (
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1.2, px: 0.5 }}>
                                        <CircularProgress size={18} sx={{ color: "#fff" }} />
                                        <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                                            VKN’ler getiriliyor...
                                        </Typography>
                                    </Stack>
                                ) : (
                                    <List sx={{ mt: 0.2, maxHeight: 340, overflow: "auto", p: 0.3 }}>
                                        {vknOptions.length === 0 ? (
                                            <Box
                                                sx={{
                                                    py: 4,
                                                    textAlign: "center",
                                                    borderRadius: "14px",
                                                    border: "1px dashed rgba(255,255,255,0.10)",
                                                    background: "rgba(255,255,255,0.02)",
                                                }}
                                            >
                                                <Typography sx={{ color: "rgba(255,255,255,0.56)", fontSize: 13 }}>
                                                    Sonuç yok.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            vknOptions.map((v) => {
                                                const selected = normalize(newVkn) === normalize(v);

                                                return (
                                                    <ListItemButton
                                                        key={v}
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => pickVkn(v)}
                                                        sx={{
                                                            borderRadius: "14px",
                                                            px: 1.2,
                                                            py: 0.9,
                                                            mb: 0.55,
                                                            border: selected
                                                                ? "1px solid rgba(59,130,246,0.35)"
                                                                : "1px solid rgba(255,255,255,0.06)",
                                                            background: selected
                                                                ? "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(255,255,255,0.03))"
                                                                : "rgba(255,255,255,0.025)",
                                                            "&:hover": {
                                                                bgcolor: "rgba(255,255,255,0.08)",
                                                                transform: "translateY(-1px)",
                                                            },
                                                            transition: "all .16s ease",
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={v}
                                                            secondary={selected ? "Seçili VKN" : null}
                                                            primaryTypographyProps={{
                                                                sx: {
                                                                    color: "#fff",
                                                                    fontWeight: 900,
                                                                    fontSize: 13.5,
                                                                    letterSpacing: 0.2,
                                                                },
                                                            }}
                                                            secondaryTypographyProps={{
                                                                sx: {
                                                                    color: "#93c5fd",
                                                                    fontWeight: 700,
                                                                    fontSize: 12,
                                                                    mt: 0.25,
                                                                },
                                                            }}
                                                        />
                                                    </ListItemButton>
                                                );
                                            })
                                        )}
                                    </List>
                                )}
                            </Stack>
                        </Box>
                    </Popover>
                </Stack>
            </DialogContent>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

            <DialogActions
                sx={{
                    p: 2,
                    gap: 1,
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.02)",
                }}
            >
                <Typography sx={{ color: "rgba(255,255,255,0.42)", fontSize: 12.5, pl: 0.5 }}>
                    Değişiklik kaydedildiğinde liste ve veritabanı birlikte güncellenebilir.
                </Typography>

                <Stack direction="row" spacing={1}>
                    <Button
                        onClick={handleCancel}
                        disabled={busy}
                        sx={{
                            color: "#fff",
                            opacity: 0.95,
                            borderRadius: "12px",
                            px: 2,
                            py: 1,
                            textTransform: "none",
                            fontWeight: 800,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            "&:hover": { background: "rgba(255,255,255,0.08)" },
                        }}
                    >
                        Vazgeç
                    </Button>

                    <Button
                        onClick={onSubmit}
                        disabled={busy || !row || !canEdit}
                        variant="contained"
                        startIcon={!busy ? <SaveOutlinedIcon /> : null}
                        sx={{
                            borderRadius: "12px",
                            fontWeight: 950,
                            px: 2.5,
                            py: 1,
                            textTransform: "none",
                            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                            boxShadow: "0 14px 34px rgba(59,130,246,0.28)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                            },
                            "&.Mui-disabled": {
                                background: "rgba(255,255,255,0.10)",
                                color: "rgba(255,255,255,0.35)",
                            },
                        }}
                    >
                        {busy ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CircularProgress size={16} sx={{ color: "#fff" }} />
                                <span>Kaydediliyor...</span>
                            </Stack>
                        ) : (
                            "Kaydet"
                        )}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}