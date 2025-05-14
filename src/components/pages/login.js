import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginImage from "../images/login.png";
import { getLogin } from "../../controller/Masterapiservice";
import { encryptSessionData, decryptSessionData } from "../../controller/StorageUtils";

const Login = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  
  
  // Handle login form submission
  const handleLogin = async (e) => {
  e.preventDefault();

  console.log(`Sending login request for Employee_ID: ${username} and Password: ${password}`);

  if (username === "") {
    alert("Enter USERName");
    return;
  } else if (password === "") {
    alert("Enter password");
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
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0",
      }}
    >
      {/* Left Side - Login Form */}
      <div
        style={{
          width: "50%",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgb(134, 218, 250)",
        }}
      >
        <div
          style={{
            backgroundColor: "rgb(245, 236, 234)",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(157, 236, 245, 0.2)",
            width: "450px",
            textAlign: "center",
            height:"290px"
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
              color: "rgb(65, 171, 230)",
              fontSize: "28px",
              fontWeight:"bolder",
            }}
          >
            SAP APPROVAL WORKFLOW LOGIN
          </h2>
          <form
            className="submit"
            onSubmit={handleLogin}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* username Input */}
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <input
                placeholder="Login ID"
                style={{
                  width: "250px",
                  padding: "12px",
                  borderRadius: "20px",
                  border: "1px solid #ccc",
                  outline: "none",
                  textAlign: "center",
                }}
                type="text"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            {/* password Input */}
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <input
                placeholder="password"
                style={{
                  width: "250px",
                  padding: "12px",
                  borderRadius: "20px",
                  border: "1px solid #ccc",
                  outline: "none",
                  textAlign: "center",
                }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {/* Login Button */}
            <button
              type="submit"
              style={{
                width: "200px",
                padding: "12px",
                borderRadius: "20px",
                backgroundColor: "rgb(65, 171, 230)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                marginTop: "10px",
                transition: "background-color 0.3s",
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

      {/* Right Side - Background Image */}
      <div
        style={{
          width: "80%",
          height: "100vh",
          backgroundImage: `url(${LoginImage})`,
          backgroundSize: "30%",
          backgroundPosition: "40% 70%",
        }}
      />
    </div>
  );
};

export default Login;
