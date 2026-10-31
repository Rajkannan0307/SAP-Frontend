import { api } from "./constants";
import axios from "axios";

// Offline Stock Status (backend: MFG_BOM/OfflineStock.router.js, mounted at /OfflineStock)
// The plant, material and vendor pickers use the lookups of Material - Vendor Mapping (active direct materials / active vendors of one plant).
const base = `${api}/OfflineStock`;

export const getOfflineStock = async () => {
  const response = await axios.get(`${base}/list`);
  return response.data;
};

export const addOfflineStock = async (data) => {
  const response = await axios.post(`${base}/add`, data);
  return response;
};

export const updateOfflineStock = async (data) => {
  const response = await axios.put(`${base}/update`, data);
  return response;
};

// bulk upload: all or nothing. A file with wrong rows answers HTTP 422 with { summary, errors: { invalidRows, emptyRows } }.
export const uploadOfflineStock = async (formData) => {
  const response = await axios.post(`${base}/upload`, formData);
  return response;
};
