import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Small "i" icon that opens a clean explanation card on hover (or keyboard focus).
//   <InfoHover title="How this is calculated" width={400}> ...children... </InfoHover>
// Use InfoSection for a labelled block and InfoChip for a small highlighted token inside the card.

export const InfoChip = ({ children, color = "#0052cc", bg = "#e8f0ff" }) => (
  <Box
    component="span"
    sx={{ display: "inline-block", px: 0.9, py: 0.1, mr: 0.5, borderRadius: "999px", fontSize: 11, fontWeight: 700, color, backgroundColor: bg }}
  >
    {children}
  </Box>
);

export const InfoSection = ({ label, children }) => (
  <Box sx={{ mt: 1.4 }}>
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#6b7280", mb: 0.4 }}>
      {label}
    </Typography>
    <Box sx={{ fontSize: 12, lineHeight: 1.55, color: "#1f2937" }}>{children}</Box>
  </Box>
);

const InfoHover = ({ title, children, width = 400, placement = "bottom-start" }) => (
  <Tooltip
    arrow
    placement={placement}
    enterDelay={80}
    leaveDelay={120}
    slotProps={{
      popper: { modifiers: [{ name: "offset", options: { offset: [0, 6] } }] },
      tooltip: {
        sx: {
          bgcolor: "#ffffff", color: "#1f2937", p: 0, width, maxWidth: "92vw", borderRadius: "12px",
          border: "1px solid #e5e9f2", boxShadow: "0 12px 32px rgba(16,24,40,0.18)",
        },
      },
      arrow: { sx: { color: "#ffffff", "&::before": { border: "1px solid #e5e9f2", boxSizing: "border-box" } } },
    }}
    title={
      <Box>
        <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #eef0f6", background: "linear-gradient(135deg, #eef4ff 0%, #f7faff 100%)", borderRadius: "12px 12px 0 0" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1a2233" }}>{title}</Typography>
        </Box>
        <Box sx={{ px: 2, pt: 0.2, pb: 1.6 }}>{children}</Box>
      </Box>
    }
  >
    <IconButton size="small" aria-label={title} sx={{ ml: 0.5, p: 0.4, color: "#0066FF", "&:hover": { backgroundColor: "#eaf2ff" } }}>
      <InfoOutlinedIcon sx={{ fontSize: 19 }} />
    </IconButton>
  </Tooltip>
);

export default InfoHover;
