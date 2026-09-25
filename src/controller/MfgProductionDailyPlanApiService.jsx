import axios from "axios";
import { api } from "./constants";

export const GetMfgProductionDailyPlanGridApi = async (params) => {
  const response = await axios.get(`${api}/MfgProductionDailyPlan/getGrid`, { params });
  return response.data;
};

export const SaveMfgProductionDailyPlanApi = async (body) => {
  const response = await axios.post(`${api}/MfgProductionDailyPlan/saveGrid`, body);
  return response.data;
};

export const GetMfgProductionDailyPlanHistoryApi = async (params) => {
  const response = await axios.get(`${api}/MfgProductionDailyPlan/getPlanHistory`, { params });
  return response.data;
};

export const GetMfgProductionDailyPlanHistorySummaryApi = async (params) => {
  const response = await axios.get(`${api}/MfgProductionDailyPlan/getPlanHistorySummary`, { params });
  return response.data;
};

export const GetMfgProductionDailyPlanDayDetailApi = async (params) => {
  const response = await axios.get(`${api}/MfgProductionDailyPlan/getDayDetail`, { params });
  return response.data;
};

