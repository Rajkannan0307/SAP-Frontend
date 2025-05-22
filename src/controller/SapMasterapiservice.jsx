import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/SapMaster/get_details`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/SapMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/SapMaster/get_Updates`, data);
    return response;
  };
  export const getPlants = async ()=>{

    const response = await axios.get(`${api}/Master/Get_Plants`);
    return response;
};