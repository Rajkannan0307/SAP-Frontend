import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  Button,
  IconButton,
  Box,
  Chip,
  Typography,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  getDataAccessOptions,
  getUserDataAccess,
  saveUserDataAccess,
} from "../controller/UserMasterapiservice";
import { primaryButtonSx, outlineButtonSx } from "../components/compactUi";

// selectable plant / "Select all" chips
const CHIP_BASE_SX = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 0, boxSizing: "border-box",
  border: "1px solid", borderRadius: "6px", fontFamily: (theme) => theme.typography.fontFamily, fontSize: 11.5, cursor: "pointer", outline: "none",
  transition: "background-color .15s ease, border-color .15s ease, color .15s ease", "&:focus-visible": { boxShadow: "0 0 0 2px #bcd4ff" },
};
const CHIP_ON_SX = { backgroundColor: "#e8f1ff", borderColor: "#0066FF", color: "#0047b3", fontWeight: 600, "&:hover:not(:disabled)": { backgroundColor: "#d9e8ff" } };
const CHIP_LOCKED_SX = { backgroundColor: "#f3f6fc", borderColor: "#c9d6ee", color: "#4b5a78", cursor: "default", "&:disabled": { color: "#4b5a78" } }; // the user's own plant
const CHIP_OFF_SX = { backgroundColor: "#fff", borderColor: "#dde1e7", color: "#374151", "&:hover": { borderColor: "#0066FF", backgroundColor: "#f0f6ff" } };
const TAG_SX = { height: 17, fontSize: 9.5, fontWeight: 700, color: "#0052cc", backgroundColor: "#e3edff", "& .MuiChip-label": { px: 0.75 } };

