import React, { useContext, useEffect, useMemo, useState } from "react";
import { TextField, Button, CircularProgress, Tooltip, Typography, Autocomplete } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import { FaFileExcel } from "react-icons/fa";
import { toast } from "react-toastify";
import { format } from "date-fns";
import * as XLSX from "xlsx-js-style";
import { AuthContext } from "../Authentication/AuthContext";
import { getdetails as getLines } from "../controller/LineMasterapiservice";
import { getProductSegments } from "../controller/Masterapiservice";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import InfoTip from "../components/InfoTip";
import { monthlyPlanTipProps } from "../components/monthlyPlanTip";
import WorkingDaysTip from "../components/WorkingDaysTip";
import {
  GetMatAvailabilityFiltersApi,
  GetMatAvailabilityReportApi,
  GetPlantStockSnapshotApi,
  GetProdStatusBreakupApi,
  GetSupplierStockSnapshotApi,
} from "../controller/MfgBomApiService";

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
const ChildPartSection = ({ child, side, suppliers, isLast, showGrn = true }) => (
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
      <>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#333" }}>
          <span>Plant stock</span>
          <span style={{ fontWeight: 600, color: "#0066FF" }}>{numberFmt(child.plant_stock_qty ?? child[side])} Qty</span>
        </div>
        {showGrn && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#333" }}>
              <span>GRN 103-105 Pending</span>
              <span style={{ fontWeight: 600, color: "#0066FF" }}>{numberFmt(child.grn103_qty || 0)} Qty</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, color: "#1a2233", borderTop: "1px solid #eef0f3", marginTop: 3, paddingTop: 3 }}>
              <span>Total</span>
              <span style={{ color: "#0066FF" }}>{numberFmt(child[side])} Qty</span>
            </div>
          </>
        )}
      </>
    )}
  </div>
);

// IH/Supp cell — hovering shows exactly which child part(s) fed into that
// summed number. For Supp cells, drills one level further into the actual
// supplier-wise breakdown (reusing the same snapshot data already fetched
// for Excel export — no new API, no backend change).
const ChildPartTooltip = ({ value, children, side, supplierMap, plant, showGrn = true }) => {
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
      {side !== "supplier_qty" && showGrn && children.length > 1 && (() => {
        // IH = plant stock + GRN 103-105 Pending (SAP T-Code ZM095K): show how the number in the cell is split
        const stock = children.reduce((s, c) => s + (Number(c.plant_stock_qty ?? c.plant_qty) || 0), 0);
        const grn = children.reduce((s, c) => s + (Number(c.grn103_qty) || 0), 0);
        const line = (label, val, bold) => (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12, fontWeight: bold ? 700 : 500, color: "#1a2233" }}>
            <span>{label}</span>
            <span style={{ color: "#0066FF" }}>{numberFmt(val)}</span>
          </div>
        );
        return (
          <div style={{ padding: "8px 12px", backgroundColor: "#f4f8ff", borderBottom: "1px solid #dbe6fb" }}>
            {line("Plant Stock", stock)}
            {line("GRN 103-105 Pending", grn)}
            <div style={{ borderTop: "1px solid #cbd9f5", margin: "4px 0" }} />
            {line("Total (IH)", stock + grn, true)}
          </div>
        );
      })()}
      {/* Scrollable list, header stays fixed above — with many child parts
          this could otherwise grow taller than the viewport and run off
          screen, since a Tooltip/Popper never clips or repositions its own
          content height. */}
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {children.map((c, i) => (
          <ChildPartSection
            key={i}
            child={c}
            side={side}
            suppliers={supplierMap ? supplierMap.get(`${plant}|${c.child_part_no}`) : undefined}
            isLast={i === children.length - 1}
            showGrn={showGrn}
          />
        ))}
      </div>
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

// Compact, single-line filter controls — styling exactly matches the Daily
// Production Plan's own compactFieldSx/compactButtonSx (same file's design
// reference), so both screens share one visual language. Purely visual
// tokens: no filter behavior/logic here is affected.
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
  transition: "background-color .15s ease, box-shadow .15s ease",
};

// Shared plain-<table> styling for the Materials/Production-IH report
// grids (native table/thead/tbody/tr/th/td — same pattern as the Daily
// Production Plan screen's own plan-entry grid — instead of DataGrid or
// MUI's Table wrapper components), restyled with Tailwind utility classes.
// Sticky positioning and column widths are mechanical (table-layout:
// fixed + a <colgroup>, so columns never auto-stretch), so `top`/`left`/
// `width`/`height` stay inline; everything else
// (color/spacing/typography/borders/hover) is plain Tailwind classes —
// real utility classes, not inline style, so `group-hover:` etc. apply
// with normal CSS specificity.
// "si_no" is the serial number of the row in the list (follows the current
// search / filter), shown first in both the Materials and Production-IH tables.
// Monthly Plan / MTD Plan / MTD Actual / Gap follow the MFG Daily Production Plan > Prod Status rules
// (computed by the backend in ProdStatusCalc.js, shared by both screens).
// `tip` = the hover explanation of the column header (same wording as the Prod Status screen).
const FIXED_COLS = [
  { field: "si_no", label: "SI", width: 40, left: 0, tip: "Serial number of the row in the list (follows the current search)" },
  { field: "plant", label: "Line", width: 90, left: 40, tip: "Production line of the FG part (from the Material Master)" },
  // FG part number with its description underneath (one column, like Prod Status's "Part No / Description")
  { field: "fg_part_no", label: "Part No / Description", width: 160, left: 110, tip: "FG part number and its description" },
  { field: "monthly_plan", label: "M.Plan", width: 100, left: 270, align: "right", tip: "Monthly Plan = sum of plan_qty x ends (plan type MP) from the production plan for the selected month" },
  { field: "mtd_plan", label: "MTD Plan", width: 100, left: 370, align: "right", tip: "MTD Plan = (Monthly Plan / working days of the month) x working days up to yesterday. The month's working days are set on the Working Days screen (default 26); Sundays are not counted" },
  { field: "mtd_actual", label: "MTD Act", width: 100, left: 470, align: "right", tip: "MTD Actual = production quantity of the selected month (movement types 101, 102, 261 and 262)" },
  { field: "gap", label: "Gap", width: 100, left: 570, align: "right", tip: "Gap = MTD Actual - MTD Plan (positive = ahead, negative = behind)" },
];

// Hover explanations for the dynamic header cells.
const TIP_IH = "IH = plant (in-house) stock of the child parts, from the latest Plant Stock upload up to the month end, plus their GRN 103-105 Pending quantity (hover a number to see the split)";
const TIP_SUPP = "Supp = stock lying with the supplier, from the latest Supplier Stock upload up to the month end";
const TIP_TOT = "TOT = IH + Supp";
const TIP_SET_OF_PARTS = "Set of Parts = the lowest IH quantity across this FG's operation columns (the bottleneck: how many complete sets can be made)";

