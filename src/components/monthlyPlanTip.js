// Header hover of the "Monthly Plan" column, one wording for every screen that shows it (the app's InfoTip card):
//   <InfoTip trigger="Monthly Plan" {...monthlyPlanTipProps()} />
// `rows` says which plan rows are meant, for screens where the plan is built from other parts (the Component Plan).
export const monthlyPlanTipProps = (rows = "Monthly Plan row (plan type MP) of the month") => ({
  title: "Monthly Plan = sum of (Plan Qty × Ends)",
  points: [`Each ${rows} is multiplied by its own Ends`, "Then all those rows are added together"],
  note: "A missing Ends counts as 1.",
});
