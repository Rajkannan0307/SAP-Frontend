import React, { useEffect, useRef, useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

// Live "next run in HH:MM:SS" timer for a job card.
//  - ticks every second inside THIS component only (the rest of the screen does not re-render),
//  - counts down to an absolute time, so it stays correct when the tab was in the background,
//  - a progress bar fills smoothly towards the next run,
//  - the icon pulses (faster in the last minute) and the colour turns green when it is near,
//  - at zero it shows "Running now…" and calls onDue() once, so the screen can reload the result.

const pulse = keyframes`
  0%   { transform: scale(1);    opacity: 1; }
  50%  { transform: scale(1.22); opacity: .65; }
  100% { transform: scale(1);    opacity: 1; }
`;
const tick = keyframes`
  from { opacity: .3; transform: translateY(-4px); }
  to   { opacity: 1;  transform: translateY(0); }
`;

const two = (n) => String(Math.floor(n)).padStart(2, "0");
const reduceMotion = { "@media (prefers-reduced-motion: reduce)": { animation: "none !important", transition: "none !important" } };

const LiveCountdown = ({ targetMs, periodSec, clock, onDue }) => {
  const [now, setNow] = useState(Date.now());
  const firedFor = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const msLeft = targetMs - now;
  const due = msLeft <= 0;
  const remaining = Math.max(0, Math.ceil(msLeft / 1000));

  useEffect(() => {
    if (due && firedFor.current !== targetMs) {
      firedFor.current = targetMs;
      if (onDue) onDue();
    }
  }, [due, targetMs, onDue]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const soon = remaining <= 600;
  const closing = remaining <= 60;
  const color = due || soon ? "#1b7a43" : "#3730a3";
  const bg = due || soon ? "#e8f6ee" : "#eef2ff";

  return (
    <Box sx={{ display: "inline-flex", flexDirection: "column", gap: 0.5, minWidth: 190 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            display: "inline-flex", alignItems: "center", gap: 0.75, px: 0.9, py: 0.15, borderRadius: 1, backgroundColor: bg, color,
            transition: "background-color .6s ease, color .6s ease",
          }}
        >
          <TimerOutlinedIcon
            sx={{ fontSize: 15, animation: `${pulse} ${due || closing ? "0.9s" : "2.4s"} ease-in-out infinite`, ...reduceMotion }}
          />
          {due ? (
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>Running now…</Typography>
          ) : (
            <Tooltip title="hours : minutes : seconds until the next run" placement="top" arrow>
              <Box
                component="span"
                sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 13, fontWeight: 800, letterSpacing: 0.4, fontVariantNumeric: "tabular-nums", display: "inline-flex" }}
              >
                {two(h)}:{two(m)}:
                <Box component="span" key={s} sx={{ display: "inline-block", animation: `${tick} .35s ease-out`, ...reduceMotion }}>{two(s)}</Box>
              </Box>
            </Tooltip>
          )}
        </Box>
        {clock && !due && <Typography component="span" sx={{ fontSize: 11.5, color: "#6b7280" }}>at {clock}</Typography>}
      </Box>
    </Box>
  );
};

export default LiveCountdown;
