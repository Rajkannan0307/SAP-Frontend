import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/ValuationTypeMaster/get_details_Valuation`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/ValuationTypeMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/ValuationTypeMaster/get_Updates`, data);
    return response;
  };