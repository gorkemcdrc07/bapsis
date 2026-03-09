// SiparisFlowPage.jsx  ✅ (AKIŞI YÖNETEN PARENT EKRAN - EN KRİTİK DÜZELTME)
import React, { useState } from "react";
import SiparisAcilis from "./SiparisAcilis";
import PlakaAtamaModern from "./PlakaAtamaModern";

export default function SiparisFlowPage() {
    const [screen, setScreen] = useState("acilis"); // acilis | plaka
    const [batchId, setBatchId] = useState(null);

    return (
        <>
            {screen === "acilis" && (
                <SiparisAcilis
                    onOnayla={({ batchId }) => {
                        setBatchId(batchId);
                        setScreen("plaka");
                    }}
                />
            )}

            {screen === "plaka" && (
                <PlakaAtamaModern
                    batchId={batchId}
                // geri dönmek istersen:
                // onBack={() => { setBatchId(null); setScreen("acilis"); }}
                />
            )}
        </>
    );
}
