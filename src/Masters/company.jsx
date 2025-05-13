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
import { FaFileExcel,FaUpload  } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { MenuItem, InputLabel, FormControl } from "@mui/material";
import { IoEyeOutline } from "react-icons/io5";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { deepOrange, deepPurple } from '@mui/material/colors';
import {
  getAdd,
  getUpdates,
  getdetails,
  User_Img 
} from "../controller/CompanyMasterapiservice";
import { api } from "../controller/constants";
const Company = () => {
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
  const [imgFile, setImgFile] = useState(null);
  const [CompanyTable, setCompanyTable] = useState([]);
  const Username = localStorage.getItem('UserName');
  const UserID = localStorage.getItem('UserID');
  const [imagePreview, setImagePreview] = useState("");
  const [ CompanyCode, setCompanyCode] = useState("");
  const [ CompanyID, setCompanyID] = useState("");
  const [ CompanyName, setCompanyName] = useState("");
  const [imgmoadl, setImgmodal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null); // for preview
  const [imageFile, setImageFile] = useState(null); // for actual file
  const [openImageModal, setOpenImageModal] = useState(false);
const [selectedImageName, setSelectedImageName] = useState(null);

  const columns = [
    { field: "Com_Code", headerName: "Company Code", flex: 1 },
    
    { field: "Com_Name", headerName: " Company Name ", flex: 1 },
    {
      field: "CompanyLogo",
      headerName: "Company Logo",
      flex: 2,
      renderHeader: () => (
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Image</div>
      ),
      renderCell: (params) => (
        <div>
         <Button
      onClick={(event) => {
        event.stopPropagation(); // Prevent row selection
        handleViewImage(params.row);
      }}
      style={{ fontSize: '18px', color: 'blue' }}
    >
            <VisibilityIcon />
          </Button>
        </div>
      ),
    },    

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
 
  const handleViewImage = (row) => {
    const fullImageUrl = `${api}/${row.CompanyLogo}`; // Assuming you need the API path
    setImagePreview(fullImageUrl);
    setOpenImageModal(true); // Optional if using openImageModal elsewhere
  };
  

  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    
    
    setCompanyCode("");
    setCompanyName("");
   
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // for uploading later
      setUploadedImage(URL.createObjectURL(file)); // for preview
    }
  };
  
  
  const handleUploadData = async () => {
    if (!imgFile) {
      alert("Please select an image file before uploading.");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("User_Image", imgFile);
      formData.append("UserID", UserID); 
  
      const response = await User_Img(formData);
      console.log("Upload response:", response.data);
  
      getData(); // Refresh data
      alert("Image uploaded successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred during image upload.");
      }
    }
  };
  

  




  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setCompanyID(params.row.Com_ID);
   
    setCompanyCode(params.row.Com_Code);
    setCompanyName(params.row.Com_Name);
    // setCompanyAddress(params.row.Company_Address);
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
          "Com_Name",
          "Com_Address",
          
        ].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  // ✅ Handle Add Material
  // const handleAdd = async () => {
  //   console.log("Data being sent to the server:", {
  //     ActiveStatus,UserID,CompanyCode, CompanyName,
  //   });
  //   console.log("Add button clicked");
  //   if (CompanyCode === ''  ||  CompanyName === '' ) {
  //     alert("Please fill in all required fields");
  //     return;  // Exit the function if validation fails
  //   }

  //   try {
  //     const data = {
  //       UserID:UserID,
  //       Com_Code:CompanyCode,
        
  //        Com_Name: CompanyName,
         
  //       Active_Status: ActiveStatus,
  //     };
  //     const response = await getAdd(data);
  //     if (response.data.success) {
  //       alert("  Company added successfully!");
  //       getData(); // refresh UI (e.g. user list)
  //       handleCloseAddModal(); // close the modal
  //     } else {
  //       alert(response.data.message || "Failed to  Company user.");
  //     }
  //   } catch (error) {
  //     console.error("Error in adding  Company:", error);
  
  //     // Step 4: Show error from server (like Employee_ID already exists)
  //     if (error.response && error.response.data && error.response.data.message) {
  //       alert(error.response.data.message);
  //     } else {
  //       alert("An error occurred while adding the  Company.");
  //     }
  //   }
  // };
  const handleAdd = async () => {
    if (!CompanyCode || !CompanyName) {
      alert("Please fill in all required fields");
      return;
    }
  
    const formData = new FormData();
    formData.append("User_Image", imgFile);
    formData.append("UserID", UserID);
    formData.append("Com_Code", CompanyCode);
    formData.append("Com_Name", CompanyName);
    formData.append("Active_Status", ActiveStatus);
    
    if (imageFile) {
      formData.append("CompanyLogo", imageFile); // Update this to your backend field name
    }
  
    try {
      const response = await getAdd(formData); // Ensure getAdd supports FormData
      if (response.data.success) {
        alert("Company added successfully!");
        getData();
        handleCloseAddModal();
      } else {
        alert(response.data.message || "Failed to add Company.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred.");
    }
  };
  

  const handleUpdate = async () => {
    try {
      const data = {
        UserID:UserID,
         Com_ID:  CompanyID,
        Com_Code: CompanyCode,
         
         Com_Name:  CompanyName,
         
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
        alert("An error occurred while updating the  Company. Please try again.");
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
      "Company_Name",
    
      
      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      Company_Code: item.Com_Code,
       
       Company_Name: item.Com_Name,
    
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
           Company Master
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
          getRowId={(row) => row.Com_ID} // Specify a custom id field
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
            Add  Company
          </h3>
         
           
            

          <TextField
  label="Company Code"
  name="CompanyCode"
  value={CompanyCode}
  type="text"
  onChange={(e) => {
    const value = e.target.value;
    // Remove any non-digit character
    if (/^\d*$/.test(value)) {
      setCompanyCode(value);
    }
  }}
  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' ,
    maxLength: 4,

  }}
  required
/>


          <TextField
            label="Company Name"
            name=" Company Name"
            value={ CompanyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
          <input
                  type="file"
                  accept="jpg,jpeg,png"
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
                <Button
                    variant="contained"
                    onClick={handleUploadData}
                    disabled={isUploading}
                    style={{
                      marginTop: "10px",
                      width: "25%",
                      color: "white",
                      backgroundColor: "blue",
                    }}
                  >
                    Upload
                  </Button>
          {/* <TextField
            label=" Company Address"
            name=" Company Address"
            value={ CompanyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            required
          /> */}

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
            Edit Company
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
            label=" Company Name"
            name=" Company Name"
            value={ CompanyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
          {/* <TextField
            label="Company Address"
            name=" Company Address"
            value={ CompanyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            required
          /> */}

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
      <Modal
                open={imagePreview !== ""}
                onClose={() => setImagePreview("")}
                aria-labelledby="view-image-modal"
                aria-describedby="modal-for-viewing-image"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: 24,
                        width: 400,
                    }}
                >
                    <Box display="flex" justifyContent="center">
                        <img
                            src={imagePreview}
                            alt="User Image"
                            style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                        />
                    </Box>
                    <Box display="flex" justifyContent="center" mt={2}>
                        <Button
                            onClick={() => setImagePreview("")}
                            style={{ backgroundColor: deepOrange[500], color: 'white', fontSize: '12px' }}
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            </Modal>

    </div>
  );
};

export default Company;
