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
  Typography,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

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

import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplayIcon from '@mui/icons-material/Replay';
import {Tooltip } from '@mui/material';
import {
  getdetailsPurchase,
  getVendor,
  getAdd,
  updateInwardInvoicePurchase,
  getMaterial,
  getPurchaseData,Resubmit
} from "../controller/Inwardtransactionapiservice";
import { decryptSessionData } from "../controller/StorageUtils";
import { PiUploadDuotone } from "react-icons/pi";
const Purchase = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
const [selectedRow, setSelectedRow] = useState(null);

 // const UserID = localStorage.getItem("UserID");
  const [openResubmitModal, setOpenResubmitModal] = useState(false);
    const [comment, setComment] = useState('');
  const [VendorCode, setVendorCode] = useState("");
 const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);
 const [fromDate, setFromDate] = useState('');
   const [toDate, setToDate] = useState('');
  const [PartNo, setPartNo] = useState("");
  const [InwardID, setInwardID] = useState("");
const [selectedInwardId, setSelectedInwardId] = useState(null);
  const [VendorID, setVendorID] = useState("");
  const [InvoiceDate, setInvoiceDate] = useState("");
  const [InvoiceNo, setInvoiceNo] = useState("");
  const [InvoiceQty, setInvoiceQty] = useState("");
  const [InvoiceValue, setInvoiceValue] = useState("");
  const [PurchaseOrder, setPurchaseOrder] = useState("");

  const [MonthlyScheduledQty, setMonthlyScheduledQty] = useState("");
  const [CurrentStock, setCurrentStock] = useState("");
  const [ReasonForDelay, setReasonForDelay] = useState("");

  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);

 
  
  const [MaterialCode, setMaterialCode] = useState("");
  
  const [MaterialID, setMaterialID] = useState("");
 
  const [VendorTable, setVendorTable] = useState([]);
  const [MaterialTable, setMaterialTable] = useState([]);
  const [UserID, setUserID] = useState("");
   const [Plant_ID, setPlantID] = useState("");
 
 const columns = [
  { field: "Vendor_Code", headerName: "Vendor Code", flex: 1 },
    { field: "Vendor_Name", headerName: "Vendor Name", flex: 1 },
    { field: "Invoice_Date", headerName: "Invoice Date", flex: 1 },
    { field: "Invoice_No", headerName: "Invoice No", flex: 1 },
    { field: "Invoice_Qty", headerName: "Quantity", flex: 1 },
    { field: "Invoice_Value", headerName: "Invoice Value", flex: 1 },
    { field: "Purchase_Order", headerName: "Purchase Order", flex: 1.2 },
    { field: "Material_Code", headerName: "Part No", flex: 1 },
    {
      field: "Monthly_Scheduled_Qty",
      headerName: "Monthly Scheduled Qty",
      flex: 1.8,
    },
    { field: "Current_Stock", headerName: "Current Stock", flex: 1 },
    { field: "Reason_For_Delay", headerName: "Reason For Delay", flex: 1.3 },
  { field: "Status", headerName: "Status",  flex: 1, },
{
  field: "Action",
  headerName: "Actions",
  width: 120,
  sortable: false,
  filterable: false,
  renderCell: (params) => {
    const status = params.row.Status?.toLowerCase();

    return (
      <div style={{ display: "flex", gap: "8px" }}>
        {/* View Button */}
        <Tooltip title="View">
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleOpenViewModal(params.row)}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>

        {/* Conditionally Render Resubmit Button */}
        {status?.includes("rejected") && (
          <Tooltip title="Resubmit">
            <IconButton
              color="secondary"
              size="small"
              onClick={() => handleOpenResubmitModal(params.row.Inward_ID)}
            >
              <PiUploadDuotone />
            </IconButton>
          </Tooltip>
        )}
      </div>
    );
  },
}
];
 // Set UserID and PlantID once on mount
useEffect(() => {
  const encryptedData = sessionStorage.getItem("userData");
  if (encryptedData) {
    const decryptedData = decryptSessionData(encryptedData);
    setUserID(decryptedData.UserID);
    setPlantID(decryptedData.PlantID);
    console.log("Service Plantid", decryptedData.PlantID);
    console.log("Service userid", decryptedData.UserID);
  }
}, []);

