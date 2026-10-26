import React, { useState, useEffect, useMemo } from "react";
import {
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
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { getCategoryDetails, getCategoryProducts, addCategory, updateCategory } from "../controller/MaterialCategoryApiService";
import FilterSelect from "../components/FilterSelect";
import UniqueGroupingInfo from "../components/UniqueGroupingInfo";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import { compactFieldSx, compactMenuProps, compactGridSx, primaryButtonSx, successButtonSx, outlineButtonSx } from "../components/compactUi";

const DIALOG_FIELD_SX = compactFieldSx("100%", 12);

// Compact select used by the Add / Edit dialogs
const SelectField = ({ label, value, onChange, options }) => (
  <TextField select size="small" label={label} value={value} onChange={onChange} sx={DIALOG_FIELD_SX} SelectProps={{ MenuProps: compactMenuProps(12) }}>
    {options.map((o) => (
      <MenuItem key={o.value} value={o.value} sx={{ fontSize: 12 }}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>
);

const TextInput = ({ label, value, onChange, inputProps }) => (
  <TextField size="small" label={label} value={value} onChange={onChange} sx={DIALOG_FIELD_SX} inputProps={inputProps} />
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

const MaterialCategory = () => {
  const EmpId = localStorage.getItem("EmpId"); // the employee (gen_id): stored as created_by / modified_by
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fProduct, setFProduct] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [pageModel, setPageModel] = useState({ page: 0, pageSize: 25 });

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [CategoryID, setCategoryID] = useState("");
  const [ProductID, setProductID] = useState("");
  const [CategoryName, setCategoryName] = useState("");
  const [ActiveStatus, setActiveStatus] = useState(true);

  const getData = async () => {
    setLoading(true);
    try {
      const response = await getCategoryDetails();
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
    getCategoryProducts()
      .then((res) => setProducts(Array.isArray(res) ? res : []))
      .catch((error) => console.error("Failed to load the Products.", error));
  }, []);

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
    { field: "prod_name", headerName: "Product", flex: 1, minWidth: 120 },
    { field: "material_category_name", headerName: "Material Category", flex: 1.6, minWidth: 170 },
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
    { field: "created_on", headerName: "Created On", flex: 0.7, minWidth: 90 },
    { field: "modified_by", headerName: "Modified By", flex: 0.7, minWidth: 90 },
    { field: "modified_on", headerName: "Modified On", flex: 0.7, minWidth: 90 },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // Search box + filters, applied live to the loaded list
  const visibleRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return rows.filter((row) => {
      if (fProduct !== "All" && row.prod_name !== fProduct) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.active_status) return false;
      if (!text) return true;
      return ["prod_name", "material_category_name", "created_by", "modified_by"].some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [rows, searchText, fProduct, fStatus]);

  const activeFilterCount = fStatus !== "All" ? 1 : 0;
  const clearFilters = () => setFStatus("All");
  const productFilterOptions = [...new Set(rows.map((r) => r.prod_name).filter(Boolean))];
  const productOptions = products.map((p) => ({ value: p.prod_id, label: p.prod_name }));

  const handleOpenAddModal = () => {
    setCategoryID("");
    setProductID("");
    setCategoryName("");
    setActiveStatus(true);
    setOpenAddModal(true);
  };

  const handleRowClick = (params) => {
    setCategoryID(params.row.mat_cat_id);
    setProductID(params.row.prod_id);
    setCategoryName(params.row.material_category_name || "");
    setActiveStatus(!!params.row.active_status);
    setOpenEditModal(true);
  };

  const handleAdd = async () => {
    if (!ProductID || !CategoryName.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      const response = await addCategory({ UserID: EmpId, prod_id: ProductID, material_category_name: CategoryName.trim(), active_status: ActiveStatus });
      alert(response.data.message || "Material Category added successfully.");
      getData();
      setOpenAddModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred while adding the Material Category.");
    }
  };

  const handleUpdate = async () => {
    if (!ProductID || !CategoryName.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      const response = await updateCategory({ UserID: EmpId, mat_cat_id: CategoryID, prod_id: ProductID, material_category_name: CategoryName.trim(), active_status: ActiveStatus });
      alert(response.data.message || "Material Category updated successfully.");
      getData();
      setOpenEditModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred while updating the Material Category.");
    }
  };

  // Excel download of the list as shown
  const handleDownloadExcel = () => {
    if (visibleRows.length === 0) {
      alert("No Data Found");
      return;
    }
    const DataColumns = ["SI_No", "Product", "Material_Category", "ActiveStatus", "Created_By", "Created_On", "Modified_By", "Modified_On"];
    const filteredData = visibleRows.map((item, i) => ({
      SI_No: i + 1,
      Product: item.prod_name || "",
      Material_Category: item.material_category_name,
      ActiveStatus: item.active_status ? "Active" : "Inactive",
      Created_By: item.created_by || "",
      Created_On: item.created_on || "",
      Modified_By: item.modified_by || "",
      Modified_On: item.modified_on || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = DataColumns.map((c) => ({ wch: c === "SI_No" ? 8 : c === "Material_Category" ? 32 : 16 }));
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Material Category");
    XLSX.writeFile(workbook, "Material_Category_Data.xlsx");
  };

  const dialogFields = (
    <>
      <Box sx={{ gridColumn: "span 2" }}>
        <SelectField label="Product" value={ProductID} onChange={(e) => setProductID(e.target.value)} options={productOptions} />
      </Box>
      <Box sx={{ gridColumn: "span 2" }}>
        <TextInput label="Material Category Name" value={CategoryName} onChange={(e) => setCategoryName(e.target.value)} inputProps={{ maxLength: 100 }} />
      </Box>
      <Box sx={{ gridColumn: "span 2" }}>
        <ActiveSwitch checked={!!ActiveStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
      </Box>
    </>
  );

  return (
    <div style={{ padding: "20px 20px", backgroundColor: "#F5F5F5", marginTop: "50px", display: "flex", flexDirection: "column", height: "calc(100vh - 50px)" }}>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>Material Category</Typography>

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
        <FilterSelect label="Product" value={fProduct} options={productFilterOptions} onChange={setFProduct} minWidth={190} />
        <TextField
          size="small"
          placeholder="Search product, category"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {visibleRows.length === rows.length ? `${rows.length} material categories` : `${visibleRows.length} of ${rows.length} material categories`}
        </span>
        <Button onClick={handleDownloadExcel} variant="contained" disableElevation startIcon={<FaFileExcel size={13} />} sx={successButtonSx}>
          Excel
        </Button>
        <Button onClick={handleOpenAddModal} variant="contained" disableElevation startIcon={<AddIcon sx={{ fontSize: 16 }} />} sx={primaryButtonSx}>
          Add Material Category
        </Button>
        <UniqueGroupingInfo
          sections={[{ fields: ["Product", "Material Category Name"] }]}
          intro="One material category per combination of:"
          notes={[<>The same name (case and extra spaces ignored) in the same Product is rejected on Add and Edit. The same name can be used in another Product, but then the Material Master bulk upload cannot tell the two apart.</>]}
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
          getRowId={(row) => row.mat_cat_id}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ columns: { columnVisibilityModel: { created_by: false, created_on: false, modified_by: false, modified_on: false } } }}
          paginationModel={pageModel}
          onPaginationModelChange={setPageModel}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No material categories found." }}
          sx={compactGridSx}
        />
      </div>

      {/* Add */}
      <FormDialog
        open={openAddModal}
        title="Add Material Category"
        onClose={() => setOpenAddModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpenAddModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleAdd} sx={{ ...primaryButtonSx, minWidth: 70 }}>Add</Button>
          </>
        }
      >
        {dialogFields}
      </FormDialog>

      {/* Edit */}
      <FormDialog
        open={openEditModal}
        title="Edit Material Category"
        onClose={() => setOpenEditModal(false)}
        actions={
          <>
            <Button variant="outlined" onClick={() => setOpenEditModal(false)} sx={outlineButtonSx}>Cancel</Button>
            <Button variant="contained" disableElevation onClick={handleUpdate} sx={{ ...primaryButtonSx, minWidth: 70 }}>Update</Button>
          </>
        }
      >
        {dialogFields}
      </FormDialog>
    </div>
  );
};

export default MaterialCategory;
