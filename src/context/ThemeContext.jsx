// src/context/ThemeContext.js

import React, { createContext, useState, useEffect } from "react";

// Create Context
export const ThemeContext = createContext();

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  // Set the default theme from local storage or default to light
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Toggle the theme and store it in localStorage
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  console.log("ThemeContext: isDarkMode =", isDarkMode);

  // Apply the theme to the html tag when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark"); // Add the dark class to html
    } else {
      document.documentElement.classList.remove("dark"); // Remove the dark class from html
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
