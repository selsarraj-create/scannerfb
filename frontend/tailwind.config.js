/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'pastel-bg': '#fdfbf7',     // Cream/Off-white
                'pastel-card': '#ffffff',   // White
                'pastel-accent': '#ffb7b2', // Pastel Rose
                'pastel-text': '#4a4a4a',   // Dark Gray
                'pastel-muted': '#888888',  // Muted Gray for secondary text
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'scan': 'scan 4s linear infinite',
            },
            keyframes: {
                scan: {
                    '0%': { top: '0%' },
                    '100%': { top: '100%' },
                }
            }
        },
    },
    plugins: [],
}
