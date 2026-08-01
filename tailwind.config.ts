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
        primary: "#6EA896",
        secondary: "#D4956A",
        accent: "#B08FC0",
        cream: "#F7F4EF",
        danger: "#C45C5C",
        "tag-board": "#5A8FBA",
        "tag-outdoor": "#6EA896",
        "tag-all": "#D4956A",
        "dark-bg": "#161622",
        "dark-card": "#1e1e32",
        "dark-border": "#2c2c48",
      },
      fontFamily: {
        pretendard: ["Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
