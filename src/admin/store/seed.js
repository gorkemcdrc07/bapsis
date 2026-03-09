export const seedData = {
    roller: [
        { id: "rol_super", ad: "Süper Admin" },
        { id: "rol_ops", ad: "Operasyon" },
        { id: "rol_fin", ad: "Finans" },
    ],
    kullanicilar: [
        { id: "u1", ad: "Ahmet Yýlmaz", email: "ahmet@demo.com", rolId: "rol_super", aktif: true },
        { id: "u2", ad: "Elif Kaya", email: "elif@demo.com", rolId: "rol_ops", aktif: true },
    ],
    ekranlar: [
        { id: "ek_musteriler", ad: "Müþteri Paneli" },
        { id: "ek_finans", ad: "Finansal Raporlar" },
        { id: "ek_stok", ad: "Stok Düzenleme" },
    ],
    // Ekran içi buton/aksiyon tanýmlarý
    butonlar: [
        { id: "btn_musteri_ekle", ekranId: "ek_musteriler", ad: "Müþteri Ekle" },
        { id: "btn_musteri_duzenle", ekranId: "ek_musteriler", ad: "Müþteri Düzenle" },
        { id: "btn_rapor_indir", ekranId: "ek_finans", ad: "Rapor Ýndir" },
        { id: "btn_stok_guncelle", ekranId: "ek_stok", ad: "Stok Güncelle" },
    ],
    // Rol -> ekran izinleri (görünür/yazma)
    ekranYetkileri: {
        rol_super: {
            ek_musteriler: { gorunur: true, yazma: true },
            ek_finans: { gorunur: true, yazma: true },
            ek_stok: { gorunur: true, yazma: true },
        },
        rol_ops: {
            ek_musteriler: { gorunur: true, yazma: true },
            ek_finans: { gorunur: false, yazma: false },
            ek_stok: { gorunur: true, yazma: true },
        },
        rol_fin: {
            ek_musteriler: { gorunur: false, yazma: false },
            ek_finans: { gorunur: true, yazma: true },
            ek_stok: { gorunur: false, yazma: false },
        },
    },
    // Rol -> buton izinleri
    butonYetkileri: {
        rol_super: {
            btn_musteri_ekle: true,
            btn_musteri_duzenle: true,
            btn_rapor_indir: true,
            btn_stok_guncelle: true,
        },
        rol_ops: {
            btn_musteri_ekle: true,
            btn_musteri_duzenle: true,
            btn_rapor_indir: false,
            btn_stok_guncelle: true,
        },
        rol_fin: {
            btn_musteri_ekle: false,
            btn_musteri_duzenle: false,
            btn_rapor_indir: true,
            btn_stok_guncelle: false,
        },
    },
};