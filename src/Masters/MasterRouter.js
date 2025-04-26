/* eslint-disable react/jsx-pascal-case */
import React, { Children } from 'react'
import Company from './company'
import CostCenter from './CostCenter'
import Material from './Material'
import Plant from './Plant'
import StorageLocation from './StorageLocation'
import Users_details from './Users_details'
import MVT_LIST_ITEM from './MVT_LIST_ITEM'
import Customer from './Customer'
import Department from './Department'
import Movement_Type from './Movement_Type'
import Vendor from './Vendor'
import Role from './Role'
const MasterRouter  = {
  Path: 'Masters',
  Children: [
    {path: 'company', element: <Company/>},
    {path: 'CostCenter', element: <CostCenter/>},
    {path: 'Material', element: <Material/>},
 
    {path: 'MVT_LIST_ITEM', element: <MVT_LIST_ITEM/>},
    {path: 'Plant', element: <Plant/>},
    {path: 'Role', element: <Role/>},
    {path: 'Users_details', element: <Users_details/>},
    {path: 'StorageLocation', element: <StorageLocation/>},
    {path: 'Customer', element: <Customer/>}, 
    {path: 'Department', element: <Department/>},
    {path: 'Movement_Type', element: <Movement_Type/>} ,
    {path: 'Vendor', element: <Vendor/>} 
   

  ]
}

export default MasterRouter
