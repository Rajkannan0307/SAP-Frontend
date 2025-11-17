import React, { useEffect, useState } from "react";
import {
    Modal,
    Box,
    Typography,
    Button,
    Divider
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloseIcon from "@mui/icons-material/Close";
import { DataGrid } from "@mui/x-data-grid";
import { api } from "../controller/constants";
import { GetTestRigResultApi } from "../controller/TestLabService";

const ViewTestRigStatus = ({ open, setOpen, editData }) => {
    const [specList, setSpecList] = useState([]);

    const handleClose = () => {
        setOpen(false);
    };

    const fileURL = editData?.file_attachment
        ? `${api}/uploads/${editData.file_attachment}`
        : null;

    useEffect(() => {
        const fetctTrnTestResultSpec = async () => {
            const response = await GetTestRigResultApi(editData?.trn_rig_test_status_id);
            setSpecList(response);
        };
        if (editData?.trn_rig_test_status_id) fetctTrnTestResultSpec();
    }, [editData?.trn_rig_test_status_id, open]);

    const specColumns = [
        { field: "specification_name", headerName: "Specification", flex: 1 },
        { field: "test_spec_value", headerName: "Spec Value", flex: 1 },
        { field: "test_result_value", headerName: "Result Value", flex: 1 },
    ];

    return (
        <Modal open={open} onClose={handleClose}>
            <Box
                sx={{
                    position: "relative",
                    width: "60vw",
                    height: "90vh",
                    overflowY: "auto",   // 🔥 Entire dialog scrolls
                    bgcolor: "#fff",
                    p: 4,
                    borderRadius: 3,
                    boxShadow: 24,
                    margin: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {/* Close Button */}
                <Box
                    onClick={handleClose}
                    sx={{
                        position: "absolute",
                        top: 12,
                        right: 16,
                        cursor: "pointer",
                        width: 30,
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        "&:hover": { background: "#efefef" },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </Box>

                {/* Title */}
                <Typography
                    variant="h5"
                    sx={{
                        textAlign: "center",
                        color: "#2e59d9",
                        textDecoration: "underline",
                        textDecorationThickness: "3px",
                        textDecorationColor: "#8cc57a",
                        mb: 1,
                    }}
                >
                    Product Testing Status
                </Typography>

                <Divider />

                {/* KEY → VALUE GRID */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "140px 1fr 140px 1fr",
                        rowGap: 1.5,
                        columnGap: 3,
                        fontSize: "14px",
                    }}
                >
                    <Typography variant="body2" fontWeight="bold">Machine :</Typography>
                    <Typography variant="body2">{editData?.Machine_Name || "-"}</Typography>

                    <Typography variant="body2" fontWeight="bold">Part Description :</Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            wordBreak: "break-word",
                        }}
                    >
                        {editData?.part_description || "-"}
                    </Typography>


                    <Typography variant="body2" fontWeight="bold">Rig Type :</Typography>
                    <Typography variant="body2">{editData?.rig_name || "-"}</Typography>

                    <Typography variant="body2" fontWeight="bold">Operator :</Typography>
                    <Typography variant="body2">{editData?.operator_name || "-"}</Typography>

                    <Typography variant="body2" fontWeight="bold">Start Date :</Typography>
                    <Typography variant="body2">{editData?.test_start_date || "-"} </Typography>

                    <Typography variant="body2" fontWeight="bold">Status :</Typography>
                    <Typography variant="body2"
                        sx={{
                            fontWeight: "bold",
                            color:
                                editData?.test_status === "Running"
                                    ? "#e6ac00"
                                    : editData?.test_status === "Completed"
                                        ? "green"
                                        : editData?.test_status === "Canceled"
                                            ? "red"
                                            : "#555",
                        }}
                    >
                        {editData?.test_status}
                    </Typography>

                    <Typography variant="body2" fontWeight="bold">End Date :</Typography>
                    <Typography variant="body2">{editData?.test_end_date || "-"} </Typography>

                    <Typography variant="body2" fontWeight="bold">DVP Doc :</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {fileURL && (
                            <Button
                                variant="outlined"
                                size="small"
                                endIcon={<CloudDownloadIcon />}
                                href={fileURL}
                                target="_blank"
                            >
                                Download
                            </Button>
                        )}
                    </Box>
                </Box>


                <Divider sx={{ mt: 2 }} />

                {/* DataGrid for Test Specs */}
                <Typography
                    sx={{
                        fontWeight: "bold",
                        color: "#2e59d9",
                        mb: 1,
                    }}
                >
                    Test Specifications
                </Typography>

                <Box sx={{ height: 350, width: "100%" }}>
                    <DataGrid
                        rows={specList}
                        columns={specColumns}
                        getRowId={(row) => row.trn_rig_test_result_id}
                        disableRowSelectionOnClick
                        disableColumnMenu
                        sortingOrder={[]}
                    />
                </Box>
            </Box>
        </Modal>
    );
};

export default ViewTestRigStatus;
