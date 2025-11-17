import { api } from "./constants";
import axios from "axios";

// RigMachine
export const getMachine = async () => {
    // const response = await axios.get(`${api}/TestLab/GetMachine`);
    // return response.data;
    return
};

export const getRigMachine = async (PlantCode) => {
    const response = await axios.get(`${api}/TestLab/GetRigMachine`, {
        params: { PlantCode }
    });
    return response.data;
};

export const GetMstTestSpecification = async (rig_type) => {
    const response = await axios.get(`${api}/TestLab/GetMstTestSpecification`, {
        params: { rig_type }
    });
    return response.data;
};
export const AddTestRigStatusApi = async (body) => {
    const response = await axios.post(`${api}/TestLab/AddTestRigStatus`, body, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const GetTestRigStatusApi = async () => {
    const response = await axios.get(`${api}/TestLab/GetTestRigStatus`);
    return response.data;
};

export const GetTestRigResultApi = async (trn_rig_test_status_id) => {
    const response = await axios.get(`${api}/TestLab/GetTestRigResult`, {
        params: { trn_rig_test_status_id }
    });
    return response.data;
};

export const EditTestRigStatusApi = async (body) => {
    const response = await axios.put(`${api}/TestLab/UpdateTestRigStatus`, body, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const GetRigStatusDashboard = async (machine_id) => {
    const response = await axios.get(`${api}/TestLab/GetRigStatusDashboard`, {
        params: {
            machine_id
        }
    });
    return response.data;
}
