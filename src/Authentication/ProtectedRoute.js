// src/Authentication/ProtectedRoute.js
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { CircularProgress, Box, Snackbar, Alert } from "@mui/material";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      setShowAlert(true);
      setTimeout(() => {
        navigate("/");
      }, 2000); // Redirect after 2 seconds
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <>
        <Snackbar
          open={showAlert}
          autoHideDuration={2000}
          onClose={() => setShowAlert(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error">Please login .</Alert>
        </Snackbar>
      </>
    );
  }

  return children;
};

export default ProtectedRoute;
