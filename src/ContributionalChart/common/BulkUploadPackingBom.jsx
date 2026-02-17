import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import { CloudUploadIcon } from "lucide-react";
import { useState } from "react";
import { FaDownload, FaUpload } from "react-icons/fa6";
import * as ExcelJS from 'exceljs'
import { PackingBomBulkUploadApi } from "../../controller/ContributionalChartApiService";
import { CCTypeEnum, PriSecriEnum } from "../../common/enumValues";

// type CCType = 'SC' | 'TC' | 'PK';


const getCCtypesData = (CCType) => {
    switch (CCType) {
        case CCTypeEnum.PK:
            return {
                headerColums: [
                    'Plant',
                    'FG_Partno',
                    'Box_Qty',
                    'Child_Part_No',
                    'BOM_Qty',
                    'UOM',
                    'Primary / Secondary',
                    'Effective_Date (dd-mm-yyyy)',
                    'Active_Status'
                ],
                workSheetName: 'PACKAGE_BOM',
                templateFileName: 'PACKAGE_BOM_Template.xlsx',
                applyPriSecri: true,
                activeStatusExcelCode: 'I2:I1000'
            }
        case CCTypeEnum.TC:
            return {
                headerColums: [
                    'Plant',
                    'FG_Partno',
                    'Per_Qty',
                    'Child_Part_No',
                    'BOM_Qty',
                    'UOM',
                    'Effective_Date (dd-mm-yyyy)',
                    'Active_Status'
                ],
                workSheetName: 'TOOLS_AND_SPARES_BOM',
                templateFileName: 'TOOLS_AND_SPARES_BOM_Template.xlsx',
                applyPriSecri: false,
                activeStatusExcelCode: 'H2:H1000'
            }
        case CCTypeEnum.SC:
            return {
                headerColums: [
                    'Plant',
                    'FG_Partno',
                    'Per_Qty',
                    'Child_Part_No',
                    'BOM_Qty',
                    'UOM',
                    'Effective_Date (dd-mm-yyyy)',
                    'Active_Status'
                ],
                workSheetName: 'SUB_CONTRACT_BOM',
                templateFileName: 'SUB_CONTRACT_BOM_Template.xlsx',
                applyPriSecri: false,
                activeStatusExcelCode: 'H2:H1000'
            }
    }
}

