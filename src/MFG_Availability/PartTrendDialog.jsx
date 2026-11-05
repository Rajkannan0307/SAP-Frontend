import React, { useEffect, useMemo, useState } from "react";
import { Button, CircularProgress, Dialog, Grow, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfoTip from "../components/InfoTip";
import { GetMfgProductionPartTrendApi } from "../controller/MfgProductionDailyPlanApiService";

// 6-Month Plan vs Actual of ONE FG part (opened from the part number in the Prod Status table of the MFG Daily Production Plan).
// The last six COMPLETED months: Monthly Plan and Actual are the same numbers Prod Status uses (backend: getPartTrend); Achievement % = Actual / Plan x 100.
//   85% and above = green | 75% to under 85% = yellow | under 75% = red | no plan in the month = "-" (grey)
// "Previous 6 months" / "Next 6 months" page through the history (up to 8 blocks = 4 years back); the dialog opens on the last 6 completed months.
// The chart is plain SVG (no chart library): bars for Plan and Actual (left scale), the Achievement % line (right scale).

// Motion: the dialog grows in, the tiles / table rows fade up one after another, the bars grow from the baseline, the line draws itself, the dots pop in,
// the hover highlight glides from month to month and the totals count up. Everything is off for "reduce motion" (the final picture is shown at once).
const MOTION_CSS = `
@keyframes ptdFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes ptdFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ptdGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes ptdDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ptdPop { 0% { transform: scale(0); opacity: 0; } 65% { transform: scale(1.3); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: no-preference) {
  .ptd-fade { animation: ptdFadeUp .5s cubic-bezier(.22,1,.36,1) both; }
  .ptd-row { animation: ptdFade .4s ease-out both; }
  .ptd-late { animation: ptdFade .4s ease-out .75s both; }
  .ptd-bar { transform-box: fill-box; transform-origin: 50% 100%; animation: ptdGrow .8s cubic-bezier(.22,1,.36,1) both; }
  .ptd-line { stroke-dasharray: 1; animation: ptdDraw 1s cubic-bezier(.4,0,.2,1) .35s both; }
  .ptd-dot { transform-box: fill-box; transform-origin: center; animation: ptdPop .55s cubic-bezier(.34,1.56,.64,1) both; }
}`;

// a number that counts up from 0 to its value (ease-out), for the tiles
const useCountUp = (target, ms = 850) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const goal = Number(target) || 0;
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || goal === 0) { setValue(goal); return undefined; }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      setValue(goal * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (m) => { const [y, mo] = String(m).split("-"); return `${MONTHS[Number(mo) - 1] || mo} ${String(y).slice(2)}`; };
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("en-IN");

const achievement = (plan, actual) => (Number(plan) > 0 ? Math.round((Number(actual) / Number(plan)) * 1000) / 10 : null);
const LEVELS = {
  good: { dot: "#0ca30c", bg: "#e3f4e6", fg: "#2e7d32", text: "85% and above" },
  warn: { dot: "#fab219", bg: "#fff4d6", fg: "#8a6500", text: "75% to under 85%" },
  bad: { dot: "#d03b3b", bg: "#fde8e8", fg: "#c62828", text: "under 75%" },
  none: { dot: "#b6bac3", bg: "#f1f5f9", fg: "#94a3b8", text: "" },
};
const PLAN_COLOR = "#2a78d6"; // the Plan bar: dark blue
const ACTUAL_DEFAULT = "#0ca30c"; // Actual bar of a month without a plan: nothing was planned, so what was made is not short of the plan = green
const actualColor = (pct) => (pct === null ? ACTUAL_DEFAULT : LEVELS[levelOf(pct)].dot);
const levelOf = (pct) => (pct === null ? "none" : pct >= 85 ? "good" : pct >= 75 ? "warn" : "bad");

const Chip = ({ pct, large = false, shown = null }) => {
  const lv = LEVELS[levelOf(pct)];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: large ? "1px 11px" : "1px 9px", borderRadius: 999, fontSize: large ? 13 : 11, fontWeight: 700, backgroundColor: lv.bg, color: lv.fg }}>
      <span style={{ width: large ? 8 : 7, height: large ? 8 : 7, borderRadius: "50%", backgroundColor: lv.dot }} />
      {pct === null ? "-" : `${(shown ?? pct).toFixed(1)}%`}
    </span>
  );
};

