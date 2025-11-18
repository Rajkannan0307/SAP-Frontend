
export const CommonMuiStyles = {
    textFieldSmallSx: {
        "& .MuiInputBase-input": {
            padding: "2px 6px",
            fontSize: "12px",
            height: "20px",
        },
        "& .MuiOutlinedInput-root": {
            height: "28px",
        }
    },
    textFieldSmallSx2: {
        fontSize: "12px",

        // Label style
        "& .MuiInputLabel-root": {
            fontSize: "12px",
            top: "-0px"               // fix misalignment
        },

        // Shrinked floating label
        "& .MuiInputLabel-shrink": {
            transform: "translate(14px, -6px) scale(0.75)",
        },

        // Input box
        "& .MuiOutlinedInput-root": {
            height: "42px",           // full height
            fontSize: "12px",

            "& fieldset": {
                top: 0
            },

            // Fix the legend (label border space)
            "& legend": {
                fontSize: "8px"
            }
        },

        // Input text
        "& .MuiInputBase-input": {
            padding: "4px 8px",       // compact input padding
            fontSize: "12px",
            height: "20px",
            boxSizing: "border-box",
        }
    },

    dataGridSmallSx: {
        fontSize: "12px",

        // Header container
        "& .MuiDataGrid-columnHeaders": {
            minHeight: "32px !important",
            maxHeight: "32px !important",
            backgroundColor: "#e0e0e0",   // CHANGE COLOR HERE
        },

        // Individual header cells
        "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#e0e0e0",   // SAME COLOR HERE
        },

        "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 500,
            fontSize: "12px",
        },

        "& .MuiDataGrid-cell": {
            padding: "2px 6px",
            fontSize: "12px",
            lineHeight: "1.2rem",
        },

        "& .MuiDataGrid-row": {
            maxHeight: "30px !important",
            minHeight: "30px !important",
        }
    }
};