import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, InputAdornment, MenuItem, Paper, Radio, RadioGroup, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import LiveCountdown from "./LiveCountdown";
import { compactButtonSx } from "../components/MfgListScreen";
import {
  deleteSchedulerJob, getRetentionPreview, getSchedulerJobs, getSchedulerTargets, getTargetColumns, runSchedulerJob, saveSchedulerJob,
} from "../controller/SchedulerApiService";
import {
  LOAD_MODES, StatusChip, currentUserId, errorText, fmtDateTime, keepText, scheduleText, statusStyle, useSchedulerCanManage,
} from "./schedulerShared";

const SHARE_ROOT = "\\\\10.51.10.10\\Shared by Rmlvlcy\\Shared_by_Spl_Projects\\SAP_FTP_FILE\\";

const EMPTY_FORM = {
  job_name: "", description: "", file_prefix: "", source_path: SHARE_ROOT, processed_path: SHARE_ROOT, after_success: "MOVE",
  target_table: "", load_mode: "INSERT_ONLY", validation_mode: "PER_ROW", dup_key_columns: [], dup_prefer_column: "", proc_name: "", proc_temp_table: "#",
  split_plant_month: false, keep_mode: "ALL", keep_days: "", retention_date_column: "",
  schedule_type: "EVERY_N_HOURS", every_hours: 4, at_minute: 0, daily_time: "08:30", engine: "GENERIC", is_active: true,
};

const fieldProps = { size: "small", fullWidth: true, InputLabelProps: { shrink: true }, sx: { "& .MuiInputBase-input": { fontSize: 13 } } };

const formFromJob = (job) => ({
  ...EMPTY_FORM,
  job_id: job.job_id, job_name: job.job_name, description: job.description || "", file_prefix: job.file_prefix || "",
  source_path: job.source_path, processed_path: job.processed_path, after_success: job.after_success, target_table: job.target_table,
  load_mode: job.load_mode, validation_mode: job.validation_mode,
  dup_key_columns: job.dup_key_columns ? job.dup_key_columns.split(",").filter(Boolean) : [],
  dup_prefer_column: job.dup_prefer_column || "",
  proc_name: job.proc_name || "", proc_temp_table: job.proc_temp_table || "#", split_plant_month: Boolean(job.split_plant_month),
  keep_mode: job.keep_days === null || job.keep_days === undefined ? "ALL" : "DAYS", keep_days: job.keep_days ?? "",
  retention_date_column: job.retention_date_column || "", schedule_type: job.schedule_type, every_hours: job.every_hours ?? 4,
  at_minute: job.at_minute ?? 0, daily_time: job.daily_time || "08:30", engine: job.engine, is_active: Boolean(job.is_active),
});

// 'yyyy-MM-dd HH:mm' (server time) -> 'HH:mm', or 'dd-MM HH:mm' when it is not today
const clockText = (nextRunAt) => {
  if (!nextRunAt) return "";
  const [d, t] = nextRunAt.split(" ");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return d === todayStr ? t : `${d.slice(8, 10)}-${d.slice(5, 7)} ${t}`;
};

/* ---------------------------------------------------------------- confirm */

const ConfirmDialog = ({ open, title, children, confirmLabel, color = "primary", busy, onCancel, onConfirm }) => (
  <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>{title}</DialogTitle>
    <DialogContent sx={{ fontSize: 13, color: "#374151" }}>{children}</DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} disabled={busy} sx={{ ...compactButtonSx, color: "#5b6472" }}>Cancel</Button>
      <Button
        onClick={onConfirm} disabled={busy} variant="contained" color={color} disableElevation
        startIcon={busy ? <CircularProgress size={13} color="inherit" /> : null} sx={compactButtonSx}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

/* ------------------------------------------------------------ add / edit */

