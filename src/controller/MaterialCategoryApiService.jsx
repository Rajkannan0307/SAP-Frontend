import { api } from "./constants";
import axios from "axios";

// Material Category master (backend: Master/MaterialCategory.Router.js, mounted at /MaterialCategory)
const base = `${api}/MaterialCategory`;

export const getCategoryDetails = async () => {
  const response = await axios.get(`${base}/get_details`);
  return response.data;
};

// active Products (Mst_Product): the dropdown of the Add / Edit dialogs
export const getCategoryProducts = async () => {
  const response = await axios.get(`${base}/Get_Products`);
  return response.data;
};

export const addCategory = async (data) => {
  const response = await axios.post(`${base}/Get_Add`, data);
  return response;
};

export const updateCategory = async (data) => {
  const response = await axios.post(`${base}/Get_Update`, data);
  return response;
};
