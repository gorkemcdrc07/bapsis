// src/components/layout/AppShell.js
import React from "react";
import { Box, useTheme, alpha } from "@mui/material";

export default function AppShell({ children, sidebar, header, footer }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: isDark
                    ? `
                        radial-gradient(1000px 500px at 0% 0%, ${alpha(theme.palette.primary.main, 0.18)}, transparent 50%),
                        radial-gradient(800px 400px at 100% 10%, ${alpha(theme.palette.success.main, 0.08)}, transparent 40%),
                        linear-gradient(180deg, #0b1018 0%, #0d121b 45%, #0a0f17 100%)
                    `
                    : `
                        radial-gradient(1000px 500px at 0% 0%, ${alpha(theme.palette.primary.main, 0.10)}, transparent 52%),
                        radial-gradient(800px 400px at 100% 10%, ${alpha(theme.palette.success.main, 0.06)}, transparent 40%),
                        linear-gradient(180deg, #f8fbff 0%, #f4f7fb 45%, #eef3f8 100%)
                    `,
                color: theme.palette.text.primary,
                display: "grid",
                gridTemplateColumns: sidebar ? { xs: "1fr", lg: "280px 1fr" } : "1fr",
                transition: "background 0.3s ease, color 0.3s ease",
            }}
        >
            {sidebar ? (
                <Box
                    sx={{
                        borderRight: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                        background: alpha(theme.palette.background.paper, isDark ? 0.55 : 0.75),
                        backdropFilter: "blur(18px)",
                    }}
                >
                    {sidebar}
                </Box>
            ) : null}

            <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                {header ? (
                    <Box
                        sx={{
                            position: "sticky",
                            top: 0,
                            zIndex: 20,
                            px: 2,
                            py: 1.5,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                            background: alpha(theme.palette.background.paper, isDark ? 0.58 : 0.82),
                            backdropFilter: "blur(18px)",
                        }}
                    >
                        {header}
                    </Box>
                ) : null}

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                    }}
                >
                    {children}
                </Box>

                {footer ? (
                    <Box
                        sx={{
                            px: 2,
                            py: 1.5,
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                            background: alpha(theme.palette.background.paper, isDark ? 0.5 : 0.8),
                            backdropFilter: "blur(14px)",
                        }}
                    >
                        {footer}
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
}