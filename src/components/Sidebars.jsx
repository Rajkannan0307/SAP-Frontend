import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { PiNuclearPlantFill } from "react-icons/pi";
import { GrCubes } from "react-icons/gr";
import { MdCalendarMonth, MdOutlineReportGmailerrorred } from "react-icons/md";
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
import AcUnitIcon from '@mui/icons-material/AcUnit';
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
import EngineeringIcon from "@mui/icons-material/Engineering";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import ConstructionIcon from "@mui/icons-material/Construction";
import { GiFactory } from "react-icons/gi";
import { FaCogs } from "react-icons/fa";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { FaBoxOpen } from "react-icons/fa";

import { MdViewInAr } from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";
import { FaRupeeSign } from "react-icons/fa";
import { MdInventory, MdHandshake } from "react-icons/md";
import { MdInventory2 } from "react-icons/md";
import { MdPrecisionManufacturing } from "react-icons/md";
import { FaBolt, FaChartBar, FaFileInvoiceDollar } from 'react-icons/fa';
import { PiPackageBold } from "react-icons/pi";

const Sidebar = ({ setSidebarOpen }) => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // Consolidates all 7 dropdown states into one
  const [Role, setRole] = useState('');

  const navigate = useNavigate();
  const Permissions = usePermissions();

  useEffect(() => {
    setSidebarOpen(open);
  }, [open, setSidebarOpen]);

  useEffect(() => {
    const encrypted = sessionStorage.getItem("userData");
    if (encrypted) {
      const decrypted = decryptSessionData(encrypted);
      if (decrypted?.RoleId) {
        setRole(decrypted.RoleId);
      } else {
        console.warn("RoleId is missing from decrypted user data");
      }
    } else {
      console.warn("No EncryptedUserData in sessionStorage");
    }
  }, []);

  const toggleSidebar = () => {
    setOpen(!open);
    if (open) setActiveSection(null);
  };

  // Only one toggle function needed now
  const toggleSection = (sectionName) => {
    setActiveSection((prev) => (prev === sectionName ? null : sectionName));
  };

  const closeAllDropdowns = () => {
    setActiveSection(null);
  };

  return (
    <div
      className={`fixed top-[60px] left-0 h-[calc(100vh-60px)] bg-[#595959] text-white transition-all duration-300 z-50 overflow-y-auto overflow-x-hidden pb-12 shadow-lg ${open ? "w-[260px]" : "w-[60px]"
        }`}
    >
      {/* Sidebar Header */}
      <div
        className={`flex items-center p-3 border-b border-gray-600 ${open ? "justify-between" : "justify-center"
          }`}
      >
        {open && (
          <h3
            className="m-0 text-white font-bold cursor-pointer hover:text-gray-300 transition-colors"
            onClick={() => {
              const roleId = parseInt(Role);
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
          className="text-white hover:text-gray-300 transition-colors p-1"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Sidebar Menu Items */}
      <div className="p-2 flex flex-col gap-1">

        {/* Masters Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "Masters"}
          toggleSection={() => toggleSection("Masters")}
          icon={<PiNuclearPlantFill style={{ color: "lightcoral" }} className="text-[22px]" />}
          Permissions={Permissions}
          label="Masters"
          links={[
            { name: "Company", path: "/home/company", icon: <BusinessIcon style={{ color: "yellow" }} />, code: 'company' },
            { name: "Business Division", path: "/home/BusinessDivision", icon: <MdBusinessCenter style={{ color: "ButtonFace" }} className="text-[22px]" />, code: 'BusinessDivision' },
            { name: "Plant", path: "/home/Plant", icon: <GiPlantsAndAnimals style={{ color: "hotpink" }} className="text-[22px]" />, code: 'Plant' },
            { name: "Department", path: "/home/Department", icon: <Diversity2Icon style={{ color: "bisque" }} className="text-[22px]" />, code: 'Department' },
            { name: "Login User", path: "/home/UserMaster", icon: <AccountCircleIcon style={{ color: "aqua" }} />, code: 'UserMaster' },
            { name: "Role", path: "/home/Role", icon: <MdOutlineAdminPanelSettings style={{ color: "goldenrod" }} className="text-[24px]" />, code: 'Role' },
            { name: "Vendor", path: "/home/Vendor", icon: <FcFactory className="text-[24px]" />, code: 'Vendor' },
            { name: "Customer", path: "/home/Customer", icon: <RiCustomerService2Fill style={{ color: "deepskyblue" }} className="text-[20px]" />, code: 'Customer' },
            { name: "Storage Location", path: "/home/StorageLocation", icon: <GrStorage style={{ color: "gold" }} className="text-[20px]" />, code: 'StorageLocation' },
            { name: "Movement Type", path: "/home/Movement_Type", icon: <DriveFileMoveIcon style={{ color: "turquoise" }} className="text-[22px]" />, code: 'Movement_Type' },
            { name: "MVT List Item", path: "/home/MVT_LIST_ITEM", icon: <FaTableList style={{ color: "thistle" }} className="text-[20px]" />, code: 'MVT_LIST_ITEM' },
            { name: "Cost Center", path: "/home/CostCenter", icon: <FaDollarSign style={{ color: "darkorange" }} className="text-[22px]" />, code: 'CostCenter' },
            { name: "ValuationType", path: "/home/ValuationType", icon: <GrCubes style={{ color: "rosybrown" }} className="text-[22px]" />, code: 'ValuationType' },
            { name: "SupvCode", path: "/home/SupvCode", icon: <MdSupervisedUserCircle style={{ color: "aquamarine" }} className="text-[22px]" />, code: 'SupvCode' },
            { name: "Module", path: "/home/Module", icon: <GiRingMould style={{ color: "khaki" }} className="text-[22px]" />, code: 'Module' },
            { name: "Line", path: "/home/Line", icon: <PrecisionManufacturingIcon style={{ color: "darkseagreen" }} className="text-[22px]" />, code: 'Line' },
            { name: "Rig Test Spec", path: "/home/RigTestSpec", icon: <PrecisionManufacturingIcon style={{ color: "darkseagreen" }} className="text-[22px]" />, code: 'RigTestSpec' },
            { name: "Machine", path: "/home/Machine", icon: <PrecisionManufacturingIcon style={{ color: "darkseagreen" }} className="text-[22px]" />, code: 'Machine' },
            { name: "Product", path: "/home/Product", icon: <FaCogs style={{ color: "bisque" }} className="text-[22px]" />, code: 'Product' },
            { name: "Product Segment", path: "/home/ProductSegmentScreen", icon: <FaCogs style={{ color: "bisque" }} className="text-[22px]" />, code: 'ProductSegment' },
            { name: "Product Mapping", path: "/home/ProductMappingScreen", icon: <FaCogs style={{ color: "bisque" }} className="text-[22px]" />, code: 'ProductMapping' },
            { name: "Category Breakup", path: "/home/CategoryBreakup", icon: <FaCogs style={{ color: "bisque" }} className="text-[22px]" />, code: 'CategoryBreakups' },
            { name: "Indirect Category", path: "/home/IndirectCategory", icon: <FaCogs style={{ color: "bisque" }} className="text-[22px]" />, code: 'IndirectCategory' },
            { name: "Fixed Manpower", path: "/home/PMPD_FixedManpower", icon: <FaCogs style={{ color: "bisque" }} className="text-[22px]" />, code: 'PMPD_FixedManpower' },
            { name: "Material - Direct", path: "/home/Material", icon: <AcUnitIcon style={{ color: "greenyellow" }} />, code: 'Material' },
            { name: "Material - Indirect", path: "/home/CC_PackingBomPart", icon: <FaBoxOpen style={{ color: "#FFC107" }} className="text-[22px]" />, code: 'Indirect_Material' },
          ]}
          codeList={[
            'company', 'BusinessDivision', 'Plant', 'Department', 'UserMaster', 'Role', 'Material', 'Vendor',
            'Customer', 'StorageLocation', 'Movement_Type', 'MVT_LIST_ITEM', 'CostCenter', 'ValuationType',
            'SupvCode', 'Module', 'Line', 'Machine', 'RigTestSpec', 'Product', 'ProductSegment', 'ProductMapping',
            'CategoryBreakups', 'IndirectCategory', 'PMPD_FixedManpower', 'Indirect_Material'
          ]}
        />

        {/* Transaction Button */}
        {Permissions.includes('dashboard') && (
          <StandaloneButton
            open={open}
            onClick={() => { closeAllDropdowns(); navigate("/home/dashboard"); }}
            icon={<FaExchangeAlt style={{ color: "turquoise" }} className="text-[19px]" />}
            label="Transaction"
          />
        )}

        {/* Approval Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "Approval"}
          toggleSection={() => toggleSection("Approval")}
          icon={<FcApproval className="text-[24px]" />}
          Permissions={Permissions}
          label="Approval"
          links={[
            { name: "309 Approval", path: "/home/Approval_309", icon: <MdOutlineApproval style={{ color: "rgb(52, 188, 252)" }} className="text-[28px]" />, code: 'Approval_309' },
            { name: "201 Approval", path: "/home/Approval_201", icon: <GiAmericanShield style={{ color: "rgb(231, 89, 177)" }} className="text-[28px]" />, code: 'Approval_201' },
            { name: "202 Approval", path: "/home/Approval_202", icon: <BsFillSignpostFill style={{ color: "rgb(186, 241, 113)" }} className="text-[30px]" />, code: 'Approval_202' },
            { name: "551 Approval", path: "/home/Approval_551", icon: <MdAddTask style={{ color: "rgb(235, 62, 62)" }} className="text-[30px]" />, code: 'Approval_551' },
            { name: "311 Approval", path: "/home/Approval_311", icon: <SiScrapbox style={{ color: "rgb(171, 136, 228)" }} className="text-[30px]" />, code: 'Approval_551' },
            { name: "Inward of Old Invoice Approval", path: "/home/InwardApproval", icon: <FaExternalLinkSquareAlt style={{ color: "rgb(240, 186, 117)" }} className="text-[25px]" />, code: 'InwardApproval' },
            { name: "Emergency Procurement Approval", path: "/home/EmergencyApproval", icon: <EmergencyIcon style={{ color: "rgb(230, 123, 123)" }} className="text-[29px]" />, code: 'EmergencyApproval' },
            { name: "ConversionRs1", path: "/home/Approval_Rs1", icon: <RiMoneyRupeeCircleFill style={{ color: "rgb(15, 196, 209)" }} className="text-[30px]" />, code: 'ApprovalRs1' },
          ]}
          codeList={[
            'Approval_309', 'Approval_201', 'Approval_202', 'Approval_551', 'Approval_311', 'InwardApproval', 'EmergencyApproval', 'ApprovalRs1'
          ]}
        />

        {/* Store Dashboard Button */}
        {Permissions.includes('Store') && (
          <StandaloneButton
            open={open}
            onClick={() => { closeAllDropdowns(); navigate("/home/StoreDashboard"); }}
            icon={<StorefrontIcon style={{ color: "hotpink" }} className="text-[24px]" />}
            label="Store Dashboard"
          />
        )}

        {/* Approved Report Button */}
        {Permissions.includes('ApprovedReports') && (
          <StandaloneButton
            open={open}
            onClick={() => { closeAllDropdowns(); navigate("/home/ApprovalReports"); }}
            icon={<TbReportSearch style={{ color: "turquoise" }} className="text-[28px]" />}
            label="Approved Report"
          />
        )}

        {/* Report Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "Report"}
          toggleSection={() => toggleSection("Report")}
          icon={<TbReport style={{ color: "#ffcc00" }} className="text-[27px]" />}
          Permissions={Permissions}
          label="Report"
          links={[
            { name: "309 Report", path: "/home/Report3", icon: <MdCalendarMonth style={{ color: "#32CD32" }} className="text-[28px]" />, code: 'Report3' },
            { name: "201 Report", path: "/home/Report4", icon: <MdCalendarMonth style={{ color: "#FF8C00" }} className="text-[28px]" />, code: 'Report4' },
            { name: "202 Report", path: "/home/Report5", icon: <MdCalendarMonth style={{ color: "#FFD700" }} className="text-[28px]" />, code: 'Report5' },
            { name: "551 Report", path: "/home/Report6", icon: <MdCalendarMonth style={{ color: "#00CED1" }} className="text-[28px]" />, code: 'Report6' },
            { name: "311 Report", path: "/home/Report7", icon: <MdCalendarMonth style={{ color: "#FF69B4" }} className="text-[28px]" />, code: 'Report7' },
            { name: "Inward of Old Invoice Report", path: "/home/Report1", icon: <MdCalendarMonth style={{ color: "#D8BFD8" }} className="text-[28px]" />, code: 'Report1' },
            { name: "Emergency Procurement Report", path: "/home/Report2", icon: <MdCalendarMonth style={{ color: "#FF6347" }} className="text-[28px]" />, code: 'Report2' },
            { name: "Conversion Rs1 Report", path: "/home/Report8", icon: <RiMoneyRupeeCircleFill style={{ color: "#1ABC9C" }} className="text-[28px]" />, code: 'Report8' },
          ]}
          codeList={['Report1', 'Report2', 'Report3', 'Report4', 'Report5', 'Report6', 'Report7', 'Report8']}
        />

        {/* SAP Button */}
        {Permissions.includes('sap') && (
          <StandaloneButton
            open={open}
            onClick={() => { closeAllDropdowns(); navigate("/home/SAP"); }}
            icon={<SiSap style={{ color: "turquoise" }} className="text-[35px]" />}
            label="SAP LOGIN"
          />
        )}

        {/* TestLab Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "TestLab"}
          toggleSection={() => toggleSection("TestLab")}
          icon={<EngineeringIcon style={{ color: "#ffcc00" }} className="text-[27px]" />}
          Permissions={Permissions}
          label="TestLab"
          links={[
            { name: "Manage Testing", path: "/home/start_testing", icon: <MiscellaneousServicesIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'StartTesting' },
            { name: "Running Status", path: "/home/testLabDashbaord", icon: <ConstructionIcon style={{ color: "#FF8C00" }} className="text-[18px]" />, code: 'RigStatus' },
            { name: "Dashboard", path: "/home/rigMonthlyStatus", icon: <ConstructionIcon style={{ color: "#FF8C00" }} className="text-[18px]" />, code: 'RigMonthlyStatus' },
          ]}
          codeList={['StartTesting', 'RigStatus', 'RigMonthlyStatus']}
        />

        {/* PMPD Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "PMPD"}
          toggleSection={() => toggleSection("PMPD")}
          icon={<GiFactory style={{ color: "#FFA500" }} className="text-[27px]" />}
          Permissions={Permissions}
          label="PMPD"
          links={[
            { name: "PMPD Master", path: "/home/PMPD_Master", icon: <PrecisionManufacturingIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'PMPD_Master' },
            { name: "Production Plan", path: "/home/PMPD_ProductionPlan", icon: <FactoryIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'ProductionPlan' },
            { name: "Indirect Manpower", path: "/home/PMPD_IndirectManpower", icon: <GroupsIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'PMPD_IndirectManpower' },
            { name: "PMPD Report", path: "/home/PMPD_Report", icon: <AssessmentIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'PMPD_Report' },
            { name: "Production Actual", path: "/home/PMPD_ActualProductionPlan", icon: <FactoryIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'PMPD_ActualProductionPlan' },
            { name: "Plan Vs Actual (Direct)", path: "/home/PMDP_PlanVsActual", icon: <AssessmentIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'PMDP_PlanVsActual' },
            { name: "Plan Vs Actual (InDirect)", path: "/home/PMDP_PlanVsActual_Indirect", icon: <AssessmentIcon style={{ color: "#32CD32" }} className="text-[18px]" />, code: 'PMDP_PlanVsActual_Indirect' },
          ]}
          codeList={[
            'ProductionPlan', 'PMPD_Master', 'PMPD_Report', 'PMPD_IndirectManpower', 'PMPD_ActualProductionPlan', 'PMDP_PlanVsActual', 'PMDP_PlanVsActual_Indirect'
          ]}
        />

        {/* DCM Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "DCM"}
          toggleSection={() => toggleSection("DCM")}
          icon={<FaRupeeSign style={{ color: "#FFA500" }} className="text-[27px]" />}
          Permissions={Permissions}
          label="DCM"
          links={[
            { name: "DCM Output", path: "/home/CC_DCM_Output", icon: <FaFileInvoiceDollar style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_DCM_Output' },
            { name: "Actual Consumption", path: "/home/CC_ActualConsumptionPlan", icon: <BsBoxSeam style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_ActualConsumptionPlan' },
            { name: "Packing BOM", path: "/home/CC_PackingBOM", icon: <FaBoxOpen style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_PackingBOM' },
            { name: "Stores And Spares", path: "/home/CC_StoresAndSparesScreen", icon: <MdInventory style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_StoresAndSpares' },
            { name: "Sub Contract", path: "/home/CC_SubContractScreen", icon: <MdPrecisionManufacturing style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_SubContract' },
            { name: "Material Price", path: "/home/CC_IndirectMaterialPrice", icon: <FaRupeeSign style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_MaterialPrice' },
            { name: "Power Unit", path: "/home/CC_Power_Unit", icon: <FaBolt style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'PowerUnit' },
            { name: "Daily Power Consumption", path: "/home/CC_DailyPowerConsumption", icon: <FaChartBar style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'DailyPowerConsumption' },
            { name: "Power Mix Ratio", path: "/home/CC_PowerMixRatio", icon: <FaChartBar style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'PowerMixRatio' },
            { name: "Returnable Package", path: "/home/CC_ReturnablePackage", icon: <PiPackageBold style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_ReturnablePackage' },
            { name: "Rejection", path: "/home/CC_MstRejection", icon: <MdOutlineReportGmailerrorred style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_MstRejection' },
            { name: "Rejection Actuals", path: "/home/CC_RejectionActual", icon: <MdOutlineReportGmailerrorred style={{ color: "#B7BDF7" }} className="text-[18px]" />, code: 'CC_RejectionActual' },
          ]}
          codeList={[
            'CC_DCM_Output', 'CC_ActualConsumptionPlan', 'CC_PackingBOM', 'CC_StoresAndSpares', 'CC_SubContract', 'CC_MaterialPrice', 'PowerUnit', 'DailyPowerConsumption', 'PowerMixRatio',
            'CC_ReturnablePackage', 'CC_MstRejection', 'CC_RejectionActual'
          ]}
        />
      </div>
    </div>
  );
};

/* Reusable Component for Standalone Buttons */
const StandaloneButton = ({ open, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className="flex items-center w-full px-3 py-2.5 text-left text-white bg-transparent rounded-md hover:bg-gray-600 transition-colors"
  >
    <div className="flex items-center justify-center min-w-[32px]">
      {icon}
    </div>
    {open && <span className="font-bold text-[17px] ml-2 whitespace-nowrap">{label}</span>}
  </button>
);

/* Sidebar Section Dropdown Component */
const SidebarSection = ({ open, isOpen, toggleSection, icon, label, links, codeList = [], Permissions = [] }) => {
  const permissionArray = Array.isArray(Permissions)
    ? Permissions
    : typeof Permissions === "string"
      ? Permissions?.split(",")?.map(p => p?.trim())
      : [];

  const hasPermission = codeList.some(code => permissionArray.some(p => p === code));
  if (!hasPermission) return null;

  const filteredLinks = links.filter(link => {
    const key = link.code || link.path;
    return permissionArray.some(p => p === key);
  });

  if (filteredLinks.length === 0) return null;

  return (
    <div className="">
      <button
        onClick={toggleSection}
        className="flex items-center justify-between w-full px-3 py-2.5 text-left text-white bg-transparent rounded-md hover:bg-gray-600 hover:rounded-md transition-colors"
      >
        <div className="flex items-center">
          <div className="flex items-center justify-center min-w-[32px]">
            {icon}
          </div>
          {open && <span className="font-bold text-[17px] ml-2 whitespace-nowrap">{label}</span>}
        </div>
        {open && (isOpen ? <ArrowDropDownIcon /> : <ArrowRightIcon />)}
      </button>

      {open && isOpen && (
        <div className="p-1 pl-4 flex flex-col gap-1 bg-[#4b4b4b] rounded-md shadow-inner">
          {filteredLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className="flex items-center p-2 text-[15px] text-gray-200 no-underline rounded-md hover:bg-gray-500 hover:text-white transition-all duration-200"
            >
              {link.icon && (
                <span className="mr-3 flex items-center justify-center">
                  {link.icon}
                </span>
              )}
              <span className="" title={link.name}>{link.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;