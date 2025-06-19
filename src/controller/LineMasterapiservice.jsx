import { api } from "./constants";
import axios from "axios";

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/LineMaster/get_details`);
    return response.data;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/LineMaster/Get_Plants`);
    return response;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/LineMaster/Get_Add`, data);
    return response;
  };
 
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/LineMaster/get_Updates`, data);
    return response;
  };
  
  export const getDepartment = async ()=>{

    const response = await axios.get(`${api}/LineMaster/Get_Department`);
    return response;
  };
  export const getSupvCode = async (PlantCode)=>{

  const response = await axios.get(`${api}/LineMaster/Get_SupvCode?PlantCode=${PlantCode}`);
  return response;
};
export const getModule = async ()=>{

    const response = await axios.get(`${api}/LineMaster/Get_Module`);
    return response;
};