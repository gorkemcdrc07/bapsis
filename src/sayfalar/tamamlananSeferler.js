import React, { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import * as XLSX from "xlsx";

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
    Avatar,
    Tooltip,
    TableSortLabel,
} from "@mui/material";

import {
    FileDownload as FileDownloadIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    LocalShipping as LocalShippingIcon,
    Payments as PaymentsIcon,
    Person as PersonIcon,
    Place as PlaceIcon,
    Warehouse as WarehouseIcon,
    CalendarMonth as CalendarMonthIcon,
    Insights as InsightsIcon,
} from "@mui/icons-material";

function useDebouncedValue(value, delayMs = 180) {
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

function formatMoney(n) {
    if (n == null) return "—";
    try {
        return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
    } catch {
        return String(Math.round(n));
    }
}

function StatCard({ icon, label, value, sub }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.9))",
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                        {label}
                    </Typography>
                    <Typography
                        sx={{
                            mt: 1,
                            fontSize: { xs: 24, md: 30 },
                            lineHeight: 1.05,
                            fontWeight: 900,
                            color: "#ffffff",
                            wordBreak: "break-word",
                        }}
                    >
                        {value}
                    </Typography>
                    <Typography sx={{ mt: 0.75, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                        {sub}
                    </Typography>
                </Box>

                <Avatar
                    variant="rounded"
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "#f8fafc",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Avatar>
            </Stack>
        </Paper>
    );
}

