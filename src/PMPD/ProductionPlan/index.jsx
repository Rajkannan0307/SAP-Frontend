import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { Box, Button, IconButton, MenuItem, Modal, TextField, Typography } from '@mui/material'
import { CloudUploadIcon, EditIcon, SearchIcon } from 'lucide-react'
import { PiUploadDuotone } from 'react-icons/pi'
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { deepPurple } from '@mui/material/colors';
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getMyPlants, myPlantLabel } from '../../controller/CommonApiService'
import { findPlantsNotAllowed, plantsNotAllowedMessage } from '../../common/plantFileCheck'
import { AddProductionPlan, getProductionPlandetails, getProductSegmentdetails } from '../../controller/PMPDApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import { endOfDay, format, isValid, startOfDay } from 'date-fns'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'
import { AuthContext } from '../../Authentication/AuthContext'
import ValidationResponseGrid from '../../components/ValidationResponseTable'
import { finYearsList } from '../../common/data'

// Compact filter-field/button styling - same design tokens as the Production
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
        "&.Mui-disabled": {
            backgroundColor: "#f1f2f5",
            cursor: "not-allowed",
            "& fieldset": { borderColor: "#e2e4e9", borderStyle: "dashed" },
        },
    },
    "& .MuiInputBase-input, & .MuiSelect-select": { padding: "0 !important", fontSize: 11 },
    "& .Mui-disabled": { cursor: "not-allowed", WebkitTextFillColor: "#a4a9b3" },
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


// Financial-year months in Apr..Mar order (value = calendar month 1-12)
const FY_MONTHS = [
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
]

// Date-only values come back as ISO strings (yyyy-mm-dd...). Read the date part
// directly so a timezone offset can never shift the displayed/filtered day.
const parsePlanDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return isValid(value) ? value : null
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    const d = new Date(value)
    return isValid(d) ? d : null
}

// The procedure returns 'YES' when the part exists in PMPD Master and 'N/A' when it does not.
// The screen shows (and filters, sorts, exports) it as Yes / No.
const pmpdYesNo = (value) => (String(value ?? "").trim().toUpperCase() === "YES" ? "Yes" : "No")

// Current financial year (Apr-Mar) in the "YYYY-YY" format used by finYearsList
const getCurrentFinYear = () => {
    const now = new Date()
    const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const label = `${start}-${String(start + 1).slice(-2)}`
    return finYearsList.includes(label) ? label : ""
}
const currentFinYear = getCurrentFinYear()

