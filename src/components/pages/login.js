// src/components/pages/Login.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Paper,
  Typography,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import LoginImage from "../images/llogin.png";
import { getLogin } from "../../controller/Masterapiservice";
import {
  encryptSessionData,
  decryptSessionData,
} from "../../controller/StorageUtils";
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
  const [UserID, setUserID] = useState("");
  const handleClose = () => {
    setOpenError(false);
    setOpenSuccess(false);
  };
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
      Password: password,
    });

    if (response.data.message === "success") {
      const data = response.data.resultLocalStorage[0];
      if (data) {
        localStorage.setItem("Active", data.Active_Status);
        localStorage.setItem("DeptId", data.Dept_Id);
        localStorage.setItem("UserName", data.User_Name);
        localStorage.setItem("UserID", data.User_ID);
        localStorage.setItem("Deptname", data.Dept_Name);
        localStorage.setItem("PlantName", data.Plant_Name);
        localStorage.setItem("Email", data.User_Email);
        localStorage.setItem("Plantcode", data.Plant_Code);
        localStorage.setItem("EmpId", data.Employee_ID);
        localStorage.setItem("RoleID", data.Role_ID);
        localStorage.setItem("Approval_Level", data.User_Level_ID);
        localStorage.setItem("UserLevel", data.User_Level);
        localStorage.setItem("Permission", data.Screen_Codes);
        localStorage.setItem("Plant_ID", data.Plant_ID);
        localStorage.setItem("CompanyId", data.Com_ID);

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
          UserLevelName: data.User_Level_Name,
          CompanyCode: data.Company_code,
          CompanyName: data.Company_name,
          CompanyId: data.Com_ID,
          PlantID: data.Plant_ID,
          UserLevel: data.User_Level,
          Role: data.Role_Name,
          Permissions: data.Screen_Codes,
          login: true,
        };

        const encryptedData = encryptSessionData(selectedData);
        sessionStorage.setItem("userData", encryptedData);

        const encryptedUserData = sessionStorage.getItem("userData");
        const decryptedUserData = decryptSessionData(encryptedUserData);
        console.log("decrypted userdata:", decryptedUserData);
        setSuccessMessage("Login successful!");
        setOpenSuccess(true);

        // Role-based redirection
        setTimeout(() => {
          switch (data.Role_ID) {
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
              case 10:
              window.location.href = "/home/HomePage";
              break;
            case 1:
            case 9:
              case 11:
              window.location.href = "/home/Home";
              break;
          }
        }, 100);
      }
    } else {
      setError(response.data.message || "Login failed. Please try again.");
      setOpenError(true);
    }
  } catch (error) {
    console.log("Error Logging in:", error);

    if (error.response && error.response.status === 401) {
      setError(error.response.data.message || "Invalid credentials.");
    } else if (error.response && error.response.data && error.response.data.message) {
      setError(error.response.data.message);
    } else {
      setError("Something went wrong. Try again.");
    }

    setOpenError(true);
  }
};

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    console.log("us", encryptedData);
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      setUserID(decryptedData.UserID);
     // console.log("us", decryptedData.UserID);
    }
  }, []);

  return (
    <>
      <div
        style={{
         minHeight:"calc(100vh - 1px)" ,

          width: "100vw",
          display: "flex",
          flexDirection: "column", // For vertical stacking (header + content)
          justifyContent: "center",
          alignItems: "center",
          // background: "linear-gradient(to right, #33ccff 10%,rgb(218, 172, 195) 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundColor: "#E0F7FA ",
        }}
      >
        {/* Centered Header */}
       <h1
  style={{
    textAlign: "center",
    marginBottom: "20px",
    color: "#1B5088",
    fontSize: "65px",
    fontFamily:"serif",
    //marginBottom:"70px", // Increase the font size here
    marginTop:-23
  }}
>
  SAP-APPROVAL WORKFLOW
</h1>


        {/* Outer Centered Box */}
        <div
          style={{
            width: "700px",
            height: "450px",
            backgroundColor: "#1B5088",
            display: "flex",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            marginBottom:"30px",
            marginTop:"15px"
          }}
        >
          <div
            style={{
              width: "50%",
              backgroundColor: "#1B5088",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
            }}
          >
            <img
              src={LoginImage}
              alt="Login Visual"
              style={{
                width: "87%",
                height: "100vh",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
          </div>

          {/* Right Column with Inner Login Box */}
          <div
            style={{
              width: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "30px",
              flexDirection: "column",
            }}
          >
            {/* Inner Box for Login Details */}
            <div
              style={{
                height: "220px", // Increased height
                width: "290px",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "20px",
                boxShadow: "0 4px 12px rgb(131, 130, 130)",
                right: 4,
              }}
            >
              <h3
                style={{
                  textAlign: "center",
                  marginBottom: "10px",
                  marginTop:"20px",
                  color: "#2994d1",
                  fontSize:"25px"
                }}
              >
                Login
              </h3>
              <form
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column" }}
              >
                {/* <input
            type="text"
            placeholder="Login ID"
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "20px",
              border: "1px solid #ccc",
              marginBottom: "15px",
              Width: "360px",
              textAlign: "center",
              margin: "5px auto",
               display: "block", 
            }}
          /> */}

                <input
                  type="text"
                  placeholder="Login ID"
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{
                    width: "180px",
                    height: "17px",
                    padding: "10px",
                    borderRadius: "20px",
                    border: "1px solid #1B5088",
                    marginBottom: "15px",
                    textAlign: "center",
                    margin: "5px auto",
                    display: "block",
                    outline: "none", // Remove black border on focus
                    transition: "border 0.3s",
                    fontSize: "16px",
                  }}
                  onFocus={(e) =>
                    (e.target.style.border = "1px solid rgb(22, 129, 243)")
                  } // Green border on focus
                  onBlur={(e) => (e.target.style.border = "1px solid  #1B5088")} // Gray border on blur
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: "20px",
                    border: "1px solid #1B5088",
                    marginBottom: "20px",
                    textAlign: "center",
                    width: "180px",
                    height: "17px",
                    margin: "5px auto",
                    display: "block",
                    outline: "none", // Remove black border on focus
                    transition: "border 0.3s",
                    fontSize: "16px",
                  }}
                  onFocus={(e) =>
                    (e.target.style.border = "1px solid rgb(22, 129, 243)")
                  } // Green border on focus
                  onBlur={(e) => (e.target.style.border = "1px solid  #1B5088")} // Gray border on blur
                />

                <button
                  type="submit"
                  style={{
                    padding: "7px 38px",
                    fontSize: "14px",
                    borderRadius: "16px",
                    textAlign: "center",
                    backgroundColor: "#2994d1",
                    color: "#fff",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                    width: "120px",
                    height: "30px",
                    display: "block",
                    margin: "20px auto",
                    bottom: 4,
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#00CCFF")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "rgb(65, 171, 230)")
                  }
                >
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Error Snackbar */}
        <Snackbar
          open={openError}
          autoHideDuration={1500}
          onClose={() => setOpenError(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error">{error}</Alert>
        </Snackbar>

        <Snackbar
          open={openSuccess}
          autoHideDuration={200}
          onClose={() => setOpenSuccess(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="success">Login successful!</Alert>
        </Snackbar>
      </div>
    </>
  );
};

export default Login;
