/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#7047EB",
        "brand-soft": "#F3EFFF",
      },
      boxShadow: {
        sheet: "0 -8px 24px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
