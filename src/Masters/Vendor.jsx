import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Autocomplete,
  CircularProgress,
  createFilterOptions,
  TextField,
  Button,
  Dialog,
  Box,
  Chip,
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
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import CloseIcon from "@mui/icons-material/Close";
import { FaDownload } from "react-icons/fa";
import { api } from "../controller/constants";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  getAdd,
  getUpdates,
  getdetails,
  getBuyers,
} from "../controller/VendorMasterapiservice";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import { findPlantsNotAllowed, plantsNotAllowedMessage } from "../common/plantFileCheck";
import { VendorMaster } from "../controller/VendorMasterapiservice";
import FilterSelect from "../components/FilterSelect";
import MailIdsInput, { parseMailIds } from "../components/MailIdsInput";
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

const DIALOG_FIELD_SX = compactFieldSx("100%", 12);

// the buyer list of a plant can be long: filter as the user types and render only the first matches
const optionFilter = createFilterOptions({ limit: 200 });

// Compact select used by the Add / Edit dialogs
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

const TextInput = ({ label, value, onChange, readOnly = false, placeholder, inputProps }) => (
  <TextField
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
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

const Vendor = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(""); // Track upload status
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [ActiveStatus, setActiveStatus] = useState(false);
  const [PlantCode, setPlantCode] = useState([]);
  // Only the plants this user may use (own plant + User Master > Data Access) - the same list and rule as Material - Vendor
  // Mapping and the Manufacturing BOM
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  // Plant: the dropdown holds the selection (starts on the user's own login plant), the Search button applies it
  const [plantSelect, setPlantSelect] = useState("All");
  const [fPlant, setFPlant] = useState("All"); // applied plant
  const plantDefaulted = useRef(false);
  const Username = localStorage.getItem('UserName');
  const UserID = localStorage.getItem('UserID');
  // const [newRecord] = useState([]);
  // const [updateRecord] = useState([]);
  // const [errRecord] = useState([]);
  const [VendorCode, setVendorCode] = useState("");
  const [VendorID, setVendorID] = useState("");
  const [VendorName, setVendorName] = useState("");
  const [VendorAddress, setVendorAddress] = useState("");
  const [KanbanMail, setKanbanMail] = useState("No"); // "Yes" / "No"
  const [MailID, setMailID] = useState(""); // vendor e-mail ("" = none); several can be separated with ; or ,
  const [BuyerID, setBuyerID] = useState(""); // Mst_User.Employee_ID (gen_id); "" = no buyer
  const [BuyerTable, setBuyerTable] = useState([]);
  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 0.6, minWidth: 70 },
    { field: "Vendor_Code", headerName: "Vendor Code", flex: 0.9, minWidth: 95 },
    { field: "Vendor_Name", headerName: "Vendor Name", flex: 1.4, minWidth: 140 },
    { field: "Vendor_Address", headerName: "Vendor Address", flex: 1.6, minWidth: 150 },
    {
      field: "kanban_mail",
      headerName: "Kanban Mail",
      flex: 0.8,
      minWidth: 90,
      valueGetter: (value, row) => (row?.kanban_mail ? "Yes" : "No"),
    },
    {
      field: "mail_id",
      headerName: "Mail ID",
      flex: 1.4,
      minWidth: 140,
      renderCell: (params) => {
        const ids = parseMailIds(params.value);
        if (ids.length <= 1) return params.value || "";
        return (
          <span className="flex min-w-0 items-center gap-1.5" title={ids.join("\n")}>
            <span className="truncate">{ids[0]}</span>
            <span className="shrink-0 rounded-full bg-[#eef4ff] px-1.5 text-[10.5px] font-semibold text-[#1d4ed8]">+{ids.length - 1}</span>
          </span>
        );
      },
    },
    {
      field: "buyer_id",
      headerName: "Buyer",
      flex: 1.2,
      minWidth: 120,
      valueGetter: (value, row) =>
        row?.buyer_id ? (row.buyer_name ? `${row.buyer_id} - ${row.buyer_name}` : row.buyer_id) : "",
    },
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

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const getData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    console.log('username', Username)
    console.log('UserID', UserID)
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

  // Buyer list: the active users of the vendor's plant (own plant + Data Access) - params = { plantId } or { plantCode }
  const get_Buyers = async (params) => {
    setBuyerTable([]);
    if (!params) return;
    try {
      const response = await getBuyers(params);
      setBuyerTable(response.data || []);
    } catch (error) {
      console.error("Error loading buyers:", error);
    }
  };

  // ✅ Handle Add Modal
  const handleOpenAddModal = (item) => {
    // start on the plant being viewed (or the user's own plant when All is shown); it can be changed in the dialog
    const start = (plantFilterCode !== null && plants.find((p) => String(p.Plant_Code) === plantFilterCode))
      || plants.find((p) => Number(p.Is_Default) === 1)
      || null;
    setPlantCode(start ? start.Plant_ID : "");
    get_Buyers(start ? { plantId: start.Plant_ID } : null);
    setVendorCode("");
    setVendorName("");
    setVendorAddress("");
    setKanbanMail("No");
    setMailID("");
    setBuyerID("");
    setActiveStatus(true);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);
  const handleCloseEditModal = () => setOpenEditModal(false);

  // ✅ Handle Upload Modal
  const handleOpenUploadModal = () => setOpenUploadModal(true);
  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
    setUploadStatus("");
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadedFileData(null);
    setIsUploading(false);
  };

  // Template built here (not a fixed file) so the Plant_Code column is a dropdown of the plants THIS user may use, and
  // Kanban_Mail is a Yes / No dropdown
  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "VENDOR_MASTER";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("Sheet1");
    worksheet.addRow(["Plant_Code", "Vendor_Code", "Vendor_Name", "Vendor_Address", "Kanban_Mail", "Buyer_ID", "Mail_ID", "Active_Status"]);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFADD8E6" } };
    });
    worksheet.columns = [{ width: 14 }, { width: 16 }, { width: 30 }, { width: 30 }, { width: 14 }, { width: 12 }, { width: 32 }, { width: 14 }];
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.getCell("E1").note = "Optional: Yes or No. Blank = No for a new vendor, unchanged for an existing one.";
    worksheet.getCell("F1").note = "Optional: employee ID of an active user (the buyer). Blank = unchanged.";
    worksheet.getCell("G1").note = "Optional: e-mail address (several can be separated with ;). Blank = unchanged.";
    worksheet.getCell("H1").note = "Active or Inactive.";

    const plantCodes = (plants || []).map((p) => `${p.Plant_Code}`); // only the plants this user may use
    if (plantCodes.length) {
      worksheet.dataValidations.add("A2:A1000", { type: "list", allowBlank: false, formulae: [`"${plantCodes.join(",")}"`] });
    }
    worksheet.dataValidations.add("E2:E1000", { type: "list", allowBlank: true, formulae: ['"Yes,No"'] });
    worksheet.dataValidations.add("H2:H1000", { type: "list", allowBlank: false, formulae: ['"Active,Inactive"'] });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "VendorMaster_Template.xlsx"
    );
  };

  const handleFileUpload = (event) => {
    setUploadedFile(event.target.files[0]);
  };

  const handleUploadData = async () => {
    if (!uploadedFile) {
      alert("Please select a file first.");
      return;
    } else {
      try {
        // Only plants this user may use (own + Data Access): check the Plant_Code column of the file before uploading
        const { blocked, plants: myPlants } = await findPlantsNotAllowed(uploadedFile, "Plant_Code");
        if (blocked.length > 0) {
          alert(plantsNotAllowedMessage(blocked, myPlants));
          return;
        }
        const formData = new FormData();
        console.log("file", uploadedFile);
        formData.append("User_Add", uploadedFile);
        formData.append("UserID", UserID);
        const response = await VendorMaster(formData);
        console.log("response", response.data);
        alert(response.data.message);
        // console.log('response', response.data)
        if (
          response.data.NewRecord.length > 0 ||
          response.data.UpdatedData.length > 0 ||
          response.data.ErrorRecords.length > 0
        ) {
          downloadExcel(
            response.data.NewRecord,
            response.data.UpdatedData,
            response.data.ErrorRecords
          );
        }
        getData();
      } catch (error) {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.message);
        }
      }
    }
    handleCloseUploadModal();
  };

  const downloadExcel = (newRecord, updateRecord, errRecord) => {
    const wb = XLSX.utils.book_new();

    const newRecordsColumns = [
      "Plant_Code",
      "Vendor_Code",
      "Vendor_Name",
      "Vendor_Address",
      "ActiveStatus",
      "Kanban_Mail",
      "Buyer_ID",
      "Mail_ID",
      "Status",
    ];
    const UpdatedColumns = [
      "Plant_Code",
      "Vendor_Code",
      "Vendor_Name",
      "Vendor_Address",
      "ActiveStatus",
      "Kanban_Mail",
      "Buyer_ID",
      "Mail_ID",
      "Status",
    ];
    const ErrorColumns = [
      "Plant_Code",
      "Vendor_Code",
      "Vendor_Name",
      "Vendor_Address",

      "ActiveStatus",
      "Kanban_Mail",
      "Buyer_ID",
      "Mail_ID",
      "PlantCode_Validation",
      "Kanban_Validation",
      "Buyer_Validation",
      "Mail_Validation",

    ];
    // Kanban_Mail comes back as 1 / 0 (new / updated rows) or as typed in the file (error rows)
    const kanbanText = (value) => (value === true || value === 1 ? "Yes" : value === false || value === 0 ? "No" : value ?? "");

    const filteredNewData = newRecord.map((item) => ({
      Plant_Code: item.Plant_Code,
      Vendor_Code: item.Vendor_Code,
      Vendor_Name: item.Vendor_Name,
      Vendor_Address: item.Vendor_Address,
      ActiveStatus: item.Active_Status,
      Kanban_Mail: kanbanText(item.Kanban_Mail),
      Buyer_ID: item.Buyer_ID ?? "",
      Mail_ID: item.Mail_ID ?? "",
      Status: item.Status,
    }));

    const filteredUpdate = updateRecord.map((item) => ({
      Plant_Code: item.Plant_Code,
      Vendor_Code: item.Vendor_Code,
      Vendor_Name: item.Vendor_Name,
      Vendor_Address: item.Vendor_Address,
      ActiveStatus: item.Active_Status,
      Kanban_Mail: kanbanText(item.Kanban_Mail),
      Buyer_ID: item.Buyer_ID ?? "",
      Mail_ID: item.Mail_ID ?? "",
      Status: item.Status,
    }));

    const filteredError = errRecord.map((item) => ({
      Plant_Code: item.Plant_Code,
      Vendor_Code: item.Vendor_Code,
      Vendor_Name: item.Vendor_Name,
      Vendor_Address: item.Vendor_Address,
      ActiveStatus: item.Active_Status,
      Kanban_Mail: item.Kanban_Mail ?? "",
      Buyer_ID: item.Buyer_ID ?? "",
      Mail_ID: item.Mail_ID ?? "",
      PlantCode_Validation: item.Plant_Val,
      Kanban_Validation: item.Kanban_Val,
      Buyer_Validation: item.Buyer_Val,
      Mail_Validation: item.Mail_Val,

    }));

    // 🔹 Helper to style header cells
    const styleHeaders = (worksheet, columns) => {
      columns.forEach((_, index) => {
        const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
            alignment: { horizontal: "center" },
          };
        }
      });
    };

    // 🔴 Style red text for validation columns only
    const styleValidationColumns = (worksheet, columns, dataLength) => {
      const validationCols = [
        "PlantCode_Validation",
        "Kanban_Validation",
        "Buyer_Validation",
        "Mail_Validation",

      ];

      for (let row = 1; row <= dataLength; row++) {
        validationCols.forEach((colName) => {
          const colIdx = columns.indexOf(colName);
          if (colIdx === -1) return;

          const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: row });
          const cell = worksheet[cellAddress];

          if (cell && typeof cell.v === "string") {
            const value = cell.v.trim().toLowerCase();

            // Apply green if value is "valid", otherwise red
            cell.s = {
              font: {
                color: { rgb: value === "valid" ? "2e7d32" : "FF0000" }, // green or red
              },
            };
          }
        });
      }
    };

    // 📄 New Records Sheet
    if (filteredNewData.length === 0) filteredNewData.push({});
    const wsNewRecords = XLSX.utils.json_to_sheet(filteredNewData, {
      header: newRecordsColumns,
    });
    styleHeaders(wsNewRecords, newRecordsColumns);
    XLSX.utils.book_append_sheet(wb, wsNewRecords, "New Records");

    // 📄 Updated Records Sheet
    if (filteredUpdate.length === 0) filteredUpdate.push({});
    const wsUpdated = XLSX.utils.json_to_sheet(filteredUpdate, {
      header: UpdatedColumns,
    });
    styleHeaders(wsUpdated, UpdatedColumns);
    XLSX.utils.book_append_sheet(wb, wsUpdated, "Updated Records");

    // 📄 Error Records Sheet
    if (filteredError.length === 0) filteredError.push({});
    const wsError = XLSX.utils.json_to_sheet(filteredError, {
      header: ErrorColumns,
    });
    styleHeaders(wsError, ErrorColumns);
    styleValidationColumns(wsError, ErrorColumns, filteredError.length);
    XLSX.utils.book_append_sheet(wb, wsError, "Error Records");

    // 📦 Export the Excel file
    const fileName = "Vendor Data Upload Log.xlsx";
    XLSX.writeFile(wb, fileName);
  };

  // ✅ Handle Row Click for Edit

  const handleRowClick = (params) => {
    setVendorID(params.row.Vendor_ID);
    setVendorCode(params.row.Vendor_Code);
    setPlantCode(params.row.Plant_Code);
    setVendorName(params.row.Vendor_Name);
    setBuyerTable([]);
    setVendorAddress(params.row.Vendor_Address);
    setKanbanMail(params.row.kanban_mail ? "Yes" : "No");
    setMailID(params.row.mail_id || "");
    setBuyerID(params.row.buyer_id || "");
    get_Buyers({ plantCode: params.row.Plant_Code });
    setActiveStatus(params.row.Active_Status);
    setOpenEditModal(true); // Open the modal
    // get_Plant();
  };

  // Search box + filters, applied live to the loaded vendors (same as User Master)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fKanban, setFKanban] = useState("All");
  const [fBuyer, setFBuyer] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const buyerText = (row) => (row.buyer_id ? (row.buyer_name ? `${row.buyer_id} - ${row.buyer_name}` : String(row.buyer_id)) : "");

  // Same rule as the Manufacturing BOM: only the vendors of the plants this user may use (until the plant list is loaded -
  // or if it cannot be loaded - nothing is shown, never other plants' rows)
  const scopedData = useMemo(() => {
    const allowed = new Set(plants.map((p) => String(p.Plant_Code)));
    return (originalRows || []).filter((row) => allowed.has(String(row.Plant_Code)));
  }, [originalRows, plants]);
  // The Plant filter shows "1150 - RML P4 (RML)" (same label as the Manufacturing BOM) and filters by the plant code
  const plantFilterCode = fPlant === "All" ? null : String(plants.find((p) => myPlantLabel(p) === fPlant)?.Plant_Code ?? "");

  const visibleRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return scopedData.filter((row) => {
      if (plantFilterCode !== null && String(row.Plant_Code) !== plantFilterCode) return false;
      if (fKanban !== "All" && (fKanban === "Yes") !== !!row.kanban_mail) return false;
      if (fBuyer !== "All" && buyerText(row) !== fBuyer) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.Active_Status) return false;
      if (!text) return true;
      return ["Plant_Code", "Vendor_Code", "Vendor_Name", "Vendor_Address", "buyer_id", "buyer_name", "mail_id"].some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [scopedData, searchText, plantFilterCode, fKanban, fBuyer, fStatus]);

  const uniq = (list) => [...new Set(list.filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort();
  // the Plant filter sits in front of the search box (always visible); the badge / "Clear filters" are for the panel filters
  const activeFilterCount = [fKanban, fBuyer, fStatus].filter((v) => v !== "All").length;
  const clearFilters = () => { setFKanban("All"); setFBuyer("All"); setFStatus("All"); };

  // dropdown option lists of the dialogs
  const plantOptions = plants.map((p) => ({ value: p.Plant_ID, label: myPlantLabel(p) }));
  const plantFilterOptions = plants.map(myPlantLabel);
  const yesNoOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  // Buyer picker (searchable: the buyers of a plant can be many). A saved buyer that is not in the plant's list any more is
  // still shown, so the saved value is not lost.
  const buyerPickerOptions = [
    ...(BuyerID && !BuyerTable.some((u) => String(u.Employee_ID) === String(BuyerID)) ? [{ id: String(BuyerID), label: String(BuyerID) }] : []),
    ...BuyerTable.map((u) => ({ id: String(u.Employee_ID), label: `${u.Employee_ID} - ${u.User_Name}` })),
  ];
  const buyerPicker = (disabled) => (
    <Autocomplete
      size="small"
      sx={DIALOG_FIELD_SX}
      ListboxProps={{ style: { fontSize: 12 } }}
      filterOptions={optionFilter}
      disabled={disabled}
      options={buyerPickerOptions}
      value={buyerPickerOptions.find((o) => o.id === String(BuyerID)) || null}
      onChange={(e, newVal) => setBuyerID(newVal ? newVal.id : "")}
      getOptionLabel={(o) => (o ? o.label : "")}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      noOptionsText="No buyers found for this plant"
      renderInput={(params) => <TextField {...params} label="Buyer" placeholder={disabled ? "Select a plant first" : "Search by ID or name"} />}
    />
  );

  // ✅ Handle Add Material
  const handleAdd = async () => {
    console.log("Data being sent to the server:", {
      ActiveStatus, UserID, PlantCode, VendorCode, VendorName, VendorAddress
    });
    console.log("Add button clicked");
    if (PlantCode === '' || VendorCode === '' || VendorName === '' || VendorAddress === '') {
      alert("Please fill in all required fields");
      return;  // Exit the function if validation fails
    }

    try {
      const data = {
        UserID: UserID,
        Plant_Code: PlantCode,
        Vendor_Code: VendorCode,
        Vendor_Name: VendorName,
        Vendor_Address: VendorAddress,
        Kanban_Mail: KanbanMail === "Yes",
        Mail_ID: MailID.trim(),
        Buyer_ID: BuyerID || null,
        Active_Status: ActiveStatus,
      };
      const response = await getAdd(data);
      if (response.data.success) {
        alert(" Vendor added successfully!");
        getData(); // refresh UI (e.g. user list)
        handleCloseAddModal(); // close the modal
      } else {
        alert(response.data.message || "Failed to Vendor user.");
      }
    } catch (error) {
      console.error("Error in adding Vendor:", error);

      // Step 4: Show error from server (like Employee_ID already exists)
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while adding the Vendor.");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const data = {
        UserID: UserID,
        Vendor_ID: VendorID,
        Plant_Code: PlantCode,
        Vendor_Code: VendorCode,
        Vendor_Name: VendorName,
        Vendor_Address: VendorAddress,
        Kanban_Mail: KanbanMail === "Yes",
        Mail_ID: MailID.trim(),
        Buyer_ID: BuyerID || null,
        Active_Status: ActiveStatus,
      };

      console.log("Data being sent:", data);

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

    const DataColumns = [
      "Plant_Code",
      "Vendor_Code",
      "Vendor_Name",
      "Vendor_Address",
      "KanbanMail",
      "Mail_ID",
      "Buyer_ID",
      "Buyer_Name",

      "ActiveStatus",
    ];

    const filteredData = data.map((item) => ({
      Plant_Code: item.Plant_Code,
      Vendor_Code: item.Vendor_Code,
      Vendor_Name: item.Vendor_Name,
      Vendor_Address: item.Vendor_Address,
      KanbanMail: item.kanban_mail ? "Yes" : "No",
      Mail_ID: item.mail_id || "",
      Buyer_ID: item.buyer_id || "",
      Buyer_Name: item.buyer_name || "",
      ActiveStatus: item.Active_Status ? "Active" : "Inactive"
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, {
      header: DataColumns,
    });
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor");
    XLSX.writeFile(workbook, "Vendor_Data.xlsx");
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
        Vendor Master
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
          placeholder="Search plant, vendor, address, buyer, mail"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {visibleRows.length === scopedData.length ? `${scopedData.length} vendors` : `${visibleRows.length} of ${scopedData.length} vendors`}
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
          Add Vendor
        </Button>
        <UniqueGroupingInfo
          sections={[{ fields: ["Plant", "Vendor Code"] }]}
          intro="One vendor per combination of:"
          notes={[
            <><b>Add:</b> the same Plant + Vendor Code that already exists is rejected.</>,
            <><b>Bulk upload:</b> the same combination is <b>updated</b>, any other is <b>added</b>. A blank Kanban_Mail / Buyer_ID / Mail_ID cell keeps the saved value (a new vendor starts with Kanban Mail No). Several mail ids go in one Mail_ID cell separated by ; (for example a@x.com; b@y.com).</>,
          ]}
        />

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Kanban Mail" value={fKanban} options={["Yes", "No"]} onChange={setFKanban} minWidth={130} isSearchable={false} />
          <FilterSelect label="Buyer" value={fBuyer} options={uniq(scopedData.map(buyerText))} onChange={setFBuyer} minWidth={190} />
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
          getRowId={(row) => row.Vendor_ID}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No vendors found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add Vendor */}
      <FormDialog
        open={openAddModal}
        title="Add Vendor"
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
            setBuyerID(""); // the buyers belong to the plant
            get_Buyers({ plantId: e.target.value });
          }}
          options={plantOptions}
        />
        <TextInput
          label="Vendor Code"
          value={VendorCode}
          onChange={(e) => {
            // digits only (unchanged rule)
            const value = e.target.value;
            if (/^\d*$/.test(value)) setVendorCode(value);
          }}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        />
        <TextInput label="Vendor Name" value={VendorName} onChange={(e) => setVendorName(e.target.value)} />
        <TextInput label="Vendor Address" value={VendorAddress} onChange={(e) => setVendorAddress(e.target.value)} />
        <SelectField label="Kanban Mail" value={KanbanMail} onChange={(e) => setKanbanMail(e.target.value)} options={yesNoOptions} />
        <Box sx={{ gridColumn: "span 2" }}>
          <MailIdsInput value={MailID} onChange={setMailID} />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>{buyerPicker(!PlantCode)}</Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Edit Vendor */}
      <FormDialog
        open={openEditModal}
        title="Edit Vendor"
        onClose={() => setOpenEditModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseEditModal} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleUpdate} sx={{ ...primaryButtonSx, minWidth: 70 }}>Update</Button>
          </>
        }
      >
        <TextInput label="Plant Code" value={PlantCode} readOnly />
        <TextInput label="Vendor Code" value={VendorCode} readOnly />
        <TextInput label="Vendor Name" value={VendorName} onChange={(e) => setVendorName(e.target.value)} />
        <TextInput label="Vendor Address" value={VendorAddress} onChange={(e) => setVendorAddress(e.target.value)} />
        <SelectField label="Kanban Mail" value={KanbanMail} onChange={(e) => setKanbanMail(e.target.value)} options={yesNoOptions} />
        <Box sx={{ gridColumn: "span 2" }}>
          <MailIdsInput value={MailID} onChange={setMailID} />
        </Box>
        <Box sx={{ gridColumn: "span 2" }}>{buyerPicker(false)}</Box>
        <Box sx={{ gridColumn: "span 2" }}>
          <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
        </Box>
      </FormDialog>

      {/* Upload */}
      <FormDialog
        open={openUploadModal}
        title="Vendor Master Excel Upload"
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
            Columns: Plant_Code, Vendor_Code, Vendor_Name, Vendor_Address, the optional Kanban_Mail (Yes / No), Buyer_ID and Mail_ID, and Active_Status (Active / Inactive).
            A vendor that already exists is updated; a new one is added. A blank optional cell keeps the saved value.
          </span>
        </Box>
      </FormDialog>
    </div>
  );
};

export default Vendor;
