import { useEffect, useState } from "react"
import { GetPackingBomChild } from "../../controller/ContributionalChartApiService"
import { Dialog, DialogTitle, IconButton } from "@mui/material"
import { MdOutlineCancel } from "react-icons/md"
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from "@mui/x-data-grid"
import { CCTypeEnum } from "../../common/enumValues"


const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
    </GridToolbarContainer>
);

const getCCtypesData = (CCType) => {
    switch (CCType) {
        case CCTypeEnum.PK:
            return {
                packQtyHeaderName: 'Pack Qty',
                enablePriSecriColumn: true,
                child_part_no: 'pack_part_no',
            }
        case CCTypeEnum.TC:
            return {
                packQtyHeaderName: 'Per Qty',
                enablePriSecriColumn: false,
                child_part_no: 'pack_part_no'
            }
        case CCTypeEnum.SC:
            return {
                packQtyHeaderName: 'Per Qty',
                enablePriSecriColumn: false,
                child_part_no: 'child_part_no'
            }
    }
}

const ViewPackingBomChildDialog = ({
    open,
    setOpenAddModal,
    packingBomData,
    CCType,
    title
}) => {
    const [rows, setRows] = useState([])

    const CCTypeData = getCCtypesData(CCType)

    const handleClose = () => {
        setOpenAddModal(false)
    }

    const columns = [
        {
            field: "pack_child_id", headerName: "SI No", width: 80,
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1
        },
        { field: "fg_part", headerName: "FG Part", width: 120, renderCell: (params) => packingBomData?.fg_part_no || '' },
        { field: "fg_desc", headerName: "Fg Description", flex: 1 },
        {
            field: "pack_qty", headerName: CCTypeData.packQtyHeaderName,
            align: "center", headerAlign: "center",
            width: 100, renderCell: (params) => packingBomData?.box_qty || ''
        },
        { field: CCTypeData.child_part_no, headerName: "BOM Child Part", flex: 1 },
        { field: "child_desc", headerName: "Child Description", flex: 1 },
        { field: "child_mat_type", headerName: "Mat_Type", width: 100 },
        { field: "qty", headerName: "Qty", width: 60, align: "center", headerAlign: "center", },
        { field: "pri_secri", headerName: "Pri / Secri", flex: 1 },
        { field: "uom", headerName: "UOM", width: 80 },
        {
            field: "active_status", headerName: "Active Status", width: 120,
            renderCell: (params) => {
                const isActive =
                    params.value === "Active" ||
                    params.value === 1 ||
                    params.value === true;

                return (
                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border
                            ${isActive
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-red-100 text-red-700 border-red-300"
                            }`}
                    >
                        {isActive ? "Active" : "Inactive"}
                    </span>
                );
            }
        },
    ]

    useEffect(() => {
        const fetchData = async () => {
            const response = await GetPackingBomChild(packingBomData.pack_mst_id)
            console.log('Response of Pack child bom ', response)
            setRows(response)
        }
        if (open) fetchData()
    }, [open, packingBomData])

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            maxWidth={"xl"}
        >
            <DialogTitle id="alert-dialog-title" sx={{ pl: 2, pr: 1, py: 0.5 }}>
                <div className="flex justify-between items-center " >
                    <div className="text-sm  font-semibold text-blue-600">
                        {title}
                    </div>

                    <IconButton size="small" onClick={handleClose}>
                        <MdOutlineCancel size={20} />
                    </IconButton>
                </div>
            </DialogTitle>
            <div
                style={{
                    flexGrow: 1, // Ensures it grows to fill the remaining space
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    width: "70rem",
                    height: "34rem",
                    paddingInline: 10,
                    paddingBottom: 10
                }}
            >
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={5} // Set the number of rows per page to 8
                    rowsPerPageOptions={[5]}
                    getRowId={(row) => row.pack_child_id} // Specify a custom id field
                    disableSelectionOnClick
                    slots={{ toolbar: CustomToolbar }}
                    columnHeaderHeight={35}
                    rowHeight={35}
                    columnVisibilityModel={{
                        pri_secri: CCTypeData.enablePriSecriColumn
                    }}
                    sx={{
                        // Header Style
                        "& .MuiDataGrid-columnHeader": {
                            backgroundColor: '#bdbdbd', //'#696969', 	'#708090',  //"#2e59d9",
                            color: "black",
                            fontWeight: "bold",
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                            fontSize: "12px",
                            fontWeight: "bold",
                        },
                        "& .MuiDataGrid-row": {
                            backgroundColor: "#f5f5f5", // Default row background
                            "&:hover": {
                                backgroundColor: "#f5f5f5",
                            },
                        },
                        // ✅ Remove Selected Row Background
                        "& .MuiDataGrid-row.Mui-selected": {
                            backgroundColor: "inherit", // No background on selection
                        },

                        "& .MuiDataGrid-cell": {
                            color: "#333",
                            fontSize: "12px",
                        },
                    }}
                />
            </div>
        </Dialog>
    )
}


export default ViewPackingBomChildDialog