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
import { getdetails,getAdd,getUpdates } from "../controller/Roleapiservices";
const Role = () => {
    const [searchText, setSearchText] = useState("");
      const [rows, setRows] = useState([]);
      const [originalRows, setOriginalRows] = useState([]);
      const [data, setData] = useState([]);
      const [openAddModal, setOpenAddModal] = useState(false);
      const [openEditModal, setOpenEditModal] = useState(false);
      const [ActiveStatus, setActiveStatus] = useState(false);
      const [Role_Name, setRoleName] = useState("");
      const [Role_ID, setRoleID] = useState("");
      const UserID = localStorage.getItem('UserID');
       const columns = [
          
          { field: "Role_Name", headerName: "Role", flex: 1,width:"40%" },
          {
            field: "ActiveStatus",
            headerName: "Active Status",
            width:"40%",
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
        [ 'Role_Name'].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };
  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
     setRoleName("")
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleRowClick = (params) => {
    setRoleID(params.row.Role_ID);
    setRoleName(params.row.Role_Name);
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
  };

 // ✅ Handle Add User
  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
     
      Role_Name,
      UserID,
    });
    console.log("Add button clicked");
  
    // Step 1: Validate required fields
    if (
      
      Role_Name === "" 
     
    ) {
      alert("Please fill in all required fields");
      return;
    }
  
    
    try {
      // Prepare data to be sent
      const data = {
        UserID:UserID,
        Role_Name:Role_Name,
        
        Active_Status:ActiveStatus, // Make sure this is defined somewhere
      };
  
      // Step 3: Call the API to add the user
      const response = await getAdd(data); // Ensure getAdd uses a POST request
  
      if (response.data.success) {
        alert("Role added successfully!");
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
        Role_ID:Role_ID,
         Role_Name: Role_Name,
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
        Role Master
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
      <div style={{ display: "flex", gap: "10px", marginRight:"30%" }}>
       

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
        width:"70%",
    //    marginLeft:"10%",
      flexGrow: 1, // Ensures it grows to fill the remaining space
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        height: "calc(5 * 48px)",
        display: "flex",
alignItems: "center",
justifyContent: "center",

      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5} // Set the number of rows per page to 8
        rowsPerPageOptions={[5]}
        getRowId={(row) => row.Role_ID} // Specify a custom id field
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
                Add Role
              </h3>
              
              
                <TextField
                  label="Role"
                  name="Role"
                  value={Role_Name}
                  onChange={(e) => setRoleName(e.target.value)}
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
                      Edit Role
                    </h3>
                    <TextField
                  label="Role"
                  name="Role"
                  value={Role_Name}
                  onChange={(e) => setRoleName(e.target.value)}
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
  )
}

export default Role
