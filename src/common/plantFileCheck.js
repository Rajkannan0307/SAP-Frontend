import * as XLSX from "xlsx-js-style";
import { getMyPlants } from "../controller/CommonApiService";

// Bulk upload check: the Plant of every row of the uploaded Excel must be one of the plants the logged-in
// user may use (own plant + User Master > Data Access, a granted Division = all its plants).
// Reads .xlsx and .xls (first sheet). Returns { blocked: [{ row, plant }] (rows that are NOT allowed), plants: the user's plants }.
//  - blank plant cells and files without a Plant column are left to the server's own validation
//  - plantHeader = the name of the Plant column in the template ("Plant")
export const findPlantsNotAllowed = async (file, plantHeader = "Plant") => {
  const [mine, buffer] = await Promise.all([getMyPlants(), file.arrayBuffer()]);
  const allowed = new Set((Array.isArray(mine) ? mine : []).map((p) => String(p.Plant_Code)));
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { blocked: [], plants: Array.isArray(mine) ? mine : [] };
  const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const wanted = plantHeader.trim().toLowerCase();
  const blocked = [];
  data.forEach((r, i) => {
    const key = Object.keys(r).find((k) => k.trim().toLowerCase() === wanted);
    if (!key) return;
    const plant = String(r[key] ?? "").trim();
    if (plant && !allowed.has(plant)) blocked.push({ row: i + 2, plant }); // +2 = Excel row (header is row 1)
  });
  return { blocked, plants: Array.isArray(mine) ? mine : [] };
};

// Message for the user: the companies and plants they have access to, then the rows of the file that are not allowed
// (up to 10, then "...and N more rows").
export const plantsNotAllowedMessage = (blocked, plants = []) => {
  const byCompany = new Map();
  plants.forEach((p) => {
    const company = p.Com_Name || "-";
    byCompany.set(company, [...(byCompany.get(company) || []), `${p.Plant_Code} - ${p.Plant_Name}`]);
  });
  const access = [...byCompany].map(([company, list]) => `${company}\n${list.map((l) => `   \u2022 ${l}`).join("\n")}`).join("\n");
  const rows = blocked.slice(0, 10).map((b) => `   Row ${b.row}: plant ${b.plant}`).join("\n");
  return `You have access to these companies and plants only:\n\n${access || "   (none)"}\n\nNot allowed in this file:\n${rows}${blocked.length > 10 ? `\n   ...and ${blocked.length - 10} more rows` : ""}\n\nNothing was uploaded.`;
};
