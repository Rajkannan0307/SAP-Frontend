import React, { forwardRef } from "react";
import { Box, Button, Collapse } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// A toggle button + a collapsible panel for the extra filters (and, if wanted, some action
// buttons) of a list screen, so the toolbar stays tidy when there are many controls.
//   <FilterToggleButton open={open} onClick={() => setOpen(!open)} activeCount={n} />
//   <FilterPanel open={open} activeCount={n} onClear={clear} actions={<Button>Fetch</Button>}>
//     ...filters...
//   </FilterPanel>
// The panel opens with a smooth height animation and its filters fade/slide in one after
// another; the toggle shows how many filters are active even while the panel is closed.
// `actions` are buttons shown at the right end of the panel (e.g. Fetch / Upload).

export const FilterToggleButton = forwardRef(({ open, onClick, activeCount = 0 }, ref) => (
  <Button
    ref={ref}
    onClick={onClick}
    variant="outlined"
    disableElevation
    startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
    endIcon={
      <ExpandMoreIcon sx={{ fontSize: 18, transition: "transform .32s cubic-bezier(.4,0,.2,1)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
    }
    aria-expanded={open}
    sx={{
      height: 30, fontSize: 11, fontWeight: 600, textTransform: "none", borderRadius: "6px", padding: "0 10px", whiteSpace: "nowrap",
      borderColor: open || activeCount ? "#0066FF" : "#dde1e7", color: open || activeCount ? "#0052cc" : "#374151",
      backgroundColor: open ? "#eef4ff" : "#fff", transition: "background-color .25s ease, border-color .25s ease",
      "&:hover": { borderColor: "#0066FF", backgroundColor: "#f0f6ff" },
    }}
  >
    Filters
    {activeCount > 0 && (
      <Box
        component="span"
        sx={{
          ml: 0.75, minWidth: 18, height: 18, px: 0.5, borderRadius: "9px", display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 10.5, fontWeight: 700, color: "#fff", backgroundColor: "#0066FF",
          animation: "filterBadgePop .3s cubic-bezier(.34,1.56,.64,1)",
          "@keyframes filterBadgePop": { from: { transform: "scale(0.4)", opacity: 0 }, to: { transform: "scale(1)", opacity: 1 } },
        }}
      >
        {activeCount}
      </Box>
    )}
  </Button>
));

export const FilterPanel = ({ open, children, activeCount = 0, onClear, actions = null }) => (
  <Collapse in={open} timeout={{ enter: 340, exit: 240 }} easing={{ enter: "cubic-bezier(.4,0,.2,1)", exit: "cubic-bezier(.4,0,.6,1)" }} sx={{ width: "100%" }}>
    <Box
      sx={{
        mt: 0.5, p: 1.25, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, borderRadius: "10px",
        background: "linear-gradient(135deg, #f3f7ff 0%, #fbfcff 100%)", border: "1px solid #e1e9fb",
        "& > *": {
          opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity .32s ease, transform .32s cubic-bezier(.34,1.2,.64,1)",
        },
        "& > *:nth-of-type(1)": { transitionDelay: open ? ".06s" : "0s" },
        "& > *:nth-of-type(2)": { transitionDelay: open ? ".12s" : "0s" },
        "& > *:nth-of-type(3)": { transitionDelay: open ? ".18s" : "0s" },
        "& > *:nth-of-type(4)": { transitionDelay: open ? ".24s" : "0s" },
        "& > *:nth-of-type(5)": { transitionDelay: open ? ".30s" : "0s" },
      }}
    >
      {children}
      {((activeCount > 0 && onClear) || actions) && (
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {activeCount > 0 && onClear && (
            <Button size="small" onClick={onClear} sx={{ fontSize: 11, textTransform: "none", fontWeight: 600, color: "#b42323" }}>
              Clear filters
            </Button>
          )}
          {actions}
        </Box>
      )}
    </Box>
  </Collapse>
);
