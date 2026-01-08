import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { useFormik } from 'formik'
import { Box, Button, Collapse, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import { getPlantdetails } from '../../controller/CommonApiService'
import * as yup from 'yup'
import { getPMPD_Reports } from '../../controller/PMPDApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import * as XLSX from 'xlsx-js-style'
import { FaFileExcel } from "react-icons/fa";
import { startOfDay, endOfDay } from 'date-fns'
import { AuthContext } from '../../Authentication/AuthContext'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'
import { IoIosArrowDown } from "react-icons/io";


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

const headerStyle = {
    backgroundColor: "#6eddf0",
    color: "black",
    fontWeight: "bold",
    fontSize: "12px",
    border: "1px solid #ddd"
};

const cellStyle = {
    fontSize: "12px",
    color: "#333",
    border: "1px solid #ddd"
};


const getRowClassName = (params) => {
    if (params.row.category === 'TOTAL') return '!bg-[#d1dfdc]';
    if (params.row.category === 'HC PLAN') return '!bg-[#d2f0a8] !font-semibold';
    return '';
};


const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
    </GridToolbarContainer>
);


const PMPD_Report = () => {
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
        planType: yup.string().required('Required'),
    })
    const formik = useFormik({
        initialValues: {
            plant: currentUserPlantCode,
            fin_year: "",
            planType: "AOP",
            type: "SUBMIT",
            reportType: tableView
        },
        validationSchema: validationschema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log(values)
            const fin_Year = values.fin_year
            const plant = values.plant
            const planType = values.planType
            const startYear = Number(fin_Year.split("-")[0]); // 2025
            const endYear = startYear + 1;                   // 2026

            const startDate = startOfDay(new Date(startYear, 3, 1));  // 01-Apr-2025
            const endDate = endOfDay(new Date(endYear, 2, 31));    // 31-Mar-2026
            console.log(startDate, endDate)

            const payloadBody = {
                startDate,
                endDate,
                plant,
                planType,
                reportType: tableView,
            }

            const payloadSegmentBody = {
                startDate,
                endDate,
                plant,
                reportType: tableView,
                planType,
                prod_seg_id: null
            }


            const finalPayload = tableView === 'category' ? payloadBody : payloadSegmentBody

            if (values.type === 'SUBMIT') {
                if (loading) return

                setLoading(true)
                const response = await getPMPD_Reports(finalPayload)

                if (tableView === 'category') {
                    setResultData(response[1])
                    console.log(response[2][0])
                    setResultDataSheet3(response[2][0])
                } else {
                    setSegmentResultData(response[1])
                }

            } else {
                if (excelLoading) return

                setExcelLoading(true)
                await handleDownloadExcelData(finalPayload)
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
            case 'HC PLAN':
                return 'HC PLAN'
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

    const segmentColumns = [
        {
            field: "slno",
            headerName: "SI No",
            width: 80,
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
        },
        { field: "plant", headerName: "Plant", width: 90 },
        {
            field: "category", headerName: "Line", width: 160,
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


    const handleDownloadExcelData = async (payload) => {
        try {
            const response = await getPMPD_Reports(payload);
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

                    <TextField
                        id="planType"
                        select
                        size="small"
                        label="Plan Type"
                        name="planType"
                        value={formik.values.planType}
                        onChange={formik.handleChange}
                        sx={{ minWidth: 100 }}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.planType && Boolean(formik.errors.planType)}
                        helperText={formik.touched.planType && formik.errors.planType}
                    >
                        {["AOP", "MP"].map((val) => (
                            <MenuItem key={val} value={val} sx={{ fontSize: 13 }}>
                                {val}
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

                <div className="inline-flex rounded-full bg-gray-100 p-1 border">
                    {["category", "segment"].map((item) => (
                        <button
                            key={item}
                            onClick={() => handleTableView(item)}
                            className={`px-5 py-1.5 text-sm rounded-full transition cursor-pointer
                              ${tableView === item
                                    ? "bg-blue-600 text-white shadow"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {item === "category" ? "Category" : "Segment"}
                        </button>
                    ))}
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
                    display: tableView === "category" ? "block" : "none"
                }}
            >
                <DataGrid
                    rows={resultData}
                    columns={columns}
                    pageSize={5} // Set the number of rows per page to 8
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => `${row.plant + row.category}`} // Specify a custom id field
                    disableSelectionOnClick
                    rowHeight={25}
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
                            fontSize: "10px",
                        },
                    }}
                />
            </div>




            {/* SEGMENT TABLE VIEW */}
            {
                tableView === "segment" && (
                    <div
                        style={{
                            flexGrow: 1,
                            backgroundColor: "#fff",
                            borderRadius: 8,
                            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            height: "calc(5 * 48px)",
                            marginTop: 10,
                        }}
                    >
                        <TableContainer component={Paper} sx={{ p: 1 }}>
                            <Table stickyHeader size="small" sx={{
                                border: "none !important",
                                "& td, & th": {
                                    borderLeft: "none !important",
                                    borderRight: "none !important",
                                },
                            }}>

                                {/* ===== TABLE HEADER ===== */}
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={headerStyle}>SI No</TableCell>
                                        <TableCell sx={headerStyle} align="center">Plant</TableCell>
                                        <TableCell sx={headerStyle}>Category</TableCell>

                                        {FY_MONTHS.map((m) => (
                                            <TableCell
                                                key={m.field}
                                                sx={headerStyle}
                                                align="center"
                                            >
                                                {m.headerName}
                                            </TableCell>
                                        ))}

                                        <TableCell sx={headerStyle} align="center">
                                            View
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                {/* ===== TABLE BODY ===== */}
                                <TableBody>
                                    {segmentResultData.map((row, index) => (
                                        <>
                                            <TableRow
                                                key={`${row.plant}-${row.category}`}
                                                hover
                                                sx={{ backgroundColor: "#f5f5f5" }}
                                            >
                                                {/* SI NO */}
                                                <TableCell sx={cellStyle} align="center">
                                                    {index + 1}
                                                </TableCell>

                                                {/* PLANT */}
                                                <TableCell sx={cellStyle} align="center">
                                                    {row.plant}
                                                </TableCell>

                                                {/* CATEGORY */}
                                                <TableCell sx={cellStyle}>
                                                    {generateDynamicCat(row.category)}
                                                </TableCell>

                                                {/* MONTH VALUES */}
                                                {FY_MONTHS.map((m) => {
                                                    const value = Number(row[m.field]) || 0;

                                                    return (
                                                        <TableCell
                                                            key={m.field}
                                                            sx={cellStyle}
                                                            align="center"
                                                        >
                                                            {row.category === "TARGET COST"
                                                                ? `${value.toFixed(2)} L`
                                                                : value}
                                                        </TableCell>
                                                    );
                                                })}

                                                {/* VIEW BUTTON */}
                                                <TableCell sx={cellStyle} align="center">
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            border: "1px solid #ccc",
                                                            borderRadius: "6px"
                                                        }}
                                                        // disabled={segmentResultData.length === index + 1}
                                                        disabled={row.category === 'TOTAL'}
                                                        onClick={() => handleToggle(index)}
                                                    >
                                                        <IoIosArrowDown size={16} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell
                                                    style={{ paddingBottom: 0, paddingTop: 0 }}
                                                    colSpan={16}
                                                >
                                                    <Collapse
                                                        in={expandedRowIndex === index}
                                                        timeout="auto"
                                                        unmountOnExit
                                                    >
                                                        <Box
                                                            sx={{
                                                                py: 2,
                                                            }}
                                                        // className="flex justify-center items-center w-full"
                                                        >
                                                            <LineCollapsableTable
                                                                columns={segmentColumns}
                                                                rowData={row}
                                                                tableView={tableView}
                                                                formik={formik}
                                                            />
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ))}
                                </TableBody>

                            </Table>
                        </TableContainer>
                    </div>
                )
            }

        </div>
    )
}


const LineCollapsableTable = ({ columns, rowData, tableView, formik }) => {
    const [lineResultData, setLineResultData] = useState([])

    useEffect(() => {
        const handleData = async () => {
            const fin_Year = formik.values.fin_year
            const planType = formik.values.planType
            const startYear = Number(fin_Year.split("-")[0]); // 2025
            const endYear = startYear + 1;                   // 2026

            const startDate = startOfDay(new Date(startYear, 3, 1));  // 01-Apr-2025
            const endDate = endOfDay(new Date(endYear, 2, 31));    // 31-Mar-2026
            console.log(startDate, endDate)

            const payloadSegmentBody = {
                startDate,
                endDate,
                plant: rowData?.plant,
                reportType: tableView,
                planType: planType,
                prod_seg_id: rowData?.prod_seg_id
            }
            const resposne = await getPMPD_Reports(payloadSegmentBody)
            setLineResultData(resposne[1])
        }
        handleData()
    }, [])

    return (
        <div>
            <DataGrid
                rows={lineResultData}
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
    )
}

export default PMPD_Report
