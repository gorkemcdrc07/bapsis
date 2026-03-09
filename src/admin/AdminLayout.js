import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { AdminStoreProvider } from "./store/AdminStore";
import AdminUstMenu from "./components/AdminUstMenu";

export default function AdminLayout() {
    return (
        <AdminStoreProvider>
            <Box sx={{ minHeight: "100vh", color: "#fff" }}>
                <AdminUstMenu />
                <Box sx={{ px: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 }, pt: 2 }}>
                    <Outlet />
                </Box>
            </Box>
        </AdminStoreProvider>
    );
}