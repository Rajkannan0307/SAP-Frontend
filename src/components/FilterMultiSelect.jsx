import React, { useState } from "react";
import ReactSelect, { components } from "react-select";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

// Multi-select version of FilterSelect (react-select, same compact look): several options can be ticked, the list is searchable, opens in a
// portal on document.body (so a dialog or a scrolling panel never cuts it off) and stays open while ticking. The input shows the first
// 3 chosen options and "+N more", so it stays one line however many are chosen.
//
//   label     floating label, e.g. "Buyer"
//   value     array of the chosen option values
//   options   [{ value, label, hint? }]  (hint = a small grey text at the right of the option, e.g. "46 suppliers")
//   onChange  (values) => void
//   maxChips  how many chosen options are drawn before "+N more" (default 3)
const BLUE = "#0066FF";
const SHOWN_CHIPS = 3;

const styles = {
  container: (base) => ({ ...base, width: "100%" }),
  menuPortal: (base) => ({ ...base, zIndex: 20000 }), // above the MUI dialogs (1300)
  control: (base, state) => ({
    ...base,
    minHeight: 34, fontSize: 11.5, borderRadius: 6, backgroundColor: "#fff",
    borderColor: state.isFocused ? BLUE : "#c9d3e6", borderWidth: state.isFocused ? 1.5 : 1,
    boxShadow: "none", cursor: "pointer", flexWrap: "nowrap",
    "&:hover": { borderColor: BLUE },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 7px", flexWrap: "nowrap", overflow: "hidden" }),
  input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: 11.5 }),
  placeholder: (base) => ({ ...base, margin: 0, fontSize: 11.5 }),
  multiValue: (base) => ({ ...base, backgroundColor: "#eef4ff", borderRadius: 999, margin: "1px 4px 1px 0", maxWidth: 190 }),
  multiValueLabel: (base) => ({ ...base, color: "#1d4ed8", fontSize: 11, fontWeight: 600, padding: "1px 4px 1px 8px" }),
  multiValueRemove: (base) => ({ ...base, color: "#1d4ed8", borderRadius: 999, "&:hover": { backgroundColor: "#c9dcff", color: "#1d4ed8" } }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "0 6px", color: "#6b7280" }),
  clearIndicator: (base) => ({ ...base, padding: "0 4px" }),
  option: (base, state) => ({
    ...base, fontSize: 11.5, padding: "6px 10px", cursor: "pointer",
    backgroundColor: state.isFocused ? "#f3f7ff" : "#fff", color: "#1f2937",
  }),
  menu: (base) => ({ ...base, borderRadius: 8, overflow: "hidden", boxShadow: "0 10px 28px rgba(16,24,40,0.16)" }),
  menuList: (base) => ({ ...base, maxHeight: 260 }),
  noOptionsMessage: (base) => ({ ...base, fontSize: 11.5 }),
};

const DropdownArrow = (props) => (
  <components.DropdownIndicator {...props}>
    <ArrowDropDownIcon sx={{ fontSize: 20 }} />
  </components.DropdownIndicator>
);

// a tick box in front of every option, and the hint at its right
const Option = (props) => (
  <components.Option {...props}>
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input type="checkbox" checked={props.isSelected} readOnly style={{ pointerEvents: "none" }} />
      <span style={{ flex: 1 }}>{props.label}</span>
      {props.data.hint && <span style={{ fontSize: 10.5, color: "#8a93a3" }}>{props.data.hint}</span>}
    </span>
  </components.Option>
);

// only the first chips are drawn, then "+N more"
const ValueContainer = ({ children, ...props }) => {
  // react-select passes [the chips (an array) or the placeholder, the search input]
  const [chips, input] = children;
  const list = Array.isArray(chips) ? chips : null;
  if (!list) return <components.ValueContainer {...props}>{children}</components.ValueContainer>;
  const shown = props.selectProps.maxChips || SHOWN_CHIPS;
  const extra = list.length - shown;
  return (
    <components.ValueContainer {...props}>
      {list.slice(0, shown)}
      {extra > 0 && <span style={{ background: "#1d4ed8", color: "#fff", borderRadius: 999, padding: "1px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>+{extra} more</span>}
      {input}
    </components.ValueContainer>
  );
};

const FilterMultiSelect = ({ label, value = [], options = [], onChange, disabled = false, placeholder = "Select", maxChips = SHOWN_CHIPS }) => {
  const [focused, setFocused] = useState(false);
  const selected = options.filter((o) => value.includes(o.value));
  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute", left: 8, top: -7, zIndex: 1, padding: "0 4px", background: "#fff", borderRadius: 3,
          fontSize: 10, lineHeight: "14px", pointerEvents: "none", color: focused ? BLUE : "#6b7280",
        }}
      >
        {label}
      </span>
      <ReactSelect
        isMulti
        isDisabled={disabled}
        maxChips={maxChips}
        value={selected}
        options={options}
        onChange={(picked) => onChange((picked || []).map((o) => o.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        isClearable={false}
        placeholder={placeholder}
        noOptionsMessage={() => "No match"}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={styles}
        components={{ IndicatorSeparator: null, DropdownIndicator: DropdownArrow, Option, ValueContainer }}
      />
    </div>
  );
};

export default FilterMultiSelect;
