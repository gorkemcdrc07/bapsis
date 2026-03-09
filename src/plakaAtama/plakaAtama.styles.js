// src/plakaAtama/plakaAtama.styles.js
export const s = {
    page: {
        p: { xs: 2, md: 5 },
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#020617",
        backgroundImage:
            "radial-gradient(at 0% 0%, rgba(30, 58, 138, 0.3) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(88, 28, 135, 0.2) 0px, transparent 50%)",
        fontFamily: "'Inter', sans-serif",
        color: "#fff",
    },

    ddIcon: { fontSize: 18, color: "rgba(255,255,255,0.35)", ml: 0.5 },

    hero: { mb: 3, flexShrink: 0 },
    brandDot: { width: 10, height: 10, borderRadius: "50%", bgcolor: "#3b82f6", boxShadow: "0 0 20px #3b82f6" },
    heroKicker: { fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.4)" },
    heroTitle: { fontSize: { xs: 32, md: 44 }, fontWeight: 950, letterSpacing: "-0.03em" },
    heroSub: { color: "rgba(255,255,255,0.5)", fontSize: 16 },

    search: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1,
        bgcolor: "rgba(255,255,255,0.03)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        width: 320,
        // ✅ blur kaldırıldı (scroll performansı)
        backdropFilter: "none",
    },
    searchInput: { color: "#fff", fontSize: 14, width: "100%" },

    // ✅ GRID
    gridContainer: {
        background: "rgba(255,255,255,0.02)",
        borderRadius: "28px",
        border: "1px solid rgba(255,255,255,0.06)",
        // ✅ blur kaldırıldı (ana donma sebebi)
        backdropFilter: "none",
        p: 1,

        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },

    headerRow: { py: 1.6, px: 1, borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: "max-content" },
    colTitle: {
        fontSize: 10,
        fontWeight: 800,
        color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase",
        letterSpacing: 1,
    },

    rowCard: {
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "14px",
        py: 0.35,
        transition: "0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
            background: "rgba(255,255,255,0.05)",
            transform: "translateY(-1px)",
            borderColor: "rgba(59, 130, 246, 0.4)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
        },
    },

    gridInput: {
        fontSize: 13,
        px: 1.2,
        py: 0.45,
        borderRadius: "10px",
        transition: "0.2s",
        bgcolor: "rgba(0,0,0,0.16)",
        border: "1px solid rgba(255,255,255,0.04)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)" },
        "&.Mui-focused": {
            bgcolor: "rgba(59, 130, 246, 0.1)",
            color: "#fff",
            borderColor: "#3b82f6",
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.12)",
        },
    },

    rowGlow: (status) => ({
        position: "absolute",
        left: 0,
        top: "20%",
        bottom: "20%",
        width: 3,
        bgcolor: status === "ok" ? "#22c55e" : "#eab308",
        boxShadow: `0 0 15px ${status === "ok" ? "#22c55e" : "#eab308"}`,
        borderRadius: "0 4px 4px 0",
    }),

    iconBtnRound: { p: 0.25, borderRadius: "14px", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } },
    avatarMain: {
        width: 30,
        height: 30,
        bgcolor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.16)",
        color: "rgba(255,255,255,0.92)",
        boxShadow: "0 6px 16px -10px rgba(0,0,0,0.8)",
    },
    iconMain: { fontSize: 18, color: "rgba(255,255,255,0.92)" },

    primaryBtn: {
        borderRadius: "14px",
        px: 4,
        py: 1,
        fontWeight: 900,
        textTransform: "none",
        bgcolor: "#3b82f6",
        boxShadow: "0 10px 26px -10px rgba(59, 130, 246, 0.75)",
        "&:hover": { bgcolor: "#2563eb" },
    },
    secondaryBtn: {
        borderRadius: "14px",
        px: 3,
        fontWeight: 800,
        textTransform: "none",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "rgba(255,255,255,0.02)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
    },

    pill: {
        bgcolor: "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.6)",
        fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.05)",
    },
    pillActive: {
        bgcolor: "rgba(59, 130, 246, 0.1)",
        color: "#3b82f6",
        fontWeight: 800,
        border: "1px solid rgba(59, 130, 246, 0.2)",
    },
    iconBtn: { color: "rgba(255,255,255,0.25)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" } },

    // Listbox
    listboxPaper: {
        width: 360,
        bgcolor: "rgba(12,16,28,0.98)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "16px",
        // ✅ blur kaldırıldı
        backdropFilter: "none",
        overflow: "hidden",
    },
    listboxSearch: {
        color: "#fff",
        fontSize: 13,
        width: "100%",
        px: 1.2,
        py: 0.8,
        borderRadius: "12px",
        bgcolor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
    },
    listItemBtn: { mx: 1, my: 0.5, borderRadius: "12px", "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } },

    // Swap dialog
    swapDialogPaper: {
        bgcolor: "rgba(12,16,28,0.98)",
        color: "#fff",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.10)",
        // ✅ blur kaldırıldı
        backdropFilter: "none",
    },
    swapDialogTitle: { fontWeight: 950, letterSpacing: -0.2 },
    swapDialogContent: { borderColor: "rgba(255,255,255,0.08)" },
    swapCard: { p: 1.5, borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(255,255,255,0.03)" },
    swapLine: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 700, mb: 0.4 },

    // Drawer
    drawerPaper: {
        width: { xs: "92vw", sm: 520 },
        color: "#fff",
        borderLeft: "1px solid rgba(255,255,255,0.10)",
        background: "linear-gradient(180deg, rgba(12,16,28,0.92) 0%, rgba(6,8,16,0.96) 70%, rgba(6,8,16,0.98) 100%)",
        // ✅ blur kaldırıldı
        backdropFilter: "none",
    },
    drawerTop: {
        position: "sticky",
        top: 0,
        zIndex: 5,
        px: 2,
        pt: 2,
        pb: 1.2,
        background: "linear-gradient(180deg, rgba(12,16,28,0.98) 0%, rgba(12,16,28,0.85) 100%)",
        // ✅ blur kaldırıldı
        backdropFilter: "none",
    },
    drawerTitle: { fontSize: 16, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.15 },
    drawerChip: { bgcolor: "rgba(59,130,246,0.15)", color: "#bfdbfe", border: "1px solid rgba(59,130,246,0.25)", fontWeight: 800 },
    drawerChip2: { bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.10)", fontWeight: 700 },
    drawerClose: {
        color: "rgba(255,255,255,0.75)",
        bgcolor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.10)" },
    },
    drawerDivider: { mt: 1.4, borderColor: "rgba(255,255,255,0.08)" },
    drawerBody: { p: 2, pb: 14 },

    detailGrid2: { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.8 },

    detailTextField: (highlight) => ({
        "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.62)", fontWeight: 700, fontSize: 11 },
        "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: highlight ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.04)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            "& fieldset": { borderColor: "rgba(255,255,255,0.14)" },
            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.26)" },
            "&.Mui-focused fieldset": { borderColor: "#3b82f6", boxShadow: "0 0 0 4px rgba(59,130,246,0.12)" },
        },
        "& .MuiOutlinedInput-input": { padding: "12px 12px" },
        "& .MuiOutlinedInput-inputSizeSmall": { padding: "12px 12px" },
    }),

    detailActionsBar: {
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        mt: 2.2,
        pt: 1.6,
        pb: 1.6,
        px: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1.2,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(6,8,16,0.92)",
        // ✅ blur kaldırıldı
        backdropFilter: "none",
    },
};