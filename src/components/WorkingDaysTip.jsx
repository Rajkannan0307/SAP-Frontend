import React from "react";
import InfoTip from "./InfoTip";

// Header hover of the plan columns that use working days (MTD Plan, C.W Plan): the formula with the real numbers, then the
// day counts as bullets. Built on the app's one hover card (InfoTip). `wd` is the "working days" block of the report
// (backend DHRM/WorkingDays.js):
//   { monthDays, elapsedDays, source: "dhrm" | "legacy", month, elapsed, week? }
// kind "mtd" = working days up to yesterday, kind "cw" = working days of this week so far.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (s) => {
  const [, m, d] = String(s || "").split("-").map(Number);
  return m ? `${d} ${MONTHS[m - 1]}` : "";
};
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const workingDaysSplit = (d) => `${plural(d.total_days, "day", "days")} − ${plural(d.weekend_days, "weekend day", "weekend days")} − ${plural(d.holiday_days, "holiday", "holidays")}`;

export const WORKING_DAYS_RULE = "Weekends and DHRM holidays are not working days (Sunday only; Saturday and Sunday for plant 1000).";

const WorkingDaysTip = ({ kind = "mtd", wd, children, labelStyle, extraNote }) => {
  const name = kind === "cw" ? "C.W Plan" : "MTD Plan";
  const noteOf = (t) => [t, extraNote].filter(Boolean).join(" ");
  const tip = (props) => <InfoTip trigger={children} labelStyle={labelStyle} {...props} />;

  if (!wd || (kind === "cw" && !wd.week)) {
    return tip({
      title: `${name} = (Monthly Plan ÷ working days of the month) × working days ${kind === "cw" ? "of this week up to yesterday" : "up to yesterday"}`,
      note: noteOf(WORKING_DAYS_RULE),
    });
  }

  const days = kind === "cw" ? wd.week.days : wd.elapsedDays;
  const title = `${name} = (Monthly Plan ÷ ${wd.monthDays}) × ${days}`;

  if (wd.source !== "dhrm" || !wd.month || (kind === "cw" ? !wd.week.detail : !wd.elapsed)) {
    return tip({ title, points: [{ label: "Old rule in use:", value: "26 days a month, Sundays only" }], note: noteOf("The DHRM holidays could not be read.") });
  }

  const points = [{ label: "Working days in the month:", value: wd.month.working_days, detail: workingDaysSplit(wd.month) }];
  if (kind === "cw") {
    // the week range runs from Monday up to YESTERDAY; on a Monday it is empty
    points.push(wd.week.from > wd.week.to
      ? { label: "This week up to yesterday:", value: 0, detail: "the week starts today" }
      : { label: `This week up to yesterday (${shortDate(wd.week.from)} – ${shortDate(wd.week.to)}):`, value: wd.week.days, detail: workingDaysSplit(wd.week.detail) });
  } else {
    points.push({
      label: "Working days up to yesterday:",
      value: wd.elapsed.working_days,
      detail: wd.elapsed.total_days === 0 ? "month not started" : workingDaysSplit(wd.elapsed),
    });
  }
  return tip({ title, points, note: noteOf(WORKING_DAYS_RULE) });
};

export default WorkingDaysTip;
