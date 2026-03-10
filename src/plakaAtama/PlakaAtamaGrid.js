// src/plakaAtama/PlakaAtamaGrid.js
import React, {
    memo,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    useEffect,
} from "react";
import {
    Box,
    Card,
    Typography,
    InputBase,
    IconButton,
    Stack,
    Avatar,
    Checkbox,
    Snackbar,
    Alert,
} from "@mui/material";
import {
    LocalShipping as TruckIcon,
    SyncAlt as SwapIcon,
    ReceiptLong as VknIcon,
    MoreVert as MoreIcon,
} from "@mui/icons-material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { FixedSizeList, areEqual } from "react-window";

const CHECK_COL_W = 54;
const INDEX_COL_W = 56;
const ICON_COL_W = 132;
const MORE_COL_W = 64;
const ROW_H = 88;
const HEADER_H = 54;

const MIN_COL_W = 90;
const MAX_COL_W = 700;

const LISTBOX_FIELDS = new Set([
    "cekici",
    "surucu",
    "vkn",
    "arac_durumu",
    "peron_no",
]);

const onlyDigits = (value) => String(value ?? "").replace(/\D+/g, "");

const checkboxSx = {
    color: "rgba(255,255,255,0.35)",
    "&.Mui-checked": { color: "rgba(120,160,255,0.95)" },
};

const headerCheckboxSx = {
    color: "rgba(255,255,255,0.35)",
    "&.Mui-checked": { color: "rgba(120,160,255,0.95)" },
    "&.MuiCheckbox-indeterminate": { color: "rgba(120,160,255,0.95)" },
};

const copyButtonSx = {
    color: "rgba(255,255,255,0.72)",
    p: 0.5,
    flexShrink: 0,
    "&:hover": {
        color: "rgba(255,255,255,0.95)",
        background: "rgba(255,255,255,0.08)",
    },
};

const indexBadgeSx = {
    minWidth: 38,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.88)",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    userSelect: "none",
};

