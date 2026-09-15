import { api } from "./constants";
import axios from "axios";

export const getdetails = async () => {
  const response = await axios.get(`${api}/OperationMaster/get_details`);
  return response.data;
};

export const getAdd = async (data) => {
  const response = await axios.post(`${api}/OperationMaster/Get_Add`, data);
  return response;
};

export const getUpdates = async (data) => {
  const response = await axios.put(`${api}/OperationMaster/get_Updates`, data);
  return response;
};
