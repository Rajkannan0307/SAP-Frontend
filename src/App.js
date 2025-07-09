/* eslint-disable react/jsx-pascal-case */
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Authentication/AuthContext";
import ProtectedRoute from "./Authentication/ProtectedRoute";

import Material from "./Masters/Material";
import Company from "./Masters/company";
import Plant from "./Masters/Plant";
import StorageLocation from "./Masters/StorageLocation";
import CostCenter from "./Masters/CostCenter";
import MVT_LIST_ITEM from "./Masters/MVT_LIST_ITEM";
import Department from "./Masters/Department";
import Vendor from "./Masters/Vendor";
import Customer from "./Masters/Customer";
import Movement_Type from "./Masters/Movement_Type";
import Main from "./main";
import Phy from "./Dashboard/phy";
import Login from "./components/pages/login";
import DashBoard from "./components/pages/dash";
import Report1 from "./Report/Report 1";
import Report2 from "./Report/Report 2";
import Report3 from "./Report/Report 3";
import Report4 from "./Report/Report 4";
import Report5 from "./Report/Report 5";
import Report6 from "./Report/Report 6";
import Report7 from "./Report/Report 7";
import Report8 from "./Report/Report 8";
import Emergency from "./Dashboard/Emergency";
import ConversionRs1 from "./Dashboard/ConversionRs1";
import RGP from "./Dashboard/RGP";
import Stock201 from "./Dashboard/stock201";
import Stock202 from "./Dashboard/stock202";
import Partno from "./Dashboard/Partno";
import ScrapDisposal from "./Dashboard/scrap disposal";
import Manual from "./Dashboard/Manual";
import Production from "./Dashboard/Production";
import Scrap from "./Dashboard/scrap551";
import SubContracting from "./Dashboard/SubContracting";
import Inward from "./Dashboard/Inward";
import Location from "./Dashboard/Location";
import UserMaster from "./Masters/UserMaster";
import Approval309 from "./Approval/309_Approval";
import Approval201 from "./Approval/201_Approval";
import Approval202 from "./Approval/202_Approval";
import Approval551 from "./Approval/551_Approval";
import Approval311 from "./Approval/311_Approval";
import ApprovalRs1 from "./Approval/Rs1_Approval";

//import ApprovedReports from "./ApprovalReports/ApprovedReports";

import ApprovedReports from './ApprovalReports/ApprovedReports';