// Wraps a header label so hovering it shows the explanation (the app's shared hover card, InfoTip).
const HeadTip = ({ tip, children }) => <InfoTip trigger={children} text={tip} />;
// Break-up sheets of the Excel downloads: the raw plan rows and production rows behind Monthly Plan, MTD Plan,
// MTD Actual and Gap, so the user can see how each value is built. Every FG ends with a shaded line that equals the
// figure on the main sheet.
const buildProdStatusBreakupSheets = (rows, data, month) => {
  const num = (v) => Number(v) || 0;
  const keyOf = (p) => String(p ?? "").trim().toLowerCase();
  const byPart = (list) => {
    const m = new Map();
    (list || []).forEach((x) => { const k = keyOf(x.part_number); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    return m;
  };
  const planBy = byPart(data.plan);
  const actualBy = byPart(data.actual);
  const planAoa = [["FG Part No", "FG Description", "Effective Date", "Plan Type", "Plan Qty", "Ends", "Plan Qty x Ends"]];
  const actualAoa = [["FG Part No", "FG Description", "Production Date", "Movement Type", "Qty"]];
  const planSub = new Set();
  const actualSub = new Set();
  let totMonthly = 0, totMtdPlan = 0, totActual = 0, totGap = 0;
  rows.forEach((r) => {
    const planRows = planBy.get(keyOf(r.fg_part_no)) || [];
    planRows.forEach((x) => planAoa.push([r.fg_part_no, r.fg_desc || "", x.effective_date, "MP", num(x.plan_qty), num(x.ends), num(x.plan_qty) * num(x.ends)]));
    const monthly = planRows.reduce((t, x) => t + num(x.plan_qty) * num(x.ends), 0);
    planSub.add(planAoa.length); planAoa.push([r.fg_part_no, r.fg_desc || "", "Monthly Plan (sum of Plan Qty x Ends)", "", "", "", monthly]);
    planSub.add(planAoa.length); planAoa.push([r.fg_part_no, r.fg_desc || "", `MTD Plan = Monthly Plan / ${data.planDays} working days x ${data.nwd} working days up to yesterday`, "", "", "", num(r.mtd_plan)]);
    totMonthly += monthly; totMtdPlan += num(r.mtd_plan);

    const actRows = actualBy.get(keyOf(r.fg_part_no)) || [];
    actRows.forEach((x) => actualAoa.push([r.fg_part_no, r.fg_desc || "", x.prod_date, x.moment_type, num(x.prod_qty)]));
    const actual = actRows.reduce((t, x) => t + num(x.prod_qty), 0);
    actualSub.add(actualAoa.length); actualAoa.push([r.fg_part_no, r.fg_desc || "", "MTD Actual (sum of the production rows)", "", actual]);
    actualSub.add(actualAoa.length); actualAoa.push([r.fg_part_no, r.fg_desc || "", "MTD Plan (see Plan Breakup)", "", num(r.mtd_plan)]);
    actualSub.add(actualAoa.length); actualAoa.push([r.fg_part_no, r.fg_desc || "", "Gap = MTD Actual - MTD Plan", "", actual - num(r.mtd_plan)]);
    totActual += actual; totGap += actual - num(r.mtd_plan);
  });
  planSub.add(planAoa.length); planAoa.push(["ALL FG", `${rows.length} FG`, "Total Monthly Plan", "", "", "", totMonthly]);
  planSub.add(planAoa.length); planAoa.push(["ALL FG", "", "Total MTD Plan", "", "", "", totMtdPlan]);
  actualSub.add(actualAoa.length); actualAoa.push(["ALL FG", `${rows.length} FG`, "Total MTD Actual", "", totActual]);
  actualSub.add(actualAoa.length); actualAoa.push(["ALL FG", "", "Total MTD Plan", "", totMtdPlan]);
  actualSub.add(actualAoa.length); actualAoa.push(["ALL FG", "", "Total Gap", "", totGap]);

  const sheet = (aoa, subRows, widths) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = widths.map((wch) => ({ wch }));
    const lastCol = aoa[0].length - 1;
    for (let r = 0; r < aoa.length; r++) {
      for (let c = 0; c <= lastCol; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        if (r === 0) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "DCE6F1" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
        else if (subRows.has(r)) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "EAF0FC" } } };
        if (c === lastCol && typeof cell.v === "number") cell.z = "#,##0";
      }
    }
    return ws;
  };
  // working days of the month for the guide: from the Working Days master, or the default of 26
  const firstPlantWd = (data) => (data && data.workingDays ? Object.values(data.workingDays)[0] : null);
  const wdText = (d, n, src) => (d
    ? `${n}.`
    : src === "table"
      ? `${n} (from the Working Days master).`
      : `${n} (default: this plant and month has no entry in the Working Days master).`);
  const guide = [
    ["Item", "How it is calculated"],
    ["Month", `${month}`],
    ["Monthly Plan", "Sum of (Plan Qty x Ends): each Monthly Plan row (plan type MP, Trn_Production_Plan) of the FG part inside the month is multiplied by its own Ends, then all those rows are added together; a missing Ends counts as 1. Rows: sheet 'Plan Breakup'."],
    ["Working days of the month", wdText(firstPlantWd(data) && firstPlantWd(data).month, data.planDays, firstPlantWd(data) && firstPlantWd(data).source)],
    ["Working days up to yesterday", `${data.nwd} (Sundays are not counted).` + " A past month counts the whole month; a future month counts 0."],
    ["MTD Plan", `(Monthly Plan / ${data.planDays}) x ${data.nwd}, rounded to a whole number. Shown at the end of each FG in 'Plan Breakup'.`],
    ["MTD Actual", `Sum of the production quantity (Trn_Actual_Production_Plan, movement types ${data.movements}) of the FG part inside the month. Rows: sheet 'Actual Breakup'.`],
    ["Gap", "MTD Actual - MTD Plan (positive = ahead, negative = behind)."],
    ["Break-up sheets", "Each FG lists the rows it is built from, then shaded lines that equal the values on the main sheet. The ALL FG lines add up every FG listed."],
  ];
  const guideWs = XLSX.utils.aoa_to_sheet(guide);
  guideWs["!cols"] = [{ wch: 18 }, { wch: 120 }];
  [0, 1].forEach((c) => { const cell = guideWs[XLSX.utils.encode_cell({ r: 0, c })]; if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "DCE6F1" } } }; });
  return [
    ["How to read", guideWs],
    ["Plan Breakup", sheet(planAoa, planSub, [18, 34, 40, 11, 12, 8, 16])],
    ["Actual Breakup", sheet(actualAoa, actualSub, [18, 34, 40, 15, 13])],
  ];
};

// Loads the break-up rows for the Excel download; a failure only drops the break-up sheets (the main sheets still download).
const loadProdStatusBreakup = async (plant, month, rows) => {
  try {
    return await GetProdStatusBreakupApi({ plant, month, fgParts: rows.map((r) => r.fg_part_no).join(",") });
  } catch (error) {
    console.error("Failed to load the break-up rows:", error);
    toast.warning("The break-up sheets could not be loaded, the rest of the Excel is downloaded.");
    return null;
  }
};

// Part No / Description header hover: which FG parts are listed and how a row is shown (Production-IH adds the assembly rule)
const fgPartTipPoints = (partNames, assemblyOnly) => [
  "Shown as the FG part number with its description below",
  `FG parts with an active MFG BOM line of Part Name ${partNames && partNames.length ? partNames.join(", ") : "Ballpin, Ballrod, Socket, Tube"}`,
  ...(assemblyOnly ? ["Only assembly child parts count: an FG part without one is not listed"] : []),
];
const FIXED_COLS_TOTAL_WIDTH = FIXED_COLS.reduce((sum, c) => sum + c.width, 0);

// Fixed pixel widths for the dynamic (scrollable) columns — used both in
// the <colgroup> and the header cells, so widths stay in sync and the
// table (rendered with `table-layout: fixed`) never auto-stretches
// existing columns to fill leftover space: any unused width just stays
// blank after the last real column, ready for more columns to appear.
const MAT_OP_COL_WIDTH = 52; // Materials: per-operation IH/Supp leaf columns
const MAT_GROUP_TOTAL_IH_SUPP_WIDTH = 58; // Materials: per-group TOTAL IH/Supp
const MAT_GROUP_TOTAL_TOT_WIDTH = 78; // Materials: per-group TOTAL TOT
const IH_OP_COL_WIDTH = 100; // Production-IH: per-operation column
const IH_SET_OF_PARTS_WIDTH = 92; // Production-IH: trailing Set of Parts

// Sticky header row height (px) — every header cell gets this EXACT
// height (not just padding) so the 3 stacked sticky rows have no
// sub-pixel rounding gap between them; without it, a hairline of body
// content peeks through the header seam while scrolling.
const HEAD_ROW_H = 24;

// Thin, unobtrusive scrollbar for the table's own scroll container — no
// core Tailwind utility covers ::-webkit-scrollbar, so this stays plain CSS.
const matScrollbarCss = `
  .mat-avail-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
  .mat-avail-scroll::-webkit-scrollbar-track { background: transparent; }
  .mat-avail-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 9999px; border: 2px solid #fff; }
  .mat-avail-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
`;

// A right-edge shadow + border on the last pinned column (GAP), marking
// the boundary between the fixed summary section and the scrollable
// detail section.
const gapSeparatorClass = "border-r border-gray-300 shadow-[4px_0_6px_-4px_rgba(15,23,42,0.25)]";
// Subtle separators between logical column groups in the header only
// (Forging / Semi Machined / … / TOTAL), not around every cell.
const groupSeparatorClass = "border-l border-gray-300/70";

// No vertical padding here — header cell height is set explicitly (see
// HEAD_ROW_H) on every non-rowSpan header cell instead, so the 3 stacked
// sticky rows stack at EXACT pixel multiples with no seam. Table cells
// default to vertical-align: middle, so text still centers correctly.
const theadCellBase = "sticky whitespace-nowrap overflow-hidden text-ellipsis bg-[#d3ddf4] text-slate-800 font-semibold text-[10.5px] tracking-wide px-2 border-b border-slate-300 box-border";
const tbodyCellBase = "whitespace-nowrap overflow-hidden text-ellipsis text-[11px] text-slate-700 px-2 py-1 border-b border-slate-100 box-border";

const matTheadCellClass = (extra = "") => `${theadCellBase} z-20 text-center ${extra}`;

// Fixed-column header cells: sticky on both axes (top for the header,
// left for the column), spans all header rows (rowSpan) so it stretches
// to match the other rows' explicit HEAD_ROW_H heights automatically —
// no height of its own needed. Elevated above the plain sticky-top header
// cells so it wins the top-left overlap while scrolling either way.
const matFixedHeadClass = (col) =>
  `${theadCellBase} z-30 py-1 ${col.align === "right" ? "text-right" : "text-left"} ${col.field === "gap" ? gapSeparatorClass : ""}`;

const matFixedHeadStyle = (col) => ({ top: 0, left: col.left, width: col.width });

