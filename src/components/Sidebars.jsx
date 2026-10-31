import { useState, useEffect, useRef } from "react";
import { Tooltip } from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import HistoryToggleOffIcon from "@mui/icons-material/HistoryToggleOff";
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
import Diversity2Icon from "@mui/icons-material/Diversity2";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
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
import EmergencyIcon from "@mui/icons-material/Emergency";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { MdStorage } from "react-icons/md";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";
import ProductionQuantityLimitsIcon from "@mui/icons-material/ProductionQuantityLimits";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";

import FactoryIcon from "@mui/icons-material/Factory";
import GroupsIcon from "@mui/icons-material/Groups";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EngineeringIcon from "@mui/icons-material/Engineering";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import ConstructionIcon from "@mui/icons-material/Construction";
import { GiFactory } from "react-icons/gi";
import { FaCogs } from "react-icons/fa";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { FaBoxOpen } from "react-icons/fa";

import { MdViewInAr } from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";
import { FaRupeeSign } from "react-icons/fa";
import { MdInventory, MdHandshake } from "react-icons/md";
import { MdInventory2 } from "react-icons/md";
import { MdPrecisionManufacturing } from "react-icons/md";
import { FaBolt, FaChartBar, FaFileInvoiceDollar } from "react-icons/fa";
import { PiPackageBold } from "react-icons/pi";

