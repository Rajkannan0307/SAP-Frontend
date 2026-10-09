import axios from "axios";
import { api } from "./constants";

// Mst_Plants
export const getPlantdetails = async () => {
    const response = await axios.get(`${api}/PlantMaster/get_details_Plant`);
    return response.data;
};

// The plants the logged-in user may use on a screen: own plant + the plants granted in User Master > Data Access,
// each with its Division (Company). Use this instead of getPlantdetails() for every screen Plant dropdown.
//   [{ Plant_ID, Plant_Code, Plant_Name, Com_ID, Com_code, Com_Name, Is_Default }]   (own plant first)
export const getMyPlants = async () => {
    const response = await axios.get(`${api}/UserMaster/Access/MyPlants`, { params: { userId: localStorage.getItem("UserID") } });
    return response.data;
};

// Keeps only the rows of the plants this user may use (own plant + Data Access). For list screens that load
// every plant's rows with no Plant filter. `field` = the row's plant code field. If the plant list cannot be
// loaded nothing is shown (never other plants' rows).
export const filterRowsToMyPlants = async (rows, field = "plant") => {
    try {
        const mine = await getMyPlants();
        const allowed = new Set((Array.isArray(mine) ? mine : []).map((p) => String(p.Plant_Code)));
        return (rows || []).filter((r) => allowed.has(String(r?.[field])));
    } catch (error) {
        console.error("Failed to load the user's plants.", error);
        return [];
    }
};

// "1150 - RML P4 (RML)"  = Plant code - Plant name (Division)
export const myPlantLabel = (p) => `${p.Plant_Code} - ${p.Plant_Name}${p.Com_Name ? ` (${p.Com_Name})` : ""}`;

export const getDepartmentdetails = async () => {
    const response = await axios.get(`${api}/DepartmentMaster/get_details_Department`);
    return response.data;
};