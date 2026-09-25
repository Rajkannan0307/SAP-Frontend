import { api } from "./constants";
import axios from "axios";

export const getdetails = async () => {
  const response = await axios.get(`${api}/ShiftMaster/get_details`);
  return response.data;
};

export const getPlants = async () => {
  const response = await axios.get(`${api}/ShiftMaster/Get_Plants`);
  return response;
};

export const getAdd = async (data) => {
  const response = await axios.post(`${api}/ShiftMaster/Get_Add`, data);
  return response;
};

export const getUpdates = async (data) => {
  const response = await axios.put(`${api}/ShiftMaster/get_Updates`, data);
  return response;
};
