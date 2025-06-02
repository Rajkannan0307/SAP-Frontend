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
import { decryptSessionData } from "../controller/StorageUtils"
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
import { Movement201, getdetails, get201ApprovalView } from "../controller/Movement201apiservice";
import { getresubmit, getCancel, setOpenEditModal, getPlants, getMaterial, getView, getExcelDownload, get309ApprovalView } from '../controller/transactionapiservice';


import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { IoMdDownload } from "react-icons/io";

import { api } from "../controller/constants";
const Stock201 = () => {

  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]); // ✅ Initial empty rows
  const [originalRows, setOriginalRows] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);
  const UserID = localStorage.getItem('UserID');

  const [User_Level, setUser_Level] = useState("");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [data, setData] = useState([]);



  const [openModal, setOpenModal] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openResubmitModal, setOpenResubmitModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openViewStatusModal, setOpenViewStatusModal] = useState(false);
  const [viewStatusData, setViewStatusData] = useState([]);



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
    const encryptedData = sessionStorage.getItem('userData');
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);


      setUser_Level(decryptedData.UserLevelName)
      console.log("userlevel", decryptedData.UserLevelName)
    }
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
        const response = await Movement201(formData)
        console.log('response', response.data)
        alert(response.data.message)
        if (response.data.NewRecord.length > 0 || response.data.DuplicateRecords.length > 0 || response.data.ErrorRecords.length > 0) {
          downloadExcel(response.data.NewRecord, response.data.DuplicateRecords, response.data.ErrorRecords);
        }
      } catch (error) {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.message)
        }
      }
    }
    getData();
    handleCloseUploadModal();
  }


  const downloadExcel = (newRecord, DuplicateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();

    // Column headers for Error Records
    const ErrorColumns = ['Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'Remark',

    ];

    // Column headers for New Records (based on your columns array)
    const newRecordsColumns = ['Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'Remark',];


    // Column headers for Duplicate Records
    const DuplicateColumns = ['Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'Remark',
    ];


    // Filter and map the data for Error Records
    const filteredError = errRecord.map(item => ({
      //Doc_ID: item.Doc_ID || '',
      Plant_Code: item.Plant_Code || '',
      Material_Code: item.Material_Code || '',
      Quantity: item.Quantity || '',
      SLoc_Code: item.SLoc_Code || '',
      CostCenter_Code: item.CostCenter_Code || '',
      Movement_Code: item.Movement_Code || '',
      Valuation_Type: item.Valuation_Type || '',
      Batch: item.Batch || '',
      Rate_Unit: item.Rate_Per_Unit || '',
      Remark: item.Reason_For_Movt || '',
      //User_Code: item.User_ID || '',
      // Approval_Status: item.Approval_Status || '',
      // SAP_Transaction_Status: item.SAP_Transaction_Status || '',

      Plant_Code_Validation: item.Plant_Val,
      Material_Code_Validation: item.Material_Val,
      SLoc_Code_Validation: item.SLoc_Val,
      CostCenter_Code_Validation: item.CostCenter_Val,

      PlantMaterial_Code_Validation: item.Plant_SLoc_Val,
      PlantSLoc_Code_Validation: item.Plant_SLoc_Val,
      Movt_Validation: item.Reason_Val,
      Mst_Valuation_Val: item.Valuation_Val,


    }));
    // Filter and map the data for New Records
    const filteredNewData = newRecord.map(item => ({
      // Doc_ID: selectedRow.Doc_ID || '',
      Plant_Code: item.Plant_Code || '',
      Material_Code: item.Material_Code || '',
      Quantity: item.Quantity || '',
      SLoc_Code: item.SLoc_Code || '',
      CostCenter_Code: item.CostCenter_Code || '',
      Movement_Code: item.Movement_Code || '',
      Valuation_Type: item.Valuation_Type || '',
      Batch: item.Batch || '',
      Rate_Unit: item.Rate_Per_Unit || '',
      Remark: item.Reason_For_Movt || '',
      //User_Code: selectedRow.User_Code || '',
      //Approval_Status: selectedRow.Approval_Status || '',
      //  SAP_Transaction_Status: selectedRow.SAP_Transaction_Status || '',

    }));



    // Filter and map the data for Duplicate Record
    const filteredUpdate = DuplicateRecord.map(item => ({

      //Doc_ID: selectedRow.Doc_ID || '',
      Plant_Code: item.Plant_Code || '',
      Material_Code: item.Material_Code || '',
      Quantity: item.Quantity || '',
      SLoc_Code: item.SLoc_Code || '',
      CostCenter_Code: item.CostCenter_Code || '',
      Movement_Code: item.Movement_Code || '',
      Valuation_Type: item.Valuation_Type || '',
      Batch: item.Batch || '',
      Rate_Unit: item.Rate_Per_Unit || '',
      Remark: item.Reason_For_Movt || '',
      //User_Code: selectedRow.User_Code || '',
      //Approval_Status: selectedRow.Approval_Status || '',
      //SAP_Transaction_Status: selectedRow.SAP_Transaction_Status || '',


      Plant_Code_Duplicate: item.Plant_Code,
      Material_Code_Duplicate: item.Material_Code,
      CostCenter_Code_Duplicate: item.CostCenter_Code,
      //Duplicate: item.Qty,
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
      const validationCols = ['Plant_Val', 'Material_Val',
        'SLoc_Val', 'CostCenter_Val',]

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



    // ✅ Style only specific duplicate columns in gray
    const styleDuplicateRecords = (worksheet, columns, dataLength) => {
      const duplicateCols = ['Plant_Code', 'Material_Code', 'SLoc_Code', 'Material_Code', 'CostCenter_Code']; // 👈 update with actual duplicate column names

      for (let row = 1; row <= dataLength; row++) {
        duplicateCols.forEach(colName => {
          const colIdx = columns.indexOf(colName);
          if (colIdx === -1) return; // skip if not found

          const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
          const cell = worksheet[cellAddress];

          if (cell) {
            cell.s = {
              font: { color: { rgb: '808080' } }, // Gray text
              // fill: { fgColor: { rgb: 'E0E0E0' } } // optional background
            };
          }
        });
      }
    };



    // Add New Records sheet even if empty data is available
    if (filteredNewData.length === 0) filteredNewData.push({});
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
    const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, { header: DuplicateColumns });
    styleDuplicateRecords(wsUpdated, DuplicateColumns, filteredUpdate.length);
    XLSX.utils.book_append_sheet(wb, wsUpdated, 'DuplicateRecords');


    const fileName = 'Trn201Movt Data UploadLog.xlsx';
    XLSX.writeFile(wb, fileName);



  }

  // const downloadExcel = () => {
  //   // Logic to download Excel file
  // };
  // excel download
  const handleDownloadExcel = (selectedRow) => {
    if (!selectedRow) {
      alert("No row selected.");
      return;
    }

    // Define new data columns
    const DataColumns = [
      'Doc_ID', 'Plant_ID', 'Material_ID', 'Quantity', 'SLoc_ID', 'CostCenter_ID',
      'Movement_ID', 'Valuation_Type', 'Batch', 'Rate_Unit', 'User_ID',
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



  //View  Download row data
  const handleDownloadExcelRowView = (item) => {
    if (!item) {
      alert("No row selected.");
      return;
    }

    const DataColumns = [
      "Doc_ID", "Plant_Code", "Material_Code", "Quantity", "SLoc_Code", "CostCenter_Code",
      "Movement_Code", "Valuation_Type", "Batch", "Rate_Unit", "Reason_For_Movt",
      "Approval_Status",
    ];

    const filteredData = [{
      Doc_ID: item.Doc_ID || '',
      Plant_Code: item.Plant_Code || '',
      Material_Code: item.Material_Code || '',
      Quantity: item.Qty || '',
      SLoc_Code: item.SLoc_Code || '',
      CostCenter_Code: item.CostCenter_Code || '',
      Movement_Code: item.Movement_Code || '',
      Valuation_Type: item.Valuation_Type || '',
      Batch: item.Batch || '',
      Rate_Unit: item.Rate_PerPart || '',
      Reason_For_Movt: item.Remarks || '',
      Approval_Status: item.Approval_Status || '',
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trn201Movt_Doc_Row_Data");

    XLSX.writeFile(workbook, `Trn201Movt_${item.Doc_ID || 'Row'}.xlsx`);

    // ✅ Show alert after download
    alert("Refer to the XLSX sheet for the particular row details.");
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
    { field: "Movement_Code", headerName: "Movement Type", flex: 1 },
    { field: "Approval_Status", headerName: "Approval Status", flex: 1 },


    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => {


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
        ['Plant_Code', 'Doc_ID', 'Date', 'Qty', 'Movement_Type ', 'Approval_Status'].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };


  const handleEdit = (rowData) => {
    setSelectedRow(rowData);        // Set the selected document
    setOpenEditModal(true);         // Open the Edit Modal
  };


  const renderActionButtons = (rowData) => {
    const status = (rowData?.Approval_Status || "").toLowerCase().trim();
    const isEditable = status === "rejected" || status === "under query";

    return (
      <>
        <Button
          onClick={() => handleEdit(rowData)}
          sx={{
            color: isEditable ? 'error.main' : 'primary.main',
            borderColor: isEditable ? 'error.main' : 'primary.main',
            borderWidth: 1,
            borderStyle: 'solid',
            mr: 1,
            minWidth: 70,
          }}
          variant="outlined"
        >
          Edit
        </Button>

        <Button
          onClick={() => handleOpenViewStatusModal(rowData)}
          variant="outlined"
          sx={{ minWidth: 70 }}
        >
          View
        </Button>

        {isEditable && (
          <>
            <Button
              onClick={() => {
                setSelectedRow(rowData);
                setOpenResubmitModal(true);
              }}
              variant="contained"
              sx={{ ml: 1 }}
            >
              Resubmit
            </Button>
            <Button
              onClick={() => {
                setSelectedRow(rowData);
                setOpenCancelModal(true);
              }}
              variant="outlined"
              color="error"
              sx={{ ml: 1 }}
            >
              Cancel
            </Button>
          </>
        )}
      </>
    );
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

    try {
      const response = await getresubmit(data);
      const isSuccess = response?.data?.success ?? response?.success;

      if (isSuccess) {
        alert("Document Resubmitted!");
        setOpenResubmitModal(false);  // close resubmit modal
        getData();                   // refresh data (table rows)
        setSelectedRow(null);        // optional: clear selection after action
      } else {
        alert(response?.data?.message ?? "Resubmit failed.");
      }
    } catch (error) {
      console.error("Resubmit error:", error);
      alert(error.response?.data?.message || "Error during resubmit.");
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

    try {
      const response = await getCancel(data);
      const isSuccess = response?.data?.success ?? response?.success;

      if (isSuccess) {
        alert("Document Cancelled!");
        setOpenCancelModal(false);
        getData(); // Refresh your data list
      } else {
        const message = response?.data?.message ?? response?.message ?? "Cancel failed.";
        alert(message);
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert(error.response?.data?.message || "Error during cancellation.");
    }
  };


  const handleOpenViewStatusModal = async (rowData) => {
    const docId = rowData?.Doc_ID;
    setSelectedRow(rowData); // sets selected row for conditional UI logic
    setOpenViewStatusModal(true); // opens the modal
    console.log("Selected Doc ID:", docId);

    try {
      const response = await get201ApprovalView(docId);
      console.log("Approval View Response:", response); // fetches status history
      setViewStatusData(response);

    } catch (error) {
      console.error("Error fetching approval status:", error);
      setViewStatusData([]); // fallback to empty state
    }
  };

  //[View_Stock201Approval_Status]
  const handleViewStatus = async (docId) => {
    console.log("Fetching approval status for Doc_ID:", docId);
    try {
      const response = await get201ApprovalView(docId);  // Make sure get309ApprovalView is set up properly
      console.log("API Response:", response);
      setViewStatusData(response);  // Update your state with the fetched data
    } catch (error) {
      console.error("❌ Error fetching grouped records:", error);
      setViewStatusData([]);  // Handle errors and reset data
    }
  };
  ;


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
          201 Movement Transaction
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
              href={`${api}/transaction/Template/Trn201Movt.xlsx`}
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

      {/*🟩 Edit Modal*/}

      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <Box sx={{
          position: 'relative',
          p: 2,
          width: { xs: 150, sm: 250 },
          height: 80,
          top: 60,
          mx: 'auto',
          mt: '10%',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          textAlign: 'center'
        }}>
          {/* Close Button */}
          <IconButton
            aria-label="close"
            onClick={() => setOpenEditModal(false)}
            sx={{
              position: 'absolute',
              top: 3,
              right: 8,
              color: '#f44336',
              '&:hover': {
                color: '#d32f2f',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontSize: '19px',
              color: '#1976d2',        // blue
              borderBottom: '2px solid limegreen',
              display: 'inline-block',
              //fontWeight: 'bold',      // make text bold
            }}
          >
            Edit Document
          </Typography>

          {/* View Approval Status Button */}
          <Button
            variant="contained"
            onClick={() => handleOpenViewStatusModal(selectedRow)}
            sx={{
              fontSize: '12px',
              top: 6,
              height: 30,
              padding: '6px',
              minWidth: '50px',
              bgcolor: '#81d4fa',      // light sky blue
              color: 'black',//'#0d47a1',       // dark blue text
              '&:hover': {
                bgcolor: '#4fc3f7',   // slightly darker light blue
              },


              // bgcolor: '#1976d2',
              // '&:hover': {
              //   bgcolor: '#115293',
              //},
            }}
          >
            View Approval Status
          </Button>

        </Box>
      </Modal>

      {/* 🟦 Resubmit Modal */}
      <Modal open={openResubmitModal} onClose={() => setOpenResubmitModal(false)}>
        <Box sx={{
          position: 'relative',  // 👈 required for absolute positioning of the close button
          p: 4,
          width: { xs: 280, sm: 400 },

          mx: 'auto',
          mt: '10%',
          bgcolor: '#E3F2FD',
          borderRadius: 3,
          boxShadow: 24,
          textAlign: 'center'
        }}>

          <Typography variant="h6" gutterBottom>Confirm Resubmission</Typography>
          <Typography sx={{ mb: 3 }}>Are you sure you want to resubmit this document?</Typography>
          <Button variant="contained" color="primary" onClick={handleResubmit} sx={{ mr: 2 }}>
            Confirm
          </Button>
          <Button variant="outlined" onClick={() => setOpenResubmitModal(false)}>Cancel</Button>
        </Box>
      </Modal>

      {/* 🟥 Cancel Modal */}
      <Modal open={openCancelModal} onClose={() => setOpenCancelModal(false)}>
        <Box sx={{
          p: 4,
          width: { xs: 280, sm: 400 },
          mx: 'auto',
          mt: '10%',
          bgcolor: '#FFEBEE',
          borderRadius: 3,
          boxShadow: 24,
          textAlign: 'center'
        }}>
          <Typography variant="h6" color="error" gutterBottom>Confirm Cancellation</Typography>
          <Typography sx={{ mb: 3 }}>Are you sure you want to cancel this document?</Typography>
          <Button variant="contained" color="error" onClick={handleCancel} sx={{ mr: 2 }}>
            Confirm
          </Button>
          <Button variant="outlined" onClick={() => setOpenCancelModal(false)}>Back</Button>
        </Box>
      </Modal>

      {/* 🟨 View Status Modal */}
      <Modal open={openViewStatusModal} onClose={() => setOpenViewStatusModal(false)}>
        <Box sx={{
          position: 'relative',
          p: 4,
          width: { xs: '90%', sm: 900 },
          mx: 'auto',
          mt: '5%',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24
        }}>
          {/* ❌ Close Button */}
          <IconButton
            aria-label="close"
            onClick={() => setOpenViewStatusModal(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#f44336',
              '&:hover': { color: '#d32f2f' },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* 🔷 Title */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: '#1976d2',
                borderBottom: '2px solid limegreen',
                display: 'inline-block',
              }}
            >
              Approval Status
            </Typography>
          </Box>

          {/* 🧾 Status Table */}
          {viewStatusData?.length > 0 ? (
            <>
              <Table size="small" sx={{ borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#bdbdbd' }}>
                    <TableCell sx={{ border: '1px solid #555555' }}>Date</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>Role</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>Name</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>Comment</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewStatusData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.Action_Date}</TableCell>
                      <TableCell>{row.Role}</TableCell>
                      <TableCell>{row.Action_By}</TableCell>
                      <TableCell>{row.Approver_Comment || '—'}</TableCell>
                      <TableCell>{row.Status} - {User_Level}</TableCell>
                    </TableRow>
                  ))}

                </TableBody>
              </Table>

              {/* ✅ Conditional Action Buttons */}
              {['under query', 'rejected'].includes(selectedRow?.Approval_Status?.toLowerCase()) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setOpenViewStatusModal(false);
                      setOpenResubmitModal(true);
                    }}
                    sx={{
                      bgcolor: '#1976d2',
                      '&:hover': { bgcolor: '#115293' },
                    }}
                  >
                    Resubmit Request
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => {
                      setOpenViewStatusModal(false);
                      setOpenCancelModal(true);
                    }}
                    sx={{
                      color: '#fff',
                      borderColor: '#d32f2f',
                      bgcolor: '#d32f2f',
                      '&:hover': {
                        bgcolor: '#9a0007',
                        borderColor: '#9a0007',
                        color: '#fff',
                      },
                    }}
                  >
                    Request Cancel
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Typography sx={{ mt: 2 }}>No approval data found.</Typography>
          )}
        </Box>
      </Modal>


    </div>


  )
}


export default Stock201