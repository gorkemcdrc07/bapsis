import React, { useState } from "react";
import { supabase } from "../supabase";
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    useMediaQuery,
    Backdrop,
    Chip,
    Divider,
} from "@mui/material";
import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    LocalShipping,
    Person,
    VerifiedUser,
    CheckCircleOutline,
    ArrowForwardRounded,
    ShieldRounded,
    AutoAwesomeRounded,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

export default function Auth({ onGirisBasarili }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        mail: "",
        sifre: "",
        sifreOnay: "",
        adSoyad: "",
    });

    const [yukleniyor, setYukleniyor] = useState(false);
    const [hata, setHata] = useState("");
    const [kayitBasarili, setKayitBasarili] = useState(false);
    const [sifreGoster, setSifreGoster] = useState(false);

    const isMobile = useMediaQuery("(max-width:900px)");
    const isTablet = useMediaQuery("(max-width:1200px)");

    const DOMAIN = "@odaklojistik.com.tr";
    const LS_KEY = "bapsis_user";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({
            ...p,
            [name]: name === "adSoyad" ? value.toUpperCase() : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setHata("");

        const mailKismi = (formData.mail || "").trim().toLowerCase();
        if (!mailKismi) return setHata("Kullanıcı adı boş olamaz.");

        const tamMail = mailKismi + DOMAIN;

        if (!isLogin) {
            if (formData.sifre !== formData.sifreOnay) return setHata("Şifreler eşleşmiyor!");
            if ((formData.sifre || "").length < 6) return setHata("Şifre en az 6 karakter olmalı.");
            if (!formData.adSoyad?.trim()) return setHata("Ad Soyad boş olamaz.");
        }

        setYukleniyor(true);

        try {
            if (isLogin) {
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
                onGirisBasarili?.(sessionUser);
            } else {
                const { error } = await supabase.from("kullanicilar").insert([
                    {
                        mail: tamMail,
                        sifre: formData.sifre,
                        kullanici: formData.adSoyad,
                        rol: "USER",
                    },
                ]);

                if (error) throw error;

                setKayitBasarili(true);
                setTimeout(() => {
                    setKayitBasarili(false);
                    setIsLogin(true);
                }, 2500);
            }
        } catch (err) {
            setHata(err?.message || "Bir hata oluştu.");
        } finally {
            setYukleniyor(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setHata("");
    };

    return (
        <Box sx={stil.sayfaKonterner}>
            <Box sx={stil.arkaGlow1} />
            <Box sx={stil.arkaGlow2} />
            <Box sx={stil.gridPattern} />

            <AnimatePresence>
                {kayitBasarili && (
                    <Backdrop
                        open
                        sx={{
                            zIndex: 999,
                            backdropFilter: "blur(14px)",
                            bgcolor: "rgba(2,6,23,0.72)",
                        }}
                    >
                        <MotionPaper
                            initial={{ scale: 0.88, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 8 }}
                            transition={{ duration: 0.28 }}
                            sx={stil.basariKart}
                        >
                            <Box sx={stil.basariIkonWrap}>
                                <CheckCircleOutline sx={{ fontSize: 72, color: "#34d399" }} />
                            </Box>

                            <Typography variant="h5" sx={{ fontWeight: 900, color: "#fff", mt: 2 }}>
                                İŞLEM TAMAM
                            </Typography>

                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.62)", mt: 1.2 }}>
                                Kayıt başarılı, giriş ekranına gidiyorsunuz...
                            </Typography>
                        </MotionPaper>
                    </Backdrop>
                )}
            </AnimatePresence>

            <MotionPaper
                elevation={0}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                sx={stil.anaKart}
            >
                {!isMobile && (
                    <Box sx={stil.solPanel}>
                        <Box sx={stil.solPanelParlama} />

                        <MotionBox
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            sx={{
                                position: "relative",
                                zIndex: 2,
                                maxWidth: isTablet ? 340 : 430,
                            }}
                        >
                            <Chip
                                icon={<AutoAwesomeRounded sx={{ color: "#93c5fd !important" }} />}
                                label="Odak Lojistik Dijital Erişim"
                                sx={stil.badge}
                            />

                            <Box sx={stil.logoKutusu}>
                                <LocalShipping sx={{ fontSize: 56, color: "#60a5fa" }} />
                            </Box>

                            <Typography variant="h2" sx={stil.baslikBuyuk}>
                                BAPSİS
                            </Typography>

                            <Typography variant="h6" sx={stil.altBaslik}>
                                Odak Lojistik Yönetim Ağı
                            </Typography>

                            <Typography variant="body1" sx={stil.aciklamaMetni}>
                                Personel erişimini tek merkezden yönetin. Güçlü, sade ve kurumsal bir deneyim için tasarlandı.
                            </Typography>

                            <Box sx={stil.ozelliklerWrap}>
                                <Box sx={stil.ozellikKartMini}>
                                    <ShieldRounded sx={{ color: "#60a5fa", fontSize: 20 }} />
                                    <Typography sx={stil.ozellikText}>Güvenli oturum yönetimi</Typography>
                                </Box>

                                <Box sx={stil.ozellikKartMini}>
                                    <CheckCircleOutline sx={{ color: "#34d399", fontSize: 20 }} />
                                    <Typography sx={stil.ozellikText}>Hızlı personel kaydı</Typography>
                                </Box>
                            </Box>

                            <Button onClick={toggleMode} sx={stil.gecisButon} endIcon={<ArrowForwardRounded />}>
                                {isLogin ? "HESAP OLUŞTUR" : "GİRİŞ YAP"}
                            </Button>
                        </MotionBox>
                    </Box>
                )}

                <Box sx={stil.sagPanel}>
                    <MotionBox
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45 }}
                        sx={stil.formAlani}
                    >
                        {isMobile && (
                            <Box sx={{ mb: 3 }}>
                                <Box sx={stil.mobileLogoKutusu}>
                                    <LocalShipping sx={{ fontSize: 38, color: "#60a5fa" }} />
                                </Box>

                                <Typography sx={stil.mobileBaslik}>BAPSİS</Typography>
                                <Typography sx={stil.mobileAltBaslik}>
                                    Odak Lojistik Yönetim Ağı
                                </Typography>
                            </Box>
                        )}

                        <Box sx={stil.formUstAlan}>
                            <Chip
                                label={isLogin ? "Oturum Aç" : "Yeni Kayıt"}
                                size="small"
                                sx={stil.formChip}
                            />

                            <Typography variant="h4" sx={stil.formBaslik}>
                                {isLogin ? "Hoş geldiniz" : "Personel kaydı oluşturun"}
                            </Typography>

                            <Typography variant="body2" sx={stil.formAltYazi}>
                                {isLogin
                                    ? "Devam etmek için kullanıcı adı ve şifrenizi girin."
                                    : "Bilgileri doldurarak sisteme yeni kullanıcı ekleyin."}
                            </Typography>
                        </Box>

                        <Divider sx={stil.divider} />

                        <form onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isLogin ? "login" : "register"}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    {!isLogin && (
                                        <TextField
                                            fullWidth
                                            name="adSoyad"
                                            placeholder="AD SOYAD"
                                            onChange={handleChange}
                                            sx={stil.input}
                                            inputProps={{
                                                style: {
                                                    textTransform: "uppercase",
                                                    color: "white",
                                                },
                                            }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Person sx={stil.icon} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}

                                    <TextField
                                        fullWidth
                                        name="mail"
                                        placeholder="Kullanıcı Adı"
                                        onChange={handleChange}
                                        sx={{ ...stil.input, mt: 2.2 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={stil.icon} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: !isMobile ? (
                                                <InputAdornment position="end">
                                                    <Typography sx={stil.domainText}>{DOMAIN}</Typography>
                                                </InputAdornment>
                                            ) : null,
                                        }}
                                    />

                                    {isMobile && (
                                        <Typography sx={stil.mobileDomainText}>
                                            Kullanıcı adı sonuna otomatik olarak {DOMAIN} eklenecek
                                        </Typography>
                                    )}

                                    <TextField
                                        fullWidth
                                        name="sifre"
                                        type={sifreGoster ? "text" : "password"}
                                        placeholder="Şifre"
                                        onChange={handleChange}
                                        sx={{ ...stil.input, mt: 2.2 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock sx={stil.icon} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setSifreGoster(!sifreGoster)}
                                                        size="small"
                                                        sx={{ color: "rgba(255,255,255,0.42)" }}
                                                    >
                                                        {sifreGoster ? (
                                                            <VisibilityOff fontSize="small" />
                                                        ) : (
                                                            <Visibility fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {!isLogin && (
                                        <TextField
                                            fullWidth
                                            name="sifreOnay"
                                            type="password"
                                            placeholder="Şifre Onay"
                                            onChange={handleChange}
                                            sx={{ ...stil.input, mt: 2.2 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <VerifiedUser sx={stil.icon} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {hata && (
                                <Alert severity="error" sx={stil.hataAlert}>
                                    {hata}
                                </Alert>
                            )}

                            <Button type="submit" fullWidth disabled={yukleniyor} sx={stil.anaButon}>
                                {yukleniyor ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : isLogin ? (
                                    "OTURUM AÇ"
                                ) : (
                                    "KAYDI TAMAMLA"
                                )}
                            </Button>

                            {isMobile && (
                                <Button fullWidth onClick={toggleMode} sx={stil.mobileGecisButon}>
                                    {isLogin ? "HESAP OLUŞTUR" : "GİRİŞ YAP"}
                                </Button>
                            )}
                        </form>
                    </MotionBox>
                </Box>
            </MotionPaper>
        </Box>
    );
}

const stil = {
    sayfaKonterner: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.14) 0%, transparent 24%), radial-gradient(circle at bottom right, rgba(16,185,129,0.10) 0%, transparent 22%), linear-gradient(135deg, #020617 0%, #081120 45%, #020617 100%)",
        p: { xs: 1.5, sm: 2, md: 3 },
        position: "relative",
        overflow: "hidden",
    },

    arkaGlow1: {
        position: "absolute",
        width: 420,
        height: 420,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
        top: -120,
        left: -120,
        filter: "blur(12px)",
    },

    arkaGlow2: {
        position: "absolute",
        width: 380,
        height: 380,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 72%)",
        bottom: -120,
        right: -90,
        filter: "blur(16px)",
    },

    gridPattern: {
        position: "absolute",
        inset: 0,
        opacity: 0.08,
        backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "34px 34px",
        maskImage: "radial-gradient(circle at center, black 30%, transparent 82%)",
    },

    anaKart: {
        position: "relative",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        maxWidth: "1120px",
        minHeight: { xs: "auto", md: "680px", lg: "720px" },
        borderRadius: { xs: "24px", md: "32px", lg: "36px" },
        overflow: "hidden",
        bgcolor: "rgba(15,23,42,0.78)",
        backdropFilter: "blur(22px)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.50)",
        border: "1px solid rgba(255,255,255,0.08)",
        zIndex: 2,
    },

    solPanel: {
        width: { md: "40%", lg: "44%" },
        minHeight: { md: 560, lg: 720 },
        background: "linear-gradient(180deg, rgba(2,6,23,0.98) 0%, rgba(9,16,32,0.96) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        px: { md: 3.5, lg: 6 },
        py: { md: 4, lg: 6 },
    },

    solPanelParlama: {
        position: "absolute",
        inset: 0,
        background:
            "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18) 0%, transparent 34%), radial-gradient(circle at 70% 70%, rgba(16,185,129,0.08) 0%, transparent 28%)",
    },

    badge: {
        mb: 3,
        color: "#dbeafe",
        bgcolor: "rgba(59,130,246,0.10)",
        border: "1px solid rgba(96,165,250,0.22)",
        fontWeight: 700,
        height: 34,
        backdropFilter: "blur(8px)",
        "& .MuiChip-label": { px: 1.2 },
    },

    logoKutusu: {
        width: 92,
        height: 92,
        borderRadius: "26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.88))",
        border: "1px solid rgba(96,165,250,0.18)",
        boxShadow: "0 14px 36px rgba(2,6,23,0.4)",
        mb: 3,
    },

    mobileLogoKutusu: {
        width: 70,
        height: 70,
        borderRadius: "22px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.88))",
        border: "1px solid rgba(96,165,250,0.18)",
        boxShadow: "0 14px 36px rgba(2,6,23,0.4)",
        mb: 2,
    },

    baslikBuyuk: {
        fontSize: "clamp(2.4rem, 4vw, 4rem)",
        fontWeight: 950,
        color: "white",
        letterSpacing: -2.5,
        lineHeight: 1,
    },

    altBaslik: {
        color: "rgba(255,255,255,0.66)",
        mt: 1.5,
        fontWeight: 500,
        fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
    },

    mobileBaslik: {
        fontSize: "1.9rem",
        fontWeight: 900,
        letterSpacing: -1.2,
        color: "#fff",
        lineHeight: 1,
    },

    mobileAltBaslik: {
        color: "rgba(255,255,255,0.6)",
        mt: 0.8,
        fontSize: "0.95rem",
    },

    aciklamaMetni: {
        color: "rgba(255,255,255,0.50)",
        mt: 3,
        mb: 4,
        lineHeight: 1.8,
        maxWidth: 380,
        fontSize: { md: "0.95rem", lg: "1rem" },
    },

    ozelliklerWrap: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 1.4,
        mb: 4,
    },

    ozellikKartMini: {
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        px: 1.6,
        py: 1.25,
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
    },

    ozellikText: {
        color: "rgba(255,255,255,0.78)",
        fontWeight: 600,
        fontSize: "0.92rem",
    },

    sagPanel: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3, md: 3, lg: 4 },
        position: "relative",
        background: "linear-gradient(180deg, rgba(15,23,42,0.88) 0%, rgba(10,16,30,0.82) 100%)",
        borderLeft: { xs: "none", md: "1px solid rgba(255,255,255,0.06)" },
        borderTop: { xs: "1px solid rgba(255,255,255,0.06)", md: "none" },
    },

    formAlani: {
        width: "100%",
        maxWidth: { xs: "100%", sm: 480, md: 430, lg: 440 },
        p: { xs: 2.2, sm: 3, md: 3.2, lg: 3.5 },
        borderRadius: { xs: "22px", md: "26px", lg: "28px" },
        bgcolor: "rgba(2,6,23,0.34)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    },

    formUstAlan: {
        mb: 1.2,
    },

    formChip: {
        bgcolor: "rgba(59,130,246,0.12)",
        color: "#93c5fd",
        fontWeight: 800,
        mb: 1.8,
        border: "1px solid rgba(59,130,246,0.18)",
    },

    formBaslik: {
        fontSize: "clamp(1.7rem, 2.4vw, 2.2rem)",
        fontWeight: 900,
        color: "white",
        letterSpacing: -1,
        mb: 1,
    },

    formAltYazi: {
        color: "rgba(255,255,255,0.54)",
        lineHeight: 1.7,
    },

    divider: {
        my: 2.8,
        borderColor: "rgba(255,255,255,0.06)",
    },

    basariKart: {
        p: 5,
        textAlign: "center",
        borderRadius: "30px",
        maxWidth: "340px",
        bgcolor: "rgba(15,23,42,0.94)",
        border: "1px solid rgba(52,211,153,0.22)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
    },

    basariIkonWrap: {
        width: 96,
        height: 96,
        borderRadius: "50%",
        mx: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle, rgba(52,211,153,0.16) 0%, transparent 72%)",
    },

    input: {
        "& .MuiOutlinedInput-root": {
            minHeight: 58,
            borderRadius: "18px",
            bgcolor: "rgba(255,255,255,0.03)",
            color: "white",
            transition: "all .22s ease",
            "& fieldset": {
                borderColor: "rgba(255,255,255,0.10)",
            },
            "&:hover": {
                bgcolor: "rgba(255,255,255,0.045)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(96,165,250,0.38)",
            },
            "&.Mui-focused": {
                boxShadow: "0 0 0 4px rgba(59,130,246,0.10)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#3b82f6",
            },
        },
        "& input::placeholder": {
            color: "rgba(255,255,255,0.28)",
            opacity: 1,
        },
    },

    icon: {
        color: "#60a5fa",
        fontSize: 20,
    },

    domainText: {
        color: "#60a5fa",
        fontWeight: 800,
        fontSize: "0.82rem",
        opacity: 0.9,
        whiteSpace: "nowrap",
    },

    mobileDomainText: {
        mt: 1,
        color: "rgba(96,165,250,0.88)",
        fontSize: "0.78rem",
        pl: 0.5,
    },

    anaButon: {
        mt: 3,
        py: 1.9,
        borderRadius: "18px",
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        color: "white",
        fontWeight: 900,
        fontSize: "0.95rem",
        letterSpacing: 0.5,
        textTransform: "none",
        boxShadow: "0 16px 30px rgba(37,99,235,0.28)",
        "&:hover": {
            background: "linear-gradient(135deg, #4f8ff7 0%, #2563eb 100%)",
            boxShadow: "0 20px 34px rgba(37,99,235,0.34)",
        },
        "&.Mui-disabled": {
            color: "rgba(255,255,255,0.6)",
            bgcolor: "rgba(59,130,246,0.35)",
        },
    },

    gecisButon: {
        mt: 1,
        color: "white",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "16px",
        px: 3,
        py: 1.35,
        fontSize: "0.82rem",
        fontWeight: 800,
        letterSpacing: 0.6,
        bgcolor: "rgba(255,255,255,0.03)",
        textTransform: "none",
        "&:hover": {
            bgcolor: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.18)",
        },
    },

    mobileGecisButon: {
        mt: 2,
        color: "#60a5fa",
        fontWeight: 800,
        borderRadius: "14px",
        textTransform: "none",
        border: "1px solid rgba(96,165,250,0.14)",
        bgcolor: "rgba(59,130,246,0.05)",
        py: 1.4,
    },

    hataAlert: {
        mt: 2.2,
        borderRadius: "16px",
        bgcolor: "rgba(239,68,68,0.10)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.22)",
        alignItems: "center",
        "& .MuiAlert-icon": {
            color: "#f87171",
        },
    },
};