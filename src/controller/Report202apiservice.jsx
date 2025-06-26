
import { api } from "./constants";
import axios from "axios";



export const getTransactionData = async (from, to) => {
  const response = await axios.get(`${api}/Report5/download_data?From=${from}&to=${to}`);
  return response;
};
