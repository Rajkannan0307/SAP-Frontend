import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TablePagination, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import { compactButtonSx } from "../components/MfgListScreen";
import { getScheduledMailRun, getScheduledMailRuns } from "../controller/MailSchedulerApiService";
import { errorText, fmtServerTime } from "./schedulerShared";
import { MailStatusChip, ResultTable } from "./MailJobPanel";

// Scheduled Mails > History: every run of the mail, newest first, with its result (Success / Partial / Failed / Nothing to send).
// Click a run to see its suppliers: which mail was sent, which failed (with the reason) and which were skipped.  Backend: Scheduler/MailScheduler.js.

const KIND_LABEL = { schedule: "Scheduled", run: "Run now", test: "Test" };

const MailRunHistory = ({ open, mailId, mailName, onClose }) => {
  const [runs, setRuns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-based, as TablePagination counts
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | PROBLEM
  const [openRun, setOpenRun] = useState(null); // the run whose suppliers are shown
  const [log, setLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  // one page of the runs (the server pages and filters, so the totals are right)
  const load = useCallback(async (p = page, size = pageSize, flt = filter) => {
    setLoading(true);
    setError("");
    try {
      const d = await getScheduledMailRuns(mailId, { page: p + 1, pageSize: size, problem: flt === "PROBLEM" });
      setRuns(d.runs || []);
      setTotal(d.total || 0);
      setPage((d.page || 1) - 1);
    } catch (e) {
      setError(errorText(e, "Failed to load the run log."));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailId, page, pageSize, filter]);

  useEffect(() => {
    if (open && mailId) { setOpenRun(null); setLog([]); setFilter("ALL"); setPage(0); setTotal(0); load(0, pageSize, "ALL"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mailId]);

  const show = async (run) => {
    setOpenRun(run);
    setLog([]);
    setLogLoading(true);
    try {
      setLog((await getScheduledMailRun(mailId, run.run_id)).log || []);
    } catch (e) {
      setError(errorText(e, "Failed to load the run."));
    } finally {
      setLogLoading(false);
    }
  };

  const shown = runs;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper" PaperProps={{ sx: { borderRadius: "20px", backgroundImage: "none" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, fontSize: 17, fontWeight: 800, py: 2, px: 3, background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)", borderBottom: "1px solid #e6eaf2" }}>
        <Box sx={{ width: 38, height: 38, borderRadius: "12px", backgroundColor: "#0066FF", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 5px 12px rgba(0,102,255,0.28)" }}>
          <HistoryOutlinedIcon sx={{ fontSize: 21 }} />
        </Box>
        Run history{mailName ? ` · ${mailName}` : ""}
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup
          exclusive size="small" value={filter} onChange={(e, v) => { if (v) { setFilter(v); setOpenRun(null); load(0, pageSize, v); } }}
          sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontSize: 12, py: 0.2, px: 1.5 } }}
        >
          <ToggleButton value="ALL">All runs</ToggleButton>
          <ToggleButton value="PROBLEM">Failed / partial only</ToggleButton>
        </ToggleButtonGroup>
        <Button onClick={() => load(page, pageSize, filter)} disabled={loading} startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} sx={{ ...compactButtonSx, color: "#374151" }}>Refresh</Button>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 19 }} /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1.5 }}>
        {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: 12.5 }}>{error}</Alert>}
        {loading && !runs.length ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={26} /></Box>
        ) : !shown.length ? (
          <Typography sx={{ fontSize: 13, color: "#8a93a3", py: 3, textAlign: "center" }}>
            {filter === "PROBLEM" ? "No failed or partial run." : "This mail has not run yet. Use Run now or Send test on the card to create the first entry."}
          </Typography>
        ) : (
          <Box sx={{ border: "1px solid #e3e7ee", borderRadius: 1.5, overflow: "hidden" }}>
            <Box sx={{ maxHeight: 300, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Run", "Started", "How", "By", "Result", "Sent", "Failed", "Skipped", "Message"].map((h, i) => (
                      <th key={h} style={{ position: "sticky", top: 0, background: "#d0dcf5", padding: "7px 10px", textAlign: i >= 5 && i <= 7 ? "right" : "left", fontSize: 11, fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => {
                    const active = openRun?.run_id === r.run_id;
                    return (
                      <tr
                        key={r.run_id} onClick={() => show(r)}
                        style={{ borderTop: "1px solid #eef0f3", cursor: "pointer", backgroundColor: active ? "#eef4ff" : undefined }}
                      >
                        <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>#{r.run_id}</td>
                        <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{fmtServerTime(r.started_on)}</td>
                        <td style={{ padding: "6px 10px" }}>{KIND_LABEL[r.run_kind] || r.run_kind || "—"}</td>
                        <td style={{ padding: "6px 10px" }}>{r.triggered_by}</td>
                        <td style={{ padding: "6px 10px" }}><MailStatusChip status={r.status} /></td>
                        <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#1b7a43" }}>{r.sent ?? "—"}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: r.failed ? "#b42323" : undefined }}>{r.failed ?? "—"}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right" }}>{r.skipped ?? "—"}</td>
                        <td style={{ padding: "6px 10px", color: "#6b7280" }}>{r.message}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
            <TablePagination
              component="div" count={total} page={page} rowsPerPage={pageSize} rowsPerPageOptions={[10, 20, 50]}
              onPageChange={(e, p) => { setOpenRun(null); load(p, pageSize, filter); }}
              onRowsPerPageChange={(e) => { const n = Number(e.target.value); setPageSize(n); setOpenRun(null); load(0, n, filter); }}
              labelRowsPerPage="Runs per page"
              sx={{ borderTop: "1px solid #eef0f3", minHeight: 40, "& .MuiTablePagination-toolbar": { minHeight: 40 }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12, m: 0 } }}
            />
          </Box>
        )}

        {openRun && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Run #{openRun.run_id}: suppliers</Typography>
              <Chip size="small" label={`${openRun.sent ?? 0} sent`} sx={{ height: 20, fontSize: 10.5, fontWeight: 700, backgroundColor: "#e8f6ee", color: "#1b7a43" }} />
              {Boolean(openRun.failed) && <Chip size="small" label={`${openRun.failed} failed`} sx={{ height: 20, fontSize: 10.5, fontWeight: 700, backgroundColor: "#fdeaea", color: "#b42323" }} />}
              <Chip size="small" label={`${openRun.skipped ?? 0} skipped`} sx={{ height: 20, fontSize: 10.5, fontWeight: 700, backgroundColor: "#eef0f4", color: "#5b6472" }} />
            </Box>
            {logLoading ? <CircularProgress size={20} /> : <ResultTable rows={log} />}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ ...compactButtonSx, color: "#5b6472" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MailRunHistory;
