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
import { FaFileExcel } from "react-icons/fa";
import { decryptSessionData } from "../../controller/StorageUtils";
import { GetLineByPlantDept, GetModuleByPlantDept, GetMstMachine, GetMstMachineUpdate_image, GetMstTestRigSpec, GetRigTyes, GetTestRigStatusApi, InsertMstTestRigSpec, MstInsertMachine, MstUpdateMachine, UpdateMstTestRigSpec } from "../../controller/TestLabService";
import EditIcon from "@mui/icons-material/Edit";
import { useFormik } from "formik";
import { CommonMuiStyles } from "../../Styles/CommonStyles";
import * as Yup from "yup"
import { api } from "../../controller/constants";
import { FaCloudUploadAlt } from "react-icons/fa";
import { getPlants } from "../../controller/SapMasterapiservice";
import { getDepartment } from "../../controller/UserMasterapiservice";

const MachineScreen = () => {
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
        { field: "Machine_Id", headerName: "SI No", width: 80 },
        { field: "Plant_Code", headerName: "Plant", width: 80 },
        { field: "Machine_Code", headerName: "Machine Code", flex: 1 },
        { field: "Machine_Name", headerName: "Machine", flex: 1 },
        { field: "Dept_Name", headerName: "Department", flex: 1 },
        { field: "Line_Name", headerName: "Line", flex: 1 },
        {
            field: "Active_Status", headerName: "Active Status", flex: 1,
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
            field: "file_attachment", headerName: "Image",
            renderCell: (params) => (
                <Box>
                    <IconButton onClick={() => handleOpenDialog(params.row)}>
                        <FaCloudUploadAlt />
                    </IconButton>
                </Box>
            )
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
            ["Plant_Code", "Machine_Code", "Machine_Name", "Dept_Name", "Line_Name"].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };


    // excel download
    const handleDownloadExcel = () => {
        // if (data.length === 0) {
        //     alert("No Data Found");
        //     return;
        // }

        // const DataColumns = [
        //     "Plant_Code",
        //     "SAP_LOGIN_ID",
        //     "Employee_ID",
        //     "Name",
        //     "Category",
        //     "Department",
        //     "ActiveStatus",
        // ];

        // const filteredData = data.map((item) => ({
        //     Plant_Code: item.Plant_Code,

        //     SAP_LOGIN_ID: item.SAP_LOGIN_ID,
        //     Employee_ID: item.Employee_ID,
        //     Name: item.Employee_Name,
        //     Category: item.Category,
        //     Department: item.Dept_Name,
        //     ActiveStatus: item.Active_Status ? "Active" : "Inactive",
        //     Last_Punch: item.Last_Punch
        // }));

        // const worksheet = XLSX.utils.json_to_sheet(filteredData, {
        //     header: DataColumns,
        // });
        // worksheet['!cols'] = [
        //     { wch: 20 },
        //     { wch: 20 },
        //     { wch: 20 },
        //     { wch: 20 },
        //     { wch: 30 },
        //     { wch: 20 },
        //     { wch: 20 },
        //     { wch: 20 },
        // ];
        // // Style header row
        // DataColumns.forEach((_, index) => {
        //     const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
        //     if (!worksheet[cellAddress]) return;
        //     worksheet[cellAddress].s = {
        //         font: {
        //             bold: true,
        //             color: { rgb: "000000" },
        //         },
        //         fill: {
        //             fgColor: { rgb: "FFFF00" },
        //         },
        //         alignment: {
        //             horizontal: "center",
        //         },
        //     };
        // });

        // const workbook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(workbook, worksheet, "SAP");
        // XLSX.writeFile(workbook, "SAP_Data.xlsx");
    };


    useEffect(() => {
        const fetchMachine = async () => {
            const response = await GetMstMachine()
            console.log("GetMstMachine - ", response?.data)
            setOriginalRows(response?.data || [])
            setRows(response?.data || [])
        }
        fetchMachine()
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
                <h2
                    style={{
                        margin: 0,
                        color: "#2e59d9",
                        textDecoration: "underline",
                        textDecorationColor: "#88c57a",
                        textDecorationThickness: "3px",
                        marginBottom: -7,
                    }}
                >
                    Machine
                </h2>
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
                    {/* Download Button */}
                    <IconButton
                        onClick={handleDownloadExcel}
                        style={{
                            borderRadius: "50%",
                            backgroundColor: "#339900",
                            color: "white",
                            width: "40px",
                            height: "40px",
                        }}
                    >
                        <FaFileExcel size={18} />
                    </IconButton>

                    {/* Add Button */}
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
                    getRowId={(row) => row.Machine_Id} // Specify a custom id field
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

            {selectedRow && (
                <ImageDialog
                    open={openImageDialog}
                    handleClose={handleCloseDialog}
                    // imageUrl={selectedRow.file_attachment ? `${api}/uploads/${selectedRow.file_attachment}` : null}
                    // machineId={selectedRow.Machine_Id}
                    selectedData={selectedRow}
                    setRefreshData={setRefreshData} // optional
                />
            )}


            <AddMachineDialog open={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData} />
            <AddMachineDialog open={openEditModal} setOpenAddModal={setOpenEditModal} setRefreshData={setRefreshData} editData={editData} />

        </div>
    );
};


const AddMachineDialog = ({ open, setOpenAddModal, setRefreshData, editData }) => {
    const [rigTypes, setRigTypes] = useState([])
    const [submitLoading, setSubmitLoading] = useState(false)

    const [line, setLine] = useState([])
    const [module, setModule] = useState([])

    const [plants, setPlants] = useState([])
    const [dept, setDept] = useState([])


    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }


    // ✅ Validation Schema
    const validationSchema = Yup.object({
        Plant_Code: Yup.string()
            .required("Plant Code is required"),
        Machine_Code: Yup.string()
            .required("Machine Code is required"),
        Machine_Name: Yup.string()
            .required("Machine Name is required"),
        Dept_Id: Yup.string()
            .required("Department is required"),
        Module_Id: Yup.string()
            .required("Module is required"),
        Line_Id: Yup.string()
            .required("Line is required"),
        rig_type_id: Yup.string()
            .required("Rig Type is required"),
        Active_Status: Yup.boolean().required("Active Status is required")
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            Plant_Code: editData?.Plant_Code || "",
            Machine_Code: editData?.Machine_Code || "",
            Machine_Name: editData?.Machine_Name || "",
            Dept_Id: editData?.Dept_Id || "",
            Module_Id: editData?.Module_Id || "",
            Line_Id: editData?.Line_Id || "",
            rig_type_id: editData?.rig_type_id || "",
            Active_Status: editData?.Active_Status ?? true,
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
                        Machine_Id: editData?.Machine_Id,
                        ...values,
                        Modified_By: userId
                    }
                    await MstUpdateMachine(payload)
                    alert("✅ Test Rig Spec updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        Created_By: userId
                    }
                    await MstInsertMachine(payload)
                    alert("✅ Test Rig Spec added successfully!");
                }
                setRefreshData((prev) => !prev)
                handleClose()
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert(error?.response?.data?.details ? `❌ ${error?.response?.data?.details}` : "❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });

    useEffect(() => {
        const fetchRigTypesData = async () => {
            const response = await GetRigTyes()
            setRigTypes(response?.data || [])
        }
        if (open) fetchRigTypesData()
    }, [open])


    useEffect(() => {
        const fetchData = async () => {
            const response = await getPlants()
            console.log("Plants Data ", response?.data)
            setPlants(response?.data)


            const response2 = await getDepartment()
            console.log("Dept Data ", response2?.data)
            setDept(response2?.data)
        }
        if (open) fetchData()
    }, [open])

    useEffect(() => {
        const fetchData = async () => {
            const plant = formik.values.Plant_Code
            const dept = formik.values.Dept_Id
            const response = await GetLineByPlantDept(plant, dept)
            console.log("Line Data ", response?.data)
            setLine(response?.data)
        }
        if (formik.values.Plant_Code, formik.values.Dept_Id) fetchData()
    }, [formik.values.Plant_Code, formik.values.Dept_Id])

    useEffect(() => {
        const fetchData = async () => {
            const plant = formik.values.Plant_Code
            const dept = formik.values.Dept_Id
            const response = await GetModuleByPlantDept(plant, dept)
            console.log("Line Data ", response?.data)
            setModule(response?.data)
        }
        if (formik.values.Plant_Code, formik.values.Dept_Id) fetchData()
    }, [formik.values.Plant_Code, formik.values.Dept_Id])

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {`${editData ? "Edit" : "Add"} Machine`}
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
                        id="Plant_Code"
                        name="Plant_Code"
                        label="Plant"
                        fullWidth
                        value={formik.values.Plant_Code}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Plant_Code && Boolean(formik.errors.Plant_Code)}
                        helperText={formik.touched.Plant_Code && formik.errors.Plant_Code}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {plants?.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Plant_Code}>
                                {option.Plant_Code}
                            </MenuItem>
                        )) || []}
                    </TextField>


                    <TextField
                        id="Machine_Code"
                        name="Machine_Code"
                        label="Machine Code"
                        fullWidth
                        value={formik.values.Machine_Code}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Machine_Code && Boolean(formik.errors.Machine_Code)}
                        helperText={formik.touched.Machine_Code && formik.errors.Machine_Code}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    />

                    <TextField
                        id="Machine_Name"
                        name="Machine_Name"
                        label="Machine Name"
                        fullWidth
                        value={formik.values.Machine_Name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Machine_Name && Boolean(formik.errors.Machine_Name)}
                        helperText={formik.touched.Machine_Name && formik.errors.Machine_Name}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    />

                    <TextField
                        select
                        id="Dept_Id"
                        name="Dept_Id"
                        label="Department"
                        fullWidth
                        value={formik.values.Dept_Id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Dept_Id && Boolean(formik.errors.Dept_Id)}
                        helperText={formik.touched.Dept_Id && formik.errors.Dept_Id}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {dept.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Dept_ID}>
                                {option.Dept_Name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        id="Line_Id"
                        name="Line_Id"
                        label="Line"
                        fullWidth
                        value={formik.values.Line_Id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Line_Id && Boolean(formik.errors.Line_Id)}
                        helperText={formik.touched.Line_Id && formik.errors.Line_Id}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {line.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Line_ID}>
                                {option.Line_Name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        id="Module_Id"
                        name="Module_Id"
                        label="Module"
                        fullWidth
                        value={formik.values.Module_Id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Module_Id && Boolean(formik.errors.Module_Id)}
                        helperText={formik.touched.Module_Id && formik.errors.Module_Id}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {module.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Module_ID}>
                                {option.Module_Name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        id="rig_type_id"
                        name="rig_type_id"
                        label="Rig Type"
                        fullWidth
                        value={formik.values.rig_type_id}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.rig_type_id && Boolean(formik.errors.rig_type_id)}
                        helperText={formik.touched.rig_type_id && formik.errors.rig_type_id}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {rigTypes.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.mst_rig_type_id}>
                                {option.rig_name}
                            </MenuItem>
                        ))}
                    </TextField>
                </div>

                <FormControlLabel
                    control={
                        <Switch
                            checked={formik.values.Active_Status}
                            onChange={(e) => formik.setFieldValue("Active_Status", e.target.checked)}
                            color="success"
                        />
                    }
                    label={formik.values.Active_Status ? "Active" : "Inactive"}
                    sx={{
                        fontWeight: "bold",
                        mt: 2,
                        color: formik.values.Active_Status ? "#2e7d32" : "#d32f2f"
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
                    {editData ? "Update" : "Add"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}




const ImageDialog = ({ open, handleClose, selectedData, setRefreshData }) => {
    const [file, setFile] = useState(null);
    const imageUrl = `${api}/uploads/${selectedData?.file_attachment}`
    const [preview, setPreview] = useState(imageUrl);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
    };

    const handleUpload = async () => {
        if (!file) return alert("Please select a file");
        console.log(file, selectedData?.Machine_Id)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("machineId", selectedData?.Machine_Id);

        const res = await GetMstMachineUpdate_image(formData);

        if (res.success) {
            setRefreshData((prev) => !prev);
            handleClose();
            alert("File uploaded successfully");
        } else {
            alert("Upload failed");
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle fontSize={16}>Machine Image</DialogTitle>

            <DialogContent>
                <Box display="flex" flexDirection="column" alignItems="center">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            style={{ width: 300, height: 200, objectFit: "contain", marginBottom: 16 }}
                        />
                    ) : (
                        <Typography fontSize={14}>No Image Available</Typography>
                    )}

                    <Button variant="contained" size="small" component="label">
                        Upload New Image
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </Button>
                </Box>
            </DialogContent>

            <DialogActions sx={{ pr: 2, pb: 2 }}>
                <Button size="small" variant="contained" color="error" onClick={handleClose}>Cancel</Button>
                <Button size="small" onClick={handleUpload} variant="contained" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};


export default MachineScreen;