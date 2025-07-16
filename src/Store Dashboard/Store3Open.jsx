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
import {
  getdetailsStore1Open,
  getdetailsStore1OpenByDate,
} from "../controller/StoreDashboardapiservice";
import { decryptSessionData } from "../controller/StorageUtils";
import "../App.css"; // ⬅️ Add this if using external styles

const Store3Open = ({ storageCode }) => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [UserID, setUserID] = useState("");
  const [Plant_ID, setPlantID] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

   const columns = [
  { field: "sno", headerName: "S.No", width: 80 },
  { field: "Sup_Name", headerName: "Work Scheduler Name", width: 320 },
  
  { field: "Order_No", headerName: "Order No", width: 240 },
  { field: "Material_No", headerName: "Material", width: 280 },
  { field: "Material_Description", headerName: "Description", width: 350 },
  { field: "Order_Qty", headerName: "Order Qty", width: 130 },
  { field: "Order_Date", headerName: "Order Date", width: 180 },
  { field: "Supv_Lead_Time", headerName: "Lead Time", width: 130 },
  { field: "Delay_Time", headerName: "Delay Time", width: 122 },
];

  const getData = async (plantId, code) => {
    try {
      const response = await getdetailsStore1Open(plantId, code);
      const processed = response.map((row, index) => ({
        id: row.Prdord_ID || index,
        sno: index + 1,
        ...row,
      }));
      setRows(processed);
      setIsFiltered(false);
    } catch (err) {
      console.error("Error fetching open orders:", err);
    }
  };

  // const getDataByDate = async (plantId, code, from, to) => {
  //   try {
  //     const response = await getdetailsStore1OpenByDate(plantId, code, from, to);
  //     const processed = response.map((row, index) => ({
  //       id: row.Prdord_ID || index,
  //       sno: index + 1,
  //       ...row,
  //     }));
  //     setFilteredRows(processed);
  //     setIsFiltered(true);
  //   } catch (err) {
  //     console.error("Error fetching date-filtered open orders:", err);
  //   }
  // };

  useEffect(() => {
    // const interval = setInterval(() => {
    //   window.location.reload();
    // }, 60000); // 1 min refresh

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

    //return () => clearInterval(interval);
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
      padding: 1,
      backgroundColor: "#F5F5F5",
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 250px)",
    }}>

      {/* 🔹 Color Legend */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 ,mt:-2}}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: "#d0f0c0", border: "1px solid #ccc" }} />
                  <Typography variant="body2">On Time</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: "#fff9c4", border: "1px solid #ccc" }} />
                  <Typography variant="body2"> Delay 60minutes</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: "#ffcdd2", border: "1px solid #ccc" }} />
                <Typography variant="body2">Delay &gt; 60 minutes</Typography>

                </Box>
              </Box>
            </Box>
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
       
        <Typography>Store 3 - Open Orders</Typography>
         <Typography variant="h6" sx={{ fontSize: "16px" }}>
  Date & Time: {new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // or false for 24h format
  })}
</Typography>
        {/* <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
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
          />
          <IconButton
            onClick={() => {
              if (!fromDate || !toDate) return alert("Select From and To dates.");
              if (fromDate > toDate) return alert("From date cannot be after To date.");
              if (fromDate > today || toDate > today) return alert("Future dates not allowed.");

              if (Plant_ID && storageCode) {
                getDataByDate(Plant_ID, storageCode, fromDate, toDate);
              }
            }}
            sx={{ backgroundColor: "white", borderRadius: 1, padding: 1 }}
          >
            <SearchIcon sx={{ color: "#2e59d9" }} />
          </IconButton>

          <IconButton
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              setFromDate(today);
              setToDate(today);
              setIsFiltered(false);
              if (Plant_ID && storageCode) {
                getData(Plant_ID, storageCode);
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
        </Box> */}
      </Box>

      <div style={{
        flexGrow: 1,
        backgroundColor: "#fff",
        borderRadius: "0 0 8px 8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}>
      <DataGrid
  rows={isFiltered ? filteredRows : rows}
  columns={columns}
  pageSize={5}
  rowsPerPageOptions={[5]}
  getRowId={(row) => row.id}
  components={{ Toolbar: CustomToolbar }}
  getRowClassName={(params) => {
    const color = params.row.Delay_Color;
    if (color === "Green") return "row-green";
    if (color === "Yellow") return "row-yellow";
    if (color === "Red") return "row-red";
    return "";
  }}
  sx={{
    "& .MuiDataGrid-columnHeader": {
      backgroundColor: "#bdbdbd",
      
      color: "black",
      fontWeight: "bold",
    },
    "& .MuiDataGrid-cell": {
      color: "#333",
      fontSize: "14px",
    },
    // Inline row color styles
    "& .row-green": {
      backgroundColor: "#d0f0c0", // light green
    },
    "& .row-yellow": {
      backgroundColor: "#fff9c4", // light yellow
    },
    "& .row-red": {
      backgroundColor: "#ffcdd2", // light red
    },
  }}
/>

      </div>
    </div>
  );
};

export default Store3Open;
