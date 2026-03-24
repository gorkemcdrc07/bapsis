import React, { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import * as XLSX from "xlsx";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Drawer,
    Fab,
    IconButton,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
    CalendarMonthRounded,
    CloseRounded,
    DownloadRounded,
    InsightsRounded,
    KeyboardArrowLeftRounded,
    KeyboardArrowRightRounded,
    LocalShippingRounded,
    PaymentsRounded,
    PersonSearchRounded,
    RefreshRounded,
    SearchRounded,
    TrendingUpRounded,
    TuneRounded,
    BoltRounded,
    ArrowUpwardRounded,
    VisibilityRounded,
    PhoneRounded,
    ReceiptLongRounded,
    WarehouseRounded,
    RouteRounded,
    WarningAmberRounded,
    DangerousRounded,
    CheckCircleRounded,
    BusinessRounded,
    PlaceRounded,
} from "@mui/icons-material";

function useDebouncedValue(value, delayMs = 250) {
    const [deb, setDeb] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDeb(value), delayMs);
        return () => clearTimeout(t);
    }, [value, delayMs]);
    return deb;
}

function safeStr(v) {
    return String(v ?? "").trim();
}

function toNumberSafe(v) {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s) return null;
    const cleaned = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

function formatMoney(n) {
    if (n == null) return "—";
    try {
        return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
    } catch {
        return String(Math.round(n));
    }
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

function getInitials(name) {
    const s = safeStr(name);
    if (!s) return "—";
    return s
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase())
        .join("");
}

function escapeSearch(value) {
    return String(value ?? "").replaceAll("%", "").replaceAll(",", " ").trim();
}

function sortLabel(key) {
    switch (key) {
        case "created_at":
            return "Son Oluşturulan";
        case "sevk_tarihi":
            return "Sevk Tarihi";
        case "navlun":
            return "Navlun";
        case "surucu":
            return "Sürücü";
        case "varis1":
            return "Varış";
        default:
            return key;
    }
}

function getStatusTone(value) {
    const val = safeStr(value).toLowerCase();

    if (val.includes("tamam")) {
        return {
            bg: "rgba(34,197,94,0.14)",
            border: "rgba(34,197,94,0.22)",
            text: "#bbf7d0",
        };
    }
    if (val.includes("bek")) {
        return {
            bg: "rgba(245,158,11,0.14)",
            border: "rgba(245,158,11,0.22)",
            text: "#fde68a",
        };
    }
    if (val.includes("iptal") || val.includes("risk")) {
        return {
            bg: "rgba(239,68,68,0.14)",
            border: "rgba(239,68,68,0.22)",
            text: "#fecaca",
        };
    }

    return {
        bg: "rgba(59,130,246,0.14)",
        border: "rgba(59,130,246,0.22)",
        text: "#bfdbfe",
    };
}

function ActionButton({ icon, title, subtitle, variant = "soft", onClick, disabled }) {
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            sx={{
                ...(variant === "primary" ? styles.primaryActionBtn : styles.softActionBtn),
                justifyContent: "flex-start",
                minWidth: { xs: "100%", sm: 180 },
            }}
        >
            <Box sx={styles.actionBtnIcon}>{icon}</Box>
            <Box sx={{ textAlign: "left" }}>
                <Typography sx={styles.actionBtnTitle}>{title}</Typography>
                <Typography sx={styles.actionBtnSub}>{subtitle}</Typography>
            </Box>
        </Button>
    );
}

function SortSwitcher({ value, onChange }) {
    const options = [
        { key: "created_at", label: "Son kayıt" },
        { key: "sevk_tarihi", label: "Sevk tarihi" },
        { key: "navlun", label: "Navlun" },
        { key: "surucu", label: "Sürücü" },
        { key: "varis1", label: "Varış" },
    ];

    return (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {options.map((item) => {
                const active = value === item.key;
                return (
                    <Chip
                        key={item.key}
                        label={item.label}
                        onClick={() => onChange(item.key)}
                        sx={active ? styles.sortChipActive : styles.sortChip}
                    />
                );
            })}
        </Stack>
    );
}

function StatChip({ icon, label, value, tone = "blue" }) {
    const toneMap = {
        blue: {
            iconBg: "rgba(59,130,246,0.14)",
            iconColor: "#bfdbfe",
        },
        green: {
            iconBg: "rgba(34,197,94,0.14)",
            iconColor: "#bbf7d0",
        },
        amber: {
            iconBg: "rgba(245,158,11,0.14)",
            iconColor: "#fde68a",
        },
        red: {
            iconBg: "rgba(239,68,68,0.14)",
            iconColor: "#fecaca",
        },
        purple: {
            iconBg: "rgba(168,85,247,0.14)",
            iconColor: "#e9d5ff",
        },
    };

    const t = toneMap[tone] || toneMap.blue;

    return (
        <Paper elevation={0} sx={styles.statChip}>
            <Box sx={{ ...styles.statChipIcon, bgcolor: t.iconBg, color: t.iconColor }}>{icon}</Box>
            <Box>
                <Typography sx={styles.statChipLabel}>{label}</Typography>
                <Typography sx={styles.statChipValue}>{value}</Typography>
            </Box>
        </Paper>
    );
}

function HighlightBanner({ selectedRow, onOpen }) {
    if (!selectedRow) return null;

    return (
        <Paper elevation={0} sx={styles.highlightBanner}>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.4}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
            >
                <Stack direction="row" spacing={1.2} alignItems="center">
                    <Avatar sx={styles.highlightAvatar}>{getInitials(selectedRow.surucu)}</Avatar>
                    <Box>
                        <Typography sx={styles.highlightTitle}>
                            {selectedRow.sefer_no || "Seçili sefer"}
                        </Typography>
                        <Typography sx={styles.highlightSub}>
                            {selectedRow.surucu || "Sürücü yok"} • {selectedRow.yukleme_yeri || "Yükleme yok"} →{" "}
                            {selectedRow.varis1 || "Varış yok"} • Navlun: {formatMoney(toNumberSafe(selectedRow.navlun))} ₺
                        </Typography>
                    </Box>
                </Stack>

                <Button onClick={onOpen} sx={styles.highlightBtn}>
                    Detayı aç
                </Button>
            </Stack>
        </Paper>
    );
}

function AnalysisTop({ loading, analytics }) {
    return (
        <Paper elevation={0} sx={styles.topDriverWrap}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={styles.topDriverAvatar}>
                        <InsightsRounded />
                    </Avatar>
                    <Box>
                        <Typography sx={styles.topDriverTitle}>Hızlı Analiz</Typography>
                        <Typography sx={styles.topDriverSub}>
                            Mevcut filtreye göre özet metrikler ve yoğunlaşan alanlar
                        </Typography>
                    </Box>
                </Stack>
            </Stack>

            {loading ? <LinearProgress sx={{ mt: 2, borderRadius: 999 }} /> : null}

            <Box sx={styles.driverSummaryGrid}>
                <MiniMetric title="Toplam Kayıt" value={analytics.totalCount} />
                <MiniMetric title="Toplam Navlun" value={`${formatMoney(analytics.totalNavlun)} ₺`} />
                <MiniMetric title="Ort. Navlun" value={`${formatMoney(analytics.avgNavlun)} ₺`} />
                <MiniMetric title="Tekil Sürücü" value={analytics.uniqueDrivers} />
            </Box>

            <Box sx={styles.driverSplitGrid}>
                <CompactRankCard title="Top Varışlar" items={analytics.topVaris} suffix="kayıt" />
                <CompactRankCard title="Top Müşteriler" items={analytics.topCustomers} suffix="kayıt" />
            </Box>
        </Paper>
    );
}

