import { api } from "./constants";
import axios from "axios";

// RM Coverage (backend: MFG_BOM/RmCoverage.router.js, mounted at /RmCoverage)
// plants = comma separated plant codes, e.g. "1150,1200"; month = "yyyy-MM" (plan month, current month when empty)
export const GetRmCoverageApi = async ({ plants, month }) => {
  const response = await axios.get(`${api}/RmCoverage/getRmCoverage`, { params: { plants, month } });
  return response.data;
};

// Supplier Kanban (tab of the Child Part Coverage screen, same backend router)
// the vendors with Kanban mail = Yes, with the R / Y / G count of their child parts
export const GetSupplierKanbanApi = async ({ plants, month, product }) => {
  const response = await axios.get(`${api}/RmCoverage/getSupplierKanban`, { params: { plants, month, product: product || undefined } });
  return response.data;
};

// one vendor's materials with the Total Requirement (View dialog)
export const GetSupplierKanbanDetailApi = async ({ plants, month, vendorId }) => {
  const response = await axios.get(`${api}/RmCoverage/getSupplierKanbanDetail`, { params: { plants, month, vendorId } });
  return response.data;
};

// mails the same table to the vendor (To) and the buyer (CC)
export const SendSupplierKanbanMailApi = async ({ plants, month, vendorId, userId }) => {
  const response = await axios.post(`${api}/RmCoverage/sendSupplierKanbanMail`, { plants, month, vendorId, userId });
  return response.data;
};

// the vendor's past Kanban mails in the plants, newest first (History dialog)
export const GetSupplierKanbanHistoryApi = async ({ plants, vendorId, month }) => {
  const response = await axios.get(`${api}/RmCoverage/getSupplierKanbanHistory`, { params: { plants, vendorId, month } });
  return response.data;
};

// one past mail: its card, drawn again from the saved lines
export const GetSupplierKanbanHistoryCardApi = async ({ plants, logId }) => {
  const response = await axios.get(`${api}/RmCoverage/getSupplierKanbanHistoryCard`, { params: { plants, logId } });
  return response.data;
};
