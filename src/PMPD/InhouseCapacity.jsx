
// import React, { useContext, useEffect, useState } from "react";
// import SectionHeading from "../components/Header";
// import { useFormik } from "formik";
// import * as yup from "yup";
// import * as XLSX from "xlsx";
// import {
//   Box,
//   Button,
//   MenuItem,
//   TextField,
//   Snackbar,
//   Alert,
//   IconButton,
//   Tooltip,
//   Switch,
//   FormControlLabel,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Typography,
// } from "@mui/material";
// import {
//   DataGrid,
//   GridToolbarColumnsButton,
//   GridToolbarContainer,
//   GridToolbarExport,
//   GridToolbarFilterButton,
// } from "@mui/x-data-grid";
// import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
// import AddIcon from "@mui/icons-material/Add";
// import CloseIcon from "@mui/icons-material/Close";
// import FileUploadIcon from "@mui/icons-material/FileUpload";
// import DownloadIcon from "@mui/icons-material/Download";

// import { AuthContext } from "../Authentication/AuthContext";
// import {
//   getInhouseCapacityMasters,
//   getInhouseCapacityList,
//   insertInhouseCapacity,
//   updateInhouseCapacity,
//   bulkInsertInhouseCapacityFile,
// } from "../controller/PMPDApiService";

// const CustomToolbar = () => (
//   <GridToolbarContainer>
//     <GridToolbarColumnsButton />
//     <GridToolbarFilterButton />
//     <GridToolbarExport />
//   </GridToolbarContainer>
// );

// const InhouseCapacity = () => {
//   const { user } = useContext(AuthContext);
//   const currentUserCode = user?.GenID || "SYS_ADMIN";

//   const [capacityList, setCapacityList] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [addLoading, setAddLoading] = useState(false);
//   const [editLoading, setEditLoading] = useState(false);

//   // Dialog States
//   const [openAddDialog, setOpenAddDialog] = useState(false);
//   const [openEditDialog, setOpenEditDialog] = useState(false);
//   const [openBulkDialog, setOpenBulkDialog] = useState(false);

//   // Bulk Error Modal State
//   const [bulkErrorData, setBulkErrorData] = useState([]);
//   const [bulkSummary, setBulkSummary] = useState({
//     totalRows: 0,
//     validRows: 0,
//     invalidRows: 0,
//   });

//   const [masters, setMasters] = useState({
//     plants: [],
//     segments: [],
//     modules: [],
//     lines: [],
//     fgProducts: [],
//     sfgProducts: [],
//     machines: [],
//   });

//   const [snackbar, setSnackbar] = useState({
//     open: false,
//     message: "",
//     severity: "success",
//   });

//   const initialValues = {
//     inhouse_capacity_id: null,
//     Plant_ID: "",
//     prod_seg_id: "",
//     Module_ID: "",
//     Line_ID: "",
//     Prod_ID: "",
//     Prod_ID_component: "",
//     operation: "",
//     Machine_id: "",
//     no_of_shift: "",
//     shift_a: "",
//     shift_b: "",
//     shift_c: "",
//     active_status: true,
//   };

//   const validationSchema = yup.object({
//     Plant_ID: yup.string().required("Required"),
//     prod_seg_id: yup.string().required("Required"),
//     Module_ID: yup.string().required("Required"),
//     Line_ID: yup.string().required("Required"),
//     Prod_ID: yup.string().required("Required"),
//     Prod_ID_component: yup.string().required("Required"),
//     operation: yup.string().required("Required"),
//     Machine_id: yup.string().required("Required"),
//     no_of_shift: yup.number().typeError("Must be a number").required("Required"),
//   });

//   // 1. ADD FORM FORMIK
//   const addFormik = useFormik({
//     initialValues: initialValues,
//     validationSchema: validationSchema,
//     onSubmit: async (values) => {
//       setAddLoading(true);
//       const insertPayload = {
//         Plant_ID: Number(values.Plant_ID),
//         prod_seg_id: Number(values.prod_seg_id),
//         Module_ID: Number(values.Module_ID),
//         Line_ID: Number(values.Line_ID),
//         Prod_ID: Number(values.Prod_ID),
//         Prod_ID_component: Number(values.Prod_ID_component),
//         operation: values.operation,
//         Machine_id: Number(values.Machine_id),
//         no_of_shift: Number(values.no_of_shift),
//         shift_a: Number(values.shift_a || 0),
//         shift_b: Number(values.shift_b || 0),
//         shift_c: Number(values.shift_c || 0),
//         active_status: values.active_status ? 1 : 0,
//         created_by: currentUserCode,
//       };

//       try {
//         const res = await insertInhouseCapacity(insertPayload);
//         if (res?.status === 200 || res?.status === 201) {
//           showSnackbar("Capacity record inserted successfully!", "success");
//           handleCloseAddDialog();
//           fetchCapacityList();
//         }
//       } catch (err) {
//         showSnackbar(
//           err?.response?.data?.details || err?.response?.data?.error || "Error inserting record",
//           "error"
//         );
//       } finally {
//         setAddLoading(false);
//       }
//     },
//   });

//   // 2. EDIT FORM FORMIK
//   const editFormik = useFormik({
//     initialValues: initialValues,
//     validationSchema: validationSchema,
//     enableReinitialize: true,
//     onSubmit: async (values) => {
//       setEditLoading(true);
//       const updatePayload = {
//         inhouse_capacity_id: Number(values.inhouse_capacity_id),
//         Plant_ID: Number(values.Plant_ID),
//         prod_seg_id: Number(values.prod_seg_id),
//         Module_ID: Number(values.Module_ID),
//         Line_ID: Number(values.Line_ID),
//         Prod_ID: Number(values.Prod_ID),
//         Prod_ID_component: Number(values.Prod_ID_component),
//         operation: values.operation,
//         Machine_id: Number(values.Machine_id),
//         no_of_shift: Number(values.no_of_shift),
//         shift_a: Number(values.shift_a || 0),
//         shift_b: Number(values.shift_b || 0),
//         shift_c: Number(values.shift_c || 0),
//         active_status: values.active_status ? 1 : 0,
//         modified_by: currentUserCode,
//       };

//       try {
//         const res = await updateInhouseCapacity(updatePayload);
//         if (res?.status === 200) {
//           showSnackbar("Capacity record updated successfully!", "success");
//           handleCloseEditDialog();
//           fetchCapacityList();
//         }
//       } catch (err) {
//         showSnackbar(
//           err?.response?.data?.details || err?.response?.data?.error || "Error updating record",
//           "error"
//         );
//       } finally {
//         setEditLoading(false);
//       }
//     },
//   });

//   useEffect(() => {
//     fetchInitialData();
//   }, []);

//   const fetchInitialData = async () => {
//     setLoading(true);
//     try {
//       const [masterRes, capacityRes] = await Promise.all([
//         getInhouseCapacityMasters(),
//         getInhouseCapacityList(),
//       ]);

//       if (masterRes?.data) setMasters(masterRes.data);
//       if (capacityRes?.data) setCapacityList(capacityRes.data);
//     } catch (err) {
//       showSnackbar("Error loading page data", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCapacityList = async () => {
//     try {
//       const res = await getInhouseCapacityList();
//       if (res?.data) setCapacityList(res.data);
//     } catch (err) {
//       showSnackbar("Error updating capacity list", "error");
//     }
//   };

//   // Dialog Handlers
//   const handleOpenAddDialog = () => {
//     addFormik.resetForm({ values: initialValues });
//     setOpenAddDialog(true);
//   };

//   const handleCloseAddDialog = () => {
//     setOpenAddDialog(false);
//     addFormik.resetForm({ values: initialValues });
//   };

//   const handleAddSaveClick = async () => {
//     const errors = await addFormik.validateForm();
//     if (Object.keys(errors).length > 0) {
//       addFormik.setTouched(
//         Object.keys(errors).reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
//       );
//     } else {
//       addFormik.handleSubmit();
//     }
//   };

