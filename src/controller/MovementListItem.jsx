import { api } from "./constants";
import axios from "axios";

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/MovementListItem/get_details`);
    return response.data;
};
export const getActiveMovementType = async ()=>{

    const response = await axios.get(`${api}/MovementListItem/Get_MovementType`);
    return response;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/MovementListItem/Get_Add`, data);
    return response;
  };
 
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/MovementListItem/get_Updates`, data);
    return response;
  };
  