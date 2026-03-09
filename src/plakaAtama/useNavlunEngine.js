// src/plakaAtama/useNavlunEngine.js
import { useCallback, useEffect, useRef } from "react";
import { computeDatalogerDiscountedNavlun } from "./navlunRules";

// Navlun yazarken debounce ile -500 uygula (sadece dataloger indirimi)
export function useNavlunTypingDiscount({ rowsRef, setRows }) {
    const timersRef = useRef(new Map()); // rowId -> timeout
    const tokensRef = useRef(new Map()); // rowId -> token (race guard)

    useEffect(() => {
        return () => {
            for (const t of timersRef.current.values()) clearTimeout(t);
            timersRef.current.clear();
            tokensRef.current.clear();
        };
    }, []);

    const schedule = useCallback(
        (rowId, delayMs = 450) => {
            // eski timer
            const prevT = timersRef.current.get(rowId);
            if (prevT) clearTimeout(prevT);

            // token üret (eski debounce'ları iptal etmek için)
            const token = (tokensRef.current.get(rowId) ?? 0) + 1;
            tokensRef.current.set(rowId, token);

            const t = setTimeout(() => {
                // hala en güncel token mı?
                const latest = tokensRef.current.get(rowId);
                if (latest !== token) return;

                const row = rowsRef.current.find((r) => r.id === rowId);
                if (!row) return;

                const baseNavlun = row.__navlunBase ?? row.navlun ?? "";
                const { navlun, applied } = computeDatalogerDiscountedNavlun(
                    baseNavlun,
                    row.datalogerno
                );

                setRows((prev) =>
                    prev.map((r) =>
                        r.id === rowId
                            ? {
                                ...r,
                                // ✅ base aynı kalsın, ekranda discounted göster
                                navlun,
                                __datalogerDiscountApplied: applied,
                            }
                            : r
                    )
                );
            }, delayMs);

            timersRef.current.set(rowId, t);
        },
        [rowsRef, setRows]
    );

    return { scheduleNavlunDiscount: schedule };
}