/*
  Data Access of one user: Divisions (Company) with their Plants as selectable chips.
  - The user's own Plant is always allowed (selected, locked).
  - "Select all" gives access to all plants of the Division (also plants added later).
  - Clicking single plants gives access to just those plants.
  Saved: the ticked Divisions, and the single ticked plants of Divisions that are not fully ticked.
*/
const UserDataAccessDialog = ({ open, userId, onClose }) => {
  const [options, setOptions] = useState({ companies: [], plants: [] });
  const [divSel, setDivSel] = useState(new Set()); // Com_IDs ticked as a whole
  const [plantSel, setPlantSel] = useState(new Set()); // single Plant_IDs
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([getDataAccessOptions(), getUserDataAccess(userId)])
      .then(([opts, data]) => {
        if (cancelled) return;
        setOptions(opts);
        setUser(data.user);
        const divs = new Set(data.companyIds || []);
        setDivSel(divs);
        // single plants that are not already covered by a ticked Division
        const comOf = new Map(opts.plants.map((p) => [p.Plant_ID, p.Com_ID]));
        setPlantSel(new Set((data.plantIds || []).filter((id) => !divs.has(comOf.get(id)))));
      })
      .catch(() => !cancelled && setError("Failed to load data access."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const defaultPlantId = user?.Plant_ID ?? null;
  const defaultComId = user?.Com_ID ?? null;

  const groups = useMemo(
    () =>
      options.companies
        .map((c) => ({ company: c, plants: options.plants.filter((p) => p.Com_ID === c.Com_ID) }))
        .filter((g) => g.plants.length > 0 || g.company.Com_ID === defaultComId),
    [options, defaultComId]
  );

  const plantChecked = (p) => p.Plant_ID === defaultPlantId || divSel.has(p.Com_ID) || plantSel.has(p.Plant_ID);

  const toggleDivision = (g) => {
    const comId = g.company.Com_ID;
    const nextDiv = new Set(divSel);
    const nextPlants = new Set(plantSel);
    if (nextDiv.has(comId)) {
      nextDiv.delete(comId);
    } else {
      nextDiv.add(comId);
      g.plants.forEach((p) => nextPlants.delete(p.Plant_ID)); // the Division now covers them
    }
    setDivSel(nextDiv);
    setPlantSel(nextPlants);
  };

  const togglePlant = (g, p) => {
    if (p.Plant_ID === defaultPlantId) return;
    const comId = g.company.Com_ID;
    const nextPlants = new Set(plantSel);
    if (divSel.has(comId)) {
      // untick one plant of a fully ticked Division: keep the other plants as single plants
      const nextDiv = new Set(divSel);
      nextDiv.delete(comId);
      g.plants.forEach((x) => x.Plant_ID !== p.Plant_ID && nextPlants.add(x.Plant_ID));
      setDivSel(nextDiv);
    } else if (nextPlants.has(p.Plant_ID)) {
      nextPlants.delete(p.Plant_ID);
    } else {
      nextPlants.add(p.Plant_ID);
    }
    setPlantSel(nextPlants);
  };

  const extraCount = (g) => g.plants.filter((p) => plantChecked(p) && p.Plant_ID !== defaultPlantId).length;
  const totalExtra = groups.reduce((n, g) => n + extraCount(g), 0);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const plantIds = [...plantSel].filter((id) => id !== defaultPlantId);
      await saveUserDataAccess(userId, [...divSel], plantIds, localStorage.getItem("UserID"));
      onClose(true);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save data access.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth={false}
      PaperProps={{ sx: { width: 400, maxWidth: "94vw", borderRadius: "10px" } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, borderBottom: "1px solid #e8eaee", backgroundColor: "#f3f7ff" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1a2233", lineHeight: 1.3 }}>Data Access</Typography>
          {user && (
            <Typography sx={{ fontSize: 11, color: "#6b7280", lineHeight: 1.3 }} noWrap>
              {user.User_Name} ({user.Employee_ID})
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={() => onClose(false)}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pt: 1.25, pb: 1.5 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={22} />
          </Box>
        ) : (
          <>
            <Typography sx={{ fontSize: 11, color: "#6b7280", mb: 1, lineHeight: 1.45 }}>
              Click the plants this user may see. "Select all" includes every plant of the Division (also plants added
              later). The user's own plant is always included.
            </Typography>

            <Box sx={{ maxHeight: "52vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.25 }}>
              {groups.map((g) => {
                const comId = g.company.Com_ID;
                const divisionTicked = divSel.has(comId);
                const ticked = g.plants.filter(plantChecked).length;
                return (
                  <Box key={comId} sx={{ border: "1px solid #e1e9fb", borderRadius: "8px", overflow: "hidden" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.6, backgroundColor: "#f3f7ff", borderBottom: "1px solid #e1e9fb" }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a2233" }}>{g.company.Com_Name}</Typography>
                      {comId === defaultComId && <Chip size="small" label="Own division" sx={TAG_SX} />}
                      <Typography sx={{ fontSize: 10.5, color: "#6b7280", ml: "auto" }}>
                        {divisionTicked ? "All plants" : `${ticked} of ${g.plants.length}`}
                      </Typography>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => toggleDivision(g)}
                        sx={{
                          ...CHIP_BASE_SX, height: 22, fontSize: 10.5, px: 1,
                          ...(divisionTicked ? CHIP_ON_SX : CHIP_OFF_SX),
                        }}
                      >
                        {divisionTicked && <CheckIcon sx={{ fontSize: 13, mr: 0.4 }} />}
                        Select all
                      </Box>
                    </Box>
                    <Box sx={{ p: 1, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75 }}>
                      {g.plants.map((p) => {
                        const isDefault = p.Plant_ID === defaultPlantId;
                        const on = plantChecked(p);
                        return (
                          <Box
                            key={p.Plant_ID}
                            component="button"
                            type="button"
                            disabled={isDefault}
                            onClick={() => togglePlant(g, p)}
                            title={isDefault ? "User's own plant - always included" : undefined}
                            sx={{ ...CHIP_BASE_SX, height: 30, justifyContent: "flex-start", px: 1, ...(on ? CHIP_ON_SX : CHIP_OFF_SX), ...(isDefault ? CHIP_LOCKED_SX : null) }}
                          >
                            {isDefault ? <LockOutlinedIcon sx={{ fontSize: 13, mr: 0.6, flexShrink: 0 }} /> : on ? <CheckIcon sx={{ fontSize: 14, mr: 0.6, flexShrink: 0 }} /> : <Box sx={{ width: 14, mr: 0.6, flexShrink: 0 }} />}
                            <span style={{ fontWeight: 700, marginRight: 5 }}>{p.Plant_Code}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(p.Plant_Name).trim()}</span>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Typography sx={{ fontSize: 11, color: "#6b7280", mt: 1 }}>
              {totalExtra === 0 ? "No extra access (own plant only)." : `${totalExtra} extra plant${totalExtra > 1 ? "s" : ""} selected.`}
            </Typography>

            {error && <Typography sx={{ fontSize: 11.5, color: "#b42323", mt: 1 }}>{error}</Typography>}
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, py: 1.25, borderTop: "1px solid #e8eaee" }}>
        <Button variant="outlined" onClick={() => onClose(false)} sx={outlineButtonSx}>Cancel</Button>
        <Button variant="contained" disableElevation onClick={handleSave} disabled={loading || saving} sx={{ ...primaryButtonSx, minWidth: 70 }}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </Box>
    </Dialog>
  );
};

export default UserDataAccessDialog;
