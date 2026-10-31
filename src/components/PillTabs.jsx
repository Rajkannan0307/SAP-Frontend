import React, { useEffect, useRef, useState } from "react";

// Pill-style segmented tab control (icon + label + live record-count badge),
// with a sliding highlight that animates to the active segment's measured
// position - the same "capsule" tab pattern used in modern dashboard UIs.
//   tabs     [{ key, label, Icon }]       Icon = an MUI icon component
//   value    index of the active tab
//   onChange (index) => void
//   counts   { [key]: number }            the badge of each tab
// Shared by the MFG Set of Parts - Stock Report (Materials / Production-IH) and Child Part Coverage (Coverage / Supplier Kanban).
const PillTabs = ({ tabs, value, onChange, counts = {} }) => {
  const btnRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = btnRefs.current[value];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [value, counts]);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        gap: 4,
        padding: 4,
        backgroundColor: "#eef0f3",
        borderRadius: 999,
        width: "fit-content",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: indicator.left,
          width: indicator.width,
          backgroundColor: "#fff",
          borderRadius: 999,
          boxShadow: "0 1px 6px rgba(16,24,40,0.14)",
          transition: "left .25s cubic-bezier(.4,0,.2,1), width .25s cubic-bezier(.4,0,.2,1)",
        }}
      />
      {tabs.map((t, i) => {
        const active = value === i;
        const count = counts[t.key] ?? 0;
        return (
          <button
            key={t.key}
            ref={(el) => (btnRefs.current[i] = el)}
            onClick={() => onChange(i)}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: 999,
              padding: "7px 14px",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              color: active ? "#0066FF" : "#6b7280",
              transition: "color .2s ease",
            }}
          >
            <t.Icon sx={{ fontSize: 16 }} />
            <span>{t.label}</span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: 999,
                backgroundColor: active ? "#e8f0ff" : "#e2e5ea",
                color: active ? "#0066FF" : "#6b7280",
                transition: "background-color .2s ease, color .2s ease",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PillTabs;
