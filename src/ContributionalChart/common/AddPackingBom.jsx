import React, { useEffect, useState } from 'react'
import * as Yup from "yup"
import { useFormik } from "formik";
import { AddFixedManpowerApi, getProductSegmentdetails } from '../../controller/PMPDApiService';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormHelperText, IconButton, InputLabel, MenuItem, Switch, TextField } from '@mui/material';
import { CommonMuiStyles } from '../../Styles/CommonStyles';
import { getPlantdetails } from '../../controller/CommonApiService';
import { DataGrid } from '@mui/x-data-grid';
import { format, parse } from 'date-fns';
import { CiSquarePlus } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { GetMaterialMasterApi } from '../../controller/Masterapiservice';
import Select from 'react-select';
import { GetPackingBomApi, GetPackingBomChild, GetPackingPartByPlantApi, InsertPackingBomApi } from '../../controller/ContributionalChartApiService';
import { CCTypeEnum, PriSecriEnum } from '../../common/enumValues';

// Template

// {
//                     id: newId,
//                     child_part_no: '',
//                     qty: 0,
//                     uom: ''
//                 }


export const getCCTypesCommonData = (CCType) => {
    switch (CCType) {
        case CCTypeEnum.PK:
            return {
                materialTypes: 'VERP,LEIH',
                fgMaterialTypes: "FERT"
            }
        case CCTypeEnum.TC:
            return {
                materialTypes: 'HIBE,FHMI,SERV',
                fgMaterialTypes: "FERT"
            }
        case CCTypeEnum.SC:
            return {
                materialTypes: 'HALB',
                fgMaterialTypes: "FERT"
            }
    }
}

const _getCCtypesData = (CCType) => {
    switch (CCType) {
        case CCTypeEnum.PK:
            return {
                boxQtyLabelName: 'Box Qty'
            }
        default:
            return {
                boxQtyLabelName: 'Per Qty'
            }
    }
}


const reactSelectStyle = {
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
    }),

    control: (base) => ({
        ...base,
        minHeight: 22,
        height: 22,
        fontSize: '11px',
    }),

    valueContainer: (base) => ({
        ...base,
        height: 22,
        padding: '0 6px',
    }),

    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        fontSize: '11px',
    }),

    singleValue: (base) => ({
        ...base,
        fontSize: '11px',
        lineHeight: '22px',
    }),

    indicatorsContainer: (base) => ({
        ...base,
        height: 22,
    }),

    dropdownIndicator: (base) => ({
        ...base,
        padding: 2,
    }),

    clearIndicator: (base) => ({
        ...base,
        padding: 2,
    }),

    menu: (base) => ({
        ...base,
        fontSize: '11px',
    }),

    option: (base, state) => ({
        ...base,
        fontSize: '11px',
        minHeight: 22,
        padding: '4px 8px',
    }),
}

export const pri_secri_dropdown = [
    {
        value: PriSecriEnum.Primary,
        label: PriSecriEnum.Primary,
    },
    {
        value: PriSecriEnum.Secondary,
        label: PriSecriEnum.Secondary,
    }
]

const createEmptyRow = (id) => ({
    id,
    child_part_no: null,
    qty: "",
    life: "",
    pri_secri: "",
    uom: "",
    new: true
});

export const handleAddPackingChildRow = (count, setGridRows) => {
    setGridRows(prevRows => {
        let rows = [...prevRows];

        // 1️⃣ If more rows than count → trim
        if (rows.length > count) {
            rows = rows.slice(0, count);
        }

        // 2️⃣ If fewer rows than count → add empty rows
        if (rows.length < count) {
            const rowsToAdd = count - rows.length;

            for (let i = 0; i < rowsToAdd; i++) {
                rows.push(createEmptyRow(rows.length + 1));
            }
        }

        // 3️⃣ Re-index IDs
        return rows.map((row, index) => ({
            ...row,
            id: index + 1
        }));
    });
};

