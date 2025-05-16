// src/Authentication/AccessControl.js
import { decryptSessionData } from "../controller/StorageUtils";

// Simulating your database table (Access Control Mapping)
const accessMap = {
  1: [15, 16, 17], // REQUESTER can access Dashboard, Report1, Report2
  2: [14, 16, 17], // PLANT MMD HEAD can access Approval_309, Report1, Report2
  3: [14, 16, 17], // PLANT FINANCE HEAD can access Approval_309, Report1, Report2
  4: [14, 16, 17], // PLANT MRPC can access Approval_309, Report1, Report2
  5: [14, 16, 17], // PLANT HEAD can access Approval_309, Report1, Report2
  6: [14, 16, 17], // CORP FINANCE HEAD can access Approval_309, Report1, Report2
  7: [7, 8, 9, 10, 12, 13, 14, 16, 17], // CORP MRPC can access multiple screens
  8: [14, 16, 17], // BUSINESS HEAD can access Approval_309, Report1, Report2
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], // CORP ADMIN (Full Access)
};

// Function to check if a role has access to a specific screen
export const canAccessScreen = (screenId) => {
  const encryptedData = sessionStorage.getItem("userData");
  if (!encryptedData) return false;

  const decryptedData = decryptSessionData(encryptedData);
  const userRoleId = decryptedData?.RoleId;

  // Check if the role has access to the screen
  return accessMap[userRoleId]?.includes(screenId) ?? false;
};
