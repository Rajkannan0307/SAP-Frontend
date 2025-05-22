import { useState, useEffect } from "react";
import { Link,useNavigate } from "react-router-dom";
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
import usePermissions from "../controller/usePermission";
import { decryptSessionData } from "../controller/StorageUtils";
import { FaExchangeAlt } from "react-icons/fa";
import { SiSap } from "react-icons/si";
const Sidebar = ({ setSidebarOpen }) => {
  const [open, setOpen] = useState(false);
  const [Masters, setMasterOpen] = useState(false);
  const [Approval, setApprovalOpen] = useState(false);
  const [Dashboard, setDashboardOpen] = useState(false);
  const [Report, setReportOpen] = useState(false);
  const [SAP, setSapOpen] = useState(false);
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
  
  const Permissions= usePermissions();

  
  
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
  };
   const toggleSAP = () => {
    setSapOpen(!SAP);
     setMasterOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
    setApprovalOpen(false);
  };

  const toggleApproval = () => {
    setApprovalOpen(!Approval);
    setMasterOpen(false);
    setDashboardOpen(false);
    setReportOpen(false);
     setSapOpen(false);
  };

  const toggleReport = () => {
    setReportOpen(!Report);
    setMasterOpen(false);
    setDashboardOpen(false);
    setApprovalOpen(false);
    setSapOpen(false);
  };

  const toggleDashboard = () => {
    setDashboardOpen(!Dashboard);
    setMasterOpen(false);
    setApprovalOpen(false);
    setReportOpen(false);
    setSapOpen(false);
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
      fontSize: "18px",
      margin: "10px 0", // Space above and below
      marginBottom:"16px"
    }}>
    <FaExchangeAlt style={{ color: "turquoise", fontSize: "19px" }} />
    {open && "Transaction"}
  </button>
)}


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
          icon={<PiNuclearPlantFill style={{ color: "lightcoral" }}/>}
          Permissions={Permissions}
          label="Masters"
          links={[
            { name: "Company", path: "/home/company" ,icon:<BusinessIcon style={{ marginRight: "2px" ,color:"yellow",}}/>,code:'company',},
            { name: "Business Division", path: "/home/BusinessDivision" ,icon:<MdBusinessCenter style={{ marginRight: "2px",fontSize:"22px" ,color:"ButtonFace",}}/>,code:'BusinessDivision'},
            { name: "Plant", path: "/home/Plant" ,icon: <GiPlantsAndAnimals style={{ marginRight: "2px",fontSize:"22px",color: "hotpink"  }} /> ,code:'Plant' },
            { name: "Department", path: "/home/Department",icon: <Diversity2Icon style={{ marginRight: "2px",fontSize:"22px",color: "bisque" }} />,code:'Department'  },
            { name: "Login User", path: "/home/UserMaster" ,icon:< AccountCircleIcon style={{ marginRight: "2px", color:"aqua" }}/>,code:'UserMaster'},
            { name: "Role", path: "/home/Role" ,icon:< MdOutlineAdminPanelSettings style={{ marginRight: "2px",width:"25px",fontSize:"24px" ,color:"goldenrod" ,}}/>,code:'Role' },
            { name: "Material", path: "/home/Material" , icon:<AcUnitIcon style={{ marginRight: "2px", color:"greenyellow" ,code:'Material' }}/>,code:'Material'},
            { name: "Vendor", path: "/home/Vendor" ,icon:<FcFactory style={{ marginRight: "2px",fontSize:"24px" ,width:"25px" ,code:'Vendor' }}/>,code:'Vendor'},
            { name: "Customer", path: "/home/Customer",icon:<RiCustomerService2Fill style={{ marginRight: "2px",fontSize:"20px" ,width:"25px",color:"deepskyblue" }}/>,code:'Customer' },
            { name: "Storage Location", path: "/home/StorageLocation" ,icon:<GrStorage style={{ marginRight: "2px",fontSize:"20px" ,width:"25px",color:"gold" }}/>,code:'StorageLocation'},
            { name: "Movement Type", path: "/home/Movement_Type",icon:<DriveFileMoveIcon  style={{ marginRight: "2px",fontSize:"22px" ,width:"25px",color:"turquoise" }}/>,code:'Movement_Type'},
            { name: "MVT List Item", path: "/home/MVT_LIST_ITEM",icon:<FaTableList style={{ marginRight: "2px",fontSize:"20px" ,width:"25px",color:"crimson" }}/>,code:'MVT_LIST_ITEM' },
            { name: "Cost Center", path: "/home/CostCenter",icon:<FaDollarSign style={{ marginRight: "2px",fontSize:"22px" ,width:"25px",color:"darkorange" }}/>,code:'CostCenter'},
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
          Permissions={Permissions}
          label="Approval"
          links={[
            { name: "309 Approval", path: "/home/Approval_309" ,icon:<MdOutlineApproval  style={{ fontSize: "20px",marginRight: "3px" , color:"rgb(228, 46, 182)"}}/>,code:'Approval_309'},
            { name: "201/202 Approval", path: "/home/Approval_201_202" ,icon:<MdOutlineApproval  style={{ fontSize: "20px",marginRight: "3px" , color:"rgb(228, 46, 182)"}}/>,code:'Approval_201_202'},
 
          ]}
          codeList={[
            'Approval_309','Approval_201_202'
          ]}
        />

        {/* Transactions Section */}
        <SidebarSection
          open={open}
          isOpen={Report}
          toggleSection={toggleReport}
          icon={<ReportIcon />}
          Permissions={Permissions}
          label="Report"
          links={[
            {
              name: "Report 1",
              path: "/home/Report1",
              icon: <ReportIcon style={{ marginRight: "8px", color: "#ffcc00" }}/>,
              code:'Report1'
            },
            {
              name: "Report 2",
              path: "/home/Report2",
              icon: <ReportIcon style={{ marginRight: "8px", color: "#ffcc00" }} />,
              code:'Report2'
            },
          ]}
          codeList={[
            'Report1','Report2'
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
      fontSize: "18px",
      margin: "10px 0", // Space above and below
      marginBottom:"16px"
    }}>
    <SiSap style={{ color: "turquoise", fontSize: "35px" }} />
    {open && "SAP LOGIN"}
  </button>
)}
      </div>
    </div>
  );
};

const SidebarSection = ({ open, isOpen, toggleSection, icon, label, links, codeList = [], Permissions = [] }) => {
  // Check if the user has any permissions from this section
  const hasPermission = codeList.some(code => Permissions.includes(code));
  if (!hasPermission) return null;

  const filteredLinks = links.filter(link => {
    // If link.code exists, filter using that, else use link.path as fallback
    return Permissions.includes(link.code || link.path);
  });

  if (filteredLinks.length === 0) return null;

  return (
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
