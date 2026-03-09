import React, { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

import {
    Box,
    Typography,
    InputBase,
    Chip,
    Button,
    Stack,
    Snackbar,
    Alert,
    CircularProgress,
    Divider,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    LinearProgress,
    Avatar,
    Tooltip,
    Fade,
} from "@mui/material";

import {
    FileDownload as FileDownloadIcon,
    Search as SearchIcon,
    Timeline as TimelineIcon,
    Refresh as RefreshIcon,
    EmojiEvents as EmojiEventsIcon,
    LocalShipping as LocalShippingIcon,
    Payments as PaymentsIcon,
    Person as PersonIcon,
    Route as RouteIcon,
    Inventory2 as Inventory2Icon,
    Bolt as BoltIcon,
    QueryStats as QueryStatsIcon,
    CalendarMonth as CalendarMonthIcon,
} from "@mui/icons-material";

import * as XLSX from "xlsx";

function useDebouncedValue(value, delayMs = 120) {
    const [deb, setDeb] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDeb(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return deb;
}

function toNumberSafe(v) {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s) return null;
    const cleaned = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

function safeStr(v) {
    return String(v ?? "").trim();
}

function formatDateLabel(value) {
    if (!value) return "—";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;

    try {
        return new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(dt);
    } catch {
        return value;
    }
}

function MiniStat({ icon, label, value, sub, sxCard }) {
    return (
        <Box sx={sxCard}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.2}>
                <Box>
                    <Typography sx={{ color: "rgba(255,255,255,0.64)", fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>
                        {label}
                    </Typography>
                    <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: { xs: 24, md: 28 }, mt: 0.8, lineHeight: 1.05 }}>
                        {value}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.50)", fontSize: 12, mt: 0.9 }}>{sub}</Typography>
                </Box>

                <Avatar
                    variant="rounded"
                    sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.10)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                >
                    {icon}
                </Avatar>
            </Stack>
        </Box>
    );
}

