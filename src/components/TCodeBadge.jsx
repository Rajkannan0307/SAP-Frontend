import React from "react";
import { Box } from "@mui/material";

// The SAP transaction code a screen's data comes from, highlighted next to the screen heading.
//   <TCodeBadge code="MB52" />   (pass it through MfgListScreen's titleInfo)
const TCodeBadge = ({ code }) => (
  <Box
    component="span"
    title={`SAP T-Code ${code}`}
    sx={{
      ml: 1.5, px: 1.2, py: 0.3, borderRadius: "999px", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4,
      color: "#0052cc", backgroundColor: "#e8f0ff", border: "1px solid #b9d0ff", whiteSpace: "nowrap",
    }}
  >
    T-Code: {code}
  </Box>
);

export default TCodeBadge;
