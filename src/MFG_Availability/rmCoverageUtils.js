// RM Coverage screen helpers (no React, so they can be tested on their own).

export const DAY_CELLS = 10;

// How much of each of the 10 day-cells is green for a coverage of `days` days.
//   4    -> [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]      (first 4 cells fully green)
//   4.3  -> [1, 1, 1, 1, 0.3, 0, ...]           (the 5th cell is 30% green)
//   0.4  -> [0.4, 0, 0, ...]                    (under one day: only that part of the first cell)
//   12   -> all ten cells full                  (the screen's Days column still shows 12)
//   null -> all empty (no demand: coverage cannot be calculated)
export const coverageFills = (days) =>
  Array.from({ length: DAY_CELLS }, (_, i) => {
    if (days === null || days === undefined || !(Number(days) > 0)) return 0;
    return Math.max(0, Math.min(1, Number(days) - i));
  });

// One place for the Red / Yellow / Green / Blue look and wording (the table chips and the legend use the same values).
// The status is the cover band of the Coverage Days, the same four bands as the Supplier Kanban list.
export const STATUS_META = {
  R: { letter: "R", name: "Red", color: "#d32f2f", text: "#fff", rule: "Coverage is under 1 day" },
  Y: { letter: "Y", name: "Yellow", color: "#f5b301", text: "#1a2233", rule: "Coverage is 1 to 2 days (1 day up to under 3 days)" },
  G: { letter: "G", name: "Green", color: "#2e7d32", text: "#fff", rule: "Coverage is 3 to 5 days" },
  B: { letter: "B", name: "Blue", color: "#1976d2", text: "#fff", rule: "Coverage is more than 5 days (or no demand)" },
};
export const STATUS_ORDER = ["R", "Y", "G", "B"];

export const COVERAGE_GREEN = "#2e7d32";
export const COVERAGE_EMPTY = "#e9ecf1";

// How much of a coverage cell is green, in percent (0 - 100). A whole day = 100, a part of a day = that part
// (30 for 0.3 of a day), no coverage = 0. The cell is a light-grey box with a green bar of this width inside.
export const coverageFillPercent = (fill) => Math.round(Math.max(0, Math.min(1, Number(fill) || 0)) * 100);

// number for the table: "-" when there is no value
export const fmtNum = (value, decimals = 2) =>
  value === null || value === undefined || value === "" ? "–" : Number(value).toLocaleString("en-IN", { maximumFractionDigits: decimals });
