import React, { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import MfgListScreen, { compactButtonSx } from "../components/MfgListScreen";
import { getPMPDAccess } from "../Authentication/ActionAccessType";
import {
  downloadSubcontractPlanExcel,
  fetchSubcontractPlan,
  getSubcontractPlanList,
} from "../controller/SubcontractPlanApiService";

// Subcontract Daily Plan (MB51 541/542) — the list screen itself (Plant,
// Month, Year, search, pagination, Excel Download) is the shared MfgListScreen,
// so it looks and behaves exactly like Plant Stock and Supplier Stock. This
// file only supplies what is specific to this data.

const toDisplayDate = (iso) => (iso ? iso.split("-").reverse().join("-") : "");
const qtyFmt = (v) => Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });

const COLUMNS = [
  { field: "plant", headerName: "Plant", width: 80 },
  { field: "storage_loc", headerName: "Location", width: 90 },
  { field: "movement_type", headerName: "Mvt Type", width: 90 },
  { field: "po_number", headerName: "PO", width: 120 },
  { field: "po_item", headerName: "PO Item", width: 100, type: "number", align: "right", headerAlign: "right" },
  { field: "part_number", headerName: "Material", width: 160 },
  { field: "description", headerName: "Material Description", flex: 1, minWidth: 200 },
  { field: "supplier_code", headerName: "Supplier", width: 90 },
  {
    field: "quantity_display", headerName: "Quantity", width: 110, type: "number", align: "right", headerAlign: "right",
    renderCell: (p) => <span style={{ fontWeight: 600, color: Number(p.value) < 0 ? "#b42323" : "#1a2233" }}>{qtyFmt(p.value)}</span>,
  },
  { field: "material_doc", headerName: "Material Doc", width: 120 },
  { field: "posting_date_display", headerName: "Posting Date", width: 110 },
  { field: "posting_time", headerName: "Time", width: 90 },
  { field: "reference", headerName: "Reference", width: 160 },
];

const SEARCH_FIELDS = [
  "plant", "storage_loc", "movement_type", "po_number", "po_item", "part_number", "description",
  "supplier_code", "quantity_display", "material_doc", "posting_date_display", "posting_time", "reference",
];

// Quantity is stored exactly as SAP exports it (541 = negative, 542 =
// positive); the table shows Quantity x -1, like the Excel formula =I2*-1, so a
// 541 issue reads as a positive quantity. Display only - the database and the
// Excel download keep the raw value. "|| 0" avoids -0.
const prepareRows = (rows) =>
  rows.map((r) => ({
    ...r,
    posting_date_display: toDisplayDate(r.posting_date),
    quantity_display: (Number(r.quantity) * -1) || 0,
  }));

const loadRows = (params) => getSubcontractPlanList(params);
const downloadExcel = (params) => downloadSubcontractPlanExcel(params);
const downloadFileName = ({ plant, startDate, endDate }) => `Subcontract_Plan_${plant}_${startDate}_to_${endDate}.xlsx`;
const getRowId = (row) => row.sub_plan_id;
const emptyLabel = ({ periodLabel, searching }) =>
  searching ? "No records match your search." : `No Subcontract Plan records found for ${periodLabel}.`;

const SubcontractDailyPlan = () => {
  const access = getPMPDAccess();
  const [fetching, setFetching] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleFetch = async () => {
    if (fetching) return;
    setFetching(true);
    try {
      const result = await fetchSubcontractPlan(localStorage.getItem("EmpId"));
      if (result?.failures?.length) toast.warning(result.message);
      else toast.success(result?.message || "Subcontract Plan fetched successfully.");
      setReloadKey((k) => k + 1);
    } catch (error) {
      console.error(error);
      const code = error?.response?.data?.code;
      const message = error?.response?.data?.message || error?.message || "Something went wrong while fetching Subcontract Plan.";
      if (code === "NO_NEW_FILE" || code === "NO_FILE_FOUND") toast.info(message);
      else toast.error(message);
    } finally {
      setFetching(false);
    }
  };

  return (
    <MfgListScreen
      title="Subcontract Daily Plan"
      columns={COLUMNS}
      getRowId={getRowId}
      searchFields={SEARCH_FIELDS}
      loadRows={loadRows}
      downloadExcel={downloadExcel}
      downloadFileName={downloadFileName}
      downloadTitle="Download Subcontract Plan"
      prepareRows={prepareRows}
      emptyLabel={emptyLabel}
      plantDisabled={access.disableAction}
      reloadKey={reloadKey}
      extraActions={
        !access.disableAction && (
          <Button
            variant="contained" disableElevation onClick={handleFetch} disabled={fetching}
            startIcon={fetching ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
            title="Fetch latest MB51 541/542 data from the FTP source and insert new records"
          >
            {fetching ? "Fetching..." : "Fetch"}
          </Button>
        )
      }
    />
  );
};

export default SubcontractDailyPlan;