// type CCType = 'SC' | 'TC' | 'PK';
const AddPackageBomDialog = ({
    open,
    setOpenAddModal,
    setRefreshData,
    editData,
    CCType,
    title
}) => {
    const [submitLoading, setSubmitLoading] = useState(false)
    const [plants, setPlants] = useState([])
    const [gridRows, setGridRows] = useState([]);
    const [materialPartNo, setMaterialPartNo] = useState([])
    const [packingPart, setPackingPart] = useState([])

    const CCTypeData = _getCCtypesData(CCType)
    const CCTypeCommonData = getCCTypesCommonData(CCType)

    const handleClose = () => {
        setOpenAddModal(false)
        setGridRows([])
        setMaterialPartNo([])
        setPackingPart([])
        formik.resetForm()
    }

    // ✅ Validation Schema
    const validationSchema = Yup.object({
        plant: Yup.string().required('Required'),
        fg_part: Yup.string().required('Required'),
        box_qty: Yup.string().required('Required'),
        eff_date: Yup.string().required('Required'),
        childPartCount: Yup.string().required('Required'),
    });


    // ✅ Formik Setup
    const formik = useFormik({
        initialValues: {
            plant: "",
            fg_part: "",
            box_qty: "",
            eff_date: "",
            active_status: true,
            childPartCount: ''
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (submitLoading) return
            setSubmitLoading(true)
            console.log(values)
            try {
                const userId = localStorage.getItem("EmpId");
                const payload = {
                    ...values,
                    eff_date: format(
                        parse(values.eff_date, "yyyy-MM", new Date()),
                        "yyyy-MM-01"
                    ),
                    type: CCType,
                    userId: userId,
                    mst_pack_child_list: gridRows
                }
                console.log(payload)
                //add apiCall
                await InsertPackingBomApi(payload)
                setRefreshData((prev) => !prev)
                handleClose()
                alert(`Fixed Manpower Added Successfully`)
            } catch (error) {
                console.error("❌ Error submitting form:", error);
                alert(error?.response?.data?.message ? `❌ ${error?.response?.data?.message}` : "❌ An error occurred while submitting the form.");
            }
            setSubmitLoading(false)
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            const response2 = await getPlantdetails()
            console.log(response2, "Plants")
            setPlants(response2)
        }
        if (open) fetchData()

    }, [open])

    useEffect(() => {
        const fetchData = async () => {
            const response = await GetMaterialMasterApi({ plant: formik.values.plant, materialType: CCTypeCommonData.fgMaterialTypes })
            console.log(response, "Material Part No")
            setMaterialPartNo(response)
        }

        const fetchPackingPart = async () => {
            const response = CCType === CCTypeEnum.SC
                ? await GetMaterialMasterApi({ plant: formik.values.plant, materialType: CCTypeCommonData.materialTypes })
                : await GetPackingPartByPlantApi(formik.values.plant, CCTypeCommonData.materialTypes)
            console.log(response, "Packing Part")

            //--- If Sub-contract get the part number from Mst_Material - Type HALB

            let finalResponse;

            if (CCType === CCTypeEnum.SC) {
                finalResponse = response.map((e) => {
                    return {
                        part_no: e.Material_Code,
                        plant: e.Plant_Code,
                        uom: "NOS",
                        mat_type: e.Material_Type
                    }
                })
            } else {
                finalResponse = response.map((e) => {
                    return {
                        part_no: e.part_no,
                        plant: e.plant,
                        uom: e.uom,
                        mat_type: e.mat_type
                    }
                })
            }

            setPackingPart(finalResponse)

            // const response = await GetMaterialMasterApi({ plant: formik.values.plant, materialType: CCTypeCommonData.materialTypes })
            // console.log(response, "Material Part No")
            // setPackingPart(response)
        }
        if (formik.values.plant) {
            fetchData()
            fetchPackingPart()
        }
    }, [formik.values.plant])


    const handleAddRow = () => {
        setGridRows(prevRows => {
            const newId = prevRows.length + 1;

            return [
                ...prevRows,
                {
                    id: newId,
                    child_part_no: '',
                    qty: 0,
                    life: 0,
                    pri_secri: PriSecriEnum.Primary,
                    uom: ''
                }
            ];
        });
        formik.setFieldValue('childPartCount', gridRows?.length + 1)
    };

    const handleDeleteRow = (id) => {
        // if (!window.confirm('Delete this row?')) return;

        setGridRows(prev =>
            prev.filter(row => row.id !== id)
        );
        formik.setFieldValue('childPartCount', gridRows?.length - 1)
    };

    const handleProcessRowUpdate = (newRow) => {
        setGridRows(prev =>
            prev.map(row => (row.id === newRow.id ? newRow : row))
        );
        return newRow;
    };

    // const filteredPackingPartNo = packingPart.filter((e) => e.)


    const getFilteredPackingPartNo = (currentRowValue) => {
        const selectedSet = new Set(
            gridRows
                .map(r => r.child_part_no)
                .filter(v => v && v !== currentRowValue)
        );

        return packingPart
            .map(e => ({
                value: e.part_no,
                label: e.part_no,
                uom: e.uom
            }))
            .filter(e => !selectedSet.has(e.value));
    };


    const packBomChildColumns = [
        { field: 'id', headerName: 'SI.No', editable: false, width: 80 },
        {
            field: 'child_part_no', headerName: 'BOM Child Part', editable: false, flex: 1, renderCell: (params) => {
                const options = getFilteredPackingPartNo(params.row.child_part_no);
                return <div>
                    <Select
                        menuPortalTarget={document.body}
                        menuPosition="fixed"

                        styles={{
                            ...reactSelectStyle
                        }}

                        name="child_part_no"
                        options={options}

                        value={
                            options.find(
                                opt => opt.value === params.row.child_part_no
                            ) || null
                        }

                        onChange={(option) =>
                            handleProcessRowUpdate({
                                ...params.row,
                                child_part_no: option?.value || '',
                                uom: option?.uom
                            })
                        }
                    />
                </div>
            }
        },
        {
            field: 'qty', headerName: 'Qty', editable: true, type: 'number',
            align: 'left',
            headerAlign: 'left',
            flex: 1
        },
        {
            field: 'life', headerName: 'Life', editable: true, type: 'number',
            align: 'left',
            headerAlign: 'left',
            flex: 1
        },
        {
            field: 'pri_secri',
            headerName: 'Primary / Secondary',
            flex: 1,
            renderCell: (params) => {
                return (
                    <Select
                        menuPortalTarget={document.body}
                        menuPosition="fixed"

                        styles={{
                            ...reactSelectStyle
                        }}

                        name="pri_secri"
                        options={pri_secri_dropdown}
                        value={
                            pri_secri_dropdown.find(
                                opt => opt.value === params.row.pri_secri
                            ) || null
                        }
                        onChange={(option) =>
                            handleProcessRowUpdate({
                                ...params.row,
                                pri_secri: option.value
                            })
                        }
                    />
                )
            }
        },
        {
            field: 'uom', headerName: 'UOM', editable: false, flex: 1
        },
        {
            field: 'delete', headerName: 'Delete', renderCell: (params) => {
                return (
                    <IconButton onClick={() => {
                        handleDeleteRow(params.id)
                    }} >
                        <MdDelete size={15} />
                    </IconButton>
                )
            }
        }
    ];


    const handlePackingBomChildCopyFrom = async (body) => {
        const response = await GetPackingBomChild(body.pack_mst_id)
        // console.log(body)
        console.log(response)

        const data = response.map((e, i) => {
            return {
                id: i + 1,
                child_part_no: e.child_part_no,
                qty: e.qty,
                life: e.life,
                pri_secri: e.pri_secri,
                uom: CCType === CCTypeEnum.SC ? 'Nos' : e.uom
            }
        })
        console.log(data)
        setGridRows([])
        setGridRows(data)
        formik.setFieldValue('childPartCount', data?.length || '')
    }

    return (
        <Dialog
            open={open}
            // onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            maxWidth="xl"
        >
            <DialogTitle id="alert-dialog-title">
                {`${editData ? "Edit" : "Add"} ${title}`}
            </DialogTitle>
            {/* {JSON.stringify(editData)} */}
            <DialogContent sx={{ pb: 0, width: "100%" }}>
                <div style={{
                    // display: "grid",
                    // gridTemplateColumns: "1fr",
                    display: "flex",
                    width: "100%",
                    gap: "15px"
                }}>

                    <TextField
                        select
                        size="small"
                        label="Plant"
                        name="plant"
                        value={formik.values.plant}
                        onChange={(e) => {
                            setMaterialPartNo([])
                            formik.setFieldValue('fg_part', '')
                            formik.setFieldValue('childPartCount', '')
                            setPackingPart([])
                            setGridRows([])
                            formik.handleChange(e)
                        }}
                        onBlur={formik.handleBlur}
                        error={formik.touched.plant && Boolean(formik.errors.plant)}
                        helperText={formik.touched.plant && formik.errors.plant}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            minWidth: 250,
                            mt: 1
                        }}
                    >
                        {plants.map((p) => (
                            <MenuItem sx={{ fontSize: "small" }} key={p.Plant_ID} value={p.Plant_Code}>
                                {`${p.Plant_Code} - ${p.Plant_Name}`}
                            </MenuItem>
                        ))}
                    </TextField>

                    <FormControl
                        fullWidth
                        error={formik.touched.fg_part && Boolean(formik.errors.fg_part)}
                        sx={{ minWidth: 250, mt: 1 }}
                    >
                        <Select
                            name="fg_part"
                            placeholder='Select FG Part'
                            options={materialPartNo.map(e => ({
                                value: e.Material_ID,
                                label: e.Material_Code
                            }))}
                            value={
                                materialPartNo
                                    .map(e => ({
                                        value: e.Material_ID,
                                        label: e.Material_Code
                                    }))
                                    .find(opt => opt.value === formik.values.fg_part) || null
                            }
                            onChange={(option) =>
                                formik.setFieldValue('fg_part', option?.value || '')
                            }
                            onBlur={() => formik.setFieldTouched('fg_part', true)}
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                                control: (base, state) => ({
                                    ...base,
                                    minHeight: 38,               // 🔥 height
                                    height: 38,
                                    borderColor:
                                        formik.touched.fg_part && formik.errors.fg_part
                                            ? '#d32f2f'
                                            : base.borderColor,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        borderColor:
                                            formik.touched.fg_part && formik.errors.fg_part
                                                ? '#d32f2f'
                                                : base.borderColor
                                    }
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 8px'
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: 38
                                })
                            }}
                            isClearable
                            menuPortalTarget={document.body}
                        />

                        {/* 🔴 Formik Error */}
                        {formik.touched.fg_part && formik.errors.fg_part && (
                            <FormHelperText>
                                {formik.errors.fg_part}
                            </FormHelperText>
                        )}
                    </FormControl>


                    <TextField
                        id="box_qty"
                        name="box_qty"
                        label={CCTypeData.boxQtyLabelName}
                        size="small"
                        type='number'
                        fullWidth
                        value={formik.values.box_qty}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.box_qty && Boolean(formik.errors.box_qty)}
                        helperText={formik.touched.box_qty && formik.errors.box_qty}
                        InputLabelProps={{ sx: { fontSize: 12 } }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            maxWidth: 250,
                            mt: 1
                        }}
                    />

                    <TextField
                        id="eff_date"
                        name="eff_date"
                        label="Effective Date"
                        size="small"
                        type='month'
                        fullWidth
                        value={formik.values.eff_date}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.eff_date && Boolean(formik.errors.eff_date)}
                        helperText={formik.touched.eff_date && formik.errors.eff_date}
                        InputLabelProps={{ sx: { fontSize: 12 }, shrink: true }}
                        InputProps={{ sx: { fontSize: 13 } }}
                        sx={{
                            maxWidth: 250,
                            mt: 1
                        }}
                    />

                </div>

                <div style={{
                    display: "flex",
                    width: "100%",
                    gap: "15px",
                    marginTop: 10
                }}>

                    <div className='flex justify-start items-center gap-4 w-full'>
                        <TextField
                            id="childPartCount"
                            name="childPartCount"
                            label="No of Child Packing Item"
                            size="small"
                            fullWidth
                            type='number'
                            value={formik.values.childPartCount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.childPartCount && Boolean(formik.errors.childPartCount)}
                            helperText={formik.touched.childPartCount && formik.errors.childPartCount}
                            InputLabelProps={{ sx: { fontSize: 12 } }}
                            InputProps={{ sx: { fontSize: 13 } }}
                            sx={{
                                maxWidth: 250,
                                // mt: 1

                            }}
                            slotProps={{
                                input: {
                                    min: 1,
                                    max: 99,
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    onInput: (e) => {
                                        const value = Number(e.target.value);

                                        // if (value < 1) e.target.value = 1;
                                        if (value > 99) e.target.value = 99;
                                    }
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            size="small"
                            className="text-nowrap capitalize! text-xs"
                            onClick={() => {
                                if (formik.values.childPartCount > 0)
                                    handleAddPackingChildRow(formik.values.childPartCount, setGridRows)
                            }}
                        >
                            Add
                        </Button>
                    </div>

                    <div className='flex justify-end items-start w-full'>
                        <IconButton onClick={handleAddRow}>
                            <CiSquarePlus size={10 * 3} />
                        </IconButton>
                    </div>
                    <div className='flex justify-end items-center'>
                        <PartBomChilCopyFrom
                            onChange={handlePackingBomChildCopyFrom}
                            plant={formik.values.plant}
                            CCType={CCType}
                        />
                    </div>

                </div>

                <div style={{ marginTop: 16 }}>
                    <DataGrid
                        rows={gridRows}
                        columns={packBomChildColumns}
                        processRowUpdate={handleProcessRowUpdate}
                        hideFooter
                        disableRowSelectionOnClick
                        experimentalFeatures={{ newEditingApi: true }}
                        columnHeaderHeight={30}
                        rowHeight={30}
                        disableColumnMenu
                        sortingOrder={[]}
                        columnVisibilityModel={{
                            pri_secri: CCType === CCTypeEnum.PK ? true : false,
                            life: CCType === CCTypeEnum.TC ? true : false
                        }}
                        sx={{
                            ...CommonMuiStyles.dataGridSmallSx,
                            // fontSize: 12
                            minHeight: 300
                        }}
                    />
                </div>
            </DialogContent>
            <DialogActions sx={{ p: 0, pb: 2, pr: 3, pt: 2 }}>
                <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        formik.handleSubmit()
                    }} autoFocus>
                    {submitLoading ? "Loading..." : editData ? "Update" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    )
}



