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

import {
  getdetailsService,
} from "../controller/Inwardtransactionapiservice";
import { decryptSessionData } from "../controller/StorageUtils";

const Store1Open = () => {
  const [rows, setRows] = useState([]);
  const [UserID, setUserID] = useState("");
  const [Plant_ID, setPlantID] = useState("");

  const columns = [
    { field: "Vendor_Code", headerName: "S.No", flex: 1 },
    { field: "Vendor_Cod", headerName: "Line", flex: 1 },
    { field: "Vendor_Name", headerName: "Order Date", flex: 1 },
    { field: "Invoice_No", headerName: "Order No", flex: 1 },
    { field: "Invoice_Date", headerName: "Material", flex: 1 },
    { field: "Invoice_Value", headerName: "Description", flex: 1 },
    { field: "Purchase_Order", headerName: "Order Qty", flex: 1 },
    { field: "Reason_For_Delay", headerName: "Issued Qty", flex: 1 },
    { field: "bal", headerName: "Balanced Qty", flex: 1 },
    { field: "dely", headerName: "Delay Time", flex: 1 },
  ];

  const getData = async () => {
    try {
      const response = await getdetailsService(UserID);
      setRows(response);
    } catch (error) {
      console.error(error);
      setRows([]);
    }
  };

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      setUserID(decryptedData.UserID);
      setPlantID(decryptedData.PlantID);
    }
  }, []);

  useEffect(() => {
    if (UserID) {
      getData();
    }
  }, [UserID]);

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
      {/* Top Header */}
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
        <Typography>Store 1 - Open Orders</Typography>
         <Typography variant="h6">
      Date: {new Date().toLocaleDateString()}
    </Typography>
      </Box>

      {/* DataGrid Container */}
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
          getRowId={(row) => row.Inward_ID}
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
                backgroundColor: "#f5f5f5",
              },
            },
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "inherit",
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

export default Store1Open;
