// src/context/SidebarContext.js
import React, { createContext, useContext, useState } from "react";

// Create the Sidebar context
const SidebarContext = createContext();

// Sidebar provider to wrap your app
export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false); // New flag

  console.log("sidebarHidden:", sidebarHidden);
  console.log("Sidebar Collapse:", isCollapsed);

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
