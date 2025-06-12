import { api } from "./constants";
import axios from "axios";


export const getdetails=async (UserID)=>{
    const response = await axios.get(`${api}/InwardApproval/get_details?UserID=${UserID}`);
    return response.data;
};



  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/InwardApproval/Get_Updates`, data);
    return response;
  };
