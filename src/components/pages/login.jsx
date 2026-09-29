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
import { IoHome } from "react-icons/io5";

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
                window.location.href = "/home/PMPD_ProductionPlan";
                break;
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
                window.location.href = "/home/Home";
                break;
              case 11:
                window.location.href = "/home/Home";
                break;
              case 14:
                // window.location.href = "/home/Home";
                window.location.href = "/home/rigMonthlyStatus";
                break;
              case 15:
                window.location.href = "/home/PMPD_ProductionPlan";
                break;
              case 16:
                window.location.href = "/home/PMPD_ProductionPlan";
                break;
              case 17:
                window.location.href = "/home/MatAvailabilityStatus";
                break;
              default:
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
      <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-50 animate-[fadeIn_0.5s_ease-in-out]">
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes floatUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {/* Header */}
        <div className="relative w-full flex justify-center items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-[#1B5088] my-4">
            MANUFACTURING WORKSPACE
          </h1>

          <IoHome
            className="absolute right-5 mr-[2%] text-4xl text-slate-800 cursor-pointer transition-transform duration-200 hover:scale-110 hover:text-[#1B5088]"
            onClick={() => navigate("/")}
          />
        </div>

        {/* Outer Centered Box */}
        <div
          className="w-[90vw] max-w-[600px] md:h-[450px] bg-gradient-to-br from-[#1B5088] to-[#123b66] flex flex-col md:flex-row rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.15)] mb-8 mt-4"
          style={{ animation: "floatUp 0.5s ease-out both" }}
        >
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-5">
            <img
              src={LoginImage}
              alt="Login Visual"
              className="w-[87%] max-h-[220px] md:max-h-none md:h-[70vh] object-contain rounded-[10px]"
            />
          </div>

          {/* Right Column with Inner Login Box */}
          <div className="w-full md:w-1/2 flex justify-center items-center p-6 md:p-8 flex-col">
            <div className="h-auto w-[260px] bg-white p-5 rounded-2xl shadow-[0_4px_12px_rgba(131,130,130,0.6)] transition-transform duration-300 hover:-translate-y-0.5">
              <div className="text-xl font-bold text-center text-[#2994d1] mb-4">
                Login
              </div>
              <form onSubmit={handleLogin} className="flex flex-col">
                <input
                  type="text"
                  placeholder="Login ID"
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-[200px] mx-auto my-1.5 block text-center px-3 py-3 rounded-full border border-[#1B5088] outline-none text-base transition-all duration-300 focus:border-[#0ea5e9] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)]"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-[200px] mx-auto my-1.5 mb-1 block text-center px-3 py-3 rounded-full border border-[#1B5088] outline-none text-base transition-all duration-300 focus:border-[#0ea5e9] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)]"
                />

                <button
                  type="submit"
                  className="mt-5 mx-auto block w-[130px] h-[36px] rounded-2xl text-sm font-bold text-white bg-[#2994d1] transition-all duration-300 hover:bg-[#00CCFF] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
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
