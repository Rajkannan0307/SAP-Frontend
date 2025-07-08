import { api } from "./constants";
import axios from "axios";


export const getdetailsStore1Open = async (plantId, storageCode) => {
  const response = await axios.get(`${api}/StoreDashboard/get_Store1Opendetails`, {
    params: {
      plantId,
      storageCode,  // ✅ Now passing it to the backend
    },
  });
  return response.data;
};
export const getdetailsStoreClosed = async (plantId, storageCode) => {
  const response = await axios.get(`${api}/StoreDashboard/get_detailsStoreClosed`, {
    params: {
      plantId,
      storageCode,  // ✅ Now passing it to the backend
    },
  });
  return response.data;
};