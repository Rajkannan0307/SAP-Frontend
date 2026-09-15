import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  IconButton,
  Switch,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { toast } from "react-toastify";
import { getdetails, getAdd, getUpdates } from "../controller/Roleapiservices";
import SectionHeading from "../components/Header";

// Compact, modern control styling — matches the app's newer screens (MFG
// Report, Material Master) so this looks consistent instead of the old
// default-size MUI controls.
const compactFieldSx = {
  "& .MuiInputBase-input": { padding: "8px 10px", fontSize: 13 },
  "& .MuiInputLabel-root": { fontSize: 13 },
};

const compactButtonSx = {
  height: 34,
  fontSize: 13,
  textTransform: "none",
  borderRadius: 1.5,
  boxShadow: "none",
};

const gridSx = {
  "& .MuiDataGrid-columnHeader": { backgroundColor: "#eef1f6", color: "#2e3648", fontWeight: 600 },
  "& .MuiDataGrid-columnHeaderTitle": { fontSize: "13px", fontWeight: 600 },
  "& .MuiDataGrid-row": { backgroundColor: "#fff", "&:hover": { backgroundColor: "#f6f8fc" } },
  "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
  "& .MuiDataGrid-cell": { color: "#333", fontSize: "13px" },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
  border: "none",
};

const Role = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [Role_Name, setRoleName] = useState("");
  const [Role_ID, setRoleID] = useState("");
  const [saving, setSaving] = useState(false);
  const UserID = localStorage.getItem("UserID");
  const navigate = useNavigate();

  const columns = [
    { field: "Role_Name", headerName: "Role", flex: 1, minWidth: 200 },
    {
      field: "Active_Status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: 11,
            color: params.value ? "#1e7e34" : "#b3261e",
            backgroundColor: params.value ? "#e6f4ea" : "#fdecea",
          }}
        />
      ),
    },
    {
      field: "Menus",
      headerName: "Permissions",
      width: 130,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: () => (
        <Tooltip title="Manage menu permissions for this role">
          <IconButton size="small" sx={{ color: "#0066FF" }}>
            <AdminPanelSettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const getData = async () => {
    try {
      const response = await getdetails();
      setOriginalRows(response);
      setRows(response);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load roles.");
      setOriginalRows([]);
      setRows([]);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const handleSearch = (value) => {
    const text = value.trim().toLowerCase();
    if (!text) {
      setRows(originalRows);
      return;
    }
    setRows(originalRows.filter((row) => String(row.Role_Name || "").toLowerCase().includes(text)));
  };

  const handleOpenAddModal = () => {
    setRoleName("");
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const goToPermissions = (row) => {
    if (row.Role_ID && row.Role_Name) {
      navigate(`/home/Role/${row.Role_ID}`, {
        state: { role: row.Role_Name, Role_No: row.Role_ID },
      });
    } else {
      toast.error("Role data is incomplete.");
    }
  };

  const handleAdd = async () => {
    if (Role_Name.trim() === "") {
      toast.warning("Please enter a role name.");
      return;
    }
    setSaving(true);
    try {
      const data = { UserID, Role_Name, Active_Status: ActiveStatus };
      const response = await getAdd(data);
      if (response.data.success) {
        toast.success("Role added successfully!");
        getData();
        handleCloseAddModal();
      } else {
        toast.error(response.data.message || "Failed to add role.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An error occurred while adding the role.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const data = { Role_ID, Role_Name, UserID, Active_Status: ActiveStatus };
      const response = await getUpdates(data);
      if (response.data.success) {
        toast.success(response.data.message);
        getData();
        handleCloseEditModal();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An error occurred while updating the role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: "16px 20px",
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 50px)",
      }}
    >
      <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionHeading>Role Master</SectionHeading>
      </div>

      {/* Compact toolbar: search + add, one line */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "8px 10px",
          marginBottom: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="Search role..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            handleSearch(e.target.value);
          }}
          sx={{ ...compactFieldSx, minWidth: 260 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ fontSize: 18, color: "#888", mr: 1 }} />,
          }}
        />
        <div style={{ marginLeft: "auto" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={handleOpenAddModal}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc", boxShadow: "none" } }}
          >
            Add Role
          </Button>
        </div>
      </div>

      {/* DataGrid */}
      <div style={{ flexGrow: 1, backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.08)", minHeight: 0, overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          getRowId={(row) => row.Role_ID}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          columnHeaderHeight={38}
          rowHeight={42}
          localeText={{ noRowsLabel: "No roles found." }}
          onCellClick={(params) => {
            if (params.field === "Menus") {
              goToPermissions(params.row);
            } else {
              setRoleID(params.row.Role_ID);
              setRoleName(params.row.Role_Name);
              setActiveStatus(params.row.Active_Status);
              setOpenEditModal(true);
            }
          }}
          sx={{ height: "100%", ...gridSx }}
        />
      </div>

      {/* Add Role Dialog */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 600 }}>
          Add Role
          <IconButton size="small" onClick={handleCloseAddModal}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Role Name"
            value={Role_Name}
            onChange={(e) => setRoleName(e.target.value)}
            size="small"
            autoFocus
            required
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success"
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseAddModal} sx={{ ...compactButtonSx, color: "#666" }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleAdd} sx={{ ...compactButtonSx, backgroundColor: "#0066FF" }}>
            {saving ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 600 }}>
          Edit Role
          <IconButton size="small" onClick={handleCloseEditModal}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Role Name"
            value={Role_Name}
            onChange={(e) => setRoleName(e.target.value)}
            size="small"
            required
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success"
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditModal} sx={{ ...compactButtonSx, color: "#666" }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleUpdate} sx={{ ...compactButtonSx, backgroundColor: "#0066FF" }}>
            {saving ? "Saving..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Role;
