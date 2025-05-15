// src/components/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Paper, Typography, Snackbar, Alert, Box } from "@mui/material";
import LoginImage from "../images/lp.jpeg";
import { getLogin } from "../../controller/Masterapiservice";
import { encryptSessionData, decryptSessionData} from "../../controller/StorageUtils";

const Login = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setOpen(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Enter Username and Password");
      setOpen(true);
      return;
    }
try {
    // Send login request
    const response = await getLogin({
      Employee_ID: username,  // Pass the Employee_ID here
      Password: password
    });

    console.log('response', response.data.message);

    if (response.data.message === 'success') {
      const data = response.data.resultLocalStorage[0];

      console.log('data', data);
       if(data) {
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

            const encryptedUserData = sessionStorage.getItem('userData');
            const decryptedUserData = decryptSessionData(encryptedUserData);
            console.log('decrypted userdata:', decryptedUserData);
            
          
          
      navigate("/home/Home");
      }
      console.log("Login successful", response.data);
      
    } else {
      alert(response.data.message); // should never hit this, but just in case
    }

  } catch (error) {
    console.log("Error Logging in:", error);

    // Handle 401 responses (Invalid user/password)
    if (error.response && error.response.status === 401) {
      alert(error.response.data.message);
    } else {
      alert("Something went wrong. Try again.");
    }
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

      <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleClose} severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;
