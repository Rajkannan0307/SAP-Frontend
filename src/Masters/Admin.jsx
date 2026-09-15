import React, { useState, useEffect } from "react";
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
} from "@mui/material";
import {
  AddMenuAccess,
  get_ScreenType,
  get_ScreenName,
  getdetails,
  getdetailssub,
  get_Sub_Menu_List,
  Delete_Menu,
} from "../controller/AdminMasterapiservice";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
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

const Admin = () => {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const location = useLocation();
  const role = location.state?.role || "";
  const roleIdNo = location.state?.Role_No;

  const [menuData, setMenuData] = useState([]);
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [MenuTable, setMenuTable] = useState([]);
  const [MenusNameTable, setMenusNameTable] = useState([]);
  const [ScreenType, setScreenType] = useState("");
  const [ScreenName, setScreenName] = useState("");
  const [saving, setSaving] = useState(false);

  // Sub-menu management dialog — manages screens granted under one
  // Screen_Type, in-place, instead of navigating to a separate route.
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [activeScreenType, setActiveScreenType] = useState("");
  const [subGrantedRows, setSubGrantedRows] = useState([]);
  const [subAddableOptions, setSubAddableOptions] = useState([]);
  const [subSelectedScreen, setSubSelectedScreen] = useState("");
  const [subSearchText, setSubSearchText] = useState("");
  const [subFilteredRows, setSubFilteredRows] = useState([]);
  const [subSaving, setSubSaving] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subAddOpen, setSubAddOpen] = useState(false);

  const UserID = localStorage.getItem("UserID");

  const getData = async () => {
    try {
      const response = await getdetails(role, roleIdNo);
      setMenuData(response.data);
      setRows(response.data);
    } catch (error) {
      console.error("Error fetching menu data", error);
      toast.error("Failed to load menu permissions.");
    }
  };

  const getScreenType = async () => {
    try {
      const response = await get_ScreenType(roleIdNo, role);
      setMenuTable(response.data);
    } catch (error) {
      console.error("Error fetching screen types:", error);
    }
  };

  const getScreenNames = async () => {
    try {
      const response = await get_ScreenName(roleId, ScreenType);
      if (response.data && response.data.length > 0) {
        setMenusNameTable(response.data);
      }
    } catch (error) {
      console.error("Error fetching Screen Names:", error);
    }
  };

  useEffect(() => {
    getScreenNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, ScreenType]);

  useEffect(() => {
    if (roleId) {
      getData();
    } else {
      console.error("roleId is undefined!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const columns = [
    { field: "Screen_Type", headerName: "Menu Name", flex: 1, minWidth: 220 },
    {
      field: "menu",
      headerName: "Sub Menus",
      width: 130,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: () => (
        <Tooltip title="View / manage screens under this menu">
          <IconButton size="small" sx={{ color: "#0066FF" }}>
            <FolderOpenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const handleSearch = (value) => {
    const text = value.trim().toLowerCase();
    if (!text) {
      setRows(menuData);
      return;
    }
    setRows(menuData.filter((row) => String(row.Screen_Type || "").toLowerCase().includes(text)));
  };

  useEffect(() => {
    setRows(menuData);
  }, [menuData]);

  // ── Sub-menu management dialog (screens granted within one Screen_Type) ──
  // Same two endpoints Submenu.jsx used (getdetailssub / get_Sub_Menu_List),
  // keyed by the URL's roleId — identical to what the old route passed as
  // "roleNo" via the query string.
  const fetchSubGranted = async (screenType) => {
    try {
      const response = await getdetailssub(roleId, screenType);
      setSubGrantedRows(response.data || []);
      setSubFilteredRows(response.data || []);
    } catch (error) {
      console.error("Error fetching granted screens", error);
      toast.error("Failed to load granted screens.");
    }
  };

  const fetchSubAddable = async (screenType) => {
    try {
      const response = await get_Sub_Menu_List(roleId, screenType);
      setSubAddableOptions(response.data || []);
    } catch (error) {
      console.error("Error fetching addable screens", error);
    }
  };

  const openSubMenuDialog = async (screenType) => {
    setActiveScreenType(screenType);
    setSubSearchText("");
    setSubMenuOpen(true);
    setSubLoading(true);
    await Promise.all([fetchSubGranted(screenType), fetchSubAddable(screenType)]);
    setSubLoading(false);
  };

  const closeSubMenuDialog = () => {
    setSubMenuOpen(false);
    setActiveScreenType("");
    setSubGrantedRows([]);
    setSubFilteredRows([]);
    setSubAddableOptions([]);
  };

  const handleSubSearch = (value) => {
    const text = value.trim().toLowerCase();
    if (!text) {
      setSubFilteredRows(subGrantedRows);
      return;
    }
    setSubFilteredRows(subGrantedRows.filter((row) => String(row.Screen_Name || "").toLowerCase().includes(text)));
  };

  const openSubAddPicker = () => {
    setSubSelectedScreen("");
    setSubAddOpen(true);
  };

  const handleSubAdd = async () => {
    if (!subSelectedScreen) {
      toast.warn("Please select a Screen Name", { position: "top-center", autoClose: 1900, theme: "light" });
      return;
    }
    const data = { EmployeeId: UserID, role: roleId, screen: [subSelectedScreen] };
    setSubSaving(true);
    try {
      const response = await AddMenuAccess(data);
      setSubAddOpen(false);
      toast.success(response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      await Promise.all([fetchSubGranted(activeScreenType), fetchSubAddable(activeScreenType)]);
      getData(); // keep the outer menu list's counts in sync
    } catch (error) {
      if (error.response?.status === 500) {
        toast.error(error.response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      } else {
        toast.error("Error in Connection", { position: "top-center", theme: "light" });
      }
    } finally {
      setSubSaving(false);
    }
  };

  const handleSubDelete = async (Access_Id) => {
    if (!window.confirm("Remove this screen access from the role?")) return;
    try {
      // Matches Submenu.jsx's original call exactly (EmployeeId was never
      // populated there either — preserved as-is, not a behavior change).
      const response = await Delete_Menu(Access_Id, "");
      toast.success(response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      await Promise.all([fetchSubGranted(activeScreenType), fetchSubAddable(activeScreenType)]);
      getData();
    } catch (error) {
      if (error.response?.status === 500) {
        toast.error(error.response.data.message, { position: "top-center", autoClose: 1900, theme: "light" });
      } else {
        toast.error("Error in Connection", { position: "top-center", theme: "light" });
      }
    }
  };

  const handleOpenAddModal = () => {
    setOpenAddModal(true);
    getScreenType();
    getScreenNames();
    setScreenName("");
    setScreenType("");
  };
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleAdd = async () => {
    if (!role) {
      toast.warn("Please Provide a Role Name", { position: "top-center", autoClose: 1900, theme: "light" });
      return;
    }
    if (!ScreenType) {
      toast.warn("Please Select Screen Type", { position: "top-center", autoClose: 1900, theme: "light" });
      return;
    }
    if (!ScreenName) {
      toast.warn("Please Select Screen Name", { position: "top-center", autoClose: 1900, theme: "light" });
      return;
    }

    setSaving(true);
    try {
      const data = { UserID, role: roleIdNo, screen: [ScreenName] };
      const response = await AddMenuAccess(data);
      handleCloseAddModal();
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
        <span style={{ fontSize: 13, fontWeight: 600, color: "#2e3648" }}>{role || "Role"} — Permissions</span>
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
          placeholder="Search menu..."
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
            Add Permission
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
          getRowId={(row) => row.Access_ID}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          columnHeaderHeight={38}
          rowHeight={42}
          localeText={{ noRowsLabel: "No menu permissions granted yet for this role." }}
          onCellClick={(params) => {
            if (params.field === "menu") {
              const screenType = params.row.Screen_Type || "defaultScreen";
              openSubMenuDialog(screenType);
            }
          }}
          sx={{ height: "100%", ...gridSx }}
        />
      </div>

      {/* Add Permission Dialog */}
      <Dialog open={openAddModal} onClose={handleCloseAddModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 600 }}>
          Add Permission
          <IconButton size="small" onClick={handleCloseAddModal}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Screen Type</InputLabel>
            <Select label="Screen Type" value={ScreenType} onChange={(e) => setScreenType(e.target.value)} required>
              {MenuTable.map((item, index) => (
                <MenuItem key={index} value={item.Screen_Type}>{item.Screen_Type}</MenuItem>
              ))}
            </Select>
          </FormControl>

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
          <Button onClick={handleCloseAddModal} sx={{ ...compactButtonSx, color: "#666" }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleAdd} sx={{ ...compactButtonSx, backgroundColor: "#0066FF" }}>
            {saving ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sub-menu management dialog — grant/revoke screens under one
          Screen_Type in place, no separate page/route. */}
      <Dialog open={subMenuOpen} onClose={closeSubMenuDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 600 }}>
          <div>
            <div>{activeScreenType}</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>{role} — screen access</div>
          </div>
          <IconButton size="small" onClick={closeSubMenuDialog}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            <TextField
              size="small"
              placeholder="Search screen..."
              value={subSearchText}
              onChange={(e) => {
                setSubSearchText(e.target.value);
                handleSubSearch(e.target.value);
              }}
              sx={{ ...compactFieldSx, flexGrow: 1 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ fontSize: 18, color: "#888", mr: 1 }} />,
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={openSubAddPicker}
              disabled={subAddableOptions.length === 0}
              sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc", boxShadow: "none" }, whiteSpace: "nowrap" }}
            >
              Add Screen
            </Button>
          </div>

          <div style={{ height: 320, border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
            <DataGrid
              rows={subFilteredRows}
              loading={subLoading}
              columns={[
                { field: "Screen_Name", headerName: "Screen Name", flex: 1, minWidth: 180 },
                {
                  field: "remove",
                  headerName: "Remove",
                  width: 90,
                  sortable: false,
                  align: "center",
                  headerAlign: "center",
                  renderCell: (params) => (
                    <Tooltip title="Remove access">
                      <IconButton size="small" sx={{ color: "#d32f2f" }} onClick={() => handleSubDelete(params.row.Access_Id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ),
                },
              ]}
              getRowId={(row) => row.Access_Id}
              disableSelectionOnClick
              hideFooter
              columnHeaderHeight={36}
              rowHeight={38}
              localeText={{ noRowsLabel: "No screens granted yet under this menu." }}
              sx={gridSx}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeSubMenuDialog} sx={{ ...compactButtonSx, color: "#666" }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Screen picker (nested within the sub-menu dialog) */}
      <Dialog open={subAddOpen} onClose={() => setSubAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 600 }}>
          Add Screen Access
          <IconButton size="small" onClick={() => setSubAddOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Screen Name</InputLabel>
            <Select label="Screen Name" value={subSelectedScreen} onChange={(e) => setSubSelectedScreen(e.target.value)} required>
              {subAddableOptions.map((item, index) => (
                <MenuItem key={index} value={item.Screen_Id}>{item.Screen_Name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSubAddOpen(false)} sx={{ ...compactButtonSx, color: "#666" }}>Cancel</Button>
          <Button variant="contained" disabled={subSaving} onClick={handleSubAdd} sx={{ ...compactButtonSx, backgroundColor: "#0066FF" }}>
            {subSaving ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Admin;
