// src/theme/uiStyles.js
import { alpha } from "@mui/material/styles";

export const getUiStyles = (theme) => {
    const isDark = theme.palette.mode === "dark";

    return {
        pageContainer: {
            minHeight: "100%",
        },

        glassCard: {
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.9 : 0.7)}`,
            background: isDark
                ? `linear-gradient(180deg, ${alpha("#fff", 0.06)}, ${alpha("#fff", 0.03)})`
                : `linear-gradient(180deg, ${alpha("#fff", 0.82)}, ${alpha("#fff", 0.68)})`,
            backdropFilter: "blur(16px)",
            boxShadow: isDark
                ? "0 18px 50px rgba(0,0,0,0.28)"
                : "0 18px 40px rgba(15,23,42,0.08)",
        },

        softCard: {
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
            background: alpha(theme.palette.background.paper, isDark ? 0.5 : 0.78),
            backdropFilter: "blur(12px)",
            boxShadow: isDark
                ? "0 10px 28px rgba(0,0,0,0.18)"
                : "0 10px 24px rgba(15,23,42,0.06)",
        },

        sectionIcon: {
            width: 38,
            height: 38,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            background: isDark
                ? `linear-gradient(180deg, ${alpha("#fff", 0.10)}, ${alpha("#fff", 0.05)})`
                : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.10)}, ${alpha(theme.palette.primary.main, 0.05)})`,
            border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
        },

        input: {
            "& .MuiOutlinedInput-root": {
                borderRadius: 2.8,
                background: isDark
                    ? `linear-gradient(180deg, ${alpha("#fff", 0.05)}, ${alpha("#fff", 0.025)})`
                    : `linear-gradient(180deg, ${alpha("#fff", 0.90)}, ${alpha("#fff", 0.75)})`,
                transition: "all .18s ease",
                "& fieldset": {
                    borderColor: alpha(theme.palette.divider, 0.9),
                },
                "&:hover fieldset": {
                    borderColor: alpha(theme.palette.primary.main, 0.45),
                },
                "&.Mui-focused": {
                    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
                "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                },
            },
            "& .MuiInputLabel-root": {
                color: theme.palette.text.secondary,
            },
        },

        actionButton: {
            borderRadius: 2.8,
            py: 1.1,
            textTransform: "none",
            fontWeight: 800,
        },

        mutedText: {
            color: theme.palette.text.secondary,
        },

        topHero: {
            borderRadius: 4,
            p: 2.4,
            border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
            background: isDark
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha("#fff", 0.04)})`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha("#fff", 0.72)})`,
            backdropFilter: "blur(16px)",
            boxShadow: isDark
                ? "0 20px 44px rgba(0,0,0,0.30)"
                : "0 18px 36px rgba(15,23,42,0.08)",
        },
    };
};