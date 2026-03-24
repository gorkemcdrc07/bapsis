import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "https://bapsis-backend.onrender.com";
function formatDateDisplay(isoDate) {
    if (!isoDate) return "";
    const [yyyy, mm, dd] = String(isoDate).split("-");
    return `${dd}.${mm}.${yyyy}`;
}

function formatNumber(value, digits = 2) {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "0";
    return new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(num);
}

async function readExcelFile(file) {
    const buffer = await file.arrayBuffer();
    return XLSX.read(buffer, { type: "array", cellDates: true });
}

function getSheetRows(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(`Excel içinde '${sheetName}' sayfası bulunamadı.`);
    }

    return XLSX.utils.sheet_to_json(sheet, {
        defval: null,
        raw: false,
    });
}

function pad2(n) {
    return String(n).padStart(2, "0");
}

function formatLocalDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = pad2(dateObj.getMonth() + 1);
    const d = pad2(dateObj.getDate());
    return `${y}-${m}-${d}`;
}

function normalizeExcelDate(value) {
    if (value === null || value === undefined || value === "") return null;

    // Date object
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return formatLocalDate(value);
    }

    // Excel numeric date
    if (typeof value === "number") {
        const excelEpoch = new Date(1899, 11, 30);
        const d = new Date(excelEpoch.getTime() + value * 86400000);
        if (!Number.isNaN(d.getTime())) {
            return formatLocalDate(d);
        }
    }

    const str = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }

    if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
        const [dd, mm, yyyy] = str.split(".");
        return `${yyyy}-${mm}-${dd}`;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [dd, mm, yyyy] = str.split("/");
        return `${yyyy}-${mm}-${dd}`;
    }

    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
        return formatLocalDate(d);
    }

    return null;
}
function extractAvailableDates(demandRows = []) {
    const uniq = new Set();

    demandRows.forEach((row) => {
        const key = normalizeExcelDate(row?.date);
        if (key) uniq.add(key);
    });

    return Array.from(uniq).sort();
}

function MetricCard({ title, value, subvalue }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.25,
                borderRadius: 4,
                minHeight: 112,
                background:
                    "linear-gradient(180deg, rgba(22,28,45,0.96) 0%, rgba(15,20,34,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
            }}
        >
            <Typography
                sx={{
                    color: "rgba(255,255,255,0.64)",
                    fontSize: 13,
                    mb: 1,
                }}
            >
                {title}
            </Typography>

            <Typography
                sx={{
                    color: "#fff",
                    fontSize: { xs: 24, md: 28 },
                    fontWeight: 800,
                    letterSpacing: -0.5,
                    lineHeight: 1.1,
                }}
            >
                {value}
            </Typography>

            {subvalue ? (
                <Typography
                    sx={{
                        mt: 0.75,
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 12,
                    }}
                >
                    {subvalue}
                </Typography>
            ) : null}
        </Paper>
    );
}

function UploadCard({ title, subtitle, fileName, onSelect }) {
    const inputRef = useRef(null);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.25,
                borderRadius: 4,
                flex: 1,
                minHeight: 168,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background:
                    "linear-gradient(180deg, rgba(20,26,42,0.98) 0%, rgba(13,18,30,1) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.26)",
            }}
        >
            <Box>
                <Typography
                    sx={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 700,
                        mb: 0.75,
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    sx={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: 13,
                        lineHeight: 1.5,
                    }}
                >
                    {subtitle}
                </Typography>
            </Box>

            <Stack spacing={1.5}>
                <Button
                    variant="outlined"
                    onClick={() => inputRef.current?.click()}
                    sx={{
                        alignSelf: "flex-start",
                        color: "#dbe7ff",
                        borderColor: "rgba(110,168,255,0.4)",
                        backgroundColor: "rgba(110,168,255,0.06)",
                        px: 2,
                        py: 1,
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 700,
                        "&:hover": {
                            borderColor: "rgba(110,168,255,0.75)",
                            backgroundColor: "rgba(110,168,255,0.12)",
                        },
                    }}
                >
                    Excel Seç
                </Button>

                <Box
                    sx={{
                        px: 1.25,
                        py: 1,
                        borderRadius: 3,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <Typography
                        sx={{
                            color: fileName ? "#fff" : "rgba(255,255,255,0.45)",
                            fontSize: 13,
                            fontWeight: fileName ? 600 : 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {fileName || "Henüz dosya seçilmedi"}
                    </Typography>
                </Box>

                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onSelect(file);
                    }}
                />
            </Stack>
        </Paper>
    );
}

