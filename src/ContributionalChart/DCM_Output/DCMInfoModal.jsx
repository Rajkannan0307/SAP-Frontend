import React, { useState } from 'react'
import { Dialog, DialogTitle, IconButton, Typography, Box, Divider } from '@mui/material'
import { InfoIcon } from 'lucide-react'
import { MdOutlineCancel } from 'react-icons/md'

// ---------------------------------------------------------------------------
// Read-only documentation modal for the DCM Output screen — simple, linear,
// sheet-by-sheet explanation of what each sheet is based on and how it is
// calculated. Content mirrors the actual GetPackingBomReport SQL logic.
// ---------------------------------------------------------------------------

const SheetInfo = ({ no, name, tables, columns, basedOn, formula }) => {
    const lines = Array.isArray(formula) ? formula : [formula]
    return (
        <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#1434A4' }}>
                {no}. {name}
            </Typography>
            <Typography sx={{ fontSize: 12.5, mt: 0.3 }}>
                <b>Tables used:</b> {tables}
            </Typography>
            {columns && (
                <Typography sx={{ fontSize: 12.5, mt: 0.3 }}>
                    <b>Key columns:</b> {columns}
                </Typography>
            )}
            <Typography sx={{ fontSize: 12.5, mt: 0.3 }}>
                <b>Based on:</b> {basedOn}
            </Typography>
            <Box sx={{ mt: 0.5, backgroundColor: '#f5f6fa', borderRadius: 1, px: 1.2, py: 0.8 }}>
                {lines.map((line, idx) => (
                    <Typography key={idx} sx={{ fontSize: 12.5, fontFamily: 'monospace', color: '#1434A4' }}>
                        {line}
                    </Typography>
                ))}
            </Box>
        </Box>
    )
}

