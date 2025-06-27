import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
// import Report309 from './Report309'; // ✅ Import your report components
// import Report310 from './Report310';
// import Report311 from './Report311';

const ApprovedReports = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ width: '100%', mt: 5 }}>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        centered
        variant="fullWidth"
        textColor="primary"
        indicatorColor="secondary"
      >
        <Tab label="Approval 309" />
        <Tab label="Approval 310" />
        <Tab label="Approval 311" />
      </Tabs>

      <Box sx={{ mt: 4 }}>
        {tabIndex === 0 && <Report309 />}
        {tabIndex === 1 && <Report310 />}
        {tabIndex === 2 && <Report311 />}
      </Box>
    </Box>
  );
};

export default ApprovedReports;
