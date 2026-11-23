import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, CircularProgress, Collapse, MenuItem, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ApartmentIcon from "@mui/icons-material/Apartment";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import PillTabs from "../components/PillTabs";
import { compactFieldSx, compactButtonSx } from "../components/MfgListScreen";
import { getFreightSummary, getFreightRequests, getFreightRequestDetail } from "../controller/PremiumFreightApiService";
import { GRID_SX, RequestDrawer, STATUS_COLOR, STATUS_LABEL, fyName, inr, money, monthText, pill, todayFy } from "./shared";

// Premium Freight > Freight Request Report - the SUMMARY of the requests raised in the SFMS mobile app and on the web (read-only).
// Laid out like the PPC & MRPC list screens: heading, filter card (Financial Year, Plant, Submit | Excel), a caption and two tabs:
//   Monthly trend   April to March with the cumulative (the one-time opening actual first)
//   Plant-wise      monthly limit, opening actual, approved, in approval, FY total. Click a plant: its customers open below it;
//                   click a customer: its part numbers open below it (the requests of the plant are loaded once, grouped here).
// The full request list is on the Premium Freight Request screen. The amount that counts is the EXCESS (premium cost - standard cost).
// Approved = spent, Pending / Query = in approval, Rejected requests are left out. A user only sees the plants he may use
// (own plant + Data Access); the backend enforces it.

