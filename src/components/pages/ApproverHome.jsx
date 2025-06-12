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
import { FiCheckCircle } from "react-icons/fi";
import { api } from "../../controller/constants";

const ApproverHome = () => {
  const navigate = useNavigate();
  const [approvalStatus, setApprovalStatus] = useState({});

  const approvalItems = [
    {
      id: "4",
      title: "309 Part no Conversion",
      path: "/home/Approval_309",
      endpoint: "/ApprovalHomePage/get_details_309Approval",
      movementId: 4,
      icon: <FiCheckCircle />,
    },
    {
      id: "2",
      title: "201 Stock Posting",
      path: "/home/Approval_201",
      endpoint: "/ApprovalHomePage/get_details_309Approval",
      movementId: 2,
      icon: <FiCheckCircle />,
    },
    {
      id: "3",
      title: "202 Stock Posting",
      path: "/home/Approval_202",
      endpoint: "/ApprovalHomePage/get_details_309Approval",
      movementId: 3,
      icon: <FiCheckCircle />,
    },
    {
      id: "11a",
      title: "311 Location Transfer",
      path: "/approval/311",
      endpoint: "/ApprovalHomePage/get_details_311Approval",
      movementId: 11,
      icon: <FiCheckCircle />,
    },
    {
      id: "1",
      title: "511 Scrap Posting",
      path: "/approval/511",
      endpoint: "/ApprovalHomePage/get_details_511Approval",
      movementId: 1,
      icon: <FiCheckCircle />,
    },
    {
      id: "5",
      title: "Rs1 Conversion",
      path: "/approval/202",
      endpoint: "/ApprovalHomePage/get_details_Rs1Approval",
      movementId: 5,
      icon: <FiCheckCircle />,
    },
    {
      id: "6",
      title: "ME38 Manual Schedule",
      path: "/approval/203",
      endpoint: "/ApprovalHomePage/get_details_ME38Approval",
      movementId: 6,
      icon: <FiCheckCircle />,
    },
    {
      id: "7",
      title: "RGP/NRGP ",
      path: "/approval/204",
      endpoint: "/ApprovalHomePage/get_details_RGPApproval",
      movementId: 7,
      icon: <FiCheckCircle />,
    },
    {
      id: "8",
      title: "Inward of Old Invoices",
      path: "/home/InwardApproval",
      endpoint: "/ApprovalHomePage/get_details_InwardOldInvoice",
      movementId: 8,
      icon: <FiCheckCircle />,
    },
    {
      id: "9",
      title: "Emergency Procurement",
      path: "/approval/206",
      endpoint: "/ApprovalHomePage/get_details_EmergencyApproval",
      movementId: 9,
      icon: <FiCheckCircle />,
    },
    {
      id: "10",
      title: "Production Order Aging Control Change",
      path: "/approval/207",
      endpoint: "/ApprovalHomePage/get_details_POAgingApproval",
      movementId: 10,
      icon: <FiCheckCircle />,
    },
    {
      id: "11b",
      title: "Phy Inventory Adjustment",
      path: "/approval/208",
      endpoint: "/ApprovalHomePage/get_details_InventoryAdjustment",
      movementId: 11,
      icon: <FiCheckCircle />,
    },
    {
      id: "12",
      title: "Scrap  Disposal ",
      path: "/approval/209",
      endpoint: "/ApprovalHomePage/get_details_ScrapDisposal",
      movementId: 12,
      icon: <FiCheckCircle />,
    },
    {
      id: "13",
      title: "Subcontracting Stock Value / Aging Change",
      path: "/approval/210",
      endpoint: "/ApprovalHomePage/get_details_Subcontracting",
      movementId: 13,
      icon: <FiCheckCircle />,
    },
    {
      id: "14",
      title: "Material Status Change",
      path: "/approval/211",
      endpoint: "/ApprovalHomePage/get_details_MaterialStatus",
      movementId: 14,
      icon: <FiCheckCircle />,
    },
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
      const statusObj = {};
      await Promise.all(
        approvalItems.map(async (item) => {
          const response = await axios.get(`${api}${item.endpoint}`, {
            params: {
              roleId,
              plantId,
              movementId: item.movementId,
            },
          });
          statusObj[item.id] = response.data?.length > 0;
        })
      );
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
        height: "calc(100vh - 90px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pt: 6,
      }}
    >
      <Typography variant="h4" fontWeight="bold" mb={3} mt={5} color="#2e59d9">
        Approvals
      </Typography>

      <Box
        sx={{
          justifyContent: "center",
          backgroundColor: "rgb(219, 236, 240)",
          borderRadius: "16px",
          padding: 4,
          boxShadow: "0 0 12px rgb(202, 190, 157)",
          width: "90%",
          maxWidth: "1900px",
          height: "485x",
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
                  mt: 5,
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
                        background: hasApproval ? "#ffffff" : "#DADADA",
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
                        <Typography sx={{ fontSize: 13 }} color={hasApproval ? "rgb(2, 5, 12)" : "#C0C0C0"}>
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
                          left: 6,
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

              {groupIndex < groupedItems.length - 1 && (
                <Divider sx={{ border: "2px solid rgba(43, 43, 44, 0.2)" }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ApproverHome;
