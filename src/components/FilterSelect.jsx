import React, { useState } from "react";
import ReactSelect, { components } from "react-select";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

// Compact searchable dropdown (react-select) for the list-screen filters. Looks like the
// compact MUI fields next to it (30px high, 11px text, floating label) and lets the user
// type to find an option. The first option is always "All" (= no filter).
//
//   label     floating label, e.g. "Line"
//   value     the selected option ("All" when nothing is filtered)
//   options   array of strings (without "All")
//   onChange  (value) => void
const BLUE = "#0066FF";

const styles = {
  container: (base) => ({ ...base, width: "100%" }),
  menuPortal: (base) => ({ ...base, zIndex: 20000 }),
  control: (base, state) => ({
    ...base,
    minHeight: 30, height: 30, fontSize: 11.5, borderRadius: 6, backgroundColor: "#fafbfc",
    borderColor: state.isFocused ? BLUE : "#dde1e7", borderWidth: state.isFocused ? 1.5 : 1,
    boxShadow: "none", cursor: "pointer",
    "&:hover": { borderColor: BLUE },
  }),
  valueContainer: (base) => ({ ...base, height: 28, padding: "0 7px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: 11.5 }),
  singleValue: (base) => ({ ...base, margin: 0, fontSize: 11.5, color: "#1f2937" }),
  placeholder: (base) => ({ ...base, margin: 0, fontSize: 11.5 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "0 4px", color: "#6b7280" }),
  option: (base, state) => ({
    ...base, fontSize: 11.5, padding: "6px 10px", cursor: "pointer",
    backgroundColor: state.isSelected ? "#e8f0ff" : state.isFocused ? "#f3f7ff" : "#fff",
    color: state.isSelected ? "#0052cc" : "#1f2937", fontWeight: state.isSelected ? 700 : 400,
  }),
  menu: (base) => ({ ...base, borderRadius: 8, overflow: "hidden", boxShadow: "0 10px 28px rgba(16,24,40,0.16)" }),
  noOptionsMessage: (base) => ({ ...base, fontSize: 11.5 }),
};

const DropdownArrow = (props) => (
  <components.DropdownIndicator {...props}>
    <ArrowDropDownIcon sx={{ fontSize: 20 }} />
  </components.DropdownIndicator>
);

const FilterSelect = ({ label, value, options = [], onChange, minWidth = 150, isSearchable = true }) => {
  const [focused, setFocused] = useState(false);
  const items = [{ value: "All", label: "All" }, ...options.map((o) => ({ value: o, label: o }))];
  const selected = items.find((o) => o.value === value) || items[0];
  return (
    <div style={{ position: "relative", minWidth, flexShrink: 0 }}>
      <span
        style={{
          position: "absolute", left: 8, top: -7, zIndex: 1, padding: "0 4px", background: "#fff", borderRadius: 3,
          fontSize: 10, lineHeight: "14px", pointerEvents: "none", color: focused ? BLUE : "#6b7280",
        }}
      >
        {label}
      </span>
      <ReactSelect
        value={selected}
        options={items}
        onChange={(opt) => onChange(opt ? opt.value : "All")}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        isSearchable={isSearchable}
        isClearable={false}
        placeholder="All"
        noOptionsMessage={() => "No match"}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={styles}
        components={{ IndicatorSeparator: null, DropdownIndicator: DropdownArrow }}
      />
    </div>
  );
};

export default FilterSelect;
