import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Select from "react-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CiSquarePlus } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import { getPlantdetails } from "../controller/CommonApiService";
import { getProductdetails } from "../controller/PMPDApiService";
import { getdetails as getOperations } from "../controller/OperationMasterapiservice";
import { getdetails as getValuations } from "../controller/ValuationTypeMasterapiservice";
import { getdetails as getVendors } from "../controller/VendorMasterapiservice";
import { GetMfgBomChildApi, InsertMfgBomApi, GetMaterialWithDescApi } from "../controller/MfgBomApiService";

const OPERATION_NO_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: (i + 1) * 10,
  label: `${(i + 1) * 10}`,
}));

const reactSelectStyle = {
  container: (base) => ({ ...base, width: "100%" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (base) => ({
    ...base,
    minHeight: 30,
    height: 30,
    fontSize: "12px",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
  }),
  valueContainer: (base) => ({
    ...base,
    height: 30,
    padding: "0 6px",
    display: "flex",
    alignItems: "center",
    position: "relative",
  }),
  input: (base) => ({
    ...base, margin: 0, padding: 0, fontSize: "12px",
    lineHeight: "normal",
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: "12px",
    margin: 0,
    lineHeight: "normal",
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
  }),
  placeholder: (base) => ({
    ...base, fontSize: "12px", margin: 0,
    transform: "translateY(-8px)",
  }),
  indicatorsContainer: (base) => ({ ...base, height: 30, alignItems: "center" }),
  menu: (base) => ({ ...base, fontSize: "12px" })
};

const parentSelectStyle = {
  container: (base) => ({ ...base, width: "100%" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  control: (base) => ({
    ...base,
    minHeight: 32,
    fontSize: "12.5px",
    display: "flex",
    alignItems: "center",
  }),
  valueContainer: (base) => ({
    ...base,
    minHeight: 32,
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: "12.5px" }),
  singleValue: (base) => ({
    ...base,
    fontSize: "12.5px",
    margin: 0,
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.3,
  }),
  placeholder: (base) => ({ ...base, fontSize: "12.5px", margin: 0 }),
  indicatorsContainer: (base) => ({ ...base, alignItems: "center" }),
  menu: (base) => ({ ...base, fontSize: "12.5px" }),
};

// Wraps a react-select child-grid cell so adjacent dropdowns never visually touch
// and stay vertically centered within the row.
const GridSelectCell = ({ children }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      padding: "0 4px",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
    }}
  >
    <div style={{ width: "100%" }}>{children}</div>
  </div>
);

const createEmptyRow = (id) => ({
  id,
  mfg_bom_id: null,
  part_name: "",
  part_no: "",
  part_no_desc: "",
  opt_no: "",
  opt_id: "",
  valuation_id: "",
  vendor_id: "",
  status: true,
  new: true,
});

const AddEditMfgBomDialog = ({ open, setOpenAddModal, setRefreshData, editData }) => {
  const isEdit = Boolean(editData);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [plants, setPlants] = useState([]);
  const [fgParts, setFgParts] = useState([]);
  const [partNoOptions, setPartNoOptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [operations, setOperations] = useState([]);
  const [valuations, setValuations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [gridRows, setGridRows] = useState([]);

  const handleClose = () => {
    setOpenAddModal(false);
    setGridRows([]);
    formik.resetForm();
  };

  const validationSchema = Yup.object({
    plant: Yup.string().required("Required"),
    fg_part: Yup.string().required("Required"),
  });

  const formik = useFormik({
    initialValues: {
      plant: editData?.plant || "",
      fg_part: editData?.fg_part || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (submitLoading) return;

      if (gridRows.length === 0) {
        toast.error("Add at least one child row.");
        return;
      }

      for (let i = 0; i < gridRows.length; i++) {
        const r = gridRows[i];
        if (!r.part_name || !r.part_no || !r.opt_no || !r.opt_id || !r.valuation_id) {
          toast.error(`Row ${i + 1}: all fields are required.`);
          return;
        }
        // Vendor is optional only when the Valuation is INHOUSE.
        const valuationName = valuations.find((v) => v.Valuation_ID === r.valuation_id)?.Valuation_Name;
        const isInhouse = String(valuationName || "").trim().toUpperCase() === "INHOUSE";
        if (!isInhouse && !r.vendor_id) {
          toast.error(`Row ${i + 1}: Vendor Code is required unless Valuation is INHOUSE.`);
          return;
        }
      }

      const comboSeen = new Set();
      for (let i = 0; i < gridRows.length; i++) {
        const key = `${gridRows[i].part_no}`;
        if (comboSeen.has(key)) {
          toast.error(`Row ${i + 1}: duplicate Part No within this Plant + FG Part BOM.`);
          return;
        }
        comboSeen.add(key);
      }

      setSubmitLoading(true);
      try {
        const userId = localStorage.getItem("EmpId");
        const payload = {
          plant: values.plant,
          fg_part: values.fg_part,
          userId,
          rows: gridRows.map((r) => ({
            mfg_bom_id: r.mfg_bom_id || null,
            part_name: r.part_name,
            part_no: r.part_no,
            opt_no: r.opt_no,
            opt_id: r.opt_id,
            valuation_id: r.valuation_id,
            vendor_id: r.vendor_id,
            status: r.status,
          })),
        };
        await InsertMfgBomApi(payload);
        toast.success(`MFG BOM ${isEdit ? "updated" : "added"} successfully!`);
        setRefreshData((prev) => !prev);
        handleClose();
      } catch (error) {
        console.error("Error saving MFG BOM:", error);
        toast.error(error?.response?.data?.message || "An error occurred while saving the MFG BOM.");
      }
      setSubmitLoading(false);
    },
  });

  // Load static/plant-independent masters when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      const [plantRes, productRes, operationRes, valuationRes, vendorRes] = await Promise.all([
        getPlantdetails(),
        getProductdetails(),
        getOperations(),
        getValuations(),
        getVendors(),
      ]);
      setPlants(plantRes || []);
      setProducts((productRes || []).filter((p) => p.Active_Status));
      setOperations((operationRes || []).filter((o) => o.status));
      setValuations(valuationRes || []);
      setVendors((vendorRes || []).filter((v) => v.Active_Status));
    };
    fetchData();
  }, [open]);

  // Every time the dialog is opened fresh for Add, wipe any values left over
  // from a previous open (typed-but-not-saved plant/FG part, child rows,
  // stale dependent dropdown lists) so nothing carries over between sessions.
  useEffect(() => {
    if (open && !isEdit) {
      formik.resetForm();
      setGridRows([]);
      setFgParts([]);
      setPartNoOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  // Load FG Part (FERT) and Part No (ROH/HALB) options when plant changes
  useEffect(() => {
    if (!open || !formik.values.plant) {
      setFgParts([]);
      setPartNoOptions([]);
      return;
    }
    const fetchData = async () => {
      const [fgRes, partNoRes] = await Promise.all([
        GetMaterialWithDescApi({ plant: formik.values.plant, materialType: "FERT" }),
        GetMaterialWithDescApi({ plant: formik.values.plant, materialType: "ROH,HALB" }),
      ]);
      setFgParts(fgRes || []);
      setPartNoOptions(partNoRes || []);
    };
    fetchData();
  }, [open, formik.values.plant]);

  // Load existing child rows when editing
  useEffect(() => {
    if (!open || !isEdit || !editData?.plant || !editData?.fg_part) return;
    const fetchChild = async () => {
      const response = await GetMfgBomChildApi(editData.plant, editData.fg_part);
      const data = (response || []).map((e, i) => ({
        id: i + 1,
        mfg_bom_id: e.mfg_bom_id,
        part_name: e.part_name,
        part_name_desc: e.part_name_desc,
        part_no: e.part_no,
        part_no_code: e.part_no_code,
        part_no_desc: e.part_no_desc,
        opt_no: e.opt_no,
        opt_id: e.opt_id,
        opt_name: e.opt_name,
        valuation_id: e.valuation_id,
        Valuation_Name: e.Valuation_Name,
        vendor_id: e.vendor_id,
        Vendor_Code: e.Vendor_Code,
        Vendor_Name: e.Vendor_Name,
        status: e.status,
      }));
      setGridRows(data);
    };
    fetchChild();
  }, [open, isEdit, editData]);

  const handleAddRow = () => {
    setGridRows((prev) => [...prev, createEmptyRow(prev.length + 1)]);
  };

  const handleDeleteRow = (id) => {
    setGridRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleProcessRowUpdate = (newRow) => {
    setGridRows((prev) => prev.map((row) => (row.id === newRow.id ? newRow : row)));
    return newRow;
  };

  const productOptions = products.map((p) => ({ value: p.Prod_ID, label: p.Name }));
  const partNoSelectOptions = partNoOptions.map((m) => ({
    value: m.Material_ID,
    label: m.Material_Code,
    description: m.Description,
  }));
  const operationOptions = operations.map((o) => ({ value: o.opt_id, label: o.opt_name }));
  const valuationOptions = valuations.map((v) => ({ value: v.Valuation_ID, label: v.Valuation_Name }));
  const vendorOptions = vendors
    .filter((v) => String(v.Plant_Code) === String(formik.values.plant))
    .map((v) => ({ value: v.Vendor_ID, label: `${v.Vendor_Code} - ${v.Vendor_Name}` }));

  const childColumns = [
    { field: "id", headerName: "SI No", width: 55 },
    {
      field: "part_name",
      headerName: "Part Name",
      flex: 1.1,
      minWidth: 140,
      renderCell: (params) => (
        <GridSelectCell>
          <Select
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={reactSelectStyle}
            options={productOptions}
            value={productOptions.find((o) => o.value === params.row.part_name) || null}
            onChange={(option) => handleProcessRowUpdate({ ...params.row, part_name: option?.value || "" })}
          />
        </GridSelectCell>
      ),
    },
    {
      field: "part_no",
      headerName: "Part No",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <GridSelectCell>
          <Select
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={reactSelectStyle}
            options={partNoSelectOptions}
            value={partNoSelectOptions.find((o) => o.value === params.row.part_no) || null}
            onChange={(option) =>
              handleProcessRowUpdate({
                ...params.row,
                part_no: option?.value || "",
                part_no_desc: option?.description || "",
              })
            }
          />
        </GridSelectCell>
      ),
    },
    {
      // Read-only: auto-filled once Part No is selected, never manually editable.
      field: "part_no_desc",
      headerName: "Part No Description",
      flex: 1.1,
      minWidth: 160,
      renderCell: (params) => {
        const selected = partNoSelectOptions.find((o) => o.value === params.row.part_no);
        const description = selected?.description || params.row.part_no_desc || "";
        return (
          <span style={{ color: "#555", fontSize: "12px" }} title={description}>
            {description}
          </span>
        );
      },
    },
    {
      field: "opt_no",
      headerName: "Opt No",
      width: 85,
      renderCell: (params) => (
        <GridSelectCell>
          <Select
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={reactSelectStyle}
            options={OPERATION_NO_OPTIONS}
            value={OPERATION_NO_OPTIONS.find((o) => o.value === params.row.opt_no) || null}
            onChange={(option) => handleProcessRowUpdate({ ...params.row, opt_no: option?.value || "" })}
          />
        </GridSelectCell>
      ),
    },
    {
      field: "opt_id",
      headerName: "Opt Name",
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <GridSelectCell>
          <Select
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={reactSelectStyle}
            options={operationOptions}
            value={operationOptions.find((o) => o.value === params.row.opt_id) || null}
            onChange={(option) => handleProcessRowUpdate({ ...params.row, opt_id: option?.value || "" })}
          />
        </GridSelectCell>
      ),
    },
    {
      field: "valuation_id",
      headerName: "Valuation",
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <GridSelectCell>
          <Select
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={reactSelectStyle}
            options={valuationOptions}
            value={valuationOptions.find((o) => o.value === params.row.valuation_id) || null}
            onChange={(option) => handleProcessRowUpdate({ ...params.row, valuation_id: option?.value || "" })}
          />
        </GridSelectCell>
      ),
    },
    {
      field: "vendor_id",
      headerName: "Vendor Code",
      flex: 1.3,
      minWidth: 180,
      renderCell: (params) => (
        <GridSelectCell>
          <Select
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={reactSelectStyle}
            options={vendorOptions}
            isClearable
            placeholder="Optional if INHOUSE"
            value={vendorOptions.find((o) => o.value === params.row.vendor_id) || null}
            onChange={(option) => handleProcessRowUpdate({ ...params.row, vendor_id: option?.value || "" })}
          />
        </GridSelectCell>
      ),
    },
    {
      field: "status",
      headerName: "Active Status",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(params.value)}
              onChange={(e) => handleProcessRowUpdate({ ...params.row, status: e.target.checked })}
              color="success"
              size="small"
            />
          }
          label={params.value ? "Active" : "Inactive"}
          sx={{
            m: 0,
            fontWeight: "bold",
            color: params.value ? "#2e7d32" : "#d32f2f",
          }}
        />
      ),
    },
    {
      field: "delete",
      headerName: "Action",
      width: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        // Existing DB rows (mfg_bom_id present) can never be deleted from the UI.
        params.row.mfg_bom_id ? null : (
          <IconButton size="small" onClick={() => handleDeleteRow(params.id)}>
            <MdDelete size={15} />
          </IconButton>
        ),
    },
  ];

  return (
    <Dialog open={open} aria-labelledby="mfg-bom-dialog-title" maxWidth="xl" fullWidth>
      <DialogTitle id="mfg-bom-dialog-title">{isEdit ? "Edit MFG BOM" : "Add MFG BOM"}</DialogTitle>
      <DialogContent sx={{ pb: 0, width: "100%", overflowY: "hidden" }}>
        <div style={{ display: "flex", width: "100%", gap: "10px", alignItems: "flex-start", flexShrink: 0 }}>
          <TextField
            select
            size="small"
            label="Plant"
            name="plant"
            disabled={isEdit}
            value={formik.values.plant}
            onChange={(e) => {
              formik.setFieldValue("fg_part", "");
              setGridRows([]);
              formik.handleChange(e);
            }}
            onBlur={formik.handleBlur}
            error={formik.touched.plant && Boolean(formik.errors.plant)}
            helperText={formik.touched.plant && formik.errors.plant}
            InputLabelProps={{ sx: { fontSize: 12.5 } }}
            InputProps={{ sx: { fontSize: 12.5 } }}
            sx={{ width: 140, mt: 1, flex: "0 0 auto" }}
          >
            {plants.map((p) => (
              <MenuItem key={p.Plant_ID} value={p.Plant_Code} sx={{ fontSize: 12.5 }}>
                {`${p.Plant_Code} - ${p.Plant_Name}`}
              </MenuItem>
            ))}
          </TextField>

          <FormControl
            error={formik.touched.fg_part && Boolean(formik.errors.fg_part)}
            sx={{ width: 320, mt: 1, flex: "0 0 auto" }}
          >
            <Select
              name="fg_part"
              placeholder="Select FG Part"
              isDisabled={isEdit}
              options={fgParts.map((m) => ({
                value: m.Material_ID,
                label: `${m.Description || m.Material_Code} - (${m.Material_Code})`,
              }))}
              value={
                fgParts
                  .map((m) => ({
                    value: m.Material_ID,
                    label: `${m.Description || m.Material_Code} - (${m.Material_Code})`,
                  }))
                  .find((opt) => String(opt.value) === String(formik.values.fg_part)) ||
                (isEdit && editData
                  ? { value: editData.fg_part, label: `${editData.fg_part_desc || editData.fg_part_no} - (${editData.fg_part_no})` }
                  : null)
              }
              onChange={(option) => {
                formik.setFieldValue("fg_part", option?.value || "");
                setGridRows([]);
              }}
              onBlur={() => formik.setFieldTouched("fg_part", true)}
              styles={parentSelectStyle}
              isClearable
              menuPortalTarget={document.body}
            />
            {formik.touched.fg_part && formik.errors.fg_part && (
              <FormHelperText>{formik.errors.fg_part}</FormHelperText>
            )}
          </FormControl>

          <IconButton
            size="small"
            onClick={handleAddRow}
            disabled={!formik.values.plant || !formik.values.fg_part}
            sx={{ mt: 1, border: "1px solid #d1d5db", borderRadius: "6px" }}
          >
            <CiSquarePlus size={20} />
          </IconButton>
        </div>

        <div style={{ marginTop: 16, width: "100%" }}>
          <DataGrid
            rows={gridRows}
            columns={childColumns}
            processRowUpdate={handleProcessRowUpdate}
            hideFooter
            disableRowSelectionOnClick
            experimentalFeatures={{ newEditingApi: true }}
            columnHeaderHeight={36}
            rowHeight={46}
            disableColumnMenu
            sortingOrder={[]}
            sx={{
              fontSize: "12px",
              height: 400,
              "& .MuiDataGrid-main": {
                overflow: "hidden",
              },
              "& .MuiDataGrid-virtualScroller": {
                overflowX: "hidden",
                overflowY: "auto",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#e0e0e0",
                position: "sticky",
                top: 0,
                zIndex: 1,
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#e0e0e0",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 600,
                fontSize: "12px",
                whiteSpace: "normal",
                lineHeight: 1.2,
              },
              "& .MuiDataGrid-cell": {
                padding: "0 4px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-row": {
                borderBottom: "1px solid #e0e0e0",
              },
            }}
          />
        </div>
      </DialogContent>
      <DialogActions sx={{ p: 0, pb: 2, pr: 3, pt: 2 }}>
        <Button variant="contained" color="error" size="small" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={submitLoading}
          onClick={() => formik.handleSubmit()}
          autoFocus
        >
          {submitLoading ? "Loading..." : isEdit ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditMfgBomDialog;
