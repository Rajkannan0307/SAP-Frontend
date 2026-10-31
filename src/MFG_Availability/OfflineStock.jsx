import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TextField,
  Button,
  Dialog,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Typography,
  Autocomplete,
  createFilterOptions,
} from "@mui/material";
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { FaFileExcel, FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getOfflineStock, addOfflineStock, updateOfflineStock, uploadOfflineStock } from "../controller/OfflineStockApiService";
import { getMappingMaterials, getMappingVendors } from "../controller/MaterialVendorMappingApiService";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import { findPlantsNotAllowed, plantsNotAllowedMessage } from "../common/plantFileCheck";
import FilterSelect from "../components/FilterSelect";
import ValidationResponseGrid from "../components/ValidationResponseTable";
import UniqueGroupingInfo from "../components/UniqueGroupingInfo";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import { compactFieldSx, compactMenuProps, compactGridSx, primaryButtonSx, successButtonSx, outlineButtonSx } from "../components/compactUi";

// Offline Stock Status: stock of a vendor's material that is not in SAP. One record per Plant + Material + Vendor + Eff_Date.
// The Supplier Kanban adds the SUM of a month's quantities to its Total Plant Stock (Plant Stock + 103-105 Pending + Offline Stock).
// Laid out like Material - Vendor Mapping (same shared pieces). Created_By / Modified_By are the user's GEN ID (EmpId).
// The bulk upload is all or nothing: a file with wrong rows saves nothing and the wrong rows are listed in the shared validation grid below the file.

const SEARCH_KEYS = ["Plant_Code", "Vendor_Code", "Vendor_Name", "Material_Code", "Material_Description"];
const DIALOG_FIELD_SX = compactFieldSx("100%", 12);
const QTY_PATTERN = /^\d+(\.\d{1,3})?$/;

const fmtQty = (value) => (value === null || value === undefined || value === "" ? "" : Number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 }));
// "2026-10-05" -> "05-10-2026" ; "2026-10-05 14:30:00" -> "05-10-2026 14:30"
const fmtDate = (iso) => (iso && String(iso).length >= 10 ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "");
const fmtStamp = (value) => (value ? `${fmtDate(value)} ${String(value).slice(11, 16)}`.trim() : "");

const getRecordError = (quantity, effDate) => {
  if (!QTY_PATTERN.test(String(quantity ?? "").trim())) return "Quantity must be a number, 0 or more (up to 3 decimals).";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(effDate ?? ""))) return "Please choose the Eff_Date.";
  return "";
};

// thousands of materials per plant: filter as the user types and render only the first matches
const optionFilter = createFilterOptions({ limit: 200 });

const SelectField = ({ label, value, onChange, options }) => (
  <TextField select size="small" label={label} value={value} onChange={onChange} sx={DIALOG_FIELD_SX} SelectProps={{ MenuProps: compactMenuProps(12) }}>
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

const NumberInput = ({ label, value, onChange }) => (
  <TextField size="small" type="number" label={label} value={value} onChange={onChange} sx={DIALOG_FIELD_SX} inputProps={{ min: 0, step: "any" }} />
);

const DateInput = ({ label, value, onChange }) => (
  <TextField size="small" type="date" label={label} value={value} onChange={onChange} sx={DIALOG_FIELD_SX} InputLabelProps={{ shrink: true }} />
);

// Shell of the Add / Edit / Upload dialogs
const FormDialog = ({ open, title, onClose, children, actions, width = 460 }) => (
  <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { width, maxWidth: "94vw", borderRadius: "10px" } }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid #e8eaee", backgroundColor: "#f3f7ff" }}>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1a2233" }}>{title}</Typography>
      <IconButton size="small" onClick={onClose}>
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
    <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px 12px", maxHeight: "74vh", overflowY: "auto" }}>{children}</Box>
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, py: 1.25, borderTop: "1px solid #e8eaee" }}>{actions}</Box>
  </Dialog>
);

