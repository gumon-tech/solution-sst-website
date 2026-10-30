import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FDFCF0",
        sand: "#F5F2DF",
        stone: "#DCD7C0",
        ink: { DEFAULT: "#2C2C2C", 2: "#4A4A4A" },
        plum: { DEFAULT: "#362140", deep: "#2D1B36", mid: "#5A3A6B", tint: "#EEE6F1" },
        gold: { DEFAULT: "#C5A059", pale: "#E8D4A2", deep: "#7A5F2A" },
        whatsapp: "#25D366",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "r-sm": "8px",
        "r-md": "16px",
        "r-frame": "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(45,27,54,.06), 0 12px 32px -12px rgba(45,27,54,.18)",
        lift: "0 18px 40px -16px rgba(45,27,54,.28)",
        bar: "0 -8px 24px rgba(45,27,54,.14)",
      },
      maxWidth: { container: "1200px" },
    },
  },
  plugins: [],
};

export default config;
