import { api } from "./constants";
import axios from "axios";

// Inward Freight (DCM menu; backend: ContributionalChart/InwardFreight.router.js, mounted at /InwardFreight)
const base = `${api}/InwardFreight`;

export const getFreightDetails = async () => {
  const response = await axios.get(`${base}/get_details`);
  return response.data;
};

// active materials and active vendors of ONE plant (Part No and Vendor Code dropdowns)
export const getFreightParts = async (plant_id) => {
  const response = await axios.get(`${base}/Get_Parts`, { params: { plant_id } });
  return response.data;
};

export const getFreightVendors = async (plant_id) => {
  const response = await axios.get(`${base}/Get_Vendors`, { params: { plant_id } });
  return response.data;
};

export const addFreight = async (data) => {
  const response = await axios.post(`${base}/Get_Add`, data);
  return response;
};

export const updateFreight = async (data) => {
  const response = await axios.put(`${base}/get_Updates`, data);
  return response;
};

export const uploadFreight = async (formData) => {
  const response = await axios.post(`${base}/File`, formData);
  return response;
};
