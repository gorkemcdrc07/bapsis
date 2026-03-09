import React, { useState, useCallback, useMemo } from "react";
import { Box, CssBaseline, Paper, Typography, Button } from "@mui/material";
import { supabase } from "./supabase";

// Sayfalar
import Login from "./sayfalar/Login";
import Sidebar from "./araclar/sidebar";
import Navbar from "./araclar/navbar";

import Anasayfa from "./sayfalar/anasayfa";
import SiparisAcilis from "./sayfalar/siparisacilis";
import PlakaAtama from "./sayfalar/plakaatama";

import TamamlananSeferler from "./sayfalar/tamamlananSeferler";
import AracBilgileri from "./aracYonetimi/aracBilgileri";

import VknEkle from "./yeniKayitlar/vknEkle";
import UgramaSartiEkle from "./yeniKayitlar/UgramaSartiEkle";
import NavlunSartiEkle from "./yeniKayitlar/navlunSartiEkle";

// Admin
import AdminRoutes from "./admin/AdminRoutes";
import { MemoryRouter } from "react-router-dom";

function Yetkisiz({ onGoHome }) {
    return (
        <Box sx={{ p: 3 }}>
            <Paper
                sx={{
                    p: 3,
                    bgcolor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    color: "white",
                    maxWidth: 520,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Yetkiniz yok
                </Typography>
                <Typography sx={{ opacity: 0.75, mb: 2 }}>
                    Bu ekranı görüntülemek için yetkiniz bulunmuyor.
                </Typography>
                <Button variant="contained" onClick={onGoHome}>
                    Ana Sayfa
                </Button>
            </Paper>
        </Box>
    );
}

export default function App() {
    // ✅ session yok: runtime state
    const [oturum, setOturum] = useState(null);

    // ✅ izinler
    const [allowedScreens, setAllowedScreens] = useState(new Set());
    const [allowedButtons, setAllowedButtons] = useState(new Set());

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sayfa, setSayfa] = useState("anasayfa");
    const [aktifBatchId, setAktifBatchId] = useState(null);

    const components = useMemo(
        () => ({
            Login,
            Sidebar,
            Navbar,
            Anasayfa,
            SiparisAcilis,
            PlakaAtama,
            TamamlananSeferler,
            AracBilgileri,
            VknEkle,
            UgramaSartiEkle,
            NavlunSartiEkle,
            AdminRoutes,
            MemoryRouter,
        }),
        []
    );

    const undefinedOnes = Object.entries(components)
        .filter(([, v]) => v === undefined || v === null)
        .map(([k]) => k);

    if (undefinedOnes.length > 0) {
        throw new Error(
            `App render edemiyor: undefined component(ler) -> ${undefinedOnes.join(
                ", "
            )}. Import/export (default vs named) veya dosya yolu/case kontrol et.`
        );
    }

    const fetchPermissions = useCallback(async (userId) => {
        // ekran izinleri
        const { data: ekranRows, error: e1 } = await supabase
            .from("v_kullanici_ekran_izinleri")
            .select("ekran_kod, izin")
            .eq("kullanici_id", userId)
            .eq("izin", true);

        if (e1) throw e1;

        const screens = new Set((ekranRows || []).map((r) => r.ekran_kod));

        // buton izinleri (buton seed yoksa boş dönebilir; sorun değil)
        const { data: butonRows, error: e2 } = await supabase
            .from("v_kullanici_buton_izinleri")
            .select("ekran_kod, buton_kod, izin")
            .eq("kullanici_id", userId)
            .eq("izin", true);

        // view yoksa veya tablo boşsa app patlamasın:
        if (e2) {
            // İstersen burada console.warn bırak
            return { screens, buttons: new Set() };
        }

        const buttons = new Set(
            (butonRows || []).map((r) => `${r.ekran_kod}:${r.buton_kod}`)
        );

        return { screens, buttons };
    }, []);

    const onLoginSuccess = useCallback(
        async (user) => {
            setOturum(user);

            try {
                const perms = await fetchPermissions(user.id);
                setAllowedScreens(perms.screens);
                setAllowedButtons(perms.buttons);

                // Kullanıcının ilk açabileceği sayfaya düşür
                if (!perms.screens.has("anasayfa")) {
                    // anasayfa yoksa izinli ilk ekranı bul
                    const first = Array.from(perms.screens.values())[0];
                    setSayfa(first || "anasayfa");
                } else {
                    setSayfa("anasayfa");
                }
            } catch (err) {
                console.error("Yetki çekme hatası:", err);
                // Yetki çekilemezse güvenli davran: her şeyi kapat
                setAllowedScreens(new Set());
                setAllowedButtons(new Set());
                setSayfa("anasayfa");
            }
        },
        [fetchPermissions]
    );

    const cikisYap = useCallback(() => {
        setOturum(null);
        setAllowedScreens(new Set());
        setAllowedButtons(new Set());
        setAktifBatchId(null);
        setSayfa("anasayfa");
    }, []);

    const handleSelectPage = useCallback((p) => {
        setSayfa(p);
    }, []);

    // ✅ Oturum yoksa login
    if (!oturum) return <Login onGirisBasarili={onLoginSuccess} />;

    // Sayfa bileşenleri
    const pageMap = {
        anasayfa: <Anasayfa kullanici={oturum} />,

        siparisacilis: (
            <SiparisAcilis
                kullanici={oturum}
                onOnayla={({ batchId }) => {
                    setAktifBatchId(batchId || null);
                    setSayfa("plakaatama");
                }}
            />
        ),

        plakaatama: <PlakaAtama kullanici={oturum} batchId={aktifBatchId} />,

        tamamlanan_seferler: <TamamlananSeferler batchId={aktifBatchId} />,

        aracbilgileri: <AracBilgileri />,

        vkn_ekle: <VknEkle kullanici={oturum} />,

        ugrama_sarti_ekle: <UgramaSartiEkle kullanici={oturum} />,

        navlun_sarti_ekle: <NavlunSartiEkle kullanici={oturum} />,

        admin: (
            <MemoryRouter initialEntries={["/admin"]}>
                <AdminRoutes />
            </MemoryRouter>
        ),
    };

    // ✅ Ekran yetkisi kontrolü
    const isAllowed = (screenKod) => {
        // izin set’i boşsa (henüz çekilemediyse) güvenli davran: kapat
        if (!allowedScreens || allowedScreens.size === 0) return false;
        return allowedScreens.has(screenKod);
    };

    const aktifSayfa = pageMap[sayfa] ? sayfa : "anasayfa";

    // Eğer seçilen sayfaya yetkisi yoksa yetkisiz ekranı göster
    // (İstersen otomatik anasayfaya da atabiliriz)
    const renderPage = () => {
        if (!isAllowed(aktifSayfa)) {
            return <Yetkisiz onGoHome={() => setSayfa("anasayfa")} />;
        }

        // Admin açılacaksa ayrıca 'admin' ekran izni de gerekir
        if (aktifSayfa === "admin" && !isAllowed("admin")) {
            return <Yetkisiz onGoHome={() => setSayfa("anasayfa")} />;
        }

        // Buton izinlerini sayfalara prop geçmek istersen:
        // örn: <Anasayfa ... allowedButtons={allowedButtons} />
        return pageMap[aktifSayfa];
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#080b14" }}>
            <CssBaseline />

            <Sidebar
                open={sidebarOpen}
                setOpen={setSidebarOpen}
                selected={sayfa}
                onSelect={handleSelectPage}
                allowedScreens={allowedScreens} // ✅ Sidebar filtrelemesi için
            />

            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                <Navbar
                    kullanici={oturum}
                    onCikis={cikisYap}
                    onSelect={handleSelectPage}
                    allowedScreens={allowedScreens} // istersen navbar’da da kullanırsın
                />

                <Box component="main" sx={{ flexGrow: 1, overflow: "auto" }}>
                    {renderPage()}
                </Box>
            </Box>
        </Box>
    );
}