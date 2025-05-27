import React from "react";
import { useNavigate } from "react-router-dom";
import { IoLibraryOutline } from "react-icons/io5";
import { AiOutlineStock } from "react-icons/ai";
import { TbBuildingSkyscraper } from "react-icons/tb";
import { GrManual } from "react-icons/gr";
import { MdProductionQuantityLimits } from "react-icons/md";
import { SiScrapbox } from "react-icons/si";
import { AiOutlinePartition } from "react-icons/ai";
import { FaCircleChevronRight } from "react-icons/fa6";
import { GrEmergency } from "react-icons/gr";
import { GiMaterialsScience } from "react-icons/gi";
import { FaDollarSign } from "react-icons/fa6";
import { FaLocationDot } from "react-icons/fa6";
import { FaFileInvoice } from "react-icons/fa";
import { IoIosContract } from "react-icons/io";
import { useOutletContext } from "react-router-dom";
const Dashboard = () => {
  const navigate = useNavigate();
  const { sidebarOpen } = useOutletContext();

  const handleClickPhy = () => {
        navigate("/home/phy"); // Navigate on button click
      };
      const handleClickStock = () => {
        navigate("/home/Stock201"); // Navigate on button click
      };
       const handleClickStock1 = () => {
        navigate("/home/Stock202"); // Navigate on button click
      };
      const handleClickScrapDisposal = () => {
        navigate("/home/scrap disposal"); // Navigate on button click
      };
      const handleClickmanual = () => {
        navigate("/home/Manual"); // Navigate on button click
      };
      const handleClickProduction = () => {
        navigate("/home/Production"); // Navigate on button click
      };
      const handleClickScrap551 = () => {
        navigate("/home/scrap551"); // Navigate on button click
      };
      const handleClickPart = () => {
        navigate("/home/Partno"); // Navigate on button click
      };
      const handleClickRGP = () => {
        navigate("/home/RGP"); // Navigate on button click
      };
      const handleClickEmg = () => {
        navigate("/home/Emergency"); // Navigate on button click
      };
      const handleClickMaterial = () => {
        navigate("/home/Material"); // Navigate on button click
      };
      const handleClickRs = () => {
        navigate("/home/Rs"); // Navigate on button click
      };
      const handleClickLocation = () => {
        navigate("/home/Location"); // Navigate on button click
      };
      const handleClickInward = () => {
        navigate("/home/Inward"); // Navigate on button click
      };
      const handleClickSub= () => {
        navigate("/home/SubContracting"); // Navigate on button click
      };
  return (
    <div style={{ padding: "20px", marginTop: "150px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "15px",
          marginLeft: sidebarOpen ? "0px" : "80px",
        transition: "margin-left 0.3s ease",
        }}>
        {/* Button 1 */}
        <div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    backgroundColor: "#F5EEE6", // Updated to a darker shade of green
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
   boxShadow: "0 8px 16px #2B7A78" 

  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#1CDDDA", // Maintained yellow for contrast
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickPart}
  >
    <IoLibraryOutline style={{ height: "80px", width: "180px" }} />
  </div>
  <div
    style={{
     width: "100%",
      height: "40%", backgroundColor: "#FFFFFF",
       
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9", // Ensuring contrast with text
      textAlign:"center"
    }}
  >
   Part No Conversion-309 Movement

  </div>
</div>
{/* Button 2 - Stock Posting */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6",
    boxShadow: "0 8px 16px #2B7A78"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      backgroundColor: "#FFDDD8",
    }}
    onClick={handleClickStock}
  >
    <AiOutlineStock style={{ height: "80px", width: "180px" }}/>
  </div>
  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    Stock Posting - 201 Movement
  </div>
</div>
{/* Button 2 - Stock Posting */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6",
    boxShadow: "0 8px 16px #2B7A78"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      backgroundColor: "rgb(219, 223, 190)",
    }}
    onClick={handleClickStock1}
  >
    <AiOutlineStock style={{ height: "80px", width: "180px" }}/>
  </div>
  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    Stock Posting - 202 Movement
  </div>
</div>
{/* Button 3 - Scrap Disposal */}
<div
    style={{
        width: "180px",
        height: "120px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        backgroundColor: "#F5EEE6",
    boxShadow: "0 8px 16px #2B7A78"
    }}
>
    <div
        style={{
            width: "100%",
            height: "70%",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            backgroundColor: "#B4C1C7",
        }}
        onClick={handleClickScrap551}
    >
        <TbBuildingSkyscraper style={{ height: "80px", width: "180px" }} />
    </div>
    <div
        style={{
            width: "100%",
            height: "40%",
            backgroundColor: "#FFFFFF",
            borderBottomLeftRadius: "12px",
            borderBottomRightRadius: "12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#2e59d9",
            textAlign: "center",
        }}
    >
        Scrap-551 Movement

    </div>
