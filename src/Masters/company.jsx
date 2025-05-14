import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  FormControlLabel,
  IconButton,
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

import { deepOrange } from "@mui/material/colors";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  User_Img,
  getAdd,
  getUpdates,
  getdetails,
} from "../controller/CompanyMasterapiservice";
import { api } from "../controller/constants";
import { decryptSessionData } from "../controller/StorageUtils"
const Company = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [UserID, setUserID] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const [ActiveStatus, setActiveStatus] = useState(false);

 // const UserID = localStorage.getItem("UserID");
 

  const [CompanyCode, setCompanyCode] = useState("");
  const [CompanyID, setCompanyID] = useState("");
  const [CompanyName, setCompanyName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [CompanyLogo, setCompanyLogo] = useState("");
  const columns = [
    { field: "Com_Code", headerName: "Company Code", flex: 1 },

    { field: "Com_Name", headerName: "Company Name", flex: 1 },
    {
      field: "CompanyLogo",
      headerName: "Company Logo",
      flex: 1,
      renderCell: (params) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              console.log(params.row); // ✅ prevent row click
              handleViewImage(params.row);
            }}
            style={{ fontSize: "18px", color: "blue" }}
          >
            <VisibilityIcon fontSize="small" />
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
    setCompanyCode("");
    setCompanyName("");

    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setCompanyID(params.row.Com_ID);

    setCompanyCode(params.row.Com_Code);
    setCompanyName(params.row.Com_Name);
    setCompanyLogo(params.row.CompanyLogo);
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
        ["Com_Code", "Com_Name", "Com_Address"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
      ActiveStatus,
      UserID,
      CompanyCode,
      CompanyName,
    });
    console.log("Add button clicked");

    if (CompanyCode === "" || CompanyName === "") {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const data = {
        UserID: UserID,
        Com_Code: CompanyCode,
        Com_Name: CompanyName,
        Active_Status: ActiveStatus,
        CompanyLogo: CompanyLogo,
      };

      // First API call - Adding Company
      const response1 = await getAdd(data);
      console.log("Company add response:", response1.data);

      if (response1.data.success) {
        const comId = response1.data.Com_ID;
        console.log("New Company ID:", comId);

        // Prepare formData for image upload
        const formData = new FormData();
        formData.append("Com_ID", comId);

        // Check if uploadedFile exists
        if (uploadedFile) {
          console.log("File to be uploaded:", uploadedFile);
          formData.append("User_Image", uploadedFile);
          formData.append("UserID", UserID);

          // Second API call - Uploading Image
          const response2 = await User_Img(formData);
          console.log("Image upload response:", response2.data); // Log the response

          if (response2.data.message === "Image Uploaded Successfully") {
            alert("Company and image added successfully!");
            getData(); // Refresh UI
            handleCloseAddModal(); // Close modal
          } else {
            console.log("Error in image upload response:", response2.data);
            alert("Error while uploading image. Please try again.");
          }
        } else {
          alert("Please select an image to upload.");
        }
      } else {
        alert("Error while adding the company. Please try again.");
      }
    } catch (error) {
      console.error("Error in adding Company:", error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the Company.");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const data = {
        UserID: UserID,
        Com_ID: CompanyID,
        Com_Code: CompanyCode,
        Com_Name: CompanyName,
        Active_Status: ActiveStatus,
        CompanyLogo: CompanyLogo,
      };

      console.log("Data being sent for update:", data);

      // First API call - Updating the company data (without image)
      const response = await getUpdates(data);

      if (response.data.success) {
        // If a new company logo is selected, proceed with image upload
        if (uploadedFile) {
          console.log("File to be uploaded:", uploadedFile);

          // Prepare FormData for image upload
          const formData = new FormData();
          formData.append("Com_ID", CompanyID);
          formData.append("UserID", UserID);
          formData.append("User_Image", uploadedFile); // Assuming uploadedFile is the selected file

          // Second API call - Uploading the new CompanyLogo
          const response2 = await User_Img(formData);
          console.log("Image upload response:", response2.data); // Log the response

          if (response2.data.message === "Image Uploaded Successfully") {
            alert("Company and image updated successfully!");
            getData(); // Refresh the UI
            handleCloseEditModal(); // Close modal
          } else {
            console.log("Error in image upload response:", response2.data);
            alert("Error while uploading image. Please try again.");
          }
        } else {
          alert("No new image selected for upload.");
        }
      } else {
        // If updating the company fails, show backend message
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error in updating Company:", error);

      if (error.response?.data?.message) {
        alert(error.response.data.message); // Specific error from backend
      } else {
        alert(
          "An error occurred while updating the Company. Please try again."
        );
      }
    }
  };

  const handleFileUpload = (event) => {
    setUploadedFile(event.target.files[0]);
  };

  const handleViewImage = (company) => {
    console.log(company);
    const imageUrl = `${api}/CompanyMaster/ViewImage/${company.CompanyLogo}`;

    setImagePreview(imageUrl);
  };

  // excel download
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = ["Company_Code", "Company_Name", "ActiveStatus"];

    const filteredData = data.map((item) => ({
      Company_Code: item.Com_Code,

      Company_Name: item.Com_Name,

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
            Add Company
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
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
              maxLength: 4,
            }}
            required
          />

          <TextField
            label="Company Name"
            name=" Company Name"
            value={CompanyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileUpload}
            style={{
              padding: "8px",
              backgroundColor: "white", // ✅ Blue background
              color: "black",
              border: "1px solid black",
              borderRadius: "5px",
              cursor: "pointer",
              width: "180px",
              marginTop: "10px",
            }}
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
            Edit Business Division
          </h3>
          <TextField
            label="Company Code"
            name="Company_Code"
            value={CompanyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            InputProps={{
              readOnly: true, // This makes the TextField read-only
            }}
          />

          <TextField
            label=" Company Name"
            name=" Company Name"
            value={CompanyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileUpload}
            style={{
              padding: "8px",
              backgroundColor: "white", // ✅ Blue background
              color: "black",
              border: "1px solid black",
              borderRadius: "5px",
              cursor: "pointer",
              width: "180px",
              marginTop: "10px",
            }}
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

      {/* Modal for Viewing Image */}
      <Modal
        open={imagePreview !== ""}
        onClose={() => setImagePreview("")}
        aria-labelledby="view-image-modal"
        aria-describedby="modal-for-viewing-image"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: 24,
            width: 400,
          }}
        >
          <Box display="flex" justifyContent="center">
            <img
              src={imagePreview}
              alt="CompanyLogo"
              style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }}
            />
          </Box>
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              onClick={() => setImagePreview("")}
              style={{
                backgroundColor: deepOrange[500],
                color: "white",
                fontSize: "12px",
              }}
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
