import React from "react";
import InfoTip from "./InfoTip";

// The "Unique grouping" info (i) icon of the master / upload screens: which fields make one row unique, plus short notes
// on what Add and bulk upload do with an existing combination. Built on the shared InfoTip, so every screen looks the same.
//   sections  [{ title?, fields: ["Plant", "Vendor Code", ...] }]   one list per grouping (e.g. AOP and MP)
//   notes     [ReactNode, ...]                                      short lines shown under the lists
//   intro     the sentence above the first list
//   <UniqueGroupingInfo sections={[{ fields: ["Plant", "Vendor Code"] }]} notes={[<><b>Add:</b> ...</>]} />
const UniqueGroupingInfo = ({ sections = [], notes = [], intro = "One row per combination of:", placement = "bottom-start" }) => (
  <InfoTip label="Unique grouping info" placement={placement}>
    <b style={{ color: "#1a2233", fontSize: 12 }}>Unique grouping</b>
    {intro && <span>{intro}</span>}
    {sections.map((section, i) => (
      <div key={i}>
        {section.title && <b>{section.title}</b>}
        <ul style={{ margin: "2px 0 0", paddingLeft: 18 }}>
          {section.fields.map((field) => <li key={field}>{field}</li>)}
        </ul>
      </div>
    ))}
    {notes.map((note, i) => <span key={i}>{note}</span>)}
  </InfoTip>
);

export default UniqueGroupingInfo;
