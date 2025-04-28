import { api } from "./constants";
import axios from "axios";



export const Movement201202 = async (data) => {
    const response = await axios.post(`${api}/Movement201202/File`, data);
    return response;
};

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/Movement201202/get_details`);
    return response.data;
};
export const getAdd = async (data)=>{
    const response = await axios.post(`${api}/Movement201202/Get_Add`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/Movement201202/Get_Plants`);
    return response;
};
export const getView=async ()=>{
    const response = await axios.get(`${api}/Movement201202/get_View`);
    return response.data;
};

export const getTransactionData = async (from, to)=>{
    const response = await axios.get(`${api}/Movet201,202/download_data?From=${from}&to=${to}`, );
    return response;
};