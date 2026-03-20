import * as XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";


export const exportToExcelDownload = ({
    sheets = [],         // [{ name: "Sheet1", data: [] }]
    fileName = "Report",
}) => {
    if (!sheets.length) {
        alert("No data available to download.");
        return;
    }

    // Keep only sheets with data
    const validSheets = sheets.filter(
        s => s.data && s.data.length > 0
    );

    if (validSheets.length === 0) {
        alert("No data available to download.");
        return;
    }


    const fileType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

    const wb = XLSX.utils.book_new();

    validSheets.forEach((sheet) => {
        if (!sheet.data || sheet.data.length === 0) return;

        const ws = XLSX.utils.json_to_sheet(sheet.data);

        // Style header row
        const headers = Object.keys(sheet.data[0]);
        headers.forEach((_, colIdx) => {
            const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });

            if (ws[cellAddress]) {
                ws[cellAddress].s = {
                    font: { bold: true },
                    alignment: { horizontal: "center" },
                };
            }
        });

        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
    });

    const blob = new Blob([excelBuffer], { type: fileType });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};



/**
 * Utility: Generate Excel Template with optional dropdown validations
 *
 * This function creates a downloadable Excel template file using ExcelJS.
 * It supports:
 *  - Dynamic column headers
 *  - Custom column widths
 *  - Dropdown list validations for specific columns
 *  - Styled header row
 *  - Frozen header for easier scrolling
 *
 * ------------------------------------------------------------
 * Parameters
 * ------------------------------------------------------------
 * @param {string} fileName
 *      Name of the downloaded Excel file
 *
 * @param {string} sheetName
 *      Worksheet name inside the Excel file
 *
 * @param {Array<string>} headers
 *      Column headers to display in row 1
 *
 * @param {Array<number>} columnWidths
 *      Optional widths for each column (index-based).
 *      If not provided, default width = 20
 *
 * @param {Array<Object>} dropdowns
 *      Optional dropdown validation configuration
 *
 *      Example structure:
 *      [
 *          {
 *              column: "E",           // Excel column letter
 *              startRow: 2,           // default = 2
 *              endRow: 1000,          // default = 1000
 *              values: ["Yes","No"],  // dropdown options
 *              allowBlank: false      // optional
 *          }
 *      ]
 *
 * ------------------------------------------------------------
 * Example Usage
 * ------------------------------------------------------------
 *
 * generateExcelTemplate({
 *     fileName: "PowerUnitTemplate.xlsx",
 *     sheetName: "Power Unit",
 *     headers: [
 *         "Plant",
 *         "Part_No",
 *         "Unit_Per_Part",
 *         "Eff_Date (dd-MM-yyyy)"
 *     ],
 *     columnWidths: [15, 20, 25, 25],
 *     dropdowns: [
 *         {
 *             column: "A",
 *             values: ["1001","1002","1003"]
 *         },
 *         {
 *             column: "D",
 *             values: ["01-01-2026","01-02-2026"]
 *         }
 *     ]
 * });
 */
export const generateExcelTemplate = async ({
    fileName = "Template.xlsx",
    sheetName = "Sheet1",
    headers = [],
    columnWidths = [],
    dropdowns = []
}) => {
    try {

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "SYSTEM";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(sheetName);

        /* ---------------- Header ---------------- */

        worksheet.addRow(headers);

        const headerRow = worksheet.getRow(1);

        headerRow.font = { bold: true };

        headerRow.alignment = {
            vertical: "middle",
            horizontal: "center"
        };

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFADD8E6" }
            };

            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
        });

        /* ---------------- Column Width ---------------- */

        worksheet.columns = headers.map((_, i) => ({
            width: columnWidths?.[i] || 20
        }));

        /* ---------------- Dropdowns ---------------- */

        dropdowns.forEach((dd) => {

            const range = `${dd.column}${dd.startRow || 2}:${dd.column}${dd.endRow || 1000}`;

            worksheet.dataValidations.add(range, {
                type: "list",
                allowBlank: dd.allowBlank ?? false,
                formulae: [`"${dd.values.join(",")}"`]
            });

        });

        /* ---------------- Freeze Header ---------------- */

        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }),
            fileName
        );

    } catch (err) {
        console.error("Excel template error:", err);
    }
};