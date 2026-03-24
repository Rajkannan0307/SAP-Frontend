import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Modal, TextField, Typography } from '@mui/material'
import { EditIcon, EyeIcon, SearchIcon } from 'lucide-react'
import { getPlantdetails } from '../../controller/CommonApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import { endOfDay, endOfMonth, format, isSameMonth, isValid, parse, startOfDay, startOfMonth, subDays } from 'date-fns'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { AuthContext } from '../../Authentication/AuthContext'
import { AddTrnMonthlyConsumption_BULK, DCMOutputReportSendMailApi, GetDCMOutput_ReportApi } from '../../controller/ContributionalChartApiService'
import { exportToExcelDownload } from '../../utilis/excelUtilis'
import { FaFileExcel } from "react-icons/fa";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import { MdOutlineCancel } from 'react-icons/md'
import { IoMdSend } from "react-icons/io";
import { toast } from 'react-toastify'



const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
    </GridToolbarContainer>
);

const getRowClassName = (params) => {
    // if (params.row.Description === 'TOTAL') return '!bg-[#d1dfdc]';
    if (params.row.Description === 'TOTAL') return 'bg-[#3d85c6]!';
    // if (params.row.dept_name === 'GRAND TOTAL') return '!bg-[#d2f0a8] !font-semibold';
    // if (params.row.dept_name_o === 'OTHERS') return '!bg-[#fff7d6]';
    return '';
};
// Consumption Data
const getTop20ViewData = (type, data = []) => {
    const allowedTypes = [
        "Packing",
        "Stores & Spares",
        "Sub Contract"
    ];

    switch (type) {
        case "Packing":
        case "Stores & Spares":
        case "Sub Contract":

            // ✅ Filter, Sort by Plan Value Desc, Take Top 20
            const result = data
                .filter(item => item.Type === type)
                .sort((a, b) => (b["Diff Value"] || 0) - (a["Diff Value"] || 0))
            // .slice(0, 20);

            return {
                data: result,
                allowView: allowedTypes.includes(type)
            };

        default:
            return {
                data: [],
                allowView: allowedTypes.includes(type)
            };
    }
};

