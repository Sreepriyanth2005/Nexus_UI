/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        "surface-3": "var(--surface-3)",

        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-mute": "var(--ink-mute)",
        "ink-faint": "var(--ink-faint)",

        honey: "var(--c-honey)",
        "honey-soft": "var(--c-honey-soft)",
        "honey-wash": "var(--c-honey-wash)",
        "honey-text": "var(--c-honey-text)",

        sage: "var(--c-sage)",
        "sage-soft": "var(--c-sage-soft)",
        "sage-wash": "var(--c-sage-wash)",
        "sage-text": "var(--c-sage-text)",

        clay: "var(--c-clay)",
        "clay-soft": "var(--c-clay-soft)",
        "clay-wash": "var(--c-clay-wash)",
        "clay-text": "var(--c-clay-text)",

        danger: "var(--c-danger)",
        "danger-deep": "var(--c-danger-deep)",
        "danger-wash": "var(--c-danger-wash)",

        accent: "var(--accent)",
        "accent-deep": "var(--accent-deep)",

        "hero-bg": "var(--hero-bg)",
        "hero-bg-deep": "var(--hero-bg-deep)",

        line: "var(--line)",
        "line-strong": "var(--line-strong)",
      },

      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },

      fontSize: {
        hero: "var(--fs-hero)",
        h1: "var(--fs-h1)",
        h2: "var(--fs-h2)",
        h3: "var(--fs-h3)",
        body: "var(--fs-body)",
        meta: "var(--fs-meta)",
        label: "var(--fs-label)",
        micro: "var(--fs-micro)",
      },

      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
      },

      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        11: "var(--space-11)",
        12: "var(--space-12)",
        13: "var(--space-13)",
        14: "var(--space-14)",
        15: "var(--space-15)",
      },

      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        pill: "var(--r-pill)",
      },

      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        card: "var(--shadow-card)",
        hover: "var(--shadow-hover)",
      },

      transitionTimingFunction: {
        nexus: "var(--tn)",
      },
    },
  },
  plugins: [],
};