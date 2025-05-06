import React, { useState, useEffect } from 'react';
import { Box, Stack, IconButton, Typography, Button, Modal, FormControl, InputLabel, OutlinedInput,MenuItem } from '@mui/material';
 import { AddMenuAccess, get_Menus, get_Menus_Not, get_Sub_Menu } from '../controller/AdminMasterapiservice';
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import{
    
    Select,
    
  } from "@mui/material";
import { deepOrange } from '@mui/material/colors';
import { IoArrowBack } from "react-icons/io5";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";

import { decryptSessionData } from "../controller/StorageUtils";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { toast } from "react-toastify";
import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport,
  } from "@mui/x-data-grid";
import { ToastContainer } from 'react-toastify';
// import Select from 'react-select'; // Import react-select

const Admin = () => {
    const navigate = useNavigate();
    const { roleId } = useParams();
    const location = useLocation();
    const role = location.state?.role || '';
    const roleIdNo = location.state?.Role_No;


    const [menuData, setMenuData] = useState([]);
   
    const [roleno, setRoleno] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [Menu, setMenu] = useState([]);
    const [submenu, setSubmenu] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [MenuTable, setMenuTable] = useState([]);
    
    

    const Username = localStorage.getItem('UserName');
    const UserID = localStorage.getItem('UserID');
  
  const RoleID = localStorage.getItem('RoleID');
  
    // ✅ Custom Toolbar
      const CustomToolbar = () => (
        <GridToolbarContainer>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarExport />
        </GridToolbarContainer>
      );
    // // Fetching menu data based on roleId
    const getData = async () => {
        try {
            const response = await get_Menus(role, roleIdNo);
            console.log(response);
            console.log('roleIdNo:', roleIdNo); // should be a number
                  
            setMenuData(response.data);
            
           
        } catch (error) {
            console.error("Error fetching menu data", error);
          
        }
    };
    
  
    useEffect(() => {
        if (roleId) {
            setRoleno(roleId);
            console.log('roleId from URL:', roleId);
            getData();
        } else {
            console.error('roleId is undefined!');
        }
        const encryptedData = sessionStorage.getItem("userData");
        if (encryptedData) {
            const decryptedData = decryptSessionData(encryptedData);
            
            
        }
        
       
    }, [roleId]);

    const columns = [
        {
            field: "Screen_Type",
            headerName: "Menu Name",
            flex: 1
        },
        {
            field: 'menu',
            headerName: 'Sub Menu details',
            flex: 1,
           
            renderCell: () => (
              <IconButton sx={{ height: 40, width: 40, color: "#000" }}>
                  <SubjectRoundedIcon />
              </IconButton>
          ),
            renderHeader: () => <div style={{ fontSize: '16px' }}>Menus</div>
        },
    
    ];
    
    const handleOpenAddModal = () => {
        setOpenAddModal(true);
    };

    
// ✅ Handle Add User
    const handleAdd = async () => {
      console.log("Data being sent to the server:", {
        UserID
       
      });
      console.log("Add button clicked");
    
    //   // Step 1: Validate required fields
    //   if (
       
        
    //   ) {
    //     alert("Please fill in all required fields");
    //     return;
    //   }
     // Step 2: Validate StorageCode (must be exactly 4 digits)
 
     
      try {
        // Prepare data to be sent
        const data = {
          UserID:UserID,
           // Make sure this is defined somewhere
        };
    
        // Step 3: Call the API to add the user
        const response = await AddMenuAccess(data); // Ensure getAdd uses a POST request
    
        if (response.data.success) {
          alert("Menu added successfully!");
          getData(); // refresh UI (e.g. user list)
          handleCloseAddModal(); // close the modal
        } else {
          alert(response.data.message || "Failed to add Menu.");
        }
      } catch (error) {
        console.error("Error in adding Menu:", error);
    
        // Step 4: Show error from server (like Employee_ID already exists)
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert("An error occurred while adding the Storage Location.");
        }
      }
    };
   
    const handleCloseAddModal = () => setOpenAddModal(false);


    return (
        <>
            <ToastContainer />
            <Box style={{ marginTop: "100px"}}>
                <Typography variant="h4" color="blue" align="center">
                    {`${role} PERMISSION`}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '10px' }}>
                    <Button>
                        <IoArrowBack style={{ fontSize: '30px', color: 'blue' }} onClick={() =>
                            navigate('/home/Role')
                        } />
                    </Button>

                    <Box sx={{ position: 'absolute', top: '10px', right: '10px',marginTop:"120px" }}>
                    <IconButton
                  onClick={handleOpenAddModal}
                  style={{
                    borderRadius: "50%",
                    backgroundColor: "#0066FF",
                    color: "white",
                    width: "40px",
                    height: "40px",
                    marginRight: "30px",
                    marginBottom:"10px"
                  }}
                >
                  <AddCircleIcon/>
                </IconButton>

                    </Box>
                </Box>

               

                
                    <Box style={{ height: 'calc(100vh - 287px)', width: '100%', position: 'relative' }}>
                    <DataGrid
              rows={menuData}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              getRowId={(row) => row.Access_ID}
              
              disableSelectionOnClick
              slots={{ toolbar: CustomToolbar }}
              onCellClick={(params) => {
                if (params.field === "menu") {
                    const screenType = params.row.Screen_Type || "defaultScreen";
                    console.log('Role ID:', roleIdNo);
                    console.log('Screen Type:', screenType);

                    navigate({
                        pathname: `${roleId}`,
                        search: `?menu_name=${screenType}&role=${role}&roleNo=${roleId}`,
                    });
                }
            }}
              sx={{
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
                  backgroundColor: "#f5f5f5",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "inherit",
                },
                "& .MuiDataGrid-cell": {
                  color: "#333",
                  fontSize: "14px",
                },
              }}
            />
                    </Box>
                {/* Add Modal */}
          <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                width: 400,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
                margin: "auto",
                marginTop: "10%",
                gap: "15px",
              }}
            >
              <h3
                style={{
                  gridColumn: "span 2",
                  textAlign: "center",
                  color: "#2e59d9",
                  textDecoration: "underline",
                  textDecorationColor: "#88c57a",
                  textDecorationThickness: "3px",
                }}
              >
                Add permission
              </h3>
      
              <FormControl fullWidth>
                <InputLabel>Menu</InputLabel>
                <Select
                  label="Menu"
                  name="Menu"
                  value={Menu}
                  onChange={(e) => setMenu(e.target.value)}
                  required
                >
                  {MenuTable.map((item, index) => (
                    <MenuItem key={index} value={item.Screen_Type}>{item.Screen_id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
      
              
      
              <Box
                sx={{
                  gridColumn: "span 2",
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleCloseAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  style={{ width: "90px" }}
                  variant="contained"
                  color="primary"
                  onClick={handleAdd}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </Modal>

            </Box>
        </>
    );
};

export default Admin;