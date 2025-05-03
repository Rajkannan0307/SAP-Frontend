import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/BusinessDivisionMaster/get_details_BusinessDivision`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/BusinessDivisionMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/BusinessDivisionMaster/get_Updates`, data);
    return response;
  };
 
export const getCompany= async ()=>{

    const response = await axios.get(`${api}/BusinessDivisionMaster/Get_Company`);
    return response;
};