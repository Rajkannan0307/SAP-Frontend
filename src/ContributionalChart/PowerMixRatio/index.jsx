import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    IconButton,
    MenuItem,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    Box,
    Typography,
    Modal,
    FormControl,
    FormHelperText
} from "@mui/material";
import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { decryptSessionData } from "../../controller/StorageUtils";
import { GetMstMachineUpdate_image } from "../../controller/TestLabService";
import EditIcon from "@mui/icons-material/Edit";
import { useFormik } from "formik";
import * as Yup from "yup"
import { api } from "../../controller/constants";
import SectionHeading from "../../components/Header";
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { AddOrEditTrnPowerMixRatioApi, GetTrnPowerMixRatioAPi, TrnPowerMixRatio_BULKApi } from "../../controller/ContributionalChartApiService";
import { getPlantdetails } from "../../controller/CommonApiService";
import { CloudUploadIcon } from 'lucide-react'
import { deepPurple } from "@mui/material/colors";
import ExcelJS from 'exceljs'
import { GetMaterialMasterApi, getMaterialType } from "../../controller/Masterapiservice";
import { MaterialGroupEnumTypes } from "../../common/enumValues";
import Select from 'react-select';
import { format } from "date-fns";
import { generateExcelTemplate } from "../../utilis/excelUtilis";
import ValidationResponseGrid from "../../components/ValidationResponseTable";

const CC_PowerMixRatio = () => {
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [editData, setEditData] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [role, setRole] = useState('');
    const [UserID, setUserID] = useState("");

    const [refreshData, setRefreshData] = useState(false)

    const [openUploadModal, setOpenUploadModal] = useState(false);

    const handleEdit = (data) => {
        console.log(data, "data")
        setEditData(data)
        setOpenEditModal(true)
    }

    const handleView = (data) => {
        console.log(data, "data")
        setEditData(data)
        setOpenViewModal(true)
    }



    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const handleOpenDialog = (row) => {
        setSelectedRow(row);
        setOpenImageDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenImageDialog(false);
        setSelectedRow(null);
    };


    const columns = [
        {
            field: "power_mix_ratio_id", // Updated to match table PK
            headerName: "SI No",
            width: 60,
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        { field: "plant", headerName: "Plant", flex: 1 },
        { field: "month", headerName: "Month", flex: 1 }, // Uses the formatted 'MM-yyyy' from SQL

        // --- Percentages Group ---
        { field: "eb_per", headerName: "EB %", width: 80, type: 'number' },
        { field: "dg_per", headerName: "DG %", width: 80, type: 'number' },
        { field: "wind_per", headerName: "Wind %", width: 85, type: 'number' },
        { field: "solar_per", headerName: "Solar %", width: 85, type: 'number' },

        // --- Unit Costs Group ---
        { field: "eb_unit_cost", headerName: "EB Cost", width: 100, type: 'number' },
        { field: "dg_unit_cost", headerName: "DG Cost", width: 100, type: 'number' },
        { field: "wind_unit_cost", headerName: "Wind Cost", width: 100, type: 'number' },
        { field: "solar_unit_cost", headerName: "Solar Cost", width: 100, type: 'number' },

        {
            field: "active_status",
            headerName: "Status",
            width: 110,
            renderCell: (params) => {
                const isActive = params.value === true || params.value === 1 || params.value === "1";
                return (
                    <span
                        style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "white",
                            backgroundColor: isActive ? "#2e7d32" : "#d32f2f"
                        }}
                    >
                        {isActive ? "Active" : "Inactive"}
                    </span>
                );
            },
        },
        {
            field: "action",
            headerName: "Action",
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleEdit(params.row)}
                    title="Edit"
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            ),
        },
    ];


    // ✅ Custom Toolbar
    const CustomToolbar = () => (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarExport />
        </GridToolbarContainer>
    );

    useEffect(() => {
        // Decrypt session data
        const encryptedData = sessionStorage.getItem("userData");
        if (encryptedData) {
            const decryptedData = decryptSessionData(encryptedData);
            setUserID(decryptedData.UserID);
            setRole(decryptedData.RoleId);
            console.log("sap roleid", decryptedData.RoleId);
            console.log("Sap userid", decryptedData.UserID);
        }

        // Auto-refresh after 1 hour 5 min
        const timer = setTimeout(() => {
            window.location.reload();
        }, 3900000);  //1 hr 5 min

        // Cleanup
        return () => clearTimeout(timer);
    }, []);

    // ✅ Handle Add Modal
    const handleOpenAddModal = (item) => {
        setOpenAddModal(true);
    };

    // ✅ Search Functionality
    const handleSearch = () => {
        const text = searchText.trim().toLowerCase();

        const filteredRows = originalRows.filter((row) =>
            ["plant", "mix_month"].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };


    useEffect(() => {
        const fetchData = async () => {
            const response = await GetTrnPowerMixRatioAPi()
            console.log("GetMstPowerUnitApi - ", response)
            setOriginalRows(response || [])
            setRows(response || [])
        }
        fetchData()
    }, [refreshData])


    return (
        <div
            style={{
                padding: 20,
                backgroundColor: "#F5F5F5",
                marginTop: "50px",
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 90px)",// or a specific height if necessary
            }}
        >
            {/* Header Section */}
            <div
                style={{
                    marginBottom: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <SectionHeading>
                    Power Mix Ratio
                </SectionHeading>
            </div>

            {/* Search and Icons */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                }}
            >
                {/* Search Box */}
                <div style={{ display: "flex", gap: "10px" }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Type here..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyUp={handleSearch}
                        sx={{
                            width: "400px",
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                    border: "2px solid grey", // No border by default
                                },
                                "&:hover fieldset": {
                                    border: "2px solid grey", // Optional: border on hover
                                },
                                "&.Mui-focused fieldset": {
                                    border: "2px solid grey", // Grey border on focus
                                },
                            },
                        }}
                    />
                    <Button
                        onClick={handleSearch}
                        style={{
                            borderRadius: "25px",
                            border: "2px solid grey",
                            color: "grey",
                            fontWeight: "bold",
                        }}
                    >
                        <SearchIcon style={{ marginRight: "5px" }} />
                        Search
                    </Button>
                </div>

                {/* Icons */}
                <div style={{ display: "flex", gap: "10px" }}>
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

                    <IconButton
                        onClick={handleOpenAddModal}
                        style={{
                            borderRadius: "50%",
                            backgroundColor: "#0066FF",
                            color: "white",
                            width: "40px",
                            height: "40px",
                        }}
                    >
                        <AddIcon />
                    </IconButton>
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
                    getRowId={(row) => row.power_mix_ratio_id} // Specify a custom id field
                    disableSelectionOnClick
                    columnHeaderHeight={35}
                    slots={{ toolbar: CustomToolbar }}
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
                            fontSize: "14px",
                        },
                    }}
                />
            </div>


            <AddDialog open={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData} />
            <AddDialog open={openEditModal} setOpenAddModal={setOpenEditModal} setRefreshData={setRefreshData} editData={editData} />

        </div>
    );
};


