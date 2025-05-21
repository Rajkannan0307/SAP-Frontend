import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Box,
  Divider,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { decryptSessionData } from "../../controller/StorageUtils";
import axios from "axios";
import DescriptionIcon from "@mui/icons-material/Description";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import FactCheckIcon from "@mui/icons-material/FactCheck";

import { api } from "../../controller/constants";

const ApproverHome = () => {
  const navigate = useNavigate();
  const [approvalStatus, setApprovalStatus] = useState({});

 const approvalItems = [
  { id: "4", title: "309 Part no Conversion", path: "/home/Approval_309", movementId: 4, icon: <AssignmentIcon /> },
  { id: "3", title: "201 Approval", path: "/approval/201", movementId: 3, icon: <VerifiedIcon /> },
  { id: "2", title: "311 Approval", path: "/approval/311", movementId: 2, icon: <CheckCircleIcon /> },
  { id: "1", title: "511 Approval", path: "/approval/511", movementId: 1, icon: <FactCheckIcon /> },
  { id: "5", title: "202 Approval", path: "/approval/202", movementId: 5, icon: <TaskAltIcon /> },
  { id: "6", title: "203 Approval", path: "/approval/203", movementId: 6, icon: <AssignmentIcon /> },
  { id: "7", title: "204 Approval", path: "/approval/204", movementId: 7, icon: <VerifiedIcon /> },
  { id: "8", title: "205 Approval", path: "/approval/205", movementId: 8, icon: <CheckCircleIcon /> },
  { id: "9", title: "206 Approval", path: "/approval/206", movementId: 9, icon: <FactCheckIcon /> },
  { id: "10", title: "207 Approval", path: "/approval/207", movementId: 10, icon: <TaskAltIcon /> },
  { id: "11", title: "208 Approval", path: "/approval/208", movementId: 11, icon: <AssignmentIcon /> },
  { id: "12", title: "209 Approval", path: "/approval/209", movementId: 12, icon: <VerifiedIcon /> },
  { id: "13", title: "210 Approval", path: "/approval/210", movementId: 13, icon: <CheckCircleIcon /> },
  { id: "14", title: "211 Approval", path: "/approval/211", movementId: 14, icon: <FactCheckIcon /> },
];


  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      if (decryptedData?.RoleId && decryptedData?.PlantID) {
        fetchApprovals(decryptedData.RoleId, decryptedData.PlantID);
      }
    }
  }, []);

  const fetchApprovals = async (roleId, plantId) => {
    try {
      const responses = await Promise.all(
        approvalItems.map((item) =>
          axios.get(`${api}/ApprovalHomePage/get_details_309Approval`, {
            params: { roleId, plantId, movementId: item.movementId },
          })
        )
      );

      const statusObj = {};
      responses.forEach((res, index) => {
        const id = approvalItems[index].id;
        statusObj[id] = res.data?.length > 0;
      });

      setApprovalStatus(statusObj);
    } catch (error) {
      console.error("Error fetching approval statuses:", error);
    }
  };

  const itemsPerRow = 5;
  const groupedItems = [];
  for (let i = 0; i < approvalItems.length; i += itemsPerRow) {
    groupedItems.push(approvalItems.slice(i, i + itemsPerRow));
  }

  return (
    <Box
  sx={{
    backgroundColor: "#ffffff",
    height: "890px",
    overflow: "hidden", // ✅ Prevent scrolling
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    pt: 6,
  }}
>

      <Typography variant="h4" fontWeight="bold" mb={2} mt={8}>
        Approvals
      </Typography>

      <Box
        sx={{
          backgroundColor: "rgb(219, 236, 240)",
          borderRadius: "16px",
          padding: 4,
          boxShadow: "0 0 12px rgb(202, 190, 157)",
          width: "90%",
          maxWidth: "1300px",
          height: "55%",
          maxHeight: "1400px",
          
        }}
      >
        <Box>
          {groupedItems.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                  gap: 2,
                  mb: 5,
                  mt:5,
                  
                }}
              >
                {group.map((item) => {
                  const hasApproval = approvalStatus[item.id];
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1,
                        height: "70px",
                         
                        background: hasApproval
                          ? "linear-gradient(135deg,rgb(98, 218, 226),rgb(9, 106, 136))"
                          : "#ccc",
                        borderRadius: 2,
                        boxShadow: hasApproval
                          ? "0 0 10px rgba(3, 17, 39, 0.5)"
                          : "0 2px 6px rgba(0,0,0,0.08)",
                        transition: "0.3s ease",
                       
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                       <Box sx={{ fontSize: 24, color: hasApproval ? "#1e3a8a" : "#666666" }}>
  {item.icon}
</Box>


                        <Typography
                          variant="body2"
                          fontWeight="500"
                          color={hasApproval ? "#ffffff" : "#000000"}
                        >
                          {item.title}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        onClick={() => navigate(item.path)}
                        disabled={!hasApproval}
                        sx={{
                          background: hasApproval
                            ? "linear-gradient(135deg, #1E3A8A, #3B82F6)"
                            : "#E5E7EB",
                          color: hasApproval ? "#fff" : "#ccc",
                          textTransform: "none",
                          fontWeight: "bold",
                          fontSize: "14px",
                          padding: "4px 12px",
                          minWidth: "90px",
                          borderRadius: "8px",
                          "&:hover": {
                            background: hasApproval
                              ? "linear-gradient(135deg, #1E3A8A, #3B82F6)"
                              : "#D1D5DB",
                          },
                        }}
                      >
                        Approve
                      </Button>
                    </Box>
                  );
                })}
              </Box>

              {/* Divider after each row except the last */}
              {groupIndex < groupedItems.length - 1 && (
                <Divider sx={{ my: 2 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ApproverHome;
