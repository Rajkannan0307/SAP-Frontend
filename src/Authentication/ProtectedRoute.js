// src/ProtectedRoute.js
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      alert("Please login first");
    }
  }, [isAuthenticated]);

  return isAuthenticated ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
