// src/components/Layout.jsx
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext"; // Import the context hook
import { ThemeContext } from "../context/ThemeContext"; // Import the ThemeContext
import { useContext } from "react";

const Layout = () => {
  const { isCollapsed, sidebarHidden } = useSidebar(); // Destructure states from context
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  // Determine the margin-left class based on sidebar state
  let sidebarMarginClass = "ml-64"; // Default to expanded state
  if (sidebarHidden) {
    sidebarMarginClass = "ml-0"; // Sidebar is hidden on mobile
  } else if (isCollapsed) {
    sidebarMarginClass = "ml-20"; // Sidebar is collapsed
  }

  return (
    <div className=" min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`flex-1 p-6 ${sidebarMarginClass} bg-white text-black `}>
        <Outlet /> {/* Child components/pages will be rendered here */}
      </div>
    </div>
  );
};

export default Layout;
