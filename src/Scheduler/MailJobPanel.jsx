import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, ButtonBase, Chip, CircularProgress, Dialog, DialogActions, DialogContent, IconButton, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import MailIdsInput, { parseMailIds } from "../components/MailIdsInput";
import { compactButtonSx } from "../components/MfgListScreen";
import { getScheduledMail, previewScheduledMail, saveScheduledMail, testScheduledMail } from "../controller/MailSchedulerApiService";
import { currentUserId, errorText, fmtDateTime, fmtServerTime, statusStyle } from "./schedulerShared";

// Scheduled Mails > Edit: when the mail is sent (time, days, dates to skip), which plants it covers, how it is delivered (Testing = only the test
// addresses | Live = the suppliers and buyers), the test recipients, and Preview / Send test now to try it.
// Backend: Scheduler/MailScheduler.js (sql/14_migration.sql).

const DAY_LABEL = { MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" };
const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const KIND_LABEL = { schedule: "Scheduled", run: "Run now", test: "Test" };

const BLUE = "#0066FF";
const INK = "#1a2233";
const MUTED = "#6b7280";
const LINE = "#e6eaf2";

const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "#fff", "& fieldset": { borderColor: "#dde3ee" }, "&:hover fieldset": { borderColor: "#9db8ff" }, "&.Mui-focused fieldset": { borderColor: BLUE } },
  "& .MuiInputBase-input": { fontSize: 13 },
};
const fieldProps = { size: "small", fullWidth: true, InputLabelProps: { shrink: true }, sx: fieldSx };
const primaryBtn = { ...compactButtonSx, height: 34, borderRadius: "10px", px: 2, backgroundColor: BLUE, "&:hover": { backgroundColor: "#0052cc" } };
const ghostBtn = { ...compactButtonSx, height: 34, borderRadius: "10px", px: 1.75, border: "1px solid #dde3ee", color: "#374151", backgroundColor: "#fff", "&:hover": { backgroundColor: "#f3f6fc", borderColor: "#c4d2ee" } };

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dmy = (ymd) => `${ymd.slice(8, 10)}-${ymd.slice(5, 7)}-${ymd.slice(0, 4)}`;

