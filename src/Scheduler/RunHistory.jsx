import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Switch, TextField, Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton } from "@mui/x-data-grid";
import SectionHeading from "../components/Header";
import { compactButtonSx, compactFieldSx } from "../components/MfgListScreen";
import { getSchedulerJobs, getSchedulerRuns } from "../controller/SchedulerApiService";
import { STATUS_STYLES, StatusChip, errorText, fmtServerTime } from "./schedulerShared";

const num = (v) => (v === null || v === undefined ? "—" : Number(v).toLocaleString("en-IN"));

const durationText = (start, end) => {
  if (!start || !end) return "—";
  const ms = new Date(end.replace(" ", "T")) - new Date(start.replace(" ", "T"));
  if (Number.isNaN(ms) || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};

const Toolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
  </GridToolbarContainer>
);

const DetailRow = ({ label, value }) => (
  <Box sx={{ display: "flex", gap: 1.5, py: 0.4 }}>
    <Typography sx={{ width: 120, flexShrink: 0, fontSize: 12, color: "#8a93a3", fontWeight: 600 }}>{label}</Typography>
    <Typography sx={{ fontSize: 12.5, color: "#1a2233", wordBreak: "break-word" }} component="div">{value}</Typography>
  </Box>
);

const RunHistory = () => {
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(params.get("job") || "");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(false);
  const [detail, setDetail] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const filtersRef = useRef({});
  filtersRef.current = { jobId, status, from, to };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const f = filtersRef.current;
      setRows(await getSchedulerRuns({ jobId: f.jobId || undefined, status: f.status || undefined, from: f.from || undefined, to: f.to || undefined, limit: 500 }));
    } catch (e) {
      setError(errorText(e, "Failed to load the run history."));
      if (!silent) setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { getSchedulerJobs().then(setJobs).catch(() => setJobs([])); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [auto, load]);

  const columns = useMemo(() => [
    { field: "started_on", headerName: "Started", width: 135, renderCell: (p) => fmtServerTime(p.value) },
    { field: "job_name", headerName: "Profile", flex: 1, minWidth: 190 },
    {
      field: "engine", headerName: "Engine", width: 105,
      renderCell: (p) => (
        <Chip size="small" label={p.value === "GENERIC" ? "Scheduler" : "Old importer"} sx={{ height: 19, fontSize: 10, fontWeight: 700, backgroundColor: p.value === "GENERIC" ? "#e6f0ff" : "#f3f4f6", color: p.value === "GENERIC" ? "#0052cc" : "#5b6472" }} />
      ),
    },
    { field: "triggered_by", headerName: "Triggered by", width: 105 },
    { field: "status", headerName: "Status", width: 105, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: "files_processed", headerName: "Files", width: 62, type: "number", align: "right", headerAlign: "right", renderCell: (p) => num(p.value) },
    { field: "rows_total", headerName: "Rows", width: 75, type: "number", align: "right", headerAlign: "right", renderCell: (p) => num(p.value) },
    { field: "rows_inserted", headerName: "Inserted", width: 82, type: "number", align: "right", headerAlign: "right", renderCell: (p) => <b style={{ color: "#1b7a43" }}>{num(p.value)}</b> },
    { field: "rows_skipped", headerName: "Skipped", width: 75, type: "number", align: "right", headerAlign: "right", renderCell: (p) => num(p.value) },
    { field: "rows_error", headerName: "Errors", width: 68, type: "number", align: "right", headerAlign: "right", renderCell: (p) => <span style={{ color: p.value > 0 ? "#b42323" : undefined, fontWeight: p.value > 0 ? 700 : 400 }}>{num(p.value)}</span> },
    { field: "rows_deleted", headerName: "Deleted", width: 72, type: "number", align: "right", headerAlign: "right", renderCell: (p) => num(p.value) },
    { field: "duration", headerName: "Took", width: 70, sortable: false, valueGetter: (v, row) => durationText(row.started_on, row.finished_on) },
    { field: "message", headerName: "Message", flex: 2, minWidth: 260 },
  ], []);

  const applyFilters = () => { setPaginationModel((m) => ({ ...m, page: 0 })); load(); };

  return (
    <div style={{ padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px", display: "flex", flexDirection: "column", height: "calc(100vh - 90px)" }}>
      <Box sx={{ mb: 2 }}>
        <SectionHeading>Run History</SectionHeading>
        <Typography sx={{ fontSize: 12.5, color: "#6b7280", mt: 1.5 }}>Every automatic and manual import run, with how many rows were read, inserted, skipped or rejected.</Typography>
      </Box>

      <div
        style={{
          backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px", marginBottom: 12, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField
            select size="small" label="Profile" value={jobId} sx={compactFieldSx(230)} InputLabelProps={{ shrink: true }}
            onChange={(e) => { setJobId(e.target.value); setParams(e.target.value ? { job: String(e.target.value) } : {}, { replace: true }); }}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="" sx={{ fontSize: 11.5, fontWeight: 600 }}>All profiles</MenuItem>
            {jobs.map((j) => <MenuItem key={j.job_id} value={String(j.job_id)} sx={{ fontSize: 11.5 }}>{j.job_name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={compactFieldSx(130)} InputLabelProps={{ shrink: true }} SelectProps={{ displayEmpty: true }}>
            <MenuItem value="" sx={{ fontSize: 11.5, fontWeight: 600 }}>All</MenuItem>
            {Object.entries(STATUS_STYLES).filter(([k]) => k !== "NONE").map(([k, v]) => <MenuItem key={k} value={k} sx={{ fontSize: 11.5 }}>{v.label}</MenuItem>)}
          </TextField>
          <TextField type="date" size="small" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={compactFieldSx(140)} />
          <TextField type="date" size="small" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={compactFieldSx(140)} />
          <Button
            onClick={applyFilters} disabled={loading} variant="contained" disableElevation
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <RefreshIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Apply"}
          </Button>
        </div>
        <FormControlLabel
          control={<Switch size="small" checked={auto} onChange={(e) => setAuto(e.target.checked)} />}
          label="Auto-refresh (30 s)" sx={{ "& .MuiTypography-root": { fontSize: 12 }, mr: 0 }}
        />
      </div>

      {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12.5 }} action={<Button color="inherit" size="small" onClick={() => load()} sx={{ textTransform: "none" }}>Retry</Button>}>{error}</Alert>}

      <div style={{ flexGrow: 1, minHeight: 0, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 3px rgba(16,24,40,0.05)", overflow: "hidden" }}>
        <DataGrid
          rows={rows} columns={columns} getRowId={(r) => r.run_id} loading={loading}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick disableColumnMenu columnHeaderHeight={36} rowHeight={38} slots={{ toolbar: Toolbar }}
          onRowClick={(p) => setDetail(p.row)}
          localeText={{ noRowsLabel: error ? "Could not load data." : "No runs found for the selected filters." }}
          sx={{
            height: "100%", border: "none", "& .MuiDataGrid-row": { cursor: "pointer", backgroundColor: "#fff" },
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": { color: "#333", fontSize: "11px", padding: "0 8px", borderRight: "none" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaders": { position: "sticky", top: 0, zIndex: 2 },
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#d0dcf5", color: "#000", padding: "0 8px" },
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10.5px", fontWeight: "bold", color: "#000" },
            "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#fafbfc" },
            "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
            "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 28 },
            "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
            "& .MuiDataGrid-footerContainer": { minHeight: 34 },
            "& .MuiTablePagination-root": { overflow: "visible" },
            "& .MuiTablePagination-toolbar": { minHeight: "34px !important", height: 34, paddingLeft: 8, paddingRight: 4 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 11, marginTop: 0, marginBottom: 0 },
            "& .MuiTablePagination-select": { fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset" },
            "& .MuiTablePagination-actions .MuiIconButton-root": { padding: 4, width: 24, height: 24 },
          }}
        />
      </div>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 15, fontWeight: 700 }}>
          Run #{detail?.run_id} {detail && <StatusChip status={detail.status} />}
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <>
              <DetailRow label="Profile" value={detail.job_name} />
              <DetailRow label="Engine" value={detail.engine === "GENERIC" ? "Scheduler engine" : "Old importer"} />
              <DetailRow label="Triggered by" value={detail.triggered_by} />
              <DetailRow label="Started" value={fmtServerTime(detail.started_on)} />
              <DetailRow label="Finished" value={detail.finished_on ? fmtServerTime(detail.finished_on) : "—"} />
              <DetailRow label="Took" value={durationText(detail.started_on, detail.finished_on)} />
              <DetailRow label="Files" value={num(detail.files_processed)} />
              <DetailRow label="Rows read" value={num(detail.rows_total)} />
              <DetailRow label="Inserted" value={num(detail.rows_inserted)} />
              <DetailRow label="Skipped" value={num(detail.rows_skipped)} />
              <DetailRow label="Error rows" value={num(detail.rows_error)} />
              <DetailRow label="Old rows deleted" value={num(detail.rows_deleted)} />
              <DetailRow label="Message" value={detail.message || "—"} />
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)} sx={compactButtonSx}>Close</Button></DialogActions>
      </Dialog>
    </div>
  );
};

export default RunHistory;
