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
  console.log(RoleID)
    // ✅ Custom Toolbar
      const CustomToolbar = () => (
        <GridToolbarContainer>
          <GridToolbarColumnsButton />
          <GridToolbarFilterButton />
          <GridToolbarExport />
        </GridToolbarContainer>
      );
    // Fetching menu data based on roleId
    const getData = async () => {
        try {
            const response = await get_Menus(role, roleIdNo);
            console.log('roleIdNo:', roleIdNo); // should be a number
            console.log('role:', role);         // string like 'REQUESTER'

            setMenuData(response.data || []);
            
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching menu data", error);
            setIsLoading(false);
        }
    };

    const getSubMenus = async (selectedMenu) => {
        try {
            const response = await get_Sub_Menu(role, roleIdNo, selectedMenu);
            setSubmenu(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching submenus", error);
            setIsLoading(false);
        }
    };

    const getMenuNames = async () => {
        try {
            const response = await get_Menus_Not(role, roleIdNo);
            console.log(roleIdNo)
            setMain(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching menu data", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (roleId) {
            setRoleno(roleId);
            console.log('roleId from URL:', roleId);
        } else {
            console.error('roleId is undefined!');
        }
        const encryptedData = sessionStorage.getItem("userData");
        if (encryptedData) {
            const decryptedData = decryptSessionData(encryptedData);
            setEmployeeId(decryptedData.EmployeeId);
            
        }
        getData();
        getMenuNames();
    }, [roleId]);

    const columns = [
        {
            field: "Screen_Type",
            headerName: "Menu Name",
            width: 250,
        },
        {
            field: "menu",
            headerName: "Sub Menu details",
            width: 250,
            renderCell: () => (
                <IconButton sx={{ height: 40, width: 40, color: "#000" }}>
                    <SubjectRoundedIcon />
                </IconButton>
            ),
        },
    ];

    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSub([]);
        setAddmenu('');
        setSubmenu([]);
        getMenuNames();
    };

    const handleAddAccess = async () => {
        if (!role) {
            toast.warn('Please Provide a Role Name', {
                position: "top-center",
                autoClose: 1900,
                theme: "light",
                zIndex: "1500",
            });
            return;
        } else if (!addmenu) {
            toast.warn('Please Select Menu', {
                position: "top-center",
                autoClose: 1900,
                theme: "light",
                zIndex: "1500",
            });
            return;
        } else if (sub.length === 0) {
            toast.warn('Please Select Sub Menu', {
                position: "top-center",
                autoClose: 1900,
                theme: "light",
                zIndex: "1500",
            });
            return;
        } else {
            setIsButton(true);

            try {
                const data = {
                    EmployeeId: employeeId,
                    role: roleIdNo,
                    screen: sub
                };

                const response = await AddMenuAccess(data, token);
                handleCloseModal();
                toast.success(response.data.message, {
                    position: "top-center",
                    autoClose: 1900,
                    theme: "light",
                    zIndex: "1500",
                });
                getData();
            } catch (error) {
                if (error.response.status === 500) {
                    toast.error(error.response.data.message
                        , {
                            position: "top-center",
                            autoClose: 1900,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                            zIndex: "1500",
                        });
                } else {
                    toast.error('Error in Connection', {
                        position: "top-center",
                        theme: "light",
                        zIndex: "1500",
                    });
                }
            }
        }
    };


    const handleSubMenuChange = (selectedOptions) => {
        if (Array.isArray(selectedOptions)) {
            setSub(selectedOptions.map(option => option.value)); // For multi-select
        } else if (selectedOptions) {
            setSub([selectedOptions.value]);  // For single-select
        } else {
            setSub([]);  // Reset when no options are selected
        }
    };

    const handleMenuChange = (selectedOption) => {
        setAddmenu(selectedOption ? selectedOption.value : '');
        getSubMenus(selectedOption ? selectedOption.value : '');
    };

    return (
        <>
            <ToastContainer />
            <Box style={{ marginTop: "120px"}}>
                <Typography variant="h3" color="blue" align="center">
                    {`${role} Permission`}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '10px' }}>
                    <Button>
                        <IoArrowBack style={{ fontSize: '30px', color: 'blue' }} onClick={() =>
                            navigate('/home/Role')
                        } />
                    </Button>

                    <Box sx={{ position: 'absolute', top: '10px', right: '10px',marginTop:"120px" }}>
                        <button
                            style={{
                                fontSize: "20px",
                                color: "blue",
                                border: "none",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontWeight: "600",
                            }}
                            onClick={handleOpenModal}
                        >
                            <AddCircleIcon sx={{ color: "#4bb95d", fontSize: "50px" }} />
                        </button>
                    </Box>
                </Box>

                {/* Add Modal */}
                <Modal open={openModal} onClose={handleCloseModal}>
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' ,backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: 24, width: 400 }}>
                        <Typography mb={2} style={{ fontWeight: 'bold', fontSize: '28px', textDecoration: 'underline' }}>
                            Add Access
                        </Typography>

                        {/* Menu Selection using react-select */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel id="menu-select-label">Select Menu</InputLabel>
    <Select
        labelId="menu-select-label"
        id="menu-select"
        value={addmenu}
        label="Select Menu"
        onChange={handleMenuChange}
    >
        {main.map((item) => (
            <MenuItem key={item.Screen_Type} value={item.Screen_Type}>
                {item.Screen_Type}
            </MenuItem>
        ))}
    </Select>
</FormControl>

                        


<FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel id="submenu-select-label">Select Sub Menu</InputLabel>
    <Select
        labelId="submenu-select-label"
        id="submenu-select"
        multiple
        value={sub} // `sub` should be an array of selected values
        onChange={handleSubMenuChange}
        label="Select Sub Menu"
        renderValue={(selected) => selected.length > 0 ? `${selected.length} item(s) selected` : 'Select Sub Menu'}
    >
        {submenu.map((item) => (
            <MenuItem key={item.Screen_ID} value={item.Screen_ID}>
                {item.Screen_Name}
            </MenuItem>
        ))}
    </Select>
</FormControl>

                        <Box mt={2} display="flex" justifyContent="center" gap={2}>
                            <Button onClick={handleCloseModal} style={{ backgroundColor: deepOrange[500], color: 'white', fontSize: '12px' }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddAccess} style={{ backgroundColor: '#4bb95d', color: 'white', fontSize: '12px' }}>
                                Add
                            </Button>
                        </Box>
                    </Box>
                </Modal>

                <Stack spacing={0} direction="column">
                    <Box style={{ height: 'calc(100vh - 287px)', width: '100%', position: 'relative' }}>
                        <DataGrid
                            rows={menuData}
                            columns={columns}
                            pageSize={20}
                            rowsPerPageOptions={[7]}
                            disableSelectionOnClick
                            components={{ Toolbar: CustomToolbar }}
                            getRowId={(row) => row.Access_ID}
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
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: '#1A5EAB',
                                    color: 'white',
                                },
                                '& .MuiDataGrid-cell': {
                                    fontWeight: 'bold',
                                },
                            }}
                            density="compact"
                        />
                    </Box>
                </Stack>
            </Box>
        </>
    );
};

export default Admin;
