import React, { useState, useEffect } from "react";
import { TextField, Button, Modal, Box, IconButton, Typography, } from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from '@mui/material/colors';

import {
  Table, TableHead, TableRow, TableCell, TableBody, InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { decryptSessionData } from "../controller/StorageUtils"
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
  Movement311, getresubmit, getTransactionData, getdetails, getPlants, getMaterial, getSLoc,
  getMovement, getValuationType, get311ApprovalView, Edit311Record,
} from "../controller/Movement311apiservice";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { api } from "../controller/constants";

const Location = () => {

  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [openUploadModal, setOpenUploadModal] = useState(false);
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
  const [openViewStatusModal, setOpenViewStatusModal] = useState(false);
  const [viewStatusData, setViewStatusData] = useState([]);


  const [PlantCode, setPlantCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [PlantTable, setPlantTable] = useState([])
  const [MaterialTable, setMaterialTable] = useState([])
  const [SLocTable, setSLocTable] = useState([])
  const [ValuationTypeTable, setValuationTypeTable] = useState([])
  const [MovementTypeTable, setMovementTypeTable] = useState([])
  const [ReasonForMovement, setReasonForMovement] = useState([])
  const [CostCenterTable, setCostCenterTable] = useState([])
  const [ReasonForMovementTable, setReasonForMovementTable] = useState([]);
  const [TrnSapID, setTrnSapID] = useState("");
  const [DocID, setDocID] = useState("");
  const [Qty, setQty] = useState("");
  const [SLocID, setSLocID] = useState("");
  const [CostCenterID, setCostCenterID] = useState("");

  const [CostCenterCode, setCostCenterCode] = useState("");
  const [ValuationType, setValuationType] = useState("");
  const [MovtID, setMovtID] = useState("");
  const [Batch, setBatch] = useState("");
  const [MatCode, setMatCode] = useState('');
  const [Price, setPrice] = useState("");
  const [items, setItems] = useState([]);
  //click resubmit
  const [openChickResubmitModal, setOpenCheckResubmitModal] = useState(false);
  // Store header checkbox state
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [headerChecked, setHeaderChecked] = useState(false);

  const [Rejection_Qty, setRejection_Qty] = useState(0);
  const [Provision_Qty, setProvision_Qty] = useState(0);
  const [Difference_Qty, setDifference_Qty] = useState(0);
  const [Difference_Value, setDifference_Value] = useState(0);
  const [Rejection_Value, setRejection_Value] = useState(0);
  const [Provision_Value, setProvision_Value] = useState(0);
  const [Rate_PerPart, setRate_PerPart] = useState(0);




  useEffect(() => {
    const underQueryIds = rows
      .filter(row => row.Approval_Status?.toLowerCase().trim() === "under query")
      .map(row => row.Trn_Sap_ID);

    // If all underQueryIds are in selectedRowIds, header checkbox is checked, else not
    const allSelected = underQueryIds.length > 0 && underQueryIds.every(id => selectedRowIds.includes(id));
    setHeaderChecked(allSelected);
  }, [selectedRowIds, rows]);

  // Header checkbox change: select/deselect all 'Under Query' rows
  const handleHeaderCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setHeaderChecked(isChecked);

    if (isChecked) {
      const underQueryIds = rows
        .filter(row => row.Approval_Status?.toLowerCase().trim() === "under query")
        .map(row => row.Trn_Sap_ID);
      setSelectedRowIds(underQueryIds);
    } else {
      setSelectedRowIds([]);
    }
  };

  // Individual row checkbox change: add/remove from selectedRowIds
  const handleRowCheckboxChange = (id, isChecked) => {
    setSelectedRowIds(prev => {
      if (isChecked) {
        return [...prev, id];
      } else {
        return prev.filter(rowId => rowId !== id);
      }
    });
  };

  // Sync header checkbox when selectedRowIds change
  useEffect(() => {
    const underQueryIds = rows
      .filter(row => row.Approval_Status?.toLowerCase().trim() === "under query")
      .map(row => row.Trn_Sap_ID);

    const allSelected = underQueryIds.length > 0 && underQueryIds.every(id => selectedRowIds.includes(id));
    setHeaderChecked(allSelected);
  }, [selectedRowIds, rows]);



  // check box select and re submit
  const handleOpenCheckResubmitModal = async () => {
    if (!selectedRowIds || selectedRowIds.length === 0) {
      alert("Please select at least one row to resubmit.");
      return;
    }

    const selectedRowsData = rows.filter(row =>
      selectedRowIds.includes(row.Trn_Sap_ID)
    );

    const resubmittableRows = selectedRowsData.filter(row =>
      (row.Approval_Status || "").toLowerCase().trim() === "under query"
    );

    if (resubmittableRows.length === 0) {
      alert("No valid rows eligible for resubmit.");
      return;
    }

    try {
      let successCount = 0;

      for (const row of resubmittableRows) {
        const resubmitResponse = await getresubmit({
          Doc_ID: row.Doc_ID,
          Trn_Sap_ID: row.Trn_Sap_ID,
          UserID: UserID,
          Action: "Resubmit"
        });

        if (resubmitResponse.success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        alert(`${successCount} row(s) resubmitted.`);

        // ✅ Option A: Update only changed rows locally (faster UI)
        setRows(prevRows =>
          prevRows.map(row =>
            selectedRowIds.includes(row.Trn_Sap_ID) &&
              row.Approval_Status.toLowerCase().trim() === "under query"
              ? { ...row, Approval_Status: "Pending" }
              : row
          )
        );

        // ✅ Option B: Full reload from backend (slower, but complete)
        // await getData();

        setSelectedRowIds([]);
        setHeaderChecked(false);
      } else {
        alert("No rows were updated.");
      }

    } catch (error) {
      console.error("Error during resubmit:", error);
      alert("An error occurred during resubmit.");
    }

    setOpenCheckResubmitModal(true);
  };

  // ✅ Button condition
  const showResubmitButton = rows.some(row =>
    selectedRowIds.includes(row.Trn_Sap_ID) &&
    row.Approval_Status?.toLowerCase().trim() === "under query"
  );

  // resubmit check box to connect
  useEffect(() => {
    getData();
  }, []);

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

  try {
    const formData = new FormData();
    formData.append("User_Add", uploadedFile);
    formData.append("UserID", UserID);

    const response = await Movement311(formData);
    alert(response.data.message);
 console.log('response', response.data)
    const newRecords = response.data.NewRecord || [];
    const errorRecords = response.data.ErrorRecords || [];

    if (newRecords.length > 0 || errorRecords.length > 0) {
      downloadExcel(newRecords, errorRecords);
    }
  } catch (error) {
    alert(error?.response?.data?.message || "Upload failed.");
  }

  getData();
  handleCloseUploadModal();
};


const downloadExcel = (newRecord = [], errRecord = []) => {
  const wb = XLSX.utils.book_new();

  const commonHeaders = [
    "Plant_Code", "Material_Code", "From_SLoc_Code", "To_SLoc_Code",
    "Reason_For_Movt", "Movement_Code", "Qty",
    "Valuation_Type", "Batch", "Remark"
  ];

  const errorHeaders = [
    ...commonHeaders,
    "Plant_Val", "Material_Val", "From_SLoc_Val", "To_SLoc_Val",
    "From_SLoc_Plant_Val", "To_SLoc_Plant_Val", "Material_Plant_Val",
    "Movement_Val", "User_Plant_Val"
  ];

  const formatRecord = (item) => ({
    Plant_Code: item.Plant_Code || '',
    Material_Code: item.Material_Code || '',
    From_SLoc_Code: item.From_SLoc_Code || '', // fixed from item.SLoc_Code
    To_SLoc_Code: item.To_SLoc_Code || '',
    Reason_For_Movt: item.Reason_For_Movt || '',
    Movement_Code: item.Movement_Code || '',
    Qty: item.Qty || '',
    Valuation_Type: item.Valuation_Type || '',
    Batch: item.Batch || '',
    Remark: item.Remark || item.Remarks || ''
  });

  const formatErrorRecord = (item) => ({
    ...formatRecord(item),
    Plant_Val: item.Plant_Val || '',
    Material_Val: item.Material_Val || '',
    From_SLoc_Val: item.From_SLoc_Val || '',
    To_SLoc_Val: item.To_SLoc_Val || '',
    From_SLoc_Plant_Val: item.From_SLoc_Plant_Val || '',
    To_SLoc_Plant_Val: item.To_SLoc_Plant_Val || '',
    Material_Plant_Val: item.Material_Plant_Val || '',
    Movement_Val: item.Movement_Val || '',
    User_Plant_Val: item.User_Plant_Val || ''
  });

  const newData = newRecord.map(formatRecord);
  const errData = errRecord.map(formatErrorRecord);

  // --- New Records Sheet ---
  const wsNew = XLSX.utils.json_to_sheet(newData.length ? newData : [{}], { header: commonHeaders });
  styleHeaders(wsNew, commonHeaders);
  XLSX.utils.book_append_sheet(wb, wsNew, 'New Records');

  // --- Error Records Sheet ---
  const wsErr = XLSX.utils.json_to_sheet(errData.length ? errData : [{}], { header: errorHeaders });
  styleHeaders(wsErr, errorHeaders);
  styleValidationColumns(wsErr, errorHeaders, errData.length);
  XLSX.utils.book_append_sheet(wb, wsErr, 'Error Records');

  // Save Excel file
  XLSX.writeFile(wb, 'Trn311Movt Data UploadLog.xlsx');
};

const styleHeaders = (ws, headers) => {
  headers.forEach((_, colIdx) => {
    const cell = ws[XLSX.utils.encode_cell({ c: colIdx, r: 0 })];
    if (cell) {
      cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'FFFF99' } }, // Yellow
        alignment: { horizontal: 'center' }
      };
    }
  });
};

