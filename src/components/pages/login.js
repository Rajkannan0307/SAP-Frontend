import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginImage from "../images/lp.jpeg";
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
  <div
  style={{
    height: "100vh",
    width: "100vw",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to right, #33ccff 10%, #ff99cc 100%)", // Gradient background
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed", // Keeps the background fixed while scrolling
  }}
>
    {/* Outer Centered Box */}
    <div
      style={{
        width: "850px",
        height: "500px",
        backgroundColor: "#E9BFC1",
        display: "flex",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
      }}
    >
      
      {/* Left Column with Image */}
      <div
  style={{
    width: "50%",
    backgroundColor: "#E9BFC1",
    display: "flex",
    flexDirection: "column",         // <--- Stack h2 above the image
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",                 // optional spacing
  }}
>
  {/* optional spacing below the heading */}
  <img
    src={LoginImage}
    alt="Login Visual"
    style={{
      width: "80%",
      height: "165px",
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
         <h2 style={{ marginBottom: "20px" }}>SAP APPROVAL LOGIN</h2> 
        {/* Inner Box for Login Details */}
        <div
          style={{
            width: "100%",
            maxWidth: "300px",
            backgroundColor: "#E0E9F4",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#2994d1" }}>
            Login
          </h3>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column" }}>
            <input
              type="text"
              placeholder="Login ID"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              style={{
               padding: "10px",
               // padding: "7px 38px",  
               borderRadius: "20px",
                border: "1px solid #ccc",
                marginBottom: "15px",
                 maxWidth: "180px", 
                textAlign: "center",
                 margin: "5px auto",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "20px",
                border: "1px solid #ccc",
                marginBottom: "20px",
                textAlign: "center",
                 maxWidth: "180px", 
               
                 margin: "5px auto",
              }}
            />
            <button
  type="submit"
  style={{
    padding: "7px 38px",           // smaller padding (vertical & horizontal)
    fontSize: "14px",              // smaller text
    borderRadius: "16px",          // tighter rounding if you prefer
    textAlign: "center",
    backgroundColor: "#2994d1",
    color: "#fff",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
    maxWidth: "120px",             // smaller width
    display: "block",
    margin: "10px auto",           // keeps it centered
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
  </div>
);



}

export default Login;
