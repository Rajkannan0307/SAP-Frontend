import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  IconButton,
  Switch,
  CircularProgress,
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
import EditIcon from "@mui/icons-material/Edit";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import SectionHeading from "../components/Header";
import { getdetails, getAdd, getUpdates } from "../controller/OperationMasterapiservice";

const UserID = localStorage.getItem("UserID");

const validationSchema = Yup.object({
  Opt_Name: Yup.string().trim().required("Operation Name is required"),
  Opt_No: Yup.number()
    .typeError("Opt No must be a number")
    .integer("Opt No must be a whole number")
    .min(10, "Opt No must be between 10 and 999")
    .max(999, "Opt No must be between 10 and 999")
    .required("Opt No is required"),
  Active_Status: Yup.boolean().required(),
});

const Mst_Operation = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const columns = [
    {
      field: "opt_id",
      headerName: "SI No",
      width: 90,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
    },
    { field: "opt_name", headerName: "Operation Name", flex: 1, minWidth: 200 },
    { field: "opt_no", headerName: "Opt No", width: 100, headerAlign: "center", align: "center" },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isActive = !!params.value;
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
    {
      field: "action",
      headerName: "Action",
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={() => handleOpenEditModal(params.row)}
          title="Edit"
        >
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  const getData = async () => {
    setLoading(true);
    try {
      const response = await getdetails();
      setData(response || []);
      setOriginalRows(response || []);
      setRows(response || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load Operation Master data.");
      setData([]);
      setOriginalRows([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ["opt_name"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  const handleOpenAddModal = () => {
    setEditData(null);
    setOpenAddModal(true);
  };
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleOpenEditModal = (row) => {
    setEditData(row);
    setOpenEditModal(true);
  };
  const handleCloseEditModal = () => setOpenEditModal(false);

  const handleDownloadExcel = () => {
    if (data.length === 0) {
      toast.info("No Data Found");
      return;
    }

    const DataColumns = ["opt_name", "ActiveStatus"];

    const filteredData = data.map((item) => ({
      opt_name: item.opt_name,
      ActiveStatus: item.status ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, {
      header: DataColumns,
    });
    worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Operation");
    XLSX.writeFile(workbook, "OperationMaster_Data.xlsx");
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
        <SectionHeading>Operation Master</SectionHeading>
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
        {/* Search Box */}
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
                "& fieldset": {
                  border: "2px solid grey", // No border by default
                },
                "&:hover fieldset": {
                  border: "2px solid grey", // Optional: border on hover
                },
                "&.Mui-focused fieldset": {
                  border: "2px solid grey", // Grey border on focus
                },
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

        {/* Icons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <IconButton
            onClick={handleDownloadExcel}
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

          <IconButton
            onClick={handleOpenAddModal}
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
          flexGrow: 1, // Ensures it grows to fill the remaining space
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
          getRowId={(row) => row.opt_id}
          disableSelectionOnClick
          loading={loading}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: "No operations found." }}
          sx={{
            // Header Style
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd", //'#696969', 	'#708090',  //"#2e59d9",
              color: "black",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "16px",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5", // Default row background
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            },
            // ✅ Remove Selected Row Background
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "inherit", // No background on selection
            },

            "& .MuiDataGrid-cell": {
              color: "#333",
              fontSize: "14px",
            },
          }}
        />
      </div>

      <OperationFormDialog
        open={openAddModal}
        onClose={handleCloseAddModal}
        onSaved={getData}
      />
      <OperationFormDialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        onSaved={getData}
        editData={editData}
      />
    </div>
  );
};

const OperationFormDialog = ({ open, onClose, onSaved, editData }) => {
  const isEdit = Boolean(editData);

  const formik = useFormik({
    initialValues: {
      Opt_Name: editData?.opt_name || "",
      Opt_No: editData?.opt_no ?? "",
      Active_Status: editData?.status ?? true,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          UserID,
          Opt_Name: values.Opt_Name.trim(),
          Opt_No: values.Opt_No,
          Active_Status: values.Active_Status,
        };

        if (isEdit) {
          payload.Opt_ID = editData.opt_id;
          const response = await getUpdates(payload);
          if (response.data.success) {
            toast.success(response.data.message || "Operation updated successfully!");
            onSaved();
            onClose();
          } else {
            toast.error(response.data.message || "Failed to update Operation.");
          }
        } else {
          const response = await getAdd(payload);
          if (response.data.success) {
            toast.success("Operation added successfully!");
            onSaved();
            onClose();
          } else {
            toast.error(response.data.message || "Failed to add Operation.");
          }
        }
      } catch (error) {
        console.error("Error saving Operation:", error);
        const message =
          error?.response?.data?.message ||
          `An error occurred while ${isEdit ? "updating" : "adding"} the Operation.`;
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: "bold", color: "#2e59d9" }}>
        {isEdit ? "Edit Operation" : "Add Operation"}
      </DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        <TextField
          autoFocus
          id="Opt_Name"
          name="Opt_Name"
          label="Operation Name"
          fullWidth
          value={formik.values.Opt_Name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.Opt_Name && Boolean(formik.errors.Opt_Name)}
          helperText={formik.touched.Opt_Name && formik.errors.Opt_Name}
          sx={{ mt: 1 }}
        />

        <TextField
          id="Opt_No"
          name="Opt_No"
          label="Opt No"
          type="number"
          fullWidth
          value={formik.values.Opt_No}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.Opt_No && Boolean(formik.errors.Opt_No)}
          helperText={
            (formik.touched.Opt_No && formik.errors.Opt_No) || "Enter a number between 10 and 999"
          }
          inputProps={{ min: 10, max: 999 }}
          sx={{ mt: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formik.values.Active_Status}
              onChange={(e) => formik.setFieldValue("Active_Status", e.target.checked)}
              color="success"
            />
          }
          label={formik.values.Active_Status ? "Active" : "Inactive"}
          sx={{
            fontWeight: "bold",
            mt: 2,
            color: formik.values.Active_Status ? "#2e7d32" : "#d32f2f",
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 0, pb: 2, pr: 3 }}>
        <Button
          variant="contained"
          color="error"
          size="small"
          disabled={formik.isSubmitting}
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={formik.isSubmitting}
          onClick={formik.handleSubmit}
          autoFocus
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {formik.isSubmitting ? "Loading..." : isEdit ? "Update" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Mst_Operation;
