import React from "react";
import { Chip, Typography } from "@mui/material";
import { getSchedulerAccess } from "../Authentication/ActionAccessType";

// Shared look + helpers for the three Scheduler screens.

export const STATUS_STYLES = {
  SUCCESS: { bg: "#e8f6ee", fg: "#1b7a43", bar: "#2e9e5b", label: "Success" },
  PARTIAL: { bg: "#fff6e0", fg: "#9a6a00", bar: "#e3a008", label: "Partial" },
  FAILED: { bg: "#fdeaea", fg: "#b42323", bar: "#d64545", label: "Failed" },
  SKIPPED: { bg: "#eef0f4", fg: "#5b6472", bar: "#a4acb9", label: "No new file" },
  RUNNING: { bg: "#e6f0ff", fg: "#0052cc", bar: "#3b82f6", label: "Running" },
  NONE: { bg: "#f3f4f6", fg: "#6b7280", bar: "#d1d5db", label: "Never run" },
};

export const statusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.NONE;

export const StatusChip = ({ status, size = "small" }) => {
  const s = statusStyle(status);
  return (
    <Chip
      size={size}
      label={s.label}
      sx={{ backgroundColor: s.bg, color: s.fg, fontWeight: 700, fontSize: 10.5, height: 20, "& .MuiChip-label": { px: 1 } }}
    />
  );
};

export const LOAD_MODES = {
  SNAPSHOT: { label: "Snapshot", help: "Every file is a new batch; the previous batch is deactivated." },
  INSERT_ONLY: { label: "Insert only", help: "Adds rows that don't exist yet; never updates or deletes." },
  PROCEDURE: { label: "Stored procedure", help: "Stages the rows and runs a stored procedure that inserts them." },
};

export const scheduleText = (job) => {
  if (job.schedule_type === "DAILY") return `Daily at ${job.daily_time}`;
  const n = job.every_hours;
  return `Every ${n === 1 ? "hour" : `${n} hours`} at :${String(job.at_minute ?? 0).padStart(2, "0")}`;
};

export const keepText = (job) => (job.keep_days === null || job.keep_days === undefined ? "All history" : `Last ${job.keep_days} day${job.keep_days === 1 ? "" : "s"}`);

export const fmtDateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// "yyyy-MM-dd HH:mm:ss" strings from the run-log API are the server's wall clock.
export const fmtServerTime = (s) => {
  if (!s) return "—";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : String(s);
};

export const PageHint = ({ children }) => (
  <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.75 }}>{children}</Typography>
);

export const useSchedulerCanManage = () => getSchedulerAccess().canManage;

export const errorText = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export const currentUserId = () => localStorage.getItem("EmpId") || "SYSTEM";
