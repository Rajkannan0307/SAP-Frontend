import { Tabs, Tab, Box } from "@mui/material";
import React, { useState, useEffect } from "react";
import { decryptSessionData } from "../controller/StorageUtils";
import Store1Open from "./Store1Open";
import Store1Closed from "./Store1Closed";
import Store2Open from "./Store2Open";
import Store2Closed from "./Store2Closed";
import Store3Open from "./Store3Open";
import Store3Closed from "./Store3Closed";

// Plant to store name label
const storeLabelMap = {
  1: ["P2 Store 1", "P2 Store 2", "P2 Store 3"],
  2: ["P3 Store 1", "P3 Store 2"],
  3: ["P4 Store 1", "P4 Store 2", "P4 Store 3"],
  5: ["P5 Store 1", "P5 Store 2"],
};

// Map specific store-status to the component
const storeComponentMap = {
  "Store1-Open": <Store1Open />,
  "Store1-Closed": <Store1Closed />,
  "Store2-Open": <Store2Open />,
  "Store2-Closed": <Store2Closed />,
  "Store3-Open": <Store3Open />,
  "Store3-Closed": <Store3Closed />,
};

const StoreDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tabs, setTabs] = useState([]);
  const [PlantId, setPlantId] = useState(null);
  const [UserID, setUserID] = useState("");

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decrypted = decryptSessionData(encryptedData);
      if (decrypted) {
        setUserID(decrypted.UserID);
        setPlantId(decrypted.PlantID);
      }
    }
  }, []);

  useEffect(() => {
    const generateTabs = () => {
      const storeLabels = storeLabelMap[PlantId];
      if (!storeLabels) {
        setTabs([]);
        return;
      }

      const generatedTabs = [];

      storeLabels.forEach((label, index) => {
        const storeKey = `Store${index + 1}`;
        const openKey = `${storeKey}-Open`;
        const closedKey = `${storeKey}-Closed`;

        generatedTabs.push(
          {
            label: `${label} (Open)`,
            component: storeComponentMap[openKey],
          },
          {
            label: `${label} (Closed)`,
            component: storeComponentMap[closedKey],
          }
        );
      });

      setTabs(generatedTabs);
    };

    if (PlantId) {
      generateTabs();
    }
  }, [PlantId]);

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

      {tabs.length === 0 ? (
        <Box sx={{ padding: 2, color: "#999", fontStyle: "italic" }}>
          No store available for this plant.
        </Box>
      ) : (
        <>
          <Tabs
            value={tabIndex}
            onChange={handleChange}
            TabIndicatorProps={{
              style: { backgroundColor: "#88c57a", height: 4 },
            }}
            style={{ marginTop: "20px" }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                style={{
                  fontWeight: "bold",
                  textTransform: "none",
                  backgroundColor:
                    tabIndex === index ? "rgb(2, 94, 122)" : "#f5f5f5",
                  color: tabIndex === index ? "#fff" : "#555",
                  marginRight: 8,
                  borderRadius: "5px 5px 0 0",
                  padding: "8px 20px",
                }}
              />
            ))}
          </Tabs>

          <Box sx={{ padding: 1, margin: -2 }}>
            {tabs[tabIndex] && tabs[tabIndex].component}
          </Box>
        </>
      )}
    </div>
  );
};

export default StoreDashboard;
