import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Modal, TextField, Typography } from '@mui/material'
import { CloudUploadIcon, EditIcon, SearchIcon } from 'lucide-react'
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { deepPurple } from '@mui/material/colors';
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { AddTrn_PMPD_Master_BULK, AddTrn_PMPD_Master_Single, getPMPDPartNumbers, getProductSegmentdetails, getTrnPMPD_MasterDetails } from '../../controller/PMPDApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import { format } from 'date-fns'
import { AuthContext } from '../../Authentication/AuthContext'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'
import AddIcon from "@mui/icons-material/Add";
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { CommonMuiStyles } from '../../Styles/CommonStyles'
import { getPlantdetails } from '../../controller/CommonApiService'

// Compact filter-field/button styling — same design tokens as the Production
// Actual screen's toolbar so both screens share one visual language.
const compactFieldSx = (minWidth) => ({
    minWidth,
    flexShrink: 0,
    "& .MuiOutlinedInput-root": {
        borderRadius: "6px",
        backgroundColor: "#fafbfc",
        minHeight: 30,
        display: "flex",
        alignItems: "center",
        padding: "0 7px !important",
        "& fieldset": { borderColor: "#dde1e7" },
        "&:hover fieldset": { borderColor: "#0066FF" },
        "&.Mui-focused fieldset": { borderColor: "#0066FF", borderWidth: "1.5px" },
    },
    "& .MuiInputBase-input, & .MuiSelect-select": { padding: "0 !important", fontSize: 11 },
    "& .MuiInputLabel-root": { fontSize: 11, color: "#6b7280" },
    "& .MuiInputLabel-root.MuiInputLabel-shrink": { fontSize: 10.5, transform: "translate(7px, -7px) scale(0.85)" },
});

const compactButtonSx = {
    height: 30,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "none",
    borderRadius: "6px",
    boxShadow: "none",
    padding: "0 10px",
    whiteSpace: "nowrap",
};

