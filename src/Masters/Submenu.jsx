import React, { useState, useEffect } from 'react';
import { Box, Stack, IconButton, Typography, Button, Modal, FormControl,Select, InputLabel, OutlinedInput } from '@mui/material';
import { AddMenuAccess, Delete_Menu, get_Drop_Down_Menu, get_Menus, get_Menus_Not, get_Sub_Menu, get_Sub_Menu_List } from '../controller/AdminMasterapiservice';
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { deepOrange } from '@mui/material/colors';
import { IoArrowBack } from "react-icons/io5";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";


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

const Submenu = () => {
    const navigate = useNavigate();
    const [menuData, setMenuData] = useState([]);
    const { roleId } = useParams();
    const location = useLocation();
    const [openModal, setOpenModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    let [searchParams] = useSearchParams();
    const menuName = searchParams.get('menu_name');
    const role = searchParams.get('roleNo');
    console.log('role', role);
    console.log('menu', menuName);
    const [drop, setDrop] = useState([]);
    const [submenu, setSubmenu] = useState([]);
    const [employeeId, setEmployeeId] = useState("");
   

    // ✅ Custom Toolbar
    const CustomToolbar = () => (
      <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
      </GridToolbarContainer>
    );
    const handleSubMenuChange = (selectedOptions) => {
        if (Array.isArray(selectedOptions)) {
            setSubmenu(selectedOptions.map(option => option.value));
        } else if (selectedOptions) {
            setSubmenu([selectedOptions.value]);
        } else {
            setSubmenu([]);
        }
    };

    const getDrop = async () => {
        try {
            const roleId = role;
            const menu = menuName;
            
            const response = await get_Sub_Menu_List( roleId, menu);
            setDrop(response.data);
            console.log(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching menu data", error);
            setIsLoading(false);
        }
    };

    const handleOpenModal = () => {
        setOpenModal(true);
        getDrop();
    };

    const handleCloseModal = () => {
        setSubmenu([]);
        setOpenModal(false);
    };

    const handleAdd = async () => {
        if (submenu.length === 0) {
            toast.warn('Please Select a Access Menu', {
                position: "top-center",
                autoClose: 1900,
                theme: "light",
                zIndex: "1500",
            });
            return;
        } else {
            const roleId = role;
            const data = {
                EmployeeId: employeeId,
                role: roleId,
                screen: submenu
            };

            console.log('Data being sent:', data);
            try {
                const response = await AddMenuAccess(data);
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
    }

    // Fetching submenu data
    const getData = async () => {
        try {
            const roleId = role;
            const menu = menuName;
            console.log("Role ID: ", roleId);
            console.log("Menu Name: ", menu);
            const token = 'yourTokenHere';
            const response = await get_Drop_Down_Menu( roleId, menu);
            setMenuData(response.data || []);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching menu data", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        
        getData();
    }, [role, menuName]);

    const columns = [
        {
            field: "Access_Id",
            headerName: "Access_Id",
            Width: 250
        },
        {
            field: "Screen_Name",
            headerName: "Menu Name",
            width: 250,
        },
        {
            field: "delete",
            headerName: "Remove Access",
            width: 250,
            renderCell: () => (
                <IconButton sx={{ height: 40, width: 40, color: "#000" }}>
                    <DeleteSweepIcon />
                </IconButton>
            ),
        },
    ];

    return (

        <>
            <ToastContainer />
            <Box>
                <Typography variant="h3" color="blue" align="center">
                    {`${searchParams.get("role")}-${searchParams.get("menu_name")} Permission`}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '10px' }}>
                    <Button>
                        <IoArrowBack style={{ fontSize: '30px', color: 'blue' }} onClick={() =>
                            navigate(`/home/Role`)
                        } />
                    </Button>

                    <Box sx={{ position: 'absolute', top: '10px', right: '10px' }}>
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
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: 24, width: 400 }}>
                        <Typography mb={2} style={{ fontWeight: 'bold', fontSize: '28px', textDecoration: 'underline' }}>
                            Add Access
                        </Typography>

                        <FormControl fullWidth>
                            <Select
                                id="submenu-select"
                                isMulti
                                options={drop.map(item => ({
                                    label: item.Screen_Name,
                                    value: item.Screen_id
                                }))}
                                value={drop.filter(item => submenu.includes(item.Screen_id)).map(item => ({
                                    label: item.Screen_Name,
                                    value: item.Screen_id
                                }))}
                                onChange={handleSubMenuChange}
                                placeholder="Select Sub Menu"
                            />
                        </FormControl>


                        <Box mt={2} display="flex" justifyContent="center" gap={2}>
                            <Button onClick={handleCloseModal} style={{ backgroundColor: deepOrange[500], color: 'white', fontSize: '12px' }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAdd} style={{ backgroundColor: '#4bb95d', color: 'white', fontSize: '12px' }}>
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
                            getRowId={(row) => row.Access_Id}
                            onCellClick={async (params) => {
                                if (params.field === "delete") {
                                    console.log('sub_menu_id', params.row.Access_Id);
                                    const Access_Id = params.row.Access_Id;
                                    console.log('Access_Id', Access_Id);
                                    try {
                                        const response = await Delete_Menu( Access_Id, employeeId);
                                        toast.success(response.data.message, {
                                            position: "top-center",
                                            autoClose: 1900,
                                            theme: "light",
                                            zIndex: "1500",
                                        });
                                        getData();
                                    } catch (error) {
                                        if (error.response.status === 500) {
                                            toast.error(error.response.data.message, {
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

export default Submenu;
