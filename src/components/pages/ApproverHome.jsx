import React, { useState, useEffect } from "react";
import welcomeImage from "../images/ApproverLanding.png";
import { Button, Stack } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { decryptSessionData } from "../../controller/StorageUtils";
import axios from "axios";
import { api } from "../../controller/constants";
const ApproverHome = () => {
  const navigate = useNavigate();
  const [approvalStatus, setApprovalStatus] = useState({
    "309": false,
    "202": false,
    "201": false,
  });

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");

    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      if (decryptedData?.RoleId && decryptedData?.PlantID) {
        checkApprovals(decryptedData.RoleId, decryptedData.PlantID);
      } else {
        console.error("Missing RoleId or PlantId in decrypted data");
      }
    } else {
      console.error("No encrypted user data found.");
    }
  }, []);

  const checkApprovals = async (roleId, plantId) => {
    try {
      const [res309, res202, res201] = await Promise.all([
  axios.get(`${api}/ApprovalHomePage/get_details_309Approval`, {
    params: { roleId, plantId, movementId: 309 },
  }),
  axios.get(`${api}/ApprovalHomePage/get_details_202Approval`, {
    params: { roleId, plantId, movementId: 202 },
  }),
  axios.get(`${api}/ApprovalHomePage/get_details_201Approval`, {
    params: { roleId, plantId, movementId: 201 },
  }),
]);

      const newStatus = {
        "309": res309.data?.length > 0,
        "202": res202.data?.length > 0,
        "201": res201.data?.length > 0,
      };

      console.log("Approval Status:", newStatus); // Debug log
      setApprovalStatus(newStatus);
    } catch (error) {
      console.error("Error fetching approval statuses:", error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const getButtonStyle = (isPending) => ({
    background: isPending
      ? "linear-gradient(135deg, #1E3A8A, #3B82F6)"
      : "#E5E7EB",
    color: isPending ? "#FFFFFF" : "#374151",
    fontSize: "16px",
    padding: "10px 24px",
    textTransform: "none",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    boxShadow: isPending ? "0 6px 12px rgba(7, 14, 114, 0.4)" : "none",
    "&:hover": {
      background: isPending
        ? "linear-gradient(135deg, #1E3A8A, #3B82F6)"
        : "#D1D5DB",
      transform: "scale(1.03)",
    },
  });

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
        backgroundColor: "#F9F6F1",
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
          gap: "20px",
        }}
      >
       

        <Stack direction="row" spacing={2}>
          <Button
            onClick={() => handleNavigate("/home/Approval_309")}
            sx={getButtonStyle(approvalStatus["309"])}
          >
            309 Approval
          </Button>
          <Button
            onClick={() => handleNavigate("/approval/202")}
            sx={getButtonStyle(approvalStatus["202"])}
          >
            202 Approval
          </Button>
          <Button
            onClick={() => handleNavigate("/approval/201")}
            sx={getButtonStyle(approvalStatus["201"])}
          >
            201 Approval
          </Button>
        </Stack>
      </div>
    </div>
  );
};

export default ApproverHome;
