import React from "react";
import { Button, CircularProgress, Drawer, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

// Shared by the Premium Freight screens (Freight Request, Freight Request Report): labels, number / date formats, the status pill,
// the compact grid look of the PPC & MRPC list screens and the read-only request detail panel with the approval timeline.

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const STATUS_LABEL = { PENDING: "Pending", QUERY: "Query", APPROVED: "Approved", REJECTED: "Rejected" };
export const STATUS_COLOR = { PENDING: "#ed6c02", QUERY: "#7b1fa2", APPROVED: "#2e7d32", REJECTED: "#d32f2f" };
// L1 = the users of the category's role chosen on the New Request form (first step), then Plant Head -> CFIN Head -> Business Head
export const LEVEL_NAME = { L1: "L1", PH: "Plant Head", CFIN: "CFIN Head", BH: "Business Head", RAISER: "Requester" };
export const ACTION_LABEL = { SUBMIT: "Submitted", APPROVE: "Approved", QUERY: "Query raised", REPLY: "Replied", REJECT: "Rejected" };
export const ACTION_COLOR = { SUBMIT: "#0066FF", APPROVE: "#2e7d32", QUERY: "#7b1fa2", REPLY: "#0066FF", REJECT: "#d32f2f" };
export const ROUTE_TEXT = { PH_ONLY: "L1 → Plant Head", EXTENDED: "L1 → Plant Head → CFIN Head → Business Head" };

export const todayFy = () => {
  const d = new Date();
  return d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
};
export const fyName = (y) => `FY ${y}-${String(y + 1).slice(2)}`;
export const inr = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? "" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
export const monthText = (iso) => {
  const m = /^(\d{4})-(\d{2})/.exec(String(iso ?? ""));
  return m ? `${MONTH_SHORT[Number(m[2]) - 1]} ${m[1]}` : "";
};
export const whenText = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
};
export const dateText = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
};
export const levelOf = (row) => (row.status === "PENDING" || row.status === "QUERY" ? LEVEL_NAME[row.current_level] || "-" : "-");

export const pill = (label, color) => (
  <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "10.5px", fontWeight: "bold", color: "white", backgroundColor: color }}>{label}</span>
);
export const money = (p) => <span style={{ width: "100%", textAlign: "right" }}>{inr(p.value)}</span>;

// the compact grid look of the PPC & MRPC list screens
export const GRID_SX = {
  border: "none",
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
  "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
  "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
  "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 28 },
  "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
  "& .MuiDataGrid-footerContainer": { minHeight: 34 },
  "& .MuiTablePagination-root": { overflow: "visible" },
  "& .MuiTablePagination-toolbar": { minHeight: "34px !important", height: 34, paddingLeft: 8, paddingRight: 4 },
  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 11, marginTop: 0, marginBottom: 0 },
  "& .MuiTablePagination-select": { fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset" },
  "& .MuiTablePagination-selectIcon": { fontSize: 16 },
  "& .MuiTablePagination-actions .MuiIconButton-root": { padding: 4, width: 24, height: 24 },
};

// label / value line and section of the detail panel
const Line = ({ label, value, bold }) => (
  <div style={{ display: "flex", gap: 10, padding: "3px 0", fontSize: 11.5 }}>
    <div style={{ width: 128, flexShrink: 0, color: "#6b7280" }}>{label}</div>
    <div style={{ flex: 1, color: "#1a2233", fontWeight: bold ? 700 : 500, wordBreak: "break-word" }}>{value === null || value === undefined || value === "" ? "-" : value}</div>
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#2e59d9", letterSpacing: 0.4, textTransform: "uppercase", borderBottom: "1px solid #e8eaee", paddingBottom: 3, marginBottom: 4 }}>{title}</div>
    {children}
  </div>
);

// Read-only detail of one request with its approval timeline. detail = { row, loading, error, data: { request, steps } } or null.
export const COMPLETION_COLOR = { "In Progress": "#ed6c02", Completed: "#2e7d32" };

