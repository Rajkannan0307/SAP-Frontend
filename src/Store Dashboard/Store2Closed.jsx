import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  TextField,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { getdetailsStoreClosed,getdetailsStoreClosedByDate } from "../controller/StoreDashboardapiservice"; // make sure this accepts plantId + storageCode
import { decryptSessionData } from "../controller/StorageUtils";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from 'xlsx-js-style';

const Store2Closed = ({ storageCode }) => {
 const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);

  const [UserID, setUserID] = useState("");
  const [Plant_ID, setPlantID] = useState("");
const [subtotal, setSubtotal] = useState({
  No_Of_Orders: 0,
  No_Of_Open_Orders: 0,
  No_Order_Close: 0,
  Issue_Posted_on_Time: 0,
 Issue_Posted_Delay60: 0,
  Issue_Posted_Delay: 0,
});

  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
 const columns = [
  {
    field: "Sup_Name",
    headerName: "Supervisor Name",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => (
      <div
        style={{
          width: '100%',
          
          fontWeight: params.row.isSubtotal ? 'bold' : 'normal',
        }}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "No_Of_Orders",
    headerName: "No.  Of Total Orders",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => (
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          fontWeight: params.row.isSubtotal ? 'bold' : 'normal',
        }}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "No_Of_Open_Orders",
    headerName: "No. Of Open Orders",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => (
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          fontWeight: params.row.isSubtotal ? 'bold' : 'normal',
        }}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "No_Order_Close",
    headerName: "No. Of Orders Closed",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => (
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          fontWeight: params.row.isSubtotal ? 'bold' : 'normal',
        }}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "Issue_Posted_on_Time",
    headerName: "Material Issued On Time",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#d0f0c0' ,
          display: 'flex',
         justifyContent: 'center',
          fontWeight: params.row.isSubtotal ? 'bold' : 'normal',
        }}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "Issue_Posted_Delay60",
    headerName: "Material Issued Delay 60 Minutes",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor:'#fff9c4' ,
          display: 'flex',
         justifyContent: 'center',
          fontWeight: params.row.isSubtotal ? 'bold' : 'normal',
        }}
      >
        {params.value}
      </div>
    ),
  },
  {
    field: "Issue_Posted_Delay",
    headerName: "Material Issued Delayed ",
    flex: 1,
    headerAlign: "center",
    renderCell: (params) => (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor:'#ffcdd2' ,
          display: 'flex',
          
          justifyContent: 'center',
          fontWeight: params.row.isSubtotal ? 'bold' : 'normal',
        }}
      >
        {params.value}
      </div>
    ),
  },
];

const displayRows = [
  ...(isFiltered ? filteredRows : rows).filter(row => row.id !== 'subtotal'),
  {
    id: "subtotal",
    Sup_Name: "SubTotal",
    No_Of_Orders: subtotal.No_Of_Orders,
    No_Of_Open_Orders: subtotal.No_Of_Open_Orders,
    No_Order_Close: subtotal.No_Order_Close,
    Issue_Posted_on_Time: subtotal.Issue_Posted_on_Time,
    Issue_Posted_Delay60: subtotal.Issue_Posted_Delay60,
    Issue_Posted_Delay: subtotal.Issue_Posted_Delay,
    isSubtotal: true
  }
];



