import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { getdetailsStoreOpen, getActiveStores } from "./StoreUrlapiservice";
import "../App.css";
import { useParams } from "react-router-dom";
import logo from "../components/images/ranelogo.png"; // use this path if image is inside src

const Store1url = () => {
  const { plantCode, storageCodes } = useParams();
  const plantId = plantCode;
  const storageCodeList = storageCodes.split(",");

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [storeNames, setStoreNames] = useState([]); // Separate fetch for sloc_Name
const [lastRefreshed, setLastRefreshed] = useState("");

  const columns = [
    { field: "sno", headerName: "S.No", width: 80 },
    { field: "Sup_Name", headerName: "Work Scheduler Name", width: 375 },
    { field: "Order_No", headerName: "Order No", width: 240 },
    { field: "Material_No", headerName: "Material", width: 280 },
    { field: "Material_Description", headerName: "Description", width: 365 },
    { field: "Order_Qty", headerName: "Order Qty", width: 130 },
    { field: "Order_Date", headerName: "Order Date", width: 180 },
    { field: "Supv_Lead_Time", headerName: "Lead Time", width: 130 },
    { field: "Delay_Time", headerName: "Delay Time", width: 135 },
  ];

  // 🟢 Fetch Order Data
  const fetchData = async () => {
    let allData = [];

    for (let i = 0; i < storageCodeList.length; i++) {
      const code = storageCodeList[i].trim();
      try {
        const response = await getdetailsStoreOpen(plantId, code);
        const processed = response.map((row, index) => ({
          id: `${code}-${row.Prdord_ID || index}`,
          sno: allData.length + index + 1,
          ...row,
        }));
        allData = [...allData, ...processed];
        setRows(allData);
setIsFiltered(false);
setLastRefreshed(new Date().toLocaleString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
}));

      } catch (err) {
        console.error(`Error fetching open orders for ${code}:`, err);
      }
    }

    setRows(allData);
    setIsFiltered(false);
  };

  // 🟢 Fetch Store Names Separately
 const fetchStoreNames = async () => {
  const names = [];

  for (let i = 0; i < storageCodeList.length; i++) {
    const code = storageCodeList[i].trim();
    try {
      const res = await getActiveStores(plantId, code);
      console.log(`Fetched store for ${plantId}-${code} =>`, res);

      // Since it's an array and uses 'SLoc_Name'
      if (Array.isArray(res) && res.length > 0) {
        res.forEach((item) => {
          if (item?.SLoc_Name) {
            names.push(item.SLoc_Name.trim());
          }
        });
      }
    } catch (err) {
      console.error(`Error fetching SLoc_Name for ${code}:`, err);
    }
  }

  setStoreNames(names);
};
useEffect(() => {
  // Fetch data initially
  const fetchAll = () => {
    fetchData();
    fetchStoreNames();
    setLastRefreshed(
      new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    );
  };

  fetchAll(); // initial load

  // Auto-refresh every 60 seconds
  const interval = setInterval(fetchAll, 60000);

  return () => clearInterval(interval); // cleanup
}, [plantCode, storageCodes]);

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
        padding: 1,
       // backgroundColor: "#F5F5F5",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 40px)",
        overflow: "hidden",
      }}
    >
{/* Header with Blue Background, Logo, and Title */}
<Box
  sx={{
    backgroundColor: "#2e59d9",
    color: "white",
    padding: "12px 0px 12px 0px", // removed side padding
    borderRadius: "6px",
    marginBottom: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  {/* 🔷 Logo and Title */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, pl: 1 }}>
    <img
      src={logo} // or "/logo.png" if using from public
      alt="Company Logo"
      style={{
        height: "43px",
        background: "white",
        border: "2px solid white",
        borderRadius: "6px",
        marginLeft: 0, // explicitly no left margin
      }}
    />
    <Typography
      variant="h5"
      sx={{
        fontWeight: "bold",
        //textDecoration: "underline",
        textDecorationColor: "#88c57a",
        //textDecorationThickness: "2px",
        color: "white",
      }}
    >
      {storeNames.length > 0
        ? `${storeNames.join(", ")} - Open Orders`
        : "Store - Open Orders"}
    </Typography>
  </Box>
</Box>
 <Box sx={{ mt: 1, textAlign: "left", fontSize: "20px", fontWeight: "bold", color: "#022c47ff" }}>
  Last Refreshed: {lastRefreshed}
</Box>


      {/* Color Legend */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, mt: 1 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: "#d0f0c0", border: "1px solid #ccc" }} />
            <Typography variant="body2">On Time</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: "#fff9c4", border: "1px solid #ccc" }} />
            <Typography variant="body2">Delay 60 mins</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1,marginRight:1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: "#ffcdd2", border: "1px solid #ccc" }} />
            <Typography variant="body2">Delay &gt; 60 mins</Typography>
          </Box>
        </Box>
      </Box>

      {/* Grid Header */}
      <Box
  sx={{
    backgroundColor: "#2e59d9",
    color: "white",
    fontWeight: "bold",
    padding: "10px 16px",
    borderRadius: "8px 8px 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end", // Align to right only
  }}
>
  <Typography variant="h6" sx={{ fontSize: "16px" }}>
    Date & Time:{" "}
    {new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })}
  </Typography>
</Box>


      {/* DataGrid */}
      <div
        style={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "auto",
          backgroundColor: "#fff",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
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
            "& .row-green": {
              backgroundColor: "#d0f0c0",
            },
            "& .row-yellow": {
              backgroundColor: "#fff9c4",
            },
            "& .row-red": {
              backgroundColor: "#ffcdd2",
            },
          }}
        />
      </div>
   

    </div>
  );
};

export default Store1url;