// Fixed-column body cells: sticky-left, own solid background (a
// scrolling column slides directly underneath a pinned one, so a
// transparent cell can't reliably occlude it), hover driven by the
// parent `<tr>`'s Tailwind `group` state rather than a CSS descendant
// hack, so it composes correctly with the opaque background above.
const matFixedBodyClass = (col) =>
  `${tbodyCellBase} sticky z-10 bg-white group-hover:bg-[#f2f6fd] ${col.align === "right" ? "text-right" : "text-left"} ${col.field === "gap" ? gapSeparatorClass : ""}`;

const matFixedBodyStyle = (col) => ({ left: col.left, width: col.width });

// Gap = MTD Actual - MTD Plan, shown signed ("+100" / "-40" / "0") and coloured like the Prod Status
// screen: green when ahead, red when behind, grey on target. Inline colour so it always wins over the cell class.
const gapFmt = (v) => {
  const n = Number(v) || 0;
  return n > 0 ? `+${n.toLocaleString("en-IN")}` : n.toLocaleString("en-IN");
};
const gapColor = (v) => (Number(v) > 0 ? "#1b7a43" : Number(v) < 0 ? "#b42323" : "#6b7280");

// TOTAL row at the bottom of each table (Materials and Production-IH). Always visible (sticky bottom) and
// sums the rows currently shown, so it follows the search box. Gap total = sum of the row gaps.
const SummaryFooter = ({ rows }) => {
  const totals = rows.reduce(
    (t, r) => ({
      monthly_plan: t.monthly_plan + (Number(r.monthly_plan) || 0),
      mtd_plan: t.mtd_plan + (Number(r.mtd_plan) || 0),
      mtd_actual: t.mtd_actual + (Number(r.mtd_actual) || 0),
      gap: t.gap + (Number(r.gap) || 0),
    }),
    { monthly_plan: 0, mtd_plan: 0, mtd_actual: 0, gap: 0 }
  );
  const footCell = `${tbodyCellBase} sticky bg-[#e6edfa] font-bold text-slate-800 border-t-2 border-t-[#b8c7ec]`;
  const fixedCell = (col, content, style = {}) => (
    <td
      key={col.field}
      className={`${footCell} z-30 ${col.align === "right" ? "text-right" : "text-left"} ${col.field === "gap" ? gapSeparatorClass : ""}`}
      style={{ left: col.left, bottom: 0, width: col.width, ...style }}
    >
      {content}
    </td>
  );
  const [siCol, lineCol, partCol, monthlyCol, mtdPlanCol, mtdActualCol, gapCol] = FIXED_COLS;
  return (
    <tfoot>
      <tr>
        {fixedCell(siCol, "")}
        {fixedCell(lineCol, "TOTAL")}
        {fixedCell(partCol, <span className="font-normal text-slate-500 text-[10px]">{rows.length} FG</span>)}
        {fixedCell(monthlyCol, numberFmt(totals.monthly_plan))}
        {fixedCell(mtdPlanCol, numberFmt(totals.mtd_plan))}
        {fixedCell(mtdActualCol, numberFmt(totals.mtd_actual))}
        {fixedCell(gapCol, gapFmt(totals.gap), { color: gapColor(totals.gap) })}
        <td colSpan={1000} className={`${footCell} z-20`} style={{ bottom: 0 }} />
      </tr>
    </tfoot>
  );
};

const matTintCellClass = (tint, extra = "") =>
  `${tbodyCellBase} text-right ${
    tint === "supp" ? "bg-[#fde9d9]" : tint === "tot" ? "bg-[#e2efda] font-semibold text-slate-800" : "bg-white"
  } ${extra}`;

// Light grey divider marking where one Part Name group's columns end and
// the next begins in the body — mirrors the header's own group separator
// so the boundary stays visible scrolling down, not just in the header.
const bodyGroupSeparatorClass = "border-l border-gray-200";

