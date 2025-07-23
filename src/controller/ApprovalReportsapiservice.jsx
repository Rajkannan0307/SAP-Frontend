// src/ApprovalReports/apiService.js
import axios from "axios";
import { api } from "./constants"; // make sure constants.js is also in the right place



// ApprovedReportsApiService.jsx
export const getReportOptions = async () => {
  try {
    const response = await axios.get(`${api}/ApprovedReports/Get_Reports`);
    return response.data.data; // ✅ Return ONLY the array, not full response
  } catch (error) {
    console.error('Error fetching report options:', error);
    return []; // Return empty array on error
  }
};




export const getReportData = async (reportType, fromDate, toDate) => {
  const response = await axios.get(`${api}/ApprovedReports/getReportData`, {
    params: {
      reportType,        // ✅ include reportType
      fromDate,          // ✅ fix param name (was "From")
      toDate,            // ✅ fix param name (was "to")
    },
  });
  return response;
};


