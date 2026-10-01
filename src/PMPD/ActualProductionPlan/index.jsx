import React, { useContext, useEffect, useState } from 'react'
import SectionHeading from '../../components/Header'
import { Box, Button, CircularProgress, IconButton, MenuItem, Modal, TextField, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { CloudUploadIcon, EditIcon, SearchIcon } from 'lucide-react'
import { PiUploadDuotone } from 'react-icons/pi'
import { FaDownload, FaUpload } from 'react-icons/fa6'
import { deepPurple } from '@mui/material/colors';
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getPlantdetails } from '../../controller/CommonApiService'
import { AddTrnActualProdPlan_BULK, downloadTrnActualProdPlanExcel, fetchProdDataMB51, getTrnActualProdPlan } from '../../controller/PMPDApiService'
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid'
import { format, isValid } from 'date-fns'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { getPMPDAccess } from '../../Authentication/ActionAccessType'
import { AuthContext } from '../../Authentication/AuthContext'
import ValidationResponseGrid from '../../components/ValidationResponseTable'
import DateRangeDownloadDialog from '../../components/DateRangeDownloadDialog'

// Month/Year filter helpers - the month converts to the Start/End date range
// the backend expects (plain 'YYYY-MM-DD' strings, no timezone involved).
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const padNum = (n) => String(n).padStart(2, '0')
const monthStartStr = (year, month) => `${year}-${padNum(month)}-01`
const monthEndStr = (year, month) => `${year}-${padNum(month)}-${padNum(new Date(year, month, 0).getDate())}`

// A blob-typed request returns its error body as a Blob too - read the
// backend's { message } out of it.
const downloadErrorMessage = async (error) => {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text())
      if (parsed?.message) return parsed.message
    } catch (_) { /* not JSON */ }
  }
  return data?.message || error?.message || 'Failed to download the Excel file.'
}

// Compact filter-field/button styling — same design tokens as the MFG Daily
// Production Plan screen's own filter toolbar, copied verbatim so both
// screens share one visual language.
const compactFieldSx = (minWidth) => ({
  minWidth,
  flexShrink: 0,
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#fafbfc",
    minHeight: 30,
    display: "flex",
    alignItems: "center",
    padding: "0 7px !important",
    "& fieldset": { borderColor: "#dde1e7" },
    "&:hover fieldset": { borderColor: "#0066FF" },
    "&.Mui-focused fieldset": { borderColor: "#0066FF", borderWidth: "1.5px" },
    "&.Mui-disabled": {
      backgroundColor: "#f1f2f5",
      cursor: "not-allowed",
      "& fieldset": { borderColor: "#e2e4e9", borderStyle: "dashed" },
    },
  },
  "& .MuiInputBase-input, & .MuiSelect-select, & .MuiAutocomplete-input": {
    padding: "0 !important",
    fontSize: 11,
  },
  "& .Mui-disabled": { cursor: "not-allowed", WebkitTextFillColor: "#a4a9b3" },
  "& .MuiAutocomplete-endAdornment": { right: 4 },
  "& .MuiInputLabel-root": { fontSize: 11, color: "#6b7280" },
  "& .MuiInputLabel-root.Mui-disabled": { color: "#b6bac3" },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": { fontSize: 10.5, transform: "translate(7px, -7px) scale(0.85)" },
});

const compactButtonSx = {
  height: 30,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "6px",
  boxShadow: "none",
  padding: "0 10px",
  whiteSpace: "nowrap",
};

