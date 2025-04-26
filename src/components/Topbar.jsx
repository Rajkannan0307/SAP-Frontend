import { Link } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import HomeIcon from "@mui/icons-material/Home";
import { FaSignOutAlt } from "react-icons/fa";
import { Button } from "@mui/material";
import logo from './images/ranelogo.png';


const Topbar = () => {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#2e59d9",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            gap: "10px",
          }}
        >
          <img
  src={logo}
  alt="Rane Logo"
  style={{
    height: "43px",
    marginLeft: "0px",
    background: "white",
    border: "2px solid white", // White border
    borderRadius: "6px", // Rounded corners
  }}
     />

          
          <h1 style={{ fontSize: "30px", color: "white" }}>SAP APPROVAL WORK FLOW</h1>
        </div>

        <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px", // Increased gap for better spacing
    marginLeft: 0,
  }}
>
  {/* Account Icon Button */}
  <Button style={{ padding: 0, minWidth: "40px" }}>
    <AccountCircleIcon
      style={{
        textDecoration: "none",
        color: "white",
        marginRight: "-8px",
      }}
    />
  </Button>

  {/* Home Icon */}
  <Link
    to="/home/Home"
    style={{
      textDecoration: "none",
      color: "white",
      display: "flex",
      alignItems: "center",
    }}
  >
    <HomeIcon />
  </Link>

  {/* Sign Out Icon */}
  <Link
    to="/"
    style={{
      color: "white",
      display: "flex",
      alignItems: "center",
    }}
  >
    <FaSignOutAlt
      style={{
        padding: "5px",
        marginRight: "10px",
        fontSize:"22px"
      }}
    />
  </Link>
</div>

      </div>
    </div>
  );
};

export default Topbar;
