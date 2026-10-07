import React, { useState } from "react";
import ReactSelect, { components } from "react-select";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

// Searchable Line dropdown (react-select) for the Add / Edit dialogs of the
// Material Master and Indirect Material Master screens. It is styled to look like
// the MUI outlined TextField next to it (same height, border, radius, font and
// floating label), so it lines up with the other inputs in the dialog.
// Type to filter by line name; clear (x) to set "None". The menu is rendered in
// document.body above the MUI dialog so it is never clipped.
//
//   value     the selected Line_ID ("" / null / undefined = None)
//   options   [{ Line_ID, Line_Name }, ...]
//   onChange  (lineId | "") => void
//   disabled  e.g. until a Plant is chosen
//   size      "small14" (37.1px, 14px text - dialog fields), "small" (35.7px, 13px text - like size="small" TextFields with 13px input) or
//             "medium" (56px, 16px text - like the default MUI TextField)
//   style     extra style for the outer wrapper (e.g. a top margin)
const SIZES = {
  small: { height: 35.7, font: 13, labelTop: -8, labelFont: 12 }, // 13px MUI small outlined input = 35.7px high
  smallBase: { height: 40, font: 16, labelTop: -8, labelFont: 12 }, // size="small" TextField with the default 16px text = 40px high
  small14: { height: 37.125, font: 14, labelTop: -8, labelFont: 10.5 }, // size="small" TextField with 14px text (dialog fields) = 37.125px high
  medium: { height: 56, font: 16, labelTop: -9, labelFont: 12 },
};
const BLUE = "#1976d2";

const buildStyles = ({ height, font }) => ({
  container: (base) => ({ ...base, width: "100%" }),
  menuPortal: (base) => ({ ...base, zIndex: 20000 }),
  control: (base, state) => ({
    ...base,
    minHeight: height,
    height,
    fontSize: font,
    borderRadius: 4,
    backgroundColor: "transparent",
    borderColor: state.isFocused ? BLUE : state.isDisabled ? "rgba(0,0,0,0.26)" : "rgba(0,0,0,0.23)",
    boxShadow: state.isFocused ? `0 0 0 1px ${BLUE}` : "none",
    "&:hover": { borderColor: state.isFocused ? BLUE : state.isDisabled ? "rgba(0,0,0,0.26)" : "rgba(0,0,0,0.87)" },
  }),
  valueContainer: (base) => ({ ...base, height, padding: "0 14px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: font }),
  placeholder: (base, state) => ({ ...base, margin: 0, fontSize: font, color: state.isDisabled ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.6)" }),
  singleValue: (base, state) => ({ ...base, margin: 0, fontSize: font, color: state.isDisabled ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.87)" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "0 8px", color: "rgba(0,0,0,0.54)" }),
  clearIndicator: (base) => ({ ...base, padding: "0 4px", color: "rgba(0,0,0,0.54)" }),
  menu: (base) => ({ ...base, fontSize: font === 16 ? 15 : 13 }),
});

// Same triangle arrow as the MUI select next to it
const DropdownArrow = (props) => (
  <components.DropdownIndicator {...props}>
    <ArrowDropDownIcon sx={{ fontSize: 24 }} />
  </components.DropdownIndicator>
);

const LineSelect = ({ value, options = [], onChange, disabled = false, label = "Line", size = "medium", style }) => {
  const [focused, setFocused] = useState(false);
  const dims = SIZES[size] || SIZES.medium;
  const items = options.map((o) => ({ value: o.Line_ID, label: o.Line_Name }));
  const selected = items.find((o) => String(o.value) === String(value ?? "")) || null;
  const floated = Boolean(selected) || focused;
  return (
    <div style={{ position: "relative", width: "100%", minWidth: 200, ...style }}>
      {floated && (
        <span
          style={{
            position: "absolute", left: 10, top: dims.labelTop, zIndex: 1, padding: "0 5px", background: "#fff",
            fontSize: dims.labelFont, lineHeight: "16px", pointerEvents: "none",
            color: focused ? BLUE : disabled ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.6)",
          }}
        >
          {label}
        </span>
      )}
      <ReactSelect
        value={selected}
        options={items}
        onChange={(opt) => onChange(opt ? opt.value : "")}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        isDisabled={disabled}
        isClearable
        isSearchable
        placeholder={label}
        noOptionsMessage={() => "No lines found"}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={buildStyles(dims)}
        components={{ IndicatorSeparator: null, DropdownIndicator: DropdownArrow }}
      />
    </div>
  );
};

export default LineSelect;