const styleValidationColumns = (ws, headers, rowCount) => {
  const validationCols = [
    'Plant_Val', 'Material_Val', 'SLoc_Val', 'CostCenter_Val',
    'Plant_SLoc_Val', 'Reason_Val', 'User_Plant_Val'
  ];

  for (let r = 1; r <= rowCount; r++) {
    validationCols.forEach(col => {
      const c = headers.indexOf(col);
      if (c === -1) return;
      const cell = ws[XLSX.utils.encode_cell({ c, r })];
      if (cell && typeof cell.v === 'string') {
        const val = cell.v.trim().toLowerCase();
        cell.s = {
          font: {
            color: { rgb: val === 'valid' ? '2E7D32' : 'FF0000' } // green/red
          }
        };
      }
    });
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
      get_Movement(),
    ]);
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
      const fileName = "Trn_311_Movement_List";

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



  const handleConditionalRowClick = async (params) => {
    console.log('selected row', params.row);
    const rawStatus = params.row?.Approval_Status;
    if (!rawStatus) return;
    const status = rawStatus.toUpperCase();

    if (status === "UNDER QUERY") {
      await loadDropdownData();

      setPlantCode(params.row.Plant_Code);
      setDocID(params.row.Doc_ID);
      setTrnSapID(params.row.Trn_Sap_ID);
      setMatCode(params.row.Material_Code);
      setQty(params.row.Qty);
      setRejection_Qty(params.row.Rejection_Qty);  // Assuming Qty is Rejection_Qty
      setProvision_Qty(params.row.Provision_Qty || 0);
      setDifference_Qty(params.row.Difference_Qty || 0);
      setDifference_Value(params.row.Difference_Value || 0);
      setRejection_Value(params.row.Rejection_Value || 0);
      setProvision_Value(params.row.Provision_Value || 0);
      setRate_PerPart(params.row.Rate_PerPart || 0);
      setPrice(params.row.Rate_PerPart); // Might be same as Rate_PerPart, keep if needed
      setSLocID(params.row.SLoc_Code);
      setMovtID(params.row.Movement_Code);
      setReasonForMovement(String(params.row.Reason_For_Movt));


      setSelectedRow(params.row);
      setOpenRowEditModal(true);
    }
  };


  useEffect(() => {
  }, [MaterialTable]);

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


  //✅ DataGrid Columns with Edit Buttons
