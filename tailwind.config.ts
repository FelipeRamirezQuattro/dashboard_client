/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        osi: {
          primary: "#fbad37",
          "primary-dark": "#e09520",
          secondary: "#596376",
          "secondary-light": "#7a8699",
          bg: "#f8fafc",
          dark: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
      animation: {
        "page-enter": "pageEnter 250ms ease-out both",
      },
      keyframes: {
        pageEnter: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
