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
import SectionHeading from "../../components/Header";
import { AddOrEditProduct, getProductdetails } from "../../controller/PMPDApiService";

const ProductScreen = () => {
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
        { field: "Prod_ID", headerName: "SI No", width: 80 },
        { field: "Name", headerName: "Name", flex: 1 },
        { field: "Type", headerName: "Type", flex: 1 },
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
            ["Name", "Type"].some((key) => {
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
        const fetchData = async () => {
            const response = await getProductdetails()
            console.log("getProductdetails - ", response)
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
                    Product
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
                    {/* <IconButton
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
                    </IconButton> */}

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
                    getRowId={(row) => row.Prod_ID} // Specify a custom id field
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


            <AddDialog open={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData} />
            <AddDialog open={openEditModal} setOpenAddModal={setOpenEditModal} setRefreshData={setRefreshData} editData={editData} />

        </div>
    );
};


const AddDialog = ({ open, setOpenAddModal, setRefreshData, editData }) => {
    const [submitLoading, setSubmitLoading] = useState(false)

    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        Name: Yup.string()
            .required("Product Name is required"),
        Type: Yup.string()
            .required("Type is required"),
        Active_Status: Yup.boolean().required("Active Status is required")
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            Name: editData?.Name || "",
            Type: editData?.Type || "",
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
                        Prod_ID: editData?.Prod_ID,
                        ...values,
                        User_ID: userId
                    }
                    await AddOrEditProduct(payload)
                    alert("✅ Product updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        User_ID: userId
                    }
                    await AddOrEditProduct(payload)
                    alert("✅ Product added successfully!");
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
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    // display: "flex",
                    width: "100%",
                    gap: "15px"
                }}>


                    <TextField
                        id="Name"
                        name="Name"
                        label="Name"
                        fullWidth
                        value={formik.values.Name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Name && Boolean(formik.errors.Name)}
                        helperText={formik.touched.Name && formik.errors.Name}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    />

                    <TextField
                        id="Type"
                        name="Type"
                        label="Type"
                        fullWidth
                        value={formik.values.Type}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.Type && Boolean(formik.errors.Type)}
                        helperText={formik.touched.Type && formik.errors.Type}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    />
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

                {formik.touched.Active_Status && formik.errors.Active_Status && (
                    <div style={{ color: "red", fontSize: 12 }}>{formik.errors.Active_Status}</div>
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


export default ProductScreen;