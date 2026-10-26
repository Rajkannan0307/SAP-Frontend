import React, { useState, useEffect, useMemo, useRef } from "react";
import { TextField, Button, Dialog, Box, Chip, FormControlLabel, IconButton, MenuItem, Switch, Typography } from "@mui/material";
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { getWorkingDayDetails, addWorkingDays, updateWorkingDays } from "../controller/WorkingDaysApiService";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import FilterSelect from "../components/FilterSelect";
import UniqueGroupingInfo from "../components/UniqueGroupingInfo";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import { compactFieldSx, compactMenuProps, compactGridSx, primaryButtonSx, successButtonSx, outlineButtonSx } from "../components/compactUi";

const DIALOG_FIELD_SX = compactFieldSx("100%", 12);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// 'YYYY-MM' -> 'Oct 2026'
const monthLabel = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || ""));
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
};
// days of the month 'YYYY-MM'
const daysOfMonth = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || ""));
  return m ? new Date(Number(m[1]), Number(m[2]), 0).getDate() : 31;
};

// Compact select used by the Add dialog
const SelectField = ({ label, value, onChange, options }) => (
  <TextField select size="small" label={label} value={value} onChange={onChange} sx={DIALOG_FIELD_SX} SelectProps={{ MenuProps: compactMenuProps(12) }}>
    {options.map((o) => (
      <MenuItem key={o.value} value={o.value} sx={{ fontSize: 12 }}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>
);

const ActiveSwitch = ({ checked, onChange }) => (
  <FormControlLabel
    sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 700, color: checked ? "#2e7d32" : "#d32f2f" } }}
    control={
      <Switch
        size="small"
        checked={checked}
        onChange={onChange}
        color="success"
        sx={{
          "& .MuiSwitch-track": { backgroundColor: checked ? "#2e7d32" : "#d32f2f", opacity: 0.55 },
          "& .MuiSwitch-thumb": { backgroundColor: checked ? "#2e7d32" : "#d32f2f" },
        }}
      />
    }
    label={checked ? "Active" : "Inactive"}
  />
);

// Shell of the Add / Edit dialogs
const FormDialog = ({ open, title, onClose, children, actions }) => (
  <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width: 460, maxWidth: "94vw", borderRadius: "10px" } }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid #e8eaee", backgroundColor: "#f3f7ff" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1a2233" }}>{title}</Typography>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
    <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px 12px" }}>{children}</Box>
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, py: 1.25, borderTop: "1px solid #e8eaee" }}>{actions}</Box>
  </Dialog>
);

