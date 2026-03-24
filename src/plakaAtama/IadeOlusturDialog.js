import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Typography,
    Divider,
} from "@mui/material";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";

export default function IadeOlusturDialog({
    open,
    onClose,
    onConfirm,
    row,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: "rgba(15,23,42,0.98)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                    backdropFilter: "blur(14px)",
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 1 }}>
                <KeyboardReturnIcon />
                İade Satırı Oluştur
            </DialogTitle>

            <DialogContent sx={{ pt: "8px !important" }}>
                {!row ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
                        Satır bulunamadı.
                    </Typography>
                ) : (
                    <Stack spacing={1.25}>
                        <Typography sx={{ color: "rgba(255,255,255,0.86)", fontSize: 14 }}>
                            Bu işlem seçili satırın hemen altına yeni bir kayıt oluşturur.
                        </Typography>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        <Typography sx={{ fontSize: 13, color: "#93c5fd" }}>
                            Kaynak Satır
                        </Typography>

                        <Stack spacing={0.5}>
                            <Typography sx={{ fontSize: 13 }}>
                                <b>Sefer:</b> {row.sefer || "-"}
                            </Typography>
                            <Typography sx={{ fontSize: 13 }}>
                                <b>Yükleme Yeri:</b> {row.yukleme_yeri || "-"}
                            </Typography>
                            <Typography sx={{ fontSize: 13 }}>
                                <b>Varış 1:</b> {row.varis1 || "-"}
                            </Typography>
                        </Stack>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        <Typography sx={{ fontSize: 13, color: "#86efac" }}>
                            Oluşacak Yeni Satır
                        </Typography>

                        <Stack spacing={0.5}>
                            <Typography sx={{ fontSize: 13 }}>
                                <b>Yükleme Yeri:</b> {row.varis1 || "-"}
                            </Typography>
                            <Typography sx={{ fontSize: 13 }}>
                                <b>Varış 1:</b> {row.yukleme_yeri || "-"}
                            </Typography>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                    onClick={onClose}
                    sx={{
                        color: "rgba(255,255,255,0.75)",
                        borderRadius: 2,
                    }}
                >
                    Vazgeç
                </Button>

                <Button
                    variant="contained"
                    onClick={onConfirm}
                    disabled={!row}
                    sx={{
                        borderRadius: 2,
                        fontWeight: 800,
                        px: 2.2,
                    }}
                >
                    İade Oluştur
                </Button>
            </DialogActions>
        </Dialog>
    );
}