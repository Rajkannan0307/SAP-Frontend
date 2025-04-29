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
import { getdetails,getAdd,getUpdates,getActiveMovementType } from "../controller/MovementListItem";
import { MenuItem, InputLabel, FormControl } from '@mui/material';
const MVT_LIST_ITEM = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [MovementTypeTable, setMovementTypeTable] = useState([]);
   const [MovementType, setMovementType] = useState([]);
   const[MovementListCode,setMovementListCode]=useState("");
   const[MovementListName,setMovementListName]=useState("");
 const columns = [
     { field: "Movement_Name", headerName: "Movement Name", flex: 1 },
     { field: "Movement_List_Code", headerName: "Movement List Code", flex: 1 },
     { field: "Movement_List_Name", headerName: "Movement List Name", flex: 1 },
    
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
  useEffect(() => {
    getData();
  }, []);


  const Get_ActiveMovementType = async () => {
      try {
        const response = await getActiveMovementType();
        setMovementTypeTable(response.data);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    };

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        [""].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };
  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
   
    setActiveStatus(true);
    setOpenAddModal(true);
    Get_ActiveMovementType();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleRowClick = (params) => {
   
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
  };

  // ✅ Handle Add User
    const handleAdd = async () => {
      console.log("Data being sent to the server:", {
        // Plant_Id,
        // Employee_ID,
        // User_Name,
        // Dept_Name,
        // Role_Name,
        // User_Level,
        // User_Email,
        // Password,
      });
      console.log("Add button clicked");
    
      // Step 1: Validate required fields
      // if (
      //   Plant_Id === "" ||
      //   Employee_ID === "" ||
      //   User_Name === "" ||
      //   Dept_Name === "" ||
      //   Role_Name === "" ||
      //   User_Level === "" ||
      //   User_Email === "" ||
      //   Password === ""
      // ) {
      //   alert("Please fill in all required fields");
      //   return;
      // }
    
     
      try {
        // Prepare data to be sent
        const data = {
         
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
          Movement List Item Master
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
          getRowId={(row) => row.Movt_List_ID} // Specify a custom id field
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
                  Add Movement List Item
                </h3>
                
                <FormControl fullWidth>
            <InputLabel>Movement Type</InputLabel>
            <Select
              label="Movement Type"
              name="MovementType"
              value={MovementType}
              onChange={(e) => setMovementType(e.target.value)}
              required
            >
              {MovementTypeTable.map((item, index) => (
                <MenuItem key={index} value={item.Movement_ID}>{item.Movement_Name}</MenuItem>
              ))}
            </Select>
          </FormControl>
           <TextField
                            label="MovementList Code"
                            name="MovementList Code"
                            value={MovementListCode} 
                           
                            type="text"
                            onChange={(e) => {
                              const value = e.target.value;
                              // Remove any non-digit character
                              if (/^\d*$/.test(value)) {
                                setMovementListCode(value);
                              }
                            }}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' ,
                              // maxLength: 4,
                          
                            }}
                            required
                           
                          />
                           <TextField
                                            label="MovementList Name"
                                            name="MovementListName"
                                            value={MovementListName} 
                                            onChange={(e) => setMovementListName(e.target.value)}
                                            fullWidth
                                            
                                            required
                                          />
      
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
                  Edit Movement List Item
                </h3>
                <TextField
                  label="Movement Type"
                  name="MovementType"
                  value={MovementType} // Use the current value of PlantCode
                  fullWidth
                  InputProps={{
                    readOnly: true, // Make it read-only
                  }}
                  required
                />
      
        <TextField
                        label="MovementList Code"
                        name="MovementList Code"
                        value={MovementListCode} // Use the current value of PlantCode
                        fullWidth
                        InputProps={{
                          readOnly: true, // Make it read-only
                        }}
                        required
                      />
                      <TextField
                        label="MovementList Name"
                        name="MovementListName"
                        value={MovementListName} 
                        onChange={(e) => setMovementListName(e.target.value)}
                        fullWidth
                        
                        required
                      />
            
      
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


export default MVT_LIST_ITEM;
