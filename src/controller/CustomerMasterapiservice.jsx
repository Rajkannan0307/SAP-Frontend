import { api } from "./constants";
import axios from "axios";

// Customers and customer groups (filled by the daily sync from SalesMIS)
export const getdetails = async () => {
    const response = await axios.get(`${api}/CustomerMaster/get_details_Customer`);
    return response.data;
};

export const getCustomerGroups = async () => {
    const response = await axios.get(`${api}/CustomerMaster/get_details_CustomerGroup`);
    return response.data;
};

// the last sync run: { success, last: { Status, Finished_On, Triggered_By, counts..., Last_Success_On } | null }
export const getCustomerSyncStatus = async () => {
    const response = await axios.get(`${api}/CustomerMaster/sync_status`);
    return response.data;
};

// run the sync now; the backend answers 409 when another sync is running
export const runCustomerSync = async (data) => {
    const response = await axios.post(`${api}/CustomerMaster/sync`, data);
    return response.data;
};
