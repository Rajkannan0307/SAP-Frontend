import { api } from "./constants";
import axios from "axios";


export const getdetails=async (UserID)=>{
    const response = await axios.get(`${api}/Emergency/get_details?UserID=${UserID}`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/Emergency/Get_Add`, data);
    return response;
  };
 

  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/Emergency/get_Updates`, data);
    return response;
  };
  


export const getVendor = async ()=>{

  const response = await axios.get(`${api}/Emergency/Get_Vendor`);
  return response;
};
export const getMaterial = async ()=>{

  const response = await axios.get(`${api}/Emergency/Get_Material`);
  return response;
};


   export const Resubmit = async (data) => {
  const response = await axios.post(`${api}/Inward/resubmit`, data);
  return response;
};
 export const getEmergencyData = async (from, to,UserID)=>{
      const response = await axios.get(`${api}/Emergency/downloadEmergency?From=${from}&to=${to}&UserID=${UserID}`, );
      return response;
  };