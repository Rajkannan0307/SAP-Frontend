// Compact UI styles shared by the redesigned master screens (User Master and its dialogs).
// The values follow the table / field / button look of the MFG Daily Production Plan screen.

// Compact outlined input / select / autocomplete (30px high). `fontSize` 11 for filter bars, 12 for dialogs.
export const compactFieldSx = (minWidth, fontSize = 11) => ({
  minWidth,
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#fafbfc",
    minHeight: 30,
    display: "flex",
    alignItems: "center",
    padding: "0 7px !important",
    "& fieldset": { borderColor: "#dde1e7" },
    "&:hover fieldset": { borderColor: "#0066FF" },
    "&.Mui-focused fieldset": { borderColor: "#0066FF", borderWidth: "1.5px" },
    "&.Mui-disabled": {
      backgroundColor: "#f1f2f5",
      cursor: "not-allowed",
      "& fieldset": { borderColor: "#e2e4e9", borderStyle: "dashed" },
    },
  },
  "& .MuiInputBase-input, & .MuiSelect-select, & .MuiAutocomplete-input": { padding: "0 !important", fontSize },
  "& .MuiSelect-select": { display: "flex", alignItems: "center", minHeight: "unset !important" },
  "& .Mui-disabled": { cursor: "not-allowed", WebkitTextFillColor: "#7b8494" },
  "& .MuiAutocomplete-endAdornment": { right: 4 },
  "& .MuiInputLabel-root": { fontSize, color: "#6b7280", transform: `translate(8px, 7px)` },
  "& .MuiInputLabel-root.Mui-focused": { color: "#0066FF" },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": { fontSize: fontSize - 0.5, transform: "translate(8px, -7px) scale(0.9)" },
  "& .MuiSelect-icon": { fontSize: 18, right: 4 },
});

// Menu / listbox of selects and autocompletes
export const compactMenuProps = (fontSize = 11.5) => ({
  PaperProps: { sx: { borderRadius: "8px", boxShadow: "0 10px 28px rgba(16,24,40,0.16)", "& .MuiMenuItem-root": { fontSize, minHeight: 28, py: 0.25 } } },
});

export const compactListboxSx = {
  "& .MuiAutocomplete-listbox": { fontSize: 11.5, maxHeight: 190, padding: "4px 0" },
  "& .MuiAutocomplete-option": { minHeight: 28, padding: "2px 10px" },
  "& .MuiAutocomplete-groupLabel": { fontSize: 10.5, fontWeight: 700, lineHeight: "24px", color: "#6b7280", backgroundColor: "#f3f6fc" },
};

export const compactButtonSx = {
  height: 30,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "6px",
  boxShadow: "none",
  padding: "0 10px",
  whiteSpace: "nowrap",
};

export const primaryButtonSx = { ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } };
export const successButtonSx = { ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } };
export const outlineButtonSx = {
  ...compactButtonSx,
  color: "#374151",
  borderColor: "#dde1e7",
  backgroundColor: "#fff",
  "&:hover": { borderColor: "#9aa3b2", backgroundColor: "#f6f7f9" },
};

// Data grid look of the MFG Daily Production Plan table
export const compactGridSx = {
  height: "100%",
  border: "none",
  "& .MuiDataGrid-columnSeparator": { display: "none" },
  "& .MuiDataGrid-cell": { color: "#333", fontSize: "11px", padding: "0 8px", borderRight: "none" },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
  "& .MuiDataGrid-columnHeaders": { position: "sticky", top: 0, zIndex: 2 },
  "& .MuiDataGrid-columnHeader": { backgroundColor: "#d0dcf5", color: "#000000", padding: "0 8px" },
  "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
  "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10.5px", fontWeight: "bold", color: "#000000" },
  "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "#000000" },
  "& .MuiDataGrid-row": { backgroundColor: "#fff", cursor: "pointer" },
  "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#fafbfc" },
  "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
  "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
  "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 28 },
  "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
  "& .MuiDataGrid-footerContainer": { minHeight: 34 },
  "& .MuiTablePagination-root": { overflow: "visible" },
  "& .MuiTablePagination-toolbar": { minHeight: "34px !important", height: 34, paddingLeft: 8, paddingRight: 4 },
  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 11, marginTop: 0, marginBottom: 0 },
  "& .MuiTablePagination-select": { fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset" },
  "& .MuiTablePagination-selectIcon": { fontSize: 16 },
  "& .MuiTablePagination-actions": { marginLeft: 4 },
  "& .MuiTablePagination-actions .MuiIconButton-root": { padding: 4, width: 24, height: 24 },
  "& .MuiTablePagination-actions svg": { fontSize: 16 },
};
