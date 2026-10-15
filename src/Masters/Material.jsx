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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx-js-style';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import CloseIcon from "@mui/icons-material/Close";

import { MaterialMaster } from "../controller/Masterapiservice";
import { FaDownload } from "react-icons/fa";
import { api } from "../controller/constants";
import { getdetails, getAdd, getPlants, getUpdates, getMaterialType, getProductSegments } from '../controller/Masterapiservice';
import { getdetails as getLines } from '../controller/LineMasterapiservice';
import LineSelect from '../components/LineSelect';
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import { findPlantsNotAllowed, plantsNotAllowedMessage } from "../common/plantFileCheck";
import FilterSelect from "../components/FilterSelect";
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
import { MaterialGroupEnumTypes } from "../common/enumValues";

// safety_stock / max_stock: mandatory only for material type ROH; when given they must be numbers,
// never negative, and max >= safety (the API and the database procedures enforce the same rules).
const getStockError = (materialType, safetyStock, maxStock) => {
  const safetyTxt = String(safetyStock ?? "").trim();
  const maxTxt = String(maxStock ?? "").trim();
  if (String(materialType || "").trim().toUpperCase() === "ROH" && (safetyTxt === "" || maxTxt === "")) {
    return "Safety Stock and Max Stock are mandatory for material type ROH.";
  }
  const isNumber = (t) => /^-?\d+(\.\d+)?$/.test(t);
  if ((safetyTxt !== "" && !isNumber(safetyTxt)) || (maxTxt !== "" && !isNumber(maxTxt))) {
    return "Safety Stock and Max Stock must be numbers.";
  }
  if ((safetyTxt !== "" && Number(safetyTxt) < 0) || (maxTxt !== "" && Number(maxTxt) < 0)) {
    return "Safety Stock and Max Stock cannot be negative.";
  }
  if (safetyTxt !== "" && maxTxt !== "" && Number(maxTxt) < Number(safetyTxt)) {
    return "Max Stock cannot be less than Safety Stock.";
  }
  return "";
};

const DIALOG_FIELD_SX = compactFieldSx("100%", 12);

