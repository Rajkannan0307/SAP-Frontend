import { api } from "./constants";
import axios from "axios";



export const MaterialMaster = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/Master/File`, data);
    return response;
};


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/Master/get_details`);
    return response.data;
};
export const getAdd = async (data) => {
  const response = await axios.post(`${api}/Master/Get_Add`, data);
  return response;
};

export const getPlants = async ()=>{

    const response = await axios.get(`${api}/Master/Get_Plants`);
    return response;
};
export const getUpdates = async (data)=>{
  const response = await axios.put(`${api}/Master/get_Updates`, data);
  return response;
};
export const getMaterialType = async ()=>{

  const response = await axios.get(`${api}/Master/Get_Material_Type`);
  return response;
};
  
export const getLogin = async (data) => {
  const response = await axios.post(`${api}/login/Get_Login`, data);
  return response;
};
