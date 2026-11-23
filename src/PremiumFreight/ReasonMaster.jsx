import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import { compactFieldSx, compactButtonSx } from "../components/MfgListScreen";
import { getPfReasons, getPfReasonRoles, savePfReason } from "../controller/PremiumFreightApiService";
import { GRID_SX, dateText, pill } from "./shared";

// Premium Freight > PF Reason master (table Mst_PF_Reason of the SFMS Postgres database, shared with the mobile app).
// Each category (table row of Mst_PF_Reason) is mapped to ONE role. The New Request form shows the active reasons in a dropdown; when a request is raised with a reason, the users
// of that role (mapped to the plant of the request) get the notification mail, with Plant Finance level 3 of the plant in Cc.
// A category is never deleted: make it Inactive and it disappears from the dropdown (old requests keep it).

const FIELD_SX = compactFieldSx("100%", 12);

const ReasonDialog = ({ open, row, roles, onClose, onSaved }) => {
  const [reason, setReason] = useState("");
  const [roleId, setRoleId] = useState("");
  const [active, setActive] = useState(true);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(row ? row.reason : "");
    setRoleId(row && row.role_id ? String(row.role_id) : "");
    setActive(row ? row.active : true);
    setErrs({}); setBusy(false);
  }, [open, row]);

  const submit = async () => {
    const e = {};
    if (reason.trim().length < 3) e.reason = "Enter the category";
    if (!roleId) e.roleId = "Choose the role";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const response = await savePfReason({ id: row ? row.id : undefined, reason: reason.trim(), roleId: Number(roleId), active });
      if (response.data?.success) {
        toast.success(response.data.message || "Saved.");
        onSaved();
      } else {
        toast.error(response.data?.message || "Could not save the category.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save the category.");
    } finally {
      setBusy(false);
    }
  };

  const errText = (k) => (errs[k] ? <div style={{ color: "#d32f2f", fontSize: 10.5, margin: "-8px 0 8px 2px" }}>{errs[k]}</div> : null);

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 700, pb: 1 }}>{row ? "Edit PF Category" : "Add PF Category"}</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <TextField
          size="small" label="Category *" value={reason} onChange={(e) => { setReason(e.target.value.slice(0, 200)); setErrs((x) => ({ ...x, reason: undefined })); }}
          error={Boolean(errs.reason)} sx={{ ...FIELD_SX, mb: 1.5 }} autoFocus
        />
        {errText("reason")}
        {/* type to search the roles */}
        <Autocomplete
          size="small" options={roles} getOptionLabel={(r) => r.name} isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
          value={roles.find((r) => String(r.id) === String(roleId)) || null} noOptionsText="No role found" autoHighlight
          onChange={(e, r) => { setRoleId(r ? String(r.id) : ""); setErrs((x) => ({ ...x, roleId: undefined })); }}
          slotProps={{ paper: { sx: { "& .MuiAutocomplete-option": { fontSize: 12, minHeight: 30 }, "& .MuiAutocomplete-noOptions": { fontSize: 12 } } } }}
          renderInput={(params) => (
            <TextField {...params} label="Role (gets the mail) *" placeholder="Type to search" error={Boolean(errs.roleId)} sx={{ ...FIELD_SX, mb: 1.5 }} />
          )}
        />
        {errText("roleId")}
        <TextField select size="small" label="Status" value={active ? "A" : "I"} onChange={(e) => setActive(e.target.value === "A")} sx={FIELD_SX}>
          <MenuItem value="A" sx={{ fontSize: 11.5 }}>Active</MenuItem>
          <MenuItem value="I" sx={{ fontSize: 11.5 }}>Inactive</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} sx={{ ...compactButtonSx, color: "#4b5563" }}>Cancel</Button>
        <Button
          variant="contained" disableElevation onClick={submit} disabled={busy}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
        >
          {busy ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReasonMaster = () => {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [roleColumn, setRoleColumn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState({ open: false, row: null });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [list, roleList] = await Promise.all([getPfReasons(false), getPfReasonRoles()]);
      setRows(Array.isArray(list?.rows) ? list.rows : []);
      setRoleColumn(list?.roleColumn !== false);
      setRoles(Array.isArray(roleList?.rows) ? roleList.rows : []);
    } catch (error) {
      console.error("Failed to load the PF categories.", error);
      setRows([]);
      setLoadError("Could not load the PF categories. Please try again.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => `${r.reason} ${r.role_name || ""}`.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const columns = [
    { field: "si_no", headerName: "SI No", width: 70, sortable: false, filterable: false, renderCell: (p) => p.api.getRowIndexRelativeToVisibleRows(p.id) + 1 + paginationModel.page * paginationModel.pageSize },
    { field: "reason", headerName: "Category", flex: 1, minWidth: 260 },
    { field: "role_name", headerName: "Role (gets the mail)", width: 200, valueGetter: (v) => v || "", renderCell: (p) => p.value || <span style={{ color: "#d32f2f" }}>Not mapped</span> },
    { field: "active", headerName: "Status", width: 100, renderCell: (p) => pill(p.value ? "Active" : "Inactive", p.value ? "#1B7A43" : "#8a93a3") },
    { field: "created_on", headerName: "Created On", width: 120, valueGetter: (v) => (v ? dateText(String(v).slice(0, 10)) : "") },
    { field: "modified_on", headerName: "Modified On", width: 120, valueGetter: (v) => (v ? dateText(String(v).slice(0, 10)) : "") },
    {
      field: "edit", headerName: "", width: 60, sortable: false, filterable: false,
      renderCell: (p) => (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => setDialog({ open: true, row: p.row })}><EditOutlinedIcon sx={{ fontSize: 17, color: "#2e59d9" }} /></IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: 20, backgroundColor: "#F5F5F5", marginTop: "50px", display: "flex", flexDirection: "column", height: "calc(100vh - 90px)" }}>
      <div style={{ marginBottom: 20 }}>
        <SectionHeading>PF Category Master</SectionHeading>
      </div>

      <div
        style={{
          backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 2px rgba(16,24,40,0.04)", padding: "7px 10px", marginBottom: 12,
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8,
        }}
      >
        <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} sx={compactFieldSx(240)} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading && <CircularProgress size={14} />}
          <Button
            variant="contained" disableElevation onClick={() => setDialog({ open: true, row: null })} disabled={!roleColumn}
            startIcon={<AddIcon sx={{ fontSize: 15 }} />} sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
          >
            Add Category
          </Button>
        </div>
      </div>

      <Typography sx={{ fontSize: 11, color: "#6b7280", mb: 1, ml: 0.5 }}>
        Each category is mapped to a role. In the New Request form the requester picks a category, then chooses which users of that role (mapped to the plant) get the mail; Plant Finance level 3 of the plant is in Cc.
      </Typography>
      {!roleColumn && (
        <Alert severity="warning" sx={{ mb: 1.5, fontSize: 12, py: 0 }}>
          The database does not have the Role column of this master yet. Ask the DBA to run sql/13_migration_postgres.sql, then reload.
        </Alert>
      )}
      {loadError && (
        <Alert severity="error" sx={{ mb: 1.5, fontSize: 12, py: 0 }} action={<Button color="inherit" size="small" onClick={load} sx={{ fontSize: 11, textTransform: "none" }}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      <div style={{ flexGrow: 1, minHeight: 0, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 3px rgba(16,24,40,0.05)", overflow: "hidden" }}>
        <DataGrid
          rows={shown} columns={columns} getRowId={(r) => r.id} loading={loading}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick disableColumnMenu columnHeaderHeight={36} rowHeight={40}
          localeText={{ noRowsLabel: loadError ? "Could not load data." : loaded ? "No categories yet. Click Add Category." : "" }}
          sx={{ height: "100%", ...GRID_SX }}
        />
      </div>

      <ReasonDialog
        open={dialog.open} row={dialog.row} roles={roles}
        onClose={() => setDialog({ open: false, row: null })}
        onSaved={() => { setDialog({ open: false, row: null }); load(); }}
      />
    </div>
  );
};

export default ReasonMaster;
