
import React, { useState,useEffect } from "react";
import { Link } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HomeIcon from "@mui/icons-material/Home";
import { FaSignOutAlt } from "react-icons/fa";
import { Button } from "@mui/material";
import logo from './images/ranelogo.png';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton,Typography,Table, TableBody, TableCell, TableRow, TableContainer  } from "@mui/material";
import Popover from '@mui/material/Popover';
import { decryptSessionData } from "../controller/StorageUtils"
const Topbar = () => {
  const [logoutbtn, setlogoutbtn] = useState(false);


  const GenId = localStorage.getItem('EmpId');
  const Username = localStorage.getItem('UserName');
  const Dept = localStorage.getItem('Deptname');
  const Plant = localStorage.getItem('PlantName');
  const Email = localStorage.getItem('Email');
  const Plantcode = localStorage.getItem('Plantcode');
   const RoleId = localStorage.getItem('RoleID');
console.log ('dddd',RoleId)

  const [EmployeeName,setemployeename]=useState('');
  const [Role,setRole]=useState('');
 const navigate = useNavigate();
  const handleLogout = () => {
    sessionStorage.removeItem('UserName');
   
    navigate('/'); 
  };

 useEffect(() => {
  const encryptedData = sessionStorage.getItem('userData');
      if (encryptedData) {
        const decryptedData = decryptSessionData(encryptedData);
        setRole(decryptedData.Role);
        console.log("us",decryptedData.Role)

      }
      }, []);
  const handlePopoverOpen = () => {
    setlogoutbtn(true);
  };
  const handlePopoverClose = () => {
    setlogoutbtn(false);
  };
const open = Boolean(logoutbtn);
  const id = open ? 'simple-popover' : undefined;

  const popoverContent = (
    // <Typography sx={{ p: 2 }}>User Details Here</Typography>
    <TableContainer sx={{ p: 2 }}>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell sx={{fontWeight:'700' , fontSize:'12px'}}>GenId :</TableCell>
          <TableCell>{GenId}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight:'700' , fontSize:'12px'}}>Name :</TableCell>
          <TableCell>{Username}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight:'700' , fontSize:'12px'}}>Role :</TableCell>
          <TableCell>{Role}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight:'700' , fontSize:'12px'}}>Department :</TableCell>
          <TableCell>{Dept}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight:'700' , fontSize:'12px'}}>Email:</TableCell>
          <TableCell>{Email}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight:'700' , fontSize:'12px'}}>Plant:</TableCell>
          <TableCell>{Plantcode} / {Plant}</TableCell>
        </TableRow>
       
      </TableBody>
    </Table>
  </TableContainer>
  );
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#2e59d9",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            gap: "10px",
          }}
        >
          <img
  src={logo}
  alt="Rane Logo"
  style={{
    height: "43px",
    marginLeft: "0px",
    background: "white",
    border: "2px solid white", // White border
    borderRadius: "6px", // Rounded corners
  }}
     />

          
          <h1 style={{ fontSize: "30px", color: "white" }}>SAP APPROVAL WORK FLOW</h1>
        </div>

        <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px", // Increased gap for better spacing
    marginLeft: 0,
  }}
>
  {/* Account Icon Button */}
  <Button style={{ padding: 0, minWidth: "40px" }} onClick={handlePopoverOpen}>
    <AccountCircleIcon
      style={{
        textDecoration: "none",
        color: "white",
        marginRight: "-8px",
      }}
    />
  </Button>


  <Popover
          id={id}
          open={open}
          anchorEl={logoutbtn}
          onClose={handlePopoverClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}

           transformOrigin={{
    vertical: 'top', // ⚠️ This line is the issue
    horizontal: 'right',
  }}
          // transformOrigin={{
          //   vertical: 'right',
          //   horizontal: 'center',
          // }}
          style={{ zIndex:10000, marginTop: '3%' }}
        >
          {popoverContent}
        </Popover>

  {/* Home Icon */}
  <Link
    to="/home/Home"
    style={{
      textDecoration: "none",
      color: "white",
      display: "flex",
      alignItems: "center",
    }}
  >
    <HomeIcon />
  </Link>

  {/* Sign Out Icon */}
  {/* <Link
    to="/"
    style={{
      color: "white",
      display: "flex",
      alignItems: "center",
    }}
   
  > */}
    <FaSignOutAlt
      style={{
        color: "white",
        display: "flex",
        alignItems: "center",
        padding: "5px",
        marginRight: "10px",
        fontSize:"22px"
      }}
      onClick={handleLogout}
    />
  {/* </Link> */}
</div>

      </div>
    </div>
  );
};

export default Topbar;