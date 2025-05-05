import { api } from "./constants";
import axios from "axios";


export const get_Menus = async (token, roleIdNo) => {
    console.log('roleId', roleIdNo);
    const response = await axios.get(`/master/menu_permission?Role_id=${roleIdNo}`, {
       
    });

    return response;
};

export const AddMenuAccess = async (data, token) => {
    const response = await axios.post(`${api}/master/AddAccessMenu`, data, );
    return response;
};

export const get_Menus_Not = async (token, roleIdNo) => {
    console.log('roleId', roleIdNo);
    const response = await axios.get(`${api}/master/AccessNotMenu?Role_id=${roleIdNo}`, );

    return response;
};

export const get_Sub_Menu = async (token, roleIdNo, Screen_Type) => {
    console.log('roleId', roleIdNo);
    const response = await axios.get(`${api}/master/sub_menu_permission?Role_id=${roleIdNo}&Screen_Type=${Screen_Type}`,);

    return response;
};
