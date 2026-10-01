const ROLE = {
    PLAN_FINANCE_MED: 3,
    PLANT_MED: 16,
};


export const getPMPDAccess = () => {
    const roleId = Number(localStorage.getItem("RoleID") || 0);

    // Plant MED → View only
    // if (roleId === ROLE.PLANT_MED || roleId === ROLE.PLAN_FINANCE_MED) {
    if (roleId === ROLE.PLANT_MED) {
        return { disableAction: true };
    }

    // Admin / Others → Full access
    return { disableAction: false };
};


// ---------------------------------------------------------------------------
// MFG Daily Plan entry access - shared by "MFG Daily Production Plan" (ASSY)
// and "MFG Daily Component Plan". Only users whose role is listed in
// MFG_PLAN_EDIT_ROLE_IDS can type plan quantities and Save; everyone else who
// can open the screen gets a view-only grid (no typing, no Save).
//
// To grant another role, add its Role_ID (Mst_Role) to the array below -
// nothing else needs to change. Any number of users can hold a listed role.
// ---------------------------------------------------------------------------
export const MFG_PLAN_EDIT_ROLE_IDS = [
    12, // PROD INCHARGE
    9,  // CORP ADMIN
];

export const getMfgPlanEditAccess = () => {
    const roleId = Number(localStorage.getItem("RoleID") || 0);
    return { canEdit: MFG_PLAN_EDIT_ROLE_IDS.includes(roleId) };
};

// ---------------------------------------------------------------------------
// Scheduler screens (Scheduler Jobs / Column Mapping Studio / Run History):
// every role that is granted the screens can VIEW them; only the roles listed
// here can add / edit profiles, change mappings, switch the engine and Run Now.
// ---------------------------------------------------------------------------
export const SCHEDULER_ADMIN_ROLE_IDS = [
    9, // CORP ADMIN
];

export const getSchedulerAccess = () => {
    const roleId = Number(localStorage.getItem("RoleID") || 0);
    return { canManage: SCHEDULER_ADMIN_ROLE_IDS.includes(roleId) };
};
