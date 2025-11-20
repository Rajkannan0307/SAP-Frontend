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

export const GetRigMonthlyStatusDashboard = async (year, month, plant) => {
    const response = await axios.get(`${api}/TestLab/GetRigMonthlyStatusDashboard`, {
        params: {
            year, month, plant
        }
    });
    return response.data;
}



// Test Rig Spec Master

export const GetMstTestRigSpec = async () => {
    const response = await axios.get(`${api}/TestRigMaster/get_details`);
    return response.data;
};

export const GetRigTyes = async () => {
    const response = await axios.get(`${api}/TestRigMaster/getRigTyes`);
    return response.data;
};

export const InsertMstTestRigSpec = async (data) => {
    const response = await axios.post(`${api}/TestRigMaster/insert`, data);
    return response.data;
};

export const UpdateMstTestRigSpec = async (data) => {
    const response = await axios.put(`${api}/TestRigMaster/update`, data);
    return response.data;
};



// Machine Master 

export const GetMstMachine = async () => {
    const response = await axios.get(`${api}/MachineMaster/get_machine`);
    return response.data;
};

export const GetMstMachineUpdate_image = async (body) => {
    const response = await axios.put(`${api}/MachineMaster/update_image`, body,
        {
            headers: { "Content-Type": "multipart/form-data" }
        });
    return response.data;
};

export const GetLineByPlantDept = async (plant, dept) => {
    const response = await axios.get(`${api}/MachineMaster/GetLineByPlantDept`, {
        params: {
            plant, dept
        }
    });
    return response.data;
};

export const GetModuleByPlantDept = async (plant, dept) => {
    const response = await axios.get(`${api}/MachineMaster/GetModuleByPlantDept`, {
        params: {
            plant, dept
        }
    });
    return response.data;
};


export const MstInsertMachine = async (body) => {
    const response = await axios.post(`${api}/MachineMaster/insert`, body);
    return response.data;
};

export const MstUpdateMachine = async (body) => {
    const response = await axios.put(`${api}/MachineMaster/update`, body);
    return response.data;
};