const CC_DCM_Output = () => {
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(false)
    const [sendMailLoading, setSendMailLoading] = useState(false)
    const [excelLoading, setExcelLoading] = useState(false);

    const [consumptionData, setConsumptionData] = useState([])

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
            date: new Date().toISOString().slice(0, 7),
            type: "SUBMIT"
        },
        validationSchema: validationschema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            console.log(values)
            const fin_Year = values.fin_year
            const plant = values.plant

            // Convert month-year input to real dates

            // const selectedDate = new Date(values.date);
            // const today = new Date();

            // const startDate = startOfMonth(selectedDate);

            // const endDate = isSameMonth(selectedDate, today)
            //     ? subDays(today, 1)     // yesterday
            //     : endOfMonth(selectedDate);

            // Parse month string into a Date object
            const monthDate = parse(values.date, "yyyy-MM", new Date());

            // Get month boundaries
            const startDate = format(startOfMonth(monthDate), "yyyy-MM-dd");
            const endDate = format(endOfMonth(monthDate), "yyyy-MM-dd");

            console.log(startDate, endDate)



            if (values.type === "SUBMIT") {
                try {

                    if (loading) return

                    setLoading(true)
                    const response = await GetDCMOutput_ReportApi({
                        startDate, endDate, plant
                    })
                    console.log(response.dcm_output, 'dcm_output')
                    setOriginalRows(response.dcm_output || [])
                    setRows(response.dcm_output || [])

                    setConsumptionData(response?.childPartConsumption || [])
                    console.log(response?.childPartConsumption || [])


                } catch (error) {
                    console.error(error)
                }

            } else if (values.type === "SEND_MAIL") {
                await handleMailTrigger({ startDate, endDate, plant })
            } else if (values.type === "DOWNLOAD") {
                handleExcelDownload({ startDate, endDate, plant })
            }

            setSendMailLoading(false)
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
        {
            field: "SI_No", headerName: "SI No", width: 80,
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        { field: "Plant", headerName: "Plant", width: 150 },
        { field: "Description", headerName: "Description", flex: 1 },
        { field: "Flex_Plan", headerName: "Flex Plan", width: 100 },
        { field: "Actual", headerName: "Actual", width: 100, align: "right", headerAlign: "right" },
        {
            field: "GAP", headerName: "Gap", width: 100,
            renderCell: (params) => {
                const isPositive = params.value > 0;
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
        { field: "Metric", headerName: "Metric", width: 100, },
        {
            field: "Actusal", headerName: "Top 20", width: 100, align: "start", headerAlign: "start",
            renderCell: (params) => {
                const x = getTop20ViewData(params.row.Description, consumptionData)
                return (
                    <>
                        {
                            x.allowView && (
                                <Top20DataGridModal title='Top 100 Varients' data={x.data || []} />
                            )
                        }
                    </>

                )
            }
        },
    ];


    const handleExcelDownload = async ({ startDate, endDate, plant }) => {
        try {
            if (excelLoading) return;

            setExcelLoading(true);

            const response = await GetDCMOutput_ReportApi({
                startDate,
                endDate,
                plant
            });

            console.log(response.dcm_output, 'dcm_output - Excel output')

            await exportToExcelDownload({
                fileName: "DCM_Reports",
                sheets: [
                    // { name: "Base Report", data: response[0] || [] },
                    // { name: "Consumption", data: response[1] || [] },
                    // { name: "Sales Actual", data: response[2] || [] },
                    // { name: "Production Actual", data: response[3] || [] },
                    // { name: "Sales Plan", data: response[4] || [] },
                    // { name: "Production Plan", data: response[5] || [] },
                    // { name: "Labour Flex Plan", data: response[6] || [] },
                    // { name: "Labour Cost Actual", data: response[7] || [] },
                    // // { name: "DHRM HC", data: response[8] || [] },
                    // { name: "Labour Cost Working", data: response[8] || [] },
                    // { name: "Power Cost Unit", data: response[9] || [] },
                    // { name: "DCM", data: response[10] || [] },
                    // { name: "Missing FG_Part", data: response[11] || [] },
                    { name: "Production Plan", data: response.productionPlan || [] },
                    { name: "Production Actual", data: response.productionActual || [] },
                    { name: "Consumption Actual", data: response.actualConsumption || [] },
                    { name: "Packing BOM", data: response.packingBom || [] },
                    { name: "Stores and Spares", data: response.Stores_spares || [] },
                    { name: "SubContract", data: response.subContract || [] },
                    { name: "BOM Plan vs Actual", data: response.childPartConsumption || [] },
                    { name: "Sales Actual", data: response.salesActual || [] },
                    { name: "Sales Plan", data: response.salesPlan || [] },
                    { name: "Labour Flex Plan", data: response.labourFlexPlan || [] },
                    { name: "Labour Cost Actual", data: response.labourCostActual || [] },
                    { name: "Labour Cost Working", data: response.labourCostWorking || [] },
                    { name: "Power Cost Details", data: response.powerCostFlex || [] },
                    { name: "Power Cost summary", data: response.powerCostUnit || [] },
                    { name: "DCM", data: response.dcm_output || [] },
                    { name: "Missing FG_Part", data: response.missingFgParts || [] },
                ]
            });

        } catch (error) {
            console.error(error);
        } finally {
            setExcelLoading(false);
        }
    };



    const handleMailTrigger = async ({ startDate, endDate, plant }) => {
        try {
            setSendMailLoading(true)
            await DCMOutputReportSendMailApi({ startDate, endDate, plant })
            toast.success('Mail Sent Successfully')
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
        }
        setSendMailLoading(false)
    }

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
            {/* {JSON.stringify(consumptionData)} */}
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
                    <Button variant="contained" sx={{
                        background: "#1434A4"
                    }}
                        onClick={(e) => {
                            formik.setFieldValue('type', 'SEND_MAIL')
                            formik.handleSubmit(e)
                        }}
                        startIcon={<IoMdSend size={16} />}
                    >
                        {sendMailLoading ? "Loading..." : "Send Mail"}
                    </Button>

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
                    getRowClassName={(params) => `
                            ${getRowClassName(params)} ${params.row.Description === "TOTAL" ? "total-row" : ""}
                            ${params.indexRelativeToCurrentPage === 1 ? "section-start" : ""}
                    `}
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

                        "& .total-row": {
                            backgroundColor: "#3d85c6",
                            color: "#fff",
                            "& .MuiDataGrid-cell": {
                                color: "#fff"
                            }
                        },
                        "& .section-start": {
                            position: "relative",
                            mb: 2
                        },

                        "& .section-start::after": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: -20,
                            height: "20px",
                            // backgroundColor: "#83B3E6"
                            backgroundColor: "#C6C9C3"
                        }
                    }}
                />
            </div>


        </div>
    )
}





