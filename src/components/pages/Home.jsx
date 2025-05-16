import React from "react";
import welcomeImage from "../images/landing.png";

const Home = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 70px)", // Adjust height without causing scroll
        marginTop: "65px", // Adjust to your top bar height
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#FAF8F5", // Optional background color for better visibility
      }}
    >
      <img
        src={welcomeImage}
        alt="Welcome"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "cover", // Shows the full image without cutting
        }}
      />
    </div>
  );
};

export default Home;
