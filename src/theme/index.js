// src/theme/index.js
import { createTheme, alpha } from "@mui/material/styles";

export const getAppTheme = (mode = "light") =>
    createTheme({
        palette: {
            mode,
            ...(mode === "dark"
                ? {
                    primary: { main: "#7aa2ff" },
                    success: { main: "#4fd1a5" },
                    background: {
                        default: "#0a0f17",
                        paper: "#121826",
                    },
                    text: {
                        primary: "#f3f7ff",
                        secondary: alpha("#f3f7ff", 0.68),
                    },
                }
                : {
                    primary: { main: "#3b82f6" },
                    success: { main: "#10b981" },
                    background: {
                        default: "#eef3f8",
                        paper: "#ffffff",
                    },
                    text: {
                        primary: "#0f172a",
                        secondary: alpha("#0f172a", 0.68),
                    },
                }),
        },
        shape: {
            borderRadius: 14,
        },
        typography: {
            fontFamily: `'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
            button: {
                textTransform: "none",
            },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                    },
                },
            },
            MuiButton: {
                defaultProps: {
                    disableElevation: true,
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        fontWeight: 700,
                    },
                },
            },
        },
    });