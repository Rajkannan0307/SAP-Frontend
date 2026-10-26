import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Avatar, Box, ButtonBase, Divider, IconButton, Popover, Tooltip, Typography } from "@mui/material";
import logo from './images/ranelogo.png';
import { AuthContext } from "../Authentication/AuthContext";
import { decryptSessionData } from "../controller/StorageUtils";

// Top bar: brand on the left; on the right the user (opens the profile card), Home and Sign out.
const Topbar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const GenId = localStorage.getItem('EmpId');
  const Username = localStorage.getItem('UserName');
  const Dept = localStorage.getItem('Deptname');
  const Plant = localStorage.getItem('PlantName');
  const Email = localStorage.getItem('Email');
  const Plantcode = localStorage.getItem('Plantcode');

  const [Role, setRole] = useState('');
  const [RoleID, setRoleID] = useState('');
  const [UserLevel, setUserLevel] = useState('');
  const [anchorEl, setAnchorEl] = useState(null); // anchor for Popover

  const handleLogout = () => {
    logout(); // Use AuthContext's logout method
    navigate('/');
  };

  useEffect(() => {
    const encryptedUserData = sessionStorage.getItem('userData');
    if (encryptedUserData) {
      const decryptedUserData = decryptSessionData(encryptedUserData);
      setRoleID(decryptedUserData.RoleId);
      setRole(decryptedUserData.Role);
      setUserLevel(decryptedUserData.UserLevelName);
    }
  }, []);

  const handlePopoverOpen = (event) => setAnchorEl(event.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const goHome = () => {
    const roleId = parseInt(RoleID); // Convert Role to number
    if (roleId === 1 || roleId === 9) {
      navigate("/home/Home");
    } else if ([2, 3, 4, 5, 6, 7, 8].includes(roleId)) {
      navigate("/home/HomePage");
    }
  };

  const initials = String(Username || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

  const details = [
    ["Plant", [Plantcode, Plant].filter(Boolean).join(" / ")],
    ["Gen ID", GenId],
    ["Role", Role],
    ["User Level", UserLevel],
    ["Department", Dept],
    ["Email", Email],
  ];

  const HearTitle = localStorage.getItem("Deptname") === 'R&D - TestLab' ? "R&D - TestLab" : "Manufacturing Workspace"

  const iconBtnSx = {
    color: "#e8eeff",
    width: 36,
    height: 36,
    transition: "background-color .2s",
    "&:hover": { bgcolor: "rgba(255,255,255,0.14)" },
  };

  return (
    <Box
      component="header"
      sx={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        pr: { xs: 1, sm: 2 },
        background: "linear-gradient(90deg, #1e40af 0%, #2e59d9 55%, #3b6ae6 100%)",
        boxShadow: "0 1px 3px rgba(16,24,40,0.18)",
      }}
    >
      {/* Brand */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, pl: 1 }}>
        <Box
          component="img"
          src={logo}
          alt="Rane Logo"
          sx={{ height: 38, bgcolor: "#fff", border: "2px solid #fff", borderRadius: "6px", flexShrink: 0 }}
        />
        <Typography
          component="h1"
          noWrap
          sx={{ m: 0, color: "#fff", fontSize: { xs: 16, sm: 20 }, fontWeight: 600, letterSpacing: 0.2, lineHeight: 1.2 }}
        >
          {HearTitle}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.25, sm: 0.75 }, flexShrink: 0 }}>
        <Tooltip title="My profile">
          <ButtonBase
            onClick={handlePopoverOpen}
            aria-describedby={id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pl: 0.5,
              pr: { xs: 0.5, md: 1 },
              py: 0.5,
              borderRadius: "999px",
              color: "#fff",
              transition: "background-color .2s",
              "&:hover": { bgcolor: "rgba(255,255,255,0.14)" },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#fff", color: "#1e40af", fontSize: 13, fontWeight: 700 }}>{initials}</Avatar>
            <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left", lineHeight: 1.15 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#fff", maxWidth: 160 }} noWrap>{Username}</Typography>
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.75)", maxWidth: 160 }} noWrap>{Role}</Typography>
            </Box>
            <KeyboardArrowDownIcon sx={{ display: { xs: "none", md: "block" }, fontSize: 18, color: "rgba(255,255,255,0.8)" }} />
          </ButtonBase>
        </Tooltip>

        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          style={{ zIndex: 10000 }}
          slotProps={{ paper: { sx: { mt: 1, width: 300, borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(16,24,40,0.14)" } } }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2 }}>
            <Avatar sx={{ width: 44, height: 44, bgcolor: "#2e59d9", fontWeight: 700 }}>{initials}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1f2937" }} noWrap>{Username}</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>{Role}</Typography>
            </Box>
          </Box>
          <Divider />
          <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "92px 1fr", rowGap: 1, columnGap: 1 }}>
            {details.map(([label, value]) => (
              <React.Fragment key={label}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{label}</Typography>
                <Typography sx={{ fontSize: 12.5, color: "#1f2937", wordBreak: "break-word" }}>{value || "-"}</Typography>
              </React.Fragment>
            ))}
          </Box>
        </Popover>

        <Tooltip title="Home">
          <IconButton onClick={goHome} sx={iconBtnSx} aria-label="Home">
            <HomeIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Sign out">
          <IconButton onClick={handleLogout} sx={{ ...iconBtnSx, color: "#ffc9c9", "&:hover": { bgcolor: "rgba(255,255,255,0.14)", color: "#fff" } }} aria-label="Sign out">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Topbar;
