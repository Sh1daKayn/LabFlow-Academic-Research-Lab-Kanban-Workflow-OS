import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lab: {
          accent: "var(--lab-accent)",
          accentHover: "var(--lab-accent-hover)",
          accentLight: "var(--lab-accent-light)",
          accentBorder: "var(--lab-accent-border)",
          canvas: "var(--lab-bg-canvas)",
          surface: "var(--lab-bg-surface)",
          card: "var(--lab-bg-card)",
          elevated: "var(--lab-bg-elevated)",
          hover: "var(--lab-bg-hover)",
          borderSubtle: "var(--lab-border-subtle)",
          borderStrong: "var(--lab-border-strong)",
        },
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
