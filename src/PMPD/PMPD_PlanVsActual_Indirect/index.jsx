import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { useFormik } from 'formik'
import { Box, Button, MenuItem, TextField } from '@mui/material'
import { getPlantdetails } from '../../controller/CommonApiService'
import * as yup from 'yup'
import { GetPMPD_PlanVsActual_InDirect } from '../../controller/PMPDApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import * as XLSX from 'xlsx-js-style'
import { FaFileExcel } from "react-icons/fa";
import { startOfDay, endOfDay, format } from 'date-fns'
import { AuthContext } from '../../Authentication/AuthContext'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'


const getRowClassName = (params) => {
    if (params.row.category === 'TOTAL') return '!bg-[#d1dfdc]';
    if (params.row.category === 'GRAND TOTAL') return '!bg-[#d2f0a8] !font-semibold';
    if (params.row.category === 'OTHERS') return '!bg-[#fff7d6]';
    return '';
};


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


const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
    </GridToolbarContainer>
);


const PMDP_PlanVsActual_Indirect = () => {
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
        fin_year: yup.string().required('Required'),
    })
    const formik = useFormik({
        initialValues: {
            plant: currentUserPlantCode,
            fin_year: "",
            type: "SUBMIT",
            // reportType: tableView
        },
        validationSchema: validationschema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const fin_Year = values.fin_year
                const plant = values.plant
                const startYear = Number(fin_Year.split("-")[0]); // 2025
                const endYear = startYear + 1;                   // 2026

                const startDateObj = startOfDay(new Date(startYear, 3, 1)); // 01-Apr-2025
                const endDateObj = endOfDay(new Date(endYear, 2, 31));    // 31-Mar-2026

                // ✅ SQL-safe format
                const startDate = format(startDateObj, "yyyy-MM-dd");
                const endDate = format(endDateObj, "yyyy-MM-dd");
                console.log(startDate, endDate)

                const payloadBody = {
                    startDate,
                    endDate,
                    plant,
                }


                if (values.type === 'SUBMIT') {
                    if (loading) return

                    setLoading(true)
                    const response = await GetPMPD_PlanVsActual_InDirect(payloadBody)

                    setResultData(response.data[1])

                } else {
                    if (excelLoading) return

                    setExcelLoading(true)
                    await handleDownloadExcelData(payloadBody)
                }


            } catch (error) {
                console.log(error)
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
        { field: "dept_name", headerName: "Department", width: 120 },
        { field: "plan_hc", headerName: "Plan HC No", width: 90 },
        ...FY_MONTHS.map((m) => ({
            field: m.field,
            headerName: m.headerName,
            flex: 1,
            align: "center",
            headerAlign: "center",
            // headerClassName: '!bg-green-400 !font-semibold',
            // headerClassName: '!bg-teal-300 !font-semibold',
            headerClassName: '!bg-[#CBEEF5] !font-semibold',
            cellClassName: (params) =>
                Number(params.value) > Number(params.row.plan_hc)
                    ? '!text-red-600 font-semibold'
                    : '',
            renderCell: (params) => {
                const value = Number(params.value) || 0;

                // if (params.row?.category === "TARGET COST") {
                //     return `${value.toFixed(2)} L`;
                // }

                return value;
            }
        })),
    ];


    const handleDownloadExcelData = async (payload) => {
        try {
            const response = await GetPMPD_PlanVsActual_InDirect(payload);
            console.log("Data from API:", response.data);

            if (!response.data || response.data.length < 2) {
                alert("No data available to download.");
                return;
            }

            const summaryData = response.data[0]; // Sheet 1
            const detailData = response.data[1];  // Sheet 3

            const fileType =
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
            const fileExtension = ".xlsx";
            const fileName = "PMPD_PlanVsActual";

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


            /* -------------------- Sheet 3 : Data -------------------- */
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
                    Flex Plan Vs Actual Head Count - ( INDIRECT )
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
                    getRowId={(row) => `${row.dept_id}`} // Specify a custom id field
                    disableSelectionOnClick
                    rowHeight={35}
                    columnHeaderHeight={45}
                    getRowClassName={(params) => `${getRowClassName(params)}`}
                    slots={{ toolbar: CustomToolbar }}
                    sx={{
                        // Header Style
                        "& .MuiDataGrid-columnHeader": {
                            // backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
                            // backgroundColor: '#6eddf0', //'#696969', 	'#708090',  //"#2e59d9",
                            backgroundColor: '#9CDFEC', //'#696969', 	'#708090',  //"#2e59d9",
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

export default PMDP_PlanVsActual_Indirect
