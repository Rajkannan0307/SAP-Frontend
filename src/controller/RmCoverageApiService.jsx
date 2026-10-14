import { api } from "./constants";
import axios from "axios";

// RM Coverage (backend: MFG_BOM/RmCoverage.router.js, mounted at /RmCoverage)
// plants = comma separated plant codes, e.g. "1150,1200"; month = "yyyy-MM" (plan month, current month when empty)
export const GetRmCoverageApi = async ({ plants, month }) => {
  const response = await axios.get(`${api}/RmCoverage/getRmCoverage`, { params: { plants, month } });
  return response.data;
};
