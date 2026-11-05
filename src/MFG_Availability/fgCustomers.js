import { useEffect, useState } from "react";
import { GetFgCustomersApi } from "../controller/MfgBomApiService";

// Customer filter of the FG screens (MFG Set of Parts - Stock Report, MFG Daily Production Plan). The screens' own data is not changed: one extra
// read-only call returns the customers each FG part is planned for in the month (the Monthly Plan these screens use), and the screen only hides the
// FG rows of the other customers. If the call fails the filter just stays empty and nothing else on the screen changes.
const EMPTY = { customers: [], byPart: {} };

// plantCodes: one code or several ("1150" / "1150,1000" / [1150, 1000]); months: "YYYY-MM" or a list of them (a week can run over two months:
// the customers of every month are joined)
export const useFgCustomers = (plantCodes, months) => {
  const [data, setData] = useState(EMPTY);
  const plant = Array.isArray(plantCodes) ? plantCodes.join(",") : String(plantCodes || "");
  const monthKey = (Array.isArray(months) ? months : [months]).filter((m) => /^\d{4}-\d{2}$/.test(String(m || ""))).join(",");
  useEffect(() => {
    if (!plant || !monthKey) { setData(EMPTY); return undefined; }
    let alive = true;
    Promise.all(monthKey.split(",").map((month) => GetFgCustomersApi({ plant, month })))
      .then((results) => {
        if (!alive) return;
        const names = new Set();
        const byPart = {};
        results.forEach((d) => {
          (d?.customers || []).forEach((c) => names.add(c));
          Object.entries(d?.byPart || {}).forEach(([k, list]) => { byPart[k] = [...new Set([...(byPart[k] || []), ...list])]; });
        });
        setData({ customers: [...names].sort((a, b) => (a === "(No customer)") - (b === "(No customer)") || a.localeCompare(b)), byPart });
      })
      .catch(() => { if (alive) setData(EMPTY); });
    return () => { alive = false; };
  }, [plant, monthKey]);
  return data;
};

// does this FG part (of this plant) have the customer in the plan? No customer chosen = every FG part.
export const fgHasCustomer = (byPart, plant, partNo, customer) =>
  !customer || ((byPart || {})[`${plant}|${String(partNo || "").trim()}`] || []).includes(customer);

// The customers of the FG parts that are really on the screen (the rows the grid lists): a customer planned only for parts the screen does not list
// (e.g. a part with no active MFG BOM) is not offered, so choosing it can never give an empty grid. parts = [{ plant, part }]
export const customersOfParts = (byPart, parts) => {
  const names = new Set();
  (parts || []).forEach(({ plant, part }) => ((byPart || {})[`${plant}|${String(part || "").trim()}`] || []).forEach((c) => names.add(c)));
  return [...names].sort((a, b) => (a === "(No customer)") - (b === "(No customer)") || a.localeCompare(b));
};
