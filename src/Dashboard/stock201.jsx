import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from '@mui/material/colors';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,

  InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { decryptSessionData } from "../controller/StorageUtils"
import EditIcon from '@mui/icons-material/Edit';

import { PiUploadDuotone } from "react-icons/pi";
import { FormControl, Select, MenuItem } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Checkbox from "@mui/material/Checkbox";

import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from 'sheetjs-style';
import {
  Movement201, Movement201Reupload, getresubmit, getCancel,
  DownloadAllExcel, getTransactionData, getdetails, getPlants,
  getMaterial, getSLoc, getMovement, getReasonForMovement, getCostCenter, getValuationType, get201ApprovalView,
  Edit201Record,
} from "../controller/Movement201apiservice";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
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

  const [openRowEditModal, setOpenRowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openResubmitModal, setOpenResubmitModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openViewStatusModal, setOpenViewStatusModal] = useState(false);
  const [viewStatusData, setViewStatusData] = useState([]);

  const [editSelectedFile, setEditSelectedFile] = React.useState(null);
  const [editUploadStatus, setEditUploadStatus] = React.useState("");
  const [editIsUploading, setEditIsUploading] = React.useState(false);
  const [editUploadProgress, setEditUploadProgress] = React.useState(0);

  const [PlantCode, setPlantCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [PlantTable, setPlantTable] = useState([])
  const [MaterialTable, setMaterialTable] = useState([])
  const [MovementTable, setMovementTable] = useState([])
  const [SLocTable, setSLocTable] = useState([])
  const [ValuationTypeTable, setValuationTypeTable] = useState([])
  const [MovementTypeTable, setMovementTypeTable] = useState([])
  const [ReasonForMovement, setReasonForMovement] = useState([])
  const [CostCenterTable, setCostCenterTable] = useState([])
  const [ReasonForMovementTable, setReasonForMovementTable] = useState([]);
  const [TrnSapID, setTrnSapID] = useState("");
  const [MovementCode, setMovementCode] = useState("");
  const [DocID, setDocID] = useState("");
  const [Qty, setQty] = useState("");
  const [SLocID, setSLocID] = useState("");
  const [CostCenterID, setCostCenterID] = useState("");
  const [ValuationType, setValuationType] = useState("");
  const [MovtID, setMovtID] = useState("");
  const [ReasonForMovt, setReasonForMovt] = useState("");
  const [Batch, setBatch] = useState("");
  const [MatCode, setMatCode] = useState('');
  const [Price, setPrice] = useState("");
  const [Description, setDescription] = useState("");
  const [ApprovalStatus, setApprovalStatus] = useState([]);
  const [Date, setDate] = useState("");
  const [items, setItems] = useState([]);






  //click resubmit
  const [openChickResubmitModal, setOpenCheckResubmitModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState({}); // Store selected checkboxes by row ID
  // Store header checkbox state
  const [checked, setChecked] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [headerChecked, setHeaderChecked] = useState(false);

  //// resubmit check box to connect

  // Checkbox state change (not directly related to selection, but you had it)
  const handleChange = (event) => {
    setChecked(event.target.checked);
  };



  //check box funcation for header and row 
  const handleHeaderCheckboxChange = (event) => {
    const checked = event.target.checked;

    const selectableRows = rows.filter((row) => {
      const status = row.Approval_Status?.toLowerCase().trim();
      return status === "rejected" || status === "under query";
    });

    if (checked) {
      const allIds = selectableRows.map((row) => row.Trn_Sap_ID);
      setSelectedRowIds(allIds);
    } else {
      setSelectedRowIds([]);
    }
  };
  const handleRowCheckboxChange = (id, checked) => {
    if (checked) {
      setSelectedRowIds((prev) => {
        const updated = [...prev, id];
        if (
          updated.length ===
          rows.filter((row) => {
            const status = row.Approval_Status?.toLowerCase().trim();
            return status === "rejected" || status === "under query";
          }).length
        ) {
          setHeaderChecked(true);
        }
        return updated;
      });
    } else {
      setSelectedRowIds((prev) => {
        const updated = prev.filter((rowId) => rowId !== id);
        setHeaderChecked(false);
        return updated;
      });
    }
  };

  const handleOpenCheckResubmitModal = async () => {
    if (!selectedRowIds || selectedRowIds.length === 0) {
      alert("Please select at least one row to resubmit.");
      return;
    }

    const selectedRowsData = rows.filter(row =>
      selectedRowIds.includes(row.Trn_Sap_ID)
    );

    const resubmittableRows = selectedRowsData.filter(row => {
      const status = (row.Approval_Status || "").toLowerCase().trim();
      return status === "rejected" || status === "under query";
    });

    if (resubmittableRows.length === 0) {
      alert("No selected rows are eligible for resubmit (only 'Rejected' or 'Under Query' allowed).");
      return;
    }

    try {
      for (const row of resubmittableRows) {
        const resubmitResponse = await getresubmit({
          Doc_ID: row.Doc_ID,
          Trn_Sap_ID: row.Trn_Sap_ID,
          UserID: UserID,
          Action: "Resubmit",
        });

        if (!resubmitResponse.success) {
          console.warn(`Resubmit failed for Doc_ID ${row.Doc_ID}`);
        }
      }

      alert("The selected document has been resubmitted successfully.");
      getData();

      // Clear all selections after resubmit
      setSelectedRowIds([]);
      setHeaderChecked(false);

    } catch (error) {
      console.error("Error during resubmit:", error);
      alert("An error occurred during resubmit. Please try again.");
    }

    setOpenCheckResubmitModal(true);
  };

  // ✅ Logic to check if the Resubmit button should be shown
  const resubmittableSelectedRows = rows.filter(row =>
    selectedRowIds.includes(row.Trn_Sap_ID) &&
    ["rejected", "under query"].includes((row.Approval_Status || "").toLowerCase().trim())
  );

  const showResubmitButton = resubmittableSelectedRows.length > 0;

  // resubmit check box to connect

  useEffect(() => {
    getData();
  }, []);




  const handleOpenEditModal = (record) => {
    // Check CostCenterID field exists in rec (adjust property name if needed)
    const costCenterIdFromRecord = record.CostCenterID || record.CostCenter_ID || "";

    // Set cost center ID from record or default to first in list if loaded
    if (costCenterIdFromRecord) {
      setCostCenterID(Number(costCenterIdFromRecord));
    } else if (CostCenterTable.length > 0) {
      setCostCenterID(CostCenterTable[0].CostCenter_ID);
    } else {
      setCostCenterID("");
    }
    setMatCode(record.MatCode);
    setTrnSapID(record.TrnSapID);
    setMovementCode(record.MovementCode);
    setQty(record.Qty);
    setSLocID(record.SLocID);
    setCostCenterID(record.CostCenterID || CostCenterTable[0]?.CostCenter_ID || "");

    setPrice(record.Price);
    setMovtID(record.MovtID);
    setValuationType(record.ValuationType);
    setReasonForMovt(record.ReasonForMovt);
    setBatch(record.Batch);
    setOpenEditModal(true);
  };

  // Backend cpnnect to -(get) plant, storage location, material, valuvation
  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data);
    } catch (error) {
      //console.error("Error updating user:", error);
    }
  };
  const get_Material = async () => {
    try {
      const response = await getMaterial();
      setMaterialTable(response.data);
    } catch (error) {
      //console.error("Error updating user:", error);
    }
  };
  const get_SLoc = async () => {
    try {
      const response = await getSLoc();
      setSLocTable(response.data);
     // console.log('Sloc Api  Sloc', response.data)
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  const get_ValuationTypeTable = async () => {
    try {
      const response = await getValuationType();
      setValuationTypeTable(response.data);
    } catch (error) {
      //console.error("Error updating user:", error);
    }
  };
  const get_CostCenter = async () => {
    try {
      const response = await getCostCenter();  
      setCostCenterTable(response.data);      
      } catch (error) {
    //  console.error("Error fetching cost centers:", error);
    }
  };

  const get_ReasonForMovement = async () => {
    try {
      const response = await getReasonForMovement();
      setReasonForMovement(response.data);
    } catch (error) {
     // console.error("Error updating user:", error);
    }
  };
  const get_Movement = async () => {
    try {
      const response = await getMovement();
      setMovementTypeTable(response.data);
    } catch (error) {
     // console.error("Error updating user:", error);
    }
  }

  const handleCloseRowEditModal = () => {
    setOpenRowEditModal(false);
  };

  const handleDownload = (row) => {
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `record-${row.Doc_ID}.json`; // Use unique filename
    link.click();
  };


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
      const decryptedData = decryptSessionData(encryptedData)
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

      Plant_Code_Validation: item.Plant_Val,
      Plant_Material_Code_Validation: item.Material_Val,
      SLoc_Code_Validation: item.SLoc_Val,
      CostCenter_Code_Validation: item.CostCenter_Val,

      Plant_SLoc_Val_Validation: item.Plant_SLoc_Val,
      Plant_CostCenter_Val_Validation: item.Plant_CostCenter_Val,
      Movt_Validation: item.Reason_Val,
      Mst_Valuation_Val: item.Valuation_Val,
      User_Plant_Val: item.User_Plant_Val,

    }));



    // Filter and map the data for New Records
    const filteredNewData = newRecord.map(item => ({
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

    }));

    // Filter and map the data for Duplicate Record
    const filteredUpdate = DuplicateRecord.map(item => ({
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


      Plant_Code_Duplicate: item.Plant_Code,
      Material_Code_Duplicate: item.Material_Code,
      CostCenter_Code_Duplicate: item.CostCenter_Code,
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
        'SLoc_Val', 'CostCenter_Val', 'Plant_SLoc_Val',
        'Plant_CostCenter_Val', 'Reason_Val',
        'Valuation_Val', 'User_Plant_Val',]

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



  // Upload handler
  const handleEditUploadData = async (docId, trnSapId) => {
    if (!editSelectedFile) {
      alert("Please select a file first.");
      return;
    }

    try {
      const finalDocId = typeof docId === 'object' ? docId?.Doc_ID : docId;

      const formData = new FormData();
      formData.append("User_Add", editSelectedFile);  // Ensure key matches backend
      formData.append("UserID", UserID);
      formData.append("Doc_ID", finalDocId); // Must be a primitive value (number or string of number)
      formData.append("Trn_Sap_ID", trnSapId);
      const response = await Movement201Reupload(formData); // Don't pass docId again if your function wraps it
      console.log('response', response.data);
      alert(response.data.message);

      const reuploadData = response.data.ReUploadRecord || [];
      const errorData = response.data.ErrorRecords || [];

      console.log('ReUploadRecord:', reuploadData);
      console.log('ErrorRecords:', errorData);

      if (reuploadData.length > 0 || errorData.length > 0) {
        downloadExcelReUpload(reuploadData, errorData);
      } else {
        console.log("No data to download.");
      }

    } catch (error) {
      console.error('Upload failed:', error?.response?.data || error.message);
      alert(error.response?.data?.message || 'Upload failed.');
    }

    getData();
    setOpenEditModal(false);
  };

  // File input handler
  const handleEditFileUpload = (event) => {
    setEditSelectedFile(event.target.files[0]);
  };


  const downloadExcelReUpload = (updateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();
    // Column headers for Error Records
    const ErrorColumns = ['Doc_ID', 'Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'Remark',

    ];



    // Column headers for Duplicate Records
    const ReUploadColumns = ['Doc_ID', 'Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'Remark',
    ];


    // Filter and map the data for Error Records
    const filteredError = errRecord.map(item => ({
      Doc_ID: item.Doc_ID || '',
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
      Plant_Material_Code_Validation: item.Material_Val,
      SLoc_Code_Validation: item.SLoc_Val,
      CostCenter_Code_Validation: item.CostCenter_Val,

      Plant_SLoc_Val_Validation: item.Plant_SLoc_Val,
      Plant_CostCenter_Val_Validation: item.Plant_CostCenter_Val,
      Movt_Validation: item.Reason_Val,
      Mst_Valuation_Val: item.Valuation_Val,
      User_Plant_Val: item.User_Plant_Val,

    }));



    // Filter and map the data for New Records
    const filteredUpdate = updateRecord.map(item => ({
      Doc_ID: item.Doc_ID || '',
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
        'SLoc_Val', 'CostCenter_Val', 'Plant_SLoc_Val',
        'Plant_CostCenter_Val', 'Reason_Val',
        'Valuation_Val', 'User_Plant_Val',]

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



    // Always add at least one row so the file is not empty
    const wsError = XLSX.utils.json_to_sheet(filteredError.length ? filteredError : [{}], { header: ErrorColumns });
    styleHeaders(wsError, ErrorColumns);
    styleValidationColumns(wsError, ErrorColumns, filteredError.length);
    XLSX.utils.book_append_sheet(wb, wsError, 'Error Records');

    const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate.length ? filteredUpdate : [{}], { header: ReUploadColumns });
    styleHeaders(wsUpdated, ReUploadColumns);
    styleValidationColumns(wsUpdated, ReUploadColumns, filteredUpdate.length);
    XLSX.utils.book_append_sheet(wb, wsUpdated, 'Updated Records');

    const fileName = 'Trn201Movt ReuploadData Upload Log.xlsx';
    console.log("Writing Excel file...");
    XLSX.writeFile(wb, fileName);
  };





  //view detail for Particular DocID Details ... downloa

  const handleDownloadByDocId = async (docId) => {
    try {
      if (!docId) {
        alert("Doc_ID is missing.");
        return;
      }

      const response = await DownloadAllExcel(docId);
      const data = response.data;

      if (!data || data.length === 0) {
        alert("No data found for this Doc_ID.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(data);

      // Style headers
      const headers = Object.keys(data[0]);
      headers.forEach((_, colIdx) => {
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "FFFF00" } },
            alignment: { horizontal: "center" },
          };
        }
      });

      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });

      const fileType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      const blob = new Blob([excelBuffer], { type: fileType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Trn201_DocID_${docId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      alert(`Downloaded data for Doc_ID: ${docId}`);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error downloading file. See console for details.");
    }
  };


  // Download the data from the trn sap table to particular date
  const handleDownloadReportExcel = async () => {
    if (!fromDate) {
      alert('Select From Date');
      return;
    }
    if (!toDate) {
      alert('Select To Date');
      return;
    }

    try {
      // Call backend API with fromDate and toDate as query params
      const response = await getTransactionData(fromDate, toDate);

      if (response.status === 400) {
        alert(`Error: ${response.data.message || 'Invalid input or date range.'}`);
        return;
      }

      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      const fileExtension = ".xlsx";
      const fileName = "Trn_201_Movement_List";

      // Convert JSON response to worksheet
      const ws = XLSX.utils.json_to_sheet(response.data);

      // Style header row (row 0)
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

      // Write workbook to binary array
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Create Blob and trigger download
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
      if (error.response) {
        alert(error.response.data.message || "Unknown error from backend");
      } else if (error.request) {
        alert("No response from server. Please try again later.");
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
   }, [openRowEditModal]);

  useEffect(() => {
    }, [openRowEditModal]);

  const loadDropdownData = async () => {
    await Promise.all([
      get_Material(),
      get_SLoc(),
      get_ValuationTypeTable(),
      get_Movement(),
      get_ReasonForMovement(),
      get_CostCenter()
    ]);
  };

  const handleConditionalRowClick = async (params) => {
    console.log('selected row', params.row);

    const rawStatus = params.row?.Approval_Status;
    if (!rawStatus) return;

    const status = rawStatus.toUpperCase();

    if (status === "REJECTED" || status === "UNDER QUERY") {
      await loadDropdownData();

      setPlantCode(params.row.Plant_Code);
      setDocID(params.row.Doc_ID);
      setTrnSapID(params.row.Trn_Sap_ID);
      setMatCode(params.row.Material_Code);
      setQty(params.row.Qty);
      setPrice(params.row.Rate_PerPart);

      setCostCenterID(params.row.CostCenter_ID);
      setSLocID(params.row.SLoc_Code);
      setMovtID(params.row.Movement_Code);
      setValuationType(params.row.Valuation_Type);

      // IMPORTANT: set ReasonForMovement (not ReasonForMovt)
      setReasonForMovement(params.row.Remarks);

      setBatch(params.row.Batch);

      setSelectedRow(params.row);
      setOpenRowEditModal(true);
      setReasonForMovement(String(params.row.Remarks));
      setCostCenterID(String(params.row.CostCenter_ID));

    }
  };



  useEffect(() => {
  }, [MaterialTable]);

  const handleCloseEditRowModal = () => {
    setOpenRowEditModal(false);

  };

  // edit box style
  const compactFieldProps = {
    size: "small",
    sx: {
      "& .MuiInputBase-input": {
        fontSize: 13,
        height: 30,

        padding: "4px 8px"
      }
    }
  };


  //✅ DataGrid Columns with Edit & Delete Buttons

  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Doc_ID", headerName: "Doc ID", flex: 1 },
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
      editable: false,
      disableColumnMenu: true,
      renderHeader: () => {
        const selectableRows = rows.filter((row) => {
          const status = row.Approval_Status?.toLowerCase().trim();
          return status === "rejected" || status === "under query";
        });

        const allSelected =
          selectableRows.length > 0 &&
          selectedRowIds.length === selectableRows.length;
        const isIndeterminate =
          selectedRowIds.length > 0 &&
          selectedRowIds.length < selectableRows.length;

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >

            <span sx={{
              fontWeight: 600, fontSize: 20, color: '#333', // optional
            }}
            >
              Actions
            </span>

            {selectableRows.length > 0 && (
              <Checkbox
                checked={allSelected}
                indeterminate={isIndeterminate}
                onChange={handleHeaderCheckboxChange}
                inputProps={{ "aria-label": "Select all rows" }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        );
      },
      // In renderCell:
      renderCell: (params) => {
        const row = params.row;
        const status = row.Approval_Status?.toLowerCase().trim();
        const isSelectable = status === "rejected" || status === "under query";

        const isChecked = selectedRowIds.includes(row.Trn_Sap_ID);

        console.log("Approval_Status:", row.Approval_Status); // 👈 Debug

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRow(row);
                handleOpenViewStatusModal(row);
              }}
              title="View Details"
              style={{ cursor: "pointer", color: "#008080" }}
            >
              <InfoIcon sx={{ fontSize: 24 }} />
            </div>

            {isSelectable && (
              <Checkbox
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  handleRowCheckboxChange(row.Trn_Sap_ID, e.target.checked);
                }}
              />
            )}
          </div>
        );
      },

    }
  ];




  // const handleOpenViewModal = (item) => {
  //   setOpenViewModal(true);

  // }


  const handleOpenModal = () => {
    setOpenExcelDownloadModal(true);
    setFromDate(''); // Reset From Date
    setToDate(''); // Reset To Date
  };
  const handleCloseModal = () => {
    setOpenExcelDownloadModal(false);

  };


  const handleOpenViewModal = (item) => {
    setOpenViewModal(true);
    console.log(item);

    setPlantCode(item.Plant_Code);
    setDocID(item.Doc_ID);
    setDate(item.Date);
    setMatCode(item.Material_Code);
    setDescription(item.Description);
    setQty(item.Qty);
    setSLocID(item.SLoc_Code);
    setMovtID(item.Movement_Code);
    setPrice(item.Rate_Per_Unit);
    setValuationType(item.Valuation_Type);
    setReasonForMovt(item.ReasonForMovt);
    setBatch(item.Batch);
    setApprovalStatus(item.Approval_Status);
    get_Material();
    get_Plant();
    get_SLoc();
    get_ValuationTypeTable();
    get_Movement();
    get_ReasonForMovement();
    get_CostCenter();

  }

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
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleOpenViewStatusModal(rowData)}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>

        {isEditable && (
          <>
            <IconButton
              size="small"
              sx={{
                color: "#6a0dad",
                "&:hover": {
                  color: "#4b0082",
                },
              }}
              onClick={() => handleEdit(rowData)}
            >
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="success"
              onClick={() => handleDownloadByDocId(rowData.Doc_ID)}
            >
              <CloudDownloadIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </>
    );
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

  const [formData, setFormData] = useState({
    DocID: '',
    TrnSapId: '',
    MatCode: '',
    Qty: '',
    SLocID: '',
    CostCenterID: '',
    Price: '',
    ValuationType: '',
    Batch: ''
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const data = {
        ModifiedBy: UserID,
        DocID: String(DocID),
        MatCode,
        Qty,
        SLocID,
        CostCenterID,
        Price,
        ValuationType,
        Batch,
        TrnSapID
      };

      const response = await Edit201Record(data);
      console.log("API response:", response);

      if (response?.success === true) {
        alert(response.message);
        getData();
        handleCloseRowEditModal();
      } else {
        alert(response?.message || "Update failed. Please try again.");
      }
    } catch (error) {
      console.error("Error details:", error.response?.data || error);
      alert(error.response?.data?.message || "An error occurred while updating the record.");
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await getTransactionData(); // this is the correct service call
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    getData();
    get_SLoc();

  }, []);


  useEffect(() => {
    async function fetchReasonForMovement() {
      const response = await getReasonForMovement(); // your function to call stored procedure
      setReasonForMovementTable(response.data);
    }
    fetchReasonForMovement();
  }, []);



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
      {/* Search and Icons Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {/* Search Box - requester */}
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

        {/* Resubmit, Upload, and Download Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {/* ✅ Resubmit Button (Only if status is Rejected or Under Query) */}
          {showResubmitButton && (
            <Button
              variant="contained"
              onClick={handleOpenCheckResubmitModal}
              startIcon={<PiUploadDuotone size={20} />}
              sx={{
                borderRadius: 1,
                backgroundColor: "#BA68C8",
                color: "white",
                padding: "8px 16px",
                textTransform: "none",
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#B3E5FC',
                },
                '&:active': {
                  backgroundColor: "#0288D1",
                },
              }}
            >
              Resubmit
            </Button>
          )}

          {/* Upload Button - requester */}
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

          {/* Download Template - requester */}
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
          getRowId={(row) => row.Trn_Sap_ID} // Ensure Trn_Sap_ID is unique and exists
          rowsPerPageOptions={[5]}
          onRowClick={handleConditionalRowClick}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          onCellClick={(params, event) => {
            if (params.field === "actions") {
              event.stopPropagation();
            }
          }}
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
          <h3
            style={{
              textAlign: "center",
              marginBottom: "20px",
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
              textUnderlineOffset: "6px"
            }}
          >
            Upload Excel File to Edit Document
          </h3>

          <Button
            variant="contained"
            sx={{
              mb: 2,
              backgroundColor: deepPurple[400],
              color: 'white',
              '&:hover': {
                backgroundColor: deepPurple[600],  // darker purple on hover
              },
              '&:active': {
                backgroundColor: deepPurple[900],  // even darker when clicked
              },
            }}
          >
            <a
              style={{ textDecoration: 'none', color: 'white' }}
              href={`${api}/transaction/Template/ReUpload201Movt.xlsx`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDownload className="icon" /> &nbsp;&nbsp;Download Template
            </a>
          </Button>


          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleEditFileUpload}
            style={{
              padding: "8px",
              backgroundColor: "white",
              //color: "black",
              border: "1px solid black",
              borderRadius: "5px",
              cursor: "pointer",
              width: "240px",
              marginTop: "10px",
            }}
          />

          {editUploadStatus && (
            <p
              style={{
                textAlign: "center",
                color: editUploadStatus.includes("success") ? "green" : "red",
              }}
            >
              {editUploadStatus}
            </p>
          )}

          {editIsUploading && (
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
                  width: `${editUploadProgress}%`,
                  bgcolor: editUploadProgress === 100 ? "#4caf50" : "#2196f3",
                  height: "100%",
                  borderRadius: 2,
                  transition: "width 0.4s ease-in-out",
                }}
              />
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={() => setOpenEditModal(false)}
              sx={{
                mt: 2,
                width: '25%',
                height: '38px',
                color: '#fff', // Text color
                backgroundColor: '#d32f2f', // MUI error main color
                '&:hover': {
                  backgroundColor: '#9a0007', // MUI error dark color for hover
                },
                '&:active': {
                  backgroundColor: '#7f0005', // Darker shade for click/active
                },
              }}
            >
              Close
            </Button>

            <Button
              variant="contained"
              onClick={() => handleEditUploadData(selectedRow?.Doc_ID, selectedRow?.Trn_Sap_ID)}
              disabled={editIsUploading}
              sx={{
                mt: 2,
                width: '25%',
                height: '38px',
                color: '#ffffff',
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#115293',
                },
                '&:active': {
                  backgroundColor: '#0d3c6a', // darker blue for active/click
                },
              }}
            >
              ReUpload
            </Button>

          </Box>
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
                  <TableRow key={idx} sx={{ border: '1px solid #555555' }}>
                    <TableCell sx={{ border: '1px solid #555555' }}>{row.Action_Date}</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>{row.Role}</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>{row.Action_By}</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>{row.Approver_Comment || '—'}</TableCell>
                    <TableCell sx={{ border: '1px solid #555555' }}>{row.Status} - {User_Level}</TableCell>


                  </TableRow>
                ))}

              </TableBody>
            </Table>


          </>
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
              onClick={handleDownloadReportExcel}
            >
              Download
            </Button>
          </Box>
        </Box>
      </Modal>



      {/*Row edit modal*/}
      <Modal open={openRowEditModal} onClose={handleCloseRowEditModal}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            width: 450,
            maxHeight: "85vh",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 3,
            p: 2,
            mt: 4,
            mx: "auto",
            gap: 1.5,
            overflowY: "auto",
            transition: 'all 0.3s ease'
          }}
        >
          <h3 style={{
            gridColumn: "span 2",
            textAlign: "center",
            color: "#2e59d9",
            textDecoration: "underline",
            textDecorationColor: "#88c57a",
            textDecorationThickness: "3px",
          }}>
            Edit 201 Record
          </h3>

          {/* Read-only fields */}
          {[
            ["Plant Code", PlantCode],
            ["Doc ID", DocID],
            ["Trn ID", TrnSapID],
          ].map(([label, value]) => (
            <TextField
              key={label}
              label={label}
              value={value}
              fullWidth
              InputProps={{ readOnly: true }}
              {...compactFieldProps}
            />
          ))}

          {/* Read-only Movement Type */}
          <TextField
            label="Movement Type"
            value={MovtID}  // Assuming MovtID holds the code string to display
            fullWidth
            InputProps={{ readOnly: true }}
            {...compactFieldProps}
          />

          {/* Select: Material */}
          <FormControl fullWidth size="small">
            <InputLabel id="to-mat-label">Material Code</InputLabel>
            <Select
              labelId="mat-label"
              label="Mat Code"
              value={MatCode}
              onChange={e => setMatCode(e.target.value)}
            >
              {MaterialTable.map(item =>
                <MenuItem key={item.Material_ID} value={item.Material_Code}>
                  {item.Material_Code} - {item.Description}
                </MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Quantities */}
          <TextField
            label="Quantity"
            type="number"
            value={Qty}
            onChange={e => setQty(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          {/* SLoc */}
          {[
            ["SLoc Code", SLocID, setSLocID],
          ].map(([label, value, setter]) => (
            <FormControl fullWidth size="small" key={label}>
              <InputLabel id={`${label}-label`}>{label}</InputLabel>
              <Select
                labelId={`${label}-label`}
                label={label}
                value={value}
                onChange={e => setter(e.target.value)}
              >
                {SLocTable.map(item => (
                  <MenuItem key={item.SLoc_ID} value={item.Storage_Code}>
                    {item.Storage_Code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          {/* CostCenter Dropdown */}

          {[
            ["Cost Center", CostCenterID || "", setCostCenterID, CostCenterTable, "CostCenter_ID", "CostCenter_Code"]
          ].map(([label, value, setter, table, idKey, labelKey]) => (
            <FormControl fullWidth size="small" key={label}>
              <InputLabel id={`${label}-label`}>{label}</InputLabel>
              <Select
                labelId={`${label}-label`}
                label={label}
                value={value}
                onChange={(e) => setter(e.target.value)}
              >
                {table.map(item => (
                  <MenuItem key={item[idKey]} value={item[idKey]}>
                    {item[labelKey]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          {/* Price */}
          <TextField
            label="Price"
            type="number"
            value={Price}
            onChange={e => setPrice(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          {/* Valuation Type */}
          {[
            ["Valuation Type", ValuationType, setValuationType]
          ].map(([label, value, setter]) => (
            <FormControl fullWidth size="small" key={label}>
              <InputLabel id={`${label}-label`}>{label}</InputLabel>
              <Select
                labelId={`${label}-label`}
                label={label}
                value={value}
                onChange={e => setter(e.target.value)}
              >
                {ValuationTypeTable.map(item =>
                  <MenuItem key={item.Valuation_ID} value={item.Valuation_Name}>
                    {item.Valuation_Name}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          ))}

          {/* ReasonForMovement Type */}

          <FormControl fullWidth size="small">
            <InputLabel id="reason-for-mov-label">Reason For Movement</InputLabel>
            <Select
              labelId="reason-for-mov-label"
              label="Reason For Movement"
              value={ReasonForMovement}
              onChange={e => setReasonForMovement(e.target.value)}
            >
              {ReasonForMovementTable.map(item => (
                <MenuItem
                  key={item.Movt_List_ID}
                  value={`${item.Movement_List_Code}-${item.Movement_List_Name}`}
                >
                  {item.Movement_List_Code}-{item.Movement_List_Name}
                </MenuItem>

              ))}
            </Select>
          </FormControl>



          <TextField
            label="Batch"
            value={Batch}
            onChange={e => setBatch(e.target.value)}
            fullWidth
            {...compactFieldProps}
          />

          {/* Buttons */}
          <Box sx={{ gridColumn: "span 2", display: "flex", justifyContent: "center", gap: 2, mt: 1 }}>
            <Button size="small" variant="contained" color="error" onClick={handleCloseRowEditModal}>Cancel</Button>
            <Button size="small" variant="contained" color="primary" onClick={handleUpdate}>Update</Button>
          </Box>
        </Box>
      </Modal>


    </div>
  )
}


export default Stock201