const PMPD_MasterScreen = () => {
    const [searchText, setSearchText] = useState("");
    const [materialTypeFilter, setMaterialTypeFilter] = useState("All");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [openUploadModal, setOpenUploadModal] = useState(false);
    const [refreshData, setRefreshData] = useState(false)
    const { user } = useContext(AuthContext);
    const currentUserPlantCode = user.PlantCode

    const PMPDAccess = getPMPDAccess()

    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editData, setEditData] = useState(null);

    const handleEdit = (data) => {
        console.log(data, "data")
        setEditData(data)
        setOpenEditModal(true)
    }
    const handleOpenAddModal = (item) => {
        setOpenAddModal(true);
    };


    const applyFilters = () => {
        const text = searchText.trim().toLowerCase();

        const filteredRows = originalRows.filter((row) => {
            if (materialTypeFilter !== "All" && row.material_type_group !== materialTypeFilter) return false;
            if (!text) return true;
            return ['plant', 'customer_name', 'part_number', 'description', 'plan_type'].some((key) => {
                const value = row[key];
                return value && String(value).toLowerCase().includes(text);
            });
        });
        setRows(filteredRows);
    };

    const handleSearch = () => applyFilters();

    useEffect(() => {
        applyFilters();
    }, [originalRows, materialTypeFilter]);

    const columns = [
        { field: "trn_pmpd_master_id", headerName: "SI No", width: 80 },
        { field: "plant", headerName: "Plant", flex: 1 },
        { field: "line", headerName: "Line", flex: 1 },
        // { field: "customer_name", headerName: "Customer", flex: 1 },
        { field: "part_number", headerName: "Part No", flex: 1 },
        {
            field: "material_type", headerName: "Material Type", flex: 1,
            renderCell: (params) => params.value
                ? <>{params.value}</>
                : <span style={{ color: "#d32f2f" }}>Not in Material Master (or inactive)</span>
        },
        { field: "prod_seg_name", headerName: "Segment", flex: 1 },
        { field: "PMPD_SMH", headerName: "PMPD_SMH", flex: 1 },
        {
            field: "production", headerName: "Production", flex: 1,
            renderCell: (params) => {
                return (<>{JSON.stringify(params.value)}</>)
            }
        },
        { field: "inspection", headerName: "Inspection", flex: 1 },
        { field: "packing", headerName: "Packing", flex: 1 },
        { field: "end_qty", headerName: "Ends", flex: 1 },
        { field: "effective_date", headerName: "Plan Date", flex: 1, renderCell: (params) => (<>{params.value ? format(params.value, "dd-MM-yyyy") : ""}</>) },
        {
            field: "action", headerName: "Action", width: 80,
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    onClick={() => handleEdit(params.row)}
                    title="Edit"
                    disabled={PMPDAccess.disableAction}
                >
                    <EditIcon size={15} />
                </IconButton>
            ),
        },
    ];

    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarExport />
        </GridToolbarContainer>
    );

    useEffect(() => {
        const fectchData = async () => {
            const response = PMPDAccess.disableAction
                ? await getTrnPMPD_MasterDetails(currentUserPlantCode)
                : await getTrnPMPD_MasterDetails()
            setOriginalRows(response || [])
        }
        fectchData()
    }, [refreshData])

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
            <div
                style={{
                    marginBottom: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <SectionHeading>
                    PMPD Master
                </SectionHeading>
            </div>


            {/* Search and Icons Section */}
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
                {/* Search Box - requester */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Type here..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyUp={handleSearch}
                        sx={compactFieldSx(260)}
                    />
                    <TextField
                        select
                        size="small"
                        label="Material Type"
                        value={materialTypeFilter}
                        onChange={(e) => setMaterialTypeFilter(e.target.value)}
                        sx={compactFieldSx(150)}
                    >
                        <MenuItem sx={{ fontSize: 11.5 }} value="All">All</MenuItem>
                        <MenuItem sx={{ fontSize: 11.5 }} value="FERT">FERT</MenuItem>
                        <MenuItem sx={{ fontSize: 11.5 }} value="HALB">HALB</MenuItem>
                        <MenuItem sx={{ fontSize: 11.5 }} value="Others">Others</MenuItem>
                    </TextField>
                    <Button
                        onClick={handleSearch}
                        variant="outlined"
                        disableElevation
                        startIcon={<SearchIcon size={15} />}
                        sx={{ ...compactButtonSx, borderColor: "#0066FF", color: "#0066FF", "&:hover": { borderColor: "#0052cc", backgroundColor: "#f0f6ff" } }}
                    >
                        Search
                    </Button>
                </div>
                <div style={{ display: PMPDAccess.disableAction ? "none" : "flex", gap: 8, alignItems: "center" }}>
                    <ExcelUploadModal open={openUploadModal}
                        onClose={() => {
                            setOpenUploadModal(false)
                        }}
                        onOpen={() => {
                            setOpenUploadModal(true)
                        }}
                        templateUrl={""}
                        setRefreshData={setRefreshData}
                    />

                    <Button
                        variant="contained"
                        disableElevation
                        onClick={handleOpenAddModal}
                        startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                        sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" }, display: PMPDAccess.disableAction ? "none" : null }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* DataGrid — compact enterprise styling shared with the Production
                Actual screen. Only visual styling; rows/columns/behavior untouched. */}
            <div
                style={{
                    flexGrow: 1, // Ensures it grows to fill the remaining space
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
                    pageSize={5} // Set the number of rows per page to 8
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => row.trn_pmpd_master_id} // Specify a custom id field
                    disableSelectionOnClick
                    columnHeaderHeight={36}
                    rowHeight={38}
                    slots={{ toolbar: CustomToolbar }}
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
                    }}
                />
            </div>

            <AddDialog open={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData} />
            <AddDialog open={openEditModal} setOpenAddModal={setOpenEditModal} setRefreshData={setRefreshData} editData={editData} />


        </div>
    )
}


