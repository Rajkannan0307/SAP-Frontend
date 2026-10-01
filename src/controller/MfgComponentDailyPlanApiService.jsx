import axios from "axios";
import { api } from "./constants";

export const GetMfgComponentDailyPlanGridApi = async (params) => {
  const response = await axios.get(`${api}/MfgComponentDailyPlan/getGrid`, { params });
  return response.data;
};

export const SaveMfgComponentDailyPlanApi = async (body) => {
  const response = await axios.post(`${api}/MfgComponentDailyPlan/saveGrid`, body);
  return response.data;
};

export const GetMfgComponentDailyPlanHistoryApi = async (params) => {
  const response = await axios.get(`${api}/MfgComponentDailyPlan/getPlanHistory`, { params });
  return response.data;
};

export const GetMfgComponentDailyPlanHistorySummaryApi = async (params) => {
  const response = await axios.get(`${api}/MfgComponentDailyPlan/getPlanHistorySummary`, { params });
  return response.data;
};

export const GetMfgComponentDailyPlanDayDetailApi = async (params) => {
  const response = await axios.get(`${api}/MfgComponentDailyPlan/getDayDetail`, { params });
  return response.data;
};

