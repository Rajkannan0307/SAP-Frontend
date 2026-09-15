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
import Mst_Operation from "./Masters/Mst_Operation"
import MFG_BOM from "./MFG_Availability"
import PlantStock from "./MFG_Availability/PlantStock"
import SupplierStock from "./MFG_Availability/SupplierStock"
import MatAvailabilityStatus from "./MFG_Availability/MatAvailabilityStatus"
import ProductionPlan from "./Production plan/ProductionPlan"
import StoreDashboard from "./Store Dashboard/StoreDashboard"
import Store1 from "./StoreUrl/store1url"
import MaterialStatus from "./Dashboard/MaterialStatus"
import Landing from "./components/pages/landing";
import TestLabScreen from "./TestLab/TestLab";
import TestLabDashboard from "./TestLab/dashboard";
import TestLabViewDashboard from "./TestLab/dashboard/TestLabViewDashboard";
import RigMonthlyStatus from "./TestLab/RigMonthlyStatus";
import MstRigTestSpecScreen from "./Masters/RigTestSpec";
import MachineScreen from "./Masters/Machine";
import ProductScreen from "./Masters/Product";
import ProductSegmentScreen from "./Masters/ProductSegment";
import ProductMappingScreen from "./Masters/ProductMapping";
import PMPD_ProductionPlan from "./PMPD/ProductionPlan";
import PMPD_MasterScreen from "./PMPD/PMPD_Master";
import PMPD_Report from "./PMPD/PMPD_Report";
import CategoryBreakupScreen from "./Masters/CategoryBreakup";
import IndirectManpowerScreen from "./PMPD/Indirect_Manpower";
import IndirectCategoryScreen from "./Masters/IndirectCategory";
import PMPD_ActualProductionPlan from "./PMPD/ActualProductionPlan";
import PMDP_PlanVsActual from "./PMPD/PMPD_PlanVsActual";
import PMDP_PlanVsActual_Indirect from './PMPD/PMPD_PlanVsActual_Indirect'
import PMPD_FixedManpower from "./Masters/PMPD_FixedManpower";
import CC_PackingBOM from "./ContributionalChart/PackingBom";
import CC_PackingBomPart from "./Masters/PackingBomPart";
import CC_SubContractScreen from "./ContributionalChart/SubContract";
import CC_StoresAndSparesScreen from "./ContributionalChart/StoresAndSpares";
import CC_ActualConsumptionPlan from "./ContributionalChart/ActualConsumption";
import CC_IndirectMaterialPrice from "./ContributionalChart/IndirectMaterialPrice";
import CC_DCM_Output from "./ContributionalChart/DCM_Output";
import CC_PowerUnit from "./Masters/PowerUnit";
import CC_DailyPowerConsumption from "./ContributionalChart/DailyPowerConsumption";
import CC_PowerMixRatio from "./ContributionalChart/PowerMixRatio";
import CC_ReturnablePackage from "./ContributionalChart/ReturnablePackage";
import CC_MstRejection from "./ContributionalChart/MstRejection";
import CC_RejectionActual from "./ContributionalChart/RejectionActual";
import InhouseCapacity from "./PMPD/InhouseCapacity";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          <Route path="/" element={<Landing />} />
          <Route path="Store/:plantCode/:storageCodes" element={<Store1 />} />


          {/* Protected Routes with Role-Based Access */}
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<ProtectedRoute><Main /></ProtectedRoute>}>
            <Route path="company" element={<ProtectedRoute screenCode="company"><Company /></ProtectedRoute>} />
            <Route path="BusinessDivision" element={<ProtectedRoute screenCode="BusinessDivision"><BusinessDivision /></ProtectedRoute>} />
            <Route path="plant" element={<ProtectedRoute screenCode="Plant"><Plant /></ProtectedRoute>} />
            <Route path="Department" element={<ProtectedRoute screenCode="Department"><Department /></ProtectedRoute>} />
            <Route path="UserMaster" element={<ProtectedRoute screenCode="UserMaster"><UserMaster /></ProtectedRoute>} />
            <Route path="Role" element={<ProtectedRoute screenCode="Role"><Role /></ProtectedRoute>} />
            <Route path="material" element={<ProtectedRoute screenCode="Material"><Material /></ProtectedRoute>} />
            <Route path="Vendor" element={<ProtectedRoute screenCode="Vendor"><Vendor /></ProtectedRoute>} />
            <Route path="Customer" element={<ProtectedRoute screenCode="Customer"><Customer /></ProtectedRoute>} />
            <Route path="StorageLocation" element={<ProtectedRoute screenCode="StorageLocation"><StorageLocation /></ProtectedRoute>} />
            <Route path="SupvCode" element={<ProtectedRoute screenCode="SupvCode"><SupvCode /></ProtectedRoute>} />
            <Route path="Module" element={<ProtectedRoute screenCode="Module"><Module /></ProtectedRoute>} />
            <Route path="Line" element={<ProtectedRoute screenCode="Line"><Line /></ProtectedRoute>} />
            <Route path="Mst_Operation" element={<ProtectedRoute screenCode="Mst_Operation"><Mst_Operation /></ProtectedRoute>} />
            <Route path="MFG_BOM" element={<ProtectedRoute screenCode="MFG_BOM"><MFG_BOM /></ProtectedRoute>} />
            <Route path="PlantStock" element={<ProtectedRoute screenCode="PlantStock"><PlantStock /></ProtectedRoute>} />
            <Route path="SupplierStock" element={<ProtectedRoute screenCode="SupplierStock"><SupplierStock /></ProtectedRoute>} />
            <Route path="MatAvailabilityStatus" element={<ProtectedRoute screenCode="MatAvailabilityStatus"><MatAvailabilityStatus /></ProtectedRoute>} />
            <Route path="ProductionPlan" element={<ProtectedRoute ><ProductionPlan screenId={32} /></ProtectedRoute>} />
            <Route path="StoreDashboard" element={<ProtectedRoute ><StoreDashboard screenId={31} /></ProtectedRoute>} />
            <Route path="Movement_Type" element={<ProtectedRoute screenCode="Movement_Type"><Movement_Type /></ProtectedRoute>} />
            <Route path="MVT_LIST_ITEM" element={<ProtectedRoute screenCode="MVT_LIST_ITEM"><MVT_LIST_ITEM /></ProtectedRoute>} />
            <Route path="CostCenter" element={<ProtectedRoute screenCode="CostCenter"><CostCenter /></ProtectedRoute>} />
            <Route path="Approval_309" element={<ProtectedRoute screenCode="Approval_309"><Approval309 /></ProtectedRoute>} />
            <Route path="Approval_201" element={<ProtectedRoute screenCode="Approval_201"><Approval201 /></ProtectedRoute>} />
            <Route path="Approval_202" element={<ProtectedRoute screenCode="Approval_202"><Approval202 /></ProtectedRoute>} />
            <Route path="Approval_551" element={<ProtectedRoute screenCode="Approval_551"><Approval551 /></ProtectedRoute>} />
            <Route path="Approval_311" element={<ProtectedRoute screenCode="Approval_551"><Approval311 /></ProtectedRoute>} />
            <Route path="Approval_Rs1" element={<ProtectedRoute screenCode="ApprovalRs1"><ApprovalRs1 /></ProtectedRoute>} />
            <Route path="RigTestSpec" element={<ProtectedRoute screenCode="RigTestSpec"><MstRigTestSpecScreen /></ProtectedRoute>} />
            <Route path="Machine" element={<ProtectedRoute screenCode="Machine"><MachineScreen /></ProtectedRoute>} />
            {/* PMPD */}
            <Route path="Product" element={<ProtectedRoute screenCode="Product"><ProductScreen /></ProtectedRoute>} />
            <Route path="ProductSegmentScreen" element={<ProtectedRoute screenCode="ProductSegment"><ProductSegmentScreen /></ProtectedRoute>} />
            <Route path="ProductMappingScreen" element={<ProtectedRoute screenCode="ProductMapping"><ProductMappingScreen /></ProtectedRoute>} />
            <Route path="CategoryBreakup" element={<ProtectedRoute screenCode="CategoryBreakups"><CategoryBreakupScreen /></ProtectedRoute>} />
            <Route path="IndirectCategory" element={<ProtectedRoute screenCode="IndirectCategory"><IndirectCategoryScreen /></ProtectedRoute>} />
            <Route path="PMPD_FixedManpower" element={<ProtectedRoute screenCode="PMPD_FixedManpower"><PMPD_FixedManpower /></ProtectedRoute>} />


            <Route path="dashboard" element={<ProtectedRoute screenCode="dashboard"><DashBoard /></ProtectedRoute>} />
            <Route path="Report1" element={<ProtectedRoute screenCode="Report1"><Report1 /></ProtectedRoute>} />
            <Route path="Report2" element={<ProtectedRoute screenCode="Report2"><Report2 /></ProtectedRoute>} />
            <Route path="Report3" element={<ProtectedRoute screenCode="Report3"><Report3 /></ProtectedRoute>} />
            <Route path="Report4" element={<ProtectedRoute screenCode="Report4"><Report4 /></ProtectedRoute>} />
            <Route path="Report5" element={<ProtectedRoute screenCode="Report5"><Report5 /></ProtectedRoute>} />
            <Route path="Report6" element={<ProtectedRoute screenCode="Report6"><Report6 /></ProtectedRoute>} />
            <Route path="Report7" element={<ProtectedRoute screenCode="Report7"><Report7 /></ProtectedRoute>} />
            <Route path="Report8" element={<ProtectedRoute screenCode="Report8"><Report8 /></ProtectedRoute>} />

            <Route path="ApprovalReports" element={<ProtectedRoute screenCode="ApprovedReports"><ApprovedReports /></ProtectedRoute>} />

            <Route path="phy" element={<ProtectedRoute><Phy /></ProtectedRoute>} />
            <Route path="Emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
            <Route path="RGP" element={<ProtectedRoute><RGP /></ProtectedRoute>} />
            <Route path="MaterialStatus" element={<ProtectedRoute><MaterialStatus /></ProtectedRoute>} />


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
            <Route path="SAP" element={<ProtectedRoute screenCode="sap"><SAP /></ProtectedRoute>} />
            <Route path="ValuationType" element={<ProtectedRoute screenCode="ValuationType"><ValuationType /></ProtectedRoute>} />
            <Route path="Purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
            <Route path="Service" element={<ProtectedRoute><Service /></ProtectedRoute>} />
            <Route path="InwardApproval" element={<ProtectedRoute screenCode="InwardApproval"><InwardApproval /></ProtectedRoute>} />
            <Route path="EmergencyApproval" element={<ProtectedRoute screenCode="EmergencyApproval"><EmergencyApproval /></ProtectedRoute>} />
            <Route path="Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="HomePage" element={<ProtectedRoute><ApproverHome /></ProtectedRoute>} />
            {/* Role Management */}
            <Route path="Role/:roleId" element={<ProtectedRoute screenCode="Role"><Admin /></ProtectedRoute>} />
            <Route path="Role/:roleId/:menuId" element={<ProtectedRoute screenCode="Role"><SubMenu /></ProtectedRoute>} />

            <Route path="start_testing" element={<ProtectedRoute screenCode="StartTesting"><TestLabScreen /></ProtectedRoute>} />
            <Route path="testLabDashbaord" element={<ProtectedRoute screenCode="RigStatus"><TestLabDashboard /></ProtectedRoute>} />
            <Route path="rigMonthlyStatus" element={<ProtectedRoute screenCode="RigMonthlyStatus"><RigMonthlyStatus /></ProtectedRoute>} />
            <Route path="testLabDashbaord/:machineId" element={<TestLabViewDashboard />} />


            {/* PMPD */}
            <Route path="PMPD_ProductionPlan" element={<ProtectedRoute screenCode="ProductionPlan"><PMPD_ProductionPlan /></ProtectedRoute>} />
            <Route path="PMPD_Master" element={<ProtectedRoute screenCode="PMPD_Master"><PMPD_MasterScreen /></ProtectedRoute>} />
            <Route path="PMPD_Report" element={<ProtectedRoute screenCode="PMPD_Report"><PMPD_Report /></ProtectedRoute>} />
            <Route path="PMPD_IndirectManpower" element={<ProtectedRoute screenCode="PMPD_IndirectManpower"><IndirectManpowerScreen /></ProtectedRoute>} />
            <Route path="PMPD_ActualProductionPlan" element={<ProtectedRoute screenCode="PMPD_ActualProductionPlan"><PMPD_ActualProductionPlan /></ProtectedRoute>} />
            <Route path="PMDP_PlanVsActual" element={<ProtectedRoute screenCode="PMDP_PlanVsActual"><PMDP_PlanVsActual /></ProtectedRoute>} />
            <Route path="PMDP_PlanVsActual_Indirect" element={<ProtectedRoute screenCode="PMDP_PlanVsActual_Indirect"><PMDP_PlanVsActual_Indirect /></ProtectedRoute>} />
            <Route path="Inhouse_capacity" element={<ProtectedRoute screenCode="Inhouse_capacity"><InhouseCapacity /></ProtectedRoute>} />


            {/* CONTRIBUTIONAL CHART */}
            <Route path="CC_PackingBOM" element={<ProtectedRoute screenCode="CC_PackingBOM"><CC_PackingBOM /></ProtectedRoute>} />
            <Route path="CC_PackingBomPart" element={<ProtectedRoute screenCode="Indirect_Material"><CC_PackingBomPart /></ProtectedRoute>} />
            <Route path="CC_StoresAndSparesScreen" element={<ProtectedRoute screenCode="CC_StoresAndSpares"><CC_StoresAndSparesScreen /></ProtectedRoute>} />
            <Route path="CC_SubContractScreen" element={<ProtectedRoute screenCode="CC_SubContract"><CC_SubContractScreen /></ProtectedRoute>} />
            <Route path="CC_ActualConsumptionPlan" element={<ProtectedRoute screenCode="CC_ActualConsumptionPlan"><CC_ActualConsumptionPlan /></ProtectedRoute>} />
            <Route path="CC_IndirectMaterialPrice" element={<ProtectedRoute screenCode="CC_MaterialPrice"><CC_IndirectMaterialPrice /></ProtectedRoute>} />
            <Route path="CC_DCM_Output" element={<ProtectedRoute screenCode="CC_DCM_Output"><CC_DCM_Output /></ProtectedRoute>} />

            <Route path="CC_Power_Unit" element={<ProtectedRoute screenCode="PowerUnit"><CC_PowerUnit /></ProtectedRoute>} />
            <Route path="CC_DailyPowerConsumption" element={<ProtectedRoute screenCode="DailyPowerConsumption"><CC_DailyPowerConsumption /></ProtectedRoute>} />
            <Route path="CC_PowerMixRatio" element={<ProtectedRoute screenCode="PowerMixRatio"><CC_PowerMixRatio /></ProtectedRoute>} />

            <Route path="CC_ReturnablePackage" element={<ProtectedRoute screenCode="CC_ReturnablePackage"><CC_ReturnablePackage /></ProtectedRoute>} />
            <Route path="CC_MstRejection" element={<ProtectedRoute screenCode="CC_MstRejection"><CC_MstRejection /></ProtectedRoute>} />
            <Route path="CC_RejectionActual" element={<ProtectedRoute screenCode="CC_RejectionActual"><CC_RejectionActual /></ProtectedRoute>} />

          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;