// Compact select used by the Add / Edit dialogs
const SelectField = ({ label, value, onChange, options, required = false }) => (
  <TextField
    select
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    required={required}
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

const TextInput = ({ label, value, onChange, readOnly = false, type, inputProps, required = false }) => (
  <TextField
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    type={type}
    required={required}
    sx={DIALOG_FIELD_SX}
    InputProps={{ readOnly }}
    inputProps={inputProps}
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

const Material = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const UserID = localStorage.getItem('UserID');


  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);


  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [PlantCode, setPlantCode] = useState([]);
  const [MaterialType, setMaterialType] = useState([]);
  const [MaterialCode, setMaterialCode] = useState("");

  const [MaterialID, setMaterialID] = useState("");
  const [Description, setDescription] = useState("");
  const [Rate, setRate] = useState("");
  const [SafetyStock, setSafetyStock] = useState("");
  const [MaxStock, setMaxStock] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(false);
  // Only the plants this user may use (own plant + User Master > Data Access) - the same list and rule as Vendor Master,
  // Material - Vendor Mapping and the Manufacturing BOM. PlantTable = the same plants for the Add dialog (Plant_Id = Plant_ID).
  const [plants, setPlants] = useState([]);
  const PlantTable = useMemo(() => plants.map((p) => ({ Plant_Id: p.Plant_ID, Plant_Code: p.Plant_Code })), [plants]);
  const [loading, setLoading] = useState(true);
  // Plant: the dropdown holds the selection (starts on the user's own login plant), the Search button applies it
  const [plantSelect, setPlantSelect] = useState("All");
  const [fPlant, setFPlant] = useState("All"); // applied plant
  const plantDefaulted = useRef(false);
  const [MaterialTable, setMaterialTable] = useState([])
  const [LineTable, setLineTable] = useState([]);
  const [LineID, setLineID] = useState("");
  // Segment (Mst_Product_Segment): optional. SegmentExtra = the segment the material has now when it is no longer an
  // active one (still shown in the Edit dropdown so the saved value is not lost)
  const [SegmentTable, setSegmentTable] = useState([]);
  const [SegmentID, setSegmentID] = useState("");
  const [SegmentExtra, setSegmentExtra] = useState(null);

  // const [userID, setUserID] = useState("");



  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 0.6, minWidth: 70 },
    { field: "Material_Type", headerName: "Material Type", flex: 0.8, minWidth: 90 },
    { field: "Material_Code", headerName: "Material Code", flex: 1, minWidth: 110 },
    { field: "Description", headerName: "Description", flex: 1.8, minWidth: 160 },
    { field: "Line_Name", headerName: "Line", flex: 0.9, minWidth: 90 },
    { field: "Segment_Name", headerName: "Segment", flex: 0.8, minWidth: 90 },
    { field: "Rate", headerName: "Rate", flex: 0.6, minWidth: 70 },
    { field: "safety_stock", headerName: "Safety Stock", flex: 0.8, minWidth: 90 },
    { field: "max_stock", headerName: "Max Stock", flex: 0.7, minWidth: 80 },
    {
      field: "Active_Status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (value) => (value ? "Active" : "Inactive"),
      renderCell: (params) => {
        const isActive = !!params.row.Active_Status;
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
      const response = await getdetails();
      console.log(response);  // Check the structure of response
      setData(response);  // Ensure that this is correctly setting the data
      setOriginalRows(response); // for reference during search
      setRows(response);
    } catch (error) {
      console.error(error);
      setData([]);  // Handle error by setting empty data
      setOriginalRows([]); // handle error case
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();

  }, []);

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

  // Same rule as the Manufacturing BOM: only the materials of the plants this user may use (until the plant list is
  // loaded - or if it cannot be loaded - nothing is shown, never other plants' rows)
  const scopedData = useMemo(() => {
    const allowed = new Set(plants.map((p) => String(p.Plant_Code)));
    return (originalRows || []).filter((row) => allowed.has(String(row.Plant_Code)));
  }, [originalRows, plants]);
  // The Plant filter shows "1150 - RML P4 (RML)" (same label as the Manufacturing BOM) and filters by the plant code
  const plantFilterCode = fPlant === "All" ? null : String(plants.find((p) => myPlantLabel(p) === fPlant)?.Plant_Code ?? "");

  // Search box + panel filters, applied live to the loaded materials
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fType, setFType] = useState("All");
  const [fLine, setFLine] = useState("All");
  const [fSegment, setFSegment] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const visibleRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return scopedData.filter((row) => {
      if (plantFilterCode !== null && String(row.Plant_Code) !== plantFilterCode) return false;
      if (fType !== "All" && row.Material_Type !== fType) return false;
      if (fLine !== "All" && row.Line_Name !== fLine) return false;
      if (fSegment !== "All" && row.Segment_Name !== fSegment) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.Active_Status) return false;
      if (!text) return true;
      return ["Plant_Code", "Material_Type", "Material_Code", "Description", "Rate", "Segment_Name", "Line_Name"].some((key) => {
        const value = row[key];
        return value !== null && value !== undefined && String(value).toLowerCase().includes(text);
      });
    });
  }, [scopedData, searchText, plantFilterCode, fType, fLine, fSegment, fStatus]);
  const uniq = (key) => [...new Set(scopedData.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort();
  // the Plant filter sits in front of the search box (always visible); the badge / "Clear filters" are for the panel filters
  const activeFilterCount = [fType, fLine, fSegment, fStatus].filter((v) => v !== "All").length;
  const clearFilters = () => { setFType("All"); setFLine("All"); setFSegment("All"); setFStatus("All"); };



  // useEffect(() => {
  //   if (PlantCode) {
  //     get_SupvCode();
  //   } else {
  //     setSupvTable([]); // reset supervisor list if PlantCode is cleared
  //   }
  // }, [PlantCode]);


  const get_Material_Type = async () => {
    try {
      const response = await getMaterialType(MaterialGroupEnumTypes.direct);
      setMaterialTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const get_Segment = async () => {
    try {
      const response = await getProductSegments();
      setSegmentTable(response.data || []);
    } catch (error) {
      console.error("Error loading Segment list:", error);
    }
  };

  const get_Line = async () => {
    try {
      const response = await getLines();
      setLineTable((response || []).filter((l) => l.Active_Status));
    } catch (error) {
      console.error("Error loading Line list:", error);
    }
  };

  // Add form: PlantCode here holds Plant_ID (matches the Add Plant dropdown's
  // own value below and InsertMstMaterial's @PlantCode, which is inserted
  // straight into Mst_Material.Plant_ID). Empty until a Plant is actually
  // picked â€” not "show everything until narrowed down" â€” then scoped to
  // that exact Plant, same convention as Line Master's Module dropdown.
  const lineOptions = PlantCode ? LineTable.filter((l) => String(l.Plant_ID) === String(PlantCode)) : [];

  // Edit form: PlantCode here holds Plant_Code (the row's own business code,
  // e.g. 1150 â€” see handleEditOpen), NOT Plant_ID, since Plant isn't part of
  // the Update payload at all (UpdateMaterial has no @PlantCode param) and
  // this field exists for display/filtering only. GetLine returns both
  // Plant_ID and Plant_Code per line, so this filters on Plant_Code instead
  // â€” fixes the previous bug where Edit's Line dropdown showed every line
  // from every plant because it filtered on the wrong field.
  const editLineOptions = PlantCode ? LineTable.filter((l) => String(l.Plant_Code) === String(PlantCode)) : [];



  // Segment dropdown (Add and Edit): None + the active segments (+ the material's own segment when it is inactive)
  const segmentOptions = [
    ...(SegmentExtra && !SegmentTable.some((x) => String(x.prod_seg_id) === String(SegmentExtra.prod_seg_id)) ? [SegmentExtra] : []),
    ...SegmentTable,
  ];
  const segmentField = (
    <SelectField
      label="Segment"
      value={SegmentID}
      onChange={(e) => setSegmentID(e.target.value)}
      options={[{ value: "", label: "None" }, ...segmentOptions.map((x) => ({ value: x.prod_seg_id, label: x.seg_name }))]}
    />
  );

  // âœ… Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // âœ… Handle Add Modal
  const handleOpenAddModal = (item) => {
    // start on the plant being viewed (or the user's own plant when All is shown); it can be changed in the dialog
    const startPlant = (plantFilterCode !== null && plants.find((p) => String(p.Plant_Code) === plantFilterCode))
      || plants.find((p) => Number(p.Is_Default) === 1)
      || null;
    setPlantCode(startPlant ? startPlant.Plant_ID : "");
    setMaterialCode("");
    setDescription("");
    setMaterialType("");
    setLineID("");
    setSegmentID("");
    setSegmentExtra(null);

    setRate("");
    setSafetyStock("");
    setMaxStock("");
    setActiveStatus(true);
    setOpenAddModal(true);
    get_Material_Type();
    get_Line();
    get_Segment();

  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  // âœ… Handle Upload Modal
  const handleOpenUploadModal = () => {
    setOpenUploadModal(true);
    get_Material_Type();
    get_Line();
    get_Segment();
  };

  // Dynamic template (replaces the old static MaterialMaster.xlsx) so the
  // Active_Status/Plant_Code/Material_Type/Line_Name columns carry real
  // dropdown lists â€” users typing free text into Active_Status had no idea
  // 'Active'/'Inactive' was the expected value, and the backend's old
  // Boolean(status) check silently treated ANY non-empty text as Active=1
  // (now fixed server-side to require exactly Active/Inactive too).
  const downloadMaterialTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MATERIAL_MASTER';
    workbook.created = new Date();

    const headers = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'Active_Status', 'Line_Name', 'Safety_Stock', 'Max_Stock', 'Segment'];
    const worksheet = workbook.addWorksheet('MATERIAL');
    worksheet.addRow(headers);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } };
    });
    worksheet.columns = [
      { width: 14 }, // Plant_Code
      { width: 16 }, // Material_Type
      { width: 22 }, // Material_Code
      { width: 30 }, // Description
      { width: 12 }, // Rate
      { width: 14 }, // Active_Status
      { width: 22 }, // Line_Name (optional)
      { width: 14 }, // Safety_Stock (mandatory for ROH)
      { width: 14 }, // Max_Stock (mandatory for ROH)
      { width: 14 }, // Segment (optional)
    ];
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    // Safety_Stock / Max_Stock: mandatory for material type ROH, optional for the others; 0 or more
    worksheet.getCell('H1').note = 'Mandatory for material type ROH. Number, 0 or more.';
    worksheet.getCell('I1').note = 'Mandatory for material type ROH. Number, 0 or more. Not less than Safety_Stock.';
    // Segment (optional): the name of an active segment of the Segment Master - dropdown; blank = no segment
    worksheet.getCell('J1').note = 'Optional: the segment name from the dropdown. Blank = no segment (an existing material keeps its segment).';
    const segmentNames = (SegmentTable || []).map((x) => x.seg_name).filter(Boolean);
    if (segmentNames.length) {
      worksheet.dataValidations.add('J2:J1000', { type: 'list', allowBlank: true, formulae: [`"${segmentNames.join(',')}"`] });
    }
    worksheet.dataValidations.add('H2:I1000', {
      type: 'decimal',
      operator: 'greaterThanOrEqual',
      formulae: [0],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Enter a number, 0 or more.',
    });

    const plantCodes = (PlantTable || []).map((p) => `${p.Plant_Code}`);
    const materialTypes = (MaterialTable || []).map((m) => m.Mat_Type || m.Material_Type).filter(Boolean);
    const lineNames = [...new Set((LineTable || []).map((l) => l.Line_Name).filter(Boolean))];

    // Plant_Code / Material_Type / Active_Status are short lists â€” inline
    // list formula works fine (Excel's ~255-char limit is not a concern).
    worksheet.dataValidations.add('A2:A1000', {
      type: 'list',
      allowBlank: false,
      formulae: [`"${plantCodes.join(',')}"`],
    });
    worksheet.dataValidations.add('B2:B1000', {
      type: 'list',
      allowBlank: false,
      formulae: [`"${materialTypes.join(',')}"`],
    });
    worksheet.dataValidations.add('F2:F1000', {
      type: 'list',
      allowBlank: false,
      formulae: ['"Active,Inactive"'],
    });

    // Line_Name has no dropdown (332+ rows, growing, and a dropdown that
    // large is unwieldy to scroll) â€” instead a second VISIBLE sheet lists
    // every Plant + Line so the user can look up the exact spelling and type
    // it into the Line_Name column on the main sheet themselves.
    if ((LineTable || []).length) {
      const lookupSheet = workbook.addWorksheet('All Lines (reference)');
      lookupSheet.addRow(['Plant_Code', 'Line_Name']);
      lookupSheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } };
      });
      lookupSheet.columns = [{ width: 14 }, { width: 30 }];
      lookupSheet.views = [{ state: 'frozen', ySplit: 1 }];
      LineTable.forEach((l) => {
        lookupSheet.addRow([l.Plant_Code, l.Line_Name]);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      'MaterialMaster_Template.xlsx'
    );
  };
  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
    setUploadStatus("");
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadedFileData(null);
    setIsUploading(false);
  };

  const handleFileUpload = (event) => {
    setUploadedFile(event.target.files[0]);
  };

  const handleUploadData = async () => {
    if (!uploadedFile) {
      alert("Please select a file first.");
      return;
    }

    else {
      try {
        // Only plants this user may use (own + Data Access): check the Plant_Code column of the file before uploading
        const { blocked, plants: myPlants } = await findPlantsNotAllowed(uploadedFile, "Plant_Code");
        if (blocked.length > 0) {
          alert(plantsNotAllowedMessage(blocked, myPlants));
          return;
        }
        const formData = new FormData();
        console.log('file', uploadedFile)
        formData.append("User_Add", uploadedFile);
        formData.append("UserID", UserID);
        const response = await MaterialMaster(formData)
        console.log('response', response.data)
        // rows rejected because of an unknown Segment are named in the message (the full list is in the downloaded log)
        const badSegments = [...new Set((response.data.ErrorRecords || []).filter((r) => String(r.Segment_Val || '').startsWith('Invalid')).map((r) => String(r.Segment || '').trim()))];
        alert(badSegments.length
          ? `${response.data.message}\n\nRows rejected - Segment not found in Segment Master: ${badSegments.map((x) => "'" + x + "'").join(', ')}. See the Error Records sheet of the log file.`
          : response.data.message)
        // console.log('response', response.data)
        if (response.data.NewRecord.length > 0 || response.data.UpdatedData.length > 0 || response.data.ErrorRecords.length > 0) {
          downloadExcel(response.data.NewRecord, response.data.UpdatedData, response.data.ErrorRecords);
        }
        getData();
      } catch (error) {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.message);
        }
      }
    }
    handleCloseUploadModal();

  }



  const downloadExcel = (newRecord, updateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();

    const newRecordsColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'Safety_Stock', 'Max_Stock', 'Segment', 'ActiveStatus', 'Status'];
    const UpdatedColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'Safety_Stock', 'Max_Stock', 'Segment', 'ActiveStatus', 'Status'];
    const ErrorColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'Safety_Stock', 'Max_Stock', 'Segment', 'ActiveStatus', 'PlantCode_Validation', 'Material_Type_Validation', 'Stock_Validation', 'Segment_Validation'];

    const filteredNewData = newRecord.map(item => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,

      Material_Code: item.Material_Code,
      Description: item.Description,
      Rate: item.Rate,
      Safety_Stock: item.safety_stock,
      Max_Stock: item.max_stock,
      Segment: item.Segment,
      ActiveStatus: item.Active_Status,
      Status: item.Status,
    }));

    const filteredUpdate = updateRecord.map(item => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,

      Material_Code: item.Material_Code,
      Description: item.Description,
      Rate: item.Rate,
      Safety_Stock: item.safety_stock,
      Max_Stock: item.max_stock,
      Segment: item.Segment,
      ActiveStatus: item.Active_Status,
      Status: item.Status,
    }));

    const filteredError = errRecord.map(item => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,

      Material_Code: item.Material_Code,

      Description: item.Description,
      Rate: item.Rate,
      Safety_Stock: item.Safety_Stock,
      Max_Stock: item.Max_Stock,
      Segment: item.Segment,
      ActiveStatus: item.Active_Status,
      PlantCode_Validation: item.Plant_Val,
      Material_Type_Validation: item.Material_Val,
      Stock_Validation: item.Stock_Val,
      Segment_Validation: item.Segment_Val,
    }));

    // ðŸ”¹ Helper to style header cells
    const styleHeaders = (worksheet, columns) => {
      columns.forEach((_, index) => {
        const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: '000000' } },
            fill: { fgColor: { rgb: 'FFFF00' } }, // Yellow background
            alignment: { horizontal: 'center' },
          };
        }
      });
    };

    // ðŸ”´ Style red text for validation columns only
    const styleValidationColumns = (worksheet, columns, dataLength) => {
      const validationCols = ['PlantCode_Validation', 'Material_Type_Validation', 'Stock_Validation', 'Segment_Validation'];

      for (let row = 1; row <= dataLength; row++) {
        validationCols.forEach(colName => {
          const colIdx = columns.indexOf(colName);
          if (colIdx === -1) return;

          const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
          const cell = worksheet[cellAddress];

          if (cell && typeof cell.v === 'string') {
            const value = cell.v.trim().toLowerCase();

            // Apply green if value is "valid", otherwise red
            cell.s = {
              font: {
                color: { rgb: value === 'valid' ? '2e7d32' : 'FF0000' } // green or red
              }
            };
          }
        });
      }
    };


    // ðŸ“„ New Records Sheet
    if (filteredNewData.length === 0) filteredNewData.push({});
    const wsNewRecords = XLSX.utils.json_to_sheet(filteredNewData, { header: newRecordsColumns });
    styleHeaders(wsNewRecords, newRecordsColumns);
    XLSX.utils.book_append_sheet(wb, wsNewRecords, 'New Records');

    // ðŸ“„ Updated Records Sheet
    if (filteredUpdate.length === 0) filteredUpdate.push({});
    const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, { header: UpdatedColumns });
    styleHeaders(wsUpdated, UpdatedColumns);
    XLSX.utils.book_append_sheet(wb, wsUpdated, 'Updated Records');

    // ðŸ“„ Error Records Sheet
    if (filteredError.length === 0) filteredError.push({});
    const wsError = XLSX.utils.json_to_sheet(filteredError, { header: ErrorColumns });
    styleHeaders(wsError, ErrorColumns);
    styleValidationColumns(wsError, ErrorColumns, filteredError.length);
    XLSX.utils.book_append_sheet(wb, wsError, 'Error Records');

    // ðŸ“¦ Export the Excel file
    const fileName = 'Material Data Upload Log.xlsx';
    XLSX.writeFile(wb, fileName);
  };



  // âœ… Handle Row Click for Edit





  const handleRowClick = (params) => {
    setPlantCode(params.row.Plant_Code);
    setMaterialType(params.row.Material_Type);
    setMaterialCode(params.row.Material_Code);

    setDescription(params.row.Description);
    setRate(params.row.Rate);
    setSafetyStock(params.row.safety_stock ?? "");
    setMaxStock(params.row.max_stock ?? "");
    setActiveStatus(params.row.Active_Status);
    setLineID(params.row.Line_ID || "");
    setSegmentID(params.row.prod_seg_id || "");
    setSegmentExtra(params.row.prod_seg_id ? { prod_seg_id: params.row.prod_seg_id, seg_name: params.row.Segment_Name || String(params.row.prod_seg_id) } : null);
    get_Segment();
    setOpenEditModal(true);  // Open the modal
    setMaterialID(params.row.Material_ID);
    // setUserID(params.User_ID);
    get_Material_Type(); // populate the Material Type dropdown options for editing
    get_Line();
  };

  // âœ… Handle Add Material
  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
      PlantCode, MaterialType, MaterialCode, Description, Rate, ActiveStatus, UserID
    });
    console.log("Add button clicked")
    if (PlantCode === '' || MaterialType === '' || MaterialCode === '' || Description === '' || Rate === '') {
      alert("Please fill in all required fields");
      return;  // Exit the function if validation fails
    }
    const stockError = getStockError(MaterialType, SafetyStock, MaxStock);
    if (stockError) {
      alert(stockError);
      return;
    }

    try {
      const data = {
        UserID: UserID,
        Plant_Code: PlantCode,
        Material_Type: MaterialType,

        Material_Code: MaterialCode,
        Description: Description,
        Rate: Rate,
        Safety_Stock: String(SafetyStock).trim() === "" ? null : SafetyStock,
        Max_Stock: String(MaxStock).trim() === "" ? null : MaxStock,
        Active_Status: ActiveStatus,
        Line_ID: LineID || null,
        Prod_Seg_ID: SegmentID || null,
      }
      const response = await getAdd(data);
      if (response.data.success) {
        alert("Material added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to add material.");
      }
    } catch (error) {
      console.error("Error in adding Material:", error);

      // Step 4: Show error from server (like Employee_ID already exists)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the Material.");
      }
    }
  };
  const handleUpdate = async () => {
    const stockError = getStockError(MaterialType, SafetyStock, MaxStock);
    if (stockError) {
      alert(stockError);
      return;
    }
    try {
      const data = {
        UserID: UserID,
        Material_ID: MaterialID,

        Description: Description,
        Material_Type: MaterialType,
        Rate: Rate,
        Safety_Stock: String(SafetyStock).trim() === "" ? null : SafetyStock,
        Max_Stock: String(MaxStock).trim() === "" ? null : MaxStock,
        Active_Status: ActiveStatus,
        Line_ID: LineID || null,
        Prod_Seg_ID: SegmentID || null,
        // UserID: userID,  // Ensure the UserID is also included
      };

      console.log('Data being sent:', data);  // Log data to verify it before sending

      // Call the API
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

      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message); // Specific error from backend
      } else {
        alert("An error occurred while updating the Vendor. Please try again.");
      }
    }
  };
  // excel download
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = ['Plant_Code', 'Material_Type', 'Material_Code', 'Description', 'Rate', 'Safety_Stock', 'Max_Stock', 'Segment', 'ActiveStatus'];

    const filteredData = data.map(item => ({
      Plant_Code: item.Plant_Code,
      Material_Type: item.Material_Type,

      Material_Code: item.Material_Code,

      Description: item.Description,
      Rate: item.Rate,
      Safety_Stock: item.safety_stock,
      Max_Stock: item.max_stock,
      Segment: item.Segment_Name || "",
      ActiveStatus: item.Active_Status ? "Active" : "Inactive"
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },

      { wch: 30 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
    ];
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Materials");
    XLSX.writeFile(workbook, "Material_Data.xlsx");
  };

  const plantOptions = PlantTable.map((p) => ({ value: p.Plant_Id, label: p.Plant_Code }));
  const typeOptions = MaterialTable.map((item) => ({ value: item.Mat_Type, label: item.Mat_Type }));
  const plantFilterOptions = plants.map(myPlantLabel);

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
        Material Master - Direct
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
        <FilterSelect label="Plant" value={plantSelect} options={plantFilterOptions} onChange={setPlantSelect} minWidth={190} />
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
          placeholder="Search plant, material, description, line, segment"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {visibleRows.length === scopedData.length ? `${scopedData.length} materials` : `${visibleRows.length} of ${scopedData.length} materials`}
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
          Add Material
        </Button>
        <UniqueGroupingInfo
          sections={[{ fields: ["Plant", "Material Code"] }]}
          intro="One material per combination of:"
          notes={[
            <><b>Add:</b> the same Plant + Material Code that already exists is rejected.</>,
            <><b>Bulk upload:</b> the same combination is <b>updated</b>, any other is <b>added</b>. A blank Line / Segment cell keeps the saved value.</>,
            "The Material Type of an existing material is not changed by an upload.",
          ]}
        />

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Material Type" value={fType} options={uniq("Material_Type")} onChange={setFType} minWidth={150} />
          <FilterSelect label="Line" value={fLine} options={uniq("Line_Name")} onChange={setFLine} minWidth={170} />
          <FilterSelect label="Segment" value={fSegment} options={uniq("Segment_Name")} onChange={setFSegment} minWidth={150} />
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
          columns={columns}
          loading={loading}
          getRowId={(row) => row.Material_ID}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No materials found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add Material */}
      <FormDialog
        open={openAddModal}
        title="Add Material"
        onClose={() => setOpenAddModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => handleCloseAddModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleAdd} sx={{ ...primaryButtonSx, minWidth: 70 }}>Add</Button>
          </>
        }
      >
        <SelectField
          label="Plant Code"
          value={PlantCode}
          onChange={(e) => {
            setPlantCode(e.target.value);
            setLineID(""); // previous plant's line no longer valid
          }}
          options={plantOptions}
          required
        />
        <SelectField label="Material Type" value={MaterialType} onChange={(e) => setMaterialType(e.target.value)} options={typeOptions} required />
        <LineSelect value={LineID} options={lineOptions} onChange={setLineID} disabled={!PlantCode} size="compact" />
        {segmentField}
        <TextInput label="Material Code" value={MaterialCode} onChange={(e) => setMaterialCode(e.target.value)} required />
        <TextInput label="Description" value={Description} onChange={(e) => setDescription(e.target.value)} required />
        <TextInput label="Rate" type="number" value={Rate} onChange={(e) => setRate(e.target.value)} inputProps={{ min: 0 }} required />
        {/* Safety / Max Stock: mandatory only for material type ROH */}
        <TextInput label="Safety Stock" type="number" value={SafetyStock} onChange={(e) => setSafetyStock(e.target.value)} inputProps={{ min: 0, step: "any" }} required={String(MaterialType).toUpperCase() === "ROH"} />
        <TextInput label="Max Stock" type="number" value={MaxStock} onChange={(e) => setMaxStock(e.target.value)} inputProps={{ min: 0, step: "any" }} required={String(MaterialType).toUpperCase() === "ROH"} />
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Edit Material */}
      <FormDialog
        open={openEditModal}
        title="Edit Material"
        onClose={() => setOpenEditModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseEditModal} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleUpdate} sx={{ ...primaryButtonSx, minWidth: 70 }}>Update</Button>
          </>
        }
      >
        <TextInput label="Plant Code" value={PlantCode} readOnly />
        <SelectField label="Material Type" value={MaterialType} onChange={(e) => setMaterialType(e.target.value)} options={typeOptions} required />
        {/* Filtered by Plant_Code (see editLineOptions above) - Plant itself is read-only in this form, so this always
            resolves to the row's own plant's lines only. */}
        <LineSelect value={LineID} options={editLineOptions} onChange={setLineID} disabled={!PlantCode} size="compact" />
        {segmentField}
        <TextInput label="Material Code" value={MaterialCode} readOnly />
        <TextInput label="Description" value={Description} onChange={(e) => setDescription(e.target.value)} />
        <TextInput label="Rate" type="number" value={Rate} onChange={(e) => setRate(e.target.value)} inputProps={{ min: 0 }} required />
        {/* Safety / Max Stock: mandatory only for material type ROH */}
        <TextInput label="Safety Stock" type="number" value={SafetyStock} onChange={(e) => setSafetyStock(e.target.value)} inputProps={{ min: 0, step: "any" }} required={String(MaterialType).toUpperCase() === "ROH"} />
        <TextInput label="Max Stock" type="number" value={MaxStock} onChange={(e) => setMaxStock(e.target.value)} inputProps={{ min: 0, step: "any" }} required={String(MaterialType).toUpperCase() === "ROH"} />
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Upload */}
      <FormDialog
        open={openUploadModal}
        title="Material Master Excel Upload"
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
            <Button variant="outlined" onClick={downloadMaterialTemplate} startIcon={<FaDownload size={12} />} sx={outlineButtonSx}>
              Download Template
            </Button>
          </Box>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
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
            Required columns: Plant_Code, Material_Type, Material_Code, Description, Rate, Active_Status (Active / Inactive) and Line_Name
            (may be blank). Optional: Safety_Stock and Max_Stock (mandatory for ROH) and Segment. A material that already exists is updated;
            a new one is added. Rows with errors are skipped and listed in the log file.
          </span>
        </Box>
      </FormDialog>
    </div>
  );
};

export default Material;
