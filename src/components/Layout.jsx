import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import { useContext } from "react";

const Layout = () => {
  const { isCollapsed, sidebarHidden } = useSidebar();
  const { isDarkMode } = useContext(ThemeContext);
  const location = useLocation();

const hideSidebarAndHeader =
  location.pathname === "/" ||
  location.pathname === "/login" ||
  location.pathname === "/403" ||
  location.pathname.startsWith("/invoice-print/");

  // Determine margin-left class based on sidebar state and current route
  let sidebarMarginClass = hideSidebarAndHeader ? "ml-0" : "ml-64"; // Default expanded

  if (!hideSidebarAndHeader) {
    if (sidebarHidden) {
      sidebarMarginClass = "ml-0"; // Sidebar hidden on mobile
    } else if (isCollapsed) {
      sidebarMarginClass = "ml-20"; // Sidebar collapsed
    }
  }

  // Determine padding for the content area
  const contentPaddingClass = hideSidebarAndHeader ? "p-0" : "p-6";

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      {!hideSidebarAndHeader && <Sidebar />}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarMarginClass} bg-gray-50 text-gray-800 min-h-screen`}
      >
        {/* Header */}
        {!hideSidebarAndHeader && <Header />}

        {/* Page Content */}
        <div className={`${contentPaddingClass} flex-1`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
