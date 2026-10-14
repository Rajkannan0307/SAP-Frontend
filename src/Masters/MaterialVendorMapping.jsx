import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TextField,
  Button,
  Dialog,
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  Typography,
  Autocomplete,
  createFilterOptions,
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
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { FaFileExcel, FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  getMappingDetails,
  getMappingMaterials,
  getMappingVendors,
  addMapping,
  updateMapping,
  uploadMapping,
} from "../controller/MaterialVendorMappingApiService";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import { findPlantsNotAllowed, plantsNotAllowedMessage } from "../common/plantFileCheck";
import FilterSelect from "../components/FilterSelect";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import {
  compactFieldSx,
  compactMenuProps,
  compactGridSx,
  primaryButtonSx,
  successButtonSx,
  outlineButtonSx,
} from "../components/compactUi";

// Material - Vendor Mapping master - laid out exactly like the User Master screen (title, search + filters + actions
// card, compact grid with a Status chip, compact Add / Edit dialogs with an Active / Inactive switch), built from the
// same shared pieces (compactUi, FilterPanel, FilterSelect).
// One row per Material + Vendor (a material can have several vendors). A mapping is never deleted: it is switched
// Active / Inactive. unit_pack_qty and lot_size must be > 0, sob (share of business, %) must be between 1 and 100.
// The backend enforces the same rules (and the duplicate Material + Vendor check).

const SEARCH_KEYS = ["Plant_Code", "Material_Code", "Material_Description", "Vendor_Code", "Vendor_Name"];
const DIALOG_FIELD_SX = compactFieldSx("100%", 12);

const POSITIVE_NUMBER = /^\d+(\.\d+)?$/;

const getMappingError = (unitPackQty, lotSize, sob) => {
  const check = (v) => (POSITIVE_NUMBER.test(String(v ?? "").trim()) ? Number(String(v).trim()) : NaN);
  if (!(check(unitPackQty) > 0)) return "Unit Pack Qty must be a number greater than 0.";
  if (!(check(lotSize) > 0)) return "Lot Size must be a number greater than 0.";
  const share = check(sob);
  if (!(share >= 1 && share <= 100)) return "SOB must be a number between 1 and 100 (percentage).";
  return "";
};

const fmtQty = (value) => (value === null || value === undefined || value === "" ? "" : Number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 }));

// thousands of materials per plant: filter as the user types and render only the first matches
const optionFilter = createFilterOptions({ limit: 200 });

