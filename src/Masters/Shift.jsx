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
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
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
import { getdetails, getAdd, getUpdates, getPlants } from "../controller/ShiftMasterapiservice";

const UserID = localStorage.getItem("UserID");

const Shift = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [PlantTable, setPlantTable] = useState([]);

  const [Shift_Id, setShift_Id] = useState(null);
  const [PlantCode, setPlantCode] = useState("");
  const [Shift_Name, setShift_Name] = useState("");
  const [Start_Time, setStart_Time] = useState("");
  const [End_Time, setEnd_Time] = useState("");
  const [Availability_Sec, setAvailability_Sec] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(true);
  // Tracks the row's Active_Status as it was BEFORE this edit session, so
  // Save can ask for confirmation only when the user is actually flipping
  // Active -> Inactive (not on every save).
  const [originalActiveStatus, setOriginalActiveStatus] = useState(true);

  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 0.8 },
    { field: "Plant_Name", headerName: "Plant Name", flex: 1 },
    { field: "Shift_Name", headerName: "Shift Name", flex: 0.8 },
    { field: "Start_Time", headerName: "Start Time", flex: 0.8 },
    { field: "End_Time", headerName: "End Time", flex: 0.8 },
    { field: "Availability_Sec", headerName: "Availability (Sec)", flex: 1 },
    {
      field: "ActiveStatus",
      headerName: "Active Status",
      flex: 1,
      renderCell: (params) => {
        const isActive = params.row.Active_Status;
        return (
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                color="default"
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: isActive ? "#2e7d32" : "#d32f2f",
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: isActive ? "#2e7d32" : "#d32f2f",
                  },
                }}
              />
            }
            label=""
          />
        );
      },
    },
  ];

  const getData = async () => {
    setLoading(true);
    try {
      const response = await getdetails();
      setOriginalRows(response || []);
      setRows(response || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load Shift Master data.");
      setOriginalRows([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data || []);
    } catch (error) {
      console.error("Error loading Plant list:", error);
    }
  };

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ["Plant_Code", "Plant_Name", "Shift_Name"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  const resetForm = () => {
    setShift_Id(null);
    setPlantCode("");
    setShift_Name("");
    setStart_Time("");
    setEnd_Time("");
    setAvailability_Sec("");
    setActiveStatus(true);
    setOriginalActiveStatus(true);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setOpenAddModal(true);
    get_Plant();
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleRowClick = async (params) => {
    setShift_Id(params.row.Shift_Id);
    setShift_Name(params.row.Shift_Name);
    setStart_Time((params.row.Start_Time || "").slice(0, 5)); // "HH:MM:SS" -> "HH:MM" for the time input
    setEnd_Time((params.row.End_Time || "").slice(0, 5));
    setAvailability_Sec(params.row.Availability_Sec ?? "");
    setActiveStatus(params.row.Active_Status);
    setOriginalActiveStatus(params.row.Active_Status);

    try {
      const plantRes = await getPlants();
      setPlantTable(plantRes.data || []);
    } catch (error) {
      console.error("Error loading Plant list for edit:", error);
    }
    // Mst_Shift.Plant_Code is its own value (not a Plant_ID FK), so — unlike
    // Line/Module/SupvCode — there's no ID-vs-Code resolution needed here;
    // the row's own Plant_Code is exactly what the dropdown is keyed on.
    setPlantCode(params.row.Plant_Code);

    setOpenEditModal(true);
  };

  const validateForm = () => {
    if (!PlantCode || !Shift_Name.trim() || !Start_Time || !End_Time || Availability_Sec === "") {
      alert("Please fill in all required fields");
      return false;
    }
    if (Number.isNaN(Number(Availability_Sec)) || Number(Availability_Sec) < 0) {
      alert("Availability (Sec) must be a valid non-negative number");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    if (saving) return;
    setSaving(true);
    try {
      const data = {
        UserID,
        Plant_Code: PlantCode,
        Shift_Name: Shift_Name.trim(),
        Start_Time,
        End_Time,
        Availability_Sec: Number(Availability_Sec),
        Active_Status: ActiveStatus,
      };
      const response = await getAdd(data);
      if (response.data.success) {
        alert("Shift added successfully!");
        getData();
        handleCloseAddModal();
      } else {
        alert(response.data.message || "Failed to add Shift.");
      }
    } catch (error) {
      console.error("Error adding Shift:", error);
      alert(error.response?.data?.message || "An error occurred while adding the Shift.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    // Confirmation before status changes — only prompted when actually
    // flipping Active -> Inactive, same spirit as other Master screens'
    // "inactive record" guard.
    if (originalActiveStatus && !ActiveStatus) {
      if (!window.confirm("This will mark the Shift as Inactive. Continue?")) {
        return;
      }
    }
    if (saving) return;
    setSaving(true);
    try {
      const data = {
        UserID,
        Shift_Id,
        Plant_Code: PlantCode,
        Shift_Name: Shift_Name.trim(),
        Start_Time,
        End_Time,
        Availability_Sec: Number(Availability_Sec),
        Active_Status: ActiveStatus,
      };
      const response = await getUpdates(data);
      if (response.data.success) {
        alert(response.data.message);
        getData();
        handleCloseEditModal();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error updating Shift:", error);
      alert(error.response?.data?.message || "An error occurred while updating the Shift. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderPlantOptions = () =>
    PlantTable.map((item) => (
      <MenuItem key={item.Plant_Id} value={String(item.Plant_Code)}>
        {item.Plant_Code} - {item.Plant_Name}
      </MenuItem>
    ));

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 90px)",
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
          Shift Master
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
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          getRowId={(row) => row.Shift_Id}
          onRowClick={handleRowClick}
          disableSelectionOnClick
          loading={loading}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No shifts found." }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd",
              color: "black",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "16px",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5",
              "&:hover": { backgroundColor: "#f5f5f5" },
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

      {/* Add Modal */}
      <Modal open={openAddModal} onClose={handleCloseAddModal}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            width: 440,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "8%",
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
            Add Shift Master
          </h3>

          <FormControl fullWidth>
            <InputLabel>Plant</InputLabel>
            <Select
              label="Plant"
              value={PlantCode}
              onChange={(e) => setPlantCode(e.target.value)}
              required
            >
              {renderPlantOptions()}
            </Select>
          </FormControl>

          <TextField
            label="Shift Name"
            value={Shift_Name}
            onChange={(e) => setShift_Name(e.target.value)}
            inputProps={{ maxLength: 50 }}
            required
          />

          <TextField
            label="Start Time"
            type="time"
            value={Start_Time}
            onChange={(e) => setStart_Time(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="End Time"
            type="time"
            value={End_Time}
            onChange={(e) => setEnd_Time(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="Availability (Sec)"
            value={Availability_Sec}
            type="text"
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) setAvailability_Sec(value);
            }}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success"
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f",
                    backgroundImage: "none !important",
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f",
                    borderColor: ActiveStatus ? "#2e7d32" : "#d32f2f",
                  },
                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"}
            labelPlacement="end"
            style={{
              color: ActiveStatus ? "#2e7d32" : "#d32f2f",
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
            <Button variant="contained" color="error" onClick={handleCloseAddModal}>
              Cancel
            </Button>
            <Button
              style={{ width: "90px" }}
              variant="contained"
              color="primary"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : "Add"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Edit Modal */}
      <Modal open={openEditModal} onClose={handleCloseEditModal}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            width: 440,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "8%",
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
            Edit Shift Master
          </h3>

          <FormControl fullWidth>
            <InputLabel>Plant</InputLabel>
            <Select
              label="Plant"
              value={PlantCode}
              onChange={(e) => setPlantCode(e.target.value)}
              required
            >
              {renderPlantOptions()}
            </Select>
          </FormControl>

          <TextField
            label="Shift Name"
            value={Shift_Name}
            onChange={(e) => setShift_Name(e.target.value)}
            inputProps={{ maxLength: 50 }}
            required
          />

          <TextField
            label="Start Time"
            type="time"
            value={Start_Time}
            onChange={(e) => setStart_Time(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="End Time"
            type="time"
            value={End_Time}
            onChange={(e) => setEnd_Time(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="Availability (Sec)"
            value={Availability_Sec}
            type="text"
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) setAvailability_Sec(value);
            }}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            required
          />

          <FormControlLabel
            control={
              <Switch
                checked={ActiveStatus}
                onChange={(e) => setActiveStatus(e.target.checked)}
                color="success"
                sx={{
                  "& .MuiSwitch-track": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f",
                    backgroundImage: "none !important",
                  },
                  "& .MuiSwitch-thumb": {
                    backgroundColor: ActiveStatus ? "#2e7d32" : "#d32f2f",
                    borderColor: ActiveStatus ? "#2e7d32" : "#d32f2f",
                  },
                }}
              />
            }
            label={ActiveStatus ? "Active" : "Inactive"}
            labelPlacement="end"
            style={{
              color: ActiveStatus ? "#2e7d32" : "#d32f2f",
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
            <Button variant="contained" color="error" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleUpdate} disabled={saving}>
              {saving ? <CircularProgress size={18} color="inherit" /> : "Update"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default Shift;
