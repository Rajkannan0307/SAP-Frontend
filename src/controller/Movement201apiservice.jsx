import { api } from "./constants";
import axios from "axios";



export const Movement201 = async (data) => {
    const response = await axios.post(`${api}/Movement201/File`, data);
    return response;
};

export const getdetails=async (user)=>{
    const response = await axios.get(`${api}/Movement201/get_details?userid=${user}`);
    return response.data;
};
export const getAdd = async (data)=>{
    const response = await axios.post(`${api}/Movement201/Get_Add`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_Plants`);
    return response;
};
export const getView=async ()=>{
    const response = await axios.get(`${api}/Movement201/get_View`);
    return response.data;
};

export const getTransactionData = async ()=>{
    const response = await axios.get(`${api}/Movement201/download_data`, );
    return response;
};

export const get201ApprovalView = async (docId) => {
  const response = await axios.get(`${api}/Movement201/View201ApprovalStatus?Doc_ID=${docId}`);
  
  return response.data;
};
