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
import{ Movement201202,getdetails} from "../controller/Movement201202apiservice";


import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { IoMdDownload } from "react-icons/io";

import { api } from "../controller/constants";
const Stock = () => {

   const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]); // ✅ Initial empty rows
    const [originalRows, setOriginalRows] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
 const [openUploadModal, setOpenUploadModal] = useState(false);
 const [openViewModal, setOpenViewModal] = useState(false);
 const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);


 const [uploadProgress, setUploadProgress] = useState(0);
   const [isUploading, setIsUploading] = useState(false);
   const [uploadedFile, setUploadedFile] = useState(null);
   const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
   const [uploadedFileData, setUploadedFileData] = useState(null);
   const [data, setData] = useState([]);
  

   const handleCloseAddModal = () => setOpenAddModal(false);
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
        const response = await Movement201202(formData)
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
      renderCell: (params) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenViewModal(params.row)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
    
          <IconButton
            size="small"
            color="success"
            onClick={() => handleDownloadExcelRowView(params.row)}
          >
            <FaDownload fontSize="small" />
          </IconButton>
        </div>
      ),
    },
    

  ];
    
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
        201/202 Movement Transaction
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
        getRowId={(row) => row.Trn_309_ID} // Ensure Trn_309_ID is unique and exists
        rowsPerPageOptions={[5]}
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
              href={`${api}/transaction/Template/Trn201,202Movt.xlsx`}
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

    
    </div>
    
  
  )
}


export default Stock
