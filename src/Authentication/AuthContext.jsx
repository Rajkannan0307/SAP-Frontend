// src/Authentication/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { decryptSessionData } from "../controller/StorageUtils";

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const encryptedData = sessionStorage.getItem("userData");
    if (encryptedData) {
      const decryptedUser = decryptSessionData(encryptedData);
      setUser(decryptedUser);
    }
    setLoading(false); // Set loading to false after checking
  }, []);

  const logout = () => {
    sessionStorage.removeItem("userData");
    localStorage.removeItem("userData");
    setUser(null);
  };



  const isPlantMED = Number(localStorage.getItem('RoleID') || 0) === 2

  const PMPDAccessType = (roleId) => {
    switch (key) {
      case value:

        break;

      default:
        break;
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading, isPlantMED }}>
      {children}
    </AuthContext.Provider>
  );
};
