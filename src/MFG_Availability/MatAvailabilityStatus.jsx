import React, { useEffect, useMemo, useState } from "react";
import { TextField, Button, MenuItem, CircularProgress, Tooltip } from "@mui/material";
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { FaFileExcel } from "react-icons/fa";
import { toast } from "react-toastify";
import { format } from "date-fns";
import * as XLSX from "xlsx-js-style";
import SectionHeading from "../components/Header";
import {
  GetMatAvailabilityFiltersApi,
  GetMatAvailabilityReportApi,
  GetPlantStockSnapshotApi,
  GetSupplierStockSnapshotApi,
} from "../controller/MfgBomApiService";

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const numberFmt = (v) => (v || v === 0 ? Number(v).toLocaleString("en-IN") : "0");
// Blank (not "0") when the operation doesn't apply to this FG at all —
// vs. a real "0" quantity for an operation that does apply.
const opCellFmt = (v) => (v === undefined || v === null ? "" : numberFmt(v));

// Modern tooltip "card" styling shared by every stock tooltip — flat white
// surface, subtle border + shadow, rounded corners, capped height with its
// own internal scroll so a long supplier list never overflows the viewport.
const tooltipPopperSx = {
  "& .MuiTooltip-tooltip": {
    backgroundColor: "#fff",
    color: "#222",
    border: "1px solid #e2e5ea",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(20,20,43,0.12)",
    padding: 0,
    maxWidth: 360,
  },
  "& .MuiTooltip-arrow": {
    color: "#fff",
    "&::before": { border: "1px solid #e2e5ea" },
  },
};

// One child-part section: header line (code – description) then, for the
// Supp side, the per-supplier breakdown feeding that number; for the IH
// side, a single plant-stock line (no per-storage-location API data exists
// on this screen, so that side stays a single figure).
const ChildPartSection = ({ child, side, suppliers, isLast }) => (
  <div
    style={{
      padding: "8px 12px",
      borderBottom: isLast ? "none" : "1px solid #eef0f3",
    }}
  >
    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1a2233", marginBottom: 4 }}>
      {child.child_part_no} <span style={{ fontWeight: 400, color: "#5b6472" }}>– {child.child_desc || "—"}</span>
    </div>

    {side === "supplier_qty" ? (
      suppliers && suppliers.length > 0 ? (
        <div style={{ maxHeight: 170, overflowY: "auto" }}>
          {suppliers.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                fontSize: 11.5,
                color: "#333",
                padding: "3px 0",
              }}
            >
              <span style={{ wordBreak: "break-word", lineHeight: "15px" }}>
                {s.supplier_name || "—"} <span style={{ color: "#8a93a3", whiteSpace: "nowrap" }}>({s.supplier_code})</span>
              </span>
              <span style={{ fontWeight: 600, color: "#0066FF", flexShrink: 0, whiteSpace: "nowrap" }}>{numberFmt(s.qty)} Qty</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: "#8a93a3" }}>No supplier stock for this month.</div>
      )
    ) : (
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#333" }}>
        <span>Plant stock</span>
        <span style={{ fontWeight: 600, color: "#0066FF" }}>{numberFmt(child[side])} Qty</span>
      </div>
    )}
  </div>
);

// IH/Supp cell — hovering shows exactly which child part(s) fed into that
// summed number. For Supp cells, drills one level further into the actual
// supplier-wise breakdown (reusing the same snapshot data already fetched
// for Excel export — no new API, no backend change).
const ChildPartTooltip = ({ value, children, side, supplierMap, plant }) => {
  const display = opCellFmt(value);
  if (!children || children.length === 0) {
    return <span>{display}</span>;
  }
  const title = (
    <div style={{ fontSize: 12, lineHeight: "18px" }}>
      <div
        style={{
          padding: "8px 12px",
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: 0.3,
          color: "#fff",
          backgroundColor: "#0066FF",
          borderRadius: "10px 10px 0 0",
        }}
      >
        {side === "supplier_qty" ? "SUPPLIER STOCK BREAKDOWN" : "PLANT STOCK BREAKDOWN"}
      </div>
      {children.map((c, i) => (
        <ChildPartSection
          key={i}
          child={c}
          side={side}
          suppliers={supplierMap ? supplierMap.get(`${plant}|${c.child_part_no}`) : undefined}
          isLast={i === children.length - 1}
        />
      ))}
    </div>
  );
  return (
    <Tooltip
      title={title}
      arrow
      placement="top"
      enterDelay={250}
      TransitionProps={{ timeout: 180 }}
      componentsProps={{ popper: { sx: tooltipPopperSx } }}
    >
      <span style={{ cursor: "default" }}>{display}</span>
    </Tooltip>
  );
};

