import React from "react";
import welcomeImage from "../images/landing.png";
import { Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleTransactionClick = () => {
    navigate("/home/dashboard"); // Adjust this path as needed
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 70px)", // Adjust height without causing scroll
        marginTop: "65px", // Adjust to your top bar height
        display: "flex",
        justifyContent: "flex-start", // Aligns content to the left
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#FAF8F5", // Optional background color for better visibility
      }}
    >
      <img
        src={welcomeImage}
        alt="Welcome"
        style={{
          maxWidth: "50%", // Adjust width to give space for the button
          maxHeight: "100%", // Maintains aspect ratio
          objectFit: "cover", // Shows the full image without cutting
          marginLeft: "350px",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginLeft: "100px", // Space between image and button
        }}
      >
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          onClick={handleTransactionClick}
          sx={{
            background: "linear-gradient(135deg, #1E3A8A, #3B82F6)", // Blue gradient
            color: "#FFFFFF",
            fontSize: "18px",
            padding: "12px 28px",
            textTransform: "none",
            borderRadius: "12px", // Rounded corners
            transition: "transform 0.3s ease, background 0.3s ease",
            boxShadow: "0 8px 16px rgba(59, 130, 246, 0.3)", // Soft shadow
            "&:hover": {
              background: "linear-gradient(135deg, #2563EB, #60A5FA)", // Hover gradient
              transform: "scale(1.05)", // Slight scale up
              boxShadow: "0 12px 24px rgba(59, 130, 246, 0.4)",
            },
            "&:active": {
              transform: "scale(0.98)", // Slight scale down on click
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