//   const handleEdit = (row) => {
//     editFormik.setValues({
//       inhouse_capacity_id: row.inhouse_capacity_id,
//       Plant_ID: row.Plant_ID !== null && row.Plant_ID !== undefined ? String(row.Plant_ID) : "",
//       prod_seg_id: row.prod_seg_id !== null && row.prod_seg_id !== undefined ? String(row.prod_seg_id) : "",
//       Module_ID: row.Module_ID !== null && row.Module_ID !== undefined ? String(row.Module_ID) : "",
//       Line_ID: row.Line_ID !== null && row.Line_ID !== undefined ? String(row.Line_ID) : "",
//       Prod_ID: row.Prod_ID !== null && row.Prod_ID !== undefined ? String(row.Prod_ID) : "",
//       Prod_ID_component: row.Prod_ID_component !== null && row.Prod_ID_component !== undefined ? String(row.Prod_ID_component) : "",
//       operation: row.operation || "",
//       Machine_id: row.Machine_id !== null && row.Machine_id !== undefined ? String(row.Machine_id) : "",
//       no_of_shift: row.no_of_shift || "",
//       shift_a: row.shift_a || "",
//       shift_b: row.shift_b || "",
//       shift_c: row.shift_c || "",
//       active_status: Boolean(row.active_status),
//     });
//     setOpenEditDialog(true);
//   };

//   const handleCloseEditDialog = () => {
//     setOpenEditDialog(false);
//     editFormik.resetForm({ values: initialValues });
//   };

//   const handleEditSaveClick = async () => {
//     const errors = await editFormik.validateForm();
//     if (Object.keys(errors).length > 0) {
//       editFormik.setTouched(
//         Object.keys(errors).reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
//       );
//     } else {
//       editFormik.handleSubmit();
//     }
//   };
//   // =========================================================================
//   // EXCEL TEMPLATE DOWNLOAD HANDLER
//   // =========================================================================
//   const handleDownloadTemplate = async () => {
//     try {
//       let currentMasters = masters;

//       // If masters state is empty for any reason, fetch fresh data using getInhouseCapacityMasters
//       if (
//         !currentMasters.plants?.length &&
//         !currentMasters.machines?.length
//       ) {
//         const masterRes = await getInhouseCapacityMasters();
//         if (masterRes?.data) {
//           currentMasters = masterRes.data;
//           setMasters(masterRes.data);
//         }
//       }

//       const headerStyle = {
//         fill: { patternType: "solid", fgColor: { rgb: "00FFFF" } },
//         font: { color: { rgb: "000000" }, bold: true },
//         alignment: { horizontal: "center", vertical: "center" },
//         border: {
//           top: { style: "thin", color: { rgb: "B0B0B0" } },
//           bottom: { style: "thin", color: { rgb: "B0B0B0" } },
//           left: { style: "thin", color: { rgb: "B0B0B0" } },
//           right: { style: "thin", color: { rgb: "B0B0B0" } },
//         },
//       };

//       /* ======================================
//          SHEET 1 - TEMPLATE (ENTRY SHEET - HEADERS ONLY)
//          ====================================== */
//       const templateData = [
//         {
//           Plant_ID: "",
//           prod_seg_id: "",
//           Module_ID: "",
//           Line_ID: "",
//           Prod_ID: "",
//           Prod_ID_component: "",
//           operation: "",
//           Machine_id: "",
//           no_of_shift: "",
//           shift_a: "",
//           shift_b: "",
//           shift_c: "",
//         },
//       ];

//       const worksheet1 = XLSX.utils.json_to_sheet(templateData);

//       // Truncate data rows so only the header row remains
//       const range1 = XLSX.utils.decode_range(worksheet1["!ref"]);
//       range1.e.r = 0;
//       worksheet1["!ref"] = XLSX.utils.encode_range(range1);

//       worksheet1["!cols"] = [
//         { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
//         { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
//         { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
//       ];

//       const headerRange1 = XLSX.utils.decode_range(worksheet1["!ref"]);
//       for (let C = headerRange1.s.c; C <= headerRange1.e.c; ++C) {
//         const address = XLSX.utils.encode_cell({ r: 0, c: C });
//         if (worksheet1[address]) {
//           worksheet1[address].s = headerStyle;
//         }
//       }

//       /* ======================================
//          HELPER FOR CREATING MASTER REFERENCE TABS
//          ====================================== */
//       const createStyledMasterSheet = (dataArray, colWidths) => {
//         const ws = XLSX.utils.json_to_sheet(dataArray);
//         ws["!cols"] = colWidths;
//         const range = XLSX.utils.decode_range(ws["!ref"]);
//         for (let C = range.s.c; C <= range.e.c; ++C) {
//           const address = XLSX.utils.encode_cell({ r: 0, c: C });
//           if (ws[address]) ws[address].s = headerStyle;
//         }
//         return ws;
//       };

//       /* ======================================
//          SHEETS 2-8: DEDICATED REFERENCE MASTERS
//          ====================================== */
//       const wsPlants = createStyledMasterSheet(
//         (currentMasters.plants || []).map((p) => ({
//           Plant_ID: p.Plant_ID,
//           Plant_Code: p.Plant_Code || p.Plant_ID,
//           Plant_Name: p.Plant_Name || "",
//         })),
//         [{ wch: 12 }, { wch: 20 }, { wch: 30 }]
//       );

//       const wsSegments = createStyledMasterSheet(
//         (currentMasters.segments || []).map((s) => ({
//           prod_seg_id: s.prod_seg_id,
//           Segment_Name: s.seg_name || s.prod_seg_name || "",
//         })),
//         [{ wch: 15 }, { wch: 30 }]
//       );

//       const wsModules = createStyledMasterSheet(
//         (currentMasters.modules || []).map((m) => ({
//           Module_ID: m.Module_ID,
//           Module_Name: m.Module_Name || "",
//         })),
//         [{ wch: 15 }, { wch: 30 }]
//       );

//       const wsLines = createStyledMasterSheet(
//         (currentMasters.lines || []).map((l) => ({
//           Line_ID: l.Line_ID,
//           Line_Name: l.Line_Name || "",
//         })),
//         [{ wch: 15 }, { wch: 30 }]
//       );

//       const wsFG = createStyledMasterSheet(
//         (currentMasters.fgProducts || []).map((f) => ({
//           Prod_ID: f.Prod_ID,
//           Product_Name: f.Name || f.Product_Name || "",
//         })),
//         [{ wch: 15 }, { wch: 35 }]
//       );

//       const wsSFG = createStyledMasterSheet(
//         (currentMasters.sfgProducts || []).map((s) => ({
//           Prod_ID_component: s.Prod_ID,
//           Component_Name: s.Name || s.Product_Name || "",
//         })),
//         [{ wch: 20 }, { wch: 35 }]
//       );

//       const wsMachines = createStyledMasterSheet(
//         (currentMasters.machines || []).map((m) => {
//           const mId = m.Machine_id ?? m.Machine_ID ?? m.Machine_Id ?? "";
//           const mCode = m.Machine_code || m.Machine_Code || m.Machine_code_name || mId;
//           return {
//             Machine_id: mId,
//             Machine_Code: mCode,
//             Machine_Name: m.Machine_Name || m.Machine_name || "",
//           };
//         }),
//         [{ wch: 15 }, { wch: 20 }, { wch: 30 }]
//       );

//       /* ======================================
//          CREATE WORKBOOK & DOWNLOAD
//          ====================================== */
//       const workbook = XLSX.utils.book_new();

//       XLSX.utils.book_append_sheet(workbook, worksheet1, "Capacity_Template");
//       XLSX.utils.book_append_sheet(workbook, wsPlants, "Plant Master");
//       XLSX.utils.book_append_sheet(workbook, wsSegments, "Segment Master");
//       XLSX.utils.book_append_sheet(workbook, wsModules, "Module Master");
//       XLSX.utils.book_append_sheet(workbook, wsLines, "Line Master");
//       XLSX.utils.book_append_sheet(workbook, wsFG, "FG Product Master");
//       XLSX.utils.book_append_sheet(workbook, wsSFG, "SFG Component Master");
//       XLSX.utils.book_append_sheet(workbook, wsMachines, "Machine Master");

