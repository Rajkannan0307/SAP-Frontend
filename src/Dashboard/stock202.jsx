import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  Divider,
  IconButton, LinearProgress,
  Typography,
  InputLabel,

  FromControl
} from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from '@mui/material/colors';
import { FormControl, Select, MenuItem } from '@mui/material';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import EditIcon from '@mui/icons-material/Edit';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from 'sheetjs-style';
import{ Movement202,getdetails} from "../controller/Movement202apiservice";
import {  getresubmit, getCancel, setOpenEditModal, getPlants, getMaterial, getView, getExcelDownload, get309ApprovalView } from '../controller/transactionapiservice';


import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { IoMdDownload } from "react-icons/io";

import { api } from "../controller/constants";
const Stock202 = () => {

   const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]); // ✅ Initial empty rows
    const [originalRows, setOriginalRows] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
 const [openUploadModal, setOpenUploadModal] = useState(false);
 const [openViewModal, setOpenViewModal] = useState(false);
 const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);
  const UserID = localStorage.getItem('UserID');

 const [uploadProgress, setUploadProgress] = useState(0);
   const [isUploading, setIsUploading] = useState(false);
   const [uploadedFile, setUploadedFile] = useState(null);
   const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
   const [uploadedFileData, setUploadedFileData] = useState(null);
   const [data, setData] = useState([]);
  

  const [DocID, setDocID] = useState("");
  const [PlantID, setPlantID] = useState("");
  const [MovementID, setMovementID] = useState("");
  const [Quantity, setQuantity] = useState("");
  const [SLocID, setSLocID] = useState("");
  const [ValuationType, sValuationType] = useState("");
  const [Batch, setBatch] = useState("");
  const [RatePerUnit, setRatePerUnit] = useState("");
  const [Description, setDescription] = useState("");
  const [Remark, setRemark] = useState("");
  const [SAPTransactionStatus, setSAPTransactionStatus] = useState("");
  const [PlantCode, setPlantCode] = useState('');
  const [Date, setDate] = useState("");
  const [ApprovalStatus, setApprovalStatus] = useState([]);

