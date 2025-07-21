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
import { getdetailsStoreClosed,getdetailsStoreClosedByDate,getdetailsExcelDownload } from "../controller/StoreDashboardapiservice"; // make sure this accepts plantId + storageCode
import { decryptSessionData } from "../controller/StorageUtils";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import * as XLSX from 'xlsx-js-style';
import { FaFileExcel } from "react-icons/fa";
const Store1Closed = ({ storageCode }) => {
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
// const handleExcelDownload = () => {
//   const exportData = isFiltered ? filteredRows : rows;

//   if (exportData.length === 0) {
//     alert("No Data Found");
//     return;
//   }

//   const DataColumns = [
//     "Sup_Name",
//     "No_Of_Orders",
//     "No_Of_Open_Orders",
//     "No_Order_Close",
//     "Material_Issue_Posted_on_Time",
//     "Material_Issue_Posted_Delay<60",
//     "Material_Issue_Posted_Delay>60",
//   ];

//   const formattedData = exportData.map((item) => ({
//     Sup_Name: item.Sup_Name,
//     No_Of_Orders: item.No_Of_Orders,
//     No_Of_Open_Orders: item.No_Of_Open_Orders,
//     No_Order_Close: item.No_Order_Close,
//     Material_Issue_Posted_on_Time: item.Issue_Posted_on_Time,
//     "Material_Issue_Posted_Delay<60": item.Issue_Posted_Delay60,
//     "Material_Issue_Posted_Delay>60": item.Issue_Posted_Delay,
//   }));

//   formattedData.push({});
//   formattedData.push({
//     Sup_Name: "SubTotal",
//     No_Of_Orders: subtotal.No_Of_Orders,
//     No_Of_Open_Orders: subtotal.No_Of_Open_Orders,
//     No_Order_Close: subtotal.No_Order_Close,
//     Material_Issue_Posted_on_Time: subtotal.Issue_Posted_on_Time,
//     "Material_Issue_Posted_Delay<60": subtotal.Issue_Posted_Delay60,
//     "Material_Issue_Posted_Delay>60": subtotal.Issue_Posted_Delay,
//   });

//   const metadataSheet = [
//     ["", "", "Store 1", ""], // Row 1 (C1:D1 merged)
//     ["", "From Date", fromDate, "To Date", toDate], // Row 2: B1-E1
//     [],
//     DataColumns,
//     ...formattedData.map((row) => DataColumns.map((key) => row[key] ?? "")),
//   ];

//   const worksheetMain = XLSX.utils.aoa_to_sheet(metadataSheet);

//   worksheetMain["!cols"] = [
//     { wch: 35 }, // A
//     { wch: 25 }, // B
//     { wch: 25 }, // C
//     { wch: 25 }, // D
//     { wch: 25 }, // E
//     ...DataColumns.map(() => ({ wch: 35 })),
//   ];

//   worksheetMain["!merges"] = [
//     { s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }, // C1:D1 merged for "Store 1"
//   ];

//   worksheetMain["C1"].s = {
//     alignment: { horizontal: "center", vertical: "center" },
//     font: { bold: true, sz: 14 },
//     fill: { fgColor: { rgb: "D9E1F2" } }, // light blue
//   };
//   worksheetMain["D1"].s = worksheetMain["C1"].s;

//   // Style From Date / To Date
//   ["B2", "C2", "D2", "E2"].forEach((cell) => {
//     worksheetMain[cell] = worksheetMain[cell] || {};
//     worksheetMain[cell].s = {
//       alignment: { horizontal: "center" },
//       font: { bold: true },
//       fill: { fgColor: { rgb: "FCE4D6" } },
//     };
//   });

//   // Header Styling
//   DataColumns.forEach((colName, colIndex) => {
//     const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: 3 }); // Row 4
//     if (!worksheetMain[cellRef]) {
//       worksheetMain[cellRef] = { t: "s", v: colName };
//     }

//     worksheetMain[cellRef].s = {
//       font: { bold: true },
//       alignment: { horizontal: "center", vertical: "center", wrapText: true },
//       fill: { fgColor: { rgb: "FFD966" } }, // gold
//       border: {
//         top: { style: "thin", color: { rgb: "000000" } },
//         bottom: { style: "thin", color: { rgb: "000000" } },
//         left: { style: "thin", color: { rgb: "000000" } },
//         right: { style: "thin", color: { rgb: "000000" } },
//       },
//     };
//   });

//   // Freeze top 4 rows
//   worksheetMain["!freeze"] = { xSplit: 0, ySplit: 4 };

//   // Style Data Rows
//   const totalRows = metadataSheet.length;
//   for (let row = 4; row < totalRows - 1; row++) {
//     for (let col = 0; col < DataColumns.length; col++) {
//       const cell = XLSX.utils.encode_cell({ c: col, r: row });
//       if (!worksheetMain[cell]) continue;

//       let fillColor = null;
//       if (col === 4) fillColor = "C6EFCE";
//       else if (col === 5) fillColor = "FFF9C4";
//       else if (col === 6) fillColor = "FFC7CE";

//       worksheetMain[cell].s = {
//         alignment: {
//           horizontal: col === 0 ? "left" : "center",
//         },
//         ...(fillColor && { fill: { fgColor: { rgb: fillColor } } }),
//       };
//     }
//   }

//   // Subtotal row styling
//   const subtotalRowIndex = totalRows - 1;
//   for (let col = 0; col < DataColumns.length; col++) {
//     const cell = XLSX.utils.encode_cell({ c: col, r: subtotalRowIndex });
//     if (!worksheetMain[cell]) continue;

//     let fillColor = "DDEBF7";
//     if (col === 4) fillColor = "C6EFCE";
//     else if (col === 5) fillColor = "FFF9C4";
//     else if (col === 6) fillColor = "FFC7CE";

//     worksheetMain[cell].s = {
//       font: { bold: true },
//       alignment: {
//         horizontal: col === 0 ? "left" : "center",
//       },
//       fill: { fgColor: { rgb: fillColor } },
//       border: {
//         top: { style: "medium", color: { rgb: "000000" } },
//       },
//     };
//   }

//   // === Split view sheet
//   const splitSheet = XLSX.utils.json_to_sheet(exportData, {
//     header: Object.keys(exportData[0] || {}),
//   });
//   splitSheet["!cols"] = Object.keys(exportData[0] || {}).map(() => ({ wch: 35 }));

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheetMain, "Closed Orders");
//   XLSX.utils.book_append_sheet(workbook, splitSheet, "Split View");

