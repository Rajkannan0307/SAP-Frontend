
import { api } from "./constants";
import axios from "axios";



 export const getInwardReportData = async (from, to)=>{
      const response = await axios.get(`${api}/202Report/downloadReport202?From=${from}&to=${to}`, );
      return response;
  };
//    export const getEmergencyReportData = async (from, to)=>{
//       const response = await axios.get(`${api}/InwardReport/downloadReportEmergency?From=${from}&to=${to}`, );
//       return response;
//   };