// a rounded top scale: 4 intervals, the step from 1 / 2 / 2.5 / 5 x 10^k
const niceScale = (max) => {
  const top = Math.max(Number(max) || 0, 1);
  const raw = top / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || raw;
  return { step, max: step * 4 };
};
// axis labels in the Indian units of the rest of the app: 12k, 1.5 L (lakh), 2.6 Cr (crore)
const kfmt = (v) => {
  const r = (x) => Math.round(x * 10) / 10;
  if (v >= 1e7) return `${r(v / 1e7)} Cr`;
  if (v >= 1e5) return `${r(v / 1e5)} L`;
  if (v >= 1e3) return `${r(v / 1e3)}k`;
  return String(Math.round(v));
};

const TrendChart = ({ rows }) => {
  const [hov, setHov] = useState(null);
  const [shown, setShown] = useState(0); // the month of the tooltip / highlight (kept while they fade out)
  const hover = (i) => { setHov(i); setShown(i); };
  const W = 748; const H = 230; const L = 66; const R = 46; const T = 14; const B = 30;
  const pw = W - L - R; const ph = H - T - B;
  // One month far above the others (e.g. a plan row typed with a wrong Ends) would flatten every other bar: the quantity scale is then cut
  // at the next highest value, the tall bar is drawn to the top with a break mark, and its real value is in the hover and the table.
  const values = rows.flatMap((r) => [r.plan, r.actual]).sort((x, y) => y - x);
  const cut = values.length > 1 && values[1] > 0 && values[0] > 6 * values[1];
  const qty = niceScale(cut ? values[1] : Math.max(values[0], 1));
  const pctMax = Math.max(...rows.map((r) => r.pct ?? 0), 0);
  const maxPct = pctMax <= 120 ? 120 : pctMax <= 160 ? 160 : 200; // 120 -> labels every 20, 160 -> every 40, 200 -> every 50
  const pctStep = maxPct / (maxPct === 120 ? 6 : 4);
  const pctCut = pctMax > maxPct;
  const yQ = (v) => T + ph - (Math.min(v, qty.max) / qty.max) * ph;
  const yP = (v) => T + ph - (Math.min(v, maxPct) / maxPct) * ph;
  const barH = (v) => (v > 0 ? Math.max(3, T + ph - yQ(v)) : 0); // a small bar stays visible
  const gw = pw / rows.length;
  const bw = Math.min(22, gw * 0.28);
  const cx = (i) => L + gw * i + gw / 2;
  // The line: solid between months that follow each other (both have a plan); across a month without a plan (no Achievement %) a faint dashed
  // bridge joins the two months around it, so the trend reads as one line while that month still has no dot.
  const pieces = [];
  const bridges = [];
  let cur = [];
  let prev = null;
  rows.forEach((r, i) => {
    if (r.pct === null) return;
    const p = { i, x: cx(i), y: yP(r.pct) };
    if (prev && i - prev.i > 1) {
      bridges.push([prev, p]);
      if (cur.length > 1) pieces.push(cur);
      cur = [];
    }
    cur.push([p.x, p.y]);
    prev = p;
  });
  if (cur.length > 1) pieces.push(cur);
  const label = `Plan, actual and achievement percentage for ${rows.map((r) => `${monthLabel(r.month)} ${r.pct === null ? "no plan" : `${r.pct.toFixed(1)}%`}`).join(", ")}`;
  const tall = (v) => cut && v > qty.max;
  const breakMark = (x, w) => (
    <g className="ptd-late" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
      <line x1={x - 1} x2={x + w + 1} y1={T + 9} y2={T + 5} />
      <line x1={x - 1} x2={x + w + 1} y1={T + 14} y2={T + 10} />
    </g>
  );
  const h = rows[shown] || rows[0];
  const leftPct = (cx(shown) / W) * 100;
  return (
    <div style={{ position: "relative" }} onMouseLeave={() => setHov(null)}>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{label}</span>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true" style={{ display: "block" }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const v = qty.step * i;
          return (
            <g key={i}>
              <line x1={L} x2={W - R} y1={yQ(v)} y2={yQ(v)} stroke="#e7eaf0" strokeWidth="1" />
              <text x={L - 7} y={yQ(v) + 3.5} textAnchor="end" fontSize="10.5" fill="#8a93a3">{kfmt(v)}</text>
            </g>
          );
        })}
        {Array.from({ length: Math.round(maxPct / pctStep) + 1 }, (_, i) => i * pctStep).map((p) => (
          <text key={p} x={W - R + 7} y={yP(p) + 3.5} fontSize="10.5" fill="#8a93a3">{p}%</text>
        ))}
        <rect x={L} y={T} width={gw} height={ph} fill="#eef4ff" style={{ transform: `translateX(${gw * shown}px)`, opacity: hov === null ? 0 : 1, transition: "transform .24s cubic-bezier(.4,0,.2,1), opacity .2s ease" }} />
        {[
          { v: 85, line: "#0ca30c", text: "#2e7d32", below: false }, // only the green 85% line (the 75% yellow / 70% red lines are hidden; add them here to bring them back)
        ].map((g) => (
          <g key={g.v}>
            <line x1={L} x2={W - R} y1={yP(g.v)} y2={yP(g.v)} stroke={g.line} strokeWidth="1" strokeDasharray="4 4" opacity="0.8" />
            <text x={W - R - 4} y={yP(g.v) + (g.below ? 11 : -4)} textAnchor="end" fontSize="10" fontWeight="600" fill={g.text}>{g.v}%</text>
          </g>
        ))}
        <text x={11} y={T + ph / 2} transform={`rotate(-90 11 ${T + ph / 2})`} textAnchor="middle" fontSize="10.5" fill="#8a93a3">Quantity</text>
        <text x={W - 9} y={T + ph / 2} transform={`rotate(90 ${W - 9} ${T + ph / 2})`} textAnchor="middle" fontSize="10.5" fill="#8a93a3">Achievement %</text>
        {rows.map((r, i) => (
          <g key={r.month}>
            <rect className="ptd-bar" style={{ animationDelay: `${i * 70}ms` }} x={cx(i) - bw - 1.5} y={T + ph - barH(r.plan)} width={bw} height={barH(r.plan)} rx="3" fill={PLAN_COLOR} />
            <rect className="ptd-bar" style={{ animationDelay: `${i * 70 + 90}ms` }} x={cx(i) + 1.5} y={T + ph - barH(r.actual)} width={bw} height={barH(r.actual)} rx="3" fill={actualColor(r.pct)} />
            {tall(r.plan) && breakMark(cx(i) - bw - 1.5, bw)}
            {tall(r.actual) && breakMark(cx(i) + 1.5, bw)}
            <text x={cx(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6b7280">{monthLabel(r.month)}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={T + ph} y2={T + ph} stroke="#c9d0dc" strokeWidth="1" />
        {bridges.map(([a, b]) => (
          <line key={`bridge-${a.i}-${b.i}`} className="ptd-late" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#aab0bb" strokeWidth="1.6" strokeDasharray="4 4" strokeLinecap="round" />
        ))}
        {pieces.map((p, i) => (p.length > 1 ? <path key={i} className="ptd-line" pathLength="1" d={p.map((q, k) => `${k ? "L" : "M"}${q[0]} ${q[1]}`).join(" ")} fill="none" stroke="#6b7280" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /> : null))}
        {rows.map((r, i) => (r.pct === null ? null : (
          <g key={r.month} style={{ transform: `translate(${cx(i)}px, ${yP(r.pct)}px) scale(${hov === i ? 1.3 : 1})`, transition: "transform .2s cubic-bezier(.34,1.56,.64,1)" }}>
            <circle className="ptd-dot" style={{ animationDelay: `${550 + i * 110}ms` }} cx="0" cy="0" r="5.5" fill={LEVELS[levelOf(r.pct)].dot} stroke="#fff" strokeWidth="2" />
            {r.pct > maxPct && <path className="ptd-late" d="M-4.5 -9 L0 -15 L4.5 -9 Z" fill={LEVELS[levelOf(r.pct)].dot} />}
          </g>
        )))}
        {rows.map((r, i) => {
          if (r.pct === null) return null;
          const y = yP(r.pct);
          const lowAbove = y - 11 < T + 8; // a dot at the very top gets its number under it
          return (
            <text
              key={`pct-${r.month}`}
              className="ptd-late"
              x={cx(i)}
              y={lowAbove ? y + 19 : y - 11}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="700"
              fill={LEVELS[levelOf(r.pct)].fg}
              stroke="#fff"
              strokeWidth="3"
              paintOrder="stroke"
              style={{ pointerEvents: "none" }}
            >
              {r.pct.toFixed(1)}%
            </text>
          );
        })}
        {rows.map((r, i) => (
          <rect key={`hit-${r.month}`} x={L + gw * i} y={T} width={gw} height={ph + B} fill="transparent" style={{ cursor: "default" }} onMouseEnter={() => hover(i)} onMouseMove={() => hover(i)} />
        ))}
      </svg>
      {(
        <div
          style={{
            position: "absolute", top: 6, left: `${leftPct}%`, transform: shown === 0 ? "translateX(-15%)" : shown === rows.length - 1 ? "translateX(-85%)" : "translateX(-50%)",
            opacity: hov === null ? 0 : 1, transition: "left .22s cubic-bezier(.4,0,.2,1), opacity .18s ease, transform .22s cubic-bezier(.4,0,.2,1)",
            pointerEvents: "none", backgroundColor: "#fff", border: "1px solid #d5dcea", borderRadius: 8, boxShadow: "0 6px 18px rgba(16,24,40,0.14)", padding: "7px 11px", fontSize: 11.5, color: "#1a2233", whiteSpace: "nowrap", zIndex: 2,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 3 }}>{monthLabel(h.month)}</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}><span style={{ color: "#6b7280" }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 5, backgroundColor: PLAN_COLOR }} />Plan</span><b>{fmt(h.plan)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}><span style={{ color: "#6b7280" }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 5, backgroundColor: actualColor(h.pct) }} />Actual</span><b>{fmt(h.actual)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginTop: 2 }}><span style={{ color: "#6b7280" }}>Achievement</span><Chip pct={h.pct} /></div>
        </div>
      )}
      {pctCut && (
        <div style={{ fontSize: 10.5, color: "#8a6500", marginTop: 2 }}>
          The % scale stops at {maxPct}%: {rows.filter((r) => r.pct > maxPct).map((r) => `${monthLabel(r.month)} (${r.pct.toFixed(1)}%)`).join(", ")} is above it and is drawn at the top edge with an arrow. Hover the month for the real value.
        </div>
      )}
      {cut && (
        <div style={{ fontSize: 10.5, color: "#8a6500", marginTop: 2 }}>
          The quantity scale is cut: {rows.filter((r) => tall(r.plan) || tall(r.actual)).map((r) => monthLabel(r.month)).join(", ")} is far above the other months (check the Production Plan row of that month), so the other bars stay readable. Hover a month for its real numbers.
        </div>
      )}
    </div>
  );
};

