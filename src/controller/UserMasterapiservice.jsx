import { api } from "./constants";
import axios from "axios";

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/UserMaster/get_details`);
    return response.data;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/UserMaster/Get_Plants`);
    return response;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/UserMaster/Get_Add`, data);
    return response;
  };
  export const getDepartment = async ()=>{

    const response = await axios.get(`${api}/UserMaster/Get_Department`);
    return response;
  };
  export const getUserLevel = async ()=>{

    const response = await axios.get(`${api}/UserMaster/Get_UserLevel`);
    return response;
  };
  export const getRole = async ()=>{

    const response = await axios.get(`${api}/UserMaster/Get_Role`);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/UserMaster/get_Updates`, data);
    return response;
  };
  