import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Grid2,
} from "@mui/material";
import { getRigMachine } from "../../controller/TestLabService";
import { useNavigate } from "react-router-dom";

export const getTestRigStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case "running":
            return {
                background: "#FFF200", // bright yellow
                color: "#000000"
            };

        case "completed":
            return {
                background: "#4CAF50", // green
                color: "#FFFFFF"
            };

        case "canceled":
            return {
                background: "#F44336", // red
                color: "#FFFFFF"
            };

        case "idle":
            return {
                background: "#2196F3", // blue
                color: "#FFFFFF"
            };

        default:
            return {
                background: "#9E9E9E", // grey
                color: "#FFFFFF"
            };
    }
};

const getTestRigBackgroundColor = (status) => {
    switch (status?.toLowerCase()) {
        case "running":
            return "#fffdcfff" // bright yellow
        case "completed":
            return "white" // green
        case "canceled":
            return "white";
        case "idle":
            return "white";// blue
        default:
            return "white" // grey

    }
}


const TestLabDashboard = () => {
    const navigate = useNavigate()
    const [machineList, setMachineList] = useState([])

    useEffect(() => {
        const fetchData = async () => {
            const userPlantCode = localStorage.getItem("Plantcode")
            const response = await getRigMachine(userPlantCode)
            setMachineList(response)
        }
        fetchData()
    }, [])

    return (
        <Box
            sx={{
                padding: 3,
                backgroundColor: "#F5F5F5",
                marginTop: "50px",
                height: "calc(100vh - 90px)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    marginBottom: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* <Typography
                    variant="h5"
                    sx={{
                        margin: 0,
                        color: "#2e59d9",
                        textDecoration: "underline",
                        textDecorationColor: "#88c57a",
                        textDecorationThickness: "3px",
                    }}
                >
                    Rig Status - Dashboard
                </Typography> */}
                <h2
                    style={{
                        margin: 0,
                        color: "#2e59d9",
                        textDecoration: "underline",
                        textDecorationColor: "#88c57a",
                        textDecorationThickness: "3px",
                    }}
                >
                    Rig Status - Dashboard
                </h2>

            </Box>

            {machineList?.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                    No machine data available.
                </div>
            )}

            {/* Card Grid */}
            <Grid container spacing={3}>
                {machineList.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.Machine_Id}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                                transition: "0.3s",
                                cursor: "pointer",
                                "&:hover": {
                                    transform: "scale(1.02)",
                                    boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
                                },
                                background: getTestRigBackgroundColor(item?.test_status)
                            }}
                            onClick={() => {
                                if (item?.test_status === 'Running')
                                    navigate(`/home/testLabDashbaord/${item?.Machine_Id}?machine=${item?.Machine_Name}`)
                            }}
                        >
                            <CardContent>
                                <Box sx={{
                                    display: "flex",
                                    justifyContent: "start",
                                    alignItems: "center",
                                    gap: 1,
                                }}>
                                    <img src="/engineering.png" style={{ height: 20, width: 20 }} />
                                    <Typography
                                        sx={{ fontWeight: "bold", color: "#2E59D9" }}
                                    >
                                        {item.Machine_Name}
                                    </Typography>
                                </Box>

                                {/* <Typography variant="body2" sx={{ color: "#555", marginTop: 1 }}>
                                    <strong>Test Number:</strong> {item.test_number}
                                </Typography> */}

                                <Grid2 container spacing={1} mt={2} alignItems="flex-start" justifyContent={"center"}>
                                    <Grid2 size={6}>
                                        <Typography variant="body2" fontWeight="bold">Machine Code :</Typography>
                                    </Grid2>
                                    <Grid2 size={6}>
                                        <Typography variant="body2">{item.Machine_Code}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography variant="body2" fontWeight="bold">Rig Type :</Typography>
                                    </Grid2>
                                    <Grid2 size={6}>
                                        <Typography variant="body2">{item.rig_name}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography variant="body2" fontWeight="bold">Part Description :</Typography>
                                    </Grid2>
                                    <Grid2 size={6}>
                                        <Typography variant="body2"
                                            sx={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}>
                                            {item.part_description || "--"}
                                        </Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography variant="body2" fontWeight="bold">Start Date :</Typography>
                                    </Grid2>
                                    <Grid2 size={6}>
                                        <Typography variant="body2">{item.test_start_date || "--"}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography variant="body2" fontWeight="bold">Planned End Date :</Typography>
                                    </Grid2>
                                    <Grid2 size={6}>
                                        <Typography variant="body2">{item.test_end_date || "--"}</Typography>
                                    </Grid2>

                                    <Grid2 size={6}>
                                        <Typography variant="body2" fontWeight="bold">% of Completion :</Typography>
                                    </Grid2>
                                    <Grid2 size={6}>
                                        <Typography variant="body2" sx={{ fontWeight: "bold", color: item.test_progress_percent >= 100 ? "green" : "red" }}>
                                            {item.test_progress_percent ? `${item.test_progress_percent}%` : "--"}
                                        </Typography>
                                    </Grid2>

                                </Grid2>

                                {/* <Typography variant="body2" sx={{ color: "#555", marginTop: 1 }}>
                                    <strong>Machine Code:</strong> {item.Machine_Code}
                                </Typography>

                                <Typography variant="body2" sx={{ color: "#555" }}>
                                    <strong>Rig Type:</strong> {item.rig_name}
                                </Typography>

                                <Typography variant="body2" sx={{ color: "#555" }}>
                                    <strong>Part Description:</strong> {item.part_description || "--"}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#555" }}>
                                    <strong>Start Date:</strong> {item.test_start_date || "--"}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#555" }}>
                                    <strong>Planned End Date:</strong> {item.test_end_date || "--"}
                                </Typography> */}

                                <Chip
                                    label={item?.test_status}
                                    // color={getStatusColor(item?.test_status)}
                                    size="small"
                                    sx={{ mt: 2, fontSize: 16, fontWeight: "bold", ...getTestRigStatusColor(item?.test_status) }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default TestLabDashboard;