//   const today = new Date();
//   const fileName = `Store1_ClosedOrders_${today.getFullYear()}${String(
//     today.getMonth() + 1
//   ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.xlsx`;

//   XLSX.writeFile(workbook, fileName);
// };

const handleExcelDownload = async () => {
  const exportData = isFiltered ? filteredRows : rows;

  if (exportData.length === 0) {
    alert("No Data Found");
    return;
  }

  const Plant_ID = sessionStorage.getItem("Plant_ID");
  const StorageCode = sessionStorage.getItem("StorageCode");

  let splitViewData = [];
  try {
    const response = await getdetailsExcelDownload(Plant_ID, fromDate, toDate, StorageCode);
    splitViewData = response?.data || [];
  } catch (err) {
    console.error("Error fetching split view data:", err);
    alert("Failed to load split view data.");
    return;
  }

  const DataColumns = [
    "Sup_Name",
    "No_Of_Orders",
    "No_Of_Open_Orders",
    "No_Order_Close",
    "Material_Issue_Posted_on_Time",
    "Material_Issue_Posted_Delay<60",
    "Material_Issue_Posted_Delay>60",
  ];

  const formattedData = exportData.map((item) => ({
    Sup_Name: item.Sup_Name,
    No_Of_Orders: item.No_Of_Orders,
    No_Of_Open_Orders: item.No_Of_Open_Orders,
    No_Order_Close: item.No_Order_Close,
    Material_Issue_Posted_on_Time: item.Issue_Posted_on_Time,
    "Material_Issue_Posted_Delay<60": item.Issue_Posted_Delay60,
    "Material_Issue_Posted_Delay>60": item.Issue_Posted_Delay,
  }));

  formattedData.push({});
  formattedData.push({
    Sup_Name: "SubTotal",
    No_Of_Orders: subtotal.No_Of_Orders,
    No_Of_Open_Orders: subtotal.No_Of_Open_Orders,
    No_Order_Close: subtotal.No_Order_Close,
    Material_Issue_Posted_on_Time: subtotal.Issue_Posted_on_Time,
    "Material_Issue_Posted_Delay<60": subtotal.Issue_Posted_Delay60,
    "Material_Issue_Posted_Delay>60": subtotal.Issue_Posted_Delay,
  });

  const metadataSheet = [
    ["", "", "Store 1", ""],
    ["", "From Date", fromDate, "To Date", toDate],
    [],
    DataColumns,
    ...formattedData.map((row) => DataColumns.map((key) => row[key] ?? "")),
  ];

  const worksheetMain = XLSX.utils.aoa_to_sheet(metadataSheet);

  worksheetMain["!merges"] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
  worksheetMain["!freeze"] = { xSplit: 0, ySplit: 4 };

  worksheetMain["!cols"] = [
    { wch: 5 },   // A
    { wch: 18 },  // B
    { wch: 20 },  // C
    { wch: 20 },  // D
    { wch: 20 },  // E
    ...DataColumns.map(() => ({ wch: 35 })),
  ];

  const setCellStyle = (cell, style) => {
    worksheetMain[cell] = worksheetMain[cell] || {};
    worksheetMain[cell].s = style;
  };

  // Header styles
  ["C1", "D1"].forEach(cell =>
    setCellStyle(cell, {
      alignment: { horizontal: "center", vertical: "center" },
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: "D9E1F2" } },
    })
  );

  ["B2", "C2", "D2", "E2"].forEach(cell =>
    setCellStyle(cell, {
      alignment: { horizontal: "center" },
      font: { bold: true },
      fill: { fgColor: { rgb: "FCE4D6" } },
    })
  );

  // Column header styling
  DataColumns.forEach((col, i) => {
    const cell = XLSX.utils.encode_cell({ r: 3, c: i });
    setCellStyle(cell, {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      fill: { fgColor: { rgb: "FFD966" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    });
  });

  // Data rows styling
  const totalRows = metadataSheet.length;
  for (let r = 4; r < totalRows - 1; r++) {
    for (let c = 0; c < DataColumns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      let fillColor = null;
      if (c === 4) fillColor = "C6EFCE";
      else if (c === 5) fillColor = "FFF9C4";
      else if (c === 6) fillColor = "FFC7CE";

      setCellStyle(cellRef, {
        alignment: { horizontal: c === 0 ? "left" : "center" },
        ...(fillColor && { fill: { fgColor: { rgb: fillColor } } }),
      });
    }
  }

  // Subtotal row
  const subtotalRowIndex = totalRows - 1;
  for (let c = 0; c < DataColumns.length; c++) {
    const cell = XLSX.utils.encode_cell({ r: subtotalRowIndex, c });
    let fillColor = "DDEBF7";
    if (c === 4) fillColor = "C6EFCE";
    else if (c === 5) fillColor = "FFF9C4";
    else if (c === 6) fillColor = "FFC7CE";

    setCellStyle(cell, {
      font: { bold: true },
      alignment: { horizontal: c === 0 ? "left" : "center" },
      fill: { fgColor: { rgb: fillColor } },
      border: { top: { style: "medium", color: { rgb: "000000" } } },
    });
  }

  // 📄 Split View Sheet
  const splitSheet = XLSX.utils.json_to_sheet(splitViewData);
  splitSheet["!cols"] = Object.keys(splitViewData[0] || {}).map(() => ({ wch: 30 }));

  // Build Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheetMain, "Closed Orders");
  XLSX.utils.book_append_sheet(workbook, splitSheet, "Split View");

  const today = new Date();
  const fileName = `Store1_ClosedOrders_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.xlsx`;
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
  sx={{ backgroundColor: "white",   }}
>
  <FaFileExcel style={{ color: "#06462b", width: "18px", height: "20px" }} />
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

export default Store1Closed;
