const KEY = "admin_store_tr_v1";

export function storeYukle(fallback) {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function storeKaydet(data) {
    try {
        localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
        // ignore
    }
}