// Tab 1: Materials — the original MAT Availability report, completely
// unchanged in filters/calculations/columns/APIs/behavior. Only its outer
// page frame (title) moved up to the shared MatAvailabilityStatus wrapper
// so both tabs sit under one title + tab bar.
const wallClock = (v) => {
  // the stock date is stored as the local wall-clock time and arrives as "...Z": read its parts as they are, no time-zone shift
  const d = new Date(v);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

const MaterialsBody = ({ onCountChange, onStockAsOfChange, searchText = "" }) => {
  const { user } = useContext(AuthContext);
  // Plant dropdown = only the plants this user may use (own plant + User Master > Data Access);
  // locked when the user has just the one plant.
  const [filterOptions, setFilterOptions] = useState({ plants: [], partNames: [] });
  const [plant, setPlant] = useState(user?.PlantCode || "");
  const [partNameId, setPartNameId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [lines, setLines] = useState([]);
  const [lineId, setLineId] = useState("");
  // Segment of the FG part (Mst_Product_Segment, active segments), filtered by the API like the Line
  const [segments, setSegments] = useState([]);
  const [segmentId, setSegmentId] = useState("");

  const [reportRows, setReportRows] = useState([]);
  const [operationColumns, setOperationColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [plantStockAsOf, setPlantStockAsOf] = useState(null);
  const [workingDays, setWorkingDays] = useState(null); // per plant, for the MTD Plan hover
  const [listedPartNames, setListedPartNames] = useState(null); // Part Names the report is limited to, for the Part No hover
  const [supplierStockAsOf, setSupplierStockAsOf] = useState(null);
  // Per-supplier breakdown for the hover tooltip only — same snapshot API
  // already used for the Excel export, just also fetched here and reduced
  // into a plant+material lookup map. No new API, no backend change.
  const [supplierSnapshotMap, setSupplierSnapshotMap] = useState(new Map());

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [data, mine] = await Promise.all([GetMatAvailabilityFiltersApi(), getMyPlants()]);
        setFilterOptions({ plants: Array.isArray(mine) ? mine : [], partNames: data?.partNames || [] });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load filter options.");
      }
    };
    loadFilters();
    getLines()
      .then((rows) => setLines((rows || []).filter((l) => l.Active_Status)))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load Line filter options.");
      });
    getProductSegments()
      .then((res) => setSegments(res.data || []))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load Segment filter options.");
      });
  }, []);

  // Line narrows to the selected Plant, same reasoning as Daily Production
  // Plan's own Module/Line filters — Line names repeat per plant.
  const lineOptions = useMemo(
    () => (plant ? lines.filter((l) => String(l.Plant_Code) === String(plant)) : []),
    [lines, plant]
  );

  const buildParams = () => ({
    plant: plant || undefined,
    partNameId: partNameId || undefined,
    lineId: lineId || undefined,
    segmentId: segmentId || undefined,
    month,
  });

  const fetchReport = async () => {
    if (loading) return;
    if (!plant) {
      toast.warning("Please select a Plant before searching.");
      return;
    }
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
      setWorkingDays(data?.workingDays || null);
      setListedPartNames(data?.partNames || null);
      setSupplierStockAsOf(data?.supplierStockAsOf || null);
      onStockAsOfChange?.(data?.plantStockAsOf || null, data?.supplierStockAsOf || null);
      onCountChange?.(data?.rows?.length || 0);

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
      setWorkingDays(null);
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
  // Distinct Part Names present in the CURRENT result set, in the order the
  // backend already sorted operationColumns (Part Name label, then opt_no)
  // — never hardcoded, and naturally collapses to just one group when a
  // Part Name filter is applied (or when only one Part Name has BOM data).
  const partNameGroups = useMemo(() => {
    const map = new Map();
    operationColumns.forEach((op) => {
      if (!map.has(op.part_name)) {
        map.set(op.part_name, { part_name: op.part_name, part_name_label: op.part_name_label, ops: [] });
      }
      map.get(op.part_name).ops.push(op);
    });
    return Array.from(map.values());
  }, [operationColumns]);

  const flatRows = useMemo(() => {
    return reportRows.map((fg, idx) => {
      const row = {
        id: `${fg.plant}-${fg.fg_part_no}-${idx}`,
        plant: fg.plant,
        line_name: fg.line_name,
        fg_part_no: fg.fg_part_no,
        fg_desc: fg.fg_desc,
        monthly_plan: fg.monthly_plan,
        mtd_plan: fg.mtd_plan,
        mtd_actual: fg.mtd_actual,
        gap: fg.gap,
        total_ih: fg.ih_total,
        total_supp: fg.supp_total,
        grand_total: fg.grand_total,
        all_children: fg.children,
      };
      fg.operations.forEach((op) => {
        // Matched by (part_name, opt_no) together — op.col_key already
        // encodes that pair, so two Part Names sharing an operation name
        // (e.g. both have "Forging") never mix up each other's children.
        const childrenForOp = fg.children.filter((c) => c.part_name === op.part_name && c.opt_no === op.opt_no);
        row[`op_${op.col_key}_ih`] = op.plant_qty;
        row[`op_${op.col_key}_supp`] = op.supplier_qty;
        row[`op_${op.col_key}_children`] = childrenForOp;
      });
      // Per-Part-Name subtotal (only that Part Name's own operations) —
      // e.g. SOCKET's own TOTAL vs BALLPIN's own TOTAL, each independent.
      partNameGroups.forEach((group) => {
        const opsForGroup = fg.operations.filter((op) => op.part_name === group.part_name);
        const ihSum = opsForGroup.reduce((sum, op) => sum + op.plant_qty, 0);
        const suppSum = opsForGroup.reduce((sum, op) => sum + op.supplier_qty, 0);
        row[`ptot_${group.part_name}_ih`] = ihSum;
        row[`ptot_${group.part_name}_supp`] = suppSum;
        row[`ptot_${group.part_name}_tot`] = ihSum + suppSum;
        row[`ptot_${group.part_name}_children`] = fg.children.filter((c) => c.part_name === group.part_name);
      });
      return row;
    });
  }, [reportRows, partNameGroups]);

  // Search filters the already-fetched rows by Plant code, Part No., or
  // Description — same behavior as the Daily Production Plan's own search
  // box, extended to also match Plant (no separate Plant filter needed).
  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    // Highest Monthly Plan first (same order as the MFG Daily Production Plan list)
    const sorted = [...flatRows].sort((a, b) => (Number(b.monthly_plan) || 0) - (Number(a.monthly_plan) || 0));
    if (!q) return sorted;
    return sorted.filter(
      (r) => r.fg_part_no?.toLowerCase().includes(q) || r.fg_desc?.toLowerCase().includes(q) || String(r.plant).toLowerCase().includes(q)
    );
  }, [flatRows, searchText]);

  // Grand-TOTAL block (summing across every Part Name) removed on screen
  // — each Part Name group already shows its own TOTAL, so a second
  // overall TOTAL block next to it was redundant. Excel export keeps its
  // own independent flag inside handleDownloadExcel, unaffected by this.
  const showGrandTotal = false;

  // Explicit pixel width for the whole table (fixed cols + every dynamic
  // op/total column at its own fixed width) — required for `table-layout:
  // fixed` to size columns exactly instead of stretching them to fill the
  // scroll container, which is what left extra blank room for future
  // columns instead of bloating Plan/Actual/GAP/etc.
  const matTotalWidth = useMemo(() => {
    const dynamicWidth = partNameGroups.reduce(
      (sum, group) => sum + group.ops.length * 2 * MAT_OP_COL_WIDTH + 2 * MAT_GROUP_TOTAL_IH_SUPP_WIDTH + MAT_GROUP_TOTAL_TOT_WIDTH,
      0
    );
    const grandTotalWidth = showGrandTotal ? 2 * MAT_GROUP_TOTAL_IH_SUPP_WIDTH + MAT_GROUP_TOTAL_TOT_WIDTH : 0;
    return FIXED_COLS_TOTAL_WIDTH + dynamicWidth + grandTotalWidth;
  }, [partNameGroups, showGrandTotal]);

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
      const breakup = await loadProdStatusBreakup(plant, month, flatRows);

      // Sheet 1 — the exact pivot layout: grouped 2-row header, one group
      // PER PART NAME actually present (dynamic label — never hardcoded
      // "SOCKET"), each spanning its own operations' IH/Supp pairs plus its
      // own TOTAL block; an extra overall TOTAL block only when more than
      // one Part Name is present. One row per Plant+FG. Fixed-column
      // headers (Plant/FG Part No/Monthly Plan/MTD Plan/MTD Actual/Gap) must live in row 1 — the
      // "!merges" below span rows 1-3 for each of them, and a merged cell
      // only ever displays its TOP-LEFT cell's value, so putting the text
      // in row 3 instead (as before) rendered as blank headers.
      const fixedCols = ["Plant", "FG_Part_No", "FG Part Description", "Monthly Plan", "MTD Plan", "MTD Actual", "Gap"];
      const showGrandTotal = partNameGroups.length > 1;
      const headerRow1 = [...fixedCols]; // the fixed-column labels sit in the first header row (merged down over the three header rows)
      const headerRow2 = [...fixedCols.map(() => "")];
      const headerRow3 = [...fixedCols.map(() => "")];
      // Each Part Name's own column span: its Part Name label (row 0, first
      // cell of the span — the rest padded blank, since a merge only shows
      // its top-left cell but the row array must still match column count),
      // each operation's name (row 1) spanning its IH/Supp pair (row 2),
      // then that Part Name's own "TOTAL" (row 1) spanning IH/Supp/TOT (row 2).
      partNameGroups.forEach((group) => {
        const spanWidth = group.ops.length * 2 + 3; // + this group's own TOTAL's IH/Supp/TOT
        headerRow1.push(group.part_name_label, ...Array(spanWidth - 1).fill(""));
        group.ops.forEach((op) => {
          headerRow2.push(op.opt_name, "");
          headerRow3.push("IH", "Supp");
        });
        headerRow2.push("TOTAL", "", "");
        headerRow3.push("IH", "Supp", "TOT");
      });
      if (showGrandTotal) {
        // This "TOTAL" lives in row 0 (not row 1, unlike each Part Name's
        // own TOTAL above) because its merge spans rows 0-1 vertically (no
        // operation sub-groups sit above it), and a merge only ever
        // displays its TOP-LEFT cell's value.
        headerRow1.push("TOTAL", "", "");
        headerRow2.push("", "", "");
        headerRow3.push("IH", "Supp", "TOT");
      }

      const pivotAoa = [headerRow1, headerRow2, headerRow3];
      reportRows.forEach((fg) => {
        const opMap = new Map(fg.operations.map((op) => [op.col_key, op]));
        const row = [fg.plant, fg.fg_part_no, fg.fg_desc, fg.monthly_plan, fg.mtd_plan, fg.mtd_actual, fg.gap];
        partNameGroups.forEach((group) => {
          let ihSum = 0;
          let suppSum = 0;
          group.ops.forEach((op) => {
            const found = opMap.get(op.col_key);
            const ih = found ? found.plant_qty : 0;
            const supp = found ? found.supplier_qty : 0;
            row.push(found ? ih : "", found ? supp : "");
            ihSum += ih;
            suppSum += supp;
          });
          row.push(ihSum, suppSum, ihSum + suppSum);
        });
        if (showGrandTotal) row.push(fg.ih_total, fg.supp_total, fg.grand_total);
        pivotAoa.push(row);
      });

      const pivotSheet = XLSX.utils.aoa_to_sheet(pivotAoa);
      const lastCol = headerRow3.length - 1;
      pivotSheet["!merges"] = [
        // Fixed columns' headers span all 3 header rows.
        ...fixedCols.map((_, i) => ({ s: { r: 0, c: i }, e: { r: 2, c: i } })),
      ];
      let mergeCol = fixedCols.length;
      partNameGroups.forEach((group) => {
        const groupStart = mergeCol;
        const groupEnd = mergeCol + group.ops.length * 2 + 2; // + this group's own TOTAL's IH/Supp/TOT
        // Part Name label spans every one of its operations + its own TOTAL, row 0.
        pivotSheet["!merges"].push({ s: { r: 0, c: groupStart }, e: { r: 0, c: groupEnd } });
        // Each operation name spans its own IH/Supp pair, row 1.
        group.ops.forEach((_, i) => {
          pivotSheet["!merges"].push({ s: { r: 1, c: groupStart + i * 2 }, e: { r: 1, c: groupStart + i * 2 + 1 } });
        });
        // This Part Name's own "TOTAL" spans IH/Supp/TOT, row 1.
        pivotSheet["!merges"].push({ s: { r: 1, c: groupEnd - 2 }, e: { r: 1, c: groupEnd } });
        mergeCol = groupEnd + 1;
      });
      if (showGrandTotal) {
        // Overall "TOTAL" spans IH/Supp/TOT, row 0 AND row 1 (no operation
        // sub-groups underneath it, so it merges straight down like the
        // fixed columns do).
        pivotSheet["!merges"].push({ s: { r: 0, c: mergeCol }, e: { r: 1, c: mergeCol + 2 } });
      }
      const fixedColWidths = [8, 14, 28, 13, 10, 12, 10]; // Plant, FG_Part_No, FG Part Description, Monthly Plan, MTD Plan, MTD Actual, Gap
      pivotSheet["!cols"] = [...fixedColWidths.map((wch) => ({ wch })), ...Array(lastCol + 1 - fixedCols.length).fill({ wch: 9 })];
      for (let r = 0; r <= 2; r++) {
        for (let c = 0; c <= lastCol; c++) {
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
            "Part Name": child.part_name_label,
            Operation: child.opt_name,
            "IH (Plant) Qty": child.plant_qty,
            "Plant Stock Qty": child.plant_stock_qty ?? child.plant_qty,
            "GRN 103-105 Pending Qty": child.grn103_qty || 0,
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
      // the snapshot sheets contain only the plants this user may use
      const allowedPlantCodes = new Set(filterOptions.plants.map((p) => String(p.Plant_Code)));
      const plantStockRows = (plantSnapshot?.rows || []).filter((r) => allowedPlantCodes.has(String(r.plant))).map((r) => ({
        Plant: r.plant,
        "Storage Location": r.storage_location,
        "Material Code": r.material_code,
        "Material Description": r.material_desc,
        UOM: r.uom,
        "Unrestricted Qty": r.unrestricted_qty,
        "Quality Inspection Qty": r.quality_inspection_qty,
        "Blocked Qty": r.blocked_qty,
        "Stock Date": r.stock_date ? format(wallClock(r.stock_date), "dd-MM-yyyy HH:mm") : "",
      }));

      // Sheet 4 — the exact latest Supplier Stock batch used for this month
      // (same batch the report itself pulled Supp figures from).
      const supplierStockRows = (supplierSnapshot?.rows || []).filter((r) => allowedPlantCodes.has(String(r.plant))).map((r) => ({
        Plant: r.plant,
        "Supplier Code": r.supplier_code,
        "Supplier Name": r.supplier_name,
        "Material Code": r.material_code,
        "Material Description": r.material_desc,
        "Unrestricted Qty": r.unrestricted_qty,
        "Stock Date": r.stock_date ? format(wallClock(r.stock_date), "dd-MM-yyyy HH:mm") : "",
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, pivotSheet, "MAT Availability Summary");
      XLSX.utils.book_append_sheet(wb, createSheet(detailRows, "FFF4CC"), "Child Part Detail");
      XLSX.utils.book_append_sheet(wb, createSheet(plantStockRows, "D9EAD3"), "Plant Stock Snapshot");
      XLSX.utils.book_append_sheet(wb, createSheet(supplierStockRows, "D9EAD3"), "Supplier Stock Snapshot");
      if (breakup) buildProdStatusBreakupSheets(flatRows, breakup, month).forEach(([name, ws]) => XLSX.utils.book_append_sheet(wb, ws, name));

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
    <>
      {/* Compact filter toolbar — Plant, Part Name, Month + Search only */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Autocomplete
          size="small"
          disabled={filterOptions.plants.length <= 1}
          options={filterOptions.plants}
          value={filterOptions.plants.find((p) => String(p.Plant_Code) === String(plant)) || null}
          onChange={(e, newVal) => setPlant(newVal ? newVal.Plant_Code : "")}
          getOptionLabel={(p) => (p ? myPlantLabel(p) : "")}
          isOptionEqualToValue={(o, v) => o.Plant_Code === v.Plant_Code}
          sx={compactFieldSx(215)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Plant" placeholder="Select Plant" required error={!plant} />}
        />

        <Autocomplete
          size="small"
          options={segments}
          value={segments.find((x) => String(x.prod_seg_id) === String(segmentId)) || null}
          onChange={(e, newVal) => setSegmentId(newVal ? newVal.prod_seg_id : "")}
          getOptionLabel={(x) => (x ? x.seg_name : "")}
          isOptionEqualToValue={(o, v) => o.prod_seg_id === v.prod_seg_id}
          sx={compactFieldSx(150)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Segment" placeholder="All Segments" />}
        />

        <Autocomplete
          size="small"
          options={filterOptions.partNames}
          value={filterOptions.partNames.find((p) => String(p.Prod_ID) === String(partNameId)) || null}
          onChange={(e, newVal) => setPartNameId(newVal ? newVal.Prod_ID : "")}
          getOptionLabel={(p) => (p ? p.Name : "")}
          isOptionEqualToValue={(o, v) => o.Prod_ID === v.Prod_ID}
          sx={compactFieldSx(180)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Part Name" placeholder="All Part Names" />}
        />

        <Autocomplete
          size="small"
          disabled={!plant}
          options={lineOptions}
          value={lineOptions.find((l) => String(l.Line_ID) === String(lineId)) || null}
          onChange={(e, newVal) => setLineId(newVal ? newVal.Line_ID : "")}
          getOptionLabel={(l) => (l ? l.Line_Name : "")}
          isOptionEqualToValue={(o, v) => o.Line_ID === v.Line_ID}
          sx={compactFieldSx(170)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Line" placeholder={plant ? "All Lines" : "Select Plant first"} />}
        />

        <TextField
          size="small" label="Month" type="month" value={month}
          onChange={(e) => setMonth(e.target.value)}
          sx={compactFieldSx(140)}
          InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
        />

        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
          <Button
            onClick={fetchReport}
            disabled={loading || !plant}
            variant="contained"
            disableElevation
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
          <Button
            onClick={handleDownloadExcel}
            disabled={excelLoading}
            variant="contained"
            disableElevation
            startIcon={excelLoading ? <CircularProgress size={12} color="inherit" /> : <FaFileExcel size={13} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
          >
            {excelLoading ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      {/* Main report grid — a plain, scrollable native <table> (same
          pattern as the Daily Production Plan screen's own plan-entry
          grid) instead of DataGrid, styled with Tailwind utility classes:
          a manually-built 3-row grouped sticky header mirroring the
          original columnGroupingModel/Excel merge layout, PLUS the first
          fixed columns (SI/Line/Part No + Description/Monthly
          Plan/MTD Plan/MTD Actual/Gap) pinned via sticky-left so they stay
          visible while the dynamic operation columns scroll horizontally,
          with a shadow/border after Gap marking the fixed/scrollable
          boundary, and a sticky TOTAL row at the bottom. */}
      <style>{matScrollbarCss}</style>
      <div className="mat-avail-scroll flex-1 min-h-0 overflow-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table style={{ width: matTotalWidth, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}>
          <colgroup>
            {FIXED_COLS.map((col) => (
              <col key={col.field} style={{ width: col.width }} />
            ))}
            {partNameGroups.map((group) => (
              <React.Fragment key={group.part_name}>
                {group.ops.flatMap((op) => [
                  <col key={`${op.col_key}_ih`} style={{ width: MAT_OP_COL_WIDTH }} />,
                  <col key={`${op.col_key}_supp`} style={{ width: MAT_OP_COL_WIDTH }} />,
                ])}
                <col key={`${group.part_name}_tih`} style={{ width: MAT_GROUP_TOTAL_IH_SUPP_WIDTH }} />
                <col key={`${group.part_name}_tsupp`} style={{ width: MAT_GROUP_TOTAL_IH_SUPP_WIDTH }} />
                <col key={`${group.part_name}_ttot`} style={{ width: MAT_GROUP_TOTAL_TOT_WIDTH }} />
              </React.Fragment>
            ))}
            {showGrandTotal && (
              <>
                <col style={{ width: MAT_GROUP_TOTAL_IH_SUPP_WIDTH }} />
                <col style={{ width: MAT_GROUP_TOTAL_IH_SUPP_WIDTH }} />
                <col style={{ width: MAT_GROUP_TOTAL_TOT_WIDTH }} />
              </>
            )}
          </colgroup>
          <thead>
            <tr>
              {FIXED_COLS.map((col) => (
                <th key={col.field} rowSpan={3} className={matFixedHeadClass(col)} style={matFixedHeadStyle(col)}>
                  {col.field === "mtd_plan" ? <WorkingDaysTip kind="mtd" wd={workingDays && workingDays[plant]}>{col.label}</WorkingDaysTip> : col.field === "monthly_plan" ? <InfoTip trigger={col.label} {...monthlyPlanTipProps()} /> : col.field === "fg_part_no" ? <InfoTip trigger={col.label} title="FG parts listed" points={fgPartTipPoints(listedPartNames, false)} /> : <HeadTip tip={col.tip}>{col.label}</HeadTip>}
                </th>
              ))}
              {partNameGroups.map((group) => (
                <th key={group.part_name} colSpan={group.ops.length * 2 + 3} className={`${matTheadCellClass()} ${groupSeparatorClass}`} style={{ top: 0, height: HEAD_ROW_H }}>
                  <HeadTip tip={`${group.part_name_label}: its operations (IH / Supp stock of the child parts) and its own TOTAL`}>{group.part_name_label}</HeadTip>
                </th>
              ))}
              {showGrandTotal && (
                <th rowSpan={2} colSpan={3} className={`${matTheadCellClass()} ${groupSeparatorClass}`} style={{ top: 0 }}><HeadTip tip="TOTAL across all part names: IH, Supp and TOT added up">TOTAL</HeadTip></th>
              )}
            </tr>
            <tr>
              {partNameGroups.map((group) => (
                <React.Fragment key={group.part_name}>
                  {group.ops.map((op) => (
                    <th key={op.col_key} colSpan={2} className={`${matTheadCellClass()} ${groupSeparatorClass}`} style={{ top: HEAD_ROW_H, height: HEAD_ROW_H }}>
                      <HeadTip tip={`${op.opt_name}: IH (plant stock + GRN 103-105 Pending) and Supp (supplier) stock of the child parts used at this operation`}>{op.opt_name}</HeadTip>
                    </th>
                  ))}
                  <th colSpan={3} className={`${matTheadCellClass()} ${groupSeparatorClass}`} style={{ top: HEAD_ROW_H, height: HEAD_ROW_H }}>
                    <HeadTip tip={`TOTAL of ${group.part_name_label}: IH, Supp and TOT added up across all its operations`}>TOTAL</HeadTip>
                  </th>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              {partNameGroups.map((group) => (
                <React.Fragment key={group.part_name}>
                  {group.ops.map((op) => (
                    <React.Fragment key={op.col_key}>
                      <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_IH}>IH</HeadTip></th>
                      <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_SUPP}>Supp</HeadTip></th>
                    </React.Fragment>
                  ))}
                  <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_IH}>IH</HeadTip></th>
                  <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_SUPP}>Supp</HeadTip></th>
                  <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_TOT}>TOT</HeadTip></th>
                </React.Fragment>
              ))}
              {showGrandTotal && (
                <>
                  <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_IH}>IH</HeadTip></th>
                  <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_SUPP}>Supp</HeadTip></th>
                  <th className={matTheadCellClass()} style={{ top: HEAD_ROW_H * 2, height: HEAD_ROW_H }}><HeadTip tip={TIP_TOT}>TOT</HeadTip></th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={1000} className="text-center py-7">
                  <CircularProgress size={20} />
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={1000} className="text-center py-7 text-slate-400 text-xs">
                  No MAT Availability data found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} className="group">
                  <td className={matFixedBodyClass(FIXED_COLS[0])} style={matFixedBodyStyle(FIXED_COLS[0])}>{idx + 1}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[1])} style={matFixedBodyStyle(FIXED_COLS[1])} title={row.line_name || ""}>{row.line_name || "-"}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[2])} style={matFixedBodyStyle(FIXED_COLS[2])} title={`${row.fg_part_no} — ${row.fg_desc}`}>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ color: "#0052cc", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.fg_part_no}</div>
                      <div style={{ color: "#6b7280", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.fg_desc}</div>
                    </div>
                  </td>
                  <td className={matFixedBodyClass(FIXED_COLS[3])} style={matFixedBodyStyle(FIXED_COLS[3])}>{numberFmt(row.monthly_plan)}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[4])} style={matFixedBodyStyle(FIXED_COLS[4])}>{numberFmt(row.mtd_plan)}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[5])} style={matFixedBodyStyle(FIXED_COLS[5])}>{numberFmt(row.mtd_actual)}</td>
                  <td className={`${matFixedBodyClass(FIXED_COLS[6])} font-semibold`} style={{ ...matFixedBodyStyle(FIXED_COLS[6]), color: gapColor(row.gap) }}>{gapFmt(row.gap)}</td>
                  {partNameGroups.map((group) => (
                    <React.Fragment key={group.part_name}>
                      {group.ops.map((op) => (
                        <React.Fragment key={op.col_key}>
                          <td className={matTintCellClass("ih")}>
                            <ChildPartTooltip value={row[`op_${op.col_key}_ih`]} children={row[`op_${op.col_key}_children`]} side="plant_qty" plant={row.plant} supplierMap={supplierSnapshotMap} />
                          </td>
                          <td className={matTintCellClass("supp")}>
                            <ChildPartTooltip value={row[`op_${op.col_key}_supp`]} children={row[`op_${op.col_key}_children`]} side="supplier_qty" plant={row.plant} supplierMap={supplierSnapshotMap} />
                          </td>
                        </React.Fragment>
                      ))}
                      <td className={matTintCellClass("ih")}>
                        <ChildPartTooltip value={row[`ptot_${group.part_name}_ih`]} children={(row[`ptot_${group.part_name}_children`] || []).filter((c) => c.plant_qty > 0)} side="plant_qty" plant={row.plant} supplierMap={supplierSnapshotMap} />
                      </td>
                      <td className={matTintCellClass("supp")}>
                        <ChildPartTooltip value={row[`ptot_${group.part_name}_supp`]} children={(row[`ptot_${group.part_name}_children`] || []).filter((c) => c.supplier_qty > 0)} side="supplier_qty" plant={row.plant} supplierMap={supplierSnapshotMap} />
                      </td>
                      <td className={matTintCellClass("tot")}>
                        {numberFmt(row[`ptot_${group.part_name}_tot`])}
                      </td>
                    </React.Fragment>
                  ))}
                  {showGrandTotal && (
                    <>
                      <td className={matTintCellClass("ih")}>
                        <ChildPartTooltip value={row.total_ih} children={(row.all_children || []).filter((c) => c.plant_qty > 0)} side="plant_qty" plant={row.plant} supplierMap={supplierSnapshotMap} />
                      </td>
                      <td className={matTintCellClass("supp")}>
                        <ChildPartTooltip value={row.total_supp} children={(row.all_children || []).filter((c) => c.supplier_qty > 0)} side="supplier_qty" plant={row.plant} supplierMap={supplierSnapshotMap} />
                      </td>
                      <td className={matTintCellClass("tot")}>
                        {numberFmt(row.grand_total)}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {!loading && filteredRows.length > 0 && <SummaryFooter rows={filteredRows} />}
        </table>
      </div>
    </>
  );
};

