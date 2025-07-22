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
  const storageCode = typeof code === "object" && code?.value ? code.value : code;

  try {
    const response = await getdetailsStoreClosed(plantId, storageCode);
    console.log("closed 1 ordrs", response);
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

const getExcel = async (plantId, code, from, to) => {
  try {
    const response = await getdetailsExcelDownload(plantId, from, to, code);
    console.log("Excel API raw response", response);

    const summaryData = response.summaryData || [];
    const splitViewData = response.splitViewData || [];

    const subtotal = {
      No_Of_Orders: summaryData.reduce((acc, cur) => acc + (cur.No_Of_Orders || 0), 0),
      No_Of_Open_Orders: summaryData.reduce((acc, cur) => acc + (cur.No_Of_Open_Orders || 0), 0),
      No_Order_Close: summaryData.reduce((acc, cur) => acc + (cur.No_Order_Close || 0), 0),
      Issue_Posted_on_Time: summaryData.reduce((acc, cur) => acc + (cur.Issue_Posted_on_Time || 0), 0),
      Issue_Posted_Delay60: summaryData.reduce((acc, cur) => acc + (cur.Issue_Posted_Delay60 || 0), 0),
      Issue_Posted_Delay: summaryData.reduce((acc, cur) => acc + (cur.Issue_Posted_Delay || 0), 0),
    };

    return { summaryData, splitViewData, subtotal };
  } catch (err) {
    console.error("Error fetching excel data:", err);
    return { summaryData: [], splitViewData: [], subtotal: {} };
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


const handleExcelDownload = async (code, fromDate, toDate) => {
  try {
    const storageCode = typeof code === "object" && code?.value ? code.value : code;
    if (!fromDate || !toDate || !storageCode) {
      alert("Missing required parameters.");
      return;
    }

    const response = await getdetailsExcelDownload(fromDate, toDate, storageCode);
    console.log("excel data",response)
    const summaryData = response.summaryData || [];
    const splitViewData = response.splitViewData || [];

    if (summaryData.length === 0 && splitViewData.length === 0) {
      alert("No Data Found");
      return;
    }

    const subtotal = {
      No_Of_Orders: summaryData.reduce((a, b) => a + (b.No_Of_Orders || 0), 0),
      No_Of_Open_Orders: summaryData.reduce((a, b) => a + (b.No_Of_Open_Orders || 0), 0),
      No_Order_Close: summaryData.reduce((a, b) => a + (b.No_Order_Close || 0), 0),
      Issue_Posted_on_Time: summaryData.reduce((a, b) => a + (b.Issue_Posted_on_Time || 0), 0),
      Issue_Posted_Delay60: summaryData.reduce((a, b) => a + (b.Issue_Posted_Delay60 || 0), 0),
      Issue_Posted_Delay: summaryData.reduce((a, b) => a + (b.Issue_Posted_Delay || 0), 0),
    };

    const wb = XLSX.utils.book_new();

    const metadata = [
      ["", "", "Store 1", ""], // C1:D1
      ["", "From Date", fromDate, "To Date", toDate], // C2–F2
      [],
    ];

    const summaryHeaders = [
      "Sup_Name",
      "No_Of_Orders",
      "No_Of_Open_Orders",
      "No_Order_Close",
      "Issue_Posted_on_Time",
      "Issue_Posted_Delay60",
      "Issue_Posted_Delay",
    ];

    const summaryRows = summaryData.map(row => [
      row.Sup_Name,
      row.No_Of_Orders,
      row.No_Of_Open_Orders,
      row.No_Order_Close,
      row.Issue_Posted_on_Time,
      row.Issue_Posted_Delay60,
      row.Issue_Posted_Delay,
    ]);

    const subtotalRow = [
      "SubTotal",
      subtotal.No_Of_Orders,
      subtotal.No_Of_Open_Orders,
      subtotal.No_Order_Close,
      subtotal.Issue_Posted_on_Time,
      subtotal.Issue_Posted_Delay60,
      subtotal.Issue_Posted_Delay,
    ];

    const summarySheetData = [...metadata, summaryHeaders, ...summaryRows, subtotalRow];
    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);

    // Merge C1:D1
    wsSummary["!merges"] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];

    const range = XLSX.utils.decode_range(wsSummary['!ref']);
    const totalRows = summarySheetData.length;
    const headerRowIndex = metadata.length;
    const subtotalRowIndex = totalRows - 1;

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = wsSummary[cellRef];
        if (!cell) continue;

        // Title styling
        if (R === 0 && (C === 2 || C === 3)) {
          cell.s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "D9E1F2" } },
          };
        }

        // Date row styling
        if (R === 1 && C >= 1 && C <= 4) {
          cell.s = {
            font: { bold: true },
            alignment: { horizontal: "center" },
            fill: { fgColor: { rgb: "FCE4D6" } },
          };
        }

        // Header row
        if (R === headerRowIndex) {
          cell.s = {
            font: { bold: true, color: { rgb: "000000" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            fill: { fgColor: { rgb: "FFD966" } },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }

        // Subtotal row styling with conditional colors
        if (R === subtotalRowIndex) {
          let fillColor = "DDEBF7";
          if (C === 4) fillColor = "C6EFCE";       // Green
          else if (C === 5) fillColor = "FFF9C4";   // Yellow
          else if (C === 6) fillColor = "FFC7CE";   // Red

          cell.s = {
            font: { bold: true },
            alignment: { horizontal: C === 0 ? "left" : "center" },
            fill: { fgColor: { rgb: fillColor } },
            border: { top: { style: "medium", color: { rgb: "000000" } } },
          };
        }

        // Conditional coloring for data rows
        if (R > headerRowIndex && R < subtotalRowIndex) {
          if (C === 4) cell.s = { fill: { fgColor: { rgb: "C6EFCE" } } }; // Green
          if (C === 5) cell.s = { fill: { fgColor: { rgb: "FFEB9C" } } }; // Yellow
          if (C === 6) cell.s = { fill: { fgColor: { rgb: "F4CCCC" } } }; // Red
        }
      }
    }

    wsSummary['!cols'] = [
      { wch: 30 }, { wch: 18 }, { wch: 20 },
      { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 25 }
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Closed Orders");

    // SPLIT VIEW Sheet
    const formattedSplit = splitViewData.map(row => ({ ...row }));
    const wsSplit = XLSX.utils.json_to_sheet(formattedSplit);

    const splitRange = XLSX.utils.decode_range(wsSplit['!ref']);
    for (let C = splitRange.s.c; C <= splitRange.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!wsSplit[cellRef]) continue;

      wsSplit[cellRef].s = {
        font: { bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        fill: { fgColor: { rgb: "FFD966" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    wsSplit['!cols'] = Object.keys(formattedSplit[0] || {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, wsSplit, "Order Details");

    XLSX.writeFile(wb, `Store1_Closed_${fromDate}_to_${toDate}.xlsx`, {
      bookType: "xlsx",
      cellStyles: true,
    });
  } catch (err) {
    console.error("Excel download error:", err);
    alert("Download failed");
  }
};










// ✅ Helper: Format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  if (isNaN(d)) return "";
  return d.toISOString().split("T")[0];
};







// const handleExcelDownload = async () => {
//   const exportData = isFiltered ? filteredRows : rows;

//   if (exportData.length === 0) {
//     alert("No Data Found");
//     return;
//   }

//   const Plant_ID = sessionStorage.getItem("Plant_ID");
//   const StorageCode = sessionStorage.getItem("StorageCode");

//   let splitViewData = [];
//   try {
//     const response = await getdetailsExcelDownload(Plant_ID, fromDate, toDate, StorageCode);
//     splitViewData = response?.data || [];
//   } catch (err) {
//     console.error("Error fetching split view data:", err);
//     alert("Failed to load split view data.");
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
//     ["", "", "Store 1", ""],
//     ["", "From Date", fromDate, "To Date", toDate],
//     [],
//     DataColumns,
//     ...formattedData.map((row) => DataColumns.map((key) => row[key] ?? "")),
//   ];

//   const worksheetMain = XLSX.utils.aoa_to_sheet(metadataSheet);

//   worksheetMain["!merges"] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: 3 } }];
//   worksheetMain["!freeze"] = { xSplit: 0, ySplit: 4 };

//   worksheetMain["!cols"] = [
//     { wch: 5 },   // A
//     { wch: 18 },  // B
//     { wch: 20 },  // C
//     { wch: 20 },  // D
//     { wch: 20 },  // E
//     ...DataColumns.map(() => ({ wch: 35 })),
//   ];

//   const setCellStyle = (cell, style) => {
//     worksheetMain[cell] = worksheetMain[cell] || {};
//     worksheetMain[cell].s = style;
//   };

//   // Header styles
//   ["C1", "D1"].forEach(cell =>
//     setCellStyle(cell, {
//       alignment: { horizontal: "center", vertical: "center" },
//       font: { bold: true, sz: 14 },
//       fill: { fgColor: { rgb: "D9E1F2" } },
//     })
//   );

//   ["B2", "C2", "D2", "E2"].forEach(cell =>
//     setCellStyle(cell, {
//       alignment: { horizontal: "center" },
//       font: { bold: true },
//       fill: { fgColor: { rgb: "FCE4D6" } },
//     })
//   );

//   // Column header styling
//   DataColumns.forEach((col, i) => {
//     const cell = XLSX.utils.encode_cell({ r: 3, c: i });
//     setCellStyle(cell, {
//       font: { bold: true },
//       alignment: { horizontal: "center", vertical: "center", wrapText: true },
//       fill: { fgColor: { rgb: "FFD966" } },
//       border: {
//         top: { style: "thin", color: { rgb: "000000" } },
//         bottom: { style: "thin", color: { rgb: "000000" } },
//         left: { style: "thin", color: { rgb: "000000" } },
//         right: { style: "thin", color: { rgb: "000000" } },
//       },
//     });
//   });

//   // Data rows styling
//   const totalRows = metadataSheet.length;
//   for (let r = 4; r < totalRows - 1; r++) {
//     for (let c = 0; c < DataColumns.length; c++) {
//       const cellRef = XLSX.utils.encode_cell({ r, c });
//       let fillColor = null;
//       if (c === 4) fillColor = "C6EFCE";
//       else if (c === 5) fillColor = "FFF9C4";
//       else if (c === 6) fillColor = "FFC7CE";

//       setCellStyle(cellRef, {
//         alignment: { horizontal: c === 0 ? "left" : "center" },
//         ...(fillColor && { fill: { fgColor: { rgb: fillColor } } }),
//       });
//     }
//   }

//   // Subtotal row
//   const subtotalRowIndex = totalRows - 1;
//   for (let c = 0; c < DataColumns.length; c++) {
//     const cell = XLSX.utils.encode_cell({ r: subtotalRowIndex, c });
//     let fillColor = "DDEBF7";
//     if (c === 4) fillColor = "C6EFCE";
//     else if (c === 5) fillColor = "FFF9C4";
//     else if (c === 6) fillColor = "FFC7CE";

//     setCellStyle(cell, {
//       font: { bold: true },
//       alignment: { horizontal: c === 0 ? "left" : "center" },
//       fill: { fgColor: { rgb: fillColor } },
//       border: { top: { style: "medium", color: { rgb: "000000" } } },
//     });
//   }

//   // 📄 Split View Sheet
//   const splitSheet = XLSX.utils.json_to_sheet(splitViewData);
//   splitSheet["!cols"] = Object.keys(splitViewData[0] || {}).map(() => ({ wch: 30 }));

//   // Build Workbook
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheetMain, "Closed Orders");
//   XLSX.utils.book_append_sheet(workbook, splitSheet, "Split View");

//   const today = new Date();
//   const fileName = `Store1_ClosedOrders_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}.xlsx`;
//   XLSX.writeFile(workbook, fileName);
// };










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
  onClick={() => handleExcelDownload(storageCode, fromDate, toDate)}
  sx={{ backgroundColor: "white" }}
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
