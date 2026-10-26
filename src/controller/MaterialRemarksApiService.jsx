import { api } from "./constants";
import axios from "axios";

// Material Remarks (view only; backend: Master/MaterialRemarks.Router.js, mounted at /MaterialRemarks)
const base = `${api}/MaterialRemarks`;

// from / to = YYYY-MM-DD
export const getRemarkDetails = async (from, to) => {
  const response = await axios.get(`${base}/get_details`, { params: { from, to } });
  return response.data;
};
