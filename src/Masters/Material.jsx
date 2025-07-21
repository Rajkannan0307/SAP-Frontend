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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx-js-style';

import { MenuItem, InputLabel, FormControl } from '@mui/material';

import { MaterialMaster } from "../controller/Masterapiservice";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from '@mui/material/colors';
import { api } from "../controller/constants";
import { getdetails, getAdd, getPlants, getUpdates, getMaterialType, } from '../controller/Masterapiservice';


const Material = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const UserID = localStorage.getItem('UserID');

 
  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);


  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [PlantCode, setPlantCode] = useState([]);
  const [MaterialType, setMaterialType] = useState([]);
  const [MaterialCode, setMaterialCode] = useState("");
  
  const [MaterialID, setMaterialID] = useState("");
  const [Description, setDescription] = useState("");
  const [Rate, setRate] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
  const [MaterialTable, setMaterialTable] = useState([])
  
  // const [userID, setUserID] = useState("");



  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Material_Type", headerName: "Material Type", flex: 1 },
     
    { field: "Material_Code", headerName: "Material Code", flex: 1 },
    { field: "Description", headerName: "Description", flex: 2 },

    { field: "Rate", headerName: "Rate", flex: 1 },
    {
      field: "ActiveStatus",
      headerName: "Active Status",
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.Active_Status;  // Assuming Active_Status is a boolean
        return (
          <FormControlLabel
            control={
              <Switch
                checked={isActive} // Use the boolean value directly
                color="default"  // Neutral color for default theme
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: isActive ? '#2e7d32' : '#d32f2f', // Green when active, Red when inactive
                  },
                  '& .MuiSwitch-thumb': {
                    backgroundColor: isActive ? '#2e7d32' : '#d32f2f', // Green when active, Red when inactive
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
      console.log(response);  // Check the structure of response
      setData(response);  // Ensure that this is correctly setting the data
      setOriginalRows(response); // for reference during search
    setRows(response);  
    } catch (error) {
      console.error(error);
      setData([]);  // Handle error by setting empty data
      setOriginalRows([]); // handle error case
     setRows([]);
    }
  };

  useEffect(() => {
    getData();

  }, []);


// useEffect(() => {
//   if (PlantCode) {
//     get_SupvCode();
//   } else {
//     setSupvTable([]); // reset supervisor list if PlantCode is cleared
//   }
// }, [PlantCode]);


  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const get_Material_Type = async () => {
    try {
      const response = await getMaterialType();
      setMaterialTable(response.data);
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

  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setPlantCode("");
    setMaterialCode("");
    setDescription("");
    setMaterialType("");
    
    setRate("");
    setActiveStatus(true);
    setOpenAddModal(true);
    get_Plant();
    get_Material_Type();
  
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  // ✅ Handle Upload Modal
  const handleOpenUploadModal = () => setOpenUploadModal(true);
  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
    setUploadStatus("");
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadedFileData(null);
    setIsUploading(false);
  };

  const handleFileUpload = (event) => {
    setUploadedFile(event.target.files[0]);
  };

  const handleUploadData = async () => {
    if (!uploadedFile) {
      alert("Please select a file first.");
      return;
    }

    else {
      try {
        const formData = new FormData();
        console.log('file', uploadedFile)
        formData.append("User_Add", uploadedFile);
        formData.append("UserID", UserID); 
        const response = await MaterialMaster(formData)
        console.log('response', response.data)
        alert(response.data.message)
        // console.log('response', response.data)
        if (response.data.NewRecord.length > 0 || response.data.UpdatedData.length > 0 || response.data.ErrorRecords.length > 0) {
          downloadExcel(response.data.NewRecord, response.data.UpdatedData, response.data.ErrorRecords);
      } 
        getData();
      } catch (error) {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.message);
        }
      }
    }
    handleCloseUploadModal();
              
  }

  

