import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { PiNuclearPlantFill } from "react-icons/pi";
import { GrCubes } from "react-icons/gr";
import { MdCalendarMonth } from "react-icons/md";
import BusinessIcon from "@mui/icons-material/Business";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaTableList } from "react-icons/fa6";
import { FcApproval } from "react-icons/fc";
import { MdOutlineApproval } from "react-icons/md";
import { FcFactory } from "react-icons/fc";
import { GrStorage } from "react-icons/gr";
import { GiPlantsAndAnimals } from "react-icons/gi";
import Diversity2Icon from '@mui/icons-material/Diversity2';
import AcUnitIcon from '@mui/icons-material/AcUnit'; // ✅ Correct
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { FaDollarSign } from "react-icons/fa6";
import { RiCustomerService2Fill } from "react-icons/ri";
import { MdBusinessCenter } from "react-icons/md";
import usePermissions from "../controller/usePermission";
import { decryptSessionData } from "../controller/StorageUtils";
import { FaExchangeAlt } from "react-icons/fa";

import { TbReportSearch } from "react-icons/tb";
import { SiSap } from "react-icons/si";
import { GiAmericanShield } from "react-icons/gi";
import { BsFillSignpostFill } from "react-icons/bs";
import { MdAddTask } from "react-icons/md";
import { SiScrapbox } from "react-icons/si";
import { FaExternalLinkSquareAlt } from "react-icons/fa";
import { TbReport } from "react-icons/tb";
import { MdSupervisedUserCircle } from "react-icons/md";
import { GiRingMould } from "react-icons/gi";
import { CiLineHeight } from "react-icons/ci";
import { SiMaterialformkdocs } from "react-icons/si";
import { GiExplosiveMaterials } from "react-icons/gi";
import { SiGoogleappsscript } from "react-icons/si";
import EmergencyIcon from '@mui/icons-material/Emergency';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { MdStorage } from "react-icons/md";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";
import ProductionQuantityLimitsIcon from '@mui/icons-material/ProductionQuantityLimits';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

import FactoryIcon from "@mui/icons-material/Factory";
import GroupsIcon from "@mui/icons-material/Groups";
import AssessmentIcon from "@mui/icons-material/Assessment";



// Testing

import EngineeringIcon from "@mui/icons-material/Engineering";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import ConstructionIcon from "@mui/icons-material/Construction";
import { GiFactory } from "react-icons/gi";
import { FaCogs } from "react-icons/fa";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';