const AddDialog = ({ open, setOpenAddModal, setRefreshData, editData }) => {
    const [submitLoading, setSubmitLoading] = useState(false)
    const [plants, setPlants] = useState([])

    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        plant: Yup.string().required('Plant is required'),
        month: Yup.date().required('Month is required'),
        // Percentage Fields
        eb_per: Yup.number()
            .typeError('Must be a number')
            .required('Required'),
        dg_per: Yup.number()
            .typeError('Must be a number')
            .required('Required'),
        wind_per: Yup.number()
            .typeError('Must be a number')
            .required('Required'),
        solar_per: Yup.number()
            .typeError('Must be a number')
            .required('Required'),

        // Unit Cost Fields
        eb_unit_cost: Yup.number()
            .typeError('Must be a number')
            .required('Required'),
        dg_unit_cost: Yup.number()
            .typeError('Must be a number')
            .required('Required'),
        wind_unit_cost: Yup.number()
            .typeError('Must be a number')
            .required('Required'),
        solar_unit_cost: Yup.number()
            .typeError('Must be a number')
            .required('Required'),

        active_status: Yup.boolean().required('Required'),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: editData?.plant || "",
            month: editData?.month ? format(new Date(editData.month), "yyyy-MM") : "",
            eb_per: editData?.eb_per ?? "",
            dg_per: editData?.dg_per ?? "",
            wind_per: editData?.wind_per ?? "",
            solar_per: editData?.solar_per ?? "",
            eb_unit_cost: editData?.eb_unit_cost ?? "",
            dg_unit_cost: editData?.dg_unit_cost ?? "",
            wind_unit_cost: editData?.wind_unit_cost ?? "",
            solar_unit_cost: editData?.solar_unit_cost ?? "",
            active_status: editData?.active_status ?? true,
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
                        power_mix_ratio_id: editData?.power_mix_ratio_id,
                        ...values,
                        month: `${values.month}-01`,
                        userId: userId
                    }
                    await AddOrEditTrnPowerMixRatioApi(payload)
                    alert("✅ Packing Part updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        month: `${values.month}-01`,
                        userId: userId
                    }
                    await AddOrEditTrnPowerMixRatioApi(payload)
                    alert("✅ Packing Part added successfully!");
                }
                setRefreshData((prev) => !prev)
                handleClose()
            } catch (error) {
                // console.error("❌ Error submitting form:", error);
                // alert(error?.response?.data?.error ? `❌ ${error?.response?.data?.error}` : "❌ An error occurred while submitting the form.");

                console.error("❌ Error submitting form:", error);

                const details = error?.response?.data?.details;
                if (details && Array.isArray(details)) {
                    // Join all error messages into a single line
                    const message = details.join(', ');
                    alert(`❌ Validation errors: ${message}`);
                } else if (error?.response?.data?.error || error?.response?.data?.message) {
                    alert(`❌ ${error.response.data.error || error?.response?.data?.message}`);
                } else {
                    alert("❌ An error occurred while submitting the form.");
                }

            }
            setSubmitLoading(false)
        }
    });



    useEffect(() => {
        const fetchData = async () => {
            const response2 = await getPlantdetails()
            console.log(response2, "Plants")
            setPlants(response2)
        }
        if (open) fetchData()

    }, [open])

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {`${editData ? "Edit" : "Add"} Power Mix Ratio`}
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
                        size="small"
                        label="Plant"
                        name="plant"
                        value={formik.values.plant}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.plant && Boolean(formik.errors.plant)}
                        helperText={formik.touched.plant && formik.errors.plant}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            // ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {plants.map((p) => (
                            <MenuItem sx={{ fontSize: "small" }} key={p.Plant_Code} value={p.Plant_Code}>
                                {`${p.Plant_Code} - ${p.Plant_Name}`}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        id="month"
                        name="month"
                        label="Month"
                        size="small"
                        fullWidth
                        type="month"
                        value={formik.values.month}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.month && Boolean(formik.errors.month)}
                        helperText={formik.touched.month && formik.errors.month}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />


                    <TextField
                        id="eb_per"
                        name="eb_per"
                        label="EB %"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.eb_per}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.eb_per && Boolean(formik.errors.eb_per)}
                        helperText={formik.touched.eb_per && formik.errors.eb_per}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="dg_per"
                        name="dg_per"
                        label="DG %"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.dg_per}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.dg_per && Boolean(formik.errors.dg_per)}
                        helperText={formik.touched.dg_per && formik.errors.dg_per}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="wind_per"
                        name="wind_per"
                        label="Wind %"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.wind_per}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.wind_per && Boolean(formik.errors.wind_per)}
                        helperText={formik.touched.wind_per && formik.errors.wind_per}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="solar_per"
                        name="solar_per"
                        label="Solar %"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.solar_per}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.solar_per && Boolean(formik.errors.solar_per)}
                        helperText={formik.touched.solar_per && formik.errors.solar_per}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="eb_unit_cost"
                        name="eb_unit_cost"
                        label="Eb Unit Cost"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.eb_unit_cost}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.eb_unit_cost && Boolean(formik.errors.eb_unit_cost)}
                        helperText={formik.touched.eb_unit_cost && formik.errors.eb_unit_cost}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="dg_unit_cost"
                        name="dg_unit_cost"
                        label="DG Unit Cost"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.dg_unit_cost}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.dg_unit_cost && Boolean(formik.errors.dg_unit_cost)}
                        helperText={formik.touched.dg_unit_cost && formik.errors.dg_unit_cost}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="wind_unit_cost"
                        name="wind_unit_cost"
                        label="Wind Unit Cost"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.wind_unit_cost}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.wind_unit_cost && Boolean(formik.errors.wind_unit_cost)}
                        helperText={formik.touched.wind_unit_cost && formik.errors.wind_unit_cost}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />

                    <TextField
                        id="solar_unit_cost"
                        name="solar_unit_cost"
                        label="Solar Unit Cost"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.solar_unit_cost}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.solar_unit_cost && Boolean(formik.errors.solar_unit_cost)}
                        helperText={formik.touched.solar_unit_cost && formik.errors.solar_unit_cost}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />


                </div>

                <FormControlLabel
                    control={
                        <Switch
                            checked={formik.values.active_status}
                            onChange={(e) => formik.setFieldValue("active_status", e.target.checked)}
                            color="success"
                        />
                    }
                    label={formik.values.active_status ? "Active" : "Inactive"}
                    sx={{
                        fontWeight: "bold",
                        mt: 2,
                        color: formik.values.active_status ? "#2e7d32" : "#d32f2f"
                    }}
                />

                {formik.touched.active_status && formik.errors.active_status && (
                    <div style={{ color: "red", fontSize: 12 }}>{formik.errors.active_status}</div>
                )}

            </DialogContent>
            <DialogActions sx={{ p: 0, pb: 2, pr: 3 }}>
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
            const response = await TrnPowerMixRatio_BULKApi(formData)
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


    const handleDownloadTemplate = async () => {
        try {
            const response = await getPlantdetails();
            // Assuming Plant_Code is what you want in the dropdown
            const PlantCodeList = response.map((e) => e.Plant_Code);

            await generateExcelTemplate({
                fileName: "Power_Mix_Ratio_Template.xlsx",
                sheetName: "Power Mix Ratio",
                headers: [
                    "Plant",
                    "Month ( dd_MM_yyyy )",
                    "EB %",
                    "DG %",
                    "Wind %",
                    "Solar %",
                    "EB Cost",
                    "DG Cost",
                    "Wind Cost",
                    "Solar Cost"
                ],
                // Adjusted widths for better visibility
                columnWidths: [15, 25, 12, 12, 12, 12, 15, 15, 15, 15],
                dropdowns: [
                    {
                        column: "A", // Plant Column
                        values: PlantCodeList
                    }
                ]
            });
        } catch (error) {
            console.error("Error downloading template:", error);
        }
    };

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

            <Modal open={open} onClose={() => { }} >
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
                        onClick={() => {
                            handleDownloadTemplate()
                        }}
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
                    {uploadResponse && <ValidationResponseGrid response={uploadResponse} />}
                </Box>
            </Modal>
        </>
    );
};


export default CC_PowerMixRatio;