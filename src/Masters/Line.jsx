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
} from "@mui/material";
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
import {
  getdetails,
  getAdd,
  getUpdates,
  getPlants,
  getDepartment,
  getSupvCode,
  getModule,
} from "../controller/LineMasterapiservice";
import { MenuItem, InputLabel, FormControl } from "@mui/material";
const UserID = localStorage.getItem("UserID");
const Line = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
  const [PlantCode, setPlantCode] = useState([]);
  const [Dept_Name, setDept_Name] = useState("");
  const [Line_Name, setLine_Name] = useState("");
  const [Line_ID, setLine_ID] = useState([]);
  const [SupvTable, setSupvTable] = useState([]);
  const [ModuleTable, setModuleTable] = useState([]);
  const [Supv_Code, setSupv_Code] = useState("");
  const [Module_Name, setModule_Name] = useState("");
  const [PlantID, setPlantID] = useState("");
  const [DepartmentTable, setDepartmentTable] = useState([]);
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Dept_Name", headerName: "Department Name ", flex: 1 },
   
    { field: "Module_Name", headerName: "Module Name", flex: 1 },
    { field: "Line_Name", headerName: "Line Name", flex: 1 },
    { field: "Sup_Code", headerName: "Supervisor Code", flex: 1 },
    {
      field: "ActiveStatus",
      headerName: "Active Status",
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.Active_Status; // Assuming Active_Status is a boolean
        return (
          <FormControlLabel
            control={
              <Switch
                checked={isActive} // Use the boolean value directly
                color="default" // Neutral color for default theme
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: isActive ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: isActive ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                  },
                }}
              />
            }
          />
        );
      },
    },
  ];
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
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
  // ✅ Search Functionality
  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        [
          "Plant_Code",
          "Dept_Name",
          "Line_Name",
          "Module_Name",
          "Sup_Code",
        ].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  useEffect(() => {
  if (PlantCode && PlantCode !== "") {
    get_SupvCode(PlantCode); // ✅ now it works correctly
  } else {
    setSupvTable([]);
  }
}, [PlantCode]);


 const get_SupvCode = async (plantId) => {
  try {
    if (!plantId || plantId === "") {
      console.warn("⚠️ No valid Plant_ID provided.");
      return;
    }

    const response = await getSupvCode(plantId); // use the argument
    console.log("Fetching supervisors for Plant_ID:", plantId);
    console.log("API response:", response.data);
    setSupvTable(response.data);
  } catch (error) {
    console.error("❌ Error fetching supervisors:", error);
  }
};

  const get_Module = async () => {
    try {
      const response = await getModule();
      console.log("👉 ModuleTable data:", response.data); // 👈 Check here
      setModuleTable(response.data);
    } catch (error) {
      console.error("❌ Error fetching Module:", error);
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
    setSupv_Code("");
    setLine_Name("");
    setModule_Name("")
    setActiveStatus(true);
    setOpenAddModal(true);
    get_Plant();
    get_Module();
    GetDepartment();
    get_SupvCode();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);
const handleRowClick = async (params) => {
  const plantId = params.row.Plant_ID;
  const plantCode = params.row.Plant_Code;

  setPlantID(plantId);
  setPlantCode(plantCode);

  await get_SupvCode(plantId); // ✅ fetch and set SupvTable here

  setSupv_Code(params.row.Supv_ID); // ✅ this value will now match dropdown options

  setLine_ID(params.row.Line_ID);
  setDept_Name(params.row.Dept_Name);
  setModule_Name(params.row.Module_Name);
  setLine_Name(params.row.Line_Name);
  setActiveStatus(params.row.Active_Status);

  setOpenEditModal(true);
};




  // ✅ Handle Add User
  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
      PlantCode,
      Dept_Name,
      Line_Name,
      UserID,
    });
    console.log("Add button clicked");

    // Step 1: Validate required fields
    if (
      PlantCode === "" ||
      Dept_Name === "" ||
      Line_Name === "" ||
      Module_Name === "" ||
      Supv_Code === ""
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Prepare data to be sent
      const data = {
        UserID: UserID,
        Plant_Code: PlantCode,
        Dept_Name: Dept_Name,
        Sup_Code: Supv_Code,
        Module_Name: Module_Name,
        Line_Name: Line_Name,
        Active_Status: ActiveStatus, // Make sure this is defined somewhere
      };

      // Step 3: Call the API to add the user
      const response = await getAdd(data); // Ensure getAdd uses a POST request

      if (response.data.success) {
        alert("Line added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to add StorageLocation.");
      }
    } catch (error) {
      console.error("Error in adding StorageLocation:", error);

      // Step 4: Show error from server (like Employee_ID already exists)
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the Storage Location.");
      }
    }
  };

  const handleUpdate = async () => {
    const data = {
      UserID: UserID,
      Line_ID: Line_ID,
      Sup_Code: Supv_Code,
      Line_Name: Line_Name,
      Active_Status: ActiveStatus,
    };
    console.log("Data being sent:", data); // Log data to verify it before sending

    try {
      const response = await getUpdates(data);

      // If success
      if (response.data.success) {
        alert(response.data.message);
        getData(); // Refresh data
        handleCloseEditModal(); // Close modal
      } else {
        // If success is false, show the backend message
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message); // Specific error from backend
      } else {
        alert(
          "An error occurred while updating the StorageLocation. Please try again."
        );
      }
    }
  };

  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = [
      "Plant_Code",
      "Dept_Name",
      "Supervisor_Code",
      "Module_Name",
      "Line_Name",
      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      Plant_Code: item.Plant_Code,
      Dept_Name: item.Dept_Name,
      Supervisor_Code: item.Sup_Code,
      Module_Name: item.Module_Name,
      Line_Name: item.Line_Name,

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
    XLSX.writeFile(workbook, "LineMaster_Data.xlsx");
  };
  console.log("🧪 Supv_Code:", Supv_Code);
