import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  TextField, Button, CircularProgress, Typography, Autocomplete, MenuItem, Select, Tooltip,
  Chip, Table, TableHead, TableBody, TableFooter, TableRow, TableCell, TableContainer, Box, IconButton, Collapse,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
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
import { downloadStatusExcel } from "./statusExcel";
import InfoTip from "../components/InfoTip";
import { monthlyPlanTipProps } from "../components/monthlyPlanTip";
import WorkingDaysTip, { workingDaysSplit } from "../components/WorkingDaysTip";
import { AuthContext } from "../Authentication/AuthContext";
import { getMfgPlanEditAccess } from "../Authentication/ActionAccessType";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import { getdetails as getModules } from "../controller/ModuleMasterapiservice";
import { getdetails as getLines } from "../controller/LineMasterapiservice";
import {
  GetMfgProductionDailyPlanGridApi,
  SaveMfgProductionDailyPlanApi,
  GetMfgProductionDailyPlanHistorySummaryApi,
  GetMfgProductionDailyPlanDayDetailApi,
  GetMfgProductionLinesApi,
  GetMfgProductionPlanBreakupApi,
} from "../controller/MfgProductionDailyPlanApiService";
import { getProductSegments } from "../controller/Masterapiservice";

// Prod Status Excel columns (the list in its on-screen order, search applied)
const STATUS_EXCEL_COLUMNS = [
  { header: "SI", width: 6 },
  { header: "Plant", width: 8 },
  { header: "Line", width: 14 },
  { header: "Part No", width: 18 },
  { header: "Description", width: 34 },
  { header: "Monthly Plan", width: 13, total: true },
  { header: "MTD Plan", width: 11, total: true },
  { header: "MTD Actual", width: 12, total: true },
  { header: "Gap", width: 10, total: true, gap: true },
  { header: "C.W Plan", width: 11, total: true },
  { header: "C.W Actual", width: 12, total: true },
  { header: "CW Gap", width: 10, total: true, gap: true },
  { header: "YD Plan", width: 11, total: true },
  { header: "YD Actual", width: 12, total: true },
  { header: "YD Gap", width: 10, total: true, gap: true },
];
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
  // Any shortage is red: the plan is green only when the remaining stock
  // covers it in full (e.g. stock 1950, plans 1500 + 400 + 51 -> 51 > the 50
  // left, so the last shift is red, not partially covered).
  if (coveragePct >= 100) return "green";
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
//   - The CURRENT week and any FUTURE week are fully editable - every day of the
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

// ---- Daily / Shift-wise view of the Plan Entry grid ----
// Shift-wise = one Plan input per shift (as always). Daily = ONE input per day showing A + B + C. Daily is only a view: the saved
// per-shift rows are never touched by switching; a day edited in Daily view is written on Save as: the new total in the FIRST shift
// and 0 in the other shifts that already hold a value (days that were not edited are never sent).
const VIEW_MODE_KEY = "mfgProdPlanViewMode";
const DAILY_LANE = [{ shift_name: "TOTAL" }]; // one pseudo shift, so the stock coverage runs day by day on the day totals
const DAY_EDIT_MARK = "__DAY"; // third part of a dirty key that belongs to a Daily-view edit
const cellKeyDay = (fgPart, periodKey) => `${fgPart}|${periodKey}|${DAY_EDIT_MARK}`;

// A + B + C of one day from the shift values; null when no shift has a value
const shiftTotal = (rowValues, periodKey, shifts) => {
  let any = false;
  let total = 0;
  shifts.forEach((sh) => {
    const v = rowValues[`${periodKey}|${sh.shift_name}`];
    if (v !== "" && v !== null && v !== undefined) { any = true; total += Number(v) || 0; }
  });
  return any ? total : null;
};
// what the Daily input shows: the value being typed for that day, else the shift total
const dailyDisplay = (rowDaily, rowValues, periodKey, shifts) => {
  if (rowDaily[periodKey] !== undefined) return rowDaily[periodKey];
  const t = shiftTotal(rowValues, periodKey, shifts);
  return t === null ? "" : String(t);
};

