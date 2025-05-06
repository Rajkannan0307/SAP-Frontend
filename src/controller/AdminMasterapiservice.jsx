import { api } from "./constants";
import axios from "axios";


export const get_Menus = async ( roleIdNo) => {
    console.log('roleId', roleIdNo);
    const response = await axios.get(`${api}/AdminMaster/menu_permission?Role_id=${roleIdNo}`, {
       
    });

    return response;
};

export const AddMenuAccess = async (data) => {
    const response = await axios.post(`${api}/AdminMaster/AddAccessMenu`, data, );
    return response;
};

export const get_Menus_Not = async ( roleIdNo) => {
    console.log('roleId', roleIdNo);
    const response = await axios.get(`${api}/AdminMaster/AccessNotMenu?Role_id=${roleIdNo}`, );

    return response;
};

export const get_Sub_Menu = async ( roleIdNo, Screen_Type) => {
    console.log('roleId', roleIdNo);
    const response = await axios.get(`${api}/AdminMaster/sub_menu_permission?Role_id=${roleIdNo}&Screen_Type=${Screen_Type}`,);

    return response;
};
export const get_Sub_Menu_List = async ( roleId, menu) => {
    console.log('roleId', roleId); 
    console.log('Screen', menu); 
    
    const response = await axios.get(`${api}/AdminMaster/SubMenuList?Role_id=${roleId}&menuName=${menu}`,
    );

    return response;
};

export const get_Drop_Down_Menu = async ( roleId, menu) => {
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