export const Top20DataGridModal = ({ title = "", data = [] }) => {
    const [open, setOpen] = useState(false);

    const columns = [
        // { field: "Plant", headerName: "Plant", flex: 1 },
        // { field: "Type", headerName: "Type", flex: 1.2 },
        // { field: "Cons Date", headerName: "Cons Date", flex: 1 },
        // { field: "Mat Type", headerName: "Mat Type", flex: 1 },
        { field: "IDM Part No", headerName: "Child Part No", flex: 1.5 },
        { field: "Description", headerName: "Description", flex: 2 },
        {
            field: "Price", headerName: "Price", flex: 1,
            renderCell: (params) => {
                return (<>{Number(params.value).toFixed(2)}</>)
            }
        },
        // { field: "Plan Qty", headerName: "Plan Qty", flex: 1 },
        // { field: "Act Qty", headerName: "Act Qty", flex: 1 },
        // { field: "Diff Qty", headerName: "Diff Qty", flex: 1 },
        // { field: "Plan Value", headerName: "Plan Value", flex: 1.2 },
        // { field: "Act Value", headerName: "Act Value", flex: 1.2 },
        // { field: "Diff Value", headerName: "Diff Value", flex: 1.2 },
        {
            field: "Plan Qty",
            headerName: "Plan Qty",
            flex: 1,
            renderCell: (params) => (
                <span>{params.value != null ? Math.round(params.value) : ""}</span>
            )
        },
        {
            field: "Act Qty",
            headerName: "Act Qty",
            flex: 1,
            renderCell: (params) => (
                <span>{params.value != null ? Math.round(params.value) : ""}</span>
            )
        },
        {
            field: "Diff Qty",
            headerName: "Diff Qty",
            flex: 1,
            renderCell: (params) => (
                <span>{params.value != null ? Math.round(params.value) : ""}</span>
            )
        },
        {
            field: "Plan Value",
            headerName: "Plan Value",
            flex: 1.2,
            renderCell: (params) => (
                <span>{params.value != null ? Math.round(params.value) : ""}</span>
            )
        },
        {
            field: "Act Value",
            headerName: "Act Value",
            flex: 1.2,
            renderCell: (params) => (
                <span>{params.value != null ? Math.round(params.value) : ""}</span>
            )
        },
        {
            field: "Diff Value",
            headerName: "Diff Value",
            flex: 1.2,
            renderCell: (params) => (
                <span>{params.value != null ? Math.round(params.value) : ""}</span>
            )
        },
    ];

    const rows = data.map((row, index) => ({
        id: index + 1,
        ...row,
    }));


    const handleClose = () => {
        setOpen(false)
    }

    return (
        <>

            <IconButton size='small'
                onClick={() => {
                    setOpen(true)
                }}>
                <EyeIcon size={20} />
            </IconButton>

            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth={"xl"}
            >
                <DialogTitle id="alert-dialog-title" sx={{ pl: 2, pr: 1, py: 0.5 }}>
                    <div className="flex justify-between items-center " >
                        <div className="text-sm  font-semibold text-blue-600">
                            {title}
                        </div>

                        <IconButton size="small" onClick={handleClose}>
                            <MdOutlineCancel size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>
                <div
                    style={{
                        flexGrow: 1, // Ensures it grows to fill the remaining space
                        backgroundColor: "#fff",
                        borderRadius: 8,
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        width: "70rem",
                        height: "34rem",
                        paddingInline: 10,
                        paddingBottom: 10
                    }}
                >
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        pageSize={5} // Set the number of rows per page to 8
                        rowsPerPageOptions={[5]}
                        getRowId={(row) => row.id} // Specify a custom id field
                        disableSelectionOnClick
                        slots={{ toolbar: CustomToolbar }}
                        columnHeaderHeight={35}
                        rowHeight={35}
                        sx={{
                            // Header Style
                            "& .MuiDataGrid-columnHeader": {
                                backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
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
            </Dialog>
        </>

    );
}


export default CC_DCM_Output
