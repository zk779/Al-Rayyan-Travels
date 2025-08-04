import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  List,
  FileText,
  FilePlus,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  PieChart,
  Sun,
  Moon,
  NotebookPen,
  ChevronDown,
  ChevronUp,
  Plane,
  Store,
  HandCoins,
  Receipt,
  LandmarkIcon,
  Wallet,
  SaudiRiyal,
  icons,
  RotateCcwIcon,
  Plus,
  BookCheck,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import LogoLight from "../assets/logo-light.png";
import LogoDark from "../assets/logo-dark.png";

const Sidebar = () => {
  const { isCollapsed, setIsCollapsed, sidebarHidden, setSidebarHidden } =
    useSidebar();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const [activePath, setActivePath] = useState(location.pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const isHidden = window.innerWidth < 768;
      setSidebarHidden(isHidden);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarHidden]);

  const handleLogout = () => {
    alert("Logged out successfully! Redirecting to login...");
  };

  const toggleCollapsible = (sectionName) => {
    setOpenSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const createLink = (to, Icon, label, onClick = () => setActivePath(to)) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
        activePath === to
          ? isDarkMode
            ? "bg-blue-600 text-white"
            : "bg-blue-100 text-blue-700"
          : isDarkMode
          ? "text-gray-300 hover:bg-gray-700 hover:text-blue-400"
          : "text-gray-300 hover:bg-gray-100 hover:text-blue-600"
      } ${isCollapsed ? "justify-center" : "w-full"}`}
      aria-current={activePath === to ? "page" : undefined}
    >
      <Icon className="w-5 h-5" />
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </Link>
  );

  const createCollapsible = (sectionName, Icon, label, links) => (
    <div className="w-full">
      <button
        className={`flex items-center p-3 rounded-lg w-full transition-all duration-200 ${
          isDarkMode
            ? "text-gray-300 hover:bg-gray-700 hover:text-blue-400"
            : "text-gray-300 hover:bg-gray-100 hover:text-blue-600"
        }`}
        onClick={() => toggleCollapsible(sectionName)}
        aria-expanded={openSections[sectionName] || false}
      >
        <Icon className="w-5 h-5 mr-2" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {openSections[sectionName] ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </>
        )}
      </button>
      {openSections[sectionName] && (
        <div className={`pl-6 space-y-2 ${isCollapsed ? "hidden" : ""}`}>
          {links.map((link, index) => (
            <Link
              key={index}
              to={link.to}
              className={`flex items-center p-2 rounded-md ${
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-700 hover:text-blue-400"
                  : "text-gray-300 hover:bg-gray-100 hover:text-blue-600"
              }`}
            >
              {/* Render the dynamic icon for each sublink */}
              {link.icon && <link.icon className="w-4 h-4 mr-2" />}
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileMenuOpen(true)}
      className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors md:hidden"
      aria-label="Open Sidebar"
    >
      <Menu className="w-6 h-6" />
    </button>
  );

  const MobileSidebar = () => (
    <>
      <div
        className="fixed inset-0 bg-gray-900/50 z-40 md:hidden"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-label="Close Sidebar"
      />
      <aside
        className={`fixed top-0 left-0 w-64 h-screen z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isDarkMode ? "bg-gray-800" : "bg-white"} md:hidden`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <img
                src={isDarkMode ? LogoDark : LogoLight}
                alt="Al-Rayyan Logo"
                className="w-12 h-12 rounded-lg border-2 border-gray-200"
              />
              <div>
                <p className="font-bold text-lg">Al-Rayyan</p>
                <p className="text-sm text-gray-500">Travel & Tourism</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-200"
              aria-label="Close Sidebar"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <nav className="flex-1 space-y-2">
            {[
              { to: "/", icon: Home, label: "Dashboard" },
              { to: "/airline-codes", icon: List, label: "Airline Codes" },
              {
                to: "/manage-invoice",
                icon: FileText,
                label: "Manage Invoice",
              },
              { to: "/invoice", icon: FilePlus, label: "Invoice Creation" },
              { to: "/billing", icon: PieChart, label: "Manage Sales" },
              { to: "/ledger", icon: PieChart, label: "Ledger" },
              { to: "/expense", icon: PieChart, label: "Expense" },
            ].map((item) => createLink(item.to, item.icon, item.label))}
            {createCollapsible("reports", NotebookPen, "Reports", [
              { to: "/report", label: "Report" },
              { to: "/payment-list", label: "Payment List" },
            ])}
            {createLink("/login", LogOut, "Log out", () => {
              setActivePath("/login");
              handleLogout();
            })}
          </nav>
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center p-3 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 mr-2" />
              ) : (
                <Moon className="w-5 h-5 mr-2" />
              )}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <MobileMenuButton />
      <aside
        className={`${isCollapsed ? "w-20" : "w-64"} ${
          isDarkMode
            ? "bg-gradient-to-t from-slate-800 to-gray-600 text-white"
            : "bg-gradient-to-tl from-gray-500 to-slate-800 text-black"
        } backdrop-blur-md shadow-2xl h-screen fixed transition-all duration-300 hidden md:block sm:hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center gap-3">
            <img
              src={isDarkMode ? LogoDark : LogoDark}
              alt="Al-Rayyan Logo"
              className={`w-10 h-10 rounded-lg border-2 ${
                isDarkMode ? "border-gray-300" : "border-gray-200"
              } ${isCollapsed ? "mx-auto" : ""}`}
            />
            {!isCollapsed && (
              <div>
                <p
                  className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-200"
                  }`}
                >
                  Al-Rayyan
                </p>
                <p className="text-sm text-gray-300">Travel & Tourism</p>
              </div>
            )}
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {[
              { to: "/", icon: Home, label: "Dashboard" },
              { to: "/airline-codes", icon: Plane, label: "Airline Codes" },
              { to: "/vendors", icon: Store, label: "Vendors" },
            ].map((item) => createLink(item.to, item.icon, item.label))}
            {createCollapsible("sales", HandCoins, "Sales", [
              { to: "/new-sale", label: "New Sale", icon: Plus }, // Added icon for "New Sale"
              { to: "/manage-sale", label: "Manage Sale", icon: ScrollText }, // Added icon for "Manage Sale"
              { to: "/report", label: "Report List", icon: PieChart }, // Added icon for "Report List"
            ])}

            {createCollapsible("payments", SaudiRiyal, "Payments", [
              {
                to: "/payment-list",
                icon: BookCheck,
                label: "Payment List",
              },
              { to: "/refund-list", icon: RotateCcwIcon, label: "Refund List" }, // No icon for this link
            ])}

            {createLink("/ledger", LandmarkIcon, "Ledger", () => {})}
            {createLink("/expense", Wallet, "Expense", () => {})}
            {createLink("/login", LogOut, "Log out", () => {
              setActivePath("/login");
              handleLogout();
            })}
          </nav>
          <div
            className={`mt-auto p-4 flex ${
              isCollapsed ? "flex-col gap-2" : "flex-row gap-4"
            } border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <button
              onClick={toggleTheme}
              className={`flex-1 p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 mx-auto" />
              ) : (
                <Moon className="w-5 h-5 mx-auto" />
              )}
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex-1 p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 mx-auto" />
              ) : (
                <ChevronLeft className="w-5 h-5 mx-auto" />
              )}
            </button>
          </div>
        </div>
      </aside>
      {isMobileMenuOpen && <MobileSidebar />}
    </>
  );
};

export default Sidebar;
