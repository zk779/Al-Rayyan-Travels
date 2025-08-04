module.exports = {
  darkMode: "class", // Add this line to enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: "#1e293b", // Custom primary color
        "gradient-primary": "linear-gradient(to top left, #6b7280, #1e293b)", // Custom gradient color
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to top left, #6b7280, #1e293b)", // Custom gradient background
      },
    },
  },
  plugins: [],
};
