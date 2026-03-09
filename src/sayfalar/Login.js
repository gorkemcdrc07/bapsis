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
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

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

        const mailKismi = (formData.mail || "").trim();
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
                    .select("id,mail,rol_id,rol,kullanici") // rol_id varsa da al
                    .eq("mail", tamMail)
                    .eq("sifre", formData.sifre)
                    .maybeSingle();

                if (error || !data) throw new Error("Giriş bilgileri hatalı.");

                // ✅ EN KRİTİK DÜZELTME: localStorage'a yaz
                localStorage.setItem(LS_KEY, JSON.stringify(data));

                // İstersen burada yönlendirme/state yönetimi
                onGirisBasarili?.(data);
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

    // (Opsiyonel) logout helper - başka yerde de kullanabilirsin
    // const logout = () => localStorage.removeItem(LS_KEY);

    return (
        <Box sx={stil.sayfaKonterner}>
            {/* BAŞARI MODALI */}
            <AnimatePresence>
                {kayitBasarili && (
                    <Backdrop
                        open={true}
                        sx={{
                            zIndex: 999,
                            backdropFilter: "blur(12px)",
                            bgcolor: "rgba(0,0,0,0.8)",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <Paper sx={stil.basariKart}>
                                <CheckCircleOutline sx={{ fontSize: 80, color: "#10b981", mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff" }}>
                                    İŞLEM TAMAM
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}>
                                    Kayıt başarılı, giriş ekranına gidiyorsunuz...
                                </Typography>
                            </Paper>
                        </motion.div>
                    </Backdrop>
                )}
            </AnimatePresence>

            <Paper elevation={0} sx={stil.anaKart}>
                {/* SOL PANEL */}
                {!isMobile && (
                    <Box sx={stil.solPanel}>
                        <Box sx={stil.degradeDaire} />
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <LocalShipping sx={{ fontSize: 100, color: "#3b82f6", mb: 2 }} />
                            <Typography variant="h3" sx={{ fontWeight: 900, color: "white", letterSpacing: -2 }}>
                                BAPSİS
                            </Typography>
                            <Typography
                                variant="subtitle1"
                                sx={{ color: "rgba(255,255,255,0.5)", mb: 4, fontWeight: 300 }}
                            >
                                Odak Lojistik Yönetim Ağı
                            </Typography>
                            <Button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setHata("");
                                }}
                                sx={stil.gecisButon}
                            >
                                {isLogin ? "HESAP OLUŞTUR" : "GİRİŞ YAP"}
                            </Button>
                        </motion.div>
                    </Box>
                )}

                {/* SAĞ PANEL */}
                <Box sx={stil.sagPanel}>
                    <Box sx={{ width: "100%", maxWidth: 380 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: "white" }}>
                            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 4, color: "rgba(255,255,255,0.5)" }}>
                            {isLogin
                                ? "Sisteme erişmek için kimlik bilgilerinizi girin."
                                : "Yeni personel kaydı oluşturun."}
                        </Typography>

                        <form onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isLogin ? "l" : "r"}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {!isLogin && (
                                        <TextField
                                            fullWidth
                                            name="adSoyad"
                                            placeholder="AD SOYAD"
                                            onChange={handleChange}
                                            sx={stil.input}
                                            inputProps={{ style: { textTransform: "uppercase", color: "white" } }}
                                            InputProps={{ startAdornment: <Person sx={stil.icon} /> }}
                                        />
                                    )}

                                    <TextField
                                        fullWidth
                                        name="mail"
                                        placeholder="Kullanıcı Adı"
                                        onChange={handleChange}
                                        sx={{ ...stil.input, mt: 2 }}
                                        InputProps={{
                                            startAdornment: <Email sx={stil.icon} />,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Typography sx={stil.domainText}>{DOMAIN}</Typography>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        fullWidth
                                        name="sifre"
                                        type={sifreGoster ? "text" : "password"}
                                        placeholder="Şifre"
                                        onChange={handleChange}
                                        sx={{ ...stil.input, mt: 2 }}
                                        InputProps={{
                                            startAdornment: <Lock sx={stil.icon} />,
                                            endAdornment: (
                                                <IconButton
                                                    onClick={() => setSifreGoster(!sifreGoster)}
                                                    size="small"
                                                    sx={{ color: "rgba(255,255,255,0.3)" }}
                                                >
                                                    {sifreGoster ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
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
                                            sx={{ ...stil.input, mt: 2 }}
                                            InputProps={{ startAdornment: <VerifiedUser sx={stil.icon} /> }}
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
                                <Button
                                    fullWidth
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setHata("");
                                    }}
                                    sx={{ mt: 2, color: "#3b82f6", fontWeight: 700 }}
                                >
                                    {isLogin ? "HESAP OLUŞTUR" : "GİRİŞ YAP"}
                                </Button>
                            )}
                        </form>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

const stil = {
    sayfaKonterner: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        p: 2,
    },
    anaKart: {
        display: "flex",
        width: "100%",
        maxWidth: "1050px",
        minHeight: "650px",
        borderRadius: "32px",
        overflow: "hidden",
        bgcolor: "#0f172a",
        boxShadow: "0 0 50px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.05)",
    },
    solPanel: {
        flex: 1,
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
    },
    degradeDaire: {
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
        top: "10%",
        left: "-10%",
        zIndex: 0,
    },
    sagPanel: {
        flex: 1.2,
        bgcolor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        borderLeft: "1px solid rgba(255,255,255,0.05)",
    },
    basariKart: {
        p: 5,
        textAlign: "center",
        borderRadius: "32px",
        maxWidth: "320px",
        bgcolor: "#1e293b",
        border: "1px solid rgba(16, 185, 129, 0.3)",
    },
    input: {
        "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            bgcolor: "rgba(2, 6, 23, 0.5)",
            color: "white",
            "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
            "&:hover fieldset": { borderColor: "rgba(59, 130, 246, 0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
        },
        "& input::placeholder": { color: "rgba(255,255,255,0.3)", opacity: 1 },
    },
    icon: { color: "#3b82f6", mr: 1, fontSize: 20 },
    domainText: {
        color: "#3b82f6",
        fontWeight: 700,
        fontSize: "0.85rem",
        opacity: 0.8,
    },
    anaButon: {
        mt: 4,
        py: 2,
        borderRadius: "14px",
        bgcolor: "#3b82f6",
        color: "white",
        fontWeight: 800,
        "&:hover": { bgcolor: "#2563eb" },
        boxShadow: "0 10px 20px rgba(59, 130, 246, 0.2)",
    },
    gecisButon: {
        mt: 2,
        color: "white",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        px: 4,
        py: 1.2,
        fontSize: "0.7rem",
        letterSpacing: 1,
    },
    hataAlert: {
        mt: 2,
        borderRadius: "12px",
        bgcolor: "rgba(239, 68, 68, 0.1)",
        color: "#f87171",
        border: "1px solid rgba(239, 68, 68, 0.2)",
    },
};