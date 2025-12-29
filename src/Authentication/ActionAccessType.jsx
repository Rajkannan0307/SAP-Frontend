const ROLE = {
    PLANT_MED: 16,
};


export const getPMPDAccess = () => {
    const roleId = Number(localStorage.getItem("RoleID") || 0);

    // Plant MED → View only
    if (roleId === ROLE.PLANT_MED) {
        return { disableAction: true };
    }

    // Admin / Others → Full access
    return { disableAction: false };
};