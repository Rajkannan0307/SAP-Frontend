import { api } from "../controller/constants";
import axios from "axios";


export const getdetailsStoreOpen = async (plantId, storageCode) => {
  const response = await axios.get(`${api}/StoreUrl/get_StoreOpendetails`, {
    params: {
      plantId,
      storageCode,  // ✅ Now passing it to the backend
    },
  });
  return response.data;
};

// export const getdetailsStoreClosed = async (plantId, storageCode) => {
//   const response = await axios.get(`${api}/StoreUrl/get_StoreCloseddetails`, {
//     params: {
//       plantId,
//       storageCode,  // ✅ Now passing it to the backend
//     },
//   });
//   return response.data;
// };


// ✅ Get active stores for a plant
export const getActiveStores = async (plantId,Storage_Code) => {
  try {
    const response = await axios.get(`${api}/StoreUrl/getActiveStores`, {
      params: {
        plantId,
        Storage_Code
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching active stores:", error);
    throw error;
  }
};
