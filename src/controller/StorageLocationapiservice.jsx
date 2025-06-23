import { api } from "./constants";
import axios from "axios";

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/StorageLocation/get_details`);
    return response.data;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/StorageLocation/Get_Plants`);
    return response;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/StorageLocation/Get_Add`, data);
    return response;
  };
 
  export const getUpdates = async (data)=>{
    const response = await axios.put(`${api}/StorageLocation/get_Updates`, data);
    return response;
  };
  export const getSupvCode = async (plantId)=>{

  const response = await axios.get(`${api}/StorageLocation/Get_SupvCode?PlantCode=${plantId}`);
  return response;
};
export const getSupvMappingsBySLocId = async (slocId) => {
  const response = await axios.get(`${api}/StorageLocation/supv-mapping/${slocId}`);
  return response.data;
};

export const MappingData = async ()=>{

  const response = await axios.get(`${api}/StorageLocation/Get_SupvCode_Mappings`);
  return response;
};
export const getStorageDownload=async ()=>{
    const response = await axios.get(`${api}/StorageLocation/get_StorageDownload`);
    return response.data;
};