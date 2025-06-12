import { api } from "./constants";
import axios from "axios";


export const getdetails=async (UserID,RoleID)=>{
    const response = await axios.get(`${api}/InwardApproval/get_details?UserID=${UserID}&RoleID=${RoleID}`);
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