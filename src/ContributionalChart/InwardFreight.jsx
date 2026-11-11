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
  getFreightDetails,
  getFreightParts,
  getFreightVendors,
  addFreight,
  updateFreight,
  uploadFreight,
} from "../controller/InwardFreightApiService";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import { findPlantsNotAllowed, plantsNotAllowedMessage } from "../common/plantFileCheck";
import FilterSelect from "../components/FilterSelect";
import ValidationResponseGrid from "../components/ValidationResponseTable";
import UniqueGroupingInfo from "../components/UniqueGroupingInfo";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import {
  compactFieldSx,
  compactMenuProps,
  compactGridSx,
  primaryButtonSx,
  successButtonSx,
  outlineButtonSx,
} from "../components/compactUi";

// Inward Freight (DCM menu) - laid out like the Material - Vendor Mapping screen (title, search + filters + actions card,
// compact grid with a Status chip, compact Add / Edit dialogs with an Active / Inactive switch, Excel upload with a template).
// One row per Plant + Part No + Vendor Code + Effective Date month and year. Transport Mode is ROAD or SEA only; Frt Inward is a number
// greater than 0. A row is never deleted: it is switched Active / Inactive. The backend enforces the same rules (and the
// duplicate check); Plant / Part No (of that plant) / Vendor Code must exist in their masters.

const SEARCH_KEYS = ["Plant_Code", "part_no", "Part_Description", "vendor_code", "Vendor_Name"];
const DIALOG_FIELD_SX = compactFieldSx("100%", 12);
const MODES = ["ROAD", "SEA"];
const NON_NEGATIVE_NUMBER = /^\d+(\.\d+)?$/;
const UPLOAD_COLUMNS = ["Plant", "Part No", "Transport Mode", "Vendor Code", "Frt Inward", "Effective Date"];

const getFreightError = (mode, frt) => {
  if (!MODES.includes(String(mode).trim().toUpperCase())) return "Transport Mode must be ROAD or SEA.";
  const t = String(frt ?? "").trim();
  if (!NON_NEGATIVE_NUMBER.test(t) || !(Number(t) > 0)) return "Frt Inward must be a number greater than 0.";
  return "";
};

const fmtFrt = (value) => (value === null || value === undefined || value === "" ? "" : Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 }));
// 2026-04-01T00:00:00.000Z / 2026-04-01 -> 01.04.2026 (the format of the template)
const fmtDate = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
};
const isoDate = (value) => (/^\d{4}-\d{2}-\d{2}/.test(String(value ?? "")) ? String(value).slice(0, 10) : "");

// thousands of parts per plant: filter as the user types and render only the first matches
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
const FormDialog = ({ open, title, onClose, children, actions, width = 460, gap = "14px 12px" }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    PaperProps={{ sx: { width, maxWidth: "94vw", borderRadius: "10px" } }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid #e8eaee", backgroundColor: "#f3f7ff" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1a2233" }}>{title}</Typography>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
    <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap }}>{children}</Box>
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, py: 1.25, borderTop: "1px solid #e8eaee" }}>{actions}</Box>
  </Dialog>
);

