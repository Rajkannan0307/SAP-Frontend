import { api } from "./constants";
import axios from "axios";


export const getdetailsPurchase=async (UserID)=>{
    const response = await axios.get(`${api}/Inward/get_Purchasedetails?UserID=${UserID}`);
    return response.data;
};
export const getAdd = async (data) => {
    const response = await axios.post(`${api}/Inward/Get_AddPurchase`, data);
    return response;
  };
  export const getAddService = async (data) => {
    const response = await axios.post(`${api}/Inward/Get_AddService`, data);
    return response;
  };

  export const Inward = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/Inward/File`, data);
    return response;
};
export const getdetailsService = async (UserID)=>{

    const response = await axios.get(`${api}/Inward/get_Servicedetails?UserID=${UserID}`);
    return response.data;
};

export const getVendor = async ()=>{

  const response = await axios.get(`${api}/Inward/Get_Vendor`);
  return response;
};
export const getMaterial = async ()=>{

  const response = await axios.get(`${api}/Inward/Get_Material`);
  return response;
};

export const updateInwardInvoicePurchase = async (data)=>{
    const response = await axios.put(`${api}/Inward/update_Purchase`, data);
    return response;
  };
  export const updateInwardInvoiceService = async (data)=>{
    const response = await axios.put(`${api}/Inward/update_Service`, data);
    return response;
  };

  export const getPurchaseData = async (from, to,UserID)=>{
      const response = await axios.get(`${api}/Inward/downloadPurchase?From=${from}&to=${to}&UserID=${UserID}`, );
      return response;
  };

  export const getServiceData = async (from, to,UserID)=>{
      const response = await axios.get(`${api}/Inward/downloadService?From=${from}&to=${to}&UserID=${UserID}`, );
      return response;
  };