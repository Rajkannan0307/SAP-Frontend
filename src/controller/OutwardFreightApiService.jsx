import { api } from "./constants";
import axios from "axios";

// Outward Freight (DCM menu; backend: ContributionalChart/OutwardFreight.router.js, mounted at /OutwardFreight)
const base = `${api}/OutwardFreight`;

export const getFreightDetails = async () => {
  const response = await axios.get(`${base}/get_details`);
  return response.data;
};

// active materials of ONE plant (Part No dropdown) and active customers (Customer Code dropdown)
export const getFreightParts = async (plant_id) => {
  const response = await axios.get(`${base}/Get_Parts`, { params: { plant_id } });
  return response.data;
};

export const getFreightCustomers = async () => {
  const response = await axios.get(`${base}/Get_Customers`);
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
