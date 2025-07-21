import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  IconButton,
  Checkbox,
  Modal,
  Box,
  Select,
  Typography,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Table, TableBody, TableRow, TableCell } from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility"; // Import the icon
import { MenuItem, InputLabel, FormControl } from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { decryptSessionData } from "../controller/StorageUtils";
import {
  getdetails,
  getUpdates,
  getRejected,
  getEmployee,
  UpdateL2Approver,
} from "../controller/InwardApprovalservice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
const InwardApproval = () => {
  const [searchText, setSearchText] = useState("");
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);
  const [UserID, setUserID] = useState("");
  const [PlantID, setPlantID] = useState("");
  const [EmployeeID, setEmployeeID] = useState("");
  const [Employee, setEmployee] = useState("");
  const [RoleID, setRoleID] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [showSelect, setShowSelect] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedL2, setSelectedL2] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [InwardID, setInwardID] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [EmployeeTable, setEmployeeTable] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const columns = [
    { field: "Vendor_Code", headerName: "Vendor Code", flex: 1 },
    { field: "Vendor_Name", headerName: "Vendor Name", flex: 1 },
    { field: "Inward_Type", headerName: "Inward Type", flex: 1 },
    { field: "Invoice_Date", headerName: "Invoice Date", flex: 1 },
    //{ field: "Invoice_No", headerName: "Invoice No", flex: 1 },
    //{ field: "Invoice_Qty", headerName: "Invoice Quantity", flex: 1 },
    { field: "Invoice_Value", headerName: "Invoice Value", flex: 1 },
    { field: "Purchase_Order", headerName: "Purchase Order", flex: 1.2 },
    // { field: "Material_Code", headerName: "Part No", flex: 1 },
    // {
    //   field: "Monthly_Scheduled_Qty",
    //   headerName: "Monthly Scheduled Qty",
    //   flex: 1.5,
    // },
    // { field: "Current_Stock", headerName: "Current Stock", flex: 1 },
    { field: "Reason_For_Delay", headerName: "Reason For Delay", flex: 1.3 },

    {
      field: "Action",
      headerName: "Action",
      flex: 1,
      renderCell: (params) => (
        <div style={{ display: "flex",gap: 8 }}>
          {/* Approve Icon */}
          <IconButton
            size="large"
            color="success"
            onClick={() => handleopenApproveModal(params.row)}
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>

          {/* View Icon - Only if Inward_Type is D */}
          {params.row.Inward_Type === "Purchase" && (
            <IconButton
              size="large"
              color="primary"
              onClick={() => handleViewClick(params.row)} // Call to open ViewModal
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          )}

          {/* Checkbox */}
         
        </div>
      ),
    },
  ];

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      setUserID(decryptedData.UserID);
      setPlantID(decryptedData.PlantID);
      setRoleID(decryptedData.RoleId);
      setEmployeeID(decryptedData.EmpId);
    }
  }, []);
  console.log("inwardApproval role", RoleID);
  console.log("inwardApproval Plant", PlantID);
  const getData = async () => {
    try {
      const response = await getdetails(UserID, RoleID, PlantID, EmployeeID);
      console.log("inward appoval data", response);
      setData(response);
      setOriginalRows(response);
      setRows(response);
    } catch (error) {
      console.error(error);
      setData([]);
      setOriginalRows([]);
      setRows([]);
    }
  };

  useEffect(() => {
    if (UserID && RoleID && EmployeeID && PlantID) {
      getData();
    }
  }, [UserID, RoleID, EmployeeID, PlantID]);

  const get_Employee = async () => {
    try {
      const response = await getEmployee();
      setEmployeeTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );



  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();
    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        [
          "Vendor_Code",
          "Vendor_Name",
          "Invoice_No",
          "Invoice_Qty",
          "Invoice_Date",
          "Material_Code",
          "Invoice_Value",
          "Purchase_Order",
          "Monthly_Scheduled_Qty",
          "Current_Stock",
          "Reason_For_Delay",
          "Status",
        ].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };

  const handleViewClick = (row) => {
    setSelectedRow(row);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setSelectedRow(null);
    setViewModalOpen(false);
  };

  const handleopenApproveModal = (row) => {
    setComment("");
    setInwardID(row.Inward_ID); // ✅ corrected
    setSelectedRow(row);
    setShowSelect(""); // Optional: store selected row data
    setOpenModal(true);
    get_Employee();
  };

  const handleCloseModal = () => setOpenModal(false);
  const handleL2Click = () => {
    setShowSelect(true);
    get_Employee();
  };

  const handleApprove = async () => {
    if (!InwardID) {
      alert("No row selected. Please open the modal from a row.");
      return;
    }

    try {
      const data = {
        Inward_ID: InwardID,
        RoleID: RoleID,
        Approver: EmployeeID,

        Approver_Comment: comment,
        Modified_By: UserID,
      };

      console.log("Update payload:", data);

      const response = await getUpdates(data);

      if (response.data.success) {
        alert(response.data.message);
        getData(); // Refresh table
        handleCloseModal(); // Close modal
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(
        error.response?.data?.message ||
          "An unexpected error occurred while Approving the invoice."
      );
    }
  };

  const handleReject = async () => {
    if (!InwardID) {
      alert("No row selected. Please open the modal from a row.");
      return;
    }

    if (!comment.trim()) {
      alert("Comment is required to reject the invoice.");
      return;
    }

    try {
      const data = {
        Inward_ID: InwardID,
        RoleID: RoleID,
        Approver: EmployeeID,
        Approver_Comment: comment,
        Modified_By: UserID,
      };

      console.log("Update payload:", data);

      const response = await getRejected(data);

      if (response.data.success) {
        alert(response.data.message);
        getData(); // Refresh table
        handleCloseModal(); // Close modal
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(
        error.response?.data?.message ||
          "An unexpected error occurred while rejecting the invoice."
      );
    }
  };

  const handleL2Submit = async () => {
    if (!InwardID) {
      alert("No row selected. Please open the modal from a row.");
      return;
    }

    try {
      const data = {
        Inward_ID: InwardID,
        RoleID: RoleID,
        Approver: EmployeeID,
        Approver2: Employee,
        Approver_Comment: comment,
        Modified_By: UserID,
      };

      console.log("Update payload:", data);

      const response = await UpdateL2Approver(data);

      if (response.data.success) {
        alert(response.data.message);
        getData(); // Refresh table
        handleCloseModal(); // Close modal
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(
        error.response?.data?.message ||
          "An unexpected error occurred while Approving the invoice."
      );
    }
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
      {/* Header */}
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
          Inward of Old Invoice Approval
        </h2>
      </div>

      {/* Search and Download */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Type here..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyUp={handleSearch}
            sx={{
              width: "400px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  border: "2px solid grey",
                },
                "&:hover fieldset": {
                  border: "2px solid grey",
                },
                "&.Mui-focused fieldset": {
                  border: "2px solid grey",
                },
              },
            }}
          />
          <Button
            onClick={handleSearch}
            style={{
              borderRadius: "25px",
              border: "2px solid grey",
              color: "grey",
              fontWeight: "bold",
            }}
          >
            <SearchIcon style={{ marginRight: "5px" }} />
            Search
          </Button>
        </div>
      </div>

      {/* DataGrid */}
      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          overflowX: "hidden", // 👈 prevents horizontal scroll
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5} // Set the number of rows per page to 8
          rowsPerPageOptions={[5]}
          getRowId={(row) => row.Inward_ID} // Specify a custom id field
          onCellClick={(params, event) => {
            if (params.field === "Action") {
              event.stopPropagation();
            }
          }}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            // Header Style
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#bdbdbd", //'#696969', 	'#708090',  //"#2e59d9",
              color: "black",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "14px",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5", // Default row background
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            },
            // ✅ Remove Selected Row Background
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "inherit", // No background on selection
            },

            "& .MuiDataGrid-cell": {
              color: "#333",
              fontSize: "14px",
            },
          }}
        />
      </div>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            mx: "auto",
            mt: "10%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Comment Box */}
          <TextField
            label="Comment"
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {/* Centered Action Buttons */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button variant="contained" color="error" onClick={handleReject}>
              Reject
            </Button>
            <Button variant="contained" color="success" onClick={handleApprove}>
              Approve
            </Button>
            {RoleID === 7 && selectedRow?.Inward_Type === "Purchase" && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleL2Click}
              >
                L2 Approver
              </Button>
            )}
          </Box>

          {/* Conditional L2 Approver Select Box */}
          {/* L2 Select and Submit */}
          {showSelect && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>EmployeeID</InputLabel>
                <Select
                  label="EmployeeID"
                  name="EmployeeID"
                  value={Employee}
                  onChange={(e) => setEmployee(e.target.value)}
                >
                  {EmployeeTable.map((item) => (
                    <MenuItem key={item.Employee_ID} value={item.Employee_ID}>
                      {item.USER_NAME} - {item.Role_Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="secondary"
                onClick={handleL2Submit}
              >
                Submit L2 Approval
              </Button>
            </Box>
          )}
        </Box>
      </Modal>
      <Modal open={viewModalOpen} onClose={handleCloseViewModal}>
        <Box
          sx={{
            position: "relative",
            p: 4,
            width: { xs: "90%", sm: 800 },
            mx: "auto",
            mt: "10%",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
          }}
        >
          {/* ❌ Close Icon */}
          <IconButton
            aria-label="close"
            onClick={handleCloseViewModal}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#f44336",
              "&:hover": { color: "#d32f2f" },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* 🔷 Title */}
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              textAlign: "center",
              color: "#1976d2",
              borderBottom: "2px solid limegreen",
              display: "inline-block",
              mb: 3,
               fontWeight: 'bold', // ✅ Correct way to set bold font
            }}
          >
           View Purchase  Details
          </Typography>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "24px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#bdbdbd" }}>
                <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                  Invoice No
                </th>
                <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                  Invoice Quantity
                </th>
                <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                  PartNo
                </th>
                <th style={{ padding: "8px", border: "1px solid #ccc" }}>
              Monthly Scheduled Quantity
                </th>
                <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                  Current Stock
                </th>
                
               
              </tr>
            </thead>
           <tbody>
  <tr>
    <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>
      {selectedRow?.Invoice_No || "-"}
    </td>
    <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>
      {selectedRow?.Invoice_Qty || "-"}
    </td>
    <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>
      {selectedRow?.Material_Code || "-"}
    </td>
    <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>
      {selectedRow?.Monthly_Scheduled_Qty || "-"}
    </td>
    <td style={{ padding: "8px", border: "1px solid #ccc", textAlign: "center" }}>
      {selectedRow?.Current_Stock || "-"}
    </td>
  </tr>
</tbody>

          </table>
        </Box>
      </Modal>
    </div>
  );
};

export default InwardApproval;
