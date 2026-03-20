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
import { AddMstPackingPartBULK, AddorEditMstPowerUnitApi, AddOrEditPackingPart, GetMstPowerUnitApi, GetPackingPartApi, MstPowerUnitBulkApi } from "../../controller/ContributionalChartApiService";
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

const CC_PowerUnit = () => {
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
            field: "power_unit_id", headerName: "SI No", width: 80,
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        { field: "plant", headerName: "Plant", flex: 1 },
        { field: "fg_part_code", headerName: "Part No", flex: 1 },
        { field: "fg_part_desc", headerName: "Description", flex: 1 },
        { field: "unit_per_part", headerName: "Unit Per Part", flex: 1 },
        { field: "eff_date", headerName: "Eff Date", flex: 1 },
        {
            field: "active_status", headerName: "Active Status", flex: 1,
            renderCell: (params) => {
                const isActive = params.value === true || params.value === "1";
                return (
                    <span
                        style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
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
            field: "action", headerName: "Action", width: 160,
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    onClick={() => handleEdit(params.row)}
                    title="Edit"
                >
                    <EditIcon />
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
            ["plant", "fg_part_code", "fg_part_desc"].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };


    useEffect(() => {
        const fetchData = async () => {
            const response = await GetMstPowerUnitApi()
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
                    Power Unit Master
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
                    getRowId={(row) => row.power_unit_id} // Specify a custom id field
                    disableSelectionOnClick
                    slots={{ toolbar: CustomToolbar }}
                    sx={{
                        // Header Style
                        "& .MuiDataGrid-columnHeader": {
                            backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
                            color: "black",
                            fontWeight: "bold",
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                            fontSize: "16px",
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
    const [materialType, setMaterialType] = useState([])
    const [materialPartNo, setMaterialPartNo] = useState([])

    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        plant: Yup.string().required('Required'),
        fg_part: Yup.string().required('Required'),
        unit_per_part: Yup.string().required('Required'),
        eff_date: Yup.date().required('Required'),
        active_status: Yup.string().required('Required'),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: editData?.plant || "",
            fg_part: editData?.fg_part || "",
            unit_per_part: editData?.unit_per_part || "",
            eff_date: editData?.eff_date ? format(editData?.eff_date, "yyyy-MM") : "",
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
                        power_unit_id: editData?.power_unit_id,
                        ...values,
                        eff_date: `${values.eff_date}-01`, //getting start of date
                        userId: userId
                    }
                    await AddorEditMstPowerUnitApi(payload)
                    alert("✅ Packing Part updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        eff_date: `${values.eff_date}-01`,
                        userId: userId
                    }
                    await AddorEditMstPowerUnitApi(payload)
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

            const response3 = await getMaterialType(MaterialGroupEnumTypes.direct)
            console.log(response3.data, 'Material Type')
            setMaterialType(response3.data)
        }
        if (open) fetchData()

    }, [open])


    useEffect(() => {
        const fetchData = async () => {
            const mat_types = materialType.map((e) => e.Mat_Type).join(',')
            console.log(mat_types, 'Mat Types')
            const response = await GetMaterialMasterApi({ plant: formik.values.plant, materialType: mat_types })
            console.log(response, "Material Part No")
            setMaterialPartNo(response)
        }
        if (formik.values.plant && materialType) fetchData()
    }, [formik.values.plant, materialType])

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {`${editData ? "Edit" : "Add"} Power Unit`}
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
                        id="eff_date"
                        name="eff_date"
                        label="Eff Date"
                        size="small"
                        fullWidth
                        type="month"
                        value={formik.values.eff_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.eff_date && Boolean(formik.errors.eff_date)}
                        helperText={formik.touched.eff_date && formik.errors.eff_date}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />

                    <FormControl
                        fullWidth
                        error={formik.touched.fg_part && Boolean(formik.errors.fg_part)}
                        sx={{ minWidth: 250, mt: 1 }}
                    >
                        <Select
                            name="fg_part"
                            placeholder='Select FG Part'
                            options={materialPartNo.map(e => ({
                                value: e.Material_ID,
                                label: e.Material_Code
                            }))}
                            value={
                                materialPartNo
                                    .map(e => ({
                                        value: e.Material_ID,
                                        label: e.Material_Code
                                    }))
                                    .find(opt => opt.value === formik.values.fg_part) || null
                            }
                            onChange={(option) =>
                                formik.setFieldValue('fg_part', option?.value || '')
                            }
                            onBlur={() => formik.setFieldTouched('fg_part', true)}
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                                control: (base, state) => ({
                                    ...base,
                                    minHeight: 38,               // 🔥 height
                                    height: 38,
                                    borderColor:
                                        formik.touched.fg_part && formik.errors.fg_part
                                            ? '#d32f2f'
                                            : base.borderColor,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        borderColor:
                                            formik.touched.fg_part && formik.errors.fg_part
                                                ? '#d32f2f'
                                                : base.borderColor
                                    }
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 8px'
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: 38
                                })
                            }}
                            isClearable
                            menuPortalTarget={document.body}
                        />

                        {/* 🔴 Formik Error */}
                        {formik.touched.fg_part && formik.errors.fg_part && (
                            <FormHelperText>
                                {formik.errors.fg_part}
                            </FormHelperText>
                        )}
                    </FormControl>

                    <TextField
                        id="unit_per_part"
                        name="unit_per_part"
                        label="Unit Per Part"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.unit_per_part}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.unit_per_part && Boolean(formik.errors.unit_per_part)}
                        helperText={formik.touched.unit_per_part && formik.errors.unit_per_part}
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


    // async function downloadProductionPlanTemplate() {

    //     const headerColumns = [
    //         'plant',
    //         'part_no',
    //         'unit_per_part',
    //         'eff_date'
    //     ];

    //     // 1️⃣ Create workbook
    //     const workbook = new ExcelJS.Workbook();
    //     workbook.creator = "PACKING_PART";
    //     workbook.created = new Date();

    //     // 2️⃣ Add worksheet
    //     const worksheet = workbook.addWorksheet("PACKING_PART");

    //     // 3️⃣ Add header row
    //     worksheet.addRow(headerColumns);

    //     // 4️⃣ Style header (optional but recommended)
    //     worksheet.getRow(1).font = { bold: true };
    //     worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    //     worksheet.getRow(1).eachCell((cell) => {
    //         cell.font = { bold: true };
    //         cell.alignment = { horizontal: "center" };
    //         cell.fill = {
    //             type: "pattern",
    //             pattern: "solid",
    //             fgColor: { argb: "FFADD8E6" },
    //         };
    //     });

    //     // 5️⃣ Set column widths
    //     worksheet.columns = [
    //         { width: 15 }, // Plant_Code
    //         { width: 20 }, // Customer
    //         { width: 20 }, // FG_Partno
    //         { width: 12 }, // Per_qty
    //         { width: 18 }, // Segment
    //         { width: 18 }, // Line_Name
    //         { width: 12 }, // PMPD_SMH
    //         { width: 14 }, // Production
    //         { width: 14 }, // Inspection
    //         { width: 14 }, // Packing
    //         { width: 18 }, // Effective Date
    //     ];

    //     // 6️⃣ Freeze header row
    //     worksheet.views = [{ state: "frozen", ySplit: 1 }];

    //     // 7️⃣ Write & download file
    //     const buffer = await workbook.xlsx.writeBuffer();

    //     saveAs(
    //         new Blob([buffer], {
    //             type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //         }),
    //         "PACKING_PART_Template.xlsx"
    //     );
    // }


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
            const response = await MstPowerUnitBulkApi(formData)
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

        const response = await getPlantdetails()
        console.log(response)

        const PlantCodeList = response.map((e) => e.Plant_Code)

        await generateExcelTemplate({
            fileName: "PowerUnitTemplate.xlsx",
            sheetName: "Power Unit",
            headers: [
                "Plant", "Part_No", "Unit_Per_Part", "Eff_Date ( dd_MM_yyyy )",
            ],
            columnWidths: [15, 20, 30, 30],
            dropdowns: [
                {
                    column: "A",
                    values: PlantCodeList
                }
            ]
        })
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
//             {errors?.invalidRows?.length > 0 && (
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
//             {errors?.emptyRows?.length > 0 && (
//                 <div className="mt-4 text-yellow-700">
//                     ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
//                 </div>
//             )}
//         </div>
//     );
// }

export default CC_PowerUnit;