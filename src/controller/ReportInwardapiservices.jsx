import { api } from "./constants";
import axios from "axios";



 export const getInwardReportData = async (from, to)=>{
      const response = await axios.get(`${api}/InwardReport/downloadReportInward?From=${from}&to=${to}`, );
      return response;
  };
   export const getEmergencyReportData = async (from, to)=>{
      const response = await axios.get(`${api}/InwardReport/downloadReportEmergency?From=${from}&to=${to}`, );
      return response;
  };