function ProgressList({ title, icon, chip, items, maxValue, renderMeta, emptyText, sxPanel, sxPill, sxProgress }) {
    return (
        <Box sx={sxPanel}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                        variant="rounded"
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2.5,
                            bgcolor: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.10)",
                        }}
                    >
                        {icon}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "#fff" }}>{title}</Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.50)", fontSize: 12 }}>Öne çıkan dağılım</Typography>
                    </Box>
                </Stack>
                <Chip label={chip} size="small" sx={sxPill} />
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1.6 }} />

            {items.length === 0 ? (
                <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>{emptyText}</Typography>
            ) : (
                <Stack spacing={1.25}>
                    {items.map((item) => {
                        const pct = Math.round(((item.count || 0) / (maxValue || 1)) * 100);
                        return (
                            <Fade in key={item.name} timeout={350}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.7 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                        <Tooltip title={item.name} arrow>
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: 13,
                                                    maxWidth: 260,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    color: "rgba(255,255,255,0.93)",
                                                }}
                                            >
                                                {item.name}
                                            </Typography>
                                        </Tooltip>
                                        {renderMeta(item)}
                                    </Box>
                                    <LinearProgress variant="determinate" value={pct} sx={sxProgress} />
                                </Box>
                            </Fade>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
}

export default function TamamlananSeferler({ batchId = null }) {
    const [q, setQ] = useState("");
    const qDeb = useDebouncedValue(q, 200);
    const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadErr, setLoadErr] = useState("");

    const ROW_PAGE = 800;

    const mapDbToRow = useCallback((r) => {
        const id = r?.id ?? `${r?.batch_id ?? "batch"}_${r?.line_no ?? Math.random()}`;

        return {
            id,
            batch_id: r?.batch_id ?? null,
            line_no: r?.line_no ?? null,
            seferno: r?.seferno ?? "",
            sevktarihi: r?.sevktarihi ?? "",
            yukleyendepo: r?.yukleyendepo ?? "",
            kalkis: r?.kalkis ?? "",
            araccinsi: r?.araccinsi ?? "",
            cekici: r?.cekici ?? "",
            dorse: r?.dorse ?? "",
            tc: r?.tc ?? "",
            surucu: r?.surucu ?? "",
            telefon: r?.telefon ?? "",
            faturavkn: r?.faturavkn ?? "",
            varis1: r?.varis1 ?? "",
            varis2: r?.varis2 ?? "",
            varis3: r?.varis3 ?? "",
            irsaliyeno: r?.irsaliyeno ?? "",
            datalogerno: r?.datalogerno ?? "",
            navlun: r?.navlun ?? "",
            teslimattarihsaat: r?.teslimattarihsaat ?? "",
            updated_at: r?.updated_at ?? "",
        };
    }, []);

    const fetchCompleted = useCallback(async () => {
        setLoading(true);
        setLoadErr("");
        try {
            let all = [];
            let from = 0;

            while (true) {
                let qb = supabase
                    .from("tamamlanan_seferler")
                    .select(
                        "id,batch_id,line_no,seferno,sevktarihi,yukleyendepo,kalkis,araccinsi,cekici,dorse,tc,surucu,telefon,faturavkn,varis1,varis2,varis3,irsaliyeno,datalogerno,navlun,teslimattarihsaat,updated_at"
                    )
                    .order("id", { ascending: false })
                    .range(from, from + ROW_PAGE - 1);

                if (batchId) qb = qb.eq("batch_id", batchId);

                const { data, error } = await qb;
                if (error) throw error;

                all = all.concat(data || []);
                if (!data || data.length < ROW_PAGE) break;
                from += ROW_PAGE;
            }

            setRows(all.map(mapDbToRow));
            setSnack({ open: true, msg: `Tamamlanan seferler yüklendi (${all.length})`, sev: "success" });
        } catch (e) {
            console.error("fetchCompleted error:", e);
            setLoadErr(e?.message || "Veri çekme hatası");
            setSnack({ open: true, msg: e?.message || "Veri çekme hatası", sev: "error" });
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [batchId, mapDbToRow]);

    useEffect(() => {
        fetchCompleted();
    }, [fetchCompleted]);

    const filteredRows = useMemo(() => {
        const query = (qDeb || "").trim().toLowerCase();
        if (!query) return rows;

        const keys = [
            "seferno",
            "sevktarihi",
            "cekici",
            "dorse",
            "surucu",
            "tc",
            "telefon",
            "faturavkn",
            "varis1",
            "varis2",
            "varis3",
            "irsaliyeno",
            "datalogerno",
            "navlun",
            "teslimattarihsaat",
            "updated_at",
            "yukleyendepo",
            "kalkis",
            "araccinsi",
            "batch_id",
        ];

        return rows.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(query)));
    }, [rows, qDeb]);

    const analytics = useMemo(() => {
        const list = filteredRows;

        const total = list.length;
        const uniqueDrivers = new Set(list.map((r) => safeStr(r.surucu)).filter(Boolean)).size;

        let navlunSum = 0;
        let navlunCount = 0;

        const byDriver = new Map();
        const byVaris1 = new Map();
        const byDepot = new Map();

        for (const r of list) {
            const n = toNumberSafe(r.navlun);
            if (n != null) {
                navlunSum += n;
                navlunCount += 1;
            }

            const drv = safeStr(r.surucu) || "Bilinmiyor";
            if (!byDriver.has(drv)) byDriver.set(drv, { name: drv, count: 0, navSum: 0, navCount: 0 });
            const d = byDriver.get(drv);
            d.count += 1;
            if (n != null) {
                d.navSum += n;
                d.navCount += 1;
            }

            const v1 = safeStr(r.varis1) || "Bilinmiyor";
            byVaris1.set(v1, (byVaris1.get(v1) || 0) + 1);

            const depo = safeStr(r.yukleyendepo) || "Bilinmiyor";
            byDepot.set(depo, (byDepot.get(depo) || 0) + 1);
        }

        const drivers = Array.from(byDriver.values())
            .map((d) => ({ ...d, avgNavlun: d.navCount > 0 ? d.navSum / d.navCount : null }))
            .sort((a, b) => b.count - a.count);

        const topDrivers = drivers.slice(0, 8);

        const varis = Array.from(byVaris1.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const depots = Array.from(byDepot.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        const avgNavlun = navlunCount > 0 ? navlunSum / navlunCount : null;
        const topDriver = topDrivers[0] || null;
        const latestUpdate = list[0]?.updated_at || "";

        return { total, uniqueDrivers, navlunSum, avgNavlun, topDrivers, topVaris: varis, topDepots: depots, topDriver, latestUpdate };
    }, [filteredRows]);

    const formatMoney = (n) => {
        if (n == null) return "—";
        try {
            return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
        } catch {
            return String(Math.round(n));
        }
    };

    const onExport = useCallback(() => {
        try {
            const exportRows = filteredRows.map((r) => ({
                Batch: r.batch_id ?? "",
                LineNo: r.line_no ?? "",
                SeferNo: r.seferno,
                SevkTarihi: r.sevktarihi,
                YukleyenDepo: r.yukleyendepo,
                Kalkis: r.kalkis,
                AracCinsi: r.araccinsi,
                Cekici: r.cekici,
                Dorse: r.dorse,
                TC: r.tc,
                Surucu: r.surucu,
                Telefon: r.telefon,
                FaturaVKN: r.faturavkn,
                Varis1: r.varis1,
                Varis2: r.varis2,
                Varis3: r.varis3,
                IrsaliyeNo: r.irsaliyeno,
                DatalogerNo: r.datalogerno,
                Navlun: r.navlun,
                Teslimat: r.teslimattarihsaat,
                UpdatedAt: r.updated_at,
            }));

            const ws = XLSX.utils.json_to_sheet(exportRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "TamamlananSeferler");

            const fileName = `tamamlanan-seferler_${batchId || "tum"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);

            setSnack({ open: true, msg: "Excel indirildi ✅", sev: "success" });
        } catch (e) {
            console.error("onExport error:", e);
            setSnack({ open: true, msg: e?.message || "Excel dışa aktarma hatası", sev: "error" });
        }
    }, [filteredRows, batchId]);

    const sx = {
        page: {
            minHeight: "100vh",
            background:
                "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at top right, rgba(16,185,129,0.10), transparent 22%), linear-gradient(180deg, #060913 0%, #090f1d 45%, #07111a 100%)",
            color: "#fff",
            p: { xs: 1.5, md: 2.5 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "relative",
            overflow: "hidden",
        },
        glow: {
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
                "radial-gradient(700px 280px at 10% 0%, rgba(59,130,246,0.12), transparent 65%), radial-gradient(680px 260px at 100% 10%, rgba(139,92,246,0.10), transparent 70%)",
            opacity: 0.9,
        },
        hero: {
            position: "relative",
            overflow: "hidden",
            borderRadius: 5,
            p: { xs: 2, md: 3 },
            background:
                "linear-gradient(135deg, rgba(14,22,38,0.92) 0%, rgba(11,18,31,0.82) 55%, rgba(15,23,42,0.88) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter: "blur(18px)",
        },
        heroOverlay: {
            position: "absolute",
            inset: 0,
            background:
                "radial-gradient(600px 220px at 15% 10%, rgba(59,130,246,0.22), transparent 60%), radial-gradient(400px 220px at 80% 20%, rgba(16,185,129,0.12), transparent 60%)",
            pointerEvents: "none",
        },
        kicker: { color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 800, letterSpacing: 2.2 },
        title: {
            fontSize: { xs: 28, md: 38 },
            fontWeight: 950,
            letterSpacing: -0.8,
            lineHeight: 1,
            background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.78) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        sub: {
            color: "rgba(255,255,255,0.62)",
            mt: 1,
            maxWidth: 760,
            fontSize: { xs: 13, md: 14 },
        },
        heroBottom: {
            mt: 2.2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.25fr auto" },
            gap: 1.5,
            alignItems: "end",
        },
        heroInfoBar: {
            borderRadius: 3.5,
            p: 1.4,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        },
        pill: {
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.9)",
            fontWeight: 700,
            backdropFilter: "blur(8px)",
        },
        cardRow: {
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "1fr 1fr 1fr 1fr" },
            gap: 1.5,
        },
        kpi: {
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
            p: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            background:
                "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))",
            boxShadow: "0 14px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            minHeight: 148,
            '&::before': {
                content: '""',
                position: 'absolute',
                top: -40,
                right: -20,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%)',
            },
        },
        controlBar: {
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.1fr auto" },
            gap: 1.5,
            alignItems: "stretch",
        },
        searchPanel: {
            borderRadius: 4,
            p: 1.2,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
            boxShadow: "0 14px 36px rgba(0,0,0,0.24)",
            backdropFilter: "blur(16px)",
        },
        search: {
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1.25,
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(5,10,20,0.55)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        },
        searchInput: { color: "#fff", flex: 1, fontSize: 14 },
        btn: {
            borderRadius: 999,
            px: 2,
            height: 42,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.045)",
            color: "#fff",
            textTransform: "none",
            fontWeight: 800,
            boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
            '&:hover': {
                background: "rgba(255,255,255,0.09)",
                borderColor: "rgba(255,255,255,0.18)",
            },
        },
        primaryBtn: {
            borderRadius: 999,
            px: 2.2,
            height: 42,
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "#fff",
            textTransform: "none",
            fontWeight: 900,
            boxShadow: "0 18px 34px rgba(37,99,235,0.34)",
            '&:hover': { background: "linear-gradient(135deg, #4f8ef7, #2d6df1)" },
        },
        panel: {
            borderRadius: 4,
            p: 2,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
            backdropFilter: "blur(16px)",
        },
        panelGrid: {
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "1.2fr 1fr 1fr" },
            gap: 1.5,
        },
        tableShell: {
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            boxShadow: "0 20px 60px rgba(0,0,0,0.30)",
            backdropFilter: "blur(16px)",
        },
        tableHeadBar: {
            p: 1.6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0))",
        },
        th: {
            color: "rgba(255,255,255,0.78)",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0.8,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            whiteSpace: "nowrap",
            backgroundColor: "rgba(6,10,18,0.92)",
            backdropFilter: "blur(14px)",
            position: "sticky",
            top: 0,
            zIndex: 5,
            py: 1.4,
        },
        td: {
            color: "rgba(255,255,255,0.92)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontSize: 13,
            whiteSpace: "nowrap",
            maxWidth: 240,
            overflow: "hidden",
            textOverflow: "ellipsis",
            py: 1.25,
        },
        tr: {
            transition: "all .18s ease",
            '&:nth-of-type(odd)': { backgroundColor: "rgba(255,255,255,0.012)" },
            '&:hover': {
                backgroundColor: "rgba(59,130,246,0.085)",
                transform: "translateY(-1px)",
            },
        },
        progress: {
            height: 9,
            borderRadius: 99,
            backgroundColor: "rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
            '& .MuiLinearProgress-bar': {
                borderRadius: 99,
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            },
        },
    };

    const maxDriverCount = analytics.topDrivers[0]?.count || 1;
    const maxVarisCount = analytics.topVaris[0]?.count || 1;
    const maxDepotCount = analytics.topDepots[0]?.count || 1;

    return (
        <Box sx={sx.page}>
            <Box sx={sx.glow} />

            <Box sx={sx.hero}>
                <Box sx={sx.heroOverlay} />

                <Stack direction="row" alignItems="center" spacing={1.1} sx={{ mb: 1.2, position: "relative", zIndex: 1, flexWrap: "wrap" }}>
                    <Typography sx={sx.kicker}>LOGISTICS INTELLIGENCE • COMPLETED TRIPS</Typography>
                    <Chip icon={<BoltIcon sx={{ fontSize: 16 }} />} label="Premium Dashboard" sx={sx.pill} />
                    <Chip icon={<QueryStatsIcon sx={{ fontSize: 16 }} />} label="Live Analytics" sx={sx.pill} />
                    {batchId ? <Chip label={`Batch: ${batchId}`} sx={sx.pill} /> : null}
                    {loading ? (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 1 }}>
                            <CircularProgress size={14} sx={{ color: "#93c5fd" }} />
                            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Veriler yenileniyor…</Typography>
                        </Stack>
                    ) : null}
                </Stack>

                <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Typography sx={sx.title}>Tamamlanan Seferler</Typography>
                    <Typography sx={sx.sub}>
                        Arşiv kayıtlarını yüksek görünürlükle izle, sürücü verimini karşılaştır, yoğun varış lokasyonlarını yakala ve navlun akışını tek ekranda yönet.
                    </Typography>

                    <Box sx={sx.heroBottom}>
                        <Box sx={sx.heroInfoBar}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                                <Chip icon={<LocalShippingIcon />} label={`${analytics.total} kayıt`} sx={sx.pill} />
                                <Chip icon={<PersonIcon />} label={`${analytics.uniqueDrivers} sürücü`} sx={sx.pill} />
                                <Chip icon={<PaymentsIcon />} label={`Toplam ${formatMoney(analytics.navlunSum)} ₺`} sx={sx.pill} />
                                <Chip icon={<CalendarMonthIcon />} label={`Son güncelleme ${formatDateLabel(analytics.latestUpdate)}`} sx={sx.pill} />
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={1.2} sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                            <Button startIcon={<RefreshIcon />} sx={sx.btn} onClick={fetchCompleted} disabled={loading}>
                                Yenile
                            </Button>
                            <Button
                                startIcon={<FileDownloadIcon />}
                                sx={sx.primaryBtn}
                                onClick={onExport}
                                disabled={loading || filteredRows.length === 0}
                            >
                                Excel'e Aktar
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            <Box sx={sx.controlBar}>
                <Box sx={sx.searchPanel}>
                    <Stack spacing={1.2}>
                        <Box sx={sx.search}>
                            <SearchIcon sx={{ color: "#60a5fa", fontSize: 20 }} />
                            <InputBase
                                placeholder="Sefer no, sürücü, varış, VKN, dorse, telefon..."
                                sx={sx.searchInput}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </Box>
                        <Typography sx={{ color: "rgba(255,255,255,0.48)", fontSize: 12, px: 0.5 }}>
                            Arama tüm önemli alanlarda anlık filtreleme yapar.
                        </Typography>
                    </Stack>
                </Box>

                <Box sx={sx.searchPanel}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ height: "100%" }}>
                        <Chip label={`Filtrelenmiş: ${filteredRows.length}`} sx={sx.pill} />
                        <Chip label={`Sürücü: ${analytics.uniqueDrivers}`} sx={sx.pill} />
                        <Chip label={`Ort. Navlun: ${formatMoney(analytics.avgNavlun)}`} sx={sx.pill} />
                        <Chip label={`Şampiyon: ${analytics.topDriver?.name || "—"}`} sx={sx.pill} />
                    </Stack>
                </Box>
            </Box>

            {!!loadErr ? (
                <Alert severity="error" variant="filled" sx={{ borderRadius: 3, boxShadow: "0 12px 28px rgba(0,0,0,0.22)" }}>
                    {loadErr}
                </Alert>
            ) : null}

            <Box sx={sx.cardRow}>
                <MiniStat
                    icon={<LocalShippingIcon />}
                    label="Toplam Sefer"
                    value={analytics.total}
                    sub="Aktif filtreye göre listelenen tamamlanmış iş"
                    sxCard={sx.kpi}
                />
                <MiniStat
                    icon={<PaymentsIcon />}
                    label="Toplam Navlun"
                    value={formatMoney(analytics.navlunSum)}
                    sub="Sayısal olarak okunabilen navlun toplamı"
                    sxCard={sx.kpi}
                />
                <MiniStat
                    icon={<RouteIcon />}
                    label="Ortalama Navlun"
                    value={formatMoney(analytics.avgNavlun)}
                    sub="Sadece parse edilebilen değerler dahil"
                    sxCard={sx.kpi}
                />
                <MiniStat
                    icon={<EmojiEventsIcon />}
                    label="En İyi Sürücü"
                    value={analytics.topDriver?.name || "—"}
                    sub={analytics.topDriver ? `${analytics.topDriver.count} sefer • ∑ ${formatMoney(analytics.topDriver.navSum)}` : "Veri bulunamadı"}
                    sxCard={sx.kpi}
                />
            </Box>

            <Box sx={sx.panelGrid}>
                <ProgressList
                    title="Sürücü Analizleri"
                    icon={<PersonIcon />}
                    chip="Top 8"
                    items={analytics.topDrivers}
                    maxValue={maxDriverCount}
                    emptyText="Gösterilecek sürücü verisi yok."
                    sxPanel={sx.panel}
                    sxPill={sx.pill}
                    sxProgress={sx.progress}
                    renderMeta={(d) => (
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <Chip size="small" label={`${d.count} iş`} sx={sx.pill} />
                            <Chip size="small" label={`∑ ${formatMoney(d.navSum)}`} sx={sx.pill} />
                        </Stack>
                    )}
                />

                <ProgressList
                    title="Varış Yoğunluğu"
                    icon={<TimelineIcon />}
                    chip="Varış 1"
                    items={analytics.topVaris}
                    maxValue={maxVarisCount}
                    emptyText="Gösterilecek varış verisi yok."
                    sxPanel={sx.panel}
                    sxPill={sx.pill}
                    sxProgress={sx.progress}
                    renderMeta={(v) => <Chip size="small" label={`${v.count} sefer`} sx={sx.pill} />}
                />

                <ProgressList
                    title="Yükleyen Depo"
                    icon={<Inventory2Icon />}
                    chip="Top 6"
                    items={analytics.topDepots}
                    maxValue={maxDepotCount}
                    emptyText="Gösterilecek depo verisi yok."
                    sxPanel={sx.panel}
                    sxPill={sx.pill}
                    sxProgress={sx.progress}
                    renderMeta={(v) => <Chip size="small" label={`${v.count} kayıt`} sx={sx.pill} />}
                />
            </Box>

            <Paper sx={sx.tableShell}>
                <Box sx={sx.tableHeadBar}>
                    <Box>
                        <Typography sx={{ fontWeight: 900, color: "#fff", fontSize: 16 }}>Arşiv Kayıtları</Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 12, mt: 0.4 }}>
                            Sticky başlıklar, yatay kaydırma ve yüksek kontrast veri görünümü.
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip label={`${filteredRows.length} satır`} sx={sx.pill} />
                        <Chip label="Dark Glass UI" sx={sx.pill} />
                    </Stack>
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                <Box sx={{ maxHeight: "58vh", overflow: "auto" }}>
                    <Table stickyHeader size="small" sx={{ minWidth: 1460 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={sx.th}>SEFER</TableCell>
                                <TableCell sx={sx.th}>SEVK</TableCell>
                                <TableCell sx={sx.th}>ÇIKIŞ</TableCell>
                                <TableCell sx={sx.th}>ÇEKİCİ</TableCell>
                                <TableCell sx={sx.th}>DORSE</TableCell>
                                <TableCell sx={sx.th}>SÜRÜCÜ</TableCell>
                                <TableCell sx={sx.th}>VKN</TableCell>
                                <TableCell sx={sx.th}>T.C.</TableCell>
                                <TableCell sx={sx.th}>TEL</TableCell>
                                <TableCell sx={sx.th}>VARIŞ 1</TableCell>
                                <TableCell sx={sx.th}>DATALOGER</TableCell>
                                <TableCell sx={sx.th}>İRSALİYE</TableCell>
                                <TableCell sx={sx.th}>NAVLUN</TableCell>
                                <TableCell sx={sx.th}>UPDATED</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={14} sx={{ ...sx.td, color: "rgba(255,255,255,0.6)", py: 4, textAlign: "center" }}>
                                        Kayıt bulunamadı.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRows.map((r) => (
                                    <TableRow key={r.id} sx={sx.tr}>
                                        <TableCell sx={sx.td}>{r.seferno || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.sevktarihi || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.kalkis || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.cekici || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.dorse || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.surucu || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.faturavkn || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.tc || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.telefon || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.varis1 || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.datalogerno || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.irsaliyeno || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.navlun || "—"}</TableCell>
                                        <TableCell sx={sx.td}>{r.updated_at || "—"}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((p) => ({ ...p, open: false }))}>
                <Alert severity={snack.sev} variant="filled" sx={{ borderRadius: "14px", boxShadow: "0 14px 34px rgba(0,0,0,0.26)" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