const InwardFreight = () => {
  const UserID = localStorage.getItem("EmpId"); // the employee (gen_id): stored as created_by / modified_by (VARCHAR)

  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only the plants this user may use (own plant + User Master > Data Access), the same list as the other screens
  const [plants, setPlants] = useState([]);
  const [PartTable, setPartTable] = useState([]);
  const [VendorTable, setVendorTable] = useState([]);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [PlantId, setPlantId] = useState("");
  const [Part, setPart] = useState(null); // { Material_ID, Material_Code, Description }
  const [Vendor, setVendor] = useState(null); // { Vendor_Code, Vendor_Name }
  const [TransportMode, setTransportMode] = useState("");
  const [FrtInward, setFrtInward] = useState("");
  const [EffectiveDate, setEffectiveDate] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(true);
  const [EditRow, setEditRow] = useState(null);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProblems, setUploadProblems] = useState(null); // the wrong rows of the last upload, shown in the shared validation grid
  const [uploadLog, setUploadLog] = useState(null); // result of the last upload; the user downloads it with the Download Log button

  // filters (the search box above them works on the same rows)
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Plant: the dropdown holds the selection (starts on the user's own login plant), the Search button applies it
  const [plantSelect, setPlantSelect] = useState("All");
  const [fPlant, setFPlant] = useState("All"); // applied plant
  const plantDefaulted = useRef(false);
  const [fMode, setFMode] = useState("All");
  const [fVendor, setFVendor] = useState("All");
  const [fStatus, setFStatus] = useState("All");

  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 0.6, minWidth: 70 },
    { field: "part_no", headerName: "Part No", flex: 1, minWidth: 110 },
    { field: "Part_Description", headerName: "Part Description", flex: 1.6, minWidth: 160 },
    { field: "transport_mode", headerName: "Transport Mode", flex: 0.8, minWidth: 100 },
    { field: "vendor_code", headerName: "Vendor Code", flex: 0.8, minWidth: 100 },
    { field: "Vendor_Name", headerName: "Vendor Name", flex: 1.3, minWidth: 130 },
    { field: "frt_inward", headerName: "Frt Inward", flex: 0.8, minWidth: 95, type: "number", valueFormatter: (value) => fmtFrt(value) },
    { field: "effective_date", headerName: "Effective Date", flex: 0.8, minWidth: 100, valueFormatter: (value) => fmtDate(value) },
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
      setData(await getFreightDetails());
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

  // The user's own login plant is selected and applied once, as soon as the plant list is loaded; after that the
  // user can switch to any other plant (or All) and press Search.
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

  // The Part No and Vendor Code lists belong to the chosen plant (a vendor belongs to a plant)
  const loadParts = async (plantId) => {
    setPart(null);
    setVendor(null);
    setPartTable([]);
    setVendorTable([]);
    if (!plantId) return;
    try {
      const [parts, vendors] = await Promise.all([getFreightParts(plantId), getFreightVendors(plantId)]);
      setPartTable(parts);
      setVendorTable(vendors);
    } catch (error) {
      console.error("Error loading parts / vendors:", error);
    }
  };

  // Only the rows of the plants this user may use (until the plant list is loaded - or if it cannot be loaded -
  // nothing is shown, never other plants' rows)
  const scopedData = useMemo(() => {
    const allowed = new Set(plants.map((p) => String(p.Plant_Code)));
    return (data || []).filter((row) => allowed.has(String(row.Plant_Code)));
  }, [data, plants]);

  const plantFilterOptions = plants.map(myPlantLabel);
  const plantFilterCode = fPlant === "All" ? null : String(plants.find((p) => myPlantLabel(p) === fPlant)?.Plant_Code ?? "");

  // Search box + filters, applied live to the loaded rows
  const rows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return scopedData.filter((row) => {
      if (plantFilterCode !== null && String(row.Plant_Code) !== plantFilterCode) return false;
      if (fMode !== "All" && row.transport_mode !== fMode) return false;
      if (fVendor !== "All" && String(row.vendor_code) !== fVendor) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.active_status) return false;
      if (!text) return true;
      return SEARCH_KEYS.some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [scopedData, searchText, plantFilterCode, fMode, fVendor, fStatus]);

  const uniq = (key) => [...new Set((scopedData || []).map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort();
  // the Plant filter sits in front of the search box (always visible); the badge / "Clear filters" are for the panel filters
  const activeFilterCount = [fMode, fVendor, fStatus].filter((v) => v !== "All").length;
  const clearFilters = () => {
    setFMode("All");
    setFVendor("All");
    setFStatus("All");
  };

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // ---------- Add ----------
  const handleOpenAddModal = () => {
    // start on the plant being viewed (or the user's own plant when "All" is shown); it can be changed in the dialog
    const start = (plantFilterCode !== null && plants.find((p) => String(p.Plant_Code) === plantFilterCode))
      || plants.find((p) => Number(p.Is_Default) === 1)
      || null;
    setPlantId(start ? start.Plant_ID : "");
    setPart(null);
    setPartTable([]);
    if (start) loadParts(start.Plant_ID);
    setVendor(null);
    setTransportMode("");
    setFrtInward("");
    setEffectiveDate("");
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleAdd = async () => {
    if (saving) return;
    if (!PlantId || !Part || !Vendor || !TransportMode || FrtInward === "" || !EffectiveDate) {
      alert("Please fill in all required fields");
      return;
    }
    const error = getFreightError(TransportMode, FrtInward);
    if (error) {
      alert(error);
      return;
    }
    setSaving(true);
    try {
      const response = await addFreight({
        UserID,
        Plant_ID: PlantId,
        Material_ID: Part.Material_ID,
        Vendor_ID: Vendor.Vendor_ID,
        Transport_Mode: TransportMode,
        Frt_Inward: FrtInward,
        Effective_Date: EffectiveDate,
        Active_Status: ActiveStatus,
      });
      if (response.data.success) {
        alert("Inward Freight added successfully!");
        getData();
        handleCloseAddModal();
      } else {
        alert(response.data.message || "Failed to add the Inward Freight.");
      }
    } catch (err) {
      console.error("Error in adding Inward Freight:", err);
      alert(err.response?.data?.message || "An error occurred while adding the Inward Freight.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Edit (Plant, Part No, Vendor Code and Effective Date identify the row and cannot be changed) ----------
  const handleRowClick = (params) => {
    setEditRow(params.row);
    setTransportMode(params.row.transport_mode ?? "");
    setFrtInward(params.row.frt_inward ?? "");
    setActiveStatus(Boolean(params.row.active_status));
    setOpenEditModal(true);
  };

  const handleUpdate = async () => {
    if (saving) return;
    const error = getFreightError(TransportMode, FrtInward);
    if (error) {
      alert(error);
      return;
    }
    setSaving(true);
    try {
      const response = await updateFreight({
        UserID,
        Inward_Freight_ID: EditRow.inward_freight_id,
        Transport_Mode: TransportMode,
        Frt_Inward: FrtInward,
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
      alert(err.response?.data?.message || "An error occurred while updating the Inward Freight. Please try again.");
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
    const DataColumns = ["Plant", "Part No", "Part Description", "Transport Mode", "Vendor Code", "Vendor Name", "Frt Inward", "Effective Date", "Active Status"];
    const filteredData = scopedData.map((item) => ({ // only the plants this user may use
      "Plant": item.Plant_Code,
      "Part No": item.part_no,
      "Part Description": item.Part_Description,
      "Transport Mode": item.transport_mode,
      "Vendor Code": item.vendor_code,
      "Vendor Name": item.Vendor_Name,
      "Frt Inward": item.frt_inward,
      "Effective Date": fmtDate(item.effective_date),
      "Active Status": item.active_status ? "Active" : "Inactive",
    }));
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 34 }, { wch: 16 }, { wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    DataColumns.forEach((_, index) => {
      const cell = worksheet[XLSX.utils.encode_cell({ c: index, r: 0 })];
      if (cell) {
        cell.s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
      }
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inward Freight");
    XLSX.writeFile(workbook, "Inward_Freight.xlsx");
  };

  // ---------- Bulk upload ----------
  const handleOpenUploadModal = () => {
    setUploadedFile(null);
    setUploadProblems(null);
    setUploadLog(null);
    setOpenUploadModal(true);
  };
  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
    setUploadedFile(null);
    setUploadProblems(null);
    setUploadLog(null);
    setIsUploading(false);
  };

  // the template = the first sheet of "FG wise Delivery cost details": the same six columns, Effective Date as dd.MM.yyyy text
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "INWARD_FREIGHT";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("Inward Freight");
    worksheet.addRow(UPLOAD_COLUMNS);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFADD8E6" } };
    });
    worksheet.columns = [{ width: 10 }, { width: 18 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 16 }];
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.getCell("C1").note = "ROAD or SEA only.";
    worksheet.getCell("E1").note = "Freight amount: a number greater than 0.";
    worksheet.getCell("F1").note = "Date as dd.MM.yyyy, for example 01.04.2026.";
    worksheet.getColumn(6).numFmt = "@"; // text, so the date stays dd.MM.yyyy

    const plantCodes = (plants || []).map((p) => `${p.Plant_Code}`); // only the plants this user may use
    if (plantCodes.length) {
      worksheet.dataValidations.add("A2:A5000", { type: "list", allowBlank: false, formulae: [`"${plantCodes.join(",")}"`] });
    }
    worksheet.dataValidations.add("C2:C5000", {
      type: "list", allowBlank: false, formulae: ['"ROAD,SEA"'],
      showErrorMessage: true, errorTitle: "Invalid Transport Mode", error: "Choose ROAD or SEA.",
    });
    worksheet.dataValidations.add("E2:E5000", {
      type: "decimal", operator: "greaterThan", formulae: [0], allowBlank: false,
      showErrorMessage: true, errorTitle: "Invalid value", error: "Enter a number greater than 0.",
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "InwardFreight_Template.xlsx"
    );
  };

  // log of the upload: new / updated / error rows (errors carry the Excel row number and the reason)
  const downloadUploadLog = (newRecord, updateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();
    const okColumns = ["Row No", "Plant", "Part No", "Transport Mode", "Vendor Code", "Frt Inward", "Effective Date", "Active Status", "Status"];
    const errColumns = ["Row No", "Plant", "Part No", "Transport Mode", "Vendor Code", "Frt Inward", "Effective Date", "Active Status", "Error"];

    const toOk = (item) => ({
      "Row No": item.Row_No, "Plant": item.Plant, "Part No": item.Part_No, "Transport Mode": item.Transport_Mode,
      "Vendor Code": item.Vendor_Code, "Frt Inward": item.Frt_Inward, "Effective Date": fmtDate(item.Effective_Date),
      "Active Status": item.active_status ? "Active" : "Inactive", "Status": item.Status,
    });
    const toErr = (item) => ({
      "Row No": item.Row_No, "Plant": item.Plant, "Part No": item.Part_No, "Transport Mode": item.Transport_Mode,
      "Vendor Code": item.Vendor_Code, "Frt Inward": item.Frt_Inward, "Effective Date": fmtDate(item.Effective_Date) || item.Effective_Date,
      "Active Status": item.Active_Status, "Error": String(item.Row_Error ?? "").split(" | ").join("\n"),
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
    XLSX.writeFile(wb, "Inward Freight Upload Log.xlsx");
  };

  const handleUploadData = async () => {
    if (!uploadedFile) {
      alert("Please select a file first.");
      return;
    }
    if (isUploading) return;
    setIsUploading(true);
    try {
      // Only plants this user may use (own + Data Access): check the Plant column of the file before uploading
      const { blocked, plants: myPlants } = await findPlantsNotAllowed(uploadedFile, "Plant");
      if (blocked.length > 0) {
        alert(plantsNotAllowedMessage(blocked, myPlants));
        setIsUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append("User_Add", uploadedFile);
      formData.append("UserID", UserID);
      const response = await uploadFreight(formData);
      const { NewRecord = [], UpdatedData = [], ErrorRecords = [] } = response.data;
      // no alert: the message and the result stay in the dialog; the log is NOT downloaded automatically, the user can download it
      setUploadLog({ newRecord: NewRecord, updateRecord: UpdatedData, errRecord: ErrorRecords, message: response.data.message, total: response.data.TotalRows ?? 0 });
      getData();
      if (ErrorRecords.length > 0) {
        // nothing was saved: the wrong rows stay on the screen, in the same grid as the other upload screens
        setUploadProblems({
          // Valid = rows that passed the checks (they are NOT saved while any row has an error)
          summary: { totalRows: response.data.TotalRows ?? ErrorRecords.length, validRows: Math.max((response.data.TotalRows ?? ErrorRecords.length) - ErrorRecords.length, 0), invalidRows: ErrorRecords.length },
          invalidTable: ErrorRecords.map((e) => ({
            row: e.Row_No,
            data: { Plant: e.Plant, "Part No": e.Part_No, "Transport Mode": e.Transport_Mode, "Vendor Code": e.Vendor_Code, "Frt Inward": e.Frt_Inward, "Effective Date": fmtDate(e.Effective_Date) || e.Effective_Date },
            errors: String(e.Row_Error ?? "").split(" | "), // one line per wrong column, e.g. "Vendor Code: not found in the Vendor Master"
          })),
        });
      }
      setIsUploading(false);
      return;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message);
      } else {
        alert("Error while processing the file.");
      }
    }
    handleCloseUploadModal();
  };

  // dropdown option list of the Add dialog
  const plantOptions = plants.map((p) => ({ value: p.Plant_ID, label: myPlantLabel(p) }));
  const modeOptions = MODES.map((m) => ({ value: m, label: m }));

  // the Part No / Vendor pickers (search as you type) share one compact look
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
        Inward Freight
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
          placeholder="Search plant, part no, vendor"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {rows.length === scopedData.length ? `${scopedData.length} rows` : `${rows.length} of ${scopedData.length} rows`}
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
          Add Freight
        </Button>
        <UniqueGroupingInfo
          sections={[{ fields: ["Plant", "Part No", "Vendor Code", "Effective Date (month and year)"] }]}
          intro="One row per combination of:"
          notes={[
            <><b>Add:</b> a combination that already exists for that month and year is rejected (if that row is Inactive, switch it to Active in the list).</>,
            <><b>Bulk upload:</b> the same combination (month and year) is <b>updated</b>, any other is <b>added</b>. A row is never deleted - switch it Active / Inactive.</>,
          ]}
        />

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Transport Mode" value={fMode} options={MODES} onChange={setFMode} minWidth={140} isSearchable={false} />
          <FilterSelect label="Vendor Code" value={fVendor} options={uniq("vendor_code")} onChange={setFVendor} minWidth={160} />
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
          getRowId={(row) => row.inward_freight_id}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No Inward Freight found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add */}
      <FormDialog
        open={openAddModal}
        title="Add Inward Freight"
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
              loadParts(e.target.value);
            }}
            options={plantOptions}
          />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <Autocomplete
            {...pickerProps}
            disabled={!PlantId}
            options={PartTable}
            value={Part}
            onChange={(e, newVal) => setPart(newVal)}
            getOptionLabel={(m) => (m ? `${m.Material_Code} - ${m.Description || ""}` : "")}
            isOptionEqualToValue={(o, v) => o.Material_ID === v.Material_ID}
            noOptionsText={PlantId ? "No active materials found" : "Select a plant first"}
            renderInput={(params) => <TextField {...params} label="Part No" placeholder={PlantId ? "Search by code or description" : "Select a plant first"} />}
          />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <Autocomplete
            {...pickerProps}
            disabled={!PlantId}
            options={VendorTable}
            value={Vendor}
            onChange={(e, newVal) => setVendor(newVal)}
            getOptionLabel={(c) => (c ? `${c.Vendor_Code} - ${c.Vendor_Name || ""}` : "")}
            isOptionEqualToValue={(o, v) => o.Vendor_ID === v.Vendor_ID}
            noOptionsText={PlantId ? "No active vendors found" : "Select a plant first"}
            renderInput={(params) => <TextField {...params} label="Vendor Code" placeholder={PlantId ? "Search by code or name" : "Select a plant first"} />}
          />
        </Box>
        <SelectField label="Transport Mode" value={TransportMode} onChange={(e) => setTransportMode(e.target.value)} options={modeOptions} />
        <NumberInput label="Frt Inward" value={FrtInward} onChange={(e) => setFrtInward(e.target.value)} />
        <TextField
          size="small"
          type="date"
          label="Effective Date"
          value={EffectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          sx={DIALOG_FIELD_SX}
          InputLabelProps={{ shrink: true }}
        />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Edit */}
      <FormDialog
        open={openEditModal}
        title="Edit Inward Freight"
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
          <TextInput label="Part No" value={EditRow ? `${EditRow.part_no} - ${EditRow.Part_Description || ""}` : ""} readOnly />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <TextInput label="Vendor Code" value={EditRow ? `${EditRow.vendor_code} - ${EditRow.Vendor_Name || ""}` : ""} readOnly />
        </Box>
        <TextInput label="Effective Date" value={fmtDate(EditRow?.effective_date)} readOnly />
        <SelectField label="Transport Mode" value={TransportMode} onChange={(e) => setTransportMode(e.target.value)} options={modeOptions} />
        <NumberInput label="Frt Inward" value={FrtInward} onChange={(e) => setFrtInward(e.target.value)} />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Upload */}
      <FormDialog
        open={openUploadModal}
        title="Inward Freight Excel Upload"
        onClose={handleCloseUploadModal}
        width={uploadProblems ? 860 : 460}
        gap="8px 12px"
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseUploadModal} sx={outlineButtonSx}>Close</Button>
            <Button variant="contained" disableElevation onClick={handleUploadData} disabled={isUploading} sx={{ ...primaryButtonSx, minWidth: 70 }}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 1 }}>
          <Box>
            <Button variant="outlined" onClick={downloadTemplate} startIcon={<FaDownload size={12} />} sx={outlineButtonSx}>
              Download Template
            </Button>
          </Box>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => { setUploadedFile(e.target.files[0]); setUploadProblems(null); setUploadLog(null); }}
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
            Columns: {UPLOAD_COLUMNS.join(", ")} (date dd.MM.yyyy, mode ROAD / SEA). Any error = nothing is uploaded.
          </span>
        </Box>
        {uploadLog && (
          <Box sx={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: uploadLog.errRecord.length ? "#b42323" : "#1b7a43" }}>
              {uploadLog.message}
              {uploadLog.errRecord.length === 0 && ` (${uploadLog.newRecord.length} new, ${uploadLog.updateRecord.length} updated)`}
            </span>
            <Button
              variant="outlined"
              onClick={() => downloadUploadLog(uploadLog.newRecord, uploadLog.updateRecord, uploadLog.errRecord)}
              startIcon={<FaDownload size={12} />}
              sx={outlineButtonSx}
            >
              Download Log
            </Button>
          </Box>
        )}
        {uploadProblems && <Box sx={{ gridColumn: "span 2", "& .mt-3": { mt: 0 } }}><ValidationResponseGrid response={uploadProblems} /></Box>}
      </FormDialog>
    </div>
  );
};

export default InwardFreight;
