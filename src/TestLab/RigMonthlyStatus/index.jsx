import React, { useEffect, useState } from 'react'

import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid';
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { addMonths, format, subMonths } from 'date-fns';
import { GetRigMonthlyStatusDashboard } from '../../controller/TestLabService';
import SectionHeading from '../../components/Header';


const cellfontSize = "0.7rem"
const headerFontSize = "0.7rem"

const RigMonthlyStatus = () => {

    const [currentDate, setCurrentDate] = useState(format(new Date(), "yyyy-MM"))

    const [rows, setRows] = useState([])

    // 1️⃣ Mock Data (matches your real API format)
    // const rows = [
    //     {
    //         rig_name: "Steering Gear",
    //         test_start_date: "2025-01-10",
    //         test_end_date: "2025-02-10",
    //         test_status: "Running",
    //         1: true, 2: false, 3: true, 4: false, 5: false, 6: true,
    //         7: true, 8: false, 9: false, 10: true, 11: false, 12: true,
    //         13: false, 14: true, 15: true, 16: false, 17: true, 18: false,
    //         19: true, 20: true, 21: false, 22: true, 23: false, 24: true,
    //         25: false, 26: true, 27: false, 28: true, 29: true, 30: false,
    //         31: true
    //     },
    //     {
    //         rig_name: "Ball Joint",
    //         test_start_date: "2025-03-05",
    //         test_end_date: "2025-03-25",
    //         test_status: "Completed",
    //         1: false, 2: false, 3: true, 4: true, 5: false, 6: false,
    //         7: true, 8: false, 9: true, 10: true, 11: false, 12: false,
    //         13: true, 14: false, 15: false, 16: true, 17: false, 18: true,
    //         19: true, 20: false, 21: false, 22: true, 23: true, 24: false,
    //         25: true, 26: false, 27: true, 28: false, 29: true, 30: false,
    //         31: false
    //     }
    // ];

    // 2️⃣ Days Array to generate 1–31 columns
    const days = Array.from({ length: 31 }, (_, i) => i + 1);


    useEffect(() => {
        const fetchRigMonthlyData = async () => {
            const year = format(currentDate, "yyyy");
            const month = format(currentDate, "MM");
            const plantCode = localStorage.getItem("Plantcode")
            console.log(plantCode)
            const response = await GetRigMonthlyStatusDashboard(year, month, plantCode)
            console.log(response, "RESPONSE")
            setRows(response)
        }
        fetchRigMonthlyData()
    }, [currentDate])



    const handleChangeDate = (isForward) => {
        setCurrentDate(prev => {
            const updatedDate = isForward
                ? addMonths(new Date(prev), 1)   // ➜ Move 1 month forward
                : subMonths(new Date(prev), 1); // ➜ Move 1 month backward

            return format(updatedDate, "yyyy-MM");
        });
    };

    return (
        <Box
            sx={{
                // padding: 3,
                p: 3,
                backgroundColor: "#F5F5F5",
                marginTop: "50px",
                height: "calc(100vh - 99px)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* <h2
                    style={{
                        margin: 0,
                        color: "#2e59d9",
                        textDecoration: "underline",
                        textDecorationColor: "#88c57a",
                        textDecorationThickness: "3px",
                    }}
                >
                    {`Dashboard - (Testing Start ~ End Status)`}
                </h2> */}

                <SectionHeading>
                    {`Dashboard - (Testing Start ~ End Status)`}
                </SectionHeading>
            </Box>

            {/* Date calender */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 1,
                    py: 1,
                }}
            >
                {/* Back Button */}
                <IconButton
                    size="small"
                    sx={{
                        background: "blue",
                        color: "white",
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        "&:hover": { background: "blue" }
                    }}
                    onClick={() => {
                        handleChangeDate(false)
                    }}
                >
                    <IoIosArrowBack size={16} />
                </IconButton>

                {/* Date Display */}
                <Typography
                    variant="body2"
                    sx={{
                        // fontSize: "12px",
                        minWidth: "80px",
                        textAlign: "center",
                        fontWeight: "bold"
                    }}
                >
                    {currentDate}
                </Typography>

                {/* Forward Button */}
                <IconButton
                    size="small"
                    sx={{
                        background: "blue",
                        color: "white",
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        "&:hover": { background: "blue" }
                    }}
                    onClick={() => {
                        handleChangeDate(true)
                    }}
                >
                    <IoIosArrowForward size={16} />
                </IconButton>
            </Box>


            <TableContainer
                component={Paper}
                sx={{
                    minHeight: "70vh",
                    overflow: "auto",
                    borderCollapse: "collapse",   // removes space between cells
                    "& .MuiTableCell-root": {
                        padding: "4px",             // reduce or remove padding
                        // padding: 0,              // use 0 for NO space at all
                    },
                }}
            >
                <Table stickyHeader size='small'>
                    <TableHead >
                        <TableRow sx={{}}>
                            <TableCell
                                sx={{
                                    // position: "sticky",
                                    // left: 0,
                                    // zIndex: 3,
                                    background: "#676767ff",
                                    width: 35,
                                    color: "white",
                                    fontSize: headerFontSize
                                }}
                            >
                                SI.No
                            </TableCell>

                            <TableCell
                                sx={{
                                    // position: "sticky",
                                    // left: 60.5,
                                    // zIndex: 3,
                                    background: "#676767ff",
                                    width: 150,
                                    color: "white",
                                    fontSize: headerFontSize
                                }}
                            >
                                Rig Name
                            </TableCell>

                            <TableCell
                                sx={{
                                    // position: "sticky",
                                    // left: 191.5,
                                    // zIndex: 3,
                                    background: "#676767ff",
                                    width: 60,
                                    color: "white",
                                    fontSize: headerFontSize
                                }}
                            >
                                Status
                            </TableCell>
                            <TableCell
                                sx={{
                                    // position: "sticky",
                                    // left: 191.5,
                                    // zIndex: 3,
                                    background: "#676767ff",
                                    width: 60,
                                    color: "white",
                                    fontSize: headerFontSize
                                }}
                            >
                                %Completion
                            </TableCell>

                            {/* SCROLLABLE DAY HEADERS */}
                            {days.map((d, i) => (
                                <TableCell
                                    key={i}
                                    align="center"
                                    sx={{
                                        background: "#676767ff",
                                        color: "white",
                                        fontSize: headerFontSize,
                                    }}
                                >
                                    {d}
                                </TableCell>
                            ))}

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows?.map((row, idx) => (
                            <TableRow key={idx}>
                                <TableCell
                                    align='center'
                                    sx={{
                                        // position: "sticky",
                                        // left: 0,
                                        background: "#fff",
                                        zIndex: 2,
                                        fontSize: cellfontSize
                                    }}
                                >
                                    {idx + 1}
                                </TableCell>

                                <TableCell
                                    sx={{
                                        // position: "sticky",
                                        // left: 60.5,
                                        background: "#fff",
                                        zIndex: 2,
                                        fontSize: cellfontSize
                                    }}
                                >
                                    {/* {row.rig_name} */}
                                    {row.Machine_Name}
                                </TableCell>

                                {
                                    row.Test_Status !== "Running" ? (
                                        <TableCell
                                            sx={{
                                                // position: "sticky",
                                                // left: 191.5,
                                                // zIndex: 2,
                                                background: "#fff",
                                                // fontWeight: "bold",
                                                // borderRight: "1px solid #ADADAD",
                                                fontSize: cellfontSize

                                            }}
                                        >
                                            {"Idle"}
                                        </TableCell>
                                    ) : (
                                        <TableCell
                                            sx={{
                                                // position: "sticky",
                                                // left: 191.5,
                                                // zIndex: 2,
                                                background: "#fff",
                                                fontWeight: "bold",
                                                color: "blue",
                                                // borderRight: "1px solid #ADADAD",
                                                fontSize: cellfontSize
                                            }}
                                        >
                                            {"Running"}
                                        </TableCell>
                                    )
                                }

                                <TableCell
                                    sx={{
                                        // position: "sticky",
                                        // left: 60.5,
                                        background: "#fff",
                                        zIndex: 2,
                                        borderRight: "1px solid #ADADAD",
                                        fontSize: cellfontSize
                                    }}
                                >
                                    {/* {row.rig_name} */}
                                    {row.test_progress_percent ? `${row.test_progress_percent}%` : "0%"}
                                </TableCell>



                                {days.map((d) => (
                                    <TableCell
                                        key={d}
                                        align="center"
                                        sx={{
                                            // minWidth: 10,
                                            // fontSize: "12px",
                                            background: row[d] === 1 ? "#ffcc00ff" : "none",
                                            fontWeight: 600,
                                            color: row[d] === 1 ? "white" : "black",
                                        }}
                                    >
                                        {row[d] === 1 ? "" : ""}
                                    </TableCell>
                                ))}
                            </TableRow>
                        )) || []}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default RigMonthlyStatus