//       XLSX.writeFile(workbook, "Trn_Inhouse_Capacity_Template.xlsx");
//     } catch (error) {
//       console.error("Template Download Error:", error);
//       showSnackbar("Failed to download template file", "error");
//     }
//   };
//   // BULK FILE UPLOAD & ERROR MODAL TRIGGER
//   const handleFileUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     try {
//       setLoading(true);
//       const res = await bulkInsertInhouseCapacityFile(file, user?.userId || 1);

//       if (res?.status === 200 || res?.data?.success) {
//         showSnackbar(res?.data?.message || "Bulk upload successful!", "success");
//         fetchCapacityList();
//       }
//     } catch (err) {
//       const errPayload = err?.response?.data;
//       const status = err?.response?.status;

//       let formattedErrors = [];
//       let summaryObj = { totalRows: 0, validRows: 0, invalidRows: 0 };

//       if (status === 422 && errPayload?.invalidTable) {
//         summaryObj = errPayload.summary || {
//           totalRows: errPayload.invalidTable.length,
//           validRows: 0,
//           invalidRows: errPayload.invalidTable.length,
//         };

//         formattedErrors = errPayload.invalidTable.map((item) => ({
//           id: item.row,
//           rowNo: `Row ${item.row}`,
//           plant: item.data["Plant_ID"] || item.data["Plant Code"] || item.data["Plant"] || "N/A",
//           machine: item.data["Machine_id"] || item.data["Machine Code"] || item.data["Machine"] || "N/A",
//           operation: item.data["operation"] || item.data["Operation"] || "N/A",
//           errorLog: Array.isArray(item.errors) ? item.errors.join(" | ") : String(item.errors),
//         }));
//       } else {
//         // Extract real error message sent by Node/Express server
//         const realServerError =
//           errPayload?.message ||
//           errPayload?.details ||
//           errPayload?.error ||
//           err?.message ||
//           "Failed to process request on backend";

//         summaryObj = { totalRows: 1, validRows: 0, invalidRows: 1 };

//         formattedErrors = [
//           {
//             id: 1,
//             rowNo: "Server / SQL Error",
//             plant: "N/A",
//             machine: "N/A",
//             operation: "N/A",
//             errorLog: realServerError,
//           },
//         ];
//       }

//       setBulkSummary(summaryObj);
//       setBulkErrorData(formattedErrors);
//       setOpenBulkDialog(true);

//       showSnackbar(errPayload?.message || "Upload process failed", "error");
//     } finally {
//       setLoading(false);
//       e.target.value = null;
//     }
//   };

//   const showSnackbar = (message, severity) => {
//     setSnackbar({ open: true, message, severity });
//   };

//   const columns = [
//     {
//       field: "slno",
//       headerName: "SI No",
//       flex: 0.5,
//       minWidth: 60,
//       renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
//     },
//     { field: "Plant_Name", headerName: "Plant", flex: 1, minWidth: 100 },
//     { field: "Product_Segment_Name", headerName: "Segment", flex: 1, minWidth: 110 },
//     { field: "Module_Name", headerName: "Module", flex: 1, minWidth: 100 },
//     { field: "Line_Name", headerName: "Line", flex: 1, minWidth: 100 },
//     { field: "FG_Product_Name", headerName: "FG Product", flex: 1.2, minWidth: 120 },
//     { field: "SFG_Component_Name", headerName: "SFG Component", flex: 1.2, minWidth: 120 },
//     { field: "Machine_Name", headerName: "Machine", flex: 1, minWidth: 110 },
//     { field: "operation", headerName: "Operation", flex: 1, minWidth: 110 },
//     { field: "no_of_shift", headerName: "Shifts", flex: 0.6, minWidth: 70 },
//     { field: "shift_a", headerName: "Shift A", flex: 0.7, minWidth: 80 },
//     { field: "shift_b", headerName: "Shift B", flex: 0.7, minWidth: 80 },
//     { field: "shift_c", headerName: "Shift C", flex: 0.7, minWidth: 80 },
//     {
//       field: "total_output",
//       headerName: "Total Output",
//       flex: 0.9,
//       minWidth: 100,
//       valueGetter: (value, row) => {
//         const shiftA = Number(row?.shift_a || 0);
//         const shiftB = Number(row?.shift_b || 0);
//         const shiftC = Number(row?.shift_c || 0);
//         return shiftA + shiftB + shiftC;
//       },
//     },
//     {
//       field: "avg_output",
//       headerName: "Avg. Output",
//       flex: 0.9,
//       minWidth: 100,
//       valueGetter: (value, row) => {
//         const shiftA = Number(row?.shift_a || 0);
//         const shiftB = Number(row?.shift_b || 0);
//         const shiftC = Number(row?.shift_c || 0);
//         const total = shiftA + shiftB + shiftC;
//         const shifts = Number(row?.no_of_shift || 0);

//         if (shifts <= 0) return 0;
//         return Number((total / shifts).toFixed(2));
//       },
//     },
//     {
//       field: "active_status",
//       headerName: "Status",
//       flex: 0.8,
//       minWidth: 90,
//       renderCell: (params) => (
//         <span
//           className={
//             params.value ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
//           }
//         >
//           {params.value ? "Active" : "Inactive"}
//         </span>
//       ),
//     },
//     {
//       field: "actions",
//       headerName: "Actions",
//       flex: 0.6,
//       minWidth: 70,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <Box sx={{ display: "flex", gap: 1 }}>
//           <Tooltip title="Edit Record">
//             <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
//               <EditOutlinedIcon fontSize="small" />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       ),
//     },
//   ];

//   const bulkErrorColumns = [
//     { field: "rowNo", headerName: "Row #", width: 110 },
//     { field: "plant", headerName: "Plant / Info", width: 130 },
//     { field: "machine", headerName: "Machine Code", width: 130 },
//     { field: "operation", headerName: "Operation", width: 120 },
//     {
//       field: "errorLog",
//       headerName: "Validation Error Details",
//       flex: 1,
//       minWidth: 300,
//       renderCell: (params) => (
//         <span style={{ color: "#d32f2f", fontWeight: "600", fontSize: "11px" }}>
//           {params.value}
//         </span>
//       ),
//     },
//   ];

//   const renderFormFields = (f) => (
//     <Box
//       sx={{
//         display: "grid",
//         gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
//         gap: 2,
//       }}
//     >
//       <TextField
//         select
//         size="small"
//         label="Plant"
//         name="Plant_ID"
//         value={f.values.Plant_ID}
//         onChange={f.handleChange}
//         error={f.touched.Plant_ID && Boolean(f.errors.Plant_ID)}
//         helperText={f.touched.Plant_ID && f.errors.Plant_ID}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       >
//         {masters.plants.map((p) => (
//           <MenuItem sx={{ fontSize: "small" }} key={p.Plant_ID} value={String(p.Plant_ID)}>
//             {`${p.Plant_Code || p.Plant_ID} - ${p.Plant_Name || ""}`}
//           </MenuItem>
//         ))}
//       </TextField>

//       <TextField
//         select
//         size="small"
//         label="Product Segment"
//         name="prod_seg_id"
//         value={f.values.prod_seg_id}
//         onChange={f.handleChange}
//         error={f.touched.prod_seg_id && Boolean(f.errors.prod_seg_id)}
//         helperText={f.touched.prod_seg_id && f.errors.prod_seg_id}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       >
//         {masters.segments.map((s) => (
//           <MenuItem sx={{ fontSize: "small" }} key={s.prod_seg_id} value={String(s.prod_seg_id)}>
//             {s.seg_name || s.prod_seg_name || s.prod_seg_id}
//           </MenuItem>
//         ))}
//       </TextField>

//       <TextField
//         select
//         size="small"
//         label="Module"
//         name="Module_ID"
//         value={f.values.Module_ID}
//         onChange={f.handleChange}
//         error={f.touched.Module_ID && Boolean(f.errors.Module_ID)}
//         helperText={f.touched.Module_ID && f.errors.Module_ID}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       >
//         {masters.modules.map((m) => (
//           <MenuItem sx={{ fontSize: "small" }} key={m.Module_ID} value={String(m.Module_ID)}>
//             {m.Module_Name || m.Module_ID}
//           </MenuItem>
//         ))}
//       </TextField>