const ExcelUploadModal = ({
    open,
    onClose,
    onOpen,
    setRefreshData
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [loadingTemplate, setLoadingTemplate] = useState(false)
    const [uploadResponse, setUploadResponse] = useState(null)

    const handleFileChange = (event) => {
        setUploadedFile(event.target.files[0]);
    };

    const handleClose = () => {
        if (onClose) onClose()
        setUploadedFile(null)
        setUploadResponse(null)
        // setIsUploading(false)
        setRefreshData((prev) => !prev)
    }


    async function downloadProductionPlanTemplate() {

        const headerColumns = [
            'Plant_Code',
            'FG_Partno',
            'Description',
            'Segment',
            'Line_Name',
            'PMPD_SMH',
            'Production',
            'Inspection',
            'Packing',
            'End_Qty',
            'Effective_Date'
        ];

        // 1️⃣ Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "PMPD_MASTER";
        workbook.created = new Date();

        // 2️⃣ Add worksheet
        const worksheet = workbook.addWorksheet("PMPD_MASTER");

        // 3️⃣ Add header row
        worksheet.addRow(headerColumns);

        // 4️⃣ Style header (optional but recommended)
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFADD8E6" },
            };
        });

        // 5️⃣ Set column widths
        worksheet.columns = [
            { width: 15 }, // Plant_Code
            { width: 20 }, // Customer
            { width: 20 }, // FG_Partno
            { width: 12 }, // Per_qty
            { width: 18 }, // Segment
            { width: 18 }, // Line_Name
            { width: 12 }, // PMPD_SMH
            { width: 14 }, // Production
            { width: 14 }, // Inspection
            { width: 14 }, // Packing
            { width: 18 }, // Effective Date
        ];

        // 6️⃣ Freeze header row
        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        // 7️⃣ Write & download file
        const buffer = await workbook.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            "PMPD_MASTER_Template.xlsx"
        );
    }


    const handleUploadData = async () => {
        if (!uploadedFile) {
            return alert('Upload file not found')
        }

        if (isUploading) return
        setIsUploading(true)
        try {
            const formData = new FormData()
            const userId = localStorage.getItem('EmpId')
            formData.append("userId", userId)
            formData.append("file", uploadedFile)
            const response = await AddTrn_PMPD_Master_BULK(formData)
            console.log(response.data, "Upload excel response")
            setUploadResponse(response.data)
            alert('File uploaded successfully')
            handleClose()
        } catch (error) {
            console.error("Upload error:", error);

            // ✅ VALIDATION ERROR FROM BACKEND
            if (error.response?.status === 422) {
                setUploadResponse(error.response.data); // <-- show errors in UI
            }
            // ❌ OTHER SERVER ERRORS
            else {
                alert(
                    error.response?.data?.message ||
                    error.message ||
                    "Something went wrong! Try again later."
                );
            }
        }
        setIsUploading(false)
    }

    return (
        <>
            <Button
                variant="contained"
                disableElevation
                onClick={() => {
                    if (onOpen) onOpen()
                }}
                startIcon={<CloudUploadIcon size={15} />}
                sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
            >
                Upload
            </Button>

            <Modal open={open} onClose={() => { }}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        width: uploadResponse ? "50%" : "30%",
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,

                        maxHeight: "80vh",
                        overflowY: "auto",

                        outline: "none"
                    }}
                >
                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            color: "#2e59d9",
                            textDecoration: "underline",
                            textDecorationColor: "#88c57a",
                            textDecorationThickness: "3px",
                        }}
                    >
                        Upload Excel File
                    </Typography>

                    {/* Download Template */}
                    <Button
                        variant="contained"
                        sx={{
                            mb: 2,
                            bgcolor: deepPurple[500],
                            "&:hover": { bgcolor: deepPurple[700] },
                        }}
                        onClick={downloadProductionPlanTemplate}
                    // onClick={createStyledDropdownExcel}
                    >
                        <FaDownload /> &nbsp; {loadingTemplate ? "Loading..." : "Download Template"}
                    </Button>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        id="excel-upload"
                        hidden
                        onChange={handleFileChange}
                    />

                    {/* Custom File Upload UI */}
                    <label htmlFor="excel-upload">
                        <Box
                            sx={{
                                border: "2px dashed #1976d2",
                                borderRadius: "8px",
                                p: 2,
                                cursor: "pointer",
                                mb: 1,
                                "&:hover": {
                                    backgroundColor: "#f4f6fb",
                                },
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 1
                            }}
                        >
                            <FaUpload />
                            <Typography variant="body2" >
                                {uploadedFile?.name || "Click to choose Excel file"}
                            </Typography>
                        </Box>
                    </label>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 2,
                            my: 3,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleClose}
                            sx={{ width: "30%" }}
                        >
                            Close
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleUploadData}
                            disabled={isUploading}
                            sx={{ width: "30%" }}
                        >
                            {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                    </Box>

                    {/* Upload Status */}
                    {uploadResponse && <ValidationResult response={uploadResponse} />}


                </Box>
            </Modal>
        </>
    );
};