// Compact, single-line filter controls: smaller padding/font than the default
// MUI size, achieved via input padding (safe) rather than forcing a fixed
// height on MuiInputBase-root (which breaks the outlined label/fieldset box model).
const compactFieldSx = (minWidth) => ({
  minWidth,
  flexShrink: 0,
  "& .MuiInputBase-input, & .MuiSelect-select": { padding: "6.5px 8px", fontSize: 12 },
  "& .MuiInputLabel-root": { fontSize: 12 },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": { fontSize: 12 },
});

const compactButtonSx = {
  height: 32,
  fontSize: 12,
  textTransform: "none",
  borderRadius: 1.5,
  boxShadow: "none",
  padding: "0 10px",
  whiteSpace: "nowrap",
};

const MatAvailabilityStatus = () => {
  const [filterOptions, setFilterOptions] = useState({ plants: [], partNames: [] });
  const [plant, setPlant] = useState("");
  const [partNameId, setPartNameId] = useState("");
  const [month, setMonth] = useState(currentMonth());

  const [reportRows, setReportRows] = useState([]);
  const [operationColumns, setOperationColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [plantStockAsOf, setPlantStockAsOf] = useState(null);
  const [supplierStockAsOf, setSupplierStockAsOf] = useState(null);
  // Per-supplier breakdown for the hover tooltip only — same snapshot API
  // already used for the Excel export, just also fetched here and reduced
  // into a plant+material lookup map. No new API, no backend change.
  const [supplierSnapshotMap, setSupplierSnapshotMap] = useState(new Map());

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const data = await GetMatAvailabilityFiltersApi();
        setFilterOptions({ plants: data?.plants || [], partNames: data?.partNames || [] });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load filter options.");
      }
    };
    loadFilters();
  }, []);

  const buildParams = () => ({
    plant: plant || undefined,
    partNameId: partNameId || undefined,
    month,
  });

  const fetchReport = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [data, supplierSnapshot] = await Promise.all([
        GetMatAvailabilityReportApi(buildParams()),
        GetSupplierStockSnapshotApi(month).catch((err) => {
          console.error("Failed to load supplier stock breakdown for tooltip:", err);
          return null;
        }),
      ]);
      setReportRows(data?.rows || []);
      setOperationColumns(data?.operationColumns || []);
      setPlantStockAsOf(data?.plantStockAsOf || null);
      setSupplierStockAsOf(data?.supplierStockAsOf || null);

      const map = new Map();
      (supplierSnapshot?.rows || []).forEach((r) => {
        const key = `${r.plant}|${r.material_code}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ supplier_code: r.supplier_code, supplier_name: r.supplier_name, qty: r.unrestricted_qty });
      });
      setSupplierSnapshotMap(map);

      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load MAT Availability Status report.");
      setReportRows([]);
      setOperationColumns([]);
      setPlantStockAsOf(null);
      setSupplierStockAsOf(null);
      setSupplierSnapshotMap(new Map());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One row per Plant+FG — every child part's operation rolls up into the
  // FG-level IH (plant)/Supp (supplier) pivot; op fields are left undefined
  // when that operation doesn't apply to this FG at all (blank cell). Each
  // op cell also carries the list of child parts that fed into it (for the
  // hover tooltip) alongside the plain summed number DataGrid sorts/exports.
  const flatRows = useMemo(() => {
    return reportRows.map((fg, idx) => {
      const row = {
        id: `${fg.plant}-${fg.fg_part_no}-${idx}`,
        plant: fg.plant,
        fg_part_no: fg.fg_part_no,
        fg_desc: fg.fg_desc,
        plan: fg.plan,
        actual: fg.actual,
        gap: fg.gap,
        total_ih: fg.ih_total,
        total_supp: fg.supp_total,
        grand_total: fg.grand_total,
        all_children: fg.children,
      };
      fg.operations.forEach((op) => {
        const childrenForOp = fg.children.filter((c) => c.opt_no === op.opt_no);
        row[`op_${op.opt_no}_ih`] = op.plant_qty;
        row[`op_${op.opt_no}_supp`] = op.supplier_qty;
        row[`op_${op.opt_no}_children`] = childrenForOp;
      });
      return row;
    });
  }, [reportRows]);

  const columns = useMemo(() => {
    const base = [
      { field: "plant", headerName: "Plant", width: 60 },
      { field: "fg_part_no", headerName: "FG_Part_No", width: 90 },
      { field: "fg_desc", headerName: "FG Part Description", width: 280 },
      { field: "plan", headerName: "Plan", width: 80, align: "right", headerAlign: "center", renderCell: (p) => numberFmt(p.value) },
      { field: "actual", headerName: "Actual", width: 80, align: "right", headerAlign: "center", renderCell: (p) => numberFmt(p.value) },
      { field: "gap", headerName: "GAP", width: 80, align: "right", headerAlign: "center", renderCell: (p) => numberFmt(p.value) },
    ];
    const opCols = operationColumns.flatMap((op) => [
      {
        field: `op_${op.opt_no}_ih`, headerName: "IH", width: 55, align: "right", headerAlign: "center",
        sortable: false,
        renderCell: (p) => (
          <ChildPartTooltip value={p.value} children={p.row[`op_${op.opt_no}_children`]} side="plant_qty" plant={p.row.plant} supplierMap={supplierSnapshotMap} />
        ),
        cellClassName: "mat-ih-cell",
      },
      {
        field: `op_${op.opt_no}_supp`, headerName: "Supp", width: 55, align: "right", headerAlign: "center",
        sortable: false,
        renderCell: (p) => (
          <ChildPartTooltip value={p.value} children={p.row[`op_${op.opt_no}_children`]} side="supplier_qty" plant={p.row.plant} supplierMap={supplierSnapshotMap} />
        ),
        cellClassName: "mat-supp-cell",
      },
    ]);
    const totalCols = [
      {
        field: "total_ih", headerName: "IH", width: 60, align: "right", headerAlign: "center", sortable: false,
        renderCell: (p) => (
          <ChildPartTooltip value={p.value} children={(p.row.all_children || []).filter((c) => c.plant_qty > 0)} side="plant_qty" plant={p.row.plant} supplierMap={supplierSnapshotMap} />
        ),
        cellClassName: "mat-ih-cell",
      },
      {
        field: "total_supp", headerName: "Supp", width: 60, align: "right", headerAlign: "center", sortable: false,
        renderCell: (p) => (
          <ChildPartTooltip value={p.value} children={(p.row.all_children || []).filter((c) => c.supplier_qty > 0)} side="supplier_qty" plant={p.row.plant} supplierMap={supplierSnapshotMap} />
        ),
        cellClassName: "mat-supp-cell",
      },
      { field: "grand_total", headerName: "TOT", width: 90, align: "right", headerAlign: "center", sortable: false, renderCell: (p) => numberFmt(p.value), cellClassName: "mat-tot-cell" },
    ];
    return [...base, ...opCols, ...totalCols];
  }, [operationColumns, supplierSnapshotMap]);

  // Grouped header row: SOCKET spans every operation + the TOTAL block,
  // each operation spans its own IH/Supp pair. MUI requires a genuinely
  // nested tree here (groups nested directly inside "children"), not a
  // flat list referencing sibling groupIds.
  const columnGroupingModel = useMemo(() => {
    const operationGroups = operationColumns.map((op) => ({
      groupId: `op_group_${op.opt_no}`,
      headerName: op.opt_name,
      headerAlign: "center",
      children: [{ field: `op_${op.opt_no}_ih` }, { field: `op_${op.opt_no}_supp` }],
    }));
    const totalGroup = {
      groupId: "total_group",
      headerName: "TOTAL",
      headerAlign: "center",
      children: [{ field: "total_ih" }, { field: "total_supp" }, { field: "grand_total" }],
    };
    return [
      {
        groupId: "socket_group",
        headerName: "SOCKET",
        headerAlign: "center",
        children: [...operationGroups, totalGroup],
      },
    ];
  }, [operationColumns]);

  const handleDownloadExcel = async () => {
    if (excelLoading) return;
    if (flatRows.length === 0) {
      toast.warning("No data available to export.");
      return;
    }
    setExcelLoading(true);
    try {
      // Fetched lazily — only when actually exporting — since these can be
      // thousands of rows and aren't needed just to view the report on screen.
      const [plantSnapshot, supplierSnapshot] = await Promise.all([
        GetPlantStockSnapshotApi(month),
        GetSupplierStockSnapshotApi(month),
      ]);

      // Sheet 1 — the exact pivot layout: grouped 2-row header (SOCKET spans
      // every operation's IH/Supp pair, plus a TOTAL block), one row per Plant+FG.
      // Fixed-column headers (Plant/FG Part No/Plan/Actual/GAP) must live in
      // row 1 — the "!merges" below span rows 1-3 for each of them, and a
      // merged cell only ever displays its TOP-LEFT cell's value, so putting
      // the text in row 3 instead (as before) rendered as blank headers.
      const fixedCols = ["Plant", "FG_Part_No", "FG Part Description", "Plan", "Actual", "GAP"];
      const headerRow1 = [...fixedCols, "SOCKET"];
      const headerRow2 = [...fixedCols.map(() => ""), ...operationColumns.flatMap(() => ["", ""]), "TOTAL"];
      const headerRow3 = [...fixedCols.map(() => ""), ...operationColumns.flatMap(() => ["IH", "Supp"]), "IH", "Supp", "TOT"];
      // Row 2 needs each operation's name once, spanning its IH/Supp pair.
      let col = fixedCols.length;
      operationColumns.forEach((op) => {
        headerRow2[col] = op.opt_name;
        col += 2;
      });

      const pivotAoa = [headerRow1, headerRow2, headerRow3];
      reportRows.forEach((fg) => {
        const opMap = new Map(fg.operations.map((op) => [op.opt_no, op]));
        const row = [fg.plant, fg.fg_part_no, fg.fg_desc, fg.plan, fg.actual, fg.gap];
        operationColumns.forEach((op) => {
          const found = opMap.get(op.opt_no);
          row.push(found ? found.plant_qty : "", found ? found.supplier_qty : "");
        });
        row.push(fg.ih_total, fg.supp_total, fg.grand_total);
        pivotAoa.push(row);
      });

      const pivotSheet = XLSX.utils.aoa_to_sheet(pivotAoa);
      const opCount = operationColumns.length;
      const socketColStart = fixedCols.length;
      const socketColEnd = fixedCols.length + opCount * 2 + 2; // + TOTAL's IH/Supp/TOT
      pivotSheet["!merges"] = [
        // Fixed columns' headers span all 3 header rows.
        ...fixedCols.map((_, i) => ({ s: { r: 0, c: i }, e: { r: 2, c: i } })),
        // "SOCKET" spans every operation + TOTAL group, row 0.
        { s: { r: 0, c: socketColStart }, e: { r: 0, c: socketColEnd } },
        // Each operation name spans its own IH/Supp pair, row 1.
        ...operationColumns.map((_, i) => ({
          s: { r: 1, c: socketColStart + i * 2 }, e: { r: 1, c: socketColStart + i * 2 + 1 },
        })),
        // "TOTAL" spans IH/Supp/TOT, row 1.
        { s: { r: 1, c: socketColEnd - 2 }, e: { r: 1, c: socketColEnd } },
      ];
      const fixedColWidths = [8, 14, 28, 10, 10, 10]; // Plant, FG_Part_No, FG Part Description, Plan, Actual, GAP
      pivotSheet["!cols"] = [...fixedColWidths.map((wch) => ({ wch })), ...Array(opCount * 2 + 3).fill({ wch: 9 })];
      for (let r = 0; r <= 2; r++) {
        for (let c = 0; c <= socketColEnd; c++) {
          const cell = pivotSheet[XLSX.utils.encode_cell({ r, c })];
          if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "DCE6F1" } }, alignment: { horizontal: "center", vertical: "center" } };
        }
      }

      // Sheet 2 — child-part detail, for traceability behind the FG-level pivot.
      const detailRows = [];
      reportRows.forEach((fg) => {
        fg.children.forEach((child) => {
          detailRows.push({
            Plant: fg.plant,
            "FG Part No": fg.fg_part_no,
            Description: fg.fg_desc,
            "Child Part / Socket": child.child_part_no,
            "Child Description": child.child_desc,
            Operation: child.opt_name,
            "IH (Plant) Qty": child.plant_qty,
            "Supp (Supplier) Qty": child.supplier_qty,
            "Total Qty": child.total_qty,
          });
        });
      });

      const createSheet = (sheetData, bgColor = "E7F3FF") => {
        const ws = XLSX.utils.json_to_sheet(sheetData);
        if (sheetData.length > 0) {
          Object.keys(sheetData[0]).forEach((_, colIdx) => {
            const cell = ws[XLSX.utils.encode_cell({ c: colIdx, r: 0 })];
            if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: "center" } };
          });
        }
        return ws;
      };

      // Sheet 3 — the exact latest Plant Stock batch used for this month
      // (same batch the report itself pulled IH figures from).
      const plantStockRows = (plantSnapshot?.rows || []).map((r) => ({
        Plant: r.plant,
        "Storage Location": r.storage_location,
        "Material Code": r.material_code,
        "Material Description": r.material_desc,
        UOM: r.uom,
        "Unrestricted Qty": r.unrestricted_qty,
        "Quality Inspection Qty": r.quality_inspection_qty,
        "Blocked Qty": r.blocked_qty,
        "Stock Date": r.stock_date ? format(new Date(r.stock_date), "dd-MM-yyyy HH:mm") : "",
      }));

      // Sheet 4 — the exact latest Supplier Stock batch used for this month
      // (same batch the report itself pulled Supp figures from).
      const supplierStockRows = (supplierSnapshot?.rows || []).map((r) => ({
        Plant: r.plant,
        "Supplier Code": r.supplier_code,
        "Supplier Name": r.supplier_name,
        "Material Code": r.material_code,
        "Material Description": r.material_desc,
        "Unrestricted Qty": r.unrestricted_qty,
        "Stock Date": r.stock_date ? format(new Date(r.stock_date), "dd-MM-yyyy HH:mm") : "",
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, pivotSheet, "MAT Availability Summary");
      XLSX.utils.book_append_sheet(wb, createSheet(detailRows, "FFF4CC"), "Child Part Detail");
      XLSX.utils.book_append_sheet(wb, createSheet(plantStockRows, "D9EAD3"), "Plant Stock Snapshot");
      XLSX.utils.book_append_sheet(wb, createSheet(supplierStockRows, "D9EAD3"), "Supplier Stock Snapshot");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `MAT_Availability_Status_${month}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      toast.success("Excel downloaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Excel file.");
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "10px 14px",
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 50px)",
      }}
    >
      <div style={{ marginBottom: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHeading>MFG Set of Parts - Stock Report [MB52 / MBLB]</SectionHeading>
      </div>

      {/* Compact filter toolbar — Plant, Part Name, Month + Search only */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "6px 8px",
          marginBottom: 4,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
        }}
      >
        <TextField
          select size="small" label="Plant" value={plant}
          onChange={(e) => setPlant(e.target.value)}
          sx={compactFieldSx(150)}
          SelectProps={{ MenuProps: { PaperProps: { sx: { "& .MuiMenuItem-root": { fontSize: 12, minHeight: 28 } } } } }}
        >
          <MenuItem sx={{ fontSize: 12 }} value="">All Plants</MenuItem>
          {filterOptions.plants.map((p) => (
            <MenuItem sx={{ fontSize: 12 }} key={p.Plant_Code} value={p.Plant_Code}>{p.Plant_Code} - {p.Plant_Name}</MenuItem>
          ))}
        </TextField>

        <TextField
          select size="small" label="Part Name" value={partNameId}
          onChange={(e) => setPartNameId(e.target.value)}
          sx={compactFieldSx(160)}
          SelectProps={{ MenuProps: { PaperProps: { sx: { "& .MuiMenuItem-root": { fontSize: 12, minHeight: 28 } } } } }}
        >
          <MenuItem sx={{ fontSize: 12 }} value="">All Part Names</MenuItem>
          {filterOptions.partNames.map((p) => (
            <MenuItem sx={{ fontSize: 12 }} key={p.Prod_ID} value={p.Prod_ID}>{p.Name}</MenuItem>
          ))}
        </TextField>

        <TextField
          size="small" label="Month" type="month" value={month}
          onChange={(e) => setMonth(e.target.value)}
          sx={compactFieldSx(140)}
          InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
        />

        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexShrink: 0 }}>
          <Button
            onClick={fetchReport}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc", boxShadow: "none" } }}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
          <Button
            onClick={handleDownloadExcel}
            disabled={excelLoading}
            variant="contained"
            startIcon={excelLoading ? <CircularProgress size={12} color="inherit" /> : <FaFileExcel size={13} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238", boxShadow: "none" } }}
          >
            {excelLoading ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      {loaded && (
        <div style={{ fontSize: 10.5, color: "#666", marginBottom: 3, display: "flex", gap: 12, flexWrap: "wrap", lineHeight: "14px" }}>
          <span>{flatRows.length} record{flatRows.length === 1 ? "" : "s"} found</span>
          {plantStockAsOf && (
            <span>· Plant Stock as of {format(new Date(plantStockAsOf), "dd-MMM-yyyy HH:mm")}</span>
          )}
          {supplierStockAsOf && (
            <span>· Supplier Stock as of {format(new Date(supplierStockAsOf), "dd-MMM-yyyy HH:mm")}</span>
          )}
        </div>
      )}

      {/* Main report grid — takes the maximum remaining vertical space */}
      <div style={{ flexGrow: 1, backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.1)", minHeight: 0, overflow: "hidden" }}>
        <DataGrid
          rows={flatRows}
          columns={columns}
          columnGroupingModel={columnGroupingModel}
          pageSize={25}
          rowsPerPageOptions={[25, 50, 100]}
          disableSelectionOnClick
          loading={loading}
          columnHeaderHeight={26}
          rowHeight={30}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No MAT Availability data found for the selected filters." }}
          sx={{
            height: "100%",
            "& .MuiDataGrid-columnHeaders": { position: "sticky", top: 0, zIndex: 2 },
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#bdbdbd", color: "black", fontWeight: "bold" },
            "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10.5px", fontWeight: "bold" },
            "& .MuiDataGrid-columnHeader--filledGroup .MuiDataGrid-columnHeaderTitle": { fontSize: "11px" },
            "& .MuiDataGrid-row": { backgroundColor: "#f5f5f5", "&:hover": { backgroundColor: "#f5f5f5" } },
            "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
            "& .MuiDataGrid-cell": { color: "#333", fontSize: "11px", padding: "0 6px" },
            "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 30 },
            "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
            "& .mat-ih-cell": { backgroundColor: "#ffffff" },
            "& .mat-supp-cell": { backgroundColor: "#fde9d9" },
            "& .mat-tot-cell": { fontWeight: "bold", backgroundColor: "#e2efda" },
          }}
        />
      </div>
    </div>
  );
};

export default MatAvailabilityStatus;
