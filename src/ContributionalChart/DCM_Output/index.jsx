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
import { endOfDay, endOfMonth, format, isSameMonth, isValid, startOfDay, startOfMonth, subDays } from 'date-fns'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { AuthContext } from '../../Authentication/AuthContext'
import { AddTrnMonthlyConsumption_BULK, GetDCMOutput_ReportApi } from '../../controller/ContributionalChartApiService'
import { exportToExcelDownload } from '../../utilis/excelUtilis'
import { FaFileExcel } from "react-icons/fa";


const getRowClassName = (params) => {
    if (params.row.Description === 'TOTAL') return '!bg-[#d1dfdc]';
    // if (params.row.dept_name === 'GRAND TOTAL') return '!bg-[#d2f0a8] !font-semibold';
    // if (params.row.dept_name_o === 'OTHERS') return '!bg-[#fff7d6]';
    return '';
};

const CC_DCM_Output = () => {
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [openUploadModal, setOpenUploadModal] = useState(false);
    const [refreshData, setRefreshData] = useState(false)
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(false)
    const [excelLoading, setExcelLoading] = useState(false);

    const { user } = useContext(AuthContext);
    const currentUserPlantCode = user.PlantCode

    const handleSearch = () => {
        const text = searchText.trim().toLowerCase();

        if (!text) {
            setRows(originalRows);
        } else {
            const filteredRows = originalRows.filter((row) =>
                ['Plant', 'Description'].some((key) => {
                    const value = row[key];
                    return value && String(value).toLowerCase().includes(text);
                })
            );
            setRows(filteredRows);
        }
    };

    const validationschema = yup.object({
        plant: yup.string().required('Required'),
        date: yup.string().required('Required'),
    })

    const formik = useFormik({
        initialValues: {
            plant: currentUserPlantCode,
            date: "",
            type: "SUBMIT"
        },
        validationSchema: validationschema,
        enableReinitialize: true,
        onSubmit: async (values) => {

            try {
                console.log(values)
                const fin_Year = values.fin_year
                const plant = values.plant

                // Convert month-year input to real dates

                const selectedDate = new Date(values.date);
                const today = new Date();

                const startDate = startOfMonth(selectedDate);

                const endDate = isSameMonth(selectedDate, today)
                    ? subDays(today, 1)     // yesterday
                    : endOfMonth(selectedDate);

                console.log(startDate, endDate)

                if (values.type === "SUBMIT") {

                    if (loading) return

                    setLoading(true)
                    const response = await GetDCMOutput_ReportApi({
                        startDate, endDate, plant
                    })
                    console.log(response)
                    setOriginalRows(response[2] || [])
                    setRows(response[2] || [])
                } else {
                    handleExcelDownload({ startDate, endDate, plant })
                }

            } catch (error) {
                console.error(error)
            }

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
        { field: "SI_No", headerName: "SI No", width: 80 },
        { field: "Plant", headerName: "Plant", width: 150 },
        { field: "Description", headerName: "Description", flex: 1 },
        { field: "Metric", headerName: "Metric", flex: 1 },
        { field: "Flex_Plan", headerName: "Flex Plan", flex: 1 },
        { field: "Actual", headerName: "Actual", flex: 1 },
        {
            field: "GAP", headerName: "Gap", flex: 1,
            renderCell: (params) => {
                const isPositive = params.value >= 0;
                return (
                    <span
                        className={`px-3 py-1 font-semibold rounded-md
                         ${isPositive
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"}`}
                    >
                        {Number(params.value).toLocaleString()}
                    </span>
                );
            }
        },
    ];

    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarExport />
        </GridToolbarContainer>
    );


    const handleExcelDownload = async ({ startDate, endDate, plant }) => {
        try {
            if (excelLoading) return;

            setExcelLoading(true);

            const response = await GetDCMOutput_ReportApi({
                startDate,
                endDate,
                plant
            });

            await exportToExcelDownload({
                fileName: "DCM_Reports",
                sheets: [
                    { name: "Base Report", data: response[0] || [] },
                    { name: "Consumption", data: response[1] || [] },
                    { name: "DCM", data: response[2] || [] },
                ]
            });

        } catch (error) {
            console.error(error);
        } finally {
            setExcelLoading(false);
        }
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
            <div
                style={{
                    marginBottom: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <SectionHeading>
                    DCM Output
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

                    <TextField
                        id="date"
                        size="small"
                        label="Date"
                        name="date"
                        type='month'
                        value={formik.values.date}
                        onChange={formik.handleChange}
                        fullWidth
                        // sx={{ minWidth: 140 }}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.date && Boolean(formik.errors.date)}
                        helperText={formik.touched.date && formik.errors.date}
                    />

                    <Button variant='contained'
                        sx={{ minWidth: 120 }}
                        onClick={(e) => {
                            formik.setFieldValue('type', 'SUBMIT')
                            formik.handleSubmit(e)
                        }}>
                        {loading ? "Loading..." : "Submit"}
                    </Button>
                    <Button variant="contained" color='success'
                        sx={{ minWidth: 140 }}
                        onClick={(e) => {
                            formik.setFieldValue('type', 'DOWNLOAD')
                            formik.handleSubmit(e)
                        }}
                        startIcon={<FaFileExcel size={16} />}
                    >
                        {excelLoading ? "Loading..." : "downlaod"}
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
                        {/* <ExcelUploadModal open={openUploadModal}
                            onClose={() => {
                                setOpenUploadModal(false)
                            }}
                            onOpen={() => {
                                setOpenUploadModal(true)
                            }}
                            templateUrl={""}
                            setRefreshData={setRefreshData}
                        /> */}


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
                    getRowId={(row) => row.SI_No + row.Plant} // Specify a custom id field
                    disableSelectionOnClick
                    slots={{ toolbar: CustomToolbar }}
                    columnHeaderHeight={35}
                    rowHeight={35}
                    // getRowHeight={(p) => "auto"}
                    getRowClassName={(params) => `${getRowClassName(params)}`}
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


// const ExcelUploadModal = ({
//     open,
//     onClose,
//     onOpen,
//     setRefreshData
// }) => {
//     const [isUploading, setIsUploading] = useState(false)
//     const [uploadedFile, setUploadedFile] = useState(null)
//     const [loadingTemplate, setLoadingTemplate] = useState(false)
//     const [uploadResponse, setUploadResponse] = useState(null)

//     const handleFileChange = (event) => {
//         setUploadedFile(event.target.files[0]);
//     };

//     const handleClose = () => {
//         if (onClose) onClose()
//         setUploadedFile(null)
//         setUploadResponse(null)
//         // setIsUploading(false)
//         setRefreshData((prev) => !prev)
//     }

//     async function downloadProductionPlanTemplate() {
//         // 1️⃣ Fetch dropdown data
//         const [plant,
//             // prod_segments
//         ] = await Promise.all([
//             getPlantdetails(),
//             // getProductSegmentdetails(),
//         ]);

//         const plantCodes = plant.map((e) => e.Plant_Code);
//         // const prodSegNames = prod_segments.map((e) => e.seg_name);
//         // const planTypes = ["AOP", "MP"];

//         // 2️⃣ Create workbook & worksheet
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet("Actual Prod Plan");

//         const headers = [
//             "Plant",
//             "Part_Number",
//             "Cons_Qty",
//             "Cons_Date",
//             "Doc_Date",
//         ];

//         worksheet.addRow(headers);

//         // Header styling
//         worksheet.getRow(1).eachCell((cell) => {
//             cell.font = { bold: true };
//             cell.alignment = { horizontal: "center" };
//             cell.fill = {
//                 type: "pattern",
//                 pattern: "solid",
//                 fgColor: { argb: "FFADD8E6" },
//             };
//         });

//         // Column widths
//         worksheet.columns.forEach((col) => (col.width = 22));

//         // 4️⃣ APPLY DROPDOWNS (ROW 2 → 1000)

//         // Column A → plant
//         worksheet.dataValidations.add("A2:A1000", {
//             type: "list",
//             allowBlank: false,
//             formulae: [`"${plantCodes.join(",")}"`],
//         });

//         // 5️⃣ Date formatting
//         // worksheet.getColumn("E").numFmt = "yyyy-mm-dd";
//         // worksheet.getColumn("I").numFmt = "yyyy-mm-dd";

//         // 6️⃣ Cell styling (rows below header)
//         worksheet.eachRow((row, rowNumber) => {
//             if (rowNumber === 1) return;
//             row.eachCell((cell) => {
//                 cell.alignment = { horizontal: "center" };
//                 cell.font = { size: 10 };
//             });
//         });

//         // 7️⃣ Download file
//         const buffer = await workbook.xlsx.writeBuffer();
//         saveAs(
//             new Blob([buffer], {
//                 type:
//                     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//             }),
//             "Monthly_Consumption_Template.xlsx"
//         );
//     }


//     const handleUploadData = async () => {
//         if (!uploadedFile) {
//             return alert('Upload file not found')
//         }

//         if (isUploading) return
//         setIsUploading(true)
//         try {
//             const formData = new FormData()
//             const userId = localStorage.getItem('EmpId')
//             formData.append("userId", userId)
//             formData.append("file", uploadedFile)
//             const response = await AddTrnMonthlyConsumption_BULK(formData)
//             console.log(response.data, "Upload excel response")
//             setUploadResponse(response.data)
//             alert('File uploaded successfully')
//             handleClose()
//         } catch (error) {
//             console.error("Upload error:", error);

//             // ✅ VALIDATION ERROR FROM BACKEND
//             if (error.response?.status === 422) {
//                 setUploadResponse(error.response.data); // <-- show errors in UI
//             }
//             // ❌ OTHER SERVER ERRORS
//             else {
//                 alert(
//                     error.response?.data?.message ||
//                     error.message ||
//                     "Something went wrong! Try again later."
//                 );
//             }

//         }
//         setIsUploading(false)
//     }

//     return (
//         <>
//             <IconButton
//                 component="span"
//                 onClick={() => {
//                     if (onOpen) onOpen()
//                 }}
//                 style={{
//                     borderRadius: "50%",
//                     backgroundColor: "#FF6699",
//                     color: "white",
//                     width: "40px",
//                     height: "40px",
//                 }}
//             >
//                 <CloudUploadIcon />
//             </IconButton>

//             <Modal open={open} onClose={() => { }}>
//                 <Box
//                     sx={{
//                         position: "absolute",
//                         top: "50%",
//                         left: "50%",
//                         transform: "translate(-50%, -50%)",
//                         textAlign: "center",
//                         width: uploadResponse ? "50%" : "30%",
//                         bgcolor: "background.paper",
//                         borderRadius: 2,
//                         boxShadow: 24,
//                         p: 4,

//                         maxHeight: "80vh",
//                         overflowY: "auto",

//                         outline: "none"
//                     }}
//                 >
//                     {/* Title */}
//                     <Typography
//                         variant="h6"
//                         sx={{
//                             mb: 2,
//                             color: "#2e59d9",
//                             textDecoration: "underline",
//                             textDecorationColor: "#88c57a",
//                             textDecorationThickness: "3px",
//                         }}
//                     >
//                         Upload Excel File
//                     </Typography>

//                     {/* Download Template */}
//                     <Button
//                         variant="contained"
//                         sx={{
//                             mb: 2,
//                             bgcolor: deepPurple[500],
//                             "&:hover": { bgcolor: deepPurple[700] },
//                         }}
//                         onClick={downloadProductionPlanTemplate}
//                     // onClick={createStyledDropdownExcel}
//                     >
//                         <FaDownload /> &nbsp; {loadingTemplate ? "Loading..." : "Download Template"}
//                     </Button>

//                     {/* Hidden File Input */}
//                     <input
//                         type="file"
//                         accept=".xlsx,.xls"
//                         id="excel-upload"
//                         hidden
//                         onChange={handleFileChange}
//                     />

//                     {/* Custom File Upload UI */}
//                     <label htmlFor="excel-upload">
//                         <Box
//                             sx={{
//                                 border: "2px dashed #1976d2",
//                                 borderRadius: "8px",
//                                 p: 2,
//                                 cursor: "pointer",
//                                 mb: 1,
//                                 "&:hover": {
//                                     backgroundColor: "#f4f6fb",
//                                 },
//                                 display: "flex",
//                                 justifyContent: "center",
//                                 alignItems: "center",
//                                 gap: 1
//                             }}
//                         >
//                             <FaUpload />
//                             <Typography variant="body2" >
//                                 {uploadedFile?.name || "Click to choose Excel file"}
//                             </Typography>
//                         </Box>
//                     </label>

//                     {/* Action Buttons */}
//                     <Box
//                         sx={{
//                             display: "flex",
//                             justifyContent: "center",
//                             gap: 2,
//                             my: 3,
//                         }}
//                     >
//                         <Button
//                             variant="contained"
//                             color="error"
//                             onClick={handleClose}
//                             sx={{ width: "30%" }}
//                         >
//                             Close
//                         </Button>

//                         <Button
//                             variant="contained"
//                             onClick={handleUploadData}
//                             disabled={isUploading}
//                         // sx={{ width: "30%" }}
//                         >
//                             {isUploading ? "Uploading..." : "Upload"}
//                         </Button>
//                     </Box>

//                     {/* Upload Status */}
//                     {uploadResponse && <ValidationResult response={uploadResponse} />}


//                 </Box>
//             </Modal>
//         </>
//     );
// };


// const ValidationResult = ({ response }) => {
//     const { summary, errors } = response;

//     return (
//         <div className="p-4 bg-red-50 rounded-lg border border-red-300">
//             <h2 className="text-lg font-semibold text-red-700 mb-2">
//                 ❌ Upload Failed – Validation Errors
//             </h2>

//             {/* Summary */}
//             <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
//                 <div>Total Rows: <b>{summary.totalRows}</b></div>
//                 <div className="text-green-600">Valid: <b>{summary.valid}</b></div>
//                 <div className="text-red-600">Invalid: <b>{summary.invalid}</b></div>
//                 <div className="text-yellow-600">Empty: <b>{summary.empty}</b></div>
//             </div>

//             {/* Invalid rows */}
//             {errors.invalidRows.length > 0 && (
//                 <>
//                     <h3 className="font-semibold mb-2">❌ Invalid Rows</h3>

//                     <table className="w-full border text-sm">
//                         <thead className="bg-red-100">
//                             <tr>
//                                 <th className="border px-2 py-1">Excel Row</th>
//                                 <th className="border px-2 py-1">Errors</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {errors.invalidRows.map((row, i) => (
//                                 <tr key={i} className="hover:bg-red-50">
//                                     <td className="border px-2 py-1 text-center">
//                                         {row.row}
//                                     </td>
//                                     <td className="border px-2 py-1">
//                                         <ul className="list-disc pl-4">
//                                             {row.errors.map((err, idx) => (
//                                                 <li key={idx}>{err}</li>
//                                             ))}
//                                         </ul>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </>
//             )}

//             {/* Empty rows */}
//             {errors.emptyRows.length > 0 && (
//                 <div className="mt-4 text-yellow-700">
//                     ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
//                 </div>
//             )}
//         </div>
//     );
// }

export default CC_DCM_Output
