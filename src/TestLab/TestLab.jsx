import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    Modal,
    Box,
    FormControl,
    InputLabel,
    IconButton,
    Select,
    MenuItem,
    FormControlLabel,
    Radio,
    RadioGroup,
    FormHelperText,
    FormLabel, ListSubheader
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
import { decryptSessionData } from "../controller/StorageUtils";
import { GetTestRigStatusApi } from "../controller/TestLabService";
import AddTestRigStatus from "./AddTestLab";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditTestRigStatus from "./EditTestLab";
import ViewTestRigStatus from "./ViewTestLab";

const TestLabScreen = () => {
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [editRigStatusData, setEditRigStatusData] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [role, setRole] = useState('');
    const [UserID, setUserID] = useState("");

    const [refreshData, setRefreshData] = useState(false)

    const handleEdit = (data) => {
        console.log(data, "data")
        setEditRigStatusData(data)
        setOpenEditModal(true)
    }

    const handleView = (data) => {
        console.log(data, "data")
        setEditRigStatusData(data)
        setOpenViewModal(true)
    }


    const columns = [
        { field: "trn_rig_test_status_id", headerName: "SI No", width: 80 },
        { field: "test_number", headerName: "Test Number", width: 150 },
        { field: "Machine_Name", headerName: "Machine Name", width: 150 },
        { field: "part_description", headerName: "Part Description", width: 220 },
        { field: "test_start_date", headerName: "Test Start Date", width: 180 },
        { field: "test_end_date", headerName: "Test End Date", width: 180 },
        { field: "test_duration", headerName: "Test Duration (day)", width: 180 },
        { field: "operator_name", headerName: "Operator Name", width: 200 },
        {
            field: "test_status", headerName: "Test Status", width: 160, renderCell: (params) => {
                return (<div
                    style={params.value === "Completed" ? {
                        color: "green",
                        fontWeight: "bold"
                    } : {}}
                >
                    {params.value}
                </div >)
            }
        },
        { field: "rig_name", headerName: "Rig Type", width: 160 },
        {
            field: "action", headerName: "Action", width: 160,
            renderCell: (params) => (
                params.row.test_status === "Running" ? (
                    <IconButton
                        color="primary"
                        onClick={() => handleEdit(params.row)}
                        title="Edit"
                    >
                        <EditIcon />
                    </IconButton>
                ) : (
                    <IconButton
                        color="secondary"
                        onClick={() => handleView(params.row)}
                        title="View"
                    >
                        <VisibilityIcon />
                    </IconButton>
                )
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
        // setPlantCode("");
        // setSAPLOGINID("");

        setOpenAddModal(true);
        // get_Plant();
    };

    // ✅ Handle Row Click for Edit

    const handleRowClick = (params) => {
        // setSapID(params.row.SAP_ID)
        // setPlantCode(params.row.Plant_Code);
        // setLast_Punch(params.row.Last_Punch);
        // setSAPLOGINID(params.row.SAP_LOGIN_ID);
        // setEmployeeID(params.row.Employee_ID);
        // setCategory(params.row.Category);
        // console.log("Category from row:", params.row.Category);

        // setUserName(params.row.Employee_Name);
        // setDeptName(params.row.Dept_Name);
        // const statusLabel = params.row.Active_Status === true ? "Active" : "Inactive";
        // setActiveStatus(statusLabel);
        // const category = params.row.Category;
        // setCategory(category);// This ensures category is set

        // setOpenEditModal(true); // Open the modal
        // // get_Company();
    };

    // ✅ Search Functionality
    const handleSearch = () => {
        const text = searchText.trim().toLowerCase();

        const filteredRows = originalRows.filter((row) =>
            ["Machine_Name", "part_description", "test_number", "operator_name", "rig_name"].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };

    const handleUpdate = async () => {
        // const data = {
        //     EmployeeID,
        //     UserName,
        //     SAP_ID,
        //     SAP_LOGIN_ID,
        //     Category,         // ✅ Add this
        //     UserID,
        //     Active_Status: ActiveStatus === "Active" ? 1 : 0,
        // };

        // console.log("Data being sent:", data); // Log data to verify it before sending

        // try {
        //     const response = await getUpdates(data);

        //     // If success
        //     if (response.data.success) {
        //         alert(response.data.message);
        //         getData(); // Refresh data
        //         handleCloseEditModal(); // Close modal
        //     } else {
        //         // If success is false, show the backend message
        //         alert(response.data.message);
        //     }
        // } catch (error) {
        //     console.error("Error details:", error.response?.data);

        //     if (
        //         error.response &&
        //         error.response.data &&
        //         error.response.data.message
        //     ) {
        //         alert(error.response.data.message); // Specific error from backend
        //     } else {
        //         alert("An error occurred while updating the Sap. Please try again.");
        //     }
        // }
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
        const fetchTestRigStatus = async () => {
            const response = await GetTestRigStatusApi()
            setOriginalRows(response)
            setRows(response)
        }
        fetchTestRigStatus()
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
                    Test Lab Rig Running Status
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
                    {isCorp && (
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
                    )}
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
                    getRowId={(row) => row.trn_rig_test_status_id} // Specify a custom id field
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

            <AddTestRigStatus openAddModal={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData} />
            <EditTestRigStatus open={openEditModal} setOpen={setOpenEditModal} editData={editRigStatusData} setRefreshData={setRefreshData} />
            <ViewTestRigStatus open={openViewModal} setOpen={setOpenViewModal} editData={editRigStatusData} />
        </div>
    );
};


export default TestLabScreen;