const PartBomChilCopyFrom = ({ onChange, plant, CCType }) => {
    const [packingBom, setPackingBom] = useState([]);
    const [open, setOpen] = useState(false);

    const formik = useFormik({
        initialValues: {
            copyFromPart: null
        },
        validationSchema: Yup.object({
            copyFromPart: Yup.object()
                .nullable()
                .required("Copy From part is required")
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                const payload = {
                    pack_mst_id: values.copyFromPart.value,
                    fg_part: values.copyFromPart.fg_part,
                    plant
                };

                onChange?.(payload);
                console.log("Copy successful", payload);

                setOpen(false);     // ✅ close dialog
                resetForm();        // ✅ reset form
            } catch (err) {
                console.error("Copy failed", err);
            } finally {
                setSubmitting(false);
            }
        }
    });

    useEffect(() => {
        if (!open || !plant) return;

        const fetchData = async () => {
            const response = await GetPackingBomApi({ plant: plant, type: CCType });
            setPackingBom(response.data);
        };

        fetchData();
    }, [plant, open]);

    return (
        <>
            {/* 🔘 OPEN DIALOG BUTTON */}
            <Button
                variant="contained"
                size="small"
                onClick={() => setOpen(true)}
                className="text-nowrap capitalize!"
                disabled={!plant}
            >
                Copy From
            </Button>

            {/* 🪟 DIALOG */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                {/* <DialogTitle>Copy Packing BOM</DialogTitle> */}

                <form onSubmit={formik.handleSubmit}>
                    <DialogContent className="space-y-2">
                        <label className="text-sm font-medium">
                            Select FG Part
                        </label>

                        <Select
                            name="copyFromPart"
                            options={packingBom.map(e => ({
                                value: e.pack_mst_id,
                                label: e.fg_part_no,
                                fg_part: e.fg_part
                            }))}
                            value={formik.values.copyFromPart}
                            onChange={(val) =>
                                formik.setFieldValue("copyFromPart", val)
                            }
                            onBlur={() =>
                                formik.setFieldTouched("copyFromPart", true)
                            }
                            placeholder="Select FG Part"
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: base => ({ ...base, zIndex: 1500 }),
                                control: base => ({
                                    ...base,
                                    minHeight: 36,
                                    borderColor:
                                        formik.touched.copyFromPart &&
                                            formik.errors.copyFromPart
                                            ? "#ef4444"
                                            : base.borderColor
                                })
                            }}
                        />

                        {formik.touched.copyFromPart &&
                            formik.errors.copyFromPart && (
                                <p className="text-xs text-red-500">
                                    {formik.errors.copyFromPart}
                                </p>
                            )}
                    </DialogContent>

                    <DialogActions className="px-6! py-3!">
                        <Button
                            onClick={() => setOpen(false)}
                            size="small"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            size="small"
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting ? "Copying..." : "Copy From"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
};



export default AddPackageBomDialog