const Sidebar = ({ setSidebarOpen }) => {
  const [open, setOpen] = useState(false);
  const [Masters, setMasterOpen] = useState(false);
  const [Approval, setApprovalOpen] = useState(false);
  const [Dashboard, setDashboardOpen] = useState(false);
  const [Report, setReportOpen] = useState(false);
  const [SAP, setSapOpen] = useState(false);
  const [testLabOpen, setTestLabOpen] = useState(false);
  const [PMPD_Open, setPMPD_Open] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [Role, setRole] = useState('');
  const navigate = useNavigate();
  // Pass sidebar open state to parent
  useEffect(() => {
    setSidebarOpen(open);
  }, [open, setSidebarOpen]);

  const toggleSidebar = () => {
    setOpen(!open);
    if (open) closeAllDropdowns();
  };

  const Permissions = usePermissions();



  // useEffect(() => {
  //   const encryptedData = sessionStorage.getItem('userData');
  //   if (encryptedData) {
  //     const decryptedData = decryptSessionData(encryptedData);

  //     setEmployeeName(decryptedData.UserName);



  //   }
  // }, []);
  // useEffect(() => {
  //   const encryptedData = sessionStorage.getItem('userData');
  //       if (encryptedData) {
  //         const decryptedData = decryptSessionData(encryptedData);

  //         setRole(decryptedData.Role);

  //       }
  //       }, []);





  useEffect(() => {
    const encrypted = sessionStorage.getItem("userData");
    if (encrypted) {
      const decrypted = decryptSessionData(encrypted);
      console.log("Decrypted User:", decrypted);

      if (decrypted?.RoleId) {
        setRole(decrypted.RoleId);
      } else {
        console.warn("RoleId is missing from decrypted user data");
      }
    } else {
      console.warn("No EncryptedUserData in sessionStorage");
    }
  }, []);


  const toggleMasters = () => {
    setMasterOpen(!Masters);
    setSapOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
    setApprovalOpen(false);
    setTestLabOpen(false)
    setPMPD_Open(false)
  };

  const toggleSAP = () => {
    setSapOpen(!SAP);
    setMasterOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
    setApprovalOpen(false);
    setTestLabOpen(false);
    setPMPD_Open(false)
  };

  const toggleApproval = () => {
    setApprovalOpen(!Approval);
    setMasterOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
    setSapOpen(false);
    setTestLabOpen(false)
    setPMPD_Open(false)
  };

  const toggleReport = () => {
    setReportOpen(!Report);
    setMasterOpen(false);
    setDashboardOpen(false);
    setApprovalOpen(false);
    setSapOpen(false);
    setTestLabOpen(false)
    setPMPD_Open(false)
  };

  const toggleTestLab = () => {
    setTestLabOpen(!testLabOpen);
    setMasterOpen(false);
    setDashboardOpen(false);
    setApprovalOpen(false);
    setSapOpen(false);
    setPMPD_Open(false)
  };

  const toggleDashboard = () => {
    setDashboardOpen(!Dashboard);
    setMasterOpen(false);
    setApprovalOpen(false);
    setReportOpen(false);
    setSapOpen(false);
    setPMPD_Open(false)
  };


  const togglePMPD = () => {
    setPMPD_Open(!PMPD_Open)
    setTestLabOpen(false);
    setMasterOpen(false);
    setDashboardOpen(false);
    setApprovalOpen(false);
    setSapOpen(false);
  }

  const closeAllDropdowns = () => {
    setMasterOpen(false);
    setApprovalOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
    setPMPD_Open(false)
  };



  return (
    <div
      style={{
        width: open ? "250px" : "60px",
        backgroundColor: "#595959",
        transition: "width 0.3s ease",
        // minHeight: "100%",
        height: "100vh",
        position: "fixed",
        top: "60px",
        left: 0,
        overflowY: "auto",        // ✅ only scrolls when needed
        overflowX: "hidden",      // ✅ prevent horizontal scroll
        // paddingTop: "10px",
        paddingBottom: "3rem"
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: "10px",
          display: "flex",
          justifyContent: open ? "space-between" : "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        {open && (
          <h3
            style={{ margin: 0, color: "white", cursor: "pointer" }}
            onClick={() => {
              const roleId = parseInt(Role); // ✅ Convert Role to number
              if (roleId === 1 || roleId === 9) {
                navigate("/home/Home");
              } else if ([2, 3, 4, 5, 6, 7, 8].includes(roleId)) {
                navigate("/home/HomePage");
              }
            }}
          >
            HOME
          </h3>
        )}


        <button
          onClick={toggleSidebar}
          style={{
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: "white",
            background: "transparent",
          }}
        >
          <MenuIcon />
        </button>
      </div>

      {/* Sidebar Menu Items */}
      <div style={{ padding: "10px" }}>
        {/* Dashboard Section */}

        {/* {Permissions.includes('dashboard') && (
          <button

            onClick={() => {
              closeAllDropdowns(); // Close other sections
              navigate("/home/dashboard");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "18px",
              margin: "10px 0", // Space above and below
              marginBottom: "16px"
            }}>
            <FaExchangeAlt style={{ color: "turquoise", fontSize: "19px" }} />
            {open && "Transaction"}
          </button>
        )} */}


        {/* <div style={{ padding: "10px" }}> */}
        {/* //Transaction (Direct Link)
  <SidebarSection
    open={open}
    isOpen={false} // No dropdown
    toggleSection={() => navigate("/home/dashboard")} // Directly navigates
    Permissions={Permissions}
    icon={<MdDashboard style={{ color: "#FFF5EE" }} />}
    label="Transaction"
    links={[{ name: "Transaction", path: "/home/dashboard", code: 'dashboard' }]} // Direct link
    codeList={['dashboard']}
  />
</div> */}

        {/* Masters Section */}
        <SidebarSection
          open={open}
          isOpen={Masters}
          toggleSection={toggleMasters}
          icon={<PiNuclearPlantFill style={{ color: "lightcoral" }} />}
          Permissions={Permissions}
          label="Masters"
          links={[
            { name: "Company", path: "/home/company", icon: <BusinessIcon style={{ marginRight: "2px", color: "yellow", }} />, code: 'company', },
            { name: "Business Division", path: "/home/BusinessDivision", icon: <MdBusinessCenter style={{ marginRight: "2px", fontSize: "22px", color: "ButtonFace", }} />, code: 'BusinessDivision' },
            { name: "Plant", path: "/home/Plant", icon: <GiPlantsAndAnimals style={{ marginRight: "2px", fontSize: "22px", color: "hotpink" }} />, code: 'Plant' },
            { name: "Department", path: "/home/Department", icon: <Diversity2Icon style={{ marginRight: "2px", fontSize: "22px", color: "bisque" }} />, code: 'Department' },
            { name: "Login User", path: "/home/UserMaster", icon: < AccountCircleIcon style={{ marginRight: "2px", color: "aqua" }} />, code: 'UserMaster' },
            { name: "Role", path: "/home/Role", icon: < MdOutlineAdminPanelSettings style={{ marginRight: "2px", width: "25px", fontSize: "24px", color: "goldenrod", }} />, code: 'Role' },
            { name: "Material", path: "/home/Material", icon: <AcUnitIcon style={{ marginRight: "2px", color: "greenyellow", code: 'Material' }} />, code: 'Material' },
            { name: "Vendor", path: "/home/Vendor", icon: <FcFactory style={{ marginRight: "2px", fontSize: "24px", width: "25px", code: 'Vendor' }} />, code: 'Vendor' },
            { name: "Customer", path: "/home/Customer", icon: <RiCustomerService2Fill style={{ marginRight: "2px", fontSize: "20px", width: "25px", color: "deepskyblue" }} />, code: 'Customer' },
            { name: "Storage Location", path: "/home/StorageLocation", icon: <GrStorage style={{ marginRight: "2px", fontSize: "20px", width: "25px", color: "gold" }} />, code: 'StorageLocation' },
            { name: "Movement Type", path: "/home/Movement_Type", icon: <DriveFileMoveIcon style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "turquoise" }} />, code: 'Movement_Type' },
            { name: "MVT List Item", path: "/home/MVT_LIST_ITEM", icon: <FaTableList style={{ marginRight: "2px", fontSize: "20px", width: "25px", color: "thistle" }} />, code: 'MVT_LIST_ITEM' },
            { name: "Cost Center", path: "/home/CostCenter", icon: <FaDollarSign style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "darkorange" }} />, code: 'CostCenter' },
            { name: "ValuationType", path: "/home/ValuationType", icon: <GrCubes style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "rosybrown" }} />, code: 'ValuationType' },
            { name: "SupvCode", path: "/home/SupvCode", icon: <MdSupervisedUserCircle style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "aquamarine" }} />, code: 'SupvCode' },
            { name: "Module", path: "/home/Module", icon: <GiRingMould style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "khaki" }} />, code: 'Module' },
            { name: "Line", path: "/home/Line", icon: <PrecisionManufacturingIcon style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "darkseagreen" }} />, code: 'Line' },
            { name: "Rig Test Spec", path: "/home/RigTestSpec", icon: <PrecisionManufacturingIcon style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "darkseagreen" }} />, code: 'RigTestSpec' },
            { name: "Machine", path: "/home/Machine", icon: <PrecisionManufacturingIcon style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "darkseagreen" }} />, code: 'Machine' },

            // New Screens
            { name: "Product", path: "/home/Product", icon: <FaCogs style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "bisque" }} />, code: 'Product' },
            { name: "Product Segment", path: "/home/ProductSegmentScreen", icon: <FaCogs style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "bisque" }} />, code: 'ProductSegment' },
            { name: "Product Mapping", path: "/home/ProductMappingScreen", icon: <FaCogs style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "bisque" }} />, code: 'ProductMapping' },
            { name: "Category Breakup", path: "/home/CategoryBreakup", icon: <FaCogs style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "bisque" }} />, code: 'CategoryBreakups' },
            { name: "Indirect Category", path: "/home/IndirectCategory", icon: <FaCogs style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "bisque" }} />, code: 'IndirectCategory' },
            { name: "Fixed Manpower", path: "/home/PMPD_FixedManpower", icon: <FaCogs style={{ marginRight: "2px", fontSize: "22px", width: "25px", color: "bisque" }} />, code: 'PMPD_FixedManpower' },
          ]}
          codeList={[
            'company', 'BusinessDivision', 'Plant', 'Department',
            'UserMaster', 'Role', 'Material', 'Vendor',
            'Customer', 'StorageLocation', 'Movement_Type', 'MVT_LIST_ITEM', 'CostCenter',
            'ValuationType', 'SupvCode', 'Module', 'Line', 'Machine', 'RigTestSpec', 'Product', 'ProductSegment', 'ProductMapping',
            'CategoryBreakups', 'IndirectCategory', 'PMPD_FixedManpower'
          ]}
        />
        {/* Transaction Section */}
        {Permissions.includes('dashboard') && (
          <button
            onClick={() => {
              closeAllDropdowns(); // Close other sections
              navigate("/home/dashboard");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "17px",
              margin: "10px 0",
              marginBottom: "10px"
            }}>
            <FaExchangeAlt style={{ color: "turquoise", fontSize: "19px" }} />
            {open && "Transaction"}
          </button>
        )}

        {/* Approval Section */}
        <SidebarSection
          open={open}
          isOpen={Approval}
          toggleSection={toggleApproval}
          icon={<FcApproval style={{ fontSize: "24px" }} />}
          Permissions={Permissions}
          label="Approval"
          links={[
            { name: "309 Approval", path: "/home/Approval_309", icon: <MdOutlineApproval style={{ fontSize: "28px", marginRight: "3px", color: "rgb(52, 188, 252)" }} />, code: 'Approval_309' },
            { name: "201 Approval", path: "/home/Approval_201", icon: <GiAmericanShield style={{ fontSize: "28px", marginRight: "3px", color: "rgb(231, 89, 177)" }} />, code: 'Approval_201' },
            { name: "202 Approval", path: "/home/Approval_202", icon: <BsFillSignpostFill style={{ fontSize: "30px", marginRight: "3px", color: "rgb(186, 241, 113)" }} />, code: 'Approval_202' },
            { name: "551 Approval", path: "/home/Approval_551", icon: <MdAddTask style={{ fontSize: "30px", marginRight: "3px", color: "rgb(235, 62, 62)" }} />, code: 'Approval_551' },
            { name: "311 Approval", path: "/home/Approval_311", icon: <SiScrapbox style={{ fontSize: "30px", marginRight: "3px", color: "rgb(171, 136, 228)" }} />, code: 'Approval_551' },
            { name: "Inward of Old Invoice Approval", path: "/home/InwardApproval", icon: <FaExternalLinkSquareAlt style={{ fontSize: "25px", marginRight: "3px", color: "rgb(240, 186, 117)" }} />, code: 'InwardApproval' },
            { name: "Emergency Procurement Approval", path: "/home/EmergencyApproval", icon: <EmergencyIcon style={{ fontSize: "29px", marginRight: "1px", color: "rgb(230, 123, 123)" }} />, code: 'EmergencyApproval' },
            { name: "ConversionRs1", path: "/home/Approval_Rs1", icon: <RiMoneyRupeeCircleFill style={{ fontSize: "30px", marginRight: "3px", color: "rgb(15, 196, 209)" }} />, code: 'ApprovalRs1' },

          ]}
          codeList={[
            'Approval_309', 'Approval_201', 'Approval_202', 'Approval_551', 'Approval_311', 'InwardApproval', 'EmergencyApproval', 'ApprovalRs1'
          ]}
        />


        {Permissions.includes('Store') && (
          <button

            onClick={() => {
              closeAllDropdowns(); // Close other sections
              navigate("/home/StoreDashboard");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "17px",
              margin: "10px 0", // Space above and below
              marginBottom: "16px"
            }}>
            <StorefrontIcon style={{ color: "hotpink", fontSize: "24px" }} />
            {open && "Store Dashboard"}
          </button>
        )}

        {/* {Permissions.includes('Production') && (
          <button

            onClick={() => {
              closeAllDropdowns(); // Close other sections
              navigate("/home/ProductionPlan");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "17px",
              margin: "10px 0", // Space above and below
              marginBottom: "16px"
            }}>
            <ProductionQuantityLimitsIcon style={{ color: "lemonchiffon", fontSize: "24px" }} />
            {open && "Production Plan"}
          </button>
        )} */}

        {/* Approved Report  Section */}
        {Permissions.includes('ApprovedReports') && (
          <button
            onClick={() => {
              closeAllDropdowns(); // Close other sections
              navigate("/home/ApprovalReports");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "17px",
              margin: "10px 0",
              marginBottom: "10px"
            }}>
            <TbReportSearch style={{ color: "turquoise", fontSize: "28px" }} />
            {open && "Approved Report"}
          </button>
        )}



        {/* Report Section */}
        <SidebarSection
          open={open}
          isOpen={Report}
          toggleSection={toggleReport}
          icon={<TbReport style={{ marginRight: "8px", color: "#ffcc00", fontSize: "27px", }} />}
          Permissions={Permissions}
          label="Report"
          links={[

            {
              name: "309 Report",
              path: "/home/Report3",
              icon: <MdCalendarMonth style={{ marginRight: "8px", color: "#32CD32", fontSize: "28px" }} />, // Lime Green
              code: 'Report3'
            },
            {
              name: "201 Report",
              path: "/home/Report4",
              icon: <MdCalendarMonth style={{ marginRight: "8px", color: "#FF8C00", fontSize: "28px" }} />, // Dark Violet
              code: 'Report4'
            },
            {
              name: "202 Report",
              path: "/home/Report5",
              icon: <MdCalendarMonth style={{ marginRight: "8px", color: "#FFD700", fontSize: "28px" }} />, // Gold
              code: 'Report5'
            },
            {
              name: "551 Report",
              path: "/home/Report6",
              icon: <MdCalendarMonth style={{ marginRight: "8px", color: "#00CED1", fontSize: "28px" }} />, // Dark Turquoise
              code: 'Report6'
            },
            {
              name: "311 Report",
              path: "/home/Report7",
              icon: <MdCalendarMonth style={{ marginRight: "8px", color: "#FF69B4", fontSize: "28px" }} />, // Hot Pink
              code: 'Report7'
            },
            {
              name: "Inward of Old Invoice Report",
              path: "/home/Report1",
              icon: <MdCalendarMonth style={{ marginRight: "8px", color: "#D8BFD8", fontSize: "28px" }} />, // Dodger Blue
              code: 'Report1'
            },
            {
              name: "Emergency Procurement Report",
              path: "/home/Report2",
              icon: <MdCalendarMonth style={{ marginRight: "8px", color: "#FF6347", fontSize: "28px" }} />, // Orange Red
              code: 'Report2'
            },
            {
              name: "Conversion Rs1 Report",
              path: "/home/Report8",
              icon: <RiMoneyRupeeCircleFill style={{ marginRight: "8px", color: "#1ABC9C", fontSize: "28px" }} />, // Saddle Brown
              code: 'Report8'
            },
          ]}
          codeList={[
            'Report1', 'Report2', 'Report3', 'Report4', 'Report5', 'Report6', 'Report7', 'Report8'
          ]}
        />
        {Permissions.includes('sap') && (
          <button

            onClick={() => {
              closeAllDropdowns(); // Close other sections
              navigate("/home/SAP");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "17px",
              margin: "10px 0", // Space above and below
              marginBottom: "16px"
            }}>
            <SiSap style={{ color: "turquoise", fontSize: "35px" }} />
            {open && "SAP LOGIN"}
          </button>
        )}

        <SidebarSection
          open={open}
          isOpen={testLabOpen}
          toggleSection={toggleTestLab}
          // icon={<GiChemicalDrop style={{ marginRight: "8px", color: "#ffcc00", fontSize: "27px", }} />}
          icon={<EngineeringIcon style={{ marginRight: "8px", color: "#ffcc00", fontSize: "27px", }} />}

          Permissions={Permissions}
          label="TestLab"
          links={[
            {
              name: "Manage Testing",
              path: "/home/start_testing",
              // icon: <FaFlask style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />, // Lime Green
              icon: <MiscellaneousServicesIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />, // Lime Green
              code: 'StartTesting'
              // code: "Report1"
            },
            {
              name: "Running Status",
              path: "/home/testLabDashbaord",
              icon: <ConstructionIcon style={{ marginRight: "8px", color: "#FF8C00", fontSize: "18px" }} />, // Lime Green
              code: 'RigStatus'
              // code: "Report1"
            },
            {
              name: "Dashboard",
              path: "/home/rigMonthlyStatus",
              icon: <ConstructionIcon style={{ marginRight: "8px", color: "#FF8C00", fontSize: "18px" }} />, // Lime Green
              code: 'RigMonthlyStatus'
              // code: "Report1"
            },
          ]}
          // codeList={['Report1', 'Report1']}
          codeList={['StartTesting', 'RigStatus', 'RigMonthlyStatus']}
        />

        <SidebarSection
          open={open}
          isOpen={PMPD_Open}
          toggleSection={togglePMPD}
          icon={<GiFactory style={{ marginRight: "8px", color: "#FFA500", fontSize: "27px", }} />}
          Permissions={Permissions}
          label="PMPD"
          links={[
            {
              name: "PMPD Master",
              path: "/home/PMPD_Master",
              icon: <PrecisionManufacturingIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />,
              code: 'PMPD_Master'
            },
            {
              name: "Production Plan",
              path: "/home/PMPD_ProductionPlan",
              icon: <FactoryIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />,
              code: 'ProductionPlan'
            },
            {
              name: "Indirect Manpower",
              path: "/home/PMPD_IndirectManpower",
              icon: <GroupsIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />,
              code: 'PMPD_IndirectManpower'
            },
            {
              name: "PMPD Report",
              path: "/home/PMPD_Report",
              icon: <AssessmentIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />,
              code: 'PMPD_Report'
            },
            {
              name: "Production Actual",
              path: "/home/PMPD_ActualProductionPlan",
              icon: <FactoryIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />,
              code: 'PMPD_ActualProductionPlan'
            },
            {
              name: "Plan Vs Actual (Direct)",
              path: "/home/PMDP_PlanVsActual",
              icon: <AssessmentIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />,
              code: 'PMDP_PlanVsActual'
            },
            {
              name: `Plan Vs Actual (InDirect)`,
              path: "/home/PMDP_PlanVsActual_Indirect",
              icon: <AssessmentIcon style={{ marginRight: "8px", color: "#32CD32", fontSize: "18px" }} />,
              code: 'PMDP_PlanVsActual_Indirect'
            },
          ]}
          codeList={[
            'ProductionPlan', 'PMPD_Master', 'PMPD_Report', 'PMPD_IndirectManpower', 'PMPD_ActualProductionPlan',
            'PMDP_PlanVsActual', 'PMDP_PlanVsActual_Indirect'
          ]}
        />
      </div>
    </div>
  );
};