// "2026-11-26 10:30" -> "Thu 26-11-2026, 10:30"
const nextText = (s) => {
  if (!s) return "";
  const [d, t] = s.split(" ");
  const name = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${d}T00:00:00`).getDay()];
  return `${name} ${dmy(d)}, ${t}`;
};

// a run status; a mail that sent nothing is "Nothing to send"
export const MailStatusChip = ({ status }) => {
  const s = statusStyle(status);
  return (
    <Chip size="small" label={status === "SKIPPED" ? "Nothing to send" : s.label} sx={{ backgroundColor: s.bg, color: s.fg, fontWeight: 700, fontSize: 10.5, height: 21, borderRadius: "11px", "& .MuiChip-label": { px: 1.1 } }} />
  );
};

/* ------------------------------------------------------------------ building blocks */

// a white card with an icon tile, a title and an optional hint
const Card = ({ icon, title, hint, right, children, sx }) => (
  <Box sx={{ backgroundColor: "#fff", border: `1px solid ${LINE}`, borderRadius: "16px", p: 2.25, boxShadow: "0 1px 2px rgba(16,24,40,0.04)", ...sx }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: hint ? 0.5 : 1.75 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: "9px", backgroundColor: "#eef4ff", color: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: INK, flex: 1 }}>{title}</Typography>
      {right}
    </Box>
    {hint && <Typography sx={{ fontSize: 12, color: MUTED, mb: 1.75, ml: "42px" }}>{hint}</Typography>}
    {children}
  </Box>
);

const FieldLabel = ({ children, icon }) => (
  <Typography sx={{ fontSize: 11.5, color: MUTED, fontWeight: 600, mb: 0.75, display: "flex", alignItems: "center", gap: 0.5 }}>{icon}{children}</Typography>
);

const DayPill = ({ label, on, disabled, onClick }) => (
  <ButtonBase
    onClick={onClick} disabled={disabled}
    sx={{
      width: 46, height: 38, borderRadius: "11px", fontSize: 12.5, fontWeight: 700, transition: "all .15s ease",
      border: `1.5px solid ${on ? BLUE : "#dde3ee"}`, backgroundColor: on ? BLUE : "#fff", color: on ? "#fff" : "#4b5565",
      boxShadow: on ? "0 3px 8px rgba(0,102,255,0.28)" : "none",
      "&:hover": { backgroundColor: on ? "#0052cc" : "#f3f6fc" }, "&.Mui-disabled": { opacity: 0.6 },
    }}
  >
    {label}
  </ButtonBase>
);

const QuickLink = ({ children, onClick, disabled }) => (
  <ButtonBase
    onClick={onClick} disabled={disabled}
    sx={{ fontSize: 11.5, fontWeight: 700, color: BLUE, px: 1.1, py: 0.35, borderRadius: "8px", "&:hover": { backgroundColor: "#eef4ff" }, "&.Mui-disabled": { opacity: 0.5 } }}
  >
    {children}
  </ButtonBase>
);

// Testing / Live as two selectable tiles
const ModeTile = ({ on, disabled, tone, icon, title, text, onClick }) => (
  <ButtonBase
    onClick={onClick} disabled={disabled}
    sx={{
      display: "flex", alignItems: "flex-start", gap: 1.25, textAlign: "left", p: 1.5, borderRadius: "14px", transition: "all .15s ease", width: "100%",
      border: `1.6px solid ${on ? tone.border : "#e0e6f0"}`, backgroundColor: on ? tone.bg : "#fff",
      boxShadow: on ? `0 4px 12px ${tone.shadow}` : "none", "&:hover": { borderColor: tone.border },
    }}
  >
    <Box sx={{ width: 34, height: 34, borderRadius: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: on ? tone.icon : "#f1f4f9", color: on ? "#fff" : "#7b8494" }}>{icon}</Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: on ? tone.text : INK }}>{title}</Typography>
      <Typography sx={{ fontSize: 11.5, color: MUTED, lineHeight: 1.4, mt: 0.25 }}>{text}</Typography>
    </Box>
    {on && <CheckCircleRoundedIcon sx={{ fontSize: 19, color: tone.icon }} />}
  </ButtonBase>
);

const RESULT_STYLE = {
  sent: { bg: "#e8f6ee", fg: "#1b7a43", label: "Sent" },
  failed: { bg: "#fdeaea", fg: "#b42323", label: "Failed" },
  skipped: { bg: "#eef0f4", fg: "#5b6472", label: "Skipped" },
  "dry run": { bg: "#e6f0ff", fg: "#0052cc", label: "Will be mailed" },
};

const TH = { position: "sticky", top: 0, background: "#f3f6fc", padding: "8px 12px", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "#5b6472", borderBottom: `1px solid ${LINE}` };

// the suppliers of a run / preview: name, plants, parts and the result
export const ResultTable = ({ rows }) => (
  <Box sx={{ border: `1px solid ${LINE}`, borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff" }}>
    <Box sx={{ maxHeight: 280, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr>
            {["Supplier", "Plants", "Parts", "Result"].map((h, i) => <th key={h} style={{ ...TH, textAlign: i === 2 ? "right" : "left" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const st = RESULT_STYLE[r.status] || RESULT_STYLE.skipped;
            const name = r.recipient_name ?? r.vendor_name;
            const code = r.recipient_code ?? r.vendor_code;
            const plants = r.detail ? String(r.detail).replace(/^Plant /, "") : (r.plants ?? r.plant ?? "");
            const parts = r.items ?? r.parts;
            const why = r.message ?? r.reason;
            return (
              <tr key={`${code}-${i}`} style={{ borderTop: i ? `1px solid ${LINE}` : "none" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: INK }}>{String(name || "").trim() || "—"}{code ? <span style={{ color: "#9aa3b2", fontWeight: 500 }}> · {code}</span> : null}</td>
                <td style={{ padding: "8px 12px", color: "#4b5565" }}>{plants}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", color: "#4b5565" }}>{parts ?? ""}</td>
                <td style={{ padding: "8px 12px" }}>
                  <Chip size="small" label={st.label} sx={{ height: 20, fontSize: 10.5, fontWeight: 700, borderRadius: "10px", backgroundColor: st.bg, color: st.fg }} />
                  {why ? <span style={{ color: MUTED, marginLeft: 8 }}>{why}</span> : null}
                </td>
              </tr>
            );
          })}
          {!rows.length && <tr><td colSpan={4} style={{ padding: 18, textAlign: "center", color: "#9aa3b2" }}>Nothing to show.</td></tr>}
        </tbody>
      </table>
    </Box>
  </Box>
);

const Stat = ({ label, value, color, bg }) => (
  <Box sx={{ px: 1.5, py: 0.75, borderRadius: "12px", backgroundColor: bg, minWidth: 82 }}>
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color, opacity: 0.85, letterSpacing: 0.3 }}>{label}</Typography>
    <Typography sx={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1.15 }}>{value ?? "—"}</Typography>
  </Box>
);

const formFrom = (m) => ({
  daily_time: m.daily_time || "09:00",
  is_active: m.is_active,
  mail_mode: m.settings.mail_mode,
  test_to: m.settings.test_to.join("; "),
  from_address: m.settings.from_address || "",
  run_days: m.settings.run_days,
  skip_dates: m.settings.skip_dates,
  plants: m.settings.plants || [],
});

/* ------------------------------------------------------------------ the panel */

const MailJobPanel = ({ open, mailId, canManage, onClose, onSaved }) => {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skipDraft, setSkipDraft] = useState("");
  const [result, setResult] = useState(null); // { title, rows, message }
  const [working, setWorking] = useState(""); // 'preview' | 'test'
  const [confirm, setConfirm] = useState(null); // 'live' | 'test'

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await getScheduledMail(mailId);
      setData(d);
      setForm(formFrom(d.mail));
    } catch (e) {
      setError(errorText(e, "Failed to load the scheduled mail."));
    } finally {
      setLoading(false);
    }
  }, [mailId]);

  useEffect(() => {
    if (open && mailId) { setResult(null); setSkipDraft(""); load(); }
  }, [open, mailId, load]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const dirty = useMemo(() => Boolean(data && form && JSON.stringify(form) !== JSON.stringify(formFrom(data.mail))), [data, form]);
  const readOnly = !canManage;
  const testAddresses = form ? parseMailIds(form.test_to) : [];
  const toggleDay = (d) => set({ run_days: ALL_DAYS.filter((x) => (x === d ? !form.run_days.includes(d) : form.run_days.includes(x))) });

  const addSkip = () => {
    if (!skipDraft) return;
    if (form.skip_dates.includes(skipDraft)) { setSkipDraft(""); return; }
    set({ skip_dates: [...form.skip_dates, skipDraft].sort() });
    setSkipDraft("");
  };

  const save = async (confirmLive = false) => {
    setSaving(true);
    setError("");
    try {
      const res = await saveScheduledMail(mailId, {
        daily_time: form.daily_time, is_active: form.is_active, mail_mode: form.mail_mode, test_to: parseMailIds(form.test_to), from_address: form.from_address,
        run_days: form.run_days, skip_dates: form.skip_dates, plants: form.plants, userId: currentUserId(), confirm_live: confirmLive,
      });
      toast.success(res.message || "Saved.");
      setConfirm(null);
      await load();
      onSaved?.();
    } catch (e) {
      if (e?.response?.data?.code === "CONFIRM_LIVE") setConfirm("live");
      else { setConfirm(null); setError(errorText(e, "Failed to save.")); }
    } finally {
      setSaving(false);
    }
  };

  const submit = () => {
    if (form.mail_mode === "LIVE" && data.mail.settings.mail_mode !== "LIVE") { setConfirm("live"); return; }
    save(false);
  };

  const preview = async () => {
    setWorking("preview");
    setResult(null);
    try {
      const r = await previewScheduledMail(mailId);
      setResult({ title: "Preview: nothing was sent", rows: r.results || [], message: r.message });
    } catch (e) {
      toast.error(errorText(e, "The preview failed."));
    } finally {
      setWorking("");
    }
  };

  const sendTest = async () => {
    setConfirm(null);
    setWorking("test");
    setResult(null);
    try {
      const r = await testScheduledMail(mailId, currentUserId());
      setResult({ title: "Test run: sent to the test addresses only", rows: r.results || [], message: r.message });
      if (r.status === "FAILED") toast.error(r.message); else toast.success(r.message);
      await load();
      onSaved?.();
    } catch (e) {
      toast.error(errorText(e, "The test run failed."));
    } finally {
      setWorking("");
    }
  };

  const live = form?.mail_mode === "LIVE";
  const m = data?.mail;
  const busy = saving || Boolean(working);
  const lastRun = data?.recent_runs?.[0];

  return (
    <>
      <Dialog
        open={open} onClose={busy ? undefined : onClose} maxWidth="lg" fullWidth scroll="paper"
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden", backgroundColor: "#f6f8fc", backgroundImage: "none" } }}
      >
        {/* ------------------------------------------------ header */}
        <Box sx={{ px: 3, py: 2.25, background: "linear-gradient(135deg, #ffffff 0%, #eef4ff 100%)", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 1.75 }}>
          <Box sx={{ width: 46, height: 46, borderRadius: "14px", backgroundColor: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(0,102,255,0.30)" }}>
            <MailOutlineIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.25 }}>{m?.mail_name || "Scheduled mail"}</Typography>
            <Typography sx={{ fontSize: 12.5, color: MUTED, mt: 0.25 }} noWrap>{m?.description || ""}</Typography>
          </Box>
          {form && (
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Chip size="small" label={form.is_active ? "ACTIVE" : "PAUSED"} sx={{ height: 24, fontSize: 10.5, fontWeight: 800, borderRadius: "12px", backgroundColor: form.is_active ? "#e8f6ee" : "#f1f2f5", color: form.is_active ? "#1b7a43" : "#6b7280" }} />
              <Chip size="small" label={live ? "LIVE" : "TESTING"} sx={{ height: 24, fontSize: 10.5, fontWeight: 800, borderRadius: "12px", backgroundColor: live ? "#e8f6ee" : "#fff1d6", color: live ? "#1b7a43" : "#9a6a00" }} />
              <Chip size="small" label={m?.mail_code} sx={{ height: 24, fontFamily: "monospace", fontSize: 10.5, borderRadius: "12px", backgroundColor: "#fff", border: `1px solid ${LINE}` }} />
            </Box>
          )}
          <IconButton size="small" onClick={onClose} disabled={busy} sx={{ ml: 0.5 }}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          {loading && !form ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={28} /></Box>
          ) : !form ? (
            <Alert severity="error" sx={{ fontSize: 12.5, borderRadius: "12px" }}>{error || "Could not load the scheduled mail."}</Alert>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12.5, borderRadius: "12px" }}>{error}</Alert>}
              {readOnly && <Alert severity="info" sx={{ mb: 2, fontSize: 12.5, borderRadius: "12px" }}>View only: you cannot change this mail.</Alert>}
              {data.enabled === false && (
                <Alert severity="warning" sx={{ mb: 2, fontSize: 12.5, borderRadius: "12px" }}>
                  Scheduled runs are <b>off on this server</b> (environment: {data.environment}), so the timer will not send this mail here. You can still use <b>Preview</b> and <b>Send test now</b>.
                </Alert>
              )}

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.08fr 1fr" }, gap: 2, alignItems: "start" }}>
                {/* ============================================ left column */}
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Card icon={<ScheduleOutlinedIcon sx={{ fontSize: 18 }} />} title="Schedule" hint="When the mail is sent. It goes out once a day.">
                    <Box sx={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 2.5, alignItems: "start" }}>
                      <Box>
                        <FieldLabel>Send at</FieldLabel>
                        <TextField {...fieldProps} type="time" value={form.daily_time} disabled={readOnly} onChange={(e) => set({ daily_time: e.target.value })} inputProps={{ step: 60 }} InputLabelProps={undefined} />
                        <Typography sx={{ fontSize: 11, color: "#9aa3b2", mt: 0.5 }}>Server time</Typography>
                      </Box>
                      <Box>
                        <FieldLabel>Send on</FieldLabel>
                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                          {ALL_DAYS.map((d) => <DayPill key={d} label={DAY_LABEL[d]} on={form.run_days.includes(d)} disabled={readOnly} onClick={() => toggleDay(d)} />)}
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5, mt: 0.75 }}>
                          <QuickLink disabled={readOnly} onClick={() => set({ run_days: ALL_DAYS })}>Every day</QuickLink>
                          <QuickLink disabled={readOnly} onClick={() => set({ run_days: WEEKDAYS })}>Mon - Fri</QuickLink>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2.25 }}>
                      <FieldLabel icon={<EventBusyOutlinedIcon sx={{ fontSize: 14 }} />}>Do not send on these dates (holidays, shutdowns)</FieldLabel>
                      {!readOnly && (
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                          <TextField size="small" type="date" value={skipDraft} onChange={(e) => setSkipDraft(e.target.value)} inputProps={{ min: todayYmd() }} sx={{ ...fieldSx, width: 180 }} />
                          <Button onClick={addSkip} disabled={!skipDraft} sx={ghostBtn}>Add date</Button>
                        </Box>
                      )}
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        {form.skip_dates.length === 0 && <Typography sx={{ fontSize: 12, color: "#9aa3b2" }}>No dates are skipped.</Typography>}
                        {form.skip_dates.map((d) => (
                          <Chip
                            key={d} size="small" label={dmy(d)} onDelete={readOnly ? undefined : () => set({ skip_dates: form.skip_dates.filter((x) => x !== d) })}
                            sx={{ fontWeight: 700, borderRadius: "10px", backgroundColor: d < todayYmd() ? "#f3f4f6" : "#fff4e5", color: d < todayYmd() ? "#9aa3b2" : "#9a6a00" }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2.25, p: 1.5, borderRadius: "12px", backgroundColor: "#f6f8fc", border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Switch size="small" checked={form.is_active} disabled={readOnly} onChange={(e) => set({ is_active: e.target.checked })} />
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{form.is_active ? "Active" : "Paused: not sent"}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#4b5565" }}>
                        <TimerOutlinedIcon sx={{ fontSize: 17, color: BLUE }} />
                        <Typography sx={{ fontSize: 12.5 }}>
                          {m.next_run_at && !dirty ? <>Next run <b>{nextText(m.next_run_at)}</b></> : dirty ? "Save to see the next run" : "No upcoming run"}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>

                  <Card
                    icon={<FactoryOutlinedIcon sx={{ fontSize: 18 }} />} title="Plants" hint="Which plants' parts go into the mail."
                    right={<Chip size="small" label={form.plants.length ? `${form.plants.length} selected` : "All plants"} sx={{ height: 22, fontSize: 10.5, fontWeight: 800, borderRadius: "11px", backgroundColor: form.plants.length ? "#eaf2ff" : "#f1f4f9", color: form.plants.length ? "#0052cc" : "#5b6472" }} />}
                  >
                    <Autocomplete
                      multiple size="small" disableCloseOnSelect disabled={readOnly} options={data.plant_options || []}
                      value={(data.plant_options || []).filter((p) => form.plants.includes(p.code))}
                      getOptionLabel={(p) => (p.name ? `${p.code} - ${p.name}` : p.code)} isOptionEqualToValue={(a, b) => a.code === b.code}
                      onChange={(e, list) => set({ plants: list.map((p) => p.code) })}
                      renderInput={(params) => <TextField {...params} placeholder={form.plants.length ? "" : "All plants (click to choose)"} />}
                      sx={fieldSx}
                    />
                    <Typography sx={{ fontSize: 11.5, color: MUTED, mt: 0.75 }}>
                      {form.plants.length === 0
                        ? "Every active plant is included: each supplier gets one mail with its parts of all the plants it supplies."
                        : `Only ${form.plants.length === 1 ? "this plant is" : "these plants are"} included. A supplier with nothing in ${form.plants.length === 1 ? "it" : "them"} gets no mail.`}
                    </Typography>
                  </Card>
                </Box>

                {/* ============================================ right column */}
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Card icon={<AlternateEmailIcon sx={{ fontSize: 18 }} />} title="Delivery" hint="Who receives the mail.">
                    <Box sx={{ display: "grid", gap: 1.25 }}>
                      <ModeTile
                        on={!live} disabled={readOnly} icon={<ScienceOutlinedIcon sx={{ fontSize: 19 }} />} title="Testing" onClick={() => set({ mail_mode: "TESTING" })}
                        text="Every mail goes only to the test addresses, with [TEST] in the subject. Suppliers and buyers receive nothing."
                        tone={{ border: "#e3a008", bg: "#fffaf0", icon: "#e3a008", text: "#8a5a00", shadow: "rgba(227,160,8,0.18)" }}
                      />
                      <ModeTile
                        on={live} disabled={readOnly} icon={<RocketLaunchOutlinedIcon sx={{ fontSize: 19 }} />} title="Live" onClick={() => set({ mail_mode: "LIVE" })}
                        text="Each supplier gets its mail (To), with its buyer and the supplier's own CC addresses in Cc."
                        tone={{ border: "#2e9e5b", bg: "#f2fbf6", icon: "#2e9e5b", text: "#1b7a43", shadow: "rgba(46,158,91,0.18)" }}
                      />
                    </Box>
                    {live && (
                      <Alert severity={data.live_allowed ? "warning" : "info"} sx={{ mt: 1.5, fontSize: 12, borderRadius: "12px" }}>
                        {data.live_allowed
                          ? "Only suppliers whose Kanban mail is Yes on the Vendor Master are mailed."
                          : <>This server is <b>not production</b> (environment: {data.environment}), so every mail still goes only to the test addresses.</>}
                      </Alert>
                    )}
                    <Box sx={{ display: "grid", gap: 1.75, mt: 2 }}>
                      <MailIdsInput label="Test recipients" value={form.test_to} onChange={(v) => set({ test_to: v })} disabled={readOnly} />
                      <TextField
                        {...fieldProps} label="Sender (From)" placeholder="noreplyrml@ranegroup.com" value={form.from_address} disabled={readOnly}
                        onChange={(e) => set({ from_address: e.target.value })} helperText="Empty = the default sender. Empty test recipients use the common MAIL_TEST_TO."
                      />
                    </Box>
                  </Card>

                  <Card icon={<SendOutlinedIcon sx={{ fontSize: 18 }} />} title="Try it" hint="Check the mail before the real run. Uses the saved settings.">
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Tooltip title={dirty ? "Save your changes first." : "List which suppliers would get a mail. Nothing is sent."}>
                        <span>
                          <Button onClick={preview} disabled={busy || dirty || !canManage} startIcon={working === "preview" ? <CircularProgress size={13} /> : <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />} sx={ghostBtn}>
                            Preview
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title={dirty ? "Save your changes first." : "Run it now and send every mail to the test addresses only."}>
                        <span>
                          <Button onClick={() => setConfirm("test")} disabled={busy || dirty || !canManage} startIcon={working === "test" ? <CircularProgress size={13} /> : <SendOutlinedIcon sx={{ fontSize: 17 }} />} sx={ghostBtn}>
                            Send test now
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                    <Typography sx={{ fontSize: 11.5, color: "#9aa3b2", mt: 1 }}>Preview sends nothing. Send test goes only to the test addresses.</Typography>
                    {result && (
                      <Box sx={{ mt: 1.75 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: INK }}>{result.title}</Typography>
                        <Typography sx={{ fontSize: 12, color: MUTED, mb: 1 }}>{result.message}</Typography>
                        <ResultTable rows={result.rows} />
                      </Box>
                    )}
                  </Card>
                </Box>
              </Box>

              {/* ============================================ activity */}
              <Card sx={{ mt: 2 }} icon={<HistoryOutlinedIcon sx={{ fontSize: 18 }} />} title="Last run" hint={m.last_run_on ? undefined : "It has not run yet."}>
                {m.last_run_on && (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
                      <Box>
                        <MailStatusChip status={m.last_status} />
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: INK, mt: 0.75 }}>{fmtDateTime(m.last_run_on)}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: MUTED }}>{m.last_message}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }} />
                      {lastRun && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Stat label="SENT" value={lastRun.sent} color="#1b7a43" bg="#eaf7ef" />
                          <Stat label="FAILED" value={lastRun.failed} color={lastRun.failed ? "#b42323" : "#6b7280"} bg={lastRun.failed ? "#fdeeee" : "#f3f4f6"} />
                          <Stat label="SKIPPED" value={lastRun.skipped} color="#5b6472" bg="#f1f3f7" />
                        </Box>
                      )}
                    </Box>
                    {data.last_log.length > 0 && <ResultTable rows={data.last_log} />}
                  </>
                )}
                {data.recent_runs.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <FieldLabel>Recent runs</FieldLabel>
                    <Box sx={{ border: `1px solid ${LINE}`, borderRadius: "12px", overflow: "hidden", backgroundColor: "#fff" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                        <tbody>
                          {data.recent_runs.map((r, i) => (
                            <tr key={r.run_id} style={{ borderTop: i ? `1px solid ${LINE}` : "none" }}>
                              <td style={{ padding: "7px 12px", whiteSpace: "nowrap", fontWeight: 600, color: INK }}>{fmtServerTime(r.started_on)}</td>
                              <td style={{ padding: "7px 12px", color: "#4b5565" }}>{KIND_LABEL[r.run_kind] || r.run_kind}</td>
                              <td style={{ padding: "7px 12px", color: "#4b5565" }}>{r.triggered_by}</td>
                              <td style={{ padding: "7px 12px" }}><MailStatusChip status={r.status} /></td>
                              <td style={{ padding: "7px 12px", color: MUTED }}>{r.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                )}
              </Card>
            </>
          )}
        </DialogContent>

        {/* ------------------------------------------------ footer */}
        <DialogActions sx={{ px: 3, py: 1.75, backgroundColor: "#fff", borderTop: `1px solid ${LINE}`, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {dirty && <><Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#e3a008" }} /><Typography sx={{ fontSize: 12, color: "#8a5a00", fontWeight: 600 }}>Unsaved changes</Typography></>}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} disabled={busy} sx={{ ...ghostBtn, border: "none", backgroundColor: "transparent" }}>{dirty ? "Cancel" : "Close"}</Button>
            {canManage && (
              <Button
                onClick={submit} disabled={saving || !dirty || !form} variant="contained" disableElevation
                startIcon={saving ? <CircularProgress size={13} color="inherit" /> : null} sx={primaryBtn}
              >
                Save changes
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* switching to Live / sending a test: the user confirms */}
      <Dialog open={confirm === "live"} onClose={saving ? undefined : () => setConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: "12px", backgroundColor: "#e8f6ee", color: "#2e9e5b", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}><RocketLaunchOutlinedIcon /></Box>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: INK }}>Switch to Live?</Typography>
          <Typography sx={{ fontSize: 13, color: "#4b5565", mt: 0.75 }}>
            From the next scheduled run, the mails go to the <b>suppliers</b> (and their buyers in Cc), not only to the test addresses.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2.5 }}>
            <Button onClick={() => setConfirm(null)} disabled={saving} sx={{ ...ghostBtn, border: "none", backgroundColor: "transparent" }}>Cancel</Button>
            <Button onClick={() => save(true)} disabled={saving} variant="contained" disableElevation startIcon={saving ? <CircularProgress size={13} color="inherit" /> : null} sx={{ ...primaryBtn, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}>
              Yes, save as Live
            </Button>
          </Box>
        </Box>
      </Dialog>
      <Dialog open={confirm === "test"} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: "12px", backgroundColor: "#eef4ff", color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}><SendOutlinedIcon /></Box>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: INK }}>Send a test now?</Typography>
          <Typography sx={{ fontSize: 13, color: "#4b5565", mt: 0.75 }}>
            Every supplier mail is built and sent <b>only to the test addresses</b> ({(testAddresses.length ? testAddresses : ["the common MAIL_TEST_TO addresses"]).join(", ")}). Suppliers and buyers receive nothing.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2.5 }}>
            <Button onClick={() => setConfirm(null)} sx={{ ...ghostBtn, border: "none", backgroundColor: "transparent" }}>Cancel</Button>
            <Button onClick={sendTest} variant="contained" disableElevation sx={primaryBtn}>Send test</Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default MailJobPanel;
