import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  Divider,
  IconButton, LinearProgress,
  Typography,
  InputLabel,

  FromControl
} from "@mui/material";
import { FaDownload } from "react-icons/fa";
import { deepPurple } from '@mui/material/colors';
import { FormControl, Select, MenuItem } from '@mui/material';



import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from 'sheetjs-style';


import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { IoMdDownload } from "react-icons/io";

import { api } from "../controller/constants";
const Stock = () => {

   const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]); // ✅ Initial empty rows
    const [originalRows, setOriginalRows] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
 const [openUploadModal, setOpenUploadModal] = useState(false);
 const [openViewModal, setOpenViewModal] = useState(false);
 const [openExcelDownloadModal, setOpenExcelDownloadModal] = useState(false);

    //✅ DataGrid Columns with Edit & Delete Buttons
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Doc_ID", headerName: "Doc ID ", flex: 1 },
    { field: "Date", headerName: "Date", flex: 1 },
    { field: "Material_Code", headerName: "Material Code", flex: 1 },
    { field: "SLoc_Code", headerName: "SLoc Code", flex: 1 },
    { field: "Movement_Type", headerName: "Movement Type ", flex: 1 },
    { field: "Approval_Status", headerName: "Approval Status", flex: 1 },
    
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <IconButton
            size="large"
            color="primary"
            onClick={() => handleOpenViewModal(params.row)} // Pass the row data to the modal handler
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },


  ];
    
  // ✅ Open Add Modal
  const handleOpenAddModal = (item) => {
    setOpenAddModal(true);
  };

  const handleOpenViewModal = (item) => {
    setOpenViewModal(true);

  }

  
  const handleOpenModal = () => {
    setOpenExcelDownloadModal(true);
    // setFromDate(''); // Reset From Date
    // setToDate(''); // Reset To Date
  };
  const handleCloseModal = () => {
    setOpenExcelDownloadModal(false);

  };

  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
  
    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate '].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };
  
    // ✅ Custom Toolbar
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
      marginTop: "50px",
      display: "flex",
      flexDirection: "column",
      maxHeight: "100%", // Limit the max height
      overflowY: "auto", // Enable vertical scroll if needed
    }}
  >

    {/* Header Section */}
    <div
      style={{
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "#2e59d9",
          textDecoration: "underline",
          textDecorationColor: "limegreen",
          marginBottom: -7,
          textDecorationThickness: '3px'
        }}
      >
        201/202 Movement Transaction
      </h2>
    </div>

    {/* Search and Icons Section */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      {/* Search Box */}
      <div style={{ display: "flex", gap: "10px" }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Type here..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyUp={handleSearch}
          style={{ width: "400px" }}
        />
        <Button
          onClick={handleSearch}
          style={{
            borderRadius: "25px",
            border: "2px solid skyblue",
            color: "skyblue",
            fontWeight: "bold",
            textTransform: "none",
          }}
        >
          <SearchIcon style={{ marginRight: "5px" }} />
          Search
        </Button>
      </div>

      {/* Icons Section */}
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Upload Button */}
        <IconButton
          component="span"
          onClick={() => setOpenUploadModal(true)}
          style={{
            borderRadius: "50%",
            backgroundColor: "#FF6699",
            color: "white",
            width: "40px",
            height: "40px",
          }}
        >
          <CloudUploadIcon />
        </IconButton>

        {/* ✅ Download Template */}
        <IconButton
          onClick={handleOpenModal}
          style={{
            borderRadius: "50%",
            backgroundColor: "#339900",
            color: "white",
            width: "40px",
            height: "40px",
          }}
        >
          <FaFileExcel size={18} />
        </IconButton>

        {/* ✅ Add Button */}
        <IconButton
          color="primary"
          onClick={handleOpenAddModal}
          style={{
            borderRadius: "50%",
            backgroundColor: "#0099FF",
            color: "white",
            width: "40px",
            height: "40px",
          }}
        >
          <AddIcon />
        </IconButton>
      </div>
    </div>
    {/* ✅ DataGrid */}
    <div
      style={{
        flexGrow: 1,  // Ensures it grows to fill the remaining space
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        height: "500px"
      }}
    >

      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        getRowId={(row) => row.Trn_309_ID} // Ensure Trn_309_ID is unique and exists
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
        slots={{ toolbar: CustomToolbar }}
        sx={{
          // Header Style
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#2e59d9",
            color: "white",
            fontWeight: "bold",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "16px",
            fontWeight: "bold",
          },
          "& .MuiDataGrid-row": {
            backgroundColor: "#f5f5f5", // Default row background
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          },
          // ✅ Remove Selected Row Background
          "& .MuiDataGrid-row.Mui-selected": {
            backgroundColor: "inherit", // No background on selection
          },

          "& .MuiDataGrid-cell": {
            color: "#333",
            fontSize: "14px",
          },
        }}
      />
    </div>

    </div>
  )
}



export default Stock
