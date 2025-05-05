import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/PlantMaster/get_details_Plant`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/PlantMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/PlantMaster/get_Updates`, data);
    return response;
  };
 
  export const getCompany= async ()=>{

    const response = await axios.get(`${api}/PlantMaster/Get_Company`);
    return response;
};