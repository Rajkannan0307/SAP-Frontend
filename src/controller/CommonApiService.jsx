import axios from "axios";
import { api } from "./constants";

// Mst_Plants
export const getPlantdetails = async () => {
    const response = await axios.get(`${api}/PlantMaster/get_details_Plant`);
    return response.data;
};