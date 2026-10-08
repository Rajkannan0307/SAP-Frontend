import React, { useState } from "react";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import MfgListScreen, { compactButtonSx } from "../components/MfgListScreen";
import InfoHover, { InfoChip, InfoSection } from "../components/InfoHover";
import { getPMPDAccess } from "../Authentication/ActionAccessType";
import {
  downloadSubcontractPlanExcel,
  fetchSubcontractPlan,
  getSubcontractMaterialLookup,
  getSubcontractPlanList,
} from "../controller/SubcontractPlanApiService";

// Subcontract Daily Plan (MB51 541/542) — the list screen itself (Plant,
// Month, Year, search, pagination, Excel Download) is the shared MfgListScreen,
// so it looks and behaves exactly like Plant Stock and Supplier Stock. This
// file only supplies what is specific to this data.

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const qtyFmt = (v) => Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });

const COLUMNS = [
  { field: "plant", headerName: "Plant", width: 80 },
  {
    field: "material_type", headerName: "Material Type", width: 200,
    renderCell: (p) => {
      const cell = p.row.not_in_material_master
        ? <span>Others <span style={{ color: "#d32f2f", fontSize: 10 }}>(Not in Material Master / inactive)</span></span>
        : <span>{p.value}</span>;
      if (!p.row.others_reason) return cell;
      return (
        <Tooltip
          arrow placement="top" title={p.row.others_reason}
          slotProps={{
            popper: { modifiers: [{ name: "preventOverflow", options: { padding: 8 } }, { name: "flip", enabled: true }] },
            tooltip: { sx: { bgcolor: "#1f2937", color: "#fff", fontSize: 11, lineHeight: 1.4, borderRadius: "6px", padding: "6px 10px", maxWidth: 260, boxShadow: "0 4px 12px rgba(16,24,40,0.2)" } },
            arrow: { sx: { color: "#1f2937" } },
          }}
        >
          {cell}
        </Tooltip>
      );
    },
  },
  { field: "month", headerName: "Month", width: 110 },
  { field: "part_number", headerName: "Material", width: 170 },
  { field: "description", headerName: "Material Description", flex: 1, minWidth: 220 },
  { field: "supplier_code", headerName: "Supplier", width: 100 },
  {
    field: "quantity_display", headerName: "Quantity", width: 120, type: "number", align: "right", headerAlign: "right",
    renderCell: (p) => <span style={{ fontWeight: 600, color: Number(p.value) < 0 ? "#b42323" : "#1a2233" }}>{qtyFmt(p.value)}</span>,
  },
];

const SEARCH_FIELDS = ["plant", "month", "part_number", "description", "supplier_code", "material_type", "quantity_display"];

const MATERIAL_TYPE_FILTER = { label: "Material Type", field: "material_type", options: ["FERT", "HALB", "ROH", "Others"] };

// Quantity is stored exactly as SAP exports it (541 = negative, 542 =
// positive); the table shows Quantity x -1, like the Excel formula =I2*-1, so a
// 541 issue reads as a positive quantity and a 542 reversal nets it off.
// Display only - the database and the Excel download keep the raw value.
// "|| 0" avoids -0.
const monthOf = (iso) => {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(String(iso || ""));
  return m ? `${MONTH_SHORT[Number(m[2]) - 1]}-${m[1]}` : "";
};

// One row per Plant + Material + Supplier + Month (posting date) with the
// SUM of quantity. Material Type comes from the ACTIVE Material Master record:
// FERT / HALB / ROH, anything else (or a material not found / inactive) is Others.
const loadRows = async (params) => {
  const rows = await getSubcontractPlanList(params);
  let materials = [];
  try {
    materials = (await getSubcontractMaterialLookup({ plant: params.plant }))?.materials || [];
  } catch (error) {
    console.error(error);
    toast.error("Could not load Material Master details. Material Type may be shown incorrectly.");
  }
  const key = (v) => String(v ?? "").trim().toLowerCase();
  const typeByPart = new Map();
  const lineByPart = new Map();
  materials.forEach((m) => {
    if (!typeByPart.has(key(m.part_number))) { typeByPart.set(key(m.part_number), m.material_type); lineByPart.set(key(m.part_number), m.line_name || ""); }
  });

  const groups = new Map();
  rows.forEach((r) => {
    const month = monthOf(r.posting_date);
    const k = `${r.plant}|${key(r.part_number)}|${key(r.supplier_code)}|${month}`;
    const qty = (Number(r.quantity) * -1) || 0;
    const g = groups.get(k);
    if (g) {
      g.quantity_display += qty;
      if (!g.description && r.description) g.description = r.description;
    } else {
      const matType = typeByPart.get(key(r.part_number));
      const listed = matType === "FERT" || matType === "HALB" || matType === "ROH";
      groups.set(k, {
        id: k,
        plant: r.plant,
        month,
        part_number: r.part_number,
        description: r.description || "",
        supplier_code: r.supplier_code || "",
        material_type: listed ? matType : "Others",
        line_name: lineByPart.get(key(r.part_number)) || "",
        not_in_material_master: matType === undefined,
        others_reason: listed ? "" : matType === undefined
          ? "Material is not found (or is inactive) in Material Master for this plant."
          : `Material Master type is ${matType || "(blank)"}; only FERT, HALB and ROH are listed separately.`,
        quantity_display: qty,
      });
    }
  });
  return Array.from(groups.values()).map((g) => ({ ...g, quantity_display: Math.round(g.quantity_display * 1000) / 1000 || 0 }));
};
const downloadExcel = (params) => downloadSubcontractPlanExcel(params);
const downloadFileName = ({ plant, startDate, endDate }) => `Subcontract_Plan_${plant}_${startDate}_to_${endDate}.xlsx`;
const getRowId = (row) => row.id;
const emptyLabel = ({ periodLabel, searching }) =>
  searching ? "No records match your search." : `No Subcontract Plan records found for ${periodLabel}.`;

// What the (i) icon next to the title explains.
const TITLE_INFO = (
  <InfoHover title="Movement types & grouping" width={320}>
    <InfoSection label="Movement types">
      <InfoChip>541</InfoChip>
      <InfoChip color="#8a5a00" bg="#fff3d6">542</InfoChip>
      only
    </InfoSection>
    <InfoSection label="Grouped by">
      Plant + Material + Supplier + Month
    </InfoSection>
    <InfoSection label="Quantity">
      <b>SUM</b> of the 541 and 542 quantities in each group
    </InfoSection>
  </InfoHover>
);

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
      title="Subcontract Daily Dispatch"
      titleInfo={TITLE_INFO}
      lineFilterField="line_name"
      columns={COLUMNS}
      getRowId={getRowId}
      searchFields={SEARCH_FIELDS}
      loadRows={loadRows}
      downloadExcel={downloadExcel}
      downloadFileName={downloadFileName}
      downloadTitle="Download Subcontract Plan"
      selectFilter={MATERIAL_TYPE_FILTER}
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
