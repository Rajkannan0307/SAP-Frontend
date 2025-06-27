import { api } from "./constants";
import axios from "axios";


export const getdetailsStore1Open = async ( plantId) => {
  const response = await axios.get(
    `${api}/StoreDashboard/get_Store1Opendetails`,
    {
      params: {
       
        plantId,
      },
    }
  );
  return response.data;
};
