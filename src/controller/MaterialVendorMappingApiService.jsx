import { api } from "./constants";
import axios from "axios";

// Material - Vendor Mapping master (backend: Master/MaterialVendorMapping.Router.js, mounted at /MaterialVendorMapping)
const base = `${api}/MaterialVendorMapping`;

export const getMappingDetails = async () => {
  const response = await axios.get(`${base}/get_details`);
  return response.data;
};


// active direct materials / active vendors of ONE plant (the Material and Vendor must belong to the same plant)
export const getMappingMaterials = async (plant_id) => {
  const response = await axios.get(`${base}/Get_Materials`, { params: { plant_id } });
  return response.data;
};

export const getMappingVendors = async (plant_id) => {
  const response = await axios.get(`${base}/Get_Vendors`, { params: { plant_id } });
  return response.data;
};

export const addMapping = async (data) => {
  const response = await axios.post(`${base}/Get_Add`, data);
  return response;
};

export const updateMapping = async (data) => {
  const response = await axios.put(`${base}/get_Updates`, data);
  return response;
};


export const uploadMapping = async (formData) => {
  const response = await axios.post(`${base}/File`, formData);
  return response;
};
