import * as XLSX from "xlsx-js-style";

// Small shared helper for the Prod Status / RM Coverage / Component Plan screens:
// builds an Excel with a bold header (optional group row above it), the rows, and a TOTAL row,
// then downloads it. Numbers stay numbers in the sheet; gap columns are coloured green / red.
//
//   columns : [{ header, width, gap?, total? }]   total = add this column up in the TOTAL row
//   groups  : optional [{ label, from, to }] (column indexes, inclusive) shown in a row above the header
//   rows    : array of arrays, one value per column
//   totalLabel : text for the first cell of the TOTAL row, e.g. "TOTAL (12 FG)"
//   cellStyle  : optional (value, rowIndex, colIndex, row) => ({ s?: style, z?: numberFormat }) | null, for extra colouring of body cells
//   extraSheets: optional more sheets, each { sheetName, columns, groups?, rows, totalLabel?, cellStyle? }
const buildSheet = ({ columns, groups = [], rows, totalLabel = "TOTAL", cellStyle }) => {
  const hasGroups = groups.length > 0;
  const inGroup = (c) => groups.some((g) => c >= g.from && c <= g.to);
  const aoa = [];
  if (hasGroups) {
    // a merged cell only shows its top-left cell, so the label of a column without a group goes in row 0
    aoa.push(columns.map((col, c) => {
      const g = groups.find((x) => x.from === c);
      if (g) return g.label;
      return inGroup(c) ? "" : col.header;
    }));
  }
  aoa.push(columns.map((c) => c.header));
  rows.forEach((r) => aoa.push(r));
  aoa.push(columns.map((c, i) => {
    if (i === 0) return totalLabel;
    if (!c.total) return "";
    return rows.reduce((sum, r) => sum + (Number(r[i]) || 0), 0);
  }));

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const headerRowIdx = hasGroups ? 1 : 0;
  const lastCol = columns.length - 1;
  const totalIdx = aoa.length - 1;
  ws["!cols"] = columns.map((c) => ({ wch: c.width || 12 }));
  ws["!merges"] = [];
  if (hasGroups) {
    groups.forEach((g) => { if (g.to > g.from) ws["!merges"].push({ s: { r: 0, c: g.from }, e: { r: 0, c: g.to } }); });
    columns.forEach((_, c) => { if (!inGroup(c)) ws["!merges"].push({ s: { r: 0, c }, e: { r: 1, c } }); });
  }

  const headStyle = { font: { bold: true }, fill: { fgColor: { rgb: "D0DCF5" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
  for (let r = 0; r <= headerRowIdx; r++) {
    for (let c = 0; c <= lastCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = headStyle;
    }
  }
  const GREEN = "1B7A43";
  const RED = "B42323";
  for (let r = headerRowIdx + 1; r <= totalIdx; r++) {
    columns.forEach((col, c) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      const cell = ws[addr];
      const style = {};
      if (typeof cell.v === "number") cell.z = col.format || "#,##0";
      if (col.gap && typeof cell.v === "number" && cell.v !== 0) style.font = { bold: true, color: { rgb: cell.v > 0 ? GREEN : RED } };
      let extra = null;
      if (cellStyle && r < totalIdx) extra = cellStyle(cell.v, r - headerRowIdx - 1, c, rows[r - headerRowIdx - 1]);
      if (extra && extra.z) cell.z = extra.z;
      if (extra && extra.s) Object.assign(style, extra.s);
      if (r === totalIdx) {
        style.font = { ...(style.font || {}), bold: true };
        style.fill = { fgColor: { rgb: "EAF0FC" } };
      }
      if (Object.keys(style).length) cell.s = style;
    });
  }
  return ws;
};

export const downloadStatusExcel = ({ sheetName, fileName, extraSheets = [], ...main }) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet(main), sheetName);
  extraSheets.forEach((sheet) => XLSX.utils.book_append_sheet(wb, buildSheet(sheet), sheet.sheetName));
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(link.href);
};