const PMPD_ActualProductionPlan = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [refreshData, setRefreshData] = useState(false)
  const [fetchingProdData, setFetchingProdData] = useState(false)
  const { user } = useContext(AuthContext);
  const currentUserPlantCode = user.PlantCode

  // Manual trigger for the MB51 Prod Data auto-upload — runs the exact same
  // insert-only processing the every-4-hours cron already does.
  const handleFetchProdData = async () => {
    if (fetchingProdData) return
    setFetchingProdData(true)
    try {
      const userId = localStorage.getItem('EmpId')
      const result = await fetchProdDataMB51(userId)
      alert(result?.message || 'MB51 Prod Data fetched successfully.')
      setRefreshData((prev) => !prev)
    } catch (error) {
      console.error('Fetch MB51 Prod Data error:', error)
      alert(
        error.response?.data?.message ||
        error.message ||
        'Something went wrong while fetching MB51 Prod Data.'
      )
    }
    setFetchingProdData(false)
  }

  const PMPDAccess = getPMPDAccess()

  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        ['plant', 'part_number', 'description', 'prod_date'].some((key) => {
          // const value = row[key];
          // return value && String(value).toLowerCase().includes(text);
          let value = row[key];

          if (value === null || value === undefined) return false;

          // Handle the date field specifically
          if (key === 'prod_date') {
            // parseISO is safer for yyyy-mm-dd strings
            const dateObj = new Date(value);

            if (isValid(dateObj)) {
              // Convert the row's date to the searchable format
              value = format(dateObj, "dd-MM-yyyy");
            }
          }

          // Standard string comparison
          return String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(false)

  const validationschema = yup.object({
    plant: yup.string().required('Required'),
    month: yup.number().required('Required'),
    year: yup.number().required('Required'),
  })

  const formik = useFormik({
    initialValues: {
      plant: currentUserPlantCode,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      type: "SUBMIT"
    },
    validationSchema: validationschema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await loadMonthData(values)
    }
  })

  // Loads the selected Month/Year (first to last day) for the selected plant.
  async function loadMonthData(values) {
    if (loading) return
    setLoading(true)
    try {
      const response = await getTrnActualProdPlan({
        plant: values.plant,
        startDate: monthStartStr(values.year, values.month),
        endDate: monthEndStr(values.year, values.month),
      })
      setOriginalRows(response || [])
      setRows(response || [])
    } catch (error) {
      console.error('Load Production Actual error:', error)
      setOriginalRows([])
      setRows([])
      alert(error.response?.data?.message || error.message || 'Failed to load Production Actual data.')
    }
    setLoading(false)
  }

  // Current month loads by default for the user's own plant; re-loads after a
  // manual Fetch or an Excel upload (both toggle refreshData).
  useEffect(() => {
    if (formik.values.plant) loadMonthData(formik.values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshData])

  const [downloadOpen, setDownloadOpen] = useState(false)

  const handleDownloadExcel = async (startDate, endDate) => {
    try {
      const blob = await downloadTrnActualProdPlanExcel({ plant: formik.values.plant, startDate, endDate })
      saveAs(blob, `Production_Actual_${formik.values.plant}_${startDate}_to_${endDate}.xlsx`)
    } catch (error) {
      console.error('Download Production Actual error:', error)
      alert(await downloadErrorMessage(error))
      throw error // keep the popup open so the range can be adjusted
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const resposne = await getPlantdetails()
      setPlants(resposne)
    }
    fetchData()
  }, [])

  // const columns = [
  //   { field: "act_prod_id", headerName: "SI No", width: 80 },
  //   { field: "plant", headerName: "Plant", width: 150 },
  //   { field: "part_number", headerName: "Part No", width: 230 },
  //   { field: "description", headerName: "Description", flex: 1 },
  //   { field: "prod_qty", headerName: "Prod Qty", width: 150 },
  //   { field: "prod_date", headerName: "Prod Date", width: 150, renderCell: (params) => (<>{params.value ? format(params.value, "dd-MM-yyyy") : ""}</>) },
  //   // {
  //   //     field: "action", headerName: "Action", width: 160,
  //   //     renderCell: (params) => (
  //   //         <IconButton
  //   //             color="primary"
  //   //             // onClick={() => handleEdit(params.row)}
  //   //             title="Edit"
  //   //         >
  //   //             <EditIcon />
  //   //         </IconButton>
  //   //     ),
  //   // },
  // ];

  const columns = [
    { field: "act_prod_id", headerName: "SI No", width: 80 },
    { field: "plant", headerName: "Plant", width: 100 },
    { field: "moment_type", headerName: "Moment_Type", width: 110 },
    { field: "storage_loc", headerName: "Storage_Loc", width: 110 },
    {
      field: "prod_date",
      headerName: "Prod_Date",
      width: 130,
      renderCell: (params) => params.value ? format(new Date(params.value), "dd-MM-yyyy") : ""
    },
    { field: "part_number", headerName: "Part_Number", width: 180 },
    { field: "description", headerName: "Description", flex: 1, minWidth: 200 },
    { field: "prod_qty", headerName: "Prod_Qty", width: 110, type: 'number' },
    { field: "prod_order", headerName: "Prod_Order", width: 150 },
    { field: "material_doc", headerName: "Material_Doc", width: 150 },
    {
      field: "time_of_entry",
      headerName: "Entry_Time",
      width: 120,
      renderCell: (params) => params.value
    },
    { field: "reservation_item_no", headerName: "Item No. of Reservation", width: 180 },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 90px)",
      }}
    >
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SectionHeading>
          Production Actual
        </SectionHeading>
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <TextField
            select
            size="small"
            label="Plant"
            name="plant"
            value={formik.values.plant}
            onChange={formik.handleChange}
            sx={compactFieldSx(190)}
            disabled={PMPDAccess.disableAction}
            error={formik.touched.plant && Boolean(formik.errors.plant)}
            helperText={formik.touched.plant && formik.errors.plant}
          >
            {plants.map((p) => (
              <MenuItem sx={{ fontSize: 11.5 }} key={p.Plant_ID} value={p.Plant_Code}>
                {`${p.Plant_Code} - ${p.Plant_Name}`}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            id="month"
            select
            size="small"
            label="Month"
            name="month"
            value={formik.values.month}
            onChange={formik.handleChange}
            sx={compactFieldSx(130)}
          >
            {MONTH_NAMES.map((name, idx) => (
              <MenuItem key={name} value={idx + 1} sx={{ fontSize: 11.5 }}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            id="year"
            select
            size="small"
            label="Year"
            name="year"
            value={formik.values.year}
            onChange={formik.handleChange}
            sx={compactFieldSx(100)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: 11.5 }}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            disableElevation
            onClick={(e) => {
              formik.setFieldValue('type', 'SUBMIT')
              formik.handleSubmit(e)
            }}
            sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
          >
            {loading ? "Loading..." : "Submit"}
          </Button>
        </div>

        {/* Search and Icons Section */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12
          }}
        >
          {/* Search Box - requester */}
          <div style={{ display: "flex", gap: 8 }}>
            <TextField
              size="small"
              variant="outlined"
              placeholder="Type here..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyUp={handleSearch}
              sx={compactFieldSx(260)}
            />
            <Button
              onClick={handleSearch}
              variant="outlined"
              disableElevation
              startIcon={<SearchIcon size={15} />}
              sx={{ ...compactButtonSx, borderColor: "#0066FF", color: "#0066FF", "&:hover": { borderColor: "#0052cc", backgroundColor: "#f0f6ff" } }}
            >
              Search
            </Button>
          </div>
          <Button
            variant="contained"
            disableElevation
            onClick={() => setDownloadOpen(true)}
            disabled={!formik.values.plant}
            startIcon={<FaDownload size={12} />}
            sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
            title="Download records for a date range as Excel"
          >
            Excel Download
          </Button>
          <div style={{ display: PMPDAccess.disableAction ? "none" : "flex", gap: 8, alignItems: "center" }}>
            <Button
              variant="contained"
              disableElevation
              onClick={handleFetchProdData}
              disabled={fetchingProdData}
              startIcon={fetchingProdData ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 15 }} />}
              sx={{ ...compactButtonSx, backgroundColor: "#0066FF", "&:hover": { backgroundColor: "#0052cc" } }}
              title="Fetch latest MB51 Prod Data from the FTP source and insert new records"
            >
              {fetchingProdData ? "Fetching..." : "Fetch"}
            </Button>
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
          </div>
        </div>

      </div>


      {/* DataGrid — compact enterprise styling matching the MFG Daily
          Production Plan grid (header #d0dcf5/bold 10.5px, 11px cells,
          zebra rows, hover tint, compact toolbar/footer). Only visual
          styling changed here; rows/columns/pagination/behavior untouched. */}
      <div
        style={{
          flexGrow: 1, // Ensures it grows to fill the remaining space
          minHeight: 0,
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5} // Set the number of rows per page to 8
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.act_prod_id} // Specify a custom id field
          disableSelectionOnClick
          disableColumnMenu
          columnHeaderHeight={36}
          rowHeight={38}
          slots={{ toolbar: CustomToolbar }}
          sx={{
            height: "100%",
            border: "none",
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-cell": { color: "#333", fontSize: "11px", padding: "0 8px", borderRight: "none" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaders": { position: "sticky", top: 0, zIndex: 2 },
            "& .MuiDataGrid-columnHeader": { backgroundColor: "#d0dcf5", color: "#000000", padding: "0 8px" },
            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
            "& .MuiDataGrid-columnHeaderTitle": { fontSize: "10.5px", fontWeight: "bold", color: "#000000" },
            "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: "#000000" },
            "& .MuiDataGrid-row": { backgroundColor: "#fff" },
            "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#fafbfc" },
            "& .MuiDataGrid-row:hover": { backgroundColor: "#eef4ff" },
            "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "inherit" },
            "& .MuiDataGrid-toolbarContainer": { padding: "2px 6px", minHeight: 28 },
            "& .MuiDataGrid-toolbarContainer button": { fontSize: "11px", padding: "2px 6px" },
            "& .MuiDataGrid-footerContainer": { minHeight: 34 },
            "& .MuiTablePagination-root": { overflow: "visible" },
            "& .MuiTablePagination-toolbar": {
              minHeight: "34px !important",
              height: 34,
              paddingLeft: 8,
              paddingRight: 4,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: 11, marginTop: 0, marginBottom: 0,
            },
            "& .MuiTablePagination-select": {
              fontSize: 11, paddingTop: "2px !important", paddingBottom: "2px !important", minHeight: "unset",
            },
            "& .MuiTablePagination-selectIcon": { fontSize: 16 },
          }}
        />
      </div>


      <DateRangeDownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onDownload={handleDownloadExcel}
        defaultStart={monthStartStr(formik.values.year, formik.values.month)}
        defaultEnd={monthEndStr(formik.values.year, formik.values.month)}
        title="Download Production Actual"
      />
    </div>
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

  async function downloadProductionPlanTemplate() {
    // 1️⃣ Fetch dropdown data
    const [plant,
      // prod_segments
    ] = await Promise.all([
      getPlantdetails(),
      // getProductSegmentdetails(),
    ]);

    const plantCodes = plant.map((e) => e.Plant_Code);
    // const prodSegNames = prod_segments.map((e) => e.seg_name);
    // const planTypes = ["AOP", "MP"];

    // 2️⃣ Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Actual Prod Plan");

    const headers = [
      "Plant",
      "Moment_Type",
      "Storage_Loc",
      "Prod_Date",
      "Part_Number",
      "Description",
      "Prod_Qty",
      "Prod_Order",
      "Material_Doc",
      "Entry_Time_hh_mm_ss",
      "Reservation_Item_No"
    ];

    worksheet.addRow(headers);

    // Header styling
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFADD8E6" },
      };
    });

    // Column widths
    worksheet.columns.forEach((col) => (col.width = 22));

    // 4️⃣ APPLY DROPDOWNS (ROW 2 → 1000)

    // Column A → plant
    worksheet.dataValidations.add("A2:A1000", {
      type: "list",
      allowBlank: false,
      formulae: [`"${plantCodes.join(",")}"`],
    });

    // 5️⃣ Date formatting
    worksheet.getColumn("D").numFmt = "yyyy-mm-dd";
    // worksheet.getColumn("I").numFmt = "yyyy-mm-dd";

    // 6️⃣ Cell styling (rows below header)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center" };
        cell.font = { size: 10 };
      });
    });

    // 7️⃣ Download file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Actual_Production_Plan_Template.xlsx"
    );
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
      const response = await AddTrnActualProdPlan_BULK(formData)
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
        variant="contained"
        disableElevation
        onClick={() => {
          if (onOpen) onOpen()
        }}
        startIcon={<CloudUploadIcon size={15} />}
        sx={{ ...compactButtonSx, backgroundColor: "#1B7A43", "&:hover": { backgroundColor: "#166238" } }}
      >
        Upload
      </Button>

      <Modal open={open} onClose={() => { }}>
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
            onClick={downloadProductionPlanTemplate}
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

          {/* Action Buttons */}
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
      {errors.invalidRows.length > 0 && (
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
      {errors.emptyRows.length > 0 && (
        <div className="mt-4 text-yellow-700">
          ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
        </div>
      )}
    </div>
  );
}



export default PMPD_ActualProductionPlan
