import Sidebar from "./Sidebar";
import Header from "./Header"; // Import the Header component
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import { useContext } from "react";

const Layout = () => {
  const { isCollapsed, sidebarHidden } = useSidebar();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const location = useLocation(); // Access current route

  // Determine the margin-left class based on sidebar state and current route
  let sidebarMarginClass = location.pathname === "/" ? "ml-0" : "ml-64"; // Default: sidebar expanded
  if (sidebarHidden) {
    sidebarMarginClass = "ml-0"; // Sidebar hidden on mobile
  } else if (isCollapsed && location.pathname !== "/") {
    sidebarMarginClass = "ml-20"; // Sidebar collapsed (except for / route)
  }

  // Don't render sidebar and header for the / route
  const showSidebarAndHeader = location.pathname !== "/";

  // Determine padding for the content area (p-6 for normal routes, p-0 for / route)
  const contentPaddingClass = location.pathname === "/" ? "p-0" : "p-6";

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      {showSidebarAndHeader && <Sidebar />}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarMarginClass} bg-gray-50 text-gray-800 min-h-screen`}
      >
        {/* Header */}
        {showSidebarAndHeader && <Header />}

        {/* Page Content */}
        <div className={`${contentPaddingClass} flex-1`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
