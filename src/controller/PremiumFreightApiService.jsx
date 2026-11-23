import { api } from "./constants";
import axios from "axios";

// Premium Freight (own menu; backend: PremiumFreight/ApprovalLimit.router.js, mounted at /PremiumFreight/ApprovalLimit).
// The data is in the SFMS Postgres database (shared with the SFMS mobile app).
const limitBase = `${api}/PremiumFreight/ApprovalLimit`;

// every active plant of the user's company with its monthly approval limit for one financial year (fy = the year the FY starts in)
export const getApprovalLimits = async (fy) => {
  const response = await axios.get(`${limitBase}/get_details`, { params: { userId: localStorage.getItem("UserID"), fy } });
  return response.data;
};

// items = [{ plant_code, amount }] - only the plants that were changed
export const saveApprovalLimits = async (fy, items) => {
  const response = await axios.post(`${limitBase}/Save`, {
    userId: localStorage.getItem("UserID"),
    UserID: localStorage.getItem("EmpId"), // the employee (gen_id): stored as set_by
    fy,
    items,
  });
  return response;
};

export const getApprovalLimitHistory = async (fy, plant_code) => {
  const response = await axios.get(`${limitBase}/history`, { params: { userId: localStorage.getItem("UserID"), fy, plant_code } });
  return response.data;
};

// Freight Request Report (read-only; backend: PremiumFreight/Report.router.js, mounted at /PremiumFreight/Report).
// plant_code "" = all the plants the user may use; month 1-12 or ""; status PENDING / QUERY / APPROVED / REJECTED or "".
const reportBase = `${api}/PremiumFreight/Report`;
const reportUser = () => localStorage.getItem("UserID");

export const getFreightRequests = async ({ fy, plant_code = "", month = "", status = "", customer_code = "", hide_rejected = "" }) => {
  const response = await axios.get(`${reportBase}/requests`, { params: { userId: reportUser(), fy, plant_code, month, status, customer_code, hide_rejected } });
  return response.data;
};

export const getFreightSummary = async ({ fy, plant_code = "" }) => {
  const response = await axios.get(`${reportBase}/summary`, { params: { userId: reportUser(), fy, plant_code } });
  return response.data;
};

export const getFreightRequestDetail = async (id) => {
  const response = await axios.get(`${reportBase}/request/${id}`, { params: { userId: reportUser() } });
  return response.data;
};

// Freight Request (raise a request; approval continues in the SFMS mobile app; backend: PremiumFreight/Request.router.js, mounted at /PremiumFreight/Request).
const requestBase = `${api}/PremiumFreight/Request`;

// customers of the Sales database for the form: those with sales from the plant, or every customer (all = true); the form filters them
export const getFreightCustomers = async (plant_code, all = false) => {
  const response = await axios.get(`${requestBase}/customers`, { params: { plant_code, all: all ? 1 : 0 } });
  return response.data;
};

// parts sold to one customer (customerId = the Sales database CustomerId): from the plant, or from every plant (all = true)
export const getFreightCustomerParts = async (customerId, plant_code, all = false) => {
  const response = await axios.get(`${requestBase}/parts`, { params: { customerId, plant_code, all: all ? 1 : 0 } });
  return response.data;
};

export const getFreightFySpend = async (plant_code) => {
  const response = await axios.get(`${requestBase}/fyspend`, { params: { userId: reportUser(), plant_code } });
  return response.data;
};

// the standard mode rates of the freight master for plant + customer + part
export const getFreightStdRates = async (plant_code, customerCode, partNo) => {
  const response = await axios.get(`${requestBase}/stdfreight`, { params: { userId: reportUser(), plant_code, customerCode, partNo } });
  return response.data;
};

// the people of each level of the approval route -> { levels: [{ level: 'L1' | 'PH' | 'CFIN' | 'BH', title, users: [names] }] }
export const getFreightRoute = async (plant_code, approverId) => {
  const response = await axios.get(`${requestBase}/route`, { params: { userId: reportUser(), plant_code, approverId: approverId || "" } });
  return response.data;
};

// body: { plant_code, customerCode, partNo, qty, stdMode, stdCost, premCost }
export const checkFreightLimit = async (body) => {
  const response = await axios.post(`${requestBase}/budgetcheck`, { userId: reportUser(), ...body });
  return response.data;
};

// body: { plant_code, customerCode, partNo, partDesc, qty, stdMode, stdCost, premiumMode, premCost, reason, reasonId, actionPlan, recoveryPlan, targetDate (YYYY-MM-DD), responsibility }
export const createFreightRequest = async (body) => {
  const response = await axios.post(`${requestBase}/create`, { userId: reportUser(), UserID: localStorage.getItem("EmpId"), ...body });
  return response;
};

// the Edit screen of a request: { id, implementationDetails, completionStatus ("In Progress" | "Completed"), completedOn (YYYY-MM-DD, when Completed) }
export const updateFreightRequest = async (body) => {
  const response = await axios.post(`${requestBase}/update`, { userId: reportUser(), ...body });
  return response;
};

// the requests raised by the logged-in employee (like "My Requests" in the mobile app)
export const getMyFreightRequests = async () => {
  const response = await axios.get(`${requestBase}/mine`, { params: { empId: localStorage.getItem("EmpId") } });
  return response.data;
};

// PF Reason master (backend: PremiumFreight/Reason.router.js, mounted at /PremiumFreight/Reason). Every reason is mapped to a role: the users of that role
// (of the plant of the request) get the mail when a request is raised with the reason.
const reasonBase = `${api}/PremiumFreight/Reason`;

// activeOnly = true: only the active reasons (dropdown of the New Request form); false: all of them (the master screen)
export const getPfReasons = async (activeOnly = false) => {
  const response = await axios.get(`${reasonBase}/list`, { params: { active: activeOnly ? 1 : 0 } });
  return response.data;
};

export const getPfReasonRoles = async () => {
  const response = await axios.get(`${reasonBase}/roles`);
  return response.data;
};

// body: { id (to change one), reason, roleId, active }
export const savePfReason = async (body) => {
  const response = await axios.post(`${reasonBase}/save`, { UserID: localStorage.getItem("EmpId"), ...body });
  return response;
};

// the users of the category's role in the plant: the requester chooses who gets the mail -> { rows: [{ emp, name, email }] }
export const getPfCategoryUsers = async (reasonId, plant_code) => {
  const response = await axios.get(`${reasonBase}/users`, { params: { userId: localStorage.getItem("UserID"), reasonId, plant_code } });
  return response.data;
};