// Tab 2: Production-IH — same report structure/filters/APIs as Materials,
// restricted server-side to assembly-part child rows (assemblyOnly=true),
// showing only IH data plus the derived Set of Parts column (MIN of IH
// across this FG's operation columns).
const ProductionIHBody = ({ onCountChange, onStockAsOfChange, searchText = "" }) => {
  const { user } = useContext(AuthContext);
  // Plant dropdown = only the plants this user may use (own plant + User Master > Data Access);
  // locked when the user has just the one plant.
  const [filterOptions, setFilterOptions] = useState({ plants: [], partNames: [] });
  const [plant, setPlant] = useState(user?.PlantCode || "");
  const [partNameId, setPartNameId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [lines, setLines] = useState([]);
  const [lineId, setLineId] = useState("");
  // Segment of the FG part (Mst_Product_Segment, active segments), filtered by the API like the Line
  const [segments, setSegments] = useState([]);
  const [segmentId, setSegmentId] = useState("");

  const [reportRows, setReportRows] = useState([]);
  const [operationColumns, setOperationColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [plantStockAsOf, setPlantStockAsOf] = useState(null);
  const [workingDays, setWorkingDays] = useState(null); // per plant, for the MTD Plan hover
  const [listedPartNames, setListedPartNames] = useState(null); // Part Names the report is limited to, for the Part No hover
  const [excelLoading, setExcelLoading] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [data, mine] = await Promise.all([GetMatAvailabilityFiltersApi(), getMyPlants()]);
        setFilterOptions({ plants: Array.isArray(mine) ? mine : [], partNames: data?.partNames || [] });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load filter options.");
      }
    };
    loadFilters();
    getLines()
      .then((rows) => setLines((rows || []).filter((l) => l.Active_Status)))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load Line filter options.");
      });
    getProductSegments()
      .then((res) => setSegments(res.data || []))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load Segment filter options.");
      });
  }, []);

  // Line narrows to the selected Plant, same reasoning as Daily Production
  // Plan's own Module/Line filters — Line names repeat per plant.
  const lineOptions = useMemo(
    () => (plant ? lines.filter((l) => String(l.Plant_Code) === String(plant)) : []),
    [lines, plant]
  );

  const buildParams = () => ({
    plant: plant || undefined,
    partNameId: partNameId || undefined,
    lineId: lineId || undefined,
    segmentId: segmentId || undefined,
    month,
    assemblyOnly: true,
  });

  const fetchReport = async () => {
    if (loading) return;
    if (!plant) {
      toast.warning("Please select a Plant before searching.");
      return;
    }
    setLoading(true);
    try {
      const data = await GetMatAvailabilityReportApi(buildParams());
      setReportRows(data?.rows || []);
      setOperationColumns(data?.operationColumns || []);
      setPlantStockAsOf(data?.plantStockAsOf || null);
      setWorkingDays(data?.workingDays || null);
      setListedPartNames(data?.partNames || null);
      onStockAsOfChange?.(data?.plantStockAsOf || null, null);
      onCountChange?.(data?.rows?.length || 0);
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load Production-IH report.");
      setReportRows([]);
      setOperationColumns([]);
      setPlantStockAsOf(null);
      setWorkingDays(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flatRows = useMemo(() => {
    return reportRows.map((fg, idx) => {
      const row = {
        id: `${fg.plant}-${fg.fg_part_no}-${idx}`,
        plant: fg.plant,
        line_name: fg.line_name,
        fg_part_no: fg.fg_part_no,
        fg_desc: fg.fg_desc,
        monthly_plan: fg.monthly_plan,
        mtd_plan: fg.mtd_plan,
        mtd_actual: fg.mtd_actual,
        gap: fg.gap,
        set_of_parts: fg.set_of_parts,
        all_children: fg.children,
      };
      fg.operations.forEach((op) => {
        // Matched by (part_name, opt_no) together via op.col_key — two Part
        // Names sharing an operation name (e.g. both have "Forging") never
        // get merged into one column.
        const childrenForOp = fg.children.filter((c) => c.part_name === op.part_name && c.opt_no === op.opt_no);
        row[`op_${op.col_key}_ih`] = op.plant_qty;
        row[`op_${op.col_key}_children`] = childrenForOp;
      });
      return row;
    });
  }, [reportRows]);

  // Search filters the already-fetched rows by Plant code, Part No., or
  // Description — same behavior as the Daily Production Plan's own search
  // box, extended to also match Plant (no separate Plant filter needed).
  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    // Highest Monthly Plan first (same order as the MFG Daily Production Plan list)
    const sorted = [...flatRows].sort((a, b) => (Number(b.monthly_plan) || 0) - (Number(a.monthly_plan) || 0));
    if (!q) return sorted;
    return sorted.filter(
      (r) => r.fg_part_no?.toLowerCase().includes(q) || r.fg_desc?.toLowerCase().includes(q) || String(r.plant).toLowerCase().includes(q)
    );
  }, [flatRows, searchText]);

  // Distinct Part Names present in the CURRENT result set — never
  // hardcoded, and naturally collapses to one group when a Part Name
  // filter is applied (or only one Part Name has assembly-part BOM data).
  const partNameGroups = useMemo(() => {
    const map = new Map();
    operationColumns.forEach((op) => {
      if (!map.has(op.part_name)) {
        map.set(op.part_name, { part_name: op.part_name, part_name_label: op.part_name_label, ops: [] });
      }
      map.get(op.part_name).ops.push(op);
    });
    return Array.from(map.values());
  }, [operationColumns]);

  // Set of Parts sits outside every Part Name group as its own top-level
  // column — it's a whole-FG bottleneck figure across ALL operations
  // regardless of Part Name, unchanged from before this fix.

  // Explicit pixel width for the whole table — see matTotalWidth in
  // MaterialsBody for why `table-layout: fixed` needs this.
  const ihTotalWidth = useMemo(() => {
    const opCount = partNameGroups.reduce((sum, group) => sum + group.ops.length, 0);
    return FIXED_COLS_TOTAL_WIDTH + opCount * IH_OP_COL_WIDTH + IH_SET_OF_PARTS_WIDTH;
  }, [partNameGroups]);

  // Excel of the Production-IH report as it is on screen (same rows as the search box shows, same columns:
  // fixed columns, each Part Name group with its operations, Set of Parts, a TOTAL row) + a child-part detail sheet.
  const handleDownloadExcel = async () => {
    if (excelLoading) return;
    if (filteredRows.length === 0) {
      toast.warning("No data available to export.");
      return;
    }
    setExcelLoading(true);
    try {
      const breakup = await loadProdStatusBreakup(plant, month, filteredRows);
      const fixedCols = ["SI", "Plant", "Line", "FG Part No", "FG Part Description", "Monthly Plan", "MTD Plan", "MTD Actual", "Gap"];
      // the label goes in row 1: a merged cell only shows its top-left cell
      const row1 = [...fixedCols];
      const row2 = fixedCols.map(() => "");
      partNameGroups.forEach((group) => {
        row1.push(group.part_name_label, ...Array(Math.max(group.ops.length - 1, 0)).fill(""));
        group.ops.forEach((op) => row2.push(op.opt_name));
      });
      row1.push("Set of Parts");
      row2.push("");

      const aoa = [row1, row2];
      filteredRows.forEach((r, i) => {
        const line = [i + 1, r.plant, r.line_name || "", r.fg_part_no, r.fg_desc, r.monthly_plan, r.mtd_plan, r.mtd_actual, r.gap];
        partNameGroups.forEach((group) => group.ops.forEach((op) => {
          const v = r[`op_${op.col_key}_ih`];
          line.push(v === undefined || v === null ? "" : v);
        }));
        line.push(r.set_of_parts === undefined || r.set_of_parts === null ? "" : r.set_of_parts);
        aoa.push(line);
      });
      const sum = (key) => filteredRows.reduce((t, r) => t + (Number(r[key]) || 0), 0);
      const opCount = partNameGroups.reduce((n, g) => n + g.ops.length, 0);
      aoa.push(["", "", "", "TOTAL", `${filteredRows.length} FG`, sum("monthly_plan"), sum("mtd_plan"), sum("mtd_actual"), sum("gap"), ...Array(opCount + 1).fill("")]);

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const lastCol = row1.length - 1;
      ws["!merges"] = fixedCols.map((_, c) => ({ s: { r: 0, c }, e: { r: 1, c } }));
      let c0 = fixedCols.length;
      partNameGroups.forEach((group) => {
        if (group.ops.length > 1) ws["!merges"].push({ s: { r: 0, c: c0 }, e: { r: 0, c: c0 + group.ops.length - 1 } });
        c0 += group.ops.length;
      });
      ws["!merges"].push({ s: { r: 0, c: lastCol }, e: { r: 1, c: lastCol } });
      ws["!cols"] = [{ wch: 5 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 13 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, ...Array(opCount).fill({ wch: 13 }), { wch: 12 }];
      ws["!freeze"] = { xSplit: 5, ySplit: 2 };
      const headStyle = { font: { bold: true }, fill: { fgColor: { rgb: "DCE6F1" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
      for (let r = 0; r <= 1; r++) for (let c = 0; c <= lastCol; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell) cell.s = headStyle;
      }
      const totalRow = aoa.length - 1;
      for (let c = 0; c <= lastCol; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: totalRow, c })];
        if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "E6EDFA" } } };
      }

      const detail = [];
      filteredRows.forEach((r) => {
        (r.all_children || []).forEach((child) => {
          detail.push({
            Plant: r.plant,
            Line: r.line_name || "",
            "FG Part No": r.fg_part_no,
            "FG Description": r.fg_desc,
            "Child Part": child.child_part_no,
            "Child Description": child.child_desc,
            "Part Name": child.part_name_label,
            Operation: child.opt_name,
            "IH (Plant) Qty": child.plant_qty,
          });
        });
      });
      const detailSheet = XLSX.utils.json_to_sheet(detail);
      if (detail.length > 0) {
        Object.keys(detail[0]).forEach((_, c) => {
          const cell = detailSheet[XLSX.utils.encode_cell({ r: 0, c })];
          if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "FFF4CC" } }, alignment: { horizontal: "center" } };
        });
        detailSheet["!cols"] = [{ wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 30 }, { wch: 18 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Production-IH");
      XLSX.utils.book_append_sheet(wb, detailSheet, "Child Part Detail");
      if (breakup) buildProdStatusBreakupSheets(filteredRows, breakup, month).forEach(([name, ws]) => XLSX.utils.book_append_sheet(wb, ws, name));
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Production_IH_${plant}_${month}.xlsx`;
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
    <>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Autocomplete
          size="small"
          disabled={filterOptions.plants.length <= 1}
          options={filterOptions.plants}
          value={filterOptions.plants.find((p) => String(p.Plant_Code) === String(plant)) || null}
          onChange={(e, newVal) => setPlant(newVal ? newVal.Plant_Code : "")}
          getOptionLabel={(p) => (p ? myPlantLabel(p) : "")}
          isOptionEqualToValue={(o, v) => o.Plant_Code === v.Plant_Code}
          sx={compactFieldSx(215)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Plant" placeholder="Select Plant" required error={!plant} />}
        />

        <Autocomplete
          size="small"
          options={segments}
          value={segments.find((x) => String(x.prod_seg_id) === String(segmentId)) || null}
          onChange={(e, newVal) => setSegmentId(newVal ? newVal.prod_seg_id : "")}
          getOptionLabel={(x) => (x ? x.seg_name : "")}
          isOptionEqualToValue={(o, v) => o.prod_seg_id === v.prod_seg_id}
          sx={compactFieldSx(150)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Segment" placeholder="All Segments" />}
        />

        <Autocomplete
          size="small"
          options={filterOptions.partNames}
          value={filterOptions.partNames.find((p) => String(p.Prod_ID) === String(partNameId)) || null}
          onChange={(e, newVal) => setPartNameId(newVal ? newVal.Prod_ID : "")}
          getOptionLabel={(p) => (p ? p.Name : "")}
          isOptionEqualToValue={(o, v) => o.Prod_ID === v.Prod_ID}
          sx={compactFieldSx(180)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Part Name" placeholder="All Part Names" />}
        />

        <Autocomplete
          size="small"
          disabled={!plant}
          options={lineOptions}
          value={lineOptions.find((l) => String(l.Line_ID) === String(lineId)) || null}
          onChange={(e, newVal) => setLineId(newVal ? newVal.Line_ID : "")}
          getOptionLabel={(l) => (l ? l.Line_Name : "")}
          isOptionEqualToValue={(o, v) => o.Line_ID === v.Line_ID}
          sx={compactFieldSx(170)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Line" placeholder={plant ? "All Lines" : "Select Plant first"} />}
        />

        <TextField
          size="small" label="Month" type="month" value={month}
          onChange={(e) => setMonth(e.target.value)}
          sx={compactFieldSx(140)}
          InputLabelProps={{ shrink: true, sx: { fontSize: 12 } }}
        />


        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
          <Button
            onClick={fetchReport}
            disabled={loading || !plant}
            variant="contained"
            disableElevation
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
          <Button
            onClick={handleDownloadExcel}
            disabled={excelLoading || loading}
            variant="contained"
            disableElevation
            startIcon={excelLoading ? <CircularProgress size={12} color="inherit" /> : <FaFileExcel size={13} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
          >
            {excelLoading ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      <style>{matScrollbarCss}</style>
      <div className="mat-avail-scroll flex-1 min-h-0 overflow-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table style={{ width: ihTotalWidth, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}>
          <colgroup>
            {FIXED_COLS.map((col) => (
              <col key={col.field} style={{ width: col.width }} />
            ))}
            {partNameGroups.flatMap((group) => group.ops.map((op) => <col key={op.col_key} style={{ width: IH_OP_COL_WIDTH }} />))}
            <col style={{ width: IH_SET_OF_PARTS_WIDTH }} />
          </colgroup>
          <thead>
            <tr>
              {FIXED_COLS.map((col) => (
                <th key={col.field} rowSpan={2} className={matFixedHeadClass(col)} style={matFixedHeadStyle(col)}>
                  {col.field === "mtd_plan" ? <WorkingDaysTip kind="mtd" wd={workingDays && workingDays[plant]}>{col.label}</WorkingDaysTip> : col.field === "monthly_plan" ? <InfoTip trigger={col.label} {...monthlyPlanTipProps()} /> : col.field === "fg_part_no" ? <InfoTip trigger={col.label} title="FG parts listed" points={fgPartTipPoints(listedPartNames, true)} /> : <HeadTip tip={col.tip}>{col.label}</HeadTip>}
                </th>
              ))}
              {partNameGroups.map((group) => (
                <th key={group.part_name} colSpan={group.ops.length} className={`${matTheadCellClass()} ${groupSeparatorClass}`} style={{ top: 0, height: HEAD_ROW_H }}>
                  <HeadTip tip={`${group.part_name_label}: IH (plant stock) of the assembly child parts at each of its operations`}>{group.part_name_label}</HeadTip>
                </th>
              ))}
              <th rowSpan={2} className={`${matTheadCellClass("text-right")} ${groupSeparatorClass}`} style={{ top: 0 }}><HeadTip tip={TIP_SET_OF_PARTS}>Set of Parts</HeadTip></th>
            </tr>
            <tr>
              {partNameGroups.map((group) => (
                <React.Fragment key={group.part_name}>
                  {group.ops.map((op, opIdx) => (
                    <th key={op.col_key} className={`${matTheadCellClass()} ${opIdx === 0 ? groupSeparatorClass : ""}`} style={{ top: HEAD_ROW_H, height: HEAD_ROW_H }}>
                      <HeadTip tip={`${op.opt_name}: IH (plant stock) of the assembly child parts used at this operation`}>{op.opt_name}</HeadTip>
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={1000} className="text-center py-7">
                  <CircularProgress size={20} />
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={1000} className="text-center py-7 text-slate-400 text-xs">
                  No assembly-part rows found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={idx} className="group">
                  <td className={matFixedBodyClass(FIXED_COLS[0])} style={matFixedBodyStyle(FIXED_COLS[0])}>{idx + 1}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[1])} style={matFixedBodyStyle(FIXED_COLS[1])} title={row.line_name || ""}>{row.line_name || "-"}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[2])} style={matFixedBodyStyle(FIXED_COLS[2])} title={`${row.fg_part_no} — ${row.fg_desc}`}>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ color: "#0052cc", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.fg_part_no}</div>
                      <div style={{ color: "#6b7280", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.fg_desc}</div>
                    </div>
                  </td>
                  <td className={matFixedBodyClass(FIXED_COLS[3])} style={matFixedBodyStyle(FIXED_COLS[3])}>{numberFmt(row.monthly_plan)}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[4])} style={matFixedBodyStyle(FIXED_COLS[4])}>{numberFmt(row.mtd_plan)}</td>
                  <td className={matFixedBodyClass(FIXED_COLS[5])} style={matFixedBodyStyle(FIXED_COLS[5])}>{numberFmt(row.mtd_actual)}</td>
                  <td className={`${matFixedBodyClass(FIXED_COLS[6])} font-semibold`} style={{ ...matFixedBodyStyle(FIXED_COLS[6]), color: gapColor(row.gap) }}>{gapFmt(row.gap)}</td>
                  {partNameGroups.map((group) => (
                    <React.Fragment key={group.part_name}>
                      {group.ops.map((op, opIdx) => (
                        <td key={op.col_key} className={matTintCellClass("ih", opIdx === 0 ? bodyGroupSeparatorClass : "")}>
                          <ChildPartTooltip value={row[`op_${op.col_key}_ih`]} children={row[`op_${op.col_key}_children`]} side="plant_qty" plant={row.plant} showGrn={false} />
                        </td>
                      ))}
                    </React.Fragment>
                  ))}
                  <td className={matTintCellClass("tot", bodyGroupSeparatorClass)}>
                    {numberFmt(row.set_of_parts)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && filteredRows.length > 0 && <SummaryFooter rows={filteredRows} />}
        </table>
      </div>
    </>
  );
};

// Pill-style segmented tab control (icon + label + live record-count badge),
// with a sliding highlight that animates to the active segment's measured
// position — the same "capsule" tab pattern used in modern dashboard UIs.
const TAB_DEFS = [
  { key: "materials", label: "Materials", Icon: DescriptionOutlinedIcon },
  { key: "productionIH", label: "Production-IH", Icon: PrecisionManufacturingOutlinedIcon },
];

const PillTabs = ({ value, onChange, counts }) => {
  const btnRefs = React.useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = btnRefs.current[value];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [value, counts]);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        gap: 4,
        padding: 4,
        backgroundColor: "#eef0f3",
        borderRadius: 999,
        width: "fit-content",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: indicator.left,
          width: indicator.width,
          backgroundColor: "#fff",
          borderRadius: 999,
          boxShadow: "0 1px 6px rgba(16,24,40,0.14)",
          transition: "left .25s cubic-bezier(.4,0,.2,1), width .25s cubic-bezier(.4,0,.2,1)",
        }}
      />
      {TAB_DEFS.map((t, i) => {
        const active = value === i;
        const count = counts[t.key] ?? 0;
        return (
          <button
            key={t.key}
            ref={(el) => (btnRefs.current[i] = el)}
            onClick={() => onChange(i)}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: 999,
              padding: "7px 14px",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              color: active ? "#0066FF" : "#6b7280",
              transition: "color .2s ease",
            }}
          >
            <t.Icon sx={{ fontSize: 16 }} />
            <span>{t.label}</span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: 999,
                backgroundColor: active ? "#e8f0ff" : "#e2e5ea",
                color: active ? "#0066FF" : "#6b7280",
                transition: "background-color .2s ease, color .2s ease",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Shared page frame: title + Materials/Production-IH tabs. Materials keeps
// its exact original behavior (MaterialsBody, untouched); Production-IH is
// the new assembly-part-only IH view reusing the same report API/logic.
const MatAvailabilityStatus = () => {
  const [tab, setTab] = useState(0);
  const [counts, setCounts] = useState({ materials: 0, productionIH: 0 });
  // Plant/Supplier "stock as of" timestamps, reported up by whichever tab
  // last fetched — shown as a small grey line under the page title instead
  // of inside each tab's own filter toolbar.
  const [stockAsOf, setStockAsOf] = useState({
    materials: { plant: null, supplier: null },
    productionIH: { plant: null, supplier: null },
  });
  const activeStockAsOf = tab === 0 ? stockAsOf.materials : stockAsOf.productionIH;
  // Shared search box, sitting before the tabs — same placement as the
  // Daily Production Plan's own header search. Filters whichever tab is
  // currently active, each tab doing its own client-side filtering on its
  // own already-fetched rows by Part No. / Description.
  const [searchText, setSearchText] = useState("");

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
              color: "#1a2233",
              letterSpacing: 0.1,
              lineHeight: 1.3,
            }}
          >
            MFG Set of Parts - Stock Report{" "}
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 500, color: "#6b7280" }}>
              [MB52 / MBLB]
            </Typography>
          </Typography>
          {(activeStockAsOf.plant || activeStockAsOf.supplier) && (
            <Typography sx={{ fontSize: 9.5, color: "#9aa1ac", mt: 0.25, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
              {activeStockAsOf.plant && <span>PS - {format(wallClock(activeStockAsOf.plant), "dd-MMM-yyyy HH:mm")}</span>}
              {activeStockAsOf.plant && activeStockAsOf.supplier && <span style={{ color: "#d3d7dd" }}>|</span>}
              {activeStockAsOf.supplier && <span>SS - {format(wallClock(activeStockAsOf.supplier), "dd-MMM-yyyy HH:mm")}</span>}
            </Typography>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search Part No / Description"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} />,
            }}
            sx={compactFieldSx(230)}
          />
          <PillTabs value={tab} onChange={setTab} counts={counts} />
        </div>
      </div>

      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {tab === 0 ? (
          <MaterialsBody
            searchText={searchText}
            onCountChange={(c) => setCounts((s) => ({ ...s, materials: c }))}
            onStockAsOfChange={(plant, supplier) => setStockAsOf((s) => ({ ...s, materials: { plant, supplier } }))}
          />
        ) : (
          <ProductionIHBody
            searchText={searchText}
            onCountChange={(c) => setCounts((s) => ({ ...s, productionIH: c }))}
            onStockAsOfChange={(plant, supplier) => setStockAsOf((s) => ({ ...s, productionIH: { plant, supplier } }))}
          />
        )}
      </div>
    </div>
  );
};

export default MatAvailabilityStatus;