const SHEETS = [
    {
        name: 'Packing BOM',
        tables: 'Trn_Actual_Production_Plan, Mst_Packing_BOM, Mst_Packing_BOM_Child, Mst_Material, Mst_Material_Type, Trn_IDM_Price, Mst_Plant',
        columns: 'plant, part_number, prod_qty (summed), box_qty, child_part_no, child_qty (BOM Qty), Mat_Type, price',
        basedOn: 'The finished good\'s latest active Packing BOM (as of month end) + actual production qty summed for the month + latest material price.',
        formula: [
            'Planned Qty = (Prod Qty ÷ Box Qty) × BOM Qty',
            'Price = latest price on/before month end',
            'Plan Value = Planned Qty × Price',
        ],
    },
    {
        name: 'Stores & Spares',
        tables: 'Same tables as Packing BOM, filtered to BOM type = Stores & Spares',
        columns: 'box_qty, child_qty (BOM Qty), life, prod_qty, price',
        basedOn: 'Latest active Stores & Spares BOM (has a "Life" — number of production units before the part is replaced) + actual production qty + latest price.',
        formula: [
            'Planned Qty = Prod Qty × (BOM Qty ÷ Life)',
            'Plan Value = Planned Qty × Price',
        ],
    },
    {
        name: 'Sub Contract',
        tables: 'Same tables as Packing BOM, filtered to BOM type = Sub Contract',
        columns: 'child_qty (BOM Qty), prod_qty, price',
        basedOn: 'Latest active Sub Contract BOM + actual production qty + latest price.',
        formula: [
            'Planned Qty = Prod Qty × BOM Qty',
            'Plan Value = Planned Qty × Price',
        ],
    },
    {
        name: 'BOM Plan vs Actual (Child Part Consumption)',
        tables: 'Combined Packing + Stores & Spares + Sub Contract results, Trn_Monthly_Consumption, Mst_Material, Mst_Plant',
        columns: 'child_part_no, plan_consumption_qty, plan_consumption_value, cons_qty, cons_value, Mat_Type',
        basedOn: 'Rolls up planned qty/value per child part across all 3 BOM types above, then compares against actual consumption booked for the month.',
        formula: [
            'Plan Qty = SUM(Planned Qty across all uses)   Plan Value = SUM(Planned Value)',
            'Actual Qty = actual consumption booked for the month',
            '  → for LEIH / SERV material categories, Actual Qty = Plan Qty (no separate actual is tracked)',
            'Diff Qty = Actual Qty − Plan Qty     Diff Value = Actual Value − Plan Value',
        ],
    },
    {
        name: 'Sales Actual',
        tables: 'GRN_Sales_Data, MaterialMaster (Sales/Marketing system)',
        columns: 'Invoice_Date, Sales_Plant, FG_Part_Code, Sals_Qty, Sale_Value_in_INR, MaterialDescription',
        basedOn: 'Sales invoice data for the selected plant and month.',
        formula: [
            'Qty = SUM(Sales Qty)     Value = SUM(Sale Value)',
            'Avg Selling Price = Sale Value ÷ Sales Qty',
        ],
    },
    {
        name: 'Sales Plan',
        tables: 'Monthly_Plan, PlantMaster, MaterialMaster (Sales/Marketing system)',
        columns: 'Plan_Date, PlantCode, Material, Qty, SaleValue, WorkingDay, MTD_Day',
        basedOn: 'Monthly sales plan master data, as maintained by the Sales team.',
        formula: [
            'Avg Selling Price = Plan Sale Value ÷ Plan Qty',
            'Working Day / MTD Day are taken directly from the plan (used later for the Flex Plan calculation).',
        ],
    },
    {
        name: 'Production Actual',
        tables: 'Trn_Actual_Production_Plan, Mst_Plant, Mst_Material, Trn_IDM_Price',
        columns: 'prod_date, plant, part_number, prod_qty, price',
        basedOn: 'Daily actual production entries + latest material price, shown per part per day.',
        formula: ['Prod Value = Prod Qty × Price'],
    },
    {
        name: 'Production Plan',
        tables: 'Trn_Production_Plan (Monthly Plan type), Mst_Plant, Mst_Material, Trn_IDM_Price',
        columns: 'effective_date, plant, part_number, plan_qty, price',
        basedOn: 'Monthly production plan master data + latest material price.',
        formula: ['Prod Value = SUM(Plan Qty × Price)'],
    },
    {
        name: 'Labour Flex Plan',
        tables: 'Trn_Production_Plan, Trn_PMPD_Master, Mst_Product_Segment',
        columns: 'plan_qty, plan_type (AOP/MP), PMPD_SMH, production, inspection, packing, end_qty, seg_name',
        basedOn: 'Required headcount for Production, Inspection and Packing, computed from the Production Plan and the plant\'s productivity norm.',
        formula: [
            'Rate = PMPD value directly, OR  8.0 ÷ (SMH % ÷ 100)  if norm type is SMH',
            'Headcount = (Plan Qty × Ends per Piece ÷ Rate) ÷ 25 working days',
            '(same formula applied separately for Production, Inspection and Packing)',
        ],
    },
    {
        name: 'Labour Cost Actual',
        tables: 'HR system: trainee/employee master, attendance, overtime, holiday calendars, department/role/line masters',
        columns: 'present_type, hours (OT), att_date, holiday_date, apprentice_type, Wrk_Category',
        basedOn: 'Employee-level attendance and overtime for the month — only "Work Category 01" employees, leave days excluded.',
        formula: [
            'Working Days = Total Days in month − Weekend Days',
            '  (Plant 1000: Sat + Sun are weekend | All other plants: Sun only)',
            'Mandays = (Present Days + OT Hours÷8) ÷ (Working Days − Festival/Alternate Holidays)',
        ],
    },
    {
        name: 'Labour Cost Working',
        tables: 'Labour Flex Plan + Labour Cost Actual results, Category Breakup master',
        columns: 'category (Operator / Trainee / Casual Labour), value (%), avg_salary',
        basedOn: 'Splits total headcount into Operator / Trainee / Casual Labour using fixed % from master data, each costed at its own average salary.',
        formula: [
            'Operator Cost = Operator Headcount × Operator Avg Salary',
            'Remaining Headcount = Flex Plan − Operator Headcount',
            'Trainee Cost = (Remaining HC × Trainee %) × Trainee Avg Salary',
            'Casual Labour Cost = (Remaining HC × CL %) × CL Avg Salary',
            'Variance = Actual Cost − Plan Cost   (per category)',
        ],
    },
    {
        name: 'Power Cost Details',
        tables: 'Trn_Actual_Production_Plan, Mst_Material, Mst_Power_Unit',
        columns: 'prod_qty, unit_per_part, eff_date',
        basedOn: 'Actual production qty + the power units required per part (from Power Unit master).',
        formula: ['Planned Power Units = Prod Qty × Unit per Part'],
    },
    {
        name: 'Power Cost Summary',
        tables: 'Trn_Daily_Power_Consumption, Trn_Power_Mix_Ratio',
        columns: 'eb / dg / wind / solar (units consumed), mix % per source, unit cost per source',
        basedOn: 'Total planned power units split across EB / DG / Wind / Solar using the plant\'s fixed mix %, compared to units and cost actually consumed.',
        formula: [
            'Flex Units (per source) = Total Planned Units × Source Mix %',
            'Flex Cost = Flex Units × Source Unit Rate',
            'Actual Cost = Actual Units Consumed × Source Unit Rate',
            'Gap = Actual Cost − Flex Cost',
            'A "Total Unit Consumption" row sums all 4 sources.',
        ],
    },
    {
        name: 'DCM (Summary)',
        tables: 'All sheets above, rolled up per plant for the month',
        columns: 'Plant, Description, Flex_Plan, Actual, GAP, Metric',
        basedOn: 'The headline comparison view — Sales, Production, and each cost category, Flex Plan vs. Actual.',
        formula: [
            'Sales / Production rows: Flex Plan = (Monthly Plan Value ÷ Working Days) × Days Elapsed (MTD)',
            '  Gap = Actual − Flex Plan   (shown in ₹ Crores)',
            'Packing / Stores & Spares / Sub Contract / Labour / Power rows:',
            '  Gap = Actual − Planned   (shown in ₹ Lakhs)',
            'A TOTAL row sums all 5 cost categories.',
        ],
    },
    {
        name: 'Missing FG Part',
        tables: 'Sales Actual data, Packing/Stores/Sub-Contract BOM results, Production Actual',
        columns: 'FG_Part_Code, MaterialDescription, Sals_Qty, Prod_Qty',
        basedOn: 'A data-quality check listing any finished good that has Sales but no matching BOM of a given type — so it was excluded from that BOM\'s planned-consumption calculation.',
        formula: ['No formula — a straight listing, shown separately for Packing / Stores & Spares / Sub Contract BOM types.'],
    },
    {
        name: 'Consumption Actual',
        tables: 'Trn_Monthly_Consumption, Mst_Material, Mst_Plant',
        columns: 'child_material_id, cons_qty, cons_date, doc_date, cons_value, doc_no',
        basedOn: 'The raw list of every material consumption transaction booked for the plant and month — the source detail behind the "Actual" figures used in the sheets above.',
        formula: ['No calculation — shown exactly as recorded.'],
    },
]

