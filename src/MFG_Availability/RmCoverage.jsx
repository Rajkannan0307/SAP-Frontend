import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, CircularProgress, TextField, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { downloadStatusExcel } from "./statusExcel";
import { GetRmCoverageApi } from "../controller/RmCoverageApiService";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import InfoTip from "../components/InfoTip";
import { FilterPanel, FilterToggleButton } from "../components/FilterPanel";
import FilterSelect from "../components/FilterSelect";
import { compactFieldSx, primaryButtonSx } from "../components/compactUi";
import { DAY_CELLS, STATUS_META, COVERAGE_GREEN, COVERAGE_EMPTY, coverageFills, coverageFillPercent, fmtNum } from "./rmCoverageUtils";

// Child Part Coverage (PPC & MRPC; code name RmCoverage): raw-material coverage of the child parts: ROH used with any valuation type, HALB used with any valuation type except INHOUSE.
//   Plan = SUM of (FG monthly MP plan x BOM qty) of every FG that uses the child part;  Demand per Day = Plan / 26
//   Coverage Days = Current Stock (latest MB52 snapshot) / Demand per Day
//   Status: R = stock below the Safety Stock, G = coverage > 3 days and stock above the Safety Stock, Y = anything else
// The numbers are calculated by the backend (MFG_BOM/RmCoverage.router.js); this screen shows them.

const HEAD_H = 24; // height of the first header row (the second one sticks right below it)
// Column widths are percentages of the table, so the table always fits the screen (no horizontal scroll, only the
// rows scroll vertically). The Part Number / Description column takes whatever is left.
const COL_W = { si: "3%", plan: "6.5%", perDay: "6.5%", safety: "6.5%", max: "6%", stock: "6.5%", status: "4.5%", days: "5%", cell: "2.9%" };
const TABLE_STYLE = { width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 };

const headBase = {
  position: "sticky",
  backgroundColor: "#d0dcf5",
  color: "#000",
  fontSize: 10.5,
  fontWeight: 700,
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #b9c8ec",
  zIndex: 2,
  boxSizing: "border-box",
};
const cellBase = { fontSize: 11, color: "#333", padding: "4px 8px", borderBottom: "1px solid #eef0f3", boxSizing: "border-box", whiteSpace: "nowrap" };
const num = { ...cellBase, textAlign: "right" };

const uniqSorted = (list) => [...new Set(list)].sort((a, b) => a.localeCompare(b));
const vendorLabel = (v) => `${v.vendor_code} - ${v.vendor_name}`;
const buyerLabel = (v) => `${v.buyer_id} - ${v.buyer_name}`;

// header cell with a short explanation on hover (same idea as the other MFG screens)
const Head = ({ tip, children, ...props }) => (
  <th {...props}>
    <Tooltip title={tip} arrow placement="top" enterDelay={250}>
      <span style={{ display: "block" }}>{children}</span>
    </Tooltip>
  </th>
);

const monthLabel = (month) => {
  const [y, m] = String(month || "").split("-").map(Number);
  if (!y || !m) return "";
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
};
// '2026-10-01T06:39:07.740Z' -> '01-10-2026 06:39' (shown exactly as stored, no time-zone shift)
const stockAsOfLabel = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : "";
};

const StatusChip = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.Y;
  return (
    <Tooltip title={`${meta.name}: ${meta.rule}`} arrow placement="top">
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%",
          backgroundColor: meta.color, color: meta.text, fontSize: 11, fontWeight: 700, cursor: "default",
        }}
      >
        {meta.letter}
      </span>
    </Tooltip>
  );
};

