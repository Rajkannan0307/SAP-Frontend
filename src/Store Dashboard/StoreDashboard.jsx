import React, { useState, useEffect, } from "react";
import {
  TextField,
  Button,
  Modal,
  Box,
  FormControlLabel,
  IconButton,

  Tabs,
  Tab,
  Switch,
  Typography,Table, TableBody, TableCell, TableHead, TableRow
} from "@mui/material";
import { Link, useLocation } from 'react-router-dom';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { getdetails,getAdd,getUpdates,getPlants,getDepartment} from "../controller/ModuleMasterapiservice";
import { MenuItem, InputLabel, FormControl } from '@mui/material';
const UserID = localStorage.getItem('UserID');
const StoreDashboard = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
   const [PlantCode, setPlantCode] = useState([]);
   const[Dept_Name,setDept_Name]=useState("");
   const[Module_Name,setModule_Name]=useState("");
   const [Module_ID, setModule_ID] = useState([]);
    const [DepartmentTable, setDepartmentTable] = useState([]);

    const [activeTab, setActiveTab] = useState(0);
    const location = useLocation();

  // Determine active tab based on URL
  const currentPath = location.pathname;
  const tabIndex = currentPath === '/page2' ? 1 : 0;

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    console.log(`Switched to tab ${newValue}`);
  };
 
  const getData = async () => {
     try {
       const response = await getdetails();
       console.log(response); // Check the structure of response
       setData(response); // Ensure that this is correctly setting the data
       setOriginalRows(response); // for reference during search
       setRows(response);
     } catch (error) {
       console.error(error);
       setData([]); // Handle error by setting empty data
       setOriginalRows([]); // handle error case
       setRows([]);
     }
   };
  useEffect(() => {
    getData();
  }, []);


  const get_Plant = async () => {
      try {
        const response = await getPlants();
        setPlantTable(response.data);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    };

  // ✅ Custom Toolbar
 
  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ["Plant_Code","Dept_Name","Module_Name"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

   const GetDepartment = async () => {
      try {
        const response = await getDepartment();
        setDepartmentTable(response.data);
      } catch (error) {
        console.error("Error updating user:", error);
      }
    };
  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    setPlantCode("");
    setDept_Name("");
    setModule_Name("");
    setActiveStatus(true);
    setOpenAddModal(true);
    get_Plant();
    GetDepartment();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  

  const handleDownloadExcel = () => {
      if (data.length === 0) {
        alert("No Data Found");
        return;
      }
  
      const DataColumns = [
        "Plant_Code",
         "Dept_Name",
         "Module_Name",
        "ActiveStatus",
      ];
  
      const filteredData = data.map((item) => ({
        Plant_Code: item.Plant_Code,
        Dept_Name:item.Dept_Name,
        Module_Name:item.Module_Name,
  
        ActiveStatus: item.Active_Status ? "Active" : "Inactive"
  
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(filteredData, {
        header: DataColumns,
      });
  
      // Style header row
      DataColumns.forEach((_, index) => {
        const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
        if (!worksheet[cellAddress]) return;
        worksheet[cellAddress].s = {
          font: {
            bold: true,
            color: { rgb: "000000" },
          },
          fill: {
            fgColor: { rgb: "FFFF00" },
          },
          alignment: {
            horizontal: "center",
          },
        };
      });
  
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "StorageLocation");
      XLSX.writeFile(workbook, "ModuleMaster_Data.xlsx");
    };
  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 90px)", // or a specific height if necessary
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
            textDecorationColor: "#88c57a",
            textDecorationThickness: "3px",
            marginBottom: -7,
          }}
        >
         Module Master
        </h2>
      </div>

      {/* Search and Icons */}
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
            sx={{
              width: "400px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  border: "2px solid grey", // No border by default
                },
                "&:hover fieldset": {
                  border: "2px solid grey", // Optional: border on hover
                },
                "&.Mui-focused fieldset": {
                  border: "2px solid grey", // Grey border on focus
                },
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

        {/* Icons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {/* Download Button */}
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

          {/* Add Button */}
          <IconButton
            onClick={handleOpenAddModal}
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
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 0,
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* 🔹 Tabs as Page Links */}
        <Tabs
          value={tabIndex}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: '1px solid #ccc' }}
        >
          <Tab label="Page 1" component={Link} to="/home/StoreDashboard" />
          <Tab label="Page 2" component={Link} to="/home/StoreDashboard" />
        </Tabs>

        {/* 🔹 Info Row */}
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
          <Typography sx={{ fontSize: 14 }}>Main Store</Typography>
          <Typography sx={{ fontSize: 14 }}>Date</Typography>
        </Box>

        {/* 🔹 Table */}
        <Table sx={{ backgroundColor: '#f5f5f5' }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#bdbdbd' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.Module_ID}>
                <TableCell>{row.Module_ID}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.name}</TableCell>
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
