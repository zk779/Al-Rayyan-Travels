import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import { useContext } from "react";
import FloatingCalculator from "./FloatingCalculator";

const Layout = () => {
  const { isCollapsed, sidebarHidden } = useSidebar();
  const { isDarkMode } = useContext(ThemeContext);
  const location = useLocation();

const hideSidebarAndHeader =
  location.pathname === "/" ||
  location.pathname === "/login" ||
  location.pathname === "/403" ||
  location.pathname.startsWith("/invoice-print/") ||
  location.pathname.startsWith("/customer-invoice/") ||
  location.pathname.startsWith("/view-invoice/");

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
    // ✅ LanguageProvider wraps Sidebar + Header so only they can consume
    // the language toggle (rest of the app is untouched, as requested).
    <LanguageProvider>
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

        {/* Floating calculator — available everywhere except the "/" landing
            route and bare document-style pages (invoice print / customer
            invoice / view invoice) */}
        {location.pathname !== "/" &&
          !location.pathname.startsWith("/invoice-print/") &&
          !location.pathname.startsWith("/customer-invoice/") &&
          !location.pathname.startsWith("/view-invoice/") && <FloatingCalculator />}
      </div>
    </LanguageProvider>
  );
};

export default Layout;