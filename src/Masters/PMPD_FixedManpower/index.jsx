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
    Typography
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
import EditIcon from "@mui/icons-material/Edit";
import { useFormik } from "formik";
import { CommonMuiStyles } from "../../Styles/CommonStyles";
import * as Yup from "yup"
import SectionHeading from "../../components/Header";
import { AddOrEditProduct, AddOrEditProductSegemnt, GetFixedManpower, getProductdetails, getProductSegmentdetails, UpdateFixedManpower } from "../../controller/PMPDApiService";
import AddFixedmanpower from "./AddFixedmanpower";
import { getPlantdetails } from "../../controller/CommonApiService";
import { format, parseISO } from "date-fns";
import { getPMPDAccess } from "../../Authentication/ActionAccessType";

const PMPD_FixedManpower = () => {
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

    const PMPDAccess = getPMPDAccess()

    const handleEdit = (data) => {
        console.log(data, "data")
        if (data) {
            setEditData(data)
            setOpenEditModal(true)
        }
    }

    const handleView = (data) => {
        console.log(data, "data")
        if (data) {
            setEditData(data)
            setOpenViewModal(true)
        }
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
        { field: "fixed_manpower_id", headerName: "SI No", width: 80 },
        { field: "plant", headerName: "Plant", width: 150 },
        { field: "seg_name", headerName: "Segment Name", flex: 1 },
        { field: "job_name", headerName: "Job Name", flex: 1 },
        {
            field: "month", headerName: "Month", flex: 1,
            renderCell: (params) => params.value ? format(params.value, "dd-MM-yyyy") : ""
        },
        { field: "hc_no", headerName: "HC No", flex: 1 },
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
                    disabled={PMPDAccess.disableAction}
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

    const isCorp = role === 7 || role === 9;
    const isPlantMRPC = role === 4;

    // ✅ Handle Add Modal
    const handleOpenAddModal = (item) => {
        setOpenAddModal(true);
    };

    // ✅ Search Functionality
    const handleSearch = () => {
        const text = searchText.trim().toLowerCase();

        const filteredRows = originalRows.filter((row) =>
            ["plant", "job_name", "seg_name"].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };

    useEffect(() => {
        const fetchData = async () => {
            const plant = localStorage.getItem('Plantcode')
            const response = PMPDAccess.disableAction
                ? await GetFixedManpower(plant)
                : await GetFixedManpower()
            console.log("GetFixedManpower - ", response?.data)
            setOriginalRows(response?.data || [])
            setRows(response?.data || [])
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
                    Fixed Manpower
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
                <div style={{ display: PMPDAccess.disableAction ? "none" : "flex", gap: "10px" }}>
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
                    getRowId={(row) => row.fixed_manpower_id} // Specify a custom id field
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

            <AddFixedmanpower open={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData} />
            <EditDialog open={openEditModal} setOpenAddModal={setOpenEditModal} setRefreshData={setRefreshData} editData={editData} />

        </div>
    );
};






const EditDialog = ({ open, setOpenAddModal, setRefreshData, editData }) => {
    const [submitLoading, setSubmitLoading] = useState(false)
    const [prodSegments, setProdSegments] = useState([])
    const [plants, setPlants] = useState([])

    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        plant: Yup.string().required('Required'),
        prod_seg_id: Yup.string().required("Required"),
        month: Yup.string().required("Required"),
        job_name: Yup.string().required('Required'),
        hc_no: Yup.string().required('Required'),
        active_status: Yup.string().required('Required'),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: editData?.plant,
            prod_seg_id: editData?.prod_seg_id,
            month: editData?.month
                ? format(parseISO(editData.month), 'yyyy-MM')
                : '',
            job_name: editData?.job_name,
            hc_no: editData?.hc_no,
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
                const payload = {
                    fixed_manpower_id: editData?.fixed_manpower_id,
                    plant: values.plant,
                    prod_seg_id: values.prod_seg_id,
                    month: format(parseISO(`${values.month}-01`), 'yyyy-MM-dd'), // fin_year will be 2025-26, 2026-27,
                    job_name: values.job_name,
                    hc_no: values?.hc_no,
                    userId: userId,
                    active_status: values.active_status
                }

                await UpdateFixedManpower(payload)

                console.log(payload)
                setRefreshData((prev) => !prev)
                handleClose()
                alert('Fixed Manpower updated successfully')
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert(error?.response?.data?.message ? `❌ ${error?.response?.data?.message}` : "❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });


    useEffect(() => {
        if (editData && open) {
            formik.setValues({
                plant: editData.plant ?? '',
                prod_seg_id: editData.prod_seg_id ?? '',
                month: editData.month
                    ? format(parseISO(editData.month), 'yyyy-MM')
                    : '',
                job_name: editData.job_name ?? '',
                hc_no: editData.hc_no ?? '',
                active_status: editData.active_status ?? true
            });
        }
    }, [editData, open]);


    useEffect(() => {
        const fetchData = async () => {
            const response = await getProductSegmentdetails()
            console.log(response, "SEGMENT")
            setProdSegments(response);

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
                {`${editData ? "Edit" : "Add"} Product`}
            </DialogTitle>
            {/* {JSON.stringify(editData)} */}
            <DialogContent sx={{ pb: 0 }}>
                <div style={{
                    // display: "grid",
                    // gridTemplateColumns: "1fr",
                    display: "flex",
                    width: "100%",
                    gap: "15px"
                }}>

                    <TextField
                        select
                        size="small"
                        label="Plant"
                        name="plant"
                        value={String(formik.values.plant)}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.plant && Boolean(formik.errors.plant)}
                        helperText={formik.touched.plant && formik.errors.plant}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 250,
                            mt: 1
                        }}
                    >
                        {plants.map((p) => (
                            <MenuItem sx={{ fontSize: "small" }} key={p.Plant_ID} value={p.Plant_Code}>
                                {`${p.Plant_Code} - ${p.Plant_Name}`}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        id="month"
                        size="small"
                        label="Month"
                        name="month"
                        type="month"
                        value={formik.values.month}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.month && Boolean(formik.errors.month)}
                        helperText={formik.touched.month && formik.errors.month}
                        sx={{
                            // ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 250,
                            mt: 1
                        }}
                    />

                </div>

                <div style={{
                    display: "flex",
                    width: "100%",
                    gap: "15px",
                    paddingTop: 10
                }}>


                    <TextField
                        id="prod_seg_id"
                        name="prod_seg_id"
                        label="Segment"
                        size="small"
                        fullWidth
                        select
                        value={String(formik.values.prod_seg_id)}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.prod_seg_id && Boolean(formik.errors.prod_seg_id)}
                        helperText={formik.touched.prod_seg_id && formik.errors.prod_seg_id}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 250,
                            mt: 1
                        }}
                    >
                        {prodSegments.map((e) => (
                            <MenuItem key={e.prod_seg_id} value={e.prod_seg_id}
                                sx={{ fontSize: "small" }}
                            >
                                {e.seg_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        id="job_name"
                        name="job_name"
                        label="Job Name"
                        size="small"
                        fullWidth
                        value={formik.values.job_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.job_name && Boolean(formik.errors.job_name)}
                        helperText={formik.touched.job_name && formik.errors.job_name}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            maxWidth: 250,
                            mt: 1
                        }}
                    />

                </div>


                <div className="flex mt-2">
                    <TextField
                        id="hc_no"
                        name="hc_no"
                        label="HC NO"
                        size="small"
                        fullWidth
                        type="number"
                        value={formik.values.hc_no}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.hc_no && Boolean(formik.errors.hc_no)}
                        helperText={formik.touched.hc_no && formik.errors.hc_no}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            maxWidth: 250,
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






export default PMPD_FixedManpower;