const [openModal, setOpenModal] = useState(false);
const [openViewStatusModal, setOpenViewStatusModal] = useState(false);
const [selectedRow, setSelectedRow] = useState(null);
const [viewStatusData, setViewStatusData] = useState([]);
const [openEditModal, setOpenEditModal] = useState(false);



  const [isEditable, setIsEditable] = useState(false);


   const handleCloseAddModal = () => setOpenAddModal(false);
  const getData = async () => {
    try {
      const response = await getdetails(UserID);
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
    // getViewData();

  }, []);


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
        const response = await Movement202(formData)
        console.log('response', response.data)
        alert(response.data.message)
        if (response.data.NewRecord.length > 0 || response.data.DuplicateRecords.length > 0 || response.data.ErrorRecords.length > 0) {
          downloadExcel(response.data.NewRecord, response.data.DuplicateRecords, response.data.ErrorRecords);
        }
        getData();
      } catch (error) {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.message)
        }
      }
    }
    handleCloseUploadModal();
  }

  const downloadExcel = () => {
    // Logic to download Excel file
  };
   // excel download
   const handleDownloadExcel = (selectedRow) => {
    if (!selectedRow) {
      alert("No row selected.");
      return;
    }
  
    // Define new data columns
    const DataColumns = [
      'Doc_ID', 'Plant_ID', 'Material_ID', 'Quantity', 'SLoc_ID', 'CostCenter_ID', 
      'Movement_ID', 'Valuation_Type', 'Batch', 'Rate_Unit', 'Remark', 'User_ID', 
      'Approval_Status', 'SAP_Transaction_Status', 'Created_By'
    ];
  
    // Prepare the filtered data for the selected row
    const filteredData = [{
      Doc_ID: selectedRow.Doc_ID || '',
      Plant_ID: selectedRow.Plant_ID || '',
      Material_ID: selectedRow.Material_ID || '',
      Quantity: selectedRow.Quantity || '',
      SLoc_ID: selectedRow.SLoc_ID || '',
      CostCenter_ID: selectedRow.CostCenter_ID || '',
      Movement_ID: selectedRow.Movement_ID || '',
      Valuation_Type: selectedRow.Valuation_Type || '',
      Batch: selectedRow.Batch || '',
      Rate_Unit: selectedRow.Rate_Unit || '',
      Remark: selectedRow.Remark || '',
      User_ID: selectedRow.User_ID || '',
      Approval_Status: selectedRow.Approval_Status || '',
      SAP_Transaction_Status: selectedRow.SAP_Transaction_Status || '',
      Created_By: selectedRow.Created_By || ''
    }];
  
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
  
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
  
  //View icon Download row data
  const handleDownloadExcelRowView = (selectedRow) => {
    if (!selectedRow) {
      alert("No row selected.");
      return;
    }
  
    const DataColumns = [
      "Doc_ID", "Plant_ID", "Material_ID", "Quantity", "SLoc_ID", "CostCenter_ID",
      "Movement_ID", "Valuation_Type", "Batch", "Rate_Unit", "Remark", "User_ID",
      "Approval_Status", "SAP_Transaction_Status", "Created_By", "Created_On"
    ];
  
    const filteredData = [{
      Doc_ID: selectedRow.Doc_ID || '',
      Plant_ID: selectedRow.Plant_ID || '',
      Material_ID: selectedRow.Material_ID || '',
      Quantity: selectedRow.Quantity || '',
      SLoc_ID: selectedRow.SLoc_ID || '',
      CostCenter_ID: selectedRow.CostCenter_ID || '',
      Movement_ID: selectedRow.Movement_ID || '',
      Valuation_Type: selectedRow.Valuation_Type || '',
      Batch: selectedRow.Batch || '',
      Rate_Unit: selectedRow.Rate_Unit || '',
      Remark: selectedRow.Remark || '',
      User_ID: selectedRow.User_ID || '',
      Approval_Status: selectedRow.Approval_Status || '',
      SAP_Transaction_Status: selectedRow.SAP_Transaction_Status || '',
      Created_By: selectedRow.Created_By || '',
      Created_On: selectedRow.Created_On || ''
    }];
  
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
  
    // Apply styling to header
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "FFFF00" } },
          alignment: { horizontal: "center" },
        };
      }
    });
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trn201201Movt_Doc_Row_Data");

    // Use Material_ID or Doc_ID for filename
    XLSX.writeFile(workbook, `Trn201201Movt_${selectedRow.Doc_ID || 'Row'}.xlsx`);

  };
  
  
  
  // In your component where the rows are displayed:
  const renderRows = () => {
    return data.map((row) => (
      <tr key={row.Material_Code}>
        <td>{row.Plant_Code}</td>
        <td>{row.Material_Type}</td>
        <td>{row.Material_Code}</td>
        <td>{row.Description}</td>
        <td>{row.Rate}</td>
        <td>{row.Active_Status ? 'Active' : 'Inactive'}</td>
        <td>
          <button onClick={() => handleDownloadExcel(row)}>Download This Row</button>
        </td>
      </tr>
    ));
  };
  

    //✅ DataGrid Columns with Edit & Delete Buttons
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Doc_ID", headerName: "Doc ID ", flex: 1 },
    { field: "Date", headerName: "Date", flex: 1 },
    { field: "Material_Code", headerName: "Material Code", flex: 1 },
    { field: "Qty", headerName: "Qty", flex: 1 },
    { field: "Movement_Type", headerName: "Movement Type ", flex: 1 },
    { field: "Approval_Status", headerName: "Approval Status", flex: 1 },
    
    // {
    //   field: "actions",
    //   headerName: "Actions",
    //   flex: 1,
    //   sortable: false,
    //   renderCell: (params) => (
    //     <div style={{ display: "flex", gap: "10px" }}>
    //       <IconButton
    //         size="large"
    //         color="primary"
    //         onClick={() => handleOpenViewModal(params.row)} // Pass the row data to the modal handler
    //       >
    //         <VisibilityIcon fontSize="small" />
    //       </IconButton>
    //     </div>
    //   ),
    // },

   {
  field: "actions",
  headerName: "Actions",
  flex: 1,
  sortable: false,
  renderCell: (params) => {
    //const approvalStatus = params.row.approvalStatus?.toLowerCase(); // Safely get and normalize
    //const isEditable = approvalStatus === "rejected" || approvalStatus === "under query";
     const approvalStatus = (params.row.Approval_Status || "").toLowerCase();

        const isEditable =
          approvalStatus === "rejected" || approvalStatus === "under query";

    return (
      <div style={{ display: "flex", gap: "10px" }}>
        {/* View Button */}
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleDownloadExcelRowView(params.row)}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>

        {/* Edit Button (conditional) */}
        {isEditable && (
          <IconButton
            size="small"
            sx={{
              color: "#6a0dad",
              '&:hover': {
                color: "#4b0082",
              },
            }}
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </div>
    );
  },
}
  ]
    
  // ✅ Open Add Modal
  const handleOpenAddModal = (item) => {
    setOpenAddModal(true);
  };

  const handleOpenViewModal = (item) => {
    setOpenViewModal(true);

  }

  
  const handleOpenModal = () => {
    setOpenExcelDownloadModal(true);
    // setFromDate(''); // Reset From Date
    // setToDate(''); // Reset To Date
  };
  const handleCloseModal = () => {
    setOpenExcelDownloadModal(false);

  };

  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
  
    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ['Plant_Code', 'Doc_ID', 'Date', 'Qty', 'Movement_Type ','Approval_Status'].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };


    const handleEdit = (rowData) => {
    setSelectedRow(rowData);
    const status = (rowData.Approval_Status || "").toLowerCase();
    const editable = status === "rejected" || status === "under query";
    setIsEditable(editable);
    setOpenModal(true);
  };


   const handleResubmit = async () => {
      if (!selectedRow) {
        alert("No document selected for Resubmit.");
        return;
      }
      const data = {
        Doc_ID: selectedRow.Doc_ID,
        Action: "Resubmit",
        UserID: UserID,
  
      };
  
      console.log("Sending Resubmit data:", data);
  
      try {
        const response = await getresubmit(data);
        console.log("Resubmit API response:", response);
  
        const isSuccess = response?.data?.success ?? response?.success;
  
        if (isSuccess) {
          alert("Document Resubmit!");
          setOpenModal(false);
          getData();
        } else {
          const message = response?.data?.message ?? response?.message ?? "Resubmit failed.";
          alert(message);
        }
      } catch (error) {
        console.error("Resubmit error:", error);
        const errMsg = error.response?.data?.message || "An error occurred while Resubmit the document.";
        alert(errMsg);
      }
    };
  
  
    const handleCancel = async () => {
      if (!selectedRow) {
        alert("No document selected for Cancel.");
        return;
      }
      const data = {
        Doc_ID: selectedRow.Doc_ID,
        Action: "Cancel",
        UserID: UserID,
  
      };
  
      console.log("Sending Cancel data:", data);
  
      try {
        const response = await getCancel(data);
        console.log("Cancel API response:", response);
  
        const isSuccess = response?.data?.success ?? response?.success;
  
        if (isSuccess) {
          alert("Document Cancelled!");
          setOpenModal(false)
  
          getData();
        } else {
          const message = response?.data?.message ?? response?.message ?? "Cancel failed.";
          alert(message);
        }
      } catch (error) {
        console.error("Cancel error:", error);
        const errMsg = error.response?.data?.message || "An error occurred while Cancel the document.";
        alert(errMsg);
      }
    };
  
  
    const handleCloseEditModal = () => {
      setOpenEditModal(false);
      setSelectedRow(null); // optionally reset selected data
    };
  
   const handleOpenViewStatusModal = async (rowData) => {
    const docId = rowData?.Doc_ID; // ✅ Get only Doc_ID
    console.log("Opening View Status Modal for Doc_ID:", rowData);

    setOpenViewStatusModal(true);
    await handleViewStatus(docId); // ✅ Pass only Doc_ID to API call
  };

  
  const handleViewStatus = (row) => {
  console.log("View Status clicked for row:", row);
  setSelectedRow(row);
  setOpenViewStatusModal(true);
};

  
    // ✅ Custom Toolbar
      const CustomToolbar = () => (
        <GridToolbarContainer>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarExport />
        </GridToolbarContainer>
      );
  return (
    <div
    style={{
      padding: 20,
      backgroundColor: "#F5F5F5",
      marginTop: "50px",
      display: "flex",
      flexDirection: "column",
      maxHeight: "100%", // Limit the max height
      overflowY: "auto", // Enable vertical scroll if needed
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
          textDecorationColor: "limegreen",
          marginBottom: -7,
          textDecorationThickness: '3px'
        }}
      >
        202 Movement Transaction
      </h2>
    </div>

    {/* Search and Icons Section */}
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
          style={{ width: "400px" }}
        />
        <Button
          onClick={handleSearch}
          style={{
            borderRadius: "25px",
            border: "2px solid skyblue",
            color: "skyblue",
            fontWeight: "bold",
            textTransform: "none",
          }}
        >
          <SearchIcon style={{ marginRight: "5px" }} />
          Search
        </Button>
      </div>

      {/* Icons Section */}
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Upload Button */}
        <IconButton
          component="span"
          onClick={() => setOpenUploadModal(true)}
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

        {/* ✅ Download Template */}
        <IconButton
          onClick={handleOpenModal}
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

        {/* ✅ Add Button */}
        <IconButton
          color="primary"
          onClick={handleOpenAddModal}
          style={{
            borderRadius: "50%",
            backgroundColor: "#0099FF",
            color: "white",
            width: "40px",
            height: "40px",
          }}
        >
          <AddIcon />
        </IconButton>
      </div>
    </div>
    {/* ✅ DataGrid */}
    <div
      style={{
        flexGrow: 1,  // Ensures it grows to fill the remaining space
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        height: "500px"
      }}
    >

      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        getRowId={(row) => row.Trn_Sap_ID} // Ensure Trn_309_ID is unique and exists
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
        slots={{ toolbar: CustomToolbar }}
        sx={{
          // Header Style
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#bdbdbd",
            color: "black",
            fontWeight: "bold",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "16px",
            //fontWeight: "bold",
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
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#2e59d9", textDecoration: "underline", textDecorationColor: "#88c57a", textDecorationThickness: "3px" }}>
            Upload Excel File
          </h3>

          <Button
            variant="contained"
            style={{ marginBottom: '10px', backgroundColor: deepPurple[500], color: 'white' }}
          >
            <a
              style={{ textDecoration: "none", color: "white" }}
              href={`${api}/transaction/Template/Trn202Movt.xlsx`}
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
          {uploadStatus && (
            <p
              style={{
                textAlign: "center",
                color: uploadStatus.includes("success") ? "green" : "red",
              }}
            >
              {uploadStatus}
            </p>
          )}

          {/* ✅ Upload Progress Bar */}
          {isUploading && (
            <Box
              sx={{
                width: "100%",
                bgcolor: "#f5f5f5",
                borderRadius: 2,
                height: "8px",
                marginTop: "10px",
              }}
            >
              <Box
                sx={{
                  width: `${uploadProgress}%`,
                  bgcolor: uploadProgress === 100 ? "#4caf50" : "#2196f3",
                  height: "100%",
                  borderRadius: 2,
                  transition: "width 0.4s ease-in-out",
                }}
              />
            </Box>
          )}

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
              {/* {isUploading ? "Uploading..." : "Upload "} */}
              Upload
            </Button>
          </Box>
        </Box>
      </Modal>






      {/* ✅ Modal with Resubmit and Cancel */}


      <Modal open={openModal} onClose={handleCloseEditModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 250,
            height: 150,
            fontSize: 12,
            bgcolor: 'background.paper',
            borderRadius: 2,
            //boxShadow: 24,
            p: 4,
          }}
        >
          <h2>Edit Document </h2>
          <Box sx={{ position: 'absolute', top: 15, right: 8 }}>
            <IconButton
              aria-label="close"
              onClick={() => setOpenModal(false)} // ✅ Closes the Edit Document modal
              sx={{
                color: '#dc3545',
                '&:hover': {
                  backgroundColor: '#f8d7da',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box>
            {/* View Details Button */}
            <Box
              sx={{
                height: '100px',
                width: '250px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '20vh',

              }}
            >
              <Button
                variant="contained"
                onClick={() => handleOpenViewStatusModal(selectedRow)}
                sx={{

                  backgroundColor: '#DB7093',
                  '&:hover': {
                    backgroundColor: '#C71585',
                  },
                  // padding: '10px 20px',
                  fontSize: '12px',
                  height: '30px',
                  width: '150px',
                  borderRadius: '8px',
                  marginTop: "-90px",
                  marginBottom: "20px",
                }}
              >
                ViewpprovalStatus
              </Button>

            </Box>

          </Box>

          {/* View Details Modal */}
          <Modal open={openViewStatusModal} onClose={() => setOpenViewStatusModal(false)}>
            <Box
              sx={{
                width: 610,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 24,
                p: 3,
                margin: "auto",
                marginTop: "10%",
                position: "relative",
              }}
            >
              {/* Modal Title */}
              <Typography
                variant="h6"
                align="center"
                sx={{
                  mb: 2,
                  fontWeight: "bold",
                  color: "#1565c0",
                  textDecoration: "underline",
                  textDecorationColor: "limegreen",
                  textDecorationThickness: "3px",
                }}
              >
                Approval Status Details
              </Typography>

              {/* Data Table */}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Date</TableCell>
                    <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Role</TableCell>
                    <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Name</TableCell>
                    <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Comment</TableCell>
                    <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewStatusData?.length > 0 ? (
                    viewStatusData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.Date}</TableCell>
                        <TableCell>{row.Role}</TableCell>
                        <TableCell>{row.Modified_By}</TableCell>
                        <TableCell>{row.Approver_Comment || "—"}</TableCell>
                        <TableCell>{row.Status}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Cancel Button inside View Details Modal */}
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <IconButton
                  aria-label="close"
                  onClick={() => setOpenViewStatusModal(false)} // Close the View Details modal
                  sx={{
                    color: '#dc3545',
                    '&:hover': {
                      backgroundColor: '#f8d7da',  // '#e2e3e5'Lighter gray for hover effect
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

            </Box>
          </Modal>

          {/* Bottom Buttons in Edit Document Modal */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '-100px' }}>
            <Button
              variant="contained"
              onClick={handleResubmit}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#115293',
                },
                fontSize: '14px',
                height: '35px',
                width: '130px',
                borderRadius: '8px',
                textTransform: 'none',
              }}
            >
              Resubmit
            </Button>

            <Button
              variant="contained"
              onClick={handleCancel}
              sx={{
                backgroundColor: '#6c757d',
                '&:hover': {
                  backgroundColor: '#5a6268',
                },
                fontSize: '14px',
                height: '35px',
                width: '130px',
                borderRadius: '8px',
                textTransform: 'none',
              }}
            >
              Cancel
            </Button>
          </div>

        </Box>
      </Modal>
    
    </div>
    
  
  )
}


export default Stock202
