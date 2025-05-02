import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/CustomerMaster/get_details_Customer`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/CustomerMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/CustomerMaster/get_Updates`, data);
    return response;
  };
  export const CustomerMaster = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/CustomerMaster/File`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/CustomerMaster/Get_Plants`);
    return response;
};