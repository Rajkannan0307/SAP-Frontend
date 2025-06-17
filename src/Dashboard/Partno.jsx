import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  IconButton,
  Typography,
  InputLabel,
} from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from '@mui/material/colors';
import { FormControl, Select, MenuItem } from '@mui/material';
import { decryptSessionData } from "../controller/StorageUtils"
import Checkbox from "@mui/material/Checkbox";
import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from 'sheetjs-style';
import InfoIcon from '@mui/icons-material/Info';
import { PiUploadDuotone } from "react-icons/pi";


import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { getTransactionData, Movement309, Movement309ReUpload } from "../controller/transactionapiservice";
import { api } from "../controller/constants";
import {
  getdetails, DownloadAllExcel, getresubmit,
  Edit309Record, getPlants, getMaterial,
  getSLoc, getValuationType, get309ApprovalView
} from '../controller/transactionapiservice';


const Partno = () => {

  const [isUpdating, setIsUpdating] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [openViewStatusModal, setOpenViewStatusModal] = useState(false);
  const [viewStatusData, setViewStatusData] = useState([]);

  const [openRowEditModal, setOpenRowEditModal] = useState(false);
  const [openViewStatus, setOpenViewStatus] = useState(false);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [openStatusModal, setOpenStatusModal] = useState(false);


  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const UserID = localStorage.getItem('UserID');
  const [openAddModal, setOpenAddModal] = useState(false);

  const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [data, setData] = useState([]);

  const [PlantTable, setPlantTable] = useState([])
  const [MaterialTable, setMaterialTable] = useState([])

  const [SLocTable, setSLocTable] = useState([])
  const [ValuationTypeTable, setValuationTypeTable] = useState([])
  const [items, setItems] = useState([]);

  const [openViewModal, setOpenViewModal] = useState(false);

  const [TrnSapID, setTrnSapID] = useState("");
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
  const [FromMatCode, setFromMatCode] = useState('');
  const [ToMatCode, setToMatCode] = useState("");
  const [NetDifferentPrice, setNetDifferentPrice] = useState("");
  const [ApprovalStatus, setApprovalStatus] = useState([]);


  const [User_Level, setUser_Level] = useState("");
  const [editSelectedFile, setEditSelectedFile] = React.useState(null);

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
      //return status === "rejected" || status === "under query";
    return status === "under query";
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
            //return status === "rejected" || status === "under query";
            return  status === "under query";
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
      //return status === "rejected" || status === "under query";
      return  status === "under query";
    });

    if (resubmittableRows.length === 0) {
      alert("No selected rows are eligible for resubmit (only 'Under Query' allowed).");
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
    //["rejected", "under query"].includes((row.Approval_Status || "").toLowerCase().trim())
  ["under query"].includes((row.Approval_Status || "").toLowerCase().trim())

  );

  const showResubmitButton = resubmittableSelectedRows.length > 0;

  // resubmit check box to connect

  useEffect(() => {
  getData();
  }, []);

  // //[View_PartnoApproval_Status]
  // const handleViewStatus = async (docId) => {
  //   console.log("Fetching approval status for Doc_ID:", docId);
  //   try {
  //     const response = await get309ApprovalView(docId);  // Make sure get309ApprovalView is set up properly
  //     console.log("API Response:", response);
  //     setViewStatusData(response);  // Update your state with the fetched data
  //   } catch (error) {
  //     console.error("❌ Error fetching grouped records:", error);
  //     setViewStatusData([]);  // Handle errors and reset data
  //   }
  // };

  const handleOpenEditModal = (record) => {
    setFromMatCode(record.FromMatCode);
    setToMatCode(record.ToMatCode);
    setTrnSapID(record.TrnSapID);
    setFromQty(record.FromQty);
    setToQty(record.ToQty);
    setFromSLocID(record.FromSLocID);
    setToSLocID(record.ToSLocID);
    setToSLocID(record.FromPrice);
    setToPrice(record.ToPrice);
    setFromValuationType(record.FromValuationType);
    setToValuationType(record.ToValuationType);
    setFromBatch(record.FromBatch);
    setToBatch(record.ToBatch);
    setOpenEditModal(true);
  };
  const getData = async () => {
    try {
      const response = await getdetails(UserID);
      console.log(response);  // Check the structure of response
      setData(response);  // main data set
      setOriginalRows(response); // for reference Backup of the original fetched data
      setRows(response);   //Filtered/sorted data shown in the UI
    } catch (error) {
      console.error(error);
      setData([]);  // Handle error by setting empty data
      setOriginalRows([]); // handle error case
      setRows([]);
    }
  };

  const status = Array.isArray(data) ? data[0]?.Approval_Status?.toLowerCase() : data?.Approval_Status?.toLowerCase();
  console.log("viiii", status)

  //decryptedData.UserLevelName
  useEffect(() => {
    getData();
    const encryptedData = sessionStorage.getItem('userData');
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);


      setUser_Level(decryptedData.UserLevelName)
      console.log("userlevel", decryptedData.UserLevelName)
    }
  }, []);

  // Backend cpnnect to -(get) plant, storage location, material, valuvation
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
  const get_SLoc = async () => {
    try {
      const response = await getSLoc();
      setSLocTable(response.data);
      console.log('Sloc Api  Sloc', response.data)
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  const get_ValuationTypeTable = async () => {
    try {
      const response = await getValuationType();
      setValuationTypeTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };


  // const handleCloseViewModal = () => {
  //   setOpenViewModal(false);
  // };

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
        formData.append("UserID", UserID);
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
  const ErrorColumns = ['Plant_Code', 'Movement_Code', 'From_Material_Code',
    'From_Qty', 'From_Storage_Code', 'From_Valuation_Type',
    'From_Batch', 'From_Rate_Per_Unit', 'To_Material_Code',
    'To_Qty', 'To_Storage_Code', 'To_Valuation_Type',
    'To_Batch', 'To_Rate_Per_Unit', 'Net_Different_Price', 'Remark', 'Plant_Code_Validation',
    'From_Material_Code_Validation', 'To_Material_Code_Validation',
    'From_SLoc_Code_Validation', 'To_SLoc_Code_Validation'
  ];

  // Column headers for New Records (based on your columns array)
  const newRecordsColumns = ['Plant_Code', 'Movement_Code', 'From_Material_Code',
    'From_Qty', 'From_Storage_Code', 'From_Valuation_Type',
    'From_Batch', 'From_Rate_Per_Unit',
    'To_Material_Code', 'To_Qty',
    'To_Storage_Code', 'To_Valuation_Type',
    'To_Batch', 'To_Rate_Per_Unit', 'Net_Different_Price', 'Remark'
  ];

  // Column headers for Duplicate Records (added From_Qty_Duplicate)
  const DuplicateColumns = [
    'Plant_Code', 'Movement_Code', 'From_Material_Code',
    'From_Qty', 'From_Storage_Code', 'From_Valuation_Type',
    'From_Batch', 'From_Rate_Per_Unit', 'To_Material_Code',
    'To_Qty', 'To_Storage_Code', 'To_Valuation_Type',
    'To_Batch', 'To_Rate_Per_Unit', 'Net_Different_Price', 'Remark',
    'Plant_Code_Duplicate',
    'From_Material_Code_Duplicate',
    'From_Qty_Duplicate'  // <-- Added new duplicate column here
  ];

  // Filter and map the data for Error Records
  const filteredError = errRecord.map(item => ({
    Plant_Code: item.Plant_Code,
    Movement_Code: item.Movement_Code,
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

    Plant_Code_Validation: item.Plant_Val,
    From_Material_Code_Validation: item.From_Mat_Val,
    To_Material_Code_Validation: item.To_Mat_Val,
    From_SLoc_Code_Validation: item.From_SLoc_Val,
    To_SLoc_Code_Validation: item.To_SLoc_Val,

    Movement_Code_Validation: item.Movement_Val,
    User_Plant_Validation: item.User_Plant_Val,
  }));

  // Filter and map the data for New Records
  const filteredNewData = newRecord.map(item => ({
    Plant_Code: item.Plant_Code,
    Movement_Code: item.Movement_Code,
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
    Movement_Code: item.Movement_Code,
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
    From_Qty_Duplicate: item.From_Qty,  // <-- Added duplicate qty value here
  }));

  // Worksheet header styling
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

  // Style validation columns in error sheet (red/green)
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

          // Green if "valid", red otherwise
          cell.s = {
            font: {
              color: { rgb: value === 'valid' ? '2e7d32' : 'FF0000' }
            }
          };
        }
      });
    }
  };

  // Style duplicate columns with gray text and red background
  const styleDuplicateRecords = (worksheet, columns, dataLength) => {
    const duplicateCols = [
      'Plant_Code',
      'From_Material_Code',
      'To_Material_Code',
      'From_SLoc_Code',
      'To_SLoc_Code',
      'From_Qty_Duplicate'  // <-- Added this column for styling
    ];

    for (let row = 0; row <= dataLength; row++) {
      columns.forEach((colName, colIdx) => {
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
        const cell = worksheet[cellAddress];
        if (!cell) return;

        if (row === 0) {
          // Header styling
          cell.s = {
            font: { bold: true, color: { rgb: '000000' } },
            fill: { fgColor: { rgb: 'FFFF00' } },
            alignment: { horizontal: 'center' }
          };
        } else if (duplicateCols.includes(colName)) {
          // Duplicate column styling
          cell.s = {
            font: { color: { rgb: '808080' } },
            fill: { fgColor: { rgb: 'FFCCCC' } }
          };
        }
      });
    }
  };

  // Add New Records sheet even if empty
  if (filteredNewData.length === 0) filteredNewData.push({});
  const wsNewRecords = XLSX.utils.json_to_sheet(filteredNewData, { header: newRecordsColumns });
  styleHeaders(wsNewRecords, newRecordsColumns);
  XLSX.utils.book_append_sheet(wb, wsNewRecords, 'New Records');

  // Add Error Records sheet even if empty
  if (filteredError.length === 0) filteredError.push({});
  const wsError = XLSX.utils.json_to_sheet(filteredError, { header: ErrorColumns });
  styleHeaders(wsError, ErrorColumns);
  styleValidationColumns(wsError, ErrorColumns, filteredError.length);
  XLSX.utils.book_append_sheet(wb, wsError, 'Error Records');

  // Add Duplicate Records sheet even if empty
  if (filteredUpdate.length === 0) filteredUpdate.push({});
  const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, { header: DuplicateColumns });
  styleDuplicateRecords(wsUpdated, DuplicateColumns, filteredUpdate.length);
  XLSX.utils.book_append_sheet(wb, wsUpdated, 'DuplicateRecords');

  // Download the file
  const fileName = 'Trn309Movt Upload DataLog.xlsx';
  XLSX.writeFile(wb, fileName);
};


  const handleOpenViewModal = (item) => {
    setOpenViewModal(true);
    console.log(item);

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
    get_Material();
    get_Plant();
    get_SLoc();
    get_ValuationTypeTable();

  }

  /// ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ['Plant_Code', 'Doc_ID', 'Date', 'From_Material_Code', 'To_Material_Code ', 'Net_Difference_Price', 'Approval_Status'].some((key) => {
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
      const fileName = "Trn_309_Movement_List";

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
    console.log("FromMatCode:", FromMatCode);
    console.log("Material options:", MaterialTable.map(i => i.Material_ID));
  }, [openRowEditModal]);

  const handleConditionalRowClick = (params) => {
    const rawStatus = params.row?.Approval_Status;

    if (!rawStatus) {
      console.warn("No status found in row:", params.row);
      return; // Exit early if status is missing
    }

    const status = rawStatus.toUpperCase();

    if (status === "REJECTED" || status === "UNDER QUERY") {
      // Set all needed states here (like in handleRowClick)
      get_Material()
      get_SLoc();
      get_ValuationTypeTable();
      setPlantCode(params.row.Plant_Code);
      setDocID(params.row.Doc_ID);
      setTrnSapID(params.row.Trn_Sap_ID);
      setNetDifferentPrice(params.row.Net_Difference_Price);
      setFromMatCode(params.row.From_Material_Code);

      setToMatCode(params.row.To_Material_Code);
      setFromQty(params.row.From_Qty);
      setToQty(params.row.To_Qty);
      setFromPrice(params.row.From_Rate_Per_Unit);
      setToPrice(params.row.To_Rate_Per_Unit);
      setFromSLocID(params.row.From_SLoc_Code); // as string
      setToSLocID(params.row.To_SLoc_Code);
      setFromValuationType(params.row.From_Valuation_Type);
      setToValuationType(params.row.To_Valuation_Type);
      setFromBatch(params.row.From_Batch);
      setToBatch(params.row.To_Batch);

      setSelectedRow(params.row);  // if needed

      setOpenRowEditModal(true);
    } else {
      console.log("Editing not allowed for this status:", status);
    }
  };


  useEffect(() => {
    console.log("MaterialTable:", MaterialTable);
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

  // requester page header 
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Doc_ID", headerName: "Doc ID", flex: 1 },
    { field: "Date", headerName: "Date", flex: 1 },
    { field: "From_Material_Code", headerName: "From Mat Code", flex: 1 },
    { field: "To_Material_Code", headerName: "To Mat Code", flex: 1 },
    { field: "Net_Difference_Price", headerName: "Net Different Price", flex: 1 },
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
         // return status === "rejected" || status === "under query";
        return  status === "under query";
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
        //const isSelectable = status === "rejected" || status === "under query";
        const isSelectable =  status === "under query";

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

  const handleCloseViewStatus = () => {
    setOpenViewStatus(false);
  };

  const handleOpenViewStatusModal = async (rowData) => {
    const docId = rowData?.Doc_ID;
    setSelectedRow(rowData); // sets selected row for conditional UI logic
    setOpenViewStatusModal(true); // opens the modal
    console.log("Selected Doc ID:", docId);

    try {
      const response = await get309ApprovalView(docId);
      console.log("Approval View Response:", response); // fetches status history
      setViewStatusData(response);

    } catch (error) {
      console.error("Error fetching approval status:", error);
      setViewStatusData([]); // fallback to empty state
    }
  };

  //view detail for Particular DocID Details ... downloa
  const handleDownloadByDocId = async (docId) => {
    try {
      if (!docId) {
        alert("Doc_ID is missing.");
        return;
      }
      console.log("Calling download with Doc_ID:", docId);

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
      link.setAttribute("download", `Trn309_DocID_${docId}.xlsx`);
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

  const handleCloseRowEditModal = () => {
    setOpenRowEditModal(false);
  };

  const [formData, setFormData] = useState({
    DocID: '',
    TrnSapId: '',
    FromMatCode: '',
    ToMatCode: '',
    FromQty: '',
    ToQty: '',
    FromSLocID: '',
    ToSLocID: '',
    FromPrice: '',
    ToPrice: '',
    FromValuationType: '',
    ToValuationType: '',
    FromBatch: '',
    ToBatch: ''
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const data = {
        ModifiedBy: UserID,
        DocID: String(DocID),
        FromMatCode,
        ToMatCode,
        FromQty,
        ToQty,
        FromSLocID,
        ToSLocID,
        FromPrice,
        ToPrice,
        FromValuationType,
        ToValuationType,
        FromBatch,
        ToBatch,
        TrnSapID
      };

      const response = await Edit309Record(data);
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

      {/* Header Section  - requester Tital*/}
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

        {/* Resubmit Button (rejected/under query -->>*only show* ) - requester */}
        <div style={{ display: "flex", gap: "10px" }}>
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

          {/* Upload Button  - requester */}
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

          {/* ✅ Download Template - requester template*/}
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

      {/* ✅ DataGrid  requester page table , edit action*/}
      <div
        style={{
          flexGrow: 1,  // Ensures it grows to fill the remaining space
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "500px"
        }}
      ><DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          getRowId={(row) => row.Trn_Sap_ID} // Ensure Trn_309_ID is unique and exists
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
              backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
              color: "black"

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

      {/* upload modal  Requester page file upload with template*/}
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
          <h3 style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#2e59d9",
            textDecoration: "underline",
            textDecorationColor: "#88c57a",
            textDecorationThickness: "3px",
            fontSize: "27px"
          }}>
            Upload Excel File
          </h3>


          <Button
            variant="contained"
            style={{ marginBottom: '8px', backgroundColor: deepPurple[500], color: 'white' }}
          >
            <a
              style={{ textDecoration: "none", color: "white", fontSize: "13px" }}
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

      {/* 🟨  Info Icon  View Status Modal */}

<Modal open={openViewStatusModal} onClose={() => setOpenViewStatusModal(false)}>
  <Box sx={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: 800 },
    maxHeight: '90vh',
    overflowY: 'auto',
    bgcolor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    padding: '24px',
  }}>
    <IconButton
      aria-label="close"
      onClick={() => setOpenViewStatusModal(false)}
      sx={{ position: 'absolute', top: 8, right: 8, color: '#f44336', '&:hover': { color: '#d32f2f' } }}
    >
      <CloseIcon />
    </IconButton>

    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#2e59d9', textDecoration: 'underline', textDecorationColor: '#88c57a', textAlign: 'center' }}>
      Approval Status
    </Typography>

    <Table size="small" sx={{ borderCollapse: 'collapse', width: '100%' }}>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#bdbdbd' }}>
          <TableCell sx={{ border: '1px solid #ddd' }}>Role</TableCell>
          <TableCell sx={{ border: '1px solid #ddd' }}>Date</TableCell>
          <TableCell sx={{ border: '1px solid #ddd' }}>Name</TableCell>
          <TableCell sx={{ border: '1px solid #ddd' }}>Comment</TableCell>
          <TableCell sx={{ border: '1px solid #ddd' }}>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[
          'Requester',
          'Plant Finance Head',
          'Plant MRPC',
          'Plant Head',
          'Corp Finance Head',
          'Corp MRPC',
        ].map((role, idx) => {
          // find the row in the data matching the Role exactly (case insensitive might be needed depending on DB)
          const row = viewStatusData.find(r => r.Role?.toLowerCase() === role.toLowerCase()) || {};
          return (
            <TableRow key={idx}>
              <TableCell sx={{ border: '1px solid #ddd' }}>{role}</TableCell>
              <TableCell sx={{ border: '1px solid #ddd' }}>{row.Action_Date || '—'}</TableCell>
              <TableCell sx={{ border: '1px solid #ddd' }}>{row.Action_By || '—'}</TableCell>
              <TableCell sx={{ border: '1px solid #ddd' }}>{row.Approver_Comment || '—'}</TableCell>
              <TableCell sx={{ border: '1px solid #ddd' }}>{row.Status ? `${row.Status} - ${User_Level}` : '—'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>

    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <Button onClick={() => setOpenViewStatusModal(false)} variant="contained" sx={{ textTransform: 'none' }}>
        Close
      </Button>
    </Box>
  </Box>
</Modal>



      {/* ExcelDownload From & To Date Modal */}
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
            Edit 309 Record
          </h3>

          {/* Read-only fields */}
          {[
            ["Plant Code", PlantCode],
            ["Doc ID", DocID],
            ["Trn ID", TrnSapID],
            ["Net Difference Price", NetDifferentPrice]
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

          {/* Select: Material */}
          {/* From Mat Code */}
          <FormControl fullWidth size="small">
            <InputLabel id="from-mat-label">From Mat Code</InputLabel>
            <Select
              labelId="from-mat-label"
              label="From Mat Code"
              value={FromMatCode}
              onChange={e => setFromMatCode(e.target.value)}
            >
              {MaterialTable.map(item => (
                <MenuItem key={item.Material_ID} value={item.Material_Code}>
                  {item.Material_Code} - {item.Description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="to-mat-label">To Mat Code</InputLabel>
            <Select
              labelId="to-mat-label"
              label="To Mat Code"
              value={ToMatCode}
              onChange={e => setToMatCode(e.target.value)}
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
            label="From Quantity"
            type="number"
            value={FromQty}
            onChange={e => setFromQty(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />


          {/* SLoc */}
          {[
            ["From SLoc Code", FromSLocID, setFromSLocID],
            ["To SLoc Code", ToSLocID, setToSLocID]
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


          {/* Price */}
          <TextField
            label="From Price"
            type="number"
            value={FromPrice}
            onChange={e => setFromPrice(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />
          <TextField
            label="To Price"
            type="number"
            value={ToPrice}
            onChange={e => setToPrice(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          {/* Valuation Type */}
          {[
            ["From Valuation Type", FromValuationType, setFromValuationType],
            ["To Valuation Type", ToValuationType, setToValuationType]
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

          {/* Batch */}
          <TextField
            label="From Batch"
            value={FromBatch}
            onChange={e => setFromBatch(e.target.value)}
            fullWidth
            {...compactFieldProps}
          />
          <TextField
            label="To Batch"
            value={ToBatch}
            onChange={e => setToBatch(e.target.value)}
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
  );
};

export default Partno;