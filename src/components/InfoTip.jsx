import React from "react";
import { Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// The ONE hover card of the app (grey "i" icon or any label, white card, same look everywhere).
//
//   Icon + free content (RM Coverage, Unique grouping info ...):
//     <InfoTip label="Status legend"> ...anything... </InfoTip>
//   Column header / any label as the hover target:
//     <InfoTip trigger="MTD Plan" text="Plain explanation" />
//     <InfoTip trigger="MTD Plan" title="MTD Plan = (Monthly Plan / 25) x 12" points={[{ label, value, detail }]} note="..." />
//
//   trigger    : what you hover. Omitted = the grey "i" icon.
//   text       : a plain explanation (string)
//   title      : bold headline line (a formula)
//   points     : bullets, each a string or { label, value, detail? }
//   note       : small grey footnote under a divider
//   children   : free extra content (kept for the icon usages)
//   labelStyle : style of the hover label (a grid that does not style the header itself, e.g. renderHeader)
const InfoTip = ({ children, trigger, text, title, points = [], note, labelStyle, enterDelay, placement = trigger ? "top" : "bottom-end", label = "Info" }) => {
  const structured = Boolean(title || text || points.length || note);
  const body = structured ? (
    <div style={{ lineHeight: 1.45 }}>
      {title && <div style={{ fontWeight: 700, color: "#1a2233", fontSize: 12, marginBottom: points.length || text ? 6 : 0 }}>{title}</div>}
      {text && <div>{text}</div>}
      {points.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          {points.map((p, i) => (
            <li key={i}>
              {typeof p === "string" ? (
                p
              ) : (
                <>
                  <span>{p.label}</span> <b style={{ color: "#1a2233" }}>{p.value}</b>
                  {p.detail && <span style={{ color: "#6b7280" }}> ({p.detail})</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {note && <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #eef0f3", color: "#6b7280", fontSize: 10.5 }}>{note}</div>}
      {children}
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
  );

  return (
    <Tooltip
      arrow
      placement={placement}
      enterDelay={enterDelay ?? (trigger ? 250 : undefined)}
      componentsProps={{
        tooltip: { sx: { bgcolor: "#fff", color: "#4b5563", border: "1px solid #e8eaee", boxShadow: "0 4px 14px rgba(16,24,40,0.15)", p: 1.5, maxWidth: trigger ? 360 : 420, fontSize: 11 } },
        arrow: { sx: { color: "#fff", "&:before": { border: "1px solid #e8eaee" } } },
      }}
      title={body}
    >
      {trigger !== undefined ? (
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", ...labelStyle }}>{trigger}</span>
      ) : (
        <InfoOutlinedIcon aria-label={label} sx={{ fontSize: 18, color: "#6b7280", cursor: "help", ml: 0.5 }} />
      )}
    </Tooltip>
  );
};

export default InfoTip;
