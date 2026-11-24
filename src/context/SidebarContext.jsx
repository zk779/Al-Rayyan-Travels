// src/context/SidebarContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const COLLAPSED_KEY = "sidebarCollapsed";

// Create the Sidebar context
const SidebarContext = createContext();

// Sidebar provider to wrap your app
export const SidebarProvider = ({ children }) => {
  // collapsed / expanded is remembered on this browser, so a refresh keeps the user's choice
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, isCollapsed ? "1" : "0");
    } catch {
      /* storage blocked — it just won't be remembered */
    }
  }, [isCollapsed]);
  const [sidebarHidden, setSidebarHidden] = useState(false); // New flag


  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        sidebarHidden,
        setSidebarHidden,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

// Custom hook to use Sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