const TextCell = memo(
    function TextCell({ value }) {
        const v = String(value ?? "").trim();

        return (
            <Typography
                sx={{
                    px: 1.2,
                    py: 1.1,
                    fontSize: 13,
                    fontWeight: 650,
                    color: "rgba(255,255,255,0.82)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                title={v}
                noWrap
            >
                {v || "—"}
            </Typography>
        );
    },
    (prev, next) => prev.value === next.value
);

const ClickableCell = memo(
    function ClickableCell({ value, onClick, disabled }) {
        const v = String(value ?? "").trim();

        return (
            <Box
                onClick={disabled ? undefined : onClick}
                sx={{
                    px: 1.2,
                    py: 1.15,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.72 : 1,
                    minWidth: 0,
                }}
                title={v}
            >
                {v || "—"}
            </Box>
        );
    },
    (prev, next) =>
        prev.value === next.value &&
        prev.onClick === next.onClick &&
        prev.disabled === next.disabled
);

const VknCopyCell = memo(
    function VknCopyCell({ value, onCopy, onClick, disabled }) {
        const raw = String(value ?? "").trim();
        const digits = onlyDigits(raw);

        const handleCopy = (e) => {
            e.stopPropagation();
            onCopy?.(raw);
        };

        return (
            <Box
                sx={{
                    px: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    minWidth: 0,
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ClickableCell value={raw} onClick={onClick} disabled={disabled} />
                </Box>

                <IconButton
                    size="small"
                    onClick={handleCopy}
                    disabled={!digits}
                    title={digits ? `Sadece rakamları kopyala: ${digits}` : "Kopyalanacak sayı yok"}
                    sx={copyButtonSx}
                >
                    <ContentCopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>
        );
    },
    (prev, next) =>
        prev.value === next.value &&
        prev.onCopy === next.onCopy &&
        prev.onClick === next.onClick &&
        prev.disabled === next.disabled
);

const EditableInputCell = memo(
    function EditableInputCell({ value, onChange, sx }) {
        return (
            <InputBase
                fullWidth
                value={value}
                onChange={onChange}
                placeholder="—"
                sx={sx}
            />
        );
    },
    (prev, next) =>
        prev.value === next.value &&
        prev.onChange === next.onChange &&
        prev.sx === next.sx
);

const Row = memo(
    function Row({ index, style, data }) {
        const row = data.rows[index];
        if (!row) return null;

        const columns = data.columns;
        const s = data.s;
        const no = String(index + 1).padStart(2, "0");

        const hasSelection = !!data.selectedIds && data.canEdit;
        const checked = hasSelection ? data.selectedIds?.has(row.id) : false;

        const readOnlyAll = !data.canEdit || !data.onChange;
        const canOpenSwap = !!data.canEdit && !!data.onOpenSwap;
        const canOpenVkn = !!data.canEdit && !!data.onOpenVkn;

        return (
            <div style={style}>
                <Box sx={{ px: 0.5, py: 0.5 }}>
                    <Card sx={data.rowCardBase}>
                        <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
                            {hasSelection ? (
                                <Box sx={{ width: CHECK_COL_W, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                                    <Checkbox
                                        checked={!!checked}
                                        onChange={() => data.onToggleRow?.(row.id)}
                                        sx={checkboxSx}
                                    />
                                </Box>
                            ) : null}

                            <Box sx={{ width: INDEX_COL_W, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                                <Box sx={indexBadgeSx} title={`Satır ${index + 1}`}>
                                    {no}
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    width: ICON_COL_W,
                                    flexShrink: 0,
                                    display: "flex",
                                    justifyContent: "center",
                                    position: "relative",
                                }}
                            >
                                <Box sx={typeof s?.rowGlow === "function" ? s.rowGlow(row.tc ? "ok" : "warn") : undefined} />

                                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                                    <IconButton
                                        onClick={() => data.onOpenDetails?.(row.id)}
                                        sx={s.iconBtnRound}
                                        title="Detay"
                                        disableRipple
                                        disabled={!data.onOpenDetails}
                                    >
                                        <Avatar sx={s.avatarMain}>
                                            <TruckIcon sx={s.iconMain} />
                                        </Avatar>
                                    </IconButton>

                                    <IconButton
                                        onClick={() => data.onOpenSwap?.(row.id)}
                                        sx={s.iconBtnRound}
                                        title={data.canEdit ? "Şoför değiştir" : "Yetkisiz"}
                                        disableRipple
                                        disabled={!canOpenSwap}
                                    >
                                        <Avatar sx={s.avatarMain}>
                                            <SwapIcon sx={s.iconMain} />
                                        </Avatar>
                                    </IconButton>

                                    <IconButton
                                        onClick={() => data.onOpenVkn?.(row.id)}
                                        sx={s.iconBtnRound}
                                        title={data.canEdit ? "VKN değiştir" : "Yetkisiz"}
                                        disableRipple
                                        disabled={!canOpenVkn}
                                    >
                                        <Avatar sx={s.avatarMain}>
                                            <VknIcon sx={s.iconMain} />
                                        </Avatar>
                                    </IconButton>
                                </Stack>
                            </Box>

                            {columns.map((col) => {
                                const val = row[col.key] ?? "";
                                const keyName = String(col.key).trim();
                                const isReadonly = keyName === "guncellendi";

                                const editableSet = data.editableColumnSet;
                                const canEditThisColumn = editableSet == null ? true : editableSet.has(keyName);

                                const cellReadOnly = isReadonly || readOnlyAll || !canEditThisColumn;
                                const isListboxField = LISTBOX_FIELDS.has(keyName);
                                const isVknColumn = keyName === "vkn";
                                const listboxActive = isListboxField && !cellReadOnly && !!data.onOpenListbox;

                                if (isVknColumn) {
                                    return (
                                        <Box key={col.key} sx={{ width: col.w, px: 0.5, flexShrink: 0 }}>
                                            <VknCopyCell
                                                value={val}
                                                onCopy={data.copyDigitsToClipboard}
                                                onClick={
                                                    listboxActive
                                                        ? (e) => data.onOpenListbox?.(e, row.id, col.key)
                                                        : undefined
                                                }
                                                disabled={!listboxActive}
                                            />
                                        </Box>
                                    );
                                }

                                if (isListboxField) {
                                    return (
                                        <Box key={col.key} sx={{ width: col.w, px: 0.5, flexShrink: 0 }}>
                                            <ClickableCell
                                                value={val}
                                                onClick={
                                                    listboxActive
                                                        ? (e) => data.onOpenListbox?.(e, row.id, col.key)
                                                        : undefined
                                                }
                                                disabled={!listboxActive}
                                            />
                                        </Box>
                                    );
                                }

                                return (
                                    <Box key={col.key} sx={{ width: col.w, px: 0.5, flexShrink: 0 }}>
                                        {cellReadOnly ? (
                                            <TextCell value={val} />
                                        ) : (
                                            <EditableInputCell
                                                value={val}
                                                onChange={(e) => data.onChange?.(row.id, col.key, e.target.value)}
                                                sx={data.gridInputBase}
                                            />
                                        )}
                                    </Box>
                                );
                            })}

                            <Box sx={{ width: MORE_COL_W, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                                <IconButton size="small" sx={s.iconBtn} disabled>
                                    <MoreIcon />
                                </IconButton>
                            </Box>
                        </Stack>
                    </Card>
                </Box>
            </div>
        );
    },
    areEqual
);

function PlakaAtamaGrid({
    rows,
    columns,
    s,
    loading,
    onOpenDetails,
    onOpenSwap,
    onOpenVkn,
    onOpenListbox,
    onChange,
    selectedIds,
    onToggleRow,
    onToggleAll,
    allSelected,
    someSelected,
    canEdit = true,
    visibleColumnKeys = null,
    editableColumnKeys = null,
}) {
    const effectiveColumnsBase = useMemo(() => {
        if (!Array.isArray(columns)) return [];
        if (visibleColumnKeys == null) return columns;

        const allow = new Set((visibleColumnKeys || []).map((x) => String(x).trim()));
        return columns.filter((c) => allow.has(String(c.key).trim()));
    }, [columns, visibleColumnKeys]);

    const [columnWidths, setColumnWidths] = useState({});
    const columnWidthsRef = useRef({});

    const [, forceToastRender] = useState(0);
    const copyToastRef = useRef({
        open: false,
        text: "",
    });

    const showCopyToast = useCallback((text) => {
        copyToastRef.current = {
            open: true,
            text,
        };
        forceToastRender((v) => v + 1);
    }, []);

    const closeCopyToast = useCallback(() => {
        if (!copyToastRef.current.open) return;
        copyToastRef.current = {
            open: false,
            text: "",
        };
        forceToastRender((v) => v + 1);
    }, []);

    useEffect(() => {
        setColumnWidths((prev) => {
            const next = { ...prev };

            for (const col of effectiveColumnsBase) {
                const key = String(col.key).trim();
                if (next[key] == null) {
                    next[key] = Number(col.w) || 120;
                }
            }

            columnWidthsRef.current = next;
            return next;
        });
    }, [effectiveColumnsBase]);

    useEffect(() => {
        columnWidthsRef.current = columnWidths;
    }, [columnWidths]);

    const effectiveColumns = useMemo(() => {
        return effectiveColumnsBase.map((col) => ({
            ...col,
            w: columnWidths[String(col.key).trim()] ?? Number(col.w) ?? 120,
        }));
    }, [effectiveColumnsBase, columnWidths]);

    const editableColumnSet = useMemo(() => {
        if (editableColumnKeys == null) return null;
        return new Set((editableColumnKeys || []).map((x) => String(x).trim()));
    }, [editableColumnKeys]);

    const hasSelection = !!selectedIds && canEdit;

    const totalWidth = useMemo(() => {
        return (
            (hasSelection ? CHECK_COL_W : 0) +
            INDEX_COL_W +
            ICON_COL_W +
            effectiveColumns.reduce((acc, c) => acc + (Number(c.w) || 120), 0) +
            MORE_COL_W
        );
    }, [effectiveColumns, hasSelection]);

    const wrapRef = useRef(null);
    const [vh, setVh] = useState(520);

    useLayoutEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        const ro = new ResizeObserver(() => setVh(el.clientHeight || 520));
        ro.observe(el);
        setVh(el.clientHeight || 520);

        return () => ro.disconnect();
    }, []);

    const rowCardBase = useMemo(() => {
        return {
            background: "rgba(12,18,38,0.96)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
            m: 0,
            height: ROW_H - 8,
            pointerEvents: "auto",
            boxShadow: "none",
            backdropFilter: "none",
        };
    }, []);

    const gridInputBase = useMemo(() => {
        return {
            ...s.gridInput,
            fontWeight: 750,
            color: "rgba(255,255,255,0.9)",
            "& input": { color: "rgba(255,255,255,0.9)" },
        };
    }, [s]);

    const copyDigitsToClipboard = useCallback(async (value) => {
        const digits = onlyDigits(value);
        if (!digits) return false;

        try {
            await navigator.clipboard.writeText(digits);
            showCopyToast(`VKN kopyalandı: ${digits}`);
            return true;
        } catch (err) {
            const ta = document.createElement("textarea");
            ta.value = digits;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();

            try {
                document.execCommand("copy");
                document.body.removeChild(ta);
                showCopyToast(`VKN kopyalandı: ${digits}`);
                return true;
            } catch (_) {
                document.body.removeChild(ta);
                return false;
            }
        }
    }, [showCopyToast]);

    const itemData = useMemo(
        () => ({
            rows,
            columns: effectiveColumns,
            s,
            onOpenDetails,
            onOpenSwap,
            onOpenVkn,
            onOpenListbox,
            onChange,
            rowCardBase,
            gridInputBase,
            selectedIds: hasSelection ? selectedIds : null,
            onToggleRow: hasSelection ? onToggleRow : null,
            canEdit,
            editableColumnSet,
            copyDigitsToClipboard,
        }),
        [
            rows,
            effectiveColumns,
            s,
            onOpenDetails,
            onOpenSwap,
            onOpenVkn,
            onOpenListbox,
            onChange,
            rowCardBase,
            gridInputBase,
            selectedIds,
            onToggleRow,
            hasSelection,
            canEdit,
            editableColumnSet,
            copyDigitsToClipboard,
        ]
    );

    const itemKey = useCallback((index, data) => data.rows[index]?.id ?? index, []);

    const resizeStateRef = useRef(null);

    const startResize = useCallback((e, colKey) => {
        e.preventDefault();
        e.stopPropagation();

        const key = String(colKey).trim();
        const startX = e.clientX;
        const startWidth = columnWidthsRef.current[key] ?? 120;

        resizeStateRef.current = { key, startX, startWidth };

        const onMouseMove = (ev) => {
            const state = resizeStateRef.current;
            if (!state) return;

            const delta = ev.clientX - state.startX;
            const nextWidth = Math.max(
                MIN_COL_W,
                Math.min(MAX_COL_W, state.startWidth + delta)
            );

            setColumnWidths((prev) => {
                if (prev[state.key] === nextWidth) return prev;

                const next = {
                    ...prev,
                    [state.key]: nextWidth,
                };
                columnWidthsRef.current = next;
                return next;
            });
        };

        const onMouseUp = () => {
            resizeStateRef.current = null;
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }, []);

    const listHeight = Math.max(200, vh - HEADER_H);

    const copyToast = copyToastRef.current;

    return (
        <Box sx={s.gridContainer}>
            <Box ref={wrapRef} sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                {!loading && rows.length === 0 ? (
                    <Box sx={{ p: 3 }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                            Gösterilecek kayıt bulunamadı.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "hidden" }}>
                        <Box sx={{ width: totalWidth, height: "100%", display: "flex", flexDirection: "column" }}>
                            <Box
                                sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 5,
                                    bgcolor: "rgba(8,12,28,0.92)",
                                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                                    flexShrink: 0,
                                    height: HEADER_H,
                                }}
                            >
                                <Stack direction="row" sx={s.headerRow}>
                                    {hasSelection ? (
                                        <Box
                                            sx={{
                                                width: CHECK_COL_W,
                                                px: 1,
                                                flexShrink: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Checkbox
                                                checked={!!allSelected}
                                                indeterminate={!!someSelected}
                                                onChange={() => onToggleAll?.()}
                                                sx={headerCheckboxSx}
                                                title="Tümünü seç / kaldır"
                                            />
                                        </Box>
                                    ) : null}

                                    <Box sx={{ width: INDEX_COL_W, px: 1, flexShrink: 0, display: "flex", alignItems: "center" }}>
                                        <Typography sx={{ ...s.colTitle, opacity: 0.9 }}>#</Typography>
                                    </Box>

                                    <Box sx={{ width: ICON_COL_W, flexShrink: 0 }} />

                                    {effectiveColumns.map((col) => (
                                        <Box
                                            key={col.key}
                                            sx={{
                                                width: col.w,
                                                px: 1,
                                                flexShrink: 0,
                                                position: "relative",
                                                display: "flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Typography sx={s.colTitle} noWrap>
                                                {col.label}
                                            </Typography>

                                            <Box
                                                onMouseDown={(e) => startResize(e, col.key)}
                                                sx={{
                                                    position: "absolute",
                                                    top: 0,
                                                    right: -4,
                                                    width: 8,
                                                    height: "100%",
                                                    cursor: "col-resize",
                                                    zIndex: 10,
                                                    "&:hover::after": {
                                                        opacity: 1,
                                                    },
                                                    "&::after": {
                                                        content: '""',
                                                        position: "absolute",
                                                        top: 8,
                                                        bottom: 8,
                                                        left: "50%",
                                                        transform: "translateX(-50%)",
                                                        width: 2,
                                                        borderRadius: 999,
                                                        background: "rgba(120,160,255,0.95)",
                                                        opacity: 0.25,
                                                        transition: "opacity 0.15s ease",
                                                    },
                                                }}
                                            />
                                        </Box>
                                    ))}

                                    <Box sx={{ width: MORE_COL_W, flexShrink: 0 }} />
                                </Stack>
                            </Box>

                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                <FixedSizeList
                                    height={listHeight}
                                    width={totalWidth}
                                    itemCount={rows.length}
                                    itemSize={ROW_H}
                                    overscanCount={6}
                                    itemData={itemData}
                                    itemKey={itemKey}
                                >
                                    {Row}
                                </FixedSizeList>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>

            <Snackbar
                open={copyToast.open}
                autoHideDuration={2200}
                onClose={closeCopyToast}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    severity="success"
                    variant="filled"
                    onClose={closeCopyToast}
                    sx={{
                        fontWeight: 700,
                        borderRadius: 2.5,
                        boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                        alignItems: "center",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    {copyToast.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default memo(PlakaAtamaGrid);