
import React, { Children } from 'react'
import Phy from './phy'
import Emergency from './Emergency'
import Rs from './Rs'
import RGP from './RGP'
import Production from './Production'
import Inward from './Inward'
import Location from './Location'
import Manual from './Manual'
import Partno from './Partno'
import ScrapDisposal from './scrap disposal'
import Stock201 from './stock201'
import Stock202 from './stock202'
import Scrap from './scrap551'
import MaterialStatus from './MaterialStatus'
import SubContracting from './SubContracting'
const Dashboardrouter =  {
    Path: 'Dashboard',
    Children: [
      {path: 'phy', element:<Phy/>},
      {path: 'Emergency', element:<Emergency/>},
      {path: 'Rs', element:<Rs/>},
      {path: 'RGP', element:<RGP/>},
      {path: 'Production', element:<Production/>},
      {path: 'Inward', element:<Inward/>},
      {path: 'Location', element:<Location/>},
      {path: 'Manual', element:<Manual/>},
      {path: 'Stock201', element:<Stock201 />},
      {path: 'Stock202', element:<Stock202 />},
      {path: 'Partno', element:<Partno/>},
      {path: 'scrap disposal', element:<ScrapDisposal/>},
      {path: 'scrap551', element:<Scrap/>},
      {path: 'Material', element:<MaterialStatus/>},
      {path: 'SubContracting', element:<SubContracting/>},

       
     
  
    ]
  }

export default Dashboardrouter