const WorkingDays = () => {
  const EmpId = localStorage.getItem("EmpId"); // the employee (gen_id): stored as created_by / modified_by
  const UserID = localStorage.getItem("UserID"); // the user id: used to check the plant
  const [rows, setRows] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fPlant, setFPlant] = useState("All");
  // the list opens on the current month and the user's own plant (both can be changed or cleared)
  const [fMonth, setFMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  const plantDefaulted = useRef(false);
  const [fStatus, setFStatus] = useState("All");
  const [pageModel, setPageModel] = useState({ page: 0, pageSize: 25 });

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [RowID, setRowID] = useState("");
  const [PlantID, setPlantID] = useState("");
  const [WorkMonth, setWorkMonth] = useState("");
  const [WorkingDaysCount, setWorkingDaysCount] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(true);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await getWorkingDayDetails();
      setRows(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    getMyPlants()
      .then((res) => setPlants(Array.isArray(res) ? res : []))
      .catch((error) => console.error("Failed to load Plant list.", error));
  }, []);

  // the user's own plant is selected once the plant list is loaded
  useEffect(() => {
    if (plantDefaulted.current || plants.length === 0) return;
    plantDefaulted.current = true;
    const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0];
    setFPlant(myPlantLabel(own));
  }, [plants]);

  const plantLabelOf = (row) => {
    const p = plants.find((x) => Number(x.Plant_ID) === Number(row.plant_id));
    return p ? myPlantLabel(p) : row.Plant_Code ? `${row.Plant_Code} - ${row.Plant_Name}` : "";
  };

  // only the plants this user may use (own + Data Access), the same rule as Vendor Master
  const scopedRows = useMemo(() => {
    const allowed = new Set(plants.map((p) => Number(p.Plant_ID)));
    return rows.filter((row) => allowed.has(Number(row.plant_id)));
  }, [rows, plants]);

  const visibleRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return scopedRows.filter((row) => {
      if (fPlant !== "All" && plantLabelOf(row) !== fPlant) return false;
      if (fMonth && row.work_month !== fMonth) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.active_status) return false;
      if (!text) return true;
      return [row.Plant_Code, row.Plant_Name, monthLabel(row.work_month), row.work_month, String(row.working_days)].some((v) => v && String(v).toLowerCase().includes(text));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedRows, searchText, fPlant, fMonth, fStatus, plants]);

  const activeFilterCount = fStatus !== "All" ? 1 : 0;
  const clearFilters = () => setFStatus("All");
  const plantFilterOptions = plants.map(myPlantLabel);
  const plantOptions = plants.map((p) => ({ value: p.Plant_ID, label: myPlantLabel(p) }));

  // SI No: the running number of the row in the list as shown (continues on the next page, follows the sort)
  const siColumn = {
    field: "si_no",
    headerName: "SI No",
    width: 70,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => pageModel.page * pageModel.pageSize + params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
  };
  const columns = [
    siColumn,
    { field: "plant_id", headerName: "Plant", flex: 1.2, minWidth: 150, valueGetter: (value, row) => plantLabelOf(row) },
    { field: "work_month", headerName: "Month", flex: 0.8, minWidth: 100, valueFormatter: (value) => monthLabel(value) },
    { field: "working_days", headerName: "Working Days", flex: 0.7, minWidth: 100, type: "number", headerAlign: "left", align: "left" },
    {
      field: "active_status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (value) => (value ? "Active" : "Inactive"),
      renderCell: (params) => {
        const isActive = !!params.row.active_status;
        return (
          <Chip
            size="small"
            label={isActive ? "Active" : "Inactive"}
            sx={{ height: 20, fontSize: 10.5, fontWeight: 700, backgroundColor: isActive ? "#eafaf1" : "#fdeeee", color: isActive ? "#1b7a43" : "#b42323" }}
          />
        );
      },
    },
    { field: "created_by", headerName: "Created By", flex: 0.7, minWidth: 90 },
    { field: "created_on", headerName: "Created On", flex: 0.8, minWidth: 110 },
    { field: "modified_by", headerName: "Modified By", flex: 0.7, minWidth: 90 },
    { field: "modified_on", headerName: "Modified On", flex: 0.8, minWidth: 110 },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const handleOpenAddModal = () => {
    const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0];
    setRowID("");
    setPlantID(own ? own.Plant_ID : "");
    setWorkMonth("");
    setWorkingDaysCount("");
    setActiveStatus(true);
    setOpenAddModal(true);
  };

  const handleRowClick = (params) => {
    setRowID(params.row.working_day_id);
    setPlantID(params.row.plant_id);
    setWorkMonth(params.row.work_month);
    setWorkingDaysCount(String(params.row.working_days));
    setActiveStatus(!!params.row.active_status);
    setOpenEditModal(true);
  };

  // the same rules as the API: a whole number from 0 up to the days of the month
  const daysError = () => {
    if (!/^\d+$/.test(String(WorkingDaysCount).trim())) return "Working Days must be a whole number.";
    const max = daysOfMonth(WorkMonth);
    if (Number(WorkingDaysCount) > max) return `Working Days cannot be more than ${max} (the days of that month).`;
    return "";
  };

  const handleAdd = async () => {
    if (!PlantID || !WorkMonth || String(WorkingDaysCount).trim() === "") {
      alert("Please fill in all required fields");
      return;
    }
    const err = daysError();
    if (err) {
      alert(err);
      return;
    }
    try {
      const response = await addWorkingDays({ UserID: EmpId, User_ID: UserID, plant_id: PlantID, work_month: WorkMonth, working_days: WorkingDaysCount, active_status: ActiveStatus });
      alert(response.data.message || "Working days added successfully.");
      getData();
      setOpenAddModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred while adding the working days.");
    }
  };

  const handleUpdate = async () => {
    if (String(WorkingDaysCount).trim() === "") {
      alert("Please fill in all required fields");
      return;
    }
    const err = daysError();
    if (err) {
      alert(err);
      return;
    }
    try {
      const response = await updateWorkingDays({ UserID: EmpId, User_ID: UserID, working_day_id: RowID, working_days: WorkingDaysCount, active_status: ActiveStatus });
      alert(response.data.message || "Working days updated successfully.");
      getData();
      setOpenEditModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred while updating the working days.");
    }
  };

  // Excel download of the list as shown
  const handleDownloadExcel = () => {
    if (visibleRows.length === 0) {
      alert("No Data Found");
      return;
    }
    const DataColumns = ["SI_No", "Plant", "Month", "Working_Days", "ActiveStatus", "Created_By", "Created_On", "Modified_By", "Modified_On"];
    const filteredData = visibleRows.map((item, i) => ({
      SI_No: i + 1,
      Plant: plantLabelOf(item),
      Month: monthLabel(item.work_month),
      Working_Days: item.working_days,
      ActiveStatus: item.active_status ? "Active" : "Inactive",
      Created_By: item.created_by || "",
      Created_On: item.created_on || "",
      Modified_By: item.modified_by || "",
      Modified_On: item.modified_on || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = DataColumns.map((c) => ({ wch: c === "SI_No" ? 8 : c === "Plant" ? 30 : 16 }));
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Working Days");
    XLSX.writeFile(workbook, "Working_Days_Data.xlsx");
  };

  const daysField = (
    <TextField
      size="small"
      label="Working Days"
      value={WorkingDaysCount}
      onChange={(e) => {
        const v = e.target.value;
        if (/^\d{0,2}$/.test(v)) setWorkingDaysCount(v);
      }}
      sx={DIALOG_FIELD_SX}
      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
    />
  );

  return (
    <div style={{ padding: "20px 20px", backgroundColor: "#F5F5F5", marginTop: "50px", display: "flex", flexDirection: "column", height: "calc(100vh - 50px)" }}>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>Working Days</Typography>

      {/* Search, filters and actions */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 6,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <FilterSelect label="Plant" value={fPlant} options={plantFilterOptions} onChange={setFPlant} minWidth={190} />
        <TextField
          size="small"
          placeholder="Search plant, month"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(240)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {visibleRows.length === scopedRows.length ? `${scopedRows.length} rows` : `${visibleRows.length} of ${scopedRows.length} rows`}
        </span>
        <Button onClick={handleDownloadExcel} variant="contained" disableElevation startIcon={<FaFileExcel size={13} />} sx={successButtonSx}>
          Excel
        </Button>
        <Button onClick={handleOpenAddModal} variant="contained" disableElevation startIcon={<AddIcon sx={{ fontSize: 16 }} />} sx={primaryButtonSx}>
          Add Working Days
        </Button>
        <UniqueGroupingInfo
          sections={[{ fields: ["Plant", "Month"] }]}
          intro="One row per combination of:"
          notes={[<>A second row for the same plant and month is rejected. Working Days: a whole number from 0 up to the days of that month. Plant and Month cannot be changed on Edit.</>]}
        />

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Status" value={fStatus} options={["Active", "Inactive"]} onChange={setFStatus} minWidth={120} isSearchable={false} />
        </FilterPanel>
      </div>

      {/* DataGrid */}
      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={visibleRows}
          loading={loading}
          columns={columns}
          getRowId={(row) => row.working_day_id}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ columns: { columnVisibilityModel: { created_by: false, created_on: false, modified_by: false, modified_on: false } } }}
          paginationModel={pageModel}
          onPaginationModelChange={setPageModel}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No working days found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add */}
      <FormDialog
        open={openAddModal}
        title="Add Working Days"
        onClose={() => setOpenAddModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpenAddModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleAdd} sx={{ ...primaryButtonSx, minWidth: 70 }}>Add</Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2" }}>
          <SelectField label="Plant" value={PlantID} onChange={(e) => setPlantID(e.target.value)} options={plantOptions} />
        </Box>
        <TextField size="small" type="month" label="Month" value={WorkMonth} onChange={(e) => setWorkMonth(e.target.value)} InputLabelProps={{ shrink: true }} sx={DIALOG_FIELD_SX} />
        {daysField}
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Edit: plant and month are the key and cannot be changed */}
      <FormDialog
        open={openEditModal}
        title="Edit Working Days"
        onClose={() => setOpenEditModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpenEditModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleUpdate} sx={{ ...primaryButtonSx, minWidth: 70 }}>Update</Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2" }}>
          <TextField size="small" label="Plant" value={plantLabelOf({ plant_id: PlantID })} sx={DIALOG_FIELD_SX} InputProps={{ readOnly: true }} />
        </Box>
        <TextField size="small" label="Month" value={monthLabel(WorkMonth)} sx={DIALOG_FIELD_SX} InputProps={{ readOnly: true }} />
        {daysField}
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>
    </div>
  );
};

export default WorkingDays;
