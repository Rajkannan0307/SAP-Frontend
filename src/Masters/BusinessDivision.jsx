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
  getCompany,
} from "../controller/BusinessDivisionMasterapiservice";

const BusinessDivision = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [CompanyCode, setCompanyCode] = useState([]);
  const [CompanyTable, setCompanyTable] = useState([]);
  const Username = localStorage.getItem('UserName');
  const UserID = localStorage.getItem('UserID');
  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);
  const [ Business_DivisionCode, setBusiness_DivisionCode] = useState("");
  const [ Business_DivisionID, setBusiness_DivisionID] = useState("");
  const [ Business_DivisionName, setBusiness_DivisionName] = useState("");
  const [ Business_DivisionAddress, setBusiness_DivisionAddress] = useState("");
  const columns = [
    { field: "Com_Code", headerName: "Company Code", flex: 1 },
    { field: "Business_Division_Code", headerName: "Business Division Code ", flex: 1 },
    { field: "Business_Division_Name", headerName: "Business Division Name ", flex: 1 },
    { field: "Business_Division_Address", headerName: "Business Division Address", flex: 2 },

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
      //  setData(response); // Ensure that this is correctly setting the data
      setOriginalRows(response); // for reference during search
       setRows(response);//Sets the displayed data, possibly filtered or modified
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
    setCompanyCode("");
    setBusiness_DivisionCode("");
    setBusiness_DivisionName("");
    setBusiness_DivisionAddress("");
    setActiveStatus(true);
    setOpenAddModal(true);
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

 


  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setBusiness_DivisionID(params.row.Business_Division_ID);
    setBusiness_DivisionCode(params.row.Business_Division_Code);
    setCompanyCode(params.row.Com_Code);
    setBusiness_DivisionName(params.row.Business_Division_Name);
    setBusiness_DivisionAddress(params.row.Business_Division_Address);
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
        [
          "Com_Code",
          "Business_Division_Code",
          "Business_Division_Name",
          "Business_Division_Address",
          
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
      ActiveStatus,UserID,CompanyCode, Business_DivisionCode, Business_DivisionName, Business_DivisionAddress
    });
    console.log("Add button clicked");
    if (CompanyCode === '' ||  Business_DivisionCode === '' ||  Business_DivisionName === '' ||  Business_DivisionAddress === '' ) {
      alert("Please fill in all required fields");
      return;  // Exit the function if validation fails
    }

    try {
      const data = {
        UserID:UserID,
        Com_Code:CompanyCode,
         Business_Division_Code: Business_DivisionCode,
         Business_Division_Name: Business_DivisionName,
         Business_Division_Address: Business_DivisionAddress,
        Active_Status: ActiveStatus,
      };
      const response = await getAdd(data);
      if (response.data.success) {
        alert("  Business_Division added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to  Business_Division user.");
      }
    } catch (error) {
      console.error("Error in adding  Business_Division:", error);
  
      // Step 4: Show error from server (like Employee_ID already exists)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the  Business_Division.");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const data = {
        UserID:UserID,
         Business_Division_ID:  Business_DivisionID,
        Com_Code: CompanyCode,
         Business_Division_Code:  Business_DivisionCode,
         Business_Division_Name:  Business_DivisionName,
         Business_Division_Address:  Business_DivisionAddress,
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
        alert("An error occurred while updating the  Business_Division. Please try again.");
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
      "Company_Code",
      "Business_Division_Code",
      "Business_Division_Name",
      "Business_Division_Address",
      
      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      Company_Code: item.Com_Code,
       Business_Division_Code: item.Business_Division_Code,
       Business_Division_Name: item.Business_Division_Name,
       Business_Division_Address: item.Business_Division_Address,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Business_Division");
    XLSX.writeFile(workbook, "Business_Division_Data.xlsx");
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
           Business Division Master
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
          getRowId={(row) => row.Business_Division_ID} // Specify a custom id field
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
            Add  Business_Divisions
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
  label=" Business Division Code"
  name=" Business Division Code"
  value={Business_DivisionCode}
  type="text"
  onChange={(e) => {
    const value = e.target.value;
    // Remove any non-digit character
    if (/^\d*$/.test(value)) {
      setBusiness_DivisionCode(value);
    }
  }}
  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' ,
    maxLength: 4,

  }}
  required
/>


          <TextField
            label="Business Division Name"
            name=" Business Division Name"
            value={ Business_DivisionName}
            onChange={(e) => setBusiness_DivisionName(e.target.value)}
            required
          />
          <TextField
            label=" Business Division Address"
            name=" Business Division Address"
            value={ Business_DivisionAddress}
            onChange={(e) => setBusiness_DivisionAddress(e.target.value)}
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
            Edit  Business Division
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
            label=" Business Division Code"
            name=" Business Divisio Code"
            value={ Business_DivisionCode}
            onChange={(e) => setBusiness_DivisionCode(e.target.value)}
            InputProps={{
              readOnly: true,  // This makes the TextField read-only
            }}
          />
          <TextField
            label=" Business Division Name"
            name=" Business Division Name"
            value={ Business_DivisionName}
            onChange={(e) => setBusiness_DivisionName(e.target.value)}
            required
          />
          <TextField
            label=" Business Division Address"
            name=" Business Division Address"
            value={ Business_DivisionAddress}
            onChange={(e) => setBusiness_DivisionAddress(e.target.value)}
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

export default BusinessDivision;