//       <TextField
//         select
//         size="small"
//         label="Line"
//         name="Line_ID"
//         value={f.values.Line_ID}
//         onChange={f.handleChange}
//         error={f.touched.Line_ID && Boolean(f.errors.Line_ID)}
//         helperText={f.touched.Line_ID && f.errors.Line_ID}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       >
//         {masters.lines.map((l) => (
//           <MenuItem sx={{ fontSize: "small" }} key={l.Line_ID} value={String(l.Line_ID)}>
//             {l.Line_Name || l.Line_ID}
//           </MenuItem>
//         ))}
//       </TextField>

//       <TextField
//         select
//         size="small"
//         label="FG Product"
//         name="Prod_ID"
//         value={f.values.Prod_ID}
//         onChange={f.handleChange}
//         error={f.touched.Prod_ID && Boolean(f.errors.Prod_ID)}
//         helperText={f.touched.Prod_ID && f.errors.Prod_ID}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       >
//         {masters.fgProducts.map((p) => (
//           <MenuItem sx={{ fontSize: "small" }} key={p.Prod_ID} value={String(p.Prod_ID)}>
//             {p.Name || p.Product_Name || p.Prod_ID}
//           </MenuItem>
//         ))}
//       </TextField>

//       <TextField
//         select
//         size="small"
//         label="SFG Component"
//         name="Prod_ID_component"
//         value={f.values.Prod_ID_component}
//         onChange={f.handleChange}
//         error={f.touched.Prod_ID_component && Boolean(f.errors.Prod_ID_component)}
//         helperText={f.touched.Prod_ID_component && f.errors.Prod_ID_component}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       >
//         {masters.sfgProducts.map((p) => (
//           <MenuItem sx={{ fontSize: "small" }} key={p.Prod_ID} value={String(p.Prod_ID)}>
//             {p.Name || p.Product_Name || p.Prod_ID}
//           </MenuItem>
//         ))}
//       </TextField>

//       <TextField
//         select
//         size="small"
//         label="Machine"
//         name="Machine_id"
//         value={f.values.Machine_id}
//         onChange={f.handleChange}
//         error={f.touched.Machine_id && Boolean(f.errors.Machine_id)}
//         helperText={f.touched.Machine_id && f.errors.Machine_id}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       >
//         {masters.machines.map((m) => {
//           const mId = String(m.Machine_id ?? m.Machine_ID ?? m.Machine_Id ?? "");
//           const mCode = m.Machine_code || m.Machine_Code || m.Machine_code_name || mId;
//           const mName = m.Machine_Name || m.Machine_name || "";
//           return (
//             <MenuItem sx={{ fontSize: "small" }} key={mId} value={mId}>
//               {`${mCode} - ${mName}`}
//             </MenuItem>
//           );
//         })}
//       </TextField>

//       <TextField
//         size="small"
//         label="Operation"
//         name="operation"
//         value={f.values.operation}
//         onChange={f.handleChange}
//         error={f.touched.operation && Boolean(f.errors.operation)}
//         helperText={f.touched.operation && f.errors.operation}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       />

//       <TextField
//         size="small"
//         label="No. of Shifts"
//         name="no_of_shift"
//         type="number"
//         value={f.values.no_of_shift}
//         onChange={f.handleChange}
//         error={f.touched.no_of_shift && Boolean(f.errors.no_of_shift)}
//         helperText={f.touched.no_of_shift && f.errors.no_of_shift}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       />

//       <TextField
//         size="small"
//         label="Shift A Capacity"
//         name="shift_a"
//         type="number"
//         value={f.values.shift_a}
//         onChange={f.handleChange}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       />

//       <TextField
//         size="small"
//         label="Shift B Capacity"
//         name="shift_b"
//         type="number"
//         value={f.values.shift_b}
//         onChange={f.handleChange}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       />

//       <TextField
//         size="small"
//         label="Shift C Capacity"
//         name="shift_c"
//         type="number"
//         value={f.values.shift_c}
//         onChange={f.handleChange}
//         InputLabelProps={{ sx: { fontSize: "12px" } }}
//         InputProps={{ sx: { fontSize: "13px" } }}
//       />

//       <FormControlLabel
//         control={
//           <Switch
//             checked={f.values.active_status}
//             onChange={(e) => f.setFieldValue("active_status", e.target.checked)}
//             color="primary"
//           />
//         }
//         label={f.values.active_status ? "Active" : "Inactive"}
//         sx={{ alignSelf: "center" }}
//       />
//     </Box>
//   );

//   return (
//     <div
//       style={{
//         padding: 20,
//         backgroundColor: "#F5F5F5",
//         marginTop: "50px",
//         display: "flex",
//         flexDirection: "column",
//         minHeight: "calc(100vh - 90px)",
//       }}
//     >
//       <div
//         style={{
//           marginBottom: 15,
//           display: "flex",
//           justify: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <SectionHeading>In-House Capacity Management</SectionHeading>

//         <Box sx={{ display: "flex", gap: 1.5 }}>
//           <Button
//             variant="outlined"
//             color="secondary"
//             startIcon={<DownloadIcon />}
//             onClick={handleDownloadTemplate}
//             sx={{ textTransform: "none" }}
//           >
//             Download Template
//           </Button>

//           <Button
//             variant="contained"
//             color="success"
//             component="label"
//             startIcon={<FileUploadIcon />}
//             sx={{ textTransform: "none" }}
//           >
//             Bulk Upload
//             <input
//               type="file"
//               hidden
//               accept=".xlsx, .xls"
//               onChange={handleFileUpload}
//             />
//           </Button>

//           <Button
//             variant="contained"
//             color="primary"
//             startIcon={<AddIcon />}
//             onClick={handleOpenAddDialog}
//             sx={{ textTransform: "none" }}
//           >
//             Add Capacity
//           </Button>
//         </Box>
//       </div>

//       <div
//         style={{
//           flexGrow: 1,
//           backgroundColor: "#fff",
//           borderRadius: 8,
//           boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
//         }}
//       >
//         <DataGrid
//           rows={capacityList}
//           columns={columns}
//           loading={loading}
//           pageSize={10}
//           rowsPerPageOptions={[5, 10, 20]}
//           getRowId={(row) => row.inhouse_capacity_id}
//           disableSelectionOnClick
//           rowHeight={35}
//           columnHeaderHeight={45}
//           slots={{ toolbar: CustomToolbar }}
//           sx={{
//             "& .MuiDataGrid-columnHeader": {
//               backgroundColor: "#6eddf0",
//               color: "black",
//               fontWeight: "bold",
//             },
//             "& .MuiDataGrid-columnHeaderTitle": {
//               fontSize: "12px",
//               fontWeight: "bold",
//             },
//             "& .MuiDataGrid-row": {
//               backgroundColor: "#f5f5f5",
//               "&:hover": {
//                 backgroundColor: "#e0e0e0",
//               },
//             },
//             "& .MuiDataGrid-cell": {
//               color: "#333",
//               fontSize: "12px",
//             },
//           }}
//         />
//       </div>

//       {/* 1. ADD DIALOG */}
//       <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           Add In-House Capacity
//           <IconButton size="small" onClick={handleCloseAddDialog}>
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>
//         <form onSubmit={addFormik.handleSubmit}>
//           <DialogContent dividers>{renderFormFields(addFormik)}</DialogContent>
//           <DialogActions sx={{ p: 2 }}>
//             <Button variant="outlined" color="secondary" onClick={handleCloseAddDialog} sx={{ textTransform: "none" }}>
//               Cancel
//             </Button>
//             <Button type="button" variant="contained" color="primary" disabled={addLoading} onClick={handleAddSaveClick} sx={{ textTransform: "none" }}>
//               {addLoading ? "Saving..." : "Save Capacity"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* 2. EDIT DIALOG */}
//       <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
//         <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           Edit In-House Capacity
//           <IconButton size="small" onClick={handleCloseEditDialog}>
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>
//         <form onSubmit={editFormik.handleSubmit}>
//           <DialogContent dividers>{renderFormFields(editFormik)}</DialogContent>
//           <DialogActions sx={{ p: 2 }}>
//             <Button variant="outlined" color="secondary" onClick={handleCloseEditDialog} sx={{ textTransform: "none" }}>
//               Cancel
//             </Button>
//             <Button type="button" variant="contained" color="primary" disabled={editLoading} onClick={handleEditSaveClick} sx={{ textTransform: "none" }}>
//               {editLoading ? "Updating..." : "Update Capacity"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* 3. BULK ERROR LOG MODAL */}
//       <Dialog
//         open={openBulkDialog}
//         onClose={() => setOpenBulkDialog(false)}
//         maxWidth="lg"
//         fullWidth
//       >
//         <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <Typography variant="h6" color="error">
//             Bulk Upload Validation Errors
//           </Typography>
//           <IconButton size="small" onClick={() => setOpenBulkDialog(false)}>
//             <CloseIcon />
//           </IconButton>
//         </DialogTitle>

