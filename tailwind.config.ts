import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7CB8A0",
        secondary: "#E8A87C",
        accent: "#C1A0D0",
        cream: "#F5F0E8",
        danger: "#D06B6B",
        "tag-board": "#6BA3D0",
        "tag-outdoor": "#7CB8A0",
        "tag-all": "#E8A87C",
      },
      fontFamily: {
        pretendard: ["Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
