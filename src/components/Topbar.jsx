import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HomeIcon from "@mui/icons-material/Home";
import { FaSignOutAlt } from "react-icons/fa";
import { Button, Box, IconButton, Typography, Table, TableBody, TableCell, TableRow, TableContainer, Popover } from "@mui/material";
import logo from './images/ranelogo.png';
import { AuthContext } from "../Authentication/AuthContext";
import { decryptSessionData } from "../controller/StorageUtils";

const Topbar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const GenId = localStorage.getItem('EmpId');
  const Username = localStorage.getItem('UserName');
  const Dept = localStorage.getItem('Deptname');
  const Plant = localStorage.getItem('PlantName');
  const Email = localStorage.getItem('Email');
  const Plantcode = localStorage.getItem('Plantcode');

  const [EmployeeName, setemployeename] = useState('');
  const [Role, setRole] = useState('');
  const [RoleID, setRoleID] = useState('');
  const [UserLevel, setUserLevel] = useState('');
  const [anchorEl, setAnchorEl] = useState(null); // anchor for Popover

  const handleLogout = () => {
    logout(); // Use AuthContext's logout method
    navigate('/');
  };

  useEffect(() => {
    const encryptedUserData = sessionStorage.getItem('userData');
    if (encryptedUserData) {
      const decryptedUserData = decryptSessionData(encryptedUserData);
      setRoleID(decryptedUserData.RoleId);
      console.log('rrr:', RoleID);
      setRole(decryptedUserData.Role);
      setUserLevel(decryptedUserData.UserLevelName);
    }
  }, []);

  const encryptedUserData = sessionStorage.getItem('userData');
  const decryptedUserData = decryptSessionData(encryptedUserData);
  console.log('decrypted userdata:', decryptedUserData);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget); // correct anchor element
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const popoverContent = (
    <TableContainer sx={{ p: 2 }}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: '700', fontSize: '12px' }}>Plant:</TableCell>
            <TableCell>{Plantcode} / {Plant}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: '700', fontSize: '12px' }}>GenId :</TableCell>
            <TableCell>{GenId}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: '700', fontSize: '12px' }}>Name :</TableCell>
            <TableCell>{Username}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: '700', fontSize: '12px' }}>Role :</TableCell>
            <TableCell>{Role}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: '700', fontSize: '12px' }}>User Level :</TableCell>
            <TableCell>{UserLevel}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: '700', fontSize: '12px' }}>Department :</TableCell>
            <TableCell>{Dept}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: '700', fontSize: '12px' }}>Email:</TableCell>
            <TableCell>{Email}</TableCell>
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
              border: "2px solid white",
              borderRadius: "6px",
            }}
          />
          <h1 style={{ fontSize: "30px", color: "white" }}>Manufacturing Workspace</h1>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginLeft: 0,
          }}
        >
          {/* Account Icon Button */}
          <Button
            style={{ padding: 0, minWidth: "40px" }}
            onClick={(event) => handlePopoverOpen(event)}
          >
            <AccountCircleIcon
              style={{
                textDecoration: "none",
                color: "#FFD700",
                marginRight: "-8px",
              }}
            />
          </Button>

          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            style={{ zIndex: 10000, marginTop: '3%' }}
          >
            {popoverContent}
          </Popover>

          {/* Home Icon */}
          <HomeIcon
            style={{
              textDecoration: "none",
              color: "#F0F4FF",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              const roleId = parseInt(RoleID); // Convert Role to number
              if (roleId === 1 || roleId === 9) {
                navigate("/home/Home");
              } else if ([2, 3, 4, 5, 6, 7, 8].includes(roleId)) {
                navigate("/home/HomePage");
              }
            }}
          />

          {/* Sign Out Icon */}
          <FaSignOutAlt
            style={{
              color: "#FF6666",
              display: "flex",
              alignItems: "center",
              padding: "5px",
              marginRight: "10px",
              fontSize: "22px",
              cursor: "pointer",
            }}
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default Topbar;
