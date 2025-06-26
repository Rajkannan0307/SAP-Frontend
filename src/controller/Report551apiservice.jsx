
import { api } from "./constants";
import axios from "axios";



export const getTransactionData = async (from, to) => {
  const response = await axios.get(`${api}/Report6/download_data?From=${from}&to=${to}`);
  return response;
};
