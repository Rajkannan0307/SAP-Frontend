import React, { useState, useEffect } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from '@mui/material/IconButton';
import {
  Modal,
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,

} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close'; // For CloseIcon
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder'; // For QueryBuilderIcon
import axios from 'axios';

import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getdetails, getApprovalView, HandleApprovalAction, getPlants, getRole,get309ApprovalView } from '../controller/Approvalapiservice';
import { decryptSessionData } from "../controller/StorageUtils"



const Approval201202 = () => {
  // State to control the visibility of the modal
  const [openViewModal, setOpenViewModal] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
  const [RoleTable, setRoleTable] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);

  const [Comment, setComment] = useState('');
  // To manage the comment state

  const [openActionModal, setOpenActionModal] = useState(false); // For action modal visibility


  // State to store text entered in the search box
  const [searchText, setSearchText] = useState('');
  const [rows, setRows] = useState([]);


  // Function to open the view modal

  const [Trn309ID, setTrn309ID] = useState("");
  const [DocID, setDocID] = useState("");
  const [PlantID, setPlantID] = useState("");
  const [MovementID, setMovementID] = useState("");
  const [FromMatID, setFromMatID] = useState("");
  const [FromQty, setFromQty] = useState("");
  const [FromSLocID, setFromSLocID] = useState("");
  const [FromValuationType, setFromValuationType] = useState("");
  const [FromBatch, setFromBatch] = useState("");
  const [FromRatePerUnit, setFromRatePerUnit] = useState("");
  const [ToMatID, setToMatID] = useState("");
  const [ToQty, setToQty] = useState("");
  const [ToSLocID, setToSLocID] = useState("");
  const [ToValuationType, setToValuationType] = useState("");
  const [ToBatch, setToBatch] = useState("");
  const [ToRatePerUnit, setToRatePerUnit] = useState("");
  const [FromDescription, setDescription] = useState("");
  const [Remark, setRemark] = useState("");
  const [SAPTransactionStatus, setSAPTransactionStatus] = useState("");
  const [FromPrice, setFromPrice] = useState("");
  const [ToDescription, setToDescription] = useState("");
  const [ToPrice, setToPrice] = useState("");
  const [PlantCode, setPlantCode] = useState('');
  const [Date, setDate] = useState("");
  const [FromMatCode, setFromMatCode] = useState("");
  const [ToMatCode, setToMatCode] = useState("");
  const [NetDifferentPrice, setNetDifferentPrice] = useState("");
  const [ApprovalStatus, setApprovalStatus] = useState([]);
 const [Doc_ID, setDoc_ID] = useState(null);

  //ApprovalListView
  const [Role, setRole] = useState('');
  const UserID = localStorage.getItem('UserID');
  const RoleID = localStorage.getItem('RoleID');
  const Approval_Level = localStorage.getItem('Approval_Level');
  console.log('Approval_Level', Approval_Level)
  const Plant_ID = localStorage.getItem('Plant_ID')

  console.log('pl', Plant_ID)

  //ApprovalListView (View approver status)
const [openViewStatusModal, setOpenViewStatusModal] = useState(false);
const [viewStatusData, setViewStatusData] = useState([]);


  useEffect(() => {
    const encryptedData = sessionStorage.getItem('userData');
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      setRole(decryptedData.RoleId);
      console.log("us", decryptedData.RoleId)

    }
  }, []);


  const handleViewStatus = async (docId) => {
  console.log("Fetching approval status for Doc_ID:", docId);
  try {
    const response = await get309ApprovalView(docId);  // Make sure get309ApprovalView is set up properly
    console.log("API Response:", response);
    setViewStatusData(response);  // Update your state with the fetched data
  } catch (error) {
    console.error("❌ Error fetching grouped records:", error);
    setViewStatusData([]);  // Handle errors and reset data
  }
};





