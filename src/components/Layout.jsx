import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageProvider, useLanguage } from "../context/LanguageContext";
import { useContext } from "react";
import FloatingCalculator from "./FloatingCalculator";

const LayoutContent = () => {
  const { isRTL } = useLanguage();
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

  // The page makes room on the side where the sidebar is: left in English, right in Arabic.
  // (Whole class names, so Tailwind can see them.)
  const M = isRTL ? { full: "mr-64", collapsed: "mr-20", none: "mr-0" } : { full: "ml-64", collapsed: "ml-20", none: "ml-0" };
  let sidebarMarginClass = hideSidebarAndHeader ? M.none : M.full; // Default expanded

  if (!hideSidebarAndHeader) {
    if (sidebarHidden) {
      sidebarMarginClass = M.none; // Sidebar hidden on mobile
    } else if (isCollapsed) {
      sidebarMarginClass = M.collapsed; // Sidebar collapsed
    }
  }

  // Determine padding for the content area
  const contentPaddingClass = hideSidebarAndHeader ? "p-0" : "p-6 print:p-0";

  return (
      <div className={`min-h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
        {/* Sidebar */}
        {!hideSidebarAndHeader && <Sidebar />}

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${sidebarMarginClass} print:ml-0 print:mr-0 bg-gray-50 print:bg-white text-gray-800 min-h-screen`}
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
  );
};

// ✅ LanguageProvider wraps Sidebar + Header (+ the page margin) so only they can consume
// the language toggle (rest of the app is untouched, as requested).
const Layout = () => (
  <LanguageProvider>
    <LayoutContent />
  </LanguageProvider>
);

export default Layout;