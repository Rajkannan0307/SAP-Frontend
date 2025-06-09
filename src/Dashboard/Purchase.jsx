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

import { MaterialMaster } from "../controller/Masterapiservice";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from "@mui/material/colors";
import { api } from "../controller/constants";
import {
  getdetailsPurchase,
  getVendor,
  getAdd,
  getUpdates,getMaterial
} from "../controller/Inwardtransactionapiservice";

const Purchase = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const UserID = localStorage.getItem("UserID");
  const [VendorCode, setVendorCode] = useState("");

const [PartNo, setPartNo] = useState("");

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
  const [Description, setDescription] = useState("");
  const [Rate, setRate] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
  const [VendorTable, setVendorTable] = useState([]);
   const [MaterialTable, setMaterialTable] = useState([]);
  // const [userID, setUserID] = useState("");
const [selectedRows, setSelectedRows] = useState([]);

  const columns = [
    { field: "Vendor_Code", headerName: "Vendor Code ", flex: 1 },
    { field: "Vendor_Name", headerName: "Vendor Name ", flex: 1 },
    { field: "Invoice_Date", headerName: "Invoice Date", flex: 1 },
    { field: "Invoice_No", headerName: "Invoice No", flex: 1 },
    { field: "Invoice_Qty", headerName: "Invoice Quantity", flex: 1 },

    { field: "Invoice_Value", headerName: "Invoice Value", flex: 1 },
    { field: "Purchase_Order", headerName: "Purchase Order", flex: 1 },
    { field: "Material_Code", headerName: "Part No", flex: 1 },

    {
      field: "Monthly_Scheduled_Qty",
      headerName: "Monthly Scheduled Qty",
      flex: 1,
    },
    { field: "Current_Stock", headerName: "Current Stock", flex: 1 },

    { field: "Reason_For_Delay", headerName: "Reason For Delay", flex: 1 },
    {
  field: "Action",
  headerName: "Send to SAP",
  flex: 1,
  renderCell: (params) => (
    <Checkbox
      checked={selectedRows.includes(params.row)}
      onChange={() => handleCheckboxChange(params.row)}
    />
  )
}

  ];
  const getData = async () => {
    try {
      const response = await getdetailsPurchase();
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
  }, []);


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

  const handleCheckboxChange = (row) => {
  setSelectedRows((prevSelected) => {
    const isSelected = prevSelected.some((item) => item.Inward_ID === row.Inward_ID);
    if (isSelected) {
      return prevSelected.filter((item) => item.Inward_ID !== row.Inward_ID);
    } else {
      return [...prevSelected, row];
    }
  });
};


  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setPlantCode("");
    setMaterialCode("");
    setDescription("");
    setMaterialType("");
    setRate("");
    setActiveStatus(true);
    setOpenAddModal(true);
