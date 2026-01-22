const ROLE = {
    PLAN_FINANCE_MED: 3,
    PLANT_MED: 16,
};


export const getPMPDAccess = () => {
    const roleId = Number(localStorage.getItem("RoleID") || 0);

    // Plant MED → View only
    if (roleId === ROLE.PLANT_MED || roleId === ROLE.PLAN_FINANCE_MED) {
        return { disableAction: true };
    }

    // Admin / Others → Full access
    return { disableAction: false };
};