/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  prefix: "tw-",
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      boxShadow: {
        terminal: "0 32px 90px rgba(2, 8, 23, 0.45)",
      },
      colors: {
        terminal: {
          950: "#020617",
          900: "#0f172a",
          800: "#162235",
          700: "#1f2f46",
          accent: "#39d0a8",
          amber: "#f59e0b",
          red: "#f87171",
        },
      },
      fontFamily: {
        body: [
          "Mukta",
          "Noto Sans Devanagari",
          "Noto Sans Bengali",
          "Noto Sans Gurmukhi",
          "Noto Sans Gujarati",
          "Noto Sans Kannada",
          "Noto Sans Malayalam",
          "Noto Sans Oriya",
          "Noto Sans Tamil",
          "Noto Sans Telugu",
          "Noto Naskh Arabic",
          "sans-serif",
        ],
        display: ["Prata", "Noto Sans Devanagari", "serif"],
      },
      keyframes: {
        "terminal-fade": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "terminal-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(57, 208, 168, 0)" },
          "50%": { boxShadow: "0 0 28px rgba(57, 208, 168, 0.16)" },
        },
      },
      animation: {
        "terminal-fade": "terminal-fade 280ms ease-out both",
        "terminal-glow": "terminal-glow 2.4s ease-in-out infinite",
      },
    },
  },
};
