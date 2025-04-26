// // Main.js
// import React from "react";
// import { Outlet } from "react-router-dom";
// import Topbar from "./components/Topbar";
// import Sidebar from "./components/Sidebars";

// const Main = () => {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
//       {/* Topbar */}
//       <Topbar />

//       {/* Main Content with Sidebar */}
//       <div style={{ display: "flex", flex: 1 }}>
//         <Sidebar />
//         <div
//           style={{
//             flex: 1,
//             marginLeft: "250px", // Sidebar width when open
//             transition: "margin-left 0.3s ease",
            
//              overflowY: "auto",
//           }}
//         >
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Main;


// Main.js
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebars";

const Main = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Topbar */}
      <Topbar />

      {/* Main Content with Sidebar */}
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar setSidebarOpen={setSidebarOpen} />
        <div
          style={{
            flex: 1,
            marginLeft: sidebarOpen ? "250px" : "60px",
            transition: "margin-left 0.3s ease",
            overflowY: "auto",
          }}
        >
          <Outlet context={{ sidebarOpen }} />
        </div>
      </div>
    </div>
  );
};

export default Main;
