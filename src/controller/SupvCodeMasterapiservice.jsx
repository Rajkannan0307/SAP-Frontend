import { api } from "./constants";
import axios from "axios";

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/SupvCodeMaster/get_details`);
    return response.data;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/SupvCodeMaster/Get_Plants`);
    return response;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/SupvCodeMaster/Get_Add`, data);
    return response;
  };
 
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/SupvCodeMaster/get_Updates`, data);
    return response;
  };
  