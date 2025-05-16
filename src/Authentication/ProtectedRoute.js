// src/Authentication/ProtectedRoute.js
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { CircularProgress, Box, Snackbar, Alert } from "@mui/material";
import { canAccessScreen } from "./AccessControl"; // Import the access control function

const ProtectedRoute = ({ children, screenId }) => {
  const { user, loading } = useContext(AuthContext);
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setShowAlert(true);
        setTimeout(() => {
          navigate("/");
        }, 2000); // Redirect after 2 seconds if not authenticated
      } else if (screenId && !canAccessScreen(screenId)) {
        setShowAlert(true);
        setTimeout(() => {
          navigate("/home/Home"); // Redirect to home if user has no access
        }, 2000);
      }
    }
  }, [loading, user, navigate, screenId]);

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user || (screenId && !canAccessScreen(screenId))) {
    return (
      <>
        <Snackbar
          open={showAlert}
          autoHideDuration={2000}
          onClose={() => setShowAlert(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error">
            {user ? "Access Denied." : "Please login."}
          </Alert>
        </Snackbar>
      </>
    );
  }

  return children;
};

export default ProtectedRoute;