export default function PlanlamaPage() {
    const [dataFile, setDataFile] = useState(null);
    const [demandFile, setDemandFile] = useState(null);

    const [demands, setDemands] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");

    const [strategy, setStrategy] = useState("greedy");
    const [maxStops, setMaxStops] = useState(3);
    const [fixedCost, setFixedCost] = useState(0);

    const [summary, setSummary] = useState([]);
    const [missingTariffs, setMissingTariffs] = useState([]);
    const [truckCapacity, setTruckCapacity] = useState(33);
    const [depotName, setDepotName] = useState("");

    const [totals, setTotals] = useState({
        total_cost: 0,
        total_pallets: 0,
        avg_utilization_pct: 0,
        fleet_utilization_pct: 0,
        truck_count: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const sortedSummary = useMemo(() => {
        return [...summary].sort(
            (a, b) => Number(b.total_cost || 0) - Number(a.total_cost || 0)
        );
    }, [summary]);

    const resetResults = () => {
        setSummary([]);
        setMissingTariffs([]);
        setTotals({
            total_cost: 0,
            total_pallets: 0,
            avg_utilization_pct: 0,
            fleet_utilization_pct: 0,
            truck_count: 0,
        });
    };

    const handleLoadDataFile = async (file) => {
        try {
            setError("");
            setInfo("");
            setDataFile(file);
            resetResults();
            setInfo("Data excel başarıyla yüklendi.");
        } catch (err) {
            setError(err.message || "Data excel okunamadı.");
        }
    };

    const handleLoadDemandFile = async (file) => {
        try {
            setError("");
            setInfo("");
            setDemandFile(file);

            const workbook = await readExcelFile(file);
            const demandRows = getSheetRows(workbook, "Demands");
            const dates = extractAvailableDates(demandRows);

            console.log("DATES FROM EXCEL:", dates);

            setDemands(demandRows);
            setAvailableDates(dates);
            setSelectedDate(dates[0] || "");

            resetResults();
            setInfo("Demand excel başarıyla yüklendi.");
        } catch (err) {
            setError(err.message || "Demand excel okunamadı.");
        }
    };
    const handleRunPlanning = async () => {
        try {
            setLoading(true);
            setError("");
            setInfo("");

            if (!dataFile || !demandFile) {
                throw new Error(
                    "Lütfen TruckRoutingData.xlsx ve TruckRoutingDemands.xlsx dosyalarını yükleyin."
                );
            }

            if (!selectedDate) {
                throw new Error("Lütfen talep tarihi seçin.");
            }

            const formData = new FormData();
            formData.append("data_file", dataFile);
            formData.append("demand_file", demandFile);
            formData.append("selected_date", selectedDate);
            formData.append("strategy", strategy);
            formData.append("max_stops", String(maxStops));
            formData.append("fixed_cost", String(fixedCost));

            const response = await fetch(`${API_BASE_URL}/plan`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => null);
                console.log("🔥 BACKEND ERROR:", errJson);
                throw new Error(errJson?.error || "Backend hatası oluştu.");
            }

            const result = await response.json();
            console.log("🔥 RESULT:", result);

            if (result.error) {
                throw new Error(result.error);
            }

            setSummary(result.summary || []);
            setMissingTariffs(result.missing_tariffs || []);
            setTruckCapacity(result.truck_capacity || 33);
            setDepotName(result.depot_name || "");
            setTotals(
                result.totals || {
                    total_cost: 0,
                    total_pallets: 0,
                    avg_utilization_pct: 0,
                    fleet_utilization_pct: 0,
                    truck_count: 0,
                }
            );

            setInfo("Planlama tamamlandı.");
        } catch (err) {
            resetResults();
            setError(err.message || "Planlama sırasında hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background:
                    "radial-gradient(circle at top left, rgba(76,110,245,0.18), transparent 28%), radial-gradient(circle at top right, rgba(0,188,212,0.12), transparent 22%), linear-gradient(180deg, #0a0f1d 0%, #0d1324 100%)",
                px: { xs: 2, md: 4 },
                py: { xs: 3, md: 4 },
            }}
        >
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3.5 },
                        mb: 3,
                        borderRadius: 5,
                        background:
                            "linear-gradient(180deg, rgba(18,24,39,0.92) 0%, rgba(13,18,30,0.97) 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                    >
                        <Box>
                            <Chip
                                label="Dark Planning UI"
                                size="small"
                                sx={{
                                    mb: 1.5,
                                    color: "#cfe0ff",
                                    backgroundColor: "rgba(110,168,255,0.12)",
                                    border: "1px solid rgba(110,168,255,0.18)",
                                }}
                            />

                            <Typography
                                sx={{
                                    color: "#fff",
                                    fontSize: { xs: 28, md: 36 },
                                    fontWeight: 900,
                                    letterSpacing: -1,
                                    lineHeight: 1.1,
                                    mb: 1,
                                }}
                            >
                                Truck Routing Planlama
                            </Typography>

                            <Typography
                                sx={{
                                    color: "rgba(255,255,255,0.62)",
                                    maxWidth: 760,
                                    fontSize: 15,
                                    lineHeight: 1.6,
                                }}
                            >
                                Excel verilerini yükleyip tarih seçerek araç planını oluştur,
                                maliyetleri Python backend üzerinde hesapla ve sonucu tek ekranda göster.
                            </Typography>
                        </Box>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                        >
                            <Chip label={`Depo: ${depotName || "-"}`} sx={topChipSx} />
                            <Chip label={`Kapasite: ${truckCapacity || 0}`} sx={topChipSx} />
                            <Chip
                                label={`Tarih: ${selectedDate ? formatDateDisplay(selectedDate) : "-"}`}
                                sx={topChipSx}
                            />
                        </Stack>
                    </Stack>
                </Paper>

                <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ mb: 3 }}>
                    <UploadCard
                        title="Veri Dosyası"
                        subtitle="Ana data excel dosyasını yükleyin. Hesap Python backend tarafında yapılır."
                        fileName={dataFile?.name}
                        onSelect={handleLoadDataFile}
                    />

                    <UploadCard
                        title="Demand Dosyası"
                        subtitle="Demands sayfası içeren günlük talep excelini yükleyin. Tarihler otomatik listelenir."
                        fileName={demandFile?.name}
                        onSelect={handleLoadDemandFile}
                    />
                </Stack>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 2.5 },
                        mb: 3,
                        borderRadius: 5,
                        background:
                            "linear-gradient(180deg, rgba(18,24,39,0.94) 0%, rgba(13,18,30,0.98) 100%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 16px 40px rgba(0,0,0,0.26)",
                    }}
                >
                    <Stack spacing={2}>
                        <Typography
                            sx={{
                                color: "#fff",
                                fontSize: 18,
                                fontWeight: 800,
                            }}
                        >
                            Plan Parametreleri
                        </Typography>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                select
                                label="Talep Tarihi"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                fullWidth
                                disabled={!availableDates.length}
                                sx={darkFieldSx}
                            >
                                {availableDates.map((date) => (
                                    <MenuItem key={date} value={date}>
                                        {formatDateDisplay(date)}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Yöntem"
                                value={strategy}
                                onChange={(e) => setStrategy(e.target.value)}
                                fullWidth
                                sx={darkFieldSx}
                            >
                                <MenuItem value="greedy">Greedy</MenuItem>
                                <MenuItem value="ortools">OR-Tools</MenuItem>
                            </TextField>

                            <TextField
                                label="Araç Başına Max Durak"
                                type="number"
                                value={maxStops}
                                onChange={(e) => setMaxStops(Number(e.target.value || 0))}
                                fullWidth
                                sx={darkFieldSx}
                            />
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                label="Sabit Araç Maliyeti"
                                type="number"
                                value={fixedCost}
                                onChange={(e) => setFixedCost(Number(e.target.value || 0))}
                                fullWidth
                                sx={darkFieldSx}
                            />

                            <TextField
                                label="Araç Kapasitesi"
                                value={truckCapacity}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                sx={darkFieldSx}
                            />

                            <TextField
                                label="Merkez Depo"
                                value={depotName}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                sx={darkFieldSx}
                            />
                        </Stack>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            justifyContent="space-between"
                            alignItems={{ xs: "stretch", sm: "center" }}
                        >
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip label={`Demand Satırı: ${demands.length}`} sx={miniChipSx} />
                                <Chip label={`Seçilen Yöntem: ${strategy}`} sx={miniChipSx} />
                                <Chip label={`Max Stop: ${maxStops}`} sx={miniChipSx} />
                            </Stack>

                            <Button
                                variant="contained"
                                onClick={handleRunPlanning}
                                disabled={loading}
                                sx={{
                                    minWidth: 220,
                                    py: 1.25,
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontSize: 15,
                                    fontWeight: 800,
                                    boxShadow: "0 10px 24px rgba(76,110,245,0.35)",
                                    background:
                                        "linear-gradient(135deg, #4c6ef5 0%, #2f80ed 100%)",
                                    "&:hover": {
                                        background:
                                            "linear-gradient(135deg, #5b79ff 0%, #3889f5 100%)",
                                    },
                                    "&.Mui-disabled": {
                                        color: "rgba(255,255,255,0.42)",
                                        background: "rgba(255,255,255,0.08)",
                                    },
                                }}
                            >
                                {loading ? "Planlama Çalışıyor..." : "Planlamayı Çalıştır"}
                            </Button>
                        </Stack>

                        {info ? (
                            <Alert
                                severity="success"
                                sx={{
                                    borderRadius: 3,
                                    color: "#d8ffe9",
                                    backgroundColor: "rgba(32, 201, 151, 0.12)",
                                    border: "1px solid rgba(32, 201, 151, 0.24)",
                                }}
                            >
                                {info}
                            </Alert>
                        ) : null}

                        {error ? (
                            <Alert
                                severity="error"
                                sx={{
                                    borderRadius: 3,
                                    color: "#ffd8d8",
                                    backgroundColor: "rgba(250, 82, 82, 0.12)",
                                    border: "1px solid rgba(250, 82, 82, 0.22)",
                                }}
                            >
                                {error}
                            </Alert>
                        ) : null}
                    </Stack>
                </Paper>

                {sortedSummary.length > 0 && (
                    <>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, 1fr)",
                                    lg: "repeat(4, 1fr)",
                                },
                                gap: 2,
                                mb: 3,
                            }}
                        >
                            <MetricCard
                                title="Toplam Maliyet"
                                value={`${formatNumber(totals.total_cost, 2)} ₺`}
                                subvalue="Plan toplam taşıma maliyeti"
                            />
                            <MetricCard
                                title="Toplam Palet"
                                value={formatNumber(totals.total_pallets, 0)}
                                subvalue="Planlanan toplam yük"
                            />
                            <MetricCard
                                title="Ortalama Doluluk"
                                value={`%${formatNumber(totals.avg_utilization_pct, 1)}`}
                                subvalue="Araç bazlı ortalama kullanım"
                            />
                            <MetricCard
                                title="Araç Sayısı"
                                value={formatNumber(totals.truck_count, 0)}
                                subvalue="Oluşturulan toplam sevkiyat"
                            />
                        </Box>

                        {missingTariffs.length > 0 && (
                            <Alert
                                severity="warning"
                                sx={{
                                    mb: 3,
                                    borderRadius: 3,
                                    color: "#ffefc2",
                                    backgroundColor: "rgba(253, 203, 110, 0.12)",
                                    border: "1px solid rgba(253, 203, 110, 0.22)",
                                }}
                            >
                                Eksik Tarife: {missingTariffs.join(", ")}
                            </Alert>
                        )}

                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 5,
                                overflow: "hidden",
                                background:
                                    "linear-gradient(180deg, rgba(18,24,39,0.94) 0%, rgba(13,18,30,0.98) 100%)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 16px 40px rgba(0,0,0,0.26)",
                            }}
                        >
                            <Box
                                sx={{
                                    px: 2.5,
                                    py: 2,
                                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: "#fff",
                                        fontSize: 18,
                                        fontWeight: 800,
                                        mb: 0.5,
                                    }}
                                >
                                    Planlama Sonuçları
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "rgba(255,255,255,0.58)",
                                        fontSize: 13,
                                    }}
                                >
                                    Sonuçlar Python backend tarafından hesaplanır ve toplam maliyete göre sıralanır.
                                </Typography>
                            </Box>

                            <TableContainer sx={{ maxHeight: "70vh" }}>
                                <Table stickyHeader sx={{ minWidth: 1480 }}>
                                    <TableHead>
                                        <TableRow>
                                            {[
                                                "Araç",
                                                "Durak",
                                                "Toplam Palet",
                                                "Doluluk %",
                                                "Ana Maliyet",
                                                "Ek Durak",
                                                "Ek KM Fiyatı",
                                                "Baz KM",
                                                "Rota KM",
                                                "Ek KM",
                                                "Faturalanır Ek KM",
                                                "Ek KM Maliyeti",
                                                "Toplam Maliyet",
                                                "Rota",
                                            ].map((head) => (
                                                <TableCell key={head} sx={tableHeadSx}>
                                                    {head}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {sortedSummary.map((row, index) => (
                                            <TableRow
                                                key={`${row.truck}-${index}`}
                                                sx={{
                                                    backgroundColor:
                                                        index % 2 === 0
                                                            ? "rgba(255,255,255,0.01)"
                                                            : "rgba(255,255,255,0.025)",
                                                    "&:hover": {
                                                        backgroundColor: alpha("#4c6ef5", 0.1),
                                                    },
                                                }}
                                            >
                                                <TableCell sx={tableCellSx}>
                                                    <Chip
                                                        label={row.truck}
                                                        size="small"
                                                        sx={{
                                                            color: "#eaf1ff",
                                                            backgroundColor:
                                                                "rgba(76,110,245,0.18)",
                                                            border:
                                                                "1px solid rgba(76,110,245,0.24)",
                                                            fontWeight: 700,
                                                        }}
                                                    />
                                                </TableCell>

                                                <TableCell sx={tableCellSx}>{row.stops}</TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.total_pallets, 0)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    %{formatNumber(row["utilization_%"], 1)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.base_cost, 2)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.add_stop_cost, 2)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.extra_km_price, 4)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.baseline_km, 2)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.route_km, 2)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.extra_km_over_baseline, 2)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.extra_km_chargeable, 2)}
                                                </TableCell>
                                                <TableCell sx={tableCellSx}>
                                                    {formatNumber(row.extra_km_cost, 2)}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        ...tableCellSx,
                                                        color: "#ffffff",
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    {formatNumber(row.total_cost, 2)}
                                                </TableCell>
                                                <TableCell
                                                    sx={{
                                                        ...tableCellSx,
                                                        minWidth: 320,
                                                        color: "rgba(255,255,255,0.86)",
                                                    }}
                                                >
                                                    {row.route}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </>
                )}
            </Box>
        </Box>
    );
}

const topChipSx = {
    color: "#e6efff",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    "& .MuiChip-label": {
        px: 1.25,
        fontWeight: 600,
    },
};

const miniChipSx = {
    color: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
};

const darkFieldSx = {
    "& .MuiOutlinedInput-root": {
        color: "#fff",
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: 3,
        "& fieldset": {
            borderColor: "rgba(255,255,255,0.10)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(255,255,255,0.18)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#6ea8ff",
            boxShadow: "0 0 0 3px rgba(110,168,255,0.08)",
        },
    },
    "& .MuiInputLabel-root": {
        color: "rgba(255,255,255,0.62)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#9fc0ff",
    },
    "& .MuiSvgIcon-root": {
        color: "rgba(255,255,255,0.72)",
    },
};

const tableHeadSx = {
    position: "sticky",
    top: 0,
    zIndex: 2,
    whiteSpace: "nowrap",
    fontWeight: 800,
    fontSize: 13,
    color: "#dbe7ff",
    backgroundColor: "#12192b",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const tableCellSx = {
    whiteSpace: "nowrap",
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
};