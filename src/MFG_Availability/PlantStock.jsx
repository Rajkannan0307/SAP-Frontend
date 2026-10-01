import React, { useState } from "react";
import { Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { MdOutlineCancel } from "react-icons/md";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import MfgListScreen, { compactButtonSx } from "../components/MfgListScreen";
import ValidationResponseGrid from "../components/ValidationResponseTable";
import { GetPlantStockActiveApi, DownloadPlantStockApi, FetchPlantStockApi } from "../controller/MfgBomApiService";

// Error codes that are "nothing to do right now" rather than a real failure —
// shown as a warning toast, not an error toast.
const WARNING_CODES = new Set(["NO_FILE_FOUND", "NO_NEW_FILE"]);

const qtyFmt = (v) => Number(v ?? 0).toLocaleString("en-IN");

const COLUMNS = [
  { field: "plant", headerName: "Plant", width: 80 },
  { field: "storage_location", headerName: "Storage Location", width: 130 },
  { field: "material_code", headerName: "Material Code", width: 150 },
  { field: "material_desc", headerName: "Material Description", flex: 1, minWidth: 200 },
  { field: "uom", headerName: "UOM", width: 70 },
  { field: "unrestricted_qty", headerName: "Unrestricted Qty", width: 130, type: "number", align: "right", headerAlign: "right", renderCell: (p) => qtyFmt(p.value) },
  { field: "quality_inspection_qty", headerName: "Quality Inspection Qty", width: 160, type: "number", align: "right", headerAlign: "right", renderCell: (p) => qtyFmt(p.value) },
  { field: "blocked_qty", headerName: "Blocked Qty", width: 110, type: "number", align: "right", headerAlign: "right", renderCell: (p) => qtyFmt(p.value) },
  { field: "stock_date", headerName: "Stock Date", width: 140 },
  {
    field: "status",
    headerName: "Status",
    width: 90,
    renderCell: (params) => {
      const isActive = Boolean(params.value);
      return (
        <span
          style={{
            padding: "2px 10px", borderRadius: "12px", fontSize: "10.5px", fontWeight: "bold",
            color: "white", backgroundColor: isActive ? "#2e7d32" : "#d32f2f",
          }}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

const SEARCH_FIELDS = ["plant", "storage_location", "material_code", "material_desc"];

const loadRows = (params) => GetPlantStockActiveApi(params);
const downloadExcel = (params) => DownloadPlantStockApi(params);
const downloadFileName = ({ plant }) => `Plant_Stock_${plant}_${new Date().toISOString().slice(0, 10)}.xlsx`;
const getRowId = (row) => row.row_id;

// Stock is a point-in-time snapshot, so say which one the table is showing.
const summary = (rows) =>
  rows.length
    ? `Showing the latest active Plant Stock snapshot (dated ${rows[0].stock_date}) · ${rows.length.toLocaleString("en-IN")} rows`
    : null;

const emptyLabel = ({ searching }) =>
  searching
    ? "No records match your search."
    : "No Plant Stock data found. Click \"Fetch\" to import the latest MB52 file.";

const PlantStock = () => {
  const [fetching, setFetching] = useState(false);
  const [validationResponse, setValidationResponse] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleFetch = async () => {
    // Guard against duplicate clicks while a fetch is already in flight.
    if (fetching) return;
    setFetching(true);
    setValidationResponse(null);
    try {
      const userId = localStorage.getItem("EmpId");
      const response = await FetchPlantStockApi({ userId });
      const result = response.data;
      toast.success(
        `Plant Stock fetched successfully. New snapshot inserted: ${result.inserted} row(s), previous batch deactivated: ${result.inactivated} row(s)${result.purged ? `, old rows deleted: ${result.purged}` : ""}.`
      );
      setReloadKey((k) => k + 1);
    } catch (error) {
      const data = error?.response?.data;
      const code = data?.code;
      const message = data?.message || "An error occurred while fetching Plant Stock. Please try again.";

      if (code === "VALIDATION_FAILED") {
        // Show the same reusable invalid-rows grid used by bulk uploads,
        // instead of just a toast, so the user can see exactly what's wrong.
        setValidationResponse(data);
        toast.error(message);
      } else if (WARNING_CODES.has(code)) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    }
    setFetching(false);
  };

  return (
    <MfgListScreen
      title="Plant Stock"
      columns={COLUMNS}
      getRowId={getRowId}
      searchFields={SEARCH_FIELDS}
      loadRows={loadRows}
      downloadExcel={downloadExcel}
      downloadFileName={downloadFileName}
      summary={summary}
      emptyLabel={emptyLabel}
      showPeriod={false}
      downloadWithDateRange={false}
      allowAllPlants
      reloadKey={reloadKey}
      extraActions={
        <Button
          variant="contained"
          disableElevation
          onClick={handleFetch}
          disabled={fetching}
          startIcon={fetching ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 15 }} />}
          sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          title="Fetch the latest MB52 Plant Stock file from the FTP source"
        >
          {fetching ? "Fetching..." : "Fetch"}
        </Button>
      }
    >
      <Dialog
        open={Boolean(validationResponse)}
        onClose={() => setValidationResponse(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pl: 2, pr: 1, py: 1 }}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-semibold text-red-600">MB52 Validation Errors</div>
            <IconButton size="small" onClick={() => setValidationResponse(null)}>
              <MdOutlineCancel size={20} />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {validationResponse && <ValidationResponseGrid response={validationResponse} />}
        </DialogContent>
      </Dialog>
    </MfgListScreen>
  );
};

export default PlantStock;
