import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  FormControlLabel,
  IconButton,
  Select,
  Switch,
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
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { MenuItem, InputLabel, FormControl } from "@mui/material";
import {
  getdetails,
  getPlants,
  getAdd,
  getDepartment,
  getRole,
  getUpdates,
} from "../controller/UserMasterapiservice";

const UserMaster = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantCode, setPlantCode] = useState("");
  const [User_ID, setUserID] = useState("");
  const [Plant_Id, setPlantId] = useState([]);
  const [PlantTable, setPlantTable] = useState([]);
  const [DepartmentTable, setDepartmentTable] = useState([]);
  const [RoleTable, setRoleTable] = useState([]);
  const [User_Name, setUserName] = useState("");
  const [User_Email, setUserEmail] = useState("");
  const [User_Level, setUserLevel] = useState([]);
  const [Employee_ID, setEmployeeID] = useState("");
  const [Dept_Name, setDeptName] = useState([]);
  const [Role_Name, setRoleName] = useState("");
  const [Password, setPassword] = useState("");
  const UserID = localStorage.getItem('UserID');
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Employee_ID", headerName: "Employee ID", flex: 1 },
    { field: "User_Name", headerName: "UserName", flex: 1 },
    { field: "Dept_Name", headerName: "Department", flex: 2 },
    { field: "Role_Name", headerName: "Role", flex: 1 },
    {
      field: "ActiveStatus",
      headerName: "Active Status",
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.Active_Status; // Assuming Active_Status is a boolean
        return (
          <FormControlLabel
            control={
              <Switch
                checked={isActive} // Use the boolean value directly
                color="default" // Neutral color for default theme
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: isActive ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: isActive ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                  },
                }}
              />
            }
          />
        );
      },
    },
  ];

  const getData = async () => {
    try {
      const response = await getdetails();
      console.log(response); // Check the structure of response
      setData(response); // Ensure that this is correctly setting the data
      setOriginalRows(response); // for reference during search
      setRows(response);
    } catch (error) {
      console.error(error);
      setData([]); // Handle error by setting empty data
      setOriginalRows([]); // handle error case
      setRows([]);
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
  useEffect(() => {
    getData();
  }, []);

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setDeptName("");
    setPlantId("");
    setEmployeeID("");
    setPassword("");
    setRoleName("");
    setUserEmail("");
    setUserLevel("");
    setUserName("");
    get_Plant();
    GetDepartment();
    GetRole();
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleRowClick = (params) => {
    GetDepartment();
    GetRole();
    setPlantCode(params.row.Plant_Code);
    setDeptName(params.row.Dept_ID);
    setEmployeeID(params.row.Employee_ID);
    setRoleName(params.row.Role_ID);
    setUserLevel(params.row.User_Level);
    setUserEmail(params.row.User_Email);
    setPassword(params.row.Password);
    setUserName(params.row.User_Name);
    setUserID(params.row.User_ID); // This might be empty, ensure User_ID is set correctly
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
  };

  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
  
    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ['Plant_Code', 'Employee_ID', 'User_Name', 'Role_Name', 'Dept_Name'].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
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
        UserID:UserID,
        Plant_ID: Plant_Id,
        Employee_ID:Employee_ID,
        User_Name:User_Name,
        Dept_Name:Dept_Name,
        Role_Name:Role_Name,
        User_Level:User_Level,
        User_Email:User_Email,
        Password:Password,
        Active_Status:ActiveStatus, // Make sure this is defined somewhere
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
      User_Level: User_Level,
      User_Email: User_Email,
      Password: Password,
      Active_Status: ActiveStatus,
      UserID:UserID,
    };
    console.log("Data being sent:", data); // Log data to verify it before sending

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
      UserLevel: `Level ${item.User_Level}`,

      Email: item.User_Email,

      ActiveStatus: item.Active_Status ? "Active" : "Inactive"

    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, {
      header: DataColumns,
    });

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

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "840px", // or a specific height if necessary
      }}
    >
      {/* Header Section */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#2e59d9",
            textDecoration: "underline",
            textDecorationColor: "#88c57a",
            textDecorationThickness: "3px",
            marginBottom: -7,
          }}
        >
          User Master
        </h2>
      </div>

      {/* Search and Icons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {/* Search Box */}
        <div style={{ display: "flex", gap: "10px" }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Type here..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyUp={handleSearch}
            sx={{
              width: "400px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  border: "2px solid grey", // No border by default
                },
                "&:hover fieldset": {
                  border: "2px solid grey", // Optional: border on hover
                },
                "&.Mui-focused fieldset": {
                  border: "2px solid grey", // Grey border on focus
                },
              },
            }}
          />

          <Button
            onClick={handleSearch}
            style={{
              borderRadius: "25px",
              border: "2px solid grey",
              color: "grey",
              fontWeight: "bold",
            }}
          >
            <SearchIcon style={{ marginRight: "5px" }} />
            Search
          </Button>
        </div>

        {/* Icons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Download Button */}
          <IconButton
            onClick={handleDownloadExcel}
            style={{
              borderRadius: "50%",
              backgroundColor: "#339900",
              color: "white",
              width: "40px",
              height: "40px",
            }}
          >
            <FaFileExcel size={18} />
          </IconButton>

          {/* Add Button */}
          <IconButton
            onClick={handleOpenAddModal}
            style={{
              borderRadius: "50%",
              backgroundColor: "#0066FF",
              color: "white",
              width: "40px",
              height: "40px",
            }}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>

      {/* DataGrid */}
      <div
        style={{
          flexGrow: 1, // Ensures it grows to fill the remaining space
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "calc(5 * 48px)",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5} // Set the number of rows per page to 8
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.User_ID} // Specify a custom id field
          onRowClick={handleRowClick}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            // Header Style
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#2e59d9",
              color: "white",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "16px",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5", // Default row background
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            },
            // ✅ Remove Selected Row Background
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "inherit", // No background on selection
            },

            "& .MuiDataGrid-cell": {
              color: "#333",
              fontSize: "14px",
            },
          }}
        />
      </div>

      {/* {Add Model} */}
      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "10%",
            gap: "15px",
          }}
        >
          <h3
            style={{
              gridColumn: "span 2",
              textAlign: "center",
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
            }}
          >
            Add User
          </h3>
          <FormControl fullWidth>
            <InputLabel>Plant</InputLabel>
            <Select
              label="Plant"
              name="Plant"
              value={Plant_Id}
              onChange={(e) => setPlantId(e.target.value)}
              required
            >
              {PlantTable.map((item, index) => (
                <MenuItem key={index} value={item.Plant_Id}>
                  {item.Plant_Code} - {item.Plant_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              name="Role"
              value={Role_Name}
              onChange={(e) => setRoleName(e.target.value)}
              required
            >
              {RoleTable.map((item, index) => (
                <MenuItem key={index} value={item.Role_ID}>
                  {item.Role_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Employee ID"
            name="Employee_ID"
            value={Employee_ID}
            onChange={(e) => setEmployeeID(e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>UserLevel</InputLabel>
            <Select
              label="UserLevel"
              name="UserLevel"
              value={User_Level}
              onChange={(e) => setUserLevel(e.target.value)}
              required
            >
              <MenuItem value={1}>Level 1</MenuItem>
              <MenuItem value={2}>Level 2</MenuItem>
              <MenuItem value={3}>Level 3</MenuItem>
              <MenuItem value={4}>Level 4</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Email"
            name="Email"
            value={User_Email}
            onChange={(e) => setUserEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="User Name"
            name="User_Name"
            value={User_Name}
            onChange={(e) => setUserName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Password"
            name="Password"
            value={Password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              name="Department"
              value={Dept_Name}
              onChange={(e) => setDeptName(e.target.value)}
              required
            >
              {DepartmentTable.map((item, index) => (
                <MenuItem key={index} value={item.Dept_ID}>
                  {item.Dept_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success" // Always use 'success' to keep the thumb green when active
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                    backgroundImage: "none !important", // Disable background image
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // White thumb in both active and inactive states
                    borderColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Match thumb border with track color
                  },
                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"} // Text next to the switch
            labelPlacement="end"
            style={{
              color: ActiveStatus ? "#2e7d32" : "#d32f2f", // Change text color based on status
              fontWeight: "bold",
            }}
          />
          <Box
            sx={{
              gridColumn: "span 2",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={() => handleCloseAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              style={{ width: "90px" }}
              variant="contained"
              color="primary"
              onClick={handleAdd}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ Edit Modal */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "10%",
            gap: "15px",
          }}
        >
          <h3
            style={{
              gridColumn: "span 2",
              textAlign: "center",
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
            }}
          >
            Edit User
          </h3>
          <TextField
            label="Plant"
            name="Plant"
            value={PlantCode} // Use the current value of PlantCode
            fullWidth
            InputProps={{
              readOnly: true, // Make it read-only
            }}
            required
          />

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              label="Role"
              name="Role"
              value={Role_Name}
              onChange={(e) => setRoleName(e.target.value)}
              required
            >
              {RoleTable.map((item, index) => (
                <MenuItem key={index} value={item.Role_ID}>
                  {item.Role_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Employee ID"
            name="Employee_ID"
            value={Employee_ID}
            onChange={(e) => setEmployeeID(e.target.value)}
            fullWidth
            InputProps={{
              readOnly: true, // Make it read-only
            }}
          />

          <TextField
            label="Email"
            name="Email"
            value={User_Email}
            onChange={(e) => setUserEmail(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="User Name"
            name="User_Name"
            value={User_Name}
            onChange={(e) => setUserName(e.target.value)}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>UserLevel</InputLabel>
            <Select
              label="UserLevel"
              name="UserLevel"
              value={User_Level}
              onChange={(e) => setUserLevel(e.target.value)}
              required
            >
              <MenuItem value={1}>Level 1</MenuItem>
              <MenuItem value={2}>Level 2</MenuItem>
              <MenuItem value={3}>Level 3</MenuItem>
              <MenuItem value={4}>Level 4</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Password"
            name="Password"
            value={Password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              name="Department"
              value={Dept_Name}
              onChange={(e) => setDeptName(e.target.value)}
              required
            >
              {DepartmentTable.map((item, index) => (
                <MenuItem key={index} value={item.Dept_ID}>
                  {item.Dept_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success" // Always use 'success' to keep the thumb green when active
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                    backgroundImage: "none !important", // Disable background image
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // White thumb in both active and inactive states
                    borderColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Match thumb border with track color
                  },
                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"} // Text next to the switch
            labelPlacement="end"
            style={{
              color: ActiveStatus ? "#2e7d32" : "#d32f2f", // Change text color based on status
              fontWeight: "bold",
            }}
          />

          <Box
            sx={{
              gridColumn: "span 2",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseEditModal}
            >
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleUpdate}>
              Update
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default UserMaster;
