import { api } from "./constants";
import axios from "axios";


export const getdetails = async (roleIdNo, role) => {
    console.log('roleId', role);
    console.log('rolename', roleIdNo);
    const response = await axios.get(`${api}/AdminMaster/menu_permission?Role_id=${role}`, {
       
    });

    return response;
};

export const AddMenuAccess = async (data) => {
    const response = await axios.post(`${api}/AdminMaster/AddAccessMenu`, data, );
    return response;
};

export const get_ScreenType = async ( roleIdNo) => {
    console.log('ScreenType', roleIdNo);
    const response = await axios.get(`${api}/AdminMaster/ScreenType?Role_id=${roleIdNo}`, );

    return response;
};

export const get_ScreenName = async ( roleIdNo, Screen_Type) => {
    console.log('ScreenName', roleIdNo);
    console.log('screennnnnn',Screen_Type)
    const response = await axios.get(`${api}/AdminMaster/ScreenName?Role_id=${roleIdNo}&Screen_Type=${Screen_Type}`,);

    return response;
};
export const get_Sub_Menu_List = async ( role, menu) => {
    console.log('s', role); 
    console.log('Screen', menu); 
    
    const response = await axios.get(`${api}/AdminMaster/SubMenuList?Role_id=${role}&menuName=${menu}`,
    );

    return response;
};

export const getdetailssub = async ( roleId, menu) => {
    console.log('roleId', roleId); 
    console.log('Screen', menu); 
    
    const response = await axios.get(`${api}/AdminMaster/SubMenuNames?Role_id=${roleId}&menuName=${menu}`,);

    return response;
};

export const Delete_Menu = async ( Access_Id, employeeId) => {
    console.log('Access_Id', Access_Id);
    const response = await axios.put(`${api}/AdminMaster/Delete_Access?Access_Id=${Access_Id}&EmployeeId=${employeeId}`,);
    return response;
};