import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, CircularProgress, Dialog, IconButton, MenuItem, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import SyncIcon from '@mui/icons-material/Sync'
import { FaDownload, FaFileExcel } from 'react-icons/fa6'
import * as XLSX from 'xlsx-js-style'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getMyPlants, myPlantLabel } from '../../controller/CommonApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import { format, } from 'date-fns'
import { AddTrnIndirectMaterialPrice_BULK, getTrnIndirectMaterialPrice, SyncMaterialPriceFromSales } from '../../controller/ContributionalChartApiService'
import { getMaterialType } from '../../controller/Masterapiservice'
import { MaterialGroupEnumTypes } from '../../common/enumValues'
import { toast } from 'react-toastify'
import { findPlantsNotAllowed, plantsNotAllowedMessage } from '../../common/plantFileCheck'
import FilterSelect from '../../components/FilterSelect'
import FilterMultiSelect from '../../components/FilterMultiSelect'
import UniqueGroupingInfo from '../../components/UniqueGroupingInfo'
import { compactFieldSx, compactMenuProps, compactGridSx, primaryButtonSx, successButtonSx, outlineButtonSx } from '../../components/compactUi'

// Material Price - laid out like the Vendor Master screen (title, one card with the filters / search / actions, compact grid, compact upload
// dialog), built from the same shared pieces (compactUi, FilterSelect, FilterMultiSelect, UniqueGroupingInfo). The prices come from the same
// API as before; the Month / Year and Material Type filters work on the loaded list (no extra call), and the list loads by itself.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// 'YYYY-MM' of a date
const ymOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

// the months the Sync from Sales can use: the current month and the 12 before it
const syncMonthOptions = () => Array.from({ length: 13 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
    return { value: ymOf(d), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, current: i === 0 }
})

// year and month of an effective date ('2026-09-01T00:00:00.000Z' or a Date), read from the text so no time zone can shift the month
const effYearMonth = (value) => {
    const text = value instanceof Date ? value.toISOString() : String(value || '')
    const m = /^(\d{4})-(\d{2})/.exec(text)
    return m ? { y: Number(m[1]), m: Number(m[2]) } : null
}

const priceFmt = (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))

// Shell of the upload dialog (same as the Vendor Master dialogs)
const FormDialog = ({ open, title, onClose, children, actions, width = 460 }) => (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{ sx: { width, maxWidth: '94vw', borderRadius: '10px' } }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid #e8eaee', backgroundColor: '#f3f7ff' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1a2233' }}>{title}</Typography>
            <IconButton size="small" onClick={onClose}>
                <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
        </Box>
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 12px' }}>{children}</Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 2, py: 1.25, borderTop: '1px solid #e8eaee' }}>{actions}</Box>
    </Dialog>
)

