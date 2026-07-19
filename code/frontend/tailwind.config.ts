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
        background: "var(--color-paper)",
        foreground: "var(--color-ink)",
        paper: {
          DEFAULT: "var(--color-paper)",
          1: "var(--color-paper)",
          2: "var(--color-paper-2)",
          3: "var(--color-paper-3)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          1: "var(--color-ink)",
          2: "var(--color-ink-2)",
        },
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-ink)",
        },
        focus: "var(--color-focus)",
        rule: "var(--color-rule)",
        muted: "var(--color-muted)",
        ai: {
          start: "var(--color-ai-gradient-start)",
          end: "var(--color-ai-gradient-end)",
        }
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      backgroundImage: {
        'gradient-ai': 'linear-gradient(to right, var(--color-ai-gradient-start), var(--color-ai-gradient-end))',
      }
    },
  },
  plugins: [],
};
export default config;
