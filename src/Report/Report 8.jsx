
import { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import * as XLSX from "xlsx-js-style";

import { getTransactionData } 
from "../controller/ReportConversionapiservice"; // ✅ change this to the actual file name

const Report8 = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleDownloadReportExcel = async () => {
    if (!fromDate) {
      alert('Select From Date');
      return;
    }
    if (!toDate) {
      alert('Select To Date');
      return;
    }

    try {
      // Call backend API with fromDate and toDate as query params
      const response = await getTransactionData(fromDate, toDate);

      if (response.status === 400) {
        alert(`Error: ${response.data.message || 'Invalid input or date range.'}`);
        return;
      }

      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      const fileExtension = ".xlsx";
      const fileName = "Trn_Rs1_Movement_List";

      // Convert JSON response to worksheet
      const ws = XLSX.utils.json_to_sheet(response.data);

      // Style header row (row 0)
      const headers = Object.keys(response.data[0] || {});
      headers.forEach((_, colIdx) => {
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
            alignment: { horizontal: "center" },
          };
        }
      });

      // Create workbook
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };

      // Write workbook to binary array
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Create Blob and trigger download
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
    <Box
      sx={{
        width: 500,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
        p: 4,
        mx: 'auto',
        mt: 5,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '15px',
        marginTop:"160px"
      }}
    >
      <h3
        style={{
          gridColumn: 'span 2',
          textAlign: 'center',
          marginBottom: '15px',
          color: 'blue',
          textDecoration: 'underline',
          textDecorationColor: 'limegreen',
          textDecorationThickness: '3px',
          textUnderlineOffset: "6px",
        }}

      
      >
      Approval Conversion Excel Download
      </h3>

      <TextField
        label="From Date"
        name="FromDate"
        type="date"
        InputLabelProps={{ shrink: true }}
        fullWidth
        required
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
      />
      <TextField
        label="To Date"
        name="ToDate"
        type="date"
        InputLabelProps={{ shrink: true }}
        fullWidth
        required
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
      />

      <Box
        sx={{
          gridColumn: 'span 2',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginTop: '15px',
        }}
      >
        <Button
          style={{ width: '90px' }}
          variant="contained"
          color="primary"
          onClick={handleDownloadReportExcel}
        >
          Download
        </Button>
      </Box>
    </Box>
  );
};

export default Report8;
