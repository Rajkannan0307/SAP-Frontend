import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/VendorMaster/get_details_Vendor`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/VendorMaster/Get_Add`, data);
    return response;
  };
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/VendorMaster/get_Updates`, data);
    return response;
  };
  export const VendorMaster = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/VendorMaster/File`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/VendorMaster/Get_Plants`);
    return response;
};

// Buyers for the Vendor Master: the active users of the User Master (Employee_ID is stored as the vendor's buyer_id).
// params = { plantId } or { plantCode }: only the users of that plant (own plant + Data Access); no params = every active user
export const getBuyers = async (params) => {
    const response = await axios.get(`${api}/VendorMaster/Get_Buyers`, { params });
    return response;
};
