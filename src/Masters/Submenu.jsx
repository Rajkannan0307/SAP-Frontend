import React, { useState, useEffect } from "react";
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
} from "@mui/material";
import { AddMenuAccess, Delete_Menu, getdetailssub, get_Sub_Menu_List } from "../controller/AdminMasterapiservice";
import { useNavigate, useSearchParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SectionHeading from "../components/Header";

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

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Submenu = () => {
  const navigate = useNavigate();
  const [menuData, setMenuData] = useState([]);
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [searchParams] = useSearchParams();
  const [ScreenName, setScreenName] = useState("");
  const [saving, setSaving] = useState(false);
  const UserID = localStorage.getItem("UserID");

  const menuName = searchParams.get("menu_name");
  const role = searchParams.get("roleNo");
  const roleLabel = searchParams.get("role");

  const [employeeId] = useState("");
  const [MenusNameTable, setMenusNameTable] = useState([]);

  const getDrop = async () => {
    try {
      const response = await get_Sub_Menu_List(role, menuName);
      setMenusNameTable(response.data);
    } catch (error) {
      console.error("Error fetching menu data", error);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
    getDrop();
  };

  const handleCloseModal = () => {
    setScreenName("");
    setOpenModal(false);
  };

  const handleAdd = async () => {
    if (!ScreenName) {
      toast.warn("Please select a Screen Name", { position: "top-center", autoClose: 1900, theme: "light" });
      return;
    }

    const data = { EmployeeId: UserID, role, screen: [ScreenName] };

    setSaving(true);
    try {
      const response = await AddMenuAccess(data);
      handleCloseModal();
      toast.success(response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      getData();
    } catch (error) {
      if (error.response?.status === 500) {
        toast.error(error.response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      } else {
        toast.error("Error in Connection", { position: "top-center", theme: "light" });
      }
    } finally {
      setSaving(false);
    }
  };

  const getData = async () => {
    try {
      const response = await getdetailssub(role, menuName);
      setMenuData(response.data || []);
      setRows(response.data || []);
    } catch (error) {
      console.error("Error fetching menu data", error);
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, menuName]);

  const handleSearch = (value) => {
    const text = value.trim().toLowerCase();
    if (!text) {
      setRows(menuData);
      return;
    }
    setRows(menuData.filter((row) => String(row.Screen_Name || "").toLowerCase().includes(text)));
  };

  const handleDelete = async (Access_Id) => {
    // Confirmation guard only — same Delete_Menu API/behavior as before,
    // just prevents an accidental single-click permission revoke.
    if (!window.confirm("Remove this screen access from the role?")) return;
    try {
      const response = await Delete_Menu(Access_Id, employeeId);
      toast.success(response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      getData();
    } catch (error) {
      if (error.response?.status === 500) {
        toast.error(error.response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      } else {
        toast.error("Error in Connection", { position: "top-center", theme: "light" });
      }
    }
  };

  const columns = [
    { field: "Access_Id", headerName: "Access ID", width: 110 },
    { field: "Screen_Name", headerName: "Screen Name", flex: 1, minWidth: 220 },
    {
      field: "delete",
      headerName: "Remove",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Remove access">
          <IconButton size="small" sx={{ color: "#d32f2f" }} onClick={() => handleDelete(params.row.Access_Id)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

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
      <div style={{ marginBottom: 6 }}>
        <SectionHeading>Menu Management</SectionHeading>
      </div>

      <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />} sx={{ mb: 1.5, fontSize: 13 }}>
        <MuiLink
          component="button"
          underline="hover"
          onClick={() => navigate("/home/Role")}
          sx={{ fontSize: 13, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <ArrowBackIcon sx={{ fontSize: 15 }} /> Roles
        </MuiLink>
        <span style={{ fontSize: 13, color: "#666" }}>{roleLabel}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#2e3648" }}>{menuName}</span>
      </Breadcrumbs>

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
          placeholder="Search screen..."
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
            onClick={handleOpenModal}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc", boxShadow: "none" } }}
          >
            Add Access
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
          getRowId={(row) => row.Access_Id}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          columnHeaderHeight={38}
          rowHeight={42}
          localeText={{ noRowsLabel: "No screens granted yet under this menu." }}
          sx={{ height: "100%", ...gridSx }}
        />
      </div>

      {/* Add Access Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 600 }}>
          Add Access
          <IconButton size="small" onClick={handleCloseModal}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Screen Name</InputLabel>
            <Select label="Screen Name" value={ScreenName} onChange={(e) => setScreenName(e.target.value)} required>
              {MenusNameTable.map((item, index) => (
                <MenuItem key={index} value={item.Screen_Id}>{item.Screen_Name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModal} sx={{ ...compactButtonSx, color: "#666" }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleAdd} sx={{ ...compactButtonSx, backgroundColor: "#0066FF" }}>
            {saving ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Submenu;
