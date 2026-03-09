// src/plakaAtama/SoforSwapDialog.js
import React, { useMemo } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    List,
    ListItemButton,
    ListItemText,
    Button,
    InputBase,
    Divider,
    Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";

export default function SoforSwapDialog({
    open,
    onClose,
    s,
    sourceRow,
    sourcePlaka,
    query,
    setQuery,
    targets = [],
    targetPlakaId,
    setTargetPlakaId,
    onSwap,
    canEdit = true,
}) {
    const filteredTargets = useMemo(() => {
        const q = (query || "").trim().toLocaleLowerCase("tr");

        if (!q) return targets;

        return targets.filter((p) => {
            const values = [
                p?.cekici,
                p?.dorse,
                p?.ad_soyad,
                p?.telefon,
                p?.tc_no,
            ]
                .filter(Boolean)
                .map((v) => String(v).toLocaleLowerCase("tr"));

            return values.some((v) => v.includes(q));
        });
    }, [targets, query]);

    const selectedTarget = useMemo(() => {
        return filteredTargets.find((x) => x.id === targetPlakaId) || targets.find((x) => x.id === targetPlakaId);
    }, [filteredTargets, targets, targetPlakaId]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: "22px",
                    overflow: "hidden",
                    background:
                        "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(17,24,39,0.98) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
                    backdropFilter: "blur(14px)",
                    ...(s?.swapDialogPaper || {}),
                },
            }}
        >
            <DialogTitle
                sx={{
                    px: 2.5,
                    py: 2,
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    background:
                        "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.10))",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    ...(s?.swapDialogTitle || {}),
                }}
            >
                <SwapHorizRoundedIcon sx={{ color: "#60a5fa" }} />
                Şoför Değiştir
            </DialogTitle>

            <DialogContent
                dividers
                sx={{
                    px: 2.5,
                    py: 2,
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "transparent",
                    ...(s?.swapDialogContent || {}),
                }}
            >
                {!canEdit ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>
                        Bu işlem için yazma yetkiniz yok.
                    </Typography>
                ) : !sourceRow ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.75)" }}>
                        Kaynak satır bulunamadı.
                    </Typography>
                ) : !sourcePlaka ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}>
                        Bu satırdaki araç plakalar tablosunda bulunamadı.
                        <br />
                        Çekici: <b>{sourceRow?.cekici || "-"}</b>
                        <br />
                        Dorse: <b>{sourceRow?.dorse || "-"}</b>
                    </Typography>
                ) : (
                    <>
                        <Typography
                            sx={{
                                color: "#e5e7eb",
                                fontWeight: 800,
                                mb: 1.2,
                                fontSize: 13,
                                letterSpacing: 0.3,
                            }}
                        >
                            KAYNAK ARAÇ
                        </Typography>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: "18px",
                                background:
                                    "linear-gradient(135deg, rgba(59,130,246,0.14), rgba(255,255,255,0.03))",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                                ...(s?.swapCard || {}),
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <LocalShippingOutlinedIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>
                                    {sourcePlaka.cekici || "-"} • {sourcePlaka.dorse || "-"}
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                                <PersonOutlineIcon sx={{ color: "rgba(255,255,255,0.75)", fontSize: 18 }} />
                                <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 700 }}>
                                    {sourcePlaka.ad_soyad || "-"}
                                </Typography>
                            </Box>

                            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                                Telefon: <b>{sourcePlaka.telefon || "-"}</b>
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                                TC: <b>{sourcePlaka.tc_no || "-"}</b>
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 2.2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 1.5,
                                    py: 1.1,
                                    borderRadius: "14px",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    background: "rgba(255,255,255,0.04)",
                                    transition: "all .2s ease",
                                    "&:focus-within": {
                                        border: "1px solid rgba(59,130,246,0.45)",
                                        boxShadow: "0 0 0 4px rgba(59,130,246,0.10)",
                                        background: "rgba(255,255,255,0.05)",
                                    },
                                    ...(s?.search || {}),
                                }}
                            >
                                <SearchIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                                <InputBase
                                    placeholder="Hedef aracı ara (çekici / dorse / isim / tc / tel)"
                                    sx={{
                                        flex: 1,
                                        color: "#fff",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        ...(s?.searchInput || {}),
                                    }}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                {!!query && (
                                    <Chip
                                        label={`${filteredTargets.length} sonuç`}
                                        size="small"
                                        sx={{
                                            bgcolor: "rgba(59,130,246,0.14)",
                                            color: "#93c5fd",
                                            fontWeight: 800,
                                            border: "1px solid rgba(59,130,246,0.25)",
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>

                        {selectedTarget && (
                            <Box
                                sx={{
                                    mt: 1.5,
                                    p: 1.4,
                                    borderRadius: "14px",
                                    background: "rgba(34,197,94,0.10)",
                                    border: "1px solid rgba(34,197,94,0.22)",
                                }}
                            >
                                <Typography sx={{ color: "#bbf7d0", fontWeight: 800, fontSize: 13 }}>
                                    Seçilen Hedef
                                </Typography>
                                <Typography sx={{ color: "#fff", fontWeight: 800, mt: 0.4 }}>
                                    {selectedTarget.cekici || "-"} • {selectedTarget.dorse || "-"}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                                    {selectedTarget.ad_soyad || "-"} | {selectedTarget.telefon || "-"} |{" "}
                                    {selectedTarget.tc_no || "-"}
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 1.8, borderColor: "rgba(255,255,255,0.06)" }} />

                        <Box sx={{ maxHeight: 340, overflow: "auto", pr: 0.3 }}>
                            {filteredTargets.length === 0 ? (
                                <Box
                                    sx={{
                                        py: 4,
                                        textAlign: "center",
                                        borderRadius: "16px",
                                        border: "1px dashed rgba(255,255,255,0.10)",
                                        background: "rgba(255,255,255,0.02)",
                                    }}
                                >
                                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontWeight: 700 }}>
                                        Sonuç bulunamadı.
                                    </Typography>
                                </Box>
                            ) : (
                                <List dense sx={{ p: 0, display: "grid", gap: 1 }}>
                                    {filteredTargets.map((p) => {
                                        const selected = targetPlakaId === p.id;

                                        return (
                                            <ListItemButton
                                                key={p.id}
                                                onClick={() => setTargetPlakaId(p.id)}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: "16px",
                                                    alignItems: "flex-start",
                                                    border: selected
                                                        ? "1px solid rgba(59,130,246,0.40)"
                                                        : "1px solid rgba(255,255,255,0.06)",
                                                    background: selected
                                                        ? "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(255,255,255,0.04))"
                                                        : "rgba(255,255,255,0.03)",
                                                    transition: "all .18s ease",
                                                    "&:hover": {
                                                        background:
                                                            "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(255,255,255,0.04))",
                                                        transform: "translateY(-1px)",
                                                        borderColor: "rgba(59,130,246,0.22)",
                                                    },
                                                    ...(s?.listItemBtn || {}),
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                gap: 1,
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    color: "#fff",
                                                                    fontWeight: 900,
                                                                    fontSize: 14,
                                                                }}
                                                            >
                                                                {p.cekici || "-"} • {p.dorse || "-"}
                                                            </Typography>

                                                            {selected && (
                                                                <Chip
                                                                    label="Seçildi"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 24,
                                                                        bgcolor: "rgba(59,130,246,0.18)",
                                                                        color: "#bfdbfe",
                                                                        fontWeight: 800,
                                                                        border: "1px solid rgba(59,130,246,0.28)",
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ mt: 0.6 }}>
                                                            <Typography
                                                                sx={{
                                                                    color: "rgba(255,255,255,0.82)",
                                                                    fontWeight: 700,
                                                                    fontSize: 13,
                                                                }}
                                                            >
                                                                {p.ad_soyad || "-"}
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    color: "rgba(255,255,255,0.58)",
                                                                    fontWeight: 600,
                                                                    fontSize: 12,
                                                                    mt: 0.2,
                                                                }}
                                                            >
                                                                {p.telefon || "-"} | {p.tc_no || "-"}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </ListItemButton>
                                        );
                                    })}
                                </List>
                            )}
                        </Box>

                        <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.7 }}>
                            * Bu işlem sadece <b>ad_soyad</b>, <b>telefon</b> ve <b>tc_no</b> alanlarını iki araç arasında
                            karşılıklı değiştirir.
                        </Typography>
                    </>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    p: 2,
                    gap: 1,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                }}
            >
                <Button
                    onClick={onClose}
                    sx={{
                        color: "rgba(255,255,255,0.85)",
                        px: 2,
                        py: 1,
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 800,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        "&:hover": { background: "rgba(255,255,255,0.08)" },
                        ...(s?.secondaryBtn || {}),
                    }}
                >
                    Vazgeç
                </Button>

                <Button
                    onClick={onSwap}
                    variant="contained"
                    disabled={!canEdit || !sourcePlaka?.id || !targetPlakaId}
                    sx={{
                        px: 2.2,
                        py: 1,
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 900,
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        boxShadow: "0 10px 24px rgba(37,99,235,0.30)",
                        "&:hover": {
                            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                        },
                        "&.Mui-disabled": {
                            background: "rgba(255,255,255,0.10)",
                            color: "rgba(255,255,255,0.35)",
                        },
                        ...(s?.primaryBtn || {}),
                    }}
                >
                    Değiştir
                </Button>
            </DialogActions>
        </Dialog>
    );
}