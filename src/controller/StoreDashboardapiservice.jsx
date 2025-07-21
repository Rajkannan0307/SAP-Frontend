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

export const getdetailsExcelDownload = async (plantId, fromDate, toDate, storageCode) => {
  const response = await axios.get(`${api}/StoreDashboard/get_detailsStoreExcelDownload`, {
    params: {
      plantId,
      fromDate,
      toDate,
      storageCode,
    },
  });
  return response.data;
};



export const getdetailsStore1OpenByDate = async (plantId, storageCode, fromDate, toDate) => {
  try {
    const response = await axios.get(
      `${api}/StoreDashboard/StoreOpendate`, // Replace this with your actual endpoint
      {
        params: {
          plantId,
          storageCode,
          fromDate,
          toDate,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("API error fetching Store1 Open Orders by date:", error);
    throw error;
  }
};

export const getdetailsStoreClosedByDate = async (plantId, storageCode, fromDate, toDate) => {
  try {
    const response = await axios.get(
      `${api}/StoreDashboard/StoreCloseddate`, // Replace this with your actual endpoint
      {
        params: {
          plantId,
          storageCode,
          fromDate,
          toDate,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("API error fetching Store1 Open Orders by date:", error);
    throw error;
  }
};

// ✅ Get active stores for a plant
export const getActiveStores = async (plantId) => {
  try {
    const response = await axios.get(`${api}/StoreDashboard/getActiveStores`, {
      params: {
        plantId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching active stores:", error);
    throw error;
  }
};
