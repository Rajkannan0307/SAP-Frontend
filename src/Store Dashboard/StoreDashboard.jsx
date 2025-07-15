import { Tabs, Tab, Box } from "@mui/material";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { decryptSessionData } from "../controller/StorageUtils";
import Store1Open from "./Store1Open";
import Store1Closed from "./Store1Closed";
import Store2Open from "./Store2Open";
import Store2Closed from "./Store2Closed";
import Store3Open from "./Store3Open";
import Store3Closed from "./Store3Closed";
import {
  getActiveStores,

} from "../controller/StoreDashboardapiservice";
// Dynamic component selector
const getStoreComponent = (storeKey, status) => {
  const componentMap = {
    "Store1-Open": Store1Open,
    "Store1-Closed": Store1Closed,
    "Store2-Open": Store2Open,
    "Store2-Closed": Store2Closed,
    "Store3-Open": Store3Open,
    "Store3-Closed": Store3Closed,
  };
  return componentMap[`${storeKey}-${status}`];
};

const StoreDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tabs, setTabs] = useState([]);
  const [PlantId, setPlantId] = useState(null);

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decrypted = decryptSessionData(encryptedData);
      if (decrypted) {
        setPlantId(decrypted.PlantID);
      }
    }
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
  try {
    const stores = await getActiveStores(PlantId); // directly get the array

    if (!Array.isArray(stores)) {
      console.warn("Invalid store response:", stores);
      return;
    }

    const generatedTabs = stores.flatMap((store, index) => {
      const storeKey = `Store${index + 1}`;
      return [
        {
          label: `${store.SLoc_Name} (Open)`,
          component: React.createElement(
            getStoreComponent(storeKey, "Open"),
            { storageCode: store.Storage_Code }
          ),
        },
        {
          label: `${store.SLoc_Name} (Closed)`,
          component: React.createElement(
            getStoreComponent(storeKey, "Closed"),
            { storageCode: store.Storage_Code }
          ),
        },
      ];
    });

    setTabs(generatedTabs);
  } catch (error) {
    console.error("Failed to fetch stores:", error);
  }
};

    if (PlantId) {
      fetchStores();
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
