import { api } from "./constants";
import axios from "axios";

// Working Days master (backend: Master/WorkingDays.Router.js, mounted at /WorkingDays)
const base = `${api}/WorkingDays`;

export const getWorkingDayDetails = async () => {
  const response = await axios.get(`${base}/get_details`);
  return response.data;
};

export const addWorkingDays = async (data) => {
  const response = await axios.post(`${base}/Get_Add`, data);
  return response;
};

export const updateWorkingDays = async (data) => {
  const response = await axios.post(`${base}/Get_Update`, data);
  return response;
};
