import { api } from "./constants";
import axios from "axios";

// Mst Product 
export const getProductdetails = async (prod_type) => {
    const response = await axios.get(`${api}/PMPDRouter/getMstProduct`, { params: { prod_type } });
    return response.data;
};

export const AddOrEditProduct = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/MstProduct`, data);
    return response;
};


// Mst Product Segment
export const getProductSegmentdetails = async () => {
    const response = await axios.get(`${api}/PMPDRouter/getMstProductSegment`);
    return response.data;
};

export const AddOrEditProductSegemnt = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/MstProductSegment`, data);
    return response;
};


// Mst Product Mapping
export const getProductMappingdetails = async () => {
    const response = await axios.get(`${api}/PMPDRouter/getMstProductMapping`);
    return response.data;
};

export const AddOrEditProductMapping = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/MstProductMapping`, data);
    return response;
};



//Trn Production Plan 

export const AddProductionPlan = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/AddProductionPlan`, data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response;
}

export const getProductionPlandetails = async (startDate, endDate, plant) => {
    const response = await axios.get(`${api}/PMPDRouter/GetTrnProductionPlan`, {
        params: {
            startDate, endDate, plant
        }
    });
    return response.data;
};

export const getTemplateProductionPlandetails = async () => {
    const response = await axios.get(`${api}/PMPDRouter/GetTemplateTrnProductionPlan`);
    return response.data;
};



// Trn PMPD Master

export const AddTrn_PMPD_Master_BULK = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/AddTrn_PMPD_Master_BULK`, data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response;
}

export const AddTrn_PMPD_Master_Single = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/AddTrn_PMPD_Master_Single`, data);
    return response;
}

export const getTrnPMPD_MasterDetails = async (plant) => {
    const response = await axios.get(`${api}/PMPDRouter/GetTrnPMPD_Master`, { params: { plant: plant || null } });
    return response.data;
};



// PMPD Reports 

export const getPMPD_Reports = async (body) => {
    const response = await axios.post(`${api}/PMPDRouter/GetPMPD_Reports`, body);
    return response.data;
}




//Mst Category Breakups

export const getMstCategoryBreakupDetails = async () => {
    const response = await axios.get(`${api}/PMPDRouter/GetCategoryBreakup`);
    return response.data;
};


export const AddMstCategoryBreakup = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/MstCatgoryBreakup`, data);
    return response;
}

//Mst Indirect Category

export const getMstIndirectCategoryDetails = async (plant, dept) => {
    const response = await axios.get(`${api}/PMPDRouter/MstIndirectCategory`, { params: { plant, dept } });
    return response.data;
};

export const getAllMstIndirectCategoryDetails = async (plant) => {
    const response = await axios.get(`${api}/PMPDRouter/GetAllMstIndirectCategory`);
    return response.data;
};

export const AddMstIndirectCategory = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/MstIndirectCategory`, data);
    return response;
}


//Trn Indirect Manpower

export const getTrnIndirectManPower = async (plant) => {
    const response = await axios.get(`${api}/PMPDRouter/TrnIndirectManPower`, { params: { plant: plant || null } });
    return response.data;
};

export const AddTrnIndirectManpower = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/TrnIndirectManpower`, data);
    return response;
}


// Trn Actual Prod Plan

export const getTrnActualProdPlan = async (body) => {
    const response = await axios.post(`${api}/PMPDRouter/TrnActualProdPlan`, body);
    return response.data;
};

export const AddTrnActualProdPlan_BULK = async (body) => {
    const response = await axios.post(`${api}/PMPDRouter/AddTrnActualProdPlan_BULK`, body, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response;
}





//Trn Plan Vs Actual Report

export const GetPMPD_PlanVsActual = async (body) => {
    const response = await axios.post(`${api}/PMPDRouter/PlanVsActual`, body);
    return response;
}

export const GetPMPD_PlanVsActual_InDirect = async (body) => {
    const response = await axios.post(`${api}/PMPDRouter/PlanVsActual_Indirect`, body);
    return response;
}




// MASTER PMPD FIXED MANPOWER

export const GetFixedManpower = async (plant) => {
    const response = await axios.get(`${api}/FixedManpowerRouter/get_details`, { params: { plant } })
    return response.data
}

export const AddFixedManpower = async (data) => {
    const response = await axios.post(`${api}/FixedManpowerRouter/insert`, data);
    return response;
}

export const UpdateFixedManpower = async (data) => {
    const response = await axios.put(`${api}/FixedManpowerRouter/update`, data);
    return response;
}