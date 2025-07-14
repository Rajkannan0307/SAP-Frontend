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

const Store2Closed = ({ storageCode }) => {
 const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);

  const [UserID, setUserID] = useState("");
  const [Plant_ID, setPlantID] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
 const columns = [
     { field: "Sup_Name", headerName: "Supervisor Name", flex: 1 },
    { field: "No.Of Orders", headerName: "No.Of Orders", flex: 1 },
    { field: "No Order Close", headerName: "No Order Close", flex: 1 },
    { field: "Issue Posted on Time", headerName: "Issue Posted on Time", flex: 1 },
    { field: "Issue Posted Delay", headerName: "Issue Posted Delay", flex: 1 },
  ];

const getData = async (plantId, code) => {
    try {
      const response = await getdetailsStoreClosed(plantId, code);
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
    } catch (err) {
      console.error("Error fetching date-filtered open orders:", err);
    }
  };

  useEffect(() => {
      const interval = setInterval(() => {
     window.location.reload();
   }, 120000); // 2 minutes in ms
 
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
     return () => clearInterval(interval);
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
        <Typography>Shift A</Typography>
        <Typography>Store 2 - Closed Orders</Typography>

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
  <SearchIcon sx={{ color: "#2e59d9" }} />
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
          rows={isFiltered ? filteredRows : rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.id}
          components={{ Toolbar: CustomToolbar }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd",
              color: "black",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5",
              "&:hover": {
                backgroundColor: "#f0f0f0",
              },
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