// Compact select used by the dialogs
const SelectField = ({ label, value, onChange, options }) => (
  <TextField
    select
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    sx={DIALOG_FIELD_SX}
    SelectProps={{ MenuProps: compactMenuProps(12) }}
  >
    {options.map((o) => (
      <MenuItem key={o.value} value={o.value} sx={{ fontSize: 12 }}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>
);

const TextInput = ({ label, value, onChange, readOnly = false }) => (
  <TextField size="small" label={label} value={value} onChange={onChange} sx={DIALOG_FIELD_SX} InputProps={{ readOnly }} />
);

const NumberInput = ({ label, value, onChange, min = 0 }) => (
  <TextField
    size="small"
    type="number"
    label={label}
    value={value}
    onChange={onChange}
    sx={DIALOG_FIELD_SX}
    inputProps={{ min, step: "any" }}
  />
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

// Shell of the Add / Edit / Upload dialogs
const FormDialog = ({ open, title, onClose, children, actions }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    PaperProps={{ sx: { width: 460, maxWidth: "94vw", borderRadius: "10px" } }}
  >
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

const MaterialVendorMapping = () => {
  const UserID = localStorage.getItem("UserID");

  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only the plants this user may use (own plant + User Master > Data Access), each with its Division - the same
  // list (getMyPlants) and the same rule as the Manufacturing BOM screen.
  const [plants, setPlants] = useState([]);
  const [MaterialTable, setMaterialTable] = useState([]);
  const [VendorTable, setVendorTable] = useState([]);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [PlantId, setPlantId] = useState("");
  const [Material, setMaterial] = useState(null); // { Material_ID, Material_Code, Description }
  const [Vendor, setVendor] = useState(null); // { Vendor_ID, Vendor_Code, Vendor_Name }
  const [UnitPackQty, setUnitPackQty] = useState("");
  const [LotSize, setLotSize] = useState("");
  const [Sob, setSob] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(true);
  const [EditRow, setEditRow] = useState(null);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // filters (the search box above them works on the same rows)
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Plant: the dropdown holds the selection (starts on the user's own login plant), the Search button applies it
  const [plantSelect, setPlantSelect] = useState("All");
  const [fPlant, setFPlant] = useState("All"); // applied plant
  const plantDefaulted = useRef(false);
  const [fVendor, setFVendor] = useState("All");
  const [fStatus, setFStatus] = useState("All");

  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 0.6, minWidth: 70 },
    { field: "Material_Code", headerName: "Material Code", flex: 1, minWidth: 110 },
    { field: "Material_Description", headerName: "Material Description", flex: 1.6, minWidth: 160 },
    { field: "Vendor_Code", headerName: "Vendor Code", flex: 0.8, minWidth: 90 },
    { field: "Vendor_Name", headerName: "Vendor Name", flex: 1.4, minWidth: 140 },
    { field: "unit_pack_qty", headerName: "Unit Pack Qty", flex: 0.8, minWidth: 95, type: "number", valueFormatter: (value) => fmtQty(value) },
    { field: "lot_size", headerName: "Lot Size", flex: 0.7, minWidth: 80, type: "number", valueFormatter: (value) => fmtQty(value) },
    { field: "sob", headerName: "SOB (%)", flex: 0.6, minWidth: 75, type: "number", valueFormatter: (value) => fmtQty(value) },
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
            sx={{
              height: 20,
              fontSize: 10.5,
              fontWeight: 700,
              backgroundColor: isActive ? "#eafaf1" : "#fdeeee",
              color: isActive ? "#1b7a43" : "#b42323",
            }}
          />
        );
      },
    },
  ];

  const getData = async () => {
    setLoading(true);
    try {
      setData(await getMappingDetails());
    } catch (error) {
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Only the plants this user may use (own plant + Data Access plants), each with its Division
  useEffect(() => {
    getMyPlants()
      .then((res) => setPlants(Array.isArray(res) ? res : []))
      .catch((error) => console.error("Failed to load Plant list.", error));
  }, []);

  // The user's own login plant (Is_Default, the first one in the list) is selected and applied once, as soon as the
  // plant list is loaded; after that the user can switch to any other plant (or All) and press Search.
  useEffect(() => {
    if (plantDefaulted.current || plants.length === 0) return;
    plantDefaulted.current = true;
    const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0];
    const label = myPlantLabel(own);
    setPlantSelect(label);
    setFPlant(label);
  }, [plants]);

  // Search: apply the selected plant and reload the list
  const handleSearch = () => {
    setFPlant(plantSelect);
    getData();
  };

  // Material and Vendor lists belong to the chosen plant
  const loadPlantLists = async (plantId) => {
    setMaterial(null);
    setVendor(null);
    setMaterialTable([]);
    setVendorTable([]);
    if (!plantId) return;
    try {
      const [materials, vendors] = await Promise.all([getMappingMaterials(plantId), getMappingVendors(plantId)]);
      setMaterialTable(materials);
      setVendorTable(vendors);
    } catch (error) {
      console.error("Error loading materials / vendors:", error);
    }
  };

  // Same rule as the Manufacturing BOM: only the mappings of the plants this user may use (until the plant list is
  // loaded - or if it cannot be loaded - nothing is shown, never other plants' rows)
  const scopedData = useMemo(() => {
    const allowed = new Set(plants.map((p) => String(p.Plant_Code)));
    return (data || []).filter((row) => allowed.has(String(row.Plant_Code)));
  }, [data, plants]);

  // The Plant filter shows "1150 - RML P4 (RML)" (same label as the Manufacturing BOM) and filters by the plant code
  const plantFilterOptions = plants.map(myPlantLabel);
  const plantFilterCode = fPlant === "All" ? null : String(plants.find((p) => myPlantLabel(p) === fPlant)?.Plant_Code ?? "");

  // Search box + filters, applied live to the loaded mappings
  const rows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return scopedData.filter((row) => {
      if (plantFilterCode !== null && String(row.Plant_Code) !== plantFilterCode) return false;
      if (fVendor !== "All" && row.Vendor_Name !== fVendor) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.active_status) return false;
      if (!text) return true;
      return SEARCH_KEYS.some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [scopedData, searchText, plantFilterCode, fVendor, fStatus]);

  const uniq = (key) => [...new Set((scopedData || []).map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort();
  // the Plant filter sits in front of the search box (always visible); the badge / "Clear filters" are for the panel filters
  const activeFilterCount = [fVendor, fStatus].filter((v) => v !== "All").length;
  const clearFilters = () => {
    setFVendor("All");
    setFStatus("All");
  };

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // ✅ Handle Add Modal
  const handleOpenAddModal = () => {
    // start on the plant being viewed (or the user's own plant when "All" is shown); it can be changed in the dialog
    const start = (plantFilterCode !== null && plants.find((p) => String(p.Plant_Code) === plantFilterCode))
      || plants.find((p) => Number(p.Is_Default) === 1)
      || null;
    setPlantId(start ? start.Plant_ID : "");
    setMaterial(null);
    setVendor(null);
    setMaterialTable([]);
    setVendorTable([]);
    if (start) loadPlantLists(start.Plant_ID);
    setUnitPackQty("");
    setLotSize("");
    setSob("");
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleAdd = async () => {
    if (saving) return;
    if (!PlantId || !Material || !Vendor || UnitPackQty === "" || LotSize === "" || Sob === "") {
      alert("Please fill in all required fields");
      return;
    }
    const error = getMappingError(UnitPackQty, LotSize, Sob);
    if (error) {
      alert(error);
      return;
    }
    setSaving(true);
    try {
      const response = await addMapping({
        UserID,
        Material_ID: Material.Material_ID,
        Vendor_ID: Vendor.Vendor_ID,
        Unit_Pack_Qty: UnitPackQty,
        Lot_Size: LotSize,
        SOB: Sob,
        Active_Status: ActiveStatus,
      });
      if (response.data.success) {
        alert("Material - Vendor mapping added successfully!");
        getData();
        handleCloseAddModal();
      } else {
        alert(response.data.message || "Failed to add the mapping.");
      }
    } catch (err) {
      console.error("Error in adding mapping:", err);
      alert(err.response?.data?.message || "An error occurred while adding the mapping.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Handle Row Click for Edit (the Material and Vendor identify the mapping and cannot be changed)
  const handleRowClick = (params) => {
    setEditRow(params.row);
    setUnitPackQty(params.row.unit_pack_qty ?? "");
    setLotSize(params.row.lot_size ?? "");
    setSob(params.row.sob ?? "");
    setActiveStatus(Boolean(params.row.active_status));
    setOpenEditModal(true);
  };

  const handleUpdate = async () => {
    if (saving) return;
    const error = getMappingError(UnitPackQty, LotSize, Sob);
    if (error) {
      alert(error);
      return;
    }
    setSaving(true);
    try {
      const response = await updateMapping({
        UserID,
        Mapping_ID: EditRow.material_vendor_mapping_id,
        Unit_Pack_Qty: UnitPackQty,
        Lot_Size: LotSize,
        SOB: Sob,
        Active_Status: ActiveStatus,
      });
      if (response.data.success) {
        alert(response.data.message);
        getData();
        handleCloseEditModal();
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || "An error occurred while updating the mapping. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Excel download of the list ----------
  const handleDownloadExcel = () => {
    if (scopedData.length === 0) {
      alert("No Data Found");
      return;
    }
    const DataColumns = ["Plant_Code", "Material_Code", "Material_Description", "Vendor_Code", "Vendor_Name", "Unit_Pack_Qty", "Lot_Size", "SOB", "ActiveStatus"];
    const filteredData = scopedData.map((item) => ({ // only the plants this user may use
      Plant_Code: item.Plant_Code,
      Material_Code: item.Material_Code,
      Material_Description: item.Material_Description,
      Vendor_Code: item.Vendor_Code,
      Vendor_Name: item.Vendor_Name,
      Unit_Pack_Qty: item.unit_pack_qty,
      Lot_Size: item.lot_size,
      SOB: item.sob,
      ActiveStatus: item.active_status ? "Active" : "Inactive",
    }));
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 36 }, { wch: 16 }, { wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 16 }];
    DataColumns.forEach((_, index) => {
      const cell = worksheet[XLSX.utils.encode_cell({ c: index, r: 0 })];
      if (cell) {
        cell.s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
      }
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Material Vendor Mapping");
    XLSX.writeFile(workbook, "Material_Vendor_Mapping.xlsx");
  };

  // ---------- Bulk upload ----------
  const handleOpenUploadModal = () => {
    setUploadedFile(null);
    setOpenUploadModal(true);
  };
  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
    setUploadedFile(null);
    setIsUploading(false);
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MATERIAL_VENDOR_MAPPING";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("MAPPING");
    worksheet.addRow(["Plant_Code", "Material_Code", "Vendor_Code", "Unit_Pack_Qty", "Lot_Size", "SOB", "Active_Status"]);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFADD8E6" } };
    });
    worksheet.columns = [{ width: 14 }, { width: 22 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 10 }, { width: 14 }];
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.getCell("F1").note = "Share of business in percent: a number from 1 to 100.";
    worksheet.getCell("G1").note = "Optional: Active or Inactive. Blank = Active for a new mapping, unchanged for an existing one.";

    const plantCodes = (plants || []).map((p) => `${p.Plant_Code}`); // only the plants this user may use
    if (plantCodes.length) {
      worksheet.dataValidations.add("A2:A1000", { type: "list", allowBlank: false, formulae: [`"${plantCodes.join(",")}"`] });
    }
    worksheet.dataValidations.add("D2:E1000", {
      type: "decimal", operator: "greaterThan", formulae: [0], allowBlank: false,
      showErrorMessage: true, errorTitle: "Invalid value", error: "Enter a number greater than 0.",
    });
    worksheet.dataValidations.add("F2:F1000", {
      type: "decimal", operator: "between", formulae: [1, 100], allowBlank: false,
      showErrorMessage: true, errorTitle: "Invalid SOB", error: "SOB must be a number from 1 to 100.",
    });
    worksheet.dataValidations.add("G2:G1000", { type: "list", allowBlank: true, formulae: ['"Active,Inactive"'] });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "MaterialVendorMapping_Template.xlsx"
    );
  };

  // log of the upload: new / updated / error rows (errors carry the Excel row number and the reason)
  const downloadUploadLog = (newRecord, updateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();
    const okColumns = ["Row_No", "Plant_Code", "Material_Code", "Vendor_Code", "Unit_Pack_Qty", "Lot_Size", "SOB", "ActiveStatus", "Status"];
    const errColumns = ["Row_No", "Plant_Code", "Material_Code", "Vendor_Code", "Unit_Pack_Qty", "Lot_Size", "SOB", "Active_Status", "Error"];

    const toOk = (item) => ({
      Row_No: item.Row_No, Plant_Code: item.Plant_Code, Material_Code: item.Material_Code, Vendor_Code: item.Vendor_Code,
      Unit_Pack_Qty: item.unit_pack_qty, Lot_Size: item.lot_size, SOB: item.sob,
      ActiveStatus: item.active_status ? "Active" : "Inactive", Status: item.Status,
    });
    const toErr = (item) => ({
      Row_No: item.Row_No, Plant_Code: item.Plant_Code, Material_Code: item.Material_Code, Vendor_Code: item.Vendor_Code,
      Unit_Pack_Qty: item.Unit_Pack_Qty, Lot_Size: item.Lot_Size, SOB: item.SOB, Active_Status: item.Active_Status, Error: item.Row_Error,
    });

    const addSheet = (sheetRows, columns, name, isError = false) => {
      const sheetData = sheetRows.length ? sheetRows : [{}];
      const ws = XLSX.utils.json_to_sheet(sheetData, { header: columns });
      columns.forEach((_, index) => {
        const cell = ws[XLSX.utils.encode_cell({ c: index, r: 0 })];
        if (cell) cell.s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
      });
      if (isError) {
        const errIdx = columns.indexOf("Error");
        for (let r = 1; r <= sheetRows.length; r++) {
          const cell = ws[XLSX.utils.encode_cell({ c: errIdx, r })];
          if (cell) cell.s = { font: { color: { rgb: "FF0000" } } };
        }
      }
      ws["!cols"] = columns.map((c) => ({ wch: c === "Error" ? 60 : 16 }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet(newRecord.map(toOk), okColumns, "New Records");
    addSheet(updateRecord.map(toOk), okColumns, "Updated Records");
    addSheet(errRecord.map(toErr), errColumns, "Error Records", true);
    XLSX.writeFile(wb, "Material Vendor Mapping Upload Log.xlsx");
  };

  const handleUploadData = async () => {
    if (!uploadedFile) {
      alert("Please select a file first.");
      return;
    }
    if (isUploading) return;
    setIsUploading(true);
    try {
      // Only plants this user may use (own + Data Access): check the Plant_Code column of the file before uploading
      const { blocked, plants: myPlants } = await findPlantsNotAllowed(uploadedFile, "Plant_Code");
      if (blocked.length > 0) {
        alert(plantsNotAllowedMessage(blocked, myPlants));
        setIsUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append("User_Add", uploadedFile);
      formData.append("UserID", UserID);
      const response = await uploadMapping(formData);
      alert(response.data.message);
      const { NewRecord = [], UpdatedData = [], ErrorRecords = [] } = response.data;
      if (NewRecord.length > 0 || UpdatedData.length > 0 || ErrorRecords.length > 0) {
        downloadUploadLog(NewRecord, UpdatedData, ErrorRecords);
      }
      getData();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        const blank = error.response.data.invalidData;
        alert(
          blank?.length
            ? `${error.response.data.message} (Excel rows: ${blank.slice(0, 20).map((r) => r.Row_No).join(", ")}${blank.length > 20 ? ", ..." : ""})`
            : error.response.data.message
        );
      } else {
        alert("Error while processing the file.");
      }
    }
    handleCloseUploadModal();
  };

  // dropdown option list of the Add dialog
  const plantOptions = plants.map((p) => ({ value: p.Plant_ID, label: myPlantLabel(p) }));

  // the Material / Vendor pickers (search as you type) share one compact look
  const pickerProps = {
    size: "small",
    sx: DIALOG_FIELD_SX,
    ListboxProps: { style: { fontSize: 12 } },
    filterOptions: optionFilter,
  };

  return (
    <div
      style={{
        padding: "20px 20px",
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 50px)",
      }}
    >
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>
        Material - Vendor Mapping
      </Typography>

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
        <FilterSelect
          label="Plant"
          value={plantSelect}
          options={plantFilterOptions}
          onChange={setPlantSelect}
          minWidth={190}
        />
        <Button
          onClick={handleSearch}
          disabled={loading}
          variant="contained"
          disableElevation
          startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 16 }} />}
          sx={primaryButtonSx}
        >
          {loading ? "Loading..." : "Search"}
        </Button>
        <TextField
          size="small"
          placeholder="Search plant, material, description, vendor"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {rows.length === scopedData.length ? `${scopedData.length} mappings` : `${rows.length} of ${scopedData.length} mappings`}
        </span>
        <Button
          onClick={handleOpenUploadModal}
          variant="outlined"
          disableElevation
          startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
          sx={outlineButtonSx}
        >
          Upload
        </Button>
        <Button
          onClick={handleDownloadExcel}
          variant="contained"
          disableElevation
          startIcon={<FaFileExcel size={13} />}
          sx={successButtonSx}
        >
          Excel
        </Button>
        <Button
          onClick={handleOpenAddModal}
          variant="contained"
          disableElevation
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          sx={primaryButtonSx}
        >
          Add Mapping
        </Button>

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Vendor" value={fVendor} options={uniq("Vendor_Name")} onChange={setFVendor} minWidth={220} />
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
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.material_vendor_mapping_id}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          disableColumnMenu
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No mappings found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add Mapping */}
      <FormDialog
        open={openAddModal}
        title="Add Material - Vendor Mapping"
        onClose={handleCloseAddModal}
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseAddModal} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleAdd} disabled={saving} sx={{ ...primaryButtonSx, minWidth: 70 }}>
              {saving ? "Saving..." : "Add"}
            </Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2" }}>
          <SelectField
            label="Plant"
            value={PlantId}
            onChange={(e) => {
              setPlantId(e.target.value);
              loadPlantLists(e.target.value);
            }}
            options={plantOptions}
          />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <Autocomplete
            {...pickerProps}
            disabled={!PlantId}
            options={MaterialTable}
            value={Material}
            onChange={(e, newVal) => setMaterial(newVal)}
            getOptionLabel={(m) => (m ? `${m.Material_Code} - ${m.Description || ""}` : "")}
            isOptionEqualToValue={(o, v) => o.Material_ID === v.Material_ID}
            noOptionsText={PlantId ? "No direct materials found" : "Select a plant first"}
            renderInput={(params) => <TextField {...params} label="Material" placeholder={PlantId ? "Search by code or description" : "Select a plant first"} />}
          />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <Autocomplete
            {...pickerProps}
            disabled={!PlantId}
            options={VendorTable}
            value={Vendor}
            onChange={(e, newVal) => setVendor(newVal)}
            getOptionLabel={(v) => (v ? `${v.Vendor_Code} - ${v.Vendor_Name || ""}` : "")}
            isOptionEqualToValue={(o, v) => o.Vendor_ID === v.Vendor_ID}
            noOptionsText={PlantId ? "No active vendors found" : "Select a plant first"}
            renderInput={(params) => <TextField {...params} label="Vendor" placeholder={PlantId ? "Search by code or name" : "Select a plant first"} />}
          />
        </Box>
        <NumberInput label="Unit Pack Qty" value={UnitPackQty} onChange={(e) => setUnitPackQty(e.target.value)} />
        <NumberInput label="Lot Size" value={LotSize} onChange={(e) => setLotSize(e.target.value)} />
        <NumberInput label="SOB (1 - 100 %)" value={Sob} onChange={(e) => setSob(e.target.value)} min={1} />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Edit Mapping */}
      <FormDialog
        open={openEditModal}
        title="Edit Material - Vendor Mapping"
        onClose={handleCloseEditModal}
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseEditModal} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleUpdate} disabled={saving} sx={{ ...primaryButtonSx, minWidth: 70 }}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2" }}>
          <TextInput label="Plant" value={EditRow?.Plant_Code ?? ""} readOnly />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <TextInput label="Material" value={EditRow ? `${EditRow.Material_Code} - ${EditRow.Material_Description || ""}` : ""} readOnly />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <TextInput label="Vendor" value={EditRow ? `${EditRow.Vendor_Code} - ${EditRow.Vendor_Name || ""}` : ""} readOnly />
        </Box>
        <NumberInput label="Unit Pack Qty" value={UnitPackQty} onChange={(e) => setUnitPackQty(e.target.value)} />
        <NumberInput label="Lot Size" value={LotSize} onChange={(e) => setLotSize(e.target.value)} />
        <NumberInput label="SOB (1 - 100 %)" value={Sob} onChange={(e) => setSob(e.target.value)} min={1} />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Upload */}
      <FormDialog
        open={openUploadModal}
        title="Material - Vendor Mapping Excel Upload"
        onClose={handleCloseUploadModal}
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseUploadModal} sx={outlineButtonSx}>Close</Button>
            <Button variant="contained" disableElevation onClick={handleUploadData} disabled={isUploading} sx={{ ...primaryButtonSx, minWidth: 70 }}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Box>
            <Button variant="outlined" onClick={downloadTemplate} startIcon={<FaDownload size={12} />} sx={outlineButtonSx}>
              Download Template
            </Button>
          </Box>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setUploadedFile(e.target.files[0])}
            style={{
              fontSize: 11,
              padding: "6px 8px",
              backgroundColor: "#fafbfc",
              border: "1px dashed #dde1e7",
              borderRadius: 6,
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: 11, lineHeight: 1.5, color: "#6b7280" }}>
            Columns: Plant_Code, Material_Code, Vendor_Code, Unit_Pack_Qty, Lot_Size, SOB and an optional Active_Status (Active / Inactive).
            A Material + Vendor that is already mapped is updated; a new one is added. Rows with errors are skipped and listed in the log file.
          </span>
        </Box>
      </FormDialog>
    </div>
  );
};

export default MaterialVendorMapping;
