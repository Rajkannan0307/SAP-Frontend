/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'funBlue': {
                    default: '#195eac',
                    50: '#F0F7FA',
                    100: '#E4F1F7',
                    200: '#B9DAEB',
                    300: '#92C2DE',
                    400: '#5190C4',
                    500: '#195eac',
                    600: '#155199',
                    700: '#0E3B80',
                    800: '#092B66',
                    900: '#051D4D',
                    950: '#021030',
                },
                'turquoise': {
                    default: '#40E0D0',
                    '50': '#F2FCFC',
                    '100': '#EBFCFC',
                    '200': '#CBF7F4',
                    '300': '#AEF2EE',
                    '400': '#75EBE1',
                    '500': '#40E0D0',
                    '600': '#34C9B3',
                    '700': '#25A88C',
                    '800': '#178767',
                    '900': '#0D6647',
                    '950': '#054229'
                }
            }
        },
    },
    plugins: [],
}



export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            colors: {
                'funBlue': {
                    default: '#195eac',
                    50: '#F0F7FA',
                    100: '#E4F1F7',
                    200: '#B9DAEB',
                    300: '#92C2DE',
                    400: '#5190C4',
                    500: '#195eac',
                    600: '#155199',
                    700: '#0E3B80',
                    800: '#092B66',
                    900: '#051D4D',
                    950: '#021030',
                },
                'turquoise': {
                    default: '#40E0D0',
                    '50': '#F2FCFC',
                    '100': '#EBFCFC',
                    '200': '#CBF7F4',
                    '300': '#AEF2EE',
                    '400': '#75EBE1',
                    '500': '#40E0D0',
                    '600': '#34C9B3',
                    '700': '#25A88C',
                    '800': '#178767',
                    '900': '#0D6647',
                    '950': '#054229'
                }
            }
        },
    },
    plugins: [],
};
