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
  getdetailsService,
  getVendor,
  getAddService,
  updateInwardInvoiceService,
  getServiceData
} from "../controller/Inwardtransactionapiservice";
import { decryptSessionData } from "../controller/StorageUtils";
const Service = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);
   const [fromDate, setFromDate] = useState('');
     const [toDate, setToDate] = useState('');
 // const UserID = localStorage.getItem("UserID");
  const [VendorCode, setVendorCode] = useState("");
  const [VendorID, setVendorID] = useState("");
  const [InvoiceDate, setInvoiceDate] = useState("");
  const [InvoiceNo, setInvoiceNo] = useState("");
  const [InvoiceValue, setInvoiceValue] = useState("");
  const [PurchaseOrder, setPurchaseOrder] = useState("");
  const [ReasonForDelay, setReasonForDelay] = useState("");
  const [InwardID, setInwardID] = useState("");
  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);
 const [Plant_ID, setPlantID] = useState("");
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
  const [selectedRows, setSelectedRows] = useState([]);
 const [UserID, setUserID] = useState("");
  // const [userID, setUserID] = useState("");

  const columns = [
    { field: "Vendor_Code", headerName: "Vendor Code ", flex: 1 },
    { field: "Vendor_Name", headerName: "Vendor Name ", flex: 1 },
    { field: "Invoice_No", headerName: "Invoice No", flex: 1 },
    { field: "Invoice_Date", headerName: "Invoice Date", flex: 1 },

    { field: "Invoice_Value", headerName: "Invoice Value", flex: 1 },
    { field: "Purchase_Order", headerName: "Purchase Order", flex: 1 },
    { field: "Reason_For_Delay", headerName: "Reason For Delay", flex: 1 },
    { field: "Status", headerName: "Status", flex: 1 },
    // {
    //   field: "Action",
    //   headerName: "Action",
    //   flex: 1,
    //   renderCell: (params) => (
    //     <Checkbox
    //       checked={selectedRows.includes(params.row)}
    //       onChange={() => handleCheckboxChange(params.row)}
    //     />
    //   ),
    // },
  ];
  const getData = async () => {
    try {
      const response = await getdetailsService(UserID);
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

useEffect(() => {
  console.log("RE-RENDER triggered by UserID", UserID);
  if (UserID) {
    getData(UserID);
  }
}, [UserID]);

 
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
  
  const handleOpenAddModal = (item) => {
    setVendorCode("");
    setPurchaseOrder("");
    setInvoiceNo("");

    setInvoiceDate("");
    setInvoiceValue("");
    setReasonForDelay("");
    setOpenAddModal(true);

    get_Vendor();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);
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
        // Call backend API with fromDate and toDate as query params
        const response = await getServiceData(fromDate, toDate,UserID);
  
        if (response.status === 400) {
          alert(`Error: ${response.data.message || 'Invalid input or date range.'}`);
          return;
        }
  
        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const fileExtension = ".xlsx";
        const fileName = "Purchase Invoice";
  
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
  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
     // Check status before allowing edit
  const status = params.row.Status;
  if (status !== "New" && status !== "Rejected") {
    alert("Only 'New' or 'Rejected' status can be edited.");
    return;
  }
    get_Vendor();

    const rawDate = params.row.Invoice_Date; // e.g., "30-04-2025"
    let formattedDate = rawDate;

    // If date is in DD-MM-YYYY format, convert it
    if (rawDate && rawDate.includes("-")) {
      const [day, month, year] = rawDate.split("-");
      if (day.length === 2 && month.length === 2 && year.length === 4) {
        formattedDate = `${year}-${month}-${day}`; // -> "2025-04-30"
      }
    }

    setInwardID(params.row.Inward_ID);
    setVendorCode(params.row.Vendor_ID);
    setInvoiceDate(formattedDate); // ✅ Correct format for date input
    setInvoiceNo(params.row.Invoice_No);

    setInvoiceValue(params.row.Invoice_Value);
    setPurchaseOrder(params.row.Purchase_Order);

    setReasonForDelay(params.row.Reason_For_Delay);
    setOpenEditModal(true);
  };

  // ✅ Search Functionality
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
          "Invoice_Date",
          "Invoice_Value",
          "Purchase_Order",
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
    console.log("Data being sent to the server:", {
      VendorCode,
      InvoiceDate,
      InvoiceNo,
      InvoiceValue,
      PurchaseOrder,
      ReasonForDelay,
      UserID,
    });

    // // Validation
    if (
      VendorCode === "" ||
      InvoiceDate === "" ||
      InvoiceNo === "" ||
      InvoiceValue === "" ||
      PurchaseOrder === ""
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const data = {
        Vendor_ID: VendorCode,
          Plant_ID:Plant_ID,
        Invoice_Date: InvoiceDate,
        Invoice_No: InvoiceNo,
        Invoice_Value: InvoiceValue,
        Purchase_Order: PurchaseOrder,
        Reason_For_Delay: ReasonForDelay,
        UserID: UserID,
      };

      const response = await getAddService(data); // make sure this calls your /Get_Add API for services

      if (response.data.success) {
        alert("Service invoice added successfully!");
        getData(); // refresh list
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

        Invoice_Value: InvoiceValue,
        Purchase_Order: PurchaseOrder,

        Reason_For_Delay: ReasonForDelay,
        Modified_By: UserID,
      };

      console.log("Update payload:", data);

      const response = await updateInwardInvoiceService(data); // Make sure this calls your updated backend API

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
    
     "Invoice_Date",
     
     "Invoice_Value",
     "Purchase_Order",
    
     
     "Reason_For_Delay",
     "Status",
   ];
 
   const filteredData = data.map((item) => ({
     Vendor_Code: item.Vendor_Code,
     Vendor_Name: item.Vendor_Name,
     Invoice_No: item.Invoice_No,
    
     Invoice_Date: item.Invoice_Date,
  
     Invoice_Value: item.Invoice_Value,
     Purchase_Order: item.Purchase_Order,
    
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
   XLSX.utils.book_append_sheet(workbook, worksheet, "Old Inward Invoice Service Data");
   XLSX.writeFile(workbook, "Old Inward Invoice Service Data.xlsx");
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
          {/* <IconButton
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
          </IconButton> */}

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
            Add Service Inward old Invoice
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

          {/* Invoice No */}
          <TextField
            label="Invoice No"
            name="InvoiceNo"
            value={InvoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
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
           {/* Purchase Order */}
          <TextField
            label="Purchase Order"
            name="PurchaseOrder"
            value={PurchaseOrder}
            onChange={(e) => setPurchaseOrder(e.target.value)}
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
            Edit Service Inward old Invoice
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
          
          {/* Invoice No */}
          <TextField
            label="Invoice No"
            value={InvoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
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
          
         

          <TextField
            label="Purchase Order"
            name="Purchase_Order"
            value={PurchaseOrder}
            onChange={(e) => setPurchaseOrder(e.target.value)}
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
    </div>
  );
};

export default Service;
