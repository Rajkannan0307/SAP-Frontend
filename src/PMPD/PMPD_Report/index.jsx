import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { useFormik } from 'formik'
import { Button, MenuItem, TextField } from '@mui/material'
import { getPlantdetails } from '../../controller/CommonApiService'
import * as yup from 'yup'
import { getPMPD_Reports } from '../../controller/PMPDpiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import * as XLSX from 'xlsx-js-style'
import { FaFileExcel } from "react-icons/fa";
import { startOfDay, endOfDay } from 'date-fns'
import { AuthContext } from '../../Authentication/AuthContext'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'

const FY_MONTHS = [
    { field: "Apr", headerName: "Apr" },
    { field: "May", headerName: "May" },
    { field: "Jun", headerName: "Jun" },
    { field: "Jul", headerName: "Jul" },
    { field: "Aug", headerName: "Aug" },
    { field: "Sep", headerName: "Sep" },
    { field: "Oct", headerName: "Oct" },
    { field: "Nov", headerName: "Nov" },
    { field: "Dec", headerName: "Dec" },
    { field: "Jan", headerName: "Jan" },
    { field: "Feb", headerName: "Feb" },
    { field: "Mar", headerName: "Mar" },
];


const PMPD_Report = () => {
    const [resultData, setResultData] = useState([])
    const [resultDataSheet3, setResultDataSheet3] = useState([])
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(false)
    const [excelLoading, setExcelLoading] = useState(false)
    const { user } = useContext(AuthContext);
    const currentUserPlantCode = user.PlantCode

    const PMPDAccess = getPMPDAccess()

    const validationschema = yup.object({
        plant: yup.string().required('Required'),
        fin_year: yup.string().required('Required'),
    })

    const formik = useFormik({
        initialValues: {
            plant: currentUserPlantCode,
            fin_year: "",
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

            const startDate = startOfDay(new Date(startYear, 3, 1));  // 01-Apr-2025
            const endDate = endOfDay(new Date(endYear, 2, 31));    // 31-Mar-2026
            console.log(startDate, endDate)


            if (values.type === 'SUBMIT') {
                if (loading) return

                setLoading(true)
                const response = await getPMPD_Reports(startDate, endDate, plant)
                setResultData(response[1])
                console.log(response[2][0])
                setResultDataSheet3(response[2][0])

            } else {
                if (excelLoading) return

                setExcelLoading(true)
                await handleDownloadExcelData(startDate, endDate, plant)
            }

            setLoading(false)
            setExcelLoading(false)
        }
    })

    useEffect(() => {
        const fetchData = async () => {
            const resposne = await getPlantdetails()
            setPlants(resposne)
        }
        fetchData()
    }, [])


    const generateDynamicCat = (cat) => {
        switch (cat) {
            case "ABSENT":
                return `${cat} ${resultDataSheet3.absent}%`
            case 'NEW JOINEE EFFICIENCY':
                return `NEW JOINEE EFF ${resultDataSheet3.new_joinee_effeciency}%`
            default:
                return cat
        }
    }

    const columns = [
        {
            field: "slno",
            headerName: "SI No",
            width: 80,
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        { field: "plant", headerName: "Plant", width: 90 },
        {
            field: "category", headerName: "Category", width: 160,
            renderCell: (params) => generateDynamicCat(params.value)
        },

        ...FY_MONTHS.map((m) => ({
            field: m.field,
            headerName: m.headerName,
            flex: 1,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const value = Number(params.value) || 0;

                if (params.row?.category === "TARGET COST") {
                    return `${value.toFixed(2)} L`;
                }

                return value;
            }
        })),
    ];


    const handleDownloadExcelData = async (startDate, endDate, plant) => {
        try {
            const response = await getPMPD_Reports(startDate, endDate, plant);
            console.log("Data from API:", response);

            if (!response || response.length < 2) {
                alert("No data available to download.");
                return;
            }

            const summaryData = response[0]; // Sheet 1
            const detailData = response[1];  // Sheet 2

            const fileType =
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
            const fileExtension = ".xlsx";
            const fileName = "PMPD_Report";

            /* -------------------- Sheet 1 : Summary -------------------- */
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);

            if (summaryData.length > 0) {
                const headers = Object.keys(summaryData[0]);
                headers.forEach((_, colIdx) => {
                    const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
                    if (wsSummary[cellAddress]) {
                        wsSummary[cellAddress].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "E7F3FF" } },
                            alignment: { horizontal: "center" },
                        };
                    }
                });
            }

            /* -------------------- Sheet 2 : Data -------------------- */
            const wsData = XLSX.utils.json_to_sheet(detailData);

            if (detailData.length > 0) {
                const headers = Object.keys(detailData[0]);
                headers.forEach((_, colIdx) => {
                    const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
                    if (wsData[cellAddress]) {
                        wsData[cellAddress].s = {
                            font: { bold: true },
                            fill: { fgColor: { rgb: "FFF4CC" } },
                            alignment: { horizontal: "center" },
                        };
                    }
                });
            }

            /* -------------------- Workbook -------------------- */
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, wsSummary, "Data");
            XLSX.utils.book_append_sheet(wb, wsData, "Summary");

            const excelBuffer = XLSX.write(wb, {
                bookType: "xlsx",
                type: "array",
            });

            const blob = new Blob([excelBuffer], { type: fileType });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName + fileExtension;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            alert("Excel downloaded successfully!");
        } catch (error) {
            console.error("Download failed:", error);

            if (error.response) {
                alert(error.response.data.message || "Backend error");
            } else if (error.request) {
                alert("No response from server");
            } else {
                alert(error.message);
            }
        }
    };


    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarExport />
        </GridToolbarContainer>
    );

    const getRowClassName = (params) => {
        if (params.row.category === 'TOTAL') return '!bg-[#d1dfdc]';
        if (params.row.category === 'HC PLAN') return '!bg-[#d2f0a8] !font-semibold';
        return '';
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
                    PMPD HC PLAN
                </SectionHeading>
            </div>

            <div className='flex justify-start items-start gap-3'>
                <TextField
                    select
                    size="small"
                    label="Plant"
                    name="plant"
                    value={formik.values.plant}
                    onChange={formik.handleChange}
                    sx={{ minWidth: 240 }}
                    disabled={PMPDAccess.disableAction}
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
                </TextField>

                <Button variant='contained' onClick={(e) => {
                    formik.setFieldValue('type', 'SUBMIT')
                    formik.handleSubmit(e)
                }}>
                    {loading ? "Loading..." : "Submit"}
                </Button>
                <Button
                    variant="contained"
                    startIcon={<FaFileExcel size={16} />}
                    sx={{ textTransform: "none", background: "green" }}
                    onClick={(e) => {
                        formik.setFieldValue("type", "DOWNLOAD");
                        formik.handleSubmit(e);
                    }}
                >
                    {excelLoading ? "Loading..." : "Download"}
                </Button>
            </div>


            {/* DataGrid */}
            <div
                style={{
                    flexGrow: 1, // Ensures it grows to fill the remaining space
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    height: "calc(5 * 48px)",
                    marginTop: 10
                }}
            >
                <DataGrid
                    rows={resultData}
                    columns={columns}
                    pageSize={5} // Set the number of rows per page to 8
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => `${row.plant + row.category}`} // Specify a custom id field
                    disableSelectionOnClick
                    rowHeight={40}
                    columnHeaderHeight={45}
                    getRowClassName={getRowClassName}
                    slots={{ toolbar: CustomToolbar }}
                    sx={{
                        // Header Style
                        "& .MuiDataGrid-columnHeader": {
                            // backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
                            backgroundColor: '#6eddf0', //'#696969', 	'#708090',  //"#2e59d9",
                            color: "black",
                            fontWeight: "bold",
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                            fontSize: "12px",
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

export default PMPD_Report
