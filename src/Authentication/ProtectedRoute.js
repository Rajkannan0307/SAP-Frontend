// src/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  console.log("ProtectedRoute: isAuthenticated =", isAuthenticated);

  if (!isAuthenticated) {
    alert("Please login first");
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
