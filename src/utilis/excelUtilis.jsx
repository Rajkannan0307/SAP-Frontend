import * as XLSX from "xlsx-js-style";

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