const downloadExcel = (newRecord, updateRecord, errRecord) => {
  const wb = XLSX.utils.book_new();

  const newRecordsColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'ActiveStatus', 'Status'];
  const UpdatedColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'ActiveStatus', 'Status'];
  const ErrorColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'ActiveStatus', 'PlantCode_Validation', 'Material_Type_Validation'];

  const filteredNewData = newRecord.map(item => ({
    Plant_Code: item.Plant_Code,
    Material_Type: item.Material_Type,
    
    Material_Code: item.Material_Code,
    Description: item.Description,
    Rate: item.Rate,
    ActiveStatus: item.Active_Status,
    Status: item.Status,
  }));

  const filteredUpdate = updateRecord.map(item => ({
    Plant_Code: item.Plant_Code,
    Material_Type: item.Material_Type,
    
    Material_Code: item.Material_Code,
    Description: item.Description,
    Rate: item.Rate,
    ActiveStatus: item.Active_Status,
    Status: item.Status,
  }));

  const filteredError = errRecord.map(item => ({
    Plant_Code: item.Plant_Code,
    Material_Type: item.Material_Type,
   
    Material_Code: item.Material_Code,
    
    Description: item.Description,
    Rate: item.Rate,
    ActiveStatus: item.Active_Status,
    PlantCode_Validation: item.Plant_Val,
    Material_Type_Validation: item.Material_Val,
  }));

  // 🔹 Helper to style header cells
  const styleHeaders = (worksheet, columns) => {
    columns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: '000000' } },
          fill: { fgColor: { rgb: 'FFFF00' } }, // Yellow background
          alignment: { horizontal: 'center' },
        };
      }
    });
  };

  // 🔴 Style red text for validation columns only
  const styleValidationColumns = (worksheet, columns, dataLength) => {
    const validationCols = ['PlantCode_Validation', 'Material_Type_Validation'];
  
    for (let row = 1; row <= dataLength; row++) {
      validationCols.forEach(colName => {
        const colIdx = columns.indexOf(colName);
        if (colIdx === -1) return;
  
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
        const cell = worksheet[cellAddress];
  
        if (cell && typeof cell.v === 'string') {
          const value = cell.v.trim().toLowerCase();
  
          // Apply green if value is "valid", otherwise red
          cell.s = {
            font: {
              color: { rgb: value === 'valid' ? '2e7d32' : 'FF0000' } // green or red
            }
          };
        }
      });
    }
  };
  

  // 📄 New Records Sheet
  if (filteredNewData.length === 0) filteredNewData.push({});
  const wsNewRecords = XLSX.utils.json_to_sheet(filteredNewData, { header: newRecordsColumns });
  styleHeaders(wsNewRecords, newRecordsColumns);
  XLSX.utils.book_append_sheet(wb, wsNewRecords, 'New Records');

  // 📄 Updated Records Sheet
  if (filteredUpdate.length === 0) filteredUpdate.push({});
  const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, { header: UpdatedColumns });
  styleHeaders(wsUpdated, UpdatedColumns);
  XLSX.utils.book_append_sheet(wb, wsUpdated, 'Updated Records');

  // 📄 Error Records Sheet
  if (filteredError.length === 0) filteredError.push({});
  const wsError = XLSX.utils.json_to_sheet(filteredError, { header: ErrorColumns });
  styleHeaders(wsError, ErrorColumns);
  styleValidationColumns(wsError, ErrorColumns, filteredError.length);
  XLSX.utils.book_append_sheet(wb, wsError, 'Error Records');

  // 📦 Export the Excel file
  const fileName = 'Material Data Upload Log.xlsx';
  XLSX.writeFile(wb, fileName);
};



  // ✅ Handle Row Click for Edit
 
 
  
 
 
  const handleRowClick = (params) => {
    setPlantCode(params.row.Plant_Code);
    setMaterialType(params.row.Material_Type);
    setMaterialCode(params.row.Material_Code);
   
    setDescription(params.row.Description);
    setRate(params.row.Rate);
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true);  // Open the modal
    setMaterialID(params.row.Material_ID);
    // setUserID(params.User_ID);
  };

  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
  
    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate '].some((key) => {
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
      PlantCode, MaterialType, MaterialCode, Description,Rate, ActiveStatus,UserID
    });
    console.log("Add button clicked")
    if (PlantCode === '' || MaterialType === '' || MaterialCode === '' || Description === '' || Rate === '') {
      alert("Please fill in all required fields");
      return;  // Exit the function if validation fails
    }

    try {
      const data = {
        UserID:UserID,
        Plant_Code: PlantCode,
        Material_Type: MaterialType,
       
        Material_Code: MaterialCode,
        Description: Description,
        Rate: Rate,
        Active_Status: ActiveStatus,
      }
      const response = await getAdd(data);
      if (response.data.success) {
        alert("Material added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to add material.");
      }
    } catch (error) {
      console.error("Error in adding Material:", error);
  
      // Step 4: Show error from server (like Employee_ID already exists)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the Material.");
      }
    }
  };
  const handleUpdate = async () => {
    try {
      const data = {
        UserID:UserID,
        Material_ID: MaterialID,
        
        Description: Description,
        Rate: Rate,
        Active_Status: ActiveStatus,
        // UserID: userID,  // Ensure the UserID is also included
      };

      console.log('Data being sent:', data);  // Log data to verify it before sending

      // Call the API
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
  
    const DataColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'ActiveStatus'];
  
    const filteredData = data.map(item => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,
      
      Material_Code: item.Material_Code,
     
      Description: item.Description,
      Rate: item.Rate,
       ActiveStatus: item.Active_Status ? "Active" : "Inactive"
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
  worksheet['!cols'] = [
  { wch: 20 },
  { wch: 30 },
  { wch: 30 }, 
  
    { wch: 30 }, 
     { wch: 20 }, 
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Materials");
    XLSX.writeFile(workbook, "Material_Data.xlsx");
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
            marginBottom: -7
          }}
        >
          Material Master
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
              width: '400px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: '2px solid grey', // No border by default
                },
                '&:hover fieldset': {
                  border: '2px solid grey', // Optional: border on hover
                },
                '&.Mui-focused fieldset': {
                  border: '2px solid grey', // Grey border on focus
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
          {/* Upload Button */}
          <IconButton onClick={handleOpenUploadModal}

            style={{
              borderRadius: "50%",
              backgroundColor: "#FF6699",
              color: "white",
              width: "40px",
              height: "40px",
            }}
          >
            <CloudUploadIcon />
          </IconButton>

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
          flexGrow: 1,  // Ensures it grows to fill the remaining space
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "calc(5 * 48px)"
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}  // Set the number of rows per page to 8
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.Material_ID}  // Specify a custom id field
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
          <h3 style={{ gridColumn: "span 2", textAlign: "center", color: "#2e59d9", textDecoration: "underline", textDecorationColor: "#88c57a", textDecorationThickness: "3px" }}>
            Add Material
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
            <InputLabel>Material Type</InputLabel>
            <Select label="Material Type" name="MaterialType" value={MaterialType} onChange={(e) => setMaterialType(e.target.value)} required>
              {MaterialTable.map((item) => (
                <MenuItem key={item.Mat_Id} value={item.Mat_Type}>{item.Mat_Type}</MenuItem>
              ))}
            </Select>
          </FormControl>
 

          <TextField
            label="Material Code"
            name="MaterialCode"
            value={MaterialCode}
            onChange={(e) => setMaterialCode(e.target.value)} required />
          <TextField
            label="Description"
            name="Description" value={Description}
            onChange={(e) => setDescription(e.target.value)} required />
