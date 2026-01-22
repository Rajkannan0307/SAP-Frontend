import React, { useEffect, useState } from 'react'
import * as Yup from "yup"
import { useFormik } from "formik";
import { AddFixedManpower, getProductSegmentdetails } from '../../controller/PMPDApiService';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { CommonMuiStyles } from '../../Styles/CommonStyles';
import { getPlantdetails } from '../../controller/CommonApiService';
import { DataGrid } from '@mui/x-data-grid';
import { format } from 'date-fns';

const monthColumns = [
    // { field: 'apr', headerName: 'Apr', editable: true, width: 80 },
    // { field: 'may', headerName: 'May', editable: true, width: 80 },
    // { field: 'jun', headerName: 'Jun', editable: true, width: 80 },
    // { field: 'jul', headerName: 'Jul', editable: true, width: 80 },
    // { field: 'aug', headerName: 'Aug', editable: true, width: 80 },
    // { field: 'sep', headerName: 'Sep', editable: true, width: 80 },
    // { field: 'oct', headerName: 'Oct', editable: true, width: 80 },
    // { field: 'nov', headerName: 'Nov', editable: true, width: 80 },
    // { field: 'dec', headerName: 'Dec', editable: true, width: 80 },
    // { field: 'jan', headerName: 'Jan', editable: true, width: 80 },
    // { field: 'feb', headerName: 'Feb', editable: true, width: 80 },
    // { field: 'mar', headerName: 'Mar', editable: true, width: 80 }
    { field: 'id', headerName: 'SI.No', editable: false, width: 80 },
    { field: 'month', headerName: 'Month', editable: false, flex: 1 },
    {
        field: 'hc_no', headerName: 'HC NUMBER', editable: true, type: 'number',
        align: 'left',
        headerAlign: 'left',
        flex: 1
    }
];

const MONTH_INDEX = {
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
    jan: 0,
    feb: 1,
    mar: 2,
};


const getMonthDate = (finYear, monthKey) => {
    const [startYY, endYY] = finYear.split('-');

    const startYear = Number(startYY);
    const endYear = Number(startYY.slice(0, 2) + endYY); // ✅ 2025 + 26 → 2026

    const year =
        ['jan', 'feb', 'mar'].includes(monthKey)
            ? endYear
            : startYear;

    const date = new Date(year, MONTH_INDEX[monthKey], 1);

    return format(date, 'yyyy-MM-dd');
};

const initGridRows = (editData = {}) =>
    Object.keys(MONTH_INDEX).map((monthKey, i) => ({
        id: i + 1,
        month: monthKey,
        hc_no: editData[monthKey] ?? 0
    }));

const AddFixedmanpower = ({ open, setOpenAddModal, setRefreshData, editData }) => {
    const [submitLoading, setSubmitLoading] = useState(false)
    const [prodSegments, setProdSegments] = useState([])
    const [plants, setPlants] = useState([])
    const [gridRows, setGridRows] = useState([]);

    const handleClose = () => {
        setOpenAddModal(false)
        setGridRows([])
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        plant: Yup.string().required('Plant is required'),
        prod_seg_id: Yup.string()
            .required("Segment is required"),
        job_name: Yup.string().required('Job name is required'),
        fin_year: Yup.string().required('Fin year is required'),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: "",
            prod_seg_id: "",
            fin_year: "",
            job_name: "",
            active_status: true,
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (submitLoading) return
            setSubmitLoading(true)
            console.log(values)
            try {
                const userId = localStorage.getItem("EmpId");

                // console.log(gridRows)
                const finalResult = gridRows?.map((e) => {
                    return {
                        plant: values.plant,
                        prod_seg_id: values.prod_seg_id,
                        month: getMonthDate(values.fin_year, e.month), // fin_year will be 2025-26, 2026-27,
                        month_name: e.month,
                        job_name: values.job_name,
                        hc_no: e?.hc_no,
                        userId: userId
                    }
                })

                const payload = {
                    fixedManpowerList: finalResult
                }

                console.log(payload)
                //add apiCall

                await AddFixedManpower(payload)
                setRefreshData((prev) => !prev)
                handleClose()
                alert(`Fixed Manpower Added Successfully`)
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert(error?.response?.data?.message ? `❌ ${error?.response?.data?.message}` : "❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });

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

        setGridRows(initGridRows(editData));
    }, [open])


    const handleRowUpdate = (newRow) => {
        setGridRows(prev =>
            prev.map(row =>
                row.id === newRow.id
                    ? { ...row, hc_no: newRow.hc_no }
                    : row
            )
        );
        return newRow;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            maxWidth="xl"
        >
            <DialogTitle id="alert-dialog-title">
                {`${editData ? "Edit" : "Add"} Fixed Manpower`}
            </DialogTitle>
            {/* {JSON.stringify(editData)} */}
            <DialogContent sx={{ pb: 0, width: "100%" }}>
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
                        value={formik.values.plant}
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
                        id="fin_year"
                        select
                        size="small"
                        label="Financial Year"
                        name="fin_year"
                        value={formik.values.fin_year}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        error={formik.touched.fin_year && Boolean(formik.errors.fin_year)}
                        helperText={formik.touched.fin_year && formik.errors.fin_year}
                        sx={{
                            // ...CommonMuiStyles.textFieldSmallSx2,
                            minWidth: 250,
                            mt: 1
                        }}
                    >
                        {["2025-26", "2026-27"].map((fy) => (
                            <MenuItem key={fy} value={fy} sx={{ fontSize: "small" }}>
                                {fy}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        id="prod_seg_id"
                        name="prod_seg_id"
                        label="Segment"
                        size="small"
                        fullWidth
                        select
                        value={formik.values.prod_seg_id}
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
                </div>

                <div style={{
                    display: "flex",
                    width: "100%",
                    gap: "15px"
                }}>

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

                <div style={{ marginTop: 16 }}>
                    <DataGrid
                        rows={gridRows}
                        columns={monthColumns}
                        processRowUpdate={handleRowUpdate}
                        hideFooter
                        disableRowSelectionOnClick
                        experimentalFeatures={{ newEditingApi: true }}
                        columnHeaderHeight={30}
                        rowHeight={30}
                        disableColumnMenu
                        sortingOrder={[]}
                        sx={{
                            ...CommonMuiStyles.dataGridSmallSx
                            // fontSize: 12
                        }}
                    />
                </div>
            </DialogContent>
            <DialogActions sx={{ p: 0, pb: 2, pr: 3, pt: 2 }}>
                <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        formik.handleSubmit()
                    }} autoFocus>
                    {submitLoading ? "Loading..." : editData ? "Update" : "Add"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default AddFixedmanpower