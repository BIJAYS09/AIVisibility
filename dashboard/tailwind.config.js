/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          800: "#3730a3",
          900: "#1e1b4b",
        },
      },
    },
  },
  plugins: [],
};
