// src/ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ProtectedRoute Loaded - Authenticated:", isAuthenticated);
    if (!isAuthenticated) {
      setShowAlert(true);

      // Delay the redirect to allow Snackbar to show
      setTimeout(() => {
        navigate("/");
      }, 1500); // 1.5 seconds delay
    }
  }, [isAuthenticated, navigate]);

  const handleClose = () => {
    setShowAlert(false);
  };

  return (
    <>
      {isAuthenticated ? (
        children
      ) : (
        <Snackbar
          open={showAlert}
          autoHideDuration={2500} // Same as the delay
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleClose} severity="warning" sx={{ width: "100%" }}>
            Please login first
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default ProtectedRoute;
