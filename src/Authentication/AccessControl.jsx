// src/Authentication/AccessControl.js
import { decryptSessionData } from "../controller/StorageUtils";

// Function to check if the logged-in user has access to a specific screen,
// using the Screen_Codes permission list returned by the login API
// (the same data Sidebars.jsx uses to show/hide menu items).
export const canAccessScreen = (screenCode) => {
  const encryptedData = sessionStorage.getItem("userData");
  if (!encryptedData) return false;

  const decryptedData = decryptSessionData(encryptedData);
  const permissions = decryptedData?.Permissions;

  const permissionArray = Array.isArray(permissions)
    ? permissions
    : typeof permissions === "string"
      ? permissions.split(",").map((p) => p?.trim())
      : [];

  return permissionArray.includes(screenCode);
};
