import { api } from "./constants";
import axios from "axios";



export const Movement201 = async (data) => {
    const response = await axios.post(`${api}/Movement201/File`, data);
    return response;
};
export const Movement201Reupload = async (data,docId) => {
    const response = await axios.post(`${api}/Movement201/FileReupload?Doc_ID=${docId}`, data);
    return response;
};

export const getdetails=async (user)=>{
    const response = await axios.get(`${api}/Movement201/get_details?userid=${user}`);
    return response.data;
};
export const getAdd = async (data)=>{
    const response = await axios.post(`${api}/Movement201/Get_Add`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_Plants`);
    return response;
};

export const getMaterial = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_Material`);
    return response;
};
export const getSLoc = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_StorageLocation`);
    return response;
};

export const getValuationType = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_ValuationType`);
    return response;
};


export const getMovement = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_MovementType`);
    return response;
};

export const getReasonForMovement = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_ReasonForMovementType`);
    return response;
};

export const getCostCenter = async ()=>{

    const response = await axios.get(`${api}/Movement201/Get_CostCenter`);
    return response;
};
export const getView=async ()=>{
    const response = await axios.get(`${api}/Movement201/get_View`);
    return response.data;
};


export const get201ApprovalView = async (docId) => {
  const response = await axios.get(`${api}/Movement201/View201ApprovalStatus?Doc_ID=${docId}`);
  
  return response.data;
};


export const DownloadAllExcel = async (DocID) => {
  if (!DocID) {
    throw new Error("DocID is required");
  }
  console.log('Calling API with docId:', DocID);
  const response = await axios.get(`${api}/Movement201/download_data?Doc_ID=${encodeURIComponent(DocID)}`);
  return response;
};

// ✅ FIXED: Update this path to match backend
export const getTransactionData = async (fromDate, toDate) => {
  const response = await axios.get(`${api}/Movement201/download_data`, {
    params: {
      From: fromDate,
      to: toDate,
    }
  });
  return response;
};

export const Edit201Record = async (data) => {
  const response = await axios.post(`${api}/Movement201/Edit201Record`, data);
  return response.data;
};


export const getresubmit = async (data) => {
  const response = await axios.post(`${api}/Movement201/HandleResubmitAction201`, data);
  
  return response.data;
};


export const getCancel = async (data) => {
  const response = await axios.post(`${api}/Movement201/HandleCancelAction201?Doc_ID`,data);
  
  return response.data;
};