console.log("🧪 PlantCode:", PlantCode);
console.log("🧪 Filtered SupvTable:", SupvTable.filter((item) => item.Plant_ID === PlantCode));

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
          Line Master
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

      {/* DataGrid */}
      <div
        style={{
          flexGrow: 1, // Ensures it grows to fill the remaining space
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "calc(5 * 48px)",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5} // Set the number of rows per page to 8
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.Line_ID} // Specify a custom id field
          onRowClick={handleRowClick}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            // Header Style
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd", //'#696969', 	'#708090',  //"#2e59d9",
              color: "black",
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
      {/* {Add Model} */}
      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "10%",
            gap: "15px",
          }}
        >
          <h3
            style={{
              gridColumn: "span 2",
              textAlign: "center",
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
            }}
          >
            Add Line Master
          </h3>

          <FormControl fullWidth>
            <InputLabel>Plant Code</InputLabel>
            <Select
              label="Plant Code"
              name="PlantCode"
              value={PlantCode}
              onChange={(e) => setPlantCode(e.target.value)}
              required
            >
              {PlantTable.map((item, index) => (
                <MenuItem key={index} value={item.Plant_Id}>
                  {item.Plant_Code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              name="Department"
              value={Dept_Name}
              onChange={(e) => setDept_Name(e.target.value)}
              required
            >
              {DepartmentTable.map((item, index) => (
                <MenuItem key={index} value={item.Dept_ID}>
                  {item.Dept_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Supervisor Code</InputLabel>
            <Select
              label="Supervisor Code"
              name="Supervisor Code"
              value={Supv_Code}
              onChange={(e) => setSupv_Code(e.target.value)}
              required
            >
              {SupvTable.filter((item) => item.Plant_ID === PlantID).map((item) => (
  <MenuItem key={item.Supv_ID} value={item.Supv_ID}>
    {item.Sup_Code} - {item.Sup_Name}
  </MenuItem>
))}

               
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Module Name</InputLabel>
            <Select
              label="Module Name"
              name="Module Name"
              value={Module_Name}
              onChange={(e) => setModule_Name(e.target.value)}
              required
            >
              {ModuleTable.map((item) => (
                <MenuItem key={item.Module_ID} value={item.Module_ID}>
                  {item.Module_Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Line Name"
            name="Line_Name"
            value={Line_Name}
            onChange={(e) => setLine_Name(e.target.value)}
            fullWidth
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success" // Always use 'success' to keep the thumb green when active
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                    backgroundImage: "none !important", // Disable background image
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // White thumb in both active and inactive states
                    borderColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Match thumb border with track color
                  },
                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"} // Text next to the switch
            labelPlacement="end"
            style={{
              color: ActiveStatus ? "#2e7d32" : "#d32f2f", // Change text color based on status
              fontWeight: "bold",
            }}
          />
          <Box
            sx={{
              gridColumn: "span 2",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={() => handleCloseAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              style={{ width: "90px" }}
              variant="contained"
              color="primary"
              onClick={handleAdd}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ Edit Modal */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "10%",
            gap: "15px",
          }}
        >
          <h3
            style={{
              gridColumn: "span 2",
              textAlign: "center",
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
            }}
          >
            Edit Line Master
          </h3>
          <TextField
            label="Plant"
            name="Plant"
            value={PlantCode} // Use the current value of PlantCode
            fullWidth
            InputProps={{
              readOnly: true, // Make it read-only
            }}
            required
          />

          <TextField
            label="Department Name"
            name="Department Name"
            value={Dept_Name} // Use the current value of PlantCode
            fullWidth
            InputProps={{
              readOnly: true, // Make it read-only
            }}
            required
          />
          
          <TextField
            label="Module Name"
            name="Module Name"
            value={Module_Name}
            onChange={(e) => setModule_Name(e.target.value)}
            InputProps={{
              readOnly: true, // This makes the TextField read-only
            }}
          />
          <FormControl fullWidth>
  <InputLabel>Supervisor Code</InputLabel>
  <Select
    label="Supervisor Code"
    value={Supv_Code} // fallback if undefined
    onChange={(e) => {
      console.log("Changed to Supv_ID:", e.target.value);
      setSupv_Code(e.target.value);
    }}
  >
    {SupvTable.filter((item) => item.Plant_ID === PlantID).map((item) => (
      <MenuItem key={item.Supv_ID} value={item.Supv_ID}>
        {item.Sup_Code} - {item.Sup_Name}
      </MenuItem>
    ))}
  </Select>
</FormControl>




          
          <TextField
            label="Line Name"
            name="Line_Name"
            value={Line_Name}
            onChange={(e) => setLine_Name(e.target.value)}
            fullWidth
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success" // Always use 'success' to keep the thumb green when active
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Green when active, Red when inactive
                    backgroundImage: "none !important", // Disable background image
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // White thumb in both active and inactive states
                    borderColor: ActiveStatus ? "#2e7d32" : "#d32f2f", // Match thumb border with track color
                  },
                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"} // Text next to the switch
            labelPlacement="end"
            style={{
              color: ActiveStatus ? "#2e7d32" : "#d32f2f", // Change text color based on status
              fontWeight: "bold",
            }}
          />

          <Box
            sx={{
              gridColumn: "span 2",
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginTop: "15px",
            }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseEditModal}
            >
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleUpdate}>
              Update
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Line;