const RmCoverage = () => {
  // Only the plants this user may use (own plant + User Master > Data Access) - the same list as the Manufacturing BOM
  const [plants, setPlants] = useState([]);
  const [plantSelect, setPlantSelect] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [buyerFilter, setBuyerFilter] = useState("All");
  const [lineFilter, setLineFilter] = useState("All");
  const [valuationFilter, setValuationFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ month: "", stock_as_of: null });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }); // yyyy-MM
  const [filtersOpen, setFiltersOpen] = useState(false);
  const plantDefaulted = useRef(false);
  const headScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const [scrollbarW, setScrollbarW] = useState(0); // width of the body vertical scrollbar, kept free on the header so the columns line up

  useEffect(() => {
    getMyPlants()
      .then((res) => setPlants(Array.isArray(res) ? res : []))
      .catch((error) => console.error("Failed to load Plant list.", error));
  }, []);

  const plantCodesFor = (label) =>
    label === "All"
      ? plants.map((p) => String(p.Plant_Code))
      : plants.filter((p) => myPlantLabel(p) === label).map((p) => String(p.Plant_Code));

  const fetchData = async (label, monthValue = month) => {
    const codes = plantCodesFor(label);
    if (codes.length === 0) {
      toast.warning("You have no plant to show.");
      return;
    }
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(String(monthValue || ""))) {
      toast.warning("Please select a valid month (for example Oct 2026).");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const data = await GetRmCoverageApi({ plants: codes.join(","), month: monthValue });
      setRows(data?.rows || []);
      setMeta({ month: data?.month || "", stock_as_of: data?.stock_as_of || null });
      setVendorFilter("All");
      setBuyerFilter("All");
      setLineFilter("All");
      setValuationFilter("All");
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load the Child Part Coverage.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // The user's own login plant (Is_Default) is selected and loaded as soon as the plant list is there; after that the
  // user can switch to another plant (or All) and press Search.
  useEffect(() => {
    if (plantDefaulted.current || plants.length === 0) return;
    plantDefaulted.current = true;
    const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0];
    const label = myPlantLabel(own);
    setPlantSelect(label);
    fetchData(label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plants]);

  const vendorOptions = useMemo(() => uniqSorted(rows.flatMap((r) => r.vendors.map(vendorLabel))), [rows]);
  const lineOptions = useMemo(() => uniqSorted(rows.map((r) => r.line_name).filter(Boolean)), [rows]);
  const valuationOptions = useMemo(() => uniqSorted(rows.flatMap((r) => r.valuation_types || [])), [rows]);
  const buyerOptions = useMemo(() => uniqSorted(rows.flatMap((r) => r.vendors.filter((v) => v.buyer_id).map(buyerLabel))), [rows]);

  const visibleRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (vendorFilter !== "All" && !r.vendors.some((v) => vendorLabel(v) === vendorFilter)) return false;
      if (buyerFilter !== "All" && !r.vendors.some((v) => v.buyer_id && buyerLabel(v) === buyerFilter)) return false;
      if (lineFilter !== "All" && r.line_name !== lineFilter) return false;
      if (valuationFilter !== "All" && !(r.valuation_types || []).includes(valuationFilter)) return false;
      if (!text) return true;
      return String(r.child_part_no).toLowerCase().includes(text) || String(r.child_part_desc || "").toLowerCase().includes(text);
    });
  }, [rows, vendorFilter, buyerFilter, lineFilter, valuationFilter, searchText]);

  // Excel of the table as shown (Vendor / Buyer / Line / Valuation Type / search applied): the numbers, the status and the 10 coverage cells
  // (100% = a whole day covered, a part = part of a day; cells coloured like the status on screen).
  const handleExportExcel = () => {
    if (visibleRows.length === 0) {
      toast.warning("No data available to export.");
      return;
    }
    try {
      const columns = [
        { header: "SI", width: 6 },
        { header: "Plant", width: 8 },
        { header: "Part Number", width: 18 },
        { header: "Description", width: 34 },
        { header: "Material Type", width: 10 },
        { header: "Line", width: 14 },
        { header: "Valuation Type", width: 18 },
        { header: "Vendor", width: 30 },
        { header: "Buyer", width: 20 },
        { header: "Plan", width: 11, total: true },
        { header: "Demand / Day", width: 12, total: true },
        { header: "Safety Stock", width: 11 },
        { header: "Max Stock", width: 11 },
        { header: "Current Stock", width: 13, total: true },
        { header: "Status", width: 12 },
        { header: "Coverage Days", width: 13 },
        ...Array.from({ length: DAY_CELLS }, (_, i) => ({ header: String(i + 1), width: 6 })),
      ];
      const STATUS_COL = 14;
      const DAY_FROM = 16;
      const blank = (v) => (v === null || v === undefined ? "" : v);
      const rows = visibleRows.map((r, i) => [
        i + 1, r.plant, r.child_part_no, r.child_part_desc || "", r.material_type || "", r.line_name || "", (r.valuation_types || []).join(", "),
        r.vendor_code ? `${r.vendor_code} ${r.vendor_name || ""}${r.vendors.length > 1 ? ` (+${r.vendors.length - 1} more)` : ""}` : "",
        r.buyer_name || "",
        r.plan_qty || 0, Math.round(r.demand_per_day || 0), blank(r.safety_stock), blank(r.max_stock), r.current_stock || 0,
        (STATUS_META[r.status] || {}).name || "", blank(r.coverage_days),
        ...coverageFills(r.coverage_days),
      ]);
      downloadStatusExcel({
        sheetName: "Child Part Coverage",
        fileName: `Child_Part_Coverage_${plantSelect === "All" ? "All" : plantSelect.split(" ")[0]}_${meta.month || month}.xlsx`,
        columns,
        groups: [{ label: "Coverage (each block = 1 day)", from: DAY_FROM, to: DAY_FROM + DAY_CELLS - 1 }],
        rows,
        totalLabel: `TOTAL (${rows.length} parts)`,
        // second sheet: how each Plan is built. FG monthly MP plan x BOM qty = Child Plan of that FG; the lines of one
        // child part add up (SUMIF on Part Number) to the Plan on the first sheet.
        extraSheets: [{
          sheetName: "Plan Break-up",
          columns: [
            { header: "SI", width: 6 },
            { header: "Plant", width: 8 },
            { header: "Child Part", width: 18 },
            { header: "Child Description", width: 34 },
            { header: "FG Part No", width: 18 },
            { header: "FG Description", width: 34 },
            { header: "FG Monthly Plan (MP)", width: 20, total: true },
            { header: "BOM Qty", width: 11, format: "#,##0.000" },
            { header: "Child Plan (FG Plan x BOM Qty)", width: 28, total: true },
          ],
          rows: visibleRows.flatMap((r) => r.plan_breakup.map((b) => [r.plant, r.child_part_no, r.child_part_desc || "", b.fg_part_no, b.fg_desc || "", b.fg_plan, b.bom_qty, b.child_plan]))
            .map((line, i) => [i + 1, ...line]),
          totalLabel: "TOTAL",
        }, {
          // third sheet: the raw MB52 lines behind Current Stock (one line per storage location). Only the Unrestricted
          // qty is counted in Current Stock; Quality Inspection and Blocked are shown for information.
          sheetName: "Stock Break-up",
          columns: [
            { header: "SI", width: 6 },
            { header: "Plant", width: 8 },
            { header: "Part Number", width: 18 },
            { header: "Description", width: 34 },
            { header: "Storage Location", width: 16 },
            { header: "UOM", width: 8 },
            { header: "Unrestricted Qty (counted)", width: 24, total: true },
            { header: "Quality Inspection Qty", width: 21 },
            { header: "Blocked Qty", width: 13 },
            { header: "Stock Date", width: 17 },
          ],
          rows: visibleRows.flatMap((r) => r.stock_breakup.map((l) => [
            r.plant, r.child_part_no, r.child_part_desc || "", l.storage_location || "", l.uom || "",
            l.unrestricted_qty, l.quality_inspection_qty, l.blocked_qty,
            l.stock_date ? stockAsOfLabel(l.stock_date) : "",
          ])).map((line, i) => [i + 1, ...line]),
          totalLabel: "TOTAL",
        }],
        cellStyle: (value, rowIdx, c) => {
          if (c === STATUS_COL) {
            const st = STATUS_META[rows[rowIdx] && visibleRows[rowIdx].status];
            return st ? { s: { font: { bold: true, color: { rgb: st.text === "#fff" ? "FFFFFF" : "1A2233" } }, fill: { fgColor: { rgb: st.color.slice(1).toUpperCase() } }, alignment: { horizontal: "center" } } } : null;
          }
          if (c >= DAY_FROM) {
            const fill = Number(value) || 0;
            const st = STATUS_META[visibleRows[rowIdx] && visibleRows[rowIdx].status] || STATUS_META.G;
            const solid = st.color.slice(1).toUpperCase();
            const light = { R: "F2B8B8", Y: "FBE3A0", G: "B7DDB9" }[st.letter] || "B7DDB9";
            if (fill >= 1) return { z: "0%", s: { fill: { fgColor: { rgb: solid } }, font: { color: { rgb: st.text === "#fff" ? "FFFFFF" : "1A2233" } }, alignment: { horizontal: "center" } } };
            if (fill > 0) return { z: "0%", s: { fill: { fgColor: { rgb: light } }, alignment: { horizontal: "center" } } };
            return { z: "0%", s: { fill: { fgColor: { rgb: "E9ECF1" } }, font: { color: { rgb: "B6BAC3" } }, alignment: { horizontal: "center" } } };
          }
          return null;
        },
      });
      toast.success("Excel downloaded successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Excel file.");
    }
  };

  const activeFilterCount = [vendorFilter, buyerFilter, lineFilter, valuationFilter].filter((v) => v !== "All").length;
  const clearFilters = () => { setVendorFilter("All"); setBuyerFilter("All"); setLineFilter("All"); setValuationFilter("All"); };

  // keep the header the same width as the body: leave room for the body scrollbar (0 when there is none)
  useLayoutEffect(() => {
    const el = bodyScrollRef.current;
    if (el) setScrollbarW(el.offsetWidth - el.clientWidth);
  }, [visibleRows, loading]);

  // the plant is only shown on a row when more than one plant is on the screen
  const multiPlant = useMemo(() => new Set(rows.map((r) => r.plant)).size > 1, [rows]);

  const counts = useMemo(() => {
    const c = { R: 0, G: 0, Y: 0 };
    visibleRows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [visibleRows]);

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
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: loaded ? 0.25 : 1.5 }}>
        Child Part Coverage
      </Typography>
      {loaded && (
        <Typography sx={{ fontSize: 11, color: "#8a93a3", lineHeight: 1.4, mb: 1.5 }}>
          Plan: {monthLabel(meta.month)} (MP) / 26 days{meta.stock_as_of ? ` | MB52 stock as of ${stockAsOfLabel(meta.stock_as_of)}` : " | no MB52 stock found"}
        </Typography>
      )}

      {/* Filters */}
      <div
        style={{
          backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px", marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
        }}
      >
        <FilterSelect
          label="Plant"
          value={plantSelect}
          options={plants.map(myPlantLabel)}
          onChange={setPlantSelect}
          minWidth={190}
        />
        <TextField
          size="small"
          type="month"
          label="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: "2000-01", max: "2099-12" }}
          sx={compactFieldSx(150)}
        />
        <Button
          onClick={() => fetchData(plantSelect)}
          disabled={loading}
          variant="contained"
          disableElevation
          startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 16 }} />}
          sx={primaryButtonSx}
        >
          {loading ? "Loading..." : "Search"}
        </Button>
        <TextField
          size="small"
          placeholder="Search part number / description"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(240)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen((o) => !o)} activeCount={activeFilterCount} />
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", textAlign: "right", lineHeight: 1.4 }}>
          {loaded && (
            <>
              {visibleRows.length === rows.length ? `${rows.length} child parts` : `${visibleRows.length} of ${rows.length} child parts`}
            </>
          )}
        </span>
        <InfoTip label="Status legend">
      <b style={{ color: "#1a2233", fontSize: 12 }}>Status</b>
      {["R", "G", "Y"].map((k) => (
        <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", backgroundColor: STATUS_META[k].color, color: STATUS_META[k].text, fontSize: 10, fontWeight: 700 }}>{k}</span>
          <span><b>{STATUS_META[k].name}</b> {STATUS_META[k].rule}{loaded && <span style={{ color: "#8a93a3" }}> ({counts[k] || 0})</span>}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: "none", display: "inline-flex", gap: 2 }}>
          {["R", "Y", "G"].map((k) => <span key={k} style={{ width: 10, height: 12, backgroundColor: STATUS_META[k].color, borderRadius: 2 }} />)}
        </span>
        <span>each block = 1 day of stock coverage (a part block = part of a day); its colour is the row's status: red R, yellow Y, green G</span>
      </div>
        </InfoTip>

        <FilterPanel
          open={filtersOpen}
          activeCount={activeFilterCount}
          onClear={clearFilters}
          actions={(
            <Button
              onClick={handleExportExcel}
              disabled={loading || visibleRows.length === 0}
              variant="contained"
              disableElevation
              startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{ ...primaryButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
              title="Download the table as shown (Vendor / Buyer / search applied) as Excel"
            >
              Export Excel
            </Button>
          )}
        >
          <FilterSelect label="Vendor" value={vendorFilter} options={vendorOptions} onChange={setVendorFilter} minWidth={220} />
          <FilterSelect label="Buyer" value={buyerFilter} options={buyerOptions} onChange={setBuyerFilter} minWidth={170} />
          <FilterSelect label="Line" value={lineFilter} options={lineOptions} onChange={setLineFilter} minWidth={170} />
          <FilterSelect label="Valuation Type" value={valuationFilter} options={valuationOptions} onChange={setValuationFilter} minWidth={170} />
        </FilterPanel>
      </div>

      {/* Table: the header sits above the scrolling body, so the vertical scrollbar starts below the header */}
      <div
        style={{
          flexGrow: 1, minHeight: 0, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)", overflow: "hidden", display: "flex", flexDirection: "column",
        }}
      >
        <div ref={headScrollRef} style={{ overflow: "hidden", flex: "none", paddingRight: scrollbarW, backgroundColor: "#cfdaf5" }}>
          <table style={TABLE_STYLE}>
          <colgroup>
            <col style={{ width: COL_W.si }} />
            <col />
            <col style={{ width: COL_W.plan }} />
            <col style={{ width: COL_W.perDay }} />
            <col style={{ width: COL_W.safety }} />
            <col style={{ width: COL_W.max }} />
            <col style={{ width: COL_W.stock }} />
            <col style={{ width: COL_W.status }} />
            <col style={{ width: COL_W.days }} />
            {Array.from({ length: DAY_CELLS }, (_, i) => <col key={i} style={{ width: COL_W.cell }} />)}
          </colgroup>
          <thead>
            <tr>
              <Head rowSpan={2} tip="Serial number of the row in the list" style={{ ...headBase, top: 0 }}>SI</Head>
              <Head rowSpan={2} tip="Child part (BOM component) of the FG parts, ROH used with any valuation type, HALB used with any valuation type except INHOUSE" style={{ ...headBase, top: 0, textAlign: "left" }}>Part Number / Description</Head>
              <Head rowSpan={2} tip="Plan = sum of (FG monthly MP plan x BOM qty) of every FG that uses this child part, current month" style={{ ...headBase, top: 0 }}>Plan</Head>
              <Head rowSpan={2} tip="Demand per Day = Plan / 26" style={{ ...headBase, top: 0 }}>Demand / Day</Head>
              <Head rowSpan={2} tip="Safety Stock from the Material Master" style={{ ...headBase, top: 0 }}>Safety Stock</Head>
              <Head rowSpan={2} tip="Maximum Stock from the Material Master" style={{ ...headBase, top: 0 }}>Max Stock</Head>
              <Head rowSpan={2} tip="Current Stock = unrestricted stock of the latest MB52 (Plant Stock) snapshot" style={{ ...headBase, top: 0 }}>Current Stock</Head>
              <Head rowSpan={2} tip="R = stock below Safety Stock | G = coverage over 3 days and stock above Safety Stock | Y = any other case" style={{ ...headBase, top: 0 }}>Status</Head>
              <Head colSpan={DAY_CELLS + 1} tip="Coverage Days = Current Stock / Demand per Day. Each block = 1 day of stock, in the colour of the status (R red, Y yellow, G green)" style={{ ...headBase, top: 0, height: HEAD_H, borderLeft: "1px solid #b9c8ec" }}>Coverage Days</Head>
            </tr>
            <tr>
              <Head tip="Calculated coverage in days. '-' = no demand in the plan, so it cannot be calculated" style={{ ...headBase, top: HEAD_H, height: HEAD_H, borderLeft: "1px solid #b9c8ec" }}>Days</Head>
              {Array.from({ length: DAY_CELLS }, (_, i) => (
                <Head key={i} tip={`Day ${i + 1}`} style={{ ...headBase, top: HEAD_H, height: HEAD_H, padding: 0 }}>{i + 1}</Head>
              ))}
            </tr>
          </thead>
          </table>
        </div>
        <div
          ref={bodyScrollRef}
          onScroll={(e) => { if (headScrollRef.current) headScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; }}
          style={{ flexGrow: 1, minHeight: 0, overflowX: "hidden", overflowY: "auto" }}
        >
          <table style={TABLE_STYLE}>
          <colgroup>
            <col style={{ width: COL_W.si }} />
            <col />
            <col style={{ width: COL_W.plan }} />
            <col style={{ width: COL_W.perDay }} />
            <col style={{ width: COL_W.safety }} />
            <col style={{ width: COL_W.max }} />
            <col style={{ width: COL_W.stock }} />
            <col style={{ width: COL_W.status }} />
            <col style={{ width: COL_W.days }} />
            {Array.from({ length: DAY_CELLS }, (_, i) => <col key={i} style={{ width: COL_W.cell }} />)}
          </colgroup>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9 + DAY_CELLS} style={{ textAlign: "center", padding: "28px 0" }}>
                  <CircularProgress size={20} />
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={9 + DAY_CELLS} style={{ textAlign: "center", padding: "28px 0", color: "#9aa3b2", fontSize: 12 }}>
                  {loaded ? "No child parts found for the selected filters." : "Select a plant and press Search."}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, idx) => {
                const fills = coverageFills(row.coverage_days);
                const noDemand = row.coverage_days === null;
                const vendorLine = row.vendor_code
                  ? `${row.vendor_code} ${row.vendor_name || ""}${row.buyer_name ? `  |  Buyer: ${row.buyer_name}` : ""}${row.vendors.length > 1 ? `  (+${row.vendors.length - 1} more)` : ""}`
                  : "";
                const vendorTip = row.vendors.map((v) => `${vendorLabel(v)} - SOB ${fmtNum(v.sob)}%, lot ${fmtNum(v.lot_size, 3)}${v.buyer_name ? `, buyer ${buyerLabel(v)}` : ""}`).join("\n");
                return (
                  <tr key={`${row.plant}-${row.child_part}`} style={{ backgroundColor: idx % 2 ? "#fafbfc" : "#fff" }}>
                    <td style={{ ...cellBase, textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ ...cellBase, whiteSpace: "normal" }} title={`${row.child_part_no} - ${row.child_part_desc || ""}\nFGs using it: ${row.fg_count}${vendorTip ? `\n${vendorTip}` : ""}`}>
                      <div style={{ lineHeight: 1.3, overflow: "hidden" }}>
                        {/* part number, type and description on ONE line (the description takes the free width and is cut with "..." only when it really does not fit) */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap", overflow: "hidden" }}>
                          {multiPlant && <span style={{ color: "#6b7280", fontWeight: 600, fontSize: 11, flex: "none" }}>{row.plant}</span>}
                          <span style={{ color: "#0052cc", fontWeight: 700, fontSize: 11, flex: "none" }}>{row.child_part_no}</span>
                          <span style={{ color: "#8a93a3", fontWeight: 400, fontSize: 9.5, flex: "none" }}>{row.material_type}</span>
                          <span style={{ color: "#6b7280", fontSize: 10, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{row.child_part_desc}</span>
                        </div>
                        {vendorLine && (
                          <div style={{ color: "#9ca3af", fontSize: 9.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vendorLine}</div>
                        )}
                      </div>
                    </td>
                    <td style={num}>{fmtNum(row.plan_qty)}</td>
                    <td style={num} title={`Exact: ${fmtNum(row.demand_per_day)} per day`}>{fmtNum(row.demand_per_day, 0)}</td>
                    <td style={{ ...num, color: row.safety_stock === null ? "#b6bac3" : "#333" }}>{fmtNum(row.safety_stock)}</td>
                    <td style={{ ...num, color: row.max_stock === null ? "#b6bac3" : "#333" }}>{fmtNum(row.max_stock)}</td>
                    <td style={{ ...num, fontWeight: 700 }}>{fmtNum(row.current_stock)}</td>
                    <td style={{ ...cellBase, textAlign: "center" }}><StatusChip status={row.status} /></td>
                    <td
                      style={{ ...num, fontWeight: 700, color: noDemand ? "#b6bac3" : "#1a2233", borderLeft: "1px solid #eef0f3" }}
                      title={noDemand ? "No demand in the plan, so the coverage cannot be calculated" : `${fmtNum(row.coverage_days)} days of stock`}
                    >
                      {noDemand ? "–" : fmtNum(row.coverage_days, 1)}
                    </td>
                    {fills.map((fill, i) => (
                      <td key={i} style={{ padding: "5px 1px", borderBottom: "1px solid #eef0f3", boxSizing: "border-box" }}
                        title={noDemand ? "No demand" : `Day ${i + 1}: ${fill >= 1 ? "covered" : fill > 0 ? `${Math.round(fill * 100)}% covered` : "not covered"}`}>
                        {/* a light-grey box with a bar inside, in the colour of the row's status (R red / Y yellow / G green): full width = a whole day covered, part width = part of a day */}
                        <div style={{ height: 18, borderRadius: 2, backgroundColor: COVERAGE_EMPTY, overflow: "hidden" }}>
                          <div data-fill={coverageFillPercent(fill)} style={{ height: "100%", width: `${coverageFillPercent(fill)}%`, backgroundColor: (STATUS_META[row.status] || {}).color || COVERAGE_GREEN }} />
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RmCoverage;