const SectionLabel = ({ icon, children }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 2.5, mb: 1.25, color: "#1a2233" }}>
    {icon}
    <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.2 }}>{children}</Typography>
    <Divider sx={{ flex: 1, ml: 1 }} />
  </Box>
);

const JobDialog = ({ open, job, targets, onClose, onSaved }) => {
  const editing = Boolean(job);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cols, setCols] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [impact, setImpact] = useState(null);
  const [checking, setChecking] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isBuiltIn = Boolean(job?.built_in);

  useEffect(() => {
    if (open) {
      setForm(job ? formFromJob(job) : EMPTY_FORM);
      setError("");
      setImpact(null);
    }
  }, [open, job]);

  useEffect(() => {
    let alive = true;
    setCols([]);
    if (open && form.target_table) {
      getTargetColumns(form.target_table).then((c) => alive && setCols(c)).catch(() => alive && setCols([]));
    }
    return () => { alive = false; };
  }, [open, form.target_table]);

  const mappable = useMemo(() => cols.filter((c) => !c.system), [cols]);
  const dateCols = useMemo(() => cols.filter((c) => c.kind === "date" || c.kind === "datetime"), [cols]);
  const isSnapshotTable = cols.some((c) => c.name === "status") && cols.some((c) => c.name === "upload_batch_id");

  useEffect(() => { setImpact(null); }, [form.keep_mode, form.keep_days, form.retention_date_column]);

  const checkImpact = async () => {
    if (!editing || !form.retention_date_column || !form.keep_days) return;
    setChecking(true);
    try {
      setImpact(await getRetentionPreview(job.job_id, { keep_days: Number(form.keep_days), retention_date_column: form.retention_date_column }));
    } catch (e) {
      toast.error(errorText(e, "Could not count the rows."));
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        keep_days: form.keep_mode === "ALL" ? null : form.keep_days,
        retention_date_column: form.keep_mode === "ALL" ? null : form.retention_date_column,
        dup_key_columns: form.load_mode === "INSERT_ONLY" ? form.dup_key_columns.join(",") : null,
        dup_prefer_column: form.load_mode === "INSERT_ONLY" ? form.dup_prefer_column || null : null,
        userId: currentUserId(),
      };
      const res = await saveSchedulerJob(payload);
      toast.success(res.message || "Saved.");
      onSaved();
    } catch (e) {
      setError(errorText(e, "Failed to save the profile."));
    } finally {
      setSaving(false);
    }
  };

  const generic = form.engine === "GENERIC";

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 16, fontWeight: 700, pb: 1 }}>
        {editing ? <EditOutlinedIcon sx={{ fontSize: 20, color: "#0066FF" }} /> : <AddIcon sx={{ fontSize: 20, color: "#0066FF" }} />}
        {editing ? "Edit Ingestion Profile" : "Add Ingestion Profile"}
        {editing && <Chip size="small" label={job.job_code} sx={{ ml: 1, fontFamily: "monospace", fontSize: 11, height: 20 }} />}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12.5 }}>{error}</Alert>}

        <SectionLabel>Profile</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.75 }}>
          <TextField {...fieldProps} required label="Profile name" value={form.job_name} onChange={(e) => set({ job_name: e.target.value })} />
          <TextField
            {...fieldProps} label="File name prefix / mask" placeholder="e.g. MB52_  (empty = every file)" value={form.file_prefix}
            onChange={(e) => set({ file_prefix: e.target.value })} helperText="Only .csv / .xlsx / .xls files starting with this text are read."
          />
          <TextField
            {...fieldProps} label="Description" value={form.description} onChange={(e) => set({ description: e.target.value })}
            sx={{ gridColumn: { sm: "1 / -1" }, "& .MuiInputBase-input": { fontSize: 13 } }}
          />
        </Box>

        <SectionLabel icon={<FolderOpenOutlinedIcon sx={{ fontSize: 17, color: "#6b7280" }} />}>Folders</SectionLabel>
        <Box sx={{ display: "grid", gap: 1.75 }}>
          <TextField {...fieldProps} required label="Ingest path (files are read from here)" value={form.source_path} onChange={(e) => set({ source_path: e.target.value })} />
          <TextField {...fieldProps} required label="Processed path (successful files go here)" value={form.processed_path} onChange={(e) => set({ processed_path: e.target.value })} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 12.5, color: "#374151" }}>After a successful import</Typography>
            <ToggleButtonGroup
              exclusive size="small" value={form.after_success} onChange={(e, v) => v && set({ after_success: v })}
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontSize: 12, py: 0.25, px: 1.5 } }}
            >
              <ToggleButton value="MOVE">Move to processed folder</ToggleButton>
              <ToggleButton value="MOVE_DATED">Move + add date to the name</ToggleButton>
              <ToggleButton value="DELETE">Delete the file</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <SectionLabel icon={<StorageOutlinedIcon sx={{ fontSize: 17, color: "#6b7280" }} />}>Target &amp; load</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.75 }}>
          <TextField
            {...fieldProps} select required label="Target table" value={form.target_table} disabled={editing && job.mapped_columns > 0}
            onChange={(e) => set({ target_table: e.target.value, retention_date_column: "", dup_key_columns: [] })}
            helperText={editing && job.mapped_columns > 0 ? "Clear the column mapping to change the table." : "Only approved tables are listed."}
          >
            {targets.map((t) => <MenuItem key={t.target_table} value={t.target_table} sx={{ fontSize: 13 }}>{t.display_name} ({t.target_table})</MenuItem>)}
          </TextField>
          <TextField
            {...fieldProps} select label="Load mode" value={form.load_mode} onChange={(e) => set({ load_mode: e.target.value })}
            helperText={LOAD_MODES[form.load_mode]?.help}
          >
            {Object.entries(LOAD_MODES).map(([k, v]) => <MenuItem key={k} value={k} sx={{ fontSize: 13 }}>{v.label}</MenuItem>)}
          </TextField>
          <TextField
            {...fieldProps} select label="Validation" value={form.validation_mode} onChange={(e) => set({ validation_mode: e.target.value })}
            helperText={form.validation_mode === "STRICT_ALL" ? "Any invalid row rejects the whole file." : "Invalid rows are skipped and counted; valid rows load."}
          >
            <MenuItem value="PER_ROW" sx={{ fontSize: 13 }}>Skip invalid rows</MenuItem>
            <MenuItem value="STRICT_ALL" sx={{ fontSize: 13 }}>Reject the whole file</MenuItem>
          </TextField>
          {form.load_mode === "INSERT_ONLY" && (
            <>
            <TextField
              {...fieldProps} select label="Duplicate check columns"
              SelectProps={{ multiple: true, renderValue: (v) => (v.length ? v.join(", ") : "All mapped columns") }}
              value={form.dup_key_columns} onChange={(e) => set({ dup_key_columns: e.target.value })}
              helperText="A row is skipped when all of these match an existing row. Empty = all mapped columns."
            >
              {mappable.map((c) => <MenuItem key={c.name} value={c.name} sx={{ fontSize: 13 }}>{c.name}</MenuItem>)}
            </TextField>
            <TextField
              {...fieldProps} select label="Same row twice in one file: keep the highest"
              value={form.dup_prefer_column} onChange={(e) => set({ dup_prefer_column: e.target.value })}
              SelectProps={{ displayEmpty: true }}
              helperText="If a file repeats a row, the copy with the highest value in this column is kept."
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>Any one of them</MenuItem>
              {mappable.filter((c) => ["int", "decimal", "date", "datetime"].includes(c.kind)).map((c) => (
                <MenuItem key={c.name} value={c.name} sx={{ fontSize: 13 }}>{c.name}</MenuItem>
              ))}
            </TextField>
            </>
          )}
          {form.load_mode === "PROCEDURE" && (
            <>
              <TextField {...fieldProps} label="Stored procedure" value={form.proc_name} onChange={(e) => set({ proc_name: e.target.value })} helperText="Called with @user_id (number)." />
              <TextField {...fieldProps} label="Staging #temp table" value={form.proc_temp_table} onChange={(e) => set({ proc_temp_table: e.target.value })} helperText="The #table the procedure reads, e.g. #MyTemp." />
              <FormControlLabel
                sx={{ gridColumn: { sm: "1 / -1" }, "& .MuiTypography-root": { fontSize: 12.5 } }}
                control={<Switch size="small" checked={form.split_plant_month} onChange={(e) => set({ split_plant_month: e.target.checked })} />}
                label="Call the procedure once per plant + month (needs mapped columns named plant and prod_date)"
              />
            </>
          )}
        </Box>

        <SectionLabel icon={<ScheduleOutlinedIcon sx={{ fontSize: 17, color: "#6b7280" }} />}>Schedule</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.75 }}>
          <TextField {...fieldProps} select label="Runs" value={form.schedule_type} onChange={(e) => set({ schedule_type: e.target.value })}>
            <MenuItem value="EVERY_N_HOURS" sx={{ fontSize: 13 }}>Every N hours</MenuItem>
            <MenuItem value="DAILY" sx={{ fontSize: 13 }}>Daily at a time</MenuItem>
          </TextField>
          {form.schedule_type === "EVERY_N_HOURS" ? (
            <>
              <TextField {...fieldProps} type="number" label="Every (hours)" value={form.every_hours} inputProps={{ min: 1, max: 24 }} onChange={(e) => set({ every_hours: e.target.value })} helperText="Runs at hours 0, N, 2N …" />
              <TextField {...fieldProps} type="number" label="At minute" value={form.at_minute} inputProps={{ min: 0, max: 59 }} onChange={(e) => set({ at_minute: e.target.value })} helperText="Minute past the hour" />
            </>
          ) : (
            <TextField {...fieldProps} type="time" label="Time" value={form.daily_time} onChange={(e) => set({ daily_time: e.target.value })} />
          )}
        </Box>

        <SectionLabel>Keep history</SectionLabel>
        {editing && ["PROD_ACTUAL", "SUBCONTRACT"].includes(job.job_code) && (
          <Alert severity="info" sx={{ fontSize: 12, mb: 1 }}>This job keeps all records permanently. Nothing is ever deleted from its table.</Alert>
        )}
        <RadioGroup row value={form.keep_mode} onChange={(e) => set({ keep_mode: e.target.value })}>
          <FormControlLabel value="ALL" control={<Radio size="small" />} label="Keep all records" sx={{ "& .MuiTypography-root": { fontSize: 13 } }} />
          <FormControlLabel value="DAYS" disabled={editing && ["PROD_ACTUAL", "SUBCONTRACT"].includes(job.job_code)} control={<Radio size="small" />} label="Keep only the last N days" sx={{ "& .MuiTypography-root": { fontSize: 13 } }} />
        </RadioGroup>
        {form.keep_mode === "DAYS" && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, gap: 1.75, mt: 0.5, alignItems: "start" }}>
            <TextField
              {...fieldProps} type="number" label="Days to keep" value={form.keep_days} inputProps={{ min: 1 }}
              onChange={(e) => set({ keep_days: e.target.value })}
              InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
              helperText="Older rows are deleted after each successful run."
            />
            <TextField
              {...fieldProps} select label="Judged by date column" value={form.retention_date_column}
              onChange={(e) => set({ retention_date_column: e.target.value })}
              helperText={isSnapshotTable ? "Only inactive batches are deleted; the active one is always kept." : "Rows older than the cut-off are deleted."}
            >
              {dateCols.map((c) => <MenuItem key={c.name} value={c.name} sx={{ fontSize: 13 }}>{c.name}</MenuItem>)}
            </TextField>
            {editing && (
              <Button
                onClick={checkImpact} disabled={checking || !form.keep_days || !form.retention_date_column} variant="outlined" size="small"
                startIcon={checking ? <CircularProgress size={13} /> : null} sx={{ ...compactButtonSx, mt: 0.25 }}
              >
                Check impact
              </Button>
            )}
          </Box>
        )}
        {impact && (
          <Alert severity={impact.rows > 0 ? "warning" : "info"} sx={{ mt: 1.25, fontSize: 12.5 }}>
            {impact.rows > 0
              ? `${impact.rows.toLocaleString("en-IN")} existing row(s) would be deleted by this setting on the next run. This cannot be undone.`
              : "No existing rows would be deleted right now."}
          </Alert>
        )}

        <SectionLabel>Engine &amp; status</SectionLabel>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <ToggleButtonGroup
            exclusive size="small" value={form.engine} onChange={(e, v) => v && set({ engine: v })} disabled={!isBuiltIn}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontSize: 12, py: 0.25, px: 1.5 } }}
          >
            <ToggleButton value="LEGACY">Old importer</ToggleButton>
            <ToggleButton value="GENERIC">Scheduler engine</ToggleButton>
          </ToggleButtonGroup>
          <FormControlLabel
            control={<Switch size="small" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />}
            label="Profile is active" sx={{ "& .MuiTypography-root": { fontSize: 12.5 } }}
          />
        </Box>
        <Alert severity={generic ? "info" : "success"} sx={{ mt: 1.25, fontSize: 12.5 }}>
          {generic
            ? "The Scheduler engine runs this profile on its schedule using the column mapping on the Column Mapping Studio screen. The old importer is skipped, and can be switched back on here at any time."
            : "The old importer (the import code built into the system) keeps running this job exactly as before. It is only a temporary fallback and will be removed; after that every job runs on the Scheduler engine. Settings here are saved for when you switch."}
        </Alert>
        {!isBuiltIn && editing && (
          <Alert severity="info" sx={{ mt: 1, fontSize: 12.5 }}>Custom profiles always run on the Scheduler engine, and start running on their schedule once their columns are mapped.</Alert>
        )}
        {!editing && (
          <Alert severity="info" sx={{ mt: 1, fontSize: 12.5 }}>After creating the profile, map its columns on the Column Mapping Studio screen. It starts running on its schedule as soon as columns are mapped.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={saving} sx={{ ...compactButtonSx, color: "#5b6472" }}>Cancel</Button>
        <Button
          onClick={submit} disabled={saving} variant="contained" disableElevation
          startIcon={saving ? <CircularProgress size={13} color="inherit" /> : null}
          sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
        >
          {editing ? "Save changes" : "Create profile"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ card */

const InfoRow = ({ label, children }) => (
  <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
    <Typography sx={{ width: 84, flexShrink: 0, fontSize: 11, color: "#8a93a3", fontWeight: 600 }}>{label}</Typography>
    <Box sx={{ fontSize: 12, color: "#1a2233", minWidth: 0, wordBreak: "break-word" }}>{children}</Box>
  </Box>
);

const JobCard = ({ job, canManage, busy, fetchedAt, onDue, onEdit, onRun, onToggle, onDelete, onNavigate }) => {
  const st = statusStyle(job.last_status);
  const generic = job.engine === "GENERIC";
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2, borderColor: "#e3e7ee", borderLeft: `4px solid ${job.is_active ? st.bar : "#d1d5db"}`, p: 1.75,
        display: "flex", flexDirection: "column", gap: 1.25, opacity: job.is_active ? 1 : 0.75,
        transition: "box-shadow .15s ease", "&:hover": { boxShadow: "0 4px 14px rgba(16,24,40,0.08)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#1a2233" }}>{job.job_name}</Typography>
            {job.file_prefix && <Chip size="small" label={job.file_prefix} sx={{ height: 18, fontSize: 10.5, fontFamily: "monospace", backgroundColor: "#eaf2ff", color: "#0052cc" }} />}
          </Box>
          <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.25 }}>{job.description || "No description"}</Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Chip size="small" label={job.is_active ? "ACTIVE" : "PAUSED"} sx={{ height: 20, fontSize: 10, fontWeight: 700, backgroundColor: job.is_active ? "#e8f6ee" : "#f3f4f6", color: job.is_active ? "#1b7a43" : "#6b7280" }} />
            <Tooltip title={generic ? "Runs on the Scheduler engine" : "Runs on the old built-in importer (a temporary fallback until it is removed)"}>
              <Chip size="small" label={generic ? "SCHEDULER" : "OLD IMPORTER"} sx={{ height: 20, fontSize: 10, fontWeight: 700, backgroundColor: generic ? "#e6f0ff" : "#f3f4f6", color: generic ? "#0052cc" : "#5b6472" }} />
            </Tooltip>
          </Box>
          {canManage && (
            <Tooltip title={job.is_active ? "Pause this profile" : "Activate this profile"}>
              <Switch size="small" checked={Boolean(job.is_active)} onChange={() => onToggle(job)} disabled={busy} />
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 0.6, p: 1.25, borderRadius: 1.5, backgroundColor: "#f8f9fb", border: "1px solid #eef0f3" }}>
        <InfoRow label="Ingest path"><Box component="span" sx={{ fontFamily: "monospace", fontSize: 11, color: "#0b6fb3" }}>{job.source_path}</Box></InfoRow>
        <InfoRow label="Processed path"><Box component="span" sx={{ fontFamily: "monospace", fontSize: 11, color: "#4b5565" }}>{job.processed_path}</Box></InfoRow>
        <InfoRow label="Target table"><Chip size="small" label={job.target_table} sx={{ height: 19, fontSize: 11, fontFamily: "monospace", backgroundColor: "#fff", border: "1px solid #dde1e7" }} /></InfoRow>
        <InfoRow label="Load mode">{LOAD_MODES[job.load_mode]?.label || job.load_mode} · {job.validation_mode === "STRICT_ALL" ? "reject file on bad row" : "skip bad rows"}</InfoRow>
        <InfoRow label="Schedule"><Box component="span" sx={{ fontWeight: 700, color: "#b45309" }}>{scheduleText(job)}</Box></InfoRow>
        <InfoRow label="Next run">
          {!job.is_active || job.seconds_to_next === null || job.seconds_to_next === undefined ? (
            <Box component="span" sx={{ color: "#8a93a3" }}>Paused - will not run</Box>
          ) : (
            <LiveCountdown
              targetMs={fetchedAt + job.seconds_to_next * 1000}
              periodSec={job.schedule_type === "DAILY" ? 86400 : (job.every_hours || 1) * 3600}
              clock={clockText(job.next_run_at)}
              onDue={onDue}
            />
          )}
        </InfoRow>
        <InfoRow label="Keep">{keepText(job)} · {job.mapped_columns} mapped column{job.mapped_columns === 1 ? "" : "s"}</InfoRow>
      </Box>

      <Box sx={{ p: 1.25, borderRadius: 1.5, backgroundColor: st.bg }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: st.fg }}>LAST RUN</Typography>
          <StatusChip status={job.last_status} />
        </Box>
        <Box sx={{ display: "flex", gap: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 10.5, color: "#6b7280" }}>When</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{fmtDateTime(job.last_run_on)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10.5, color: "#6b7280" }}>Rows inserted</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{job.last_rows === null || job.last_rows === undefined ? "—" : Number(job.last_rows).toLocaleString("en-IN")}</Typography>
          </Box>
        </Box>
        {job.last_message && (
          <Tooltip title={job.last_message}>
            <Typography noWrap sx={{ fontSize: 11, color: "#4b5565", mt: 0.5 }}>{job.last_message}</Typography>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
        {canManage && (
          <Button size="small" startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => onEdit(job)} sx={{ ...compactButtonSx, color: "#374151" }}>Edit</Button>
        )}
        <Button size="small" startIcon={<TableChartOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => onNavigate("SchedulerColumnMapping", job)} sx={{ ...compactButtonSx, color: "#374151" }}>Mapping</Button>
        <Button size="small" startIcon={<HistoryOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => onNavigate("SchedulerRunHistory", job)} sx={{ ...compactButtonSx, color: "#374151" }}>History</Button>
        <Box sx={{ flex: 1 }} />
        {canManage && !job.built_in && (
          <Tooltip title="Delete this profile"><IconButton size="small" color="error" onClick={() => onDelete(job)}><DeleteOutlineIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
        )}
        {canManage && (
          <Button
            size="small" variant="contained" disableElevation disabled={busy}
            startIcon={busy ? <CircularProgress size={13} color="inherit" /> : <PlayArrowRoundedIcon sx={{ fontSize: 17 }} />}
            onClick={() => onRun(job)} sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {busy ? "Running..." : "Run now"}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

/* ---------------------------------------------------------------- screen */

const StatTile = ({ label, value, color = "#1a2233" }) => (
  <Paper variant="outlined" sx={{ px: 2, py: 1, borderRadius: 2, borderColor: "#e3e7ee", minWidth: 120 }}>
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#8a93a3", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</Typography>
    <Typography sx={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</Typography>
  </Paper>
);

const SchedulerJobs = () => {
  const navigate = useNavigate();
  const canManage = useSchedulerCanManage();
  const [jobs, setJobs] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [dialog, setDialog] = useState({ open: false, job: null });
  const [confirm, setConfirm] = useState(null); // { type: 'run' | 'delete', job }
  const [fetchedAt, setFetchedAt] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [j, t] = await Promise.all([getSchedulerJobs(), getSchedulerTargets()]);
      setJobs(j);
      setTargets(t);
      setFetchedAt(Date.now());
    } catch (e) {
      setLoadError(errorText(e, "Failed to load the scheduler jobs."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // When a timer reaches zero, reload shortly afterwards so the run's result appears on the card.
  const dueTimer = useRef(null);
  const handleDue = useCallback(() => {
    clearTimeout(dueTimer.current);
    dueTimer.current = setTimeout(() => load(), 20000);
  }, [load]);
  useEffect(() => () => clearTimeout(dueTimer.current), []);

  const stats = useMemo(() => ({
    total: jobs.length,
    active: jobs.filter((j) => j.is_active).length,
    generic: jobs.filter((j) => j.engine === "GENERIC").length,
    failed: jobs.filter((j) => j.last_status === "FAILED").length,
  }), [jobs]);

  const toggleActive = async (job) => {
    setBusyId(job.job_id);
    try {
      await saveSchedulerJob({ ...formFromJob(job), dup_key_columns: job.dup_key_columns, dup_prefer_column: job.dup_prefer_column, keep_days: job.keep_days, retention_date_column: job.retention_date_column, is_active: !job.is_active, userId: currentUserId() });
      toast.success(`${job.job_name} ${job.is_active ? "paused" : "activated"}.`);
      await load();
    } catch (e) {
      toast.error(errorText(e, "Could not change the status."));
    } finally {
      setBusyId(null);
    }
  };

  const runNow = async () => {
    const job = confirm.job;
    setBusyId(job.job_id);
    try {
      const res = await runSchedulerJob(job.job_id, currentUserId());
      if (res?.failures?.length) toast.warning(res.message);
      else toast.success(res?.message || "Run completed.");
    } catch (e) {
      const code = e?.response?.data?.code;
      const msg = errorText(e, "Run failed.");
      if (code === "NO_NEW_FILE" || code === "NO_FILE_FOUND") toast.info(msg);
      else toast.error(msg);
    } finally {
      setBusyId(null);
      setConfirm(null);
      load();
    }
  };

  const removeJob = async () => {
    const job = confirm.job;
    setBusyId(job.job_id);
    try {
      await deleteSchedulerJob(job.job_id);
      toast.success("Profile deleted.");
    } catch (e) {
      toast.error(errorText(e, "Could not delete the profile."));
    } finally {
      setBusyId(null);
      setConfirm(null);
      load();
    }
  };

  const goTo = (screen, job) => navigate(`/home/${screen}?job=${job.job_id}`);

  return (
    <div
      style={{
        padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px", minHeight: "calc(100vh - 90px)",
        display: "flex", flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Box>
          <SectionHeading>Scheduler Jobs</SectionHeading>
          <Typography sx={{ fontSize: 12.5, color: "#6b7280", mt: 1.5, maxWidth: 760 }}>
            Automatic file imports in one place: where each job reads its files, which table it loads, how often it runs and how long history is kept.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {!canManage && <Chip size="small" label="View only" sx={{ fontWeight: 700, fontSize: 11 }} />}
          <Button onClick={load} disabled={loading} startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} sx={{ ...compactButtonSx, color: "#374151" }}>Refresh</Button>
          {canManage && (
            <Button
              onClick={() => setDialog({ open: true, job: null })} variant="contained" disableElevation startIcon={<AddIcon sx={{ fontSize: 17 }} />}
              sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
            >
              Add ingestion profile
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <StatTile label="Profiles" value={stats.total} />
        <StatTile label="Active" value={stats.active} color="#1b7a43" />
        <StatTile label="On Scheduler engine" value={stats.generic} color="#0052cc" />
        <StatTile label="Last run failed" value={stats.failed} color={stats.failed ? "#b42323" : "#1a2233"} />
      </Box>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 12.5 }} action={<Button color="inherit" size="small" onClick={load} sx={{ textTransform: "none" }}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      {loading && !jobs.length ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={28} /></Box>
      ) : !jobs.length && !loadError ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>No ingestion profiles yet</Typography>
          <Typography sx={{ fontSize: 12.5, color: "#6b7280", mt: 0.5 }}>Run the 05_migration.sql script to create the four built-in profiles{canManage ? ", or add one above." : "."}</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 2 }}>
          {jobs.map((job) => (
            <JobCard
              key={job.job_id} job={job} canManage={canManage} busy={busyId === job.job_id} fetchedAt={fetchedAt} onDue={handleDue}
              onEdit={(j) => setDialog({ open: true, job: j })}
              onRun={(j) => setConfirm({ type: "run", job: j })}
              onToggle={toggleActive}
              onDelete={(j) => setConfirm({ type: "delete", job: j })}
              onNavigate={goTo}
            />
          ))}
        </Box>
      )}

      <JobDialog
        open={dialog.open} job={dialog.job} targets={targets}
        onClose={() => setDialog({ open: false, job: null })}
        onSaved={() => { setDialog({ open: false, job: null }); load(); }}
      />

      <ConfirmDialog
        open={confirm?.type === "run"} title={`Run “${confirm?.job?.job_name}” now?`} confirmLabel="Run now" busy={busyId !== null}
        onCancel={() => setConfirm(null)} onConfirm={runNow}
      >
        Every pending file in the ingest folder will be imported
        {confirm?.job?.engine === "GENERIC" ? " by the Scheduler engine." : " by the old importer (same as its Fetch button)."} Files are moved after a successful import.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm?.type === "delete"} title={`Delete “${confirm?.job?.job_name}”?`} confirmLabel="Delete" color="error" busy={busyId !== null}
        onCancel={() => setConfirm(null)} onConfirm={removeJob}
      >
        The profile, its column mapping and its run history are removed. Imported data is not touched.
      </ConfirmDialog>
    </div>
  );
};

export default SchedulerJobs;
