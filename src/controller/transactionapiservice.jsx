import { api } from "./constants";
import axios from "axios";


export const Movement309 = async (data) => {
    console.log(data)
    const response = await axios.post(`${api}/transaction/File`, data);
    return response;
};

export const getdetails=async ()=>{
    const response = await axios.get(`${api}/transaction/get_details`);
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