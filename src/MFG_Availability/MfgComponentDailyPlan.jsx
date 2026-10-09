import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  TextField, Button, CircularProgress, Typography, Autocomplete, MenuItem, Select, Tooltip,
  Chip, Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Box, Collapse, IconButton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InfoIcon from "@mui/icons-material/Info";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { format, startOfISOWeek, endOfISOWeek, getISOWeek, addDays } from "date-fns";
import { toast } from "react-toastify";
import { AuthContext } from "../Authentication/AuthContext";
import { getMfgPlanEditAccess } from "../Authentication/ActionAccessType";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import { getdetails as getModules } from "../controller/ModuleMasterapiservice";
import { getdetails as getLines } from "../controller/LineMasterapiservice";
import { getdetails as getOperations } from "../controller/OperationMasterapiservice";
import {
  GetMfgComponentDailyPlanGridApi,
  SaveMfgComponentDailyPlanApi,
  GetMfgComponentDailyPlanHistorySummaryApi,
  GetMfgComponentDailyPlanDayDetailApi,
} from "../controller/MfgComponentDailyPlanApiService";

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

const cellKey = (childPart, periodKey) => `${childPart}|${periodKey}`;
// DAY cells are shift-wise — a distinct key shape from the plain WEEK
// cellKey above, so the two never collide. The shift lane list itself is
// never hardcoded here — it always comes from the grid API's own `shifts`
// array (that plant's active Mst_Shift rows).
const cellKeyShift = (childPart, periodKey, shiftName) => `${childPart}|${periodKey}|${shiftName}`;

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
  // no stock source (no earlier operation in the route) -> nothing to judge
  if (coveragePct === null || coveragePct === undefined) return "none";
  // Any shortage is red: green only when the remaining stock covers the plan
  // in full (e.g. stock 1950, shift A 1500 -> 450 left, shift B 451 fails).
  if (coveragePct >= 100) return "green";
  return "red";
};