//         <DialogContent dividers>
//           <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
//             Total Rows Scanned: <strong>{bulkSummary.totalRows}</strong> | Invalid Rows:{" "}
//             <span style={{ color: "red", fontWeight: "bold" }}>
//               {bulkSummary.invalidRows}
//             </span>
//           </Typography>

//           <Box sx={{ height: 350, width: "100%" }}>
//             <DataGrid
//               rows={bulkErrorData}
//               columns={bulkErrorColumns}
//               pageSize={5}
//               rowsPerPageOptions={[5, 10]}
//               disableSelectionOnClick
//               rowHeight={38}
//               columnHeaderHeight={40}
//               sx={{
//                 "& .MuiDataGrid-columnHeader": {
//                   backgroundColor: "#ffebee",
//                   color: "#d32f2f",
//                   fontWeight: "bold",
//                 },
//               }}
//             />
//           </Box>
//         </DialogContent>

//         <DialogActions sx={{ p: 2 }}>
//           <Button
//             variant="contained"
//             color="primary"
//             onClick={() => setOpenBulkDialog(false)}
//             sx={{ textTransform: "none" }}
//           >
//             Close
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={4000}
//         onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
//       >
//         <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </div>
//   );
// };

// export default InhouseCapacity;



import React, { useContext, useEffect, useState } from "react";
import SectionHeading from "../components/Header";
import { useFormik } from "formik";
import * as yup from "yup";
import * as XLSX from "xlsx";
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import TableViewIcon from "@mui/icons-material/TableView";

