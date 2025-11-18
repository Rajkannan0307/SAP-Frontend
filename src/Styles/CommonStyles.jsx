
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