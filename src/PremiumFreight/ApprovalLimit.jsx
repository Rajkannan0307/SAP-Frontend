import React, { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import { compactFieldSx, compactButtonSx } from "../components/MfgListScreen";
import { getApprovalLimits, saveApprovalLimits } from "../controller/PremiumFreightApiService";

// Premium Freight > Approval Limit - laid out like the PPC & MRPC list screens (shared MfgListScreen look): heading, filter card
// (Financial Year | actions), a caption, and the compact DataGrid.
// One MONTHLY approval limit per plant, entered once for the financial year (FY starts 1 April) and applied to every month of it.
// Premium freight above it needs Plant Head -> CFIN Head -> Business Head, otherwise Plant Head only. The grid lists every plant of the
// user's company; the user types the limits in the grid and saves the changed ones together. A plant without a limit cannot raise a request
// in the mobile app. The same rows (PF_Limit / PF_Limit_Hist) are used by the SFMS mobile app.
// Choosing a financial year loads its limits at once (no Submit button).

const AMOUNT = /^\d+(\.\d{1,2})?$/;
const MAX_AMOUNT = 999999999999.99;

const todayFy = () => {
  const d = new Date();
  return d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
};
const fyName = (y) => `FY ${y}-${String(y + 1).slice(2)}`;
const inr = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? "" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const ApprovalLimit = () => {
  const [fy, setFy] = useState(todayFy()); // the financial year shown
  const [rows, setRows] = useState([]); // plants of the user's company with the saved limit
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [edits, setEdits] = useState({}); // { Plant_Code: "typed text" } - only plants whose text differs from the saved limit
  const [saving, setSaving] = useState(false);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const inputRefs = useRef({});

  // the current FY first (it loads by default), then the next one and the earlier ones
  const fyOptions = useMemo(() => {
    const now = todayFy();
    return [now + 1, now, now - 1, now - 2];
  }, []);

  const load = async (year) => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getApprovalLimits(year);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setCompany(data?.company || "");
      setFy(year);
      setEdits({});
    } catch (error) {
      console.error("Failed to load the approval limits.", error);
      setRows([]);
      setLoadError("Could not load the approval limits. Please try again.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    load(fy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirtyCodes = Object.keys(edits);
  const dirty = dirtyCodes.length > 0;

  // choosing a financial year loads its limits at once
  const handleFyChange = (year) => {
    if (year === fy) return;
    if (dirty && !window.confirm(`You have unsaved changes. Discard them and load ${fyName(year)}?`)) return;
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    load(year);
  };

  const textOf = (row) => (row.Plant_Code in edits ? edits[row.Plant_Code] : row.limit_amount === null ? "" : String(row.limit_amount));

  const setText = (row, value) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const saved = row.limit_amount === null ? "" : String(row.limit_amount);
    setEdits((cur) => {
      const next = { ...cur };
      if (cleaned === saved) delete next[row.Plant_Code];
      else next[row.Plant_Code] = cleaned;
      return next;
    });
  };

  // a blank box is not a limit: the user types a number or leaves the plant as it was
  const errorOf = (row) => {
    if (!row || !(row.Plant_Code in edits)) return "";
    const t = edits[row.Plant_Code];
    if (t === "") return "Enter the limit (0 or more).";
    if (!AMOUNT.test(t) || Number(t) > MAX_AMOUNT) return "Amount of 0 or more, at most 2 decimals.";
    return "";
  };

  const displayRows = rows;

  const invalidCount = dirtyCodes.filter((c) => errorOf(rows.find((r) => r.Plant_Code === c)) !== "").length;
  const saveable = dirtyCodes.filter((c) => edits[c] !== "");

  // caption under the filter card: totals as they would be after saving
  const summaryText = useMemo(() => {
    if (!loaded || loadError || !rows.length) return null;
    const value = (r) => (r.Plant_Code in edits && AMOUNT.test(edits[r.Plant_Code]) ? Number(edits[r.Plant_Code]) : r.limit_amount);
    const withLimit = rows.filter((r) => value(r) !== null && value(r) !== undefined);
    const total = withLimit.reduce((t, r) => t + Number(value(r)), 0);
    return `${fyName(fy)}${company ? ` · ${company}` : ""} · ${rows.length} plants · ${withLimit.length} with a limit · ${rows.length - withLimit.length} not set · total monthly limit ₹ ${inr(total)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, loadError, rows, edits, fy, company]);

  const handleSave = async () => {
    if (!saveable.length || invalidCount > 0 || saving) return;
    setSaving(true);
    try {
      const response = await saveApprovalLimits(fy, saveable.map((c) => ({ plant_code: c, amount: edits[c] })));
      if (response.data?.success) {
        toast.success(response.data.message || "Approval limits saved.");
        await load(fy);
      } else {
        toast.error(response.data?.message || "Could not save the approval limits.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save the approval limits.");
    } finally {
      setSaving(false);
    }
  };

  // Enter moves down to the next plant's box on the page
  const focusNext = (code) => {
    const i = displayRows.findIndex((r) => r.Plant_Code === code);
    const next = displayRows[i + 1];
    const el = next && inputRefs.current[next.Plant_Code];
    if (el) { el.focus(); el.select(); }
  };

  const columns = [
    { field: "si_no", headerName: "SI No", width: 70, sortable: false, filterable: false, renderCell: (p) => p.api.getRowIndexRelativeToVisibleRows(p.id) + 1 + paginationModel.page * paginationModel.pageSize },
    { field: "Plant_Code", headerName: "Plant", width: 90 },
    { field: "Plant_Name", headerName: "Plant Name", flex: 1, minWidth: 180 },
    {
      field: "limit_amount",
      headerName: "Monthly Limit (₹)",
      width: 210,
      align: "right",
      headerAlign: "right",
      sortable: false,
      filterable: false,
      renderCell: (p) => {
        const row = p.row;
        const err = errorOf(row);
        const edited = row.Plant_Code in edits;
        return (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 1 }}>
            <label className={`pf-limit-box${err ? " is-error" : edited ? " is-edited" : ""}`}>
              <span className="pf-rupee">₹</span>
              <input
                ref={(el) => { inputRefs.current[row.Plant_Code] = el; }}
                value={textOf(row)}
                inputMode="decimal"
                placeholder="Not set"
                aria-label={`Monthly limit of plant ${row.Plant_Code}`}
                disabled={saving}
                onChange={(e) => setText(row, e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  e.stopPropagation(); // the grid must not take the keys typed in the box
                  if (e.key === "Enter") { e.preventDefault(); focusNext(row.Plant_Code); }
                  if (e.key === "Escape" && edited) { e.preventDefault(); setEdits((cur) => { const n = { ...cur }; delete n[row.Plant_Code]; return n; }); }
                }}
                style={{
                  flex: 1, minWidth: 0, height: "100%", padding: 0, border: "none", outline: "none", background: "transparent", textAlign: "right",
                  fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: "#1a2233",
                }}
              />
            </label>
            {err && <span style={{ fontSize: 9.5, color: "#d32f2f" }}>{err}</span>}
          </div>
        );
      },
    },
  ];

  return (
    <div
      style={{
        padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px",
        display: "flex", flexDirection: "column", height: "calc(100vh - 90px)",
      }}
    >
      {/* limit box: plain white box -> blue ring while typing (focus) -> light blue fill once the value differs from the saved one -> red on error */}
      <style>{`
        .pf-limit-box { width: 172px; height: 30px; display: flex; align-items: center; gap: 6px; padding: 0 10px; box-sizing: border-box; cursor: text;
          background: #fff; border: 1px solid #cfd6e2; border-radius: 6px; transition: border-color .12s, box-shadow .12s, background-color .12s; }
        .pf-limit-box:hover { border-color: #8fb4ff; }
        .pf-limit-box:focus-within { border-color: #0066FF; border-width: 1.5px; padding: 0 9.5px; background: #fff; box-shadow: 0 0 0 3px rgba(0,102,255,0.18); }
        .pf-limit-box.is-edited { background: #eaf2ff; border-color: #0066FF; }
        .pf-limit-box.is-error { background: #fff4f3; border-color: #d32f2f; }
        .pf-limit-box.is-error:focus-within { box-shadow: 0 0 0 3px rgba(211,47,47,0.18); }
        .pf-limit-box .pf-rupee { font-size: 12px; font-weight: 700; color: #8a93a3; }
        .pf-limit-box:focus-within .pf-rupee, .pf-limit-box.is-edited .pf-rupee { color: #0066FF; }
        .pf-limit-box.is-error .pf-rupee { color: #d32f2f; }
        .pf-limit-box input::placeholder { color: #a4a9b3; font-weight: 500; }
      `}</style>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHeading>Approval Limit</SectionHeading>
      </div>

      <div
        style={{
          backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)", padding: "7px 10px", marginBottom: 12,
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField select size="small" label="Financial Year" value={fy} onChange={(e) => handleFyChange(Number(e.target.value))} sx={compactFieldSx(150)} disabled={loading || saving}>
            {fyOptions.map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: 11.5 }}>{fyName(y)}</MenuItem>
            ))}
          </TextField>
          {loading && <CircularProgress size={14} />}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <Button
            variant="outlined" disableElevation onClick={() => setEdits({})} disabled={!dirty || saving}
            startIcon={<UndoIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, color: "#4b5563", borderColor: "#dde1e7" }}
          >
            Discard
          </Button>
          <Button
            variant="contained" disableElevation onClick={handleSave} disabled={!saveable.length || invalidCount > 0 || saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
          >
            {saving ? "Saving..." : saveable.length ? `Save Changes (${saveable.length})` : "Save Changes"}
          </Button>
        </div>
      </div>

      {summaryText && <Typography sx={{ fontSize: 11, color: "#6b7280", mb: 1, ml: 0.5 }}>{summaryText}</Typography>}
      {invalidCount > 0 && (
        <Typography sx={{ fontSize: 11, color: "#d32f2f", mb: 1, ml: 0.5 }}>
          {`${invalidCount} plant${invalidCount > 1 ? "s" : ""} with an invalid amount - fix ${invalidCount > 1 ? "them" : "it"} to save.`}
        </Typography>
      )}

      {loadError && (
        <Alert
          severity="error" sx={{ mb: 1.5, fontSize: 12, py: 0 }}
          action={<Button color="inherit" size="small" onClick={() => load(fy)} sx={{ fontSize: 11, textTransform: "none" }}>Retry</Button>}
        >
          {loadError}
        </Alert>
      )}

      <div
        style={{
          flexGrow: 1, minHeight: 0, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)", overflow: "hidden",
        }}
      >
        <DataGrid
          rows={displayRows}
          columns={columns}
          getRowId={(row) => row.Plant_Code}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnMenu
          columnHeaderHeight={36}
          rowHeight={44}
          localeText={{
            noRowsLabel: loadError ? "Could not load data." : loaded ? (rows.length === 0 ? "No plants found for your company." : "No plants found.") : "",
          }}
          sx={{
            height: "100%", border: "none",
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": { color: "#333", fontSize: "11px", padding: "0 8px", borderRight: "none" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaders": { position: "sticky", top: 0, zIndex: 2 },
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#d0dcf5", color: "#000000", padding: "0 8px" },
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10.5px", fontWeight: "bold", color: "#000000" },
            "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "#000000" },
            "& .MuiDataGrid-row": { backgroundColor: "#fff" },
            "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#fafbfc" },
            "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
            "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
            "& .MuiDataGrid-footerContainer": { minHeight: 34 },
            "& .MuiTablePagination-root": { overflow: "visible" },
            "& .MuiTablePagination-toolbar": { minHeight: "34px !important", height: 34, paddingLeft: 8, paddingRight: 4 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 11, marginTop: 0, marginBottom: 0 },
            "& .MuiTablePagination-select": { fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset" },
            "& .MuiTablePagination-selectIcon": { fontSize: 16 },
            "& .MuiTablePagination-actions .MuiIconButton-root": { padding: 4, width: 24, height: 24 },
          }}
        />
      </div>
    </div>
  );
};

export default ApprovalLimit;
