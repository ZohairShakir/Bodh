import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        silver: "#8a909a",
        gold: "#c8a96e",
        bodh: {
          indigo: "#6c63ff",
          accent: "#7c6fff",
          black: "#060606",
          silver: "#8a909a",
        }
      },
    },
  },
  plugins: [],
};
export default config;
