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
        navigate("/home/MaterialStatus"); // Navigate on button click
      };
      const handleClickRs = () => {
        navigate("/home/ConversionRs1"); // Navigate on button click
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
  onClick={handleClickPart}
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    backgroundColor: "#F5EEE6",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 8px 16px #2B7A78",
    overflow: "hidden",
    userSelect: "none",
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#1CDDDA",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <IoLibraryOutline style={{ height: "80px", width: "180px" }} />
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
      padding: "4px",
    }}
  >
    Part No Conversion - 309 Movement
  </div>
</div>


{/* Button 2 - Stock Posting */}
<div
  onClick={handleClickStock}
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
    boxShadow: "0 8px 16px #2B7A78",
    overflow: "hidden", // Prevents visual flicker
    userSelect: "none", // Prevents accidental text selection
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      backgroundColor: "#FFDDD8",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <AiOutlineStock style={{ height: "80px", width: "180px" }} />
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
      padding: "4px",
    }}
  >
    Stock Posting - 201 Movement
  </div>
</div>


{/* Button 3 - Stock Posting */}
<div
  onClick={handleClickStock1}
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
    boxShadow: "0 8px 16px #2B7A78",
    overflow: "hidden",
    userSelect: "none",
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "rgb(219, 223, 190)",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <AiOutlineStock style={{ height: "80px", width: "180px" }} />
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
      padding: "4px",
    }}
  >
    Stock Posting - 202 Movement
  </div>
</div>


{/* Button 3 - Scrap Disposal */}
<div
  onClick={handleClickScrap551}
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
    boxShadow: "0 8px 16px #2B7A78",
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#B4C1C7",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
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
      padding: "4px",
    }}
  >
    Scrap - 551 Movement
  </div>
</div>



{/* BUTTON 4 - Fully Clickable with Bottom Visually Different */}
<div 
  onClick={handleClickLocation}
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
      backgroundColor: "#AEE0FF",  
      borderTopLeftRadius: "12px", 
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <GrManual style={{ height: "80px", width: "180px", marginTop: "2px" }} />
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
      textAlign: "center"
    }}
  >
    Location Transfer - 311 Movement
  </div>
</div>


 {/* BUTTON 5 */}
 <div 
  onClick={handleClickPhy} // ✅ Entire card is clickable
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
    boxShadow: "0 8px 16px #2B7A78",
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#DAC9E4",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <MdProductionQuantityLimits style={{ height: "80px", width: "180px", marginTop: "5px" }} />
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
    Phy Inventory Adjustment
  </div>
</div>

{/* button 6 */}
<div
  onClick={handleClickRGP} // ✅ Entire card is clickable
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Background color
    boxShadow: "0 8px 16px #2B7A78", // Box shadow
    marginTop: "10px",
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#B0F0A5",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <SiScrapbox style={{ height: "70px", width: "180px", marginTop: "6px" }} />
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
  onClick={handleClickmanual} // ✅ Entire card is clickable
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
    marginTop: "10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#A1B4FF",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <AiOutlinePartition style={{ height: "75px", width: "180px" }} />
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
      textAlign: "center"
    }}
  >
    Manual Schedule - ME38
  </div>
</div>

{/* button 8 */}
<div
  onClick={handleClickInward} // ✅ Entire card is clickable
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Card background
    boxShadow: "0 8px 16px #2B7A78", // Shadow
    marginTop: "10px",
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#c69885",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <FaCircleChevronRight style={{ height: "67px", width: "180px", marginTop: "8px" }} />
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
  onClick={handleClickEmg} // ✅ Entire card is now clickable
  style={{
    width: "180px",
    height: "120px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: "#F5EEE6", // Card background
    boxShadow: "0 8px 16px #2B7A78", // Shadow
    marginTop: "10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#FFA9DD",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <GrEmergency style={{ height: "75px", width: "180px" }} />
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
      textAlign: "center"
    }}
  >
    Emergency Procurement
  </div>
</div>

{/* button 10 */}
<div
  onClick={handleClickMaterial} // ✅ Entire card is now clickable
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
    boxShadow: "0 8px 16px #2B7A78",
    marginTop: "10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#FFDAC6",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <GiMaterialsScience style={{ height: "70px", width: "180px" }} />
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
      textAlign: "center"
    }}
  >
    Material Status Change
  </div>
</div>

{/* button 11 */}
<div
  onClick={handleClickRs} // ✅ Entire card is now clickable
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
    marginTop: "10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#E9BFC1",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <FaDollarSign style={{ height: "60px", width: "180px", marginTop: "6px" }} />
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
      color: "#2e59d9"
    }}
  >
    Rs 1 Conversion
  </div>
</div>

{/* button 12 */}

<div
  onClick={handleClickScrapDisposal} // ✅ Entire card is now clickable
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
    marginTop: "10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#FB9F9E",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <FaLocationDot style={{ height: "60px", width: "180px", marginTop: "6px" }} />
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
      textAlign: "center"
    }}
  >
    Scrap Disposal - Price Approval
  </div>
</div>

{/* button 13 */}
<div
  onClick={handleClickProduction} // ✅ Entire card is now clickable
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
    marginTop: "10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#7CCCAA",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <FaFileInvoice style={{ height: "60px", width: "180px", marginTop: "8px" }} />
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
      textAlign: "center"
    }}
  >
    Production Order Aging Control Change
  </div>
</div>

{/* button 14 */}
<div
  onClick={handleClickSub} // ✅ Now the entire card is clickable
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
    marginTop: "10px"
  }}
>
  <div
    style={{
      width: "100%",
      height: "70%",
      backgroundColor: "#B16F94",
      borderTopLeftRadius: "12px",
      borderTopRightRadius: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}
  >
    <IoIosContract style={{ height: "70px", width: "180px" }} />
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
      textAlign: "center"
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
