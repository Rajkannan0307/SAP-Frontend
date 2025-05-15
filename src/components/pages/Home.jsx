import React from "react";
import welcomeImage from "../images/Landing image.png";

const Home = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 80px)", // Adjust height without causing scroll
        marginTop: "70px", // Adjust to your top bar height
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#f0f0f0", // Optional background color for better visibility
      }}
    >
      <img
        src={welcomeImage}
        alt="Welcome"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain", // Shows the full image without cutting
        }}
      />
    </div>
  );
};

export default Home;
