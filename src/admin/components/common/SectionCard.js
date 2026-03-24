// src/components/common/SectionCard.js
import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { getUiStyles } from "../../theme/uiStyles";

export default function SectionCard({ title, subtitle, icon, children, sx }) {
    const theme = useTheme();
    const ui = getUiStyles(theme);

    return (
        <Box sx={{ ...ui.glassCard, p: 2.1, ...sx }}>
            <Stack direction="row" spacing={1.3} alignItems="flex-start" sx={{ mb: 1.8 }}>
                <Box sx={ui.sectionIcon}>{icon}</Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }}>
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography sx={{ mt: 0.2, fontSize: 12.5, color: "text.secondary" }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
            </Stack>

            {children}
        </Box>
    );
}