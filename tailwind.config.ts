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
        plum: { DEFAULT: "#5B1E70", deep: "#44125A", mid: "#7A3A94", tint: "#F3E3F7" },
        gold: { DEFAULT: "#D4AF37", pale: "#F2D98A", deep: "#8A6318" },
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
        card: "0 1px 2px rgba(68,18,90,.06), 0 12px 32px -12px rgba(68,18,90,.18)",
        lift: "0 18px 40px -16px rgba(68,18,90,.28)",
        bar: "0 -8px 24px rgba(68,18,90,.14)",
      },
      maxWidth: { container: "1200px" },
    },
  },
  plugins: [],
};

export default config;
