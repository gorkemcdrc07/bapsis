import React, { useMemo, useState } from "react";
import { supabase } from "../supabase";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import {
    LockRounded,
    MailOutlineRounded,
    Visibility,
    VisibilityOff,
    ArrowForwardRounded,
} from "@mui/icons-material";

const DOMAIN = "@odaklojistik.com.tr";
const LS_KEY = "bapsis_user";

export default function Auth({ onGirisBasarili }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [formData, setFormData] = useState({
        mail: "",
        sifre: "",
    });
    const [yukleniyor, setYukleniyor] = useState(false);
    const [hata, setHata] = useState("");
    const [sifreGoster, setSifreGoster] = useState(false);
    const [mailUyari, setMailUyari] = useState("");
    const [girisBasarili, setGirisBasarili] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "mail") {
            const normalized = value.trim().toLowerCase();

            if (normalized.includes("@")) {
                const cleaned = normalized.split("@")[0];
                setMailUyari(`${DOMAIN} otomatik eklenecektir`);
                setFormData((prev) => ({
                    ...prev,
                    mail: cleaned,
                }));
                return;
            }

            setMailUyari("");
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const fullEmailPreview = useMemo(() => {
        const raw = (formData.mail || "").trim().toLowerCase();
        return raw ? `${raw}${DOMAIN}` : `kullaniciadi${DOMAIN}`;
    }, [formData.mail]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (girisBasarili) return;

        setHata("");

        const mailKismi = (formData.mail || "").trim().toLowerCase();
        if (!mailKismi) return setHata("Kullanıcı adı boş olamaz.");
        if (!(formData.sifre || "").trim()) return setHata("Şifre boş olamaz.");

        const tamMail = `${mailKismi}${DOMAIN}`;

        setYukleniyor(true);

        try {
            const { data, error } = await supabase
                .from("kullanicilar")
                .select("id,mail,rol_id,rol,kullanici")
                .eq("mail", tamMail)
                .eq("sifre", formData.sifre)
                .maybeSingle();

            if (error || !data) throw new Error("Giriş bilgileri hatalı.");

            const sessionUser = {
                id: data.id,
                username: mailKismi,
                mail: data.mail,
                displayName: data.kullanici,
                rol: data.rol,
                rol_id: data.rol_id,
            };

            localStorage.setItem(LS_KEY, JSON.stringify(sessionUser));
            setGirisBasarili(true);
            setYukleniyor(false);

            setTimeout(() => {
                onGirisBasarili?.(sessionUser);
            }, 1800);
        } catch (err) {
            setHata(err?.message || "Bir hata oluştu.");
            setYukleniyor(false);
        }
    };

    return (
        <Box sx={styles.page}>
            <Box sx={styles.bgGrid} />
            <Box sx={styles.bgGlowLeft} />
            <Box sx={styles.bgGlowRight} />

            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
                <Paper sx={styles.mainContainer}>
                    {!isMobile && (
                        <Box sx={styles.visualSide}>
                            <Box sx={styles.visualGlowTop} />
                            <Box sx={styles.visualGlowBottom} />
                            <Box sx={styles.visualGlowCenter} />

                            <Box sx={styles.headerArea}>
                                <Typography variant="h3" sx={styles.brand}>
                                    BAPSİS
                                </Typography>
                                <Typography sx={styles.subBrand}>
                                    LOJİSTİK OPERASYON MERKEZİ
                                </Typography>
                            </Box>

                            <Box sx={styles.roadContainer}>
                                <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 400 600"
                                    preserveAspectRatio="xMidYMid slice"
                                >
                                    <defs>
                                        <linearGradient id="roadGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0b1220" />
                                            <stop offset="100%" stopColor="#1f2937" />
                                        </linearGradient>

                                        <linearGradient id="roadSideFade" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                                            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                                            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                                        </linearGradient>

                                        <linearGradient id="truckBody" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#ffffff" />
                                            <stop offset="100%" stopColor="#dfe6ef" />
                                        </linearGradient>

                                        <linearGradient id="truckBodyInner" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#f8fafc" />
                                            <stop offset="100%" stopColor="#eef2f7" />
                                        </linearGradient>

                                        <linearGradient id="truckCabin" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#0f172a" />
                                            <stop offset="100%" stopColor="#1e293b" />
                                        </linearGradient>

                                        <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.95" />
                                            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.55" />
                                        </linearGradient>

                                        <radialGradient id="headLightGlow" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                                            <stop offset="40%" stopColor="rgba(147,197,253,0.85)" />
                                            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
                                        </radialGradient>

                                        <radialGradient id="truckShadow" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
                                            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                                        </radialGradient>

                                        <radialGradient id="truckGlow" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
                                            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                                        </radialGradient>

                                        <filter id="softBlur">
                                            <feGaussianBlur stdDeviation="8" />
                                        </filter>
                                    </defs>

                                    <rect width="400" height="600" fill="url(#roadGradient)" />
                                    <rect width="400" height="600" fill="url(#roadSideFade)" />
                                    <rect x="56" width="4" height="600" fill="rgba(255,255,255,0.10)" />
                                    <rect x="340" width="4" height="600" fill="rgba(255,255,255,0.10)" />
                                    <rect x="0" y="0" width="400" height="600" fill="rgba(0,0,0,0.12)" />

                                    <motion.g
                                        animate={{ y: [0, 82] }}
                                        transition={{
                                            duration: girisBasarili ? 0.15 : 0.55,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    >
                                        {[...Array(10)].map((_, i) => (
                                            <rect
                                                key={i}
                                                x="195"
                                                y={i * 82 - 82}
                                                width="10"
                                                height="44"
                                                rx="3"
                                                fill="rgba(255,255,255,0.35)"
                                            />
                                        ))}
                                    </motion.g>

                                    <motion.g
                                        animate={{ y: [0, 80] }}
                                        transition={{
                                            duration: girisBasarili ? 0.22 : 1,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    >
                                        {[...Array(8)].map((_, i) => (
                                            <circle
                                                key={`left-${i}`}
                                                cx="72"
                                                cy={i * 80}
                                                r="2"
                                                fill="rgba(255,255,255,0.6)"
                                            />
                                        ))}
                                    </motion.g>

                                    <motion.g
                                        animate={{ y: [0, 80] }}
                                        transition={{
                                            duration: girisBasarili ? 0.22 : 1,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                    >
                                        {[...Array(8)].map((_, i) => (
                                            <circle
                                                key={`right-${i}`}
                                                cx="328"
                                                cy={i * 80}
                                                r="2"
                                                fill="rgba(255,255,255,0.6)"
                                            />
                                        ))}
                                    </motion.g>

                                    <ellipse
                                        cx="200"
                                        cy="445"
                                        rx="68"
                                        ry="34"
                                        fill="url(#truckShadow)"
                                    />

                                    <motion.ellipse
                                        cx="200"
                                        cy="450"
                                        rx="120"
                                        ry="50"
                                        fill="url(#truckGlow)"
                                        animate={
                                            girisBasarili
                                                ? { opacity: [0.5, 0.95, 0], scale: [1, 1.5, 2] }
                                                : { opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }
                                        }
                                        transition={{
                                            duration: girisBasarili ? 1.2 : 3,
                                            repeat: girisBasarili ? 0 : Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />

                                    <motion.path
                                        d="M200 340 L150 250 L250 250 Z"
                                        fill="rgba(96,165,250,0.14)"
                                        filter="url(#softBlur)"
                                        animate={
                                            girisBasarili
                                                ? { opacity: [0.35, 0.7, 0.1], scaleY: [1, 1.5, 1.8] }
                                                : { opacity: [0.16, 0.34, 0.16] }
                                        }
                                        transition={{
                                            duration: girisBasarili ? 0.7 : 1.8,
                                            repeat: girisBasarili ? Infinity : Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />

                                    <g transform="translate(175,340) scale(0.96)">
                                        <motion.g
                                            animate={
                                                girisBasarili
                                                    ? {
                                                        y: -520,
                                                        scale: 1.18,
                                                        rotate: 0,
                                                        x: 0,
                                                    }
                                                    : {
                                                        x: [-4, 4, -4],
                                                        rotate: [-0.7, 0.7, -0.7],
                                                        y: [0, -2, 0],
                                                    }
                                            }
                                            transition={
                                                girisBasarili
                                                    ? {
                                                        duration: 1.6,
                                                        ease: [0.2, 0.8, 0.2, 1],
                                                    }
                                                    : {
                                                        duration: 4.2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }
                                            }
                                            style={{ transformOrigin: "25px 80px" }}
                                        >
                                            <rect
                                                x="6"
                                                y="7"
                                                width="50"
                                                height="160"
                                                rx="5"
                                                fill="rgba(0,0,0,0.30)"
                                            />

                                            <rect
                                                x="0"
                                                y="40"
                                                width="50"
                                                height="120"
                                                rx="5"
                                                fill="url(#truckBody)"
                                            />
                                            <rect
                                                x="4.5"
                                                y="45"
                                                width="41"
                                                height="110"
                                                rx="3"
                                                fill="url(#truckBodyInner)"
                                            />

                                            <rect
                                                x="2"
                                                y="48"
                                                width="2"
                                                height="104"
                                                rx="1"
                                                fill="rgba(255,255,255,0.85)"
                                            />

                                            <rect
                                                x="46"
                                                y="48"
                                                width="1.5"
                                                height="104"
                                                rx="1"
                                                fill="rgba(0,0,0,0.05)"
                                            />

                                            <text
                                                x="25"
                                                y="95"
                                                textAnchor="middle"
                                                transform="rotate(-90 25 95)"
                                                fontWeight="900"
                                            >
                                                <tspan
                                                    x="25"
                                                    dy="0"
                                                    fill="#ef4444"
                                                    fontSize="14"
                                                    style={{ letterSpacing: 2 }}
                                                >
                                                    ODAK
                                                </tspan>
                                                <tspan
                                                    x="25"
                                                    dy="14"
                                                    fill="#111111"
                                                    fontSize="10"
                                                    style={{ letterSpacing: 1.3 }}
                                                >
                                                    LOJİSTİK
                                                </tspan>
                                            </text>

                                            <rect
                                                x="2"
                                                y="0"
                                                width="46"
                                                height="45"
                                                rx="8"
                                                fill="url(#truckCabin)"
                                            />

                                            <path
                                                d="M5 10 Q25 4,45 10 L45 25 Q25 20,5 25 Z"
                                                fill="url(#glassGradient)"
                                            />

                                            <path
                                                d="M9 9 Q24 7,39 10"
                                                stroke="rgba(255,255,255,0.55)"
                                                strokeWidth="1.6"
                                                fill="none"
                                                strokeLinecap="round"
                                            />

                                            <rect
                                                x="15"
                                                y="30"
                                                width="20"
                                                height="9"
                                                rx="2"
                                                fill="rgba(0,0,0,0.22)"
                                            />

                                            <rect
                                                x="-4"
                                                y="15"
                                                width="6"
                                                height="12"
                                                rx="1"
                                                fill="#111827"
                                            />
                                            <rect
                                                x="48"
                                                y="15"
                                                width="6"
                                                height="12"
                                                rx="1"
                                                fill="#111827"
                                            />

                                            <rect
                                                x="4"
                                                y="41"
                                                width="42"
                                                height="2"
                                                rx="1"
                                                fill="rgba(255,255,255,0.16)"
                                            />

                                            <circle cx="11" cy="6" r="2.4" fill="#f8fafc" />
                                            <circle cx="39" cy="6" r="2.4" fill="#f8fafc" />

                                            <motion.circle
                                                cx="11"
                                                cy="6"
                                                r={girisBasarili ? 16 : 10}
                                                fill="url(#headLightGlow)"
                                                animate={
                                                    girisBasarili
                                                        ? { opacity: [0.8, 1, 0.75], scale: [1, 1.4, 1.2] }
                                                        : { opacity: [0.45, 0.9, 0.45] }
                                                }
                                                transition={{
                                                    duration: girisBasarili ? 0.4 : 1.8,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            />
                                            <motion.circle
                                                cx="39"
                                                cy="6"
                                                r={girisBasarili ? 16 : 10}
                                                fill="url(#headLightGlow)"
                                                animate={
                                                    girisBasarili
                                                        ? { opacity: [0.8, 1, 0.75], scale: [1, 1.4, 1.2] }
                                                        : { opacity: [0.45, 0.9, 0.45] }
                                                }
                                                transition={{
                                                    duration: girisBasarili ? 0.4 : 1.8,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                    delay: 0.08,
                                                }}
                                            />

                                            <motion.ellipse
                                                cx="25"
                                                cy="-18"
                                                rx={girisBasarili ? 38 : 22}
                                                ry={girisBasarili ? 58 : 34}
                                                fill="rgba(96,165,250,0.10)"
                                                animate={
                                                    girisBasarili
                                                        ? { opacity: [0.45, 0.8, 0.3] }
                                                        : { opacity: [0.25, 0.55, 0.25] }
                                                }
                                                transition={{
                                                    duration: girisBasarili ? 0.45 : 1.8,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                            />

                                            <rect
                                                x="4"
                                                y="154"
                                                width="5"
                                                height="3"
                                                rx="1"
                                                fill="#ef4444"
                                                opacity="0.9"
                                            />
                                            <rect
                                                x="41"
                                                y="154"
                                                width="5"
                                                height="3"
                                                rx="1"
                                                fill="#ef4444"
                                                opacity="0.9"
                                            />
                                        </motion.g>
                                    </g>
                                </svg>
                            </Box>
                        </Box>
                    )}

                    <Box sx={styles.formSide}>
                        <Box sx={styles.formInner}>
                            <Box sx={styles.formHeader}>
                                <Typography variant="h4" sx={styles.formTitle}>
                                    Giriş Yap
                                </Typography>

                                <Typography sx={styles.formSubTitle}>
                                    BAPSİS lojistik ağına bağlanın.
                                </Typography>
                            </Box>

                            <form onSubmit={handleSubmit}>
                                <TextField
                                    fullWidth
                                    name="mail"
                                    value={formData.mail}
                                    onChange={handleChange}
                                    placeholder="Kullanıcı"
                                    sx={styles.input}
                                    disabled={girisBasarili}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <MailOutlineRounded sx={{ color: "#3b82f6" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {(isMobile || mailUyari) && (
                                    <Typography
                                        sx={{
                                            ...styles.mobileDomainText,
                                            color: mailUyari
                                                ? "#facc15"
                                                : "rgba(96,165,250,0.88)",
                                        }}
                                    >
                                        {mailUyari || `${DOMAIN} otomatik eklenecektir`}
                                    </Typography>
                                )}

                                <TextField
                                    fullWidth
                                    name="sifre"
                                    type={sifreGoster ? "text" : "password"}
                                    value={formData.sifre}
                                    onChange={handleChange}
                                    placeholder="Şifre"
                                    sx={{ ...styles.input, mt: 2 }}
                                    disabled={girisBasarili}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockRounded sx={{ color: "#3b82f6" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setSifreGoster(!sifreGoster)}
                                                    sx={{ color: "rgba(255,255,255,0.35)" }}
                                                    disabled={girisBasarili}
                                                >
                                                    {sifreGoster ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Typography sx={styles.previewMail}>{fullEmailPreview}</Typography>

                                {hata && (
                                    <Alert severity="error" sx={styles.alert}>
                                        {hata}
                                    </Alert>
                                )}

                                <Button
                                    fullWidth
                                    type="submit"
                                    disabled={yukleniyor || girisBasarili}
                                    sx={styles.btn}
                                >
                                    {yukleniyor ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : girisBasarili ? (
                                        "Yönlendiriliyor..."
                                    ) : (
                                        <>
                                            Sisteme Gir
                                            <ArrowForwardRounded sx={{ ml: 1 }} />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Box>
                    </Box>
                </Paper>
            </motion.div>
        </Box>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "radial-gradient(circle at top left, rgba(37,99,235,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(59,130,246,0.10), transparent 24%), #020617",
        p: 2,
        position: "relative",
        overflow: "hidden",
    },

    bgGrid: {
        position: "absolute",
        inset: 0,
        opacity: 0.05,
        backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "radial-gradient(circle at center, black 24%, transparent 80%)",
    },

    bgGlowLeft: {
        position: "absolute",
        top: -160,
        left: -120,
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)",
        filter: "blur(24px)",
    },

    bgGlowRight: {
        position: "absolute",
        right: -120,
        bottom: -160,
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,233,0.14), transparent 70%)",
        filter: "blur(24px)",
    },

    mainContainer: {
        width: "100%",
        maxWidth: 1040,
        height: 650,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.22fr 1fr" },
        borderRadius: "34px",
        overflow: "hidden",
        background: "rgba(15,23,42,0.96)",
        boxShadow: "0 50px 100px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(14px)",
        position: "relative",
        zIndex: 2,
    },

    visualSide: {
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },

    visualGlowTop: {
        position: "absolute",
        top: -120,
        left: -80,
        width: 260,
        height: 260,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)",
        filter: "blur(18px)",
        zIndex: 0,
    },

    visualGlowBottom: {
        position: "absolute",
        right: -60,
        bottom: -80,
        width: 240,
        height: 240,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)",
        filter: "blur(18px)",
        zIndex: 0,
    },

    visualGlowCenter: {
        position: "absolute",
        left: "40%",
        top: "38%",
        transform: "translate(-50%, -50%)",
        width: 240,
        height: 240,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.10), transparent 70%)",
        filter: "blur(28px)",
        zIndex: 0,
    },

    headerArea: {
        position: "absolute",
        top: 40,
        left: 40,
        zIndex: 10,
    },

    brand: {
        fontWeight: 900,
        color: "#fff",
        letterSpacing: -2,
        lineHeight: 1,
        textShadow: "0 6px 20px rgba(0,0,0,0.35)",
    },

    subBrand: {
        color: "#60a5fa",
        fontWeight: 700,
        fontSize: "0.82rem",
        textTransform: "uppercase",
        letterSpacing: 2.2,
        mt: 1,
        mb: 3,
    },

    roadContainer: {
        flex: 1,
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
    },

    formSide: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, md: 6 },
        background:
            "linear-gradient(180deg, rgba(2,6,23,0.98) 0%, rgba(6,16,31,0.98) 100%)",
        borderLeft: { xs: "none", md: "1px solid rgba(255,255,255,0.05)" },
    },

    formInner: {
        width: "100%",
        maxWidth: 360,
        p: { xs: 0, md: 1 },
    },

    formHeader: {
        marginBottom: 24,
    },

    formTitle: {
        fontWeight: 900,
        color: "#fff",
        mb: 1,
        letterSpacing: -1,
    },

    formSubTitle: {
        color: "rgba(255,255,255,0.5)",
        mb: 0,
    },

    input: {
        "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: "18px",
            color: "#fff",
            minHeight: 60,
            transition: "all .22s ease",
            backdropFilter: "blur(10px)",
            "& fieldset": {
                borderColor: "rgba(255,255,255,0.10)",
            },
            "&:hover": {
                backgroundColor: "rgba(255,255,255,0.045)",
            },
            "&:hover fieldset": {
                borderColor: "#3b82f6",
            },
            "&.Mui-focused": {
                boxShadow: "0 0 0 4px rgba(59,130,246,0.12)",
                backgroundColor: "rgba(255,255,255,0.05)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
            },
        },
        "& input::placeholder": {
            color: "rgba(255,255,255,0.35)",
            opacity: 1,
        },
    },

    mobileDomainText: {
        mt: 1,
        fontSize: "0.78rem",
        pl: 0.5,
        fontWeight: 600,
    },

    previewMail: {
        color: "rgba(255,255,255,0.45)",
        fontSize: "0.78rem",
        mt: 1.2,
        ml: 0.5,
        wordBreak: "break-all",
    },

    alert: {
        mt: 2,
        borderRadius: "14px",
        background: "rgba(239,68,68,0.10)",
        color: "#fecaca",
        border: "1px solid rgba(239,68,68,0.20)",
        "& .MuiAlert-icon": {
            color: "#f87171",
        },
    },

    btn: {
        mt: 4,
        height: 58,
        borderRadius: "18px",
        background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
        color: "#fff",
        fontWeight: 800,
        textTransform: "none",
        fontSize: "1rem",
        letterSpacing: 0.2,
        boxShadow: "0 10px 30px rgba(37,99,235,0.28)",
        position: "relative",
        overflow: "hidden",
        "&:before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-120%",
            width: "60%",
            height: "100%",
            background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            transition: "left .6s ease",
        },
        "&:hover": {
            background: "linear-gradient(90deg, #3b82f6, #1d4ed8)",
            boxShadow: "0 0 20px rgba(37,99,235,0.4)",
        },
        "&:hover:before": {
            left: "140%",
        },
        "&.Mui-disabled": {
            color: "rgba(255,255,255,0.65)",
            background: "rgba(37,99,235,0.45)",
        },
    },
};