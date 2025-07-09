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

import { getdetailsStoreClosed } from "../controller/StoreDashboardapiservice"; 
import { decryptSessionData } from "../controller/StorageUtils";

const Store3Closed = ({ storageCode }) => {
  const [rows, setRows] = useState([]);
  const [Plant_ID, setPlantID] = useState("");
  const [UserID, setUserID] = useState("");

  const columns = [
    { field: "Line_Name", headerName: "Line Name", flex: 1 },
    { field: "No.Of Orders", headerName: "No.Of Orders", flex: 1 },
    { field: "No Order Close", headerName: "No Order Close", flex: 1 },
    { field: "Issue Posted on Time", headerName: "Issue Posted on Time", flex: 1 },
    { field: "Issue Posted Delay", headerName: "Issue Posted Delay", flex: 1 },
  ];

  const getData = async () => {
    try {
      const response = await getdetailsStoreClosed(Plant_ID, storageCode);
      console.log("📦 Store3Closed Data:", response);
      setRows(response);
    } catch (error) {
      console.error("❌ Error fetching Store3Closed data:", error);
      setRows([]);
    }
  };

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decrypted = decryptSessionData(encryptedData);
      setUserID(decrypted.UserID);
      setPlantID(decrypted.PlantID);
    }
  }, []);

  useEffect(() => {
    if (Plant_ID && storageCode) {
      getData();
    }
  }, [Plant_ID, storageCode]);

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
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 250px)",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#2e59d9",
          color: "white",
          fontWeight: "bold",
          padding: "10px 16px",
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "16px",
        }}
      >
        <Typography>Shift A</Typography>
        <Typography>Store 3 - Closed Orders</Typography>
        <Typography variant="h6">
          Date: {new Date().toLocaleDateString()}
        </Typography>
      </Box>

      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
         getRowId={(row) => row.Prdord_ID}

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

export default Store3Closed;