const PMPD_ProductionPlan = () => {
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [openUploadModal, setOpenUploadModal] = useState(false);
    const [refreshData, setRefreshData] = useState(false)
    const { user } = useContext(AuthContext);
    const currentUserPlantCode = user.PlantCode

    const PMPDAccess = getPMPDAccess()

    // const handleSearch = () => {
    //     const text = searchText.trim().toLowerCase();

    //     if (!text) {
    //         setRows(originalRows);
    //     } else {
    //         const filteredRows = originalRows.filter((row) =>
    //             ['plant', 'customer_name', 'part_number', 'description', 'plan_type', 'prod_seg_name', 'effective_date'].some((key) => {
    //                 const value = row[key];
    //                 format(params.value, "dd-MM-yyyy")
    //                 return value && String(value).toLowerCase().includes(text);
    //             })
    //         );
    //         setRows(filteredRows);
    //     }
    // };

    const handleSearch = () => {
        const text = searchText.trim().toLowerCase();

        if (!text) {
            setRows(originalRows);
            return;
        }

        // Typing exactly "yes" or "no" searches the PMPD Master column only
        // (a plain substring match on "no" would also hit unrelated descriptions).
        if (text === 'yes' || text === 'no') {
            setRows(originalRows.filter((row) => pmpdYesNo(row.PMPD_effective_date).toLowerCase() === text));
            return;
        }

        const filteredRows = originalRows.filter((row) => {
            return ['plant', 'customer_name', 'part_number', 'description', 'plan_type', 'prod_seg_name', 'effective_date', 'PMPD_effective_date'].some((key) => {
                let value = row[key];

                if (value === null || value === undefined) return false;

                // Handle the date field specifically
                if (key === 'effective_date') {
                    const dateObj = parsePlanDate(value);

                    if (dateObj) {
                        // Searchable in both dd-MM-yyyy and yyyy-MM-dd
                        const shown = format(dateObj, "dd-MM-yyyy");
                        return shown.includes(text) || format(dateObj, "yyyy-MM-dd").includes(text);
                    }
                }

                if (key === 'PMPD_effective_date') value = pmpdYesNo(value);

                // Standard string comparison
                return String(value).toLowerCase().includes(text);
            });
        });

        setRows(filteredRows);
    };

    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(false)

    const validationschema = yup.object({
        plant: yup.string().required('Required'),
        fin_year: yup.string().required('Required'),
    })

    const formik = useFormik({
        initialValues: {
            plant: currentUserPlantCode,
            fin_year: currentFinYear,
            month: "",
            type: "SUBMIT"
        },
        validationSchema: validationschema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log(values)
            const fin_Year = values.fin_year
            const plant = values.plant
            const startYear = Number(fin_Year.split("-")[0]); // 2025
            const endYear = startYear + 1;                   // 2026

            let startDate = startOfDay(new Date(startYear, 3, 1));  // 01-Apr-2025
            let endDate = endOfDay(new Date(endYear, 2, 31));    // 31-Mar-2026

            // Optional month filter inside the financial year (Apr-Dec fall in
            // the start year, Jan-Mar in the next one)
            if (values.month) {
                const month = Number(values.month);
                const year = month >= 4 ? startYear : endYear;
                startDate = startOfDay(new Date(year, month - 1, 1));
                endDate = endOfDay(new Date(year, month, 0));
            }
            console.log(startDate, endDate)


            if (loading) return

            setLoading(true)
            const response = await getProductionPlandetails(startDate, endDate, plant)
            setOriginalRows(response || [])
            setRows(response || [])


            setLoading(false)
        }
    })

    useEffect(() => {
        const fetchData = async () => {
            const resposne = await getMyPlants() // only the plants this user may use (own plant + Data Access)
            setPlants(Array.isArray(resposne) ? resposne : [])
        }
        fetchData()
    }, [])

    // Initial load: current financial year, all months
    useEffect(() => {
        if (formik.values.plant && formik.values.fin_year) formik.submitForm()
    }, [])

    const columns = [
        { field: "trn_monthly_plan_id", headerName: "SI No", width: 80 },
        { field: "plant", headerName: "Plant", width: 80 },
        { field: "customer_name", headerName: "Customer", flex: 1 },
        { field: "prod_seg_name", headerName: "Segment", flex: 1 },
        { field: "part_number", headerName: "Part No", flex: 1 },
        { field: "description", headerName: "Description", flex: 1 },
        { field: "plan_type", headerName: "Plan Type", flex: 1 },
        { field: "plan_qty", headerName: "Plan Qty", flex: 1 },
        { field: "ends", headerName: "Ends", width: 80 },
        {
            field: "effective_date", headerName: "Plan Date", flex: 1, type: "date",
            valueGetter: (value) => parsePlanDate(value),
            valueFormatter: (value) => (value ? format(value, "dd-MM-yyyy") : ""),
        },
        {
            field: "PMPD_effective_date", headerName: "PMPD Master", flex: 1,
            type: "singleSelect", valueOptions: ["Yes", "No"],
            valueGetter: (value) => pmpdYesNo(value),
        },
        // {
        //     field: "action", headerName: "Action", width: 160,
        //     renderCell: (params) => (
        //         <IconButton
        //             color="primary"
        //             // onClick={() => handleEdit(params.row)}
        //             title="Edit"
        //         >
        //             <EditIcon />
        //         </IconButton>
        //     ),
        // },
    ];

    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarExport />
        </GridToolbarContainer>
    );

    // useEffect(() => {
    //     const fectchData = async () => {
    //         const response = await getProductionPlandetails()
    //         setOriginalRows(response || [])
    //         setRows(response || [])
    //     }
    //     fectchData()
    // }, [refreshData])

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
                    Production Plan
                </SectionHeading>
            </div>

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
                        name="plant"
                        value={formik.values.plant}
                        onChange={formik.handleChange}
                        sx={compactFieldSx(190)}
                        disabled={PMPDAccess.disableAction}
                        error={formik.touched.plant && Boolean(formik.errors.plant)}
                        helperText={formik.touched.plant && formik.errors.plant}
                    >
                        {plants.map((p) => (
                            <MenuItem sx={{ fontSize: 11.5 }} key={p.Plant_ID} value={p.Plant_Code}>
                                {myPlantLabel(p)}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        id="fin_year"
                        select
                        size="small"
                        label="Financial Year"
                        name="fin_year"
                        value={formik.values.fin_year}
                        onChange={formik.handleChange}
                        sx={compactFieldSx(130)}
                        error={formik.touched.fin_year && Boolean(formik.errors.fin_year)}
                        helperText={formik.touched.fin_year && formik.errors.fin_year}
                    >
                        {finYearsList.map((fy) => (
                            <MenuItem key={fy} value={fy} sx={{ fontSize: 11.5 }}>
                                {fy}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        id="month"
                        select
                        size="small"
                        label="Month"
                        name="month"
                        value={formik.values.month}
                        onChange={formik.handleChange}
                        sx={compactFieldSx(130)}
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{ displayEmpty: true, renderValue: (v) => (v ? FY_MONTHS.find((m) => m.value === Number(v))?.label : "All Months") }}
                    >
                        <MenuItem value="" sx={{ fontSize: 11.5 }}>All Months</MenuItem>
                        {FY_MONTHS.map((m) => (
                            <MenuItem key={m.value} value={m.value} sx={{ fontSize: 11.5 }}>
                                {m.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        disableElevation
                        onClick={(e) => {
                            formik.setFieldValue('type', 'SUBMIT')
                            formik.handleSubmit(e)
                        }}
                        sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
                    >
                        {loading ? "Loading..." : "Submit"}
                    </Button>
                </div>

                {/* Search and Icons Section */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12
                    }}
                >
                    {/* Search Box - requester */}
                    <div style={{ display: "flex", gap: 8 }}>
                        <TextField
                            size="small"
                            variant="outlined"
                            placeholder="Type here..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyUp={handleSearch}
                            sx={compactFieldSx(260)}
                        />
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
                    </div>
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
                    getRowId={(row) => row.trn_monthly_plan_id} // Specify a custom id field
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
        // 1️⃣ Fetch dropdown data
        const [plant, prod_segments] = await Promise.all([
            getMyPlants(), // only the plants this user may use (own plant + Data Access)
            getProductSegmentdetails(),
        ]);

        const plantCodes = (Array.isArray(plant) ? plant : []).map((e) => e.Plant_Code);
        const prodSegNames = prod_segments.map((e) => e.seg_name);
        const planTypes = ["AOP", "MP"];

        // 2️⃣ Create workbook & worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Production Plan");

        // 3️⃣ Header row
        // const headers = [
        //     "plant",
        //     "customer_name",
        //     "part_number",
        //     "description",
        //     "prod_seg_id",
        //     "date",
        //     "plan_type",
        //     "plan_qty",
        //     "effective_date",
        // ];
        const headers = [
            "Plant",
            "Customer Name",
            "Part Number",
            "Description",
            "Segment",
            "Plan Type",
            "Plan_qty",
            "Ends",
            "Effective Date",
        ];

        worksheet.addRow(headers);

        // Header styling
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFADD8E6" },
            };
        });

        // Column widths
        worksheet.columns.forEach((col) => (col.width = 22));

        // 4️⃣ APPLY DROPDOWNS (ROW 2 → 1000)

        // Column A → plant
        worksheet.dataValidations.add("A2:A1000", {
            type: "list",
            allowBlank: false,
            formulae: [`"${plantCodes.join(",")}"`],
        });

        // Column E → product segment
        worksheet.dataValidations.add("E2:E1000", {
            type: "list",
            allowBlank: false,
            formulae: [`"${prodSegNames.join(",")}"`],
        });

        // Column G → plan type
        worksheet.dataValidations.add("F2:F1000", {
            type: "list",
            allowBlank: false,
            formulae: [`"${planTypes.join(",")}"`],
        });

        // 5️⃣ Date formatting
        worksheet.getColumn("F").numFmt = "yyyy-mm-dd";
        worksheet.getColumn("I").numFmt = "yyyy-mm-dd";

        // 6️⃣ Cell styling (rows below header)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            row.eachCell((cell) => {
                cell.alignment = { horizontal: "center" };
                cell.font = { size: 10 };
            });
        });

        // 7️⃣ Download file
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer], {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            "Production_Plan_Template.xlsx"
        );
    }


    const handleUploadData = async () => {
        if (!uploadedFile) {
            return alert('Upload file not found')
        }

        if (isUploading) return
        setIsUploading(true)
        try {
            // Only plants this user may use (own + Data Access): check the Plant column of the file before uploading
            const { blocked, plants } = await findPlantsNotAllowed(uploadedFile)
            if (blocked.length > 0) {
                alert(plantsNotAllowedMessage(blocked, plants))
                setIsUploading(false)
                return
            }
            const formData = new FormData()
            const userId = localStorage.getItem('EmpId')
            formData.append("userId", userId)
            formData.append("file", uploadedFile)
            const response = await AddProductionPlan(formData)
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

                    {/* Action Buttons */}
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
                    {uploadResponse && <ValidationResponseGrid response={uploadResponse} />}


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
            {errors.invalidRows.length > 0 && (
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
            {errors.emptyRows.length > 0 && (
                <div className="mt-4 text-yellow-700">
                    ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
                </div>
            )}
        </div>
    );
}



export default PMPD_ProductionPlan
