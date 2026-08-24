import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#36a7f7",
          500: "#0c8ce9",
          600: "#026fc7",
          700: "#0358a1",
          800: "#074b84",
          900: "#0c3f6e",
          950: "#082849",
        },
      },
    },
  },
  plugins: [],
};
export default config;
