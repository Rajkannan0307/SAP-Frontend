import { Tabs, Tab, Box, Typography } from "@mui/material";
import React, { useState } from "react";
import Store1Open from "./Store1Open";
import Store1Closed from "./Store1Closed";
import Store2Open from "./Store2Open";
import Store2Closed from "./Store2Closed";
import Store3Open from "./Store3Open";
import Store3Closed from "./Store3Closed";

const StoreDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const tabConfig = [
    { label: "Store1 (Open)", component: <Store1Open /> },
    { label: "Store1 (Closed)", component: <Store1Closed /> },
    { label: "Store2 (Open)", component: <Store2Open /> },
    { label: "Store2 (Closed)", component: <Store2Closed /> },
    { label: "Store3 (Open)", component: <Store3Open /> },
    { label: "Store3 (Closed)", component: <Store3Closed /> },
  ];

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

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
        <h2
          style={{
            margin: 0,
            color: "#2e59d9",
            textDecoration: "underline",
            textDecorationColor: "#88c57a",
            textDecorationThickness: "3px",
            marginBottom: -7,
          }}
        >
          Store Dashboard
        </h2>
      </div>

      <Tabs
        value={tabIndex}
        onChange={handleChange}
        TabIndicatorProps={{
          style: {
            backgroundColor: "#88c57a",
            height: 4,
            borderRadius: 2,
          },
        }}
        style={{ marginTop: "20px" }}
      >
        {tabConfig.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            style={{
              fontWeight: "bold",
              textTransform: "none",
              backgroundColor: tabIndex === index ? "rgb(2, 94, 122)" : "#f5f5f5",
              color: tabIndex === index ? "#fff" : "#555",
              marginRight: 8,
              borderRadius: "5px 5px 0 0",
              padding: "8px 20px",
            }}
          />
        ))}
      </Tabs>

      <Box sx={{ padding: 1, margin: -2 }}>
        {tabConfig[tabIndex].component}
      </Box>
    </div>
  );
};

export default StoreDashboard;