const Sidebar = ({ setSidebarOpen }) => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // Consolidates all 7 dropdown states into one
  const [Role, setRole] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
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
      className={`fixed top-15 left-0 h-[calc(100vh-60px)] bg-[#1e293b] text-white transition-[width] duration-300 ease-in-out z-50 flex flex-col overflow-hidden border-r border-white/5
        ${open ? "w-65" : "w-15"}`}
    >
      <style>{`
        /* thin scrollbar, shown only while the pointer is over the menu */
        .sidebar-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .sidebar-scroll:hover { scrollbar-color: rgba(148,163,184,0.5) transparent; }
        .flyout-scroll { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,0.45) transparent; }
      `}</style>
      {/* Sidebar Header */}
      <div
        className={`shrink-0 flex items-center p-3 border-b border-white/10 ${open ? "justify-between" : "justify-center"
          }`}
      >
        <h3
          className={`m-0 text-white font-semibold tracking-wider text-[13px] cursor-pointer hover:text-sky-300 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"
            }`}
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

        <button
          onClick={toggleSidebar}
          title={open ? "Collapse menu" : "Expand menu"}
          className="text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
        >
          {open ? <KeyboardDoubleArrowLeftIcon fontSize="small" /> : <KeyboardDoubleArrowRightIcon fontSize="small" />}
        </button>
      </div>

      {/* Sidebar Menu Items */}
      <div style={{ scrollbarGutter: "stable" }} className="sidebar-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden my-3 px-2 pr-1.5 flex flex-col gap-0.5">
        {/* Masters Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "Masters"}
          toggleSection={() => toggleSection("Masters")}
          icon={
            <PiNuclearPlantFill
              style={{ color: "lightcoral" }}
              className="text-[22px]"
            />
          }
          Permissions={Permissions}
          currentPath={location.pathname}
          label="Masters"
          links={[
            {
              name: "Company",
              path: "/home/company",
              icon: <BusinessIcon style={{ color: "yellow" }} />,
              code: "company",
            },
            {
              name: "Business Division",
              path: "/home/BusinessDivision",
              icon: (
                <MdBusinessCenter
                  style={{ color: "ButtonFace" }}
                  className="text-[22px]"
                />
              ),
              code: "BusinessDivision",
            },
            {
              name: "Plant",
              path: "/home/Plant",
              icon: (
                <GiPlantsAndAnimals
                  style={{ color: "hotpink" }}
                  className="text-[22px]"
                />
              ),
              code: "Plant",
            },
            {
              name: "Department",
              path: "/home/Department",
              icon: (
                <Diversity2Icon
                  style={{ color: "bisque" }}
                  className="text-[22px]"
                />
              ),
              code: "Department",
            },
            {
              name: "Login User",
              path: "/home/UserMaster",
              icon: <AccountCircleIcon style={{ color: "aqua" }} />,
              code: "UserMaster",
            },
            {
              name: "Role",
              path: "/home/Role",
              icon: (
                <MdOutlineAdminPanelSettings
                  style={{ color: "goldenrod" }}
                  className="text-[24px]"
                />
              ),
              code: "Role",
            },
            {
              name: "Vendor",
              path: "/home/Vendor",
              icon: <FcFactory className="text-[24px]" />,
              code: "Vendor",
            },
            {
              name: "Customer",
              path: "/home/Customer",
              icon: (
                <RiCustomerService2Fill
                  style={{ color: "deepskyblue" }}
                  className="text-[20px]"
                />
              ),
              code: "Customer",
            },
            {
              name: "Storage Location",
              path: "/home/StorageLocation",
              icon: (
                <GrStorage style={{ color: "gold" }} className="text-[20px]" />
              ),
              code: "StorageLocation",
            },
            {
              name: "Movement Type",
              path: "/home/Movement_Type",
              icon: (
                <DriveFileMoveIcon
                  style={{ color: "turquoise" }}
                  className="text-[22px]"
                />
              ),
              code: "Movement_Type",
            },
            {
              name: "MVT List Item",
              path: "/home/MVT_LIST_ITEM",
              icon: (
                <FaTableList
                  style={{ color: "thistle" }}
                  className="text-[20px]"
                />
              ),
              code: "MVT_LIST_ITEM",
            },
            {
              name: "Cost Center",
              path: "/home/CostCenter",
              icon: (
                <FaDollarSign
                  style={{ color: "darkorange" }}
                  className="text-[22px]"
                />
              ),
              code: "CostCenter",
            },
            {
              name: "ValuationType",
              path: "/home/ValuationType",
              icon: (
                <GrCubes
                  style={{ color: "rosybrown" }}
                  className="text-[22px]"
                />
              ),
              code: "ValuationType",
            },
            {
              name: "SupvCode",
              path: "/home/SupvCode",
              icon: (
                <MdSupervisedUserCircle
                  style={{ color: "aquamarine" }}
                  className="text-[22px]"
                />
              ),
              code: "SupvCode",
            },
            {
              name: "Module",
              path: "/home/Module",
              icon: (
                <GiRingMould
                  style={{ color: "khaki" }}
                  className="text-[22px]"
                />
              ),
              code: "Module",
            },
            {
              name: "Shift",
              path: "/home/ShiftMaster",
              icon: (
                <AccessTimeIcon
                  style={{ color: "lightcoral" }}
                  className="text-[22px]"
                />
              ),
              code: "ShiftMaster",
            },
            {
              name: "Line",
              path: "/home/Line",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "Line",
            },
            {
              name: "Operation",
              path: "/home/Mst_Operation",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "Mst_Operation",
            },
            {
              name: "Rig Test Spec",
              path: "/home/RigTestSpec",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "RigTestSpec",
            },
            {
              name: "Machine",
              path: "/home/Machine",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "Machine",
            },
            {
              name: "Product",
              path: "/home/Product",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "Product",
            },
            {
              name: "Product Segment",
              path: "/home/ProductSegmentScreen",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "ProductSegment",
            },
            {
              name: "Product Mapping",
              path: "/home/ProductMappingScreen",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "ProductMapping",
            },
            {
              name: "Category Breakup",
              path: "/home/CategoryBreakup",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "CategoryBreakups",
            },
            {
              name: "Indirect Category",
              path: "/home/IndirectCategory",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "IndirectCategory",
            },
            {
              name: "Fixed Manpower",
              path: "/home/PMPD_FixedManpower",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "PMPD_FixedManpower",
            },
            {
              name: "Material - Direct",
              path: "/home/Material",
              icon: <AcUnitIcon style={{ color: "greenyellow" }} />,
              code: "Material",
            },
            {
              name: "Material - Indirect",
              path: "/home/CC_PackingBomPart",
              icon: (
                <FaBoxOpen
                  style={{ color: "#FFC107" }}
                  className="text-[22px]"
                />
              ),
              code: "Indirect_Material",
            },
            {
              name: "Material - Vendor Mapping",
              path: "/home/MaterialVendorMapping",
              icon: (
                <FaExchangeAlt
                  style={{ color: "#80cbc4" }}
                  className="text-[20px]"
                />
              ),
              code: "MaterialVendorMapping",
            },
            {
              name: "Material Category",
              path: "/home/MaterialCategory",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "MaterialCategory",
            },
            {
              name: "Material Remarks",
              path: "/home/MaterialRemarks",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "MaterialRemarks",
            },
            {
              name: "Working Days",
              path: "/home/WorkingDays",
              icon: (
                <FaCogs style={{ color: "bisque" }} className="text-[22px]" />
              ),
              code: "WorkingDays",
            },
          ]}
          codeList={[
            "company",
            "BusinessDivision",
            "Plant",
            "Department",
            "UserMaster",
            "Role",
            "Material",
            "Vendor",
            "Customer",
            "StorageLocation",
            "Movement_Type",
            "MVT_LIST_ITEM",
            "CostCenter",
            "ValuationType",
            "SupvCode",
            "ShiftMaster",
            "Module",
            "Line",
            "Mst_Operation",
            "Machine",
            "RigTestSpec",
            "Product",
            "ProductSegment",
            "ProductMapping",
            "CategoryBreakups",
            "IndirectCategory",
            "PMPD_FixedManpower",
            "Indirect_Material",
            "MaterialVendorMapping",
            "MaterialCategory",
            "MaterialRemarks",
            "WorkingDays",
          ]}
        />
        {/* Transaction Button */}
        {Permissions.includes("dashboard") && (
          <StandaloneButton
            open={open}
            active={location.pathname === "/home/dashboard"}
            onClick={() => {
              closeAllDropdowns();
              navigate("/home/dashboard");
            }}
            icon={
              <FaExchangeAlt
                style={{ color: "turquoise" }}
                className="text-[19px]"
              />
            }
            label="Transaction"
          />
        )}
        {/* Material Availability Status Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "MaterialAvailabilityStatus"}
          toggleSection={() => toggleSection("MaterialAvailabilityStatus")}
          icon={
            <PrecisionManufacturingIcon
              style={{ color: "darkseagreen" }}
              className="text-[22px]"
            />
          }
          Permissions={Permissions}
          currentPath={location.pathname}
          label="PPC & MRPC"
          links={[
            {
              name: "MFG BOM",
              path: "/home/MFG_BOM",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "MFG_BOM",
            },
            {
              name: "Plant Stock",
              path: "/home/PlantStock",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "PlantStock",
            },
            {
              name: "Supplier Stock",
              path: "/home/SupplierStock",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "SupplierStock",
            },
            {
              name: "GRN 103 Pending",
              path: "/home/Grn103Pending",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "Grn103Pending",
            },
            {
              name: "Open Schedule",
              path: "/home/OpenSchedule",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "OpenSchedule",
            },
            {
              name: "Offline Stock Status",
              path: "/home/OfflineStock",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "OfflineStock",
            },
            {
              name: "Subcontract Daily Dispatch",
              path: "/home/SubcontractDailyPlan",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "SubcontractDailyPlan",
            },
              {
              name: "Production Plan",
              path: "/home/PMPD_ProductionPlan",
              icon: (
                <FactoryIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "ProductionPlan",
            },
            {
              name: "Production Actual",
              path: "/home/PMPD_ActualProductionPlan",
              icon: (
                <FactoryIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "PMPD_ActualProductionPlan",
            },
            {
              name: "Material Coverage",
              path: "/home/MatAvailabilityStatus",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "MatAvailabilityStatus",
            },
            {
              name: "ASSY Prod Status",
              path: "/home/MfgProductionDailyPlan",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "MfgProductionDailyPlan",
            },
            {
              name: "Component Prod Status",
              path: "/home/MfgComponentDailyPlan",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "MfgComponentDailyPlan",
            },
            {
              name: "Child Part Coverage",
              path: "/home/RmCoverage",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "darkseagreen" }}
                  className="text-[22px]"
                />
              ),
              code: "RmCoverage",
            }
          ]}
          codeList={["MFG_BOM", "PlantStock", "SupplierStock", "Grn103Pending", "OpenSchedule", "OfflineStock", "SubcontractDailyPlan", "MatAvailabilityStatus", "MfgProductionDailyPlan", "MfgComponentDailyPlan", "ProductionPlan", "PMPD_ActualProductionPlan", "RmCoverage"]}
        />
        {/* Scheduler Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "Scheduler"}
          toggleSection={() => toggleSection("Scheduler")}
          icon={
            <ScheduleIcon
              style={{ color: "#5b8def" }}
              className="text-[22px]"
            />
          }
          Permissions={Permissions}
          currentPath={location.pathname}
          label="Scheduler"
          links={[
            {
              name: "Scheduler Jobs",
              path: "/home/SchedulerJobs",
              icon: (
                <ScheduleIcon
                  style={{ color: "#5b8def" }}
                  className="text-[20px]"
                />
              ),
              code: "SchedulerJobs",
            },
            {
              name: "Column Mapping Studio",
              path: "/home/SchedulerColumnMapping",
              icon: (
                <ViewColumnIcon
                  style={{ color: "#5b8def" }}
                  className="text-[20px]"
                />
              ),
              code: "SchedulerColumnMapping",
            },
            {
              name: "Run History",
              path: "/home/SchedulerRunHistory",
              icon: (
                <HistoryToggleOffIcon
                  style={{ color: "#5b8def" }}
                  className="text-[20px]"
                />
              ),
              code: "SchedulerRunHistory",
            },
          ]}
          codeList={["SchedulerJobs", "SchedulerColumnMapping", "SchedulerRunHistory"]}
        />
        {/* Approval Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "Approval"}
          toggleSection={() => toggleSection("Approval")}
          icon={<FcApproval className="text-[24px]" />}
          Permissions={Permissions}
          currentPath={location.pathname}
          label="Approval"
          links={[
            {
              name: "309 Approval",
              path: "/home/Approval_309",
              icon: (
                <MdOutlineApproval
                  style={{ color: "rgb(52, 188, 252)" }}
                  className="text-[28px]"
                />
              ),
              code: "Approval_309",
            },
            {
              name: "201 Approval",
              path: "/home/Approval_201",
              icon: (
                <GiAmericanShield
                  style={{ color: "rgb(231, 89, 177)" }}
                  className="text-[28px]"
                />
              ),
              code: "Approval_201",
            },
            {
              name: "202 Approval",
              path: "/home/Approval_202",
              icon: (
                <BsFillSignpostFill
                  style={{ color: "rgb(186, 241, 113)" }}
                  className="text-[30px]"
                />
              ),
              code: "Approval_202",
            },
            {
              name: "551 Approval",
              path: "/home/Approval_551",
              icon: (
                <MdAddTask
                  style={{ color: "rgb(235, 62, 62)" }}
                  className="text-[30px]"
                />
              ),
              code: "Approval_551",
            },
            {
              name: "311 Approval",
              path: "/home/Approval_311",
              icon: (
                <SiScrapbox
                  style={{ color: "rgb(171, 136, 228)" }}
                  className="text-[30px]"
                />
              ),
              code: "Approval_551",
            },
            {
              name: "Inward of Old Invoice Approval",
              path: "/home/InwardApproval",
              icon: (
                <FaExternalLinkSquareAlt
                  style={{ color: "rgb(240, 186, 117)" }}
                  className="text-[25px]"
                />
              ),
              code: "InwardApproval",
            },
            {
              name: "Emergency Procurement Approval",
              path: "/home/EmergencyApproval",
              icon: (
                <EmergencyIcon
                  style={{ color: "rgb(230, 123, 123)" }}
                  className="text-[29px]"
                />
              ),
              code: "EmergencyApproval",
            },
            {
              name: "ConversionRs1",
              path: "/home/Approval_Rs1",
              icon: (
                <RiMoneyRupeeCircleFill
                  style={{ color: "rgb(15, 196, 209)" }}
                  className="text-[30px]"
                />
              ),
              code: "ApprovalRs1",
            },
          ]}
          codeList={[
            "Approval_309",
            "Approval_201",
            "Approval_202",
            "Approval_551",
            "Approval_311",
            "InwardApproval",
            "EmergencyApproval",
            "ApprovalRs1",
          ]}
        />
        {/* Store Dashboard Button */}
        {Permissions.includes("Store") && (
          <StandaloneButton
            open={open}
            active={location.pathname === "/home/StoreDashboard"}
            onClick={() => {
              closeAllDropdowns();
              navigate("/home/StoreDashboard");
            }}
            icon={
              <StorefrontIcon
                style={{ color: "hotpink" }}
                className="text-[24px]"
              />
            }
            label="Store Dashboard"
          />
        )}
        {/* Approved Report Button */}
        {Permissions.includes("ApprovedReports") && (
          <StandaloneButton
            open={open}
            active={location.pathname === "/home/ApprovalReports"}
            onClick={() => {
              closeAllDropdowns();
              navigate("/home/ApprovalReports");
            }}
            icon={
              <TbReportSearch
                style={{ color: "turquoise" }}
                className="text-[28px]"
              />
            }
            label="Approved Report"
          />
        )}
        {/* Report Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "Report"}
          toggleSection={() => toggleSection("Report")}
          icon={
            <TbReport style={{ color: "#ffcc00" }} className="text-[27px]" />
          }
          Permissions={Permissions}
          currentPath={location.pathname}
          label="Report"
          links={[
            {
              name: "309 Report",
              path: "/home/Report3",
              icon: (
                <MdCalendarMonth
                  style={{ color: "#32CD32" }}
                  className="text-[28px]"
                />
              ),
              code: "Report3",
            },
            {
              name: "201 Report",
              path: "/home/Report4",
              icon: (
                <MdCalendarMonth
                  style={{ color: "#FF8C00" }}
                  className="text-[28px]"
                />
              ),
              code: "Report4",
            },
            {
              name: "202 Report",
              path: "/home/Report5",
              icon: (
                <MdCalendarMonth
                  style={{ color: "#FFD700" }}
                  className="text-[28px]"
                />
              ),
              code: "Report5",
            },
            {
              name: "551 Report",
              path: "/home/Report6",
              icon: (
                <MdCalendarMonth
                  style={{ color: "#00CED1" }}
                  className="text-[28px]"
                />
              ),
              code: "Report6",
            },
            {
              name: "311 Report",
              path: "/home/Report7",
              icon: (
                <MdCalendarMonth
                  style={{ color: "#FF69B4" }}
                  className="text-[28px]"
                />
              ),
              code: "Report7",
            },
            {
              name: "Inward of Old Invoice Report",
              path: "/home/Report1",
              icon: (
                <MdCalendarMonth
                  style={{ color: "#D8BFD8" }}
                  className="text-[28px]"
                />
              ),
              code: "Report1",
            },
            {
              name: "Emergency Procurement Report",
              path: "/home/Report2",
              icon: (
                <MdCalendarMonth
                  style={{ color: "#FF6347" }}
                  className="text-[28px]"
                />
              ),
              code: "Report2",
            },
            {
              name: "Conversion Rs1 Report",
              path: "/home/Report8",
              icon: (
                <RiMoneyRupeeCircleFill
                  style={{ color: "#1ABC9C" }}
                  className="text-[28px]"
                />
              ),
              code: "Report8",
            },
          ]}
          codeList={[
            "Report1",
            "Report2",
            "Report3",
            "Report4",
            "Report5",
            "Report6",
            "Report7",
            "Report8",
          ]}
        />
        {/* SAP Button */}
        {Permissions.includes("sap") && (
          <StandaloneButton
            open={open}
            active={location.pathname === "/home/SAP"}
            onClick={() => {
              closeAllDropdowns();
              navigate("/home/SAP");
            }}
            icon={
              <SiSap style={{ color: "turquoise" }} className="text-[35px]" />
            }
            label="SAP LOGIN"
          />
        )}
        {/* TestLab Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "TestLab"}
          toggleSection={() => toggleSection("TestLab")}
          icon={
            <EngineeringIcon
              style={{ color: "#ffcc00" }}
              className="text-[27px]"
            />
          }
          Permissions={Permissions}
          currentPath={location.pathname}
          label="TestLab"
          links={[
            {
              name: "Manage Testing",
              path: "/home/start_testing",
              icon: (
                <MiscellaneousServicesIcon
                  style={{ color: "#32CD32" }}
                  className="text-[18px]"
                />
              ),
              code: "StartTesting",
            },
            {
              name: "Running Status",
              path: "/home/testLabDashbaord",
              icon: (
                <ConstructionIcon
                  style={{ color: "#FF8C00" }}
                  className="text-[18px]"
                />
              ),
              code: "RigStatus",
            },
            {
              name: "Dashboard",
              path: "/home/rigMonthlyStatus",
              icon: (
                <ConstructionIcon
                  style={{ color: "#FF8C00" }}
                  className="text-[18px]"
                />
              ),
              code: "RigMonthlyStatus",
            },
          ]}
          codeList={["StartTesting", "RigStatus", "RigMonthlyStatus"]}
        />

        {/* PMPD Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "PMPD"}
          toggleSection={() => toggleSection("PMPD")}
          icon={
            <GiFactory style={{ color: "#FFA500" }} className="text-[27px]" />
          }

          Permissions={Permissions}
          currentPath={location.pathname}
          label="PMPD"
          links={[

            {
              name: "PMPD Master",
              path: "/home/PMPD_Master",
              icon: (
                <PrecisionManufacturingIcon
                  style={{ color: "#32CD32" }}
                  className="text-[18px]"
                />
              ),
              code: "PMPD_Master",
            },
            {
              name: "Indirect Manpower",
              path: "/home/PMPD_IndirectManpower",
              icon: (
                <GroupsIcon
                  style={{ color: "#32CD32" }}
                  className="text-[18px]"
                />
              ),
              code: "PMPD_IndirectManpower",
            },
            {
              name: "PMPD Report",
              path: "/home/PMPD_Report",
              icon: (
                <AssessmentIcon
                  style={{ color: "#32CD32" }}
                  className="text-[18px]"
                />
              ),
              code: "PMPD_Report",
            },
            {
              name: "Plan Vs Actual (Direct)",
              path: "/home/PMDP_PlanVsActual",
              icon: (
                <AssessmentIcon
                  style={{ color: "#32CD32" }}
                  className="text-[18px]"
                />
              ),
              code: "PMDP_PlanVsActual",
            },
            {
              name: "Plan Vs Actual (InDirect)",
              path: "/home/PMDP_PlanVsActual_Indirect",
              icon: (
                <AssessmentIcon
                  style={{ color: "#32CD32" }}
                  className="text-[18px]"
                />
              ),
              code: "PMDP_PlanVsActual_Indirect",
            },

            {
              name: "Inhouse Capacity",
              path: "/home/Inhouse_capacity",
              icon: (
                <MdOutlineReportGmailerrorred
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "Inhouse_capacity",
            },
          ]}
          codeList={[
            "PMPD_Master",
            "PMPD_Report",
            "PMPD_IndirectManpower",
            "PMDP_PlanVsActual",
            "PMDP_PlanVsActual_Indirect",
            "Inhouse_capacity",
          ]}
        />
        {/* DCM Section */}
        <SidebarSection
          open={open}
          isOpen={activeSection === "DCM"}
          toggleSection={() => toggleSection("DCM")}
          icon={
            <FaRupeeSign style={{ color: "#FFA500" }} className="text-[27px]" />
          }
          Permissions={Permissions}
          currentPath={location.pathname}
          label="DCM"
          links={[
            {
              name: "DCM Output",
              path: "/home/CC_DCM_Output",
              icon: (
                <FaFileInvoiceDollar
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_DCM_Output",
            },
            {
              name: "Actual Consumption",
              path: "/home/CC_ActualConsumptionPlan",
              icon: (
                <BsBoxSeam
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_ActualConsumptionPlan",
            },
            {
              name: "Packing BOM",
              path: "/home/CC_PackingBOM",
              icon: (
                <FaBoxOpen
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_PackingBOM",
            },
            {
              name: "Stores And Spares",
              path: "/home/CC_StoresAndSparesScreen",
              icon: (
                <MdInventory
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_StoresAndSpares",
            },
            {
              name: "Sub Contract",
              path: "/home/CC_SubContractScreen",
              icon: (
                <MdPrecisionManufacturing
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_SubContract",
            },
            {
              name: "Material Price",
              path: "/home/CC_IndirectMaterialPrice",
              icon: (
                <FaRupeeSign
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_MaterialPrice",
            },
            {
              name: "Power Unit",
              path: "/home/CC_Power_Unit",
              icon: (
                <FaBolt style={{ color: "#B7BDF7" }} className="text-[18px]" />
              ),
              code: "PowerUnit",
            },
            {
              name: "Daily Power Consumption",
              path: "/home/CC_DailyPowerConsumption",
              icon: (
                <FaChartBar
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "DailyPowerConsumption",
            },
            {
              name: "Power Mix Ratio",
              path: "/home/CC_PowerMixRatio",
              icon: (
                <FaChartBar
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "PowerMixRatio",
            },
            {
              name: "Returnable Package",
              path: "/home/CC_ReturnablePackage",
              icon: (
                <PiPackageBold
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_ReturnablePackage",
            },
            {
              name: "Rejection",
              path: "/home/CC_MstRejection",
              icon: (
                <MdOutlineReportGmailerrorred
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_MstRejection",
            },
            {
              name: "Rejection Actuals",
              path: "/home/CC_RejectionActual",
              icon: (
                <MdOutlineReportGmailerrorred
                  style={{ color: "#B7BDF7" }}
                  className="text-[18px]"
                />
              ),
              code: "CC_RejectionActual",
            },
          ]}
          codeList={[
            "CC_DCM_Output",
            "CC_ActualConsumptionPlan",
            "CC_PackingBOM",
            "CC_StoresAndSpares",
            "CC_SubContract",
            "CC_MaterialPrice",
            "PowerUnit",
            "DailyPowerConsumption",
            "PowerMixRatio",
            "CC_ReturnablePackage",
            "CC_MstRejection",
            "CC_RejectionActual",
          ]}
        />
      </div>
    </div>
  );
};

/* Reusable Component for Standalone Buttons. Collapsed menu: a small label pops up beside the icon. */
const StandaloneButton = ({ open, onClick, icon, label, active = false }) => (
  <Tooltip
    title={label}
    placement="right"
    arrow
    disableHoverListener={open}
    disableFocusListener={open}
    disableTouchListener
    slotProps={{
      popper: { sx: { zIndex: 1300 } },
      tooltip: { sx: { bgcolor: "#0f172a", color: "#fff", fontSize: 12, fontWeight: 600, px: 1.5, py: 0.75, borderRadius: "8px", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" } },
      arrow: { sx: { color: "#0f172a" } },
    }}
  >
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative flex items-center w-full gap-2.5 px-3 py-2 rounded-lg text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${active ? "bg-white/15 text-white" : "text-slate-100 bg-transparent hover:bg-white/10"
        }`}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-sky-400" />}
      <span className="flex items-center justify-center w-5 h-5 shrink-0 leading-none">
        {icon}
      </span>
      <span
        className={`font-semibold text-[14px] leading-snug text-left whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"
          }`}
      >
        {label}
      </span>
    </button>
  </Tooltip>
);

/* Sidebar Section Dropdown Component.
   Menu open: the links drop down under the section (as before).
   Menu collapsed: pointing at the icon opens a Material UI tooltip card (with its arrow) beside it with the section's links. */
const SidebarSection = ({
  open,
  isOpen,
  toggleSection,
  icon,
  label,
  links,
  codeList = [],
  Permissions = [],
  currentPath = "",
}) => {
  const [flyout, setFlyout] = useState(false);
  const [placeBelow, setPlaceBelow] = useState(false); // true = the card grows upward from the icon (icon in the lower half of the screen)
  const buttonRef = useRef(null);
  const openFlyout = () => {
    const r = buttonRef.current ? buttonRef.current.getBoundingClientRect() : null;
    setPlaceBelow(Boolean(r && r.top + r.height / 2 > window.innerHeight / 2));
    setFlyout(true);
  };
  // the pop-up belongs to the collapsed menu only
  useEffect(() => {
    if (open) setFlyout(false);
  }, [open]);
  // a page change closes it
  useEffect(() => {
    setFlyout(false);
  }, [currentPath]);
  // while it is open: close it when the pointer has been away from both the icon and the card for a moment (the short wait lets the
  // pointer cross the gap between them), when the pointer leaves the window, on a tap elsewhere, and on Escape
  useEffect(() => {
    if (!flyout) return undefined;
    let timer = null;
    const insideFlyout = (el) =>
      Boolean(el && ((buttonRef.current && buttonRef.current.contains(el)) || (el.closest && el.closest(".sidebar-flyout-popper"))));
    const onMove = (e) => {
      if (insideFlyout(e.target)) {
        clearTimeout(timer);
        timer = null;
      } else if (!timer) {
        timer = setTimeout(() => setFlyout(false), 250);
      }
    };
    const onTouch = (e) => {
      if (!insideFlyout(e.target)) setFlyout(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setFlyout(false);
    };
    const close = () => setFlyout(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchstart", onTouch);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mouseleave", close);
    window.addEventListener("blur", close);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchstart", onTouch);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mouseleave", close);
      window.removeEventListener("blur", close);
    };
  }, [flyout]);

  const permissionArray = Array.isArray(Permissions)
    ? Permissions
    : typeof Permissions === "string"
      ? Permissions?.split(",")?.map((p) => p?.trim())
      : [];

  const hasPermission = codeList.some((code) =>
    permissionArray.some((p) => p === code),
  );
  if (!hasPermission) return null;

  const filteredLinks = links.filter((link) => {
    const key = link.code || link.path;
    return permissionArray.some((p) => p === key);
  });

  if (filteredLinks.length === 0) return null;

  const hasActiveLink = filteredLinks.some((link) => currentPath === link.path);

  const flyoutCard = (
    <div className="flyout-scroll flex flex-col gap-1.5 min-w-[210px] pr-1" style={{ maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}>
      {filteredLinks.map((link, index) => {
        const isActive = currentPath === link.path;
        return (
          <Link
            key={index}
            to={link.path}
            onClick={() => setFlyout(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] leading-snug no-underline transition-colors duration-150 ${isActive
              ? "bg-sky-500/25 text-white font-semibold"
              : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
          >
            {link.icon && (
              <span className="flex items-center justify-center w-5 h-5 shrink-0 leading-none">
                {link.icon}
              </span>
            )}
            <span className="break-words">{link.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      <Tooltip
        title={open ? "" : flyoutCard}
        placement={placeBelow ? "right-end" : "right-start"}
        arrow
        open={!open && flyout}
        onOpen={openFlyout}
        onClose={() => setFlyout(false)}
        enterDelay={80}
        leaveDelay={160}
        enterTouchDelay={0}
        leaveTouchDelay={5000}
        slotProps={{
          popper: {
            className: "sidebar-flyout-popper",
            sx: { zIndex: 1300 },
            // the first row of the card is level with the icon, so the arrow (centered on the icon) points at it
            modifiers: [
              { name: "offset", options: { offset: [placeBelow ? 8 : -8, 12] } },
              { name: "arrow", options: { padding: 22 } },
              { name: "preventOverflow", options: { padding: 8 } },
            ],
          },
          tooltip: {
            sx: {
              bgcolor: "#0f172a",
              color: "#fff",
              p: 1,
              maxWidth: 300,
              fontSize: 13,
              fontWeight: 400,
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
              "&.MuiTooltip-tooltipPlacementRight": { ml: "16px" },
            },
          },
          arrow: {
            sx: {
              color: "#0f172a",
              fontSize: 22,
              "&::before": { border: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box" },
            },
          },
        }}
      >
        <button
          ref={buttonRef}
          onClick={open ? toggleSection : openFlyout}
          aria-label={label}
          aria-expanded={open ? isOpen : flyout}
          className={`relative flex items-center justify-between w-full gap-2 px-3 py-2 rounded-lg text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${(open ? isOpen : flyout || hasActiveLink) ? "bg-white/10 text-white" : "text-slate-100 bg-transparent hover:bg-white/10"
            } ${!open && flyout ? "ring-1 ring-white/15" : ""}`}
        >
          {!open && hasActiveLink && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-sky-400" />}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-5 h-5 shrink-0 leading-none">
              {icon}
            </span>
            <span
              className={`font-semibold text-[14px] leading-snug text-left whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0"
                }`}
            >
              {label}
            </span>
          </div>
          <ArrowRightIcon
            fontSize="small"
            className={`shrink-0 text-slate-400 transition-all duration-200 ease-in-out ${isOpen ? "rotate-90" : "rotate-0"
              } ${open ? "max-w-[24px] opacity-100" : "max-w-0 opacity-0 overflow-hidden"}`}
          />
        </button>
      </Tooltip>

      {open && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
        >
          <div className="overflow-hidden">
            <div className="mt-1 mb-1 ml-3 p-1 pl-2 flex flex-col gap-0.5 bg-black/20 rounded-lg border-l border-white/10">
              {filteredLinks.map((link, index) => {
                const isActive = currentPath === link.path;
                return (
                  <Link
                    key={index}
                    to={link.path}
                    title={link.name}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] leading-snug no-underline border-l-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${isActive
                      ? "bg-sky-500/20 border-sky-400 text-white font-semibold"
                      : "border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {link.icon && (
                      <span className="flex items-center justify-center w-5 h-5 shrink-0 leading-none">
                        {link.icon}
                      </span>
                    )}
                    <span className="break-words">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
