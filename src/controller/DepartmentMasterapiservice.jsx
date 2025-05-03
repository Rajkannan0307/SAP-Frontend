import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/DepartmentMaster/get_details_Department`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/DepartmentMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/DepartmentMaster/get_Updates`, data);
    return response;
  };
 
