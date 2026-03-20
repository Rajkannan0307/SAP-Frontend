import React, { useState, useEffect, useRef } from "react";
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
    GridRowModes,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { decryptSessionData } from "../../controller/StorageUtils";
import { GetMstMachineUpdate_image } from "../../controller/TestLabService";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { useFormik } from "formik";
import * as Yup from "yup"
import { api } from "../../controller/constants";
import SectionHeading from "../../components/Header";
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { AddOrEditTrnDailyPwrConsApi, GetTrnDailyPwrConsAPi, TrnDailyPwrCons_BULKApi } from "../../controller/ContributionalChartApiService";
import { getPlantdetails } from "../../controller/CommonApiService";
import { CloudUploadIcon } from 'lucide-react'
import { deepPurple } from "@mui/material/colors";
import ExcelJS from 'exceljs'
import { format, isValid, parse } from "date-fns";
import { generateExcelTemplate } from "../../utilis/excelUtilis";
import ValidationResponseGrid from "../../components/ValidationResponseTable";
import { toast } from "react-toastify";

const CC_DailyPowerConsumption = () => {
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
    const [selectedRows, setSelectedRows] = useState([]);
    const [rowModesModel, setRowModesModel] = useState({});
    const [editedRows, setEditedRows] = useState({});
    const [submitLoading, setSubmitLoading] = useState(false)

    const editedRowsRef = useRef({});

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

    const handleRowEditStop = (params, event) => {
        // Prevent auto-save on blur
        event.defaultMuiPrevented = true;
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow };

        // Update both State (for UI) and Ref (for API logic)
        setEditedRows((prev) => ({ ...prev, [newRow.daily_pwr_id]: updatedRow }));
        editedRowsRef.current[newRow.daily_pwr_id] = updatedRow;

        return updatedRow;
    };
    const handleEditClick = (id) => {
        setRowModesModel((prev) => ({
            ...prev,
            [id]: { mode: GridRowModes.Edit }
        }));
    };

    const handleSaveClick = async (id) => {
        try {
            if (submitLoading) return;
            setSubmitLoading(true);

            // 1. Force the grid to commit the current cell value to 'View' mode
            setRowModesModel((prev) => ({
                ...prev,
                [id]: { mode: GridRowModes.View }
            }));

            // 2. Tiny delay to ensure processRowUpdate has fired
            await new Promise((resolve) => setTimeout(resolve, 50));

            // 3. Get the LATEST data from the Ref
            const updatedRow = editedRowsRef.current[id];

            if (!updatedRow) {
                toast.error("No changes detected");
                return;
            }


            // setSubmitLoading(false);
            console.log(updatedRow)
            // return

            // --- Validation Logic (Keep your existing code) ---
            const userId = localStorage.getItem("EmpId");
            // let formattedDate = null;
            // if (updatedRow.pwr_date) {
            //     const parsedDate = parse(updatedRow.pwr_date, "yyyy-MM-dd", new Date());
            //     formattedDate = !isNaN(parsedDate) ? format(parsedDate, "yyyy-MM-dd") : null;
            // }

            let formattedDate = null;

            if (updatedRow.pwr_date) {
                // 1. Create a Date object directly from the ISO string
                const dateObj = new Date(updatedRow.pwr_date);

                // 2. Check if the date is valid before formatting
                if (!isNaN(dateObj.getTime())) {
                    // 3. Format it to your database-friendly string "yyyy-MM-dd"
                    formattedDate = format(dateObj, "yyyy-MM-dd");
                }
            }
            const payload = {
                daily_pwr_id: id,
                ...updatedRow,
                pwr_date: formattedDate,
                userId: userId
            };

            // 4. API CALL
            await AddOrEditTrnDailyPwrConsApi(payload);
            toast.success("✅ Updated successfully!");

            console.log(selectedRows, id, "ROWS IDS")
            // 5. CLEANUP: Uncheck the checkbox and remove from edit tracking
            setSelectedRows((prev) => {
                const x = prev.filter((rowId) => rowId !== id)
                console.log(x)
                return x
            });

            delete editedRowsRef.current[id];
            setEditedRows((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });

            // 6. Refresh Grid
            setRefreshData((prev) => !prev);

        } catch (error) {

            console.error("❌ Error submitting form:", error);

            const details = error?.response?.data?.details;
            if (details && Array.isArray(details)) {
                // Join all error messages into a single line
                const message = details.join(', ');
                toast.error(`❌ Validation errors: ${message}`);
            } else if (error?.response?.data?.error || error?.response?.data?.message) {
                toast.error(`❌ ${error.response.data.error || error?.response?.data?.message}`);
            } else {
                toast.error("❌ An error occurred while submitting the form.");
            }

            // If any issue occure back to edit mode
            setRowModesModel((prev) => ({
                ...prev,
                [id]: { mode: GridRowModes.Edit }
            }));

        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCellDoubleClick = (params, event) => {
        const isSelected = selectedRows.includes(params.id);

        if (!isSelected) {
            event.defaultMuiPrevented = true; // 🚫 stop edit
        }
    };


    const columns = [
        {
            field: "daily_pwr_id", headerName: "SI No", width: 80,
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        { field: "plant", headerName: "Plant", flex: 1 },
        {
            field: "eb", headerName: "EB", flex: 1,
            editable: (params) => selectedRows.includes(params.row.daily_pwr_id),
            type: "number",
            headerAlign: "center",
            align: "center"
        },
        {
            field: "dg", headerName: "DG", flex: 1,
            editable: (params) => selectedRows.includes(params.row.daily_pwr_id),
            type: "number",
            headerAlign: "center",
            align: "center"
        },
        {
            field: "wind", headerName: "Wind", flex: 1,
            editable: (params) => selectedRows.includes(params.row.daily_pwr_id),
            type: "number",
            headerAlign: "center",
            align: "center"
        },
        {
            field: "solar", headerName: "Solar", flex: 1,
            editable: (params) => selectedRows.includes(params.row.daily_pwr_id),
            type: "number",
            headerAlign: "center",
            align: "center"
        },
        {
            field: "pwr_date",
            headerName: "Date",
            flex: 1,
            type: "date",

            editable: (params) =>
                selectedRows.includes(params.row.daily_pwr_id),

            renderEditCell: (params) => {
                const today = new Date();

                const startOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );

                const endOfMonth = new Date(
                    today.getFullYear(),
                    today.getMonth() + 1,
                    0
                );

                const formatForInput = (date) =>
                    format(date, "yyyy-MM-dd"); // IMPORTANT for input type="date"

                return (
                    <TextField
                        type="date"
                        size="small"
                        value={
                            params.value
                                ? formatForInput(new Date(params.value))
                                : ""
                        }
                        inputProps={{
                            min: formatForInput(startOfMonth),
                            max: formatForInput(endOfMonth),
                        }}
                        onChange={(e) => {
                            const newValue = e.target.value;

                            params.api.setEditCellValue({
                                id: params.id,
                                field: params.field,
                                value: newValue,
                            });
                        }}

                        sx={{
                            "& .MuiInputBase-root": {
                                height: 30,   // 🔽 reduce height (default ~40)
                                fontSize: 12,
                            },
                            "& .MuiInputBase-input": {
                                padding: "4px 8px", // 🔽 reduce inner padding
                            },
                        }}
                    />
                );
            },

            valueGetter: (params) => {
                const value = params;
                if (!value) return null;

                if (value instanceof Date) return value;

                const parsedDate = parse(value, "dd-MM-yyyy", new Date());
                return isValid(parsedDate) ? parsedDate : null;
            },

            valueFormatter: (params) => {
                const value = params;
                return value instanceof Date && isValid(value)
                    ? format(value, "dd-MM-yyyy")
                    : "";
            },
        },
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
        // {
        //     field: "action", headerName: "Action", width: 160,
        //     renderCell: (params) => (
        //         <IconButton
        //             color="primary"
        //             onClick={() => handleEdit(params.row)}
        //             title="Edit"
        //         >
        //             <EditIcon />
        //         </IconButton>
        //     ),
        // },
        {
            field: "action",
            headerName: "Action",
            width: 120,
            renderCell: (params) => {
                const isSelected = selectedRows.includes(params.id);
                const isEditing =
                    rowModesModel[params.id]?.mode === GridRowModes.Edit;

                if (!isSelected) {
                    return (
                        <IconButton disabled>
                            <EditIcon />
                        </IconButton>
                    );
                }


                // isEditing ? (
                return <IconButton
                    color="success"
                    onClick={() => handleSaveClick(params.id)}
                >
                    <SaveIcon />
                </IconButton>
                // ) : (
                // <IconButton
                //     color="primary"
                //     onClick={() => handleEditClick(params.id)}
                // >
                //     <EditIcon />
                // </IconButton>
                // );
            }
        }
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
            ["plant", "pwr_date"].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };


    useEffect(() => {
        const fetchData = async () => {
            const response = await GetTrnDailyPwrConsAPi()
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
                    Daily Power Consumption
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
                    getRowId={(row) => row.daily_pwr_id} // Specify a custom id field
                    columnHeaderHeight={35}
                    slots={{ toolbar: CustomToolbar }}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={(ids) => {
                        setSelectedRows(ids);
                        const updatedModes = {};
                        ids.forEach((id) => {
                            updatedModes[id] = { mode: GridRowModes.Edit };
                        });
                        setRowModesModel(updatedModes);
                    }}
                    rowSelectionModel={selectedRows}
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={setRowModesModel}
                    processRowUpdate={processRowUpdate} // only stores data
                    onRowEditStop={handleRowEditStop}   // prevent auto save
                    onCellDoubleClick={handleCellDoubleClick}
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
        plant: Yup.string().required('Required'),
        pwr_date: Yup.date().required('Required'),
        eb: Yup.number().required('Required'),
        dg: Yup.number().required('Required'),
        wind: Yup.number().required('Required'),
        solar: Yup.number().required('Required'),
        active_status: Yup.string().required('Required'),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: editData?.plant || "",
            pwr_date: editData?.pwr_date ? format(editData?.pwr_date, "yyyy-MM-dd") : "",
            eb: editData?.eb || "",
            dg: editData?.dg || "",
            wind: editData?.wind || "",
            solar: editData?.solar || "",
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
                        daily_pwr_id: editData?.daily_pwr_id,
                        ...values,
                        pwr_date: `${values.pwr_date}-01`,
                        userId: userId
                    }
                    await AddOrEditTrnDailyPwrConsApi(payload)
                    alert("✅ Packing Part updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        pwr_date: `${values.pwr_date}-01`,
                        userId: userId
                    }
                    await AddOrEditTrnDailyPwrConsApi(payload)
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
                {`${editData ? "Edit" : "Add"} Daily Power Cons`}
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
                        id="pwr_date"
                        name="pwr_date"
                        label="Date"
                        size="small"
                        fullWidth
                        type="month"
                        value={formik.values.pwr_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.pwr_date && Boolean(formik.errors.pwr_date)}
                        helperText={formik.touched.pwr_date && formik.errors.pwr_date}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />


                    <TextField
                        id="eb"
                        name="eb"
                        label="EB"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.eb}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.eb && Boolean(formik.errors.eb)}
                        helperText={formik.touched.eb && formik.errors.eb}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="dg"
                        name="dg"
                        label="DG"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.dg}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.dg && Boolean(formik.errors.dg)}
                        helperText={formik.touched.dg && formik.errors.dg}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="wind"
                        name="wind"
                        label="Wind"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.wind}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.wind && Boolean(formik.errors.wind)}
                        helperText={formik.touched.wind && formik.errors.wind}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 200,
                            mt: 1
                        }}
                    />
                    <TextField
                        id="solar"
                        name="solar"
                        label="Solar"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.solar}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.solar && Boolean(formik.errors.solar)}
                        helperText={formik.touched.solar && formik.errors.solar}
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
            const response = await TrnDailyPwrCons_BULKApi(formData)
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
            fileName: "DailyPwrConsTemplate.xlsx",
            sheetName: "Daily Power Consumption",
            headers: [
                "Plant",
                "Date ( dd_MM_yyyy )",
                "EB",
                "DG",
                "Wind",
                "Solar"
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

export default CC_DailyPowerConsumption;