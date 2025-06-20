import { api } from "./constants";
import axios from "axios";



export const Movement311 = async (data) => {
    const response = await axios.post(`${api}/Movement311/File`, data);
    return response;
};
export const Movement311Reupload = async (data,docId) => {
    const response = await axios.post(`${api}/Movement311/FileReupload?Doc_ID=${docId}`, data);
    return response;
};

// export const getdetails=async (user)=>{
//     const response = await axios.get(`${api}/Movement311/get_details?userid=${user}`);
//     return response.data;
// };

export const getdetails = async (user) => {
  const response = await axios.get(`${api}/Movement311/get_details?userid=${user}`);
  // Assuming your API returns an object with 'data' as the array:
  return response.data.data || [];  // fallback to empty array if no data
};

export const getAdd = async (data)=>{
    const response = await axios.post(`${api}/Movement311/Get_Add`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/Movement311/Get_Plants`);
    return response;
};

export const getMaterial = async ()=>{

    const response = await axios.get(`${api}/Movement311/Get_Material`);
    return response;
};
export const getSLoc = async ()=>{

    const response = await axios.get(`${api}/Movement311/Get_StorageLocation`);
    return response;
};

export const getValuationType = async ()=>{

    const response = await axios.get(`${api}/Movement311/Get_ValuationType`);
    return response;
};


export const getMovement = async ()=>{

    const response = await axios.get(`${api}/Movement311/Get_MovementType`);
    return response;
};

export const getReasonForMovement = async ()=>{

    const response = await axios.get(`${api}/Movement311/Get_ReasonForMovementType311`);
    return response;
};

export const getCostCenter = async ()=>{

    const response = await axios.get(`${api}/Movement311/Get_CostCenter`);
    return response;
};
export const getView=async ()=>{
    const response = await axios.get(`${api}/Movement311/get_View`);
    return response.data;
};


export const get311ApprovalView = async (docId) => {
  const response = await axios.get(`${api}/Movement311/View311ApprovalStatus?Doc_ID=${docId}`);
  
  return response.data;
};


export const DownloadAllExcel = async (DocID) => {
  if (!DocID) {
    throw new Error("DocID is required");
  }
  console.log('Calling API with docId:', DocID);
  const response = await axios.get(`${api}/Movement311/download_data?Doc_ID=${encodeURIComponent(DocID)}`);
  return response;
};

// ✅ FIXED: Update this path to match backend
export const getTransactionData = async (fromDate, toDate) => {
  const response = await axios.get(`${api}/Movement311/getTransactionData`, {
    params: {
      From: fromDate,
      to: toDate,
    }
  });
  return response;
};

export const Edit311Record = async (data) => {
  const response = await axios.post(`${api}/Movement311/Edit311Record`, data);
  return response.data;
};


export const getresubmit = async (data) => {
  const response = await axios.post(`${api}/Movement311/HandleResubmitAction311`, data);
  
  return response.data;
};


export const getCancel = async (data) => {
  const response = await axios.post(`${api}/Movement311/HandleCancelAction311?Doc_ID`,data);
  
  return response.data;
};
