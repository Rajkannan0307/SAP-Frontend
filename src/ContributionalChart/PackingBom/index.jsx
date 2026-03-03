import React, { useState, useEffect } from "react";
import {
    TextField,
    Button,
    IconButton,
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
import SectionHeading from "../../components/Header";
import AddPackageBomDialog from "../common/AddPackingBom";
import { format, parseISO } from "date-fns";
import { GetPackingBomApi } from "../../controller/ContributionalChartApiService";
import { DownloadIcon, EyeIcon } from "lucide-react";
import EditPackageBomDialog from "../common/EditPackingBom";
import PackingBomBulkUpload from "../common/BulkUploadPackingBom";
import ViewPackingBomChildDialog from "../common/ViewPackingBomChildDialog";
import { CCTypeEnum } from "../../common/enumValues";


// ✅ Custom Toolbar
const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
    </GridToolbarContainer>
);


const CC_PackingBOM = () => {
    const [searchText, setSearchText] = useState("");
    const [rows, setRows] = useState([]);
    const [originalRows, setOriginalRows] = useState([]);
    const [editData, setEditData] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [role, setRole] = useState('');
    const [UserID, setUserID] = useState("");

    const [viewPackChild, setViewPackChild] = useState(false)
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

    const [refreshData, setRefreshData] = useState(false)

    const handleEdit = (data) => {
        console.log(data, "data")
        if (data) {
            setEditData(data)
            setOpenEditModal(true)
        }
    }

    const handleView = (data) => {
        if (data) {
            setEditData(data)
            setViewPackChild(true)
        }
    }


    const columns = [
        {
            field: "pack_mst_id", headerName: "SI No", width: 80,
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        { field: "plant", headerName: "Plant", width: 100 },
        { field: "fg_part_no", headerName: "FG Part", width: 130 },
        { field: "desc", headerName: "Description", flex: 1 },
        { field: "mat_type", headerName: "Mat Type", width: 100 },
        {
            field: "box_qty", headerName: "Box Qty", width: 100, align: "center",
            headerAlign: "center"
        },
        {
            field: "eff_date", headerName: "Eff Date", width: 140,
            renderCell: (params) => params.value ? format(params.value, "dd-MM-yyyy") : ""
        },
        {
            field: "active_status", headerName: "Active Status", width: 140,
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
            field: "action", headerName: "Action", width: 120,
            renderCell: (params) => (
                <>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(params.row)}
                        title="Edit"
                    >
                        <EditIcon fontSize="12px" />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleView(params.row)}
                        title="view"
                    >
                        <EyeIcon fontSize="12px" />
                    </IconButton>
                </>
            ),
        },
    ];

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
            ['plant', 'fg_part_no', 'eff_date'].some((key) => {
                const value = row[key];
                return value?.toString().toLowerCase().includes(text);
            })
        );

        setRows(text ? filteredRows : originalRows);
    };

    useEffect(() => {
        const fetchData = async () => {
            const response = await GetPackingBomApi({ type: CCTypeEnum.PK })
            console.log("GetPackingBomApi - ", response?.data)
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
                    Packing BOM
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
                <div className="flex justify-center items-center gap-2">
                    {/* <IconButton
                        size="large"
                        color="primary"
                        // onClick={() => DownloadDocumentAllExcel(params.row.Doc_ID)} // ✅ only pass the docId
                        title="Download"
                    >
                        <DownloadIcon fontSize="small" />
                    </IconButton> */}
                    <PackingBomBulkUpload
                        open={bulkUploadOpen}
                        onClose={() => setBulkUploadOpen(false)}
                        onOpen={() => setBulkUploadOpen(true)}
                        setRefreshData={setRefreshData}
                        CCType={CCTypeEnum.PK}
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
                    getRowId={(row) => row.pack_mst_id} // Specify a custom id field
                    disableSelectionOnClick
                    slots={{ toolbar: CustomToolbar }}
                    columnHeaderHeight={35}
                    rowHeight={35}
                    // getRowHeight={(p) => "auto"}
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
                    }}
                />
            </div>

            <AddPackageBomDialog open={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData}
                CCType={CCTypeEnum.PK}
                title={"Packing BOM"}
            />
            <EditPackageBomDialog open={openEditModal} setOpenAddModal={setOpenEditModal} setRefreshData={setRefreshData} editData={editData}
                CCType={CCTypeEnum.PK}
                title={"Packing BOM"}
            />
            <ViewPackingBomChildDialog open={viewPackChild} setOpenAddModal={setViewPackChild} packingBomData={editData}
                CCType={CCTypeEnum.PK}
                title={"Packing BOM"}
            />
        </div>
    );
};

export default CC_PackingBOM;