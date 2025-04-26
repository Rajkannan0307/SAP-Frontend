import React from "react";
import welcomeImage from "./images/welcome.jpg" 

const Home = () => {
  return (
    <div
      style={{
        flex: 1, 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100%", 
         overflow: "hidden", 
       
        
      }}
    >
      <img
        src={welcomeImage}
        alt="Welcome"
        style={{
          width: "100%", 
          height: "100%", 
          objectFit: "cover", 
          zIndex:-1,
        marginTop:'15%',
        marginBottom:'1.5%'
        }}
      />
    </div>
  );
};

export default Home;