const PackingBomBulkUpload = ({
    open,
    onClose,
    onOpen,
    setRefreshData,
    CCType
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [loadingTemplate, setLoadingTemplate] = useState(false)
    const [uploadResponse, setUploadResponse] = useState(null)

    const handleFileChange = (event) => {
        setUploadedFile(event.target.files[0]);
    };

    const handleClose = () => {
        if (onClose) onClose()
        setUploadedFile(null)
        setUploadResponse(null)
        // setIsUploading(false)
        setRefreshData((prev) => !prev)
    }


    async function downloadTemplate() {

        const ccTypesData = getCCtypesData(CCType)

        const headerColumns = ccTypesData.headerColums

        const PriSecriList = [PriSecriEnum.Primary, PriSecriEnum.Secondary]
        const ActiveStatusList = ['Active', 'InActive']

        // 1️⃣ Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "CC_BOM";
        workbook.created = new Date();

        // 2️⃣ Add worksheet
        const worksheet = workbook.addWorksheet(ccTypesData.workSheetName);

        // 3️⃣ Add header row
        worksheet.addRow(headerColumns);

        // 4️⃣ Style header (optional but recommended)
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFADD8E6" },
            };
        });

        // 5️⃣ Set column widths
        worksheet.columns = [
            { width: 15 }, // Plant_Code
            { width: 20 }, // Customer
            { width: 20 }, // FG_Partno
            { width: 12 }, // Per_qty
            { width: 18 }, // Segment
            { width: 18 }, // Line_Name
            { width: 12 }, // PMPD_SMH
            { width: 14 }, // Production
            { width: 14 }, // Inspection
            { width: 14 }, // Packing
            { width: 18 }, // Effective Date
        ];

        // 6️⃣ Freeze header row
        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        if (ccTypesData.applyPriSecri)
            worksheet.dataValidations.add("G2:G1000", {
                type: "list",
                allowBlank: false,
                formulae: [`"${PriSecriList.join(",")}"`],
            });

        worksheet.dataValidations.add(ccTypesData.activeStatusExcelCode, {
            type: "list",
            allowBlank: false,
            formulae: [`"${ActiveStatusList.join(",")}"`],
        });

        // 7️⃣ Write & download file
        const buffer = await workbook.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            ccTypesData.templateFileName
        );
    }


    const handleUploadData = async () => {
        if (!uploadedFile) {
            return alert('Upload file not found')
        }

        if (isUploading) return
        setIsUploading(true)
        try {
            const formData = new FormData()
            const userId = localStorage.getItem('EmpId')
            console.log(userId, 'UserId')
            formData.append("userId", userId)
            formData.append("type", CCType)
            formData.append("file", uploadedFile)
            const response = await PackingBomBulkUploadApi(formData)
            console.log(response.data, "Upload excel response")
            setUploadResponse(response.data)
            alert('File uploaded successfully')
            handleClose()
        } catch (error) {
            console.error("Upload error:", error);

            // ✅ VALIDATION ERROR FROM BACKEND
            if (error.response?.status === 422) {
                setUploadResponse(error.response.data); // <-- show errors in UI
            }
            // ❌ OTHER SERVER ERRORS
            else {
                alert(
                    error.response?.data?.message ||
                    error.message ||
                    "Something went wrong! Try again later."
                );
            }
        }
        setIsUploading(false)
    }

    return (
        <>
            <IconButton
                component="span"
                onClick={() => {
                    if (onOpen) onOpen()
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

            <Modal open={open} onClose={() => { }}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        width: uploadResponse ? "50%" : "30%",
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,

                        maxHeight: "80vh",
                        overflowY: "auto",

                        outline: "none"
                    }}
                >
                    {/* Title */}
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
                        Upload Excel File
                    </Typography>

                    {/* Download Template */}
                    <Button
                        variant="contained"
                        sx={{
                            mb: 2,
                            bgcolor: deepPurple[500],
                            "&:hover": { bgcolor: deepPurple[700] },
                        }}
                        onClick={downloadTemplate}
                    >
                        <FaDownload /> &nbsp; {loadingTemplate ? "Loading..." : "Download Template"}
                    </Button>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        id="excel-upload"
                        hidden
                        onChange={handleFileChange}
                    />

                    {/* Custom File Upload UI */}
                    <label htmlFor="excel-upload">
                        <Box
                            sx={{
                                border: "2px dashed #1976d2",
                                borderRadius: "8px",
                                p: 2,
                                cursor: "pointer",
                                mb: 1,
                                "&:hover": {
                                    backgroundColor: "#f4f6fb",
                                },
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 1
                            }}
                        >
                            <FaUpload />
                            <Typography variant="body2" >
                                {uploadedFile?.name || "Click to choose Excel file"}
                            </Typography>
                        </Box>
                    </label>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 2,
                            my: 3,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleClose}
                            sx={{ width: "30%" }}
                        >
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

                    {/* Upload Status */}
                    {uploadResponse && <ValidationResult response={uploadResponse} />}


                </Box>
            </Modal>
        </>
    );
};


const ValidationResult = ({ response }) => {
    const { summary, errors } = response;

    return (
        <div className="p-4 bg-red-50 rounded-lg border border-red-300">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
                ❌ Upload Failed – Validation Errors
            </h2>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div>Total Rows: <b>{summary.totalRows}</b></div>
                <div className="text-green-600">Valid: <b>{summary.valid}</b></div>
                <div className="text-red-600">Invalid: <b>{summary.invalid}</b></div>
                <div className="text-yellow-600">Empty: <b>{summary.empty}</b></div>
            </div>

            {/* Invalid rows */}
            {errors?.invalidRows?.length > 0 && (
                <>
                    <h3 className="font-semibold mb-2">❌ Invalid Rows</h3>

                    <table className="w-full border text-sm">
                        <thead className="bg-red-100">
                            <tr>
                                <th className="border px-2 py-1">Excel Row</th>
                                <th className="border px-2 py-1">Errors</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errors.invalidRows.map((row, i) => (
                                <tr key={i} className="hover:bg-red-50">
                                    <td className="border px-2 py-1 text-center">
                                        {row.row}
                                    </td>
                                    <td className="border px-2 py-1">
                                        <ul className="list-disc pl-4">
                                            {row.errors.map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Empty rows */}
            {errors?.emptyRows?.length > 0 && (
                <div className="mt-4 text-yellow-700">
                    ⚠ Empty Rows Found: {errors.emptyRows.join(", ")}
                </div>
            )}
        </div>
    );
}


export default PackingBomBulkUpload