const handleOpenViewStatusModal = async (rowData) => {
  const docId = rowData?.Doc_ID; // ✅ Get only Doc_ID
  console.log("Opening View Status Modal for Doc_ID:", docId);

  setOpenViewStatusModal(true);
  await handleViewStatus(docId); // ✅ Pass only Doc_ID to API call
};



  //console.log('📤 Sending request to backend with params:', { Plant, Role });

  const handleOpenViewModal = async (item) => {
    console.log("Opening modal with item:", item);

    // Make sure Doc_ID exists and is numeric
    if (!item.Doc_ID || isNaN(item.Doc_ID)) {
      console.error("❌ Invalid Doc_ID:", item.Doc_ID);
      return;
    }

    await getViewButton(item.Doc_ID);  // ✅ Load the data BEFORE showing the modal
    setOpenViewModal(true);            // ✅ Show modal AFTER data is loaded
  };


  const handleCloseViewModal = () => {
    setOpenViewModal(false);  // Closes the modal
  };

  // Function to handle search input (you can implement filtering here)
  const handleSearch = () => {
    console.log("Searching for:", searchText);
    // TODO: Add logic to filter your data based on searchText
  };

  // Table columns for DataGrid
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Doc_ID", headerName: "Doc ID ", flex: 1 },
    { field: "Date", headerName: "Date", flex: 1 },
    { field: "Movement_Type", headerName: "Movement Type", flex: 1 },
    { field: "Request_By", headerName: "Requset By", flex: 1 },
    { field: "Approver_Status", headerName: "Approver Status", flex: 1 },

    // View Column
    {
      field: "view",
      headerName: "View",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <IconButton
            size="large"
            color="primary"
            onClick={() => handleOpenViewModal(params.row)} // Pass row data to the view modal
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },

    // Approve Column
    {
      field: "approved",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <IconButton
            size="large"
            color="success"
            onClick={() => handleActionOpen(params.row)} // Call approve function with row data
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },



  ];

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );


  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const GetRole = async () => {
    try {
      const response = await getRole();
      setRoleTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };


  const getData = async () => {
    try {
      const response = await getdetails(Plant_ID, RoleID, Role);

      console.log('response 309', response);  // Check the structure of response
      setData(response);  // Ensure that this is correctly setting the data
      setOriginalRows(response); // for reference during search
      setRows(response);

    } catch (error) {
      console.error(error);
      setData([]);  // Handle error by setting empty data
      setOriginalRows([]); // handle error case
      setRows([]);
    }
  };

  const getViewButton = async (docId) => {
    try {
      const response = await getApprovalView(docId);

      setSelectedRow(response); // Set grouped records

    } catch (error) {

      setSelectedRow([]); // Fallback to empty array
    }
  };




  useEffect(() => {
    getData();
  }, []);


  // Handle action buttons
  const handleApprove = async () => {
    // Ensure there's a selected row to approve
    if (!selectedRow) {
      alert("No document selected for approval.");
      return;
    }


    // Prepare the data object to send for approval
    const data = {
      Doc_ID: selectedRow.Doc_ID, 
      Approver_Comment: Comment, 
      Action: "Approved", 
      UserID: UserID,  
      Approval_Level: Role,  // Current approval level
    };


    console.log('Sending approval data:', data);

    try {
      // Call the HandleApprovalAction API to process the approval
      const response = await HandleApprovalAction(data);

      console.log('sdfg', response);

      // Check for success in the response
      if (response && response.success && response.success) {
        alert("Document Approved!");
        setOpenActionModal(false);  // Close the modal after successful approval
        getData();  // Refresh the data/grid after approval
      } else {
        alert(response.message || "Approval Failed.");
      }
    } catch (error) {
      console.error("Approval error:", error);

      // Provide specific error message if available
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while approving the document.");
      }
    }
  };

  const handleReject = async () => {
    if (!selectedRow) {
      alert("No document selected for rejection.");
      return;
    }

    if (!Comment.trim()) {
      alert("Please provide a comment for rejection.");
      return;
    }

    const data = {
      Doc_ID: selectedRow.Doc_ID,
      Approver_Comment: Comment,
      Action: "Rejected",
      UserID: UserID,
      Approval_Level: Role
    };

    console.log("Sending rejection data:", data);

    try {
      const response = await HandleApprovalAction(data);
      console.log("Rejection API response:", response);

      const isSuccess = response?.data?.success ?? response?.success;

      if (isSuccess) {
        alert("Document Rejected!");
        setOpenActionModal(false);
        getData();
      } else {
        const message = response?.data?.message ?? response?.message ?? "Rejection failed.";
        alert(message);
      }
    } catch (error) {
      console.error("Rejection error:", error);
      const errMsg = error.response?.data?.message || "An error occurred while rejecting the document.";
      alert(errMsg);
    }
  };


  const handleQuery = async () => {
    if (!selectedRow) {
      alert("No document selected for query.");
      return;
    }

    if (!Comment.trim()) {
      alert("Please provide a comment for query.");
      return;
    }

    const data = {
      Doc_ID: selectedRow.Doc_ID,
      Approver_Comment: Comment,
      Action: "Under Query",
      UserID: UserID,
      Approval_Level: Role
    };

    console.log("Sending query data:", data);

    try {
      const response = await HandleApprovalAction(data);
      console.log("Query API response:", response);

      const isSuccess = response?.data?.success ?? response?.success;

      if (isSuccess) {
        alert("Document sent for query successfully!");
        setOpenActionModal(false);
        getData();
      } else {
        const message = response?.data?.message ?? response?.message ?? "Failed to send query.";
        alert(message);
      }
    } catch (error) {
      console.error("Query error:", error);
      const errMsg = error.response?.data?.message || "An error occurred while sending query on the document.";
      alert(errMsg);
    }
  };



  const handleActionOpen = (row) => {
    console.log('Row selected for action:', row);
    setSelectedRow(row);  // Store selected row to pass to the modal
    setOpenActionModal(true);  // Open the action modal
  };


  const handleCancel = () => {
    setOpenActionModal(false); // Simply close the modal without doing anything
  };


  const thStyle = {
    padding: "8px",
    borderBottom: "1px solid #ccc",
    textAlign: "left",
  };

  const tdStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee",
  };


  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header Section */}
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
            textDecorationColor: "limegreen",
            marginBottom: -7,
            textDecorationThickness: '3px'
          }}
        >
          201/202 Approval
        </h2>
      </div>

      {/* Search and Filter Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {/* Search input and button */}
        <div style={{ display: "flex", gap: "10px" }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Type here..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)} // Update state as user types
            onKeyUp={handleSearch} // Optional: Trigger search on key press
            style={{ width: "400px" }}
          />
          <Button
            onClick={handleSearch}
            style={{
              borderRadius: "25px",
              border: "2px solid skyblue",
              color: "skyblue",
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            <SearchIcon style={{ marginRight: "5px" }} />
            Search
          </Button>
        </div>
      </div>

      {/* ✅ DataGrid */}
      <div
        style={{
          flexGrow: 1,  // Ensures it grows to fill the remaining space
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "500px"
        }}
      >

        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          getRowId={(row) => row.Doc_ID} // Ensure Trn_309_ID is unique and exists
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            // Header Style
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#2e59d9",
              color: "white",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "16px",
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

      {/* View Modal for row details */}

      <Modal open={openViewModal} onClose={() => setOpenViewModal(false)}>
        <Box
          sx={{

            width: 900,
            height: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "5%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            overflowY: "auto",
            cursor: "scroll",
          }}
        >
          <div style={{ width: "100%", textAlign: "center" }}>
            <h3
              style={{
                marginBottom: "15px",
                color: "blue",
                textDecoration: "underline",
                textDecorationColor: "limegreen",
                textDecorationThickness: "3px",
              }}
            >
              Document Details
            </h3>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Plant Code</TableCell>
                <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Date</TableCell>
                <TableCell sx={{ backgroundColor: "blue", color: "white" }}>From Material</TableCell>
                <TableCell sx={{ backgroundColor: "blue", color: "white" }}>To Material </TableCell>
                <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Qty</TableCell>
                <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Net Difference Price</TableCell>

              </TableRow>
            </TableHead>

            <TableBody>
              {selectedRow && selectedRow.length > 0 && (
                <>
                  {/* Calculate the total sum of Total_Net_Difference */}

                  {selectedRow.map((item, index, array) => {
                    console.log('item', item);

                    const totalNetDifference = selectedRow.reduce((acc, item) => acc + item.Net_Difference
                      , 0);
                    return (
                      <React.Fragment key={index}>
                        {/* Table row with item details */}
                        <TableRow>
                          <TableCell>{item.Plant_Code}</TableCell>
                          <TableCell>{item.Date}</TableCell>
                          <TableCell>{item.From_Material}</TableCell>
                          <TableCell>{item.To_Material}</TableCell>
                          <TableCell>{item.Qty}</TableCell>
                          <TableCell sx={{ textAlign: "right" }}>{item.Net_Difference}</TableCell>

                        </TableRow>

                        {/* Total row, displayed after the last item */}
                        {index === array.length - 1 && (
                          <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                            <TableCell colSpan={5} sx={{ textAlign: "right", fontWeight: "bold" }}>
                              Total
                            </TableCell>
                            <TableCell sx={{ textAlign: "right",  fontWeight: "bold" }}>
                              {totalNetDifference} {/* Display total sum here */}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </TableBody>

          </Table>

          <Button
            onClick={() => setOpenViewModal(false)}
            variant="contained"
            size="small"
            color="error"
            sx={{
              mt: 2,              // Margin top for spacing
              width: "120px",     // Fixed width
              alignSelf: "center",
              backgroundColor: "#f44336", // Red 
              '&:hover': {
                backgroundColor: "#d32f2f", // Darker red when hovered 
              },
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>

    

     {/* Action modal  */}
<Modal open={openActionModal} onClose={handleCancel}>
  <Box
    sx={{
      width: 400,
      bgcolor: "background.paper",
      borderRadius: 2,
      boxShadow: 24,
      p: 4,
      margin: "auto",
      marginTop: "10%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <Typography
      variant="h5"
      sx={{
        color: "#1565c0",
        mb: 3,
        textAlign: "center",
        fontWeight: "bold",
        textDecoration: "underline",
        textDecorationColor: "limegreen",
        textDecorationThickness: "3px",
      }}
    >
      309 Approval
    </Typography>

    <TextField
      label="Enter your comment"
      multiline
      rows={4}
      variant="outlined"
      fullWidth
      margin="normal"
      onChange={(e) => setComment(e.target.value)}
    />

    {/* Action Buttons */}
    <Box display="flex" justifyContent="space-between" width="100%" mt={2}>
      <Button
        variant="contained"
        color="success"
        onClick={handleApprove}
        startIcon={<CheckCircleIcon />}
      >
        Approve
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={handleReject}
        startIcon={<CloseIcon />}
      >
        Reject
      </Button>
      <Button
        variant="contained"
        color="warning"
        onClick={handleQuery}
        startIcon={<QueryBuilderIcon />}
      >
        Query
      </Button>
    </Box>

    {/* ✅ Fixed View Button */}
    <Button
      variant="outlined"
      color="secondary"
      onClick={() => handleOpenViewStatusModal(selectedRow)} // ✅ Using selectedRow instead of params
      sx={{
        mt: 2,
        color: '#4a148c',
        borderColor: '#4a148c',
        '&:hover': {
          backgroundColor: '#4a148c',
          color: '#ffffff',
          borderColor: '#4a148c',
        },
      }}
    >
      View Approval Status
    </Button>

    {/* Cancel Button */}
    <Button
      variant="outlined"
      onClick={handleCancel}
      sx={{
        marginTop: "20px",
        backgroundColor: "gray",
        color: "black",
        borderColor: "black",
        '&:hover': {
          borderColor: "black",
          backgroundColor: "#e0e0e0",
        },
      }}
    >
      Cancel
    </Button>
  </Box>
</Modal>



<Modal open={openViewStatusModal} onClose={() => setOpenViewStatusModal(false)}>
  <Box
    sx={{
      width: 610,
      bgcolor: "background.paper",
      borderRadius: 2,
      boxShadow: 24,
      // fontSize: 12,
      p: 3,
      margin: "auto",
      marginTop: "10%",
      position: "relative", // to position X button
    }}
  >
    {/* ❌ Top-right close (X) button */}
    <IconButton
      onClick={() => setOpenViewStatusModal(false)}
      sx={{ position: "absolute", top: 8, right: 8 }}
    >
      <CloseIcon />
    </IconButton>

    {/* 📝 Modal Title */}
    <Typography
      variant="h6"
      align="center"
      sx={{
        mb: 2,
        fontWeight: "bold",
        color: "#1565c0",
        textDecoration: "underline",
        textDecorationColor: "limegreen",
        textDecorationThickness: "3px",
      }}
    >
      Approval Status Details
    </Typography>

    {/* 📋 Table */}
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Date</TableCell>
          <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Role</TableCell> 
          <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Name</TableCell>
          <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Comment</TableCell>
          <TableCell sx={{ backgroundColor: "blue", color: "white" }}>Status</TableCell>   
        </TableRow>
      </TableHead>
    <TableBody>
  {viewStatusData.map((item, index) => (
    <TableRow key={index}>
      <TableCell>{item.Date}</TableCell>
      <TableCell>{item.Role}</TableCell>
      <TableCell>{item.Modified_By}</TableCell>
      <TableCell>{item.Approver_Comment}</TableCell>
      <TableCell>{item.Status}</TableCell>
    </TableRow>
  ))}
</TableBody>




    </Table>
  </Box>
</Modal>

    </div>
  );
};

export default Approval201202;
