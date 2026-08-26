/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          base: "#0F1117",
          surface: "#181B24",
          elevated: "#212634",
          border: "#282E3E",
          hover: "#2D3446",
        },
        git: {
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444",
          indigo: "#6366F1",
          cyan: "#06B6D4",
        },
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
