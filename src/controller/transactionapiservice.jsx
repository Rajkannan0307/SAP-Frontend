import { api } from "./constants";
import axios from "axios";


export const Movement309 = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/transaction/File`, data);
    return response;
};

export const Movement309ReUpload = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/transaction/FileReupload`, data);
    return response;
};


export const getdetails=async (user)=>{
    const response = await axios.get(`${api}/transaction/get_details?userid=${user}`);
    return response.data;
};
export const getAdd = async (data)=>{
    const response = await axios.post(`${api}/transaction/Get_Add`, data);
    return response;
};
export const getPlants = async ()=>{

    const response = await axios.get(`${api}/transaction/Get_Plants`);
    return response;
};

export const getMaterial = async ()=>{

    const response = await axios.get(`${api}/transaction/Get_Material`);
    return response;
};
export const getView=async ()=>{
    const response = await axios.get(`${api}/transaction/get_View`);
    return response.data;
};
// export const getExcelDownload = async (data)=>{
//     const response = await axios.post(`${api}/transaction/download-excel`, data);
//     return response;
// };

export const getTransactionData = async (from, to)=>{
    const response = await axios.get(`${api}/transaction/download_data?From=${from}&to=${to}`, );
    return response;
};


export const get309ApprovalView = async (docId) => {
  const response = await axios.get(`${api}/transaction/View309ApprovalStatus?Doc_ID=${docId}`);
  
  return response.data;
};




export const getresubmit = async (data) => {
  const response = await axios.post(`${api}/transaction/HandleResubmitAction`, data);
  
  return response.data;
};


export const getCancel = async (data) => {
  const response = await axios.post(`${api}/transaction/HandleCancelAction?Doc_ID`,data);
  
  return response.data;
};

export const DownloadAllExcel = async (docId) => {
  if (!docId) {
    throw new Error("DocID is required");
  }

  const response = await axios.get(
    `${api}/transaction/download?docId=${encodeURIComponent(docId)}`
  );

  return response;
};

