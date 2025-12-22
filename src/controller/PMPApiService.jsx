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

export const getProductionPlandetails = async () => {
    const response = await axios.get(`${api}/PMPDRouter/GetTrnProductionPlan`);
    return response.data;
};

export const getTemplateProductionPlandetails = async () => {
    const response = await axios.get(`${api}/PMPDRouter/GetTemplateTrnProductionPlan`);
    return response.data;
};



// Trn PMPD Master

export const AddTrn_PMPD_Master = async (data) => {
    const response = await axios.post(`${api}/PMPDRouter/AddTrn_PMPD_Master`, data, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return response;
}

export const getTrnPMPD_MasterDetails = async () => {
    const response = await axios.get(`${api}/PMPDRouter/GetTrnPMPD_Master`);
    return response.data;
};

