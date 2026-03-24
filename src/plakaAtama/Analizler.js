import React, { useMemo } from "react";
import { Box, Typography, Stack } from "@mui/material";
import {
    LocalShippingRounded as LocalShippingIcon,
    AssignmentTurnedInRounded as AssignmentTurnedInIcon,
    WarehouseRounded as WarehouseIcon,
    ReceiptLongRounded as ReceiptLongIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

export default function Analizler({ rows = [] }) {
    const summaryCards = useMemo(() => {
        const total = rows.length;
        const assigned = rows.filter((r) => String(r?.cekici ?? "").trim() !== "").length;
        const tesiste = rows.filter(
            (r) => String(r?.arac_durumu ?? "").trim().toLocaleUpperCase("tr-TR") === "TESİSTE"
        ).length;
        const irsaliye = rows.filter((r) => String(r?.irsaliye ?? "").trim() !== "").length;

        return [
            {
                key: "total",
                title: "Toplam Kayıt",
                value: total,
                icon: <LocalShippingIcon />,
                color: "#3b82f6",
                softBg: "rgba(59,130,246,0.14)",
                border: "rgba(59,130,246,0.24)",
            },
            {
                key: "assigned",
                title: "Atanan Araç",
                value: assigned,
                icon: <AssignmentTurnedInIcon />,
                color: "#10b981",
                softBg: "rgba(16,185,129,0.14)",
                border: "rgba(16,185,129,0.24)",
            },
            {
                key: "tesiste",
                title: "Tesiste",
                value: tesiste,
                icon: <WarehouseIcon />,
                color: "#f59e0b",
                softBg: "rgba(245,158,11,0.14)",
                border: "rgba(245,158,11,0.24)",
            },
            {
                key: "irsaliye",
                title: "İrsaliye",
                value: irsaliye,
                icon: <ReceiptLongIcon />,
                color: "#8b5cf6",
                softBg: "rgba(139,92,246,0.14)",
                border: "rgba(139,92,246,0.24)",
            },
        ];
    }, [rows]);

    return (
        <Box sx={{ width: "100%", mb: 1.25 }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        xl: "repeat(4, 1fr)",
                    },
                    gap: 1.5,
                }}
            >
                {summaryCards.map((card, index) => (
                    <Box
                        key={card.key}
                        component={motion.div}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.06 }}
                        whileHover={{
                            y: -4,
                            transition: { duration: 0.18 },
                        }}
                        sx={{
                            position: "relative",
                            overflow: "hidden",
                            minHeight: 118,
                            borderRadius: "22px",
                            px: 2.1,
                            py: 1.9,
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
                            backdropFilter: "blur(16px)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow:
                                "0 14px 30px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.04)",
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                top: -30,
                                right: -30,
                                width: 120,
                                height: 120,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${card.softBg} 0%, transparent 70%)`,
                                pointerEvents: "none",
                            },
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: 3,
                                background: `linear-gradient(90deg, ${card.color}, transparent 75%)`,
                                opacity: 0.95,
                            },
                        }}
                    >
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={1.5}
                            sx={{ position: "relative", zIndex: 1 }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        color: "rgba(255,255,255,0.52)",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: 0.4,
                                        mb: 1.1,
                                    }}
                                >
                                    {card.title}
                                </Typography>

                                <Typography
                                    sx={{
                                        color: "#fff",
                                        fontSize: { xs: 28, sm: 30 },
                                        fontWeight: 900,
                                        lineHeight: 1,
                                        letterSpacing: -0.8,
                                        textShadow: "0 6px 18px rgba(0,0,0,0.18)",
                                    }}
                                >
                                    {card.value}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: card.color,
                                    background: `linear-gradient(180deg, ${card.softBg}, rgba(255,255,255,0.03))`,
                                    border: `1px solid ${card.border}`,
                                    boxShadow: `0 10px 24px ${card.softBg}`,
                                    flexShrink: 0,
                                }}
                            >
                                {React.cloneElement(card.icon, { fontSize: "small" })}
                            </Box>
                        </Stack>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}