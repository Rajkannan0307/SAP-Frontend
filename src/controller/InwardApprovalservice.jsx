import { api } from "./constants";
import axios from "axios";


export const getdetails = async (UserID, RoleID, PlantID, EmployeeID) => {
  const response = await axios.get(
    `${api}/InwardApproval/get_details?UserID=${UserID}&RoleID=${RoleID}&PlantID=${PlantID}&EmployeeID=${EmployeeID}`,
    {
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  );
  return response.data;
};

export const getdetailsEmergency = async (UserID, RoleID, PlantID, EmployeeID) => {
  const response = await axios.get(
    `${api}/InwardApproval/get_details_emergency?UserID=${UserID}&RoleID=${RoleID}&PlantID=${PlantID}&EmployeeID=${EmployeeID}`,
    {
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  );
  return response.data;
};



  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/InwardApproval/Get_Updates`, data);
    return response;
  };

  export const getRejected = async (data)=>{
    const response = await axios.put(`${api}/InwardApproval/Rejected`, data);
    return response;
  };
  export const getEmployee = async ()=>{

  const response = await axios.get(`${api}/InwardApproval/Get_Employee`);
  return response;
};
 export const UpdateL2Approver = async (data)=>{
    const response = await axios.put(`${api}/InwardApproval/UpdateL2Approver`, data);
    return response;
  };
  