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
import { getdetails,getAdd,getUpdates,getPlants ,getSupvCode} from "../controller/StorageLocationapiservice";
import { MenuItem, InputLabel, FormControl } from '@mui/material';
const UserID = localStorage.getItem('UserID');
const StorageLocation = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
   const [PlantCode, setPlantCode] = useState([]);
   const[StorageCode,setStorageCode]=useState("");
   const[StorageName,setStorageName]=useState("");
   const [SLoc_ID, setSLocID] = useState([]);
    const [SupvTable, setSupvTable] = useState([])
     const [Supv_Code, setSupv_Code] = useState("");

 const columns = [
     { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
       { field: "Sup_Code", headerName: "Supervisor Code", flex: 1 },
     { field: "Storage_Code", headerName: "Storage Code", flex: 1 },
     { field: "SLoc_Name", headerName: "Storage Location Name", flex: 1 },
    
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

useEffect(() => {
  if (PlantCode) {
    get_SupvCode();        // Load supervisor codes
    setSupv_Code('');      // Reset selected supervisor
  } else {
    setSupvTable([]);      // Clear the table if no plant
  }
}, [PlantCode]);

 const get_SupvCode = async () => {
  try {
    const response = await getSupvCode(PlantCode);
    console.log("👉 SupvTable data:", response.data); // 👈 Check here
    setSupvTable(response.data);
  } catch (error) {
    console.error("❌ Error fetching supervisors:", error);
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
        ["Plant_Code","Storage_Code","SLoc_Name"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };
  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setPlantCode("");
    setStorageCode("");
    setStorageName("");
     setSupv_Code("");
    setActiveStatus(true);
    setOpenAddModal(true);
    get_SupvCode();
    get_Plant();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleRowClick = (params) => {
    setPlantCode(params.row.Plant_Code);
    setSLocID(params.row.SLoc_ID);
    setStorageCode(params.row.Storage_Code);
    setStorageName(params.row.SLoc_Name);
    setActiveStatus(params.row.Active_Status);
       setSupv_Code(params.row.Sup_Code);
    setOpenEditModal(true); // Open the modal
  };

  // ✅ Handle Add User
    const handleAdd = async () => {
      console.log("Data being sent to the server:", {
        PlantCode,
         StorageCode,StorageName,UserID,Supv_Code
       
      });
      console.log("Add button clicked");
    
      // Step 1: Validate required fields
      if (
        PlantCode === "" ||
        StorageCode === "" ||
        StorageName === ""  ||
        Supv_Code ===''
      ) {
        alert("Please fill in all required fields");
        return;
      }
     // Step 2: Validate StorageCode (must be exactly 4 digits)
  if (StorageCode.toString().length !== 4) {
    alert("Storage Code must be exactly 4 digits");
    return;
  }
     
      try {
        // Prepare data to be sent
        const data = {
          UserID:UserID,
          Plant_Code: PlantCode,
          Storage_Code:StorageCode,
           Supv_Code:Supv_Code,
          SLoc_Name:StorageName,
          Active_Status:ActiveStatus, // Make sure this is defined somewhere
        };
    
        // Step 3: Call the API to add the user
        const response = await getAdd(data); // Ensure getAdd uses a POST request
    
        if (response.data.success) {
          alert("StorageLocation added successfully!");
          getData(); // refresh UI (e.g. user list)
          handleCloseAddModal(); // close the modal
        } else {
          alert(response.data.message || "Failed to add StorageLocation.");
        }
      } catch (error) {
        console.error("Error in adding StorageLocation:", error);
    
        // Step 4: Show error from server (like Employee_ID already exists)
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert("An error occurred while adding the Storage Location.");
        }
      }
    };

 const handleUpdate = async () => {
     const data = {
      UserID:UserID,
     SLoc_ID: SLoc_ID,
     SLoc_Name: StorageName,
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
       alert("An error occurred while updating the StorageLocation. Please try again.");
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
         "Storage_Code",
         "SLoc_Name",
        "ActiveStatus",
        'Supv_Code'
      ];
  
      const filteredData = data.map((item) => ({
        Plant_Code: item.Plant_Code,
        Storage_Code:item.Storage_Code,
        Supv_Code:item.Sup_Code,
        SLoc_Name:item.SLoc_Name,
   
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
      XLSX.utils.book_append_sheet(workbook, worksheet, "StorageLocation");
      XLSX.writeFile(workbook, "StorageLocation_Data.xlsx");
    };
  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 90px)", // or a specific height if necessary
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
          Storage Location Master
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
          getRowId={(row) => row.SLoc_ID} // Specify a custom id field
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
                  Add Storage Location
                </h3>
                
                <FormControl fullWidth>
            <InputLabel>Plant Code</InputLabel>
            <Select
              label="Plant Code"
              name="PlantCode"
              value={PlantCode}
              onChange={(e) => setPlantCode(e.target.value)}
              required
            >
              {PlantTable.map((item, index) => (
                <MenuItem key={index} value={item.Plant_Id}>{item.Plant_Code}</MenuItem>
              ))}
            </Select>
          </FormControl>
        
           <FormControl fullWidth>
            <InputLabel>Supervisor Code</InputLabel>
            <Select
              label="Supervisor Code"
              name="Supervisor Code"
              value={Supv_Code}
              onChange={(e) => setSupv_Code(e.target.value)}
              required
            >
              {SupvTable
                .filter(item => item.Plant_ID=== PlantCode)  // or === parseInt(PlantCode)
                .map((item) => (
                  <MenuItem key={item.Supv_ID} value={item.Supv_ID}>
                    {item.Sup_Code}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
                  label="Storage Code"
                  name="Storage Code"
                  value={StorageCode} 
                 
                  type="text"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Remove any non-digit character
                    if (/^\d*$/.test(value)) {
                      setStorageCode(value);
                    }
                  }}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' ,
                     maxLength: 4,
                
                  }}
                  required
                 
                />
                <TextField
                  label="Storage Name"
                  name="StorageName"
                  value={StorageName} 
                  onChange={(e) => setStorageName(e.target.value)}
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
                  Edit Storage Location
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
      <TextField
                  label="Supervisor Code"
                  name="Supervisor Code"
                  value={Supv_Code}
                  onChange={(e) => setSupv_Code(e.target.value)}
                  InputProps={{
                    readOnly: true,  // This makes the TextField read-only
                  }}
                />
      <TextField
                  label="Storage Code"
                  name="Storage Code"
                  value={StorageCode} // Use the current value of PlantCode
                  fullWidth
                  InputProps={{
                    readOnly: true, // Make it read-only
                  }}
                  required
                />
                <TextField
                  label="Storage Name"
                  name="StorageName"
                  value={StorageName} 
                  onChange={(e) => setStorageName(e.target.value)}
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

export default StorageLocation;
