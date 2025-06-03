import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  FormControl,
  InputLabel,
  IconButton,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormHelperText,
  FormLabel,ListSubheader
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


import {
  getAdd,
  getUpdates,
  getdetails,
  getPlants,
  getcategory,
} from "../controller/SapMasterapiservice";

import { decryptSessionData } from "../controller/StorageUtils";
import { Label } from "@mui/icons-material";
const Sap = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [Category, setCategory] = useState("");
   const [role, setRole] = useState('');
  const [UserID, setUserID] = useState("");
  const [Last_Punch, setLast_Punch] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [selectOpen, setSelectOpen] = useState(false); 
  
const [SAP_ID, setSapID] = useState("");
const [filteredEmployees, setFilteredEmployees] = useState([]); // Based on category
 
  const [PlantTable, setPlantTable] = useState([]);
  // const UserID = localStorage.getItem("UserID");

  const [Plant_Code, setPlantCode] = useState("");
  const [SAP_LOGIN_ID, setSAPLOGINID] = useState("");
 
const [EmployeeID, setEmployeeID] = useState('');
const [UserName, setUserName] = useState('');
const [DeptName, setDeptName] = useState('');
const [ActiveStatus, setActiveStatus] = useState('');
// const filtered = filteredEmployees.filter((emp) =>
//     emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
//   );
  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 1 },

    { field: "SAP_LOGIN_ID", headerName: "Sap Login", flex: 1 },
    { field: "Employee_ID", headerName: "Employee ID", flex: 1 },
    { field: "Employee_Name", headerName: "Name", flex: 1 },
    { field: "Category", headerName: "Category", flex: 1 },
    { field: "Dept_Name", headerName: "Department", flex: 1 },
    {
  field: "Active_Status",
  headerName: "Active Status",
  flex: 1,
  renderCell: (params) => {
    const value = params.row.Active_Status;

    if (value === undefined || value === null) return "";

    const color = value === true ? "green" : "red";
    const label = value === true ? "Active" : "Inactive";

    return <span style={{ color, fontWeight: "bold" }}>{label}</span>;
  },
},
{ field: "Last_Punch", headerName: "Last Punch", flex: 1 },
  ];

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

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
const fetchCategoryData = async (selectedCategory, Plant_Code) => {
  try {
    console.log("Fetching employees for", selectedCategory, Plant_Code);
    const response = await getcategory(selectedCategory, Plant_Code);
    console.log("Response from getcategory:", response);
    if (response.success) {
      setFilteredEmployees(response.data);
      setEmployeeID(''); // reset selection when employee list changes
    } else {
      console.error('Backend error:', response.message);
      setFilteredEmployees([]);
      setEmployeeID('');
    }
  } catch (error) {
    console.error('Error fetching category data:', error);
    setFilteredEmployees([]);
    setEmployeeID('');
  }
};



// useEffect(() => {
//   const fetchEmployees = async () => {
//     try {
//       const response = await getcategory(Category, Plant_Code);
//       const data = response.data;

//       // Normalize employee data
//       const normalizedEmployees = data.map((emp) => ({
//         ...emp,
//         employee_id: emp.gen_id, // Use a consistent key
//         Emp_Name: Category === "executive" ? emp.Emp_Name : emp.fullname,
//       }));

//       setFilteredEmployees(normalizedEmployees);
//     } catch (err) {
//       console.error("Failed to fetch employees", err);
//     }
//   };

//   if (Category) {
//     fetchEmployees();
//   }
// }, [Category, Plant_Code]);

// useEffect(() => {
//     const timer = setTimeout(() => {
//       window.location.reload();
//     }, 3600000);

//     // Clean up on unmount
//     return () => clearTimeout(timer);
//   }, []);