// Fetch data only after UserID is available
useEffect(() => {
  if (UserID) {
    getData();
  }
}, [UserID]);

  const getData = async () => {
    try {
      const response = await getdetailsPurchase(UserID);
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

  const get_Material = async () => {
    try {
      const response = await getMaterial();
      setMaterialTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const get_Vendor = async () => {
    try {
      const response = await getVendor();
      setVendorTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
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

  
  

  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setVendorCode("");
    setPurchaseOrder("");
    setInvoiceNo("");
    setMaterialCode("");
    setInvoiceQty("");
    setMonthlyScheduledQty("");
    setCurrentStock("");
    setInvoiceDate("");
    setInvoiceValue("");
    setReasonForDelay("");
    setOpenAddModal(true);
    get_Material();
    get_Vendor();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);
  const handleOpenResubmitModal = (inwardId) => {
  setSelectedInwardId(inwardId); // Store Inward ID
  setOpenResubmitModal(true);
};
    const handleCloseResubmitModal=()=>setOpenResubmitModal(false);
 const  handleOpenExcelModal=()=>{
  setOpenExcelDownloadModal(true);
  setFromDate("");
  setToDate("");
 }
const handleCloseExcelModal=()=>setOpenExcelDownloadModal(false);
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
    const response = await getPurchaseData(fromDate, toDate, UserID);

    if (response.status === 400) {
      alert(`Error: ${response.data.message || 'Invalid input or date range.'}`);
      return;
    }

    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    const fileName = "Purchase Invoice";

    const jsonData = response.data;
    if (!jsonData || jsonData.length === 0) {
      alert("No data to export.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(jsonData);

    // Set column widths (adjust as needed based on your columns)
    const headers = Object.keys(jsonData[0]);
    ws["!cols"] = headers.map((header) => {
      // Example: longer columns get more width
      if (header.toLowerCase().includes("date")) return { wch: 15 };
      if (header.toLowerCase().includes("invoice")) return { wch: 25 };
      if (header.toLowerCase().includes("amount")) return { wch: 15 };
      return { wch: 20 }; // default width
    });

    // Apply header styling
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

    // Workbook setup
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // Create download link
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
    handleCloseExcelModal();
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


    const handleOpenViewModal = (row) => {
  setSelectedRow(row);
  setViewModalOpen(true);
};

const handleCloseViewModal = () => {
  setSelectedRow(null);
  setViewModalOpen(false);
};

  // ✅ Handle Row Click for Edit
const handleRowClick = (params) => {
  // Check status before allowing edit
  const status = params.row.Status;
  if (status !== "New" && status !== "Rejected") {
    alert("Only 'New' or 'Rejected' status can be edited.");
    return;
  }
console.log("params purchase",params.row)
  get_Material();
  get_Vendor();

  const rawDate = params.row.Invoice_Date;
  let formattedDate = rawDate;

  if (rawDate && rawDate.includes('-')) {
    const [day, month, year] = rawDate.split('-');
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      formattedDate = `${year}-${month}-${day}`;
    }
  }

  setInwardID(params.row.Inward_ID);
 setVendorCode(params.row.Vendor_ID);
  //setVendorID(params.row.Vendor_ID)
  setInvoiceDate(formattedDate);
  setMaterialCode(params.row.Material_ID)
  setInvoiceNo(params.row.Invoice_No);
  setInvoiceQty(params.row.Invoice_Qty);
  setInvoiceValue(params.row.Invoice_Value);
  setPurchaseOrder(params.row.Purchase_Order);
 // setMaterialID(params.row.Material_ID);
  setMonthlyScheduledQty(params.row.Monthly_Scheduled_Qty);
  setCurrentStock(params.row.Current_Stock);
  setReasonForDelay(params.row.Reason_For_Delay);
console.log("Selected Row:", params.row);

  setOpenEditModal(true); // ✅ Will trigger only for New/Rejected
};

const handleResubmit = async (InwardID) => {
  try {
   const data = {
        Inward_ID: InwardID,
        Comment: comment,
        Modified_By: UserID,
      };
    const response = await Resubmit(data);
 if (response.data.success) {
    alert("Resubmission successful");
    handleCloseResubmitModal()
    getData()// Optionally reload data
 }
  } catch (error) {
    console.error("Resubmission error:", error);
    alert("Failed to resubmit. Please try again.");
  }
};

   const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        [
          "Vendor_Code",
          "Vendor_Name",
         "Invoice_No",
         "Invoice_Qty",
          "Invoice_Date",
          "Material_Code",
          "Invoice_Value",
          "Purchase_Order",
          "Monthly_Scheduled_Qty",
          "Current_Stock",
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

  // ✅ Handle Add Material
  const handleAdd = async () => {
    console.log("Add button clicked");
    const requiredFields = [
      VendorCode,
      InvoiceDate,
      InvoiceNo,
      InvoiceQty,
      InvoiceValue,
      PurchaseOrder,
      MaterialCode,
      MonthlyScheduledQty,
      CurrentStock,
      ReasonForDelay,
    ];

    if (requiredFields.some((val) => val === "" || val === null)) {
      alert("Please fill in all required fields");
      return;
    }

    const data = {
      Vendor_ID: VendorCode,
      Plant_ID:Plant_ID,
      Invoice_Date: InvoiceDate,
      Invoice_No: InvoiceNo,
      Invoice_Qty: InvoiceQty,
      Invoice_Value: InvoiceValue,
      Purchase_Order: PurchaseOrder,
      Material_ID: MaterialCode,
      Monthly_Scheduled_Qty: MonthlyScheduledQty,
      Current_Stock: CurrentStock,
      Reason_For_Delay: ReasonForDelay,

      UserID: UserID,
    };

    console.log("Data being sent to the server:", data);

    try {
      const response = await getAdd(data); // ⬅️ Ensure this hits `/Get_Add` correctly

      if (response.data.success) {
        alert("Purchase Invoice added successfully!");
        getData(); // refresh UI
        handleCloseAddModal(); // close modal
      } else {
        alert(response.data.message || "Failed to add invoice.");
      }
    } catch (error) {
      console.error("Error in adding invoice:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the invoice.");
      }
    }
  };
const handleUpdate = async () => {
    try {
      // Format InvoiceDate to 'YYYY-MM-DD'
const getFormattedDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  // If in DD-MM-YYYY format
  if (parts.length === 3 && parts[0].length === 2) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr; // already in correct format
};

const formattedInvoiceDate = getFormattedDate(InvoiceDate);

      const data = {
        Inward_ID: InwardID,
        Vendor_ID: VendorCode,
        Invoice_Date: formattedInvoiceDate,
        Invoice_No: InvoiceNo,
        Invoice_Qty: InvoiceQty,
        Invoice_Value: InvoiceValue,
        Purchase_Order: PurchaseOrder,
        Material_ID: MaterialCode,
        Monthly_Scheduled_Qty: MonthlyScheduledQty,
        Current_Stock: CurrentStock,
        Reason_For_Delay: ReasonForDelay,
        Modified_By: UserID,
      };

      console.log("Update payload:", data);

      const response = await updateInwardInvoicePurchase(data); // Make sure this calls your updated backend API

      if (response.data.success) {
        alert(response.data.message || "Invoice updated successfully!");
        getData(); // Refresh table or grid
        handleCloseEditModal(); // Close the modal
      } else {
        alert(response.data.message || "Failed to update invoice.");
      }
    } catch (error) {
      console.error("Update error:", error);

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("An unexpected error occurred while updating the invoice.");
      }
    }
  };

  // excel download
  const handleDownloadExcel = () => {
  if (data.length === 0) {
    alert("No Data Found");
    return;
  }

  const DataColumns = [
    "Vendor_Code",
    "Vendor_Name",
    "Invoice_No",
    "Invoice_Qty",
    "Invoice_Date",
    "Material_Code",
    "Invoice_Value",
    "Purchase_Order",
    "Monthly_Scheduled_Qty",
    "Current_Stock",
    "Reason_For_Delay",
    "Status",
  ];

  const filteredData = data.map((item) => ({
    Vendor_Code: item.Vendor_Code,
    Vendor_Name: item.Vendor_Name,
    Invoice_No: item.Invoice_No,
    Invoice_Qty: item.Invoice_Qty,
    Invoice_Date: item.Invoice_Date,
    Material_Code: item.Material_Code,
    Invoice_Value: item.Invoice_Value,
    Purchase_Order: item.Purchase_Order,
    Monthly_Scheduled_Qty: item.Monthly_Scheduled_Qty,
    Current_Stock: item.Current_Stock,
    Reason_For_Delay: item.Reason_For_Delay,
    Status: item.Status,
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
  XLSX.utils.book_append_sheet(workbook, worksheet, "Old Inward Invoice  Purchase Data");
  XLSX.writeFile(workbook, "Old Inward Invoice Purchase Data.xlsx");
};


  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        // marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 250px)", // or a specific height if necessary
      }}
    >
      {/* Header Section */}

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
             onClick={handleOpenExcelModal}
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
          getRowId={(row) => row.Inward_ID} // Specify a custom id field
          onRowClick={handleRowClick}
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

      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            width: 500,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "5%",
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
            Add Purchase Inward old Invoice
          </h3>

          {/* Vendor Code */}
          <FormControl fullWidth>
            <InputLabel>Vendor Code</InputLabel>
            <Select
              label="Vendor Code"
              name="Vendor Code"
              value={VendorCode}
              onChange={(e) => {
                setVendorCode(e.target.value);
              }}
              required
            >
              {VendorTable.map((item) => (
                <MenuItem key={item.Vendor_ID} value={item.Vendor_ID}>
                  {item.Vendor_Code}-{item.Vendor_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Purchase Order */}
          <TextField
            label="Purchase Order"
            name="PurchaseOrder"
            value={PurchaseOrder}
            onChange={(e) => setPurchaseOrder(e.target.value)}
            required
          />

          {/* Invoice Date */}
          <TextField
            label="Invoice Date"
            name="InvoiceDate"
            type="date"
            value={InvoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: new Date().toISOString().split("T")[0], // restrict future dates
            }}
            required
          />

          {/* Part No */}
          <FormControl fullWidth>
            <InputLabel>Part No</InputLabel>
            <Select
              label="Material Code"
              name="Material Code"
              value={MaterialCode}
              onChange={(e) => setMaterialCode(e.target.value)}
              required
            >
              {MaterialTable.map((item) => (
                <MenuItem key={item.Material_ID} value={item.Material_ID}>
                  {item.Material_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Invoice No */}
          <TextField
            label="Invoice No"
            name="InvoiceNo"
            value={InvoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            required
          />
         {/* Monthly Scheduled Qty */}
<TextField
  label="Monthly Scheduled Qty"
  type="text"
  value={MonthlyScheduledQty}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setMonthlyScheduledQty(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
   
  }}
  required
/>

{/* Invoice Quantity */}
<TextField
  label="Invoice Qty"
  type="text"
  value={InvoiceQty}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInvoiceQty(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
  
  }}
  required
/>

{/* Current Stock */}
<TextField
  label="Current Stock"
  type="text"
  value={CurrentStock}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCurrentStock(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
   
  }}
  required
/>

{/* Invoice Value */}
<TextField
  label="Invoice Value"
  type="text"
  value={InvoiceValue}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInvoiceValue(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
    
  }}
  required
/>
          {/* Reason For Delay */}
          <TextField
            label="Reason For Delay"
            name="ReasonForDelay"
            value={ReasonForDelay}
            onChange={(e) => setReasonForDelay(e.target.value)}
          />

          {/* Buttons */}
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
              onClick={() => setOpenAddModal(false)}
            >
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleAdd}>
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
            Edit Purchase Inward old Invoice
          </h3>

          {/* Vendor Code */}
          <FormControl fullWidth>
            <InputLabel>Vendor Code</InputLabel>
            <Select
              label="Vendor Code"
              name="Vendor Code"
              value={VendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              required
            >
              {VendorTable.map((item) => (
                <MenuItem key={item.Vendor_ID} value={item.Vendor_ID}>
                  {item.Vendor_Code}-{item.Vendor_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Purchase Order */}
          <TextField
            label="Purchase Order"
            value={PurchaseOrder}
            onChange={(e) => setPurchaseOrder(e.target.value)}
            required
          />

          {/* Invoice Date */}
          <TextField
            label="Invoice Date"
            name="InvoiceDate"
            type="date"
            value={InvoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: new Date().toISOString().split("T")[0], // restrict future dates
            }}
            required
          />


          {/* Part No */}
          <FormControl fullWidth>
            <InputLabel>Part No</InputLabel>
            <Select
              label="Material Code"
              name="Material Code"
              value={MaterialCode}
              onChange={(e) => setMaterialCode(e.target.value)}
              required
            >
              {MaterialTable.map((item) => (
                <MenuItem key={item.Material_ID} value={item.Material_ID}>
                  {item.Material_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Invoice No */}
          <TextField
            label="Invoice No"
            value={InvoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            required
          />

       {/* Monthly Scheduled Qty */}
<TextField
  label="Monthly Scheduled Qty"
  type="text"
  value={MonthlyScheduledQty}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setMonthlyScheduledQty(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
   
  }}
  required
/>

{/* Invoice Quantity */}
<TextField
  label="Invoice Qty"
  type="text"
  value={InvoiceQty}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInvoiceQty(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
  
  }}
  required
/>

{/* Current Stock */}
<TextField
  label="Current Stock"
  type="text"
  value={CurrentStock}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCurrentStock(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
   
  }}
  required
/>

{/* Invoice Value */}
<TextField
  label="Invoice Value"
  type="text"
  value={InvoiceValue}
  onChange={(e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInvoiceValue(value);
    }
  }}
  inputProps={{
    inputMode: 'numeric',
    pattern: '[0-9]*',
    
  }}
  required
/>

          {/* Reason For Delay */}
          <TextField
            label="Reason For Delay"
            value={ReasonForDelay}
            onChange={(e) => setReasonForDelay(e.target.value)}
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
      {/* ExcelDownload From & To Date Modal */}
          <Modal
            open={openExcelDownloadModal}
            onClose={handleCloseExcelModal}  // Use the custom handleCloseModal function
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
               Purchase inward Excel Download
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
                <Button variant="contained" color="error" onClick={handleCloseExcelModal}>
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
          <Modal open={openResubmitModal} onClose={handleCloseResubmitModal}>
           <Box
             style={{
               position: "absolute",
               top: "50%",
               left: "50%",
               transform: "translate(-50%, -50%)",
               width: 400,
               backgroundColor: "white",
               borderRadius: "8px",
               boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
               padding: "24px",
               display: "flex",
               flexDirection: "column",
               gap: "16px",
             }}
           >
             <Typography variant="h6" style={{ fontWeight: "bold" }}>
               Add Comment
             </Typography>
         
             <TextField
               multiline
               rows={4}
               placeholder="Enter your comment here..."
               value={comment}
               onChange={(e) => setComment(e.target.value)}
               fullWidth
             />
         
             {/* Centered Buttons */}
             <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
               <Button
                 onClick={handleCloseResubmitModal}
                 variant="contained"
                 color="error"
                 style={{ textTransform: "none" }}
               >
                 Cancel
               </Button>
               <Button
                 onClick={() => handleResubmit(selectedInwardId)}
                 variant="contained"
                 color="primary"
                 style={{ textTransform: "none" }}
               >
                 Resubmit
               </Button>
             </div>
           </Box>
         </Modal>
 <Modal open={viewModalOpen} onClose={handleCloseViewModal}>
  <Box
    sx={{
      position: 'relative',
      p: 4,
      width: { xs: '90%', sm: 800 },
      mx: 'auto',
      mt: '5%',
      bgcolor: 'background.paper',
      borderRadius: 3,
      boxShadow: 24,
    }}
  >
    {/* ❌ Close Icon */}
    <IconButton
      aria-label="close"
      onClick={handleCloseViewModal}
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

   <Typography
  variant="h6"
  gutterBottom
  sx={{
    textAlign: 'center',
    color: '#1976d2',
    borderBottom: '2px solid limegreen',
    display: 'inline-block',
    mb: 3,
    fontWeight: 'bold', // ✅ Correct way to set bold font
  }}
>
  Inward Approval Status
</Typography>

    {/* 👇 Approval Table */}
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: "#bdbdbd" }}>
          <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Level</th>
          <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Status</th>
          <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Approver</th>
          <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Comment</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>Level 1 - CORP MRPC</td>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedRow?.Approval1_Status || "-"}</td>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedRow?.Approver1_Name || "-"}</td>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedRow?.Approver1_Comment || "-"}</td>
        </tr>
        <tr>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>{`Level 2 - ${selectedRow?.Approver2_RoleName || ""}`}</td>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedRow?.Approval2_Status || "-"}</td>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedRow?.Approver2_Name || "-"}</td>
          <td style={{ padding: "8px", border: "1px solid #ddd" }}>{selectedRow?.Approver2_Comment || "-"}</td>
        </tr>
       
      </tbody>
    </table>

   
  </Box>
</Modal>

 </div>
  );
};

export default Purchase;
