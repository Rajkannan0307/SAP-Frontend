import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { getdetailsStoreOpen, getActiveStores } from "./StoreUrlapiservice";
import "../App.css";
import { useParams } from "react-router-dom";
import logo from "../components/images/ranelogo.png";
import { getdetailsStoreClosed } from "../controller/StoreDashboardapiservice";

const Store1url = () => {
  const { plantCode, storageCodes } = useParams();
  const plantId = plantCode;
  const storageCodeList = storageCodes.split(",");
  const [filteredRows, setFilteredRows] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [storeNames, setStoreNames] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState("");
  const [displayRows, setDisplayRows] = useState([]);
  const [activeScreen, setActiveScreen] = useState(1); // 1 = Open Orders, 2 = Closed Orders
  const [currentTime, setCurrentTime] = useState(new Date());

  // ✅ Utility to calculate subtotals and return object
  const calculateSubtotal = (rowsData) => {
    return rowsData.reduce(
      (acc, row) => {
        acc.No_Of_Orders += Number(row.No_Of_Orders || 0);
        acc.No_Of_Open_Orders += Number(row.No_Of_Open_Orders || 0);
        acc.No_Order_Close += Number(row.No_Order_Close || 0);
        acc.Issue_Posted_on_Time += Number(row.Issue_Posted_on_Time || 0);
        acc.Issue_Posted_Delay60 += Number(row.Issue_Posted_Delay60 || 0);
        acc.Issue_Posted_Delay += Number(row.Issue_Posted_Delay || 0);
        return acc;
      },
      {
        No_Of_Orders: 0,
        No_Of_Open_Orders: 0,
        No_Order_Close: 0,
        Issue_Posted_on_Time: 0,
        Issue_Posted_Delay60: 0,
        Issue_Posted_Delay: 0,
      }
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  const columns = [
    { field: "sno", headerName: "S.No", headerAlign: "center", width: 80 },
    { field: "Sup_Name", headerName: "Work Scheduler Name", flex: 1, headerAlign: "center" },
    { field: "Order_Date", headerName: "Order Date", headerAlign: "center", width: 150 },
    { field: "Order_No", headerName: "Order No", flex: 1, headerAlign: "center" },
    { field: "Material_No", headerName: "Material", flex: 1, headerAlign: "center" },
    { field: "Material_Description", headerName: "Description", flex: 1, headerAlign: "center" },
    { field: "Order_Qty", headerName: "Ord Qty", headerAlign: "center", width: 80 },
    // { field: "Issue_Qty", headerName: "Issue Qty", headerAlign: "center", width: 80 },
    { field: "Supv_Lead_Time", headerName: "Lead Time", headerAlign: "center", width: 120 },
    { field: "Delay_Time", headerName: "Actual Time", headerAlign: "center", width: 120 },
  ];

  const columns1 = [
    { field: "Sup_Name", headerName: "Supervisor Name", flex: 1, headerAlign: "center", },
    { field: "No_Of_Orders", headerName: "No. Of Total Orders", flex: 1, headerAlign: "center" },
    { field: "No_Of_Open_Orders", headerName: "No. Of Open Orders", flex: 1, headerAlign: "center" },
    { field: "No_Order_Close", headerName: "No. Of Orders Closed", flex: 1, headerAlign: "center" },
    { field: "Issue_Posted_on_Time", headerName: "Issued On Time", flex: 1, headerAlign: "center" },
    { field: "Issue_Posted_Delay60", headerName: "Issued Delay < 60 Mins", flex: 1, headerAlign: "center" },
    { field: "Issue_Posted_Delay", headerName: "Issued Delay > 60 Mins", flex: 1, headerAlign: "center" },
  ];

  // ✅ Fetch data depending on screen
  const fetchData = async (screen) => {
    let allData = [];

    for (let i = 0; i < storageCodeList.length; i++) {
      const code = storageCodeList[i].trim();
      try {
        const response =
          screen === 1
            ? await getdetailsStoreOpen(plantId, code)
            : await getdetailsStoreClosed(code, plantId);

        const dataset = response || [];
        const processed = dataset.map((row, index) => ({
          id: `${code}-${row.Prdord_ID || index}`,
          sno: allData.length + index + 1,
          ...row,
        }));

        allData = [...allData, ...processed];
      } catch (err) {
        console.error(`Error fetching ${screen === 1 ? "open" : "closed"} orders for ${code}:`, err);
      }
    }
    setIsFiltered(false);

    if (screen === 2) {
      // 👉 Add summary row for closed orders
      const total = calculateSubtotal(allData);
      const summaryRow = {
        id: "subtotal-row",
        Sup_Name: "Total",
        No_Of_Orders: total.No_Of_Orders,
        No_Of_Open_Orders: total.No_Of_Open_Orders,
        No_Order_Close: total.No_Order_Close,
        Issue_Posted_on_Time: total.Issue_Posted_on_Time,
        Issue_Posted_Delay60: total.Issue_Posted_Delay60,
        Issue_Posted_Delay: total.Issue_Posted_Delay,
      };
      setDisplayRows([...allData, summaryRow]);
    } else {
      setDisplayRows(allData);
    }

    setLastRefreshed(
      new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    );
  };

  const fetchStoreNames = async () => {
    const names = [];
    for (let i = 0; i < storageCodeList.length; i++) {
      const code = storageCodeList[i].trim();
      try {
        const res = await getActiveStores(plantId, code);
        if (Array.isArray(res) && res.length > 0) {
          res.forEach((item) => {
            if (item?.SLoc_Name) names.push(item.SLoc_Name.trim());
          });
        }
      } catch (err) {
        console.error(`Error fetching SLoc_Name for ${code}:`, err);
      }
    }
    setStoreNames(names);
  };

  // 🟢 Load data when screen changes
  useEffect(() => {
    fetchData(activeScreen);
    fetchStoreNames();
  }, [activeScreen, plantCode, storageCodes]);

  useEffect(() => {
    let timer;

    if (activeScreen === 1) {
      // 🟢 Stay on screen 1 for 2 mins
      timer = setTimeout(() => setActiveScreen(2), 60000);
    } else {
      // 🟡 Stay on screen 2 for 15 sec
      timer = setTimeout(() => setActiveScreen(1), 15000);
    }

    return () => clearTimeout(timer); // cleanup on unmount or state change
  }, [activeScreen]);

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  const colors = activeScreen === 1 ? ["white", "yellow"] : ["black", "blue"];

  return (
    <div style={{ padding: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 40px)", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: activeScreen === 1 ? "#2e59d9" : "#00CEC8",
          color: activeScreen === 1 ? "white" : "black",
          borderRadius: "8px",
          marginBottom: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
        }}
      >
        {/* Left section: Logo + text */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          <img
            src={logo}
            alt="Company Logo"
            style={{
              height: "38px",
              background: "white",
              border: "2px solid white",
              borderRadius: "6px",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              animation: "zoomColor 4s ease-in-out infinite", // ✅ zoom + color
              display: "inline-block",
              marginLeft: "1.5%",
            }}
            noWrap
          >
            {storeNames.length > 0
              ? `${storeNames.join(", ")} - ${activeScreen === 1 ? "Open Orders" : "Closed Orders"
              }`
              : activeScreen === 1
                ? "Store - Open Orders"
                : "Store - Closed Orders"}
          </Typography>

          <style>
        {`
          @keyframes zoomColor {
            0% {
              transform: scale(1);
              color: ${colors[0]};
            }
            25% {
              transform: scale(1.15);
              color: ${colors[0]};
            }
            50% {
              transform: scale(1);
              color: ${colors[1]};
            }
            75% {
              transform: scale(1.15);
              color: ${colors[1]};
            }
            100% {
              transform: scale(1);
              color: ${colors[0]};
            }
          }
        `}
      </style>


        </Box>

        {/* Center section: Last Refreshed */}
        <Box sx={{ flex: 1, textAlign: "center" }}>
          {activeScreen === 1 && (
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", color: "white", whiteSpace: "nowrap" }}
            >
              Last Refreshed: {lastRefreshed}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, textAlign: "right" }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
              color: activeScreen === 1 ? "white" : "black",
              whiteSpace: "nowrap",
            }}
          >
            {currentTime.toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </Typography>
        </Box>
      </Box>

      {/* Data Table */}
      <div style={{ flexGrow: 1, minHeight: 0, overflow: "auto", backgroundColor: "#fff", borderRadius: "0 0 8px 8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
        <DataGrid
          rows={isFiltered ? filteredRows : displayRows}
          columns={activeScreen === 1 ? columns : columns1}
          pageSize={5}
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.id}
          components={{ Toolbar: CustomToolbar }}
          columnHeaderHeight={35}   // ✅ Use this instead of headerHeight
          getRowClassName={(params) => {
            if (params.row.isSubtotal) return "subtotal-row";

            const color = params.row.Delay_Color;
            if (color === "Green") return "row-green";
            if (color === "Yellow") return "row-yellow";
            if (color === "Red") return "row-red";

            return "";
          }}
          getCellClassName={(params) => {
            if (params.field === "Issue_Posted_on_Time") return "cell-green";
            if (params.field === "Issue_Posted_Delay60") return "cell-yellow";
            if (params.field === "Issue_Posted_Delay") return "cell-red";
            if (
              ["No_Of_Orders", "No_Of_Open_Orders", "No_Order_Close", "sno", "Order_Qty", "Issue_Qty", "Supv_Lead_Time", "Delay_Time"].includes(params.field)
            ) {
              return "cell-center";
            }
            return "";
          }}
          sx={{
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd",
              color: "black",
              fontWeight: "bold",
              lineHeight: "35px", // ✅ vertically align text
              padding: 0,         // ✅ remove extra padding
            },
            "& .MuiDataGrid-row.subtotal-row": {
              backgroundColor: "#f5f5f5",
              fontWeight: "bold",
              borderTop: "2px solid #999",
            },
            "& .MuiDataGrid-cell": {
              color: "#333",
              fontSize: "14px",
            },
            "& .row-green": { backgroundColor: "#d0f0c0" },
            "& .row-yellow": { backgroundColor: "#fff9c4" },
            "& .row-red": { backgroundColor: "#ffcdd2" },
            "& .cell-green": {
              backgroundColor: "#c8e6c9",
              fontWeight: "bold",
              textAlign: "center",
            },
            "& .cell-yellow": {
              backgroundColor: "#fff9c4",
              fontWeight: "bold",
              textAlign: "center",
            },
            "& .cell-red": {
              backgroundColor: "#ffcdd2",
              fontWeight: "bold",
              textAlign: "center",
            },
            "& .cell-center": {
              textAlign: "center",
            },
          }}
        />
      </div>
    </div>
  );
};

export default Store1url;
