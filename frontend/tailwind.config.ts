import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:    "#0A2E28",
        teal:       "#0E6655",
        tealLight:  "#2ECC9E",
        tealBg:     "#E1F5EE",
        mama:       "#E67E22",
        mamaLight:  "#FFF7ED",
        mamaDark:   "#9A3412",
        gold:       "#D4A017",
        goldLight:  "#FEF9E7",
        ivory:      "#FAFAF8",
        card:       "#FFFFFF",
        ink:        "#1A1208",
        inkMid:     "#6B6560",
        inkLight:   "#A89880",
        correct:    "#16A34A",
        wrong:      "#DC2626",
        dark:       "#0A0A0A",
        darkCard:   "#111111",
      },
      fontFamily: {
        sans:  ["Plus Jakarta Sans", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      borderRadius: {
        xl2: "20px",
        xl3: "28px",
        xl4: "32px",
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0,0,0,0.06)",
        card: "0 4px 12px rgba(0,0,0,0.04)",
        mama: "0 8px 24px rgba(230,126,34,0.15)",
        teal: "0 8px 24px rgba(14,102,85,0.15)",
      },
      backgroundImage: {
        "gradient-page":         "linear-gradient(to bottom,#FAFAF8,#F5F0E8)",
        "gradient-mama":         "linear-gradient(135deg,#FEF9C3,#FFEDD5)",
        "gradient-kitty":        "linear-gradient(135deg,#FFF7ED,#FFEDD5)",
        "gradient-header":       "linear-gradient(135deg,#0A2E28,#0A4A3C)",
        "gradient-mama-answer":  "linear-gradient(135deg,#F0FDF4,#DCFCE7)",
        "gradient-blue":         "linear-gradient(135deg,#DBEAFE,#BFDBFE)",
        "gradient-green":        "linear-gradient(135deg,#DCFCE7,#BBF7D0)",
        "gradient-yellow":       "linear-gradient(135deg,#FEF9C3,#FEF08A)",
        "gradient-teal":         "linear-gradient(135deg,#CCFBF1,#99F6E4)",
      },
    },
  },
  plugins: [],
};

export default config;
