import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { seedData } from "./seed";
import { storeYukle, storeKaydet } from "./storage";

/**
 * @description AdminStoreContext - Flowline Yetkilendirme ve Yönetim Motoru
 */
const AdminStoreContext = createContext(null);

export function AdminStoreProvider({ children }) {
    // 🧠 State Initialization (Lazy Load)
    const [state, setState] = useState(() => {
        try {
            return storeYukle(seedData);
        } catch (error) {
            console.error("Store yüklenirken hata oluştu, seed dataya dönülüyor:", error);
            return seedData;
        }
    });

    // 💾 Auto-Persistence (Side Effect)
    useEffect(() => {
        storeKaydet(state);
    }, [state]);

    // 🛠️ Atomic State Updater (Yardımcı Fonksiyon)
    const updateState = useCallback((key, updater) => {
        setState((prev) => ({
            ...prev,
            [key]: updater(prev[key] || [])
        }));
    }, []);

    // 👤 Kullanıcı Operasyonları
    const kullaniciEkle = useCallback((payload) => {
        const newUser = {
            id: `u_${crypto.randomUUID()}`,
            aktif: true,
            createdAt: new Date().toISOString(),
            ...payload
        };
        updateState("kullanicilar", (list) => [newUser, ...list]);
    }, [updateState]);

    const kullaniciGuncelle = useCallback((id, patch) => {
        updateState("kullanicilar", (list) =>
            list.map((u) => (u.id === id ? { ...u, ...patch, updatedAt: new Date().toISOString() } : u))
        );
    }, [updateState]);

    // 🎭 Rol ve Yetki Operasyonları
    const rolEkle = useCallback((ad) => {
        const id = `rol_${crypto.randomUUID()}`;
        setState((p) => ({
            ...p,
            roller: [{ id, ad }, ...(p.roller || [])],
            ekranYetkileri: { ...p.ekranYetkileri, [id]: {} },
            butonYetkileri: { ...p.butonYetkileri, [id]: {} },
        }));
    }, []);

    const rolGuncelle = useCallback((id, patch) => {
        updateState("roller", (list) =>
            list.map((r) => (r.id === id ? { ...r, ...patch } : r))
        );
    }, [updateState]);

    // 🖥️ Ekran Yönetimi
    const ekranEkle = useCallback((ad) => {
        const id = `ek_${crypto.randomUUID()}`;
        updateState("ekranlar", (list) => [{ id, ad }, ...list]);
    }, [updateState]);

    const ekranGuncelle = useCallback((id, patch) => {
        updateState("ekranlar", (list) =>
            list.map((e) => (e.id === id ? { ...e, ...patch } : e))
        );
    }, [updateState]);

    // 🔐 Yetkilendirme Mantığı (Permission Engine)
    const ekranYetkisiAyarla = useCallback((rolId, ekranId, patch) => {
        setState((p) => ({
            ...p,
            ekranYetkileri: {
                ...p.ekranYetkileri,
                [rolId]: {
                    ...(p.ekranYetkileri?.[rolId] || {}),
                    [ekranId]: {
                        gorunur: false,
                        yazma: false,
                        ...(p.ekranYetkileri?.[rolId]?.[ekranId] || {}),
                        ...patch,
                    },
                },
            },
        }));
    }, []);

    const butonYetkisiAyarla = useCallback((rolId, butonId, deger) => {
        setState((p) => ({
            ...p,
            butonYetkileri: {
                ...p.butonYetkileri,
                [rolId]: {
                    ...(p.butonYetkileri?.[rolId] || {}),
                    [butonId]: !!deger,
                },
            },
        }));
    }, []);

    // 🧹 Sistemi Sıfırla
    const sifirla = useCallback(() => {
        if (window.confirm("Tüm veriler sıfırlanacak. Emin misiniz?")) {
            setState(seedData);
        }
    }, []);

    // 🚀 API Memoization (Performance Optimization)
    const api = useMemo(() => ({
        state,
        kullaniciEkle,
        kullaniciGuncelle,
        rolEkle,
        rolGuncelle,
        ekranEkle,
        ekranGuncelle,
        ekranYetkisiAyarla,
        butonYetkisiAyarla,
        sifirla,
    }), [
        state,
        kullaniciEkle,
        kullaniciGuncelle,
        rolEkle,
        rolGuncelle,
        ekranEkle,
        ekranGuncelle,
        ekranYetkisiAyarla,
        butonYetkisiAyarla,
        sifirla
    ]);

    return (
        <AdminStoreContext.Provider value={api}>
            {children}
        </AdminStoreContext.Provider>
    );
}

/**
 * @returns {Object} Admin API & State
 */
export function useAdminStore() {
    const ctx = useContext(AdminStoreContext);
    if (!ctx) {
        throw new Error("Critical: useAdminStore must be used within an AdminStoreProvider.");
    }
    return ctx;
}