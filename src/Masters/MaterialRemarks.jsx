import React, { useState, useEffect, useMemo, useRef } from "react";
import { TextField, Button, Chip, CircularProgress, Typography } from "@mui/material";
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { getRemarkDetails } from "../controller/MaterialRemarksApiService";
import { getMyPlants, myPlantLabel } from "../controller/CommonApiService";
import FilterSelect from "../components/FilterSelect";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import { compactFieldSx, compactGridSx, primaryButtonSx, successButtonSx } from "../components/compactUi";

// YYYY-MM-DD of a date in local time
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const buyerText = (row) => (row.buyer_id ? (row.buyer_name ? `${row.buyer_id} - ${row.buyer_name}` : String(row.buyer_id)) : "");

// Material Remarks: view only (the remarks are written elsewhere). Plant and date range are applied with Search, the rest filters live.
const MaterialRemarks = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fBuyer, setFBuyer] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [pageModel, setPageModel] = useState({ page: 0, pageSize: 25 });

  // Only the plants this user may use (own plant + Data Access), same rule as Vendor Master
  const [plants, setPlants] = useState([]);
  const [plantSelect, setPlantSelect] = useState("All");
  const [fPlant, setFPlant] = useState("All"); // applied plant
  const plantDefaulted = useRef(false);

  const today = new Date();
  const [fromDate, setFromDate] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [toDate, setToDate] = useState(isoDate(today));

  const getData = async (from = fromDate, to = toDate) => {
    setLoading(true);
    try {
      const response = await getRemarkDetails(from, to);
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

  // The user's own login plant is selected and applied once the plant list is loaded
  useEffect(() => {
    if (plantDefaulted.current || plants.length === 0) return;
    plantDefaulted.current = true;
    const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0];
    const label = myPlantLabel(own);
    setPlantSelect(label);
    setFPlant(label);
  }, [plants]);

  const handleSearch = () => {
    if (fromDate && toDate && fromDate > toDate) {
      alert("From date cannot be after To date.");
      return;
    }
    setFPlant(plantSelect);
    getData();
  };

  // only the remarks of the plants this user may use
  const scopedRows = useMemo(() => {
    const allowed = new Set(plants.map((p) => String(p.Plant_Code)));
    return rows.filter((row) => allowed.has(String(row.Plant_Code)));
  }, [rows, plants]);
  const plantFilterCode = fPlant === "All" ? null : String(plants.find((p) => myPlantLabel(p) === fPlant)?.Plant_Code ?? "");

  const visibleRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return scopedRows.filter((row) => {
      if (plantFilterCode !== null && String(row.Plant_Code) !== plantFilterCode) return false;
      if (fBuyer !== "All" && buyerText(row) !== fBuyer) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.active_status) return false;
      if (!text) return true;
      return ["Plant_Code", "Material_Code", "Description", "buyer_id", "buyer_name", "remarks"].some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [scopedRows, searchText, plantFilterCode, fBuyer, fStatus]);

  const uniq = (list) => [...new Set(list.filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort();
  const activeFilterCount = [fBuyer, fStatus].filter((v) => v !== "All").length;
  const clearFilters = () => { setFBuyer("All"); setFStatus("All"); };

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
    { field: "remark_date", headerName: "Date", flex: 0.7, minWidth: 90 },
    { field: "Plant_Code", headerName: "Plant", flex: 0.5, minWidth: 65 },
    { field: "Material_Code", headerName: "Material Code", flex: 1, minWidth: 110 },
    { field: "Description", headerName: "Description", flex: 1.5, minWidth: 150 },
    { field: "buyer_id", headerName: "Buyer", flex: 1.1, minWidth: 130, valueGetter: (value, row) => buyerText(row) },
    { field: "remarks", headerName: "Remarks", flex: 2.2, minWidth: 200 },
    {
      field: "active_status",
      headerName: "Status",
      flex: 0.6,
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

  // Excel download of the list as shown
  const handleDownloadExcel = () => {
    if (visibleRows.length === 0) {
      alert("No Data Found");
      return;
    }
    const DataColumns = ["SI_No", "Date", "Plant", "Material_Code", "Description", "Buyer_ID", "Buyer_Name", "Remarks", "ActiveStatus", "Created_By", "Created_On", "Modified_By", "Modified_On"];
    const filteredData = visibleRows.map((item, i) => ({
      SI_No: i + 1,
      Date: item.remark_date || "",
      Plant: item.Plant_Code || "",
      Material_Code: item.Material_Code || "",
      Description: item.Description || "",
      Buyer_ID: item.buyer_id || "",
      Buyer_Name: item.buyer_name || "",
      Remarks: item.remarks || "",
      ActiveStatus: item.active_status ? "Active" : "Inactive",
      Created_By: item.created_by || "",
      Created_On: item.created_on || "",
      Modified_By: item.modified_by || "",
      Modified_On: item.modified_on || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = DataColumns.map((c) => ({ wch: c === "SI_No" ? 8 : c === "Remarks" ? 60 : /Description|Buyer_Name/.test(c) ? 32 : 16 }));
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = { font: { bold: true, color: { rgb: "000000" } }, fill: { fgColor: { rgb: "FFFF00" } }, alignment: { horizontal: "center" } };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Material Remarks");
    XLSX.writeFile(workbook, "Material_Remarks_Data.xlsx");
  };

  return (
    <div style={{ padding: "20px 20px", backgroundColor: "#F5F5F5", marginTop: "50px", display: "flex", flexDirection: "column", height: "calc(100vh - 50px)" }}>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>Material Remarks</Typography>

      {/* Filters and actions */}
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
        <FilterSelect label="Plant" value={plantSelect} options={plants.map(myPlantLabel)} onChange={setPlantSelect} minWidth={190} />
        <TextField size="small" type="date" label="From" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={compactFieldSx(140)} />
        <TextField size="small" type="date" label="To" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={compactFieldSx(140)} />
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
          placeholder="Search material, description, buyer, remarks"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {visibleRows.length === scopedRows.length ? `${scopedRows.length} remarks` : `${visibleRows.length} of ${scopedRows.length} remarks`}
        </span>
        <Button onClick={handleDownloadExcel} variant="contained" disableElevation startIcon={<FaFileExcel size={13} />} sx={successButtonSx}>
          Excel
        </Button>

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect label="Buyer" value={fBuyer} options={uniq(scopedRows.map(buyerText))} onChange={setFBuyer} minWidth={200} />
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
          getRowId={(row) => row.rid}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          initialState={{ columns: { columnVisibilityModel: { created_by: false, created_on: false, modified_by: false, modified_on: false } } }}
          paginationModel={pageModel}
          onPaginationModelChange={setPageModel}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No remarks found." }}
          sx={{ ...compactGridSx, "& .MuiDataGrid-row": { cursor: "default" } }}
        />
      </div>
    </div>
  );
};

export default MaterialRemarks;