function SimpleRankList({ title, icon, items, valueFormatter = (v) => v, emptyText = "Veri yok" }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(15,23,42,0.85)",
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Avatar
                    variant="rounded"
                    sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 2.5,
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "#f8fafc",
                    }}
                >
                    {icon}
                </Avatar>
                <Typography sx={{ fontWeight: 800, color: "#ffffff" }}>{title}</Typography>
            </Stack>

            {items.length === 0 ? (
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{emptyText}</Typography>
            ) : (
                <Stack spacing={1}>
                    {items.map((item, idx) => (
                        <Box
                            key={`${item.name}-${idx}`}
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "32px 1fr auto",
                                gap: 1,
                                alignItems: "center",
                                p: 1.25,
                                borderRadius: 3,
                                bgcolor: "rgba(255,255,255,0.05)",
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 28,
                                    height: 28,
                                    fontSize: 12,
                                    bgcolor: "#e2e8f0",
                                    color: "#0f172a",
                                    fontWeight: 800,
                                }}
                            >
                                {idx + 1}
                            </Avatar>
                            <Tooltip title={item.name}>
                                <Typography noWrap sx={{ fontWeight: 700, color: "#ffffff" }}>
                                    {item.name}
                                </Typography>
                            </Tooltip>
                            <Chip
                                size="small"
                                label={valueFormatter(item)}
                                sx={{
                                    borderRadius: 999,
                                    bgcolor: "rgba(255,255,255,0.08)",
                                    color: "#f8fafc",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                            />
                        </Box>
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

const TABLE_COLUMNS = [
    { key: "seferno", label: "Sefer No" },
    { key: "sevktarihi", label: "Sevk" },
    { key: "kalkis", label: "Çıkış" },
    { key: "cekici", label: "Çekici" },
    { key: "dorse", label: "Dorse" },
    { key: "surucu", label: "Sürücü" },
    { key: "faturavkn", label: "VKN" },
    { key: "telefon", label: "Telefon" },
    { key: "varis1", label: "Varış" },
    { key: "navlun", label: "Navlun" },
    { key: "updated_at", label: "Güncellendi" },
];

export default function TamamlananSeferler({ batchId = null }) {
    const [q, setQ] = useState("");
    const qDeb = useDebouncedValue(q, 200);
    const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadErr, setLoadErr] = useState("");
    const [sortBy, setSortBy] = useState("updated_at");
    const [sortDir, setSortDir] = useState("desc");

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

        const base = !query
            ? rows
            : rows.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(query)));

        const sorted = [...base].sort((a, b) => {
            const av = a?.[sortBy];
            const bv = b?.[sortBy];

            const an = toNumberSafe(av);
            const bn = toNumberSafe(bv);
            if (an != null && bn != null) return sortDir === "asc" ? an - bn : bn - an;

            const ad = new Date(av).getTime();
            const bd = new Date(bv).getTime();
            if (!Number.isNaN(ad) && !Number.isNaN(bd)) return sortDir === "asc" ? ad - bd : bd - ad;

            const as = String(av ?? "").toLowerCase();
            const bs = String(bv ?? "").toLowerCase();
            return sortDir === "asc" ? as.localeCompare(bs, "tr") : bs.localeCompare(as, "tr");
        });

        return sorted;
    }, [rows, qDeb, sortBy, sortDir]);

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
            if (!byDriver.has(drv)) byDriver.set(drv, { name: drv, count: 0, navSum: 0 });
            const d = byDriver.get(drv);
            d.count += 1;
            if (n != null) d.navSum += n;

            const v1 = safeStr(r.varis1) || "Bilinmiyor";
            byVaris1.set(v1, (byVaris1.get(v1) || 0) + 1);

            const depo = safeStr(r.yukleyendepo) || "Bilinmiyor";
            byDepot.set(depo, (byDepot.get(depo) || 0) + 1);
        }

        const topDrivers = Array.from(byDriver.values()).sort((a, b) => b.count - a.count).slice(0, 5);
        const topVaris = Array.from(byVaris1.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const topDepots = Array.from(byDepot.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            total,
            uniqueDrivers,
            navlunSum,
            avgNavlun: navlunCount > 0 ? navlunSum / navlunCount : null,
            topDrivers,
            topVaris,
            topDepots,
            topDriver: topDrivers[0] || null,
            latestUpdate: list[0]?.updated_at || "",
        };
    }, [filteredRows]);

    const onSort = (key) => {
        if (sortBy === key) {
            setSortDir((p) => (p === "asc" ? "desc" : "asc"));
            return;
        }
        setSortBy(key);
        setSortDir(key === "updated_at" ? "desc" : "asc");
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

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(180deg,#020617 0%,#0f172a 60%,#020617 100%)",
                p: { xs: 1.5, md: 3 },
            }}
        >
            <Stack spacing={2}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 3 },
                        borderRadius: 5,
                        border: "1px solid",
                        borderColor: "rgba(255,255,255,0.08)",
                        background: "linear-gradient(135deg,rgba(15,23,42,0.9) 0%,rgba(2,6,23,0.9) 100%)",
                    }}
                >
                    <Stack spacing={2}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                            spacing={1.5}
                        >
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
                                    <Chip
                                        icon={<InsightsIcon />}
                                        label="Completed Trips"
                                        size="small"
                                        sx={darkChipSx}
                                    />
                                    {batchId ? <Chip label={`Batch: ${batchId}`} size="small" sx={darkChipSx} /> : null}
                                </Stack>
                                <Typography
                                    sx={{
                                        fontSize: { xs: 28, md: 36 },
                                        fontWeight: 900,
                                        color: "#f8fafc",
                                        letterSpacing: -0.6,
                                    }}
                                >
                                    Tamamlanan Seferler
                                </Typography>
                                <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.6)", maxWidth: 780 }}>
                                    Tek bir ana ekran, sade KPI’lar, temiz sıralanabilir tablo ve gereksiz kart kalabalığı olmadan daha okunaklı operasyon görünümü.
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button
                                    startIcon={<RefreshIcon />}
                                    variant="outlined"
                                    onClick={fetchCompleted}
                                    disabled={loading}
                                    sx={outlinedBtnSx}
                                >
                                    Yenile
                                </Button>
                                <Button
                                    startIcon={<FileDownloadIcon />}
                                    variant="contained"
                                    onClick={onExport}
                                    disabled={loading || filteredRows.length === 0}
                                    sx={containedBtnSx}
                                >
                                    Excel’e Aktar
                                </Button>
                            </Stack>
                        </Stack>

                        <Stack
                            direction={{ xs: "column", lg: "row" }}
                            spacing={1.25}
                            alignItems={{ xs: "stretch", lg: "center" }}
                        >
                            <Box
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 1.5,
                                    py: 1.1,
                                    borderRadius: 999,
                                    bgcolor: "rgba(255,255,255,0.06)",
                                    border: "1px solid",
                                    borderColor: "rgba(255,255,255,0.08)",
                                }}
                            >
                                <SearchIcon sx={{ color: "rgba(255,255,255,0.6)" }} />
                                <InputBase
                                    fullWidth
                                    placeholder="Sefer no, sürücü, varış, VKN, dorse, telefon..."
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    sx={{
                                        color: "#f8fafc",
                                        "& input::placeholder": {
                                            color: "rgba(255,255,255,0.42)",
                                            opacity: 1,
                                        },
                                    }}
                                />
                            </Box>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip icon={<LocalShippingIcon />} label={`${analytics.total} kayıt`} sx={darkChipSx} />
                                <Chip icon={<PersonIcon />} label={`${analytics.uniqueDrivers} sürücü`} sx={darkChipSx} />
                                <Chip icon={<PaymentsIcon />} label={`Toplam ${formatMoney(analytics.navlunSum)} ₺`} sx={darkChipSx} />
                                <Chip icon={<CalendarMonthIcon />} label={`Son güncelleme ${formatDateLabel(analytics.latestUpdate)}`} sx={darkChipSx} />
                            </Stack>
                        </Stack>
                    </Stack>
                </Paper>

                {!!loadErr ? (
                    <Alert severity="error" sx={{ borderRadius: 3 }}>
                        {loadErr}
                    </Alert>
                ) : null}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(4, 1fr)" },
                        gap: 1.5,
                    }}
                >
                    <StatCard icon={<LocalShippingIcon />} label="Toplam Sefer" value={analytics.total} sub="Aktif filtreye göre listelenen kayıt" />
                    <StatCard icon={<PaymentsIcon />} label="Toplam Navlun" value={formatMoney(analytics.navlunSum)} sub="Okunabilen navlun toplamı" />
                    <StatCard icon={<PaymentsIcon />} label="Ortalama Navlun" value={formatMoney(analytics.avgNavlun)} sub="Parse edilen alanlara göre hesaplandı" />
                    <StatCard
                        icon={<PersonIcon />}
                        label="En Yoğun Sürücü"
                        value={analytics.topDriver?.name || "—"}
                        sub={analytics.topDriver ? `${analytics.topDriver.count} sefer` : "Veri bulunamadı"}
                    />
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
                        gap: 1.5,
                    }}
                >
                    <SimpleRankList
                        title="Top Sürücüler"
                        icon={<PersonIcon />}
                        items={analytics.topDrivers}
                        valueFormatter={(item) => `${item.count} iş`}
                        emptyText="Sürücü verisi yok"
                    />
                    <SimpleRankList
                        title="Top Varışlar"
                        icon={<PlaceIcon />}
                        items={analytics.topVaris}
                        valueFormatter={(item) => `${item.count} sefer`}
                        emptyText="Varış verisi yok"
                    />
                    <SimpleRankList
                        title="Top Depolar"
                        icon={<WarehouseIcon />}
                        items={analytics.topDepots}
                        valueFormatter={(item) => `${item.count} kayıt`}
                        emptyText="Depo verisi yok"
                    />
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 5,
                        border: "1px solid",
                        borderColor: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                        background: "rgba(2,6,23,0.9)",
                    }}
                >
                    <Box sx={{ p: 2.25, borderBottom: "1px solid", borderColor: "rgba(255,255,255,0.08)" }}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                            spacing={1}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#f8fafc" }}>
                                    Sefer Listesi
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13, mt: 0.5 }}>
                                    Daha ferah satırlar, sade başlıklar ve tıklanabilir sıralama.
                                </Typography>
                            </Box>
                            <Chip label={`${filteredRows.length} satır`} sx={darkChipSx} />
                        </Stack>
                    </Box>

                    <Box sx={{ overflow: "auto", maxHeight: "64vh" }}>
                        <Table stickyHeader size="medium" sx={{ minWidth: 1200 }}>
                            <TableHead>
                                <TableRow>
                                    {TABLE_COLUMNS.map((col) => (
                                        <TableCell
                                            key={col.key}
                                            sx={{
                                                bgcolor: "#0f172a",
                                                borderBottom: "1px solid",
                                                borderColor: "rgba(255,255,255,0.08)",
                                                py: 1.6,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <TableSortLabel
                                                active={sortBy === col.key}
                                                direction={sortBy === col.key ? sortDir : "asc"}
                                                onClick={() => onSort(col.key)}
                                                sx={{
                                                    color: "rgba(255,255,255,0.72) !important",
                                                    "& .MuiTableSortLabel-icon": {
                                                        color: "rgba(255,255,255,0.72) !important",
                                                    },
                                                    "&.Mui-active": {
                                                        color: "#f8fafc !important",
                                                    },
                                                    "&.Mui-active .MuiTableSortLabel-icon": {
                                                        color: "#93c5fd !important",
                                                    },
                                                    "&:hover": {
                                                        color: "#ffffff !important",
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        color: "inherit",
                                                        textTransform: "uppercase",
                                                        letterSpacing: 0.5,
                                                    }}
                                                >
                                                    {col.label}
                                                </Typography>
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLUMNS.length} sx={{ py: 6, textAlign: "center" }}>
                                            <Stack alignItems="center" spacing={1}>
                                                <CircularProgress size={28} />
                                                <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                                                    Veriler yükleniyor…
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={TABLE_COLUMNS.length}
                                            sx={{ py: 6, textAlign: "center", color: "rgba(255,255,255,0.6)" }}
                                        >
                                            Kayıt bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows.map((r) => (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            sx={{
                                                "& td": {
                                                    borderBottom: "1px solid",
                                                    borderColor: "rgba(255,255,255,0.08)",
                                                    color: "#e5e7eb",
                                                    bgcolor: "rgba(2,6,23,0.75)",
                                                },
                                                "&:hover td": {
                                                    bgcolor: "rgba(15,23,42,0.95)",
                                                },
                                                "&:last-child td": { borderBottom: 0 },
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 700 }}>{r.seferno || "—"}</TableCell>
                                            <TableCell>{r.sevktarihi || "—"}</TableCell>
                                            <TableCell>{r.kalkis || "—"}</TableCell>
                                            <TableCell>{r.cekici || "—"}</TableCell>
                                            <TableCell>{r.dorse || "—"}</TableCell>
                                            <TableCell>{r.surucu || "—"}</TableCell>
                                            <TableCell>{r.faturavkn || "—"}</TableCell>
                                            <TableCell>{r.telefon || "—"}</TableCell>
                                            <TableCell>{r.varis1 || "—"}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: "#93c5fd" }}>
                                                {r.navlun || "—"}
                                            </TableCell>
                                            <TableCell>{formatDateLabel(r.updated_at)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                </Paper>

                <Snackbar
                    open={snack.open}
                    autoHideDuration={3000}
                    onClose={() => setSnack((p) => ({ ...p, open: false }))}
                >
                    <Alert severity={snack.sev} variant="filled" sx={{ borderRadius: 3 }}>
                        {snack.msg}
                    </Alert>
                </Snackbar>
            </Stack>
        </Box>
    );
}

const darkChipSx = {
    borderRadius: 999,
    bgcolor: "rgba(255,255,255,0.08)",
    color: "#f8fafc",
    border: "1px solid rgba(255,255,255,0.08)",
    "& .MuiChip-icon": {
        color: "#93c5fd",
    },
};

const outlinedBtnSx = {
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 700,
    color: "#f8fafc",
    borderColor: "rgba(255,255,255,0.16)",
    "&:hover": {
        borderColor: "rgba(255,255,255,0.28)",
        bgcolor: "rgba(255,255,255,0.04)",
    },
};

const containedBtnSx = {
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 800,
    boxShadow: "none",
};