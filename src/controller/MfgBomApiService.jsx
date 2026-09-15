import axios from "axios";
import { api } from "./constants";

export const GetMfgBomListApi = async () => {
  const response = await axios.get(`${api}/MFG_BOM/getMfgBomList`);
  return response;
};

export const GetMfgBomChildApi = async (plant, fg_part) => {
  const response = await axios.get(`${api}/MFG_BOM/getMfgBomChild`, { params: { plant, fg_part } });
  return response.data;
};

export const InsertMfgBomApi = async (body) => {
  const response = await axios.post(`${api}/MFG_BOM/insertMfgBom`, body);
  return response;
};

export const MfgBomBulkUploadApi = async (body) => {
  const response = await axios.post(`${api}/MFG_BOM/mfgBomBulkUpload`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

export const GetOperationNumbersApi = async () => {
  const response = await axios.get(`${api}/MFG_BOM/getOperationNumbers`);
  return response.data;
};

export const GetMaterialWithDescApi = async ({ plant, materialType }) => {
  const response = await axios.get(`${api}/MFG_BOM/getMaterialWithDesc`, { params: { plant, materialType } });
  return response.data;
};

export const GetMfgBomExportApi = async () => {
  const response = await axios.get(`${api}/MFG_BOM/getMfgBomExport`);
  return response.data;
};

export const GetPlantStockListApi = async () => {
  const response = await axios.get(`${api}/MFG_BOM/getPlantStockList`);
  return response.data;
};

export const FetchPlantStockApi = async (body) => {
  const response = await axios.post(`${api}/MFG_BOM/fetchPlantStock`, body);
  return response;
};

export const GetSupplierStockListApi = async () => {
  const response = await axios.get(`${api}/MFG_BOM/getSupplierStockList`);
  return response.data;
};

export const FetchSupplierStockApi = async (body) => {
  const response = await axios.post(`${api}/MFG_BOM/fetchSupplierStock`, body);
  return response;
};

export const GetMatAvailabilityFiltersApi = async () => {
  const response = await axios.get(`${api}/MFG_BOM/getMatAvailabilityFilters`);
  return response.data;
};

export const GetMatAvailabilityReportApi = async (params) => {
  const response = await axios.get(`${api}/MFG_BOM/getMatAvailabilityReport`, { params });
  return response.data;
};

export const GetPlantStockSnapshotApi = async (month) => {
  const response = await axios.get(`${api}/MFG_BOM/getPlantStockSnapshot`, { params: { month } });
  return response.data;
};

export const GetSupplierStockSnapshotApi = async (month) => {
  const response = await axios.get(`${api}/MFG_BOM/getSupplierStockSnapshot`, { params: { month } });
  return response.data;
};
