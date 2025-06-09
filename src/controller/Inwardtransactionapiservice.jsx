import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/Inward/get_details_Vendor`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/Inward/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/Inward/get_Updates`, data);
    return response;
  };
  export const Inward = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/Inward/File`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/Inward/Get_Plants`);
    return response;
};

export const getVendor = async ()=>{

  const response = await axios.get(`${api}/Inward/Get_Vendor`);
  return response;
};