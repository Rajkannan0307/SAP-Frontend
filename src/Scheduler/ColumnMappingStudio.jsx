import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import { compactButtonSx, compactFieldSx } from "../components/MfgListScreen";
import {
  getJobMapping, getSchedulerJobs, getTargetColumns, previewJobFile, saveJobMapping,
} from "../controller/SchedulerApiService";
import { LOAD_MODES, errorText, scheduleText, useSchedulerCanManage } from "./schedulerShared";

const KIND_LABEL = { int: "number", decimal: "decimal", date: "date", time: "time", datetime: "date/time", bit: "yes/no", text: "text" };

const blankRow = { source_type: "FILE", source_header: "", is_required: false, default_value: "", min_value: "", allowed_values: "" };

// mapping rows from the API -> editable state keyed by target column
const toState = (mapping) => {
  const s = {};
  mapping.forEach((m) => {
    s[m.target_column] = {
      source_type: m.source_type || "FILE", source_header: m.source_header || "", is_required: Boolean(m.is_required), default_value: m.default_value ?? "",
      min_value: m.min_value ?? "", allowed_values: m.allowed_values ?? "",
    };
  });
  return s;
};

const cellInput = {
  size: "small", variant: "outlined", fullWidth: true,
  sx: { "& .MuiInputBase-input": { fontSize: 12, py: "5px" }, "& .MuiOutlinedInput-root": { borderRadius: "6px", backgroundColor: "#fff" } },
};