</div>
{/* BUTTON 4 */}
<div 
style={{
width: "180px",
 height: "120px",
 borderRadius: "12px",
 display: "flex",
flexDirection: "column",
 justifyContent: "center",
 alignItems: "center",
 cursor: "pointer",
 backgroundColor: "#F5EEE6",
    boxShadow: "0 8px 16px #2B7A78"
}} >
 <div
 style={{
 width: "100%", 
 height: "70%",
 backgroundColor: "#AEE0FF",  
 borderTopLeftRadius: "12px", 
borderTopRightRadius: "12px",

}}
 onClick={handleClickLocation}>
  <GrManual style={{ height: "80px", width: "180px" ,marginTop:"2px"}} />
 </div>
 <div
 style={{
width: "100%",
 height: "40%",
 backgroundColor: "#FFFFFF", 
 borderBottomLeftRadius: "12px", 
 borderBottomRightRadius: "12px",
 display: "flex",
  justifyContent: "center", 
  alignItems: "center",
  fontSize: "12px", 
  fontWeight: "bold", 
  color: "#2e59d9",
  textAlign:"center"
          }}>
Location Transfer-311 Movement

</div>
 </div>
 {/* BUTTON 5 */}
 <div 
style={{
width: "180px",
 height: "120px",
 borderRadius: "12px",
 
 display: "flex",
flexDirection: "column",
 justifyContent: "center",
 alignItems: "center",
 cursor: "pointer",
 backgroundColor: "#F5EEE6",
 boxShadow: "0 8px 16px #2B7A78"
}} >
 <div
 style={{
 width: "100%", 
 height: "70%",
 backgroundColor:"#DAC9E4" ,  
 borderTopLeftRadius: "12px", 
borderTopRightRadius: "12px",
}}
 onClick={handleClickPhy}>
  <MdProductionQuantityLimits style={{ height: "80px", width: "180px" ,marginTop:"5px" }} />
 </div>
 <div
 style={{
width: "100%",
 height: "40%",
 backgroundColor: "#FFFFFF", 
 borderBottomLeftRadius: "12px", 
 borderBottomRightRadius: "12px",
 display: "flex",
  justifyContent: "center", 
  alignItems: "center",
  fontSize: "12px", 
  fontWeight: "bold", 
  color: "#2e59d9",
  textAlign:"center"
          }}>
 Phy Inventory Adjustment

 </div>
</div>
{/* button 6 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Updated background color
    boxShadow: "0 8px 16px #2B7A78", // Added box shadow
    marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#B0F0A5",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickRGP}>
    <SiScrapbox style={{ height: "70px", width: "180px" ,marginTop:"6px" }} />

  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    RGP/NRGP

  </div>
</div>
{/* button 7 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Updated background color
    boxShadow: "0 8px 16px #2B7A78", // Added box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#A1B4FF",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickmanual}
  >
    <AiOutlinePartition style={{ height: "75px", width: "180px" , }} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    Manual Schedule-ME38

  </div>
</div>
{/* button 8 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Updated background color
    boxShadow: "0 8px 16px #2B7A78", // Added box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#c69885",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickInward}

  > <FaCircleChevronRight  style={{ height: "67px", width: "180px" , marginTop:"8px"}} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    Inward of Old Invoices

  </div>
</div>
{/* button 9 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Updated background color
    boxShadow: "0 8px 16px #2B7A78", // Added box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#FFA9DD",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickEmg}
  >
    <GrEmergency style={{ height: "75px", width: "180px" , }} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    Emergency Procurement
  </div>
</div>
{/* button 10 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Updated background color
    boxShadow: "0 8px 16px #2B7A78", // Added box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#FFDAC6",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickMaterial}
  > <GiMaterialsScience style={{ height: "70px", width: "180px" , }} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    Material Status Change
  </div>
</div>
{/* button 11 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Updated background color
    boxShadow: "0 8px 16px #2B7A78", // Added box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#E9BFC1",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickRs}
  >
    <FaDollarSign style={{ height: "60px", width: "180px" ,marginTop:"6px" }} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      
    }}
  >
    Rs 1 Conversion
  </div>
</div>
{/* button 12 */}

<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    backgroundColor: "#F5EEE6", // Updated background color
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 8px 16px #2B7A78", // Updated box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#FB9F9E",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickScrapDisposal}
  ><FaLocationDot  style={{ height: "60px", width: "180px" ,marginTop:"6px" }} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
     Scrap  Disposal  -  Price Approval

  </div>
</div>
{/* button 13 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    backgroundColor: "#F5EEE6", // Updated background color
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 8px 16px #2B7A78", // Updated box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#7CCCAA",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickProduction}
  >
    <FaFileInvoice style={{ height: "60px", width: "180px" ,marginTop:"8px" }} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign:"center"
    }}
  >
    Production Order Aging Control Change

  </div>
</div>
{/* button 14 */}
<div
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    backgroundColor: "#F5EEE6", // Updated background color
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 8px 16px #2B7A78", // Updated box shadow
     marginTop:"10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#B16F94",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
    }}
    onClick={handleClickSub}
  >
    <IoIosContract style={{ height: "70px", width: "180px" , }} />
  </div>

  <div
    style={{
      width: "100%",
      height: "40%",
      backgroundColor: "#FFFFFF",
      borderBottomLeftRadius: "12px",
      borderBottomRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#2e59d9",
      textAlign: "center",
    }}
  >
    Subcontracting Stock Value / Aging Change
  </div>
</div>


</div>
</div>
  );
};


export default Dashboard;
