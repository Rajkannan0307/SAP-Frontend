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

// The rows behind the Prod Status numbers (plan, production, entered plan) for the break-up sheets of the Excel download
export const GetMfgProductionPlanBreakupApi = async (params) => {
  const response = await axios.get(`${api}/MfgProductionDailyPlan/getPlanBreakup`, { params });
  return response.data;
};

// Lines for the Prod Status Line filter: the plant's FG lines, narrowed to the Segment when one is chosen
export const GetMfgProductionLinesApi = async (params) => {
  const response = await axios.get(`${api}/MfgProductionDailyPlan/getFilterLines`, { params });
  return response.data;
};

export const GetMfgProductionDailyPlanDayDetailApi = async (params) => {
  const response = await axios.get(`${api}/MfgProductionDailyPlan/getDayDetail`, { params });
  return response.data;
};

