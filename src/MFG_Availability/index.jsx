import React, { useState, useEffect } from "react";
import { TextField, Button, IconButton, MenuItem, CircularProgress } from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { FaFileExcel } from "react-icons/fa";
import { EyeIcon } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { format } from "date-fns";
import SectionHeading from "../components/Header";
import { compactFieldSx, compactButtonSx } from "../components/MfgListScreen";
import { getPlantdetails } from "../controller/CommonApiService";
import { GetMfgBomListApi, GetMfgBomExportApi } from "../controller/MfgBomApiService";
import AddEditMfgBomDialog from "./AddEditMfgBom";
import MfgBomBulkUpload from "./BulkUploadMfgBom";
import ViewMfgBomChildDialog from "./ViewMfgBomChild";

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const MFG_BOM = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [editData, setEditData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  // Plant filter - narrows the list already loaded below; "ALL" = every plant
  // (exactly the list the screen always showed).
  const [plants, setPlants] = useState([]);
  const [plantFilter, setPlantFilter] = useState("ALL"); // dropdown selection
  const [appliedPlant, setAppliedPlant] = useState("ALL"); // applied on Submit
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      field: "mfg_bom_id",
      headerName: "SI No",
      width: 80,
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    { field: "plant", headerName: "Plant", width: 100 },
    { field: "plant_name", headerName: "Plant Name", width: 100 },
    { field: "fg_part_no", headerName: "FG Part", width: 130 },
    { field: "fg_part_desc", headerName: "Description", flex: 1 },
    { field: "child_count", headerName: "Child Rows", width: 110, align: "center", headerAlign: "center" },
    {
      field: "created_on",
      headerName: "Created On",
      width: 140,
      renderCell: (params) => (params.value ? format(new Date(params.value), "dd-MM-yyyy") : ""),
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setEditData(params.row);
              setOpenDialog(true);
            }}
            title="Edit"
          >
            <EditIcon fontSize="12px" />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setViewData(params.row);
              setOpenViewDialog(true);
            }}
            title="View"
          >
            <EyeIcon fontSize="12px" />
          </IconButton>
        </>
      ),
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await GetMfgBomListApi();
      setOriginalRows(response?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshData]);

  useEffect(() => {
    getPlantdetails()
      .then((res) => setPlants(res || []))
      .catch((error) => console.error("Failed to load Plant list.", error));
  }, []);

  // Visible rows = loaded list -> Plant filter -> search text. Search is the
  // same live match as before (plant, FG part, description).
  useEffect(() => {
    const text = searchText.trim().toLowerCase();
    const byPlant = appliedPlant === "ALL" ? originalRows : originalRows.filter((row) => String(row.plant) === String(appliedPlant));
    const filteredRows = byPlant.filter((row) =>
      ["plant", "fg_part_no", "fg_part_desc"].some((key) => {
        const value = row[key];
        return value?.toString().toLowerCase().includes(text);
      })
    );
    setRows(text ? filteredRows : byPlant);
  }, [originalRows, appliedPlant, searchText]);

  // Submit: apply the selected Plant and reload the list.
  const handleSubmit = () => {
    setAppliedPlant(plantFilter);
    fetchData();
  };

  const handleOpenAdd = () => {
    setEditData(null);
    setOpenDialog(true);
  };

  const handleDownloadExcel = async () => {
    const response = await GetMfgBomExportApi();
    const data = response || [];

    if (data.length === 0) {
      alert("No Data Found");
      return;
    }

    const DataColumns = [
      "SI No",
      "Plant",
      "Plant Name",
      "FG Part",
      "FG Part Description",
      "Part Name",
      "Part No",
      "Part No Description",
      "Operation No",
      "Operation Name",
      "Valuation/Procurement",
      "Vendor Code",
      "Vendor Name",
    ];

    const filteredData = data.map((item, index) => ({
      "SI No": index + 1,
      Plant: item.plant,
      "Plant Name": item.plant_name,
      "FG Part": item.fg_part_no,
      "FG Part Description": item.fg_part_desc,
      "Part Name": item.part_name,
      "Part No": item.part_no,
      "Part No Description": item.part_no_desc,
      "Operation No": item.opt_no,
      "Operation Name": item.opt_name,
      "Valuation/Procurement": item.Valuation_Name,
      "Vendor Code": item.Vendor_Code,
      "Vendor Name": item.Vendor_Name,
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = DataColumns.map(() => ({ wch: 20 }));

    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: "FFFF00" } },
        alignment: { horizontal: "center" },
      };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MFG_BOM");
    XLSX.writeFile(workbook, "MFG_BOM_Data.xlsx");
  };

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
        <SectionHeading>Manufacturing BOM</SectionHeading>
      </div>

      {/* Filters + actions - same compact card as the other MFG screens */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField
            select
            size="small"
            label="Plant"
            value={plantFilter}
            onChange={(e) => setPlantFilter(e.target.value)}
            sx={compactFieldSx(190)}
          >
            <MenuItem sx={{ fontSize: 11.5, fontWeight: 600 }} value="ALL">All Plants</MenuItem>
            {plants.map((p) => (
              <MenuItem sx={{ fontSize: 11.5 }} key={p.Plant_ID} value={p.Plant_Code}>
                {`${p.Plant_Code} - ${p.Plant_Name}`}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 15 }} />}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Submit"}
          </Button>
        </div>

        <div className="flex justify-center items-center gap-2">
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search FG part / description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
            sx={compactFieldSx(260)}
          />
          <IconButton
            onClick={handleDownloadExcel}
            title="Download Excel"
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
          <MfgBomBulkUpload
            open={bulkUploadOpen}
            onClose={() => setBulkUploadOpen(false)}
            onOpen={() => setBulkUploadOpen(true)}
            setRefreshData={setRefreshData}
          />
          <IconButton
            onClick={handleOpenAdd}
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
          minHeight: 0,
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          getRowId={(row) => `${row.plant}_${row.fg_part}`}
          disableRowSelectionOnClick
          disableColumnMenu
          slots={{ toolbar: CustomToolbar }}
          columnHeaderHeight={36}
          rowHeight={38}
          localeText={{ noRowsLabel: loading ? "" : "No Manufacturing BOM found for the selected filters." }}
          sx={{
            height: "100%",
            border: "none",
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": { color: "#333", fontSize: "11px", padding: "0 8px", borderRight: "none" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaders": { position: "sticky", top: 0, zIndex: 2 },
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#d0dcf5", color: "#000000", padding: "0 8px" },
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10.5px", fontWeight: "bold", color: "#000000" },
            "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "#000000" },
            "& .MuiDataGrid-row": { backgroundColor: "#fff" },
            "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#fafbfc" },
            "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
            "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
            "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 28 },
            "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
            "& .MuiDataGrid-footerContainer": { minHeight: 34 },
            "& .MuiTablePagination-root": { overflow: "visible" },
            "& .MuiTablePagination-toolbar": { minHeight: "34px !important", height: 34, paddingLeft: 8, paddingRight: 4 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 11, marginTop: 0, marginBottom: 0 },
            "& .MuiTablePagination-select": { fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset" },
            "& .MuiTablePagination-selectIcon": { fontSize: 16 },
            "& .MuiTablePagination-actions .MuiIconButton-root": { padding: 4, width: 24, height: 24 },
          }}
        />
      </div>

      <AddEditMfgBomDialog
        open={openDialog}
        setOpenAddModal={setOpenDialog}
        setRefreshData={setRefreshData}
        editData={editData}
      />
      <ViewMfgBomChildDialog
        open={openViewDialog}
        setOpenAddModal={setOpenViewDialog}
        mfgBomData={viewData}
      />
    </div>
  );
};

export default MFG_BOM;
