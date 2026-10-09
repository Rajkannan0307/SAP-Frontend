import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Button,
  Dialog,
  Badge,
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import {
  getdetails,
  getPlants,
  getAdd,
  getDepartment,
  getRole,
  getUpdates,
  getUserLevel,
  getDataAccessSummary
} from "../controller/UserMasterapiservice";
import UserDataAccessDialog from "./UserDataAccessDialog";
import FilterSelect from "../components/FilterSelect";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import {
  compactFieldSx,
  compactMenuProps,
  compactGridSx,
  primaryButtonSx,
  successButtonSx,
  outlineButtonSx,
} from "../components/compactUi";

const SEARCH_KEYS = ["Plant_Code", "Employee_ID", "User_Name", "Role_Name", "Dept_Name"];
const DIALOG_FIELD_SX = compactFieldSx("100%", 12);

// Compact select used by the Add / Edit dialogs
const SelectField = ({ label, value, onChange, options }) => (
  <TextField
    select
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    sx={DIALOG_FIELD_SX}
    SelectProps={{ MenuProps: compactMenuProps(12) }}
  >
    {options.map((o) => (
      <MenuItem key={o.value} value={o.value} sx={{ fontSize: 12 }}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>
);

const TextInput = ({ label, value, onChange, readOnly = false }) => (
  <TextField
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    sx={DIALOG_FIELD_SX}
    InputProps={{ readOnly }}
  />
);

const ActiveSwitch = ({ checked, onChange }) => (
  <FormControlLabel
    sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 700, color: checked ? "#2e7d32" : "#d32f2f" } }}
    control={
      <Switch
        size="small"
        checked={checked}
        onChange={onChange}
        color="success"
        sx={{
          "& .MuiSwitch-track": { backgroundColor: checked ? "#2e7d32" : "#d32f2f", opacity: 0.55 },
          "& .MuiSwitch-thumb": { backgroundColor: checked ? "#2e7d32" : "#d32f2f" },
        }}
      />
    }
    label={checked ? "Active" : "Inactive"}
  />
);

// Shell of the Add / Edit dialogs
const FormDialog = ({ open, title, onClose, children, actions }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    PaperProps={{ sx: { width: 460, maxWidth: "94vw", borderRadius: "10px" } }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid #e8eaee", backgroundColor: "#f3f7ff" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1a2233" }}>{title}</Typography>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
    <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px 12px" }}>{children}</Box>
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, py: 1.25, borderTop: "1px solid #e8eaee" }}>{actions}</Box>
  </Dialog>
);

