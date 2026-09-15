import React, { useState, useEffect } from "react";
import { TextField, Button, IconButton } from "@mui/material";
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
    const response = await GetMfgBomListApi();
    setOriginalRows(response?.data || []);
    setRows(response?.data || []);
  };

  useEffect(() => {
    fetchData();
  }, [refreshData]);

  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
    const filteredRows = originalRows.filter((row) =>
      ["plant", "fg_part_no", "fg_part_desc"].some((key) => {
        const value = row[key];
        return value?.toString().toLowerCase().includes(text);
      })
    );
    setRows(text ? filteredRows : originalRows);
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

        <div className="flex justify-center items-center gap-2">
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
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "calc(5 * 48px)",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          getRowId={(row) => `${row.plant}_${row.fg_part}`}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          columnHeaderHeight={35}
          rowHeight={35}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd",
              color: "black",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "13px",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5",
              "&:hover": { backgroundColor: "#f5f5f5" },
            },
            "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
            "& .MuiDataGrid-cell": { color: "#333", fontSize: "12px" },
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
