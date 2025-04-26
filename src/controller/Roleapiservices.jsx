import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/RoleMaster/get_details_Role`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/RoleMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/RoleMaster/get_Updates`, data);
    return response;
  };