const CC_IndirectMaterialPrice = () => {
    const [searchText, setSearchText] = useState('')
    const [originalRows, setOriginalRows] = useState([])
    const [openUploadModal, setOpenUploadModal] = useState(false)
    const [refreshData, setRefreshData] = useState(false)
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(false)
    const [matTypes, setMatTypes] = useState([])

    // Plant: the dropdown holds the choice (starts on the user's own plant), the Search button applies it and reloads the list
    const [plantSelect, setPlantSelect] = useState('')
    const [plantApplied, setPlantApplied] = useState('')
    const plantDefaulted = useRef(false)
    // Month / Year: the screen opens on the current year with every month ("All"); a month or another year can be chosen
    const [fMonth, setFMonth] = useState('All')
    const [fYear, setFYear] = useState(String(new Date().getFullYear()))
    // Material Type: every type is loaded, the user can pick one or more to filter (none picked = all types)
    const [fTypes, setFTypes] = useState([])
    // Sync from Sales: the prices of the plant on screen from the sales data of the current month
    const [openSync, setOpenSync] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState(null)
    const [syncMonth, setSyncMonth] = useState(ymOf(new Date())) // the month to sync: the current one unless an earlier month is chosen

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resposne = await getMyPlants() // only the plants this user may use (own plant + Data Access)
                setPlants(Array.isArray(resposne) ? resposne : [])

                const response2 = await getMaterialType(MaterialGroupEnumTypes.all)
                setMatTypes(Array.isArray(response2.data) ? response2.data : [])
            } catch (error) {
                console.log(error)
            }
        }
        fetchData()
    }, [])

    // the user's own plant (Is_Default, else the first one) is chosen once, as soon as the plant list is loaded
    useEffect(() => {
        if (plantDefaulted.current || plants.length === 0) return
        plantDefaulted.current = true
        const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0]
        setPlantSelect(myPlantLabel(own))
        setPlantApplied(String(own.Plant_Code))
    }, [plants])

    const typeList = useMemo(() => matTypes.map((t) => t.Mat_Type).filter(Boolean), [matTypes])

    // every material type of the plant is loaded (the filters narrow the list afterwards). The API takes the types as one text of at most
    // 50 characters, so the types are asked in batches that fit (today all of them fit in one call).
    const typeBatches = useMemo(() => {
        const batches = []
        let current = ''
        typeList.forEach((type) => {
            if (current && (current + ',' + type).length > 50) { batches.push(current); current = type }
            else current = current ? current + ',' + type : type
        })
        if (current) batches.push(current)
        return batches
    }, [typeList])

    const loadPrices = async (plant) => {
        if (!plant || typeBatches.length === 0) return
        setLoading(true)
        try {
            const responses = await Promise.all(typeBatches.map((matType) => getTrnIndirectMaterialPrice({ plant, matType })))
            setOriginalRows(responses.flatMap((response) => (Array.isArray(response) ? response : [])))
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong")
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    // loads by itself when the plant and the material types are ready, and again after an upload
    useEffect(() => {
        loadPrices(plantApplied)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plantApplied, typeList, refreshData])

    const plantFilterOptions = plants.map(myPlantLabel)
    const syncPlants = plants.map((p) => String(p.Plant_Code)) // every plant the user may use
    const syncMonths = syncMonthOptions()
    const syncMonthLabel = (syncMonths.find((m) => m.value === syncMonth) || syncMonths[0]).label
    const syncIsCurrent = syncMonth === ymOf(new Date())

    // Excel of the sync result: the skipped materials (all of them, not only the 500 shown) and a summary per plant
    const downloadSyncExcel = () => {
        if (!syncResult) return
        const dmy = (v) => (v ? format(new Date(v), 'dd-MM-yyyy') : '')
        const head = (ws, cols) => cols.forEach((_, c) => {
            const cell = ws[XLSX.utils.encode_cell({ c, r: 0 })]
            if (cell) cell.s = { font: { bold: true, color: { rgb: '000000' } }, fill: { fgColor: { rgb: 'FFFF00' } }, alignment: { horizontal: 'center' } }
        })
        const addSheet = (wb, name, rows, cols, widths) => {
            const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}], { header: cols })
            ws['!cols'] = widths.map((w) => ({ wch: w }))
            head(ws, cols)
            XLSX.utils.book_append_sheet(wb, ws, name)
        }
        const wb = XLSX.utils.book_new()
        addSheet(wb, 'Skipped - no usable price', (syncResult.skipped || []).map((s) => ({ Plant: s.plant, Part_No: s.part_no, Description: s.description || '', Sales_Date: dmy(s.sales_date), Qty: s.qty, Value_INR: s.value_inr })),
            ['Plant', 'Part_No', 'Description', 'Sales_Date', 'Qty', 'Value_INR'], [8, 20, 36, 12, 10, 14])
        const line = (label, s) => ({ Plant: label, Materials: s.materials, With_Sales: s.with_sales, No_Sales: s.no_sales, Prices_Saved: s.prices_saved, Updated: s.updated, Added: s.inserted, Skipped_No_Price: s.skipped_no_value })
        addSheet(wb, 'Summary', [...(syncResult.summaries || []).map((s) => line(s.plant, s)), ...(syncResult.total ? [line('TOTAL', syncResult.total)] : [])],
            ['Plant', 'Materials', 'With_Sales', 'No_Sales', 'Prices_Saved', 'Updated', 'Added', 'Skipped_No_Price'], [10, 12, 12, 12, 14, 10, 10, 18])
        XLSX.writeFile(wb, `Material_Price_Sync_${syncMonth}.xlsx`)
    }

    const closeSync = () => { if (syncing) return; setOpenSync(false); setSyncResult(null) }
    const handleSync = async () => {
        if (syncing || syncPlants.length === 0) return
        setSyncing(true)
        try {
            const data = await SyncMaterialPriceFromSales({ plants: syncPlants, userId: localStorage.getItem('EmpId'), month: syncMonth })
            setSyncResult(data)
            loadPrices(plantApplied) // the list on screen shows the new prices
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || 'Something went wrong')
            console.log(error)
        } finally {
            setSyncing(false)
        }
    }
    const handleSearch = () => {
        const chosen = plants.find((p) => myPlantLabel(p) === plantSelect)
        const code = chosen ? String(chosen.Plant_Code) : plantApplied
        if (code === plantApplied) loadPrices(code)
        else setPlantApplied(code)
    }

    const yearOptions = useMemo(() => {
        const years = new Set([new Date().getFullYear()])
        originalRows.forEach((r) => { const ym = effYearMonth(r.eff_date); if (ym) years.add(ym.y) })
        return [...years].sort((a, b) => b - a).map(String)
    }, [originalRows])

    // Month / Year / Material Type filters and the search box, applied live to the loaded prices
    const visibleRows = useMemo(() => {
        const text = searchText.trim().toLowerCase()
        const monthNo = fMonth === 'All' ? 0 : MONTH_NAMES.indexOf(fMonth) + 1
        return originalRows.filter((row) => {
            const ym = effYearMonth(row.eff_date)
            if (fYear !== 'All' && (!ym || String(ym.y) !== fYear)) return false
            if (monthNo && (!ym || ym.m !== monthNo)) return false
            if (fTypes.length && !fTypes.includes(row.mat_type)) return false
            if (!text) return true
            return ['plant', 'part_no', 'description', 'mat_type', 'eff_date'].some((key) => {
                const value = row[key]
                return value && String(value).toLowerCase().includes(text)
            })
        })
    }, [originalRows, searchText, fMonth, fYear, fTypes])

    const columns = [
        {
            field: "idm_price_id", headerName: "SI No", width: 70, sortable: false,
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        { field: "plant", headerName: "Plant", flex: 0.5, minWidth: 70 },
        { field: "part_no", headerName: "Part No", flex: 1, minWidth: 130 },
        { field: "description", headerName: "Description", flex: 2, minWidth: 180 },
        { field: "mat_type", headerName: "Mat Type", flex: 0.6, minWidth: 90 },
        { field: "price", headerName: "Price", flex: 0.7, minWidth: 100, type: "number", valueFormatter: (value) => priceFmt(value) },
        { field: "eff_date", headerName: "Eff Date", flex: 0.8, minWidth: 110, renderCell: (params) => (<>{params.value ? format(params.value, "dd-MM-yyyy") : ""}</>) },
    ];

    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarExport />
        </GridToolbarContainer>
    );

    return (
        <div
            style={{
                padding: "20px 20px",
                backgroundColor: "#F5F5F5",
                marginTop: "50px",
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 50px)",
            }}
        >
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>
                Material Price
            </Typography>

            {/* Search, filters and actions */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e8eaee",
                    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
                    padding: "7px 10px",
                    marginBottom: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                }}
            >
                <FilterSelect label="Plant" value={plantSelect} options={plantFilterOptions} onChange={setPlantSelect} minWidth={190} />
                <Button
                    onClick={handleSearch}
                    disabled={loading}
                    variant="contained"
                    disableElevation
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 16 }} />}
                    sx={primaryButtonSx}
                >
                    {loading ? "Loading..." : "Search"}
                </Button>
                <FilterSelect label="Month" value={fMonth} options={MONTH_NAMES} onChange={setFMonth} minWidth={130} />
                <FilterSelect label="Year" value={fYear} options={yearOptions} onChange={setFYear} minWidth={95} isSearchable={false} />
                <div style={{ width: 190, flexShrink: 0 }}>
                    <FilterMultiSelect
                        label="Material Type"
                        value={fTypes}
                        options={typeList.map((t) => ({ value: t, label: t }))}
                        onChange={setFTypes}
                        placeholder="All types"
                        maxChips={2}
                    />
                </div>
                <TextField
                    size="small"
                    placeholder="Search plant, part, description, type"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
                    sx={compactFieldSx(240)}
                />

                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
                    {visibleRows.length === originalRows.length ? `${originalRows.length} prices` : `${visibleRows.length} of ${originalRows.length} prices`}
                </span>
                <Button
                    onClick={() => { setSyncResult(null); setSyncMonth(ymOf(new Date())); setOpenSync(true) }}
                    disabled={syncPlants.length === 0 || loading}
                    variant="outlined"
                    disableElevation
                    startIcon={<SyncIcon sx={{ fontSize: 16 }} />}
                    sx={outlineButtonSx}
                    title="Update the prices of all your plants from the sales data of a month (the current month, or an earlier one)"
                >
                    Sync from Sales
                </Button>
                <Button
                    onClick={() => setOpenUploadModal(true)}
                    variant="outlined"
                    disableElevation
                    startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                    sx={outlineButtonSx}
                >
                    Upload
                </Button>
                <UniqueGroupingInfo
                    sections={[{ fields: ["Plant", "Part Number", "Month of the Eff Date"] }]}
                    intro="One price per combination of:"
                    notes={[
                        <><b>Bulk upload:</b> the same combination is <b>updated</b>, any other is <b>added</b>. The part must be an active material of the plant in the Material Master.</>,
                        "Month and Year show the prices whose effective date falls in that month; All shows every month. A screen that needs the price of a month takes the latest price effective on or before the end of that month.",
                    ]}
                />
            </div>

            {/* DataGrid */}
            <div
                style={{
                    flexGrow: 1,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e8eaee",
                    boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                <DataGrid
                    rows={visibleRows}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.idm_price_id}
                    disableRowSelectionOnClick
                    columnHeaderHeight={36}
                    rowHeight={38}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    pageSizeOptions={[25, 50, 100]}
                    slots={{ toolbar: CustomToolbar }}
                    localeText={{ noRowsLabel: "No prices found for the selected filters." }}
                    sx={compactGridSx}
                />
            </div>

            <ExcelUploadModal
                open={openUploadModal}
                onClose={() => setOpenUploadModal(false)}
                setRefreshData={setRefreshData}
            />

            {/* Sync from Sales: all the plants at once, for the chosen month */}
            <FormDialog
                open={openSync}
                title="Sync prices from Sales"
                onClose={closeSync}
                width={syncResult ? 820 : 460}
                actions={
                    syncResult ? (
                        <>
                            {syncResult.skipped && syncResult.skipped.length > 0 && (
                                <Button
                                    variant="contained"
                                    disableElevation
                                    onClick={downloadSyncExcel}
                                    startIcon={<FaFileExcel size={13} />}
                                    sx={successButtonSx}
                                    title="Download the skipped materials and the summary"
                                >
                                    Download Excel
                                </Button>
                            )}
                            <Button variant="contained" disableElevation onClick={closeSync} sx={{ ...primaryButtonSx, minWidth: 70 }}>Close</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outlined" onClick={closeSync} disabled={syncing} sx={outlineButtonSx}>Cancel</Button>
                            <Button variant="contained" disableElevation onClick={handleSync} disabled={syncing || syncPlants.length === 0} sx={{ ...primaryButtonSx, minWidth: 90 }}>
                                {syncing ? 'Syncing all plants...' : 'Sync now'}
                            </Button>
                        </>
                    )
                }
            >
                <Box sx={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {!syncResult && (
                        <>
                            <Typography sx={{ fontSize: 12, color: '#1a2233' }}>
                                Plants: <b>all {syncPlants.length} plants you can use</b>
                                <span style={{ color: '#6b7280' }}> ({syncPlants.join(', ')})</span>
                            </Typography>
                            <TextField
                                select
                                size="small"
                                label="Month"
                                value={syncMonth}
                                onChange={(e) => setSyncMonth(e.target.value)}
                                disabled={syncing}
                                sx={compactFieldSx(220, 12)}
                                SelectProps={{ MenuProps: compactMenuProps(12) }}
                            >
                                {syncMonths.map((m) => (
                                    <MenuItem key={m.value} value={m.value} sx={{ fontSize: 12 }}>{m.label}{m.current ? ' (current month)' : ''}</MenuItem>
                                ))}
                            </TextField>
                            <span style={{ fontSize: 11, lineHeight: 1.5, color: '#6b7280' }}>
                                For each active material of the plant in the Material Master, the latest sales record of the chosen month is used:
                                Price = Sale Value in INR ÷ Sales Qty. A price already saved for the material and month is updated, otherwise a new price
                                is added. A material with no sales record that month is left as it is, and a price of 0 or below is skipped (its old price stays).
                                {!syncIsCurrent && ' An earlier month only changes the prices of that month; the other months are not touched.'}
                            </span>
                        </>
                    )}
                    {syncResult && (
                        <>
                            <Typography sx={{ fontSize: 12, color: '#1a2233' }}>
                                Month <b>{syncMonthLabel}</b> &nbsp;·&nbsp; {syncResult.summaries ? syncResult.summaries.length : 0} plants checked
                            </Typography>
                            {syncResult.failed && syncResult.failed.length > 0 && (
                                <Typography sx={{ fontSize: 11.5, color: '#b42323' }}>
                                    Not synced: {syncResult.failed.map((f) => `plant ${f.plant} (${f.message})`).join('; ')}. The other plants were saved.
                                </Typography>
                            )}
                            {syncResult.total && syncResult.total.with_sales === 0 ? (
                                <Typography sx={{ fontSize: 12, color: '#946200' }}>No sales found for the materials of your plants in {syncMonthLabel}, so no price was changed.</Typography>
                            ) : (
                                <Box sx={{ border: '1px solid #e8eaee', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#d0dcf5' }}>
                                                {['Plant', 'Materials', 'With sales', 'No sales', 'Prices saved', 'Updated', 'Added', 'Skipped: no price'].map((h, i) => (
                                                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '4px 8px', fontSize: 10.5 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(syncResult.summaries || []).map((s) => (
                                                <tr key={s.plant} style={{ borderTop: '1px solid #eef0f3' }}>
                                                    <td style={{ padding: '3px 8px', fontWeight: 600 }}>{s.plant}</td>
                                                    {[s.materials, s.with_sales, s.no_sales, s.prices_saved, s.updated, s.inserted, s.skipped_no_value].map((v, i) => (
                                                        <td key={i} style={{ padding: '3px 8px', textAlign: 'right', color: i === 3 ? '#1b7a43' : i === 6 && v > 0 ? '#946200' : '#1a2233' }}>{v}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {syncResult.total && (
                                                <tr style={{ borderTop: '2px solid #b8c7ec', backgroundColor: '#eaf0fc', fontWeight: 700 }}>
                                                    <td style={{ padding: '4px 8px' }}>TOTAL</td>
                                                    {[syncResult.total.materials, syncResult.total.with_sales, syncResult.total.no_sales, syncResult.total.prices_saved, syncResult.total.updated, syncResult.total.inserted, syncResult.total.skipped_no_value].map((v, i) => (
                                                        <td key={i} style={{ padding: '4px 8px', textAlign: 'right' }}>{v}</td>
                                                    ))}
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Box>
                            )}
                            {syncResult.skipped && syncResult.skipped.length > 0 && (
                                <>
                                    <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                                        Skipped materials, the latest sales record has no usable price (INR value or quantity is 0 / empty){syncResult.skipped.length > 500 ? ` - the first 500 of ${syncResult.skipped.length}` : ` - ${syncResult.skipped.length}`}:
                                    </Typography>
                                    <Box sx={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e8eaee', borderRadius: '8px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#d0dcf5', position: 'sticky', top: 0 }}>
                                                    {['Plant', 'Part No', 'Description', 'Sales Date', 'Qty', 'Value INR'].map((h) => (
                                                        <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontSize: 10.5 }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {syncResult.skipped.slice(0, 500).map((s, i) => (
                                                    <tr key={i} style={{ borderTop: '1px solid #eef0f3' }}>
                                                        <td style={{ padding: '3px 8px' }}>{s.plant}</td>
                                                        <td style={{ padding: '3px 8px', fontWeight: 600 }}>{s.part_no}</td>
                                                        <td style={{ padding: '3px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.description || ''}>{s.description || ''}</td>
                                                        <td style={{ padding: '3px 8px' }}>{s.sales_date ? format(new Date(s.sales_date), 'dd-MM-yyyy') : ''}</td>
                                                        <td style={{ padding: '3px 8px' }}>{s.qty}</td>
                                                        <td style={{ padding: '3px 8px' }}>{s.value_inr}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                </>
                            )}
                        </>
                    )}
                </Box>
            </FormDialog>
        </div>
    )
}


const ExcelUploadModal = ({
    open,
    onClose,
    onOpen,
    setRefreshData
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [loadingTemplate, setLoadingTemplate] = useState(false)
    const [uploadResponse, setUploadResponse] = useState(null)

    const handleFileChange = (event) => {
        setUploadedFile(event.target.files[0]);
    };

    const handleClose = () => {
        if (onClose) onClose()
        setUploadedFile(null)
        setUploadResponse(null)
        // setIsUploading(false)
        setRefreshData((prev) => !prev)
    }

    async function downloadProductionPlanTemplate() {
        // 1️⃣ Fetch dropdown data
        // The material type is not asked: the part is found in the Material Master by plant + part number
        const plant = await getMyPlants(); // only the plants this user may use (own plant + Data Access)

        const plantCodes = (Array.isArray(plant) ? plant : []).map((e) => e.Plant_Code);

        // 2️⃣ Create workbook & worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Indirect Material price");

        const headers = [
            "Plant",
            "Part_Number",
            "Price",
            "Eff_Date_(dd-MM-YYYY)",
        ];

        worksheet.addRow(headers);

        // Header styling
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFADD8E6" },
            };
        });

        // Column widths
        worksheet.columns.forEach((col) => (col.width = 22));

        // 4️⃣ APPLY DROPDOWNS (ROW 2 → 1000)

        // Column A → plant
        worksheet.dataValidations.add("A2:A1000", {
            type: "list",
            allowBlank: false,
            formulae: [`"${plantCodes.join(",")}"`],
        });

        // 5️⃣ Date formatting
        // worksheet.getColumn("E").numFmt = "yyyy-mm-dd";
        // worksheet.getColumn("I").numFmt = "yyyy-mm-dd";

        // 6️⃣ Cell styling (rows below header)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            row.eachCell((cell) => {
                cell.alignment = { horizontal: "center" };
                cell.font = { size: 10 };
            });
        });

        // 7️⃣ Download file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer], {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            "Indirect_Material_price_Template.xlsx"
        );
    }


    const handleUploadData = async () => {
        if (!uploadedFile) {
            return alert('Upload file not found')
        }

        if (isUploading) return
        setIsUploading(true)
        try {
            // Only plants this user may use (own + Data Access): check the Plant column of the file before uploading
            const { blocked, plants } = await findPlantsNotAllowed(uploadedFile)
            if (blocked.length > 0) {
                alert(plantsNotAllowedMessage(blocked, plants))
                setIsUploading(false)
                return
            }
            const formData = new FormData()
            const userId = localStorage.getItem('EmpId')
            formData.append("userId", userId)
            formData.append("file", uploadedFile)
            const response = await AddTrnIndirectMaterialPrice_BULK(formData)
            console.log(response.data, "Upload excel response")
            setUploadResponse(response.data)
            alert('File uploaded successfully')
            handleClose()
        } catch (error) {
            console.error("Upload error:", error);

            // ✅ VALIDATION ERROR FROM BACKEND
            if (error.response?.status === 422) {
                setUploadResponse(error.response.data); // <-- show errors in UI
            }
            // ❌ OTHER SERVER ERRORS
            else {
                alert(
                    error.response?.data?.message ||
                    error.message ||
                    "Something went wrong! Try again later."
                );
            }

        }
        setIsUploading(false)
    }

    return (
        <FormDialog
            open={open}
            title="Material Price Excel Upload"
            onClose={handleClose}
            width={uploadResponse ? 860 : 460}
            actions={
                <>
                    <Button variant="outlined" onClick={handleClose} sx={outlineButtonSx}>Close</Button>
                    <Button variant="contained" disableElevation onClick={handleUploadData} disabled={isUploading} sx={{ ...primaryButtonSx, minWidth: 70 }}>
                        {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                </>
            }
        >
            <Box sx={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Box>
                    <Button variant="outlined" onClick={downloadProductionPlanTemplate} startIcon={<FaDownload size={12} />} sx={outlineButtonSx}>
                        {loadingTemplate ? "Loading..." : "Download Template"}
                    </Button>
                </Box>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    style={{
                        fontSize: 11,
                        padding: "6px 8px",
                        backgroundColor: "#fafbfc",
                        border: "1px dashed #dde1e7",
                        borderRadius: 6,
                        cursor: "pointer",
                    }}
                />
                <span style={{ fontSize: 11, lineHeight: 1.5, color: "#6b7280" }}>
                    Columns: Plant, Part_Number, Price and Eff_Date_(dd-MM-YYYY). A part that already has a price for that month is updated; a new one is added.
                    Rows with errors are listed below.
                </span>
            </Box>
            {uploadResponse && <Box sx={{ gridColumn: "span 2" }}><ValidationResult response={uploadResponse} /></Box>}
        </FormDialog>
    );
};


const ValidationResult = ({ response }) => {
    const { summary, errors } = response;

    return (
        <div className="p-4 bg-red-50 rounded-lg border border-red-300">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
                ❌ Upload Failed – Validation Errors
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div>Total Rows: <b>{summary.totalRows}</b></div>
                <div className="text-green-600">Valid: <b>{summary.valid}</b></div>
                <div className="text-red-600">Invalid: <b>{summary.invalid}</b></div>
                <div className="text-yellow-600">Empty: <b>{summary.empty}</b></div>
            </div>

            {/* Invalid rows */}
            {errors.invalidRows.length > 0 && (
                <>
                    <h3 className="font-semibold mb-2">❌ Invalid Rows</h3>

                    <table className="w-full border text-sm">
                        <thead className="bg-red-100">
                            <tr>
                                <th className="border px-2 py-1">Excel Row</th>
                                <th className="border px-2 py-1">Errors</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errors.invalidRows.map((row, i) => (
                                <tr key={i} className="hover:bg-red-50">
                                    <td className="border px-2 py-1 text-center">
                                        {row.row}
                                    </td>
                                    <td className="border px-2 py-1">
                                        <ul className="list-disc pl-4">
                                            {row.errors.map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Empty rows */}
            {errors.emptyRows.length > 0 && (
                <div className="mt-4 text-yellow-700">
                    ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
                </div>
            )}
        </div>
    );
}

export default CC_IndirectMaterialPrice
