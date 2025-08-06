// src/components/Layout.jsx
import Sidebar from "./Sidebar";
import Header from "./Header"; // Import the Header component
import { Outlet } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import { useContext } from "react";

const Layout = () => {
  const { isCollapsed, sidebarHidden } = useSidebar();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Determine the margin-left class based on sidebar state
  let sidebarMarginClass = "ml-64"; // Default: sidebar expanded
  if (sidebarHidden) {
    sidebarMarginClass = "ml-0"; // Sidebar hidden on mobile
  } else if (isCollapsed) {
    sidebarMarginClass = "ml-20"; // Sidebar collapsed
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarMarginClass} bg-gray-50 text-gray-800 min-h-screen`}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
