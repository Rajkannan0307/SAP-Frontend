import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { Box, Button, IconButton, MenuItem, Modal, TextField, Typography } from '@mui/material'
import { CloudUploadIcon, EditIcon, SearchIcon } from 'lucide-react'
import { PiUploadDuotone } from 'react-icons/pi'
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { deepPurple } from '@mui/material/colors';
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getPlantdetails } from '../../controller/CommonApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import { endOfDay, endOfMonth, format, isValid, startOfDay, startOfMonth } from 'date-fns'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { AuthContext } from '../../Authentication/AuthContext'
import { AddTrnIndirectMaterialPrice_BULK, getTrnIndirectMaterialPrice } from '../../controller/ContributionalChartApiService'
import { getMaterialType } from '../../controller/Masterapiservice'
import { MaterialGroupEnumTypes } from '../../common/enumValues'

const CC_IndirectMaterialPrice = () => {
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [openUploadModal, setOpenUploadModal] = useState(false);
    const [refreshData, setRefreshData] = useState(false)
    const { user } = useContext(AuthContext);
    const currentUserPlantCode = user.PlantCode

    const handleSearch = () => {
        const text = searchText.trim().toLowerCase();

        if (!text) {
            setRows(originalRows);
        } else {
            const filteredRows = originalRows.filter((row) =>
                ['plant', 'part_no', 'eff_date'].some((key) => {
                    const value = row[key];
                    return value && String(value).toLowerCase().includes(text);
                })
            );
            setRows(filteredRows);
        }
    };

    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(false)

    const validationschema = yup.object({
        plant: yup.string().required('Required'),
        // fin_year: yup.string().required('Required'),
        startDate: yup.string().required('Required'),
        endDate: yup.string().required('Required'),
    })

    const formik = useFormik({
        initialValues: {
            plant: currentUserPlantCode,
            // fin_year: "",
            startDate: "",
            endDate: "",
            type: "SUBMIT"
        },
        validationSchema: validationschema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log(values)
            const fin_Year = values.fin_year
            const plant = values.plant
            // const startYear = Number(fin_Year.split("-")[0]); // 2025
            // const endYear = startYear + 1;                   // 2026

            // const startDate = startOfDay(new Date(startYear, 3, 1));  // 01-Apr-2025
            // const endDate = endOfDay(new Date(endYear, 2, 31));    // 31-Mar-2026
            // console.log(startDate, endDate);

            // Convert month-year input to real dates
            const startDate = startOfMonth(new Date(values.startDate));
            const endDate = endOfMonth(new Date(values.endDate));

            console.log(startDate, endDate)

            if (loading) return

            setLoading(true)
            const response = await getTrnIndirectMaterialPrice({
                startDate, endDate, plant
            })
            setOriginalRows(response || [])
            setRows(response || [])

            setLoading(false)
        }
    })

    useEffect(() => {
        const fetchData = async () => {
            const resposne = await getPlantdetails()
            setPlants(resposne)
        }
        fetchData()
    }, [])

    const columns = [
        { field: "idm_price_id", headerName: "SI No", width: 80 },
        { field: "plant", headerName: "Plant", width: 150 },
        { field: "part_no", headerName: "Part No", flex: 1 },
        { field: "price", headerName: "Price", flex: 1 },
        { field: "eff_date", headerName: "Eff Date", flex: 1, renderCell: (params) => (<>{params.value ? format(params.value, "dd-MM-yyyy") : ""}</>) },
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
                    Indirect Material Consumption
                </SectionHeading>
            </div>

            <div className='flex justify-between items-center mb-3 gap-5'>
                <div className='flex justify-start items-start gap-3'>
                    <TextField
                        select
                        size="small"
                        label="Plant"
                        name="plant"
                        value={formik.values.plant}
                        onChange={formik.handleChange}
                        fullWidth
                        // sx={{ minWidth: 140 }}
                        InputLabelProps={{
                            sx: {
                                fontSize: "12px",
                            },
                        }}
                        InputProps={{
                            sx: {
                                fontSize: "13px",
                            },
                        }}
                        error={formik.touched.plant && Boolean(formik.errors.plant)}
                        helperText={formik.touched.plant && formik.errors.plant}
                    >
                        {plants.map((p) => (
                            <MenuItem sx={{ fontSize: "small" }} key={p.Plant_ID} value={p.Plant_Code}>
                                {`${p.Plant_Code} - ${p.Plant_Name}`}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* <TextField
                        id="fin_year"
                        select
                        size="small"
                        label="Financial Year"
                        name="fin_year"
                        value={formik.values.fin_year}
                        onChange={formik.handleChange}
                        sx={{ minWidth: 240 }}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.fin_year && Boolean(formik.errors.fin_year)}
                        helperText={formik.touched.fin_year && formik.errors.fin_year}
                    >
                        {["2025-26", "2026-27"].map((fy) => (
                            <MenuItem key={fy} value={fy} sx={{ fontSize: 13 }}>
                                {fy}
                            </MenuItem>
                        ))}
                    </TextField> */}



                    <TextField
                        id="startDate"
                        size="small"
                        label="Start Date"
                        name="startDate"
                        type='month'
                        fullWidth
                        value={formik.values.startDate}
                        onChange={formik.handleChange}
                        // sx={{ minWidth: 140 }}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                        helperText={formik.touched.startDate && formik.errors.startDate}
                    />
                    <TextField
                        id="endDate"
                        size="small"
                        label="End Date"
                        name="endDate"
                        type='month'
                        value={formik.values.endDate}
                        onChange={formik.handleChange}
                        fullWidth
                        // sx={{ minWidth: 140 }}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                        helperText={formik.touched.endDate && formik.errors.endDate}
                    />

                    <Button variant='contained' onClick={(e) => {
                        formik.setFieldValue('type', 'SUBMIT')
                        formik.handleSubmit(e)
                    }}>
                        {loading ? "Loading..." : "Submit"}
                    </Button>
                </div>

                {/* Search and Icons Section */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 20
                    }}
                >
                    {/* Search Box - requester */}
                    <div style={{ display: "flex", gap: 10 }}>
                        <TextField
                            size="small"
                            variant="outlined"
                            placeholder="Type here..."
                            value={searchText}
                            fullWidth
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyUp={handleSearch}
                        // style={{ minWidth: 300 }}
                        />
                        <Button
                            onClick={handleSearch}
                            style={{
                                borderRadius: "25px",
                                border: "2px solid skyblue",
                                color: "skyblue",
                                fontWeight: "bold",
                                textTransform: "none",
                            }}
                        >
                            <SearchIcon style={{ marginRight: "5px" }} />
                            Search
                        </Button>
                    </div>
                    <div style={{ display: "flex" }}>
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
                    pageSize={5} // Set the number of rows per page to 8
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => row.idm_price_id} // Specify a custom id field
                    disableSelectionOnClick
                    slots={{ toolbar: CustomToolbar }}
                    columnHeaderHeight={35}
                    rowHeight={35}
                    // getRowHeight={(p) => "auto"}
                    sx={{
                        // Header Style
                        "& .MuiDataGrid-columnHeader": {
                            backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
                            color: "black",
                            fontWeight: "bold",
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                            fontSize: "13px",
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
                            fontSize: "12px",
                        },
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
        const [plant, matTypeList] = await Promise.all([
            getPlantdetails(),
            getMaterialType(MaterialGroupEnumTypes.all)
        ]);

        const plantCodes = plant.map((e) => e.Plant_Code);

        const matTypes = matTypeList.data.map((e) => e.Mat_Type);

        // 2️⃣ Create workbook & worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Indirect Material price");

        const headers = [
            "Plant",
            "Material_Type",
            "Part_Number",
            "Price",
            "Eff_Date_(dd-MM-YYYY)",
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

        worksheet.dataValidations.add("B2:B1000", {
            type: "list",
            allowBlank: false,
            formulae: [`"${matTypes.join(",")}"`],
        });

        // 5️⃣ Date formatting
        // worksheet.getColumn("E").numFmt = "yyyy-mm-dd";
        // worksheet.getColumn("I").numFmt = "yyyy-mm-dd";

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
            "Indirect_Material_price_Template.xlsx"
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
            const response = await AddTrnIndirectMaterialPrice_BULK(formData)
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
            <IconButton
                component="span"
                onClick={() => {
                    if (onOpen) onOpen()
                }}
                style={{
                    borderRadius: "50%",
                    backgroundColor: "#FF6699",
                    color: "white",
                    width: "40px",
                    height: "40px",
                }}
            >
                <CloudUploadIcon />
            </IconButton>

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

export default CC_IndirectMaterialPrice
