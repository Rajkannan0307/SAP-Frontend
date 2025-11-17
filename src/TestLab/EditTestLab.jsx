import React, { useState, useEffect } from "react";
import {
    Modal,
    Box,
    TextField,
    MenuItem,
    Button,
    Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AddTestRigStatusApi, EditTestRigStatusApi, getMachine, GetMstTestSpecification, getRigMachine, GetTestRigResultApi } from "../controller/TestLabService";
import { format, parse } from "date-fns";
import CloseIcon from '@mui/icons-material/Close';
import { api } from "../controller/constants";
import { DownloadIcon } from "lucide-react";

const EditTestRigStatus = ({ open, setOpen, editData, setRefreshData }) => {
    const [machineList, setMachineList] = useState([]);
    const [specList, setSpecList] = useState([]);
    const [testValues, setTestValues] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false)

    const isRunningStatus = editData?.test_status === "Running"

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        machine_id: Yup.string().required("Machine is required"),
        part_description: Yup.string().required("Part description is required"),
        operator_name: Yup.string().required("Operator name is required"),
        rig_type: Yup.string().required("Rig Type is required"),
        file_attachment: Yup.mixed().required("File is required"),
        test_start_date: Yup.string().required("Start Date is required"),
        test_end_date: Yup.string().required("End Date is required"),
    });

    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            machine_id: Number(editData.machine_id),
            part_description: editData.part_description,
            operator_name: editData.operator_name,
            rig_type: editData.rig_type_id,
            file_attachment: editData?.file_attachment,
            test_start_date: editData.test_start_date
                ? format(parse(editData.test_start_date, "dd-MM-yyyy", new Date()), "yyyy-MM-dd")
                : "",
            test_end_date: editData.test_end_date
                ? format(parse(editData.test_end_date, "dd-MM-yyyy", new Date()), "yyyy-MM-dd")
                : "",
            test_status: ""
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                // ✅ 1️⃣ Run Formik validation first
                await formik.validateForm();
                const errors = formik.errors;

                if (Object.keys(errors).length > 0) {
                    alert("⚠️ Please fill all required fields before submitting.");
                    console.warn("Formik validation errors:", errors);
                    return;
                }

                console.log(testValues)
                // ✅ 2️⃣ Check if all test specification values are filled
                const unfilledSpecs = testValues.some(v => !v.test_spec_value || v.test_spec_value.trim() === "");
                const unfilledSpecs2 = testValues.some(v => !v.test_result_value || v.test_result_value.trim() === "");
                if (unfilledSpecs || unfilledSpecs2) {
                    alert("⚠️ Please fill all test specification values before submitting.");
                    return;
                }


                // ✅ Build FormData for multipart submission
                const formData = new FormData();

                formData.append("trn_rig_test_status_id", editData.trn_rig_test_status_id);
                formData.append("part_description", values.part_description);
                formData.append("test_start_date", values.test_start_date);
                formData.append("test_end_date", values.test_end_date);
                formData.append("operator_name", values.operator_name);
                formData.append("created_by", localStorage.getItem("EmpId"));
                formData.append("test_status", values.test_status);

                if (values.file_attachment instanceof File) {
                    // user uploaded new file
                    formData.append("file_attachment", values.file_attachment);
                } else {
                    // keep existing file name
                    formData.append("existing_file", values.file_attachment);
                }
                // ✅ Convert rig_test_result array → JSON string
                formData.append("rig_test_result", JSON.stringify(testValues));

                console.log(testValues)
                console.log("📤 Submitting form data (FormData):", Object.fromEntries(formData));

                // ✅ Call your API
                const response = await EditTestRigStatusApi(formData);
                setRefreshData((prev) => !prev)
                alert("✅ Test Rig Status updated successfully!");
                handleClose()

            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert("❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });

    // ✅ Fetch machines (mock)
    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                try {
                    const userPlantCode = localStorage.getItem("Plantcode")
                    const response = await getRigMachine(userPlantCode);
                    console.log(response)
                    setMachineList(response);
                    formik.setFieldValue("machine_id", editData?.machine_id)
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            };
            fetchData();
        }
    }, [open, editData?.machine_id]);


    useEffect(() => {
        const fetctTrnTestResultSpec = async () => {
            const response = await GetTestRigResultApi(editData?.trn_rig_test_status_id);
            const specs = response
            setSpecList(specs);
            setTestValues(specs);
        }
        if (editData?.trn_rig_test_status_id) fetctTrnTestResultSpec()
    }, [editData?.trn_rig_test_status_id, open])

    const handleSpecChange = (id, field, value) => {
        setTestValues((prev) =>
            prev?.map((row) =>
                row.trn_rig_test_result_id === id ? { ...row, [field]: value } : row
            ) || []
        );
    };

    const handleClose = () => {
        formik.resetForm();
        setTestValues([]);
        setOpen(false);
    };

    const specColumns = [
        { field: "specification_name", headerName: "Specification", flex: 1 },
        {
            field: "test_spec_value",
            headerName: "Test Spec Value",
            flex: 1,
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={params.row.test_spec_value}
                    disabled={!isRunningStatus}
                    onChange={(e) =>
                        handleSpecChange(params.row.trn_rig_test_result_id, "test_spec_value", e.target.value)
                    }
                />
            ),
        },
        {
            field: "test_result_value",
            headerName: "Test Result Value",
            flex: 1,
            renderCell: (params) => (
                <TextField
                    size="small"
                    value={params.row.test_result_value}
                    disabled={!isRunningStatus}
                    onChange={(e) =>
                        handleSpecChange(params.row.trn_rig_test_result_id, "test_result_value", e.target.value)
                    }
                />
            ),
        },
    ];


    const fileURL = editData?.file_attachment
        ? `${api}/uploads/${editData.file_attachment}`
        : null;


    return (
        <Modal open={open} onClose={handleClose}>
            <Box
                component="form"
                onSubmit={formik.handleSubmit}
                sx={{
                    display: "flex",
                    position: "relative",
                    flexDirection: "column",
                    justifyContent: "start",
                    alignItems: "center",
                    width: "70vw",
                    height: "90vh",
                    overflowY: "auto",
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4,
                    margin: "auto",
                    gap: "15px",
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        textAlign: "center",
                        color: "#2e59d9",
                        textDecoration: "underline",
                        textDecorationColor: "#88c57a",
                        textDecorationThickness: "3px",
                        mb: 2,
                    }}
                >
                    Edit Test Rig Status
                </Typography>

                <Box
                    onClick={handleClose}
                    sx={{
                        position: "absolute",
                        top: 12,
                        right: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        border: "1px solid rgba(159,160,160,0.6)",
                        borderRadius: 2,
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.1)",
                            borderColor: "rgba(0,0,0,0.3)",
                        },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </Box>

                {/* {JSON.stringify(editData || "data")} */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    width: "100%",
                    gap: "15px"
                }}>

                    {/* Machine */}
                    <TextField
                        select
                        id="machine_id"
                        name="machine_id"
                        label="Machine"
                        fullWidth
                        value={formik.values.machine_id}
                        disabled
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            formik.handleChange(e);

                            // find the selected machine from machineList
                            const selectedMachine = machineList.find(
                                (m) => Number(m.Machine_Id) === selectedId
                            );

                            // if found, update the rig_type field in Formik
                            if (selectedMachine) {
                                console.log(selectedMachine)
                                formik.setFieldValue("rig_type", selectedMachine.rig_type_id);
                            }
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.machine_id && Boolean(formik.errors.machine_id)}
                        helperText={formik.touched.machine_id && formik.errors.machine_id}
                    >
                        {machineList?.map((option, i) => (
                            <MenuItem key={i} value={Number(option.Machine_Id)}>
                                {option.Machine_Name}
                            </MenuItem>
                        )) || []}
                    </TextField>

                    {/* Part Description */}
                    <TextField
                        id="part_description"
                        name="part_description"
                        label="Part Description"
                        fullWidth
                        value={formik.values.part_description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.part_description && Boolean(formik.errors.part_description)}
                        helperText={formik.touched.part_description && formik.errors.part_description}
                        disabled={!isRunningStatus}
                    />

                </div>

                <div style={{
                    display: "flex",
                    gap: "15px",
                    width: "100%"
                }}>
                    <TextField
                        id="operator_name"
                        name="operator_name"
                        label="Operator Name"
                        fullWidth
                        value={formik.values.operator_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.operator_name && Boolean(formik.errors.operator_name)}
                        helperText={formik.touched.operator_name && formik.errors.operator_name}
                        disabled={!isRunningStatus}
                    />
                    <TextField
                        id="test_start_date"
                        name="test_start_date"
                        label="Start Date"
                        type="date"
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true
                            }
                        }}
                        value={formik.values.test_start_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.test_start_date && Boolean(formik.errors.test_start_date)}
                        helperText={formik.touched.test_start_date && formik.errors.test_start_date}
                        disabled={!isRunningStatus}
                    />
                    <TextField
                        id="test_end_date"
                        name="test_end_date"
                        label="End Date"
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true
                            }
                        }}
                        fullWidth
                        value={formik.values.test_end_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.test_end_date && Boolean(formik.errors.test_end_date)}
                        helperText={formik.touched.test_end_date && formik.errors.test_end_date}
                        disabled={!isRunningStatus}
                    />

                    <div>
                        {/* <Button variant="outlined" component="label" fullWidth sx={{
                            py: 2,
                            border: "1px solid rgb(118, 118, 118)"
                        }}>

                            <input
                                type="file"
                                // hidden
                                id="file_attachment"
                                name="file_attachment"
                                accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx"
                                onChange={(event) => {
                                    const file = event.currentTarget.files[0];
                                    if (file) {
                                        const allowedTypes = [
                                            "application/pdf",
                                            "application/msword", // .doc
                                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
                                            "application/vnd.ms-excel", // .xls
                                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
                                            "application/vnd.ms-powerpoint", // .ppt
                                            "application/vnd.openxmlformats-officedocument.presentationml.presentation" // .pptx
                                        ];

                                        if (!allowedTypes.includes(file.type)) {
                                            alert("⚠️ Only PDF, Word, Excel, and PowerPoint files are allowed!");
                                            event.target.value = ""; // reset input
                                            return;
                                        }

                                        formik.setFieldValue("file_attachment", file);
                                    }
                                }}
                                style={{
                                    // padding: "8px",
                                    backgroundColor: "white", // ✅ Blue background
                                    color: "black",
                                    border: "none",
                                    // borderRadius: "5px",
                                    cursor: "pointer",
                                    width: "180px",
                                    // marginTop: "10px",
                                }}
                            />
                        </Button>
                        {formik.errors.file_attachment && (
                            <Typography color="error" variant="caption">
                                {formik.errors.file_attachment}
                            </Typography>
                        )} */}
                        <TextField
                            fullWidth
                            type="file"
                            name="file_attachment"
                            label="Test Spec Doc"
                            InputLabelProps={{
                                shrink: true, // ✅ Keeps label above the input
                            }}
                            // size="small"
                            inputProps={{
                                accept:
                                    ".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx",
                            }}
                            onChange={(event) => {
                                const file = event.currentTarget.files[0];
                                if (file) {
                                    const allowedTypes = [
                                        "application/pdf",
                                        "application/msword", // .doc
                                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
                                        "application/vnd.ms-excel", // .xls
                                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
                                        "application/vnd.ms-powerpoint", // .ppt
                                        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
                                    ];

                                    if (!allowedTypes.includes(file.type)) {
                                        alert("⚠️ Only PDF, Word, Excel, and PowerPoint files are allowed!");
                                        event.target.value = "";
                                        return;
                                    }

                                    formik.setFieldValue("file_attachment", file);
                                }
                            }}
                            sx={{
                                backgroundColor: "#fff",
                                "& input[type=file]": {
                                    padding: "12px 10px",
                                    cursor: "pointer",
                                },
                                "& .MuiInputBase-input": {
                                    fontSize: 12, // ✅ Controls input text font size
                                    padding: "10px", // optional fine-tuning
                                    cursor: "pointer",
                                },
                                "& .MuiInputLabel-root": {
                                    fontSize: 13, // ✅ Label font size
                                },
                                "& .MuiFormHelperText-root": {
                                    fontSize: 11, // ✅ Helper/error text font size
                                },
                                minWidth: 300
                            }}
                            error={Boolean(formik.errors.file_attachment)}
                            helperText={formik.errors.file_attachment}
                        />

                        {/* Show existing file name if editing */}
                        {/* {!(formik.values.file_attachment instanceof File) && formik.values.file_attachment && (
                            <Typography
                                sx={{ mt: 1, fontSize: "0.9rem", color: "#555" }}
                            >
                                📎 Current file: {formik.values.file_attachment}
                            </Typography>
                        )} */}
                        {!(formik.values.file_attachment instanceof File) &&
                            formik.values.file_attachment && (
                                <Box
                                    sx={{
                                        mt: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Typography sx={{ fontSize: "0.9rem", color: "#555" }}>
                                        {/* 📎 Current file: {formik.values.file_attachment} */}
                                        📎 Current file:
                                    </Typography>

                                    {/* Small Download Button */}
                                    {fileURL && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            href={fileURL}
                                            target="_blank"
                                            sx={{
                                                minWidth: "30px",
                                                padding: "6px 6px",
                                                textTransform: "none",
                                            }}
                                        >
                                            <DownloadIcon size={15} />
                                        </Button>
                                    )}
                                </Box>
                            )
                        }

                    </div>
                </div>

                {/* DataGrid for Specifications */}
                <Typography
                    sx={{ mt: 2, mb: 1, fontWeight: 600, color: "#2e59d9" }}
                >
                    Test Specifications
                </Typography>
                <Box sx={{ height: 300, width: "100%" }}>
                    <DataGrid
                        rows={testValues}
                        columns={specColumns}
                        getRowId={(row) => row.trn_rig_test_result_id}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        sortingOrder={[]}
                    // hideFooter
                    />
                </Box>

                {
                    isRunningStatus && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "20px",
                                marginTop: "20px",
                            }}
                        >
                            <Button variant="contained" color="error"
                                onClick={() => {
                                    formik.setFieldValue("test_status", "Canceled")
                                    formik.handleSubmit()
                                }} >
                                Test - Canceled
                            </Button>
                            <Button variant="contained" color="primary"
                                onClick={() => {
                                    formik.setFieldValue("test_status", "Completed")
                                    formik.handleSubmit()
                                }}
                            >
                                Test - Completed
                            </Button>
                        </Box>
                    )
                }
            </Box>
        </Modal>
    );
};

export default EditTestRigStatus;
