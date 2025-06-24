import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  IconButton,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { getdetails, getPlants, getDepartment } from "../controller/ModuleMasterapiservice";

const StoreDashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [selectedStore, setSelectedStore] = useState("Store 1");

  // Fetch data based on selected store
  const getData = async (storeName) => {
    try {
      const response = await getdetails(storeName); // Modify your backend to accept store name
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

  // Initial load
  useEffect(() => {
    getData(selectedStore);
  }, []);

  // Handle tab switching
  const handleTabChange = (_, newValue) => {
    const store = newValue === 0 ? "Store 1" : "Store 2";
    setSelectedStore(store);
    getData(store);
  };

  // Search functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ["Plant_Code", "Dept_Name", "Module_Name"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  // Download Excel
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = ["Plant_Code", "Dept_Name", "Module_Name", "ActiveStatus"];

    const filteredData = data.map((item) => ({
      Plant_Code: item.Plant_Code,
      Dept_Name: item.Dept_Name,
      Module_Name: item.Module_Name,
      ActiveStatus: item.Active_Status ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, {
      header: DataColumns,
    });

    // Style header row
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: "FFFF00" } },
        alignment: { horizontal: "center" },
      };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedStore);
    XLSX.writeFile(workbook, `${selectedStore}_ModuleMaster_Data.xlsx`);
  };

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        height: "calc(100vh - 90px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2
          style={{
            margin: 0,
            color: "#2e59d9",
            textDecoration: "underline",
            textDecorationColor: "#88c57a",
            textDecorationThickness: "3px",
            marginBottom: -7,
          }}
        >
         Store Dashboard 
         </h2>
      </div>

      {/* Search + Icons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Type here..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyUp={handleSearch}
            sx={{
              width: "400px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { border: "2px solid grey" },
                "&:hover fieldset": { border: "2px solid grey" },
                "&.Mui-focused fieldset": { border: "2px solid grey" },
              },
            }}
          />
          <Button
            onClick={handleSearch}
            style={{
              borderRadius: "25px",
              border: "2px solid grey",
              color: "grey",
              fontWeight: "bold",
            }}
          >
            <SearchIcon style={{ marginRight: "5px" }} />
            Search
          </Button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <IconButton
            onClick={handleDownloadExcel}
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

          <IconButton
            style={{
              borderRadius: "50%",
              backgroundColor: "#0066FF",
              color: "white",
              width: "40px",
              height: "40px",
            }}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>

      {/* Tabs */}
      <Box sx={{ p: 3 }}>
        <Box sx={{ border: '1px solid #ccc', borderRadius: 0, backgroundColor: '#f5f5f5' }}>
          <Tabs
            value={selectedStore === "Store 1" ? 0 : 1}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: '1px solid #ccc' }}
          >
            <Tab label="Store 1" />
            <Tab label="Store 2" />
          </Tabs>

          {/* Info Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1,
              borderBottom: '1px solid #ccc',
            }}
          >
            <Typography sx={{ fontSize: 14 }}>Shift A</Typography>
            <Typography sx={{ fontSize: 14 }}>{selectedStore}</Typography>
            <Typography sx={{ fontSize: 14 }}>{new Date().toLocaleDateString()}</Typography>
          </Box>

          {/* Table */}
          <Table sx={{ backgroundColor: '#f5f5f5' }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#bdbdbd' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Storage Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Material</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>OrderQty</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Delivery Qty</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Delay Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.Module_ID}>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </div>
  );
};

export default StoreDashboard;
