import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import { CloudUploadIcon } from "lucide-react";
import { useState } from "react";
import { FaDownload, FaUpload } from "react-icons/fa6";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { MfgBomBulkUploadApi } from "../controller/MfgBomApiService";
import { getPlantdetails } from "../controller/CommonApiService";
import { getdetails as getOperations } from "../controller/OperationMasterapiservice";
import { getdetails as getValuations } from "../controller/ValuationTypeMasterapiservice";
import { getProductdetails } from "../controller/PMPDApiService";
import ValidationResponseGrid from "../components/ValidationResponseTable";

const OPERATION_NO_LIST = Array.from({ length: 20 }, (_, i) => `${(i + 1) * 10}`);

const HEADER_COLUMNS = [
  "Plant",
  "FG_Part_No",
  "Part_Name",
  "Part_No",
  "Operation_No",
  "Operation_Name",
  "Valuation_Class",
  "Vendor_Code",
  "Active_Status",
];

const MfgBomBulkUpload = ({ open, onClose, onOpen, setRefreshData }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);

  const handleFileChange = (event) => {
    setUploadedFile(event.target.files[0]);
  };

  const handleClose = () => {
    if (onClose) onClose();
    setUploadedFile(null);
    setUploadResponse(null);
    setRefreshData((prev) => !prev);
  };

  const downloadTemplate = async () => {
    const [plants, operations, valuations, products] = await Promise.all([
      getPlantdetails(),
      getOperations(),
      getValuations(),
      getProductdetails(),
    ]);

    const plantCodeList = (plants || []).map((p) => `${p.Plant_Code}`);
    const operationNameList = (operations || []).filter((o) => o.status).map((o) => o.opt_name);
    const valuationList = (valuations || []).map((v) => v.Valuation_Name);
    const productNameList = (products || []).filter((p) => p.Active_Status).map((p) => p.Name);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MFG_BOM";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("MFG_BOM");
    worksheet.addRow(HEADER_COLUMNS);
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFADD8E6" } };
    });
    worksheet.columns = HEADER_COLUMNS.map(() => ({ width: 18 }));
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Plant
    worksheet.dataValidations.add("A2:A1000", {
      type: "list",
      allowBlank: false,
      formulae: [`"${plantCodeList.join(",")}"`],
    });

    // Part Name (Product)
    worksheet.dataValidations.add("C2:C1000", {
      type: "list",
      allowBlank: false,
      formulae: [`"${productNameList.join(",")}"`],
    });

    // Operation No
    worksheet.dataValidations.add("E2:E1000", {
      type: "list",
      allowBlank: false,
      formulae: [`"${OPERATION_NO_LIST.join(",")}"`],
    });

    // Operation Name
    worksheet.dataValidations.add("F2:F1000", {
      type: "list",
      allowBlank: false,
      formulae: [`"${operationNameList.join(",")}"`],
    });

    // Valuation / Procurement Type
    worksheet.dataValidations.add("G2:G1000", {
      type: "list",
      allowBlank: false,
      formulae: [`"${valuationList.join(",")}"`],
    });

    // Active Status
    worksheet.dataValidations.add("I2:I1000", {
      type: "list",
      allowBlank: false,
      formulae: ['"Active,Inactive"'],
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "MFG_BOM_Template.xlsx"
    );
  };

  const handleUploadData = async () => {
    if (!uploadedFile) {
      return alert("Upload file not found");
    }
    if (isUploading) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      const userId = localStorage.getItem("EmpId");
      formData.append("userId", userId);
      formData.append("file", uploadedFile);
      const response = await MfgBomBulkUploadApi(formData);
      setUploadResponse(response.data);
      alert("File uploaded successfully");
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      if (error.response?.status === 422) {
        setUploadResponse(error.response.data);
      } else {
        alert(error.response?.data?.message || error.message || "Something went wrong! Try again later.");
      }
    }
    setIsUploading(false);
  };

  return (
    <>
      <IconButton
        component="span"
        onClick={() => {
          if (onOpen) onOpen();
        }}
        style={{
          borderRadius: "50%",
          backgroundColor: "#FF6699",
          color: "white",
          width: "40px",
          height: "40px",
        }}
      >
        <CloudUploadIcon />
      </IconButton>

      <Modal open={open} onClose={() => {}}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            width: uploadResponse ? "60%" : "30%",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            maxHeight: "80vh",
            overflowY: "auto",
            outline: "none",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "#2e59d9",
              textDecoration: "underline",
              textDecorationColor: "#88c57a",
              textDecorationThickness: "3px",
            }}
          >
            Upload MFG BOM Excel File
          </Typography>

          <Button
            variant="contained"
            sx={{ mb: 2, bgcolor: deepPurple[500], "&:hover": { bgcolor: deepPurple[700] } }}
            onClick={downloadTemplate}
          >
            <FaDownload /> &nbsp; Download Template
          </Button>

          <input type="file" accept=".xlsx,.xls" id="mfg-bom-excel-upload" hidden onChange={handleFileChange} />

          <label htmlFor="mfg-bom-excel-upload">
            <Box
              sx={{
                border: "2px dashed #1976d2",
                borderRadius: "8px",
                p: 2,
                cursor: "pointer",
                mb: 1,
                "&:hover": { backgroundColor: "#f4f6fb" },
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
              }}
            >
              <FaUpload />
              <Typography variant="body2">{uploadedFile?.name || "Click to choose Excel file"}</Typography>
            </Box>
          </label>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, my: 3 }}>
            <Button variant="contained" color="error" onClick={handleClose} sx={{ width: "30%" }}>
              Close
            </Button>
            <Button
              variant="contained"
              onClick={handleUploadData}
              disabled={isUploading}
              sx={{ width: "30%" }}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </Box>

          {uploadResponse && <ValidationResponseGrid response={uploadResponse} />}
        </Box>
      </Modal>
    </>
  );
};

export default MfgBomBulkUpload;
