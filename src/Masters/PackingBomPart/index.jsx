import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    TextField,
    Button,
    IconButton,
    MenuItem,
    FormControlLabel,
    Dialog,
    Switch,
    Box,
    Chip,
    CircularProgress,
    Typography,
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
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadMuiIcon from "@mui/icons-material/CloudUpload";
import { useFormik } from "formik";
import * as Yup from "yup"
import { api } from "../../controller/constants";
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { AddMstPackingPartBULK, AddOrEditPackingPart, GetPackingPartApi } from "../../controller/ContributionalChartApiService";
import { getMyPlants, myPlantLabel } from "../../controller/CommonApiService";
import { findPlantsNotAllowed, plantsNotAllowedMessage } from "../../common/plantFileCheck";
import FilterSelect from "../../components/FilterSelect";
import UniqueGroupingInfo from "../../components/UniqueGroupingInfo";
import { FilterToggleButton, FilterPanel } from "../../components/FilterPanel";
import {
    compactFieldSx,
    compactMenuProps,
    compactGridSx,
    primaryButtonSx,
    outlineButtonSx,
} from "../../components/compactUi";
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getMaterialType, getProductSegments } from "../../controller/Masterapiservice";
import { getdetails as getLines } from "../../controller/LineMasterapiservice";
import LineSelect from "../../components/LineSelect";
import { MaterialGroupEnumTypes } from "../../common/enumValues";

const DIALOG_FIELD_SX = compactFieldSx("100%", 12);

// Shell of the Add / Edit / Upload dialogs (same as the Vendor Master / User Master)
const FormDialog = ({ open, title, onClose, children, actions, width = 460 }) => (
    <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{ sx: { width, maxWidth: "94vw", borderRadius: "10px" } }}
    >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid #e8eaee", backgroundColor: "#f3f7ff" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1a2233" }}>{title}</Typography>
            <IconButton size="small" onClick={onClose}>
                <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
        </Box>
        <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px 12px", maxHeight: "72vh", overflowY: "auto" }}>{children}</Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, py: 1.25, borderTop: "1px solid #e8eaee" }}>{actions}</Box>
    </Dialog>
);

