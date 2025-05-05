/* eslint-disable react/jsx-pascal-case */
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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
import Emergency from "./Dashboard/Emergency";
import Rs from "./Dashboard/Rs";
import RGP from "./Dashboard/RGP";
import Stock from "./Dashboard/stock201";
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
import Role from "./Masters/Role";
import Admin from "./Masters/Admin";
import SubMenu from"./Masters/Submenu";
import BusinessDivision from "./Masters/BusinessDivision";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Main />}>
          <Route path="company" element={<Company />} />
          <Route path="BusinessDivision" element={<BusinessDivision />} />
          <Route path="plant" element={<Plant />} />
          <Route path="material" element={<Material />} />
          <Route path="storagelocation" element={<StorageLocation />} />
          <Route path="costcenter" element={<CostCenter />} />
          <Route path="UserMaster" element={<UserMaster />} />
          <Route path="MVT_LIST_ITEM" element={<MVT_LIST_ITEM />} />
          <Route path="Home" element={<DashBoard />} />
          <Route path="dashboard" element={<DashBoard />} />
          <Route path="Department" element={<Department />} />
          <Route path="Vendor" element={<Vendor />} />
          <Route path="Customer" element={<Customer />} />
          <Route path="Movement_Type" element={<Movement_Type />} />
          <Route path="Report1" element={<Report1 />} />
          <Route path="Report2" element={<Report2 />} />
          <Route path="phy" element={<Phy />} />
          <Route path="Emergency" element={<Emergency />} />
          <Route path="Rs" element={<Rs />} />
          <Route path="RGP" element={<RGP />} />
          <Route path="Stock" element={<Stock />} />
          <Route path="Partno" element={<Partno />} />
          <Route path="scrap Disposal" element={<ScrapDisposal />} />
          <Route path="manual" element={<Manual />} />
          <Route path="Production" element={<Production />} />
          <Route path="scrap551" element={<Scrap />} />
          <Route path="Material" element={<Material />} />
          <Route path="SubContracting" element={<SubContracting />} />
          <Route path="Inward" element={<Inward />} />
          <Route path="Location" element={<Location />} />
          <Route path="Role">
            <Route index element={<Role/>} />
            <Route path=":roleId" element={<Admin />} />
            <Route path=":roleId/:menuId" element={<SubMenu />} />
          </Route>
          <Route path="Approval_309" element={<Approval309 />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
