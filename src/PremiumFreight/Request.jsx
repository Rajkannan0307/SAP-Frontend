import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Button, CircularProgress, Dialog, IconButton, MenuItem, TextField, Typography, createFilterOptions } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import { compactFieldSx, compactButtonSx } from "../components/MfgListScreen";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import {
  getFreightRequests, getFreightRequestDetail, getFreightCustomers, getFreightCustomerParts, getFreightFySpend,
  getFreightStdRates, checkFreightLimit, createFreightRequest, updateFreightRequest, getPfReasons, getPfCategoryUsers, getFreightRoute,
} from "../controller/PremiumFreightApiService";
import { COMPLETION_COLOR, GRID_SX, RequestDrawer, STATUS_COLOR, STATUS_LABEL, ROUTE_TEXT, dateText, fyName, inr, monthText, pill, todayFy, whenText } from "./shared";

// Premium Freight > Freight Request.
// The web only STARTS a request: it is saved as Pending at L1 (the users of the category's role chosen on the form get the in-app alert and the mail), then Plant Head -> CFIN Head -> Business Head.
// Approve / query / reject, the CFIN Head and Business Head steps and the reply to a query are done in the SFMS mobile app.
// The list shows every request of the plants the user may use (Financial Year / Plant / Status filters, "Only my requests" to see just his own);
// click a row for the detail and the approval timeline (read-only).
// The form follows the mobile "New Premium Freight Request": plant, customer code (Sales database; its group comes with it), part number
// (parts sold to that customer), quantity, standard mode + cost (fixed by the freight master when it has a rate), premium mode + total cost,
// reason, then "Check Limit & Submit" shows whether the request is within the plant's monthly approval limit and who will approve.

const STD_MODES = ["Road", "Sea"];
const PREMIUM_MODES = ["Premium Road", "Train", "Air"];
const MODE_COLOR = { Road: "#E08A00", Sea: "#0288D1", "Premium Road": "#E64A19", Train: "#2E7D32", Air: "#5E35B1" };
const SEARCH_KEYS = ["request_no", "plant_code", "customer_code", "customer_name", "part_no", "part_desc", "premium_mode", "reason_name", "reason", "action_plan", "recovery_plan", "responsibility"];
const COMPLETION_OPTIONS = ["In Progress", "Completed"];
const DIALOG_FIELD_SX = compactFieldSx("100%", 12);
const partFilter = createFilterOptions({ limit: 200 });
// compact dropdown of the customer / part lists (same size as the other screens)
const LIST_SX = {
  borderRadius: "8px", boxShadow: "0 10px 28px rgba(16,24,40,0.16)",
  "& .MuiAutocomplete-listbox": { fontSize: 12, maxHeight: 230, padding: "4px 0" },
  "& .MuiAutocomplete-option": { minHeight: 30, padding: "2px 12px", fontSize: 12 },
  "& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading": { fontSize: 12, padding: "8px 12px" },
};
const customerFilter = createFilterOptions({ limit: 100, stringify: (o) => `${o.code} ${o.name} ${o.city || ""} ${o.groupName || ""}` });

const todayYmd = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const num = (v) => Number(String(v ?? "").replace(/[^0-9.]/g, "")) || 0;
const round2 = (v) => Math.round(v * 100) / 100;

// Road / Sea / Premium Road / Train / Air as tappable chips; `locked` = fixed by the freight master
const ModeChoice = ({ label, items, value, onChange, locked, required }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 5 }}>{label}{required ? " *" : ""}{locked ? " (from the freight master)" : ""}</div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((i) => {
        const on = value === i;
        const c = MODE_COLOR[i];
        return (
          <button
            key={i} type="button" disabled={locked} onClick={() => onChange(i)}
            style={{
              padding: "5px 14px", borderRadius: 16, fontSize: 12, fontWeight: on ? 700 : 500, cursor: locked ? "not-allowed" : "pointer", fontFamily: "inherit",
              border: `${on ? 1.5 : 1}px solid ${on ? c : "#dde1e7"}`, backgroundColor: on ? `${c}1f` : "#fff", color: on ? c : "#333", opacity: locked && !on ? 0.35 : 1,
            }}
          >
            {i}
          </button>
        );
      })}
    </div>
  </div>
);

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
  </GridToolbarContainer>
);

// card with a title: the two columns of the new request dialog
const Card = ({ title, children }) => (
  <div style={{ border: "1px solid #e8eaee", borderRadius: 10, padding: "12px 14px", backgroundColor: "#fff" }}>
    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#2e59d9", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #f0f1f4" }}>{title}</div>
    {children}
  </div>
);
const SumLine = ({ label, value, strong }) => (
  <div style={{ display: "flex", gap: 10, padding: "3px 0", fontSize: 12 }}>
    <div style={{ width: 120, flexShrink: 0, color: "#6b7280" }}>{label}</div>
    <div style={{ flex: 1, color: "#1a2233", fontWeight: strong ? 700 : 500, wordBreak: "break-word" }}>{value === null || value === undefined || value === "" ? "-" : value}</div>
  </div>
);
const StepPill = ({ n, label, active, done }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px 4px 5px", borderRadius: 16, backgroundColor: active ? "#fff" : "rgba(255,255,255,0.16)", color: active ? "#2e59d9" : "#fff", fontSize: 11.5, fontWeight: 700 }}>
    <span style={{ width: 20, height: 20, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, backgroundColor: active ? "#2e59d9" : "rgba(255,255,255,0.3)", color: "#fff" }}>{done ? "✓" : n}</span>
    {label}
  </div>
);
const raisedByOf = (row) => row.raised_by_name || row.raised_by || "";

