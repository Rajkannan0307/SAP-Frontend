import { Box, Button, Typography, Chip, Paper, Table, TableHead, TableRow, TableCell, TableBody, Divider, Grid, Grid2, Tooltip, IconButton } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { GetRigStatusDashboard } from '../../controller/TestLabService';
import { api } from '../../controller/constants';
import DownloadIcon from "@mui/icons-material/Download";
import { getTestRigStatusColor } from '.';

const TestLabViewDashboard = () => {

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const machineName = queryParams.get("machine");

    const navigate = useNavigate();
    const { machineId } = useParams();

    const [testResultData, setTestResultData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await GetRigStatusDashboard(machineId);
            setTestResultData(response);
        };
        if (machineId) fetchData();
    }, [machineId]);

    const machineInfo = testResultData.length > 0 ? testResultData[0] : null;

    const tableRows = testResultData.map(row => ({
        specification_name: row.specification_name,
        test_spec_value: row.test_spec_value,
        test_result_value: row.test_result_value
    }));

    const getStatusColor = (status) => {
        if (!status) return "default";
        switch (status.toLowerCase()) {
            case "running": return "success";
            case "completed": return "primary";
            case "canceled": return "error";
            default: return "default";
        }
    };

    return (
        <Box sx={{
            padding: 3,
            backgroundColor: "#F5F5F5",
            marginTop: "50px",
            height: "calc(100vh - 99px)",
            display: "flex",
            flexDirection: "column"
        }}>

            {/* Page Header */}
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3
            }}>

                <h2
                    style={{
                        margin: 0,
                        color: "#2e59d9",
                        textDecoration: "underline",
                        textDecorationColor: "#88c57a",
                        textDecorationThickness: "3px",
                    }}
                >
                    Rig Name - {machineName}
                </h2>

                <Button variant="outlined" size="small" onClick={() => navigate(-1)}>
                    <ArrowBackIcon /> BACK
                </Button>
            </Box>

            {/* Split Screen */}
            <Box sx={{ display: "flex", gap: 3, height: "80vh" }}>

                {/* LEFT PANEL */}
                <Paper sx={{
                    flex: 1,
                    padding: 3,
                    borderRadius: 3,
                    boxShadow: 3,
                    overflowY: "auto",
                    // background: "#d5ef95"
                    background: "#f1fbd7ff"
                }}>
                    <Box sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            Machine Details
                        </Typography>
                        <Chip
                            label={machineInfo?.test_status}
                            // color={getStatusColor(machineInfo?.test_status)}
                            size="medium"
                            // sx={{ fontWeight: "bold" }}
                            sx={{ fontWeight: "bold", ...getTestRigStatusColor(machineInfo?.test_status) }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 3, mt: 2 }}>
                        <img src={`${api}/uploads/${machineInfo?.machine_file_attachment}`} style={{ width: "50%", height: "fit-content", borderRadius: 10 }} />
                    </Box>

                    {machineInfo && (
                        <Grid2 container spacing={1} alignItems="flex-start" justifyContent={"center"}>
                            <Grid2 size={4}>
                                <Typography fontWeight="bold">Machine Name :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography>{machineInfo.Machine_Name}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold">Rig Type :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography>{machineInfo.rig_name}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold">Part Description :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography>{machineInfo.part_description}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold">Test Number :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography>{machineInfo.test_number}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold">Operator :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography>{machineInfo.operator_name}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold">Start Date :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography>{machineInfo.test_start_date}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold">Planned End Date :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography>{machineInfo.test_end_date}</Typography>
                            </Grid2>
                        </Grid2>
                    )}

                </Paper>

                {/* RIGHT PANEL */}
                <Paper sx={{
                    flex: 1,
                    padding: 3,
                    borderRadius: 3,
                    boxShadow: 3,
                    overflowY: "auto",
                    // background: "#95efe0"
                    background: "#d6fbf5ff"
                }}>
                    <Box sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "blue" }}>
                            Test Details
                        </Typography>
                        <a
                            href={`${api}/uploads/${machineInfo?.file_attachment}`}
                            underline="none"
                            style={{
                                textDecoration: "none"
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    border: "1px solid #d0d0d0",
                                    py: 1,
                                    px: 2,
                                    borderRadius: 2,
                                    fontSize: 13,
                                    background: "#ffffff",
                                    transition: "all 0.25s ease",
                                    cursor: "pointer",
                                    "&:hover": {
                                        backgroundColor: "#2e59d9",
                                        color: "#ffffff",
                                        borderColor: "#2e59d9",
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    },
                                }}
                            >
                                <DownloadIcon style={{ fontSize: 18 }} />
                                <Typography fontSize={13} fontWeight="bold" sx={{
                                    textDecoration: "none"
                                }}>
                                    Test Spec Doc
                                </Typography>
                            </Box>
                        </a>
                    </Box>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Specification</b></TableCell>
                                <TableCell><b>Spec Value</b></TableCell>
                                {/* <TableCell><b>Result Value</b></TableCell> */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[...tableRows].map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.specification_name}</TableCell>
                                    <TableCell>{item.test_spec_value}</TableCell>
                                    {/* <TableCell>{item.test_result_value ?? "--"}</TableCell> */}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </Box >
        </Box >
    );
};

export default TestLabViewDashboard;
