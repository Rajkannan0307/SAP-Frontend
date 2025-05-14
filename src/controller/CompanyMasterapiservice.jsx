import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/CompanyMaster/get_details_Company`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/CompanyMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/CompanyMaster/get_Updates`, data);
    return response;
  };
 
  export const User_Img = async (data, ) => {
    const response = await axios.post(`${api}/CompanyMaster/Upload_Image`, data);
    return response;
};