import { api } from "./constants";
import axios from "axios";


export const getdetailsPurchase=async ()=>{
    const response = await axios.get(`${api}/Inward/get_Purchasedetails`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/Inward/Get_AddPurchase`, data);
    return response;
  };
  export const getAddService = async (data) => {
    const response = await axios.post(`${api}/Inward/Get_AddService`, data);
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
export const getdetailsService = async ()=>{

    const response = await axios.get(`${api}/Inward/get_Servicedetails`);
    return response.data;
};

export const getVendor = async ()=>{

  const response = await axios.get(`${api}/Inward/Get_Vendor`);
  return response;
};
export const getMaterial = async ()=>{

  const response = await axios.get(`${api}/Inward/Get_Material`);
  return response;
};