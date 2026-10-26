import React, { useState, useEffect, useMemo } from "react";
import { Button, Chip, CircularProgress, TextField, Typography } from "@mui/material";
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx-js-style";
import { getdetails, getCustomerGroups, getCustomerSyncStatus, runCustomerSync } from "../controller/CustomerMasterapiservice";
import FilterSelect from "../components/FilterSelect";
import InfoTip from "../components/InfoTip";
import UniqueGroupingInfo from "../components/UniqueGroupingInfo";
import { FilterToggleButton, FilterPanel } from "../components/FilterPanel";
import { compactFieldSx, compactGridSx, primaryButtonSx, successButtonSx } from "../components/compactUi";

// Customer Master: the Customers and the Customer Groups copied every day from SalesMIS (read only - there is no add / edit / upload,
// only the Sync button). The Customers | Customer Groups switch is the same pill switch as the MFG Daily Production Plan.

const VIEW_KEY = "customerMasterView";
const VIEWS = [
  { key: "customers", label: "Customers", tip: "The customers copied from SalesMIS" },
  { key: "groups", label: "Customer Groups", tip: "The customer groups copied from SalesMIS" },
];

// Sliding two-way switch (same pill look as the Daily | Shift-wise switch)
const PillToggle = ({ value, onChange, disabled }) => {
  const idx = Math.max(0, VIEWS.findIndex((v) => v.key === value));
  return (
    <div role="group" aria-label="Customer Master view" style={{ position: "relative", display: "inline-grid", gridTemplateColumns: "1fr 1fr", padding: 3, backgroundColor: "#eef0f3", borderRadius: 999, opacity: disabled ? 0.6 : 1 }}>
      <span
        aria-hidden
        style={{
          position: "absolute", top: 3, bottom: 3, left: 3, width: "calc(50% - 3px)", borderRadius: 999, backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(16,24,40,0.18)", transform: `translateX(${idx * 100}%)`, transition: "transform .24s cubic-bezier(.4,0,.2,1)", pointerEvents: "none",
        }}
      />
      {VIEWS.map((v) => (
        <button
          key={v.key}
          type="button"
          title={v.tip}
          disabled={disabled}
          aria-pressed={value === v.key}
          onClick={() => onChange(v.key)}
          style={{
            position: "relative", zIndex: 1, border: "none", background: "transparent", cursor: disabled ? "default" : "pointer", padding: "4px 12px", minWidth: 96,
            fontSize: 11, fontWeight: value === v.key ? 700 : 500, color: value === v.key ? "#0052cc" : "#5b6472", transition: "color .2s ease", whiteSpace: "nowrap",
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
};

const StatusChip = ({ active }) => (
  <Chip
    size="small"
    label={active ? "Active" : "Inactive"}
    sx={{
      height: 20,
      fontSize: 10.5,
      fontWeight: 700,
      backgroundColor: active ? "#eafaf1" : "#fdeeee",
      color: active ? "#1b7a43" : "#b42323",
    }}
  />
);

// '2026-10-21T11:05:20.970Z' -> '21-10-2026 11:05' (shown exactly as stored, no time-zone shift)
const stampLabel = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : "";
};

const uniq = (list) => [...new Set(list.filter((v) => v !== null && v !== undefined && v !== "").map(String))].sort((a, b) => a.localeCompare(b));

const Customer = () => {
  const UserID = localStorage.getItem("UserID");
  const [view, setView] = useState(() => {
    try { return window.localStorage.getItem(VIEW_KEY) === "groups" ? "groups" : "customers"; } catch (e) { return "customers"; }
  });
  const [customers, setCustomers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fGroup, setFGroup] = useState("All");
  const [fZone, setFZone] = useState("All");
  const [fCtm, setFCtm] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [pageModel, setPageModel] = useState({ page: 0, pageSize: 25 });

  const getData = async () => {
    setLoading(true);
    try {
      const [c, g, s] = await Promise.all([getdetails(), getCustomerGroups(), getCustomerSyncStatus()]);
      setCustomers(Array.isArray(c) ? c : []);
      setGroups(Array.isArray(g) ? g : []);
      setLastSync(s && s.last ? s.last : null);
    } catch (error) {
      console.error(error);
      setCustomers([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const changeView = (next) => {
    if (next === view) return;
    setView(next);
    setSearchText("");
    setFGroup("All"); setFZone("All"); setFCtm("All"); setFStatus("All");
    try { window.localStorage.setItem(VIEW_KEY, next); } catch (e) { /* the choice just is not remembered */ }
  };

  // Sync Now: reads SalesMIS and brings both lists up to date
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await runCustomerSync({ UserID });
      const l = res.log || {};
      alert(
        `${res.message}\n\n` +
        `Customer Groups: ${l.Groups_Inserted} new, ${l.Groups_Updated} updated, ${l.Groups_Deactivated} deactivated, ${l.Groups_Unchanged} unchanged.\n` +
        `Customers: ${l.Customers_Inserted} new, ${l.Customers_Updated} updated, ${l.Customers_Deactivated} deactivated, ${l.Customers_Unchanged} unchanged` +
        `${l.Customers_Skipped ? `, ${l.Customers_Skipped} skipped (blank or repeated customer code in SalesMIS)` : ""}.`
      );
    } catch (error) {
      console.error("Customer sync failed:", error.response?.data || error);
      alert(error.response?.data?.message || "The customer sync failed. Please try again.");
    } finally {
      setSyncing(false);
      getData();
    }
  };

  const isCustomers = view === "customers";

  // SI No: the running number of the row in the list as shown (continues on the next page, follows the sort)
  const siColumn = {
    field: "si_no",
    headerName: "SI No",
    width: 70,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => pageModel.page * pageModel.pageSize + params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
  };
  const customerColumns = [
    siColumn,
    { field: "Customer_Code", headerName: "Customer Code", flex: 0.8, minWidth: 100 },
    { field: "Customer_Name", headerName: "Customer Name", flex: 1.6, minWidth: 170 },
    { field: "Customer_Group_Name", headerName: "Customer Group", flex: 1.1, minWidth: 130 },
    { field: "Customer_Location", headerName: "Location", flex: 1, minWidth: 110 },
    { field: "City", headerName: "City", flex: 0.9, minWidth: 95 },
    { field: "State", headerName: "State", flex: 0.6, minWidth: 70 },
    { field: "Zone", headerName: "Zone", flex: 0.7, minWidth: 80 },
    { field: "Sales_Type", headerName: "Sales Type", flex: 0.8, minWidth: 90 },
    {
      field: "Active_Status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (value) => (value ? "Active" : "Inactive"),
      renderCell: (params) => <StatusChip active={!!params.row.Active_Status} />,
    },
  ];
  const groupColumns = [
    siColumn,
    { field: "Customer_Group_Code", headerName: "Group Code", flex: 0.7, minWidth: 90 },
    { field: "Customer_Group_Name", headerName: "Group Name", flex: 1.8, minWidth: 180 },
    {
      field: "Customer_Count",
      headerName: "Customers",
      flex: 0.6,
      minWidth: 80,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderHeader: () => <InfoTip trigger="Customers" text="Number of customers linked to this group. 0 means no customer is assigned to it." labelStyle={{ cursor: "help", fontSize: "10.5px", fontWeight: "bold", color: "#000000" }} />,
    },
    {
      field: "Is_CTM",
      headerName: "CTM",
      flex: 0.5,
      minWidth: 70,
      valueGetter: (value, row) => (row?.Is_CTM ? "Yes" : "No"),
    },
    {
      field: "Active_Status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 80,
      valueFormatter: (value) => (value ? "Active" : "Inactive"),
      renderCell: (params) => <StatusChip active={!!params.row.Active_Status} />,
    },
  ];

  // Search box + panel filters, applied live to the loaded rows
  const visibleRows = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (isCustomers) {
      return customers.filter((row) => {
        if (fGroup !== "All" && row.Customer_Group_Name !== fGroup) return false;
        if (fZone !== "All" && row.Zone !== fZone) return false;
        if (fStatus !== "All" && (fStatus === "Active") !== !!row.Active_Status) return false;
        if (!text) return true;
        return ["Customer_Code", "Customer_Name", "Customer_Group_Name", "Customer_Location", "City", "State", "Zone", "Sales_Type"].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        });
      });
    }
    return groups.filter((row) => {
      if (fCtm !== "All" && (fCtm === "Yes") !== !!row.Is_CTM) return false;
      if (fStatus !== "All" && (fStatus === "Active") !== !!row.Active_Status) return false;
      if (!text) return true;
      return ["Customer_Group_Code", "Customer_Group_Name"].some((key) => {
        const value = row[key];
        return value && String(value).toLowerCase().includes(text);
      });
    });
  }, [isCustomers, customers, groups, searchText, fGroup, fZone, fCtm, fStatus]);

  const totalRows = isCustomers ? customers.length : groups.length;
  const noun = isCustomers ? "customers" : "customer groups";
  const activeFilterCount = (isCustomers ? [fGroup, fZone, fStatus] : [fCtm, fStatus]).filter((v) => v !== "All").length;
  const clearFilters = () => { setFGroup("All"); setFZone("All"); setFCtm("All"); setFStatus("All"); };

  // Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );

  // Excel of the list as shown (search and filters applied)
  const handleDownloadExcel = () => {
    if (visibleRows.length === 0) {
      alert("No Data Found");
      return;
    }
    const DataColumns = isCustomers
      ? ["SI_No", "Customer_Code", "Customer_Name", "Customer_Group", "Location", "City", "State", "Zone", "Sales_Type", "Contact_Person", "Email", "ActiveStatus"]
      : ["SI_No", "Group_Code", "Group_Name", "Customers", "CTM", "ActiveStatus"];
    const filteredData = visibleRows.map((item, i) => (isCustomers
      ? {
        SI_No: i + 1,
        Customer_Code: item.Customer_Code,
        Customer_Name: item.Customer_Name,
        Customer_Group: item.Customer_Group_Name || "",
        Location: item.Customer_Location || "",
        City: item.City || "",
        State: item.State || "",
        Zone: item.Zone || "",
        Sales_Type: item.Sales_Type || "",
        Contact_Person: item.Contact_Person || "",
        Email: item.Email || "",
        ActiveStatus: item.Active_Status ? "Active" : "Inactive",
      }
      : {
        SI_No: i + 1,
        Group_Code: item.Customer_Group_Code,
        Group_Name: item.Customer_Group_Name,
        Customers: item.Customer_Count,
        CTM: item.Is_CTM ? "Yes" : "No",
        ActiveStatus: item.Active_Status ? "Active" : "Inactive",
      }));

    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });
    worksheet["!cols"] = DataColumns.map((c) => ({ wch: c === "SI_No" ? 8 : /Name|Email|Group$/.test(c) ? 32 : 16 }));
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (!worksheet[cellAddress]) return;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: "FFFF00" } },
        alignment: { horizontal: "center" },
      };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isCustomers ? "Customers" : "Customer Groups");
    XLSX.writeFile(workbook, isCustomers ? "Customer_Data.xlsx" : "Customer_Group_Data.xlsx");
  };

  // last sync line: when, how it ended, and the counts of the run on hover
  const syncCounts = lastSync && lastSync.Status === "Success"
    ? `Customer Groups: ${lastSync.Groups_Inserted} new, ${lastSync.Groups_Updated} updated, ${lastSync.Groups_Deactivated} deactivated, ${lastSync.Groups_Unchanged} unchanged\n` +
      `Customers: ${lastSync.Customers_Inserted} new, ${lastSync.Customers_Updated} updated, ${lastSync.Customers_Deactivated} deactivated, ${lastSync.Customers_Unchanged} unchanged, ${lastSync.Customers_Skipped} skipped\n` +
      `Source: ${lastSync.Source_DB}`
    : lastSync ? lastSync.Error_Message || "" : "";
  const failedLast = lastSync && lastSync.Status === "Failed";

  return (
    <div
      style={{
        padding: "20px 20px",
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 50px)",
      }}
    >
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1a2233", letterSpacing: 0.1, lineHeight: 1.3, mb: 1.5 }}>
        Customer Master
      </Typography>

      {/* Switch, search, filters and actions */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          padding: "7px 10px",
          marginBottom: 6,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <PillToggle value={view} onChange={changeView} disabled={loading} />
        <TextField
          size="small"
          placeholder={isCustomers ? "Search code, name, group, city, zone" : "Search group code, group name"}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#8a93a3", mr: 0.5 }} /> }}
          sx={compactFieldSx(300)}
        />
        <FilterToggleButton open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} activeCount={activeFilterCount} />

        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#6b7280", whiteSpace: "nowrap" }}>
          {visibleRows.length === totalRows ? `${totalRows} ${noun}` : `${visibleRows.length} of ${totalRows} ${noun}`}
        </span>
        <span
          title={syncCounts}
          style={{ fontSize: 11, color: failedLast ? "#b42323" : "#8a93a3", whiteSpace: "nowrap", cursor: syncCounts ? "help" : "default" }}
        >
          {lastSync
            ? `${failedLast ? "Last sync failed" : "Last sync"}: ${stampLabel(lastSync.Finished_On)}${lastSync.Triggered_By === "CRON" ? " (daily)" : ""}`
            : "Not synced yet"}
        </span>
        <Button
          onClick={handleDownloadExcel}
          variant="contained"
          disableElevation
          startIcon={<FaFileExcel size={13} />}
          sx={successButtonSx}
        >
          Excel
        </Button>
        <Button
          onClick={handleSync}
          disabled={syncing || loading}
          variant="contained"
          disableElevation
          startIcon={syncing ? <CircularProgress size={12} color="inherit" /> : <SyncIcon sx={{ fontSize: 16 }} />}
          sx={primaryButtonSx}
          title="Copy the latest customers and customer groups from SalesMIS now"
        >
          {syncing ? "Syncing..." : "Sync"}
        </Button>
        <UniqueGroupingInfo
          sections={isCustomers ? [{ fields: ["Company Code", "Customer Code"] }] : [{ fields: ["SalesMIS Customer Group ID"] }]}
          intro={isCustomers ? "One customer per combination of:" : "One customer group per:"}
          notes={[
            <><b>Sync:</b> a new one is <b>added</b>, a changed one is <b>updated</b>, an identical one is left as it is. One that is inactive or no longer in SalesMIS is set <b>Inactive</b> (never deleted).</>,
            <>This list is read only. It is refreshed by the daily sync (02:00) or by the Sync button.</>,
          ]}
        />

        <FilterPanel open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          {isCustomers ? (
            <>
              <FilterSelect label="Customer Group" value={fGroup} options={uniq(customers.map((r) => r.Customer_Group_Name))} onChange={setFGroup} minWidth={200} />
              <FilterSelect label="Zone" value={fZone} options={uniq(customers.map((r) => r.Zone))} onChange={setFZone} minWidth={130} />
            </>
          ) : (
            <FilterSelect label="CTM" value={fCtm} options={["Yes", "No"]} onChange={setFCtm} minWidth={110} isSearchable={false} />
          )}
          <FilterSelect label="Status" value={fStatus} options={["Active", "Inactive"]} onChange={setFStatus} minWidth={120} isSearchable={false} />
        </FilterPanel>
      </div>

      {/* DataGrid */}
      <div
        style={{
          flexGrow: 1,
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e8eaee",
          boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <DataGrid
          key={view}
          rows={visibleRows}
          loading={loading}
          columns={isCustomers ? customerColumns : groupColumns}
          getRowId={(row) => (isCustomers ? row.Customer_ID : row.Customer_Group_ID)}
          disableRowSelectionOnClick
          columnHeaderHeight={36}
          rowHeight={38}
          paginationModel={pageModel}
          onPaginationModelChange={setPageModel}
          pageSizeOptions={[25, 50, 100]}
          slots={{ toolbar: CustomToolbar }}
          localeText={{ noRowsLabel: isCustomers ? "No customers found." : "No customer groups found." }}
          sx={{ ...compactGridSx, "& .MuiDataGrid-row": { ...compactGridSx["& .MuiDataGrid-row"], cursor: "default" } }}
        />
      </div>
    </div>
  );
};

export default Customer;
