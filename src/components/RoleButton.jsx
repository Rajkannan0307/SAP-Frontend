import React from "react";
import { Button, Tooltip } from "@mui/material";
import { hasRole } from "../Authentication/ActionAccessType";

// A Button that only the listed roles can use. Everyone else sees it disabled, with `deniedMessage` on hover.
//   <RoleButton allowedRoles={UPLOAD_ADMIN_ROLE_IDS} deniedMessage="Only Corp Admin has access" onClick={...}>Upload</RoleButton>
// All other props go to the MUI Button. A disabled button swallows hover events, so the tooltip sits on a wrapper span.
const RoleButton = ({ allowedRoles, deniedMessage = "Only admin has access", disabled, children, ...buttonProps }) => {
  const allowed = hasRole(allowedRoles);
  const button = (
    <Button {...buttonProps} disabled={disabled || !allowed}>
      {children}
    </Button>
  );
  if (allowed) return button;
  return (
    <Tooltip title={deniedMessage} arrow>
      <span style={{ display: "inline-flex", cursor: "not-allowed" }}>{button}</span>
    </Tooltip>
  );
};

export default RoleButton;
