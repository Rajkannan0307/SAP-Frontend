import React from "react";
import { Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// One look for every "i" info icon: grey icon, white card on hover (used by RM Coverage and Production Plan).
const InfoTip = ({ children, placement = "bottom-end", label = "Info" }) => (
  <Tooltip
    arrow
    placement={placement}
    componentsProps={{
      tooltip: { sx: { bgcolor: "#fff", color: "#4b5563", border: "1px solid #e8eaee", boxShadow: "0 4px 14px rgba(16,24,40,0.15)", p: 1.5, maxWidth: 420, fontSize: 11 } },
      arrow: { sx: { color: "#fff", "&:before": { border: "1px solid #e8eaee" } } },
    }}
    title={<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>}
  >
    <InfoOutlinedIcon aria-label={label} sx={{ fontSize: 18, color: "#6b7280", cursor: "help", ml: 0.5 }} />
  </Tooltip>
);

export default InfoTip;