const OfflineStock = () => {
  const GenId = localStorage.getItem("EmpId"); // the GEN ID stored as Created_By / Modified_By

  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState([]); // only the plants this user may use (own plant + Data Access)
  const [MaterialTable, setMaterialTable] = useState([]);
  const [VendorTable, setVendorTable] = useState([]);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [PlantId, setPlantId] = useState("");
  const [Material, setMaterial] = useState(null);
  const [Vendor, setVendor] = useState(null);
  const [Quantity, setQuantity] = useState("");
  const [EffDate, setEffDate] = useState(""); // yyyy-MM-dd
  const [EditRow, setEditRow] = useState(null);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProblems, setUploadProblems] = useState(null);
  const fileInput = useRef(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [plantSelect, setPlantSelect] = useState("All");
  const [fPlant, setFPlant] = useState("All"); // applied plant
  const plantDefaulted = useRef(false);
  const [fVendor, setFVendor] = useState("All");
  const [fMonth, setFMonth] = useState("All");

  const columns = [
    { field: "Plant_Code", headerName: "Plant", flex: 0.5, minWidth: 65 },
    { field: "vendor", headerName: "Vendor", flex: 1.5, minWidth: 160, valueGetter: (v, row) => `${row.Vendor_Code}${row.Vendor_Name ? ` - ${row.Vendor_Name}` : ""}` },
    { field: "material", headerName: "Material", flex: 1.7, minWidth: 180, valueGetter: (v, row) => `${row.Material_Code}${row.Material_Description ? ` - ${row.Material_Description}` : ""}` },
    { field: "quantity", headerName: "Quantity", flex: 0.7, minWidth: 90, type: "number", valueFormatter: (value) => fmtQty(value) },
    { field: "eff_date", headerName: "Eff_Date", flex: 0.7, minWidth: 95, valueFormatter: (value) => fmtDate(value) },
    { field: "created_by", headerName: "Created_By", flex: 0.7, minWidth: 90 },
    { field: "created_on", headerName: "Created_On", flex: 0.9, minWidth: 125, valueFormatter: (value) => fmtStamp(value) },
    { field: "modified_by", headerName: "Modified_By", flex: 0.7, minWidth: 90 },
    { field: "modified_on", headerName: "Modified_On", flex: 0.9, minWidth: 125, valueFormatter: (value) => fmtStamp(value) },
  ];

  const getData = async () => {
    setLoading(true);
    try {
      setData(await getOfflineStock());
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

  useEffect(() => {
    getMyPlants()
      .then((res) => setPlants(Array.isArray(res) ? res : []))
      .catch((error) => console.error("Failed to load Plant list.", error));
  }, []);

  // the user's own login plant is selected and applied once, as soon as the plant list is loaded
  useEffect(() => {
    if (plantDefaulted.current || plants.length === 0) return;
    plantDefaulted.current = true;
    const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0];
    const label = myPlantLabel(own);
    setPlantSelect(label);
    setFPlant(label);
  }, [plants]);

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

  // only the records of the plants this user may use (nothing is shown until the plant list is loaded)
  const scopedData = useMemo(() => {
    const allowed = new Set(plants.map((p) => String(p.Plant_Code)));
    return (data || []).filter((row) => allowed.has(String(row.Plant_Code)));
  }, [data, plants]);

  const plantFilterOptions = plants.map(myPlantLabel);
  const plantFilterCode = fPlant === "All" ? null : String(plants.find((p) => myPlantLabel(p) === fPlant)?.Plant_Code ?? "");

  const rows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return scopedData.filter((row) => {
      if (plantFilterCode !== null && String(row.Plant_Code) !== plantFilterCode) return false;
      if (fVendor !== "All" && `${row.Vendor_Code} - ${row.Vendor_Name || ""}` !== fVendor) return false;
      if (fMonth !== "All" && String(row.eff_date).slice(0, 7) !== fMonth) return false;
      if (!text) return true;
      return SEARCH_KEYS.some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [scopedData, searchText, plantFilterCode, fVendor, fMonth]);

  const vendorOptions = [...new Set(scopedData.map((r) => `${r.Vendor_Code} - ${r.Vendor_Name || ""}`))].sort();
  const monthOptions = [...new Set(scopedData.map((r) => String(r.eff_date).slice(0, 7)).filter(Boolean))].sort().reverse();
  const activeFilterCount = [fVendor, fMonth].filter((v) => v !== "All").length;
  const clearFilters = () => { setFVendor("All"); setFMonth("All"); };

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // ---------- Add ----------
  const handleOpenAddModal = () => {
    const start = (plantFilterCode !== null && plants.find((p) => String(p.Plant_Code) === plantFilterCode))
      || plants.find((p) => Number(p.Is_Default) === 1)
      || null;
    setPlantId(start ? start.Plant_ID : "");
    setMaterial(null);
    setVendor(null);
    setMaterialTable([]);
    setVendorTable([]);
    if (start) loadPlantLists(start.Plant_ID);
    setQuantity("");
    setEffDate("");
    setOpenAddModal(true);
  };

  const handleAdd = async () => {
    if (saving) return;
    if (!PlantId || !Material || !Vendor || Quantity === "" || EffDate === "") {
      alert("Please fill in all required fields");
      return;
    }
    const error = getRecordError(Quantity, EffDate);
    if (error) {
      alert(error);
      return;
    }
    setSaving(true);
    try {
      const plant = plants.find((p) => p.Plant_ID === PlantId);
      const response = await addOfflineStock({
        UserID: GenId,
        Plant_Code: plant ? plant.Plant_Code : "",
        Vendor_Code: Vendor.Vendor_Code,
        Material_Code: Material.Material_Code,
        Quantity,
        Eff_Date: EffDate,
      });
      if (response.data.success) {
        alert("Offline stock added successfully!");
        getData();
        setOpenAddModal(false);
      } else {
        alert(response.data.message || "Failed to add the offline stock.");
      }
    } catch (err) {
      console.error("Error in adding offline stock:", err);
      alert(err.response?.data?.message || "An error occurred while adding the offline stock.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Edit (the plant, vendor and material identify the record; the quantity and the date can change) ----------
  const handleRowClick = (params) => {
    setEditRow(params.row);
    setQuantity(params.row.quantity ?? "");
    setEffDate(params.row.eff_date || "");
    setOpenEditModal(true);
  };

  const handleUpdate = async () => {
    if (saving) return;
    const error = getRecordError(Quantity, EffDate);
    if (error) {
      alert(error);
      return;
    }
    setSaving(true);
    try {
      const response = await updateOfflineStock({ UserID: GenId, Offline_Stock_ID: EditRow.offline_stock_id, Quantity, Eff_Date: EffDate });
      if (response.data.success) {
        alert(response.data.message);
        getData();
        setOpenEditModal(false);
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || "An error occurred while updating the offline stock. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Excel of the list ----------
  const handleDownloadExcel = () => {
    if (scopedData.length === 0) {
      alert("No Data Found");
      return;
    }
    const DataColumns = ["Plant_Code", "Vendor_Code", "Vendor_Name", "Material_Code", "Material_Description", "Quantity", "Eff_Date", "Created_By", "Created_On", "Modified_By", "Modified_On"];
    const filteredData = scopedData.map((item) => ({
      Plant_Code: item.Plant_Code,
      Vendor_Code: item.Vendor_Code,
      Vendor_Name: item.Vendor_Name || "",
      Material_Code: item.Material_Code,
      Material_Description: item.Material_Description || "",
      Quantity: item.quantity,
      Eff_Date: fmtDate(item.eff_date),
      Created_By: item.created_by || "",
      Created_On: fmtStamp(item.created_on),
      Modified_By: item.modified_by || "",
      Modified_On: fmtStamp(item.modified_on),
    }));
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 22 }, { wch: 36 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 18 }];
    DataColumns.forEach((_, index) => {
      const cell = worksheet[XLSX.utils.encode_cell({ c: index, r: 0 })];
      if (cell) cell.s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Offline Stock");
    XLSX.writeFile(workbook, "Offline_Stock_Status.xlsx");
  };

  // ---------- Bulk upload ----------
  const handleOpenUploadModal = () => {
    setUploadedFile(null);
    setUploadProblems(null);
    setOpenUploadModal(true);
  };
  const handleCloseUploadModal = () => {
    setOpenUploadModal(false);
    setUploadedFile(null);
    setUploadProblems(null);
    setIsUploading(false);
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "OFFLINE_STOCK";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet("OFFLINE STOCK");
    worksheet.addRow(["Plant_Code", "Vendor_Code", "Material_Code", "Quantity", "Eff_Date"]);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFADD8E6" } };
    });
    worksheet.columns = [{ width: 14 }, { width: 16, style: { numFmt: "@" } }, { width: 24, style: { numFmt: "@" } }, { width: 14 }, { width: 14, style: { numFmt: "@" } }];
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.getCell("B1").note = "The vendor code of the Vendor Master (an active vendor of the plant).";
    worksheet.getCell("C1").note = "The material code of an active direct material of the plant.";
    worksheet.getCell("D1").note = "A number, 0 or more (up to 3 decimals).";
    worksheet.getCell("E1").note = "The effective date in DD-MM-YYYY, for example 05-10-2026 (an Excel date cell also works).";
    const plantCodes = (plants || []).map((p) => `${p.Plant_Code}`);
    if (plantCodes.length) {
      worksheet.dataValidations.add("A2:A1000", { type: "list", allowBlank: false, formulae: [`"${plantCodes.join(",")}"`] });
    }
    worksheet.dataValidations.add("D2:D1000", {
      type: "decimal", operator: "greaterThanOrEqual", formulae: [0], allowBlank: false,
      showErrorMessage: true, errorTitle: "Invalid value", error: "Enter a number, 0 or more.",
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "OfflineStock_Template.xlsx");
  };

  const handleUploadData = async () => {
    if (!uploadedFile) {
      alert("Please select a file first.");
      return;
    }
    if (isUploading) return;
    setIsUploading(true);
    setUploadProblems(null);
    try {
      // only plants this user may use (own + Data Access): check the Plant_Code column of the file before uploading
      const { blocked, plants: myPlants } = await findPlantsNotAllowed(uploadedFile, "Plant_Code");
      if (blocked.length > 0) {
        alert(plantsNotAllowedMessage(blocked, myPlants));
        setIsUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("UserID", GenId);
      const response = await uploadOfflineStock(formData);
      alert(response.data.message);
      getData();
      handleCloseUploadModal();
      return;
    } catch (error) {
      if (error.response?.status === 422 && error.response.data?.invalidTable) {
        setUploadProblems(error.response.data); // the wrong rows, in the shared validation grid below the file
      } else {
        alert(error.response?.data?.message || "Error while processing the file.");
      }
    }
    setIsUploading(false);
  };

  const plantOptions = plants.map((p) => ({ value: p.Plant_ID, label: myPlantLabel(p) }));
  const pickerProps = { size: "small", sx: DIALOG_FIELD_SX, ListboxProps: { style: { fontSize: 12 } }, filterOptions: optionFilter };

  return (
    <div style={{ padding: "20px 20px", backgroundColor: "#F5F5F5", marginTop: "50px", display: "flex", flexDirection: "column", height: "calc(100vh - 50px)" }}>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>Offline Stock Status</Typography>

      {/* Search, filters and actions */}
      <div style={{ backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 2px rgba(16,24,40,0.04)", padding: "7px 10px", marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
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
          placeholder="Search plant, vendor, material"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {rows.length === scopedData.length ? `${scopedData.length} records` : `${rows.length} of ${scopedData.length} records`}
        </span>
        <Button onClick={handleOpenUploadModal} variant="outlined" disableElevation startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />} sx={outlineButtonSx}>
          Upload
        </Button>
        <Button onClick={handleDownloadExcel} variant="contained" disableElevation startIcon={<FaFileExcel size={13} />} sx={successButtonSx}>
          Excel
        </Button>
        <Button onClick={handleOpenAddModal} variant="contained" disableElevation startIcon={<AddIcon sx={{ fontSize: 16 }} />} sx={primaryButtonSx}>
          Add Offline Stock
        </Button>
        <UniqueGroupingInfo
          sections={[{ fields: ["Plant", "Material", "Vendor", "Eff_Date"] }]}
          intro="One record per combination of:"
          notes={[
            <><b>Add:</b> a record with the same Plant, Material, Vendor and Eff_Date is rejected - edit it instead.</>,
            <><b>Bulk upload:</b> the same combination is <b>updated</b>, any other is <b>added</b>. If any row is wrong nothing is saved and the wrong rows are listed.</>,
            <><b>Supplier Kanban:</b> the quantities of the selected month are added up and counted in the vendor's Plant Stock.</>,
          ]}
        />

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Vendor" value={fVendor} options={vendorOptions} onChange={setFVendor} minWidth={240} />
          <FilterSelect label="Eff month (yyyy-MM)" value={fMonth} options={monthOptions} onChange={setFMonth} minWidth={150} />
        </FilterPanel>
      </div>

      {/* DataGrid */}
      <div style={{ flexGrow: 1, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #e8eaee", boxShadow: "0 1px 3px rgba(16,24,40,0.05)", minHeight: 0, overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.offline_stock_id}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          // the audit columns are hidden: they can be shown again from the Columns button (and they stay in the Excel)
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            columns: { columnVisibilityModel: { created_by: false, created_on: false, modified_by: false, modified_on: false } },
          }}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No offline stock found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add */}
      <FormDialog
        open={openAddModal}
        title="Add Offline Stock"
        onClose={() => setOpenAddModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpenAddModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleAdd} disabled={saving} sx={{ ...primaryButtonSx, minWidth: 70 }}>{saving ? "Saving..." : "Add"}</Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2" }}>
          <SelectField label="Plant" value={PlantId} onChange={(e) => { setPlantId(e.target.value); loadPlantLists(e.target.value); }} options={plantOptions} />
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
        <NumberInput label="Quantity" value={Quantity} onChange={(e) => setQuantity(e.target.value)} />
        <DateInput label="Eff_Date" value={EffDate} onChange={(e) => setEffDate(e.target.value)} />
      </FormDialog>

      {/* Edit */}
      <FormDialog
        open={openEditModal}
        title="Edit Offline Stock"
        onClose={() => setOpenEditModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpenEditModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleUpdate} disabled={saving} sx={{ ...primaryButtonSx, minWidth: 70 }}>{saving ? "Saving..." : "Update"}</Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2" }}><TextInput label="Plant" value={EditRow?.Plant_Code ?? ""} readOnly /></Box>
        <Box sx={{ gridColumn: "span 2" }}><TextInput label="Vendor" value={EditRow ? `${EditRow.Vendor_Code} - ${EditRow.Vendor_Name || ""}` : ""} readOnly /></Box>
        <Box sx={{ gridColumn: "span 2" }}><TextInput label="Material" value={EditRow ? `${EditRow.Material_Code} - ${EditRow.Material_Description || ""}` : ""} readOnly /></Box>
        <NumberInput label="Quantity" value={Quantity} onChange={(e) => setQuantity(e.target.value)} />
        <DateInput label="Eff_Date" value={EffDate} onChange={(e) => setEffDate(e.target.value)} />
      </FormDialog>

      {/* Upload */}
      <FormDialog
        open={openUploadModal}
        title="Offline Stock Excel Upload"
        onClose={handleCloseUploadModal}
        width={uploadProblems ? 860 : 460}
        actions={
          <>
            <Button variant="outlined" onClick={handleCloseUploadModal} sx={outlineButtonSx}>Close</Button>
            <Button variant="contained" disableElevation onClick={handleUploadData} disabled={isUploading} sx={{ ...primaryButtonSx, minWidth: 70 }}>{isUploading ? "Uploading..." : "Upload"}</Button>
          </>
        }
      >
        <Box sx={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Box>
            <Button variant="outlined" onClick={downloadTemplate} startIcon={<FaDownload size={12} />} sx={outlineButtonSx}>Download Template</Button>
          </Box>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => { setUploadedFile(e.target.files[0]); setUploadProblems(null); }}
            style={{ fontSize: 11, padding: "6px 8px", backgroundColor: "#fafbfc", border: "1px dashed #dde1e7", borderRadius: 6, cursor: "pointer" }}
          />
          <span style={{ fontSize: 11, lineHeight: 1.5, color: "#6b7280" }}>
            Columns: Plant_Code, Vendor_Code, Material_Code, Quantity and Eff_Date (DD-MM-YYYY). A Plant + Material + Vendor + Eff_Date that already exists is
            updated; a new one is added. If any row is wrong nothing is saved and the wrong rows are shown here.
          </span>
        </Box>
        {uploadProblems && <Box sx={{ gridColumn: "span 2" }}><ValidationResponseGrid response={uploadProblems} /></Box>}
      </FormDialog>
    </div>
  );
};

export default OfflineStock;
