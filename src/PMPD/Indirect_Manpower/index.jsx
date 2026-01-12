import { useState, useEffect, useContext } from "react";
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
    Switch
} from "@mui/material";
import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { decryptSessionData } from "../../controller/StorageUtils";
import EditIcon from "@mui/icons-material/Edit";
import { useFormik } from "formik";
import { CommonMuiStyles } from "../../Styles/CommonStyles";
import * as Yup from "yup"
import SectionHeading from "../../components/Header";
import { AddMstCategoryBreakup, AddOrEditProductMapping, AddTrnIndirectManpower, getMstCategoryBreakupDetails, getMstIndirectCategoryDetails, getProductdetails, getProductMappingdetails, getTrnIndirectManPower } from "../../controller/PMPDApiService";
import { format, isValid } from "date-fns";
import { getDepartmentdetails, getPlantdetails } from "../../controller/CommonApiService";
import { AuthContext } from "../../Authentication/AuthContext";
import { getPMPDAccess } from "../../Authentication/ActionAccessType";
import { DHRM_DeptHeaderMst } from "../../controller/DHRMApiService";

const IndirectManpowerScreen = () => {
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

    const { user } = useContext(AuthContext);
    const currentUserPlantCode = user.PlantCode

    const PMPDAccess = getPMPDAccess()

    const handleEdit = (data) => {
        console.log(data, "data")
        setEditData(data)
        setOpenEditModal(true)
    }

    const columns = [
        { field: "indirect_manpower_id", headerName: "SI No", width: 80 },
        { field: "plant_code", headerName: "Plant", width: 150 },
        { field: "dept_name", headerName: "Department", flex: 1 },
        { field: "indirect_category", headerName: "Indirect Category", flex: 1 },
        { field: "hc_no", headerName: "PLAN HC", width: 100 },
        { field: "Department_Header", headerName: "DHRM Dept Header", flex: 1 },
        {
            field: "effective_date",
            headerName: "Eff Date",
            flex: 1,
            renderCell: (params) => params.value ? format(params.value, "dd-MM-yyyy") : ""
        },
        {
            field: "action", headerName: "Action",
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
            ["plant_code", "dept_name", "indirect_category"].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };



    useEffect(() => {
        const fetchData = async () => {
            const response = PMPDAccess.disableAction
                ? await getTrnIndirectManPower(currentUserPlantCode)
                : await getTrnIndirectManPower()
            console.log("getTrnIndirectManPower - ", response)
            setOriginalRows(response || [])
            setRows(response || [])
        }
        fetchData()
    }, [refreshData])


    const hc_count = originalRows?.reduce(
        (sum, row) => sum + Number(row?.hc_no || 0),
        0
    ) || 0;

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
                    Indirect Manpower
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
                <div className="flex justify-center items-center gap-4">
                    <div className="bg-white rounded-md shadow-sm border flex gap-3 w-fit p-2">
                        <div className="text-xs text-gray-500">Total HC Count</div>
                        <div className="text-xs font-semibold text-gray-900">
                            {hc_count}
                        </div>
                    </div>

                    <IconButton
                        onClick={handleOpenAddModal}
                        style={{
                            borderRadius: "50%",
                            backgroundColor: "#0066FF",
                            color: "white",
                            width: "40px",
                            height: "40px",
                            display: PMPDAccess.disableAction ? "none" : null,
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
                    getRowId={(row) => row.indirect_manpower_id} // Specify a custom id field
                    disableSelectionOnClick
                    slots={{ toolbar: CustomToolbar }}
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                Department_Header: false
                            }
                        }
                    }}
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
    const [department, setDepartment] = useState([])
    const [indirectCategory, setIndirectCategory] = useState([])
    const [dhrmDeptHeaderMst, setDhrmDeptHeaderMst] = useState([])

    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        plant: Yup.string().required("Required"),
        dept: Yup.string().required("Required"),
        indirect_category: Yup.string().required("Required"),
        hc_no: Yup.string().required("Required"),
        dhrm_mst_dh_id: Yup.string().required("Required"),
        effective_date: Yup.string().required("Required")
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: editData?.plant || "",
            dept: editData?.dept || "",
            indirect_category: editData?.indirect_cat_id || "",
            hc_no: editData?.hc_no || "",
            dhrm_mst_dh_id: editData?.dhrm_mst_dh_id || "",
            effective_date: editData?.effective_date ? format(editData?.effective_date, "yyyy-MM-dd") : "",
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
                        indirect_manpower_id: editData?.indirect_manpower_id,
                        ...values,
                        user_id: userId
                    }
                    await AddTrnIndirectManpower(payload)
                    alert("✅ Indirect Manpower updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        user_id: userId
                    }
                    await AddTrnIndirectManpower(payload)
                    alert("✅ Indirect Manpower added successfully!");
                }
                setRefreshData((prev) => !prev)
                handleClose()
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert(error?.response?.data?.message ? `❌ ${error?.response?.data?.message}` : "❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });

    useEffect(() => {
        const fetchInitData = async () => {
            const response = await getPlantdetails()
            console.log('Plants', response)
            setPlants(response)

            const deptResponse = await getDepartmentdetails()
            console.log('Department', deptResponse)
            setDepartment(deptResponse)


            const dhrmDeptRes = await DHRM_DeptHeaderMst()
            console.log("DHRM Department", dhrmDeptHeaderMst)
            setDhrmDeptHeaderMst(dhrmDeptRes)
        }
        if (open) fetchInitData()

    }, [open])

    useEffect(() => {
        const fetchData = async () => {
            const IndirecCategoryResponse = await getMstIndirectCategoryDetails(formik.values.plant, formik.values.dept)
            console.log('IndirecCategoryResponse', IndirecCategoryResponse)
            setIndirectCategory(IndirecCategoryResponse)
        }
        if (formik.values.plant && formik.values.dept) fetchData()
    }, [formik.values.plant, formik.values.dept])



    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {`${editData ? "Edit" : "Add"} Category Breakup`}
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
                        id="plant"
                        name="plant"
                        label="Plant"
                        fullWidth
                        value={formik.values.plant}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.plant && Boolean(formik.errors.plant)}
                        helperText={formik.touched.plant && formik.errors.plant}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {plants?.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Plant_Code}>
                                {`${option.Plant_Code} - ${option.Plant_Name}`}
                            </MenuItem>
                        )) || []}
                    </TextField>

                    <TextField
                        select
                        id="dept"
                        name="dept"
                        label="Department"
                        fullWidth
                        value={formik.values.dept}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.dept && Boolean(formik.errors.dept)}
                        helperText={formik.touched.dept && formik.errors.dept}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {department?.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Dept_ID}>
                                {`${option.Dept_Name}`}
                            </MenuItem>
                        )) || []}
                    </TextField>

                    <TextField
                        select
                        id="dhrm_mst_dh_id"
                        name="dhrm_mst_dh_id"
                        label="DHRM Department"
                        fullWidth
                        value={formik.values.dhrm_mst_dh_id}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.dhrm_mst_dh_id && Boolean(formik.errors.dhrm_mst_dh_id)}
                        helperText={formik.touched.dhrm_mst_dh_id && formik.errors.dhrm_mst_dh_id}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {dhrmDeptHeaderMst?.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.Dh_Id}>
                                {`${option.Department_Header}`}
                            </MenuItem>
                        )) || []}
                    </TextField>

                    <TextField
                        select
                        id="indirect_category"
                        name="indirect_category"
                        label="Indirect Category"
                        fullWidth
                        value={formik.values.indirect_category}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.indirect_category && Boolean(formik.errors.indirect_category)}
                        helperText={formik.touched.indirect_category && formik.errors.indirect_category}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    >
                        {indirectCategory?.map((option, i) => (
                            <MenuItem sx={{ fontSize: 12 }} key={i} value={option.indirect_cat_id}>
                                {`${option.category}`}
                            </MenuItem>
                        )) || []}
                    </TextField>

                    <TextField
                        id="hc_no"
                        name="hc_no"
                        label="HC NO"
                        fullWidth
                        type='number'
                        value={formik.values.hc_no}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.hc_no && Boolean(formik.errors.hc_no)}
                        helperText={formik.touched.hc_no && formik.errors.hc_no}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                    />

                    <TextField
                        id="effective_date"
                        name="effective_date"
                        label="Effective Date"
                        fullWidth
                        type="date"
                        value={formik.values.effective_date}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.effective_date && Boolean(formik.errors.effective_date)}
                        helperText={formik.touched.effective_date && formik.errors.effective_date}
                        sx={{
                            ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 200,
                            mt: 1
                        }}
                        slotProps={{
                            inputLabel: {
                                shrink: true
                            }
                        }}
                    />
                </div>

            </DialogContent>
            <DialogActions sx={{ p: 0, py: 2, pr: 3 }}>
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


export default IndirectManpowerScreen;