const ValidationResult = ({ response }) => {
    const { summary, errors } = response;

    return (
        <div className="p-4 bg-red-50 rounded-lg border border-red-300">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
                ❌ Upload Failed – Validation Errors
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div>Total Rows: <b>{summary.totalRows}</b></div>
                <div className="text-green-600">Valid: <b>{summary.valid}</b></div>
                <div className="text-red-600">Invalid: <b>{summary.invalid}</b></div>
                <div className="text-yellow-600">Empty: <b>{summary.empty}</b></div>
            </div>

            {/* Invalid rows */}
            {errors?.invalidRows?.length > 0 && (
                <>
                    <h3 className="font-semibold mb-2">❌ Invalid Rows</h3>

                    <table className="w-full border text-sm">
                        <thead className="bg-red-100">
                            <tr>
                                <th className="border px-2 py-1">Excel Row</th>
                                <th className="border px-2 py-1">Errors</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errors.invalidRows.map((row, i) => (
                                <tr key={i} className="hover:bg-red-50">
                                    <td className="border px-2 py-1 text-center">
                                        {row.row}
                                    </td>
                                    <td className="border px-2 py-1">
                                        <ul className="list-disc pl-4">
                                            {row.errors.map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Empty rows */}
            {errors?.emptyRows?.length > 0 && (
                <div className="mt-4 text-yellow-700">
                    ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
                </div>
            )}
        </div>
    );
}




const AddDialog = ({ open, setOpenAddModal, setRefreshData, editData }) => {
    const [submitLoading, setSubmitLoading] = useState(false)
    const [plants, setPlants] = useState([])
    const [productSegment, setProductSegment] = useState([])
    const [partNumbers, setPartNumbers] = useState([])

    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        plant: Yup.string().required("Required"),
        prod_seg_id: Yup.string().required("Required"),
        line: Yup.string().required("Required"),
        part_number: Yup.string().required("Required"),
        PMPD_SMH: Yup.string().required("Required"),
        production: Yup.string().required("Required"),
        inspection: Yup.string().required("Required"),
        packing: Yup.string().required("Required"),
        end_qty: Yup.string()
            .min(1, "Must be greater than or equal to 1")
            .max(6, "Must be less than or equal to 6")
            .required("Required"),
        effective_date: Yup.string().required("Required"),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: editData?.plant || "",
            prod_seg_id: editData?.prod_seg_id || "",
            line: editData?.line || "",
            part_number: editData?.part_number || "",
            PMPD_SMH: editData?.PMPD_SMH || "",
            production: editData?.production || 0,
            inspection: editData?.inspection || 0,
            packing: editData?.packing || 0,
            end_qty: editData?.end_qty || 0,
            effective_date: editData?.effective_date ? format(editData?.effective_date, "yyyy-MM-dd") : "",
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (submitLoading) return
            setSubmitLoading(true)
            console.log(values)
            try {
                const userId = localStorage.getItem("EmpId");
                if (editData) {
                    const payload = {
                        trn_pmpd_master_id: editData?.trn_pmpd_master_id,
                        ...values,
                        user_id: userId
                    }
                    await AddTrn_PMPD_Master_Single(payload)
                    alert("✅ PMPD Master updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        user_id: userId
                    }
                    await AddTrn_PMPD_Master_Single(payload)
                    alert("✅ PMPD Master added successfully!");
                }
                setRefreshData((prev) => !prev)
                handleClose()
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert(error?.response?.data?.message ? `❌ ${error?.response?.data?.message}` : "❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });

    useEffect(() => {
        const fetchParts = async () => {
            if (!open || !formik.values.plant) return setPartNumbers([])
            try {
                setPartNumbers(await getPMPDPartNumbers(formik.values.plant) || [])
            } catch (error) {
                console.error("Error fetching part numbers", error)
                setPartNumbers([])
            }
        }
        fetchParts()
    }, [open, formik.values.plant])


    useEffect(() => {
        const fetchInitData = async () => {
            const response = await getPlantdetails()
            console.log('Plants', response)
            setPlants(response)

            const response2 = await getProductSegmentdetails()
            console.log('Segment', response2)
            setProductSegment(response2)

        }
        if (open) fetchInitData()

    }, [open])


    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {`${editData ? "Edit" : "Add"} PMPD Master`}
            </DialogTitle>
            {/* {JSON.stringify(editData)} */}
            <DialogContent sx={{ pb: 0 }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    // display: "flex",
                    width: "100%",
                    gap: "15px"
                }}>

                    <TextField
                        select
                        id="plant"
                        name="plant"
                        label="Plant"
                        fullWidth
                        value={String(formik.values.plant)}
                        onChange={(e) => {
                            formik.handleChange(e);
                            formik.setFieldValue("part_number", "");
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.plant&& Boolean(formik.errors.plant)}
                        helperText={formik.touched.plant && formik.errors.plant}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {plants?.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Plant_Code}>
                                {`${option.Plant_Code} - ${option.Plant_Name}`}
                            </MenuItem>
                        )) || []}
                    </TextField>

                    <TextField
                        select
                        id="prod_seg_id"
                        name="prod_seg_id"
                        label="Segment"
                        fullWidth
                        value={String(formik.values.prod_seg_id)}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.prod_seg_id && Boolean(formik.errors.prod_seg_id)}
                        helperText={formik.touched.prod_seg_id && formik.errors.prod_seg_id}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {productSegment?.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.prod_seg_id}>
                                {`${option.seg_name}`}
                            </MenuItem>
                        )) || []}
                    </TextField>

                    <TextField
                        id="line"
                        name="line"
                        label="Line"
                        fullWidth
                        value={formik.values.line}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.line && Boolean(formik.errors.line)}
                        helperText={formik.touched.line && formik.errors.line}
                        sx={{ ...CommonMuiStyles.textFieldSmallSx2, mt: 1 }}
                    />

                    <Autocomplete
                        id="part_number"
                        options={partNumbers}
                        getOptionLabel={(p) => (typeof p === "string" ? p : p.part_number)}
                        isOptionEqualToValue={(o, v) => o.part_number === (typeof v === "string" ? v : v.part_number)}
                        filterOptions={(opts, { inputValue }) => {
                            const q = inputValue.trim().toLowerCase()
                            return opts.filter((o) => `${o.part_number} ${o.description || ""}`.toLowerCase().includes(q))
                        }}
                        value={partNumbers.find((p) => p.part_number === formik.values.part_number) || formik.values.part_number || null}
                        onChange={(e, value) => formik.setFieldValue("part_number", value ? value.part_number : "")}
                        onBlur={() => formik.setFieldTouched("part_number", true)}
                        disabled={!formik.values.plant}
                        noOptionsText="No active FERT/HALB material for this plant"
                        renderOption={(props, option) => (
                            <li {...props} key={option.part_number}>
                                <span>
                                    {option.part_number}
                                    {option.description ? <span style={{ fontSize: 10, color: "#6b7280" }}> / {option.description}</span> : null}
                                </span>
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                name="part_number"
                                label="Part Number"
                                error={formik.touched.part_number && Boolean(formik.errors.part_number)}
                                helperText={formik.touched.part_number && formik.errors.part_number}
                                sx={{ ...CommonMuiStyles.textFieldSmallSx2, mt: 1 }}
                            />
                        )}
                    />


                    <TextField
                        select
                        id="PMPD_SMH"
                        name="PMPD_SMH"
                        label="PMPD / SMH"
                        fullWidth
                        value={String(formik.values.PMPD_SMH)}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.PMPD_SMH && Boolean(formik.errors.PMPD_SMH)}
                        helperText={formik.touched.PMPD_SMH && formik.errors.PMPD_SMH}
                        sx={{ ...CommonMuiStyles.textFieldSmallSx2, mt: 1 }}
                    >
                        <MenuItem sx={{ fontSize: "small" }} value="PMPD">PMPD</MenuItem>
                        <MenuItem sx={{ fontSize: "small" }} value="SMH">SMH</MenuItem>
                    </TextField>


                    <TextField
                        id="production"
                        name="production"
                        label="Production"
                        type="number"
                        fullWidth
                        value={formik.values.production}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.production && Boolean(formik.errors.production)}
                        helperText={formik.touched.production && formik.errors.production}
                        sx={{ ...CommonMuiStyles.textFieldSmallSx2, mt: 1 }}
                    />


                    <TextField
                        id="inspection"
                        name="inspection"
                        label="Inspection"
                        type="number"
                        fullWidth
                        value={formik.values.inspection}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.inspection && Boolean(formik.errors.inspection)}
                        helperText={formik.touched.inspection && formik.errors.inspection}
                        sx={{ ...CommonMuiStyles.textFieldSmallSx2, mt: 1 }}
                    />

                    <TextField
                        id="packing"
                        name="packing"
                        label="Packing"
                        type="number"
                        fullWidth
                        value={formik.values.packing}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.packing && Boolean(formik.errors.packing)}
                        helperText={formik.touched.packing && formik.errors.packing}
                        sx={{ ...CommonMuiStyles.textFieldSmallSx2, mt: 1 }}
                    />

                    <TextField
                        id="end_qty"
                        name="end_qty"
                        label="End Quantity"
                        type="number"
                        fullWidth
                        value={Number(formik.values.end_qty || 0)}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.end_qty && Boolean(formik.errors.end_qty)}
                        helperText={formik.touched.end_qty && formik.errors.end_qty}
                        sx={{ ...CommonMuiStyles.textFieldSmallSx2, mt: 1 }}
                    />


                    <TextField
                        id="effective_date"
                        name="effective_date"
                        label="Effective Date"
                        fullWidth
                        type="date"
                        value={formik.values.effective_date}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.effective_date && Boolean(formik.errors.effective_date)}
                        helperText={formik.touched.effective_date && formik.errors.effective_date}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                        slotProps={{
                            inputLabel: {
                                shrink: true
                            }
                        }}
                    />
                </div>

            </DialogContent>
            <DialogActions sx={{ p: 0, py: 2, pr: 3 }}>
                <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={formik.handleSubmit} autoFocus>
                    {submitLoading ? "Loading..." : editData ? "Update" : "Add"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}


export default PMPD_MasterScreen
