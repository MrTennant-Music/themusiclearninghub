/**
 * Production Tailwind settings for the published Music Learning Hub.
 * The `all` media type makes existing desktop utility variants unconditional
 * without adding viewport-width breakpoints to the published stylesheet.
 */
module.exports = {
  content: [
    "./*.html",
    "./*.js",
    "./*.jsx",
    "./digital-question-papers/**/*.js",
    "./shared/**/*.js",
    "./music-dictionary/**/*.js",
  ],
  theme: {
    screens: {
      sm: { raw: "all" },
      md: { raw: "all" },
      lg: { raw: "all" },
      xl: { raw: "all" },
      "2xl": { raw: "all" },
    },
  },
};
