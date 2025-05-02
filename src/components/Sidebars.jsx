import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { PiNuclearPlantFill } from "react-icons/pi";
import { MdDashboard } from "react-icons/md";
import ReportIcon from "@mui/icons-material/Report";
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
const Sidebar = ({ setSidebarOpen }) => {
  const [open, setOpen] = useState(false);
  const [Masters, setMasterOpen] = useState(false);
  const [Approval, setApprovalOpen] = useState(false);
  const [Dashboard, setDashboardOpen] = useState(false);
  const [Report, setReportOpen] = useState(false);
  // Pass sidebar open state to parent
  useEffect(() => {
    setSidebarOpen(open);
  }, [open, setSidebarOpen]);

  const toggleSidebar = () => {
    setOpen(!open);
    if (open) closeAllDropdowns();
  };

  const toggleMasters = () => {
    setMasterOpen(!Masters);
    
    setDashboardOpen(false);
    setReportOpen(false);
    setApprovalOpen(false);
  };

  const toggleApproval = () => {
    setApprovalOpen(!Approval);
    setMasterOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
  };

  const toggleReport = () => {
    setReportOpen(!Report);
    setMasterOpen(false);
    setDashboardOpen(false);
    setApprovalOpen(false);
  };

  const toggleDashboard = () => {
    setDashboardOpen(!Dashboard);
    setMasterOpen(false);
    setApprovalOpen(false);
    setReportOpen(false);
  };

  const closeAllDropdowns = () => {
    setMasterOpen(false);
    setApprovalOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
  };

  return (
    <div
      style={{
        width: open ? "250px" : "60px",
        backgroundColor: "#595959",
        transition: "width 0.3s ease",
        height: "100vh",
        position: "fixed",
        top: "60px",
        left: 0,
        overflow: "hidden",
        paddingTop: "10px",
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
  <h3 style={{ margin: 0, color: "white" }}>
    <Link  style={{color:"white",textDecoration: "none"}}to="/home/dashboard">HOME</Link>
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
        <SidebarSection
          open={open}
          isOpen={Dashboard}
          toggleSection={toggleDashboard}
          icon={<MdDashboard style={{color:"hotpink"}} />}
          label="Dashboard"
          links={[{ name: "Dashboard", path: "/home/dashboard" }]}
        />
        {/* Masters Section */}
        <SidebarSection
          open={open}
          isOpen={Masters}
          toggleSection={toggleMasters}
          icon={<PiNuclearPlantFill style={{ color: "lightcoral" }}/>}
          
          label="Masters"
          links={[
            { name: "Company", path: "/home/company" ,icon:<BusinessIcon style={{ marginRight: "2px" ,color:"yellow",code:'company'}}/>},
            { name: "Business Division", path: "/home/BusinessDivision" ,icon:<MdBusinessCenter style={{ marginRight: "2px",fontSize:"22px" ,color:"ButtonFace",code:'BusinessDivision'}}/>},
            { name: "Plant", path: "/home/Plant" ,icon: <GiPlantsAndAnimals style={{ marginRight: "2px",fontSize:"22px",color: "hotpink" ,code:'Plant' }} />  },
            { name: "Department", path: "/home/Department",icon: <Diversity2Icon style={{ marginRight: "2px",fontSize:"22px",color: "bisque" ,code:'Department' }} /> },
            { name: "Login User", path: "/home/UserMaster" ,icon:< AccountCircleIcon style={{ marginRight: "2px", color:"aqua",code:'UserMaster' }}/>},
            { name: "Role", path: "/home/Role" ,icon:< MdOutlineAdminPanelSettings style={{ marginRight: "2px",width:"25px",fontSize:"24px" ,color:"goldenrod" ,code:'Role' }}/>},
            { name: "Material", path: "/home/Material" , icon:<AcUnitIcon style={{ marginRight: "2px", color:"greenyellow" ,code:'Material' }}/>},
            { name: "Vendor", path: "/home/Vendor" ,icon:<FcFactory style={{ marginRight: "2px",fontSize:"24px" ,width:"25px" ,code:'Vendor' }}/>},
            { name: "Customer", path: "/home/Customer",icon:<RiCustomerService2Fill style={{ marginRight: "2px",fontSize:"20px" ,width:"25px",color:"deepskyblue",code:'Customer' }}/> },
            { name: "Storage Location", path: "/home/StorageLocation" ,icon:<GrStorage style={{ marginRight: "2px",fontSize:"20px" ,width:"25px",color:"gold",code:'StorageLocation' }}/>},
            { name: "Movement Type", path: "/home/Movement_Type",icon:<DriveFileMoveIcon  style={{ marginRight: "2px",fontSize:"22px" ,width:"25px",color:"turquoise",code:'Movement_Type' }}/>},
            { name: "MVT List Item", path: "/home/MVT_LIST_ITEM",icon:<FaTableList style={{ marginRight: "2px",fontSize:"20px" ,width:"25px",color:"crimson",code:'MVT_LIST_ITEM' }}/> },
            { name: "Cost Center", path: "/home/CostCenter",icon:<FaDollarSign style={{ marginRight: "2px",fontSize:"22px" ,width:"25px",color:"darkorange",code:'CostCenter' }}/>},
          ]}
          codeList={[
            'company', 'BusinessDivision', 'Plant', 'Department',
            'UserMaster', 'Role', 'Material', 'Vendor',
            'Customer', 'StorageLocation', 'Movement_Type','MVT_LIST_ITEM','CostCenter'
          ]}
        />


  
        {/* Approval Section */}
        <SidebarSection
          open={open}
          isOpen={Approval}
          toggleSection={toggleApproval}
          icon={<FcApproval style={{ fontSize: "24px" }} />}
          label="Approval"
          links={[
            { name: "309 Approval", path: "/home/Approval_309" ,icon:<MdOutlineApproval  style={{ fontSize: "20px",marginRight: "3px" , color:"rgb(228, 46, 182)",code:'Approval_309'}}/>},

          ]}
          codeList={[
            'Approval_309'
          ]}
        />

        {/* Transactions Section */}
        <SidebarSection
          open={open}
          isOpen={Report}
          toggleSection={toggleReport}
          icon={<ReportIcon />}
          label="Report"
          links={[
            {
              name: "Report 1",
              path: "/home/Report1",
              icon: <ReportIcon style={{ marginRight: "8px", color: "#ffcc00" }}/>,
            },
            {
              name: "Report 2",
              path: "/home/Report2",
              icon: <ReportIcon style={{ marginRight: "8px", color: "#ffcc00" }} />,
            },
          ]}
          codeList={[
            'Report1','Report2'
          ]}
        />
      </div>
    </div>
  );
};

const SidebarSection = ({ open, isOpen, toggleSection, icon, label, links }) => (
  <div style={{ marginBottom: "10px" }}>
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
        {links.map((link, index) => (
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
          >
            {/* Render link icon if available */}
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

export default Sidebar;
