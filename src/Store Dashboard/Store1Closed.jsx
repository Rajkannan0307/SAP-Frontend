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
  Typography,
  RadioGroup,
  MenuItem,
  InputLabel,
  FormControl,
  Tooltip,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReplayIcon from '@mui/icons-material/Replay';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";

import {
  getdetailsService,
  getVendor,
  getAddService,
  updateInwardInvoiceService,
  getServiceData,
  Resubmit,
} from "../controller/Inwardtransactionapiservice";
import { decryptSessionData } from "../controller/StorageUtils";

const Store1Closed = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [Plant_ID, setPlantID] = useState("");
  const [UserID, setUserID] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  const columns = [
    { field: "Vendor_Code", headerName: "Line Name", flex: 1 },
    { field: "Vendor_Name", headerName: "No.Of Orders", flex: 1 },
    { field: "Invoice_No", headerName: "No Order Close", flex: 1 },
    { field: "Invoice_Date", headerName: "Issue Posted on Time", flex: 1 },
    { field: "Invoice_Value", headerName: "Issue Posted Delay", flex: 1 },
    
  ];

  const getData = async () => {
    try {
      const response = await getdetailsService(UserID);
      console.log(response);
      setData(response);
      setOriginalRows(response);
      setRows(response);
    } catch (error) {
      console.error(error);
      setData([]);
      setOriginalRows([]);
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

  // Custom Toolbar
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
      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "calc(5 * 48px + 56px)", // extra space for header
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <Box
          sx={{
            backgroundColor: "#2e59d9",
            color: "white",
            fontWeight: "bold",
            padding: "10px 16px",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body1">Shift A</Typography>
          <Typography variant="body1" sx={{ fontWeight: "bold", fontSize: "16px" }}>
            Store 1 - Closed Orders
          </Typography>
          <Typography variant="body1">Date</Typography>
        </Box>

        {/* DataGrid */}
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

export default Store1Closed;
