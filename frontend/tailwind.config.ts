import type { Config } from "tailwindcss";

// Design tokens for the Kashi Banaras brand — luxury Indian fashion house,
// not a generic e-commerce template. See docs/architecture.md for rationale.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#141210", // near-black warm charcoal, not pure #000
          light: "#1F1B17",
        },
        ivory: {
          DEFAULT: "#FAF6EF",
          dark: "#F0E9DA",
        },
        gold: {
          DEFAULT: "#B8935A", // muted antique gold — not neon/CSS-gradient gold
          light: "#D4B483",
          dark: "#8C6C3F",
        },
        maroon: "#6E1423", // reserved for saree-color accents, used sparingly
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"], // headings
        sans: ["'Inter'", "system-ui", "sans-serif"],         // body
      },
      letterSpacing: {
        widest2: "0.25em",
      },
      maxWidth: {
        content: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
