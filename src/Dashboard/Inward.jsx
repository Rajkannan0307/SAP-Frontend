
import { Tabs, Tab, Box, Typography } from "@mui/material";
import React, { useState, } from "react";

import Purchase from"./Purchase"
import Service from"./service"
const Inward = () => {
  const [tabIndex, setTabIndex] = useState(0);

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
        height: "calc(100vh - 90px)",// or a specific height if necessary
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
            marginBottom: -7
          }}
        >
        Inward of Old Invoices
        </h2>
      </div>
     <Tabs
  value={tabIndex}
  onChange={handleChange}
  indicatorColor="primary"
  textColor="primary"
  style={{
    marginTop: "20px",
    borderBottom: "2px solid #2e59d9",
  }}
>
  <Tab
    label="Purchase Invoice"
    style={{
      fontWeight: "bold",
      textTransform: "none",
      backgroundColor: tabIndex === 0 ? "#e0e0f8" : "#f5f5f5",
      color: tabIndex === 0 ? "#2e59d9" : "#555",
      marginRight: 8,
      borderRadius: "5px 5px 0 0",
      padding: "8px 20px",
    }}
  />
  <Tab
    label="Service Invoice"
    style={{
      fontWeight: "bold",
      textTransform: "none",
      backgroundColor: tabIndex === 1 ? "#e0e0f8" : "#f5f5f5",
      color: tabIndex === 1 ? "#2e59d9" : "#555",
      marginRight: 8,
      borderRadius: "5px 5px 0 0",
      padding: "8px 20px",
    }}
  />
</Tabs>

  


      <Box sx={{ padding: 1,margin:-2}}>
        {tabIndex === 0 && <Purchase />}
        {tabIndex === 1 && <Service />}
      </Box>
  </div>


  );
};


export default Inward