get_Material();
    get_Vendor();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  // ✅ Handle Upload Modal
  const handleOpenUploadModal = () => setOpenUploadModal(true);
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
    } else {
      try {
        const formData = new FormData();
        console.log("file", uploadedFile);
        formData.append("User_Add", uploadedFile);
        formData.append("UserID", UserID);
        const response = await MaterialMaster(formData);
        console.log("response", response.data);
        alert(response.data.message);
        // console.log('response', response.data)
        if (
          response.data.NewRecord.length > 0 ||
          response.data.UpdatedData.length > 0 ||
          response.data.ErrorRecords.length > 0
        ) {
          downloadExcel(
            response.data.NewRecord,
            response.data.UpdatedData,
            response.data.ErrorRecords
          );
        }
        getData();
      } catch (error) {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.message);
        }
      }
    }
    handleCloseUploadModal();
  };

  const downloadExcel = (newRecord, updateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();

    const newRecordsColumns = [
      "Plant_Code",
      "Material_Type",
      "Material_Code",
      "Description",
      "Rate",
      "ActiveStatus",
      "Status",
    ];
    const UpdatedColumns = [
      "Plant_Code",
      "Material_Type",
      "Material_Code",
      "Description",
      "Rate",
      "ActiveStatus",
      "Status",
    ];
    const ErrorColumns = [
      "Plant_Code",
      "Material_Type",
      "Material_Code",
      "Description",
      "Rate",
      "ActiveStatus",
      "PlantCode_Validation",
      "Material_Type_Validation",
    ];

    const filteredNewData = newRecord.map((item) => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,
      Material_Code: item.Material_Code,
      Description: item.Description,
      Rate: item.Rate,
      ActiveStatus: item.Active_Status,
      Status: item.Status,
    }));

    const filteredUpdate = updateRecord.map((item) => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,
      Material_Code: item.Material_Code,
      Description: item.Description,
      Rate: item.Rate,
      ActiveStatus: item.Active_Status,
      Status: item.Status,
    }));

    const filteredError = errRecord.map((item) => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,
      Material_Code: item.Material_Code,
      Description: item.Description,
      Rate: item.Rate,
      ActiveStatus: item.Active_Status,
      PlantCode_Validation: item.Plant_Val,
      Material_Type_Validation: item.Material_Val,
    }));

    // 🔹 Helper to style header cells
    const styleHeaders = (worksheet, columns) => {
      columns.forEach((_, index) => {
        const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
            alignment: { horizontal: "center" },
          };
        }
      });
    };

    // 🔴 Style red text for validation columns only
    const styleValidationColumns = (worksheet, columns, dataLength) => {
      const validationCols = [
        "PlantCode_Validation",
        "Material_Type_Validation",
      ];

      for (let row = 1; row <= dataLength; row++) {
        validationCols.forEach((colName) => {
          const colIdx = columns.indexOf(colName);
          if (colIdx === -1) return;

          const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
          const cell = worksheet[cellAddress];

          if (cell && typeof cell.v === "string") {
            const value = cell.v.trim().toLowerCase();

            // Apply green if value is "valid", otherwise red
            cell.s = {
              font: {
                color: { rgb: value === "valid" ? "2e7d32" : "FF0000" }, // green or red
              },
            };
          }
        });
      }
    };

    // 📄 New Records Sheet
    if (filteredNewData.length === 0) filteredNewData.push({});
    const wsNewRecords = XLSX.utils.json_to_sheet(filteredNewData, {
      header: newRecordsColumns,
    });
    styleHeaders(wsNewRecords, newRecordsColumns);
    XLSX.utils.book_append_sheet(wb, wsNewRecords, "New Records");

    // 📄 Updated Records Sheet
    if (filteredUpdate.length === 0) filteredUpdate.push({});
    const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, {
      header: UpdatedColumns,
    });
    styleHeaders(wsUpdated, UpdatedColumns);
    XLSX.utils.book_append_sheet(wb, wsUpdated, "Updated Records");

    // 📄 Error Records Sheet
    if (filteredError.length === 0) filteredError.push({});
    const wsError = XLSX.utils.json_to_sheet(filteredError, {
      header: ErrorColumns,
    });
    styleHeaders(wsError, ErrorColumns);
    styleValidationColumns(wsError, ErrorColumns, filteredError.length);
    XLSX.utils.book_append_sheet(wb, wsError, "Error Records");

    // 📦 Export the Excel file
    const fileName = "Material Data Upload Log.xlsx";
    XLSX.writeFile(wb, fileName);
  };

  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setPlantCode(params.row.Plant_Code);
    setMaterialType(params.row.Material_Type);
    setMaterialCode(params.row.Material_Code);
    setDescription(params.row.Description);
    setRate(params.row.Rate);
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
    setMaterialID(params.row.Material_ID);
    // setUserID(params.User_ID);
  };

  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        [
          "Plant_Code",
          "Material_Type",
          "Material_Code",
          "Description",
          "Rate ",
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
  // console.log("Add button clicked");
  // const requiredFields = [
  //   VendorID,
  //   InvoiceDate,
  //   InvoiceNo,
  //   InvoiceQty,
  //   InvoiceValue,
  //   PurchaseOrder,
  //   MaterialID,
  //   MonthlyScheduledQty,
  //   CurrentStock,
  //   ReasonForDelay,
    
  // ];

  // if (requiredFields.some((val) => val === "" || val === null)) {
  //   alert("Please fill in all required fields");
  //   return;
  // }

  const data = {
    Vendor_ID: VendorCode,
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
      alert("Inward Invoice added successfully!");
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
      const data = {
        UserID: UserID,
        Material_ID: MaterialID,
        Description: Description,
        Rate: Rate,
        Active_Status: ActiveStatus,
        // UserID: userID,  // Ensure the UserID is also included
      };

      console.log("Data being sent:", data); // Log data to verify it before sending

      // Call the API
      const response = await getUpdates(data);

      // If success
      if (response.data.success) {
        alert(response.data.message);
        getData(); // Refresh data
        handleCloseEditModal(); // Close modal
      } else {
        // If success is false, show the backend message
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message); // Specific error from backend
      } else {
        alert("An error occurred while updating the Vendor. Please try again.");
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
      "Plant_Code",
      "Material_Type",
      "Material_Code",
      "Description",
      "Rate",
      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,
      Material_Code: item.Material_Code,
      Description: item.Description,
      Rate: item.Rate,
      ActiveStatus: item.Active_Status ? "Active" : "Inactive",
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Materials");
    XLSX.writeFile(workbook, "Material_Data.xlsx");
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
          {/* Upload Button */}
          <IconButton
            onClick={handleOpenUploadModal}
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

          {/* Download Button */}
          <IconButton
            onClick={handleDownloadExcel}
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
      Add Inward
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
      name="MonthlyScheduledQty"
      type="number"
      value={MonthlyScheduledQty}
      onChange={(e) => setMonthlyScheduledQty(e.target.value)}
      required
    />
 {/* Invoice Quantity */}
    <TextField
      label="Invoice Qty"
      name="InvoiceQty"
      type="number"
      value={InvoiceQty}
      onChange={(e) => setInvoiceQty(e.target.value)}
      required
    />
     {/* Current Stock */}
    <TextField
      label="Current Stock"
      name="CurrentStock"
      type="number"
      value={CurrentStock}
      onChange={(e) => setCurrentStock(e.target.value)}
      required
    />

   
     {/* Invoice Value */}
    <TextField
      label="Invoice Value"
      name="InvoiceValue"
      type="number"
      value={InvoiceValue}
      onChange={(e) => setInvoiceValue(e.target.value)}
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
      <Button variant="contained" color="error" onClick={() => setOpenAddModal(false)}>
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
            Edit Material
          </h3>

          <TextField
            label="Plant Code"
            name="Plant_Code"
            value={PlantCode}
            onChange={(e) => setPlantCode(e.target.value)}
            InputProps={{
              readOnly: true, // This makes the TextField read-only
            }}
          />

          <TextField
            label="Material Type"
            name="Material_Type"
            value={MaterialType}
            onChange={(e) => setMaterialType(e.target.value)}
            InputProps={{
              readOnly: true, // This makes the TextField read-only
            }}
          />

          <TextField
            label="Material Code"
            name="Material_Code"
            value={MaterialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            InputProps={{
              readOnly: true, // This makes the TextField read-only
            }}
          />
          <TextField
            label="Description"
            name="Description"
            value={Description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <TextField
            label="Rate"
            type="number"
            name="Rate"
            value={Rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success" // Always use 'success' to keep the thumb green when active
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                    backgroundImage: "none !important", // Disable background image
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // White thumb in both active and inactive states
                    borderColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Match thumb border with track color
                  },
                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"} // Text next to the switch
            labelPlacement="end"
            style={{
              color: ActiveStatus ? "#2e7d32" : "#d32f2f", // Change text color based on status
              fontWeight: "bold",
            }}
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
          <h3
            style={{
              fontSize: "22px",
              textAlign: "center",
              marginBottom: "20px",
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
            }}
          >
            Material Master Excel File Upload
          </h3>

          <Button
            variant="contained"
            style={{
              marginBottom: "10px",
              backgroundColor: deepPurple[500],
              color: "white",
            }}
          >
            <a
              style={{ textDecoration: "none", color: "white" }}
              href={`${api}/Master/Template/MaterialMaster.xlsx`}
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
              style={{
                marginTop: "10px",
                width: "25%",
                color: "white",
                backgroundColor: "blue",
              }}
            >
              Upload
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Purchase;
