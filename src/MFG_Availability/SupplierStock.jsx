import React, { useState, useEffect } from "react";
import { TextField, Button, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { MdOutlineCancel } from "react-icons/md";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import { format } from "date-fns";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import { GetSupplierStockListApi, FetchSupplierStockApi } from "../controller/MfgBomApiService";
import ValidationResponseGrid from "../components/ValidationResponseTable";

// Error codes that are "nothing to do right now" rather than a real failure —
// shown as a warning toast, not an error toast.
const WARNING_CODES = new Set(["NO_FILE_FOUND", "NO_NEW_FILE"]);

const CustomToolbar = () => (
  <GridToolbarContainer>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const SupplierStock = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [validationResponse, setValidationResponse] = useState(null);

  const columns = [
    {
      field: "supplier_stock_id",
      headerName: "SI No",
      width: 70,
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    { field: "plant", headerName: "Plant", width: 90 },
    { field: "supplier_code", headerName: "Supplier Code", width: 130 },
    { field: "supplier_name", headerName: "Supplier Name", flex: 1, minWidth: 160 },
    { field: "material_code", headerName: "Material Code", width: 150 },
    { field: "material_desc", headerName: "Material Description", flex: 1, minWidth: 180 },
    { field: "unrestricted_qty", headerName: "Unrestricted Qty", width: 130, align: "center", headerAlign: "center" },
    {
      field: "stock_date",
      headerName: "Stock Date",
      width: 150,
      renderCell: (params) => (params.value ? format(new Date(params.value), "dd-MM-yyyy HH:mm") : ""),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await GetSupplierStockListApi();
      setOriginalRows(response || []);
      setRows(response || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load Supplier Stock data.");
      setOriginalRows([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
    const filteredRows = originalRows.filter((row) =>
      ["plant", "supplier_code", "supplier_name", "material_code", "material_desc"].some((key) => {
        const value = row[key];
        return value?.toString().toLowerCase().includes(text);
      })
    );
    setRows(text ? filteredRows : originalRows);
  };

  const handleFetch = async () => {
    // Guard against duplicate clicks while a fetch is already in flight.
    if (fetching) return;
    setFetching(true);
    setValidationResponse(null);
    try {
      const userId = localStorage.getItem("EmpId");
      const response = await FetchSupplierStockApi({ userId });
      const result = response.data;
      toast.success(
        `Supplier Stock fetched successfully. New snapshot inserted: ${result.inserted} row(s), previous batch deactivated: ${result.inactivated} row(s).`
      );
      await fetchData();
    } catch (error) {
      const data = error?.response?.data;
      const code = data?.code;
      const message = data?.message || "An error occurred while fetching Supplier Stock. Please try again.";

      if (code === "VALIDATION_FAILED") {
        // Show the same reusable invalid-rows grid used by bulk uploads,
        // instead of just a toast, so the user can see exactly what's wrong.
        setValidationResponse(data);
        toast.error(message);
      } else if (WARNING_CODES.has(code)) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    }
    setFetching(false);
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
        <SectionHeading>Supplier Stock</SectionHeading>
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

        <Button
          variant="contained"
          onClick={handleFetch}
          disabled={fetching}
          startIcon={fetching ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
          sx={{
            backgroundColor: "#0066FF",
            textTransform: "none",
            fontWeight: "bold",
            borderRadius: "8px",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#0052cc", boxShadow: "none" },
          }}
        >
          {fetching ? "Fetching..." : "Fetch"}
        </Button>
      </div>

      <Dialog
        open={Boolean(validationResponse)}
        onClose={() => setValidationResponse(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pl: 2, pr: 1, py: 1 }}>
          <div className="flex justify-between items-center">
            <div className="text-sm font-semibold text-red-600">MBLB Validation Errors</div>
            <IconButton size="small" onClick={() => setValidationResponse(null)}>
              <MdOutlineCancel size={20} />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          {validationResponse && <ValidationResponseGrid response={validationResponse} />}
        </DialogContent>
      </Dialog>

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
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          getRowId={(row) => row.supplier_stock_id}
          disableSelectionOnClick
          loading={loading}
          columnHeaderHeight={35}
          rowHeight={35}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No Supplier Stock data found. Click \"Fetch\" to import the latest MBLB file." }}
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
    </div>
  );
};

export default SupplierStock;
