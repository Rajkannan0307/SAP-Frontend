import { api } from "./constants";
import axios from "axios";


export const getdetailsStore1Open=async (UserID)=>{
    const response = await axios.get(`${api}/StoreDashboard/get_Store1Opendetails`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/StoreDashboard/Get_AddPurchase`, data);
    return response;
  };
  export const getAddService = async (data) => {
    const response = await axios.post(`${api}/StoreDashboard/Get_AddService`, data);
    return response;
  };

  export const StoreDashboard = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/StoreDashboard/File`, data);
    return response;
};
export const getdetailsService = async (UserID)=>{

    const response = await axios.get(`${api}/StoreDashboard/get_Servicedetails?UserID=${UserID}`);
    return response.data;
};

export const getVendor = async ()=>{

  const response = await axios.get(`${api}/StoreDashboard/Get_Vendor`);
  return response;
};
export const getMaterial = async ()=>{

  const response = await axios.get(`${api}/StoreDashboard/Get_Material`);
  return response;
};

export const updateStoreDashboardInvoicePurchase = async (data)=>{
    const response = await axios.put(`${api}/StoreDashboard/update_Purchase`, data);
    return response;
  };
  export const updateStoreDashboardInvoiceService = async (data)=>{
    const response = await axios.put(`${api}/StoreDashboard/update_Service`, data);
    return response;
  };

  export const getPurchaseData = async (from, to,UserID)=>{
      const response = await axios.get(`${api}/StoreDashboard/downloadPurchase?From=${from}&to=${to}&UserID=${UserID}`, );
      return response;
  };

  export const getServiceData = async (from, to,UserID)=>{
      const response = await axios.get(`${api}/StoreDashboard/downloadService?From=${from}&to=${to}&UserID=${UserID}`, );
      return response;
  };
  export const Resubmit = async (data) => {
  const response = await axios.post(`${api}/StoreDashboard/resubmit`, data);
  return response;
};
