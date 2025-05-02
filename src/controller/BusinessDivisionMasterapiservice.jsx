import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/BuinessDivisionMaster/get_details_BuinessDivision`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/BuinessDivisionMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/BuinessDivisionMaster/get_Updates`, data);
    return response;
  };
 
export const getCompany= async ()=>{

    const response = await axios.get(`${api}/BuinessDivisionMaster/Get_Company`);
    return response;
};