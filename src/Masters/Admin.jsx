import React, { useState, useEffect } from 'react';
import { Box, Stack, IconButton, Typography, Button, Modal, FormControl, InputLabel, OutlinedInput,MenuItem } from '@mui/material';
import { AddMenuAccess, get_ScreenType, get_ScreenName, get_Sub_Menu, getdetails } from '../controller/AdminMasterapiservice';
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import{

Select,

} from "@mui/material";
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
// import Select from 'react-select'; // Import react-select

const Admin = () => {
const navigate = useNavigate();
const { roleId } = useParams();
const location = useLocation();
const role = location.state?.role || '';

const roleIdNo = location.state?.Role_No;

const [screenNames, setScreenNames] = useState([]);
const [error, setError] = useState('');
const [menuData, setMenuData] = useState([]);

const [roleno, setRoleno] = useState('');
const [openModal, setOpenModal] = useState(false);
const [Menu, setMenu] = useState([]);
const [submenu, setSubmenu] = useState([]);
const [openAddModal, setOpenAddModal] = useState(false);
const [MenuTable, setMenuTable] = useState([]);
const [MenusNameTable, setMenusNameTable] = useState([])
const[ScreenType,setScreenType]=useState([]);
const [ScreenName, setScreenName] = useState(''); // ✅ Initialize as a string, not an array or object


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
const response = await getdetails(role, roleIdNo);
console.log(response);


setMenuData(response.data);


} catch (error) {
console.error("Error fetching menu data", error);

}
};

const getScreenType = async () => {
try {
const response = await get_ScreenType(roleIdNo, role); // Correct order

setMenuTable(response.data);
} catch (error) {
console.error("Error updating user:", error);
}
};

const getScreenNames = async () => {
  try {
    const response = await get_ScreenName( roleId,ScreenType); 
    if (response.data && response.data.length > 0) {
      setMenusNameTable(response.data); // Set the menus fetched from the API
    } 
  } catch (error) {
    console.error('Error fetching Screen Names:', error);
  }
};

 useEffect(() => {
  getScreenNames();
}, [roleId, ScreenType]);

useEffect(() => {
if (roleId) {
setRoleno(roleId);
console.log('roleId from URL:', roleId);
getData();

} else {
console.error('roleId is undefined!');
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
getScreenType();
getScreenNames();
setScreenName('');
setScreenType('');
};


const handleAdd = async () => {
  if (!role) {
    toast.warn('Please Provide a Role Name', {
      position: "top-center",
      autoClose: 1900,
      theme: "light",
    });
    return;
  }

  if (!ScreenType) {
    toast.warn('Please Select Screen Type', {
      position: "top-center",
      autoClose: 1900,
      theme: "light",
    });
    return;
  }

  if (!ScreenName) {
    toast.warn('Please Select Screen Name', {
      position: "top-center",
      autoClose: 1900,
      theme: "light",
    });
    return;
  }

  try {
    const data = {
      UserID: UserID, // or employeeId if you track it separately
      role: roleIdNo,
      screen: [ScreenName] // assuming ScreenName holds Screen_Id
    };

    const response = await AddMenuAccess(data);

    handleCloseAddModal();
    toast.success(response.data.message, {
      position: "top-center",
      autoClose: 1900,
      theme: "light",
    });

    getData(); // refresh the table

  } catch (error) {
    if (error.response?.status === 500) {
      toast.error(error.response.data.message, {
        position: "top-center",
        autoClose: 1900,
        theme: "light",
      });
    } else {
      toast.error('Error in Connection', {
        position: "top-center",
        theme: "light",
      });
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
backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
              color: "black",
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
<InputLabel>Screen Type</InputLabel>
<Select
label="Screen Type"
name="ScreenType"
value={ScreenType}
onChange={(e) => setScreenType(e.target.value)}
required
>


{MenuTable.map((item, index) => (
<MenuItem key={index} value={item.Screen_Type}>{item.Screen_Type}</MenuItem>
))}
</Select>
</FormControl>



<FormControl fullWidth>
<InputLabel>Screen Name</InputLabel>
<Select
label="Screen Name"
name="ScreenName"
value={ScreenName}
onChange={(e) => setScreenName(e.target.value)}
required
>
{MenusNameTable.map((item, index) => (
<MenuItem key={index} value={item.Screen_Id}>{item.Screen_Name}</MenuItem>
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