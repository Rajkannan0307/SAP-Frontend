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
    const [isLoading, setIsLoading] = useState(true);
    const [roleno, setRoleno] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [addmenu, setAddmenu] = useState('');
    const [submenu, setSubmenu] = useState([]);
    let [searchParams] = useSearchParams();
    const [employeeId, setEmployeeId] = useState("");
    const [token, setToken] = useState("");
    const [isButton, setIsButton] = useState(false);
    const [main, setMain] = useState([]);
    const [sub, setSub] = useState([]);

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
    
    const handleOpenModal = () => {
        setOpenModal(true);
    };

    

   



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
                  onClick={handleOpenModal}
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
               
            </Box>
        </>
    );
};

export default Admin;