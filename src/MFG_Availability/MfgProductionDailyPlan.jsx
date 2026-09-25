import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  TextField, Button, CircularProgress, Typography, Autocomplete, MenuItem, Select, Tooltip,
  Chip, Table, TableHead, TableBody, TableRow, TableCell,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from "@mui/x-data-grid";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InfoIcon from "@mui/icons-material/Info";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { format, startOfISOWeek, endOfISOWeek, getISOWeek } from "date-fns";
import { toast } from "react-toastify";
import { AuthContext } from "../Authentication/AuthContext";
import { getPlantdetails } from "../controller/CommonApiService";
import { getdetails as getModules } from "../controller/ModuleMasterapiservice";
import { getdetails as getLines } from "../controller/LineMasterapiservice";
import {
  GetMfgProductionDailyPlanGridApi,
  SaveMfgProductionDailyPlanApi,
  GetMfgProductionDailyPlanHistorySummaryApi,
  GetMfgProductionDailyPlanDayDetailApi,
} from "../controller/MfgProductionDailyPlanApiService";

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Plan History's Month/Year filter converts to the Start/End date range the
// backend still expects — End Date is always the calendar last day of that
// month (e.g. 30-09-2026 for September), not capped at "yesterday", per spec.
const monthStartStr = (year, month) => `${year}-${String(month).padStart(2, "0")}-01`;
const monthEndStr = (year, month) => {
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of "next" month = last day of `month`
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
};

const numberFmt = (v) => (v || v === 0 ? Number(v).toLocaleString("en-IN") : "0");

// Signed Gap formatting — "+100" / "-40" / "0", never just a bare positive
// number, so a gap is always immediately readable as ahead/behind/on-target.
const gapFmt = (v) => {
  const n = Number(v) || 0;
  if (n > 0) return `+${n.toLocaleString("en-IN")}`;
  return n.toLocaleString("en-IN");
};

// Mirrors the backend's buildPeriods() week-1 calculation (ISO week: Mon-Sun)
// purely for display — matches the "W-N" column the current date falls
// into, so the label is never independently wrong versus the grid.
const getIsoWeekInfo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return {
    weekNumber: getISOWeek(d),
    start: startOfISOWeek(d),
    end: endOfISOWeek(d),
  };
};