import Role from "./Masters/Role";
import Admin from "./Masters/Admin";
import SubMenu from "./Masters/Submenu";
import BusinessDivision from "./Masters/BusinessDivision";
import Home from "./components/pages/Home";
import ApproverHome from "./components/pages/ApproverHome";
import SAP from "./Sap User Access/Sap"
import ValuationType from "./Masters/ValuationType";
import Service from "./Dashboard/service";
import Purchase from "./Dashboard/Purchase";
import InwardApproval from "./Approval/InwardApproval"
import EmergencyApproval from "./Approval/EmergencyProcurementAprroval"
import SupvCode from "./Masters/SupvCode"
import Module from "./Masters/Module"
import Line from "./Masters/Line"
import ProductionPlan from "./Production plan/ProductionPlan"
import StoreDashboard from "./Store Dashboard/StoreDashboard"
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          <Route path="/" element={<Login />} />

          {/* Protected Routes with Role-Based Access */}
          <Route path="/home" element={<ProtectedRoute><Main /></ProtectedRoute>}>
            <Route path="company" element={<ProtectedRoute screenId={1}><Company /></ProtectedRoute>} />
            <Route path="BusinessDivision" element={<ProtectedRoute screenId={2}><BusinessDivision /></ProtectedRoute>} />
            <Route path="plant" element={<ProtectedRoute screenId={3}><Plant /></ProtectedRoute>} />
            <Route path="Department" element={<ProtectedRoute screenId={4}><Department /></ProtectedRoute>} />
            <Route path="UserMaster" element={<ProtectedRoute screenId={5}><UserMaster /></ProtectedRoute>} />
            <Route path="Role" element={<ProtectedRoute screenId={6}><Role /></ProtectedRoute>} />
            <Route path="material" element={<ProtectedRoute screenId={7}><Material /></ProtectedRoute>} />
            <Route path="Vendor" element={<ProtectedRoute screenId={8}><Vendor /></ProtectedRoute>} />
            <Route path="Customer" element={<ProtectedRoute screenId={9}><Customer /></ProtectedRoute>} />
            <Route path="StorageLocation" element={<ProtectedRoute screenId={10}><StorageLocation /></ProtectedRoute>} />
            <Route path="SupvCode" element={<ProtectedRoute screenId={24}><SupvCode /></ProtectedRoute>} />
            <Route path="Module" element={<ProtectedRoute screenId={25}><Module /></ProtectedRoute>} />
            <Route path="Line" element={<ProtectedRoute screenId={28}><Line /></ProtectedRoute>} />
            <Route path="ProductionPlan" element={<ProtectedRoute ><ProductionPlan screenId={32} /></ProtectedRoute>} />
            <Route path="StoreDashboard" element={<ProtectedRoute ><StoreDashboard screenId={31} /></ProtectedRoute>} />
            <Route path="Movement_Type" element={<ProtectedRoute screenId={11}><Movement_Type /></ProtectedRoute>} />
            <Route path="MVT_LIST_ITEM" element={<ProtectedRoute screenId={12}><MVT_LIST_ITEM /></ProtectedRoute>} />
            <Route path="CostCenter" element={<ProtectedRoute screenId={13}><CostCenter /></ProtectedRoute>} />

            <Route path="Approval_309" element={<ProtectedRoute screenId={14}><Approval309 /></ProtectedRoute>} />
            <Route path="Approval_201" element={<ProtectedRoute screenId={19}><Approval201 /></ProtectedRoute>} />
            <Route path="Approval_202" element={<ProtectedRoute screenId={20}><Approval202 /></ProtectedRoute>} />
            <Route path="Approval_551" element={<ProtectedRoute screenId={26}><Approval551 /></ProtectedRoute>} />
            <Route path="Approval_311" element={<ProtectedRoute screenId={27}><Approval311 /></ProtectedRoute>} />
            <Route path="Approval_Rs1" element={<ProtectedRoute screenId={33}><ApprovalRs1 /></ProtectedRoute>} />

            <Route path="dashboard" element={<ProtectedRoute screenId={15}><DashBoard /></ProtectedRoute>} />
            <Route path="Report1" element={<ProtectedRoute screenId={16}><Report1 /></ProtectedRoute>} />
            <Route path="Report2" element={<ProtectedRoute screenId={17}><Report2 /></ProtectedRoute>} />
            <Route path="Report3" element={<ProtectedRoute screenId={16}><Report3 /></ProtectedRoute>} />
            <Route path="Report4" element={<ProtectedRoute screenId={17}><Report4 /></ProtectedRoute>} />
            <Route path="Report5" element={<ProtectedRoute screenId={16}><Report5 /></ProtectedRoute>} />
            <Route path="Report6" element={<ProtectedRoute screenId={17}><Report6 /></ProtectedRoute>} />
            <Route path="Report7" element={<ProtectedRoute screenId={16}><Report7 /></ProtectedRoute>} />
          <Route path="Report8" element={<ProtectedRoute screenId={17}><Report8 /></ProtectedRoute>} />

          <Route path="ApprovalReports" element={<ProtectedRoute screenId={34}><ApprovedReports /></ProtectedRoute>} /> 

            <Route path="phy" element={<ProtectedRoute><Phy /></ProtectedRoute>} />
            <Route path="Emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
            <Route path="RGP" element={<ProtectedRoute><RGP /></ProtectedRoute>} />


            <Route path="Stock201" element={<ProtectedRoute><Stock201 /></ProtectedRoute>} />
            <Route path="Stock202" element={<ProtectedRoute><Stock202 /></ProtectedRoute>} />
            <Route path="Partno" element={<ProtectedRoute><Partno /></ProtectedRoute>} />
            <Route path="scrap Disposal" element={<ProtectedRoute><ScrapDisposal /></ProtectedRoute>} />
            <Route path="manual" element={<ProtectedRoute><Manual /></ProtectedRoute>} />
            <Route path="Production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
            <Route path="scrap551" element={<ProtectedRoute><Scrap /></ProtectedRoute>} />

            <Route path="ConversionRs1" element={<ProtectedRoute><ConversionRs1 /></ProtectedRoute>} />
            <Route path="SubContracting" element={<ProtectedRoute><SubContracting /></ProtectedRoute>} />
            <Route path="Inward" element={<ProtectedRoute><Inward /></ProtectedRoute>} />
            <Route path="Location" element={<ProtectedRoute><Location /></ProtectedRoute>} />
            <Route path="SAP" element={<ProtectedRoute screenId={18}><SAP /></ProtectedRoute>} />
            <Route path="ValuationType" element={<ProtectedRoute screenId={21}><ValuationType /></ProtectedRoute>} />
            <Route path="Purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
            <Route path="Service" element={<ProtectedRoute><Service /></ProtectedRoute>} />
            <Route path="InwardApproval" element={<ProtectedRoute screenId={22}><InwardApproval /></ProtectedRoute>} />
            <Route path="EmergencyApproval" element={<ProtectedRoute screenId={23}><EmergencyApproval /></ProtectedRoute>} />
            <Route path="Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="HomePage" element={<ProtectedRoute><ApproverHome /></ProtectedRoute>} />
            {/* Role Management */}
            <Route path="Role/:roleId" element={<ProtectedRoute screenId={6}><Admin /></ProtectedRoute>} />
            <Route path="Role/:roleId/:menuId" element={<ProtectedRoute screenId={6}><SubMenu /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