const card = { backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 3px rgba(16,24,40,0.05)", overflow: "hidden" };
const bold = (p) => <b style={{ width: "100%", textAlign: "right" }}>{inr(p.value)}</b>;

// ----- plant-wise table with the customer-wise and part-wise levels -----
const TH = { padding: "8px 10px", fontSize: 10.5, fontWeight: 700, color: "#000", backgroundColor: "#d0dcf5", position: "sticky", top: 0, zIndex: 2, whiteSpace: "nowrap" };
const SUB_TH = { padding: "6px 10px", fontSize: 9.5, fontWeight: 700, color: "#6b7280", letterSpacing: 0.4, textTransform: "uppercase", backgroundColor: "#f4f6fb", whiteSpace: "nowrap" };
const TD = { padding: "8px 10px", fontSize: 11, color: "#333", whiteSpace: "nowrap" };
const R = { textAlign: "right" };

const Chevron = ({ open, color = "#6b7280" }) => (
  <KeyboardArrowRightIcon sx={{ fontSize: 18, color, transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", verticalAlign: "middle" }} />
);
const Badge = ({ children, color = "#2e59d9", bg = "#eaf0ff" }) => (
  <span style={{ padding: "1px 7px", borderRadius: 5, backgroundColor: bg, color, fontSize: 10.5, fontWeight: 700, marginRight: 8 }}>{children}</span>
);
const dash = (v) => (Number(v) ? inr(v) : <span style={{ color: "#b0b6c1" }}>-</span>);

// total / approved / in approval per group of requests
const groupRequests = (rows, keyOf, nameOf) => {
  const map = new Map();
  rows.forEach((r) => {
    const key = keyOf(r);
    let g = map.get(key);
    if (!g) { g = { key, name: nameOf(r), requests: 0, qty: 0, approved: 0, in_approval: 0 }; map.set(key, g); }
    g.requests += 1;
    g.qty += Number(r.qty) || 0;
    if (r.status === "APPROVED") g.approved += Number(r.est_cost) || 0;
    else if (r.status === "PENDING" || r.status === "QUERY") g.in_approval += Number(r.est_cost) || 0;
  });
  return [...map.values()].map((g) => ({ ...g, total: g.approved + g.in_approval })).sort((a, b) => b.total - a.total);
};

// the numeric columns have the same width at every level (plant, customer, part, request), so the figures line up from top to bottom
const W_AMT = 125;
const W_REQ = 85;
const W_LAST = 110;
const FIXED = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" };
const STAGGER = (i) => ({ animationDelay: `${Math.min(i, 12) * 30}ms` });
const custKeyOf = (r) => String(r.customer_code || "-").trim() || "-";
const partKeyOf = (r) => String(r.part_no || "-").trim() || "-";

// Animations (rows fade in one after the other, the share bars grow, the panels slide open with MUI Collapse). Column lines are light like the
// MFG Daily Component Plan: thin row borders and a hover tint, and a divider only where a group of columns starts
// (plant table: limit | approved, in approval, total | requests; the lower levels: amounts | requests).
const REPORT_CSS = `
  @keyframes pfFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pfGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .pf-rowin { animation: pfFade .3s ease both; }
  .pf-grow { transform-origin: left center; animation: pfGrow .55s cubic-bezier(.2,.8,.2,1) both; animation-delay: .1s; }
  .pf-click { transition: background-color .15s ease; }
  .pf-click:focus-visible { outline: 2px solid #0066FF; outline-offset: -2px; }
  .pf-main > tbody > tr > td:nth-child(4), .pf-main > tbody > tr > td:nth-child(6), .pf-main > tbody > tr > td:nth-child(9) { border-left: 1px solid #e6eaf2; }
  .pf-main > thead > tr > th:nth-child(4), .pf-main > thead > tr > th:nth-child(6), .pf-main > thead > tr > th:nth-child(9) { border-left: 1px solid #b9c9ec; }
  .pf-cust td:nth-child(3), .pf-cust td:nth-child(6), .pf-cust th:nth-child(3), .pf-cust th:nth-child(6) { border-left: 1px solid #dde5f5; }
  .pf-part td:nth-child(3), .pf-part td:nth-child(6), .pf-part th:nth-child(3), .pf-part th:nth-child(6) { border-left: 1px solid #cfe9e6; }
  .pf-req td:nth-child(3), .pf-req td:nth-child(6), .pf-req th:nth-child(3), .pf-req th:nth-child(6) { border-left: 1px solid #e6dcf7; }
  .pf-main td.pf-tot, .pf-cust td.pf-tot, .pf-part td.pf-tot, .pf-req td.pf-tot { background-color: rgba(46, 89, 217, 0.05); }
  .pf-cust tbody tr.pf-click:hover, .pf-part tbody tr.pf-click:hover { background-color: #eaf1ff; }
  .pf-req tbody tr.pf-click:hover { background-color: #f1eafe; }
  @media (prefers-reduced-motion: reduce) { .pf-rowin, .pf-grow { animation: none; } }
`;

// Enter / Space open or close a row (like the MFG Daily Component Plan)
const rowKeys = (fn) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } };

// the requests of one part: request no (click for the detail and the approval timeline), month, modes, reason, amount, status
const RequestTable = ({ rows, onOpenRequest }) => (
  <div style={{ margin: "2px 0 8px 30px", padding: "8px 0 4px", borderLeft: "3px solid #7c3aed", backgroundColor: "#faf7ff" }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 4px 12px" }}>
      {`Requests · ${rows.length}`}
      <span style={{ textTransform: "none", fontWeight: 500, color: "#8a93a3", letterSpacing: 0 }}>  — click a request for its details and approval timeline</span>
    </div>
    <table className="pf-req" style={FIXED}>
      <colgroup><col style={{ width: 150 }} /><col /><col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_REQ }} /><col style={{ width: W_LAST }} /></colgroup>
      <thead>
        <tr>
          <th style={{ ...SUB_TH, textAlign: "left", paddingLeft: 12 }}>Request No</th>
          <th style={{ ...SUB_TH, textAlign: "left" }}>Month · Mode · Reason</th>
          <th style={{ ...SUB_TH, ...R }}>Approved (₹)</th>
          <th style={{ ...SUB_TH, ...R }}>In approval (₹)</th>
          <th style={{ ...SUB_TH, ...R }}>Excess (₹)</th>
          <th style={{ ...SUB_TH, ...R }}>Status</th>
          <th style={{ ...SUB_TH, ...R }}>Qty</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const text = `${monthText(r.budget_month)} · ${r.std_mode} → ${r.premium_mode}${r.reason ? ` · ${r.reason}` : ""}`;
          return (
            <tr
              key={r.id} className="pf-click pf-rowin" tabIndex={0} role="button" onClick={() => onOpenRequest(r)} onKeyDown={rowKeys(() => onOpenRequest(r))}
              style={{ borderTop: "1px solid #ece4fa", cursor: "pointer", ...STAGGER(i) }}
            >
              <td style={{ ...TD, paddingLeft: 12, fontWeight: 700, color: "#7c3aed" }}>{r.request_no}</td>
              <td style={{ ...TD, overflow: "hidden", textOverflow: "ellipsis", color: "#4b5563" }} title={text}>{text}</td>
              <td style={{ ...TD, ...R }}>{r.status === "APPROVED" ? inr(r.est_cost) : <span style={{ color: "#b0b6c1" }}>-</span>}</td>
              <td style={{ ...TD, ...R }}>{r.status === "PENDING" || r.status === "QUERY" ? inr(r.est_cost) : <span style={{ color: "#b0b6c1" }}>-</span>}</td>
              <td className="pf-tot" style={{ ...TD, ...R, fontWeight: 700, color: "#1a2233" }}>{inr(r.est_cost)}</td>
              <td style={{ ...TD, ...R, padding: "4px 6px" }}>{pill(STATUS_LABEL[r.status] || r.status, STATUS_COLOR[r.status] || "#6b7280")}</td>
              <td style={{ ...TD, ...R }}>{Number(r.qty).toLocaleString("en-IN")}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const PartTable = ({ plantCode, custKey, rows, openParts, onTogglePart, onOpenRequest }) => {
  const parts = groupRequests(rows, partKeyOf, (r) => r.part_desc || "");
  return (
    <div style={{ margin: "2px 0 8px 30px", padding: "8px 0 4px", borderLeft: "3px solid #0d9488", backgroundColor: "#f3fbfa" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#0d9488", letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 4px 12px" }}>
        {`Part-wise · ${parts.length} part${parts.length === 1 ? "" : "s"}`}
        <span style={{ textTransform: "none", fontWeight: 500, color: "#8a93a3", letterSpacing: 0 }}>  — click a part to see its requests</span>
      </div>
      <table className="pf-part" style={FIXED}>
        <colgroup><col style={{ width: 150 }} /><col /><col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_REQ }} /><col style={{ width: W_LAST }} /></colgroup>
        <thead>
          <tr>
            <th style={{ ...SUB_TH, textAlign: "left", paddingLeft: 12 }}>Part No</th>
            <th style={{ ...SUB_TH, textAlign: "left" }}>Description</th>
            <th style={{ ...SUB_TH, ...R }}>Approved (₹)</th>
            <th style={{ ...SUB_TH, ...R }}>In approval (₹)</th>
            <th style={{ ...SUB_TH, ...R }}>Total (₹)</th>
            <th style={{ ...SUB_TH, ...R }}>Requests</th>
            <th style={{ ...SUB_TH, ...R }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p, i) => {
            const key = `${plantCode}|${custKey}|${p.key}`;
            const open = openParts.has(key);
            const partRows = rows.filter((r) => partKeyOf(r) === p.key);
            return (
              <React.Fragment key={p.key}>
                <tr
                  className="pf-click pf-rowin" tabIndex={0} role="button" aria-expanded={open} onClick={() => onTogglePart(key)} onKeyDown={rowKeys(() => onTogglePart(key))}
                  style={{ borderTop: "1px solid #dcefed", cursor: "pointer", backgroundColor: open ? "#e6f6f4" : undefined, ...STAGGER(i) }}
                >
                  <td style={{ ...TD, paddingLeft: 6 }}><Chevron open={open} color="#0d9488" /><Badge color="#0d9488" bg="#e0f5f3">{p.key}</Badge></td>
                  <td style={{ ...TD, whiteSpace: "normal", color: "#4b5563" }}>{p.name || "-"}</td>
                  <td style={{ ...TD, ...R }}>{dash(p.approved)}</td>
                  <td style={{ ...TD, ...R }}>{dash(p.in_approval)}</td>
                  <td className="pf-tot" style={{ ...TD, ...R, fontWeight: 700, color: "#1a2233" }}>{inr(p.total)}</td>
                  <td style={{ ...TD, ...R }}>{p.requests}</td>
                  <td style={{ ...TD, ...R }}>{p.qty.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <Collapse in={open} timeout={220} mountOnEnter unmountOnExit><RequestTable rows={partRows} onOpenRequest={onOpenRequest} /></Collapse>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const CustomerTable = ({ plant, data, openCustomers, onToggleCustomer, openParts, onTogglePart, onOpenRequest, onRetry }) => {
  if (!data || data.loading) {
    return <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 4px", fontSize: 11.5, color: "#6b7280" }}><CircularProgress size={14} />Loading the customers of plant {plant.plant_code}...</div>;
  }
  if (data.error) {
    return (
      <div style={{ padding: "10px 4px", fontSize: 11.5, color: "#d32f2f" }}>
        {data.error} <Button size="small" onClick={onRetry} sx={{ fontSize: 11, textTransform: "none" }}>Retry</Button>
      </div>
    );
  }
  const customers = groupRequests(data.rows, custKeyOf, (r) => r.customer_name || r.customer_group || "-");
  if (!customers.length) return <div style={{ padding: "12px 4px", fontSize: 11.5, color: "#8a93a3" }}>No requests for this plant in this financial year.</div>;
  const maxTotal = Math.max(1, ...customers.map((c) => c.total));
  return (
    <div style={{ margin: "2px 0 8px 34px", padding: "10px 0 4px", borderLeft: "3px solid #2e59d9", backgroundColor: "#f7f9fe" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#2e59d9", letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 4px 12px" }}>
        {`Customer-wise · ${plant.plant_code} ${plant.plant_name || ""} · ${customers.length} customer${customers.length === 1 ? "" : "s"}`}
        <span style={{ textTransform: "none", fontWeight: 500, color: "#8a93a3", letterSpacing: 0 }}>  — click a customer to see its part numbers</span>
      </div>
      <table className="pf-cust" style={FIXED}>
        <colgroup><col style={{ width: 34 }} /><col /><col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_REQ }} /><col style={{ width: W_LAST }} /></colgroup>
        <thead>
          <tr>
            <th style={SUB_TH} />
            <th style={{ ...SUB_TH, textAlign: "left" }}>Customer</th>
            <th style={{ ...SUB_TH, ...R }}>Approved (₹)</th>
            <th style={{ ...SUB_TH, ...R }}>In approval (₹)</th>
            <th style={{ ...SUB_TH, ...R }}>Total (₹)</th>
            <th style={{ ...SUB_TH, ...R }}>Requests</th>
            <th style={{ ...SUB_TH, textAlign: "left" }}>Share</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, i) => {
            const open = openCustomers.has(`${plant.plant_code}|${c.key}`);
            const custRows = data.rows.filter((r) => custKeyOf(r) === c.key);
            return (
              <React.Fragment key={c.key}>
                <tr
                  className="pf-click pf-rowin" tabIndex={0} role="button" aria-expanded={open}
                  onClick={() => onToggleCustomer(plant.plant_code, c.key)} onKeyDown={rowKeys(() => onToggleCustomer(plant.plant_code, c.key))}
                  style={{ borderTop: "1px solid #e6ebf5", cursor: "pointer", backgroundColor: open ? "#eaf1ff" : undefined, ...STAGGER(i) }}
                >
                  <td style={{ ...TD, padding: "7px 4px 7px 10px" }}><Chevron open={open} color="#2e59d9" /></td>
                  <td style={{ ...TD, whiteSpace: "normal" }}><Badge>{c.key}</Badge><span style={{ fontWeight: 600, color: "#1a2233" }}>{c.name}</span></td>
                  <td style={{ ...TD, ...R }}>{dash(c.approved)}</td>
                  <td style={{ ...TD, ...R }}>{dash(c.in_approval)}</td>
                  <td className="pf-tot" style={{ ...TD, ...R, fontWeight: 700, color: "#1a2233" }}>{inr(c.total)}</td>
                  <td style={{ ...TD, ...R }}>{c.requests}</td>
                  <td style={TD}>
                    <div style={{ display: "flex", height: 7, borderRadius: 4, backgroundColor: "#e4e8f0", overflow: "hidden" }}>
                      <div className="pf-grow" style={{ width: `${(c.approved / maxTotal) * 100}%`, backgroundColor: "#d81b60" }} />
                      <div className="pf-grow" style={{ width: `${(c.in_approval / maxTotal) * 100}%`, backgroundColor: "#f59e0b" }} />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <Collapse in={open} timeout={240} mountOnEnter unmountOnExit>
                      <PartTable plantCode={plant.plant_code} custKey={c.key} rows={custRows} openParts={openParts} onTogglePart={onTogglePart} onOpenRequest={onOpenRequest} />
                    </Collapse>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PlantTable = ({ rows, loading, loaded, loadError, openPlants, plantData, openCustomers, onTogglePlant, onToggleCustomer, openParts, onTogglePart, onOpenRequest, onRetryPlant }) => {
  if (!rows.length) {
    return <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "#8a93a3" }}>{loading ? "Loading..." : loadError ? "Could not load data." : loaded ? "No plants found." : ""}</div>;
  }
  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <table className="pf-main" style={{ ...FIXED, minWidth: 1000 }}>
        <colgroup>
          <col style={{ width: 34 }} /><col style={{ width: 76 }} /><col /><col style={{ width: 135 }} /><col style={{ width: 140 }} />
          <col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_AMT }} /><col style={{ width: W_REQ }} /><col style={{ width: W_LAST }} />
        </colgroup>
        <thead>
          <tr>
            <th style={TH} />
            <th style={{ ...TH, textAlign: "left" }}>Plant</th>
            <th style={{ ...TH, textAlign: "left" }}>Plant Name</th>
            <th style={{ ...TH, ...R }}>Monthly Limit (₹)</th>
            <th style={{ ...TH, ...R }}>Opening Actual (₹)</th>
            <th style={{ ...TH, ...R }}>Approved (₹)</th>
            <th style={{ ...TH, ...R }}>In Approval (₹)</th>
            <th style={{ ...TH, ...R }}>FY Total (₹)</th>
            <th style={{ ...TH, ...R }}>Requests</th>
            <th style={{ ...TH, ...R }}>Rejected</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const open = openPlants.has(p.plant_code);
            return (
              <React.Fragment key={p.plant_code}>
                <tr
                  className="pf-click pf-rowin" tabIndex={0} role="button" aria-expanded={open}
                  onClick={() => onTogglePlant(p.plant_code)} onKeyDown={rowKeys(() => onTogglePlant(p.plant_code))}
                  style={{ borderTop: "1px solid #eceff4", cursor: "pointer", backgroundColor: open ? "#eef4ff" : "#fff", boxShadow: open ? "inset 3px 0 0 #2e59d9" : "none", ...STAGGER(i) }}
                  onMouseEnter={(e) => { if (!open) e.currentTarget.style.backgroundColor = "#f5f8ff"; }}
                  onMouseLeave={(e) => { if (!open) e.currentTarget.style.backgroundColor = "#fff"; }}
                >
                  <td style={{ ...TD, padding: "8px 4px 8px 10px" }}><Chevron open={open} color="#2e59d9" /></td>
                  <td style={TD}><b>{p.plant_code}</b></td>
                  <td style={{ ...TD, fontWeight: 600, color: "#1a2233" }}>{p.plant_name}</td>
                  <td style={{ ...TD, ...R }}>{p.monthly_limit === null ? <span style={{ color: "#d32f2f" }}>Not set</span> : inr(p.monthly_limit)}</td>
                  <td style={{ ...TD, ...R }}>{dash(p.opening)}</td>
                  <td style={{ ...TD, ...R, fontWeight: 700 }}>{inr(p.approved)}</td>
                  <td style={{ ...TD, ...R }}>{dash(p.in_approval)}</td>
                  <td className="pf-tot" style={{ ...TD, ...R, fontWeight: 700 }}>{inr(p.total)}</td>
                  <td style={{ ...TD, ...R }}>{p.requests}</td>
                  <td style={{ ...TD, ...R }}>{p.rejected_count ? p.rejected_count : ""}</td>
                </tr>
                <tr>
                  <td colSpan={10} style={{ padding: 0, backgroundColor: "#fff" }}>
                    <Collapse in={open} timeout={260} mountOnEnter unmountOnExit>
                      <CustomerTable
                        plant={p} data={plantData[p.plant_code]} openCustomers={openCustomers} onToggleCustomer={onToggleCustomer}
                        openParts={openParts} onTogglePart={onTogglePart} onOpenRequest={onOpenRequest} onRetry={() => onRetryPlant(p.plant_code)}
                      />
                    </Collapse>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Report = () => {
  const [fyPick, setFyPick] = useState(todayFy());
  const [plantPick, setPlantPick] = useState("ALL");
  const [applied, setApplied] = useState({ fy: todayFy(), plant: "ALL" });

  const [tab, setTab] = useState(0); // 0 monthly trend, 1 plant-wise
  const [plants, setPlants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [openPlants, setOpenPlants] = useState(() => new Set()); // plants whose customers are shown
  const [openCustomers, setOpenCustomers] = useState(() => new Set()); // "plant|customer" whose part numbers are shown
  const [openParts, setOpenParts] = useState(() => new Set()); // "plant|customer|part" whose requests are shown
  const [detail, setDetail] = useState(null); // one request with its timeline
  const [plantData, setPlantData] = useState({}); // { plant_code: { loading, error, rows } } the requests of the plant (loaded once)

  const fyOptions = useMemo(() => {
    const now = todayFy();
    return [now + 1, now, now - 1, now - 2];
  }, []);

  const load = async (f) => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getFreightSummary({ fy: f.fy, plant_code: f.plant === "ALL" ? "" : f.plant });
      setSummary(data && data.success ? data : null);
      if (Array.isArray(data?.plants) && data.plants.length) setPlants(data.plants);
      setApplied(f);
      setOpenPlants(new Set());
      setOpenCustomers(new Set());
      setOpenParts(new Set());
      setPlantData({});
    } catch (error) {
      console.error("Failed to load the freight request summary.", error);
      setSummary(null);
      setLoadError(error?.response?.data?.message || "Could not load the report. Please try again.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    load(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => load({ fy: fyPick, plant: plantPick });

  // the requests of one plant of the financial year (rejected ones are left out, like the totals)
  const fetchPlant = async (code) => {
    setPlantData((d) => ({ ...d, [code]: { loading: true, rows: [] } }));
    try {
      const data = await getFreightRequests({ fy: applied.fy, plant_code: code, hide_rejected: 1 });
      const list = Array.isArray(data?.rows) ? data.rows : [];
      setPlantData((d) => ({ ...d, [code]: { loading: false, rows: list } }));
      return list;
    } catch (error) {
      console.error("Failed to load the requests of the plant.", error);
      setPlantData((d) => ({ ...d, [code]: { loading: false, rows: [], error: error?.response?.data?.message || "Could not load the customers." } }));
      return [];
    }
  };
  const togglePlant = (code) => {
    const opening = !openPlants.has(code);
    setOpenPlants((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
    if (opening && !plantData[code]) fetchPlant(code);
  };
  const toggleCustomer = (plantCode, customerKey) => {
    const key = `${plantCode}|${customerKey}`;
    setOpenCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const togglePart = (key) => {
    setOpenParts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const openDetail = async (row) => {
    setDetail({ row, loading: true });
    try {
      const data = await getFreightRequestDetail(row.id);
      setDetail({ row, loading: false, data });
    } catch (error) {
      console.error("Failed to load the request.", error);
      setDetail({ row, loading: false, error: error?.response?.data?.message || "Could not load the request." });
    }
  };

  // ----- monthly trend with the cumulative -----
  const opening = Number(summary?.opening || 0);
  const trendRows = useMemo(() => {
    if (!summary) return [];
    const list = [];
    let run = opening;
    if (opening > 0) list.push({ id: "open", label: "Opening actual", requests: null, approved: opening, in_approval: 0, cumulative: opening, isOpening: true });
    summary.months.forEach((m) => {
      run += Number(m.approved);
      list.push({ id: m.month, label: monthText(m.month), requests: m.requests, approved: Number(m.approved), in_approval: Number(m.in_approval), cumulative: run });
    });
    return list;
  }, [summary, opening]);
  const maxBar = Math.max(1, ...trendRows.map((r) => r.approved + r.in_approval));

  const trendColumns = [
    { field: "label", headerName: "Month", width: 130, sortable: false },
    { field: "requests", headerName: "Requests", width: 90, align: "right", headerAlign: "right", sortable: false, renderCell: (p) => (p.value === null ? "" : p.value) },
    { field: "approved", headerName: "Approved (₹)", width: 130, align: "right", headerAlign: "right", sortable: false, renderCell: money },
    { field: "in_approval", headerName: "In Approval (₹)", width: 130, align: "right", headerAlign: "right", sortable: false, renderCell: (p) => (p.value ? inr(p.value) : "") },
    { field: "cumulative", headerName: "Cumulative (₹)", width: 140, align: "right", headerAlign: "right", sortable: false, renderCell: bold },
    {
      field: "bar", headerName: "Trend", flex: 1, minWidth: 180, sortable: false,
      renderCell: (p) => (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: 420, display: "flex", height: 8, borderRadius: 4, backgroundColor: "#eef0f3", overflow: "hidden" }}>
            <div style={{ width: `${(p.row.approved / maxBar) * 100}%`, backgroundColor: p.row.isOpening ? "#9aa5b8" : "#2e7d32" }} />
            <div style={{ width: `${(p.row.in_approval / maxBar) * 100}%`, backgroundColor: "#ed6c02" }} />
          </div>
        </div>
      ),
    },
  ];

  // ----- plant-wise -----
  const plantRows = useMemo(() => (summary?.byPlant || []).map((p) => ({ ...p, id: p.plant_code, total: Number(p.opening) + Number(p.approved), requests: p.approved_count + p.pending_count })), [summary]);

  // customer-wise of the whole selection (only used for the Excel sheet)
  const customerRows = useMemo(() => (summary?.customers || []).map((c) => ({ ...c, id: c.customer_code, total: Number(c.approved) + Number(c.in_approval) })), [summary]);

  const totals = useMemo(() => ({
    approved: trendRows.filter((r) => !r.isOpening).reduce((t, r) => t + r.approved, 0),
    inApproval: trendRows.reduce((t, r) => t + r.in_approval, 0),
    requests: trendRows.reduce((t, r) => t + (r.requests || 0), 0),
  }), [trendRows]);

  const plantText = applied.plant === "ALL" ? "All plants" : `Plant ${applied.plant}`;
  const caption = loaded && !loadError && summary
    ? `${fyName(applied.fy)} · ${plantText} · ${totals.requests} requests · Approved ₹ ${inr(totals.approved)}${opening > 0 ? ` + opening actual ₹ ${inr(opening)}` : ""} · In approval ₹ ${inr(totals.inApproval)}`
    : null;

  // ----- Excel: one sheet per table -----
  const handleDownloadExcel = () => {
    if (!summary) { toast.warning("No data to download."); return; }
    const sheet = (rowsOut, cols, widths) => {
      const ws = XLSX.utils.json_to_sheet(rowsOut, { header: cols });
      ws["!cols"] = widths.map((wch) => ({ wch }));
      cols.forEach((_, i) => {
        const cell = ws[XLSX.utils.encode_cell({ c: i, r: 0 })];
        if (cell) cell.s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
      });
      return ws;
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet(
      trendRows.map((r) => ({ "Month": r.label, "Requests": r.requests ?? "", "Approved": r.approved, "In Approval": r.in_approval, "Cumulative": r.cumulative })),
      ["Month", "Requests", "Approved", "In Approval", "Cumulative"], [16, 10, 16, 16, 16]), "Monthly Trend");
    XLSX.utils.book_append_sheet(wb, sheet(
      plantRows.map((r) => ({ "Plant": r.plant_code, "Plant Name": r.plant_name, "Monthly Limit": r.monthly_limit ?? "Not set", "Opening Actual": r.opening, "Approved": r.approved, "In Approval": r.in_approval, "FY Total": r.total, "Requests": r.requests, "Rejected": r.rejected_count })),
      ["Plant", "Plant Name", "Monthly Limit", "Opening Actual", "Approved", "In Approval", "FY Total", "Requests", "Rejected"], [8, 26, 16, 16, 16, 16, 16, 10, 10]), "Plant-wise");
    XLSX.utils.book_append_sheet(wb, sheet(
      customerRows.map((r) => ({ "Customer Code": r.customer_code, "Customer Name": r.customer_name, "Requests": r.requests, "Approved": r.approved, "In Approval": r.in_approval, "Total": r.total })),
      ["Customer Code", "Customer Name", "Requests", "Approved", "In Approval", "Total"], [16, 30, 10, 16, 16, 16]), "Customer-wise");
    XLSX.writeFile(wb, `Premium_Freight_Summary_${fyName(applied.fy).replace(/\s/g, "_")}.xlsx`);
  };

  return (
    <div
      style={{
        padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px",
        display: "flex", flexDirection: "column", height: "calc(100vh - 90px)",
      }}
    >
      <style>{REPORT_CSS}</style>
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SectionHeading>Freight Request Report</SectionHeading>
        <PillTabs
          tabs={[
            { key: "monthly", label: "Monthly Trend", Icon: CalendarMonthIcon },
            { key: "plant", label: "Plant-wise", Icon: ApartmentIcon },
          ]}
          value={tab}
          onChange={setTab}
          counts={{ monthly: trendRows.filter((r) => !r.isOpening && (r.requests || r.approved || r.in_approval)).length, plant: plantRows.length }}
        />
      </div>

      <div
        style={{
          backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)", padding: "7px 10px", marginBottom: 12,
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField select size="small" label="Financial Year" value={fyPick} onChange={(e) => setFyPick(Number(e.target.value))} sx={compactFieldSx(130)} disabled={loading}>
            {fyOptions.map((y) => (<MenuItem key={y} value={y} sx={{ fontSize: 11.5 }}>{fyName(y)}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Plant" value={plantPick} onChange={(e) => setPlantPick(e.target.value)} sx={compactFieldSx(190)} disabled={loading}>
            <MenuItem sx={{ fontSize: 11.5, fontWeight: 600 }} value="ALL">All Plants</MenuItem>
            {plants.map((p) => (<MenuItem key={p.Plant_Code} sx={{ fontSize: 11.5 }} value={p.Plant_Code}>{`${p.Plant_Code} - ${p.Plant_Name}`}</MenuItem>))}
          </TextField>
          <Button
            variant="contained" disableElevation onClick={handleSubmit} disabled={loading}
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Submit"}
          </Button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Button
            variant="contained" disableElevation onClick={handleDownloadExcel} disabled={loading || !summary}
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
            title="Download the summary as Excel (one sheet per table)"
          >
            Excel Download
          </Button>
        </div>
      </div>

      {caption && (
        <Typography sx={{ fontSize: 11, color: "#6b7280", mb: 1, ml: 0.5 }}>
          {caption}
          <span style={{ color: "#8a93a3" }}>
            {tab === 0
              ? " — Green = approved, orange = in approval. The cumulative starts with the opening actual, if any."
              : " — Click a plant to see its customers, then a customer to see its part numbers. Rejected requests are left out."}
          </span>
        </Typography>
      )}

      {loadError && (
        <Alert
          severity="error" sx={{ mb: 1.5, fontSize: 12, py: 0 }}
          action={<Button color="inherit" size="small" onClick={() => load(applied)} sx={{ fontSize: 11, textTransform: "none" }}>Retry</Button>}
        >
          {loadError}
        </Alert>
      )}

      <div style={{ ...card, flexGrow: 1, minHeight: 0 }}>
        {tab === 0 && (
          <DataGrid
            rows={trendRows} columns={trendColumns} getRowId={(r) => r.id} loading={loading} hideFooter disableRowSelectionOnClick disableColumnMenu
            columnHeaderHeight={36} rowHeight={38} localeText={{ noRowsLabel: loadError ? "Could not load data." : loaded ? "No data for this financial year." : "" }}
            sx={{ height: "100%", ...GRID_SX }}
          />
        )}
        {tab === 1 && (
          <PlantTable
            rows={plantRows} loading={loading} loaded={loaded} loadError={loadError}
            openPlants={openPlants} plantData={plantData} openCustomers={openCustomers}
            onTogglePlant={togglePlant} onToggleCustomer={toggleCustomer}
            openParts={openParts} onTogglePart={togglePart} onOpenRequest={openDetail} onRetryPlant={fetchPlant}
          />
        )}
      </div>
      <RequestDrawer detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
};

export default Report;
