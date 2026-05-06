/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nerdy: {
          nav: "#12163A",
          page: "#F0F2FA",
          ink: "#12163A",
          muted: "#6B7280",
          teal: "#4DD9D5",
          purple: "#7C3AED",
          danger: "#F87171",
        },
        accent: {
          DEFAULT: "#4DD9D5",
          bright: "#6FE8E4",
          dim: "#2DBCB8",
          muted: "#E8FBFA",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.05)",
        "card-hover": "0 4px 14px -2px rgb(15 23 42 / 0.1), 0 2px 6px -2px rgb(15 23 42 / 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.35s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
