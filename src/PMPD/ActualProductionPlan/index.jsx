import React, { useContext, useEffect, useMemo, useState } from 'react'
import SectionHeading from '../../components/Header'
import { Box, Button, CircularProgress, IconButton, MenuItem, Modal, TextField, Tooltip, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { CloudUploadIcon, EditIcon, SearchIcon } from 'lucide-react'
import { PiUploadDuotone } from 'react-icons/pi'
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { deepPurple } from '@mui/material/colors';
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getPlantdetails } from '../../controller/CommonApiService'
import { AddTrnActualProdPlan_BULK, downloadTrnActualProdPlanExcel, fetchProdDataMB51, getActualProdLookup, getTrnActualProdPlan } from '../../controller/PMPDApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import { format, isValid } from 'date-fns'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'
import { AuthContext } from '../../Authentication/AuthContext'
import ValidationResponseGrid from '../../components/ValidationResponseTable'
import DateRangeDownloadDialog from '../../components/DateRangeDownloadDialog'
import FilterSelect from '../../components/FilterSelect'
import { FilterPanel, FilterToggleButton } from '../../components/FilterPanel'
import { getdetails as getLines } from '../../controller/LineMasterapiservice'

// Month/Year filter helpers - the month converts to the Start/End date range
// the backend expects (plain 'YYYY-MM-DD' strings, no timezone involved).
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const padNum = (n) => String(n).padStart(2, '0')
const monthStartStr = (year, month) => `${year}-${padNum(month)}-01`
const monthEndStr = (year, month) => `${year}-${padNum(month)}-${padNum(new Date(year, month, 0).getDate())}`

// A blob-typed request returns its error body as a Blob too - read the
// backend's { message } out of it.
const downloadErrorMessage = async (error) => {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text())
      if (parsed?.message) return parsed.message
    } catch (_) { /* not JSON */ }
  }
  return data?.message || error?.message || 'Failed to download the Excel file.'
}

// Compact filter-field/button styling — same design tokens as the MFG Daily
// Production Plan screen's own filter toolbar, copied verbatim so both
// screens share one visual language.
const compactFieldSx = (minWidth) => ({
  minWidth,
  flexShrink: 0,
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#fafbfc",
    minHeight: 30,
    display: "flex",
    alignItems: "center",
    padding: "0 7px !important",
    "& fieldset": { borderColor: "#dde1e7" },
    "&:hover fieldset": { borderColor: "#0066FF" },
    "&.Mui-focused fieldset": { borderColor: "#0066FF", borderWidth: "1.5px" },
    "&.Mui-disabled": {
      backgroundColor: "#f1f2f5",
      cursor: "not-allowed",
      "& fieldset": { borderColor: "#e2e4e9", borderStyle: "dashed" },
    },
  },
  "& .MuiInputBase-input, & .MuiSelect-select, & .MuiAutocomplete-input": {
    padding: "0 !important",
    fontSize: 11,
  },
  "& .Mui-disabled": { cursor: "not-allowed", WebkitTextFillColor: "#a4a9b3" },
  "& .MuiAutocomplete-endAdornment": { right: 4 },
  "& .MuiInputLabel-root": { fontSize: 11, color: "#6b7280" },
  "& .MuiInputLabel-root.Mui-disabled": { color: "#b6bac3" },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": { fontSize: 10.5, transform: "translate(7px, -7px) scale(0.85)" },
});

const compactButtonSx = {
  height: 30,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "6px",
  boxShadow: "none",
  padding: "0 10px",
  whiteSpace: "nowrap",
};

// STEP 1 — only these movement types are read at all: moment_type IN (101, 102, 261, 262).
// Every other movement type is ignored before anything is grouped or summed.
const ALLOWED_MOVEMENTS = ['101', '102', '261', '262']
// STEP 2 — movement types counted under each Material Type (anything else -> Others)
const FERT_MOVEMENTS = ['101', '102', '261', '262']
const HALB_MOVEMENTS = ['101', '102']