// ============================================================ New request dialog ============================================================
const NewRequestDialog = ({ open, onClose, onSubmitted }) => {
  const [plants, setPlants] = useState([]);
  const [plant, setPlant] = useState("");
  const [fySpend, setFySpend] = useState(null);

  const [customer, setCustomer] = useState(null); // { id, code, name, city, groupName }
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [parts, setParts] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [part, setPart] = useState(null); // { partNo, description }

  const [qty, setQty] = useState("");
  const [stdMode, setStdMode] = useState("Road");
  const [premMode, setPremMode] = useState("Air");
  const [stdCost, setStdCost] = useState("");
  const [premCost, setPremCost] = useState("");
  const [reason, setReason] = useState(""); // Reason Details (free text)
  const [reasonId, setReasonId] = useState(""); // Category (dropdown of the PF Reason master); the users of its role (in the plant) can get the mail
  const [reasonOptions, setReasonOptions] = useState([]);
  const [notifyUsers, setNotifyUsers] = useState([]); // users of the category's role in the plant
  const [approverId, setApproverId] = useState(""); // Emp_Id of the chosen approver (L1); empty until the requester selects one
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [routeLevels, setRouteLevels] = useState(null); // the people of each approval level (Limit check step)
  const [actionPlan, setActionPlan] = useState(""); // Action Plan (DB: Action_Plan)
  const [recoveryPlan, setRecoveryPlan] = useState(""); // Recovery / Alternative Savings Plan (DB: Recovery_Plan)
  const [targetDate, setTargetDate] = useState(""); // YYYY-MM-DD
  const [responsibility, setResponsibility] = useState("");

  // freight master: null = not asked yet, {} = nothing on record
  const [rates, setRates] = useState(null);
  const [masterMode, setMasterMode] = useState(null);

  const [errs, setErrs] = useState({});
  const [check, setCheck] = useState(null); // the approval limit check result -> second step
  const [busy, setBusy] = useState(false);

  const stdFromMaster = rates !== null && masterMode !== null;
  const hit = stdFromMaster ? rates[masterMode] || null : null;
  const stdValue = hit ? round2(hit.rate * num(qty)) : num(stdCost);
  const excess = round2(num(premCost) - stdValue);

  // reset when it opens; the plants the user may use (own plant first)
  useEffect(() => {
    if (!open) return;
    setPlant(""); setFySpend(null); setCustomer(null); setCustomerOptions([]); setParts([]); setPart(null);
    setQty(""); setStdMode("Road"); setPremMode("Air"); setStdCost(""); setPremCost(""); setReason(""); setReasonId(""); setActionPlan(""); setRecoveryPlan(""); setTargetDate(""); setResponsibility(""); setRates(null); setMasterMode(null);
    setErrs({}); setCheck(null); setBusy(false); setRouteLevels(null);
    getPfReasons(true)
      .then((r) => setReasonOptions(Array.isArray(r?.rows) ? r.rows : []))
      .catch(() => { setReasonOptions([]); toast.error("Could not load the categories. Please try again."); });
    getMyPlants()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setPlants(arr);
        const own = arr.find((p) => p.Is_Default) || (arr.length === 1 ? arr[0] : null);
        if (own) setPlant(own.Plant_Code);
      })
      .catch(() => setPlants([]));
  }, [open]);

  // the users of the chosen category's role in the plant (all ticked first; the requester can untick)
  useEffect(() => {
    if (!open || !reasonId || !plant) { setNotifyUsers([]); setApproverId(""); return undefined; }
    let live = true;
    setNotifyLoading(true);
    getPfCategoryUsers(reasonId, plant)
      .then((r) => { if (live) { const rows = Array.isArray(r?.rows) ? r.rows : []; setNotifyUsers(rows); setApproverId(""); } })
      .catch(() => { if (live) { setNotifyUsers([]); setApproverId(""); toast.error("Could not load the approvers. Please try again."); } })
      .finally(() => { if (live) setNotifyLoading(false); });
    return () => { live = false; };
  }, [open, reasonId, plant]);

  // the people of each level of the approval route, shown on the Limit check step
  useEffect(() => {
    if (!open || !check || !plant) { setRouteLevels(null); return undefined; }
    let live = true;
    getFreightRoute(plant, approverId)
      .then((r) => { if (live) setRouteLevels(r?.success && Array.isArray(r.levels) ? r.levels : []); })
      .catch(() => { if (live) setRouteLevels([]); });
    return () => { live = false; };
  }, [open, check, plant, approverId]);

  // premium freight of the plant in this financial year (information only)
  useEffect(() => {
    if (!open || !plant) { setFySpend(null); return undefined; }
    let live = true;
    getFreightFySpend(plant).then((r) => { if (live && r?.success) setFySpend(r); }).catch(() => { if (live) setFySpend(null); });
    return () => { live = false; };
  }, [open, plant]);

  // the customers of the selected plant (those with sales from it), or of every plant with the checkbox; the field filters them as the user types
  useEffect(() => {
    if (!open || !plant) { setCustomerOptions([]); return undefined; }
    let live = true;
    setCustomerLoading(true);
    setCustomer(null); setPart(null); setParts([]); setRates(null); setMasterMode(null);
    getFreightCustomers(plant, false)
      .then((r) => { if (live) setCustomerOptions(Array.isArray(r) ? r : []); })
      .catch(() => { if (live) { setCustomerOptions([]); toast.error("Could not load the customers. Please try again."); } })
      .finally(() => { if (live) setCustomerLoading(false); });
    return () => { live = false; };
  }, [open, plant]);

  // the parts sold to the chosen customer (from the selected plant, or from every plant with the checkbox)
  useEffect(() => {
    if (!open || !customer || !plant) return undefined;
    let live = true;
    setPartsLoading(true);
    getFreightCustomerParts(customer.id, plant, false)
      .then((r) => { if (live) setParts(Array.isArray(r) ? r : []); })
      .catch(() => { if (live) { setParts([]); toast.error("Could not load the parts. Please try again."); } })
      .finally(() => { if (live) setPartsLoading(false); });
    return () => { live = false; };
  }, [open, customer, plant]);

  // the freight master, whenever plant + customer + part are known
  useEffect(() => {
    if (!open || !plant || !customer || !part) return undefined;
    let live = true;
    getFreightStdRates(plant, customer.code, part.partNo)
      .then((r) => {
        if (!live) return;
        const m = r?.success ? r.rates || {} : {};
        const mode = r?.success ? r.standard || null : null; // decided by the server: the mode the master has a rate for
        setMasterMode(mode);
        if (mode) setStdMode(mode);
        setRates(m);
      })
      .catch(() => { if (live) { setMasterMode(null); setRates({}); } });
    return () => { live = false; };
  }, [open, plant, customer, part]);

  const pickCustomer = (c) => {
    setCustomer(c); setPart(null); setParts([]); setRates(null); setMasterMode(null);
    setErrs((e) => ({ ...e, customer: undefined, part: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!plant) e.plant = "Select the plant";
    if (!customer) e.customer = "Select the customer code";
    if (!part) e.part = "Select the part number";
    if (!(num(qty) > 0)) e.qty = "Enter the quantity";
    if (!stdFromMaster && !(num(stdCost) > 0)) e.stdCost = "Enter the standard mode cost";
    if (!(num(premCost) > 0)) e.premCost = "Enter the premium mode total freight cost";
    else if (stdValue > 0 && !(excess > 0)) e.premCost = "Must be higher than the standard mode cost";
    if (!reasonId) e.reasonId = "Select the category";
    else if (!notifyLoading && notifyUsers.length > 0 && !approverId) e.notify = "Select the approver";
    if (reason.trim().length < 3) e.reason = "Reason Details is mandatory";
    if (!actionPlan.trim()) e.actionPlan = "Enter the action plan";
    if (!recoveryPlan.trim()) e.recoveryPlan = "Enter the recovery / alternative savings plan";
    if (!targetDate) e.targetDate = "Select the target date";
    else if (targetDate < todayYmd()) e.targetDate = "Target date must be today or a future date";
    if (!responsibility.trim()) e.responsibility = "Enter the responsibility";
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const body = () => ({
    plant_code: plant, customerCode: customer?.code || "", partNo: part?.partNo || "", partDesc: part?.description || "", qty: num(qty),
    stdMode, stdCost: stdValue, premiumMode: premMode, premCost: num(premCost), reason: reason.trim(), reasonId: Number(reasonId) || 0, approverId: Number(approverId) || 0,
    actionPlan: actionPlan.trim(), recoveryPlan: recoveryPlan.trim(), targetDate, responsibility: responsibility.trim(),
  });

  const runCheck = async () => {
    if (!validate()) { toast.error("Please complete the fields marked in red"); return; }
    setBusy(true);
    try {
      const r = await checkFreightLimit(body());
      if (!r?.success) { toast.error(r?.message || "Could not check the approval limit"); return; }
      if (!r.hasBudget) { toast.error("No approval limit is set for this plant for this financial year. Ask Corp Finance."); return; }
      setCheck(r);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not check the approval limit");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const response = await createFreightRequest(body());
      if (response.data?.success) {
        toast.success(`Request ${response.data.requestNo} submitted`);
        onSubmitted();
        onClose();
      } else {
        toast.error(response.data?.message || "Could not submit the request");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not submit the request");
    } finally {
      setBusy(false);
    }
  };

  const err = (k) => (errs[k] ? <div style={{ fontSize: 10.5, color: "#d32f2f", margin: "-4px 0 8px 2px" }}>{errs[k]}</div> : null);
  const plantLabel = (() => { const p = plants.find((x) => x.Plant_Code === plant); return p ? myPlantLabel(p) : plant; })();
  const pct = check?.limit ? Math.min(100, Math.round((check.projected / check.limit) * 100)) : 0;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth={check ? "md" : "lg"} fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "linear-gradient(90deg, #2e59d9, #4f7cf0)", color: "#fff", flexWrap: "wrap" }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 21 }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700 }}>New Premium Freight Request</div>
          <div style={{ fontSize: 11, opacity: 0.88 }}>After you submit, the approver you chose (L1) is mailed, then the Plant Head approves in the SFMS mobile app.</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <StepPill n={1} label="Details" active={!check} done={Boolean(check)} />
          <StepPill n={2} label="Limit check" active={Boolean(check)} />
        </div>
        <IconButton size="small" onClick={onClose} disabled={busy} sx={{ color: "#fff" }}><CloseIcon sx={{ fontSize: 19 }} /></IconButton>
      </div>

      {check ? (
        <>
          <div style={{ padding: 20, backgroundColor: "#f7f8fb", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 16, maxHeight: "68vh", overflow: "auto" }}>
            <Card title="Request summary">
              <SumLine label="Plant" value={plantLabel} strong />
              <SumLine label="Customer" value={customer ? `${customer.code} - ${customer.name}` : ""} />
              <SumLine label="Part" value={part ? `${part.partNo}${part.description ? ` - ${part.description}` : ""}` : ""} />
              <SumLine label="Quantity" value={num(qty).toLocaleString("en-IN")} />
              <SumLine label="Standard" value={`${stdMode} · ₹ ${inr(stdValue)}`} />
              <SumLine label="Premium" value={`${premMode} · ₹ ${inr(num(premCost))}`} />
              <SumLine label="Excess" value={`₹ ${inr(excess)}`} strong />
              <SumLine label="Category" value={reasonOptions.find((o) => String(o.id) === String(reasonId))?.reason} />
              <SumLine label="Reason Details" value={reason.trim()} />
              <SumLine label="Action Plan" value={actionPlan.trim()} />
              <SumLine label="Recovery / Alternative Savings Plan" value={recoveryPlan.trim()} />
              <SumLine label="Target Date" value={dateText(targetDate)} />
              <SumLine label="Responsibility" value={responsibility.trim()} />
            </Card>
            <Card title="Approval limit check">
              <div style={{ padding: "9px 12px", borderRadius: 8, marginBottom: 10, backgroundColor: check.exceeds ? "#fff4e5" : "#e8f7ee", border: `1px solid ${check.exceeds ? "#ffd9a8" : "#bfe8cd"}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: check.exceeds ? "#b45309" : "#15803d" }}>{check.exceeds ? "Exceeds the monthly approval limit" : "Within the monthly approval limit"}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{`Plant ${plant} · ${monthText(check.month)}`}</div>
              </div>
              {[
                ["Monthly approval limit", `₹ ${inr(check.limit)}`],
                ["Approved this month", `₹ ${inr(check.spent)}`],
                ["Approval pending in-progress", `₹ ${inr(check.committed)}`],
                ["This request (excess)", `₹ ${inr(check.amount)}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}><span style={{ color: "#6b7280" }}>{k}</span><b>{v}</b></div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 3px", fontSize: 12.5, borderTop: "1px solid #f0f1f4", marginTop: 5 }}>
                <span style={{ color: "#6b7280" }}>After this request</span>
                <b style={{ color: check.exceeds ? "#b45309" : "#15803d" }}>{`₹ ${inr(check.projected)}${check.utilization !== null ? ` (${check.utilization}%)` : ""}`}</b>
              </div>
              <div style={{ height: 7, borderRadius: 4, backgroundColor: "#eef0f3", overflow: "hidden", marginTop: 4 }}>
                <div style={{ width: `${pct}%`, height: 7, backgroundColor: check.exceeds ? "#ed6c02" : "#2e7d32" }} />
              </div>
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, backgroundColor: "#f3f6fd", border: "1px solid #d0dcf5" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#2e59d9", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>Approval route</div>
                {routeLevels === null ? (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Loading...</div>
                ) : routeLevels.length === 0 ? (
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{check.exceeds ? ROUTE_TEXT.EXTENDED : ROUTE_TEXT.PH_ONLY}</div>
                ) : (
                  routeLevels.filter((l) => check.exceeds || l.level === "L1" || l.level === "PH").map((l, i) => (
                    <div key={l.level} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 0", borderTop: i ? "1px dashed #d0dcf5" : "none" }}>
                      <span style={{ minWidth: 92, fontSize: 11.5, fontWeight: 700, color: "#2e59d9" }}>{l.title}</span>
                      <span style={{ flex: 1, fontSize: 12, color: l.users.length ? "#1a2233" : "#b45309", fontWeight: 500 }}>
                        {l.users.length ? l.users.join(", ") : "No user found for this plant"}
                        {l.users.length > 1 && <span style={{ color: "#8a93a3", marginLeft: 6, fontSize: 11 }}>(any one)</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid #e8eaee" }}>
            <Button variant="outlined" disableElevation onClick={() => setCheck(null)} disabled={busy} sx={{ ...compactButtonSx, color: "#4b5563", borderColor: "#dde1e7" }}>Back to edit</Button>
            <Button
              variant="contained" disableElevation onClick={submit} disabled={busy}
              startIcon={busy ? <CircularProgress size={13} color="inherit" /> : null}
              sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
            >
              {busy ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="pf-form" style={{ padding: 20, backgroundColor: "#f7f8fb", maxHeight: "68vh", overflow: "auto" }}>
            <style>{`
              .pf-form { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
              .pf-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 22px; }
              .pf-two > div + div { border-left: 1px solid #eef0f4; padding-left: 22px; }
              .pf-sub { font-size: 10.5px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px; }
              @media (max-width: 1000px) { .pf-form { grid-template-columns: minmax(0, 1fr); } }
              @media (max-width: 700px) { .pf-two { grid-template-columns: minmax(0, 1fr); } .pf-two > div + div { border-left: none; padding-left: 0; margin-top: 8px; } }
            `}</style>
            <Card title="Request details">
              <div className="pf-two">
              <div>
              <div className="pf-sub">Customer, part &amp; category</div>
              <TextField select size="small" label="Plant *" value={plant} onChange={(e) => { setPlant(e.target.value); setErrs((x) => ({ ...x, plant: undefined })); setRates(null); setMasterMode(null); }} sx={{ ...DIALOG_FIELD_SX, mb: 2 }} error={Boolean(errs.plant)}>
                {plants.map((p) => (<MenuItem key={p.Plant_ID} value={p.Plant_Code} sx={{ fontSize: 11.5 }}>{myPlantLabel(p)}</MenuItem>))}
              </TextField>
              {err("plant")}
              {plant && fySpend && (
                <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, backgroundColor: "#eef4ff", border: "1px solid #d0dcf5" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#2e59d9", textTransform: "uppercase", letterSpacing: 0.3 }}>{`Premium freight, ${fyName(fySpend.fy)} to date`}</div>
                  <div style={{ display: "flex", gap: 24, marginTop: 3 }}>
                    <div><div style={{ fontSize: 14.5, fontWeight: 700, color: "#d81b60" }}>{`₹ ${inr(fySpend.spent)}`}</div><div style={{ fontSize: 10.5, color: "#6b7280" }}>Approved</div></div>
                    <div><div style={{ fontSize: 14.5, fontWeight: 700 }}>{`₹ ${inr(fySpend.committed)}`}</div><div style={{ fontSize: 10.5, color: "#6b7280" }}>In approval</div></div>
                  </div>
                  <div style={{ fontSize: 10, color: "#8a93a3", marginTop: 2 }}>For information only.</div>
                </div>
              )}

              <Autocomplete
                size="small" options={customerOptions} value={customer} loading={customerLoading} disabled={!plant} filterOptions={customerFilter} slotProps={{ paper: { sx: LIST_SX } }}
                onChange={(_, v) => pickCustomer(v)}
                getOptionLabel={(o) => `${o.code} - ${o.name}${o.city ? ` (${o.city})` : ""}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                noOptionsText={customerLoading ? "Loading..." : "No customer with sales from this plant"}
                renderInput={(params) => <TextField {...params} label={plant ? "Customer Code *" : "Select the plant first"} placeholder="Type or pick the customer code / name" error={Boolean(errs.customer)} sx={DIALOG_FIELD_SX} />}
                sx={{ mb: 0.5 }}
              />
              {err("customer")}
              {customer?.groupName ? <div style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 10px 2px" }}>{`Customer group: ${customer.groupName}`}</div> : <div style={{ height: 10 }} />}

              <Autocomplete
                size="small" options={parts} value={part} loading={partsLoading} disabled={!customer} filterOptions={partFilter} slotProps={{ paper: { sx: LIST_SX } }}
                onChange={(_, v) => { setPart(v); setRates(null); setMasterMode(null); setErrs((x) => ({ ...x, part: undefined })); }}
                getOptionLabel={(o) => `${o.partNo}${o.description ? ` - ${o.description}` : ""}`}
                isOptionEqualToValue={(a, b) => a.partNo === b.partNo}
                noOptionsText={partsLoading ? "Loading..." : "No part sold to this customer from this plant"}
                renderInput={(params) => <TextField {...params} label={customer ? "Part Number *" : "Select the customer code first"} error={Boolean(errs.part)} sx={DIALOG_FIELD_SX} />}
                sx={{ mb: 2 }}
              />
              {err("part")}

              <TextField
                size="small" label="Quantity *" value={qty} onChange={(e) => { setQty(e.target.value.replace(/[^0-9.]/g, "")); setErrs((x) => ({ ...x, qty: undefined })); }}
                error={Boolean(errs.qty)} sx={{ ...DIALOG_FIELD_SX, mb: 2 }}
              />
              {err("qty")}

              <TextField
                select size="small" label="Category *" value={reasonId} onChange={(e) => { setReasonId(e.target.value); setErrs((x) => ({ ...x, reasonId: undefined, notify: undefined })); }}
                error={Boolean(errs.reasonId)} sx={{ ...DIALOG_FIELD_SX, mb: 2 }}
              >
                {reasonOptions.length === 0 && <MenuItem disabled value="" sx={{ fontSize: 11.5 }}>No categories set up (add them in PF Category Master)</MenuItem>}
                {reasonOptions.map((o) => (<MenuItem key={o.id} value={String(o.id)} sx={{ fontSize: 11.5 }}>{o.reason}</MenuItem>))}
              </TextField>
              {err("reasonId")}
              {/* the users of the category's role in the plant: the requester chooses who gets the mail */}
              {reasonId && plant && (
                <>
                  <Autocomplete
                    size="small" options={notifyUsers} loading={notifyLoading} value={notifyUsers.find((u) => String(u.emp) === approverId) || null}
                    getOptionLabel={(u) => u.name || String(u.emp)} isOptionEqualToValue={(x, y) => String(x.emp) === String(y.emp)} slotProps={{ paper: { sx: LIST_SX } }}
                    noOptionsText="No approver has this category's role in this plant" loadingText="Loading approvers..."
                    onChange={(e, u) => { setApproverId(u ? String(u.emp) : ""); setErrs((x) => ({ ...x, notify: undefined })); }}
                    renderOption={(props, u) => (<li {...props} key={u.emp}>{u.name}<span style={{ color: "#8a93a3", marginLeft: 8, fontSize: 11 }}>{u.email}</span></li>)}
                    renderInput={(params) => (<TextField {...params} label={`Select approver${notifyUsers.length ? " *" : ""}`} placeholder="Select the approver" error={Boolean(errs.notify)} sx={{ ...DIALOG_FIELD_SX, mb: 2 }} />)}
                  />
                  {err("notify")}
                  {!notifyLoading && notifyUsers.length === 0 && <div style={{ fontSize: 11, color: "#b45309", margin: "-6px 0 10px 2px" }}>No approver has this category&apos;s role in the plant, so no mail will be sent.</div>}
                </>
              )}
              </div>
              <div>
              <div className="pf-sub">Reason For Premium Freight</div>
              <TextField
                size="small" label="Reason Details *" value={reason} onChange={(e) => { setReason(e.target.value.slice(0, 500)); setErrs((x) => ({ ...x, reason: undefined })); }}
                error={Boolean(errs.reason)} multiline minRows={2} sx={{ ...DIALOG_FIELD_SX, mb: 2, "& .MuiOutlinedInput-root": { alignItems: "flex-start", padding: "6px 7px !important" } }}
              />
              {err("reason")}
              <TextField
                size="small" label="Action Plan *" value={actionPlan} onChange={(e) => { setActionPlan(e.target.value.slice(0, 1000)); setErrs((x) => ({ ...x, actionPlan: undefined })); }}
                error={Boolean(errs.actionPlan)} multiline minRows={2} sx={{ ...DIALOG_FIELD_SX, mb: 2, "& .MuiOutlinedInput-root": { alignItems: "flex-start", padding: "6px 7px !important" } }}
              />
              {err("actionPlan")}
              <TextField
                size="small" label="Recovery / Alternative Savings Plan *" value={recoveryPlan} onChange={(e) => { setRecoveryPlan(e.target.value.slice(0, 1000)); setErrs((x) => ({ ...x, recoveryPlan: undefined })); }}
                error={Boolean(errs.recoveryPlan)} multiline minRows={2} sx={{ ...DIALOG_FIELD_SX, mb: 2, "& .MuiOutlinedInput-root": { alignItems: "flex-start", padding: "6px 7px !important" } }}
              />
              {err("recoveryPlan")}
              <TextField
                size="small" type="date" label="Target Date *" value={targetDate} onChange={(e) => { setTargetDate(e.target.value); setErrs((x) => ({ ...x, targetDate: undefined })); }}
                error={Boolean(errs.targetDate)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayYmd() } }} sx={{ ...DIALOG_FIELD_SX, mb: 2 }}
              />
              {err("targetDate")}
              <TextField
                size="small" label="Responsibility *" value={responsibility} onChange={(e) => { setResponsibility(e.target.value.slice(0, 100)); setErrs((x) => ({ ...x, responsibility: undefined })); }}
                error={Boolean(errs.responsibility)} sx={DIALOG_FIELD_SX}
              />
              {err("responsibility")}
              </div>
              </div>
            </Card>

            <Card title="Freight cost">
              <ModeChoice label="Standard Mode" items={STD_MODES} value={stdMode} onChange={setStdMode} locked={stdFromMaster} required />
              {stdFromMaster ? (
                <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, backgroundColor: "#e8f7ee", border: "1px solid #bfe8cd" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: 0.3 }}>Standard mode cost</div>
                  <div style={{ fontSize: 19, fontWeight: 700 }}>{num(qty) > 0 ? `₹ ${inr(stdValue)}` : "-"}</div>
                  <div style={{ fontSize: 10.5, color: "#6b7280" }}>{`₹ ${inr(hit.rate)} per piece × ${num(qty) > 0 ? num(qty) : "quantity"}`}</div>
                </div>
              ) : (
                <>
                  {part && rates !== null && (
                    <div style={{ marginBottom: 8, padding: "6px 10px", borderRadius: 8, backgroundColor: "#fff4e5", fontSize: 11.5 }}>No freight on record for this part. Choose the mode and enter the cost.</div>
                  )}
                  <TextField
                    size="small" label="Standard Mode Cost (₹) *" value={stdCost} onChange={(e) => { setStdCost(e.target.value.replace(/[^0-9.]/g, "")); setErrs((x) => ({ ...x, stdCost: undefined })); }}
                    error={Boolean(errs.stdCost)} sx={{ ...DIALOG_FIELD_SX, mb: 1.5 }}
                  />
                  {err("stdCost")}
                </>
              )}

              <ModeChoice label="Premium Mode" items={PREMIUM_MODES} value={premMode} onChange={setPremMode} required />
              <TextField
                size="small" label="Premium Mode Total Freight Cost (₹) *" value={premCost} onChange={(e) => { setPremCost(e.target.value.replace(/[^0-9.]/g, "")); setErrs((x) => ({ ...x, premCost: undefined })); }}
                error={Boolean(errs.premCost)} sx={{ ...DIALOG_FIELD_SX, mb: 1.5 }}
              />
              {err("premCost")}

              <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#fdecf2", border: "1px solid #f6c3d6" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#d81b60", textTransform: "uppercase", letterSpacing: 0.3 }}>Premium (excess) spend</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#d81b60", lineHeight: 1.3 }}>{num(premCost) > 0 && stdValue > 0 ? `₹ ${inr(excess)}` : "-"}</div>
                <div style={{ fontSize: 10.5, color: "#6b7280" }}>Premium total freight cost − standard mode cost</div>
              </div>
            </Card>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid #e8eaee" }}>
            <Button variant="outlined" disableElevation onClick={onClose} disabled={busy} sx={{ ...compactButtonSx, color: "#4b5563", borderColor: "#dde1e7" }}>Cancel</Button>
            <Button
              variant="contained" disableElevation onClick={runCheck} disabled={busy}
              startIcon={busy ? <CircularProgress size={13} color="inherit" /> : null}
              sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
            >
              {busy ? "Checking..." : "Check Limit & Submit"}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
};

// ============================================================ Edit dialog ============================================================
// Only three fields: Implementation Details, Completion Status (In Progress / Completed) and Completed On. Nothing else of the request changes.
const EditRequestDialog = ({ row, onClose, onSaved }) => {
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("");
  const [completedOn, setCompletedOn] = useState("");
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!row) return;
    setDetails(row.implementation_details || "");
    setStatus(row.completion_status || "");
    setCompletedOn(row.completed_on || "");
    setErrs({});
    setBusy(false);
  }, [row]);

  const save = async () => {
    const e = {};
    if (!COMPLETION_OPTIONS.includes(status)) e.status = "Choose the completion status";
    if (status === "Completed" && !completedOn) e.completedOn = "Select the completed on date";
    setErrs(e);
    if (Object.keys(e).length) { toast.error("Please complete the fields marked in red"); return; }
    setBusy(true);
    try {
      const response = await updateFreightRequest({ id: row.id, implementationDetails: details.trim(), completionStatus: status, completedOn: status === "Completed" ? completedOn : "" });
      if (response.data?.success) {
        toast.success(`Request ${row.request_no} updated`);
        onSaved(row);
        onClose();
      } else {
        toast.error(response.data?.message || "Could not save the changes");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save the changes");
    } finally {
      setBusy(false);
    }
  };

  const errText = (k) => (errs[k] ? <div style={{ fontSize: 10.5, color: "#d32f2f", margin: "-4px 0 8px 2px" }}>{errs[k]}</div> : null);

  return (
    <Dialog open={Boolean(row)} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "1px solid #e8eaee", backgroundColor: "#f7f9fe" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2e59d9" }}>Edit request</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{row ? `${row.request_no} · Plant ${row.plant_code}` : ""}</div>
        </div>
        <IconButton size="small" onClick={onClose} disabled={busy}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </div>
      <div style={{ padding: "16px 18px 6px" }}>
        <TextField
          size="small" label="Implementation Details" value={details} onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
          multiline minRows={3} sx={{ ...DIALOG_FIELD_SX, mb: 1.5, "& .MuiOutlinedInput-root": { alignItems: "flex-start", padding: "6px 7px !important" } }}
        />
        <TextField
          select size="small" label="Completion Status *" value={status} error={Boolean(errs.status)} sx={{ ...DIALOG_FIELD_SX, mb: 1.5 }}
          onChange={(e) => { setStatus(e.target.value); setErrs((x) => ({ ...x, status: undefined, completedOn: undefined })); if (e.target.value !== "Completed") setCompletedOn(""); }}
        >
          {COMPLETION_OPTIONS.map((o) => (<MenuItem key={o} value={o} sx={{ fontSize: 11.5 }}>{o}</MenuItem>))}
        </TextField>
        {errText("status")}
        <TextField
          size="small" type="date" label={status === "Completed" ? "Completed On *" : "Completed On"} value={completedOn} disabled={status !== "Completed"} error={Boolean(errs.completedOn)}
          onChange={(e) => { setCompletedOn(e.target.value); setErrs((x) => ({ ...x, completedOn: undefined })); }}
          slotProps={{ inputLabel: { shrink: true } }} sx={{ ...DIALOG_FIELD_SX, mb: 1.5 }}
        />
        {errText("completedOn")}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 18px 14px" }}>
        <Button variant="outlined" disableElevation onClick={onClose} disabled={busy} sx={{ ...compactButtonSx, color: "#4b5563", borderColor: "#dde1e7" }}>Cancel</Button>
        <Button
          variant="contained" disableElevation onClick={save} disabled={busy}
          startIcon={busy ? <CircularProgress size={13} color="inherit" /> : null}
          sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
        >
          {busy ? "Saving..." : "Save"}
        </Button>
      </div>
    </Dialog>
  );
};

// ============================================================ the screen ============================================================
const Request = () => {
  const empId = String(localStorage.getItem("EmpId") || "");

  const [fyPick, setFyPick] = useState(todayFy());
  const [plantPick, setPlantPick] = useState("ALL");
  const [statusPick, setStatusPick] = useState("ALL");
  const [applied, setApplied] = useState({ fy: todayFy(), plant: "ALL", status: "ALL" });
  const [onlyMine, setOnlyMine] = useState(false);

  const [plants, setPlants] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [openNew, setOpenNew] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editRow, setEditRow] = useState(null); // the request in the Edit dialog

  const fyOptions = useMemo(() => {
    const now = todayFy();
    return [now + 1, now, now - 1, now - 2];
  }, []);

  const load = async (f = applied) => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getFreightRequests({ fy: f.fy, plant_code: f.plant === "ALL" ? "" : f.plant, status: f.status === "ALL" ? "" : f.status });
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      if (Array.isArray(data?.plants) && data.plants.length) setPlants(data.plants);
      setApplied(f);
    } catch (error) {
      console.error("Failed to load the requests.", error);
      setRows([]);
      setLoadError(error?.response?.data?.message || "Could not load the requests. Please try again.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    load(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    load({ fy: fyPick, plant: plantPick, status: statusPick });
  };

  const filteredRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyMine && String(r.raised_by) !== empId) return false;
      if (!text) return true;
      return SEARCH_KEYS.some((k) => String(r[k] ?? "").toLowerCase().includes(text)) || raisedByOf(r).toLowerCase().includes(text);
    });
  }, [rows, searchText, onlyMine, empId]);

  const caption = useMemo(() => {
    if (!loaded || loadError) return null;
    const count = (s) => filteredRows.filter((r) => r.status === s).length;
    const plantText = applied.plant === "ALL" ? "All plants" : `Plant ${applied.plant}`;
    return `${fyName(applied.fy)} · ${plantText} · ${filteredRows.length} requests · Pending ${count("PENDING")} · Query ${count("QUERY")} · Approved ${count("APPROVED")} · Rejected ${count("REJECTED")}`;
  }, [filteredRows, loaded, loadError, applied]);

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

  const columns = [
    { field: "si_no", headerName: "SI No", width: 62, sortable: false, filterable: false, renderCell: (p) => p.api.getRowIndexRelativeToVisibleRows(p.id) + 1 + paginationModel.page * paginationModel.pageSize },
    { field: "request_no", headerName: "Request No", width: 130, renderCell: (p) => <span style={{ fontWeight: 700, color: "#2e59d9", cursor: "pointer" }}>{p.value}</span> },
    { field: "plant_code", headerName: "Plant", width: 70 },
    { field: "budget_month", headerName: "Month", width: 90, renderCell: (p) => monthText(p.value) },
    { field: "customer_code", headerName: "Customer Code", width: 110 },
    { field: "customer_name", headerName: "Customer Name", width: 150 },
    { field: "part_no", headerName: "Part No", width: 120 },
    { field: "part_desc", headerName: "Part Description", flex: 1, minWidth: 150 },
    { field: "qty", headerName: "Qty", width: 70, type: "number", align: "right", headerAlign: "right", renderCell: (p) => Number(p.value).toLocaleString("en-IN") },
    { field: "std_mode", headerName: "Std Mode", width: 80 },
    { field: "premium_mode", headerName: "Premium Mode", width: 110 },
    { field: "std_cost", headerName: "Std Cost (₹)", width: 110, type: "number", align: "right", headerAlign: "right", valueFormatter: (v) => (v === null || v === undefined ? "" : inr(v)) },
    { field: "prem_cost", headerName: "Premium Cost (₹)", width: 125, type: "number", align: "right", headerAlign: "right", valueFormatter: (v) => (v === null || v === undefined ? "" : inr(v)) },
    { field: "est_cost", headerName: "Excess (₹)", width: 110, type: "number", align: "right", headerAlign: "right", renderCell: (p) => <b style={{ width: "100%", textAlign: "right" }}>{inr(p.value)}</b> },
    { field: "action_plan", headerName: "Action Plan", width: 230 },
    { field: "recovery_plan", headerName: "Recovery / Alternative Savings Plan", width: 230 },
    { field: "target_date", headerName: "Target Date", width: 100, renderCell: (p) => dateText(p.value) },
    { field: "responsibility", headerName: "Responsibility", width: 130 },
    { field: "completion_status", headerName: "Completion", width: 105, renderCell: (p) => (p.value ? pill(p.value, COMPLETION_COLOR[p.value] || "#6b7280") : "") },
    { field: "status", headerName: "Status", width: 95, renderCell: (p) => pill(STATUS_LABEL[p.value] || p.value, STATUS_COLOR[p.value] || "#6b7280") },
    { field: "raised_by_name", headerName: "Raised By", width: 120, renderCell: (p) => raisedByOf(p.row) },
    { field: "raised_at", headerName: "Raised On", width: 135, renderCell: (p) => whenText(p.value) },
    {
      field: "edit", headerName: "Edit", width: 60, sortable: false, filterable: false, align: "center", headerAlign: "center",
      renderCell: (p) => (
        <IconButton size="small" title="Edit" onClick={(e) => { e.stopPropagation(); setEditRow(p.row); }} sx={{ p: "3px" }}>
          <EditOutlinedIcon sx={{ fontSize: 16, color: "#2e59d9" }} />
        </IconButton>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px",
        display: "flex", flexDirection: "column", height: "calc(100vh - 90px)",
      }}
    >
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHeading>Premium Freight Request</SectionHeading>
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
          <TextField select size="small" label="Status" value={statusPick} onChange={(e) => setStatusPick(e.target.value)} sx={compactFieldSx(120)} disabled={loading}>
            <MenuItem sx={{ fontSize: 11.5, fontWeight: 600 }} value="ALL">All</MenuItem>
            {Object.keys(STATUS_LABEL).map((s) => (<MenuItem key={s} sx={{ fontSize: 11.5 }} value={s}>{STATUS_LABEL[s]}</MenuItem>))}
          </TextField>
          <Button
            variant="contained" disableElevation onClick={handleSubmit} disabled={loading}
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Submit"}
          </Button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <Button
            variant={onlyMine ? "contained" : "outlined"} disableElevation onClick={() => { setOnlyMine((v) => !v); setPaginationModel((prev) => ({ ...prev, page: 0 })); }}
            sx={onlyMine ? { ...compactButtonSx, backgroundColor: "#2e59d9", "&:hover": { backgroundColor: "#2549b5" } } : { ...compactButtonSx, color: "#4b5563", borderColor: "#dde1e7" }}
            title="Show only the requests you raised"
          >
            Only my requests
          </Button>
          <TextField
            size="small" variant="outlined" placeholder="Search all columns..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPaginationModel((prev) => ({ ...prev, page: 0 })); }}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
            sx={compactFieldSx(240)}
          />
          <Button
            variant="contained" disableElevation onClick={() => setOpenNew(true)}
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
          >
            New Request
          </Button>
        </div>
      </div>

      {caption && <Typography sx={{ fontSize: 11, color: "#6b7280", mb: 1, ml: 0.5 }}>{caption}</Typography>}

      {loadError && (
        <Alert
          severity="error" sx={{ mb: 1.5, fontSize: 12, py: 0 }}
          action={<Button color="inherit" size="small" onClick={() => load(applied)} sx={{ fontSize: 11, textTransform: "none" }}>Retry</Button>}
        >
          {loadError}
        </Alert>
      )}

      <div
        style={{
          flexGrow: 1, minHeight: 0, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)", overflow: "hidden",
        }}
      >
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          onRowClick={(p) => openDetail(p.row)}
          disableRowSelectionOnClick
          disableColumnMenu
          columnHeaderHeight={36}
          rowHeight={38}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: loadError ? "Could not load data." : loaded ? (rows.length === 0 ? "No requests found for the selected filters. Click New Request to start one." : "No requests match your search.") : "" }}
          sx={{ height: "100%", ...GRID_SX, "& .MuiDataGrid-row": { backgroundColor: "#fff", cursor: "pointer" } }}
        />
      </div>

      <NewRequestDialog open={openNew} onClose={() => setOpenNew(false)} onSubmitted={() => load(applied)} />
      <RequestDrawer detail={detail} onClose={() => setDetail(null)} onEdit={(row) => setEditRow(row)} />
      <EditRequestDialog
        row={editRow} onClose={() => setEditRow(null)}
        onSaved={(row) => { load(applied); if (detail && detail.row.id === row.id) openDetail(detail.row); }}
      />
    </div>
  );
};

export default Request;
