import { api } from "./constants";
import axios from "axios";

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/ModuleMaster/get_details`);
    return response.data;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/ModuleMaster/Get_Plants`);
    return response;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/ModuleMaster/Get_Add`, data);
    return response;
  };
 
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/ModuleMaster/get_Updates`, data);
    return response;
  };
  
  export const getDepartment = async ()=>{

    const response = await axios.get(`${api}/ModuleMaster/Get_Department`);
    return response;
  };