const PMPD_ActualProductionPlan = () => {
  const [searchText, setSearchText] = useState("");
  // originalRows = raw records from the existing API; the table shows them
  // summed per Plant + Part Number + Material Type (see summaryRows below).
  const [lookup, setLookup] = useState({ materials: [], pmpd: [] });
  const [materialTypeFilter, setMaterialTypeFilter] = useState("All");
  const [pmpdFilter, setPmpdFilter] = useState("All");
  const [lineFilter, setLineFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [lines, setLines] = useState([]);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [originalRows, setOriginalRows] = useState([]);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [refreshData, setRefreshData] = useState(false)
  const [fetchingProdData, setFetchingProdData] = useState(false)
  const { user } = useContext(AuthContext);
  const currentUserPlantCode = user.PlantCode

  // Manual trigger for the MB51 Prod Data auto-upload — runs the exact same
  // insert-only processing the every-4-hours cron already does.
  const handleFetchProdData = async () => {
    if (fetchingProdData) return
    setFetchingProdData(true)
    try {
      const userId = localStorage.getItem('EmpId')
      const result = await fetchProdDataMB51(userId)
      alert(result?.message || 'MB51 Prod Data fetched successfully.')
      setRefreshData((prev) => !prev)
    } catch (error) {
      console.error('Fetch MB51 Prod Data error:', error)
      alert(
        error.response?.data?.message ||
        error.message ||
        'Something went wrong while fetching MB51 Prod Data.'
      )
    }
    setFetchingProdData(false)
  }

  const PMPDAccess = getPMPDAccess()

  const handleSearch = () => {
    setAppliedSearch(searchText.trim().toLowerCase());
  };

  // Step 1: only movement types 101/102/261/262 are used (everything else is dropped
  // up front). Step 2: one row per Plant + Part Number + Month with the SUM of
  // prod_qty. Material Type comes from the ACTIVE Material Master record. FERT
  // counts movement types 101/102/261/262 and HALB only 101/102; a part that is
  // not in Material Master, is another type, or has no record with an allowed
  // movement type is listed under Others (with all of its remaining quantity).
  // PMPD = Yes when the Plant + Part Number exists in PMPD Master.
  const summaryRows = useMemo(() => {
    const key = (v) => String(v ?? "").trim().toLowerCase()
    const typeByPart = new Map()
    const lineByPart = new Map()
    lookup.materials.forEach((m) => {
      const k = key(m.part_number)
      if (!typeByPart.has(k)) { typeByPart.set(k, m.material_type); lineByPart.set(k, m.line_name || '') }
    })
    const pmpdParts = new Set(lookup.pmpd.map(key))
    const monthOf = (r) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(r.prod_date || ''))
      const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, 1) : (r.prod_date ? new Date(r.prod_date) : null)
      return d && isValid(d) ? format(d, "MMM-yyyy") : ""
    }

    const parts = new Map()
    originalRows
      .filter((r) => ALLOWED_MOVEMENTS.includes(String(r.moment_type ?? '').trim()))
      .forEach((r) => {
        const k = `${r.plant}|${key(r.part_number)}|${monthOf(r)}`
        if (!parts.has(k)) parts.set(k, { k, records: [], sample: r, month: monthOf(r) })
        parts.get(k).records.push(r)
      })

    return Array.from(parts.values()).map(({ k, records, sample, month }) => {
      const matType = typeByPart.get(key(sample.part_number))
      const allowed = matType === 'FERT' ? FERT_MOVEMENTS : matType === 'HALB' ? HALB_MOVEMENTS : null
      const counted = allowed ? records.filter((r) => allowed.includes(String(r.moment_type ?? '').trim())) : []
      const isListed = allowed && counted.length > 0
      const materialType = isListed ? matType : 'Others'
      const used = isListed ? counted : records
      let othersReason = ''
      if (!isListed) {
        if (matType === undefined) othersReason = 'Part Number is not found (or is inactive) in Material Master for this plant.'
        else if (allowed) othersReason = `Material Master type is ${matType}, but none of its movement types are in ${allowed.join(', ')}.`
        else othersReason = `Material Master type is ${matType || '(blank)'}; only FERT and HALB are listed separately.`
      }
      return {
        id: k,
        plant: sample.plant,
        month,
        part_number: sample.part_number,
        description: (used.find((r) => r.description) || {}).description || "",
        material_type: materialType,
        line_name: lineByPart.get(key(sample.part_number)) || '',
        not_in_material_master: matType === undefined,
        others_reason: othersReason,
        prod_qty: used.reduce((sum, r) => sum + (Number(r.prod_qty) || 0), 0),
        pmpd: pmpdParts.has(key(sample.part_number)) ? "Yes" : "No",
      }
    })
  }, [originalRows, lookup])

  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(false)

  const validationschema = yup.object({
    plant: yup.string().required('Required'),
    month: yup.number().required('Required'),
    year: yup.number().required('Required'),
  })

  const formik = useFormik({
    initialValues: {
      plant: currentUserPlantCode,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      type: "SUBMIT"
    },
    validationSchema: validationschema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await loadMonthData(values)
    }
  })

  // Optional Line filter: the options are the lines of the selected plant (Line Master), searchable;
  // "(No line)" = material without a line.
  const NO_LINE = '(No line)'
  const lineOptions = useMemo(() => {
    const names = (lines || [])
      .filter((l) => l.Active_Status && String(l.Plant_Code) === String(formik.values.plant))
      .map((l) => l.Line_Name)
    return [...new Set(names)].sort((x, y) => x.localeCompare(y)).concat(NO_LINE)
  }, [lines, formik.values.plant])
  const activeLine = lineOptions.includes(lineFilter) ? lineFilter : 'All'
  const activeFilterCount = (materialTypeFilter !== 'All' ? 1 : 0) + (activeLine !== 'All' ? 1 : 0) + (pmpdFilter !== 'All' ? 1 : 0)
  const clearFilters = () => { setMaterialTypeFilter('All'); setLineFilter('All'); setPmpdFilter('All') }

  const filteredRows = useMemo(() => summaryRows.filter((row) => {
    if (activeLine !== 'All' && (row.line_name || NO_LINE) !== activeLine) return false
    if (materialTypeFilter !== "All" && row.material_type !== materialTypeFilter) return false
    if (pmpdFilter !== "All" && row.pmpd !== pmpdFilter) return false
    if (!appliedSearch) return true
    // Typing exactly "yes" / "no" searches the PMPD Yes/No column only
    // (a plain substring match on "no" would hit unrelated descriptions).
    if (appliedSearch === 'yes' || appliedSearch === 'no') return row.pmpd.toLowerCase() === appliedSearch
    return ['plant', 'month', 'part_number', 'description', 'material_type'].some((k) =>
      String(row[k] ?? '').toLowerCase().includes(appliedSearch)
    )
  }), [summaryRows, materialTypeFilter, pmpdFilter, activeLine, appliedSearch])

  // Loads the selected Month/Year (first to last day) for the selected plant.
  async function loadMonthData(values) {
    if (loading) return
    setLoading(true)
    try {
      const response = await getTrnActualProdPlan({
        plant: values.plant,
        startDate: monthStartStr(values.year, values.month),
        endDate: monthEndStr(values.year, values.month),
      })
      setOriginalRows(response || [])
      try {
        setLookup(await getActualProdLookup({ plant: values.plant }))
      } catch (lookupError) {
        console.error('Load Material Master lookup error:', lookupError)
        setLookup({ materials: [], pmpd: [] })
        alert('Could not load Material Master / PMPD details. Material Type and PMPD may be shown incorrectly.')
      }
    } catch (error) {
      console.error('Load Production Actual error:', error)
      setOriginalRows([])
      alert(error.response?.data?.message || error.message || 'Failed to load Production Actual data.')
    }
    setLoading(false)
  }

  // Current month loads by default for the user's own plant; re-loads after a
  // manual Fetch or an Excel upload (both toggle refreshData).
  useEffect(() => {
    if (formik.values.plant) loadMonthData(formik.values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshData])

  const [downloadOpen, setDownloadOpen] = useState(false)

  const handleDownloadExcel = async (startDate, endDate) => {
    try {
      const blob = await downloadTrnActualProdPlanExcel({ plant: formik.values.plant, startDate, endDate })
      saveAs(blob, `Production_Actual_${formik.values.plant}_${startDate}_to_${endDate}.xlsx`)
    } catch (error) {
      console.error('Download Production Actual error:', error)
      alert(await downloadErrorMessage(error))
      throw error // keep the popup open so the range can be adjusted
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const resposne = await getPlantdetails()
      setPlants(resposne)
    }
    fetchData()
    getLines().then((r) => setLines(r || [])).catch((e) => console.error('Load Line Master error:', e))
  }, [])

  // const columns = [
  //   { field: "act_prod_id", headerName: "SI No", width: 80 },
  //   { field: "plant", headerName: "Plant", width: 150 },
  //   { field: "part_number", headerName: "Part No", width: 230 },
  //   { field: "description", headerName: "Description", flex: 1 },
  //   { field: "prod_qty", headerName: "Prod Qty", width: 150 },
  //   { field: "prod_date", headerName: "Prod Date", width: 150, renderCell: (params) => (<>{params.value ? format(params.value, "dd-MM-yyyy") : ""}</>) },
  //   // {
  //   //     field: "action", headerName: "Action", width: 160,
  //   //     renderCell: (params) => (
  //   //         <IconButton
  //   //             color="primary"
  //   //             // onClick={() => handleEdit(params.row)}
  //   //             title="Edit"
  //   //         >
  //   //             <EditIcon />
  //   //         </IconButton>
  //   //     ),
  //   // },
  // ];

  const columns = [
    { field: "plant", headerName: "Plant", width: 100 },
    {
      field: "material_type", headerName: "Material Type", width: 200,
      renderCell: (params) => {
        const cell = params.row.not_in_material_master
          ? <span>Others <span style={{ color: "#d32f2f", fontSize: 10 }}>(Not in Material Master / inactive)</span></span>
          : <span>{params.value}</span>
        if (!params.row.others_reason) return cell
        return (
          <Tooltip
            arrow
            placement="top"
            title={params.row.others_reason}
            slotProps={{
              popper: { disablePortal: false, modifiers: [{ name: 'preventOverflow', options: { padding: 8 } }, { name: 'flip', enabled: true }] },
              tooltip: { sx: { bgcolor: "#1f2937", color: "#fff", fontSize: 11, lineHeight: 1.4, borderRadius: "6px", padding: "6px 10px", maxWidth: 260, boxShadow: "0 4px 12px rgba(16,24,40,0.2)" } },
              arrow: { sx: { color: "#1f2937" } },
            }}
          >
            {cell}
          </Tooltip>
        )
      }
    },
    { field: "month", headerName: "Month", width: 120 },
    { field: "part_number", headerName: "Part Number", width: 180 },
    { field: "description", headerName: "Description", flex: 1, minWidth: 200 },
    { field: "prod_qty", headerName: "Prod Qty", width: 120, type: 'number' },
    { field: "pmpd", headerName: "PMPD", width: 100, type: "singleSelect", valueOptions: ["Yes", "No"] },
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
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 90px)",
      }}
    >
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SectionHeading>
          Production Actual
        </SectionHeading>
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField
            select
            size="small"
            label="Plant"
            name="plant"
            value={formik.values.plant}
            onChange={formik.handleChange}
            sx={compactFieldSx(190)}
            disabled={PMPDAccess.disableAction}
            error={formik.touched.plant && Boolean(formik.errors.plant)}
            helperText={formik.touched.plant && formik.errors.plant}
          >
            {plants.map((p) => (
              <MenuItem sx={{ fontSize: 11.5 }} key={p.Plant_ID} value={p.Plant_Code}>
                {`${p.Plant_Code} - ${p.Plant_Name}`}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            id="month"
            select
            size="small"
            label="Month"
            name="month"
            value={formik.values.month}
            onChange={formik.handleChange}
            sx={compactFieldSx(130)}
          >
            {MONTH_NAMES.map((name, idx) => (
              <MenuItem key={name} value={idx + 1} sx={{ fontSize: 11.5 }}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            id="year"
            select
            size="small"
            label="Year"
            name="year"
            value={formik.values.year}
            onChange={formik.handleChange}
            sx={compactFieldSx(100)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: 11.5 }}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            disableElevation
            onClick={(e) => {
              formik.setFieldValue('type', 'SUBMIT')
              formik.handleSubmit(e)
            }}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Submit"}
          </Button>
        </div>

        {/* Search and Icons Section */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12
          }}
        >
          {/* Search Box - requester */}
          <div style={{ display: "flex", gap: 8 }}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Type here..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyUp={handleSearch}
              sx={compactFieldSx(260)}
            />
            <Button
              onClick={handleSearch}
              variant="outlined"
              disableElevation
              startIcon={<SearchIcon size={15} />}
              sx={{ ...compactButtonSx, borderColor: "#0066FF", color: "#0066FF", "&:hover": { borderColor: "#0052cc", backgroundColor: "#f0f6ff" } }}
            >
              Search
            </Button>
            <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen((o) => !o)} activeCount={activeFilterCount} />
          </div>
          <Button
            variant="contained"
            disableElevation
            onClick={() => setDownloadOpen(true)}
            disabled={!formik.values.plant}
            startIcon={<FaDownload size={12} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
            title="Download records for a date range as Excel"
          >
            Excel Download
          </Button>
        </div>

        <FilterPanel
          open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}
          actions={(
            <div style={{ display: PMPDAccess.disableAction ? "none" : "flex", gap: 8, alignItems: "center" }}>
              <Button
                variant="contained"
                disableElevation
                onClick={handleFetchProdData}
                disabled={fetchingProdData}
                startIcon={fetchingProdData ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 15 }} />}
                sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
                title="Fetch latest MB51 Prod Data from the FTP source and insert new records"
              >
                {fetchingProdData ? "Fetching..." : "Fetch"}
              </Button>
              <ExcelUploadModal open={openUploadModal}
                onClose={() => {
                  setOpenUploadModal(false)
                }}
                onOpen={() => {
                  setOpenUploadModal(true)
                }}
                templateUrl={""}
                setRefreshData={setRefreshData}
              />
            </div>
          )}
        >
          <FilterSelect label="Material Type" value={materialTypeFilter} options={['FERT', 'HALB', 'Others']} onChange={setMaterialTypeFilter} minWidth={150} />
          <FilterSelect label="Line" value={activeLine} options={lineOptions} onChange={setLineFilter} minWidth={190} />
          <FilterSelect label="PMPD" value={pmpdFilter} options={['Yes', 'No']} onChange={setPmpdFilter} minWidth={120} />
        </FilterPanel>

      </div>


      {/* DataGrid — compact enterprise styling matching the MFG Daily
          Production Plan grid (header #d0dcf5/bold 10.5px, 11px cells,
          zebra rows, hover tint, compact toolbar/footer). Only visual
          styling changed here; rows/columns/pagination/behavior untouched. */}
      <div
        style={{
          flexGrow: 1, // Ensures it grows to fill the remaining space
          minHeight: 0,
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSize={5} // Set the number of rows per page to 8
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.id} // Specify a custom id field
          disableSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          slots={{ toolbar: CustomToolbar }}
          sx={{
            height: "100%",
            border: "none",
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": { color: "#333", fontSize: "11px", padding: "0 8px", borderRight: "none" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaders": { position: "sticky", top: 0, zIndex: 2 },
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#d0dcf5", color: "#000000", padding: "0 8px" },
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10.5px", fontWeight: "bold", color: "#000000" },
            "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "#000000" },
            "& .MuiDataGrid-row": { backgroundColor: "#fff" },
            "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#fafbfc" },
            "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
            "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
            "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 28 },
            "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
            "& .MuiDataGrid-footerContainer": { minHeight: 34 },
            "& .MuiTablePagination-root": { overflow: "visible" },
            "& .MuiTablePagination-toolbar": {
              minHeight: "34px !important",
              height: 34,
              paddingLeft: 8,
              paddingRight: 4,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: 11, marginTop: 0, marginBottom: 0,
            },
            "& .MuiTablePagination-select": {
              fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset",
            },
            "& .MuiTablePagination-selectIcon": { fontSize: 16 },
          }}
        />
      </div>


      <DateRangeDownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onDownload={handleDownloadExcel}
        defaultStart={monthStartStr(formik.values.year, formik.values.month)}
        defaultEnd={monthEndStr(formik.values.year, formik.values.month)}
        title="Download Production Actual"
      />
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
    const [plant,
      // prod_segments
    ] = await Promise.all([
      getPlantdetails(),
      // getProductSegmentdetails(),
    ]);

    const plantCodes = plant.map((e) => e.Plant_Code);
    // const prodSegNames = prod_segments.map((e) => e.seg_name);
    // const planTypes = ["AOP", "MP"];

    // 2️⃣ Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Actual Prod Plan");

    const headers = [
      "Plant",
      "Moment_Type",
      "Storage_Loc",
      "Prod_Date",
      "Part_Number",
      "Description",
      "Prod_Qty",
      "Prod_Order",
      "Material_Doc",
      "Entry_Time_hh_mm_ss",
      "Reservation_Item_No"
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
    worksheet.getColumn("D").numFmt = "yyyy-mm-dd";
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
      "Actual_Production_Plan_Template.xlsx"
    );
  }


  const handleUploadData = async () => {
    if (!uploadedFile) {
      return alert('Upload file not found')
    }

    if (isUploading) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      const userId = localStorage.getItem('EmpId')
      formData.append("userId", userId)
      formData.append("file", uploadedFile)
      const response = await AddTrnActualProdPlan_BULK(formData)
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
    <>
      <Button
        variant="contained"
        disableElevation
        onClick={() => {
          if (onOpen) onOpen()
        }}
        startIcon={<CloudUploadIcon size={15} />}
        sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
      >
        Upload
      </Button>

      <Modal open={open} onClose={() => { }}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: uploadResponse ? "50%" : "30%",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,

            maxHeight: "80vh",
            overflowY: "auto",

            outline: "none"
          }}
        >
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
            }}
          >
            Upload Excel File
          </Typography>

          {/* Download Template */}
          <Button
            variant="contained"
            sx={{
              mb: 2,
              bgcolor: deepPurple[500],
              "&:hover": { bgcolor: deepPurple[700] },
            }}
            onClick={downloadProductionPlanTemplate}
          // onClick={createStyledDropdownExcel}
          >
            <FaDownload /> &nbsp; {loadingTemplate ? "Loading..." : "Download Template"}
          </Button>

          {/* Hidden File Input */}
          <input
            type="file"
            accept=".xlsx,.xls"
            id="excel-upload"
            hidden
            onChange={handleFileChange}
          />

          {/* Custom File Upload UI */}
          <label htmlFor="excel-upload">
            <Box
              sx={{
                border: "2px dashed #1976d2",
                borderRadius: "8px",
                p: 2,
                cursor: "pointer",
                mb: 1,
                "&:hover": {
                  backgroundColor: "#f4f6fb",
                },
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1
              }}
            >
              <FaUpload />
              <Typography variant="body2" >
                {uploadedFile?.name || "Click to choose Excel file"}
              </Typography>
            </Box>
          </label>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              my: 3,
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={handleClose}
              sx={{ width: "30%" }}
            >
              Close
            </Button>

            <Button
              variant="contained"
              onClick={handleUploadData}
              disabled={isUploading}
              sx={{ width: "30%" }}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </Box>

          {/* Upload Status */}
          {uploadResponse && <ValidationResponseGrid response={uploadResponse} />}


        </Box>
      </Modal>
    </>
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



export default PMPD_ActualProductionPlan
