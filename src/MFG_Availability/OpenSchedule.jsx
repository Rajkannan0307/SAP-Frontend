import React, { useState } from "react";
import { Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { MdOutlineCancel } from "react-icons/md";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import MfgListScreen, { compactButtonSx } from "../components/MfgListScreen";
import InfoHover, { InfoChip, InfoSection } from "../components/InfoHover";
import TCodeBadge from "../components/TCodeBadge";
import ValidationResponseGrid from "../components/ValidationResponseTable";
import { GetOpenScheduleActiveApi, DownloadOpenScheduleApi, FetchOpenScheduleApi } from "../controller/MfgBomApiService";

// Error codes that are "nothing to do right now" rather than a real failure —
// shown as a warning toast, not an error toast.
const WARNING_CODES = new Set(["NO_FILE_FOUND", "NO_NEW_FILE"]);

const T_CODE = "ZM055";

const qtyFmt = (v) => Number(v ?? 0).toLocaleString("en-IN");
const qtyCell = (p) => qtyFmt(p.value);

const COLUMNS = [
  { field: "plant", headerName: "Plant", width: 80 },
  { field: "delivery_date", headerName: "Delivery Date", width: 120 },
  { field: "po_no", headerName: "PO No.", width: 120 },
  { field: "vendor_code", headerName: "Vendor Code", width: 110 },
  { field: "vendor_name", headerName: "Vendor Name", flex: 1, minWidth: 180 },
  { field: "material_code", headerName: "Material Code", width: 140 },
  { field: "material_desc", headerName: "Material Description", flex: 1, minWidth: 200 },
  { field: "sched_qty", headerName: "Scheduled Qty", width: 120, type: "number", align: "right", headerAlign: "right", renderCell: qtyCell },
  { field: "del_qty", headerName: "Delivered Qty", width: 120, type: "number", align: "right", headerAlign: "right", renderCell: qtyCell },
  { field: "pend_qty", headerName: "Pending Qty", width: 115, type: "number", align: "right", headerAlign: "right", renderCell: qtyCell },
];

const SEARCH_FIELDS = ["plant", "po_no", "vendor_code", "vendor_name", "material_code", "material_desc"];

const loadRows = (params) => GetOpenScheduleActiveApi(params);
const downloadExcel = (params) => DownloadOpenScheduleApi(params);
const downloadFileName = ({ plant }) => `Open_Schedule_${plant}_${new Date().toISOString().slice(0, 10)}.xlsx`;
const getRowId = (row) => row.row_id;

// The list is a point-in-time snapshot of the SAP report, so say which one the table is showing.
const summary = (rows) =>
  rows.length
    ? `Open Schedule (${T_CODE}) as of ${rows[0].stock_date} · ${rows.length.toLocaleString("en-IN")} rows · Pending Qty ${qtyFmt(rows.reduce((s, r) => s + Number(r.pend_qty || 0), 0))}`
    : null;

const emptyLabel = ({ searching }) =>
  searching
    ? "No records match your search."
    : `No Open Schedule data found. Click "SAP Sync" to import the latest ${T_CODE} file.`;

// The SAP transaction code, highlighted next to the heading, with a short explanation on hover.
const TITLE_INFO = (
  <>
    <TCodeBadge code={T_CODE} />
    <InfoHover title="Open Schedule" width={340}>
      <InfoSection label="Source">
        <InfoChip>T-Code {T_CODE}</InfoChip> SAP report of the purchase order schedule lines: the scheduled, delivered and pending quantity of each delivery date.
      </InfoSection>
      <InfoSection label="Used for">
        The Supplier Kanban adds up the pending quantity of a supplier's lines as the Open Schedule of its requirement.
      </InfoSection>
      <InfoSection label="Refresh">
        The scheduler imports the latest {T_CODE} file every 4 hours. Each file is the complete current list, so the newest file replaces the previous one. <b>SAP Sync</b> imports it right now.
      </InfoSection>
    </InfoHover>
  </>
);

const OpenSchedule = () => {
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
      const response = await FetchOpenScheduleApi({ userId });
      const result = response.data;
      toast.success(
        `Open Schedule fetched successfully. New list inserted: ${result.inserted} row(s)${result.purged ? `, previous list removed: ${result.purged} row(s)` : ""}.`
      );
      setReloadKey((k) => k + 1);
    } catch (error) {
      const data = error?.response?.data;
      const code = data?.code;
      const message = data?.message || "An error occurred while fetching Open Schedule. Please try again.";

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
      title="Open Schedule"
      titleInfo={TITLE_INFO}
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
          title={`Fetch the latest ${T_CODE} Open Schedule file from the FTP source`}
        >
          {fetching ? "Syncing..." : "SAP Sync"}
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
            <div className="text-sm font-semibold text-red-600">{T_CODE} Validation Errors</div>
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

export default OpenSchedule;