// Sliding Daily | Shift-wise switch (same pill look as the page tabs): one indicator glides under the active label
const ViewToggle = ({ value, onChange, disabled }) => {
  const options = [
    { key: "daily", label: "Daily", tip: "One Plan box per day (A + B + C added)" },
    { key: "shift", label: "Shift-wise", tip: "A Plan box per shift" },
  ];
  const idx = value === "daily" ? 0 : 1;
  return (
    <div role="group" aria-label="Plan view" style={{ position: "relative", display: "inline-grid", gridTemplateColumns: "1fr 1fr", padding: 3, backgroundColor: "#eef0f3", borderRadius: 999, opacity: disabled ? 0.6 : 1 }}>
      <span
        aria-hidden
        style={{
          position: "absolute", top: 3, bottom: 3, left: 3, width: "calc(50% - 3px)", borderRadius: 999, backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(16,24,40,0.18)", transform: `translateX(${idx * 100}%)`, transition: "transform .24s cubic-bezier(.4,0,.2,1)", pointerEvents: "none",
        }}
      />
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          title={o.tip}
          disabled={disabled}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          style={{
            position: "relative", zIndex: 1, border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", padding: "4px 12px", minWidth: 78,
            fontSize: 11, fontWeight: value === o.key ? 700 : 500, color: value === o.key ? "#0052cc" : "#5b6472", transition: "color .2s ease", whiteSpace: "nowrap",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

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
// daily = Daily view: `shifts` is then the one pseudo lane (DAILY_LANE), `rowValues` / `stockCoverage` are the day totals,
// and `actualShifts` are the real shifts whose actuals add up to the day's Actual - the table shows ONE Plan / Balance pair
const DayInfoPopover = ({ plant, row, period, dayPeriods, shifts, rowValues, stockCoverage, daily = false, actualShifts = null }) => {
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

  const actualOf = (s) => (actualShifts || [s]).reduce((t, a) => t + (row.cells[period.key]?.actual_shift?.[a.shift_name] || 0), 0);
  const dayHasAnyData = shifts.some((s) => {
    const c = stockCoverage.get(`${period.key}|${s.shift_name}`);
    const actualQty = actualOf(s);
    return (c && c.planQty > 0) || actualQty > 0;
  });

  const shiftTotals = shifts.map((s) => ({
    shift_name: s.shift_name,
    coverage: stockCoverage.get(`${period.key}|${s.shift_name}`),
    actualQty: actualOf(s),
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
                {!daily && <TableRow>
                  <TableCell rowSpan={2} sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", verticalAlign: "bottom", backgroundColor: "#d0dcf5", color: "#000" }}>Part No</TableCell>
                  <TableCell rowSpan={2} sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", verticalAlign: "bottom", backgroundColor: "#d0dcf5", color: "#000" }}>Description</TableCell>
                  <TableCell rowSpan={2} align="right" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", verticalAlign: "bottom", backgroundColor: "#d0dcf5", color: "#000" }}>Stock</TableCell>
                  {shifts.map((s) => (
                    <TableCell key={s.shift_name} colSpan={2} align="center" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", borderLeft: "1px solid #c3d0ef", backgroundColor: "#d0dcf5", color: "#000" }}>
                      {s.shift_name}
                    </TableCell>
                  ))}
                </TableRow>}
                <TableRow>
                  {daily && (
                    <>
                      <TableCell sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", backgroundColor: "#d0dcf5", color: "#000" }}>Part No</TableCell>
                      <TableCell sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", backgroundColor: "#d0dcf5", color: "#000" }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontSize: 10.5, fontWeight: 700, padding: "4px 6px", backgroundColor: "#d0dcf5", color: "#000" }}>Stock</TableCell>
                    </>
                  )}
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
  row, idx, periods, shifts, rowValues, today, currentWeekStart, onCellChange, onShiftCellChange, plant, canEdit, viewingPast,
  viewMode, rowDaily, onDailyCellChange,
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
  // Daily view: the same sequential stock consumption, run day by day on the day totals (one pseudo shift per day)
  const dailyLane = useMemo(() => {
    if (viewMode !== "daily") return null;
    const lane = {};
    dayPeriods.forEach((p) => { lane[`${p.key}|${DAILY_LANE[0].shift_name}`] = dailyDisplay(rowDaily, rowValues, p.key, shifts); });
    return lane;
  }, [viewMode, dayPeriods, rowDaily, rowValues, shifts]);
  const dailyCoverage = useMemo(
    () => (dailyLane ? computeStockCoverage(dayPeriods, DAILY_LANE, dailyLane, row.stock_available) : null),
    [dailyLane, dayPeriods, row.stock_available]
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
        if (p.period_type === "DAY" && viewMode === "daily") {
          const dailyVal = dailyDisplay(rowDaily, rowValues, p.key, shifts);
          const coverage = dailyCoverage?.get(`${p.key}|${DAILY_LANE[0].shift_name}`);
          const stockColorKey = getStockCoverageColorKey(coverage?.coveragePct, dailyVal);
          const actualTotal = shifts.reduce((t, sh) => t + (row.cells[p.key]?.actual_shift?.[sh.shift_name] || 0), 0);
          const colors = CELL_COLORS[getPlanActualColorKey(actualTotal, dailyVal)];
          const names = shifts.map((sh) => sh.shift_name).join(" + ");
          return (
            <td key={p.key} style={{ padding: "4px 4px", borderBottom: "1px solid #eef0f3", verticalAlign: "top", position: "relative" }}>
              {isWithinInfoWindow(p.plan_date, today) && (
                <DayInfoPopover plant={plant} row={row} period={p} dayPeriods={dayPeriods} shifts={DAILY_LANE} rowValues={dailyLane} stockCoverage={dailyCoverage} daily actualShifts={shifts} />
              )}
              <div className="mfg-plan-in">
                <div
                  style={{
                    boxSizing: "border-box",
                    border: `1.5px solid ${editable ? STOCK_BORDER_COLORS[stockColorKey] : "#c7cbd1"}`,
                    borderStyle: editable ? "solid" : "dashed",
                    borderBottom: "none",
                    borderRadius: "6px 6px 0 0",
                    backgroundColor: editable ? STOCK_BG_COLORS[stockColorKey] : "#f1f2f5",
                  }}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dailyVal}
                    disabled={inputDisabled}
                    onChange={(e) => onDailyCellChange(row.fg_part, p.key, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    title={inputDisabled ? lockedTitle : `Day total (${names})`}
                    style={{
                      width: "100%", boxSizing: "border-box", fontSize: 11, fontWeight: 700, padding: "4px 3px", textAlign: "center",
                      border: "none", outline: "none", backgroundColor: "transparent", color: PLAN_TEXT_COLOR,
                      cursor: inputDisabled ? (editable ? "default" : "not-allowed") : "text",
                    }}
                  />
                </div>
                <div
                  title={`Day total Actual (${names})`}
                  style={{
                    boxSizing: "border-box", border: `1.5px solid ${colors.border}`, borderRadius: "0 0 6px 6px", backgroundColor: colors.bg,
                    color: ACTUAL_TEXT_COLOR, fontSize: 9, fontWeight: 700, textAlign: "center", padding: "2px 0", cursor: "pointer",
                  }}
                >
                  {numberFmt(actualTotal)}
                </div>
              </div>
            </td>
          );
        }
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
              <div className="mfg-plan-in">
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
                          onShiftCellChange(row.fg_part, p.key, shiftName, capDigits(e.target.value, 4))
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
              onChange={(e) => onCellChange(row.fg_part, p.key, capDigits(e.target.value, digitCap))}
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
   entry is always for the CURRENT ISO week: one row per FG, one column per
   period (W-<n> week bucket, each of that week's 7 days, next W-<n+1> week
   bucket), each column showing a small Plan(editable)/Actual(read-only)
   split, colored green/red at the 90% Actual-vs-Plan threshold.
   ============================================================ */
// toggleSlot = the empty gap in the page header (between the title and the search box): the Daily | Shift-wise switch is drawn there
const PlanEntryBody = ({ searchText = "", toggleSlot = null }) => {
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
  // Nested by fg_part: values[fgPart] = { [periodKey]: value } for WEEK
  // cells, { [`${periodKey}|${shiftName}`]: value } for DAY cells. Nesting
  // (rather than one flat map) means editing one row only replaces THAT
  // row's own sub-object — every other row's reference is untouched, which
  // is what lets the memoized PlanRow below skip re-rendering on keystroke.
  const [values, setValues] = useState({});
  const [dirtyKeys, setDirtyKeys] = useState(new Set()); // flat "fgPart|periodKey[|shiftName]" strings (shiftName = "__DAY" for a Daily-view edit)
  // Daily view: the day totals the user typed, kept apart from `values` (the saved shift values), so switching views never touches shift data.
  const [dailyEdits, setDailyEdits] = useState({});
  const [viewMode, setViewMode] = useState(() => {
    // Daily is the default; the last choice the user made on this browser is remembered
    try { return window.localStorage.getItem(VIEW_MODE_KEY) === "shift" ? "shift" : "daily"; } catch (e) { return "daily"; }
  });

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const shiftsRef = useRef(shifts);
  shiftsRef.current = shifts;
  // plants without a configured shift have nothing to total: they stay on the shift view
  const effectiveMode = shifts.length > 0 ? viewMode : "shift";

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
      const data = await GetMfgProductionDailyPlanGridApi({
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
      setDailyEdits({});
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load Daily Production Plan.");
      setPeriods([]);
      setShifts([]);
      setRows([]);
      setValues({});
      setDirtyKeys(new Set());
      setDailyEdits({});
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

  // Daily-view input: a day total. Typing the total the day already has is no change; any other value is kept in dailyEdits only.
  const handleDailyCellChange = useCallback((fgPart, periodKey, rawValue) => {
    const value = capDigits(rawValue, 5);
    const original = shiftTotal(valuesRef.current[fgPart] || {}, periodKey, shiftsRef.current);
    const unchanged = value === (original === null ? "" : String(original));
    setDailyEdits((prev) => {
      const fgEdits = { ...(prev[fgPart] || {}) };
      if (unchanged) delete fgEdits[periodKey]; else fgEdits[periodKey] = value;
      return { ...prev, [fgPart]: fgEdits };
    });
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      if (unchanged) next.delete(cellKeyDay(fgPart, periodKey)); else next.add(cellKeyDay(fgPart, periodKey));
      return next;
    });
  }, []);

  // A Daily-view edit -> per-shift cells for the existing save: the total goes to the FIRST shift; every other shift that already
  // holds a value is set to 0. A shift with no saved value and nothing to write is skipped (no empty rows are created).
  const dailyToShiftCells = (fgPartStr, period) => {
    const raw = dailyEdits[fgPartStr]?.[period.key];
    const total = raw === "" || raw === undefined || raw === null ? 0 : Number(raw);
    const saved = values[fgPartStr] || {};
    const out = [];
    shifts.forEach(({ shift_name: shiftName }, i) => {
      const old = saved[`${period.key}|${shiftName}`];
      const hasSaved = old !== "" && old !== null && old !== undefined;
      const qty = i === 0 ? total : 0;
      if (!hasSaved && qty === 0) return;
      out.push({
        fg_part: Number(fgPartStr),
        period_type: period.period_type,
        plan_date: period.plan_date,
        week_number: period.week_number,
        week_end_date: period.week_end_date,
        user_input_qty: qty,
        shift_name: shiftName,
      });
    });
    return out;
  };

  // Daily | Shift-wise switch. Only the VIEW changes. With unsaved changes the user decides first (like changing the week).
  const changeViewMode = (next) => {
    if (next === viewMode) return;
    if (dirtyKeys.size > 0 && !window.confirm("You have unsaved changes. Discard them and switch the view?")) return;
    setViewMode(next);
    try { window.localStorage.setItem(VIEW_MODE_KEY, next); } catch (e) { /* the choice just is not remembered */ }
    if (dirtyKeys.size > 0) fetchGrid(); // reloads the saved values and clears the discarded edits
  };

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
        const [fgPartStr, periodKey, shiftName] = parts;
        const period = periodMap.get(periodKey);
        if (!period) return;
        if (shiftName === DAY_EDIT_MARK) {
          cells.push(...dailyToShiftCells(fgPartStr, period));
          return;
        }
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
          {shifts.length > 0 && toggleSlot && createPortal(<ViewToggle value={effectiveMode} onChange={changeViewMode} disabled={loading || saving} />, toggleSlot)}
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
        @keyframes mfgPlanIn { from { opacity: 0; transform: translateY(3px) scale(.985); } to { opacity: 1; transform: none; } }
        .mfg-plan-in { animation: mfgPlanIn .22s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .mfg-plan-in { animation: none; } }
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
                    <div key={effectiveMode} className="mfg-plan-in" style={{ display: "flex", marginTop: 3 }}>
                      {effectiveMode === "daily" ? (
                        <div
                          style={{ flex: 1, minWidth: 0, fontSize: 9, fontWeight: 700, color: "#3355aa", padding: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                          title={`Day total: ${shifts.map((x) => x.shift_name).join(" + ")}`}
                        >
                          Total
                        </div>
                      ) : shifts.map((s, i) => (
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
                canEdit={canEdit}
                viewingPast={viewingPast}
                viewMode={effectiveMode}
                rowDaily={dailyEdits[row.fg_part] || EMPTY_ROW_VALUES}
                onDailyCellChange={handleDailyCellChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ============================================================
   Prod Status table — lines (Line_Name of the FG part) as collapsible groups, each with its part-wise rows.
   Same layout as the MFG Daily Component Plan: one sticky header, a line row (chevron, name, FG count and the line's totals
   in the same columns, so a collapsed line still shows its numbers) and the part rows under it when the line is open.
   ============================================================ */
const GROUP_ACCENTS = [
  { bar: "#4f6bed", tint: "#f4f6fe" },
  { bar: "#0f9d8a", tint: "#f2f9f8" },
  { bar: "#c27c0e", tint: "#fbf8f1" },
  { bar: "#8a5bd6", tint: "#f8f5fc" },
  { bar: "#5b6b82", tint: "#f5f7f9" },
];
const STATUS_HEAD_BG = "#d0dcf5";
const STATUS_HEAD_LINE = "#b9c8ea";
const NUM_FONT = { fontVariantNumeric: "tabular-nums" };
const CUR_NOTE = " Applies to the current month only (0 for other months).";
// Column widths (%) — one colgroup for the header and every row, so numbers line up. 3.5 + 8.5 + 19 + 10 * 6.9 = 100.
const STATUS_PCT = { si: 3.5, line: 8.5, part: 19, num: 6.9 };

// kind: plan / actual / gap. cur = applies to the current month only (0 and greyed for other months).
// wd = the header hover is the working-days card (MTD Plan / C.W Plan).
const STATUS_COLS = [
  { key: "monthly_plan", label: "M.Plan", kind: "plan", tipProps: monthlyPlanTipProps() },
  { key: "mtd_plan", label: "MTD Plan", kind: "plan", wd: "mtd" },
  { key: "mtd_actual", label: "MTD Actual", kind: "actual", tip: "MTD Actual = production quantity of the selected month (Production Actual, movement types 101, 102, 261 and 262)" },
  { key: "month_gap", label: "Gap", kind: "gap", tip: "Gap = MTD Actual - MTD Plan" },
  { key: "cw_plan_calc", label: "C.W Plan", kind: "plan", wd: "cw", cur: true },
  { key: "cw_actual", label: "C.W Actual", kind: "actual", cur: true, tip: "C.W Actual = production quantity of the current week from Monday up to yesterday, today is not included (movement types 101, 102, 261 and 262)." + CUR_NOTE },
  { key: "cw_gap", label: "CW Gap", kind: "gap", cur: true, tip: "CW Gap = C.W Actual - C.W Plan." + CUR_NOTE },
  { key: "yd_plan", label: "YD Plan", kind: "plan", cur: true, tip: "YD Plan = yesterday's plan: the daily plan entered for yesterday, all shifts added together (Prod Daily Plan tab)." + CUR_NOTE },
  { key: "yd_actual", label: "YD Actual", kind: "actual", cur: true, tip: "YD Actual = yesterday's production quantity (movement types 101, 102, 261 and 262)." + CUR_NOTE },
  { key: "yd_gap", label: "YD Gap", kind: "gap", cur: true, tip: "YD Gap = YD Actual - YD Plan (positive = ahead, negative = behind)." + CUR_NOTE },
];

const gapTextColor = (v) => (v > 0 ? "#1b7a43" : v < 0 ? "#b42323" : "#6b7280");

const sumStatusRows = (rows) => {
  const totals = {};
  STATUS_COLS.forEach((c) => { totals[c.key] = rows.reduce((sum, r) => sum + (Number(r[c.key]) || 0), 0); });
  return totals;
};

// text / colour / weight / hover of one number cell. `na` = the current-month-only columns of a non-current month.
// `total` = a line or TOTAL row (dark numbers instead of the blue plan / black actual of the part rows).
const statusCell = (c, n, na, total = false) => {
  if (c.cur && na) return { text: "0", color: "#b6bac3", weight: 400, title: "Applies to the current month only" };
  if (c.kind === "gap") return { text: gapFmt(n), color: gapTextColor(n), weight: 700 };
  return { text: numberFmt(n), color: total ? "#1a2233" : c.kind === "plan" ? PLAN_TEXT_COLOR : ACTUAL_TEXT_COLOR, weight: total ? 700 : 600 };
};

const StatusColGroup = () => (
  <colgroup>
    <col style={{ width: `${STATUS_PCT.si}%` }} />
    <col style={{ width: `${STATUS_PCT.line}%` }} />
    <col style={{ width: `${STATUS_PCT.part}%` }} />
    {STATUS_COLS.map((c) => <col key={c.key} style={{ width: `${STATUS_PCT.num}%` }} />)}
  </colgroup>
);

const STATUS_BODY_CELL = {
  height: 36, padding: "0 10px", fontSize: 11.5, borderBottom: "1px solid #eef0f3",
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};

// A line: its header row (name, FG count, totals) and, under it, ONE Collapse holding a nested table with the part rows. The nested
// table shares the colgroup of the main table, so the numbers line up with the header. A single animated element per line keeps
// opening / closing smooth on long lists, and the Collapse unmounts the rows while the line is closed. React.memo + a stable
// onToggle: toggling one line does not re-render the others.
const LINE_ANIM_MS = 200;
const LineGroupRows = React.memo(({ group, accent, open, onToggle }) => (
  <>
    <TableRow
      hover
      onClick={() => onToggle(group.name)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(group.name); } }}
      tabIndex={0}
      role="button"
      aria-expanded={open}
      sx={{ cursor: "pointer", "&:hover > td": { filter: "brightness(0.97)" }, "&:focus-visible": { outline: "2px solid #0066FF", outlineOffset: -2 } }}
    >
      <TableCell
        colSpan={3}
        sx={{ p: 0, height: 32, backgroundColor: accent.tint, borderTop: "1px solid #dfe3ea", borderBottom: "1px solid #dfe3ea", borderLeft: `3px solid ${accent.bar}` }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, pl: 0.5, pr: 0.5 }}>
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#5b6472", transition: "transform .2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
          <Typography component="span" sx={{ fontSize: 11.5, fontWeight: 600, color: "#1a2233" }}>{group.name}</Typography>
          <Typography component="span" sx={{ fontSize: 10, color: "#6b7280" }}>{group.rows.length} FG</Typography>
        </Box>
      </TableCell>
      {STATUS_COLS.map((c) => {
        const s = statusCell(c, group.totals[c.key], group.naAll, true);
        return (
          <TableCell
            key={c.key}
            align="right"
            title={s.title}
            sx={{ ...NUM_FONT, padding: "0 10px", fontSize: 11.5, fontWeight: s.weight === 400 ? 400 : 600, color: s.color, backgroundColor: accent.tint, borderTop: "1px solid #dfe3ea", borderBottom: "1px solid #dfe3ea" }}
          >
            {s.text}
          </TableCell>
        );
      })}
    </TableRow>
    <TableRow>
      <TableCell colSpan={3 + STATUS_COLS.length} sx={{ p: 0, border: "none" }}>
        <Collapse in={open} timeout={LINE_ANIM_MS} unmountOnExit>
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <StatusColGroup />
            <TableBody>
              {group.rows.map((r) => (
                <TableRow key={r.fg_part} hover sx={{ "& td": { backgroundColor: "#fff" }, "&:hover td": { backgroundColor: "#f2f6fd" } }}>
                  <TableCell align="center" sx={{ ...STATUS_BODY_CELL, padding: "0 4px", color: "#6b7280", boxShadow: `inset 3px 0 0 ${accent.bar}` }}>{r.si}</TableCell>
                  <TableCell sx={{ ...STATUS_BODY_CELL, color: "#4b5565" }} title={r.Line_Name || ""}>{r.Line_Name || "–"}</TableCell>
                  <TableCell sx={{ ...STATUS_BODY_CELL, py: "3px", lineHeight: 1.3 }} title={`${r.fg_part_no} — ${r.fg_part_desc}`}>
                    <div style={{ color: "#0052cc", fontWeight: 700, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{r.fg_part_no}</div>
                    <div style={{ color: "#6b7280", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis" }}>{r.fg_part_desc}</div>
                  </TableCell>
                  {STATUS_COLS.map((c) => {
                    const s = statusCell(c, Number(r[c.key]) || 0, r.cw_na);
                    return (
                      <TableCell key={c.key} align="right" title={s.title} sx={{ ...STATUS_BODY_CELL, ...NUM_FONT, fontWeight: s.weight, color: s.color }}>
                        {s.text}
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
));

// the table itself: sticky two-part header, the line groups, and the TOTAL row (all lines shown) pinned to the bottom
const StatusGroupTable = ({ groups, expanded, onToggle, grand, grandNa, count, wd, loading, loaded }) => {
  const headCell = {
    backgroundColor: STATUS_HEAD_BG, color: "#000", fontSize: 10.5, fontWeight: 700, height: 36,
    padding: "0 10px", whiteSpace: "nowrap", borderBottom: `1px solid ${STATUS_HEAD_LINE}`,
  };
  const label = { cursor: "help" };
  return (
    <Table stickyHeader size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
      <StatusColGroup />
      <TableHead>
        <TableRow>
          <TableCell align="center" sx={{ ...headCell, padding: "0 4px" }}>
            <InfoTip trigger="SI" text="Serial number of the part inside its line (1, 2, 3 ... per line, follows the current search)" labelStyle={label} />
          </TableCell>
          <TableCell sx={headCell}>
            <InfoTip trigger="Line" text="Production line of the FG part (from the Material Master)" labelStyle={label} />
          </TableCell>
          <TableCell sx={headCell}>
            <InfoTip trigger="Part No / Description" text="FG part number and its description" labelStyle={label} />
          </TableCell>
          {STATUS_COLS.map((c) => (
            <TableCell key={c.key} align="right" sx={headCell}>
              {c.wd ? (
                <WorkingDaysTip kind={c.wd} wd={wd} labelStyle={label} extraNote={c.cur ? CUR_NOTE.trim() : undefined}>{c.label}</WorkingDaysTip>
              ) : (
                <InfoTip trigger={c.label} {...(c.tipProps || { text: c.tip })} labelStyle={label} />
              )}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {groups.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3 + STATUS_COLS.length} align="center" sx={{ py: 4, color: "#8a93a3", border: "none", fontSize: 12 }}>
              {loading ? "Loading…" : loaded ? "No plan history found for the selected filters." : ""}
            </TableCell>
          </TableRow>
        ) : (
          groups.map((g, gi) => (
            <LineGroupRows key={g.name} group={g} accent={GROUP_ACCENTS[gi % GROUP_ACCENTS.length]} open={expanded.has(g.name)} onToggle={onToggle} />
          ))
        )}
      </TableBody>
      {groups.length > 0 && (
        <TableFooter>
          <TableRow>
            <TableCell
              colSpan={3}
              sx={{ position: "sticky", bottom: 0, zIndex: 3, backgroundColor: "#eaf0fc", borderTop: "2px solid #b8c7ec", borderBottom: "1px solid #d0dcf5", height: 34, padding: "0 10px", fontSize: 11, fontWeight: 700, color: "#1a2233", letterSpacing: 0.3 }}
            >
              TOTAL <Box component="span" sx={{ fontWeight: 400, color: "#6b7280", fontSize: 10 }}>({count} FG)</Box>
            </TableCell>
            {STATUS_COLS.map((c) => {
              const s = statusCell(c, grand[c.key], grandNa, true);
              return (
                <TableCell
                  key={c.key}
                  align="right"
                  title={s.title}
                  sx={{ position: "sticky", bottom: 0, zIndex: 3, backgroundColor: "#eaf0fc", borderTop: "2px solid #b8c7ec", borderBottom: "1px solid #d0dcf5", ...NUM_FONT, height: 34, padding: "0 10px", fontSize: 11.5, fontWeight: s.weight, color: s.color }}
                >
                  {s.text}
                </TableCell>
              );
            })}
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
};

/* ============================================================
   Break-up sheets of the Prod Status Excel: the rows behind every number of the main sheet, so the user can see how the list on
   the screen was built. Every FG ends with shaded lines that equal the figures of the main sheet; the ALL FG lines add them up.
     Plan Breakup    : the Monthly Plan rows (Plan Qty x Ends) -> Monthly Plan, then the MTD Plan and C.W Plan formulas
     Actual Breakup  : the production rows of the month        -> MTD Actual, C.W Actual (Monday .. yesterday), YD Actual
     YD Plan Breakup : the plan typed for yesterday, per shift -> YD Plan (current month only)
   ============================================================ */
const buildProdBreakupSheets = (models, data, { year, month }) => {
  const num = (v) => Number(v) || 0;
  const keyOf = (p) => String(p ?? "").trim().toLowerCase();
  const groupBy = (list) => {
    const m = new Map();
    (list || []).forEach((x) => { const k = keyOf(x.part_number); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    return m;
  };
  const planBy = groupBy(data.plan);
  const actBy = groupBy(data.actual);
  const enBy = groupBy(data.entered);
  const sub = (arr) => { arr.sub = true; return arr; }; // shaded, bold lines
  const cellStyle = (v, i, c, row) => (row && row.sub ? { s: { font: { bold: true }, fill: { fgColor: { rgb: "EAF0FC" } } } } : null);
  const head = (h, w) => ({ header: h, width: w });
  const qtyCol = (h) => ({ header: h, width: 14, format: "#,##0" });
  const isCurrent = models.length > 0 && models[0].is_current_month !== false; // C.W and YD only apply to the current month
  const wd = models.length ? models[0].working_days : null;
  const weekDays = wd && wd.week ? wd.week.days : 0;
  const monthName = `${year}-${String(month).padStart(2, "0")}`;
  const sumQty = (list, key) => list.reduce((t, x) => t + num(x[key]), 0);

  const planRows = [];
  const actualRows = [];
  const ydRows = [];
  const tot = { monthly: 0, mtdPlan: 0, cwPlan: 0, mtd: 0, cw: 0, yd: 0, ydPlan: 0 };
  models.forEach((r) => {
    const base = [r.fg_part_no, r.fg_part_desc || ""];
    // ---- plan
    const pr = planBy.get(keyOf(r.fg_part_no)) || [];
    pr.forEach((x) => planRows.push([...base, x.effective_date, "MP", num(x.plan_qty), num(x.ends), num(x.plan_qty) * num(x.ends)]));
    const monthly = pr.reduce((t, x) => t + num(x.plan_qty) * num(x.ends), 0);
    planRows.push(sub([...base, "Monthly Plan (sum of Plan Qty x Ends)", "", "", "", monthly]));
    planRows.push(sub([...base, `MTD Plan = Monthly Plan / ${wd ? wd.monthDays : "working days of the month"} working days x ${wd ? wd.elapsedDays : "working days up to yesterday"} working days up to yesterday`, "", "", "", num(r.mtd_plan)]));
    if (isCurrent) planRows.push(sub([...base, `C.W Plan = Monthly Plan / ${wd ? wd.monthDays : "working days of the month"} working days x ${weekDays} working days of this week up to yesterday`, "", "", "", num(r.cw_plan_calc)]));
    tot.monthly += monthly; tot.mtdPlan += num(r.mtd_plan); tot.cwPlan += isCurrent ? num(r.cw_plan_calc) : 0;
    // ---- production
    const ar = actBy.get(keyOf(r.fg_part_no)) || [];
    ar.forEach((x) => actualRows.push([...base, x.prod_date, x.moment_type, num(x.prod_qty)]));
    const mtd = sumQty(ar, "prod_qty");
    actualRows.push(sub([...base, "MTD Actual (sum of the production rows)", "", mtd]));
    tot.mtd += mtd;
    if (isCurrent) {
      const cw = sumQty(ar.filter((x) => x.prod_date >= data.cwStart && x.prod_date <= data.yesterday), "prod_qty");
      const yd = sumQty(ar.filter((x) => x.prod_date === data.yesterday), "prod_qty");
      actualRows.push(sub([...base, `C.W Actual (rows from Monday ${data.cwStart} to yesterday)`, "", cw]));
      actualRows.push(sub([...base, `YD Actual (rows of yesterday ${data.yesterday})`, "", yd]));
      tot.cw += cw; tot.yd += yd;
      // ---- plan typed for yesterday
      const er = enBy.get(keyOf(r.fg_part_no)) || [];
      er.forEach((x) => ydRows.push([...base, x.plan_date, x.shift_name || "-", num(x.user_input_qty)]));
      const ydPlan = sumQty(er, "user_input_qty");
      ydRows.push(sub([...base, "YD Plan (all shifts added)", "", ydPlan]));
      tot.ydPlan += ydPlan;
    }
  });
  const all = [`ALL FG`, `${models.length} FG`];
  planRows.push(sub([...all, "Total Monthly Plan", "", "", "", tot.monthly]));
  planRows.push(sub(["ALL FG", "", "Total MTD Plan", "", "", "", tot.mtdPlan]));
  if (isCurrent) planRows.push(sub(["ALL FG", "", "Total C.W Plan", "", "", "", tot.cwPlan]));
  actualRows.push(sub([...all, "Total MTD Actual", "", tot.mtd]));
  if (isCurrent) {
    actualRows.push(sub(["ALL FG", "", "Total C.W Actual", "", tot.cw]));
    actualRows.push(sub(["ALL FG", "", "Total YD Actual", "", tot.yd]));
    ydRows.push(sub([...all, "Total YD Plan", "", tot.ydPlan]));
  }
  // the labels of the ALL FG lines sit in the Date column, like every other shaded line
  const wdText = (d, n) => (d
    ? `${n} = ${workingDaysSplit(d)} (weekends and DHRM holidays are not working days).`
    : `${n} (the DHRM holidays could not be read, so the old rule is used: 26 days a month, Sundays only).`);
  const cur = " Applies to the current month only (0 for other months).";
  const guide = [
    ["Item", "How it is calculated"],
    ["Month", monthName],
    ["Monthly Plan", "Sum of Plan Qty x Ends: each Monthly Plan row (plan type MP, Trn_Production_Plan) of the FG part inside the month is multiplied by its own Ends, then all those rows are added together; a missing Ends counts as 1. Rows: sheet 'Plan Breakup'."],
    ["Working days of the month", wdText(wd && wd.month, wd ? wd.monthDays : "-")],
    ["Working days up to yesterday", wdText(wd && wd.elapsed, wd ? wd.elapsedDays : "-") + " A past month counts the whole month; a future month counts 0."],
    ["MTD Plan", "(Monthly Plan / working days of the month) x working days up to yesterday, rounded to a whole number. Shown at the end of each FG in 'Plan Breakup'."],
    ["MTD Actual", `Sum of the production quantity (Trn_Actual_Production_Plan, movement types ${data.movements}) of the FG part inside the month. Rows: sheet 'Actual Breakup'.`],
    ["Gap", "MTD Actual - MTD Plan (positive = ahead, negative = behind)."],
    ["C.W Plan", "(Monthly Plan / working days of the month) x working days of this week from Monday up to yesterday (today is not counted)." + (wd && wd.week && wd.week.detail ? ` This week: ${weekDays} = ${workingDaysSplit(wd.week.detail)}.` : "") + cur],
    ["C.W Actual", "Production of the FG part from Monday of this week up to yesterday (today is not included). Rows: sheet 'Actual Breakup'." + cur],
    ["CW Gap", "C.W Actual - C.W Plan." + cur],
    ["YD Plan", "The plan typed for yesterday on the Prod Daily Plan tab, all shifts added. Rows: sheet 'YD Plan Breakup'." + cur],
    ["YD Actual", "Production of the FG part yesterday. Rows: sheet 'Actual Breakup'." + cur],
    ["YD Gap", "YD Actual - YD Plan." + cur],
    ["Break-up sheets", "Each FG lists the rows it is built from, then shaded lines that equal the values on the main sheet. The ALL FG lines add up every FG listed."],
  ];
  const sheets = [
    { sheetName: "How to read", columns: [head("Item", 26), head("Explanation", 120)], rows: guide.slice(1), noTotal: true },
    { sheetName: "Plan Breakup", columns: [head("FG Part No", 18), head("FG Description", 34), head("Effective Date", 16), head("Plan Type", 11), qtyCol("Plan Qty"), head("Ends", 8), qtyCol("Plan Qty x Ends")], rows: planRows, noTotal: true, cellStyle },
    { sheetName: "Actual Breakup", columns: [head("FG Part No", 18), head("FG Description", 34), head("Production Date", 18), head("Movement Type", 15), qtyCol("Qty")], rows: actualRows, noTotal: true, cellStyle },
  ];
  if (isCurrent) sheets.push({ sheetName: "YD Plan Breakup", columns: [head("FG Part No", 18), head("FG Description", 34), head("Plan Date", 16), head("Shift", 10), qtyCol("Plan Qty")], rows: ydRows, noTotal: true, cellStyle });
  return sheets;
};

/* ============================================================
   Tab 1: Plan History — FG parts grouped by Line, each line collapsible; Month/Current-Week/Yesterday Plan vs Actual vs
   Gap per part, resolved via getPlanHistorySummary.
   Plant defaults to the logged-in user's own plant (still changeable); Segment narrows the Line dropdown (the lines of the
   segment's FG parts in the plant's MFG BOM); Month/Year pick the month. Lines start collapsed.
   ============================================================ */
const PlanHistoryBody = ({ searchText = "" }) => {
  const { user } = useContext(AuthContext);

  const [plants, setPlants] = useState([]);
  const [segments, setSegments] = useState([]);
  const [lineOptions, setLineOptions] = useState([]);

  const [plant, setPlant] = useState(user?.PlantCode || "");
  const [segmentId, setSegmentId] = useState("");
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
  // names of the lines that are OPEN (an empty Set = every line collapsed, the starting state)
  const [expanded, setExpanded] = useState(() => new Set());

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [plantRes, segmentRes] = await Promise.all([
          getMyPlants(), // Prod Status Plant dropdown: only the plants this user may use (own + Data Access)
          getProductSegments(),
        ]);
        setPlants(Array.isArray(plantRes) ? plantRes : []);
        // Segment dropdown: same order as the Product Segment screen (by segment id)
        setSegments([...(segmentRes?.data || [])].sort((a, b) => Number(a.prod_seg_id) - Number(b.prod_seg_id)));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load Plant/Segment filter options.");
      }
    };
    loadMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Line dropdown: the lines of the FG parts in the plant's MFG BOM, narrowed to the chosen Segment (loaded from the API
  // whenever the Plant or the Segment changes). Line names repeat across plants, so nothing is listed before a Plant is picked.
  useEffect(() => {
    if (!plant) { setLineOptions([]); return undefined; }
    let cancelled = false;
    GetMfgProductionLinesApi({ plant, segmentId: segmentId || undefined })
      .then((rows) => { if (!cancelled) setLineOptions(Array.isArray(rows) ? rows : []); })
      .catch((error) => {
        console.error(error);
        if (!cancelled) { setLineOptions([]); toast.error("Failed to load Line filter options."); }
      });
    return () => { cancelled = true; };
  }, [plant, segmentId]);

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
        segmentId: segmentId || undefined,
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
      historyRows.map((r) => {
        // C.W and YD columns only apply to the current month: for any other month they are 0 (greyed out)
        const na = r.is_current_month === false;
        const cwActual = na ? 0 : r.cw_actual || 0;
        const cwPlan = na ? 0 : r.cw_plan_calc || 0;
        const ydActual = na ? 0 : r.yd_actual || 0;
        const ydPlan = na ? 0 : r.yd_plan || 0;
        return {
          id: r.fg_part,
          ...r,
          cw_plan_calc: cwPlan,
          cw_actual: cwActual,
          yd_plan: ydPlan,
          yd_actual: ydActual,
          cw_na: na,
          // MTD Gap / CW Gap follow the MTD Plan and C.W Plan (from the monthly plan, whole numbers)
          month_gap: (r.mtd_actual || 0) - (r.mtd_plan || 0),
          cw_gap: cwActual - cwPlan,
          yd_gap: ydActual - ydPlan,
        };
      }),
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

  // Group by Line (built from the returned data, never hardcoded): lines by their total Monthly Plan (highest first), parts
  // inside a line by Monthly Plan (highest first). `si` = the serial number of the part inside its line (1, 2, 3 ... per line).
  const groups = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const name = r.Line_Name || "No Line";
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(r);
    });
    const list = Array.from(map.entries()).map(([name, rows]) => {
      const sorted = [...rows].sort(
        (a, b) => (Number(b.monthly_plan) || 0) - (Number(a.monthly_plan) || 0) || String(a.fg_part_no).localeCompare(String(b.fg_part_no))
      );
      return { name, rows: sorted, totals: sumStatusRows(sorted), naAll: sorted.every((r) => r.cw_na) };
    }).sort((x, y) => (y.totals.monthly_plan - x.totals.monthly_plan) || x.name.localeCompare(y.name));
    return list.map((g) => ({ ...g, rows: g.rows.map((r, i) => ({ ...r, si: i + 1 })) }));
  }, [filteredRows]);

  const grand = useMemo(() => sumStatusRows(filteredRows), [filteredRows]);
  const grandNa = filteredRows.length > 0 && filteredRows.every((r) => r.cw_na);
  const wdInfo = historyRows.length ? historyRows[0].working_days : null;

  // lines start collapsed; while the search box is used, the lines that have a match open so the parts are visible
  useEffect(() => {
    setExpanded(searchText.trim() ? new Set(groups.map((g) => g.name)) : new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);
  const toggleLine = useCallback((name) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);
  const expandAll = () => setExpanded(new Set(groups.map((g) => g.name)));
  const collapseAll = () => setExpanded(new Set());

  // Excel of the Prod Status list as shown (search applied): every part in the list order, with a TOTAL row
  const exportExcel = async () => {
    const models = groups.flatMap((g) => g.rows);
    if (models.length === 0) {
      toast.warning("No data available to export.");
      return;
    }
    try {
      const rows = models.map((r, i) => [
        i + 1, r.plant || plant, r.Line_Name || "", r.fg_part_no, r.fg_part_desc,
        r.monthly_plan || 0, r.mtd_plan || 0, r.mtd_actual || 0, r.month_gap || 0,
        r.cw_plan_calc || 0, r.cw_actual || 0, r.cw_gap || 0, r.yd_plan || 0, r.yd_actual || 0, r.yd_gap || 0,
      ]);
      // the rows behind the numbers (plan rows, production rows, plan typed for yesterday) for the break-up sheets
      let breakup = null;
      try {
        breakup = await GetMfgProductionPlanBreakupApi({
          plant, fromDate: monthStartStr(year, month), toDate: monthEndStr(year, month),
          fgParts: models.map((r) => r.fg_part_no).join(","), fgIds: models.map((r) => r.fg_part).join(","),
        });
      } catch (error) {
        console.error(error);
        toast.warning("The break-up sheets could not be loaded, only the main sheet is downloaded.");
      }
      downloadStatusExcel({
        sheetName: "Prod Status",
        fileName: `MFG_Prod_Status_${plant}_${year}-${String(month).padStart(2, "0")}.xlsx`,
        columns: STATUS_EXCEL_COLUMNS,
        rows,
        totalLabel: `TOTAL (${rows.length} FG)`,
        extraSheets: breakup ? buildProdBreakupSheets(models, breakup, { year, month }) : [],
      });
      toast.success("Excel downloaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Excel file.");
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
          onChange={(e, newVal) => { setPlant(newVal ? newVal.Plant_Code : ""); setSegmentId(""); setLineId(""); }}
          getOptionLabel={(p) => (p ? myPlantLabel(p) : "")}
          isOptionEqualToValue={(o, v) => o.Plant_ID === v.Plant_ID}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Plant" />}
        />

        <Autocomplete
          size="small"
          options={segments}
          value={segments.find((x) => String(x.prod_seg_id) === String(segmentId)) || null}
          onChange={(e, newVal) => { setSegmentId(newVal ? newVal.prod_seg_id : ""); setLineId(""); }}
          getOptionLabel={(x) => (x ? x.seg_name : "")}
          isOptionEqualToValue={(o, v) => o.prod_seg_id === v.prod_seg_id}
          sx={compactFieldSx(150)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Segment" placeholder="All Segments" />}
        />

        <Autocomplete
          size="small"
          disabled={!plant}
          options={lineOptions}
          value={lineOptions.find((l) => String(l.Line_ID) === String(lineId)) || null}
          onChange={(e, newVal) => setLineId(newVal ? newVal.Line_ID : "")}
          getOptionLabel={(l) => (l ? l.Line_Name : "")}
          isOptionEqualToValue={(o, v) => o.Line_ID === v.Line_ID}
          sx={compactFieldSx(190)}
          ListboxProps={{ style: { fontSize: 11.5 } }}
          renderInput={(params) => <TextField {...params} label="Line" placeholder={plant ? "All Lines" : "Select Plant first"} />}
        />

        {/* Month + Year as ONE grouped "Period" control — a single bordered
            field with a divider between the two selects, instead of two
            separate boxes, matching a compact monthly-report filter. */}
        <div>
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
            {groups.length} {groups.length === 1 ? "line" : "lines"} · {filteredRows.length} FG
          </Typography>
          <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
            <Button size="small" onClick={expandAll} disabled={!groups.length} startIcon={<UnfoldMoreIcon sx={{ fontSize: 15 }} />} sx={{ ...compactButtonSx, height: 24, color: "#374151" }}>
              Expand all
            </Button>
            <Button size="small" onClick={collapseAll} disabled={!groups.length} startIcon={<UnfoldLessIcon sx={{ fontSize: 15 }} />} sx={{ ...compactButtonSx, height: 24, color: "#374151" }}>
              Collapse all
            </Button>
            <Button size="small" onClick={exportExcel} disabled={!filteredRows.length} startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />} sx={{ ...compactButtonSx, height: 24, color: "#374151" }}>
              Export Excel
            </Button>
          </Box>
        </Box>
        <TableContainer sx={{ flexGrow: 1, minHeight: 0, overflowX: "auto" }}>
          <StatusGroupTable
            groups={groups}
            expanded={expanded}
            onToggle={toggleLine}
            grand={grand}
            grandNa={grandNa}
            count={filteredRows.length}
            wd={wdInfo}
            loading={loading}
            loaded={loaded}
          />
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
  // the gap in the middle of the header: the Prod Daily Plan tab puts its Daily | Shift-wise switch here (a portal)
  const [toggleSlot, setToggleSlot] = useState(null);

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

        <div ref={setToggleSlot} data-view-toggle-slot style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 30 }} />

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
        {tab === 0 ? <PlanHistoryBody searchText={searchText} /> : <PlanEntryBody searchText={searchText} toggleSlot={toggleSlot} />}
      </div>
    </div>
  );
};

export default MfgProductionDailyPlan;
