// src/admin/AdminRoutes.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminAnaSayfa from "./AdminAnaSayfa";

import KullanicilarSayfasi from "./pages/KullanicilarSayfasi";
import RollerSayfasi from "./pages/RollerSayfasi";
import EkranYetkileriSayfasi from "./pages/EkranYetkileriSayfasi";
import ButonYetkileriSayfasi from "./pages/ButonYetkileriSayfasi";

export default function AdminRoutes() {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                {/* admin ana sayfa: /admin */}
                <Route index element={<AdminAnaSayfa />} />

                <Route path="kullanicilar" element={<KullanicilarSayfasi />} />
                <Route path="roller" element={<RollerSayfasi />} />
                <Route path="ekran-yetkileri" element={<EkranYetkileriSayfasi />} />
                <Route path="buton-yetkileri" element={<ButonYetkileriSayfasi />} />

                {/* fallback */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
        </Routes>
    );
}