const ColumnMappingStudio = () => {
  const canManage = useSchedulerCanManage();
  const [params, setParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(params.get("job") ? Number(params.get("job")) : "");
  const [cols, setCols] = useState([]);
  const [rows, setRows] = useState({});
  const [saved, setSaved] = useState({});
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingMap, setLoadingMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewing, setPreviewing] = useState(false);

  const job = useMemo(() => jobs.find((j) => j.job_id === jobId) || null, [jobs, jobId]);
  const mappable = useMemo(() => cols.filter((c) => !c.system), [cols]);
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved);

  useEffect(() => {
    getSchedulerJobs()
      .then((j) => {
        setJobs(j);
        if (!jobId && j.length) setJobId(j[0].job_id);
      })
      .catch((e) => setError(errorText(e, "Failed to load the profiles.")))
      .finally(() => setLoadingJobs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMapping = useCallback(async (j) => {
    if (!j) return;
    setLoadingMap(true);
    setError("");
    setPreview(null);
    setPreviewError("");
    try {
      const [c, m] = await Promise.all([getTargetColumns(j.target_table), getJobMapping(j.job_id)]);
      const state = toState(m);
      setCols(c);
      setRows(state);
      setSaved(state);
    } catch (e) {
      setCols([]);
      setRows({});
      setSaved({});
      setError(errorText(e, "Failed to load the column mapping."));
    } finally {
      setLoadingMap(false);
    }
  }, []);

  useEffect(() => { loadMapping(job); }, [job, loadMapping]);

  const selectJob = (id) => {
    if (dirty && !window.confirm("You have unsaved mapping changes. Switch profile and discard them?")) return;
    setJobId(id);
    setParams({ job: String(id) }, { replace: true });
  };

  const setCell = (col, patch) => setRows((r) => ({ ...r, [col]: { ...blankRow, ...(r[col] || {}), ...patch } }));

  const isMapped = (r) => Boolean(r) && (r.source_type === "IMPORT_TIME" || Boolean(String(r.source_header || "").trim()));
  const mappedCount = Object.values(rows).filter(isMapped).length;

  const dupKeys = useMemo(() => {
    if (!job || job.load_mode !== "INSERT_ONLY") return new Set();
    const list = (job.dup_key_columns || "").split(",").map((s) => s.trim()).filter(Boolean);
    return new Set(list.length ? list : mappable.map((c) => c.name));
  }, [job, mappable]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = Object.entries(rows)
        .filter(([, r]) => isMapped(r))
        .map(([target_column, r]) => ({
          target_column, source_type: r.source_type, source_header: r.source_type === "IMPORT_TIME" ? "" : r.source_header.trim(), is_required: r.is_required,
          default_value: r.default_value === "" ? null : r.default_value, min_value: r.min_value === "" ? null : r.min_value,
          allowed_values: r.allowed_values === "" ? null : r.allowed_values,
        }));
      const res = await saveJobMapping(job.job_id, payload);
      toast.success(res.message || "Mapping saved.");
      await loadMapping(job);
      const j = await getSchedulerJobs();
      setJobs(j);
    } catch (e) {
      setError(errorText(e, "Failed to save the mapping."));
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async () => {
    setPreviewing(true);
    setPreview(null);
    setPreviewError("");
    try {
      setPreview(await previewJobFile(job.job_id));
    } catch (e) {
      setPreviewError(errorText(e, "Could not read a file."));
    } finally {
      setPreviewing(false);
    }
  };

  // header present in the previewed file? (uses what is typed now, not only what is saved)
  const headerState = (col) => {
    if (rows[col]?.source_type === "IMPORT_TIME") return null;
    const h = String(rows[col]?.source_header || "").trim();
    if (!preview || !h) return null;
    return preview.headers.includes(h);
  };
  const usedHeaders = useMemo(() => new Set(Object.values(rows).filter((r) => r.source_type !== "IMPORT_TIME").map((r) => String(r.source_header || "").trim()).filter(Boolean)), [rows]);

  return (
    <div style={{ padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px", minHeight: "calc(100vh - 90px)" }}>
      <Box sx={{ mb: 2 }}>
        <SectionHeading>Column Mapping Studio</SectionHeading>
        <Typography sx={{ fontSize: 12.5, color: "#6b7280", mt: 1.5 }}>
          Match each column of the database table to the header used in the SAP file. Rules (required, minimum, allowed values) are checked while importing.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12.5 }} onClose={() => setError("")}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, alignItems: "start" }}>
        {/* ------------------------------------------------ profile picker */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "#e3e7ee" }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 1 }}>Select ingestion profile</Typography>
          <TextField
            select fullWidth size="small" value={loadingJobs ? "" : jobId} onChange={(e) => selectJob(Number(e.target.value))}
            sx={compactFieldSx(200)} label="Profile" InputLabelProps={{ shrink: true }}
          >
            {jobs.map((j) => <MenuItem key={j.job_id} value={j.job_id} sx={{ fontSize: 12 }}>{j.job_name}</MenuItem>)}
          </TextField>
          {job && (
            <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1.5, backgroundColor: "#eaf4fb", border: "1px solid #cfe6f6", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0.6, fontSize: 12 }}>
              <div><b>Target table:</b> <span style={{ fontFamily: "monospace" }}>{job.target_table}</span></div>
              <div><b>File prefix:</b> {job.file_prefix || "(any file)"}</div>
              <div><b>Load mode:</b> {LOAD_MODES[job.load_mode]?.label}</div>
              <div><b>Schedule:</b> {scheduleText(job)}</div>
              <div><b>Engine:</b> {job.engine === "GENERIC" ? "Scheduler engine" : "Old importer"}</div>
              <div><b>Mapped:</b> {job.mapped_columns} column(s) saved</div>
            </Box>
          )}
          {job && job.engine === "LEGACY" && (
            <Alert severity="info" sx={{ mt: 1.5, fontSize: 11.5 }}>
              This job still runs on the old importer, so changes here only take effect after you switch it to the Scheduler engine on the Scheduler Jobs screen.
            </Alert>
          )}
          {job && job.engine === "GENERIC" && (
            <Alert severity="warning" sx={{ mt: 1.5, fontSize: 11.5 }}>This job runs on the Scheduler engine: saved changes apply from its next run.</Alert>
          )}
        </Paper>

        {/* ------------------------------------------------ mapping table */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "#e3e7ee", minWidth: 0 }}>
          {!job ? (
            <Box sx={{ py: 6, textAlign: "center", color: "#6b7280", fontSize: 13 }}>{loadingJobs ? <CircularProgress size={24} /> : "Select a profile to start."}</Box>
          ) : (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                    Target database table: <span style={{ color: "#0b6fb3", fontFamily: "monospace" }}>{job.target_table}</span>
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.25 }}>
                    {mappedCount} of {mappable.length} columns mapped · leave the header empty to skip a column
                    {dirty && <b style={{ color: "#b45309" }}> · unsaved changes</b>}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    onClick={runPreview} disabled={previewing || loadingMap} variant="outlined" size="small"
                    startIcon={previewing ? <CircularProgress size={13} /> : <FactCheckOutlinedIcon sx={{ fontSize: 16 }} />} sx={compactButtonSx}
                  >
                    Check against next file
                  </Button>
                  {canManage && (
                    <>
                      <Button onClick={() => setRows(saved)} disabled={!dirty || saving} size="small" startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />} sx={{ ...compactButtonSx, color: "#374151" }}>Reset</Button>
                      <Button
                        onClick={save} disabled={!dirty || saving} variant="contained" disableElevation size="small"
                        startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <SaveOutlinedIcon sx={{ fontSize: 16 }} />}
                        sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
                      >
                        Save column mapping
                      </Button>
                    </>
                  )}
                </Box>
              </Box>

              {previewError && <Alert severity="warning" sx={{ mb: 1.5, fontSize: 12 }} onClose={() => setPreviewError("")}>{previewError}</Alert>}
              {preview && (
                <Alert severity="info" sx={{ mb: 1.5, fontSize: 12 }} onClose={() => setPreview(null)}>
                  Read <b>{preview.fileName}</b> ({preview.totalRows.toLocaleString("en-IN")} rows, {preview.pendingFiles} pending file(s)); the file was not changed.
                  {" "}Green tick = header found, red = not in the file.
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                    {preview.headers.filter(Boolean).map((h) => (
                      <Chip key={h} size="small" label={h} sx={{ height: 19, fontSize: 10.5, backgroundColor: usedHeaders.has(h) ? "#e8f6ee" : "#f3f4f6", color: usedHeaders.has(h) ? "#1b7a43" : "#6b7280" }} />
                    ))}
                  </Box>
                </Alert>
              )}

              <TableContainer sx={{ maxHeight: "calc(100vh - 330px)", minHeight: 320, border: "1px solid #eef0f3", borderRadius: 1.5 }}>
                <Table size="small" stickyHeader sx={{ "& .MuiTableCell-root": { fontSize: 12, py: 0.6, px: 1 } }}>
                  <TableHead>
                    <TableRow sx={{ "& th": { backgroundColor: "#d0dcf5", fontWeight: 700, fontSize: 11 } }}>
                      <TableCell sx={{ minWidth: 190 }}>Database column</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Value from</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>File header (Excel / CSV)</TableCell>
                      <TableCell align="center" sx={{ width: 70 }}>Required</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Default</TableCell>
                      <TableCell sx={{ minWidth: 90 }}>Minimum</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Allowed values</TableCell>
                      <TableCell align="center" sx={{ width: 50 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingMap && (
                      <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={22} /></TableCell></TableRow>
                    )}
                    {!loadingMap && mappable.map((c) => {
                      const r = rows[c.name] || blankRow;
                      const importTime = r.source_type === "IMPORT_TIME";
                      const mapped = isMapped(r);
                      const canImportTime = ["date", "datetime", "time", "text"].includes(c.kind);
                      const found = headerState(c.name);
                      const numeric = c.kind === "int" || c.kind === "decimal";
                      return (
                        <TableRow key={c.name} hover sx={{ backgroundColor: mapped ? "#fff" : "#fafbfc" }}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 700, fontFamily: "monospace" }}>{c.name}</Typography>
                              <Chip size="small" label={KIND_LABEL[c.kind] || c.kind} sx={{ height: 17, fontSize: 10, backgroundColor: "#eef0f4" }} />
                              {importTime && (
                                <Tooltip title="Not read from the file: set to the date and time of the import.">
                                  <Chip size="small" label="AUTO" sx={{ height: 17, fontSize: 9.5, fontWeight: 700, backgroundColor: "#e8f6ee", color: "#1b7a43" }} />
                                </Tooltip>
                              )}
                              {!c.nullable && !importTime && (
                                <Tooltip title="NOT NULL - the file must provide this value (or a default)"><Chip size="small" label="NOT NULL" sx={{ height: 17, fontSize: 9.5, backgroundColor: "#fff1e6", color: "#b45309" }} /></Tooltip>
                              )}
                              {dupKeys.has(c.name) && mapped && (
                                <Tooltip title="Part of the duplicate check"><Chip size="small" label="KEY" sx={{ height: 17, fontSize: 9.5, backgroundColor: "#e6f0ff", color: "#0052cc" }} /></Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {canImportTime ? (
                              <TextField
                                {...cellInput} select value={r.source_type} disabled={!canManage}
                                onChange={(e) => setCell(c.name, { source_type: e.target.value })}
                              >
                                <MenuItem value="FILE" sx={{ fontSize: 12 }}>File header</MenuItem>
                                <MenuItem value="IMPORT_TIME" sx={{ fontSize: 12 }}>Import date &amp; time</MenuItem>
                              </TextField>
                            ) : <Typography sx={{ fontSize: 11.5, color: "#6b7280" }}>File header</Typography>}
                          </TableCell>
                          <TableCell>
                            <TextField
                              {...cellInput} value={importTime ? "" : r.source_header} disabled={!canManage || importTime}
                              placeholder={importTime ? "Automatic: import date & time" : "e.g. Material"}
                              onChange={(e) => setCell(c.name, { source_header: e.target.value })}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox size="small" checked={Boolean(r.is_required)} disabled={!canManage || !mapped || importTime} onChange={(e) => setCell(c.name, { is_required: e.target.checked })} />
                          </TableCell>
                          <TableCell>
                            <TextField {...cellInput} value={r.default_value} disabled={!canManage || !mapped || importTime} placeholder="—" onChange={(e) => setCell(c.name, { default_value: e.target.value })} />
                          </TableCell>
                          <TableCell>
                            {numeric ? (
                              <TextField {...cellInput} type="number" value={r.min_value} disabled={!canManage || !mapped} placeholder="—" onChange={(e) => setCell(c.name, { min_value: e.target.value })} />
                            ) : <Typography sx={{ fontSize: 11, color: "#c0c6d0" }}>n/a</Typography>}
                          </TableCell>
                          <TableCell>
                            <TextField {...cellInput} value={r.allowed_values} disabled={!canManage || !mapped || importTime} placeholder="a,b,c" onChange={(e) => setCell(c.name, { allowed_values: e.target.value })} />
                          </TableCell>
                          <TableCell align="center">
                            {found === true && <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#2e9e5b" }} />}
                            {found === false && <Tooltip title="This header is not in the file"><ErrorRoundedIcon sx={{ fontSize: 18, color: "#d64545" }} /></Tooltip>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {preview && preview.sampleRows.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 0.75 }}>First {preview.sampleRows.length} rows of the file</Typography>
                  <TableContainer sx={{ border: "1px solid #eef0f3", borderRadius: 1.5, maxHeight: 220 }}>
                    <Table size="small" stickyHeader sx={{ "& .MuiTableCell-root": { fontSize: 11, py: 0.4, px: 1, whiteSpace: "nowrap" } }}>
                      <TableHead>
                        <TableRow sx={{ "& th": { backgroundColor: "#f1f4fa", fontWeight: 700 } }}>
                          {preview.headers.filter(Boolean).map((h) => <TableCell key={h}>{h}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.sampleRows.map((row, i) => (
                          <TableRow key={i}>{preview.headers.filter(Boolean).map((h) => <TableCell key={h}>{String(row[h] ?? "")}</TableCell>)}</TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    </div>
  );
};

export default ColumnMappingStudio;
