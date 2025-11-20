// src/Authentication/AccessControl.js
import { decryptSessionData } from "../controller/StorageUtils";

// Simulating your database table (Access Control Mapping)
const accessMap = {
  1: [15, 34, 35, 36, 37, 38, 39, 16, 17], // REQUESTER can access Dashboard, Report1, Report2
  2: [14, 19, 20, 22], // PLANT MMD HEAD can access Approval_309, Report1, Report2
  3: [14, 19, 20, 22, 23, 26, 33], // PLANT FINANCE HEAD can access Approval_309, Report1, Report2
  4: [14, 18, 19, 20, 23, 26, 27], // PLANT MRPC can access Approval_309, Report1, Report2
  5: [14, 19, 20, 23, 26, 33], // PLANT HEAD can access Approval_309, Report1, Report2
  6: [14, 19, 20, 22, 26, 33], // CORP FINANCE HEAD can access Approval_309, Report1, Report2
  7: [7, 8, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 22, 26, 34, 35, 36, 37, 38, 39, 33, 40], // CORP MRPC can access multiple screens
  8: [14, 19, 20, 26, 33], // BUSINESS HEAD can access Approval_309, Report1, Report2
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 26, 27, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],// CORP ADMIN (Full Access)
  10: [22], // CORP MMD HEAD
  14: [40, 39, 41, 42, 43] // TEST LAB 
};


//   1: [15, ], // REQUESTER can access Dashboard, Report1, Report2
//   2: [14, 19,20,22], // PLANT MMD HEAD can access Approval_309, Report1, Report2
//   3: [14,19,20,22,23,26,27], // PLANT FINANCE HEAD can access Approval_309, Report1, Report2
//   4: [14, 18,19,20,23,26,27], // PLANT MRPC can access Approval_309, Report1, Report2
//   5: [14, 19,20,23,26,27], // PLANT HEAD can access Approval_309, Report1, Report2
//   6: [14, 19,20,22,26,27], // CORP FINANCE HEAD can access Approval_309, Report1, Report2
//   7: [7, 8, 9, 10, 12, 13, 14, 16, 17,18,19,20,22,26,27], // CORP MRPC can access multiple screens
//   8: [14, 19,20,26,27], // BUSINESS HEAD can access Approval_309, Report1, Report2
//   9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,18,19,20,21,22,23,24,25,26,27],// CORP ADMIN (Full Access)
//   10:[22,26,27] // CORP MMD HEAD
// };
// Function to check if a role has access to a specific screen
export const canAccessScreen = (screenId) => {
  const encryptedData = sessionStorage.getItem("userData");
  if (!encryptedData) return false;

  const decryptedData = decryptSessionData(encryptedData);
  const userRoleId = decryptedData?.RoleId;


  // Check if the role has access to the screen
  return accessMap[userRoleId]?.includes(screenId) ?? false;
};