const UserMaster = () => {
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantCode, setPlantCode] = useState("");
  const [User_ID, setUserID] = useState("");
  const [Plant_Id, setPlantId] = useState([]);
  const [PlantTable, setPlantTable] = useState([]);
  const [UserLevelTable, setUserLevelTable] = useState([]);
  const [DepartmentTable, setDepartmentTable] = useState([]);
  const [RoleTable, setRoleTable] = useState([]);
  const [User_Name, setUserName] = useState("");
  const [User_Email, setUserEmail] = useState("");
  const [User_Level, setUserLevel] = useState("");
  const [Employee_ID, setEmployeeID] = useState("");
  const [Dept_Name, setDeptName] = useState([]);
  const [Role_Name, setRoleName] = useState("");
  const [Password, setPassword] = useState("");
  const UserID = localStorage.getItem('UserID');
  const [accessUserId, setAccessUserId] = useState(null); // user whose Data Access dialog is open
  const [accessSummary, setAccessSummary] = useState({}); // { User_ID: { plants, divisions } } extra access per user

  const loadAccessSummary = async () => {
    try {
      setAccessSummary(await getDataAccessSummary());
    } catch (error) {
      console.error("Error loading data access summary:", error);
    }
  };

  // filters (the search box above them works on the same rows)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fPlant, setFPlant] = useState("All");
  const [fDept, setFDept] = useState("All");
  const [fRole, setFRole] = useState("All");
  const [fStatus, setFStatus] = useState("All");

  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 0.6, minWidth: 70 },
    { field: "Employee_ID", headerName: "Employee ID", flex: 0.9, minWidth: 90 },
    { field: "User_Name", headerName: "User Name", flex: 1.3, minWidth: 130 },
    { field: "Dept_Name", headerName: "Department", flex: 1.2, minWidth: 120 },
    { field: "Role_Name", headerName: "Role", flex: 1.2, minWidth: 120 },
    {
      field: "Active_Status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (value) => (value ? "Active" : "Inactive"),
      renderCell: (params) => {
        const isActive = !!params.row.Active_Status;
        return (
          <Chip
            size="small"
            label={isActive ? "Active" : "Inactive"}
            sx={{
              height: 20,
              fontSize: 10.5,
              fontWeight: 700,
              backgroundColor: isActive ? "#eafaf1" : "#fdeeee",
              color: isActive ? "#1b7a43" : "#b42323",
            }}
          />
        );
      },
    },
    {
      field: "DataAccess",
      headerName: "Data Access",
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const s = accessSummary[params.row.User_ID];
        const tip = s
          ? `Extra access: ${s.plants} plant${s.plants !== 1 ? "s" : ""}${s.divisions ? `, ${s.divisions} whole division${s.divisions !== 1 ? "s" : ""}` : ""}. Click to manage.`
          : "Manage Division / Plant data access (own plant only)";
        return (
          <Tooltip title={tip}>
            <IconButton
              size="small"
              sx={{ color: s ? "#0052cc" : "#8a93a3", p: 0.5 }}
              onClick={(e) => {
                e.stopPropagation(); // do not open the Edit User dialog
                setAccessUserId(params.row.User_ID);
              }}
            >
              <Badge
                badgeContent={s ? s.plants : 0}
                color="primary"
                max={99}
                sx={{ "& .MuiBadge-badge": { fontSize: 9.5, height: 15, minWidth: 15, padding: "0 4px", fontWeight: 700, backgroundColor: "#0066FF" } }}
              >
                <ManageAccountsIcon sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  const getData = async () => {
    try {
      const response = await getdetails();
      console.log(response); // Check the structure of response
      setData(response);
    } catch (error) {
      console.error(error);
      setData([]); // Handle error by setting empty data
    }
  };
  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  const get_UserLevel = async () => {
    try {
      const response = await getUserLevel();
      console.log(response);
      setUserLevelTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  useEffect(() => {
    getData();
    loadAccessSummary();
  }, []);

  // Search box + filters, applied live to the loaded users
  const rows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return (data || []).filter((row) => {
      if (fPlant !== "All" && String(row.Plant_Code) !== fPlant) return false;
      if (fDept !== "All" && row.Dept_Name !== fDept) return false;
      if (fRole !== "All" && row.Role_Name !== fRole) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.Active_Status) return false;
      if (!text) return true;
      return SEARCH_KEYS.some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [data, searchText, fPlant, fDept, fRole, fStatus]);

  const uniq = (key) => [...new Set((data || []).map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort();
  const activeFilterCount = [fPlant, fDept, fRole, fStatus].filter((v) => v !== "All").length;
  const clearFilters = () => {
    setFPlant("All");
    setFDept("All");
    setFRole("All");
    setFStatus("All");
  };

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // ✅ Handle Add Modal (Clear Fields and Fetch Dropdowns)
  const handleOpenAddModal = (item) => {
    setDeptName("");
    setPlantId("");
    setEmployeeID("");
    setPassword("");
    setRoleName("");
    setUserEmail("");
    setUserLevel(""); // ✅ Clear selected user level
    setUserName("");
    get_Plant();
    GetDepartment();
    GetRole();
    get_UserLevel(); // ✅ Fetch user levels (for dropdown)
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleRowClick = (params) => {
    GetDepartment();
    GetRole();
    get_UserLevel();
    setPlantCode(params.row.Plant_Code);
    setDeptName(params.row.Dept_ID);
    setEmployeeID(params.row.Employee_ID);
    setRoleName(params.row.Role_ID);
    setUserLevel(params.row.User_Level_ID);
    setUserEmail(params.row.User_Email);
    setPassword(params.row.Password);
    setUserName(params.row.User_Name);
    setUserID(params.row.User_ID); // This might be empty, ensure User_ID is set correctly
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
  };

  // ✅ Handle Add User
  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
      Plant_Id,
      Employee_ID,
      User_Name,
      Dept_Name,
      Role_Name,
      User_Level,
      User_Email,
      Password,
      UserID,
    });
    console.log("Add button clicked");

    // Step 1: Validate required fields
    if (
      Plant_Id === "" ||
      Employee_ID === "" ||
      User_Name === "" ||
      Dept_Name === "" ||
      Role_Name === "" ||
      User_Level === "" ||
      User_Email === "" ||
      Password === ""
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Step 2: Validate Email Format
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(User_Email)) {
      alert("Please enter a valid email address");
      return;
    }
    //   // Step 3: Validate Password Length
    // if (Password.length < 8) {
    //   alert("Password must be at least 8 characters long");
    //   return;
    // }
    try {
      // Prepare data to be sent
      const data = {
        UserID: UserID,
        Plant_ID: Plant_Id,
        Employee_ID: Employee_ID,
        User_Name: User_Name,
        Dept_Name: Dept_Name,
        Role_Name: Role_Name,
        User_Level_ID: User_Level,
        User_Email: User_Email,
        Password: Password,
        Active_Status: ActiveStatus, // Make sure this is defined somewhere
      };

      // Step 3: Call the API to add the user
      const response = await getAdd(data); // Ensure getAdd uses a POST request

      if (response.data.success) {
        alert("User added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to add user.");
      }
    } catch (error) {
      console.error("Error in adding user:", error);

      // Step 4: Show error from server (like Employee_ID already exists)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the user.");
      }
    }
  };

  const handleUpdate = async () => {
    const data = {
      User_ID: User_ID,
      User_Name: User_Name,
      Dept_Name: Dept_Name,
      Role_Name: Role_Name,
      User_Level_ID: User_Level,
      User_Email: User_Email,
      Password: Password,
      Active_Status: ActiveStatus,
      UserID: UserID,
    };
    console.log("Data being sent:", data); // Log data to verify it before sending

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(User_Email)) {
      alert("Please enter a valid email address");
      return;
    }
    try {
      const response = await getUpdates(data);

      // If success
      if (response.data.success) {
        alert(response.data.message);
        getData(); // Refresh data
        handleCloseEditModal(); // Close modal
      } else {
        // If success is false, show the backend message
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);

      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message); // Specific error from backend
      } else {
        alert("An error occurred while updating the Vendor. Please try again.");
      }
    }
  };
  const GetDepartment = async () => {
    try {
      const response = await getDepartment();
      setDepartmentTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  const GetRole = async () => {
    try {
      const response = await getRole();
      setRoleTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = [
      "Plant_Code",
      "EmployeeID",
      "UserName",
      "Department",
      "Role",
      "UserLevel",
      "Email",
      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      Plant_Code: item.Plant_Code,
      EmployeeID: item.Employee_ID,
      UserName: item.User_Name,
      Department: item.Dept_Name,
      Role: item.Role_Name,
      UserLevel: item.User_Level_Name,

      Email: item.User_Email,

      ActiveStatus: item.Active_Status ? "Active" : "Inactive"

    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, {
      header: DataColumns,
    });
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 50 },
      { wch: 50 },
      { wch: 20 },
    ];
    // Style header row
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = {
        font: {
          bold: true,
          color: { rgb: "000000" },
        },
        fill: {
          fgColor: { rgb: "FFFF00" },
        },
        alignment: {
          horizontal: "center",
        },
      };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User");
    XLSX.writeFile(workbook, "User_Data.xlsx");
  };

  // dropdown option lists of the dialogs
  const roleOptions = RoleTable.map((i) => ({ value: i.Role_ID, label: i.Role_Name }));
  const levelOptions = UserLevelTable.map((i) => ({ value: i.User_Level_ID, label: i.User_Level_Name }));
  const deptOptions = DepartmentTable.map((i) => ({ value: i.Dept_ID, label: i.Dept_Name }));
  const plantOptions = PlantTable.map((i) => ({ value: i.Plant_Id, label: `${i.Plant_Code} - ${i.Plant_Name}` }));

  return (
    <div
      style={{
        padding: "20px 20px",
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 50px)",
      }}
    >
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>
        User Master
      </Typography>

      {/* Search, filters and actions */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 6,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="Search plant, employee, name, department, role"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {rows.length === data.length ? `${data.length} users` : `${rows.length} of ${data.length} users`}
        </span>
        <Button
          onClick={handleDownloadExcel}
          variant="contained"
          disableElevation
          startIcon={<FaFileExcel size={13} />}
          sx={successButtonSx}
        >
          Excel
        </Button>
        <Button
          onClick={handleOpenAddModal}
          variant="contained"
          disableElevation
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          sx={primaryButtonSx}
        >
          Add User
        </Button>

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Plant" value={fPlant} options={uniq("Plant_Code")} onChange={setFPlant} minWidth={140} />
          <FilterSelect label="Department" value={fDept} options={uniq("Dept_Name")} onChange={setFDept} minWidth={170} />
          <FilterSelect label="Role" value={fRole} options={uniq("Role_Name")} onChange={setFRole} minWidth={170} />
          <FilterSelect label="Status" value={fStatus} options={["Active", "Inactive"]} onChange={setFStatus} minWidth={120} isSearchable={false} />
        </FilterPanel>
      </div>

      {/* DataGrid */}
      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.User_ID} // Specify a custom id field
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          disableColumnMenu
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No users found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add User */}
      <FormDialog
        open={openAddModal}
        title="Add User"
        onClose={() => setOpenAddModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => handleCloseAddModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleAdd} sx={{ ...primaryButtonSx, minWidth: 70 }}>Add</Button>
          </>
        }
      >
        <SelectField label="Plant" value={Plant_Id} onChange={(e) => setPlantId(e.target.value)} options={plantOptions} />
        <SelectField label="Role" value={Role_Name} onChange={(e) => setRoleName(e.target.value)} options={roleOptions} />
        <TextInput label="Employee ID" value={Employee_ID} onChange={(e) => setEmployeeID(e.target.value)} />
        <SelectField label="User Level" value={User_Level} onChange={(e) => setUserLevel(e.target.value)} options={levelOptions} />
        <TextInput label="Email" value={User_Email} onChange={(e) => setUserEmail(e.target.value)} />
        <TextInput label="User Name" value={User_Name} onChange={(e) => setUserName(e.target.value)} />
        <TextInput label="Password" value={Password} onChange={(e) => setPassword(e.target.value)} />
        <SelectField label="Department" value={Dept_Name} onChange={(e) => setDeptName(e.target.value)} options={deptOptions} />
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Edit User */}
      <FormDialog
        open={openEditModal}
        title="Edit User"
        onClose={() => setOpenEditModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseEditModal} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleUpdate} sx={{ ...primaryButtonSx, minWidth: 70 }}>Update</Button>
          </>
        }
      >
        <TextInput label="Plant" value={PlantCode} readOnly />
        <SelectField label="Role" value={Role_Name} onChange={(e) => setRoleName(e.target.value)} options={roleOptions} />
        <TextInput label="Employee ID" value={Employee_ID} onChange={(e) => setEmployeeID(e.target.value)} readOnly />
        <TextInput label="Email" value={User_Email} onChange={(e) => setUserEmail(e.target.value)} />
        <TextInput label="User Name" value={User_Name} onChange={(e) => setUserName(e.target.value)} />
        <SelectField label="User Level" value={User_Level} onChange={(e) => setUserLevel(e.target.value)} options={levelOptions} />
        <TextInput label="Password" value={Password} onChange={(e) => setPassword(e.target.value)} />
        <SelectField label="Department" value={Dept_Name} onChange={(e) => setDeptName(e.target.value)} options={deptOptions} />
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      <UserDataAccessDialog
        open={accessUserId !== null}
        userId={accessUserId}
        onClose={(saved) => {
          setAccessUserId(null);
          if (saved) loadAccessSummary(); // refresh the badges after a save
        }}
      />
    </div>
  );
};

export default UserMaster;