const SidebarSection = ({ open, isOpen, toggleSection, icon, label, links, codeList = [], Permissions = [] }) => {
  // // Check if the user has any permissions from this section
  // const hasPermission = codeList.some(code => Permissions.includes(code));
  // if (!hasPermission) return null;

  // const filteredLinks = links.filter(link => {
  //   // If link.code exists, filter using that, else use link.path as fallback
  //   return Permissions.includes(link.code || link.path);
  // });

  // if (filteredLinks.length === 0) return null;

  // Normalize permissions
  const permissionArray = Array.isArray(Permissions)
    ? Permissions
    : typeof Permissions === "string"
      ? Permissions.split(",").map(p => p.trim())
      : [];

  // Section-level permission check
  const hasPermission = codeList.some(code =>
    permissionArray.some(p => p === code)
  );

  if (!hasPermission) return null;

  // Link-level permission check
  const filteredLinks = links.filter(link => {
    const key = link.code || link.path;
    return permissionArray.some(p => p === key);
  });

  if (filteredLinks.length === 0) return null;

  return (
    <div style={{ marginBottom: "10px" }}>
      {/* {JSON.stringify(Permissions)} */}
      <button
        onClick={toggleSection}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          padding: "5px",
          color: "white",
          display: "flex",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: "18px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon}
          {open && label}
        </div>
        {open && (isOpen ? <ArrowDropDownIcon /> : <ArrowRightIcon />)}
      </button>
      {open && isOpen && (
        <div style={{ paddingLeft: "20px" }}>
          {filteredLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              style={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                padding: "5px",
                fontSize: "15px",
                color: "white",
                fontFamily: "Arial",
              }}
              className="hover:bg-gray-500 rounded-md transition-all duration-200"
            >
              {link.icon && (
                <span style={{ marginRight: "8px", display: "flex", alignItems: "center" }}>
                  {link.icon}
                </span>
              )}
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};


export default Sidebar;
