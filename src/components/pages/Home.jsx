import React, { useState, useEffect } from "react";
import welcomeImage from "../images/landing.png";
import { Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { decryptSessionData } from "../../controller/StorageUtils";

const Home = () => {
  const navigate = useNavigate();
  const [Role, setRole] = useState(null);

  // Load user role on component mount
  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      if (decryptedData && decryptedData.RoleId) {
        setRole(decryptedData.RoleId);
        console.log("User Role:", decryptedData.RoleId);
      } else {
        console.error("Role not found in decrypted data.");
      }
    } else {
      console.error("No encrypted user data found.");
    }
  }, []);

  const handleTransactionClick = () => {
    navigate("/home/dashboard"); // Adjust this path as needed
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 70px)",
        marginTop: "65px",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#FAF8F5",
      }}
    >
      <img
        src={welcomeImage}
        alt="Welcome"
        style={{
          maxWidth: "50%",
          maxHeight: "100%",
          objectFit: "cover",
          marginLeft: "350px",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginLeft: "100px",
        }}
      >
        {/* Show button only if user role is admin (role ID 1) */}
       
  <Button
    variant="contained"
    size="large"
    endIcon={<ArrowForwardIcon />}
    onClick={handleTransactionClick}
    sx={{
      background: "linear-gradient(135deg, #1E3A8A, #3B82F6)",
      color: "#FFFFFF",
      fontSize: "18px",
      padding: "12px 28px",
      textTransform: "none",
      borderRadius: "12px",
      transition: "transform 0.3s ease, background 0.3s ease",
      boxShadow: "0 8px 16px rgba(59, 130, 246, 0.3)",
      "&:hover": {
        background: "linear-gradient(135deg, #2563EB, #60A5FA)",
        transform: "scale(1.05)",
        boxShadow: "0 12px 24px rgba(59, 130, 246, 0.4)",
      },
      "&:active": {
        transform: "scale(0.98)",
      },
    }}
  >
    Go to Transaction
  </Button>


       
      </div>
    </div>
  );
};

export default Home;
