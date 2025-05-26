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
  MenuItem
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

import { deepOrange } from "@mui/material/colors";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  
  getAdd,
  getUpdates,
  getdetails,
  getPlants
} from "../controller/SapMasterapiservice";
import { api } from "../controller/constants";
import { decryptSessionData } from "../controller/StorageUtils"
const Sap = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [UserID, setUserID] = useState('');
  const [Last_Punch, setLast_Punch] = useState('');

  const [ActiveStatus, setActiveStatus] = useState(false);
const [PlantTable, setPlantTable] = useState([]);
 // const UserID = localStorage.getItem("UserID");
 

  const [Plant_Code, setPlantCode] = useState("");
  const [SAP_LOGIN_ID, setSAPLOGINID] = useState("");
  const [Employee_ID, setEmployeeID] = useState("");
  const [User_Name, setUserName] = useState("");
  const [Dept_Name, setDeptName] = useState("");
  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 1 },

    { field: "SAP_LOGIN_ID", headerName: "Sap Login", flex: 1 },
    { field: "Employee_ID", headerName: "Employee ID", flex: 1 },
   { field: "User_Name", headerName: "Name", flex: 1 },
   { field: "Dept_Name", headerName: "Department", flex: 1 },
   {
    field: "Active_Status",
    headerName: "Active Status",
    flex: 1,
    renderCell: (params) => {
      const value = params.value;
      if (value === null || value === undefined) return "";
  
      const color = value === 1 ? "green" : "red";
      const label = value === 1 ? "Active" : "Inactive";
  
      return <span style={{ color, fontWeight: "bold" }}>{label}</span>;
    }
  },

//     {
//   field: "Active_Status",
//   headerName: "Active Status",
//   flex: 1,
//   renderCell: (params) => {
//     const isActive = params.row.Active_Status; // Assuming Active_Status is a boolean
//     return (
//       <span
//         style={{
//           color: isActive ? "#2e7d32" : "#d32f2f", // Green for active, red for inactive
//           fontWeight: "bold",
//         }}
//       >
//         {isActive ? "Active" : "Inactive"}
//       </span>
//     );
//   },
// },
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

    const get_Plant = async () => {
      try {
        const response = await getPlants();
        setPlantTable(response.data);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    };
  
    useEffect(() => {
    const encryptedData = sessionStorage.getItem('userData');
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      setUserID(decryptedData.UserID);
      console.log("us",decryptedData.UserID)
    }
  }, []);

  useEffect(() => {
    getData();
  }, []);

  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setPlantCode("");
    setSAPLOGINID("");
    

    setActiveStatus(true);
    setOpenAddModal(true);
    get_Plant();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setPlantCode(params.row.Plant_Code);

    setSAPLOGINID(params.row.SAP_LOGIN_ID);
    setEmployeeID(params.row.Employee_ID);
    setUserName(params.row.User_Name);
    setDeptName(params.row.Dept_Name);
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
    // get_Company();
  };

  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ["Plant_Code", "SAP_LOGIN_ID", "Employee_ID","User_Name","Dept_Name"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

 const handleAdd = async () => {
     console.log("Data being sent to the server:", {
      Plant_Code,
      SAP_LOGIN_ID,
       UserID,
     });
     console.log("Add button clicked");
   
    //  Step 1: Validate required fields
     if (
       
       Plant_Code === "" || SAP_LOGIN_ID ===""
      
     ) {
       alert("Please fill in all required fields");
       return;
     }
   
     
     try {
       // Prepare data to be sent
       const data = {
         UserID:UserID,
         Plant_Code:Plant_Code,
         SAP_LOGIN_ID:SAP_LOGIN_ID,
         Active_Status:ActiveStatus, // Make sure this is defined somewhere
       };
   
       // Step 3: Call the API to add the user
       const response = await getAdd(data); // Ensure getAdd uses a POST request
   
       if (response.data.success) {
         alert("Sap added successfully!");
         getData(); // refresh UI (e.g. user list)
         handleCloseAddModal(); // close the modal
       } else {
         alert(response.data.message || "Failed to add Role.");
       }
     } catch (error) {
       console.error("Error in adding Role:", error);
      // Step 4: Show error from server (like Employee_ID already exists)
      if (error.response && error.response.data && error.response.data.message) {
       alert(error.response.data.message);
     } else {
       alert("An error occurred while adding the Role.");
     }
   
     
     }
   };
 
    const handleUpdate = async () => {
        const data = {
        Employee_ID:Employee_ID,
        User_Name:User_Name,
        Dept_Name:Dept_Name,
          UserID:UserID,
          Active_Status: ActiveStatus,
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
   
  // excel download
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = ["Plant_Code", "SAP_LOGIN_ID","Employee_ID","User_Name","Dept_Name", "ActiveStatus"];

    const filteredData = data.map((item) => ({
      Plant_Code: item.Plant_Code,

      SAP_LOGIN_ID: item.SAP_LOGIN_ID,
      Employee_ID:item.Employee_ID,
      User_Name:item.User_Name,
      Dept_Name:item.Dept_Name,
      ActiveStatus: item.Active_Status ? "Active" : "Inactive",
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Company");
    XLSX.writeFile(workbook, "Company_Data.xlsx");
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
          Sap Acess Login
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
          getRowId={(row) => row.SAP_ID} // Specify a custom id field
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
            Add Sap Acess
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
                <MenuItem key={index} value={item.Plant_Id}>{item.Plant_Code}</MenuItem>
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
      {/* <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
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
            Edit Business Division
          </h3>
          

          
         

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
      </Modal> */}

     
    
    </div>
  );
};

export default Sap;