const CC_PackingBomPart = () => {
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

    // Only the plants this user may use (own plant + User Master > Data Access) - the same list and rule as Vendor Master,
    // Material Master (Direct), Material - Vendor Mapping and the Manufacturing BOM
    const [plants, setPlants] = useState([])
    const [loading, setLoading] = useState(true)
    // Plant: the dropdown holds the selection (starts on the user's own login plant), the Search button applies it
    const [plantSelect, setPlantSelect] = useState("All")
    const [fPlant, setFPlant] = useState("All") // applied plant
    const plantDefaulted = useRef(false)
    // filters (the search box works on the same rows)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [fType, setFType] = useState("All")
    const [fLine, setFLine] = useState("All")
    const [fSegment, setFSegment] = useState("All")
    const [fStatus, setFStatus] = useState("All")

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
        { field: "Material_ID", headerName: "SI No", width: 70 },
        { field: "Plant_Code", headerName: "Plant", flex: 0.6, minWidth: 70 },
        { field: "Material_Code", headerName: "Part No", flex: 1, minWidth: 110 },
        { field: "Description", headerName: "Description", flex: 1.6, minWidth: 150 },
        { field: "uom", headerName: "UOM", flex: 0.5, minWidth: 60 },
        { field: "Material_Type", headerName: "Material Type", flex: 0.8, minWidth: 90 },
        { field: "Line_Name", headerName: "Line", flex: 0.9, minWidth: 90 },
        { field: "Segment_Name", headerName: "Segment", flex: 0.8, minWidth: 90 },
        {
            field: "Active_Status", headerName: "Status", flex: 0.7, minWidth: 80,
            valueFormatter: (value) => (value === true || value === "1" ? "Active" : "Inactive"),
            renderCell: (params) => {
                const isActive = params.value === true || params.value === "1";
                return (
                    <Chip
                        size="small"
                        label={isActive ? "Active" : "Inactive"}
                        sx={{
                            height: 20,
                            fontSize: 10.5,
                            fontWeight: 700,
                            backgroundColor: isActive ? "#eafaf1" : "#fdeeee",
                            color: isActive ? "#1b7a43" : "#b42323",
                        }}
                    />
                );
            },
        },
        {
            field: "action", headerName: "Action", width: 80, sortable: false, filterable: false, disableColumnMenu: true,
            align: "center", headerAlign: "center",
            renderCell: (params) => (
                <IconButton
                    color="primary"
                    size="small"
                    onClick={() => handleEdit(params.row)}
                    title="Edit"
                >
                    <EditIcon sx={{ fontSize: 18 }} />
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

    // The user's own login plant (Is_Default, the first one in the list) is selected and applied once, as soon as the
    // plant list is loaded; after that the user can switch to any other plant (or All) and press Search.
    useEffect(() => {
        getMyPlants()
            .then((res) => setPlants(Array.isArray(res) ? res : []))
            .catch((error) => console.error("Failed to load Plant list.", error))
    }, [])

    useEffect(() => {
        if (plantDefaulted.current || plants.length === 0) return
        plantDefaulted.current = true
        const own = plants.find((p) => Number(p.Is_Default) === 1) || plants[0]
        const label = myPlantLabel(own)
        setPlantSelect(label)
        setFPlant(label)
    }, [plants])

    // Search: apply the selected plant and reload the list
    const handleSearch = () => {
        setFPlant(plantSelect)
        setRefreshData((prev) => !prev)
    };

    // Same rule as the Manufacturing BOM: only the materials of the plants this user may use (until the plant list is
    // loaded - or if it cannot be loaded - nothing is shown, never other plants' rows)
    const scopedData = useMemo(() => {
        const allowed = new Set(plants.map((p) => String(p.Plant_Code)))
        return (originalRows || []).filter((row) => allowed.has(String(row.Plant_Code)))
    }, [originalRows, plants])
    // The Plant filter shows "1150 - RML P4 (RML)" (same label as the Manufacturing BOM) and filters by the plant code
    const plantFilterCode = fPlant === "All" ? null : String(plants.find((p) => myPlantLabel(p) === fPlant)?.Plant_Code ?? "")

    // Search box + panel filters, applied live to the loaded materials
    const visibleRows = useMemo(() => {
        const text = searchText.trim().toLowerCase()
        return scopedData.filter((row) => {
            if (plantFilterCode !== null && String(row.Plant_Code) !== plantFilterCode) return false
            if (fType !== "All" && row.Material_Type !== fType) return false
            if (fLine !== "All" && row.Line_Name !== fLine) return false
            if (fSegment !== "All" && row.Segment_Name !== fSegment) return false
            if (fStatus !== "All" && (fStatus === "Active") !== (row.Active_Status === true || row.Active_Status === "1")) return false
            if (!text) return true
            return ["Material_Type", "uom", "Description", "Material_Code", "Plant_Code", "Segment_Name", "Line_Name"].some((key) => {
                const value = row[key]
                return value?.toString().toLowerCase().includes(text)
            })
        })
    }, [scopedData, searchText, plantFilterCode, fType, fLine, fSegment, fStatus])
    const uniq = (key) => [...new Set(scopedData.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort()
    // the Plant filter sits in front of the search box (always visible); the badge / "Clear filters" are for the panel filters
    const activeFilterCount = [fType, fLine, fSegment, fStatus].filter((v) => v !== "All").length
    const clearFilters = () => { setFType("All"); setFLine("All"); setFSegment("All"); setFStatus("All") }
    // the Add dialog starts on the plant being viewed (or the user's own plant when All is shown)
    const defaultPlant = (plantFilterCode !== null && plants.find((p) => String(p.Plant_Code) === plantFilterCode))
        || plants.find((p) => Number(p.Is_Default) === 1)
        || null


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
            setLoading(true)
            try {
                const response = await GetPackingPartApi()
                console.log("GetPackingPartApi - ", response)
                setOriginalRows(response || [])
                setRows(response || [])
            } catch (error) {
                console.error(error)
                setOriginalRows([])
                setRows([])
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [refreshData])


    return (
        <div
            style={{
                padding: "20px 20px",
                backgroundColor: "#F5F5F5",
                marginTop: "50px",
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 50px)",
            }}
        >
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>
                Indirect Material Master
            </Typography>

            {/* Search, filters and actions */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e8eaee",
                    boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
                    padding: "7px 10px",
                    marginBottom: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                }}
            >
                <FilterSelect label="Plant" value={plantSelect} options={plants.map(myPlantLabel)} onChange={setPlantSelect} minWidth={190} />
                <Button
                    onClick={handleSearch}
                    disabled={loading}
                    variant="contained"
                    disableElevation
                    startIcon={loading ? <CircularProgress size={12} color="inherit" /> : <SearchIcon sx={{ fontSize: 16 }} />}
                    sx={primaryButtonSx}
                >
                    {loading ? "Loading..." : "Search"}
                </Button>
                <TextField
                    size="small"
                    placeholder="Search plant, part no, description, line, segment"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
                    sx={compactFieldSx(300)}
                />
                <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
                    {visibleRows.length === scopedData.length ? `${scopedData.length} materials` : `${visibleRows.length} of ${scopedData.length} materials`}
                </span>
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
                <Button
                    onClick={handleOpenAddModal}
                    variant="contained"
                    disableElevation
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    sx={primaryButtonSx}
                >
                    Add Material
                </Button>
                <UniqueGroupingInfo
                    sections={[{ fields: ["Plant", "Part No (Material Code)"] }]}
                    intro="One material per combination of:"
                    notes={[
                        <><b>Add:</b> the same Plant + Part No (Material Code) that already exists is rejected.</>,
                        <><b>Bulk upload:</b> the same combination is <b>updated</b>, any other is <b>added</b>. A blank Line / Segment cell keeps the saved value.</>,
                    ]}
                />

                <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
                    <FilterSelect label="Material Type" value={fType} options={uniq("Material_Type")} onChange={setFType} minWidth={150} />
                    <FilterSelect label="Line" value={fLine} options={uniq("Line_Name")} onChange={setFLine} minWidth={170} />
                    <FilterSelect label="Segment" value={fSegment} options={uniq("Segment_Name")} onChange={setFSegment} minWidth={150} />
                    <FilterSelect label="Status" value={fStatus} options={["Active", "Inactive"]} onChange={setFStatus} minWidth={120} isSearchable={false} />
                </FilterPanel>
            </div>

            {/* DataGrid */}
            <div
                style={{
                    flexGrow: 1,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    border: "1px solid #e8eaee",
                    boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                <DataGrid
                    rows={visibleRows}
                    columns={columns}
                    loading={loading}
                    getRowId={(row) => row.Material_ID}
                    disableRowSelectionOnClick
                    columnHeaderHeight={36}
                    rowHeight={38}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    pageSizeOptions={[25, 50, 100]}
                    slots={{ toolbar: CustomToolbar }}
                    localeText={{ noRowsLabel: "No materials found." }}
                    sx={compactGridSx}
                />
            </div>


            <AddDialog open={openAddModal} setOpenAddModal={setOpenAddModal} setRefreshData={setRefreshData} defaultPlantId={defaultPlant ? defaultPlant.Plant_ID : ""} />
            <AddDialog open={openEditModal} setOpenAddModal={setOpenEditModal} setRefreshData={setRefreshData} editData={editData} />

        </div>
    );
};


const AddDialog = ({ open, setOpenAddModal, setRefreshData, editData, defaultPlantId = "" }) => {
    const [submitLoading, setSubmitLoading] = useState(false)
    const [plants, setPlants] = useState([])
    const [materialType, setMaterialType] = useState([])
    const [lines, setLines] = useState([])
    const [segments, setSegments] = useState([])

    const handleClose = () => {
        setOpenAddModal(false)
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        Plant_ID: Yup.string().required('Required'),
        Material_Code: Yup.string().required('Required'),
        Description: Yup.string().required('Required'),
        uom: Yup.string().required('Required'),
        Material_Type: Yup.string().required('Required'),
        Active_Status: Yup.string().required('Required'),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            Plant_ID: editData?.Plant_ID || defaultPlantId || "",
            Material_Code: editData?.Material_Code || "",
            Description: editData?.Description || "",
            uom: editData?.uom || "",
            Material_Type: editData?.Material_Type || "",
            Active_Status: editData?.Active_Status ?? true,
            Line_ID: editData?.Line_ID || "",
            // optional product segment (Mst_Product_Segment); "" = none
            Prod_Seg_ID: editData?.prod_seg_id || "",
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
                        Material_ID: editData?.Material_ID,
                        ...values,
                        userId: userId
                    }
                    await AddOrEditPackingPart(payload)
                    alert("✅ Packing Part updated successfully!");
                } else {
                    const payload = {
                        ...values,
                        userId: userId
                    }
                    await AddOrEditPackingPart(payload)
                    alert("✅ Packing Part added successfully!");
                }
                setRefreshData((prev) => !prev)
                handleClose()
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert(error?.response?.data?.error ? `❌ ${error?.response?.data?.error}` : "❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });



    useEffect(() => {
        const fetchData = async () => {
            // only the plants this user may use (own + Data Access)
            const response2 = await getMyPlants()
            console.log(response2, "Plants")
            setPlants(Array.isArray(response2) ? response2 : [])

            const response3 = await getMaterialType(MaterialGroupEnumTypes.indirect)
            console.log(response3.data, 'Material Type')
            setMaterialType(response3.data)

            const response4 = await getLines()
            setLines((response4 || []).filter((l) => l.Active_Status))

            const response5 = await getProductSegments()
            setSegments(response5.data || [])
        }
        if (open) fetchData()

    }, [open])

    // Lines scoped to the currently selected Plant — both Mst_Line and
    // Mst_Material store Plant_ID directly here, so this filter is safe.
    // Empty until a Plant is actually picked — not "show everything until
    // narrowed down" — same convention as Line Master's Module dropdown.
    const lineOptions = formik.values.Plant_ID
        ? lines.filter((l) => String(l.Plant_ID) === String(formik.values.Plant_ID))
        : [];

    // Segment dropdown: the active segments (+ the material's own segment when it is no longer an active one)
    const segmentOptions = [
        ...(editData?.prod_seg_id && !segments.some((x) => String(x.prod_seg_id) === String(editData.prod_seg_id))
            ? [{ prod_seg_id: editData.prod_seg_id, seg_name: editData.Segment_Name || String(editData.prod_seg_id) }]
            : []),
        ...segments,
    ]

    return (
        <FormDialog
            open={open}
            onClose={handleClose}
            title={`${editData ? "Edit" : "Add"} Packing Part`}
            actions={
                <>
                    <Button variant="outlined" onClick={handleClose} sx={outlineButtonSx}>Cancel</Button>
                    <Button variant="contained" disableElevation onClick={formik.handleSubmit} sx={{ ...primaryButtonSx, minWidth: 70 }}>
                        {submitLoading ? "Loading..." : editData ? "Update" : "Add"}
                    </Button>
                </>
            }
        >
            <TextField
                select
                size="small"
                label="Plant"
                name="Plant_ID"
                value={formik.values.Plant_ID}
                onChange={(e) => {
                    formik.handleChange(e);
                    formik.setFieldValue('Line_ID', ''); // previous plant's line no longer valid
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.Plant_ID && Boolean(formik.errors.Plant_ID)}
                helperText={formik.touched.Plant_ID && formik.errors.Plant_ID}
                disabled={Boolean(editData)} // Plant is locked during Edit - existing value stays unchanged
                sx={DIALOG_FIELD_SX}
                SelectProps={{ MenuProps: compactMenuProps(12) }}
            >
                {plants.map((p) => (
                    <MenuItem sx={{ fontSize: 12 }} key={p.Plant_ID} value={p.Plant_ID}>
                        {myPlantLabel(p)}
                    </MenuItem>
                ))}
            </TextField>

            <TextField
                id="Material_Code"
                name="Material_Code"
                label="Part No"
                size="small"
                value={formik.values.Material_Code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.Material_Code && Boolean(formik.errors.Material_Code)}
                helperText={formik.touched.Material_Code && formik.errors.Material_Code}
                sx={DIALOG_FIELD_SX}
            />

            <TextField
                id="Description"
                name="Description"
                label="Description"
                size="small"
                value={formik.values.Description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.Description && Boolean(formik.errors.Description)}
                helperText={formik.touched.Description && formik.errors.Description}
                sx={DIALOG_FIELD_SX}
            />

            <TextField
                id="uom"
                name="uom"
                label="UOM ( Unit Of Measurement )"
                size="small"
                value={formik.values.uom}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.uom && Boolean(formik.errors.uom)}
                helperText={formik.touched.uom && formik.errors.uom}
                sx={DIALOG_FIELD_SX}
            />

            <TextField
                select
                id="Material_Type"
                name="Material_Type"
                label="Material Type"
                size="small"
                value={formik.values.Material_Type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.Material_Type && Boolean(formik.errors.Material_Type)}
                helperText={formik.touched.Material_Type && formik.errors.Material_Type}
                sx={DIALOG_FIELD_SX}
                SelectProps={{ MenuProps: compactMenuProps(12) }}
            >
                {materialType.map((p) => (
                    <MenuItem sx={{ fontSize: 12 }} key={p.Mat_Type} value={p.Mat_Type}>
                        {`${p.Mat_Type}`}
                    </MenuItem>
                ))}
            </TextField>

            <LineSelect
                value={formik.values.Line_ID}
                options={lineOptions}
                onChange={(id) => formik.setFieldValue("Line_ID", id)}
                disabled={!formik.values.Plant_ID}
                size="compact"
            />

            <TextField
                select
                id="Prod_Seg_ID"
                name="Prod_Seg_ID"
                label="Segment"
                size="small"
                value={formik.values.Prod_Seg_ID}
                onChange={formik.handleChange}
                sx={DIALOG_FIELD_SX}
                SelectProps={{ MenuProps: compactMenuProps(12) }}
            >
                <MenuItem sx={{ fontSize: 12 }} value=""><em>None</em></MenuItem>
                {segmentOptions.map((x) => (
                    <MenuItem sx={{ fontSize: 12 }} key={x.prod_seg_id} value={x.prod_seg_id}>
                        {x.seg_name}
                    </MenuItem>
                ))}
            </TextField>

            <Box sx={{ gridColumn: "span 2" }}>
                <FormControlLabel
                    sx={{ m: 0, "& .MuiFormControlLabel-label": { fontSize: 12, fontWeight: 700, color: formik.values.Active_Status ? "#2e7d32" : "#d32f2f" } }}
                    control={
                        <Switch
                            size="small"
                            checked={formik.values.Active_Status}
                            onChange={(e) => formik.setFieldValue("Active_Status", e.target.checked)}
                            color="success"
                            sx={{
                                "& .MuiSwitch-track": { backgroundColor: formik.values.Active_Status ? "#2e7d32" : "#d32f2f", opacity: 0.55 },
                                "& .MuiSwitch-thumb": { backgroundColor: formik.values.Active_Status ? "#2e7d32" : "#d32f2f" },
                            }}
                        />
                    }
                    label={formik.values.Active_Status ? "Active" : "Inactive"}
                />
                {formik.touched.Active_Status && formik.errors.Active_Status && (
                    <div style={{ color: "red", fontSize: 12 }}>{formik.errors.Active_Status}</div>
                )}
            </Box>
        </FormDialog>
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
    const [lines, setLines] = useState([])
    const [segments, setSegments] = useState([])

    useEffect(() => {
        const fetchLines = async () => {
            const response = await getLines()
            setLines((response || []).filter((l) => l.Active_Status))
            const segmentResponse = await getProductSegments()
            setSegments(segmentResponse.data || [])
        }
        if (open) fetchLines()
    }, [open])

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


    async function downloadProductionPlanTemplate() {

        const headerColumns = [
            'plant',
            'part_no',
            'description',
            'uom',
            'material_type',
            'line_name',
            'segment'
        ];

        // 1️⃣ Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "PACKING_PART";
        workbook.created = new Date();

        // 2️⃣ Add worksheet
        const worksheet = workbook.addWorksheet("PACKING_PART");

        // 3️⃣ Add header row
        worksheet.addRow(headerColumns);

        // 4️⃣ Style header (optional but recommended)
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFADD8E6" },
            };
        });

        // 5️⃣ Set column widths (positional — matches headerColumns above)
        worksheet.columns = [
            { width: 15 }, // plant
            { width: 20 }, // part_no
            { width: 25 }, // description
            { width: 12 }, // uom
            { width: 18 }, // material_type
            { width: 20 }, // line_name (optional)
            { width: 16 }, // segment (optional)
        ];

        // 6️⃣ Freeze header row
        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        // segment (optional): the name of an active segment of the Segment Master - dropdown; blank = no segment
        worksheet.getCell("G1").note = "Optional: the segment name from the dropdown. Blank = no segment (an existing material keeps its segment).";
        const segmentNames = (segments || []).map((x) => x.seg_name).filter(Boolean);
        if (segmentNames.length) {
            worksheet.dataValidations.add("G2:G1000", { type: "list", allowBlank: true, formulae: [`"${segmentNames.join(",")}"`] });
        }

        // line_name has no dropdown (list is large and keeps growing) —
        // instead a second VISIBLE sheet lists every Plant + Line so the
        // user can look up the exact spelling and type it into line_name
        // on the main sheet themselves.
        if ((lines || []).length) {
            const lookupSheet = workbook.addWorksheet("All Lines (reference)");
            lookupSheet.addRow(["Plant_Code", "Line_Name"]);
            lookupSheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true };
                cell.alignment = { horizontal: "center" };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFADD8E6" } };
            });
            lookupSheet.columns = [{ width: 14 }, { width: 30 }];
            lookupSheet.views = [{ state: "frozen", ySplit: 1 }];
            lines.forEach((l) => {
                lookupSheet.addRow([l.Plant_Code, l.Line_Name]);
            });
        }

        // 7️⃣ Write & download file
        const buffer = await workbook.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            "PACKING_PART_Template.xlsx"
        );
    }


    const handleUploadData = async () => {
        if (!uploadedFile) {
            return alert('Upload file not found')
        }

        if (isUploading) return
        setIsUploading(true)
        try {
            // Only plants this user may use (own + Data Access): check the plant column of the file before uploading
            const { blocked, plants: myPlants } = await findPlantsNotAllowed(uploadedFile, "plant")
            if (blocked.length > 0) {
                alert(plantsNotAllowedMessage(blocked, myPlants))
                setIsUploading(false)
                return
            }
            const formData = new FormData()
            const userId = localStorage.getItem('EmpId')
            formData.append("userId", userId)
            formData.append("file", uploadedFile)
            const response = await AddMstPackingPartBULK(formData)
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

    return (
        <>
            <Button
                onClick={() => {
                    if (onOpen) onOpen()
                }}
                variant="outlined"
                disableElevation
                startIcon={<CloudUploadMuiIcon sx={{ fontSize: 16 }} />}
                sx={outlineButtonSx}
            >
                Upload
            </Button>

            <FormDialog
                open={open}
                onClose={handleClose}
                title="Indirect Material Master Excel Upload"
                width={uploadResponse ? 760 : 460}
                actions={
                    <>
                        <Button variant="outlined" onClick={handleClose} sx={outlineButtonSx}>Close</Button>
                        <Button variant="contained" disableElevation onClick={handleUploadData} disabled={isUploading} sx={{ ...primaryButtonSx, minWidth: 70 }}>
                            {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                    </>
                }
            >
                <Box sx={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 1.25 }}>
                    <Box>
                        <Button
                            variant="outlined"
                            onClick={downloadProductionPlanTemplate}
                            startIcon={<FaDownload size={12} />}
                            sx={outlineButtonSx}
                        >
                            {loadingTemplate ? "Loading..." : "Download Template"}
                        </Button>
                    </Box>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        style={{
                            fontSize: 11,
                            padding: "6px 8px",
                            backgroundColor: "#fafbfc",
                            border: "1px dashed #dde1e7",
                            borderRadius: 6,
                            cursor: "pointer",
                        }}
                    />
                    <span style={{ fontSize: 11, lineHeight: 1.5, color: "#6b7280" }}>
                        Columns: plant, part_no, description, uom, material_type and the optional line_name and segment.
                        A part that already exists is updated; a new one is added. A blank line_name / segment keeps the saved value.
                    </span>
                    {/* Upload Status */}
                    {uploadResponse && <ValidationResult response={uploadResponse} />}
                </Box>
            </FormDialog>
        </>
    );
};


const ValidationResult = ({ response }) => {
    const { summary, errors } = response;

    return (
        <div className="p-4 bg-red-50 rounded-lg border border-red-300">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
                ❌ Upload Failed – Validation Errors
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div>Total Rows: <b>{summary.totalRows}</b></div>
                <div className="text-green-600">Valid: <b>{summary.valid}</b></div>
                <div className="text-red-600">Invalid: <b>{summary.invalid}</b></div>
                <div className="text-yellow-600">Empty: <b>{summary.empty}</b></div>
            </div>

            {/* Invalid rows */}
            {errors?.invalidRows?.length > 0 && (
                <>
                    <h3 className="font-semibold mb-2">❌ Invalid Rows</h3>

                    <table className="w-full border text-sm">
                        <thead className="bg-red-100">
                            <tr>
                                <th className="border px-2 py-1">Excel Row</th>
                                <th className="border px-2 py-1">Errors</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errors.invalidRows.map((row, i) => (
                                <tr key={i} className="hover:bg-red-50">
                                    <td className="border px-2 py-1 text-center">
                                        {row.row}
                                    </td>
                                    <td className="border px-2 py-1">
                                        <ul className="list-disc pl-4">
                                            {row.errors.map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Empty rows */}
            {errors?.emptyRows?.length > 0 && (
                <div className="mt-4 text-yellow-700">
                    ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
                </div>
            )}
        </div>
    );
}

export default CC_PackingBomPart;