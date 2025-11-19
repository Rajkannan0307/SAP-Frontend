import { Box, Button, Typography, Chip, Paper, Table, TableHead, TableRow, TableCell, TableBody, Divider, Grid, Grid2, Tooltip, IconButton } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { GetRigStatusDashboard } from '../../controller/TestLabService';
import { api } from '../../controller/constants';
import DownloadIcon from "@mui/icons-material/Download";
import { getTestRigStatusColor } from './index';

import { styled } from '@mui/material/styles';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    border: "1px solid #dddedbff",
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: theme.palette.grey[200],
        ...theme.applyStyles('dark', {
            backgroundColor: theme.palette.grey[800],
        }),
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 5,
        // backgroundColor: '#1a90ff',
        backgroundColor: 'orange',
        ...theme.applyStyles('dark', {
            // backgroundColor: '#308fe8',
            backgroundColor: 'orange',
        }),
    },
}));


const typograpySx = {
    fontSize: 12
}


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

        // 🔹 Set 1-hour interval refresh
        const interval = setInterval(() => {
            fetchData();
        }, 3600000); // 1 hour = 3,600,000 ms

        // 🔹 Cleanup
        return () => clearInterval(interval);

    }, [machineId]);

    const machineInfo = testResultData.length > 0 ? testResultData[0] : null;

    const tableRows = testResultData?.map(row => ({
        specification_name: row.specification_name,
        test_spec_value: row.test_spec_value,
        test_result_value: row.test_result_value
    })) || [];

    // const getStatusColor = (status) => {
    //     if (!status) return "default";
    //     switch (status.toLowerCase()) {
    //         case "running": return "success";
    //         case "completed": return "primary";
    //         case "canceled": return "error";
    //         default: return "default";
    //     }
    // };

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
                mb: 1
            }}>

                <Box sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 3
                }}>
                    <h2
                        style={{
                            margin: 0,
                            color: "#2e59d9",
                            // color: "white",
                            textDecoration: "underline",
                            textDecorationColor: "#88c57a",
                            textDecorationThickness: "3px",
                        }}
                    >
                        {machineName}
                    </h2>
                    <Chip
                        label={machineInfo?.test_status}
                        sx={{
                            fontWeight: "bold", ...getTestRigStatusColor(machineInfo?.test_status),
                            fontSize: 18
                        }}
                    />
                </Box>


                <Box sx={{
                    mx: 10, mt: 0,
                    mb: 2,
                    position: "relative", background: "white",
                    px: 2,
                    py: 0,
                    borderRadius: 2,
                    boxShadow: "3px 6px #888888",
                    // border: "1px solid #888888",
                    width: 300
                }}>
                    <Typography
                        sx={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#6e6d6dff",
                        }}
                    >
                        % of test completion
                    </Typography>

                    <BorderLinearProgress
                        variant="determinate"
                        value={machineInfo?.test_progress_percent || 0}
                    />

                    <Typography
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#000",
                            mt: 2
                        }}
                    >
                        {machineInfo?.test_progress_percent || 0}%
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0 }}>
                        <Typography fontSize={10}>0%</Typography>
                        <Typography fontSize={10}>100%</Typography>
                    </Box>
                </Box>


                <Button variant="outlined" sx={{ border: "1px solid black" }} size="small" onClick={() => navigate(-1)}>
                    <ArrowBackIcon /> BACK
                </Button>
            </Box>

            {/* Split Screen */}
            <Box sx={{ display: "flex", gap: 3, height: "75vh" }}>

                {/* LEFT PANEL */}
                <Paper sx={{
                    flex: 1,
                    px: 3,
                    pb: 3,
                    borderRadius: 3,
                    boxShadow: 3,
                    overflowY: "auto",
                    // background: "#d5ef95"
                    // background: "#f1fbd7ff"
                    // background: "#001BB7"
                    background: "#2e59d9"
                }}>
                    {/* <Box sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        color: "white"
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
                    </Box> */}
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 3, mt: 2 }}>
                        <img
                            src={`${api}/uploads/${machineInfo?.machine_file_attachment}`}
                            // src={"/test.jpg"}
                            style={{
                                width: "60%",
                                height: "230px",
                                borderRadius: 10,
                                objectFit: "contain",
                            }} />
                    </Box>

                    {machineInfo && (
                        <Grid2 container spacing={1} alignItems="flex-start" justifyContent={"center"} color={"white"} >
                            <Grid2 size={4}>
                                <Typography fontWeight="bold" sx={{ ...typograpySx }}>Machine Name :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography sx={{ ...typograpySx }}>{machineInfo.Machine_Name}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold" sx={{ ...typograpySx }}>Rig Type :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography sx={{ ...typograpySx }}>{machineInfo.rig_name}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold" sx={{ ...typograpySx }}>Part Description :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography sx={{ ...typograpySx }}>{machineInfo.part_description}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold" sx={{ ...typograpySx }}>Test Number :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography sx={{ ...typograpySx }}>{machineInfo.test_number}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold" sx={{ ...typograpySx }}>Operator :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography sx={{ ...typograpySx }}>{machineInfo.operator_name}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold" sx={{ ...typograpySx }}>Start Date :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography sx={{ ...typograpySx }}>{machineInfo.test_start_date}</Typography>
                            </Grid2>

                            <Grid2 size={4}>
                                <Typography fontWeight="bold" sx={{ ...typograpySx }}>Planned End Date :</Typography>
                            </Grid2>
                            <Grid2 size={8}>
                                <Typography sx={{ ...typograpySx }}>{machineInfo.test_end_date}</Typography>
                            </Grid2>
                        </Grid2>
                    )}

                </Paper>

                {/* RIGHT PANEL */}
                <Paper sx={{
                    flex: 1,
                    px: 3,
                    pb: 3,
                    pt: 2,
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
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "blue", textDecoration: "underline" }}>
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
                                <TableCell><b>Result Value</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[...tableRows].map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.specification_name}</TableCell>
                                    <TableCell>{item.test_spec_value}</TableCell>
                                    <TableCell>{item.test_result_value ?? "--"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {/* <Box sx={{
                        mx: 10
                    }}>
                        <BorderLinearProgress
                            variant="determinate"
                            value={50}
                            sx={{ mt: 3 }}
                            title={machineInfo?.test_progress_percent || 0}
                        />
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography sx={{ ...typograpySx }}>0%</Typography>
                            <Typography>100%</Typography>
                        </Box>
                    </Box> */}
                    {/* <Box sx={{
                        mx: 10, mt: 3,
                        position: "relative", background: "white",
                        p: 2, borderRadius: 2,
                        boxShadow: "3px 6px #888888"
                    }}>
                        <Typography
                            sx={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#6e6d6dff",
                            }}
                        >
                            % of test completion
                        </Typography>

                        <BorderLinearProgress
                            variant="determinate"
                            value={machineInfo?.test_progress_percent || 0}
                        />

                        <Typography
                            sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#000",
                                mt: 2
                            }}
                        >
                            {machineInfo?.test_progress_percent || 0}%
                        </Typography>

                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                            <Typography variant='caption'>0%</Typography>
                            <Typography variant='caption'>100%</Typography>
                        </Box>
                    </Box> */}

                </Paper>
            </Box >
        </Box >
    );
};

export default TestLabViewDashboard;
