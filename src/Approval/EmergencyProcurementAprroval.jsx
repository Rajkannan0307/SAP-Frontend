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
  Checkbox,
  RadioGroup,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
import * as XLSX from "xlsx-js-style";

import { MenuItem, InputLabel, FormControl } from "@mui/material";

import {
  getdetailsEmergency,
 getUpdates,getRejected

} from "../controller/InwardApprovalservice";
import { decryptSessionData } from "../controller/StorageUtils";
const EmergencyApproval = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
 // const UserID = localStorage.getItem("UserID");
  const [VendorCode, setVendorCode] = useState("");
  const [VendorID, setVendorID] = useState("");
  const [InvoiceDate, setInvoiceDate] = useState("");
  const [InvoiceNo, setInvoiceNo] = useState("");
  const [InvoiceValue, setInvoiceValue] = useState("");
  const [PurchaseOrder, setPurchaseOrder] = useState("");
  const [ReasonForDelay, setReasonForDelay] = useState("");
  const [InwardID, setInwardID] = useState("");
   const [RoleID, setRoleID] = useState("");
   // const [selectedRows, setSelectedRows] = useState([]);
   const [showSelect, setShowSelect] = useState(false);
    const [comment, setComment] = useState('');
    const [selectedL2, setSelectedL2] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    
  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);
   const [PlantID, setPlantID] = useState("");
    const[EmployeeID,setEmployeeID]=useState("")
 
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
  const [MaterialDescription, setMaterialDescription] = useState("");
  const [Rate, setRate] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
  const [VendorTable, setVendorTable] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
 const [UserID, setUserID] = useState("");
  // const [userID, setUserID] = useState("");
 const [InvoiceQty, setInvoiceQty] = useState("");
  const columns = [
    { field: "Vendor_Code", headerName: "Vendor Code ", flex: 1 },
    { field: "Vendor_Name", headerName: "Vendor Name ", flex: 1 },
    { field: "Material_Description", headerName: "Material Description", flex: 1 },
    { field: "Invoice_Qty", headerName: "Quantity", flex: 1 },

    { field: "Invoice_Value", headerName: "Total Value", flex: 1 },
  
    { field: "Reason_For_Delay", headerName: "Reason", flex: 1 },
    { field: "Status", headerName: "Status", flex: 1 },
    { field: "Purchase_Order", headerName: "Purchase Order", flex: 1 },
    {
          field: "Action",
          headerName: "Action",
          flex: 1,
          renderCell: (params) => (
             <div style={{ display: "flex", justifyContent: "center" }}>
             <IconButton
                        size="large"
                        color="success"
                        onClick={() =>handleopenApproveModal(params.row)} // Call approve function with row data
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
            
            <Checkbox
              checked={selectedRows.includes(params.row)}
              onChange={() => handleCheckboxChange(params.row)}
            />
            </div>
          ),
        },
  ];
  useEffect(() => {
     const encryptedData = sessionStorage.getItem("userData");
     if (encryptedData) {
       const decryptedData = decryptSessionData(encryptedData);
       setUserID(decryptedData.UserID);
       setPlantID(decryptedData.PlantID);
       setRoleID(decryptedData.RoleId)
       setEmployeeID(decryptedData.EmpId);
     }
   }, []);
 console.log("EmergencyApproval role",RoleID)
 console.log("EmergencyApproval Plant",PlantID)
   const getData = async () => {
     try {
       const response = await getdetailsEmergency(UserID,RoleID,PlantID);
       console.log('inward appoval data',response)
       setData(response);
       setOriginalRows(response);
       setRows(response);
     } catch (error) {
       console.error(error);
       setData([]);
       setOriginalRows([]);
       setRows([]);
     }
   };
 
   useEffect(() => {
     if (UserID,RoleID,EmployeeID,PlantID) {
       getData();
     }
   }, [UserID,RoleID,EmployeeID,PlantID]);
 
      const handleCheckboxChange = (row) => {
    setSelectedRows((prevSelected) => {
      const isSelected = prevSelected.some(
        (item) => item.Inward_ID === row.Inward_ID
      );
      if (isSelected) {
        return prevSelected.filter((item) => item.Inward_ID !== row.Inward_ID);
      } else {
        return [...prevSelected, row];
      }
    });
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
        [
          "Vendor_Code",
          "Vendor_Name",
          "Material_Description",
          "Invoice_Qty",
          "Invoice_Value",
          "Purchase_Order",
          "Reason_For_Delay",
          "Status",
        ].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  const handleopenApproveModal = (row) => {
  setComment("");
  setInwardID(row.Inward_ID); // ✅ corrected
  setSelectedRow(row);        // Optional: store selected row data
  setOpenModal(true);
};

    const handleCloseModal = () => setOpenModal(false);
      const handleL2Click = () => {
        setShowSelect(true);
      };
    
    const handleApprove = async () => {
      if (!InwardID) {
        alert("No row selected. Please open the modal from a row.");
        return;
      }
    
      try {
        const data = {
          Inward_ID: InwardID,
          RoleID: RoleID,
           Approver:EmployeeID,
          Approver_Comment: comment,
          Modified_By: UserID,
        };
    
        console.log("Update payload:", data);
    
        const response = await getUpdates(data);
    
        if (response.data.success) {
          alert(response.data.message);
          getData(); // Refresh table
          handleCloseModal(); // Close modal
        } else {
          alert(response.data.message);
        }
      } catch (error) {
        console.error("Update error:", error);
        alert(
          error.response?.data?.message ||
            "An unexpected error occurred while Approving the invoice."
        );
      }
    };
    
    
     const handleReject = async () => {
  if (!InwardID) {
    alert("No row selected. Please open the modal from a row.");
    return;
  }

  if (!comment.trim()) {
    alert("Comment is required to reject the invoice.");
    return;
  }

  try {
    const data = {
      Inward_ID: InwardID,
      RoleID: RoleID,
      Approver: EmployeeID,
      Approver_Comment: comment,
      Modified_By: UserID,
    };

    console.log("Update payload:", data);

    const response = await getRejected(data);

    if (response.data.success) {
      alert(response.data.message);
      getData(); // Refresh table
      handleCloseModal(); // Close modal
    } else {
      alert(response.data.message);
    }
  } catch (error) {
    console.error("Update error:", error);
    alert(
      error.response?.data?.message ||
        "An unexpected error occurred while rejecting the invoice."
    );
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
            height: "calc(100vh - 90px)",
          }}
        >
          {/* Header */}
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
              Emergency Procurement Approval
            </h2>
          </div>
    
          {/* Search and Download */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
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
                      border: "2px solid grey",
                    },
                    "&:hover fieldset": {
                      border: "2px solid grey",
                    },
                    "&.Mui-focused fieldset": {
                      border: "2px solid grey",
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
    
          </div>
    
          {/* DataGrid */}
          <div
            style={{
              flexGrow: 1,
              backgroundColor: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              overflowX: "hidden", // 👈 prevents horizontal scroll
            }}
          >
              <DataGrid
                      rows={rows}
                      columns={columns}
                      pageSize={5} // Set the number of rows per page to 8
                      rowsPerPageOptions={[5]}
                      getRowId={(row) => row.Inward_ID} // Specify a custom id field
                     
                      onCellClick={(params, event) => {
                        if (params.field === "Action") {
                          event.stopPropagation();
                        }
                      }}
                      disableSelectionOnClick
                      slots={{ toolbar: CustomToolbar }}
                      sx={{
                        // Header Style
                        "& .MuiDataGrid-columnHeader": {
                          backgroundColor: "#bdbdbd", //'#696969', 	'#708090',  //"#2e59d9",
                          color: "black",
                          fontWeight: "bold",
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontSize: "14px",
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
    <Modal open={openModal} onClose={() => setOpenModal(false)}>
  <Box
    sx={{
      width: 400,
      bgcolor: 'background.paper',
      borderRadius: 2,
      boxShadow: 24,
      p: 3,
      mx: 'auto',
      mt: '10%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    {/* Comment Box */}
    <TextField
      label="Comment"
      multiline
      rows={3}
      value={comment}
      onChange={(e) => setComment(e.target.value)}
    />

    {/* Centered Action Buttons */}
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
      <Button variant="contained" color="error" onClick={handleReject}>
        Reject
      </Button>
      <Button variant="contained" color="success" onClick={handleApprove}>
        Approve
      </Button>
    </Box>
  </Box>
</Modal>

        </div>
      );
    };
    

export default EmergencyApproval;
