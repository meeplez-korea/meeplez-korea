import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary))",
          light: "rgb(var(--primary-light))",
          dark: "rgb(var(--primary-dark))",
        },
        secondary: "#D4956C",
        accent: "#B08EC0",
        cream: {
          DEFAULT: "#EFEFEF",
          dark: "#E5E5E5",
        },
        danger: "#C45C5C",
        "tag-board": "#5A90B8",
        "tag-outdoor": "#6BA68E",
        "tag-all": "#D4956C",
        "dark-bg": "#161618",
        "dark-card": "#1E1E22",
        "dark-border": "#2A2A30",
        "dark-hover": "#28282E",
      },
      fontFamily: {
        pretendard: ["Pretendard", "sans-serif"],
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        "card-dark": "0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)",
        "card-dark-hover": "0 8px 24px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
