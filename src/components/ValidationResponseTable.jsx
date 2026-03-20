import React from "react";
import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";

/* ---------- Toolbar ---------- */

const CustomToolbar = () => (
    <GridToolbarContainer className="">
        <GridToolbarExport
            csvOptions={{ fileName: "Validation_Errors" }}
            excelOptions={{ fileName: "Validation_Errors" }}
        />
    </GridToolbarContainer>
);

/* ---------- Grid Component ---------- */

const ValidationResponseGrid = ({ response }) => {

    const rows = response?.invalidTable || [];
    if (!rows.length) return null;

    const dynamicFields = Object.keys(rows[0].data || {});

    const columns = [
        {
            field: "row",
            headerName: "Row",
            width: 80
        },

        ...dynamicFields.map((key) => ({
            field: key,
            headerName: key.replaceAll("_", " "),
            flex: 1
        })),

        {
            field: "errors",
            headerName: "Errors",
            flex: 2,
            sortable: false,
            renderCell: (params) => (
                <div className="text-xs text-red-600 whitespace-pre-wrap leading-tight">
                    {params.value.map((err, i) => (
                        <div key={i}>• {err}</div>
                    ))}
                </div>
            )
        }
    ];

    const gridRows = rows.map((r, index) => ({
        id: index,
        row: r.row,
        ...r.data,
        errors: r.errors
    }));

    return (
        <div className="mt-3 bg-white rounded-md shadow-sm p-3">

            {/* Title */}
            <h3 className="text-sm font-semibold text-red-600 mb-2">
                Validation Errors
            </h3>

            {/* Summary */}
            {response?.summary && (
                <div className="flex gap-4 text-xs mb-2">
                    <span>Total: <b>{response.summary.totalRows}</b></span>
                    <span className="text-green-600">
                        Valid: <b>{response.summary.validRows}</b>
                    </span>
                    <span className="text-red-600">
                        Invalid: <b>{response.summary.invalidRows}</b>
                    </span>
                </div>
            )}

            {/* DataGrid */}
            <div className="text-xs">
                <DataGrid
                    rows={gridRows}
                    columns={columns}
                    pageSizeOptions={[5, 10]}
                    density="compact"
                    getRowHeight={() => "auto"}
                    slots={{ toolbar: CustomToolbar }}
                    columnHeaderHeight={35}
                    rowHeight={28}
                    sx={{
                        fontSize: 12,

                        "& .MuiDataGrid-columnHeader": {
                            backgroundColor: "#e5e7eb",
                            fontWeight: "700"
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                            fontWeight: "bold",
                        },

                        "& .MuiDataGrid-cell": {
                            alignItems: "flex-start",
                            paddingTop: "4px",
                            paddingBottom: "4px"
                        },

                        "& .MuiDataGrid-row:hover": {
                            backgroundColor: "#f9fafb"
                        },

                        // Target the buttons within the toolbar
                        "& .MuiButton-root": {
                            fontSize: 10,       // Adjust text size
                            background: ""
                        },
                        // Target the icon specifically
                        "& .MuiButton-startIcon": {
                            "& .MuiSvgIcon-root": {
                                fontSize: 14,     // Adjust icon size,
                                pb: 0.2
                            },
                        },
                    }}
                />
            </div>

        </div>
    );
};

export default ValidationResponseGrid;