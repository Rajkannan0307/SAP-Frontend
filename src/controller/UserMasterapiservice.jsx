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
  // Data Access (Division / Plant access per screen)
  export const getDataAccessOptions = async () => {
    const response = await axios.get(`${api}/UserMaster/Access/Options`);
    return response.data;
  };
  export const getDataAccessSummary = async () => {
    const response = await axios.get(`${api}/UserMaster/Access/Summary`);
    return response.data;
  };
  export const getUserDataAccess = async (userId) => {
    const response = await axios.get(`${api}/UserMaster/Access/${userId}`);
    return response.data;
  };
  export const saveUserDataAccess = async (userId, companyIds, plantIds, UserID) => {
    const response = await axios.put(`${api}/UserMaster/Access/${userId}`, { companyIds, plantIds, UserID });
    return response.data;
  };
  