function MiniMetric({ title, value }) {
    return (
        <Box sx={styles.miniMetric}>
            <Typography sx={styles.miniMetricLabel}>{title}</Typography>
            <Typography sx={styles.miniMetricValue}>{value}</Typography>
        </Box>
    );
}

function CompactRankCard({ title, items, suffix }) {
    return (
        <Paper elevation={0} sx={styles.compactRankCard}>
            <Typography sx={styles.compactRankTitle}>{title}</Typography>
            <Stack spacing={0.8} sx={{ mt: 1.2 }}>
                {items.length === 0 ? (
                    <Typography sx={styles.softText}>Veri yok</Typography>
                ) : (
                    items.map((item, idx) => (
                        <Box key={`${item.name}-${idx}`} sx={styles.compactRankRow}>
                            <Typography noWrap sx={styles.compactRankName}>
                                {item.name}
                            </Typography>
                            <Chip label={`${item.count} ${suffix}`} size="small" sx={styles.rankChip} />
                        </Box>
                    ))
                )}
            </Stack>
        </Paper>
    );
}

function InlineInfo({ label, value, strong = false }) {
    return (
        <Box sx={styles.inlineInfoItem}>
            <Typography sx={styles.inlineInfoLabel}>{label}</Typography>
            <Typography sx={strong ? styles.inlineInfoValueStrong : styles.inlineInfoValue}>
                {value || "—"}
            </Typography>
        </Box>
    );
}

function MobileRichCard({ row, selected, onSelect, onOpenDetail, onDriverClick }) {
    const durumTone = getStatusTone(row.arac_durumu);

    return (
        <Paper
            elevation={0}
            onClick={() => onSelect(row)}
            sx={{ ...styles.mobileCard, ...(selected ? styles.mobileCardSelected : null) }}
        >
            <Stack spacing={1.2}>
                <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={styles.rowAvatar}>{getInitials(row.surucu)}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={styles.compactRowTitle}>
                                {row.sefer_no || "—"}
                            </Typography>
                            <Typography sx={styles.compactDate}>
                                {row.sevk_tarihi || "—"}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack alignItems="flex-end" spacing={0.5}>
                        <Typography sx={styles.compactMoney}>
                            {formatMoney(toNumberSafe(row.navlun))} ₺
                        </Typography>
                        <Chip
                            label={row.arac_durumu || "Durum yok"}
                            size="small"
                            sx={{
                                ...styles.softChip,
                                bgcolor: durumTone.bg,
                                color: durumTone.text,
                                border: `1px solid ${durumTone.border}`,
                            }}
                        />
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    <Chip
                        label={row.surucu || "Sürücü yok"}
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDriverClick(row.surucu);
                        }}
                        sx={styles.driverChip}
                    />
                    <Chip label={row.musteri_adi || "Müşteri yok"} size="small" sx={styles.softChip} />
                    <Chip label={row.yukleme_yeri || "Yükleme yok"} size="small" sx={styles.softChip} />
                    <Chip label={row.varis1 || "Varış yok"} size="small" sx={styles.softChip} />
                </Stack>

                <Box sx={styles.inlineInfoGrid}>
                    <InlineInfo label="Çekici" value={row.cekici} />
                    <InlineInfo label="Dorse" value={row.dorse} />
                    <InlineInfo label="Telefon" value={row.telefon} />
                    <InlineInfo label="VKN" value={row.vkn} />
                    <InlineInfo label="Varış 2" value={row.varis2} />
                    <InlineInfo label="İrsaliye" value={row.irsaliyeno} />
                    <InlineInfo label="TC" value={row.tc} />
                    <InlineInfo label="Oluşturulma" value={formatDateLabel(row.created_at)} />
                </Box>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={styles.mobileRouteText}>
                        {row.yukleme_yeri || "—"} → {row.varis1 || "—"}
                        {safeStr(row.varis2) ? ` → ${row.varis2}` : ""}
                    </Typography>

                    <Button
                        size="small"
                        startIcon={<VisibilityRounded fontSize="small" />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(row);
                        }}
                        sx={styles.rowActionBtn}
                    >
                        Detay
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
}

