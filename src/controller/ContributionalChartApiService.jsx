import axios from "axios"
import { api } from "./constants"

export const GetPackingBomApi = async ({ plant, type }) => {
    const response = await axios.get(`${api}/PackingBomRouter/getPackingBom`, { params: { plant, type } })
    return response;
}

export const InsertPackingBomApi = async (body) => {
    const response = await axios.post(`${api}/PackingBomRouter/insertPackingBom`, body)
    return response;
}

export const PackingBomBulkUploadApi = async (body) => {
    const response = await axios.post(`${api}/PackingBomRouter/PackageBomBulkUpload`, body, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
    return response
}


//Packing Bom child
export const GetPackingBomChild = async (pack_mst_id) => {
    const response = await axios.get(`${api}/PackingBomRouter/getPackingBomchild`, { params: { pack_mst_id } })
    return response.data;
}



// Packing Part
export const GetPackingPartApi = async () => {
    const response = await axios.get(`${api}/PackingPartRouter/getPackingPart`)
    return response.data;
}
export const GetPackingPartByPlantApi = async (plant, materialTypes) => {
    const response = await axios.get(`${api}/PackingPartRouter/getPackingPartByPlant`, { params: { plant, materialTypes } })
    return response.data;
}

export const AddOrEditPackingPart = async (body) => {
    const response = await axios.post(`${api}/PackingPartRouter/InsertPackingPart`, body)
    return response;
}

export const AddMstPackingPartBULK = async (formdata) => {
    const response = await axios.post(`${api}/PackingPartRouter/PackingPartBulk`, formdata, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
    return response
}



// Trn Consumption Plan Actual Api's

export const getTrnActualConsumptionPlan = async (body) => {
    const response = await axios.post(`${api}/ConsumptionPlanRouter/TrnMonthlyConsumption`, body);
    return response.data;
};

export const AddTrnMonthlyConsumption_BULK = async (body) => {
    const response = await axios.post(`${api}/ConsumptionPlanRouter/AddTrnMonthlyConsumption_BULK`, body, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response;
}



// Trn Indirect Material Price 



export const getTrnIndirectMaterialPrice = async (body) => {
    const response = await axios.post(`${api}/IDMaterialRouter/TrnIDM_Price`, body);
    return response.data;
};

export const AddTrnIndirectMaterialPrice_BULK = async (body) => {
    const response = await axios.post(`${api}/IDMaterialRouter/AddTrnIDMPrice_BULK`, body, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response;
}



//====================== DCM OUTPUT Result ============================

export const GetDCMOutput_ReportApi = async ({ plant, startDate, endDate }) => {
    const response = await axios.get(`${api}/PackingBomRouter/dcmOutput`, {
        params: {
            plant, startDate, endDate
        }
    });
    return response.data;
}

export const DCMOutputReportSendMailApi = async ({ plant, startDate, endDate }) => {
    const body = {
        plant, startDate, endDate
    }
    const response = await axios.post(`${api}/PackingBomRouter/dcmOutput/sendMail`, body);
    return response.data;
}




///-============ Mst Power Unit
export const GetMstPowerUnitApi = async () => {
    const response = await axios.get(`${api}/powerUnit/getMstPowerUnit`);
    return response.data;
}
export const AddorEditMstPowerUnitApi = async (body) => {
    const response = await axios.post(`${api}/powerUnit/addOrEditMstPowerUnit`, body);
    return response.data;
}
export const MstPowerUnitBulkApi = async (body) => {
    const response = await axios.post(`${api}/powerUnit/mstPowerunit_BULK`, body, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
}


//=======[Trn Daily Power Consumption]
export const GetTrnDailyPwrConsAPi = async () => {
    const response = await axios.get(`${api}/dailyPwrRouter/getTrnDailyPwrCons`);
    return response.data;
}
export const AddOrEditTrnDailyPwrConsApi = async (body) => {
    const response = await axios.post(`${api}/dailyPwrRouter/addOrEditTrnDailyPwrCons`, body);
    return response.data;
}
export const TrnDailyPwrCons_BULKApi = async (body) => {
    const response = await axios.post(`${api}/dailyPwrRouter/TrnDailyPwrCons_BULK`, body, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
}


// ====== Trn Power Mix Ratio
export const GetTrnPowerMixRatioAPi = async () => {
    const response = await axios.get(`${api}/powerMixRouter/getTrnPowerMixRatio`);
    return response.data;
}
export const AddOrEditTrnPowerMixRatioApi = async (body) => {
    const response = await axios.post(`${api}/powerMixRouter/addOrEditTrnPowerMix`, body);
    return response.data;
}
export const TrnPowerMixRatio_BULKApi = async (body) => {
    const response = await axios.post(`${api}/powerMixRouter/TrnPowerMixRatio_BULK`, body, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response.data;
}