const compactFieldSx = (minWidth) => ({
  minWidth,
  flexShrink: 0,
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#fafbfc",
    // Fixed height + explicit vertical centering, applied to the root
    // itself (not just the inner input), so a plain TextField and an
    // Autocomplete's wrapped input line up on the exact same baseline —
    // MUI's own default paddings differ slightly between the two.
    minHeight: 30,
    display: "flex",
    alignItems: "center",
    padding: "0 7px !important",
    "& fieldset": { borderColor: "#dde1e7" },
    "&:hover fieldset": { borderColor: "#0066FF" },
    "&.Mui-focused fieldset": { borderColor: "#0066FF", borderWidth: "1.5px" },
    // Disabled state was visually indistinguishable from enabled (same bg,
    // same border) since we hardcode both above — make it obviously "off":
    // hatched/greyed background, dashed muted border, blocked cursor.
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

const cellKey = (fgPart, periodKey) => `${fgPart}|${periodKey}`;
// DAY cells are shift-wise — a distinct key shape from the plain WEEK
// cellKey above, so the two never collide. The shift lane list itself is
// never hardcoded here — it always comes from the grid API's own `shifts`
// array (that plant's active Mst_Shift rows).
const cellKeyShift = (fgPart, periodKey, shiftName) => `${fgPart}|${periodKey}|${shiftName}`;

// Plan-vs-Actual coloring for the Plan Entry grid — border-ONLY signal, on
// plain white backgrounds: green border when Actual has hit at least 90% of
// Plan, red border otherwise, neutral grey border when there's no Plan yet
// to judge against (a percentage against zero is meaningless). Text color
// is fixed regardless of this state — Plan is always blue, Actual is
// always black — see PLAN_TEXT_COLOR / ACTUAL_TEXT_COLOR below.
const CELL_COLORS = {
  none: { border: "#dde1e7", bg: "#ffffff", planBg: "#ffffff" },
  green: { border: "#1b7a43", bg: "#ffffff", planBg: "#ffffff" },
  red: { border: "#f0a8a8", bg: "#ffffff", planBg: "#ffffff" },
};
const PLAN_TEXT_COLOR = "#0052cc";
const ACTUAL_TEXT_COLOR = "#1a2233";
const getPlanActualColorKey = (actualQty, planQty) => {
  if (planQty === null || planQty === undefined || planQty === "" || Number(planQty) <= 0) {
    return "none";
  }
  const threshold = Number(planQty) * 0.9;
  return Number(actualQty) >= threshold ? "green" : "red";
};

// Shift-wise Plant Stock Availability — a SEPARATE highlight from the
// Plan-vs-Actual one above, applied only to the Plan input's border (never
// the Actual box, never the whole row): green >90% stock coverage, yellow
// >50-90%, red <=50%, none when there's no plan qty to judge (0/empty).
const STOCK_BORDER_COLORS = {
  none: "#dde1e7",
  green: "#1b7a43",
  yellow: "#c99a1e",
  red: "#f0a8a8",
};
// Matching light background tint for the Plan input ONLY (the Actual box
// stays plain white/unchanged) — same status, just also shown as a subtle
// fill so the Plan cell reads as a unit rather than border-only.
const STOCK_BG_COLORS = {
  none: "#ffffff",
  green: "#eafaf1",
  yellow: "#fff8e1",
  red: "#fdeeee",
};
const getStockCoverageColorKey = (coveragePct, planQty) => {
  if (planQty === null || planQty === undefined || planQty === "" || Number(planQty) <= 0) {
    return "none";
  }
  if (coveragePct > 90) return "green";
  if (coveragePct > 50) return "yellow";
  return "red";
};

// Sequential stock consumption across one FG row's entire week of DAY cells,
// processed in chronological plan_date order and then in the plant's own
// configured shift order (never hardcoded names/count) — a single Plant
// Stock pool (the row's "Set of Parts" bottleneck figure from the backend)
// is progressively drawn down shift by shift, day by day, exactly per the
// spec's sequential-consumption rule (never compared independently against
// the original total). WEEK buckets (W-39/W-40) are untouched — this is a
// DAY-only concept. Returns Map(`${periodKey}|${shiftName}` -> detail).
const computeStockCoverage = (dayPeriods, shifts, rowValues, totalStock) => {
  const map = new Map();
  let remaining = Number(totalStock) || 0;
  dayPeriods.forEach((p) => {
    shifts.forEach((s) => {
      const shiftName = s.shift_name;
      const key = `${p.key}|${shiftName}`;
      const raw = rowValues[key];
      const planQty = raw === "" || raw === null || raw === undefined ? 0 : Number(raw) || 0;
      const before = remaining;
      if (planQty <= 0) {
        map.set(key, { planQty: 0, before, used: 0, after: before, coveragePct: null, status: "No Plan" });
        return; // no plan this shift — stock pool untouched, nothing to cover
      }
      const used = Math.min(before, planQty);
      const after = Math.max(before - planQty, 0);
      const coveragePct = (used / planQty) * 100;
      // Same 90% / 50% thresholds as getStockCoverageColorKey() below, so the
      // status TEXT always agrees with the border/chip COLOR — previously
      // this said "Partially Covered" for ANY coverage > 0%, even something
      // like 15% (which the border already correctly shows as red/shortage).
      const status = coveragePct > 90 ? "Fully Covered" : coveragePct > 50 ? "Partially Covered" : "Stock Shortage";
      map.set(key, { planQty, before, used, after, coveragePct, status });
      remaining = after;
    });
  });
  return map;
};

// Strips everything but digits and caps length — the "Daily 4 digits /
// Weekly 5 digits" input-width rule, enforced live while typing (not just
// via a maxLength attribute, since type="number" inputs don't respect it
// consistently across browsers).
const capDigits = (raw, maxDigits) => raw.replace(/[^0-9]/g, "").slice(0, maxDigits);

// Editability rule, computed dynamically off `today` every render (never
// hardcoded to a specific date):
//   - DAY cells: editable only from today onward — a past day within the
//     current week is locked (nothing left to plan for a day already gone).
//   - The CURRENT week's own WEEK bucket (W-39): editable only when today
//     IS that week's Monday — once the week is underway, the week-level
//     total is considered locked in favor of the daily breakdown.
//   - The NEXT week's WEEK bucket (W-40) is unaffected by any of this —
//     always editable, since it's a forward-looking estimate regardless of
//     what day it is today.
// All comparisons are plain 'yyyy-MM-dd' string comparisons, which sort
// chronologically for same-format ISO date strings.
const isPeriodEditable = (period, today, currentWeekStart) => {
  if (period.period_type === "DAY") {
    return period.plan_date >= today;
  }
  if (period.plan_date === currentWeekStart) {
    return today === currentWeekStart;
  }
  return true;
};

// The day-detail info icon/popover only shows on today's own DAY cell —
// every other day (past or future) just doesn't render the icon at all.
const isWithinInfoWindow = (planDate, today) => planDate === today;

const EMPTY_ROW_VALUES = {};

const SectionHeader = ({ icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
    {icon}
    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#1a2233" }}>{title}</Typography>
  </div>
);

const STATUS_CHIP_SX = {
  "Fully Covered": { backgroundColor: "#eafaf1", color: "#1b7a43" },
  "Partially Covered": { backgroundColor: "#fff8e1", color: "#9a7411" },
  "Stock Shortage": { backgroundColor: "#fdeeee", color: "#b42323" },
  "No Plan": { backgroundColor: "#f6f7f9", color: "#5b6472" },
};

// The Plan Entry grid's day-detail popover — replaces the old lightweight
// hover summary AND the separate click-to-open Dialog with a single hover
// popover carrying the full content (Plan/Actual/Balance + per-shift Set of
// Parts tables). Data is fetched once per day cell, on first hover-open
// only (cached afterwards for that cell). Every number here comes from
// calculations that already exist elsewhere: the FG-level sequential stock
// consumption uses the exact same computeStockCoverage() the grid's own
// border-highlight already runs (called again here with the same inputs,
// not a second mechanism), and the per-child-part rows reuse that same
// function fed each child's own stock figure from the /getDayDetail
// endpoint (itself just the existing Set of Parts BOM+stock query, scoped
// to one FG). Nothing is computed twice by two different methods.
const DayInfoPopover = ({ plant, row, period, dayPeriods, shifts, rowValues, stockCoverage }) => {
  const [openState, setOpenState] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setOpenState(true);
    if (!detail && !loading) {
      setLoading(true);
      GetMfgProductionDailyPlanDayDetailApi({ plant, fg_part: row.fg_part, date: period.plan_date })
        .then(setDetail)
        .catch((error) => {
          console.error(error);
          toast.error("Failed to load day detail.");
        })
        .finally(() => setLoading(false));
    }
  };
  const handleClose = () => setOpenState(false);

  const dayHasAnyData = shifts.some((s) => {
    const c = stockCoverage.get(`${period.key}|${s.shift_name}`);
    const actualQty = row.cells[period.key]?.actual_shift?.[s.shift_name] || 0;
    return (c && c.planQty > 0) || actualQty > 0;
  });

  const shiftTotals = shifts.map((s) => ({
    shift_name: s.shift_name,
    coverage: stockCoverage.get(`${period.key}|${s.shift_name}`),
    actualQty: row.cells[period.key]?.actual_shift?.[s.shift_name] || 0,
  }));
  const dayTotals = shiftTotals.reduce(
    (acc, s) => ({ planned: acc.planned + (s.coverage?.planQty || 0), actual: acc.actual + s.actualQty }),
    { planned: 0, actual: 0 }
  );
  const lastCoverage = shiftTotals[shiftTotals.length - 1]?.coverage;
  const balanceToday = lastCoverage ? lastCoverage.after : (row.stock_available || 0);

  // Set of Parts table, ONE combined table pivoted Part x Shift — for each
  // child part, the SAME computeStockCoverage(), fed that one child's own
  // stock figure, read at every shift's slot in the same day/shift
  // sequence, so each row shows its opening Stock plus a Plan/Balance pair
  // per shift instead of three separate per-shift tables.
  const pivotedChildRows = (detail?.children || []).map((child) => {
    const childCoverage = computeStockCoverage(dayPeriods, shifts, rowValues, child.available_qty);
    const perShift = shifts.map((s) => {
      const c = childCoverage.get(`${period.key}|${s.shift_name}`);
      return {
        shift_name: s.shift_name,
        plan: c?.planQty || 0,
        balance: c?.after ?? child.available_qty,
      };
    });
    return { ...child, perShift };
  });

  // Wide enough to fit every shift's Plan/Balance columns with no
  // horizontal scroll — grows with however many shifts this plant has.
  const setOfPartsTableWidth = 260 + shifts.length * 120;
  const popoverWidth = Math.max(460, setOfPartsTableWidth + 40);

  const popoverContent = (
    <div style={{ width: popoverWidth, maxHeight: 460, display: "flex", flexDirection: "column" }}>
      {/* Header — FG part no. + description only, no date row. */}
      <div
        style={{
          padding: "10px 12px", borderBottom: "1px solid #eef0f3",
          backgroundColor: "#f8faff",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1a2233" }}>{row.fg_part_no}</span>
          <span style={{ fontSize: 11, color: "#6b7280" }}>{row.fg_part_desc}</span>
        </div>
      </div>

      <div style={{ padding: "10px 12px", overflowY: "auto", maxHeight: 400 }}>
        {/* Day summary — Plan | Actual | Balance, single line. */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            background: "#f8f9fb", border: "1px solid #eef0f3", borderRadius: 8,
            padding: "6px 12px", marginBottom: 12, fontSize: 12,
          }}
        >
          <span style={{ color: "#8a93a3" }}>Plan</span>
          <b style={{ color: PLAN_TEXT_COLOR }}>{numberFmt(dayTotals.planned)}</b>
          <span style={{ color: "#d3d7dd", margin: "0 4px" }}>|</span>
          <span style={{ color: "#8a93a3" }}>Actual</span>
          <b style={{ color: ACTUAL_TEXT_COLOR }}>{numberFmt(dayTotals.actual)}</b>
          <span style={{ color: "#d3d7dd", margin: "0 4px" }}>|</span>
          <span style={{ color: "#8a93a3" }}>Balance</span>
          <b>{numberFmt(balanceToday)}</b>
        </div>

        {!dayHasAnyData && !loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 4px 10px", color: "#8a93a3", fontSize: 11.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: 8 }} />
            No plan entered. No actual production recorded.
          </div>
        )}

        <SectionHeader icon={<Inventory2OutlinedIcon sx={{ fontSize: 15, color: "#6b7280" }} />} title="Set of Parts" />
        {loading ? (
          <div style={{ padding: 12, textAlign: "center" }}><CircularProgress size={16} /></div>
        ) : (pivotedChildRows.length ? (
          <div style={{ maxHeight: 220, overflowY: "auto", overflowX: "hidden", border: "1px solid #eef0f3", borderRadius: 8 }}>
            <Table size="small" stickyHeader sx={{ minWidth: setOfPartsTableWidth }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", verticalAlign: "bottom", backgroundColor: "#d0dcf5", color: "#000" }}>Part No</TableCell>
                  <TableCell rowSpan={2} sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", verticalAlign: "bottom", backgroundColor: "#d0dcf5", color: "#000" }}>Description</TableCell>
                  <TableCell rowSpan={2} align="right" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", verticalAlign: "bottom", backgroundColor: "#d0dcf5", color: "#000" }}>Stock</TableCell>
                  {shifts.map((s) => (
                    <TableCell key={s.shift_name} colSpan={2} align="center" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", borderLeft: "1px solid #c3d0ef", backgroundColor: "#d0dcf5", color: "#000" }}>
                      {s.shift_name}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {shifts.map((s) => (
                    <React.Fragment key={s.shift_name}>
                      <TableCell align="right" sx={{ fontSize: 10, fontWeight: 700, padding: "4px 6px", color: "#000", borderLeft: "1px solid #c3d0ef", backgroundColor: "#d0dcf5" }}>Plan</TableCell>
                      <TableCell align="right" sx={{ fontSize: 10, fontWeight: 700, padding: "4px 6px", color: "#000", backgroundColor: "#d0dcf5" }}>Balance</TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pivotedChildRows.map((c) => (
                  <TableRow key={c.child_part_no} hover>
                    <TableCell sx={{ fontSize: 10.5, fontWeight: 700, color: "#0052cc", padding: "4px 6px" }}>
                      {c.child_part_no}
                    </TableCell>
                    <TableCell sx={{ fontSize: 10.5, padding: "4px 6px", color: "#6b7280" }}>{c.child_desc}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 10.5, padding: "4px 6px" }}>{numberFmt(c.available_qty)}</TableCell>
                    {c.perShift.map((s) => (
                      <React.Fragment key={s.shift_name}>
                        <TableCell align="right" sx={{ fontSize: 10.5, padding: "4px 6px", borderLeft: "1px solid #eef0f3" }}>{numberFmt(s.plan)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px" }}>{numberFmt(s.balance)}</TableCell>
                      </React.Fragment>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#8a93a3", padding: "4px 2px" }}>No Set of Parts BOM configured for this FG.</div>
        ))}
      </div>
    </div>
  );

  return (
    <Tooltip
      title={popoverContent}
      arrow
      // Prefers opening upward (so it doesn't cover the same row's
      // neighboring day cells — "bottom-end" used to visually block the
      // next day's info icon until this one was dismissed), but the
      // "flip"/"preventOverflow" modifiers below let Popper measure against
      // the actual browser VIEWPORT (not just the table's own scroll
      // container) and automatically switch to "bottom-end" whenever
      // there's no room above — e.g. for the first couple of rows, where
      // opening upward would otherwise get clipped by the page header.
      placement="top-end"
      open={openState}
      onOpen={handleOpen}
      onClose={handleClose}
      PopperProps={{
        modifiers: [
          { name: "flip", enabled: true, options: { boundary: "viewport", fallbackPlacements: ["bottom-end", "top-start", "bottom-start"] } },
          { name: "preventOverflow", enabled: true, options: { boundary: "viewport", altAxis: true } },
        ],
      }}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: "#ffffff", color: "#1a2233", padding: 0,
            maxWidth: "none", borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(20,20,43,0.14)",
            border: "1px solid #eef0f3",
          },
        },
        arrow: { sx: { color: "#ffffff", "&::before": { border: "1px solid #eef0f3" } } },
      }}
    >
      <span
        style={{
          position: "absolute", top: 1, right: 1, zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 13, height: 13, borderRadius: "50%",
          backgroundColor: "#ffffff", cursor: "help",
        }}
      >
        <InfoIcon
          sx={{
            fontSize: 12,
            color: dayHasAnyData ? "#0066FF" : "#c7cfdb",
          }}
        />
      </span>
    </Tooltip>
  );
};

// One FG row of the Plan Entry grid, memoized: React.memo does a shallow
// prop comparison, and `rowValues` only gets a new object reference when
// THIS row's own values change (see the nested-by-fg_part `values` state in
// PlanEntryBody) — every other row's props are unchanged reference-wise, so
// typing in one cell no longer re-renders the whole (often 50-100 row)
// table on every keystroke, which was the cause of the multi-second input
// lag when typing a 4-digit number.
const PlanRow = React.memo(function PlanRow({
  row, idx, periods, shifts, rowValues, today, currentWeekStart, onCellChange, onShiftCellChange, plant,
}) {
  // Shift-wise Plant Stock Availability — sequential consumption across this
  // row's whole week of DAY cells (see computeStockCoverage above), recomputed
  // whenever this row's own typed values, shifts, or periods change — same
  // "live while typing" behavior as the existing Actual-vs-Plan coloring.
  const dayPeriods = useMemo(() => periods.filter((p) => p.period_type === "DAY"), [periods]);
  const stockCoverage = useMemo(
    () => computeStockCoverage(dayPeriods, shifts, rowValues, row.stock_available),
    [dayPeriods, shifts, rowValues, row.stock_available]
  );
  return (
    <tr style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fafbfc" }}>
      <td
        style={{
          padding: "5px 4px",
          borderBottom: "1px solid #eef0f3",
          textAlign: "center", color: "#8a93a3", fontWeight: 600,
        }}
      >
        {idx + 1}
      </td>
      <td
        title={`${row.fg_part_no} — ${row.fg_part_desc}`}
        style={{
          padding: "5px 8px",
          borderBottom: "1px solid #eef0f3",
          textAlign: "left",
          overflow: "hidden",
        }}
      >
        <div style={{ color: "#0052cc", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.fg_part_no}</div>
        <div style={{ color: "#6b7280", fontSize: 10, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.fg_part_desc}</div>
      </td>
      {periods.map((p) => {
        const editable = isPeriodEditable(p, today, currentWeekStart);

        // DAY columns: ONE Plan box + ONE Actual box (same outer shape/
        // border as before), each internally split into one field per this
        // plant's own shifts — no cascade, no combined day total.
        if (p.period_type === "DAY") {
          return (
            <td
              key={p.key}
              style={{
                padding: "4px 4px",
                borderBottom: "1px solid #eef0f3",
                verticalAlign: "top",
                position: "relative",
              }}
            >
              {isWithinInfoWindow(p.plan_date, today) && (
                <DayInfoPopover
                  plant={plant}
                  row={row}
                  period={p}
                  dayPeriods={dayPeriods}
                  shifts={shifts}
                  rowValues={rowValues}
                  stockCoverage={stockCoverage}
                />
              )}
              <div style={{ display: "flex" }}>
                {shifts.map((s, i) => {
                  const shiftName = s.shift_name;
                  const value = rowValues[`${p.key}|${shiftName}`];
                  const coverage = stockCoverage.get(`${p.key}|${shiftName}`);
                  const stockColorKey = getStockCoverageColorKey(coverage?.coveragePct, value);
                  const stockBorder = STOCK_BORDER_COLORS[stockColorKey];
                  const isFirst = i === 0;
                  const isLast = i === shifts.length - 1;
                  return (
                    <div
                      key={shiftName}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        boxSizing: "border-box",
                        border: `1.5px solid ${editable ? stockBorder : "#c7cbd1"}`,
                        borderStyle: editable ? "solid" : "dashed",
                        borderBottom: "none",
                        marginLeft: isFirst ? 0 : -1.5,
                        borderRadius: `${isFirst ? 6 : 0}px ${isLast ? 6 : 0}px 0 0`,
                        backgroundColor: editable ? STOCK_BG_COLORS[stockColorKey] : "#f1f2f5",
                        position: "relative",
                      }}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        value={value ?? ""}
                        disabled={!editable}
                        onChange={(e) =>
                          onShiftCellChange(row.fg_part, p.key, shiftName, capDigits(e.target.value, 4))
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        title={editable ? `Shift ${shiftName}` : "Locked — this date has already passed for entry"}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px",
                          textAlign: "center",
                          border: "none",
                          outline: "none",
                          backgroundColor: "transparent",
                          color: PLAN_TEXT_COLOR,
                          cursor: editable ? "text" : "not-allowed",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex" }}>
                {shifts.map((s, i) => {
                  const shiftName = s.shift_name;
                  const value = rowValues[`${p.key}|${shiftName}`];
                  const actualQty = row.cells[p.key]?.actual_shift?.[shiftName] || 0;
                  const colors = CELL_COLORS[getPlanActualColorKey(actualQty, value)];
                  const isFirst = i === 0;
                  const isLast = i === shifts.length - 1;
                  return (
                    <div
                      key={shiftName}
                      title={`Shift ${shiftName} Actual`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        boxSizing: "border-box",
                        border: `1.5px solid ${colors.border}`,
                        marginLeft: isFirst ? 0 : -1.5,
                        borderRadius: `0 0 ${isLast ? 6 : 0}px ${isFirst ? 6 : 0}px`,
                        backgroundColor: colors.bg,
                        color: ACTUAL_TEXT_COLOR,
                        fontSize: 9,
                        fontWeight: 700,
                        textAlign: "center",
                        padding: "2px 0",
                        cursor: "pointer",
                      }}
                    >
                      {numberFmt(actualQty)}
                    </div>
                  );
                })}
              </div>
            </td>
          );
        }

        // WEEK columns (W-39/W-40) — unchanged single Plan/Actual pair, with
        // the Actual box's shift-wise hover tooltip.
        const value = rowValues[p.key];
        const actualQty = row.cells[p.key]?.actual_qty;
        const shiftBreakdown = row.cells[p.key]?.shift_breakdown || [];
        const colors = CELL_COLORS[getPlanActualColorKey(actualQty, value)];
        const digitCap = 5;
        return (
          <td
            key={p.key}
            style={{
              padding: "4px 4px",
              borderBottom: "1px solid #eef0f3",
              verticalAlign: "top",
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              value={value ?? ""}
              disabled={!editable}
              onChange={(e) => onCellChange(row.fg_part, p.key, capDigits(e.target.value, digitCap))}
              onFocus={(e) => e.target.select()}
              placeholder="Plan"
              title={editable ? undefined : "Locked — this date has already passed for entry"}
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 5px",
                textAlign: "right",
                border: `1.5px solid ${editable ? colors.border : "#c7cbd1"}`,
                borderStyle: editable ? "solid" : "dashed",
                borderRadius: "6px 6px 0 0",
                borderBottom: "none",
                outline: "none",
                // Locked cells use the app's established disabled look
                // (grey/dashed, same as e.g. the Plant field) — but the
                // VALUE stays legible, not washed out, since the number
                // itself is still the point.
                backgroundColor: editable ? colors.planBg : "#f1f2f5",
                color: PLAN_TEXT_COLOR,
                cursor: editable ? "text" : "not-allowed",
                transition: "box-shadow .12s ease",
              }}
              onFocusCapture={(e) => { if (editable) e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.18)"; }}
              onBlurCapture={(e) => { e.target.style.boxShadow = "none"; }}
            />
            <Tooltip
              arrow
              placement="bottom"
              title={
                shiftBreakdown.length === 0 ? "" : (
                  <div style={{ fontSize: 11 }}>
                    {shiftBreakdown.map((s) => (
                      <div key={s.shift_name}>{s.shift_name}: {numberFmt(s.qty)}</div>
                    ))}
                  </div>
                )
              }
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 5px",
                  textAlign: "right",
                  border: `1.5px solid ${colors.border}`,
                  borderRadius: "0 0 6px 6px",
                  backgroundColor: colors.bg,
                  color: ACTUAL_TEXT_COLOR,
                  cursor: shiftBreakdown.length ? "help" : "default",
                }}
              >
                {numberFmt(actualQty)}
              </div>
            </Tooltip>
          </td>
        );
      })}
    </tr>
  );
});

/* ============================================================
   Tab 2: Plan Entry — compact production-planning grid. Plant is fixed to
   the logged-in user's own plant (no picker). No date picker either —
   entry is always for the CURRENT ISO week: one row per FG, one column per
   period (W-<n> week bucket, each of that week's 7 days, next W-<n+1> week
   bucket), each column showing a small Plan(editable)/Actual(read-only)
   split, colored green/red at the 90% Actual-vs-Plan threshold.
   ============================================================ */
const PlanEntryBody = ({ searchText = "" }) => {
  const { user } = useContext(AuthContext);
  const plant = user?.PlantCode || "";

  const [modules, setModules] = useState([]);
  const [lines, setLines] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [lineId, setLineId] = useState("");

  const [periods, setPeriods] = useState([]);
  // That plant's own active shifts, e.g. [{shift_id, shift_name:"A"}, ...] —
  // always as returned by the grid API, never hardcoded here. Drives both
  // the day-column sub-header and the number of Plan/Actual lanes per day.
  const [shifts, setShifts] = useState([]);
  const [rows, setRows] = useState([]);
  // Nested by fg_part: values[fgPart] = { [periodKey]: value } for WEEK
  // cells, { [`${periodKey}|${shiftName}`]: value } for DAY cells. Nesting
  // (rather than one flat map) means editing one row only replaces THAT
  // row's own sub-object — every other row's reference is untouched, which
  // is what lets the memoized PlanRow below skip re-rendering on keystroke.
  const [values, setValues] = useState({});
  const [dirtyKeys, setDirtyKeys] = useState(new Set()); // flat "fgPart|periodKey[|shiftName]" strings

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const today = useMemo(() => todayStr(), []);
  const weekInfo = useMemo(() => getIsoWeekInfo(today), [today]);
  const currentWeekStart = useMemo(
    () => (weekInfo ? format(weekInfo.start, "yyyy-MM-dd") : today),
    [weekInfo, today]
  );

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [moduleRes, lineRes] = await Promise.all([getModules(), getLines()]);
        setModules((moduleRes || []).filter((m) => m.Active_Status));
        setLines((lineRes || []).filter((l) => l.Active_Status));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Module/Line filter options.");
      }
    };
    loadMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Module dropdown narrows to the (fixed) Plant — Module names repeat per
  // plant, so without this the dropdown would mix in every other plant's
  // modules.
  const moduleOptions = useMemo(
    () => (plant ? modules.filter((m) => String(m.Plant_Code) === String(plant)) : []),
    [modules, plant]
  );

  // Line dropdown narrows to Plant + Module, same reasoning.
  const lineOptions = useMemo(
    () =>
      plant && moduleId
        ? lines.filter(
          (l) => String(l.Plant_Code) === String(plant) && String(l.Module_ID) === String(moduleId)
        )
        : [],
    [lines, plant, moduleId]
  );

  const fetchGrid = async () => {
    if (!plant) {
      toast.warning("No Plant is assigned to your user account.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const data = await GetMfgProductionDailyPlanGridApi({
        plant,
        date: today,
        moduleId: moduleId || undefined,
        lineId: lineId || undefined,
      });
      const shiftList = data?.shifts || [];
      setPeriods(data?.periods || []);
      setShifts(shiftList);
      setRows(data?.rows || []);

      const initialValues = {};
      (data?.rows || []).forEach((row) => {
        const fgValues = {};
        (data?.periods || []).forEach((period) => {
          const cell = row.cells[period.key];
          if (period.period_type === "DAY") {
            shiftList.forEach(({ shift_name: shiftName }) => {
              fgValues[`${period.key}|${shiftName}`] = cell?.plan_shift?.[shiftName] ?? "";
            });
          } else {
            fgValues[period.key] = cell?.user_input_qty ?? "";
          }
        });
        initialValues[row.fg_part] = fgValues;
      });
      setValues(initialValues);
      setDirtyKeys(new Set());
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load Daily Production Plan.");
      setPeriods([]);
      setShifts([]);
      setRows([]);
      setValues({});
      setDirtyKeys(new Set());
    } finally {
      setLoading(false);
    }
  };

  // Auto-load once on mount — Plant is fixed and there's no date to wait on,
  // so there's no reason to force an extra click just to see the grid.
  useEffect(() => {
    if (plant) fetchGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant]);

  // Plain typing — just updates the value (and live color feedback). No
  // cascading here: doing the redistribution per-keystroke was the bug —
  // it recomputed against every partial number as you typed (1, 13, 134...)
  // and stomped the later columns each time. The cascade now only runs
  // once, on blur, against the value you actually finished typing.
  // Running-balance ledger, kept SEPARATELY per section (WEEK columns vs
  // DAY columns never mix): the opening balance is that section's FIRST
  // cell's Actual; each cell in order subtracts its own User Input from that
  // balance; whatever remains is propagated AS-IS (not split/divided) into
  // every cell after the one just edited, recomputed fresh on every
  // keystroke — live while typing, not deferred to blur.
  // Wrapped in useCallback (stable across keystrokes, since `periods`/`rows`
  // only change on fetchGrid) so the memoized PlanRow below doesn't lose its
  // memoization just because the parent re-rendered.
  const handleCellChange = useCallback((fgPart, periodKey, value) => {
    setValues((prev) => {
      const prevFg = prev[fgPart] || {};
      const mergedFg = { ...prevFg, [periodKey]: value };

      const period = periods.find((p) => p.key === periodKey);
      if (!period) return { ...prev, [fgPart]: mergedFg };
      const section = periods.filter((p) => p.period_type === period.period_type);
      const idxInSection = section.findIndex((p) => p.key === periodKey);
      if (idxInSection === -1 || idxInSection === section.length - 1) {
        return { ...prev, [fgPart]: mergedFg };
      }

      const row = rows.find((r) => r.fg_part === fgPart);
      if (!row) return { ...prev, [fgPart]: mergedFg };

      let balance = Number(row.cells[section[0].key]?.actual_qty) || 0;
      for (let i = 0; i <= idxInSection; i++) {
        const raw = mergedFg[section[i].key];
        const num = raw === "" || raw === null || raw === undefined ? 0 : Number(raw);
        balance -= Number.isNaN(num) ? 0 : num;
      }
      balance = Math.max(0, balance);

      section.slice(idxInSection + 1).forEach((p) => {
        const digitCap = p.period_type === "WEEK" ? 5 : 4;
        mergedFg[p.key] = capDigits(String(balance), digitCap);
      });
      return { ...prev, [fgPart]: mergedFg };
    });

    setDirtyKeys((prev) => {
      const next = new Set(prev).add(cellKey(fgPart, periodKey));
      const period = periods.find((p) => p.key === periodKey);
      if (period) {
        const section = periods.filter((p) => p.period_type === period.period_type);
        const idxInSection = section.findIndex((p) => p.key === periodKey);
        if (idxInSection !== -1) {
          section.slice(idxInSection + 1).forEach((p) => next.add(cellKey(fgPart, p.key)));
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periods, rows]);

  // Daily shift-lane cells — plain typing, no auto-balance cascade. Each
  // shift is its own independently-entered number; unlike the WEEK
  // section's running-balance behavior, there is no single "day total" to
  // divide between shifts, so nothing here ever writes to another cell.
  // No external deps — stable identity for the entire component lifetime.
  const handleShiftCellChange = useCallback((fgPart, periodKey, shiftName, value) => {
    const subKey = `${periodKey}|${shiftName}`;
    setValues((prev) => ({
      ...prev,
      [fgPart]: { ...(prev[fgPart] || {}), [subKey]: value },
    }));
    setDirtyKeys((prev) => new Set(prev).add(cellKeyShift(fgPart, periodKey, shiftName)));
  }, []);

  const handleSubmit = async () => {
    if (dirtyKeys.size === 0) {
      toast.info("No changes to save.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const userId = localStorage.getItem("EmpId");
      const periodMap = new Map(periods.map((p) => [p.key, p]));

      const cells = [];
      dirtyKeys.forEach((key) => {
        const parts = key.split("|");
        const [fgPartStr, periodKey, shiftName] = parts;
        const period = periodMap.get(periodKey);
        if (!period) return;
        const subKey = shiftName ? `${periodKey}|${shiftName}` : periodKey;
        const raw = values[fgPartStr]?.[subKey];
        if (raw === "" || raw === null || raw === undefined) return; // skip cleared/empty cells
        cells.push({
          fg_part: Number(fgPartStr),
          period_type: period.period_type,
          plan_date: period.plan_date,
          week_number: period.week_number,
          week_end_date: period.week_end_date,
          user_input_qty: Number(raw),
          ...(shiftName ? { shift_name: shiftName } : {}),
        });
      });

      if (cells.length === 0) {
        toast.info("No changes to save.");
        setSaving(false);
        return;
      }

      // Module/Line are not saved on the plan row — they're derived from
      // fg_part (Mst_Material.Line_ID -> Mst_Line.Module_ID) wherever needed.
      await SaveMfgProductionDailyPlanApi({ plant, userId, cells });
      toast.success("Daily Production Plan saved successfully.");
      await fetchGrid();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to save Daily Production Plan.");
    } finally {
      setSaving(false);
    }
  };

  // Client-side search — filters the already-fetched rows by Part No. or
  // Description (case-insensitive substring), no new API call.
  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.fg_part_no?.toLowerCase().includes(q) || r.fg_part_desc?.toLowerCase().includes(q)
    );
  }, [rows, searchText]);

  // Percentage widths (NOT px) so the table always fills exactly 100% of
  // its container — no horizontal scroll, and it reflows automatically
  // when the sidebar is toggled/untoggled since everything is relative.
  // WEEK (W-39/W-40) only ever holds a single 5-digit value, so it needs
  // less room than a DAY column, which splits into 3 shift sub-fields —
  // narrower WEEK columns free up width for the more cramped DAY columns.
  const SI_COL_PCT = 3.5;
  const PART_COL_PCT = 14.5;
  const WEEK_COL_PCT = 6;
  const DAY_COL_COUNT = periods.filter((p) => p.period_type === "DAY").length || 7;
  const DAY_COL_PCT = (100 - SI_COL_PCT - PART_COL_PCT - WEEK_COL_PCT * 2) / DAY_COL_COUNT;

  return (
    <>
      {/* Filter / context toolbar */}
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
        <TextField
          size="small"
          label="Plant"
          value={plant ? `${plant} - ${user?.PlantName || ""}` : "No plant assigned"}
          disabled
          sx={compactFieldSx(130)}
          InputLabelProps={{ shrink: true, sx: { fontSize: 11 } }}
        />

        <Autocomplete
          size="small"
          disabled={!plant}
          options={moduleOptions}
          value={moduleOptions.find((m) => String(m.Module_ID) === String(moduleId)) || null}
          onChange={(e, newVal) => { setModuleId(newVal ? newVal.Module_ID : ""); setLineId(""); }}
          getOptionLabel={(m) => (m ? m.Module_Name : "")}
          isOptionEqualToValue={(o, v) => o.Module_ID === v.Module_ID}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Module" />}
        />

        <Autocomplete
          size="small"
          disabled={!moduleId}
          options={lineOptions}
          value={lineOptions.find((l) => String(l.Line_ID) === String(lineId)) || null}
          onChange={(e, newVal) => setLineId(newVal ? newVal.Line_ID : "")}
          getOptionLabel={(l) => (l ? l.Line_Name : "")}
          isOptionEqualToValue={(o, v) => o.Line_ID === v.Line_ID}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Line" placeholder={moduleId ? undefined : "Select Module first"} />}
        />

        <Button
          onClick={fetchGrid}
          disabled={loading}
          variant="contained"
          disableElevation
          startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <RefreshIcon sx={{ fontSize: 15 }} />}
          sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
        >
          {loading ? "Loading..." : "Fetch"}
        </Button>

        {weekInfo && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "#0052cc",
              background: "linear-gradient(135deg, #eaf2ff 0%, #f3f8ff 100%)",
              border: "1px solid #cfe0ff",
              borderRadius: 999,
              padding: "4px 10px",
              height: 30,
              boxSizing: "border-box",
              whiteSpace: "nowrap",
            }}
          >
            <DateRangeOutlinedIcon sx={{ fontSize: 14, color: "#0066FF" }} />
            Current Week — W {weekInfo.weekNumber}
            <span style={{ color: "#9fb8ea" }}>|</span>
            {format(weekInfo.start, "dd MMM")} – {format(weekInfo.end, "dd MMM yyyy")}
          </span>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexShrink: 0 }}>
          {dirtyKeys.size > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#b45309", whiteSpace: "nowrap" }}>
              {dirtyKeys.size} unsaved change{dirtyKeys.size === 1 ? "" : "s"}
            </span>
          )}
          <Button
            onClick={handleSubmit}
            disabled={saving || !loaded}
            variant="contained"
            disableElevation
            startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <SaveIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Planning grid — modern compact ERP style. Percentage-width fixed
          table layout so all 11 columns always sum to exactly 100% of the
          container (no horizontal scroll, ever — reflows automatically
          whether the sidebar is toggled or not). Only vertical scroll for
          many rows; header stays sticky for that. No vertical column
          borders in the body — rows are separated by a thin bottom border
          and a subtle hover tint instead, for a lighter, modern look. */}
      <style>{`
        .mfg-plan-tbl tbody tr:hover td { background-color: #f2f6fd; }
      `}</style>
      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 10,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <table
          className="mfg-plan-tbl"
          style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%", fontSize: 11 }}
        >
          <colgroup>
            <col style={{ width: `${SI_COL_PCT}%` }} />
            <col style={{ width: `${PART_COL_PCT}%` }} />
            {periods.map((p) => (
              <col key={p.key} style={{ width: `${p.period_type === "WEEK" ? WEEK_COL_PCT : DAY_COL_PCT}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                style={{
                  position: "sticky", top: 0, zIndex: 3,
                  background: "#d0dcf5",
                  color: "#000000",
                  padding: "8px 4px", fontSize: 10.5, fontWeight: 700,
                  textAlign: "center",
                }}
              >
                SI
              </th>
              <th
                style={{
                  position: "sticky", top: 0, zIndex: 3,
                  background: "#d0dcf5",
                  color: "#000000",
                  padding: "8px 8px", fontSize: 10.5, fontWeight: 700,
                  textAlign: "left",
                }}
              >
                Part No / Description
              </th>
              {periods.map((p) => (
                <th
                  key={p.key}
                  style={{
                    position: "sticky", top: 0, zIndex: 3,
                    background: "#d0dcf5",
                    color: "#000000",
                    padding: "6px 3px 6px",
                    textAlign: "center",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.2, whiteSpace: "nowrap", color: "#000000" }}>{p.label}</div>
                  <div style={{ fontSize: 9, fontWeight: 500, color: "#000000", marginTop: 1, whiteSpace: "nowrap" }}>{p.sub_label}</div>
                  {p.period_type === "DAY" && shifts.length > 0 && (
                    <div style={{ display: "flex", marginTop: 3 }}>
                      {shifts.map((s, i) => (
                        <div
                          key={s.shift_name}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#3355aa",
                            padding: "2px 0 0",
                            borderLeft: i === 0 ? "none" : "1px solid rgba(0,0,0,0.12)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={`Shift ${s.shift_name}`}
                        >
                          {s.shift_name}
                        </div>
                      ))}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && loaded && rows.length === 0 && (
              <tr>
                <td colSpan={periods.length + 2} style={{ textAlign: "center", padding: 28, color: "#8a93a3" }}>
                  No FG parts found for this Plant / filter selection.
                </td>
              </tr>
            )}
            {!loading && loaded && rows.length > 0 && filteredRows.length === 0 && (
              <tr>
                <td colSpan={periods.length + 2} style={{ textAlign: "center", padding: 28, color: "#8a93a3" }}>
                  No FG parts match "{searchText}".
                </td>
              </tr>
            )}
            {filteredRows.map((row, idx) => (
              <PlanRow
                key={row.fg_part}
                row={row}
                idx={idx}
                periods={periods}
                shifts={shifts}
                rowValues={values[row.fg_part] || EMPTY_ROW_VALUES}
                today={today}
                currentWeekStart={currentWeekStart}
                onCellChange={handleCellChange}
                onShiftCellChange={handleShiftCellChange}
                plant={plant}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ============================================================
   Tab 1: Plan History — one row per FG part with Month/Current-Week/
   Yesterday Plan vs Actual vs Gap, resolved via getPlanHistorySummary.
   Plant defaults to the logged-in user's own plant (still changeable);
   Start/End Date default to 1st-of-month -> yesterday.
   ============================================================ */
const PlanHistoryBody = ({ searchText = "" }) => {
  const { user } = useContext(AuthContext);

  const [plants, setPlants] = useState([]);
  const [modules, setModules] = useState([]);
  const [lines, setLines] = useState([]);

  const [plant, setPlant] = useState(user?.PlantCode || "");
  const [moduleId, setModuleId] = useState("");
  const [lineId, setLineId] = useState("");
  // Monthly report filter — Month/Year only, no manual date entry. Defaults
  // to the current month/year; converted to a Start/End date range only at
  // fetch time, since the backend endpoint still expects fromDate/toDate.
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dateError, setDateError] = useState("");

  const [historyRows, setHistoryRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [plantRes, moduleRes, lineRes] = await Promise.all([
          getPlantdetails(),
          getModules(),
          getLines(),
        ]);
        setPlants(plantRes || []);
        setModules((moduleRes || []).filter((m) => m.Active_Status));
        setLines((lineRes || []).filter((l) => l.Active_Status));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Plant/Module/Line filter options.");
      }
    };
    loadMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same Plant narrowing as the Plan Entry tab, for the same reason (Module
  // names repeat across plants). Empty until a Plant is picked.
  const moduleOptions = useMemo(
    () => (plant ? modules.filter((m) => String(m.Plant_Code) === String(plant)) : []),
    [modules, plant]
  );

  // Same Plant + Module narrowing as the Plan Entry tab, for the same reason
  // (Line names repeat across plants). Empty until BOTH are picked.
  const lineOptions = useMemo(
    () =>
      plant && moduleId
        ? lines.filter(
          (l) => String(l.Plant_Code) === String(plant) && String(l.Module_ID) === String(moduleId)
        )
        : [],
    [lines, plant, moduleId]
  );

  const fetchHistory = async () => {
    if (!plant) {
      toast.warning("Please select a Plant first.");
      return;
    }
    // Month/Year are mandatory — both already always carry a default value
    // (current month/year), but guard anyway in case either was ever
    // cleared, so an invalid/incomplete selection never reaches the API.
    if (!month || !year) {
      setDateError("Please select both Month and Year.");
      return;
    }
    setDateError("");
    if (loading) return;
    setLoading(true);
    try {
      const data = await GetMfgProductionDailyPlanHistorySummaryApi({
        plant,
        fromDate: monthStartStr(year, month),
        toDate: monthEndStr(year, month),
        moduleId: moduleId || undefined,
        lineId: lineId || undefined,
      });
      setHistoryRows(data || []);
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load Plan History.");
      setHistoryRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load once masters are ready, since Plant already has a sensible
  // default (the user's own plant) — no reason to force a click first.
  useEffect(() => {
    if (plant && plants.length) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plants]);

  const flatRows = useMemo(
    () =>
      historyRows.map((r) => ({
        id: r.fg_part,
        ...r,
        month_gap: (r.mtd_actual || 0) - (r.month_plan || 0),
        cw_gap: (r.cw_actual || 0) - (r.cw_plan || 0),
        yd_gap: (r.yd_actual || 0) - (r.yd_plan || 0),
      })),
    [historyRows]
  );

  // Shared header search (before the tabs) — filters by Part No. or
  // Description, client-side, on the rows already fetched for this tab.
  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return flatRows;
    return flatRows.filter(
      (r) => r.fg_part_no?.toLowerCase().includes(q) || r.fg_part_desc?.toLowerCase().includes(q)
    );
  }, [flatRows, searchText]);


  const gapCellSx = (value) => ({
    color: value > 0 ? "#1b7a43" : value < 0 ? "#b42323" : "#6b7280",
    fontWeight: 700,
  });

  // Every column uses `flex` (never `width`) so MUI DataGrid distributes
  // 100% of the container's width across them proportionally — this is
  // what guarantees no horizontal scroll ever appears, and that the table
  // reflows automatically when the sidebar is toggled/untoggled. `minWidth`
  // still protects each column from getting too cramped to read.
  const columns = useMemo(() => [
    { field: "plant", headerName: "Plant", flex: 0.6, minWidth: 56, align: "center", headerAlign: "center" },
    { field: "Module_Name", headerName: "Module", flex: 0.9, minWidth: 70 },
    { field: "Line_Name", headerName: "Line", flex: 0.9, minWidth: 70 },
    {
      field: "fg_part_no", headerName: "Part No / Description", flex: 1.9, minWidth: 140,
      renderCell: (p) => (
        <div
          title={`${p.row.fg_part_no} — ${p.row.fg_part_desc}`}
          style={{ lineHeight: 1.3, padding: "4px 0", overflow: "hidden" }}
        >
          <div style={{ color: "#0052cc", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.row.fg_part_no}
          </div>
          <div style={{ color: "#6b7280", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.row.fg_part_desc}
          </div>
        </div>
      ),
    },
    {
      field: "month_plan", headerName: "Month Plan", flex: 0.9, minWidth: 75, align: "right", headerAlign: "center",
      renderCell: (p) => numberFmt(p.value),
    },
    {
      field: "mtd_actual", headerName: "MTD Actual", flex: 0.9, minWidth: 75, align: "right", headerAlign: "center",
      renderCell: (p) => numberFmt(p.value),
    },
    {
      field: "month_gap", headerName: "Gap", flex: 0.75, minWidth: 65, align: "right", headerAlign: "center",
      renderCell: (p) => <span style={gapCellSx(p.value)}>{gapFmt(p.value)}</span>,
    },
    {
      field: "cw_plan", headerName: "C.W Plan", flex: 0.8, minWidth: 68, align: "right", headerAlign: "center",
      renderCell: (p) => numberFmt(p.value),
    },
    {
      field: "cw_actual", headerName: "C.W Actual", flex: 0.85, minWidth: 72, align: "right", headerAlign: "center",
      renderCell: (p) => numberFmt(p.value),
    },
    {
      field: "cw_gap", headerName: "CW Gap", flex: 0.75, minWidth: 62, align: "right", headerAlign: "center",
      renderCell: (p) => <span style={gapCellSx(p.value)}>{gapFmt(p.value)}</span>,
    },
    {
      field: "yd_plan", headerName: "YD Plan", flex: 0.75, minWidth: 62, align: "right", headerAlign: "center",
      renderCell: (p) => numberFmt(p.value),
    },
    {
      field: "yd_actual", headerName: "YD Actual", flex: 0.75, minWidth: 65, align: "right", headerAlign: "center",
      renderCell: (p) => numberFmt(p.value),
    },
    {
      field: "yd_gap", headerName: "YD Gap", flex: 0.75, minWidth: 62, align: "right", headerAlign: "center",
      renderCell: (p) => <span style={gapCellSx(p.value)}>{gapFmt(p.value)}</span>,
    },
  ], []);

  return (
    <>
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
        <Autocomplete
          size="small"
          options={plants}
          value={plants.find((p) => String(p.Plant_Code) === String(plant)) || null}
          onChange={(e, newVal) => { setPlant(newVal ? newVal.Plant_Code : ""); setModuleId(""); setLineId(""); }}
          getOptionLabel={(p) => (p ? `${p.Plant_Code} - ${p.Plant_Name}` : "")}
          isOptionEqualToValue={(o, v) => o.Plant_ID === v.Plant_ID}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Plant" />}
        />

        <Autocomplete
          size="small"
          disabled={!plant}
          options={moduleOptions}
          value={moduleOptions.find((m) => String(m.Module_ID) === String(moduleId)) || null}
          onChange={(e, newVal) => { setModuleId(newVal ? newVal.Module_ID : ""); setLineId(""); }}
          getOptionLabel={(m) => (m ? m.Module_Name : "")}
          isOptionEqualToValue={(o, v) => o.Module_ID === v.Module_ID}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Module" placeholder={plant ? undefined : "Select Plant first"} />}
        />

        <Autocomplete
          size="small"
          disabled={!moduleId}
          options={lineOptions}
          value={lineOptions.find((l) => String(l.Line_ID) === String(lineId)) || null}
          onChange={(e, newVal) => setLineId(newVal ? newVal.Line_ID : "")}
          getOptionLabel={(l) => (l ? l.Line_Name : "")}
          isOptionEqualToValue={(o, v) => o.Line_ID === v.Line_ID}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Line" placeholder={moduleId ? undefined : "Select Module first"} />}
        />

        {/* Month + Year as ONE grouped "Period" control — a single bordered
            field with a divider between the two selects, instead of two
            separate boxes, matching a compact monthly-report filter. */}
        <div>
          {/*
          <div style={{ fontSize: 11, color: dateError ? "#d32f2f" : "#6b7280", marginBottom: 2, marginLeft: 2 }}>
            Period
          </div>
        */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              height: 30,
              boxSizing: "border-box",
              border: `1px solid ${dateError ? "#d32f2f" : "#dde1e7"}`,
              borderRadius: 6,
              backgroundColor: "#fafbfc",
              padding: "0 8px",
            }}
          >
            <CalendarMonthOutlinedIcon sx={{ fontSize: 15, color: "#6b7280", flexShrink: 0 }} />
            <Select
              variant="standard"
              disableUnderline
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setDateError(""); }}
              sx={{ fontSize: 11.5, "& .MuiSelect-select": { padding: "0 20px 0 2px" } }}
              MenuProps={{ PaperProps: { sx: { "& .MuiMenuItem-root": { fontSize: 11.5, minHeight: 28 } } } }}
            >
              {MONTH_NAMES.map((name, idx) => (
                <MenuItem key={name} value={idx + 1} sx={{ fontSize: 11.5 }}>{name}</MenuItem>
              ))}
            </Select>
            <span style={{ color: "#d3d7dd" }}>/</span>
            <Select
              variant="standard"
              disableUnderline
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setDateError(""); }}
              sx={{ fontSize: 11.5, "& .MuiSelect-select": { padding: "0 18px 0 2px" } }}
              MenuProps={{ PaperProps: { sx: { "& .MuiMenuItem-root": { fontSize: 11.5, minHeight: 28 } } } }}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <MenuItem key={y} value={y} sx={{ fontSize: 11.5 }}>{y}</MenuItem>
              ))}
            </Select>
          </div>
        </div>

        {dateError && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#d32f2f" }}>{dateError}</span>
        )}

        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
          <Button
            onClick={fetchHistory}
            disabled={loading}
            variant="contained"
            disableElevation
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Search"}
          </Button>
        </div>
      </div>

      <div style={{ flexGrow: 1, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 3px rgba(16,24,40,0.05)", minHeight: 0, overflow: "hidden" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          pageSize={25}
          rowsPerPageOptions={[25, 50, 100]}
          disableSelectionOnClick
          disableColumnMenu
          loading={loading}
          columnHeaderHeight={36}
          rowHeight={38}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No plan history found for the selected filters." }}
          sx={{
            height: "100%",
            border: "none",
            // No vertical column lines in the data area — rows are
            // separated by a thin bottom border + hover tint only.
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
            // Subtle hover tint — the one visual cue MUI adds by default,
            // reinforced here since the zebra striping above can mute it.
            "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
            "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
            "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 28 },
            "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
            // Compact pagination footer — the default MUI footer is tall
            // and padded for a full-page table. Fixing this properly means
            // shrinking the CHILDREN (Toolbar/Select/IconButtons), not
            // capping the wrapper: an outer maxHeight clipped them and
            // forced an internal scrollbar (that was the earlier bug).
            // MUI's Toolbar applies its own minHeight via a breakpoint
            // media query with higher specificity than a flat class
            // selector, so it needs `!important` to actually override.
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
            "& .MuiTablePagination-actions": { marginLeft: 4 },
            "& .MuiTablePagination-actions .MuiIconButton-root": {
              padding: 4, width: 24, height: 24,
            },
            "& .MuiTablePagination-actions svg": { fontSize: 16 },
          }}
        />
      </div>
    </>
  );
};

/* ============================================================
   Pill-style segmented tab control (same pattern as the MFG Report screen)
   ============================================================ */
const TAB_DEFS = [
  { key: "history", label: "Prod Status", Icon: HistoryOutlinedIcon },
  { key: "entry", label: "Prod Daily Plan", Icon: EditNoteOutlinedIcon },
];

const PillTabs = ({ value, onChange }) => {
  const btnRefs = React.useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = btnRefs.current[value];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [value]);

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
          </button>
        );
      })}
    </div>
  );
};

const MfgProductionDailyPlan = () => {
  const [tab, setTab] = useState(0);
  // Shared search box, sitting before the tabs — filters whichever tab is
  // currently active (Prod Status's history rows, or Prod Daily Plan's FG
  // list), each tab doing its own client-side filtering on its own
  // already-fetched rows by Part No. / Description.
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
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3 }}>
          MFG Daily Production Plan
        </Typography>

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
          <PillTabs value={tab} onChange={setTab} />
        </div>
      </div>

      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {tab === 0 ? <PlanHistoryBody searchText={searchText} /> : <PlanEntryBody searchText={searchText} />}
      </div>
    </div>
  );
};

export default MfgProductionDailyPlan;
