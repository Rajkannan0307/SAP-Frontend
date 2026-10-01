import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton } from "@mui/x-data-grid";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import SectionHeading from "./Header";
import DateRangeDownloadDialog from "./DateRangeDownloadDialog";
import { AuthContext } from "../Authentication/AuthContext";
import { getPlantdetails } from "../controller/CommonApiService";

/* ============================================================
   MfgListScreen — the shared "plant + month/year list" screen used by
   Subcontract Daily Plan, Plant Stock and Supplier Stock, so all of them have
   exactly the same look and behaviour:
     heading -> filter card (Plant, Month, Year, Submit | Search, extra
     actions, Excel Download) -> compact paginated DataGrid.
   The current month loads by default for the user's own plant. Excel Download
   opens the shared Start/End date popup and the backend builds the file.

   Props
     title              screen heading
     columns            DataGrid columns (an auto "SI No" column is prepended)
     getRowId           (row) => unique id
     searchFields       row keys the search box looks in
     loadRows           async ({ plant, startDate, endDate }) => rows
     downloadExcel      async ({ plant, startDate, endDate }) => Blob
     downloadFileName   ({ plant, startDate, endDate }) => file name
     downloadTitle      popup title
     downloadWithDateRange  true (default): Excel Download opens the Start/End date popup.
                        false: one click downloads exactly what the list shows (the
                        callbacks then get only { plant }) - no popup
     prepareRows        optional (rows) => rows with extra display fields
     summary            optional (rows, { periodLabel }) => caption under the filters
     emptyLabel         optional ({ periodLabel, searching }) => empty-grid text
     plantDisabled      lock the Plant dropdown (view-only roles)
     showPeriod         show Month/Year filters (default true). When false the screen
                        has the Plant filter only and loadRows gets just { plant }
     allowAllPlants     add an "All Plants" option (the default); loadRows/downloadExcel
                        then receive no plant
     extraActions       node rendered before Excel Download (e.g. a Fetch button)
     reloadKey          change it to reload the current filters (e.g. after Fetch)
     children           anything rendered after the grid (dialogs)
   ============================================================ */

// Compact filter-field/button styling — same design tokens as the Production
// Actual and MFG Daily Plan screens.
export const compactFieldSx = (minWidth) => ({
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
  "& .MuiInputBase-input, & .MuiSelect-select, & .MuiAutocomplete-input": { padding: "0 !important", fontSize: 11 },
  "& .Mui-disabled": { cursor: "not-allowed", WebkitTextFillColor: "#a4a9b3" },
  "& .MuiInputLabel-root": { fontSize: 11, color: "#6b7280" },
  "& .MuiInputLabel-root.Mui-disabled": { color: "#b6bac3" },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": { fontSize: 10.5, transform: "translate(7px, -7px) scale(0.85)" },
});

export const compactButtonSx = {
  height: 30, fontSize: 11, fontWeight: 600, textTransform: "none", borderRadius: "6px",
  boxShadow: "none", padding: "0 10px", whiteSpace: "nowrap",
};