import { AuthContext } from "../Authentication/AuthContext";
import {
  getInhouseCapacityMasters,
  getInhouseCapacityList,
  insertInhouseCapacity,
  updateInhouseCapacity,
  bulkInsertInhouseCapacityFile,
} from "../controller/PMPDApiService";

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1, gap: 1 }}>
    <GridToolbarColumnsButton />
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const InhouseCapacity = () => {
  const { user } = useContext(AuthContext);
  const currentUserCode = user?.GenID || "SYS_ADMIN";

  const [capacityList, setCapacityList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Dialog States
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openUnifiedBulkModal, setOpenUnifiedBulkModal] = useState(false);

  // File Upload State in Modal
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Bulk Error Modal State
  const [bulkErrorData, setBulkErrorData] = useState([]);
  const [hasErrors, setHasErrors] = useState(false);
  const [bulkSummary, setBulkSummary] = useState({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
  });

  const [masters, setMasters] = useState({
    plants: [],
    segments: [],
    modules: [],
    lines: [],
    fgProducts: [],
    sfgProducts: [],
    machines: [],
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const initialValues = {
    inhouse_capacity_id: null,
    Plant_ID: "",
    prod_seg_id: "",
    Module_ID: "",
    Line_ID: "",
    Prod_ID: "",
    Prod_ID_component: "",
    operation: "",
    Machine_id: "",
    no_of_shift: "",
    shift_a: "",
    shift_b: "",
    shift_c: "",
    active_status: true,
  };

  const validationSchema = yup.object({
    Plant_ID: yup.string().required("Required"),
    prod_seg_id: yup.string().required("Required"),
    Module_ID: yup.string().required("Required"),
    Line_ID: yup.string().required("Required"),
    Prod_ID: yup.string().required("Required"),
    Prod_ID_component: yup.string().required("Required"),
    operation: yup.string().required("Required"),
    Machine_id: yup.string().required("Required"),
    no_of_shift: yup.number().typeError("Must be a number").required("Required"),
  });

  // 1. ADD FORM FORMIK
  const addFormik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setAddLoading(true);
      const insertPayload = {
        Plant_ID: Number(values.Plant_ID),
        prod_seg_id: Number(values.prod_seg_id),
        Module_ID: Number(values.Module_ID),
        Line_ID: Number(values.Line_ID),
        Prod_ID: Number(values.Prod_ID),
        Prod_ID_component: Number(values.Prod_ID_component),
        operation: values.operation,
        Machine_id: Number(values.Machine_id),
        no_of_shift: Number(values.no_of_shift),
        shift_a: Number(values.shift_a || 0),
        shift_b: Number(values.shift_b || 0),
        shift_c: Number(values.shift_c || 0),
        active_status: values.active_status ? 1 : 0,
        created_by: currentUserCode,
      };

      try {
        const res = await insertInhouseCapacity(insertPayload);
        if (res?.status === 200 || res?.status === 201) {
          showSnackbar("Capacity record inserted successfully!", "success");
          handleCloseAddDialog();
          fetchCapacityList();
        }
      } catch (err) {
        showSnackbar(
          err?.response?.data?.details || err?.response?.data?.error || "Error inserting record",
          "error"
        );
      } finally {
        setAddLoading(false);
      }
    },
  });

  // 2. EDIT FORM FORMIK
  const editFormik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setEditLoading(true);
      const updatePayload = {
        inhouse_capacity_id: Number(values.inhouse_capacity_id),
        Plant_ID: Number(values.Plant_ID),
        prod_seg_id: Number(values.prod_seg_id),
        Module_ID: Number(values.Module_ID),
        Line_ID: Number(values.Line_ID),
        Prod_ID: Number(values.Prod_ID),
        Prod_ID_component: Number(values.Prod_ID_component),
        operation: values.operation,
        Machine_id: Number(values.Machine_id),
        no_of_shift: Number(values.no_of_shift),
        shift_a: Number(values.shift_a || 0),
        shift_b: Number(values.shift_b || 0),
        shift_c: Number(values.shift_c || 0),
        active_status: values.active_status ? 1 : 0,
        modified_by: currentUserCode,
      };

      try {
        const res = await updateInhouseCapacity(updatePayload);
        if (res?.status === 200) {
          showSnackbar("Capacity record updated successfully!", "success");
          handleCloseEditDialog();
          fetchCapacityList();
        }
      } catch (err) {
        showSnackbar(
          err?.response?.data?.details || err?.response?.data?.error || "Error updating record",
          "error"
        );
      } finally {
        setEditLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [masterRes, capacityRes] = await Promise.all([
        getInhouseCapacityMasters(),
        getInhouseCapacityList(),
      ]);

      if (masterRes?.data) setMasters(masterRes.data);
      if (capacityRes?.data) setCapacityList(capacityRes.data);
    } catch (err) {
      showSnackbar("Error loading page data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCapacityList = async () => {
    try {
      const res = await getInhouseCapacityList();
      if (res?.data) setCapacityList(res.data);
    } catch (err) {
      showSnackbar("Error updating capacity list", "error");
    }
  };

  // Dialog Handlers
  const handleOpenAddDialog = () => {
    addFormik.resetForm({ values: initialValues });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    addFormik.resetForm({ values: initialValues });
  };

  const handleAddSaveClick = async () => {
    const errors = await addFormik.validateForm();
    if (Object.keys(errors).length > 0) {
      addFormik.setTouched(
        Object.keys(errors).reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
      );
    } else {
      addFormik.handleSubmit();
    }
  };

  const handleEdit = (row) => {
    editFormik.setValues({
      inhouse_capacity_id: row.inhouse_capacity_id,
      Plant_ID: row.Plant_ID !== null && row.Plant_ID !== undefined ? String(row.Plant_ID) : "",
      prod_seg_id: row.prod_seg_id !== null && row.prod_seg_id !== undefined ? String(row.prod_seg_id) : "",
      Module_ID: row.Module_ID !== null && row.Module_ID !== undefined ? String(row.Module_ID) : "",
      Line_ID: row.Line_ID !== null && row.Line_ID !== undefined ? String(row.Line_ID) : "",
      Prod_ID: row.Prod_ID !== null && row.Prod_ID !== undefined ? String(row.Prod_ID) : "",
      Prod_ID_component: row.Prod_ID_component !== null && row.Prod_ID_component !== undefined ? String(row.Prod_ID_component) : "",
      operation: row.operation || "",
      Machine_id: row.Machine_id !== null && row.Machine_id !== undefined ? String(row.Machine_id) : "",
      no_of_shift: row.no_of_shift || "",
      shift_a: row.shift_a || "",
      shift_b: row.shift_b || "",
      shift_c: row.shift_c || "",
      active_status: Boolean(row.active_status),
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    editFormik.resetForm({ values: initialValues });
  };

  const handleEditSaveClick = async () => {
    const errors = await editFormik.validateForm();
    if (Object.keys(errors).length > 0) {
      editFormik.setTouched(
        Object.keys(errors).reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
      );
    } else {
      editFormik.handleSubmit();
    }
  };

  // UNIFIED BULK MODAL HANDLERS
  const handleOpenBulkModal = () => {
    setSelectedFile(null);
    setBulkErrorData([]);
    setHasErrors(false);
    setBulkSummary({ totalRows: 0, validRows: 0, invalidRows: 0 });
    setOpenUnifiedBulkModal(true);
  };

  const handleCloseBulkModal = () => {
    setOpenUnifiedBulkModal(false);
    setSelectedFile(null);
    setBulkErrorData([]);
    setHasErrors(false);
  };

  // EXCEL TEMPLATE DOWNLOAD HANDLER
  const handleDownloadTemplate = async () => {
    try {
      let currentMasters = masters;

      if (!currentMasters.plants?.length && !currentMasters.machines?.length) {
        const masterRes = await getInhouseCapacityMasters();
        if (masterRes?.data) {
          currentMasters = masterRes.data;
          setMasters(masterRes.data);
        }
      }

      const headerStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "00FFFF" } },
        font: { color: { rgb: "000000" }, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "B0B0B0" } },
          bottom: { style: "thin", color: { rgb: "B0B0B0" } },
          left: { style: "thin", color: { rgb: "B0B0B0" } },
          right: { style: "thin", color: { rgb: "B0B0B0" } },
        },
      };

      const templateData = [
        {
          Plant_ID: "",
          prod_seg_id: "",
          Module_ID: "",
          Line_ID: "",
          Prod_ID: "",
          Prod_ID_component: "",
          operation: "",
          Machine_id: "",
          no_of_shift: "",
          shift_a: "",
          shift_b: "",
          shift_c: "",
        },
      ];

      const worksheet1 = XLSX.utils.json_to_sheet(templateData);
      const range1 = XLSX.utils.decode_range(worksheet1["!ref"]);
      range1.e.r = 0;
      worksheet1["!ref"] = XLSX.utils.encode_range(range1);

      worksheet1["!cols"] = [
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      ];

      const headerRange1 = XLSX.utils.decode_range(worksheet1["!ref"]);
      for (let C = headerRange1.s.c; C <= headerRange1.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (worksheet1[address]) {
          worksheet1[address].s = headerStyle;
        }
      }

      const createStyledMasterSheet = (dataArray, colWidths) => {
        const ws = XLSX.utils.json_to_sheet(dataArray);
        ws["!cols"] = colWidths;
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: 0, c: C });
          if (ws[address]) ws[address].s = headerStyle;
        }
        return ws;
      };

      const wsPlants = createStyledMasterSheet(
        (currentMasters.plants || []).map((p) => ({
          Plant_ID: p.Plant_ID,
          Plant_Code: p.Plant_Code || p.Plant_ID,
          Plant_Name: p.Plant_Name || "",
        })),
        [{ wch: 12 }, { wch: 20 }, { wch: 30 }]
      );

      const wsSegments = createStyledMasterSheet(
        (currentMasters.segments || []).map((s) => ({
          prod_seg_id: s.prod_seg_id,
          Segment_Name: s.seg_name || s.prod_seg_name || "",
        })),
        [{ wch: 15 }, { wch: 30 }]
      );

      const wsModules = createStyledMasterSheet(
        (currentMasters.modules || []).map((m) => ({
          Module_ID: m.Module_ID,
          Module_Name: m.Module_Name || "",
        })),
        [{ wch: 15 }, { wch: 30 }]
      );

      const wsLines = createStyledMasterSheet(
        (currentMasters.lines || []).map((l) => ({
          Line_ID: l.Line_ID,
          Line_Name: l.Line_Name || "",
        })),
        [{ wch: 15 }, { wch: 30 }]
      );

      const wsFG = createStyledMasterSheet(
        (currentMasters.fgProducts || []).map((f) => ({
          Prod_ID: f.Prod_ID,
          Product_Name: f.Name || f.Product_Name || "",
        })),
        [{ wch: 15 }, { wch: 35 }]
      );

      const wsSFG = createStyledMasterSheet(
        (currentMasters.sfgProducts || []).map((s) => ({
          Prod_ID_component: s.Prod_ID,
          Component_Name: s.Name || s.Product_Name || "",
        })),
        [{ wch: 20 }, { wch: 35 }]
      );

      const wsMachines = createStyledMasterSheet(
        (currentMasters.machines || []).map((m) => {
          const mId = m.Machine_id ?? m.Machine_ID ?? m.Machine_Id ?? "";
          const mCode = m.Machine_code || m.Machine_Code || m.Machine_code_name || mId;
          return {
            Machine_id: mId,
            Machine_Code: mCode,
            Machine_Name: m.Machine_Name || m.Machine_name || "",
          };
        }),
        [{ wch: 15 }, { wch: 20 }, { wch: 30 }]
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet1, "Capacity_Template");
      XLSX.utils.book_append_sheet(workbook, wsPlants, "Plant Master");
      XLSX.utils.book_append_sheet(workbook, wsSegments, "Segment Master");
      XLSX.utils.book_append_sheet(workbook, wsModules, "Module Master");
      XLSX.utils.book_append_sheet(workbook, wsLines, "Line Master");
      XLSX.utils.book_append_sheet(workbook, wsFG, "FG Product Master");
      XLSX.utils.book_append_sheet(workbook, wsSFG, "SFG Component Master");
      XLSX.utils.book_append_sheet(workbook, wsMachines, "Machine Master");

      XLSX.writeFile(workbook, "Trn_Inhouse_Capacity_Template.xlsx");
    } catch (error) {
      console.error("Template Download Error:", error);
      showSnackbar("Failed to download template file", "error");
    }
  };

  // FILE SELECT HANDLER
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setBulkErrorData([]);
      setHasErrors(false);
    }
  };

  // PROCESS BULK UPLOAD SUBMISSION
  const handleExecuteUpload = async () => {
    if (!selectedFile) {
      showSnackbar("Please select an Excel file to upload", "warning");
      return;
    }

    try {
      setUploading(true);
      const res = await bulkInsertInhouseCapacityFile(selectedFile, user?.userId || 1);

      if (res?.status === 200 || res?.data?.success) {
        showSnackbar(res?.data?.message || "Bulk upload successful!", "success");
        fetchCapacityList();
        handleCloseBulkModal();
      }
    } catch (err) {
      const errPayload = err?.response?.data;
      const status = err?.response?.status;

      let formattedErrors = [];
      let summaryObj = { totalRows: 0, validRows: 0, invalidRows: 0 };

      if (status === 422 && errPayload?.invalidTable) {
        summaryObj = errPayload.summary || {
          totalRows: errPayload.invalidTable.length,
          validRows: 0,
          invalidRows: errPayload.invalidTable.length,
        };

        // Format ALL uploaded columns + Error Log for DataGrid
        formattedErrors = errPayload.invalidTable.map((item) => {
          const d = item.data || {};
          return {
            id: item.row,
            rowNo: `Row ${item.row}`,
            plantCode: d["Plant_ID"] || d["Plant Code"] || d["Plant_Code"] || d["Plant Name"] || d["Plant"] || "",
            segmentName: d["prod_seg_id"] || d["Segment Name"] || d["Segment_Name"] || d["Segment"] || "",
            moduleName: d["Module_ID"] || d["Module Name"] || d["Module_Name"] || d["Module"] || "",
            lineName: d["Line_ID"] || d["Line Name"] || d["Line_Name"] || d["Line"] || "",
            fgName: d["Prod_ID"] || d["FG Product Name"] || d["FG_Product_Name"] || d["Product Name"] || d["Product"] || "",
            sfgName: d["Prod_ID_component"] || d["SFG Component Name"] || d["SFG_Component_Name"] || d["Component Name"] || d["Component"] || "",
            machineCode: d["Machine_id"] || d["Machine Code"] || d["Machine_Code"] || d["Machine Name"] || d["Machine"] || "",
            operation: d["operation"] || d["Operation"] || "",
            shifts: d["no_of_shift"] || d["No Of Shifts"] || d["No_Of_Shifts"] || d["Shifts"] || "",
            shiftA: d["shift_a"] || d["Shift A Capacity"] || d["Shift A"] || d["Shift_A"] || "",
            shiftB: d["shift_b"] || d["Shift B Capacity"] || d["Shift B"] || d["Shift_B"] || "",
            shiftC: d["shift_c"] || d["Shift C Capacity"] || d["Shift C"] || d["Shift_C"] || "",
            errorLog: Array.isArray(item.errors) ? item.errors.join(" | ") : String(item.errors),
          };
        });
      } else {
        const generalErrorMessage =
          errPayload?.message || errPayload?.details || errPayload?.error || "Error processing request on backend";

        summaryObj = { totalRows: 1, validRows: 0, invalidRows: 1 };

        formattedErrors = [
          {
            id: 1,
            rowNo: "Server / SQL Error",
            plantCode: "N/A",
            segmentName: "N/A",
            moduleName: "N/A",
            lineName: "N/A",
            fgName: "N/A",
            sfgName: "N/A",
            machineCode: "N/A",
            operation: "N/A",
            shifts: "N/A",
            shiftA: "N/A",
            shiftB: "N/A",
            shiftC: "N/A",
            errorLog: generalErrorMessage,
          },
        ];
      }

      setBulkSummary(summaryObj);
      setBulkErrorData(formattedErrors);
      setHasErrors(true);

      showSnackbar(errPayload?.message || "Validation errors detected in upload file", "error");
    } finally {
      setUploading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const columns = [
    {
      field: "slno",
      headerName: "SI No",
      flex: 0.5,
      minWidth: 60,
      renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
    },
    { field: "Plant_Name", headerName: "Plant", flex: 1, minWidth: 100 },
    { field: "Product_Segment_Name", headerName: "Segment", flex: 1, minWidth: 110 },
    { field: "Module_Name", headerName: "Module", flex: 1, minWidth: 100 },
    { field: "Line_Name", headerName: "Line", flex: 1, minWidth: 100 },
    { field: "FG_Product_Name", headerName: "FG Product", flex: 1.2, minWidth: 120 },
    { field: "SFG_Component_Name", headerName: "SFG Component", flex: 1.2, minWidth: 120 },
    { field: "Machine_Name", headerName: "Machine", flex: 1, minWidth: 110 },
    { field: "operation", headerName: "Operation", flex: 1, minWidth: 110 },
    { field: "no_of_shift", headerName: "Shifts", flex: 0.6, minWidth: 70 },
    { field: "shift_a", headerName: "Shift A", flex: 0.7, minWidth: 80 },
    { field: "shift_b", headerName: "Shift B", flex: 0.7, minWidth: 80 },
    { field: "shift_c", headerName: "Shift C", flex: 0.7, minWidth: 80 },
    {
      field: "total_output",
      headerName: "Total Output",
      flex: 0.9,
      minWidth: 100,
      valueGetter: (value, row) => {
        const shiftA = Number(row?.shift_a || 0);
        const shiftB = Number(row?.shift_b || 0);
        const shiftC = Number(row?.shift_c || 0);
        return shiftA + shiftB + shiftC;
      },
    },
    {
      field: "avg_output",
      headerName: "Avg. Output",
      flex: 0.9,
      minWidth: 100,
      valueGetter: (value, row) => {
        const shiftA = Number(row?.shift_a || 0);
        const shiftB = Number(row?.shift_b || 0);
        const shiftC = Number(row?.shift_c || 0);
        const total = shiftA + shiftB + shiftC;
        const shifts = Number(row?.no_of_shift || 0);

        if (shifts <= 0) return 0;
        return Number((total / shifts).toFixed(2));
      },
    },
    {
      field: "active_status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 90,
      renderCell: (params) => (
        <span
          className={
            params.value ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
          }
        >
          {params.value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.6,
      minWidth: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Edit Record">
            <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Bulk Error DataGrid Columns
  const bulkErrorColumns = [
    { field: "rowNo", headerName: "Row #", width: 90 },
    { field: "plantCode", headerName: "Plant Code/ID", width: 120 },
    { field: "segmentName", headerName: "Segment", width: 120 },
    { field: "moduleName", headerName: "Module", width: 110 },
    { field: "lineName", headerName: "Line", width: 110 },
    { field: "fgName", headerName: "FG Product", width: 130 },
    { field: "sfgName", headerName: "SFG Component", width: 130 },
    { field: "machineCode", headerName: "Machine Code/ID", width: 130 },
    { field: "operation", headerName: "Operation", width: 110 },
    { field: "shifts", headerName: "Shifts", width: 80 },
    { field: "shiftA", headerName: "Shift A", width: 80 },
    { field: "shiftB", headerName: "Shift B", width: 80 },
    { field: "shiftC", headerName: "Shift C", width: 80 },
    {
      field: "errorLog",
      headerName: "Validation Error Log",
      flex: 1,
      minWidth: 280,
      renderCell: (params) => (
        <Typography variant="caption" color="error" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
  ];

  const renderFormFields = (f) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 2,
      }}
    >
      <TextField
        select
        size="small"
        label="Plant"
        name="Plant_ID"
        value={f.values.Plant_ID}
        onChange={f.handleChange}
        error={f.touched.Plant_ID && Boolean(f.errors.Plant_ID)}
        helperText={f.touched.Plant_ID && f.errors.Plant_ID}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      >
        {masters.plants.map((p) => (
          <MenuItem sx={{ fontSize: "small" }} key={p.Plant_ID} value={String(p.Plant_ID)}>
            {`${p.Plant_Code || p.Plant_ID} - ${p.Plant_Name || ""}`}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Product Segment"
        name="prod_seg_id"
        value={f.values.prod_seg_id}
        onChange={f.handleChange}
        error={f.touched.prod_seg_id && Boolean(f.errors.prod_seg_id)}
        helperText={f.touched.prod_seg_id && f.errors.prod_seg_id}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      >
        {masters.segments.map((s) => (
          <MenuItem sx={{ fontSize: "small" }} key={s.prod_seg_id} value={String(s.prod_seg_id)}>
            {s.seg_name || s.prod_seg_name || s.prod_seg_id}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Module"
        name="Module_ID"
        value={f.values.Module_ID}
        onChange={f.handleChange}
        error={f.touched.Module_ID && Boolean(f.errors.Module_ID)}
        helperText={f.touched.Module_ID && f.errors.Module_ID}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      >
        {masters.modules.map((m) => (
          <MenuItem sx={{ fontSize: "small" }} key={m.Module_ID} value={String(m.Module_ID)}>
            {m.Module_Name || m.Module_ID}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Line"
        name="Line_ID"
        value={f.values.Line_ID}
        onChange={f.handleChange}
        error={f.touched.Line_ID && Boolean(f.errors.Line_ID)}
        helperText={f.touched.Line_ID && f.errors.Line_ID}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      >
        {masters.lines.map((l) => (
          <MenuItem sx={{ fontSize: "small" }} key={l.Line_ID} value={String(l.Line_ID)}>
            {l.Line_Name || l.Line_ID}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="FG Product"
        name="Prod_ID"
        value={f.values.Prod_ID}
        onChange={f.handleChange}
        error={f.touched.Prod_ID && Boolean(f.errors.Prod_ID)}
        helperText={f.touched.Prod_ID && f.errors.Prod_ID}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      >
        {masters.fgProducts.map((p) => (
          <MenuItem sx={{ fontSize: "small" }} key={p.Prod_ID} value={String(p.Prod_ID)}>
            {p.Name || p.Product_Name || p.Prod_ID}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="SFG Component"
        name="Prod_ID_component"
        value={f.values.Prod_ID_component}
        onChange={f.handleChange}
        error={f.touched.Prod_ID_component && Boolean(f.errors.Prod_ID_component)}
        helperText={f.touched.Prod_ID_component && f.errors.Prod_ID_component}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      >
        {masters.sfgProducts.map((p) => (
          <MenuItem sx={{ fontSize: "small" }} key={p.Prod_ID} value={String(p.Prod_ID)}>
            {p.Name || p.Product_Name || p.Prod_ID}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Machine"
        name="Machine_id"
        value={f.values.Machine_id}
        onChange={f.handleChange}
        error={f.touched.Machine_id && Boolean(f.errors.Machine_id)}
        helperText={f.touched.Machine_id && f.errors.Machine_id}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      >
        {masters.machines.map((m) => {
          const mId = String(m.Machine_id ?? m.Machine_ID ?? m.Machine_Id ?? "");
          const mCode = m.Machine_code || m.Machine_Code || m.Machine_code_name || mId;
          const mName = m.Machine_Name || m.Machine_name || "";
          return (
            <MenuItem sx={{ fontSize: "small" }} key={mId} value={mId}>
              {`${mCode} - ${mName}`}
            </MenuItem>
          );
        })}
      </TextField>

      <TextField
        size="small"
        label="Operation"
        name="operation"
        value={f.values.operation}
        onChange={f.handleChange}
        error={f.touched.operation && Boolean(f.errors.operation)}
        helperText={f.touched.operation && f.errors.operation}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      />

      <TextField
        size="small"
        label="No. of Shifts"
        name="no_of_shift"
        type="number"
        value={f.values.no_of_shift}
        onChange={f.handleChange}
        error={f.touched.no_of_shift && Boolean(f.errors.no_of_shift)}
        helperText={f.touched.no_of_shift && f.errors.no_of_shift}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      />

      <TextField
        size="small"
        label="Shift A Capacity"
        name="shift_a"
        type="number"
        value={f.values.shift_a}
        onChange={f.handleChange}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      />

      <TextField
        size="small"
        label="Shift B Capacity"
        name="shift_b"
        type="number"
        value={f.values.shift_b}
        onChange={f.handleChange}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      />

      <TextField
        size="small"
        label="Shift C Capacity"
        name="shift_c"
        type="number"
        value={f.values.shift_c}
        onChange={f.handleChange}
        InputLabelProps={{ sx: { fontSize: "12px" } }}
        InputProps={{ sx: { fontSize: "13px" } }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={f.values.active_status}
            onChange={(e) => f.setFieldValue("active_status", e.target.checked)}
            color="primary"
          />
        }
        label={f.values.active_status ? "Active" : "Inactive"}
        sx={{ alignSelf: "center" }}
      />
    </Box>
  );

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 90px)",
      }}
    >
      <div
        style={{
          marginBottom: 15,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SectionHeading>In-House Capacity Management</SectionHeading>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          {/* SINGLE BULK UPLOAD BUTTON */}
          <Button
            variant="contained"
            color="success"
            startIcon={<FileUploadIcon />}
            onClick={handleOpenBulkModal}
            sx={{ textTransform: "none" }}
          >
            Bulk Upload
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ textTransform: "none" }}
          >
            Add Capacity
          </Button>
        </Box>
      </div>

      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <DataGrid
          rows={capacityList}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          getRowId={(row) => row.inhouse_capacity_id}
          disableSelectionOnClick
          rowHeight={35}
          columnHeaderHeight={45}
          slots={{ toolbar: CustomToolbar }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#6eddf0",
              color: "black",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "12px",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5",
              "&:hover": {
                backgroundColor: "#e0e0e0",
              },
            },
            "& .MuiDataGrid-cell": {
              color: "#333",
              fontSize: "12px",
            },
          }}
        />
      </div>

      {/* 1. ADD DIALOG */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Add In-House Capacity
          <IconButton size="small" onClick={handleCloseAddDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={addFormik.handleSubmit}>
          <DialogContent dividers>{renderFormFields(addFormik)}</DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" color="secondary" onClick={handleCloseAddDialog} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button type="button" variant="contained" color="primary" disabled={addLoading} onClick={handleAddSaveClick} sx={{ textTransform: "none" }}>
              {addLoading ? "Saving..." : "Save Capacity"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 2. EDIT DIALOG */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Edit In-House Capacity
          <IconButton size="small" onClick={handleCloseEditDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={editFormik.handleSubmit}>
          <DialogContent dividers>{renderFormFields(editFormik)}</DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" color="secondary" onClick={handleCloseEditDialog} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button type="button" variant="contained" color="primary" disabled={editLoading} onClick={handleEditSaveClick} sx={{ textTransform: "none" }}>
              {editLoading ? "Updating..." : "Update Capacity"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 3. ALL-IN-ONE UNIFIED BULK UPLOAD MODAL */}
      {/* 3. ALL-IN-ONE UNIFIED BULK UPLOAD MODAL */}
      <Dialog
        open={openUnifiedBulkModal}
        onClose={handleCloseBulkModal}
        maxWidth={hasErrors ? "xl" : "md"}
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            transition: "all 0.3s ease-in-out",
          },
        }}
      >
        <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FileUploadIcon color="success" />
            <Typography variant="h6" fontWeight="bold">
              Bulk Capacity Upload
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseBulkModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          {/* Download Template Banner Area */}
       
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ textTransform: "none", whitespace: "nowrap" }}
            >
              Download Template
            </Button>
        

          {/* Simple File Selector Row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justify: "space-between",
              flexWrap: "wrap",
              gap: 2,
              p: 2,
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1, minWidth: 250 }}>
              <Button
                variant="outlined"
                component="label"
                color="info"
                startIcon={<InsertDriveFileIcon />}
                sx={{ textTransform: "none", whitespace: "nowrap" }}
              >
                Choose Excel File
                <input
                  type="file"
                  hidden
                  accept=".xlsx, .xls"
                  onChange={handleFileSelect}
                />
              </Button>

              {selectedFile ? (
                <Box sx={{ overflow: "hidden" }}>
                  <Typography variant="body2" fontWeight="bold" color="#1e293b" noWrap>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No file selected (.xlsx, .xls)
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              color="success"
              disabled={uploading || !selectedFile}
              onClick={handleExecuteUpload}
              startIcon={<FileUploadIcon />}
              sx={{ textTransform: "none", whitespace: "nowrap", px: 3 }}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </Box>

          {/* EXPORTABLE ERROR LOG DATAGRID (Displays automatically on validation failure) */}
          {hasErrors && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                Total Rows Scanned: <strong>{bulkSummary.totalRows}</strong> | Invalid Rows:{" "}
                <strong>{bulkSummary.invalidRows}</strong>
              </Alert>

              <Typography variant="subtitle2" fontWeight="bold" color="#dc2626">
                Validation Error Details (Use table toolbar to export log to Excel)
              </Typography>

              <Box sx={{ height: 350, width: "100%" }}>
                <DataGrid
                  rows={bulkErrorData}
                  columns={bulkErrorColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5, 10, 20]}
                  disableSelectionOnClick
                  rowHeight={38}
                  columnHeaderHeight={40}
                  slots={{ toolbar: CustomToolbar }}
                  sx={{
                    border: "1px solid #fca5a5",
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: "#ffebee",
                      color: "#d32f2f",
                      fontWeight: "bold",
                    },
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCloseBulkModal}
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default InhouseCapacity;