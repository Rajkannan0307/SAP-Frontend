import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { useFormik } from 'formik'
import { Box, Button, Collapse, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import { getPlantdetails } from '../../controller/CommonApiService'
import * as yup from 'yup'
import { GetPMPD_PlanVsActual } from '../../controller/PMPDApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import * as XLSX from 'xlsx-js-style'
import { FaFileExcel } from "react-icons/fa";
import { startOfDay, endOfDay, format } from 'date-fns'
import { AuthContext } from '../../Authentication/AuthContext'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'
import { startOfMonth, endOfMonth, parse } from "date-fns";


const getRowClassName = (params) => {
    if (params.row.category === 'TOTAL') return '!bg-[#d1dfdc]';
    if (params.row.category === 'GRAND TOTAL') return '!bg-[#d2f0a8] !font-semibold';
    if (params.row.category === 'OTHERS') return '!bg-[#fff7d6]';
    return '';
};


const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
    </GridToolbarContainer>
);


const PMDP_PlanVsActual = () => {
    const [resultData, setResultData] = useState([])
    const [segmentResultData, setSegmentResultData] = useState([])
    const [resultDataSheet3, setResultDataSheet3] = useState([])
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(false)
    const [excelLoading, setExcelLoading] = useState(false)
    const { user } = useContext(AuthContext);
    const currentUserPlantCode = user.PlantCode

    const PMPDAccess = getPMPDAccess()

    const [tableView, setTableView] = useState("category");
    const [expandedRowIndex, setExpandedRowIndex] = useState(null);


    const handleTableView = (view) => {
        setTableView(view)
        if (view === 'category') {
            setResultData([])
        } else {
            setSegmentResultData([])
        }
    }

    const handleToggle = (index) => {
        setExpandedRowIndex((prev) => (prev === index ? null : index));
    };


    const validationschema = yup.object({
        plant: yup.string().required('Required'),
        current_month: yup.string().required('Required'),
    })
    const formik = useFormik({
        initialValues: {
            plant: currentUserPlantCode,
            current_month: "",
            type: "SUBMIT",
            // reportType: tableView
        },
        validationSchema: validationschema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log(values)
            const current_month = values.current_month
            const plant = values.plant

            // Parse month string into a Date object
            const monthDate = parse(current_month, "yyyy-MM", new Date());

            // Get month boundaries
            const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
            const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

            const payloadBody = {
                startDate,
                endDate,
                plant,
            }


            if (values.type === 'SUBMIT') {
                if (loading) return

                setLoading(true)
                const response = await GetPMPD_PlanVsActual(payloadBody)

                setResultData(response.data[3])

            } else {
                if (excelLoading) return

                setExcelLoading(true)
                await handleDownloadExcelData(payloadBody)
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


    const columns = [
        {
            field: "slno",
            headerName: "SI No",
            width: 80,
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        { field: "plant", headerName: "Plant", width: 90 },
        { field: "seg_name", headerName: "Segment", width: 90 },
        // {
        //     field: "category", headerName: "Category", width: 260,
        //     renderCell: (params) => generateDynamicCat(params.value)
        // },
        { field: "AOP", headerName: "AOP", flex: 1 },
        { field: "MP", headerName: "MP", flex: 1 },
        { field: "FLEX_PLAN", headerName: "FLEX PLAN", flex: 1 },
        {
            field: "FLEX_ACTUAL", headerName: "FLEX ACTUAL", flex: 1,
            renderCell: (params) => params.value
        },
        {
            field: "GAP", headerName: "GAP", flex: 1,
            renderCell: (params) => <span className={`
                ${Number(params?.value || 0) < 0 ? "text-green-600" : "text-red-600"}`}>{params.value}</span>
        },
    ];

    const handleDownloadExcelData = async (payload) => {
        try {
            const { data } = await GetPMPD_PlanVsActual(payload);

            if (!data || data.length < 2) {
                return alert("No data available to download.");
            }

            // 1. Reusable helper to generate a sheet and style its headers
            const createSheet = (sheetData, bgColor = "E7F3FF") => {
                if (!sheetData) return XLSX.utils.json_to_sheet([]);
                const ws = XLSX.utils.json_to_sheet(sheetData);

                if (sheetData.length > 0) {
                    Object.keys(sheetData[0]).forEach((_, colIdx) => {
                        const cell = ws[XLSX.utils.encode_cell({ c: colIdx, r: 0 })];
                        if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: "center" } };
                    });
                }
                return ws;
            };

            // 2. Destructure the specific arrays from the response
            const planData = data[0];
            const actualData = data[1];
            const manPowerActuals = data[2];
            const summaryData = data[4];
            const summarySplitData = data[5];

            // 3. Create Workbook and append styled sheets
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, createSheet(planData, "E7F3FF"), "Plan");
            XLSX.utils.book_append_sheet(wb, createSheet(actualData, "E7F3FF"), "Actual");
            XLSX.utils.book_append_sheet(wb, createSheet(manPowerActuals, "E7F3FF"), "ManpowerActuals"); // Fixed: Now correctly converted to a sheet
            XLSX.utils.book_append_sheet(wb, createSheet(summaryData, "FFF4CC"), "Summary");
            XLSX.utils.book_append_sheet(wb, createSheet(summarySplitData, "FFF4CC"), "Summary_Split");

            // 4. Generate & Download
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });

            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = "PMPD_PlanVsActual.xlsx";
            link.click();
            window.URL.revokeObjectURL(link.href);

            alert("Excel downloaded successfully!");

        } catch (error) {
            console.error("Download failed:", error);
            alert(error?.response?.data?.message || (error?.request ? "No response from server" : error.message));
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
                    Flex Plan Vs Actual Head Count - ( DIRECT )
                </SectionHeading>
            </div>

            <div className='flex justify-between items-center'>
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
                        id="current_month"
                        size="small"
                        label="Financial Year"
                        name="current_month"
                        type="month"
                        value={formik.values.current_month}
                        onChange={formik.handleChange}
                        sx={{ minWidth: 240 }}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.current_month && Boolean(formik.errors.current_month)}
                        helperText={formik.touched.current_month && formik.errors.current_month}
                    />


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

            </div>

            {/* CATEGORY TABLE VIEW */}
            <div
                style={{
                    flexGrow: 1, // Ensures it grows to fill the remaining space
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    // height: "calc(5 * 48px)",
                    marginTop: 10,
                    // display: tableView === "category" ? "block" : "none"
                }}
            >
                <DataGrid
                    rows={resultData}
                    columns={columns}
                    pageSize={5} // Set the number of rows per page to 8
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => `${row.plant + row.category + row?.seg_name}`} // Specify a custom id field
                    disableSelectionOnClick
                    rowHeight={35}
                    columnHeaderHeight={45}
                    getRowClassName={(params) => `${getRowClassName(params)}`}
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

export default PMDP_PlanVsActual