// onEdit (optional): shows the Edit button (Freight Request screen); it gets the request row to edit
export const RequestDrawer = ({ detail, onClose, onEdit }) => {
  const d = detail?.data;
  const req = d?.request;
  return (
    <Drawer anchor="right" open={Boolean(detail)} onClose={onClose} PaperProps={{ sx: { width: 440, maxWidth: "100vw" } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e8eaee", backgroundColor: "#f7f9fe" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2e59d9" }}>{detail?.row?.request_no}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{detail ? `Plant ${detail.row.plant_code} · ${monthText(detail.row.budget_month)}` : ""}</div>
        </div>
        {detail && pill(STATUS_LABEL[detail.row.status] || detail.row.status, STATUS_COLOR[detail.row.status] || "#6b7280")}
        {onEdit && req && (
          <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />} onClick={() => onEdit({ ...detail.row, ...req })} sx={{ textTransform: "none", fontSize: 11.5, py: 0.25, minHeight: 26 }}>
            Edit
          </Button>
        )}
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </div>
      <div style={{ padding: 16, overflow: "auto" }}>
        {detail?.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><CircularProgress size={22} /></div>
        ) : detail?.error ? (
          <Typography sx={{ fontSize: 12, color: "#d32f2f" }}>{detail.error}</Typography>
        ) : req ? (
          <>
            <Section title="Request">
              <Line label="Plant" value={`${req.plant_code}${req.plant_name ? ` - ${req.plant_name}` : ""}`} />
              <Line label="Budget month" value={monthText(req.budget_month)} />
              <Line label="Customer group" value={req.customer_group} />
              <Line label="Customer" value={`${req.customer_code || ""}${req.customer_name ? ` - ${req.customer_name}` : ""}`} />
              <Line label="Part" value={`${req.part_no || ""}${req.part_desc ? ` - ${req.part_desc}` : ""}`} />
              <Line label="Quantity" value={Number(req.qty).toLocaleString("en-IN")} />
              <Line label="Category" value={req.reason_name} />
              <Line label="Reason Details" value={req.reason} />
              <Line label="Action Plan" value={req.action_plan} />
              <Line label="Recovery / Alternative Savings Plan" value={req.recovery_plan} />
              <Line label="Target Date" value={dateText(req.target_date)} />
              <Line label="Responsibility" value={req.responsibility} />
              <Line label="Raised on" value={whenText(req.raised_at)} />
            </Section>
            <Section title="Implementation">
              <Line label="Implementation Details" value={req.implementation_details} />
              <Line label="Completion Status" value={req.completion_status ? pill(req.completion_status, COMPLETION_COLOR[req.completion_status] || "#6b7280") : ""} />
              <Line label="Completed On" value={dateText(req.completed_on)} />
            </Section>
            <Section title="Cost">
              <Line label="Standard mode" value={req.std_mode} />
              <Line
                label="Standard cost"
                value={
                  <>
                    {`₹ ${inr(req.std_cost)}`}
                    {Number(req.qty) > 0 && Number(req.std_cost) > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "#6b7280" }}>
                        {`(₹ ${inr(req.std_source === "MASTER" && Number(req.std_rate) > 0 ? req.std_rate : Number(req.std_cost) / Number(req.qty))} per piece × ${Number(req.qty).toLocaleString("en-IN")})`}
                      </span>
                    )}
                  </>
                }
              />
              <Line label="Premium mode" value={req.premium_mode} />
              <Line label="Premium cost" value={`₹ ${inr(req.prem_cost)}`} />
              <Line label="Excess" value={`₹ ${inr(req.est_cost)}`} bold />
            </Section>
            <Section title="Approval limit when raised">
              <Line label="Monthly limit" value={`₹ ${inr(req.limit_amount)}`} />
              <Line label="Already used" value={`₹ ${inr(req.committed_amt)}`} />
              <Line label="After this request" value={`₹ ${inr(Number(req.committed_amt) + Number(req.est_cost))}`} />
              <Line label="Route" value={ROUTE_TEXT[req.route] || req.route} bold />
              <Line label="Now with" value={req.status === "PENDING" || req.status === "QUERY" ? LEVEL_NAME[req.current_level] : "-"} />
            </Section>
            <Section title="Approval timeline">
              {d.steps.length === 0 ? (
                <div style={{ fontSize: 11.5, color: "#8a93a3" }}>No steps recorded.</div>
              ) : (
                d.steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, paddingBottom: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, marginTop: 3, backgroundColor: ACTION_COLOR[s.action] || "#6b7280" }} />
                      {i < d.steps.length - 1 && <span style={{ flex: 1, width: 2, backgroundColor: "#e5e7eb", marginTop: 2 }} />}
                    </div>
                    <div style={{ flex: 1, fontSize: 11.5 }}>
                      <div style={{ fontWeight: 700, color: "#1a2233" }}>
                        {ACTION_LABEL[s.action] || s.action} <span style={{ fontWeight: 500, color: "#6b7280" }}>· {LEVEL_NAME[s.level] || s.level}</span>
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 10.5 }}>{`${s.emp_name || s.emp_no || ""} · ${whenText(s.acted_at)}`}</div>
                      {s.comment && <div style={{ marginTop: 3, color: "#333", backgroundColor: "#f6f7f9", borderRadius: 6, padding: "5px 8px" }}>{s.comment}</div>}
                    </div>
                  </div>
                ))
              )}
            </Section>
            <div style={{ fontSize: 10.5, color: "#8a93a3" }}>Approvals, queries and rejections are done in the SFMS mobile app.</div>
          </>
        ) : null}
      </div>
    </Drawer>
  );
};