// (Stock source: the PREVIOUS operation's stock of the Child Part's route, prev_stage_stock.)
// Sequential stock consumption across one Child Part row's entire week of DAY cells,
// processed in chronological plan_date order and then in the plant's own
// configured shift order (never hardcoded names/count) — a single Plant
// Stock pool (the row's own plant-stock figure from the backend)
// is progressively drawn down shift by shift, day by day, exactly per the
// spec's sequential-consumption rule (never compared independently against
// the original total). WEEK buckets (W-39/W-40) are untouched — this is a
// DAY-only concept. Returns Map(`${periodKey}|${shiftName}` -> detail).
const computeStockCoverage = (dayPeriods, shifts, rowValues, totalStock) => {
  const map = new Map();
  if (totalStock === null || totalStock === undefined) return map; // no previous stage -> no check
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
      const status = coveragePct >= 100 ? "Fully Covered" : "Stock Shortage";
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

// Editability rule (role access is checked separately by canEdit):
//   - The CURRENT week and any FUTURE week are fully editable — every day of the
//     week (even days already gone) and the week buckets.
//   - PAST weeks are view only: while a past week is on screen (viewingPast)
//     nothing is editable.
// All comparisons are plain 'yyyy-MM-dd' string comparisons, which sort
// chronologically for same-format ISO date strings.
const isPeriodEditable = (period, today, currentWeekStart, viewingPast = false) => {
  if (viewingPast) return false;
  const weekStart = period.period_type === "DAY"
    ? format(startOfISOWeek(new Date(`${period.plan_date}T00:00:00`)), "yyyy-MM-dd")
    : period.plan_date;
  return weekStart >= currentWeekStart;
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

// The Plan Entry grid's day-detail popover — a single hover popover with the
// day's Plan/Actual/Balance summary plus a display-only Operation Wise
// Quantity table (Part No | Description | Stock | OPT30 | OPT20 | OPT10, not
// split by shift, stock shown under the component's BOM operation). Data is fetched once per day cell, on first hover-open
// only (cached afterwards for that cell). The summary numbers come from the
// same computeStockCoverage() the grid's own border-highlight already runs;
// /getDayDetail only supplies which BOM operations the component belongs to.
const DayInfoPopover = ({ plant, row, period, dayPeriods, shifts, rowValues, stockCoverage }) => {
  const [openState, setOpenState] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setOpenState(true);
    if (!detail && !loading) {
      setLoading(true);
      GetMfgComponentDailyPlanDayDetailApi({ plant, child_part: row.child_part, date: period.plan_date })
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
  const balanceToday = lastCoverage ? lastCoverage.after : (row.prev_stage_stock ?? 0);

  // OPT table — display only, NOT shift-wise: the parts at each BOM operation
  // (OPT10, OPT20, OPT30) of this component's own BOM route (its own and
  // earlier operations, from detail.opt_parts in /getDayDetail), each with its
  // own plant stock.
  const optParts = detail?.opt_parts || [];
  const popoverWidth = 460;

  const popoverContent = (
    <div style={{ width: popoverWidth, maxHeight: 460, display: "flex", flexDirection: "column" }}>
      {/* Header — Child Part no. + description only, no date row. */}
      <div
        style={{
          padding: "10px 12px", borderBottom: "1px solid #eef0f3",
          backgroundColor: "#f8faff",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1a2233" }}>{row.child_part_no}</span>
          <span style={{ fontSize: 11, color: "#6b7280" }}>{row.child_part_desc}</span>
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

        <SectionHeader icon={<Inventory2OutlinedIcon sx={{ fontSize: 15, color: "#6b7280" }} />} title="Operation Wise Quantity" />
        {loading ? (
          <div style={{ padding: 12, textAlign: "center" }}><CircularProgress size={16} /></div>
        ) : (
          <div style={{ border: "1px solid #eef0f3", borderRadius: 8, overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", backgroundColor: "#d0dcf5", color: "#000" }}>Opt</TableCell>
                  <TableCell sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", backgroundColor: "#d0dcf5", color: "#000" }}>Part No</TableCell>
                  <TableCell sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", backgroundColor: "#d0dcf5", color: "#000" }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", backgroundColor: "#d0dcf5", color: "#000" }}>Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {optParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ fontSize: 10.5, padding: "8px 6px", color: "#8a93a3", textAlign: "center" }}>No previous stage (OPT10 / OPT20 / OPT30) in the BOM route of this component.</TableCell>
                  </TableRow>
                ) : optParts.map((p, i) => {
                  const first = i === 0 || optParts[i - 1].opt_no !== p.opt_no;
                  return (
                    <TableRow key={`${p.opt_no}-${p.part_no}`} hover sx={first && i > 0 ? { "& td": { borderTop: "2px solid #dfe5f2" } } : undefined}>
                      <TableCell sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", color: "#3730a3", whiteSpace: "nowrap" }}>{first ? `OPT${p.opt_no}` : ""}</TableCell>
                      <TableCell sx={{ fontSize: 10.5, fontWeight: 700, color: "#0052cc", padding: "4px 6px" }}>{p.part_no}</TableCell>
                      <TableCell sx={{ fontSize: 10.5, padding: "4px 6px", color: "#6b7280" }}>{p.description}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px" }}>{numberFmt(p.stock)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
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

// One Child Part row of the Plan Entry grid, memoized: React.memo does a shallow
// prop comparison, and `rowValues` only gets a new object reference when
// THIS row's own values change (see the nested-by-child_part `values` state in
// PlanEntryBody) — every other row's props are unchanged reference-wise, so
// typing in one cell no longer re-renders the whole (often 50-100 row)
// table on every keystroke, which was the cause of the multi-second input
// lag when typing a 4-digit number.
const PlanRow = React.memo(function PlanRow({
  row, idx, periods, shifts, rowValues, today, currentWeekStart, onCellChange, onShiftCellChange, plant, canEdit, viewingPast,
}) {
  // Shift-wise Plant Stock Availability — sequential consumption across this
  // row's whole week of DAY cells (see computeStockCoverage above), recomputed
  // whenever this row's own typed values, shifts, or periods change — same
  // "live while typing" behavior as the existing Actual-vs-Plan coloring.
  const dayPeriods = useMemo(() => periods.filter((p) => p.period_type === "DAY"), [periods]);
  const stockCoverage = useMemo(
    () => computeStockCoverage(dayPeriods, shifts, rowValues, row.prev_stage_stock),
    [dayPeriods, shifts, rowValues, row.prev_stage_stock]
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
        title={`${row.child_part_no} — ${row.child_part_desc}`}
        style={{
          padding: "5px 8px",
          borderBottom: "1px solid #eef0f3",
          textAlign: "left",
          overflow: "hidden",
        }}
      >
        <div style={{ color: "#0052cc", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.child_part_no}</div>
        <div style={{ color: "#6b7280", fontSize: 10, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.child_part_desc}</div>
      </td>
      {periods.map((p) => {
        const editable = isPeriodEditable(p, today, currentWeekStart, viewingPast);
        // "editable" is the date rule (past days are locked); canEdit is the
        // role rule (only PROD INCHARGE etc. may type). The cell styling keeps
        // following the date rule so view-only users still see the stock-
        // coverage / plan-vs-actual colours; only typing is switched off.
        const inputDisabled = !editable || !canEdit;
        const lockedTitle = canEdit
          ? "Locked — past weeks are view only"
          : "View only — you do not have permission to edit the plan";

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
                        disabled={inputDisabled}
                        onChange={(e) =>
                          onShiftCellChange(row.child_part, p.key, shiftName, capDigits(e.target.value, 4))
                        }
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        title={inputDisabled ? lockedTitle : `Shift ${shiftName}`}
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
                          cursor: inputDisabled ? (editable ? "default" : "not-allowed") : "text",
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
              disabled={inputDisabled}
              onChange={(e) => onCellChange(row.child_part, p.key, capDigits(e.target.value, digitCap))}
              onFocus={(e) => e.target.select()}
              placeholder="Plan"
              title={inputDisabled ? lockedTitle : undefined}
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
                cursor: inputDisabled ? (editable ? "default" : "not-allowed") : "text",
                transition: "box-shadow .12s ease",
              }}
              onFocusCapture={(e) => { if (!inputDisabled) e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.18)"; }}
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
   entry is always for the CURRENT ISO week: one row per Child Part, one column per
   period (W-<n> week bucket, each of that week's 7 days, next W-<n+1> week
   bucket), each column showing a small Plan(editable)/Actual(read-only)
   split, colored green/red at the 90% Actual-vs-Plan threshold.
   ============================================================ */
const PlanEntryBody = ({ searchText = "" }) => {
  const { user } = useContext(AuthContext);
  const plant = user?.PlantCode || "";
  // Only roles listed in MFG_PLAN_EDIT_ROLE_IDS may type and Save.
  const { canEdit } = getMfgPlanEditAccess();

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
  // Nested by child_part: values[childPart] = { [periodKey]: value } for WEEK
  // cells, { [`${periodKey}|${shiftName}`]: value } for DAY cells. Nesting
  // (rather than one flat map) means editing one row only replaces THAT
  // row's own sub-object — every other row's reference is untouched, which
  // is what lets the memoized PlanRow below skip re-rendering on keystroke.
  const [values, setValues] = useState({});
  const [dirtyKeys, setDirtyKeys] = useState(new Set()); // flat "childPart|periodKey[|shiftName]" strings

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const today = useMemo(() => todayStr(), []);
  const currentWeekStart = useMemo(() => {
    const info = getIsoWeekInfo(today);
    return info ? format(info.start, "yyyy-MM-dd") : today;
  }, [today]);

  // Week navigation: 0 = this week, -1 = last week (view only), +1 = next week...
  const [weekOffset, setWeekOffset] = useState(0);
  const viewDate = useMemo(
    () => format(addDays(new Date(`${today}T00:00:00`), weekOffset * 7), "yyyy-MM-dd"),
    [today, weekOffset]
  );
  const weekInfo = useMemo(() => getIsoWeekInfo(viewDate), [viewDate]);
  const viewingPast = weekOffset < 0;
  const goToWeek = (next) => {
    if (next === weekOffset) return;
    if (dirtyKeys.size > 0 && !window.confirm("You have unsaved changes. Discard them and change the week?")) return;
    setWeekOffset(next);
  };

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
      const data = await GetMfgComponentDailyPlanGridApi({
        plant,
        date: viewDate,
        moduleId: moduleId || undefined,
        lineId: lineId || undefined,
      });
      const shiftList = data?.shifts || [];
      setPeriods(data?.periods || []);
      setShifts(shiftList);
      setRows(data?.rows || []);

      const initialValues = {};
      (data?.rows || []).forEach((row) => {
        const childValues = {};
        (data?.periods || []).forEach((period) => {
          const cell = row.cells[period.key];
          if (period.period_type === "DAY") {
            shiftList.forEach(({ shift_name: shiftName }) => {
              childValues[`${period.key}|${shiftName}`] = cell?.plan_shift?.[shiftName] ?? "";
            });
          } else {
            childValues[period.key] = cell?.user_input_qty ?? "";
          }
        });
        initialValues[row.child_part] = childValues;
      });
      setValues(initialValues);
      setDirtyKeys(new Set());
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load Daily Component Plan.");
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
  }, [plant, weekOffset]);

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
  const handleCellChange = useCallback((childPart, periodKey, value) => {
    setValues((prev) => {
      const prevChild = prev[childPart] || {};
      const mergedChild = { ...prevChild, [periodKey]: value };

      const period = periods.find((p) => p.key === periodKey);
      if (!period) return { ...prev, [childPart]: mergedChild };
      const section = periods.filter((p) => p.period_type === period.period_type);
      const idxInSection = section.findIndex((p) => p.key === periodKey);
      if (idxInSection === -1 || idxInSection === section.length - 1) {
        return { ...prev, [childPart]: mergedChild };
      }

      const row = rows.find((r) => r.child_part === childPart);
      if (!row) return { ...prev, [childPart]: mergedChild };

      let balance = Number(row.cells[section[0].key]?.actual_qty) || 0;
      for (let i = 0; i <= idxInSection; i++) {
        const raw = mergedChild[section[i].key];
        const num = raw === "" || raw === null || raw === undefined ? 0 : Number(raw);
        balance -= Number.isNaN(num) ? 0 : num;
      }
      balance = Math.max(0, balance);

      section.slice(idxInSection + 1).forEach((p) => {
        const digitCap = p.period_type === "WEEK" ? 5 : 4;
        mergedChild[p.key] = capDigits(String(balance), digitCap);
      });
      return { ...prev, [childPart]: mergedChild };
    });

    setDirtyKeys((prev) => {
      const next = new Set(prev).add(cellKey(childPart, periodKey));
      const period = periods.find((p) => p.key === periodKey);
      if (period) {
        const section = periods.filter((p) => p.period_type === period.period_type);
        const idxInSection = section.findIndex((p) => p.key === periodKey);
        if (idxInSection !== -1) {
          section.slice(idxInSection + 1).forEach((p) => next.add(cellKey(childPart, p.key)));
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
  const handleShiftCellChange = useCallback((childPart, periodKey, shiftName, value) => {
    const subKey = `${periodKey}|${shiftName}`;
    setValues((prev) => ({
      ...prev,
      [childPart]: { ...(prev[childPart] || {}), [subKey]: value },
    }));
    setDirtyKeys((prev) => new Set(prev).add(cellKeyShift(childPart, periodKey, shiftName)));
  }, []);

  const handleSubmit = async () => {
    if (!canEdit || viewingPast) {
      toast.error(viewingPast ? "Past weeks are view only." : "You do not have permission to save the plan.");
      return;
    }
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
        const [childPartStr, periodKey, shiftName] = parts;
        const period = periodMap.get(periodKey);
        if (!period) return;
        const subKey = shiftName ? `${periodKey}|${shiftName}` : periodKey;
        const raw = values[childPartStr]?.[subKey];
        if (raw === "" || raw === null || raw === undefined) return; // skip cleared/empty cells
        cells.push({
          child_part: Number(childPartStr),
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
      // child_part (Mst_Material.Line_ID -> Mst_Line.Module_ID) wherever needed.
      await SaveMfgComponentDailyPlanApi({ plant, userId, cells });
      toast.success("Daily Component Plan saved successfully.");
      await fetchGrid();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to save Daily Component Plan.");
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
      (r) => r.child_part_no?.toLowerCase().includes(q) || r.child_part_desc?.toLowerCase().includes(q)
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
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Tooltip title="Previous week" arrow>
              <span>
                <IconButton size="small" onClick={() => goToWeek(weekOffset - 1)} disabled={loading} sx={{ border: "1px solid #dde1e7", borderRadius: 1.5, p: 0.4 }}>
                  <ChevronLeftIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <span
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600,
                color: viewingPast ? "#92400e" : "#0052cc",
                background: viewingPast ? "linear-gradient(135deg, #fff4e0 0%, #fffaf0 100%)" : "linear-gradient(135deg, #eaf2ff 0%, #f3f8ff 100%)",
                border: `1px solid ${viewingPast ? "#f3d9a4" : "#cfe0ff"}`,
                borderRadius: 999, padding: "4px 10px", height: 30, boxSizing: "border-box", whiteSpace: "nowrap",
              }}
            >
              <DateRangeOutlinedIcon sx={{ fontSize: 14, color: viewingPast ? "#b45309" : "#0066FF" }} />
              {weekOffset === 0 ? "Current Week" : weekOffset < 0 ? "Past Week (view only)" : "Next Week"} — W {weekInfo.weekNumber}
              <span style={{ color: viewingPast ? "#e2c18a" : "#9fb8ea" }}>|</span>
              {format(weekInfo.start, "dd MMM")} – {format(weekInfo.end, "dd MMM yyyy")}
            </span>
            <Tooltip title="Next week" arrow>
              <span>
                <IconButton size="small" onClick={() => goToWeek(weekOffset + 1)} disabled={loading} sx={{ border: "1px solid #dde1e7", borderRadius: 1.5, p: 0.4 }}>
                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            {weekOffset !== 0 && (
              <Button onClick={() => goToWeek(0)} disabled={loading} size="small" sx={{ ...compactButtonSx, color: "#0052cc" }}>
                This week
              </Button>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", flexShrink: 0 }}>
          {dirtyKeys.size > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#b45309", whiteSpace: "nowrap" }}>
              {dirtyKeys.size} unsaved change{dirtyKeys.size === 1 ? "" : "s"}
            </span>
          )}
          {canEdit && !viewingPast ? (
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
          ) : (
            <span
              title={viewingPast ? "Past weeks cannot be edited" : "Only Prod Incharge can enter and save the plan"}
              style={{
                fontSize: 11, fontWeight: 600, color: "#5b6472", backgroundColor: "#f1f2f5",
                border: "1px solid #dde1e7", borderRadius: 6, padding: "6px 10px", whiteSpace: "nowrap",
              }}
            >
              View only
            </span>
          )}
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
                  No Child Parts found for this Plant / filter selection.
                </td>
              </tr>
            )}
            {!loading && loaded && rows.length > 0 && filteredRows.length === 0 && (
              <tr>
                <td colSpan={periods.length + 2} style={{ textAlign: "center", padding: 28, color: "#8a93a3" }}>
                  No Child Parts match "{searchText}".
                </td>
              </tr>
            )}
            {filteredRows.map((row, idx) => (
              <PlanRow
                key={row.child_part}
                row={row}
                idx={idx}
                periods={periods}
                shifts={shifts}
                rowValues={values[row.child_part] || EMPTY_ROW_VALUES}
                today={today}
                currentWeekStart={currentWeekStart}
                onCellChange={handleCellChange}
                onShiftCellChange={handleShiftCellChange}
                plant={plant}
                canEdit={canEdit}
                viewingPast={viewingPast}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ============================================================
   Prod Status table — display-only, grouped by Part Name (Mst_Product.Name
   via the BOM). Groups are built from whatever the API returns, never
   hardcoded. One sticky two-level header for the whole table; each Part
   Name is a collapsible band (MUI Collapse) whose rows sit in a nested
   fixed-layout table sharing the exact same column widths, so numbers stay
   aligned with the header. Collapsed groups unmount their rows, which keeps
   large datasets light.
   ============================================================ */
const GROUP_ACCENTS = [
  { bar: "#4f6bed", tint: "#f4f6fe" },
  { bar: "#0f9d8a", tint: "#f2f9f8" },
  { bar: "#c27c0e", tint: "#fbf8f1" },
  { bar: "#8a5bd6", tint: "#f8f5fc" },
  { bar: "#5b6b82", tint: "#f5f7f9" },
];
const GAP_POS = "#1b7a43";
const GAP_NEG = "#b42323";
const GAP_ZERO = "#8a93a3";
const gapColor = (v) => (v > 0 ? GAP_POS : v < 0 ? GAP_NEG : GAP_ZERO);

const STATUS_HEAD_BG = "#d0dcf5";
const STATUS_HEAD_LINE = "#b9c8ea";
const NUM_FONT = { fontVariantNumeric: "tabular-nums" };

// Column widths (%) — shared by the main header table and every nested group
// table so all of them line up. 6 + 7 + 19 + 11 * (68 / 11) = 100.
const STATUS_COL_PCT = { line: 6, part: 7, child: 19, num: 68 / 11 };

const STATUS_NUM_COLS = [
  { label: "Monthly Plan", tip: "Monthly Plan — sum of the monthly plan (plan type MP) of every FG part that uses this Child Part", key: "monthly_plan", kind: "plan" },
  { label: "MTD Plan", tip: "MTD Plan = (Monthly Plan / 26) x NWD. NWD = working days of the month up to yesterday (Sundays excluded)", key: "mtd_plan", kind: "plan" },
  { label: "MTD Actual", tip: "MTD Actual — for every FG part that uses this Child Part: FG production from the 1st of the month (Production Actual, movement types 101, 102, 261 and 262) x the BOM Qty of that FG's line; the FGs are then added together", key: "mtd_actual_fg", kind: "actual" },
  { label: "MTD Gap", tip: "MTD Gap — MTD Actual minus MTD Plan (positive = ahead, negative = behind)", key: "month_gap", kind: "gap" },
  { label: "YD Plan", tip: "YD Plan — yesterday's plan: the daily plan entered for this Child Part for yesterday, all shifts added together (Component Daily Plan tab)", key: "yd_plan", kind: "plan" },
  { label: "YD Actual", tip: "YD Actual — yesterday's production of this Child Part (Production Actual, movement types 101, 102, 261 and 262)", key: "yd_actual", kind: "actual" },
  { label: "YD Gap", tip: "YD Gap — YD Actual minus YD Plan (positive = ahead, negative = behind)", key: "yd_gap", kind: "gap" },
  // 541 = movement type 541 (material issued to subcontractor) from the
  // Subcontract Daily Plan, matched on Plant + this Child Part's material code.
  { label: "MTD Actual", tip: "541 MTD Actual — month-to-date quantity of movement types 541 and 542 (net) for this Child Part, from the Subcontract Daily Plan", key: "sub541_mtd_actual", kind: "actual", sub: true },
  { label: "MTD Gap", tip: "541 MTD Gap — 541 MTD Actual minus the plan entered for the month on the Component Daily Plan tab (sum of the daily plan entries)", key: "sub541_month_gap", kind: "gap", sub: true },
  { label: "YA", tip: "541 YA — yesterday's quantity of movement types 541 and 542 (net) for this Child Part, from the Subcontract Daily Plan", key: "sub541_yd_actual", kind: "actual", sub: true },
  { label: "YG", tip: "541 YG — 541 YA minus YD Plan (yesterday's plan entered for this Child Part)", key: "sub541_yd_gap", kind: "gap", sub: true },
];
// First column of each section (MTD / YD / 541 Monthly / 541 Daily)
// gets a divider line.
const SECTION_START = new Set(["monthly_plan", "yd_plan", "sub541_mtd_actual", "sub541_yd_actual"]);
const TOTAL_STATUS_COLS = 3 + STATUS_NUM_COLS.length;
const SUB541_HEAD_BG = "#e6dff0";

const STATUS_GROUP_HEADS = [
  { t: "MTD", tip: "Month to Date", span: 4 },
  { t: "YD", tip: "Yesterday", span: 3 },
  { t: "541 - MTD", tip: "Movement types 541 and 542 (issued to subcontractor, net), month to date — from the Subcontract Daily Plan", span: 2, sub: true },
  { t: "541 - Yesterday", tip: "Movement types 541 and 542 (issued to subcontractor, net), yesterday — from the Subcontract Daily Plan", span: 2, sub: true },
];

const headTipProps = {
  arrow: true,
  placement: "top",
  enterDelay: 250,
  slotProps: { tooltip: { sx: { fontSize: 11, maxWidth: 260 } } },
};

const StatusColGroup = () => (
  <colgroup>
    <col style={{ width: `${STATUS_COL_PCT.line}%` }} />
    <col style={{ width: `${STATUS_COL_PCT.part}%` }} />
    <col style={{ width: `${STATUS_COL_PCT.child}%` }} />
    {STATUS_NUM_COLS.map((c) => <col key={c.key} style={{ width: `${STATUS_COL_PCT.num}%` }} />)}
  </colgroup>
);

const bodyCellSx = {
  height: 28, padding: "0 8px", fontSize: 11, borderBottom: "1px solid #eef0f3",
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
};

const PartGroupRows = ({ group, accent, open, onToggle }) => {
  return (
    <>
      <TableRow
        hover
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        sx={{
          cursor: "pointer",
          "&:hover > td": { filter: "brightness(0.97)" },
          "&:focus-visible": { outline: "2px solid #0066FF", outlineOffset: -2 },
        }}
      >
        <TableCell
          colSpan={TOTAL_STATUS_COLS}
          sx={{
            p: 0, backgroundColor: accent.tint,
            borderTop: "1px solid #dfe3ea", borderBottom: "1px solid #dfe3ea",
            borderLeft: `3px solid ${accent.bar}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, height: 34, pl: 1.25, pr: 0.5 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1 }}>{group.name}</Typography>
            <Typography sx={{ fontSize: 10.5, color: "#6b7280" }}>
              {group.rows.length} {group.rows.length === 1 ? "part" : "parts"}
            </Typography>
            <Tooltip title={open ? "Collapse" : "Expand"} arrow placement="left" enterDelay={400}>
              <IconButton size="small" tabIndex={-1} aria-label={open ? `Collapse ${group.name}` : `Expand ${group.name}`} sx={{ p: 0.25, ml: "auto" }}>
                <KeyboardArrowDownIcon
                  sx={{
                    fontSize: 20, color: "#5b6472",
                    transition: "transform .25s ease",
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={TOTAL_STATUS_COLS} sx={{ p: 0, border: "none" }}>
          <Collapse in={open} timeout={220} unmountOnExit>
            <Table size="small" sx={{ tableLayout: "fixed", width: "100%", borderLeft: `3px solid ${accent.bar}` }}>
              <StatusColGroup />
              <TableBody>
                {group.rows.map((r) => (
                  <TableRow key={r.child_part} hover sx={{ "& td": { backgroundColor: "#fff" }, "&:hover td": { backgroundColor: "#f2f6fd" } }}>
                    <TableCell sx={{ ...bodyCellSx, color: "#4b5565" }} title={r.Line_Name || ""}>{r.Line_Name || "–"}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, color: "#6b7280" }} title={group.name}>{group.name}</TableCell>
                    <TableCell sx={bodyCellSx} title={`${r.child_part_no} — ${r.child_part_desc}`}>
                      <Box component="span" sx={{ color: "#0052cc", fontWeight: 700, mr: 1 }}>{r.child_part_no}</Box>
                      <Box component="span" sx={{ color: "#6b7280", fontSize: 10 }}>{r.child_part_desc}</Box>
                    </TableCell>
                    {STATUS_NUM_COLS.map((c) => {
                      const n = Number(r[c.key]) || 0;
                      const color = c.kind === "plan" ? PLAN_TEXT_COLOR : c.kind === "gap" ? gapColor(n) : ACTUAL_TEXT_COLOR;
                      return (
                        <TableCell
                          key={c.key}
                          align="right"
                          sx={{
                            ...bodyCellSx, ...NUM_FONT, padding: "0 10px", fontSize: 11.5,
                            fontWeight: c.kind === "gap" ? 700 : 600, color,
                            borderLeft: SECTION_START.has(c.key) ? "1px solid #dfe3ea" : "none",
                          }}
                        >
                          {c.kind === "gap" ? gapFmt(n) : numberFmt(n)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const PartStatusTable = ({ groups, collapsed, onToggle, loading, loaded }) => {
  const headCell = {
    backgroundColor: STATUS_HEAD_BG, color: "#000", fontSize: 10.5, fontWeight: 700,
    padding: "0 10px", whiteSpace: "nowrap", borderBottom: `1px solid ${STATUS_HEAD_LINE}`,
  };
  return (
    <Table stickyHeader size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
      <StatusColGroup />
      <TableHead>
        <TableRow sx={{ height: 24 }}>
          {[
            ["Line", "Production line of the Child Part (from the Material Master)"],
            ["Part Name", "Part Name group from the MFG BOM that this Child Part belongs to"],
            ["Child Part / Description", "Child Part number and its description"],
          ].map(([h, tip]) => (
            <TableCell key={h} rowSpan={2} sx={{ ...headCell, verticalAlign: "bottom", pb: 0.9 }}>
              <Tooltip title={tip} {...headTipProps}>
                <span style={{ cursor: "help" }}>{h}</span>
              </Tooltip>
            </TableCell>
          ))}
          {STATUS_GROUP_HEADS.map((g) => (
            <TableCell
              key={g.t}
              colSpan={g.span}
              align="center"
              sx={{ ...headCell, top: 0, height: 24, fontSize: 10, letterSpacing: 0.6, borderLeft: `1px solid ${STATUS_HEAD_LINE}`, ...(g.sub ? { backgroundColor: SUB541_HEAD_BG } : {}) }}
            >
              <Tooltip title={g.tip} {...headTipProps}>
                <span style={{ cursor: "help", textTransform: "uppercase" }}>{g.t}</span>
              </Tooltip>
            </TableCell>
          ))}
        </TableRow>
        <TableRow sx={{ height: 26 }}>
          {STATUS_NUM_COLS.map((c) => (
            <TableCell
              key={c.key}
              align="right"
              sx={{ ...headCell, top: 24, height: 26, borderLeft: SECTION_START.has(c.key) ? `1px solid ${STATUS_HEAD_LINE}` : "none", ...(c.sub ? { backgroundColor: SUB541_HEAD_BG } : {}) }}
            >
              <Tooltip title={c.tip} {...headTipProps}>
                <span style={{ cursor: "help" }}>{c.label}</span>
              </Tooltip>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {groups.length === 0 ? (
          <TableRow>
            <TableCell colSpan={TOTAL_STATUS_COLS} align="center" sx={{ py: 4, color: "#8a93a3", border: "none", fontSize: 12 }}>
              {loading ? "Loading…" : loaded ? "No plan history found for the selected filters." : ""}
            </TableCell>
          </TableRow>
        ) : (
          groups.map((g, gi) => (
            <PartGroupRows
              key={g.name}
              group={g}
              accent={GROUP_ACCENTS[gi % GROUP_ACCENTS.length]}
              open={!collapsed.has(g.name)}
              onToggle={() => onToggle(g.name)}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

/* ============================================================
   Tab 1: Plan History — one row per Child Part with Month/Current-Week/
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
  const [operations, setOperations] = useState([]);
  const [optId, setOptId] = useState("");
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
        const [plantRes, moduleRes, lineRes, optRes] = await Promise.all([
          getMyPlants(), // Prod Status Plant dropdown: only the plants this user may use (own + Data Access)
          getModules(),
          getLines(),
          getOperations(),
        ]);
        setPlants(Array.isArray(plantRes) ? plantRes : []);
        setModules((moduleRes || []).filter((m) => m.Active_Status));
        setLines((lineRes || []).filter((l) => l.Active_Status));
        setOperations((optRes || []).filter((o) => Number(o.status) === 1).sort((a, b) => Number(a.opt_no) - Number(b.opt_no)));
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
      const data = await GetMfgComponentDailyPlanHistorySummaryApi({
        plant,
        fromDate: monthStartStr(year, month),
        toDate: monthEndStr(year, month),
        moduleId: moduleId || undefined,
        lineId: lineId || undefined,
        optId: optId || undefined,
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
        id: r.child_part,
        ...r,
        // MTD Gap = MTD Actual (from the FG parts) - MTD Plan (from the monthly plan). The 541 gaps below are unchanged.
        month_gap: (r.mtd_actual_fg || 0) - (r.mtd_plan || 0),
        cw_gap: (r.cw_actual || 0) - (r.cw_plan || 0),
        yd_gap: (r.yd_actual || 0) - (r.yd_plan || 0),
        day_gap: (r.day_actual || 0) - (r.day_plan || 0),
        // 541 gaps: 541 MTD Actual - MTD Plan (entries), and 541 YA - YD Plan (yesterday).
        sub541_month_gap: (r.sub541_mtd_actual || 0) - (r.month_plan || 0),
        // 541 - Daily group shows YESTERDAY: 541 YA minus the plan entered for yesterday (YD Plan)
        sub541_yd_gap: (r.sub541_yd_actual || 0) - (r.yd_plan || 0),
      })),
    [historyRows]
  );

  // Shared header search (before the tabs) — filters by Part No. or
  // Description, client-side, on the rows already fetched for this tab.
  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return flatRows;
    return flatRows.filter(
      (r) => r.child_part_no?.toLowerCase().includes(q) || r.child_part_desc?.toLowerCase().includes(q)
    );
  }, [flatRows, searchText]);


  // Group by Part Name — built from the returned data (never hardcoded),
  // groups A-Z, rows by Line then Child Part.
  const groups = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const name = r.part_name_desc || "Unassigned";
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(r);
    });
    return Array.from(map.entries())
      .sort((x, y) => x[0].localeCompare(y[0]))
      .map(([name, rows]) => {
        const sorted = [...rows].sort(
          (x, y) =>
            String(x.Line_Name || "").localeCompare(String(y.Line_Name || "")) ||
            String(x.child_part_no).localeCompare(String(y.child_part_no))
        );
        return { name, rows: sorted };
      });
  }, [filteredRows]);

  // Expanded/collapsed state is kept per Part Name (a Set of the COLLAPSED
  // names, so every group — including ones that appear later — defaults to
  // expanded) and survives refetches, filters and search.
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggleGroup = useCallback((name) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);
  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(groups.map((g) => g.name)));

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Line", "Part Name", "Child Part", "Description", "Monthly Plan", "MTD Plan", "MTD Actual", "MTD Gap", "YD Plan", "YD Actual", "YD Gap", "541 MTD Actual", "541 MTD Gap", "541 YA", "541 YG"];
    const lines = [head.map(esc).join(",")];
    groups.forEach((g) => g.rows.forEach((r) => lines.push([
      r.Line_Name || "", g.name, r.child_part_no, r.child_part_desc,
      r.monthly_plan, r.mtd_plan, r.mtd_actual_fg, r.month_gap, r.yd_plan, r.yd_actual, r.yd_gap,
      r.sub541_mtd_actual, r.sub541_month_gap, r.sub541_yd_actual, r.sub541_yd_gap,
    ].map(esc).join(","))));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Component_Prod_Status_${plant}_${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          getOptionLabel={(p) => (p ? myPlantLabel(p) : "")}
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

        <Autocomplete
          size="small"
          options={operations}
          value={operations.find((o) => String(o.opt_id) === String(optId)) || null}
          onChange={(e, newVal) => setOptId(newVal ? newVal.opt_id : "")}
          getOptionLabel={(o) => (o ? o.opt_name : "")}
          isOptionEqualToValue={(o, v) => o.opt_id === v.opt_id}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Operation" />}
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

      <div
        style={{
          flexGrow: 1, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)", minHeight: 0, overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderBottom: "1px solid #eef0f3", minHeight: 30 }}>
          <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
            {groups.length} {groups.length === 1 ? "group" : "groups"} · {filteredRows.length} {filteredRows.length === 1 ? "part" : "parts"}
          </Typography>
          <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
            <Button size="small" onClick={expandAll} disabled={!groups.length} startIcon={<UnfoldMoreIcon sx={{ fontSize: 15 }} />} sx={{ ...compactButtonSx, height: 24, color: "#374151" }}>
              Expand all
            </Button>
            <Button size="small" onClick={collapseAll} disabled={!groups.length} startIcon={<UnfoldLessIcon sx={{ fontSize: 15 }} />} sx={{ ...compactButtonSx, height: 24, color: "#374151" }}>
              Collapse all
            </Button>
            <Button size="small" onClick={exportCsv} disabled={!filteredRows.length} startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />} sx={{ ...compactButtonSx, height: 24, color: "#374151" }}>
              Export
            </Button>
          </Box>
        </Box>
        <TableContainer sx={{ flexGrow: 1, minHeight: 0, overflowX: "auto" }}>
          <PartStatusTable groups={groups} collapsed={collapsed} onToggle={toggleGroup} loading={loading} loaded={loaded} />
        </TableContainer>
      </div>
    </>
  );
};

/* ============================================================
   Pill-style segmented tab control (same pattern as the MFG Report screen)
   ============================================================ */
const TAB_DEFS = [
  { key: "history", label: "Prod Status", Icon: HistoryOutlinedIcon },
  { key: "entry", label: "Component Daily Plan", Icon: EditNoteOutlinedIcon },
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

const MfgComponentDailyPlan = () => {
  const [tab, setTab] = useState(0);
  // Shared search box, sitting before the tabs — filters whichever tab is
  // currently active (Prod Status's history rows, or Component Daily Plan's Child Part
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
          MFG Daily Component Plan
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

export default MfgComponentDailyPlan;
