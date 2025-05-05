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
  getAdd,
  getUpdates,
  getdetails,
  getCompany
  
} from "../controller/PlantMasterapiservices";

const Plant = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [CompanyCode, setCompanyCode] = useState([]);
  const [ActiveStatus, setActiveStatus] = useState(false);
  
  const [CompanyTable, setCompanyTable] = useState([]);
  const Username = localStorage.getItem('UserName');
  const UserID = localStorage.getItem('UserID');
  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);
  const [ PlantCode, setPlantCode] = useState("");
  const [ PlantID, setPlantID] = useState("");
  const [ PlantName, setPlantName] = useState("");
  const [ ShortName, setShortName] = useState("");
  const columns = [
    { field: "Com_Code", headerName: "Company Code ", flex: 1 },
    
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    
    { field: "Plant_Name", headerName: "Plant Name ", flex: 1 },
    // { field: "Short_Name", headerName: "Short Name ", flex: 1 },
    

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

  useEffect(() => {
    getData();
     console.log('username', Username)
     console.log('UserID', UserID)
  }, []);
 

 const get_Company = async () => {
    try {
      const response = await getCompany();
      setCompanyTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    get_Company();
    setPlantCode("");
   setCompanyCode("");
    setPlantName("");
    setShortName("");
   
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

 
 


  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setPlantID(params.row.Plant_ID);
    setCompanyCode(params.row.Com_Code);
    setPlantCode(params.row.Plant_Code);
    setPlantName(params.row.Plant_Name);
    setShortName(params.row.Short_Name);
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
    // get_Plant();
  };

  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        [
          "Com_Code",
          "Plant_Code",
          "Plant_Name",
          
          
        ].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  // ✅ Handle Add Material
  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
      ActiveStatus,UserID,PlantCode, PlantName,CompanyCode
    });
    console.log("Add button clicked");
    if (PlantCode === '' ||  PlantName === ''||CompanyCode==='' ) {
      alert("Please fill in all required fields");
      return;  // Exit the function if validation fails
    }
    // if (PlantCode.toString().length !== 4) {
    //   alert("Plant Code must be exactly 4 digits");
    //   return;
    // }
    try {
      const data = {
        UserID:UserID,
        Com_Code:CompanyCode,
        Plant_Code:PlantCode,
        
        Plant_Name: PlantName,
        Short_Name:ShortName, 
        Active_Status: ActiveStatus,
      };
      const response = await getAdd(data);
      if (response.data.success) {
        alert("  Plant added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to  Plant user.");
      }
    } catch (error) {
      console.error("Error in adding  Plant:", error);
  
      // Step 4: Show error from server (like Employee_ID already exists)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the  Plant.");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const data = {
        UserID:UserID,
        Plant_ID:  PlantID,
        // Plant_Code: PlantCode,
         
        Plant_Name:  PlantName,
        Short_Name:ShortName,
        Active_Status: ActiveStatus,
      };
  
      console.log("Data being sent:", data);
  
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
        alert("An error occurred while updating the  Plant. Please try again.");
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
      "CompanyCode",
      "PlantCode",
      "PlantName",
    
      
      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      PlantCode: item.Plant_Code,
      CompanyCode:item.Com_Code,
      PlantName: item.Plant_Name,
    
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plant");
    XLSX.writeFile(workbook, "Plant_Data.xlsx");
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
           Plant Master
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
          getRowId={(row) => row.Plant_ID} // Specify a custom id field
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
            Add  Plant
          </h3>
         
            <FormControl fullWidth>
                       <InputLabel>Company Code</InputLabel>
                       <Select
                         label="Company Code"
                         name="CompanyCode"
                         value={CompanyCode}
                         onChange={(e) => setCompanyCode(e.target.value)}
                         required
                       >
                         {CompanyTable.map((item, index) => (
                           <MenuItem key={index} value={item.Com_Id}>
                             {item.Com_Code}
                           </MenuItem>
                         ))}
                       </Select>
                     </FormControl>
            

          <TextField
  label="Plant Code"
  name="PlantCode"
  value={PlantCode}
  type="text"
  onChange={(e) => {
    const value = e.target.value;
    // Remove any non-digit character
    if (/^\d*$/.test(value)) {
      setPlantCode(value);
    }
  }}
  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' ,
    // maxLength: 4,

  }}
  required
/>


          <TextField
            label="Plant Name"
            name=" Plant Name"
            value={ PlantName}
            onChange={(e) => setPlantName(e.target.value)}
            required
          />
          <TextField
            label="Short Name"
            name="Short Name"
            value={ShortName}
            onChange={(e) => setShortName(e.target.value)}
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
            Edit Plant
          </h3>
          <TextField
                              label="Company Code"
                              name="Company_Code"
                              value={CompanyCode}
                              onChange={(e) => setCompanyCode(e.target.value)}
                              InputProps={{
                                readOnly: true,  // This makes the TextField read-only
                              }}
                            />
         <TextField
                     label="Plant Code"
                     name="Plant_Code"
                     value={PlantCode}
                     onChange={(e) => setPlantCode(e.target.value)}
                     InputProps={{
                       readOnly: true,  // This makes the TextField read-only
                     }}
                   />

         
          <TextField
            label=" Plant Name"
            name=" Plant Name"
            value={ PlantName}
            onChange={(e) => setPlantName(e.target.value)}
            required
          />
         <TextField
            label="Short Name"
            name="Short Name"
            value={ShortName}
            onChange={(e) => setShortName(e.target.value)}
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

export default Plant;
