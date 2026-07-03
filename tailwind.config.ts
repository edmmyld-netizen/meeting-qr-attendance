import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          50: "#eff6ff", 100: "#dbeafe", 500: "#2563eb",
          600: "#1d4ed8", 700: "#1e40af", 800: "#1e3a8a", 900: "#172554"
        }
      }
    }
  },
  plugins: []
};
export default config;
