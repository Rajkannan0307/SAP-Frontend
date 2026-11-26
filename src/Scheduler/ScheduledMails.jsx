import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Switch, Tooltip, Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import LiveCountdown from "./LiveCountdown";
import MailJobPanel, { MailStatusChip } from "./MailJobPanel";
import MailRunHistory from "./MailRunHistory";
import { compactButtonSx } from "../components/MfgListScreen";
import { getScheduledMail, getScheduledMails, runScheduledMail, saveScheduledMail } from "../controller/MailSchedulerApiService";
import { currentUserId, errorText, fmtDateTime, statusStyle, useSchedulerCanManage } from "./schedulerShared";

// Scheduler > Scheduled Mails: the mails that are sent on their own every day (first one: the Daily Material Requirement mail).
// A separate screen next to Scheduler Jobs (which is for file imports and is not changed): each card shows when the mail is sent, on which days,
// how it is delivered (Testing / Live), the next run and the last run; Edit opens the settings.  Backend: Scheduler/MailScheduler.js.

const DAY_SHORT = { MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" };
const daysText = (days = []) => {
  if (days.length === 7) return "Every day";
  if (days.length === 5 && ["MON", "TUE", "WED", "THU", "FRI"].every((d) => days.includes(d))) return "Mon - Fri";
  return days.map((d) => DAY_SHORT[d]).join(", ") || "No day selected";
};

// 'yyyy-MM-dd HH:mm' (server time) -> 'HH:mm', or 'dd-MM HH:mm' when it is not today
const clockText = (nextRunAt) => {
  if (!nextRunAt) return "";
  const [d, t] = nextRunAt.split(" ");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return d === todayStr ? t : `${d.slice(8, 10)}-${d.slice(5, 7)} ${t}`;
};

const InfoRow = ({ label, children }) => (
  <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
    <Typography sx={{ width: 84, flexShrink: 0, fontSize: 11, color: "#8a93a3", fontWeight: 600 }}>{label}</Typography>
    <Box sx={{ fontSize: 12, color: "#1a2233", minWidth: 0, wordBreak: "break-word" }}>{children}</Box>
  </Box>
);

const MailCard = ({ mail, canManage, busy, fetchedAt, schedulerOff, liveAllowed, onDue, onEdit, onHistory, onRun, onToggle }) => {
  const st = statusStyle(mail.last_status);
  const live = mail.settings.mail_mode === "LIVE";
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "18px", borderColor: "#e6eaf2", borderTop: `4px solid ${mail.is_active ? st.bar : "#d1d5db"}`, p: 2.25, backgroundColor: "#fff",
        display: "flex", flexDirection: "column", gap: 1.5, opacity: mail.is_active ? 1 : 0.75, boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
        transition: "box-shadow .2s ease, transform .2s ease", "&:hover": { boxShadow: "0 10px 26px rgba(16,24,40,0.10)", transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "12px", backgroundColor: "#0066FF", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 5px 12px rgba(0,102,255,0.28)" }}>
          <MailOutlineIcon sx={{ fontSize: 21 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#1a2233" }}>{mail.mail_name}</Typography>
          <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.25 }}>{mail.description || "No description"}</Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Chip size="small" label={mail.is_active ? "ACTIVE" : "PAUSED"} sx={{ height: 20, fontSize: 10, fontWeight: 700, backgroundColor: mail.is_active ? "#e8f6ee" : "#f3f4f6", color: mail.is_active ? "#1b7a43" : "#6b7280" }} />
          {canManage && (
            <Tooltip title={mail.is_active ? "Pause this mail" : "Activate this mail"}>
              <Switch size="small" checked={mail.is_active} onChange={() => onToggle(mail)} disabled={busy} />
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 0.75, p: 1.5, borderRadius: "14px", backgroundColor: "#f6f8fc", border: "1px solid #e6eaf2" }}>
        <InfoRow label="Schedule"><Box component="span" sx={{ fontWeight: 700, color: "#b45309" }}>Daily at {mail.daily_time}</Box></InfoRow>
        <InfoRow label="Sends on">
          {daysText(mail.settings.run_days)}
          {mail.settings.skip_dates.length ? ` · skips ${mail.settings.skip_dates.length} date${mail.settings.skip_dates.length === 1 ? "" : "s"}` : ""}
        </InfoRow>
        <InfoRow label="Plants">{mail.settings.plants?.length ? mail.settings.plants.join(", ") : "All plants"}</InfoRow>
        <InfoRow label="Delivery">
          <Chip
            size="small" label={live ? (liveAllowed ? "LIVE · suppliers" : "LIVE · test addresses on this server") : "TESTING · test addresses only"}
            sx={{ height: 19, fontSize: 10.5, fontWeight: 700, backgroundColor: live ? "#e8f6ee" : "#fff1d6", color: live ? "#1b7a43" : "#9a6a00" }}
          />
        </InfoRow>
        <InfoRow label="Next run">
          {!mail.is_active || mail.seconds_to_next === null || mail.seconds_to_next === undefined ? (
            <Box component="span" sx={{ color: "#8a93a3" }}>{mail.is_active ? "No upcoming run" : "Paused - will not run"}</Box>
          ) : schedulerOff ? (
            <Tooltip title="Scheduled runs are switched off on this server (development). Use Run now to test this mail.">
              <Box component="span" sx={{ color: "#b45309", fontWeight: 600 }}>Not scheduled here (development) · use Run now</Box>
            </Tooltip>
          ) : (
            <LiveCountdown targetMs={fetchedAt + mail.seconds_to_next * 1000} periodSec={86400} clock={clockText(mail.next_run_at)} onDue={onDue} />
          )}
        </InfoRow>
      </Box>

      <Box sx={{ p: 1.5, borderRadius: "14px", backgroundColor: st.bg }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: st.fg }}>LAST RUN</Typography>
          <MailStatusChip status={mail.last_status} />
        </Box>
        <Box sx={{ display: "flex", gap: 3 }}>
          <Box>
            <Typography sx={{ fontSize: 10.5, color: "#6b7280" }}>When</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{fmtDateTime(mail.last_run_on)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 10.5, color: "#6b7280" }}>Mails sent</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{mail.last_sent === null || mail.last_sent === undefined ? "—" : Number(mail.last_sent).toLocaleString("en-IN")}</Typography>
          </Box>
        </Box>
        {mail.last_message && (
          <Tooltip title={mail.last_message}>
            <Typography noWrap sx={{ fontSize: 11, color: "#4b5565", mt: 0.5 }}>{mail.last_message}</Typography>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
        <Button size="small" startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => onEdit(mail)} sx={{ ...compactButtonSx, color: "#374151" }}>{canManage ? "Edit" : "View"}</Button>
        <Button size="small" startIcon={<HistoryOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => onHistory(mail)} sx={{ ...compactButtonSx, color: "#374151" }}>History</Button>
        <Box sx={{ flex: 1 }} />
        {canManage && (
          <Button
            size="small" variant="contained" disableElevation disabled={busy || !mail.handler_ok}
            startIcon={busy ? <CircularProgress size={13} color="inherit" /> : <PlayArrowRoundedIcon sx={{ fontSize: 17 }} />}
            onClick={() => onRun(mail)} sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {busy ? "Running..." : "Run now"}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

const StatTile = ({ label, value, color = "#1a2233" }) => (
  <Paper variant="outlined" sx={{ px: 2, py: 1, borderRadius: 2, borderColor: "#e3e7ee", minWidth: 120 }}>
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: "#8a93a3", letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</Typography>
    <Typography sx={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</Typography>
  </Paper>
);

const ScheduledMails = () => {
  const canManage = useSchedulerCanManage();
  const [info, setInfo] = useState({ mails: [], enabled: true, environment: "", live_allowed: false });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [panel, setPanel] = useState({ open: false, mailId: null });
  const [history, setHistory] = useState({ open: false, mailId: null, name: "" }); // the run log
  const [confirm, setConfirm] = useState(null); // the mail to run now
  const [fetchedAt, setFetchedAt] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setInfo(await getScheduledMails());
      setFetchedAt(Date.now());
    } catch (e) {
      setLoadError(errorText(e, "Failed to load the scheduled mails."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // when a timer reaches zero, reload shortly afterwards so the run's result appears on the card
  const dueTimer = useRef(null);
  const handleDue = useCallback(() => {
    clearTimeout(dueTimer.current);
    dueTimer.current = setTimeout(() => load(), 20000);
  }, [load]);
  useEffect(() => () => clearTimeout(dueTimer.current), []);

  const stats = useMemo(() => ({
    total: info.mails.length,
    active: info.mails.filter((m) => m.is_active).length,
    failed: info.mails.filter((m) => m.last_status === "FAILED").length,
  }), [info.mails]);

  // the on / off switch changes only that: the other settings stay as they are
  const toggleActive = async (mail) => {
    setBusyId(mail.mail_id);
    try {
      const d = await getScheduledMail(mail.mail_id);
      await saveScheduledMail(mail.mail_id, { ...d.mail.settings, daily_time: d.mail.daily_time, is_active: !mail.is_active, userId: currentUserId() });
      toast.success(`${mail.mail_name} ${mail.is_active ? "paused" : "activated"}.`);
      await load();
    } catch (e) {
      toast.error(errorText(e, "Could not change the status."));
    } finally {
      setBusyId(null);
    }
  };

  const runNow = async () => {
    const mail = confirm;
    setBusyId(mail.mail_id);
    try {
      const r = await runScheduledMail(mail.mail_id, currentUserId(), true);
      if (r.status === "FAILED") toast.error(r.message); else if (r.status === "PARTIAL") toast.warning(r.message); else toast.success(r.message);
    } catch (e) {
      toast.error(errorText(e, "The run failed."));
    } finally {
      setBusyId(null);
      setConfirm(null);
      load();
    }
  };

  return (
    <div style={{ padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px", minHeight: "calc(100vh - 90px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Box>
          <SectionHeading>Scheduled Mails</SectionHeading>
          <Typography sx={{ fontSize: 12.5, color: "#6b7280", mt: 1.5, maxWidth: 760 }}>
            Mails that are sent automatically every day: set the time, the days to send on, the dates to skip, and whether they go to the test addresses or to the suppliers.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {!canManage && <Chip size="small" label="View only" sx={{ fontWeight: 700, fontSize: 11 }} />}
          <Button onClick={load} disabled={loading} startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} sx={{ ...compactButtonSx, color: "#374151" }}>Refresh</Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <StatTile label="Scheduled mails" value={stats.total} />
        <StatTile label="Active" value={stats.active} color="#1b7a43" />
        <StatTile label="Last run failed" value={stats.failed} color={stats.failed ? "#b42323" : "#1a2233"} />
      </Box>

      {info.enabled === false && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: 12.5 }}>
          <b>Scheduled runs are OFF on this server</b> (environment: {info.environment}). Mails do not start on their own here; use <b>Run now</b> or <b>Send test</b> to try them.
        </Alert>
      )}
      {!info.live_allowed && (
        <Alert severity="info" sx={{ mb: 2, fontSize: 12.5 }}>
          This server is not production: <b>every mail goes only to the test addresses</b>, even a mail set to Live. Suppliers are mailed only from the production server.
        </Alert>
      )}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 12.5 }} action={<Button color="inherit" size="small" onClick={load} sx={{ textTransform: "none" }}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      {loading && !info.mails.length ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={28} /></Box>
      ) : !info.mails.length && !loadError ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>No scheduled mails yet</Typography>
          <Typography sx={{ fontSize: 12.5, color: "#6b7280", mt: 0.5 }}>Run the 14_migration.sql script to create the Daily Material Requirement mail.</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 2 }}>
          {info.mails.map((mail) => (
            <MailCard
              key={mail.mail_id} mail={mail} canManage={canManage} busy={busyId === mail.mail_id} fetchedAt={fetchedAt}
              schedulerOff={info.enabled === false} liveAllowed={info.live_allowed} onDue={handleDue}
              onEdit={(m) => setPanel({ open: true, mailId: m.mail_id })} onHistory={(m) => setHistory({ open: true, mailId: m.mail_id, name: m.mail_name })} onRun={setConfirm} onToggle={toggleActive}
            />
          ))}
        </Box>
      )}

      <MailRunHistory open={history.open} mailId={history.mailId} mailName={history.name} onClose={() => setHistory({ open: false, mailId: null, name: "" })} />
      <MailJobPanel open={panel.open} mailId={panel.mailId} canManage={canManage} onClose={() => setPanel({ open: false, mailId: null })} onSaved={load} />

      <Dialog open={Boolean(confirm)} onClose={busyId ? undefined : () => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 700 }}>Run “{confirm?.mail_name}” now?</DialogTitle>
        <DialogContent sx={{ fontSize: 13, color: "#374151" }}>
          {confirm?.settings.mail_mode === "LIVE"
            ? (info.live_allowed
              ? <>This sends the mail <b>to the suppliers now</b> (and their buyers in Cc), outside the schedule.</>
              : <>This server is not production, so the mail goes <b>only to the test addresses</b>.</>)
            : <>This sends the mail now, <b>only to the test addresses</b> (Testing mode).</>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} disabled={busyId !== null} sx={{ ...compactButtonSx, color: "#5b6472" }}>Cancel</Button>
          <Button onClick={runNow} disabled={busyId !== null} variant="contained" disableElevation startIcon={busyId !== null ? <CircularProgress size={13} color="inherit" /> : null} sx={compactButtonSx}>
            Run now
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ScheduledMails;
