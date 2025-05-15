// src/components/pages/Login.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Paper, Typography, Snackbar, Alert, Box } from "@mui/material";
import LoginImage from "../images/back.jpeg";
import { getLogin } from "../../controller/Masterapiservice";
import { encryptSessionData, decryptSessionData } from "../../controller/StorageUtils";
import { AuthContext } from "../../Authentication/AuthContext";

const Login = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [openError, setOpenError] = useState(false);
const [openSuccess, setOpenSuccess] = useState(false);
const [error, setError] = useState("");
const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleClose = () => {
    setOpenError(false);
    setOpenSuccess(false);
  };


 // src/components/pages/Login.js
const handleLogin = async (e) => {
  e.preventDefault();
 

  if (!username || !password) {
    setError("Enter Username and Password");
    setOpenError(true);
    return;
  }

  try {
    const response = await getLogin({
      Employee_ID: username,
      Password: password
    });

    if (response.data.message === 'success') {
      const data = response.data.resultLocalStorage[0];
      if (data) {
        localStorage.setItem('Active', data.Active_Status);
        localStorage.setItem('DeptId', data.Dept_Id);
        localStorage.setItem('UserName',data.User_Name);
        localStorage.setItem('UserID',data.User_ID);
        localStorage.setItem('Deptname', data.Dept_Name);
        localStorage.setItem('PlantName', data.Plant_Name);
        localStorage.setItem('Email', data.User_Email);
        localStorage.setItem('Plantcode', data.Plant_Code);
        localStorage.setItem('EmpId', data.Employee_ID);
        localStorage.setItem('RoleID', data.Role_ID);
        localStorage.setItem('Approval_Level', data.User_Level);
        localStorage.setItem('Permission', data.Screen_Codes);

        localStorage.setItem('Plant_ID', data.Plant_ID);
         localStorage.setItem('CompanyId', data.Com_ID);
         

         const selectedData = {
          Active: data.Active_Status,
          DeptId: data.Dept_Id,
          UserName: data.User_Name,
          UserID: data.User_ID,
          DeptName: data.Dept_Name,
          PlantName: data.Plant_Name,
          Email: data.User_Email,
          PlantCode: data.Plant_Code,
          EmpId: data.Employee_ID,
          RoleId: data.Role_ID,
         
          CompanyCode: data.Company_code,
          CompanyName: data.Company_name,
          CompanyId:data.Com_ID,
          
          
          Role: data.Role_Name,
          Permissions:data.Screen_Codes,
          login:true
        };
        const encryptedData = encryptSessionData(selectedData);
        sessionStorage.setItem('userData', encryptedData);

        setSuccessMessage("Login successful!");
        setOpenSuccess(true);

        setTimeout(() => {
          window.location.href = "/home/Home"; // Hard redirect to clear state
        }, 1500); // 1.5 seconds delay
      }
    } else {
      setError("Login failed. Please try again.");
      setOpenError(true);
    }
  } catch (error) {
    setError("Something went wrong. Try again.");
    setOpenError(true);
  }
};



  return (
    <Container maxWidth="sm" sx={{ mt: 8, position: "relative" }}>
      <Box 
        sx={{ 
          backgroundImage: `url(${LoginImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 4,
          padding: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, backdropFilter: "blur(10px)", backgroundColor: "rgba(255, 255, 255, 0.8)" }}>
          <Typography variant="h5" gutterBottom>Login Page</Typography>
          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Username" variant="outlined" margin="normal" value={username} onChange={(e) => setUserName(e.target.value)} />
            <TextField fullWidth label="Password" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Login</Button>
          </form>
        </Paper>
      </Box>

      {/* Error Snackbar */}
     <Snackbar 
  open={openError} 
  autoHideDuration={2000} 
  onClose={() => setOpenError(false)} 
  anchorOrigin={{ vertical: "top", horizontal: "center" }}
>
  <Alert severity="error">{error}</Alert>
</Snackbar>

<Snackbar 
  open={openSuccess} 
  autoHideDuration={2000} 
  onClose={() => setOpenSuccess(false)} 
  anchorOrigin={{ vertical: "top", horizontal: "center" }}
>
  <Alert severity="success">Login successful!</Alert>
</Snackbar>

    </Container>
  );
};

export default Login;