// Sentinel for the "All Plants" option (an empty MUI select value renders blank).
const ALL_PLANTS = "ALL";
const apiPlantOf = (plant) => (plant === ALL_PLANTS ? undefined : plant);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n) => String(n).padStart(2, "0");
const monthStartStr = (year, month) => `${year}-${pad(month)}-01`;
const monthEndStr = (year, month) => `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;

// A blob-typed axios request returns its error body as a Blob too — read the
// backend's { message } out of it so the user sees the real reason.
const errorMessageFrom = async (error, fallback) => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } catch (_) { /* not JSON */ }
  }
  return data?.message || error?.message || fallback;
};

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
  </GridToolbarContainer>
);

const MfgListScreen = ({
  title,
  columns,
  getRowId,
  searchFields,
  loadRows,
  downloadExcel,
  downloadFileName,
  downloadTitle,
  prepareRows,
  summary,
  emptyLabel,
  plantDisabled = false,
  showPeriod = true,
  downloadWithDateRange = true,
  allowAllPlants = false,
  extraActions = null,
  reloadKey,
  children = null,
}) => {
  const { user } = useContext(AuthContext);

  const now = new Date();
  const [plants, setPlants] = useState([]);
  const [plant, setPlant] = useState(allowAllPlants ? ALL_PLANTS : user?.PlantCode || "");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  useEffect(() => {
    getPlantdetails()
      .then((res) => setPlants(res || []))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load Plant list.");
      });
  }, []);

  const loadData = useCallback(async () => {
    if (!plant) {
      toast.warning("Please select a Plant first.");
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const data = await loadRows(
        showPeriod
          ? { plant: apiPlantOf(plant), startDate: monthStartStr(year, month), endDate: monthEndStr(year, month) }
          : { plant: apiPlantOf(plant) }
      );
      setRows(data || []);
      setLoaded(true);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    } catch (error) {
      console.error(error);
      setRows([]);
      setLoadError(error?.response?.data?.message || `Failed to load ${title} data.`);
    } finally {
      setLoading(false);
    }
    // loadRows is a stable function per screen; filters are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant, month, year, showPeriod]);

  // Current month loads by default for the user's own plant.
  useEffect(() => {
    if (plant) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload with the current filters when the screen asks (e.g. after Fetch).
  const firstReloadKey = useRef(true);
  useEffect(() => {
    if (firstReloadKey.current) {
      firstReloadKey.current = false;
      return;
    }
    if (plant) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // One-click download of the listed data (no date range).
  const [directDownloading, setDirectDownloading] = useState(false);
  const handleDirectDownload = async () => {
    if (directDownloading) return;
    setDirectDownloading(true);
    try {
      const blob = await downloadExcel({ plant: apiPlantOf(plant) });
      saveAs(blob, downloadFileName({ plant: apiPlantOf(plant) || "All" }));
    } catch (error) {
      console.error(error);
      toast.error(await errorMessageFrom(error, "Failed to download the Excel file."));
    } finally {
      setDirectDownloading(false);
    }
  };

  const handleDownload = async (startDate, endDate) => {
    try {
      const blob = await downloadExcel({ plant: apiPlantOf(plant), startDate, endDate });
      saveAs(blob, downloadFileName({ plant: apiPlantOf(plant) || "All", startDate, endDate }));
    } catch (error) {
      console.error(error);
      toast.error(await errorMessageFrom(error, "Failed to download the Excel file."));
      throw error; // keep the popup open so the range can be adjusted
    }
  };

  const displayRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const prepared = prepareRows ? prepareRows(rows) : rows;
    const filtered = q
      ? prepared.filter((r) => searchFields.some((k) => String(r[k] ?? "").toLowerCase().includes(q)))
      : prepared;
    return filtered.map((r, i) => ({ ...r, si: i + 1 }));
    // prepareRows/searchFields are static per screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, searchText]);

  const allColumns = useMemo(
    () => [{ field: "si", headerName: "SI No", width: 70, sortable: false }, ...columns],
    [columns]
  );

  // Without a Month/Year filter the download popup starts from the current month.
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const searching = Boolean(searchText.trim());
  const summaryText = loaded && !loadError && summary ? summary(rows, { periodLabel }) : null;

  return (
    <div
      style={{
        padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px",
        display: "flex", flexDirection: "column", height: "calc(100vh - 90px)",
      }}
    >
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHeading>{title}</SectionHeading>
      </div>

      <div
        style={{
          backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)", padding: "7px 10px", marginBottom: 12,
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField
            select size="small" label="Plant" value={plant}
            onChange={(e) => setPlant(e.target.value)}
            disabled={plantDisabled}
            sx={compactFieldSx(190)}
          >
            {allowAllPlants && (
              <MenuItem sx={{ fontSize: 11.5, fontWeight: 600 }} value={ALL_PLANTS}>All Plants</MenuItem>
            )}
            {plants.map((p) => (
              <MenuItem sx={{ fontSize: 11.5 }} key={p.Plant_ID} value={p.Plant_Code}>
                {`${p.Plant_Code} - ${p.Plant_Name}`}
              </MenuItem>
            ))}
          </TextField>

          {showPeriod && (
            <>
            <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={compactFieldSx(130)}>
              {MONTH_NAMES.map((name, idx) => (
                <MenuItem key={name} value={idx + 1} sx={{ fontSize: 11.5 }}>{name}</MenuItem>
              ))}
            </TextField>

            <TextField select size="small" label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={compactFieldSx(100)}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <MenuItem key={y} value={y} sx={{ fontSize: 11.5 }}>{y}</MenuItem>
              ))}
            </TextField>
            </>
          )}

          <Button
            variant="contained" disableElevation onClick={() => loadData()} disabled={loading}
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Submit"}
          </Button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField
            size="small" variant="outlined" placeholder="Search all columns..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPaginationModel((prev) => ({ ...prev, page: 0 })); }}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
            sx={compactFieldSx(240)}
          />
          {extraActions}
          <Button
            variant="contained" disableElevation
            onClick={downloadWithDateRange ? () => setDownloadOpen(true) : handleDirectDownload}
            disabled={!plant || directDownloading}
            startIcon={directDownloading ? <CircularProgress size={14} color="inherit" /> : <FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
            title={downloadWithDateRange ? "Download records for a date range as Excel" : "Download the listed data as Excel"}
          >
            {directDownloading ? "Downloading..." : "Excel Download"}
          </Button>
        </div>
      </div>

      {summaryText && (
        <Typography sx={{ fontSize: 11, color: "#6b7280", mb: 1, ml: 0.5 }}>{summaryText}</Typography>
      )}

      {loadError && (
        <Alert
          severity="error" sx={{ mb: 1.5, fontSize: 12, py: 0 }}
          action={<Button color="inherit" size="small" onClick={() => loadData()} sx={{ fontSize: 11, textTransform: "none" }}>Retry</Button>}
        >
          {loadError}
        </Alert>
      )}

      <div
        style={{
          flexGrow: 1, minHeight: 0, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)", overflow: "hidden",
        }}
      >
        <DataGrid
          rows={displayRows}
          columns={allColumns}
          getRowId={getRowId}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnMenu
          columnHeaderHeight={36}
          rowHeight={38}
          slots={{ toolbar: CustomToolbar }}
          localeText={{
            noRowsLabel: loadError
              ? "Could not load data."
              : loaded
                ? (emptyLabel ? emptyLabel({ periodLabel, searching }) : (searching ? "No records match your search." : `No records found for ${periodLabel}.`))
                : "",
          }}
          sx={{
            height: "100%", border: "none",
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
            "& .MuiTablePagination-toolbar": { minHeight: "34px !important", height: 34, paddingLeft: 8, paddingRight: 4 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 11, marginTop: 0, marginBottom: 0 },
            "& .MuiTablePagination-select": { fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset" },
            "& .MuiTablePagination-selectIcon": { fontSize: 16 },
            "& .MuiTablePagination-actions .MuiIconButton-root": { padding: 4, width: 24, height: 24 },
          }}
        />
      </div>

      {downloadWithDateRange && (
        <DateRangeDownloadDialog
          open={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          onDownload={handleDownload}
          defaultStart={monthStartStr(year, month)}
          defaultEnd={monthEndStr(year, month)}
          title={downloadTitle || `Download ${title}`}
        />
      )}

      {children}
    </div>
  );
};

export default MfgListScreen;
