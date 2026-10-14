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

// One place for the Red / Green / Yellow look and wording (the table chips and the legend use the same values).
export const STATUS_META = {
  R: { letter: "R", name: "Red", color: "#d32f2f", text: "#fff", rule: "Current stock is below the Safety Stock" },
  G: { letter: "G", name: "Green", color: "#2e7d32", text: "#fff", rule: "Coverage is more than 3 days and the stock is above the Safety Stock" },
  Y: { letter: "Y", name: "Yellow", color: "#f5b301", text: "#1a2233", rule: "Any other case: coverage of 3 days or less while the stock is not below the Safety Stock" },
};

export const COVERAGE_GREEN = "#2e7d32";
export const COVERAGE_EMPTY = "#e9ecf1";

// How much of a coverage cell is green, in percent (0 - 100). A whole day = 100, a part of a day = that part
// (30 for 0.3 of a day), no coverage = 0. The cell is a light-grey box with a green bar of this width inside.
export const coverageFillPercent = (fill) => Math.round(Math.max(0, Math.min(1, Number(fill) || 0)) * 100);

// number for the table: "-" when there is no value
export const fmtNum = (value, decimals = 2) =>
  value === null || value === undefined || value === "" ? "–" : Number(value).toLocaleString("en-IN", { maximumFractionDigits: decimals });
