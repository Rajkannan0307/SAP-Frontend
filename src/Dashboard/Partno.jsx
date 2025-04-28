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


import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { IoMdDownload } from "react-icons/io";
import { getTransactionData, Movement309 } from "../controller/transactionapiservice";
import { api } from "../controller/constants";
import { getdetails, getAdd, getPlants, getMaterial, getView, getExcelDownload } from '../controller/transactionapiservice';
const Partno = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]); // ✅ Initial empty rows
  const [originalRows, setOriginalRows] = useState([]);
  
  const [openAddModal, setOpenAddModal] = useState(false);
  
  const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [data, setData] = useState([]);
 
  const [PlantTable, setPlantTable] = useState([])
  const [MaterialTable, setMaterialTable] = useState([])

  const [openViewModal, setOpenViewModal] = useState(false);

  const [Trn309ID, setTrn309ID] = useState("");
  const [DocID, setDocID] = useState("");
  const [PlantID, setPlantID] = useState("");
  const [MovementID, setMovementID] = useState("");
  const [FromMatID, setFromMatID] = useState("");
  const [FromQty, setFromQty] = useState("");
  const [FromSLocID, setFromSLocID] = useState("");
  const [FromValuationType, setFromValuationType] = useState("");
  const [FromBatch, setFromBatch] = useState("");
  const [FromRatePerUnit, setFromRatePerUnit] = useState("");
  const [ToMatID, setToMatID] = useState("");
  const [ToQty, setToQty] = useState("");
  const [ToSLocID, setToSLocID] = useState("");
  const [ToValuationType, setToValuationType] = useState("");
  const [ToBatch, setToBatch] = useState("");
  const [ToRatePerUnit, setToRatePerUnit] = useState("");
  const [FromDescription, setDescription] = useState("");
  const [Remark, setRemark] = useState("");
  const [SAPTransactionStatus, setSAPTransactionStatus] = useState("");
  const [FromPrice, setFromPrice] = useState("");
  const [ToDescription, setToDescription] = useState("");
  const [ToPrice, setToPrice] = useState("");
  const [PlantCode, setPlantCode] = useState('');
  const [Date, setDate] = useState("");
  const [FromMatCode, setFromMatCode] = useState("");
  const [ToMatCode, setToMatCode] = useState("");
  const [NetDifferentPrice, setNetDifferentPrice] = useState("");
  const [ApprovalStatus, setApprovalStatus] = useState([]);



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


  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };


  const get_Material = async () => {
    try {
      const response = await getMaterial();
      setMaterialTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };


  // ✅ Handle Add Material
  const handleAdd = async () => {

    console.log("Add button clicked")
    if (PlantCode === '' || Date === '' || FromMatCode === '' || ToMatCode === '' || NetDifferentPrice === '' || ApprovalStatus === '') {
      alert("Please fill in all required fields");
      return;  // Exit the function if validation fails
    }
    try {
      const data = {
        Plant_Code: PlantCode,
        Date: Date,
        From_Mat_Code: FromMatCode,
        To_Mat_Code: ToMatCode,
        Net_Different_Price: NetDifferentPrice,
        Approval_Status: ApprovalStatus,
      }
      const response = await getAdd(data);
      alert(response.data.message);
      getData();
      handleCloseAddModal();
    } catch (error) {
      console.error(error)
    }
  };

  const handleCloseViewModal = () => {
    setOpenViewModal(false);
  };

  // ✅ Handle Upload Modal

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
        const response = await Movement309(formData)
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


  const downloadExcel = (newRecord, DuplicateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();

      // Column headers for Error Records
      const ErrorColumns = ['Plant_Code', 'From_Material_Code',
        'From_Qty', 'From_Storage_Code', 'From_Valuation_Type',
        'From_Batch', 'From_Rate_Per_Unit', 'To_Material_Code',
        'To_Qty', 'To_Storage_Code', 'To_Valuation_Type',
        'To_Batch', 'To_Rate_Per_Unit', 'Net_Different_Price', 'Remark', 'Plant_Code_Validation',
        'From_Material_Code_Validation', 'To_Material_Code_Validation',
        'From_SLoc_Code_Validation', 'To_SLoc_Code_Validation'
      ];
      
    // Column headers for New Records (based on your columns array)
    const newRecordsColumns = ['Plant_Code', 'From_Material_Code',
      'From_Qty', 'From_Storage_Code', 'From_Valuation_Type',
      'From_Batch', 'From_Rate_Per_Unit',
      'To_Material_Code', 'To_Qty',
      'To_Storage_Code', 'To_Valuation_Type',
      'To_Batch', 'To_Rate_Per_Unit', 'Net_Different_Price', 'Remark'
    ];
  

    // Column headers for Duplicate Records
    const DuplicateColumns = [
      
      'Plant_Code', 'From_Material_Code',
      'From_Qty', 'From_Storage_Code', 'From_Valuation_Type',
      'From_Batch', 'From_Rate_Per_Unit', 'To_Material_Code',
      'To_Qty', 'To_Storage_Code', 'To_Valuation_Type',
      'To_Batch', 'To_Rate_Per_Unit', 'Net_Different_Price', 'Remark',
      'Plant_Code_Duplicate',
      'From_Material_Code_Duplicate',
      'From_Qty_Duplicate',
    ];
    // // Column headers for Updated Records
    // const UpdatedColumns = ['Plant_Code', 'From_Material_Code',
    //   'From_Qty', 'From_Storage_Code', 'From_Valuation_Type',
    //   'From_Batch', 'From_Rate_Per_Unit',
    //   'To_Material_Code', 'To_Qty',
    //   'To_Storage_Code', 'To_Valuation_Type',
    //   'To_Batch', 'To_Rate_Per_Unit', 'Net_Different_Price','Remark'
    // ];

    
    // Filter and map the data for Error Records
    const filteredError = errRecord.map(item => ({
      Plant_Code: item.Plant_Code,
      From_Material_Code: item.From_Material_Code,
      From_Qty: item.From_Qty,
      From_Storage_Code: item.From_Storage_Code,
      From_Valuation_Type: item.From_Valuation_Type,
      From_Batch: item.From_Batch,
      From_Rate_Per_Unit: item.From_Rate_Per_Unit,
      To_Material_Code: item.To_Material_Code,
      To_Qty: item.To_Qty,
      To_Storage_Code: item.To_Storage_Code,
      To_Valuation_Type: item.To_Valuation_Type,
      To_Batch: item.To_Batch,
      To_Rate_Per_Unit: item.To_Rate_Per_Unit,
      Net_Different_Price: item.Net_Difference_Price,
      Remark: item.Remark,
      Plant_Code_Validation: item.Plant_val,
      From_Material_Code_Validation: item.From_Mat,
      To_Material_Code_Validation: item.To_Mat,
      From_SLoc_Code_Validation: item.From_SLoc,
      To_SLoc_Code_Validation: item.To_SLoc,

    }));
    // Filter and map the data for New Records
    const filteredNewData = newRecord.map(item => ({
      Plant_Code: item.Plant_Code,
      From_Material_Code: item.From_Material_Code,
      From_Qty: item.From_Qty,
      From_Storage_Code: item.From_Storage_Code,
      From_Valuation_Type: item.From_Valuation_Type,
      From_Batch: item.From_Batch,
      From_Rate_Per_Unit: item.From_Rate_Per_Unit,
      To_Material_Code: item.To_Material_Code,
      To_Qty: item.To_Qty,
      To_Storage_Code: item.To_Storage_Code,
      To_Valuation_Type: item.To_Valuation_Type,
      To_Batch: item.To_Batch,
      To_Rate_Per_Unit: item.To_Rate_Per_Unit,
      Net_Different_Price: item.Net_Difference_Price,
      Remark: item.Remark,
    }));



    // Filter and map the data for Duplicate Record
    const filteredUpdate = DuplicateRecord.map(item => ({

      Plant_Code: item.Plant_Code,
      From_Material_Code: item.From_Material_Code,
      From_Qty: item.From_Qty,
      From_Storage_Code: item.From_Storage_Code,
      From_Valuation_Type: item.From_Valuation_Type,
      From_Batch: item.From_Batch,
      From_Rate_Per_Unit: item.From_Rate_Per_Unit,
      To_Material_Code: item.To_Material_Code,
      To_Qty: item.To_Qty,
      To_Storage_Code: item.To_Storage_Code,
      To_Valuation_Type: item.To_Valuation_Type,
      To_Batch: item.To_Batch,
      To_Rate_Per_Unit: item.To_Rate_Per_Unit,
      Net_Different_Price: item.Net_Difference_Price,
      Remark: item.Remark,

      Plant_Code_Duplicate: item.Plant_Code,
      From_Material_Code_Duplicate: item.From_Material_Code,
      From_Qty_Duplicate: item.From_Qty,
    }));

      // // Filter and map the data for Updated Records
      // const filteredUpdate = updateRecord.map(item => ({
      //   Plant_Code: item.Plant_Code,
      //   From_Material_Code: item.From_Material_Code,
      //   From_Qty: item.From_Qty,
      //   From_Storage_Code: item.From_Storage_Code,
      //   From_Valuation_Type: item.From_Valuation_Type,
      //   From_Batch: item.From_Batch,
      //   From_Rate_Per_Unit: item.From_Rate_Per_Unit,
      //   To_Material_Code: item.To_Material_Code,
      //   To_Qty: item.To_Qty,
      //   To_Storage_Code: item.To_Storage_Code,
      //   To_Valuation_Type: item.To_Valuation_Type,
      //   To_Batch: item.To_Batch,
      //   To_Rate_Per_Unit: item.To_Rate_Per_Unit,
      //   Net_Different_Price:item.Net_Difference_Price,
      //   Remark: item.Remark,

      // }));
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
        const validationCols = ['Plant_Code_Validation', 'From_Material_Code_Validation',
          'To_Material_Code_Validation', 'From_SLoc_Code_Validation',
          'To_SLoc_Code_Validation']

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



      // Add New Records sheet even if empty data is available
      if(filteredNewData.length === 0) filteredNewData.push({});
    const wsNewRecords = XLSX.utils.json_to_sheet(filteredNewData, { header: newRecordsColumns });
    styleHeaders(wsNewRecords, newRecordsColumns);
    XLSX.utils.book_append_sheet(wb, wsNewRecords, 'New Records');


    // Add Error Records sheet  even if empty data is available
    if (filteredError.length === 0) filteredError.push({});
    const wsError = XLSX.utils.json_to_sheet(filteredError, { header: ErrorColumns });
    styleHeaders(wsError, ErrorColumns);
    styleValidationColumns(wsError, ErrorColumns, filteredError.length);
    XLSX.utils.book_append_sheet(wb, wsError, 'Error Records');

    // Add     Duplicate Records sheet even if empty data is available
    if (filteredUpdate.length === 0) filteredUpdate.push({});
    const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, { header:  DuplicateColumns });
    styleHeaders(wsUpdated, DuplicateColumns);
    XLSX.utils.book_append_sheet(wb, wsUpdated, 'DuplicateRecords');

    // // Add Updated Records sheet even if empty data is available
    // if (filteredUpdate.length === 0) filteredUpdate.push({});
    // const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, { header: UpdatedColumns });
    // styleHeaders(wsUpdated, UpdatedColumns);
    // XLSX.utils.book_append_sheet(wb, wsUpdated, 'Updated Records');

    

    // Set the file name and download the Excel file
    const fileName = 'Trn309Movt Data Upload Log.xlsx';
    XLSX.writeFile(wb, fileName);


  };


  // ✅ Open Add Modal
  const handleOpenAddModal = (item) => {
    setPlantCode("");
    setDocID("");
    setFromMatCode("");
    setToMatCode("");
    setNetDifferentPrice("");
    setApprovalStatus("");
    setOpenAddModal(true);
    get_Plant();
    get_Material();
  };
  const handleOpenViewModal = (item) => {
    setOpenViewModal(true);
    console.log(item);

    // getViewData();
    // handleView();
    setPlantCode(item.Plant_Code);
    setDocID(item.Doc_ID);
    setDate(item.Date);
    setFromMatCode(item.From_Material_Code);
    setDescription(item.From_Description);
    setFromQty(item.From_Qty);
    setFromSLocID(item.From_SLoc_Code);
    setFromPrice(item.From_Rate_Per_Unit);
    setFromValuationType(item.From_Valuation_Type);
    setFromBatch(item.From_Batch);
    setNetDifferentPrice(item.Net_Difference_Price);
    setToMatCode(item.To_Material_Code);
    setToDescription(item.To_Description);
    setToQty(item.To_Qty);
    setToSLocID(item.To_SLoc_Code);
    setToPrice(item.To_Rate_Per_Unit);
    setToValuationType(item.To_Valuation_Type);
    setToBatch(item.To_Batch);
    setApprovalStatus(item.Approval_Status);

  }



  /// ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ['Plant_Code', 'Doc_ID', 'Date', 'From_Material_Code', 'To_Material_Code ','Net_Difference_Price','Approval_Status'].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };


  const handleOpenModal = () => {
    setOpenExcelDownloadModal(true);
    setFromDate(''); // Reset From Date
    setToDate(''); // Reset To Date
  };
  const handleCloseModal = () => {
    setOpenExcelDownloadModal(false);

  };

  const handleDownloadExcel = async () => {
    if (fromDate === '') {
      alert('Select From Date');
      return;
    } else if (toDate === '') {
      alert('Select To Date');
      return;
    }

    try {
      const response = await getTransactionData(fromDate, toDate);

      if (response.status === 400) {
        // Show detailed error message from the backend
        const errorMessage = response.data.message || 'Invalid input or date range.';
        alert(`Error: ${errorMessage}`);
        return;
      }

      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      const fileExtension = ".xlsx";
      const fileName = "Trn 309 Movement List";

      // Define worksheet and header style
      const ws = XLSX.utils.json_to_sheet(response.data);

      // Apply header style (row 0)
      const headers = Object.keys(response.data[0] || {});
      headers.forEach((_, colIdx) => {
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
            alignment: { horizontal: "center" },
          };
        }
      });

      // Create workbook
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };

      // Generate and trigger download
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: fileType });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName + fileExtension);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("File downloaded successfully!");

    } catch (error) {
      console.error("Download failed:", error);

      // Check if AxiosError
      if (error.response) {
        // Backend returned a response with status code other than 2xx
        alert(` ${error.response.data.message || 'Unknown error from backend'}`);
      } else if (error.request) {
        // No response was received from the server
        alert('No response from server. Please try again later.');
      } else {
        // Something went wrong in setting up the request
        alert(`Error: ${error.message}`);
      }
    }
  };





  //✅ DataGrid Columns with Edit & Delete Buttons
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Doc_ID", headerName: "Doc ID ", flex: 1 },
    { field: "Date", headerName: "Date", flex: 1 },
    { field: "From_Material_Code", headerName: "From Mat Code", flex: 1 },
    { field: "To_Material_Code", headerName: "To Mat Code", flex: 1 },
    { field: "Net_Difference_Price", headerName: "Net Different Price", flex: 1 },
    { field: "Approval_Status", headerName: "Approval Status", flex: 1 },
    // {
    //   field: "actions",
    //   headerName: "Actions",
    //   flex: 1,
    //   sortable: false,
    //   renderCell: (params) => (


    //     <div style={{ display: "flex", gap: "10px" }}>
    //       <IconButton size="large" color="primary" onClick={handleOpenViewModal}>
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
            size="large"
            color="primary"
            onClick={() => handleOpenViewModal(params.row)} // Pass the row data to the modal handler
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </div>
      ),
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
          309 Movement Transaction
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

      {/* Add modal */}
      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <Box
          sx={{
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: 'auto',
            marginTop: '10%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '15px',
          }}
        ><h3
          style={{
            gridColumn: 'span 2',
            textAlign: 'center',
            marginBottom: '15px',
            color: 'blue',
            textDecoration: 'underline',
            textDecorationColor: 'limegreen',
            textDecorationThickness: '3px',
          }}
        >
            Add New Record
          </h3>
          <FormControl fullWidth>
            <InputLabel>Plant Code</InputLabel>
            <Select
              label="Plant Code"
              name="PlantCode"
              value={PlantCode}
              onChange={(e) => setPlantCode(e.target.value)}
            >
              {PlantTable.map((item, index) => (
                <MenuItem key={index} value={item.Plant_Id}>{item.Plant_Code}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Date"
            name="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={Date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>FromMatCode</InputLabel> {/* Fix: Closing the InputLabel tag */}
            <Select
              label="FromMatCode"
              name="FromMatCode"
              value={FromMatCode}
              onChange={(e) => setFromMatCode(e.target.value)}
              required
            >
              {MaterialTable.map((item, index) => (
                <MenuItem key={index} value={item.Material_ID}>{item.Material_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>ToMatCode</InputLabel> {/* Fix: Closing the InputLabel tag */}
            <Select
              label="ToMatCode"
              name="ToMatCode"
              value={ToMatCode}
              onChange={(e) => setToMatCode(e.target.value)}
              required
            >
              {MaterialTable.map((item, index) => (
                <MenuItem key={index} value={item.Material_ID}>{item.Material_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Net Different Price"
            name="NetDifferentPrice"
            value={NetDifferentPrice}
            onChange={(e) => setNetDifferentPrice(e.target.value)}
            required
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Approval Status</InputLabel>
            <Select
              label="Approval Status"
              name="ApprovalStatus"
              value={ApprovalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
              required
            >
              {/* Check if `data` is an array and has items */}
              {Array.isArray(data) && data.length > 0 ? (
                data.map((item) => (
                  <MenuItem key={item.Plant_Code} value={item.Approval_Status}>
                    {item.Approval_Status}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No approval statuses available</MenuItem>
              )}
            </Select>
          </FormControl>

          <Box
            sx={{
              gridColumn: 'span 2',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '15px',
            }}
          >
            <Button variant="contained" color="error" onClick={() => setOpenAddModal(false)}>
              Cancel
            </Button>
            <Button
              style={{ width: '90px' }}
              variant="contained"
              color="primary"
              onClick={handleAdd}
            >
              Add
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
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#2e59d9", textDecoration: "underline", textDecorationColor: "#88c57a", textDecorationThickness: "3px" }}>
            Upload Excel File
          </h3>

          <Button
            variant="contained"
            style={{ marginBottom: '10px', backgroundColor: deepPurple[500], color: 'white' }}
          >
            <a
              style={{ textDecoration: "none", color: "white" }}
              href={`${api}/transaction/Template/Trn309Movt.xlsx`}
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

          {/* ✅ Download Button */}
          {/* {uploadedFileData && (
            
             <Button
                variant="outlined"
                color="success"
                onClick={handleDownloadFile}
                style={{ marginTop: "5px", }}
              ><IoMdDownload style={{ marginRight: "5px", fontSize: "18px", width:"18px"}} />
                   Download Uploaded File
                  </Button>
            
          )} */}
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
      { /*View modal*/}
      <Modal open={openViewModal} onClose={() => setOpenViewModal(false)}>
        <Box
          sx={{
            width: 750,
            height: 280,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "10%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Modal Header with Close Button */}
          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>

            <h3
              style={{
                textAlign: "center",
                color: "blue",
                textDecoration: "underline",
                textDecorationColor: "limegreen",
                textDecorationThickness: "3px",
                fontSize: "24px",
                fontWeight: "bold",
                margin: 0,
                padding: 0,
                width: "100%",
              }}
            >
              309 Movement Record
            </h3>
            <button
              onClick={handleCloseViewModal}
              style={{
                top: "10px",
                right: "10px",
                backgroundColor: "#FF3333",
                color: "white",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                width: "30px",
                height: "30px",
                borderRadius: "5px",
              }}
            >
              &times;
            </button>
          </Box>
          {/* Modal Body */}
          <Box
            sx={{
              width: "100%",
              display: "flex", // Flex layout for horizontal alignment
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            {/* Left Side - From Section */}
            <Box sx={{ width: "45%" }}>
              {[
                ["Plant Code", PlantCode],
                ["From Mat Code", FromMatCode],
                ["From Description", FromDescription],
                ["From Qty", FromQty],
                ["From SLoc ID", FromSLocID],
                ["From Price", FromPrice],
                ["From Valuation Type", FromValuationType],
                ["From Batch", FromBatch],
                ["Net Different Price", NetDifferentPrice],
              ].map(([label, value], index) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: index === 0 || index === 7 ? "16px" : "4px", // adds space after first and 8th rows
                  }}
                >
                  <Box sx={{ minWidth: "170px" }}>
                    <strong>{label} </strong>:
                  </Box>
                  <Box>{value || " "}</Box>
                </Box>
              ))}
            </Box>

            {/* Vertical Divider */}
            <Divider orientation="vertical" flexItem sx={{
              marginY: 2,
              borderColor: "gray",
              borderWidth: 2,
              height: "185px",
              backgroundColor: "gray",
            }} />

            {/* Right Side - To Section */}
            <Box sx={{ width: "45%" }}>
              {[
                ["Doc ID", DocID],
                ["To Mat Code", ToMatCode],
                ["To Description", ToDescription],
                ["To Qty", ToQty],
                ["To SLoc ID", ToSLocID],
                ["To Price", ToPrice],
                ["To Valuation Type", ToValuationType],
                ["To Batch", ToBatch],
                ["Approval Status", ApprovalStatus],
              ].map(([label, value], index) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: index === 0 || index === 7 ? "16px" : "4px", // empty lines after first and 8th row
                  }}
                >
                  <Box sx={{ minWidth: "150px" }}>
                    <strong>{label} </strong>:
                  </Box>
                  <Box>{value || " "}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* ExcelDownload Modal */}

      <Modal
        open={openExcelDownloadModal}
        onClose={handleCloseModal}  // Use the custom handleCloseModal function
      >
        <Box
          sx={{
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: 'auto',
            marginTop: '10%',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '15px',
          }}
        >
          <h3
            style={{
              gridColumn: 'span 2',
              textAlign: 'center',
              marginBottom: '15px',
              color: 'blue',
              textDecoration: 'underline',
              textDecorationColor: 'limegreen',
              textDecorationThickness: '3px',
            }}
          >
            Excel Download
          </h3>

          <TextField
            label="From Date"
            name="FromDate"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <TextField
            label="To Date"
            name="ToDate"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <Box
            sx={{
              gridColumn: 'span 2',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '15px',
            }}
          >
            <Button variant="contained" color="error" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              style={{ width: '90px' }}
              variant="contained"
              color="primary"
              onClick={handleDownloadExcel}
            >
              Download
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>

  );
};

export default Partno;