function DesktopTable({ rows, selectedRow, onSelect, onOpenDetail, onDriverClick }) {
    return (
        <TableContainer sx={styles.tableWrap}>
            <Table stickyHeader size="small" sx={styles.table}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={styles.th}>Sefer No</TableCell>
                        <TableCell sx={styles.th}>Sevk Tarihi</TableCell>
                        <TableCell sx={styles.th}>Müşteri</TableCell>
                        <TableCell sx={styles.th}>Yükleme</TableCell>
                        <TableCell sx={styles.th}>Varışlar</TableCell>
                        <TableCell sx={styles.th}>Çekici / Dorse</TableCell>
                        <TableCell sx={styles.th}>Sürücü</TableCell>
                        <TableCell sx={styles.th}>Telefon</TableCell>
                        <TableCell sx={styles.th}>VKN</TableCell>
                        <TableCell sx={styles.th}>İrsaliye</TableCell>
                        <TableCell sx={styles.th}>TC</TableCell>
                        <TableCell sx={styles.th}>Araç Durumu</TableCell>
                        <TableCell sx={styles.th} align="right">Navlun</TableCell>
                        <TableCell sx={styles.th}>Oluşturulma</TableCell>
                        <TableCell sx={styles.th} align="center">İşlem</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {rows.map((row) => {
                        const selected = selectedRow?.id === row.id;
                        const durumTone = getStatusTone(row.arac_durumu);

                        return (
                            <TableRow
                                key={row.id}
                                hover
                                onClick={() => onSelect(row)}
                                sx={{
                                    ...styles.tr,
                                    ...(selected ? styles.trSelected : null),
                                }}
                            >
                                <TableCell sx={styles.tdStrong}>{row.sefer_no || "—"}</TableCell>
                                <TableCell sx={styles.td}>{row.sevk_tarihi || "—"}</TableCell>
                                <TableCell sx={styles.td}>{row.musteri_adi || "—"}</TableCell>
                                <TableCell sx={styles.td}>{row.yukleme_yeri || "—"}</TableCell>
                                <TableCell sx={styles.td}>
                                    <Stack spacing={0.5}>
                                        <Chip label={row.varis1 || "—"} size="small" sx={styles.softChipMini} />
                                        {safeStr(row.varis2) ? <Chip label={row.varis2} size="small" sx={styles.softChipMini} /> : null}
                                    </Stack>
                                </TableCell>
                                <TableCell sx={styles.td}>
                                    <Stack spacing={0.4}>
                                        <Typography sx={styles.tdLine}>{row.cekici || "—"}</Typography>
                                        <Typography sx={styles.tdSubLine}>{row.dorse || "—"}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell sx={styles.td}>
                                    {safeStr(row.surucu) ? (
                                        <Chip
                                            label={row.surucu}
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDriverClick(row.surucu);
                                            }}
                                            sx={styles.driverChipMini}
                                        />
                                    ) : "—"}
                                </TableCell>
                                <TableCell sx={styles.td}>{row.telefon || "—"}</TableCell>
                                <TableCell sx={styles.td}>{row.vkn || "—"}</TableCell>
                                <TableCell sx={styles.td}>{row.irsaliyeno || "—"}</TableCell>
                                <TableCell sx={styles.td}>{row.tc || "—"}</TableCell>
                                <TableCell sx={styles.td}>
                                    <Chip
                                        label={row.arac_durumu || "—"}
                                        size="small"
                                        sx={{
                                            ...styles.softChipMini,
                                            bgcolor: durumTone.bg,
                                            color: durumTone.text,
                                            border: `1px solid ${durumTone.border}`,
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={styles.tdMoney} align="right">
                                    {formatMoney(toNumberSafe(row.navlun))} ₺
                                </TableCell>
                                <TableCell sx={styles.td}>{formatDateLabel(row.created_at)}</TableCell>
                                <TableCell sx={styles.td} align="center">
                                    <Button
                                        size="small"
                                        startIcon={<VisibilityRounded fontSize="small" />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenDetail(row);
                                        }}
                                        sx={styles.rowActionBtn}
                                    >
                                        Detay
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

function DetailDrawer({ row, open, onClose, onDriverClick }) {
    const [tab, setTab] = useState(0);

    useEffect(() => {
        if (!open) setTab(0);
    }, [open]);

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: styles.drawerPaper }}>
            <Box sx={styles.drawerHeader}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <Avatar sx={styles.drawerAvatar}>{getInitials(row?.surucu)}</Avatar>
                        <Box>
                            <Typography sx={styles.drawerTitle}>{row?.surucu || "Sefer detayı"}</Typography>
                            <Typography sx={styles.drawerSub}>{row?.sefer_no || "—"}</Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose} sx={styles.closeBtn}>
                        <CloseRounded />
                    </IconButton>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    <Chip label={`Navlun ${formatMoney(toNumberSafe(row?.navlun))} ₺`} sx={styles.moneyChip} />
                    <Chip label={row?.varis1 || "Varış yok"} sx={styles.softChip} />
                    <Chip label={row?.yukleme_yeri || "Yükleme yok"} sx={styles.softChip} />
                    {!!row?.telefon && <Chip icon={<PhoneRounded />} label={row.telefon} sx={styles.softChip} />}
                    {!!row?.surucu && (
                        <Chip label="Sürücü filtresini aç" onClick={() => onDriverClick(row.surucu)} sx={styles.driverChip} />
                    )}
                </Stack>
            </Box>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={styles.tabs}>
                <Tab label="Özet" />
                <Tab label="Araç" />
                <Tab label="Evrak" />
            </Tabs>

            <Box sx={styles.drawerBody}>
                {tab === 0 && (
                    <Stack spacing={1.1}>
                        <DetailItem label="Sefer No" value={row?.sefer_no} />
                        <DetailItem label="Sevk Tarihi" value={row?.sevk_tarihi} />
                        <DetailItem label="Müşteri" value={row?.musteri_adi} />
                        <DetailItem label="Yükleme Yeri" value={row?.yukleme_yeri} />
                        <DetailItem label="Varış 1" value={row?.varis1} />
                        <DetailItem label="Varış 2" value={row?.varis2} />
                        <DetailItem label="Navlun" value={`${formatMoney(toNumberSafe(row?.navlun))} ₺`} />
                        <DetailItem label="Oluşturulma" value={formatDateLabel(row?.created_at)} />
                    </Stack>
                )}

                {tab === 1 && (
                    <Stack spacing={1.1}>
                        <DetailItem label="Çekici" value={row?.cekici} />
                        <DetailItem label="Dorse" value={row?.dorse} />
                        <DetailItem label="Sürücü" value={row?.surucu} />
                        <DetailItem label="Telefon" value={row?.telefon} />
                        <DetailItem label="TC" value={row?.tc} />
                        <DetailItem label="Araç Durumu" value={row?.arac_durumu} />
                    </Stack>
                )}

                {tab === 2 && (
                    <Stack spacing={1.1}>
                        <DetailItem label="VKN" value={row?.vkn} />
                        <DetailItem label="İrsaliye No" value={row?.irsaliyeno} />
                        <DetailItem label="Müşteri" value={row?.musteri_adi} />
                        <DetailItem label="Kayıt ID" value={row?.id} />
                    </Stack>
                )}
            </Box>
        </Drawer>
    );
}

function DetailItem({ label, value }) {
    return (
        <Paper elevation={0} sx={styles.detailItem}>
            <Typography sx={styles.detailItemLabel}>{label}</Typography>
            <Typography sx={styles.detailItemValue}>{value || "—"}</Typography>
        </Paper>
    );
}

function QuickInsight({ title, value, icon }) {
    return (
        <Paper elevation={0} sx={styles.quickInsight}>
            <Box sx={styles.quickInsightIcon}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={styles.quickInsightLabel}>{title}</Typography>
                <Typography noWrap sx={styles.quickInsightValue}>{value}</Typography>
            </Box>
        </Paper>
    );
}

export default function DonusTamamlananSeferler() {
    const PAGE_SIZE = 18;
    const FILTER_OPTION_LIMIT = 4000;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [q, setQ] = useState("");
    const qDeb = useDebouncedValue(q, 260);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadErr, setLoadErr] = useState("");
    const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });

    const [selectedDriver, setSelectedDriver] = useState("Hepsi");
    const [selectedVaris, setSelectedVaris] = useState("Hepsi");
    const [selectedCustomer, setSelectedCustomer] = useState("Hepsi");
    const [sortBy, setSortBy] = useState("created_at");
    const [selectedRow, setSelectedRow] = useState(null);
    const [filterDialog, setFilterDialog] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const [driverOptions, setDriverOptions] = useState(["Hepsi"]);
    const [varisOptions, setVarisOptions] = useState(["Hepsi"]);
    const [customerOptions, setCustomerOptions] = useState(["Hepsi"]);

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (safeStr(q)) n += 1;
        if (selectedDriver !== "Hepsi") n += 1;
        if (selectedVaris !== "Hepsi") n += 1;
        if (selectedCustomer !== "Hepsi") n += 1;
        if (sortBy !== "created_at") n += 1;
        return n;
    }, [q, selectedDriver, selectedVaris, selectedCustomer, sortBy]);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("donus_tamamlanan_seferler")
                .select("surucu,varis1,musteri_adi")
                .limit(FILTER_OPTION_LIMIT);

            if (error) throw error;

            const src = data || [];

            setDriverOptions([
                "Hepsi",
                ...Array.from(new Set(src.map((x) => safeStr(x.surucu)).filter(Boolean))).sort((a, b) =>
                    a.localeCompare(b, "tr")
                ),
            ]);

            setVarisOptions([
                "Hepsi",
                ...Array.from(new Set(src.map((x) => safeStr(x.varis1)).filter(Boolean))).sort((a, b) =>
                    a.localeCompare(b, "tr")
                ),
            ]);

            setCustomerOptions([
                "Hepsi",
                ...Array.from(new Set(src.map((x) => safeStr(x.musteri_adi)).filter(Boolean))).sort((a, b) =>
                    a.localeCompare(b, "tr")
                ),
            ]);
        } catch (e) {
            console.error("fetchFilterOptions error:", e);
        }
    }, []);

    const applyQueryFilters = useCallback(
        (qb) => {
            let next = qb;

            if (selectedDriver !== "Hepsi") next = next.eq("surucu", selectedDriver);
            if (selectedVaris !== "Hepsi") next = next.eq("varis1", selectedVaris);
            if (selectedCustomer !== "Hepsi") next = next.eq("musteri_adi", selectedCustomer);

            if (qDeb.trim()) {
                const qText = escapeSearch(qDeb);
                next = next.or(
                    [
                        `sefer_no.ilike.%${qText}%`,
                        `sevk_tarihi.ilike.%${qText}%`,
                        `musteri_adi.ilike.%${qText}%`,
                        `yukleme_yeri.ilike.%${qText}%`,
                        `cekici.ilike.%${qText}%`,
                        `dorse.ilike.%${qText}%`,
                        `tc.ilike.%${qText}%`,
                        `surucu.ilike.%${qText}%`,
                        `telefon.ilike.%${qText}%`,
                        `vkn.ilike.%${qText}%`,
                        `varis1.ilike.%${qText}%`,
                        `varis2.ilike.%${qText}%`,
                        `irsaliyeno.ilike.%${qText}%`,
                        `navlun.ilike.%${qText}%`,
                        `arac_durumu.ilike.%${qText}%`,
                    ].join(",")
                );
            }

            return next;
        },
        [qDeb, selectedCustomer, selectedDriver, selectedVaris]
    );

    const fetchCompleted = useCallback(async () => {
        setLoading(true);
        setLoadErr("");

        try {
            let qb = supabase
                .from("donus_tamamlanan_seferler")
                .select(
                    "id,sefer_no,sevk_tarihi,musteri_adi,yukleme_yeri,cekici,dorse,tc,surucu,telefon,vkn,varis1,varis2,irsaliyeno,navlun,arac_durumu,created_at",
                    { count: "exact" }
                );

            qb = applyQueryFilters(qb);

            if (sortBy === "navlun") qb = qb.order("navlun", { ascending: false, nullsFirst: false });
            else if (sortBy === "surucu") qb = qb.order("surucu", { ascending: true, nullsFirst: false });
            else if (sortBy === "varis1") qb = qb.order("varis1", { ascending: true, nullsFirst: false });
            else if (sortBy === "sevk_tarihi") qb = qb.order("sevk_tarihi", { ascending: false, nullsFirst: false });
            else qb = qb.order("id", { ascending: false });

            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await qb.range(from, to);
            if (error) throw error;

            const mapped = data || [];
            setRows(mapped);
            setTotalCount(count || 0);

            setSelectedRow((prev) => {
                if (prev && mapped.some((x) => x.id === prev.id)) return prev;
                return mapped[0] || null;
            });
        } catch (e) {
            console.error("fetchCompleted error:", e);
            setLoadErr(e?.message || "Veri çekme hatası");
            setSnack({ open: true, msg: e?.message || "Veri çekme hatası", sev: "error" });
            setRows([]);
            setTotalCount(0);
            setSelectedRow(null);
        } finally {
            setLoading(false);
        }
    }, [applyQueryFilters, page, sortBy]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    useEffect(() => {
        setPage(0);
    }, [qDeb, selectedDriver, selectedVaris, selectedCustomer, sortBy]);

    useEffect(() => {
        fetchCompleted();
    }, [fetchCompleted]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const pageAnalytics = useMemo(() => {
        const uniqueDrivers = new Set(rows.map((r) => safeStr(r.surucu)).filter(Boolean)).size;
        const uniqueCustomers = new Set(rows.map((r) => safeStr(r.musteri_adi)).filter(Boolean)).size;
        const uniqueVaris = new Set(rows.map((r) => safeStr(r.varis1)).filter(Boolean)).size;

        let navlunSum = 0;
        let navCount = 0;
        let riskCount = 0;
        let pendingCount = 0;
        let completedCount = 0;

        const byVaris = new Map();
        const byCustomer = new Map();

        for (const r of rows) {
            const n = toNumberSafe(r.navlun);
            if (n != null) {
                navlunSum += n;
                navCount += 1;
            }

            const durum = safeStr(r.arac_durumu).toLowerCase();
            if (durum.includes("iptal") || durum.includes("risk")) riskCount += 1;
            else if (durum.includes("bek")) pendingCount += 1;
            else if (durum.includes("tamam")) completedCount += 1;

            const varis = safeStr(r.varis1) || "Bilinmiyor";
            const musteri = safeStr(r.musteri_adi) || "Bilinmiyor";

            byVaris.set(varis, (byVaris.get(varis) || 0) + 1);
            byCustomer.set(musteri, (byCustomer.get(musteri) || 0) + 1);
        }

        return {
            totalVisible: totalCount,
            pageCount: rows.length,
            uniqueDrivers,
            uniqueCustomers,
            uniqueVaris,
            navlunSum,
            avgNavlun: navCount > 0 ? navlunSum / navCount : null,
            latestUpdate: rows[0]?.created_at || "",
            riskCount,
            pendingCount,
            completedCount,
            topVaris: Array.from(byVaris.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4),
            topCustomers: Array.from(byCustomer.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4),
            totalCount,
            totalNavlun: navlunSum,
        };
    }, [rows, totalCount]);

    const onDriverQuickFilter = useCallback((driverName) => {
        if (!safeStr(driverName)) return;
        setSelectedDriver(driverName);
        setPage(0);
    }, []);

    const onOpenDetail = useCallback((row) => {
        setSelectedRow(row);
        setDetailOpen(true);
    }, []);

    const onExport = useCallback(async () => {
        try {
            let exportData = [];
            let from = 0;
            const exportChunkSize = 1000;

            while (true) {
                let qb = supabase
                    .from("donus_tamamlanan_seferler")
                    .select(
                        "id,sefer_no,sevk_tarihi,musteri_adi,yukleme_yeri,cekici,dorse,tc,surucu,telefon,vkn,varis1,varis2,irsaliyeno,navlun,arac_durumu,created_at"
                    )
                    .range(from, from + exportChunkSize - 1)
                    .order("id", { ascending: false });

                qb = applyQueryFilters(qb);

                const { data, error } = await qb;
                if (error) throw error;

                const chunk = data || [];
                exportData = exportData.concat(chunk);
                if (chunk.length < exportChunkSize) break;
                from += exportChunkSize;
            }

            const exportRows = exportData.map((r) => ({
                ID: r.id ?? "",
                SeferNo: r.sefer_no ?? "",
                SevkTarihi: r.sevk_tarihi ?? "",
                MusteriAdi: r.musteri_adi ?? "",
                YuklemeYeri: r.yukleme_yeri ?? "",
                Cekici: r.cekici ?? "",
                Dorse: r.dorse ?? "",
                TC: r.tc ?? "",
                Surucu: r.surucu ?? "",
                Telefon: r.telefon ?? "",
                VKN: r.vkn ?? "",
                Varis1: r.varis1 ?? "",
                Varis2: r.varis2 ?? "",
                IrsaliyeNo: r.irsaliyeno ?? "",
                Navlun: r.navlun ?? "",
                AracDurumu: r.arac_durumu ?? "",
                CreatedAt: r.created_at ?? "",
            }));

            const ws = XLSX.utils.json_to_sheet(exportRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DonusTamamlananSeferler");

            const fileName = `donus_tamamlanan_seferler_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);

            setSnack({ open: true, msg: "Excel indirildi ✅", sev: "success" });
        } catch (e) {
            console.error("onExport error:", e);
            setSnack({ open: true, msg: e?.message || "Excel dışa aktarma hatası", sev: "error" });
        }
    }, [applyQueryFilters]);

    function clearFilters() {
        setQ("");
        setSelectedDriver("Hepsi");
        setSelectedVaris("Hepsi");
        setSelectedCustomer("Hepsi");
        setSortBy("created_at");
        setPage(0);
    }

    return (
        <Box sx={styles.page}>
            <Stack spacing={2}>
                <Paper elevation={0} sx={styles.hero}>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: "column", xl: "row" }} justifyContent="space-between" spacing={2}>
                            <Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                    <Chip label="Return Completed Trips" sx={styles.headerChip} />
                                    <Chip label={`${totalCount} kayıt`} sx={styles.headerChip} />
                                    {activeFilterCount > 0 ? (
                                        <Chip label={`${activeFilterCount} aktif filtre`} sx={styles.activeFilterChip} />
                                    ) : null}
                                </Stack>

                                <Typography sx={styles.heroTitle}>Dönüş Tamamlanan Seferler</Typography>
                                <Typography sx={styles.heroSub}>
                                    Görünüm bu ekrandaki tasarım diline uyarlandı. Satır seçimi, detay drawer,
                                    filtre popup ve güçlü koyu tema korunur.
                                </Typography>
                            </Box>
                        </Stack>

                        <Box sx={styles.actionBar}>
                            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.2} justifyContent="space-between">
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} flexWrap="wrap" useFlexGap>
                                    <ActionButton
                                        icon={<TuneRounded fontSize="small" />}
                                        title="Filtreler"
                                        subtitle={`${activeFilterCount || 0} aktif seçim`}
                                        onClick={() => setFilterDialog(true)}
                                    />
                                    <ActionButton
                                        icon={<RefreshRounded fontSize="small" />}
                                        title="Yenile"
                                        subtitle={loading ? "Veri geliyor" : "Listeyi tazele"}
                                        onClick={fetchCompleted}
                                        disabled={loading}
                                    />
                                    <ActionButton
                                        icon={<DownloadRounded fontSize="small" />}
                                        title="Excel’e aktar"
                                        subtitle="Filtreli kayıtları indir"
                                        variant="primary"
                                        onClick={onExport}
                                        disabled={loading || totalCount === 0}
                                    />
                                </Stack>

                                <Paper elevation={0} sx={styles.sortPanel}>
                                    <Typography sx={styles.sortPanelLabel}>Hızlı sıralama</Typography>
                                    <SortSwitcher value={sortBy} onChange={setSortBy} />
                                </Paper>
                            </Stack>
                        </Box>

                        <TextField
                            fullWidth
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Sefer no, sürücü, müşteri, VKN, telefon, varış, yükleme, irsaliye ara..."
                            sx={styles.searchField}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded sx={{ color: "rgba(255,255,255,0.48)" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={styles.heroStatsGrid}>
                            <StatChip
                                icon={<LocalShippingRounded fontSize="small" />}
                                label="Toplam Kayıt"
                                value={pageAnalytics.totalVisible}
                                tone="blue"
                            />
                            <StatChip
                                icon={<PaymentsRounded fontSize="small" />}
                                label="Sayfa Navlun"
                                value={`${formatMoney(pageAnalytics.navlunSum)} ₺`}
                                tone="green"
                            />
                            <StatChip
                                icon={<TrendingUpRounded fontSize="small" />}
                                label="Ortalama"
                                value={`${formatMoney(pageAnalytics.avgNavlun)} ₺`}
                                tone="purple"
                            />
                            <StatChip
                                icon={<CalendarMonthRounded fontSize="small" />}
                                label="Son Oluşturulma"
                                value={formatDateLabel(pageAnalytics.latestUpdate)}
                                tone="amber"
                            />
                        </Box>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                                gap: 1.2,
                            }}
                        >
                            <StatChip
                                icon={<CheckCircleRounded fontSize="small" />}
                                label="Tamamlanan"
                                value={pageAnalytics.completedCount}
                                tone="green"
                            />
                            <StatChip
                                icon={<WarningAmberRounded fontSize="small" />}
                                label="Bekleyen"
                                value={pageAnalytics.pendingCount}
                                tone="amber"
                            />
                            <StatChip
                                icon={<DangerousRounded fontSize="small" />}
                                label="Risk / İptal"
                                value={pageAnalytics.riskCount}
                                tone="red"
                            />
                            <StatChip
                                icon={<BusinessRounded fontSize="small" />}
                                label="Tekil Müşteri"
                                value={pageAnalytics.uniqueCustomers}
                                tone="blue"
                            />
                        </Box>
                    </Stack>
                </Paper>

                <HighlightBanner selectedRow={selectedRow} onOpen={() => setDetailOpen(true)} />

                <AnalysisTop loading={loading} analytics={pageAnalytics} />

                {!!loadErr ? (
                    <Alert severity="error" sx={{ borderRadius: 3 }}>
                        {loadErr}
                    </Alert>
                ) : null}

                <Box sx={styles.mainGrid}>
                    <Paper elevation={0} sx={styles.listCard}>
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", md: "center" }}
                            sx={{ mb: 1.5 }}
                        >
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip label={`${rows.length} / ${totalCount} kayıt`} sx={styles.headerChip} />
                                {selectedDriver !== "Hepsi" ? (
                                    <Chip label={`Sürücü: ${selectedDriver}`} onDelete={() => setSelectedDriver("Hepsi")} sx={styles.activeFilterChip} />
                                ) : null}
                                {selectedVaris !== "Hepsi" ? (
                                    <Chip label={`Varış: ${selectedVaris}`} onDelete={() => setSelectedVaris("Hepsi")} sx={styles.activeFilterChip} />
                                ) : null}
                                {selectedCustomer !== "Hepsi" ? (
                                    <Chip label={`Müşteri: ${selectedCustomer}`} onDelete={() => setSelectedCustomer("Hepsi")} sx={styles.activeFilterChip} />
                                ) : null}
                                {sortBy !== "created_at" ? (
                                    <Chip label={`Sıralama: ${sortLabel(sortBy)}`} sx={styles.activeFilterChip} />
                                ) : null}
                            </Stack>

                            {(q || selectedDriver !== "Hepsi" || selectedVaris !== "Hepsi" || selectedCustomer !== "Hepsi" || sortBy !== "created_at") ? (
                                <Button variant="text" onClick={clearFilters} sx={styles.clearBtn}>
                                    Filtreleri Temizle
                                </Button>
                            ) : null}
                        </Stack>

                        {loading ? (
                            <Box sx={styles.centerBoxLarge}>
                                <Stack alignItems="center" spacing={1.2}>
                                    <CircularProgress size={30} />
                                    <Typography sx={styles.softText}>Seferler yükleniyor...</Typography>
                                </Stack>
                            </Box>
                        ) : rows.length === 0 ? (
                            <Box sx={styles.centerBoxLarge}>
                                <Stack alignItems="center" spacing={1}>
                                    <LocalShippingRounded sx={{ fontSize: 36, color: "#94a3b8" }} />
                                    <Typography sx={styles.emptyTitle}>Kayıt bulunamadı</Typography>
                                    <Typography sx={styles.softText}>Arama veya filtreleri değiştir.</Typography>
                                </Stack>
                            </Box>
                        ) : isMobile ? (
                            <Stack spacing={1}>
                                {rows.map((row) => (
                                    <MobileRichCard
                                        key={row.id}
                                        row={row}
                                        selected={selectedRow?.id === row.id}
                                        onSelect={setSelectedRow}
                                        onOpenDetail={onOpenDetail}
                                        onDriverClick={onDriverQuickFilter}
                                    />
                                ))}
                            </Stack>
                        ) : (
                            <DesktopTable
                                rows={rows}
                                selectedRow={selectedRow}
                                onSelect={setSelectedRow}
                                onOpenDetail={onOpenDetail}
                                onDriverClick={onDriverQuickFilter}
                            />
                        )}

                        <Box sx={styles.paginationWrap}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Tooltip title="Önceki sayfa">
                                    <span>
                                        <IconButton
                                            disabled={page === 0 || loading}
                                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                                            sx={styles.pageIconBtn}
                                        >
                                            <KeyboardArrowLeftRounded />
                                        </IconButton>
                                    </span>
                                </Tooltip>

                                <Typography sx={styles.paginationInfo}>
                                    Sayfa <b>{page + 1}</b> / <b>{totalPages}</b>
                                </Typography>

                                <Tooltip title="Sonraki sayfa">
                                    <span>
                                        <IconButton
                                            disabled={page + 1 >= totalPages || loading}
                                            onClick={() => setPage((p) => p + 1)}
                                            sx={styles.pageIconBtn}
                                        >
                                            <KeyboardArrowRightRounded />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
                                <QuickInsight
                                    title="Top Varış"
                                    value={pageAnalytics.topVaris[0]?.name || "—"}
                                    icon={<RouteRounded fontSize="small" />}
                                />
                                <QuickInsight
                                    title="Top Müşteri"
                                    value={pageAnalytics.topCustomers[0]?.name || "—"}
                                    icon={<BusinessRounded fontSize="small" />}
                                />
                                <QuickInsight
                                    title="Tekil Varış"
                                    value={pageAnalytics.uniqueVaris}
                                    icon={<PlaceRounded fontSize="small" />}
                                />
                            </Stack>
                        </Box>
                    </Paper>
                </Box>
            </Stack>

            <Dialog
                open={filterDialog}
                onClose={() => setFilterDialog(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: styles.dialogPaper }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: 950, fontSize: 18 }}>Filtreler</Typography>
                        <IconButton onClick={() => setFilterDialog(false)} sx={styles.closeBtn}>
                            <CloseRounded />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    <Stack spacing={1.4}>
                        <Select fullWidth value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} sx={styles.select}>
                            {driverOptions.map((x) => (
                                <MenuItem key={x} value={x}>
                                    {x}
                                </MenuItem>
                            ))}
                        </Select>

                        <Select fullWidth value={selectedVaris} onChange={(e) => setSelectedVaris(e.target.value)} sx={styles.select}>
                            {varisOptions.map((x) => (
                                <MenuItem key={x} value={x}>
                                    {x}
                                </MenuItem>
                            ))}
                        </Select>

                        <Select fullWidth value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} sx={styles.select}>
                            {customerOptions.map((x) => (
                                <MenuItem key={x} value={x}>
                                    {x}
                                </MenuItem>
                            ))}
                        </Select>

                        <Select fullWidth value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={styles.select}>
                            <MenuItem value="created_at">Son Oluşturulan</MenuItem>
                            <MenuItem value="sevk_tarihi">Sevk Tarihi</MenuItem>
                            <MenuItem value="navlun">Navlun</MenuItem>
                            <MenuItem value="surucu">Sürücü</MenuItem>
                            <MenuItem value="varis1">Varış</MenuItem>
                        </Select>

                        <Stack direction="row" spacing={1}>
                            <Button fullWidth variant="outlined" onClick={clearFilters} sx={styles.outlinedBtn}>
                                Temizle
                            </Button>
                            <Button fullWidth variant="contained" onClick={() => setFilterDialog(false)} sx={styles.containedBtn}>
                                Uygula
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            <DetailDrawer
                row={selectedRow}
                open={detailOpen && !!selectedRow}
                onClose={() => setDetailOpen(false)}
                onDriverClick={onDriverQuickFilter}
            />

            {!!selectedRow && !detailOpen && (
                <Fab color="primary" onClick={() => setDetailOpen(true)} sx={styles.fab}>
                    <BoltRounded />
                </Fab>
            )}

            <Fab size="small" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} sx={styles.fabTop}>
                <ArrowUpwardRounded fontSize="small" />
            </Fab>

            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack((p) => ({ ...p, open: false }))}
            >
                <Alert severity={snack.sev} variant="filled" sx={{ borderRadius: 3 }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        p: { xs: 1.5, md: 2.5 },
        background: `
            radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 22%),
            radial-gradient(circle at top right, rgba(168,85,247,0.12), transparent 20%),
            radial-gradient(circle at bottom center, rgba(16,185,129,0.10), transparent 24%),
            radial-gradient(circle at bottom left, rgba(239,68,68,0.08), transparent 16%),
            linear-gradient(180deg, #111827 0%, #0b1220 50%, #050816 100%)
        `,
    },

    hero: {
        p: { xs: 2, md: 2.4 },
        borderRadius: "28px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
        backdropFilter: "blur(16px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
    },

    actionBar: {
        p: 1.2,
        borderRadius: "22px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    },

    primaryActionBtn: {
        p: 1.1,
        gap: 1,
        borderRadius: "20px",
        color: "#fff",
        textTransform: "none",
        fontWeight: 900,
        background: "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.92))",
        boxShadow: "0 12px 30px rgba(37,99,235,0.26)",
        border: "1px solid rgba(255,255,255,0.12)",
        "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 18px 36px rgba(37,99,235,0.34)",
            background: "linear-gradient(135deg, rgba(77,143,247,0.98), rgba(47,109,240,0.95))",
        },
    },

    softActionBtn: {
        p: 1.1,
        gap: 1,
        borderRadius: "20px",
        color: "#fff",
        textTransform: "none",
        fontWeight: 900,
        background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        "&:hover": {
            transform: "translateY(-1px)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.06))",
            borderColor: "rgba(255,255,255,0.16)",
        },
    },

    actionBtnIcon: {
        width: 42,
        height: 42,
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
    },

    actionBtnTitle: { color: "#fff", fontSize: 14, fontWeight: 900, lineHeight: 1.1 },
    actionBtnSub: { color: "rgba(255,255,255,0.64)", fontSize: 11.5, mt: 0.4 },

    sortPanel: {
        p: 1,
        borderRadius: "18px",
        minWidth: { xs: "100%", lg: 360 },
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
    },

    sortPanelLabel: {
        color: "rgba(255,255,255,0.52)",
        fontWeight: 800,
        fontSize: 11.5,
        mb: 1,
    },

    sortChip: {
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.06)",
        color: "#e2e8f0",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 800,
        cursor: "pointer",
    },

    sortChipActive: {
        borderRadius: 999,
        bgcolor: "rgba(59,130,246,0.18)",
        color: "#dbeafe",
        border: "1px solid rgba(59,130,246,0.24)",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 10px 24px rgba(59,130,246,0.18)",
    },

    heroTitle: {
        color: "#fff",
        fontWeight: 950,
        fontSize: { xs: 28, md: 38 },
        letterSpacing: "-0.03em",
    },

    heroSub: {
        mt: 0.8,
        color: "rgba(255,255,255,0.58)",
        maxWidth: 760,
        lineHeight: 1.7,
    },

    heroStatsGrid: {
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", xl: "repeat(4, 1fr)" },
        gap: 1.2,
    },

    statChip: {
        p: 1.2,
        borderRadius: "18px",
        display: "flex",
        gap: 1,
        alignItems: "center",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
    },

    statChipIcon: {
        width: 36,
        height: 36,
        borderRadius: "12px",
        display: "grid",
        placeItems: "center",
    },

    statChipLabel: { color: "rgba(255,255,255,0.52)", fontSize: 11, fontWeight: 800 },
    statChipValue: { color: "#fff", fontWeight: 900, fontSize: 15 },

    highlightBanner: {
        p: 1.4,
        borderRadius: "22px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(168,85,247,0.12), rgba(255,255,255,0.03))",
        boxShadow: "0 16px 40px rgba(0,0,0,0.16)",
    },

    highlightAvatar: {
        width: 46,
        height: 46,
        bgcolor: "rgba(168,85,247,0.18)",
        color: "#f5d0fe",
        fontWeight: 900,
    },

    highlightTitle: { color: "#fff", fontSize: 16, fontWeight: 900 },
    highlightSub: { color: "rgba(255,255,255,0.62)", mt: 0.4 },

    highlightBtn: {
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 900,
        px: 2,
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.08)",
    },

    topDriverWrap: {
        p: 2,
        borderRadius: "28px",
        border: "1px solid rgba(59,130,246,0.18)",
        background: "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(255,255,255,0.03))",
    },

    topDriverAvatar: {
        width: 54,
        height: 54,
        bgcolor: "rgba(59,130,246,0.16)",
        color: "#dbeafe",
        border: "1px solid rgba(59,130,246,0.18)",
        fontWeight: 950,
    },

    topDriverTitle: { color: "#fff", fontWeight: 950, fontSize: 22 },
    topDriverSub: { color: "rgba(255,255,255,0.62)", mt: 0.3 },

    driverSummaryGrid: {
        mt: 2,
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" },
        gap: 1,
    },

    miniMetric: {
        p: 1.2,
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(2,6,23,0.35)",
    },

    miniMetricLabel: { color: "rgba(255,255,255,0.52)", fontSize: 11.5, fontWeight: 800 },
    miniMetricValue: { color: "#fff", fontWeight: 950, fontSize: 18, mt: 0.5 },

    driverSplitGrid: {
        mt: 1.2,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 1,
    },

    compactRankCard: {
        p: 1.2,
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
    },

    compactRankTitle: { color: "#fff", fontWeight: 900 },
    compactRankRow: { display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" },
    compactRankName: { color: "#fff", fontWeight: 700 },

    mainGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 2 },

    listCard: {
        p: 1.6,
        borderRadius: "28px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.03))",
    },

    tableWrap: {
        width: "100%",
        overflowX: "auto",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.025)",
        "&::-webkit-scrollbar": { height: 10 },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.18)",
            borderRadius: 999,
        },
    },

    table: {
        minWidth: 1700,
        "& .MuiTableCell-root": {
            borderBottom: "1px solid rgba(255,255,255,0.06)",
        },
    },

    th: {
        background: "rgba(15,23,42,0.96)",
        color: "rgba(255,255,255,0.72)",
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
    },

    tr: {
        cursor: "pointer",
        transition: "0.18s ease",
        "&:hover": {
            background: "rgba(255,255,255,0.04)",
        },
    },

    trSelected: {
        background: "linear-gradient(180deg, rgba(59,130,246,0.10), rgba(255,255,255,0.02))",
        boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.18)",
    },

    td: {
        color: "#e5e7eb",
        fontSize: 13,
        verticalAlign: "top",
        whiteSpace: "nowrap",
    },

    tdStrong: {
        color: "#fff",
        fontSize: 13,
        fontWeight: 900,
        verticalAlign: "top",
        whiteSpace: "nowrap",
    },

    tdMoney: {
        color: "#86efac",
        fontSize: 13,
        fontWeight: 900,
        verticalAlign: "top",
        whiteSpace: "nowrap",
    },

    tdLine: {
        color: "#fff",
        fontWeight: 700,
        fontSize: 12.5,
        lineHeight: 1.2,
    },

    tdSubLine: {
        color: "rgba(255,255,255,0.58)",
        fontSize: 12,
        lineHeight: 1.2,
    },

    softChipMini: {
        borderRadius: 999,
        height: 24,
        bgcolor: "rgba(255,255,255,0.08)",
        color: "#f8fafc",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 700,
        maxWidth: 180,
        "& .MuiChip-label": {
            px: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
        },
    },

    driverChipMini: {
        borderRadius: 999,
        height: 26,
        bgcolor: "rgba(59,130,246,0.14)",
        color: "#dbeafe",
        border: "1px solid rgba(59,130,246,0.16)",
        fontWeight: 800,
        cursor: "pointer",
    },

    mobileCard: {
        p: 1.2,
        borderRadius: "20px",
        cursor: "pointer",
        transition: "0.18s ease",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
        "&:hover": {
            background: "rgba(255,255,255,0.05)",
        },
    },

    mobileCardSelected: {
        border: "1px solid rgba(59,130,246,0.28)",
        background: "linear-gradient(180deg, rgba(59,130,246,0.12), rgba(255,255,255,0.03))",
        boxShadow: "0 12px 30px rgba(59,130,246,0.14)",
    },

    rowAvatar: {
        width: 42,
        height: 42,
        fontSize: 13,
        fontWeight: 900,
        bgcolor: "rgba(59,130,246,0.16)",
        color: "#dbeafe",
    },

    compactRowTitle: { color: "#fff", fontWeight: 900, fontSize: 15 },
    compactMoney: { color: "#86efac", fontWeight: 950, fontSize: 16 },
    compactDate: { color: "rgba(255,255,255,0.48)", fontSize: 12 },

    inlineInfoGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0.8,
    },

    inlineInfoItem: {
        p: 0.9,
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
        minWidth: 0,
    },

    inlineInfoLabel: {
        color: "rgba(255,255,255,0.48)",
        fontSize: 10.5,
        fontWeight: 800,
        mb: 0.25,
    },

    inlineInfoValue: {
        color: "#e5e7eb",
        fontSize: 12.5,
        fontWeight: 700,
        wordBreak: "break-word",
    },

    inlineInfoValueStrong: {
        color: "#fff",
        fontSize: 12.5,
        fontWeight: 900,
        wordBreak: "break-word",
    },

    mobileRouteText: {
        color: "rgba(255,255,255,0.72)",
        fontSize: 12.5,
        fontWeight: 700,
        flex: 1,
        pr: 1,
    },

    rowActionBtn: {
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 800,
        minWidth: "auto",
        color: "#dbeafe",
        border: "1px solid rgba(59,130,246,0.18)",
        background: "rgba(59,130,246,0.10)",
        "&:hover": {
            background: "rgba(59,130,246,0.16)",
        },
    },

    drawerPaper: {
        width: { xs: "100%", sm: 460 },
        background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
        color: "#fff",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
    },

    drawerHeader: { p: 2 },

    drawerAvatar: {
        width: 54,
        height: 54,
        borderRadius: "16px",
        bgcolor: "rgba(59,130,246,0.16)",
        color: "#dbeafe",
        fontWeight: 950,
    },

    drawerTitle: { color: "#fff", fontWeight: 950, fontSize: 22 },
    drawerSub: { color: "rgba(255,255,255,0.58)", mt: 0.25 },

    tabs: {
        px: 1,
        "& .MuiTab-root": { color: "rgba(255,255,255,0.6)", textTransform: "none", fontWeight: 800 },
        "& .Mui-selected": { color: "#fff !important" },
    },

    drawerBody: { p: 2 },

    detailItem: {
        p: 1.2,
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
    },

    detailItemLabel: { color: "rgba(255,255,255,0.48)", fontSize: 11.5, fontWeight: 800 },
    detailItemValue: { color: "#fff", fontWeight: 800, mt: 0.35, wordBreak: "break-word" },

    paginationWrap: {
        mt: 1.5,
        pt: 1.2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        flexDirection: { xs: "column", md: "row" },
        gap: 1.2,
        borderTop: "1px solid rgba(255,255,255,0.06)",
    },

    paginationInfo: { color: "rgba(255,255,255,0.62)", fontWeight: 700 },

    pageIconBtn: {
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "rgba(255,255,255,0.03)",
    },

    quickInsight: {
        p: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: 180,
        borderRadius: "18px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
    },

    quickInsightIcon: {
        width: 34,
        height: 34,
        borderRadius: "12px",
        display: "grid",
        placeItems: "center",
        color: "#bfdbfe",
        background: "rgba(59,130,246,0.14)",
    },

    quickInsightLabel: { color: "rgba(255,255,255,0.48)", fontSize: 11, fontWeight: 800 },
    quickInsightValue: { color: "#fff", fontWeight: 800 },

    centerBoxLarge: { minHeight: 300, display: "grid", placeItems: "center" },
    emptyTitle: { color: "#fff", fontWeight: 900 },
    softText: { color: "rgba(255,255,255,0.58)" },

    headerChip: {
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.08)",
        color: "#f8fafc",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 800,
    },

    activeFilterChip: {
        borderRadius: 999,
        bgcolor: "rgba(59,130,246,0.14)",
        color: "#dbeafe",
        border: "1px solid rgba(59,130,246,0.18)",
        fontWeight: 800,
        "& .MuiChip-deleteIcon": { color: "#dbeafe" },
    },

    softChip: {
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.08)",
        color: "#f8fafc",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 700,
    },

    moneyChip: {
        borderRadius: 999,
        bgcolor: "rgba(16,185,129,0.12)",
        color: "#d1fae5",
        border: "1px solid rgba(16,185,129,0.18)",
        fontWeight: 900,
    },

    driverChip: {
        borderRadius: 999,
        bgcolor: "rgba(59,130,246,0.14)",
        color: "#dbeafe",
        border: "1px solid rgba(59,130,246,0.16)",
        fontWeight: 800,
        cursor: "pointer",
    },

    rankChip: {
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.08)",
        color: "#f8fafc",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 800,
    },

    outlinedBtn: {
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 800,
        color: "#f8fafc",
        borderColor: "rgba(255,255,255,0.16)",
        background: "rgba(255,255,255,0.02)",
        "&:hover": { borderColor: "rgba(255,255,255,0.28)", bgcolor: "rgba(255,255,255,0.05)" },
    },

    containedBtn: {
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 900,
        boxShadow: "none",
        background: "linear-gradient(135deg,#3b82f6,#2563eb)",
        "&:hover": { background: "linear-gradient(135deg,#4f8ff7,#2f6df0)", boxShadow: "none" },
    },

    clearBtn: { textTransform: "none", fontWeight: 800, color: "#93c5fd", px: 1 },

    searchField: {
        "& .MuiOutlinedInput-root": {
            color: "#fff",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.04)",
            "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
        },
    },

    dialogPaper: {
        borderRadius: "24px",
        background: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
    },

    closeBtn: {
        color: "#fff",
        bgcolor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
    },

    select: {
        color: "#fff",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.04)",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
        "& .MuiSvgIcon-root": { color: "#fff" },
    },

    fab: {
        position: "fixed",
        right: 24,
        bottom: 88,
        background: "linear-gradient(135deg,#3b82f6,#2563eb)",
        color: "#fff",
        boxShadow: "0 16px 32px rgba(37,99,235,0.35)",
    },

    fabTop: {
        position: "fixed",
        right: 24,
        bottom: 24,
        color: "#fff",
        background: "rgba(15,23,42,0.88)",
        border: "1px solid rgba(255,255,255,0.08)",
    },
};