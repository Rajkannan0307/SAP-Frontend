import { api } from "./constants";
import axios from "axios";


export const getdetails=async (Plant, role,Role,Doc_ID)=>{
    const response = await axios.get(`${api}/ApprovalRs1/get_details?Plant=${Plant}&role=${role}&Role=${Role}`);
    return response.data;
};

export const getApprovalView = async (docId) => {
    
      // Send docId as a query parameter
      const response = await axios.get(`${api}/ApprovalRs1/get_ViewButton`, {
        params: { Doc_ID: docId } 
      });
  
    //   console.log("API Response", response.data); // Log successful response data
      return response.data;
    
  };
  

  export const getPlants = async ()=>{

    const response = await axios.get(`${api}/ApprovalRs1/Get_Plants`);
    return response;
};



export const getRole=async ()=>{
    const response = await axios.get(`${api}/ApprovalRs1/Get_Role`);
    return response.data;
};


 // Handle approval action (approve/reject/query) for a specific document
export const HandleApprovalAction = async (data) => {
  try {
    // Send docId, action (approve/reject/query), and comment as request payload
    const response = await axios.post(`${api}/ApprovalRs1/HandleApprovalAction`, 
     data
    );

    return response.data;
  } catch (error) {
    console.error('Error handling approval action:', error.message);
    throw error;
  }
};



export const get_detailsApproval=async (Plant, role,Role,Doc_ID)=>{
    const response = await axios.get(`${api}/ApprovalRs1/get_detailsApproval?Plant=${Plant}&role=${role}&Role=${Role}`);
    return response.data; 
   }; 
// export const getRs1ApprovalView = async (docId) => {
//   const response = await axios.get(`${api}/ApprovalRs1/ViewRs1ApprovalStatus?Doc_ID=${docId}`);
  
//   return response.data;
// };



export const resubmitAction = async (docId) => {
  const response = await axios.get(`${api}/ApprovalRs1/HandleResubmitAction?Doc_ID=${docId}`);
  
  return response.data;
};

export const DownloadAllExcel = async (DocID)=>{
  console.log('Calling API with docId:', DocID); 
  const response = await axios.get(`${api}/ApprovalRs1/download_data?Doc_ID=${DocID}`);
    return response;
};


  export const getRs1ApprovalView = async (docId) => {
  const response = await axios.get(`${api}/ApprovalRs1/ViewRs1ApprovalStatus?Doc_ID=${docId}`);
  return response.data;
};
