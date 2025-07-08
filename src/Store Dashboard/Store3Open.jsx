import React, { useState, useEffect } from "react";
import { Typography, Box } from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { getdetailsStore1Open } from "../controller/StoreDashboardapiservice";
import { decryptSessionData } from "../controller/StorageUtils";

const storeCodeMap = {
  1: "1202", // P2 Store 3
  3: "1152", // P4 Store 3
};

const Store3Open = () => {
  const [rows, setRows] = useState([]);
  const [UserID, setUserID] = useState("");
  const [Plant_ID, setPlantID] = useState("");
  const [storageCode, setStorageCode] = useState("");

  const columns = [
    { field: "sno", headerName: "S.No", flex: 1 },
    { field: "Line_Name", headerName: "Line", flex: 1 },
    { field: "Order_Date", headerName: "Order Date", flex: 1 },
    { field: "Order_No", headerName: "Order No", flex: 1 },
    { field: "Material_No", headerName: "Material", flex: 1 },
    { field: "Material_Description", headerName: "Description", flex: 1 },
    { field: "Order_Qty", headerName: "Order Qty", flex: 1 },
    { field: "Issued_Qty", headerName: "Issued Qty", flex: 1 },
    { field: "Balanced_Qty", headerName: "Balanced Qty", flex: 1 },
    { field: "LeadTime", headerName: "Delay Time", flex: 1 },
  ];

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decrypted = decryptSessionData(encryptedData);
      if (decrypted) {
        setUserID(decrypted.UserID);
        setPlantID(decrypted.PlantID);
        setStorageCode(storeCodeMap[decrypted.PlantID]);
      }
    }
  }, []);

  useEffect(() => {
    if (Plant_ID && storageCode) {
      getData(Plant_ID, storageCode);
    }
  }, [Plant_ID, storageCode]);

  const getData = async (plantId, code) => {
    try {
      const response = await getdetailsStore1Open(plantId, code);
      console.log("📦 Store3Open Data:", response);

      const processedData = response.map((row, index) => ({
        id: row.Prdord_ID || index,
        sno: index + 1,
        ...row,
      }));

      setRows(processedData);
    } catch (error) {
      console.error("❌ Error loading Store3Open data:", error);
      setRows([]);
    }
  };

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
        <Typography>Store 3 - Open Orders</Typography>
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


export default Store3Open;