// plant = plant code, part = the Prod Status row { fg_part_no, fg_part_desc, Line_Name }; the dialog is open while part is set
const PartTrendDialog = ({ plant, part, onClose }) => {
  const [state, setState] = useState({ loading: false, error: "", data: null });
  const [offset, setOffset] = useState(0); // 0 = the last 6 completed months, 1 = the 6 months before them ...
  const MAX_OFFSET = 8;
  const open = Boolean(part);
  const partNo = part ? String(part.fg_part_no || "").trim() : "";

  useEffect(() => {
    if (!open || !plant || !partNo) return undefined;
    let alive = true;
    // the same part keeps its picture (dimmed) while the next window loads; another part starts empty
    setState((s) => ({ loading: true, error: "", data: s.data && s.data.part_no === partNo ? s.data : null }));
    GetMfgProductionPartTrendApi({ plant, partNo, months: 6, offset })
      .then((data) => { if (alive) setState({ loading: false, error: "", data }); })
      .catch((error) => { if (alive) setState({ loading: false, error: error?.response?.data?.message || "Failed to load the 6-month trend.", data: null }); });
    return () => { alive = false; };
  }, [open, plant, partNo, offset]);
  useEffect(() => { if (!open) setOffset(0); }, [open]); // a part opened later starts on the latest months

  const rows = useMemo(() => (state.data?.months || []).map((m) => ({ ...m, pct: achievement(m.plan, m.actual) })), [state.data]);
  const totals = useMemo(() => {
    const plan = rows.reduce((s, r) => s + r.plan, 0);
    const actual = rows.reduce((s, r) => s + r.actual, 0);
    return { plan, actual, pct: achievement(plan, actual) };
  }, [rows]);
  const empty = rows.length > 0 && rows.every((r) => r.plan === 0 && r.actual === 0);
  const aPlan = useCountUp(totals.plan);
  const aActual = useCountUp(totals.actual);
  const aPct = useCountUp(totals.pct ?? 0);

  const th = { padding: "4px 10px", textAlign: "right", fontSize: 11, fontWeight: 700, backgroundColor: "#d0dcf5", borderBottom: "1px solid #b9c8ec", color: "#000" };
  const td = { padding: "4px 10px", textAlign: "right", fontSize: 12, borderBottom: "1px solid #eef0f3", color: "#1a2233" };
  const tile = { backgroundColor: "#f5f7fb", borderRadius: 8, padding: "5px 12px" };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} slots={{ transition: Grow }} transitionDuration={{ enter: 320, exit: 180 }} PaperProps={{ sx: { width: 780, maxWidth: "94vw", m: "16px", maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", borderRadius: "12px", overflow: "hidden" } }}>
      <style>{MOTION_CSS}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 16px", borderBottom: "1px solid #e8eaee", backgroundColor: "#f3f7ff" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2233", display: "flex", alignItems: "center" }}>
            6-Month Plan vs Actual
            <InfoTip
              label="How the numbers are worked out"
              title="How the numbers are worked out"
              points={[
                { label: "Plan:", value: "the Monthly Plan of the month", detail: "Plan Qty x Ends of the MP rows, the same as Prod Status" },
                { label: "Actual:", value: "the production of the month", detail: "movement types 101, 102, 261, 262, the same as Prod Status" },
                { label: "Achievement %:", value: "Actual / Plan x 100", detail: "a month without a plan shows -" },
                "Green: 85% and above. Yellow: 75% to under 85%. Red: under 75%. The dashed green line in the chart marks 85%.",
                "The last 6 completed months. The current month is not included. Use Previous 6 months / Next 6 months to go back in time (up to 4 years).",
                "A month without a plan has no dot, and a dashed line joins the months around it.",
                "If one month is far above the others (or a percentage is above 200%), the scale is cut and a note under the chart says so.",
              ]}
              note="Hover a month in the chart for its Plan, Actual and Achievement %."
            />
          </div>
          <div style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: "#0052cc", fontWeight: 700 }}>{partNo}</span>{" "}
            <span style={{ color: "#6b7280" }}>{part?.fg_part_desc || state.data?.description || ""}</span>
          </div>
          <div style={{ fontSize: 11, color: "#8a93a3", marginTop: 1 }}>
            Plant {plant}{part?.Line_Name ? ` | Line: ${part.Line_Name}` : ""}{state.data ? ` | ${monthLabel(state.data.from)} to ${monthLabel(state.data.to)}` : ""}
          </div>
        </div>
        <IconButton size="small" onClick={onClose} aria-label="Close"><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </div>

      <div style={{ padding: "10px 16px 12px", overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>
        {state.loading && !state.data && <div style={{ textAlign: "center", padding: "60px 0" }}><CircularProgress size={26} /></div>}
        {!state.loading && state.error && <div style={{ padding: "40px 0", textAlign: "center", color: "#c62828", fontSize: 12.5 }}>{state.error}</div>}
        {!state.error && state.data && (
          <div style={{ position: "relative", opacity: state.loading ? 0.4 : 1, transition: "opacity .2s ease", pointerEvents: state.loading ? "none" : "auto" }}>
            {state.loading && <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", zIndex: 3 }}><CircularProgress size={26} /></div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 6 }}>
              <div className="ptd-fade" style={tile}><div style={{ fontSize: 11, color: "#6b7280" }}>6-month plan</div><div style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>{fmt(aPlan)}</div></div>
              <div className="ptd-fade" style={{ ...tile, animationDelay: "70ms" }}><div style={{ fontSize: 11, color: "#6b7280" }}>6-month actual</div><div style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>{fmt(aActual)}</div></div>
              <div className="ptd-fade" style={{ ...tile, animationDelay: "140ms" }}><div style={{ fontSize: 11, color: "#6b7280" }}>Achievement</div><div style={{ marginTop: 1 }}><Chip pct={totals.pct} shown={totals.pct === null ? null : aPct} large /></div></div>
            </div>

            <div className="ptd-fade" style={{ animationDelay: "170ms", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
              <Button size="small" onClick={() => setOffset((o) => Math.min(MAX_OFFSET, o + 1))} disabled={state.loading || offset >= MAX_OFFSET} startIcon={<ChevronLeftIcon sx={{ fontSize: 18 }} />} sx={{ textTransform: "none", fontSize: 11.5, fontWeight: 600, height: 28 }}>
                Previous 6 months
              </Button>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2233" }}>
                {monthLabel(state.data.from)} to {monthLabel(state.data.to)}
                {offset > 0 && <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, color: "#8a6500", backgroundColor: "#fff4d6", padding: "1px 8px", borderRadius: 999 }}>earlier period</span>}
              </div>
              <Button size="small" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={state.loading || offset === 0} endIcon={<ChevronRightIcon sx={{ fontSize: 18 }} />} sx={{ textTransform: "none", fontSize: 11.5, fontWeight: 600, height: 28 }}>
                Next 6 months
              </Button>
            </div>

            {empty ? (
              <div style={{ padding: "36px 0", textAlign: "center", color: "#8a93a3", fontSize: 12.5 }}>No plan or production for this part in these 6 months.</div>
            ) : (
              <div key={state.data.from}>
                <div className="ptd-fade" style={{ animationDelay: "200ms", display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 11, color: "#6b7280", margin: "0 0 2px" }}>
                  <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, marginRight: 5, backgroundColor: PLAN_COLOR }} />Plan</span>
                  <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, marginRight: 5, backgroundColor: ACTUAL_DEFAULT }} />Actual (no plan)</span>
                  <span style={{ color: "#8a93a3" }}>Actual bar and dot:</span>
                  {["good", "warn", "bad"].map((k) => (
                    <span key={k}><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", marginRight: 5, backgroundColor: LEVELS[k].dot }} />{LEVELS[k].text}</span>
                  ))}
                </div>
                <TrendChart rows={rows} />
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th style={{ ...th, textAlign: "left" }}>Month</th>
                      <th style={th}>Plan Qty</th>
                      <th style={th}>Actual Qty</th>
                      <th style={th}>Achievement %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.month} className="ptd-row" style={{ animationDelay: `${520 + i * 60}ms` }}>
                        <td style={{ ...td, textAlign: "left" }}>{monthLabel(r.month)}</td>
                        <td style={td}>{fmt(r.plan)}</td>
                        <td style={td}>{fmt(r.actual)}</td>
                        <td style={td}><Chip pct={r.pct} /></td>
                      </tr>
                    ))}
                    <tr className="ptd-row" style={{ animationDelay: `${520 + rows.length * 60}ms` }}>
                      <td style={{ ...td, textAlign: "left", fontWeight: 700, backgroundColor: "#f5f7fb" }}>Total</td>
                      <td style={{ ...td, fontWeight: 700, backgroundColor: "#f5f7fb" }}>{fmt(totals.plan)}</td>
                      <td style={{ ...td, fontWeight: 700, backgroundColor: "#f5f7fb" }}>{fmt(totals.actual)}</td>
                      <td style={{ ...td, backgroundColor: "#f5f7fb" }}><Chip pct={totals.pct} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default PartTrendDialog;
