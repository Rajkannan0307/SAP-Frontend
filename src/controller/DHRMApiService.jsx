import axios from "axios";
import { api } from "./constants";

export const DHRM_DeptHeaderMst = async () => {
    const response = await axios.get(`${api}/DHRMRouter/GetDeptHeaderMst`);
    return response.data;
}