import React, { useState, useEffect } from "react";
import { TextField,Button,Modal,Box,IconButton,Typography,} from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from '@mui/material/colors';

import {
  Table,TableHead,TableRow,TableCell,TableBody, InputLabel,
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
  Movement201, getresubmit,  getTransactionData, getdetails, getPlants,getMaterial, getSLoc,
  getMovement, getReasonForMovement, getCostCenter, getValuationType, get201ApprovalView, Edit201Record,
} from "../controller/Movement201apiservice";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { api } from "../controller/constants";


const Stock201 = () => {

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
  const [Date, setDate] = useState("");
  const [items, setItems] = useState([]);
  //click resubmit
  const [openChickResubmitModal, setOpenCheckResubmitModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState({}); // Store selected checkboxes by row ID
  // Store header checkbox state
  const [checked, setChecked] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [headerChecked, setHeaderChecked] = useState(false);





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
//download the new error duplicate for the upload data
  const downloadExcel = (newRecord, DuplicateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();

    // Column headers for Error Records
    const ErrorColumns = [
      'Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'ReasonForMovt',
      'Plant_Val', 'Material_Val', 'SLoc_Val', 'CostCenter_Val',
      'Plant_SLoc_Val', 'Plant_CostCenter_Val', 'Reason_Val',
      'Valuation_Val', 'User_Plant_Val'
    ];

    // Column headers for New Records
    const newRecordsColumns = [
      'Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'ReasonForMovt'
    ];

    // Column headers for Duplicate Records
    const DuplicateColumns = [
      'Plant_Code', 'Material_Code', 'Quantity', 'SLoc_Code', 'CostCenter_Code',
      'Movement_Code', 'Valuation_Type', 'Batch', 'Rate_Unit', 'ReasonForMovt'
    ];

    // Map Error Records
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
      ReasonForMovt: item.Reason_For_Movt || '',
      Plant_Val: item.Plant_Val,
      Material_Val: item.Material_Val,
      SLoc_Val: item.SLoc_Val,
      CostCenter_Val: item.CostCenter_Val,
      Plant_SLoc_Val: item.Plant_SLoc_Val,
      Plant_CostCenter_Val: item.Plant_CostCenter_Val,
      Reason_Val: item.Reason_Val,
      Valuation_Val: item.Valuation_Val,
      User_Plant_Val: item.User_Plant_Val
    }));

    // Map New Records
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
      ReasonForMovt: item.Reason_For_Movt || ''
    }));

    // Map Duplicate Records
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
      ReasonForMovt: item.Reason_For_Movt || ''
    }));

    // 🔹 Style header cells
    const styleHeaders = (worksheet, columns) => {
      columns.forEach((_, index) => {
        const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: '000000' } },
            fill: { fgColor: { rgb: 'FFFF00' } },
            alignment: { horizontal: 'center' }
          };
        }
      });
    };

    // ✅ Green or ❌ Red for Valid/Invalid fields
    const styleValidationColumns = (worksheet, columns, dataLength) => {
      const validationCols = [
        'Plant_Val', 'Material_Val', 'SLoc_Val', 'CostCenter_Val',
        'Plant_SLoc_Val', 'Plant_CostCenter_Val', 'Reason_Val',
        'Valuation_Val', 'User_Plant_Val'
      ];

      for (let row = 1; row <= dataLength; row++) {
        validationCols.forEach(colName => {
          const colIdx = columns.indexOf(colName);
          if (colIdx === -1) return;

          const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
          const cell = worksheet[cellAddress];

          if (cell && typeof cell.v === 'string') {
            const value = cell.v.trim().toLowerCase();
            cell.s = {
              font: {
                color: { rgb: value === 'valid' ? '2e7d32' : 'FF0000' } // green or red
              }
            };
          }
        });
      }
    };

    // 🔁 Style duplicate columns with red background and gray text
    const styleDuplicateRecords = (worksheet, columns, dataLength) => {
      const duplicateCols = ['Plant_Code', 'Material_Code', 'Quantity', 'Movement_Code']; // updated

      for (let row = 1; row <= dataLength; row++) {
        duplicateCols.forEach(colName => {
          const colIdx = columns.indexOf(colName);
          if (colIdx === -1) return;

          const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
          const cell = worksheet[cellAddress];

          if (cell) {
            cell.s = {
              font: { color: { rgb: '808080' } }, // gray text
              fill: { fgColor: { rgb: 'FFE0E0' } } // light red background
            };
          }
        });
      }
    };


    // Sheet: New Records
    if (filteredNewData.length === 0) filteredNewData.push({});
    const wsNew = XLSX.utils.json_to_sheet(filteredNewData, { header: newRecordsColumns });
    styleHeaders(wsNew, newRecordsColumns);
    XLSX.utils.book_append_sheet(wb, wsNew, 'New Records');

    // Sheet: Error Records
    if (filteredError.length === 0) filteredError.push({});
    const wsError = XLSX.utils.json_to_sheet(filteredError, { header: ErrorColumns });
    styleHeaders(wsError, ErrorColumns);
    styleValidationColumns(wsError, ErrorColumns, filteredError.length);
    XLSX.utils.book_append_sheet(wb, wsError, 'Error Records');

    // Sheet: Duplicate Records
    if (filteredUpdate.length === 0) filteredUpdate.push({});
    const wsDup = XLSX.utils.json_to_sheet(filteredUpdate, { header: DuplicateColumns });
    styleHeaders(wsDup, DuplicateColumns);
    styleDuplicateRecords(wsDup, DuplicateColumns, filteredUpdate.length);
    XLSX.utils.book_append_sheet(wb, wsDup, 'Duplicate Records');

    // Save File
    const fileName = 'Trn201Movt Data UploadLog.xlsx';
    XLSX.writeFile(wb, fileName);
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
    if (status === "UNDER QUERY") {
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
      setReasonForMovement(params.row.Reason_For_Movt);
      setBatch(params.row.Batch);
      setSelectedRow(params.row);
      setOpenRowEditModal(true);
      setReasonForMovement(String(params.row.Reason_For_Movt));
      setCostCenterID(String(params.row.CostCenter_ID));
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
          //return status === "rejected" || status === "under query";
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
        // const isSelectable = status === "rejected" || status === "under query";
        const isSelectable = status === "under query";

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
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
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

    }
  ];

  const handleOpenModal = () => {
    setOpenExcelDownloadModal(true);
    setFromDate(''); // Reset From Date
    setToDate(''); // Reset To Date
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
      const response = await get201ApprovalView(docId);
      console.log("Approval View Response:", response); // fetches status history
      setViewStatusData(response);

    } catch (error) {
      console.error("Error fetching approval status:", error);
      setViewStatusData([]); // fallback to empty state
    }
  };


  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      console.log("Payload types:", {
        SLocCode: typeof SLocID,
        CostCenterCode: typeof CostCenterID
      });

      const data = {
        ModifiedBy: UserID,
        DocID: String(DocID),
        MatCode,
        Qty,
        SLocCode: (SLocID),
        CostCenterCode: String(CostCenterCode),
        Price,
        ValuationType,
        ReasonForMovement,
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
  React.useEffect(() => {
    if (selectedRow) {
      setPlantCode(selectedRow.Plant_Code);
      setDocID(selectedRow.Doc_ID);
      setTrnSapID(selectedRow.Trn_Sap_ID);
      setMatCode(selectedRow.Material_Code);
      setQty(selectedRow.Qty);
      setSLocID(selectedRow.SLoc_Code);
      setCostCenterCode(selectedRow.CostCenter_Code);  // <-- set cost center code here
      setPrice(selectedRow.Rate_PerPart);
      setReasonForMovement(selectedRow.Reason_For_Movt);
      setValuationType(selectedRow.Valuation_Type);
      setBatch(selectedRow.Batch);
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
            textDecorationThickness: '3px',
            textUnderlineOffset: "6px",
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
                'Level 5 - Corp MRPC',
              ].map((displayRole, idx) => {
                // Map frontend display role to backend role string
                const roleMap = {
                  'Requester': 'Requester',
                  'Level 1 - Plant Finance Head': 'Plant Finance Head',
                  'Level 2 - Plant MRPC': 'Plant MRPC',
                  'Level 3 - Plant Head': 'Plant Head',
                  'Level 4 - Corp Finance Head': 'Corp Finance Head',
                  'Level 5 - Corp MRPC': 'Corp MRPC',
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
            value={MovtID}  // Assuming MovtID holds display string
            fullWidth
            InputProps={{ readOnly: true }}
            {...compactFieldProps}
          />

          {/* Material Code */}
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

          {/* Quantity */}
          <TextField
            label="Quantity"
            type="number"
            value={Qty}
            onChange={e => setQty(Number(e.target.value))}
            fullWidth
            {...compactFieldProps}
          />

          {/* Storage Location */}
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

          {/* Cost Center */}
          <FormControl fullWidth size="small">
            <InputLabel id="costcenter-label">Cost Center</InputLabel>
            <Select
              labelId="costcenter-label"
              label="Cost Center"
              value={CostCenterCode || ""}
              onChange={(e) => setCostCenterCode(e.target.value)} // Note: Don't use Number()
            >
              {CostCenterTable.map(item => (
                <MenuItem key={item.CostCenter_ID} value={item.CostCenter_Code}>
                  {item.CostCenter_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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
          <FormControl fullWidth size="small">
            <InputLabel id="valuation-label">Valuation Type</InputLabel>
            <Select
              labelId="valuation-label"
              label="Valuation Type"
              value={ValuationType}
              onChange={e => setValuationType(e.target.value)}
            >
              {ValuationTypeTable.map(item => (
                <MenuItem key={item.Valuation_ID} value={item.Valuation_Name}>
                  {item.Valuation_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

          {/* Batch */}
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