<TextField
  label="Rate"
  name="Rate"
  type="number"
  value={Rate}
  onChange={(e) => setRate(e.target.value)}
  inputProps={{ min: 0 }}
  required
/>



          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}


                color="success" // Always use 'success' to keep the thumb green when active
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: ActiveStatus ? '#2e7d32' : '#d32f2f', // Green when active, Red when inactive
                    backgroundImage: "none !important", // Disable background image
                  },
                  '& .MuiSwitch-thumb': {
                    backgroundColor: ActiveStatus ? '#2e7d32' : '#d32f2f', // White thumb in both active and inactive states
                    borderColor: ActiveStatus ? '#2e7d32' : '#d32f2f', // Match thumb border with track color
                  },

                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"} // Text next to the switch
            labelPlacement="end"
            style={{
              color: ActiveStatus ? '#2e7d32' : '#d32f2f', // Change text color based on status
              fontWeight: 'bold',
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
            <Button style={{ width: "90px" }} variant="contained" color="primary" onClick={handleAdd}
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
          <h3 style={{ gridColumn: "span 2", textAlign: "center", color: "#2e59d9", textDecoration: "underline", textDecorationColor: "#88c57a", textDecorationThickness: "3px" }}>
            Edit Material
          </h3>

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
            label="Material Type"
            name="Material_Type"
            value={MaterialType}
            onChange={(e) => setMaterialType(e.target.value)}
            InputProps={{
              readOnly: true,  // This makes the TextField read-only
            }}
          />
          

          <TextField
            label="Material Code"
            name="Material_Code"
            value={MaterialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            InputProps={{
              readOnly: true,  // This makes the TextField read-only
            }}
          />
          <TextField
            label="Description"
            name="Description"
            value={Description}
            onChange={(e) => setDescription(e.target.value)}

          />

         <TextField
  label="Rate"
  name="Rate"
  type="number"
  value={Rate}
  onChange={(e) => setRate(e.target.value)}
  inputProps={{ min: 0 }}
  required
/>

          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}

                color="success" // Always use 'success' to keep the thumb green when active
                sx={{
                  '& .MuiSwitch-track': {
                    backgroundColor: ActiveStatus ? '#2e7d32' : '#d32f2f', // Green when active, Red when inactive
                    backgroundImage: "none !important", // Disable background image
                  },
                  '& .MuiSwitch-thumb': {
                    backgroundColor: ActiveStatus ? '#2e7d32' : '#d32f2f', // White thumb in both active and inactive states
                    borderColor: ActiveStatus ? '#2e7d32' : '#d32f2f', // Match thumb border with track color
                  },

                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"} // Text next to the switch
            labelPlacement="end"
            style={{
              color: ActiveStatus ? '#2e7d32' : '#d32f2f', // Change text color based on status
              fontWeight: 'bold',
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
      {/* upload modal */}

      <Modal open={openUploadModal} onClose={handleCloseUploadModal}>
        <Box
          sx={{
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "10%",
            textAlign: "center",
          }}
        >
          <h3 style={{  fontSize: "22px",textAlign: "center", marginBottom: "20px", color: "#2e59d9", textDecoration: "underline", textDecorationColor: "#88c57a", textDecorationThickness: "3px" }}>
             Material Master Excel File Upload
          </h3>

          <Button
            variant="contained"
            style={{ marginBottom: '10px', backgroundColor: deepPurple[500], color: 'white' }}
          >
            <a
              style={{ textDecoration: "none", color: "white" }}
              href={`${api}/Master/Template/MaterialMaster.xlsx`}
            >
              {" "}
              <FaDownload className="icon" /> &nbsp;&nbsp;Download Template
            </a>{" "}
          </Button>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{
              padding: "8px",
              backgroundColor: "white", // ✅ Blue background
              color: "black",
              border: "1px solid black",
              borderRadius: "5px",
              cursor: "pointer",
              width: "240px",
              marginTop: "10px",

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
            {/* ✅ Close Button */}
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseUploadModal}
              style={{ marginTop: "10px", width: "25%" }}
            >
              Close
            </Button>
            {/* ✅ Upload Button */}
            <Button
              variant="contained"

              onClick={handleUploadData}
              disabled={isUploading}
              style={{ marginTop: "10px", width: "25%", color: "white", backgroundColor: "blue" }}
            >
              Upload
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Material;