const columns = [
  { field: "Plant_Code", headerName: "Plant Code", width: 170 },
  { field: "Doc_ID", headerName: "Doc ID", width: 140 },
  { field: "Date", headerName: "Date", width: 130 },
  { field: "Movement_Code", headerName: "Movement Type", width: 200 },
  { field: "Material_Code", headerName: "Material Code", width: 180 },
  { field: "SLoc_Code", headerName: "From SLoc", width: 160 },
  { field: "To_SLoc_Code", headerName: "To SLoc", width: 160 },
  { field: "Qty", headerName: "Quantity", width: 150 },
  { field: "Valuation_Type", headerName: "Valuation Type", width: 150 },
  { field: "Approval_Status", headerName: "Approval Status", width: 185 },

  {
    field: "actions",
    headerName: "Actions",
    width: 200, // Make room for icon + checkbox
    sortable: false,
    editable: false,
    disableColumnMenu: true,
    renderHeader: () => {
      const selectableRows = rows.filter((row) => {
        const status = row.Approval_Status?.toLowerCase().trim();
        return status === "under query";
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
          <span
            style={{
              fontWeight: 600,
              fontSize: 16,
              color: "#333",
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
    renderCell: (params) => {
      const row = params.row;
      const status = row.Approval_Status?.toLowerCase().trim();
      const isSelectable = status === "under query";

      const isChecked = selectedRowIds.includes(row.Trn_Sap_ID);

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
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50px",
              }}
            >
              <InfoIcon sx={{ fontSize: 28 }} />
            </Box>
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
  },
];

  const handleOpenModal = () => {
    setOpenExcelDownloadModal(true);
    setFromDate(''); // Reset From Date
    setToDate(''); // Reset To Date
  };

// from & to downloadd
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


  const handleOpenViewStatusModal = async (rowData) => {
    const docId = rowData?.Doc_ID;
    setSelectedRow(rowData); // sets selected row for conditional UI logic
    setOpenViewStatusModal(true); // opens the modal
    console.log("Selected Doc ID:", docId);

    try {
      const response = await get311ApprovalView(docId);
      console.log("Approval View Response:", response); // fetches status history
      setViewStatusData(response);

    } catch (error) {
      console.error("Error fetching approval status:", error);
      setViewStatusData([]); // fallback to empty state
    }
  };

useEffect(() => {
  if (selectedRow) {
    setSLocID(String(selectedRow.SLoc_Code));  // ✅ ensure it's a string
  }
}, [selectedRow]);

  //edit modal funcation
const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const handleUpdate = async () => {
  setIsUpdating(true);
  try {
    const data = {
  ModifiedBy: UserID,
  DocID: String(DocID),
  TrnSapID,
  MatCode,
  Qty: isNaN(Number(Rejection_Qty)) ? null : Number(Rejection_Qty),
  Price: isNaN(Number(Rate_PerPart)) ? null : Number(Rate_PerPart),
  ProvisionQty: isNaN(Number(Provision_Qty)) ? null : Number(Provision_Qty),
  ProvisionValue: isNaN(Number(Provision_Value)) ? null : Number(Provision_Value),
  SLocCode: String(SLocID),
  ReasonForMovement
};


    console.log("🚀 Sending Edit311 payload:", data);

    const response = await Edit311Record(data);

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


  React.useEffect(() => {
    if (selectedRow) {
      setPlantCode(selectedRow.Plant_Code);
      setDocID(selectedRow.Doc_ID);
      setTrnSapID(selectedRow.Trn_Sap_ID);
      setMatCode(selectedRow.Material_Code);
      setQty(selectedRow.Qty);
      setSLocID(selectedRow.SLoc_Code);
      setPrice(selectedRow.Rate_PerPart);
      setProvision_Qty(selectedRow.Provision_Qty);      // ✅
      setProvision_Value(selectedRow.Provision_Value);  // ✅
      setReasonForMovement(selectedRow.Reason_For_Movt); // ✅
    }
  }, [selectedRow]);


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
            textDecorationThickness: '3px',
            textUnderlineOffset: "6px",
          }}
        >
          311 Movement Transaction
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

        {/* Resubmit, Upload, and Download Buttons */}


        <div style={{ display: "flex", gap: "10px" }}>
          {/* ✅ Resubmit Button (Only if status is Under Query) */}
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
          width: "100%",       // Use full container width
          maxWidth: "17200px",  // Prevent overflow on large screens
          margin: "0 auto",    // Center horizontally
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "600px",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          getRowId={(row) => row.Trn_Sap_ID}
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
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd",
              color: "black",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "16px",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            },
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "inherit",
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
              href={`${api}/transaction/Template/Trn311Movt.xlsx`}
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

      {/* 🟨 View Status Modal */}
      <Modal open={openViewStatusModal} onClose={() => setOpenViewStatusModal(false)}>
        <Box
          sx={{
            position: 'relative',
            p: 4,
            width: { xs: '90%', sm: 900 },
            mx: 'auto',
            mt: '5%',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* ❌ Top-right close (X) button */}
          <IconButton
            onClick={() => setOpenViewStatusModal(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: '#f44336', // Red icon
              '&:hover': {
                backgroundColor: '#ffcdd2', // Light red background on hover
                color: '#b71c1c', // Slightly darker red icon on hover (optional)
              },
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
          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#bdbdbd' }}>
                <TableCell sx={{ border: '1px solid #555555' }}>Role</TableCell>
                <TableCell sx={{ border: '1px solid #555555' }}>Date</TableCell>
                <TableCell sx={{ border: '1px solid #555555' }}>Name</TableCell>
                <TableCell sx={{ border: '1px solid #555555' }}>Comment</TableCell>
                <TableCell sx={{ border: '1px solid #555555' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                'Requester',
                'Level 1 - Plant Finance Head',
                'Level 2 - Plant MRPC',
                'Level 3 - Plant Head',
                'Level 4 - Corp Finance Head',
                'Level 5 - Business Head',
                'Level 6 - Corp MRPC',
              ]
                .map((displayRole, idx) => {
                  // Map frontend display role to backend role string

                  const roleMap = {
                    'Requester': 'Requester',
                    'Level 1 - Plant Finance Head': 'Plant Finance Head',
                    'Level 2 - Plant MRPC': 'Plant MRPC',
                    'Level 3 - Plant Head': 'Plant Head',
                    'Level 4 - Corp Finance Head': 'Corp Finance Head',
                    'Level 5 - Business Head': 'Business Head',
                    'Level 6 - Corp MRPC': 'Corp MRPC',
                  };

                  const backendRole = roleMap[displayRole];

                  // Find matching row from backend data, case insensitive match
                  const row = viewStatusData.find(
                    r => r.Role?.toLowerCase() === backendRole.toLowerCase()
                  ) || {};

                  return (
                    <TableRow key={idx} sx={{ border: '1px solid #555555' }}>
                      <TableCell sx={{ border: '1px solid #555555' }}>{displayRole}</TableCell>
                      <TableCell sx={{ border: '1px solid #555555' }}>{row.Action_Date || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #555555' }}>{row.Action_By || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #555555' }}>{row.Approver_Comment || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #555555' }}>{row.Status || '—'}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>

          {/* Close Button at Bottom */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              onClick={() => setOpenViewStatusModal(false)}
              variant="contained"
              sx={{ textTransform: 'none' }}
            >
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


      {/* Row edit modal */}
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
            Edit 311 Record
          </h3>

          {/* Read-only fields */}
          <TextField label="Plant Code" value={PlantCode} fullWidth InputProps={{ readOnly: true }} {...compactFieldProps} />
          <TextField label="Doc ID" value={DocID} fullWidth InputProps={{ readOnly: true }} {...compactFieldProps} />
          <TextField label="Trn ID" value={TrnSapID} fullWidth InputProps={{ readOnly: true }} {...compactFieldProps} />
          <TextField label="Movement Code" value={MovtID} fullWidth InputProps={{ readOnly: true }} {...compactFieldProps} />

          {/* Editable fields below */}

          {/* Material Code (optional editable, but keeping it if needed) */}
          <FormControl fullWidth size="small">
            <InputLabel id="mat-label">Material Code</InputLabel>
            <Select
              labelId="mat-label"
              label="Material Code"
              value={MatCode}
              onChange={e => setMatCode(e.target.value)}
            >
              {MaterialTable.map(item => (
                <MenuItem key={item.Material_ID} value={item.Material_Code}>
                  {item.Material_Code} - {item.Description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Storage Location - Editable */}
          <FormControl fullWidth size="small">
            <InputLabel id="sloc-label">SLoc Code</InputLabel>
            <Select
              labelId="sloc-label"
              label="SLoc Code"
              value={SLocID}
              onChange={e => setSLocID(e.target.value)}
            >
              {SLocTable.map(item => (
                <MenuItem key={item.SLoc_ID} value={item.Storage_Code}>
                  {item.Storage_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Editable Text Fields */}
          <TextField
            label="Rejection Qty"
            type="number"
            value={Rejection_Qty}
            onChange={e => setRejection_Qty(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          <TextField
            label="Provision Qty"
            type="number"
            value={Provision_Qty}
            onChange={e => setProvision_Qty(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          <TextField
            label="Provision Value"
            type="number"
            value={Provision_Value}
            onChange={e => setProvision_Value(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          <TextField
            label="Rate"
            type="number"
            value={Rate_PerPart}
            onChange={e => setRate_PerPart(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          {/* Reason For Movement */}
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
                  {item.Movement_List_Code} - {item.Movement_List_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

export default Location