const DCMInfoModal = () => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <IconButton
                size="small"
                onClick={() => setOpen(true)}
                title="How is this data calculated?"
                sx={{ color: '#1434A4', p: 0.4 }}
            >
                <InfoIcon size={16} />
            </IconButton>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { maxHeight: '85vh' } }}
            >
                <DialogTitle sx={{ pl: 2, pr: 1, py: 1, borderBottom: '1px solid #eee' }}>
                    <div className="flex justify-between items-center">
                        <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#1434A4' }}>
                            How DCM Output is Calculated
                        </Typography>
                        <IconButton size="small" onClick={() => setOpen(false)}>
                            <MdOutlineCancel size={20} />
                        </IconButton>
                    </div>
                </DialogTitle>

                <Box sx={{ p: 2, overflowY: 'auto' }}>
                    <Typography sx={{ fontSize: 12.5, color: '#555', mb: 2 }}>
                        Every value on this screen compares <b>Planned</b> vs. <b>Actual</b> for the selected Plant and Month.
                        Below is what each generated Excel sheet is based on and how it's calculated, in order:
                    </Typography>

                    {SHEETS.map((s, i) => (
                        <React.Fragment key={s.name}>
                            <SheetInfo no={i + 1} name={s.name} tables={s.tables} columns={s.columns} basedOn={s.basedOn} formula={s.formula} />
                            {i < SHEETS.length - 1 && <Divider sx={{ mb: 2 }} />}
                        </React.Fragment>
                    ))}

                    <Divider sx={{ my: 1.5 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#b45309', mb: 0.5 }}>
                        Known Data Notes
                    </Typography>
                    <Box component="ul" sx={{ fontSize: 12, pl: 2.2, m: 0, color: '#555', '& li': { mb: 0.6 } }}>
                        <li>The DCM Summary's category labels (Packing / Stores & Spares / Sub Contract) and the Missing FG Part sheet rely on matching a BOM type code — if this match fails for any reason, those rows may show as "Others" or list parts that already have a valid BOM. If you notice this, please flag it to IT for verification.</li>
                    </Box>
                </Box>
            </Dialog>
        </>
    )
}

export default DCMInfoModal
