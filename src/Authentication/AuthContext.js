// src/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { decryptSessionData } from "../controller/StorageUtils"; // Make sure this is correctly imported

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load authentication status from sessionStorage
  useEffect(() => {
    const encryptedUserData = sessionStorage.getItem("userData");
    if (encryptedUserData) {
      try {
        const decryptedUserData = decryptSessionData(encryptedUserData);
        console.log("Decrypted User Data:", decryptedUserData);
        setIsAuthenticated(decryptedUserData?.login === true);
      } catch (error) {
        console.error("Failed to decrypt user data:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem("userData");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
