import { api } from "./constants";
import axios from "axios";



 export const getInwardReportData = async (from, to)=>{
      const response = await axios.get(`${api}/Report551/downloadReport551?From=${from}&to=${to}`, );
      return response;
  };
//    export const getEmergencyReportData = async (from, to)=>{
//       const response = await axios.get(`${api}/Report551/downloadReportEmergency?From=${from}&to=${to}`, );
//       return response;
//   };