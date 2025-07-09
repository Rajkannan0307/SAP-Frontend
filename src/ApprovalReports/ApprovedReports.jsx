import React, { useState, useEffect } from 'react';
import {
  Box, Typography, FormControl,
  InputLabel, Select, MenuItem, TextField, Button
} from '@mui/material';
import * as XLSX from 'sheetjs-style';
import { getReportOptions, getReportData, } from '../controller/ApprovalReportsapiservice';


function TabPanel({ children, value, index }) {
  return value === index ? (
    <Box sx={{ pt: 2 }}>{children}</Box>
  ) : null;
}

const ApprovedReports = () => {
  const [tabIndex, setTabIndex] = useState(0);

  // Initialize dropdownValues with empty strings, 3 tabs
  const [dropdownValues, setDropdownValues] = useState(['', '', '']);
  const [fromDates, setFromDates] = useState(['', '', '']);
  const [toDates, setToDates] = useState(['', '', '']);
  const [report, setReport] = useState("");
  const [reportOptions, setReportOptions] = useState([]);


  useEffect(() => {
    get_ReportOptions()
  }, []);


  useEffect(() => {
    getReportOptions()
      .then((data) => {
        setReportOptions(data); // ✅ this will now always be an array
      })
      .catch((err) => {
        console.error('Failed to load report options:', err);
        setReportOptions([]); // fallback
      });
  }, []);


  const handleFromDateChange = (index, value) => {
    const newValues = [...fromDates];
    newValues[index] = value;
    setFromDates(newValues);
  };

  const handleToDateChange = (index, value) => {
    const newValues = [...toDates];
    newValues[index] = value;
    setToDates(newValues);
  };


  const get_ReportOptions = async () => {
    try {
      const response = await getReportOptions();
      console.log('reports', response.data);

      if (response.data?.success && Array.isArray(response.data.data)) {
        setReportOptions(response.data.data); // ✅ Set only the array part
      } else {
        setReportOptions([]); // fallback
      }
    } catch (error) {
      console.error("Error fetching report options:", error);
      setReportOptions([]);
    }
  };

    // Download the data from the trn sap table to particular date

// const handleDownloadReportExcel = async (index) => {
//   const fromDate = fromDates[index];
//   const toDate = toDates[index];
//   const reportType = report; // get selected report type

//   if (!reportType) {
//     alert("Please select a report type.");
//     return;
//   }

//   if (!fromDate) {
//     alert("Select From Date");
//     return;
//   }
//   if (!toDate) {
//     alert("Select To Date");
//     return;
//   }

//   try {
//     const response = await getReportData(reportType, fromDate, toDate); 
//     if (response.status === 400) {
//       alert(`Error: ${response.data.message || 'Invalid input or date range.'}`);
//       return;
//     }

//     const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
//     const fileExtension = ".xlsx";
//     const fileName = "Transaction_Movement_Report";

//     const ws = XLSX.utils.json_to_sheet(response.data);

//     const headers = Object.keys(response.data[0] || {});
//     headers.forEach((_, colIdx) => {
//       const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
//       if (ws[cellAddress]) {
//         ws[cellAddress].s = {
//           font: { bold: true, color: { rgb: "000000" } },
//           fill: { fgColor: { rgb: "FFFF00" } },
//           alignment: { horizontal: "center" },
//         };
//       }
//     });

//     const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

//     const data = new Blob([excelBuffer], { type: fileType });
//     const url = window.URL.createObjectURL(data);
//     const link = document.createElement("a");
//     link.href = url;
//     link.setAttribute("download", fileName + fileExtension);
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);

//     alert("File downloaded successfully!");
//   } catch (error) {
//     console.error("Download failed:", error);
//     if (error.response) {
//       alert(error.response.data.message || "Unknown error from backend");
//     } else if (error.request) {
//       alert("No response from server. Please try again later.");
//     } else {
//       alert(`Error: ${error.message}`);
//     }
//   }
// };


const handleDownloadReportExcel = async (index) => {
  const fromDate = fromDates[index];
  const toDate = toDates[index];
  const reportType = report;

  if (!reportType) {
    alert("Please select a report type.");
    return;
  }

  if (!fromDate || !toDate) {
    alert("Select both From Date and To Date.");
    return;
  }

  try {
    const response = await getReportData(reportType, fromDate, toDate);

    // 🛠 Fix here: extract array from response.data.data
    const reportData = response.data?.data;

    if (!Array.isArray(reportData) || reportData.length === 0) {
      alert("No data available for download.");
      return;
    }

    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    const fileName = "Transaction_Movement_Report";

    const ws = XLSX.utils.json_to_sheet(reportData);

    // Apply header styles
    const headers = Object.keys(reportData[0]);
    headers.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "FFFF00" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const data = new Blob([excelBuffer], { type: fileType });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName + fileExtension);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    alert("File downloaded successfully!");
  } catch (error) {
    console.error("Download failed:", error);
    if (error.response) {
      alert(error.response.data.message || "Unknown error from backend");
    } else if (error.request) {
      alert("No response from server. Please try again later.");
    } else {
      alert(`Error: ${error.message}`);
    }
  }
};


  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10, px: 2, color: 'blue' }}>
      <Box sx={{ width: '100%', maxWidth: 900 }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              display: 'inline-block',
              borderBottom: '4px solid limegreen',
              pb: 0.5,
              color: 'blue',
            }}
          >
            Approved Reports
          </Typography>
        </Box>

        {[0, 1, 2].map(idx => (
          <TabPanel key={idx} value={tabIndex} index={idx}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 2,
                  '& > *': {
                    flex: '1 1 200px',
                    minWidth: 180,
                    maxWidth: 250,
                  },
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>Reports</InputLabel>
                  <Select
                    label="Reports"
                    name="Reports"
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    required
                  >
                    {reportOptions.map((item, index) => (
                      <MenuItem key={index} value={item.label}>{item.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>



                <TextField
                  label="From Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={fromDates[idx]}
                  onChange={e => handleFromDateChange(idx, e.target.value)}
                />

                <TextField
                  label="To Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={toDates[idx]}
                  onChange={e => handleToDateChange(idx, e.target.value)}
                />
              </Box>



<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
  <Button
    variant="contained"
    onClick={() => handleDownloadReportExcel(idx)}
    sx={{
      width: 200,
      height: 50,
      fontSize: '18px',
      backgroundColor: '#1976d2',        // Normal Blue
      '&:hover': {
        backgroundColor: '#115293',      // Hover Dark Blue
      },
      '&:active': {
        backgroundColor: '#0d3c73',      // Click Deep Dark Blue
      },
    }}
  >
    Download
  </Button>
</Box>

            </Box>
          </TabPanel>
        ))}
      </Box>
    </Box>
  );

};

export default ApprovedReports;