useEffect(() => {
  // Decrypt session data
  const encryptedData = sessionStorage.getItem("userData");
  if (encryptedData) {
    const decryptedData = decryptSessionData(encryptedData);
    setUserID(decryptedData.UserID);
    setRole(decryptedData.RoleId);
    console.log("sap roleid", decryptedData.RoleId);
    console.log("Sap userid", decryptedData.UserID);
  }

  // Auto-refresh after 1 hour 5 min
  const timer = setTimeout(() => {
    window.location.reload();
  }, 3900000);  //1 hr 5 min

  // Fetch employee data
  const fetchEmployees = async () => {
    if (Category) {
      try {
        const response = await getcategory(Category, Plant_Code);
        const data = response.data;

        // Normalize employee data
        const normalizedEmployees = data.map((emp) => ({
  ...emp,
  employee_id: emp.gen_id,
  Emp_Name:
    Category === "executive"
      ? emp.Emp_Name || emp.fullname 
      : emp.fullname || emp.Emp_Name ,
}));

        setFilteredEmployees(normalizedEmployees);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    }
  };

  fetchEmployees();

  // Fetch other data
  getData();

  // Cleanup
  return () => clearTimeout(timer);
}, [Category, Plant_Code]);


  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
 

//   useEffect(() => {
//     const encryptedData = sessionStorage.getItem("userData");
//     if (encryptedData) {
//       const decryptedData = decryptSessionData(encryptedData);
//       setUserID(decryptedData.UserID);
//        setRole(decryptedData.RoleId);
//       console.log("sap roleid", decryptedData.RoleId)
//       console.log("Sap userid", decryptedData.UserID);
//     }
//   }, []);
  const isCorp = role === 7 || role === 9;
const isPlantMRPC = role === 4;

//   useEffect(() => {
//     getData();
//   }, []);



  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setPlantCode("");
    setSAPLOGINID("");

    setOpenAddModal(true);
    get_Plant();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setSapID(params.row.SAP_ID)
    setPlantCode(params.row.Plant_Code);
    setLast_Punch(params.row.Last_Punch);
    setSAPLOGINID(params.row.SAP_LOGIN_ID);
    setEmployeeID(params.row.Employee_ID);
   setCategory(params.row.Category);
console.log("Category from row:", params.row.Category);

    setUserName(params.row.Employee_Name);
    setDeptName(params.row.Dept_Name);
   const statusLabel = params.row.Active_Status === true ? "Active" : "Inactive";
  setActiveStatus(statusLabel);
   const category = params.row.Category;
  setCategory(category);// This ensures category is set

    setOpenEditModal(true); // Open the modal
    // get_Company();
  };

  // ✅ Search Functionality
  const handleSearch = () => {
  const text = searchText.trim().toLowerCase();

  const filteredRows = originalRows.filter((row) =>
    ["Plant_Code", "SAP_LOGIN_ID", "Employee_ID", "Employee_Name","Category", "Dept_Name"].some((key) => {
      const value = row[key];
      return value?.toString().toLowerCase().includes(text);
    })
  );

  setRows(text ? filteredRows : originalRows);
};


  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
      Plant_Code,
      SAP_LOGIN_ID,
      UserID,
    });
    console.log("Add button clicked");

    //  Step 1: Validate required fields
    if (Plant_Code === "" || SAP_LOGIN_ID === "") {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Prepare data to be sent
      const data = {
        UserID: UserID,
        Plant_Code: Plant_Code,
        SAP_LOGIN_ID: SAP_LOGIN_ID,
      
      };

      // Step 3: Call the API to add the user
      const response = await getAdd(data); // Ensure getAdd uses a POST request

      if (response.data.success) {
        alert("Sap added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to add Sap.");
      }
    } catch (error) {
      console.error("Error in adding Sap:", error);
      // Step 4: Show error from server (like Employee_ID already exists)
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the Sap.");
      }
    }
  };

  const handleUpdate = async () => {
   const data = {
  EmployeeID,
  UserName,
  SAP_ID,
  SAP_LOGIN_ID,
  Category,         // ✅ Add this
  UserID,
  Active_Status: ActiveStatus === "Active" ? 1 : 0, 
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

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message); // Specific error from backend
      } else {
        alert("An error occurred while updating the Sap. Please try again.");
      }
    }
  };

  // excel download
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = [
      "Plant_Code",
      "SAP_LOGIN_ID",
      "Employee_ID",
      "Name",
      "Category",
      "Department",
      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      Plant_Code: item.Plant_Code,

      SAP_LOGIN_ID: item.SAP_LOGIN_ID,
      Employee_ID: item.Employee_ID,
      Name: item.Employee_Name,
      Category:item.Category,
      Department: item.Dept_Name,
      ActiveStatus: item.Active_Status ? "Active" : "Inactive",
      Last_Punch:item.Last_Punch
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "SAP");
    XLSX.writeFile(workbook, "SAP_Data.xlsx");
  };

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
         height: "calc(100vh - 90px)",// or a specific height if necessary
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
          Sap Access Login
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
         {isCorp && (
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
)}
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
          getRowId={(row) => row.SAP_ID} // Specify a custom id field
          onRowClick={handleRowClick}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            // Header Style
            "& .MuiDataGrid-columnHeader": {
             backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
              color: "black",
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
{isCorp && (
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
            Add Sap Access
          </h3>

          <FormControl fullWidth>
            <InputLabel>Plant Code</InputLabel>
            <Select
              label="Plant Code"
              name="PlantCode"
              value={Plant_Code}
              onChange={(e) => setPlantCode(e.target.value)}
              required
            >
              {PlantTable.map((item, index) => (
                <MenuItem key={index} value={item.Plant_Id}>
                  {item.Plant_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="SAP_LOGIN_ID"
            name="SAP_LOGIN_ID"
            value={SAP_LOGIN_ID}
            onChange={(e) => setSAPLOGINID(e.target.value)}
            required
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
  onClick={handleCloseAddModal}
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
)}
      {/* ✅ Edit Modal */}
      {(isCorp || isPlantMRPC) && (
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
          Edit SAP Access Login
        </h3>

        <TextField
  label="Plant Code"
  name="Plant_Code"
  value={Plant_Code}
  onChange={(e) => setPlantCode(e.target.value)}
  InputProps={{ readOnly: !isCorp }}
/>

<TextField
  label="SAP_LOGIN_ID"
  name="SAP_LOGIN_ID"
  value={SAP_LOGIN_ID}
  onChange={(e) => setSAPLOGINID(e.target.value)}
  InputProps={{ readOnly: !isCorp }}
/>


        {/* Category Radio Buttons */}
       <Box
  sx={{
    gridColumn: "span 2",
    display: "flex",
    alignItems: "center",
    gap: 2,
  }}
>
  <FormLabel component="legend" sx={{ whiteSpace: "nowrap" }}>
    Category
  </FormLabel>
  <RadioGroup
    row
    value={Category}
    onChange={(e) => {
      const selected = e.target.value;
      setCategory(selected);

      // Reset employee info
      setEmployeeID("");
      setUserName("");
      setDeptName("");
      setActiveStatus("");
    }}
  >
    <FormControlLabel
      value="Executive"
      control={<Radio />}
      label="Executive"
    />
    <FormControlLabel
      value="Temporary"
      control={<Radio />}
      label="Temporary"
    />
  </RadioGroup>
</Box>

{/* Employee Select */}
<FormControl fullWidth disabled={!Category}>
  <InputLabel id="employee-select-label">Employee</InputLabel>
 <Select
  labelId="employee-select-label"
  value={EmployeeID}
  label="Employee"
  open={selectOpen}
  onOpen={() => setSelectOpen(true)}
  onClose={() => {
    setSelectOpen(false);
    setSearchTerm(""); // ✅ Reset search when dropdown closes
  }}
  onChange={(e) => {
    const selectedId = e.target.value;
    setEmployeeID(selectedId);

    const selectedEmployee = filteredEmployees.find(
      (emp) => emp.employee_id === selectedId
    );

    if (selectedEmployee) {
      setUserName(selectedEmployee.Emp_Name);
      setDeptName(selectedEmployee.dept_name);
      setActiveStatus(selectedEmployee.Active_Status === 1 ? "Active" : "Inactive");
    }

    // Optionally clear search here too:
    setSearchTerm("");
    setSelectOpen(false); // Close dropdown after selection
  }}
  MenuProps={{
    PaperProps: {
      style: { maxHeight: 600 },
      onMouseDown: (event) => {
        if (event.target.closest("input")) {
          event.stopPropagation();
        }
      },
    },
  }}
>
  <ListSubheader disableSticky>
    <TextField
      size="small"
      placeholder="Search Employee ID"
      fullWidth
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      inputProps={{
        style: { padding: "6px 8px", fontSize: 14 },
      }}
    />
  </ListSubheader>

  <MenuItem value="">Select Employee</MenuItem>

  {filteredEmployees
    .filter((emp) =>
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((emp) => (
      <MenuItem dense key={emp.employee_id} value={emp.employee_id}>
        {emp.employee_id} - {emp.Emp_Name}
      </MenuItem>
    ))}
</Select>


  {!Category && (
    <FormHelperText>Please select a category first</FormHelperText>
  )}
</FormControl>


<TextField
  label="User Name"
  variant="outlined"
  fullWidth
  value={UserName}
  InputProps={{ readOnly: true }}
  InputLabelProps={{ shrink: true }}
/>

<TextField
  label="Department"
  variant="outlined"
  fullWidth
  value={DeptName}
  InputProps={{ readOnly: true }}
  InputLabelProps={{ shrink: true }}
/>

<TextField
  label="Active Status"
  variant="outlined"
  fullWidth
  value={ActiveStatus}
  InputProps={{ readOnly: true }}
  InputLabelProps={{ shrink: true }}
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
          <Button variant="contained" color="error" onClick={handleCloseEditModal}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleUpdate}>
            Update
          </Button>
        </Box>
      </Box>
    </Modal>
     )}
    </div>
  );
};

export default Sap;