// src/plakaAtama/navlunRules.js

// ✅ navlun sayıya çevir (TL, boşluk vs gelirse)
export const toNumber = (v) => {
  if (v == null) return null;
  const s = String(v).replace(",", ".").replace(/[^\d.]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// ✅ "Dilovası-1" -> { base:"dilovası", no:1 } parse
export const parseVarisBaseNo = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(.*?)-\s*(\d+)$/);
  if (!m) return null;
  return { base: m[1].trim().toLowerCase(), no: Number(m[2]) };
};

// ✅ aynı base + farklı numara var mı? (Dilovası-1 & Dilovası-2 gibi)
export const hasSameBaseDifferentNo = (row) => {
  const items = [row?.varis1, row?.varis2, row?.varis3]
    .map(parseVarisBaseNo)
    .filter(Boolean);

  if (items.length < 2) return false;

  const map = new Map(); // base -> Set(no)
  for (const it of items) {
    if (!map.has(it.base)) map.set(it.base, new Set());
    map.get(it.base).add(it.no);
  }
  for (const set of map.values()) {
    if (set.size >= 2) return true;
  }
  return false;
};

// ✅ sadece dataloger indirimi hesapla (ugrama yok)
export const computeDatalogerDiscountedNavlun = (baseNavlun, datalogerno) => {
  const hasDataloger = String(datalogerno ?? "").trim() !== "";
  if (!hasDataloger) {
    return { navlun: baseNavlun, applied: false };
  }

  const n = toNumber(baseNavlun);
  if (n == null) {
    // sayısal değilse dokunma
    return { navlun: baseNavlun, applied: false };
  }

  // ✅ 500 altıysa yazarken bozmasın diye düşme uygulama
  if (n < 500) return { navlun: n, applied: false };

  return { navlun: Math.max(0, n - 500), applied: true };
};