const getData = async (plantId, code) => {
    try {
      const response = await getdetailsStoreClosed(plantId, code);
      console.log("closed 1 ordrs",response)
      const processed = response.map((row, index) => ({
        id: row.Prdord_ID || index,
        sno: index + 1,
        ...row,
      }));
      setRows(processed);
      setIsFiltered(false);
      setFilteredRows(response);
calculateSubtotal(response);

    } catch (err) {
      console.error("Error fetching open orders:", err);
    }
  };

 const getDataByDate = async (plantId, code, from, to) => {
  try {
    const response = await getdetailsStoreClosedByDate(plantId, code, from, to);

    const processed = response.map((row, index) => ({
      id: row.Prdord_ID || index,
      sno: index + 1,
      ...row,
    }));
    setFilteredRows(processed);
    setIsFiltered(true);
    calculateSubtotal(processed); // ✅ Add this line
  } catch (err) {
    console.error("Error fetching date-filtered open orders:", err);
  }
};


  const calculateSubtotal = (rowsData) => {
  const total = {
    No_Of_Orders: 0,
    No_Of_Open_Orders: 0,
    No_Order_Close: 0,
    Issue_Posted_on_Time: 0,
    Issue_Posted_Delay60: 0,
    Issue_Posted_Delay: 0,
  };

  rowsData.forEach(row => {
    total.No_Of_Orders += Number(row.No_Of_Orders || 0);
    total.No_Of_Open_Orders += Number(row.No_Of_Open_Orders || 0);
    total.No_Order_Close += Number(row.No_Order_Close || 0);
    total.Issue_Posted_on_Time += Number(row.Issue_Posted_on_Time || 0);
    total.Issue_Posted_Delay60 += Number(row.Issue_Posted_Delay60 || 0);
    total.Issue_Posted_Delay += Number(row.Issue_Posted_Delay || 0);
  });

  setSubtotal(total);
};
const handleExcelDownload = () => {
  const exportData = isFiltered ? filteredRows : rows;

  if (exportData.length === 0) {
    alert("No Data Found");
    return;
  }

  const DataColumns = [
    "Sup_Name",
    "No_Of_Open_Orders",
    "No_Of_Orders",
    "No_Order_Close",
    "Material_Issue_Posted_on_Time",
    "Material_Issue_Posted_Delay60",
    "Material_Issued_Delayed",
  ];

  const formattedData = exportData.map((item) => ({
    Sup_Name: item.Sup_Name,
    No_Of_Open_Orders: item.No_Of_Open_Orders,
    No_Of_Orders: item.No_Of_Orders,
    No_Order_Close: item.No_Order_Close,
    Material_Issue_Posted_on_Time: item.Issue_Posted_on_Time,
    Material_Issue_Posted_Delay60: item.Issue_Posted_Delay60,
    Material_Issued_Delayed: item.Issue_Posted_Delay,
  }));

  // Add subtotal row
  formattedData.push({
    Sup_Name: "SubTotal",
    No_Of_Open_Orders: subtotal.No_Of_Open_Orders,
    No_Of_Orders: subtotal.No_Of_Orders,
    No_Order_Close: subtotal.No_Order_Close,
    Material_Issue_Posted_on_Time: subtotal.Issue_Posted_on_Time,
    Material_Issue_Posted_Delay60: subtotal.Issue_Posted_Delay60,
    Material_Issued_Delayed: subtotal.Issue_Posted_Delay,
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData, {
    header: DataColumns,
  });

  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
  ];

  // Header styling
  DataColumns.forEach((_, colIndex) => {
    const cell = XLSX.utils.encode_cell({ c: colIndex, r: 0 });
    if (worksheet[cell]) {
      worksheet[cell].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFF00" } }, // Yellow
        alignment: { horizontal: "center" },
      };
    }
  });

  const totalRows = formattedData.length;

  // Style regular data rows (1 to totalRows - 1)
  for (let row = 1; row < totalRows; row++) {
    for (let col = 1; col < DataColumns.length; col++) {
      const cell = XLSX.utils.encode_cell({ c: col, r: row });
      if (!worksheet[cell]) continue;

      let fillColor = null;

      if (col === 4) fillColor = "C6EFCE"; // Green for OnTime
      else if (col === 5) fillColor = "FFF9C4"; // Light Yellow for Delay60
      else if (col === 6) fillColor = "F8CBAD"; // Light Red for Delayed

      worksheet[cell].s = {
        alignment: { horizontal: "center" },
        ...(fillColor && { fill: { fgColor: { rgb: fillColor } } }),
      };
    }
  }

  // Style subtotal row (bold + fill colors)
    const subtotalRowIndex = totalRows;
  for (let col = 0; col < DataColumns.length; col++) {
    const cell = XLSX.utils.encode_cell({ c: col, r: subtotalRowIndex });
    if (!worksheet[cell]) continue;

    let fillColor = "DDEBF7"; // Light blue for full subtotal row background
    let textColor = "000000"; // Black text

    if (col === 4) fillColor = "C6EFCE"; // Green for OnTime
    else if (col === 5) fillColor = "FFF9C4"; // Yellow for Delay60
    else if (col === 6) fillColor = "F8CBAD"; // Red for Delayed

    worksheet[cell].s = {
      font: { bold: true, color: { rgb: textColor } },
      alignment: { horizontal: col === 0 ? "left" : "center" },
      fill: { fgColor: { rgb: fillColor } },
      border: {
        top: { style: "medium", color: { rgb: "000000" } }, // Bold top border
      },
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Closed Orders");

  const today = new Date();
  const fileName = `Store1_ClosedOrders_${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};






  useEffect(() => {
  //    const interval = setInterval(() => {
  //   window.location.reload();
  // }, 60000); // 2 minutes in ms

    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decrypted = decryptSessionData(encryptedData);
      if (decrypted) {
        setUserID(decrypted.UserID);
        setPlantID(decrypted.PlantID);
        if (decrypted.PlantID && storageCode) {
          getData(decrypted.PlantID, storageCode);
        }
      }
    }
   // return () => clearInterval(interval);
  }, [storageCode]);

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  return (
    <div style={{
      padding: 20,
      backgroundColor: "#F5F5F5",
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 250px)",
    }}>
      <Box sx={{
        backgroundColor: "#2e59d9",
        color: "white",
        fontWeight: "bold",
        padding: "10px 16px",
        borderRadius: "8px 8px 0 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
       
        <Typography>Store 1 -  Closed Orders</Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontSize: "14px" }}>From</Typography>
          <TextField
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            sx={{
              backgroundColor: "white",
              borderRadius: 1,
              input: { padding: "10px" },
            }}
            inputProps={{
    max: new Date().toISOString().split("T")[0],
  }}
          />
          <Typography variant="h6" sx={{ fontSize: "14px" }}>To</Typography>
          <TextField
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            sx={{
              backgroundColor: "white",
              borderRadius: 1,
              input: { padding: "10px" },
            }}
            inputProps={{
    max: new Date().toISOString().split("T")[0],
  }}
          />
         <IconButton
  onClick={() => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates.");
      return;
    }

    if (fromDate > toDate) {
      alert("From date cannot be after To date.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (fromDate > today || toDate > today) {
      alert("Future dates are not allowed.");
      return;
    }

    if (Plant_ID && storageCode) {
      getDataByDate(Plant_ID, storageCode, fromDate, toDate);
    }
  }}
  sx={{ backgroundColor: "white", borderRadius: 1, padding: 1 }}
>
  <SearchIcon sx={{ color: "#2e59d9", width:"12px" ,height:"12px"}} />
</IconButton>
<IconButton
  onClick={handleExcelDownload}
  sx={{ backgroundColor: "white", borderRadius: 1, padding: 1 }}
>
  <FileDownloadIcon sx={{ color: "#2e59d9" ,width:"12px" ,height:"12px"}} />
</IconButton>

         <IconButton
  onClick={() => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);         // Reset fromDate
    setToDate(today);           // Reset toDate
    setIsFiltered(false);       // Reset filter flag
    if (Plant_ID && storageCode) {
      getData(Plant_ID, storageCode); // Reload all data
    }
  }}
  sx={{
    backgroundColor: "white",
    borderRadius: 1,
    padding: "6px 12px",
    border: "1px solid #2e59d9",
  }}
>
  
  <Typography sx={{ fontSize: "12px", color: "#2e59d9" }}>
    Reset
  </Typography>
</IconButton>

        </Box>
      </Box>

      <div style={{
        flexGrow: 1,
        backgroundColor: "#fff",
        borderRadius: "0 0 8px 8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}>
      <DataGrid
  rows={displayRows}
  columns={columns}
  pagination={false}
  getRowId={(row) => row.id}
  components={{ Toolbar: CustomToolbar }}
  getRowClassName={(params) =>
    params.row.isSubtotal ? "subtotal-row" : ""
  }
  sx={{
    "& .MuiDataGrid-columnHeader": {
      backgroundColor: "#bdbdbd",
      color: "black",
      fontWeight: "bold",
    },
    "& .MuiDataGrid-row.subtotal-row": {
      backgroundColor: "#f5f5f5",
      fontWeight: "bold",
      borderTop: "2px solid #999",
    },
    "& .MuiDataGrid-cell": {
      color: "#333",
      fontSize: "14px",
    },
  }}
/>


</div>
</div>
    
  );
};

export default Store2Closed;
