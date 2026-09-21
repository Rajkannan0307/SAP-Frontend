import { useEffect, useState } from "react";
import { Dialog, DialogTitle, IconButton } from "@mui/material";
import { MdOutlineCancel } from "react-icons/md";
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { GetMfgBomChildApi } from "../controller/MfgBomApiService";

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const ViewMfgBomChildDialog = ({ open, setOpenAddModal, mfgBomData }) => {
  const [rows, setRows] = useState([]);

  const handleClose = () => setOpenAddModal(false);

  const columns = [
    {
      field: "mfg_bom_id",
      headerName: "SI No",
      width: 50,
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    { field: "plant", headerName: "Plant", width: 65, renderCell: () => mfgBomData?.plant || "" },
    { field: "fg_part", headerName: "FG Part", width: 90, renderCell: () => mfgBomData?.fg_part_no || "" },
    { field: "fg_part_desc", headerName: "FG Part Description", flex: 2, renderCell: () => mfgBomData?.fg_part_desc || "" },
    { field: "part_name_desc", headerName: "Part Name", width: 110 },
    { field: "part_no_code", headerName: "Part No", width: 100 },
    { field: "part_no_desc", headerName: "Part No Description", flex: 1 },
    { field: "opt_no", headerName: "Opt No", width: 65, align: "center", headerAlign: "center" },
    { field: "opt_name", headerName: "Opt Name", flex: 1 },
    { field: "Valuation_Name", headerName: "Valuation/Procurement", flex: 1 },
    { field: "Vendor_Code", headerName: "Vendor Code", width: 65 },
    { field: "Vendor_Name", headerName: "Vendor Name", flex: 1 },
    {
      field: "Is_assembly_part",
      headerName: "Assembly Part",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const isAssembly = Boolean(params.value);
        return (
          <span
            style={{
              padding: "3px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "white",
              backgroundColor: isAssembly ? "#1565c0" : "#9e9e9e",
            }}
          >
            {isAssembly ? "Yes" : "No"}
          </span>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => {
        const isActive = Boolean(params.value);
        return (
          <span
            style={{
              padding: "3px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold",
              color: "white",
              backgroundColor: isActive ? "#2e7d32" : "#d32f2f",
            }}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const response = await GetMfgBomChildApi(mfgBomData.plant, mfgBomData.fg_part);
      setRows(response || []);
    };
    if (open && mfgBomData) fetchData();
  }, [open, mfgBomData]);

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby="view-mfg-bom-title" maxWidth="xl" fullWidth>
      <DialogTitle id="view-mfg-bom-title" sx={{ pl: 2, pr: 1, py: 0.5 }}>
        <div className="flex justify-between items-center">
          <div className="text-sm font-semibold text-blue-600">MFG BOM</div>
          <IconButton size="small" onClick={handleClose}>
            <MdOutlineCancel size={20} />
          </IconButton>
        </div>
      </DialogTitle>
      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          width: "100%",
          height: "42rem",
          paddingInline: 10,
          paddingBottom: 10,
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.mfg_bom_id}
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
              fontSize: "12px",
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
    </Dialog>
  );
};

export default ViewMfgBomChildDialog;
