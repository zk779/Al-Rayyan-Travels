"use client";

import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Plane,
  Store,
  Users2,
  HandCoins,
  FileStack,
  ScrollText,
  PieChart,
  Percent,
  SaudiRiyal,
  BookCheck,
  RotateCcwIcon,
  LandmarkIcon,
    Wallet,
    Scale,
  Hotel,
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Plus,
  Languages,
  Palette,
  Check,
} from "lucide-react";

import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { appToast } from "../../shadcn/components/ui/appToast";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcn/components/ui/popover";
import { SIDEBAR_THEMES, readSidebarTheme, saveSidebarTheme, sidebarUi, themeSwatch } from "./sidebarThemes";
import LogoDark from "../assets/logo-dark-am.png";
import LogoLight from "../assets/logo-light-am.png";

/* ======================================================
	STYLE TOKENS – CLEAN & SOPHISTICATED
====================================================== */

const baseItem =
  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative";

// Colours come from the chosen sidebar theme — see sidebarThemes.js

/* ======================================================
	SIDEBAR
====================================================== */

const Sidebar = () => {
  const { isCollapsed, setIsCollapsed, sidebarHidden, setSidebarHidden } =
    useSidebar();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  // Sidebar theme (Classic follows light/dark; the others are palettes of their own)
  const [sidebarThemeKey, setSidebarThemeKey] = useState(readSidebarTheme);
  const chooseSidebarTheme = (key) => {
    setSidebarThemeKey(key);
    saveSidebarTheme(key);
  };
  const ui = sidebarUi(sidebarThemeKey, isDarkMode);
  const { hasPermission, logout } = useAuth(); // ✅ RBAC + proper logout
  const { language, toggleLanguage, t, isRTL } = useLanguage(); // ✅ EN/AR toggle
  const flyoutSide = isRTL ? "right-full pr-3" : "left-full pl-3"; // pop-outs open away from the sidebar
  const navigate = useNavigate();

  const location = useLocation();
  const [activePath, setActivePath] = useState(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      setSidebarHidden(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarHidden]);

  const toggleSection = (key) => {
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));
  };

  // ✅ Logout function — uses AuthContext.logout() so user/permissions/token
  // are all cleared consistently (and cross-tab sync fires correctly)
  const handleLogout = () => {
    logout();
    appToast.success("Logged Out", "You have been successfully logged out");
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  /* ======================================================
		NAV LINK WITH MODERN ACTIVE INDICATOR
	====================================================== */
  const NavItem = ({ to, icon: Icon, label, onClick, permission, any, flyout = false }) => {
    // ✅ RBAC check — single permission OR any-of-list
    if (permission && !hasPermission(permission)) return null;
    if (any && !any.some((p) => hasPermission(p))) return null;

    const active = activePath === to || activePath.startsWith(`${to}/`);
    // Icon-only when the sidebar is collapsed — except inside a pop-out, which is always full size
    const compact = isCollapsed && !flyout;
    // ...rest stays exactly the same

    const handleClick = () => {
      if (onClick) {
        onClick();
      } else {
        setActivePath(to);
      }
    };

    const content = (
      <div
        onClick={handleClick}
        className={`
					${baseItem}
					${compact ? "justify-center px-2" : ""}
					${active ? ui.activeItem : `${ui.text} ${ui.idleItem}`}
					transition-all ml-1 cursor-pointer
				`}
      >
        {/* Modern line indicator for active item */}
        {active && (
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${ui.indicator}`}
          ></span>
        )}

        <Icon
          className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
            active ? ui.iconActive : ui.iconIdle
          }`}
        />
        {!compact && (
          <span
            className={`text-sm font-medium tracking-wide ${
              active ? "font-semibold" : ""
            }`}
          >
            {label}
          </span>
        )}

        {/* Badge effect on hover */}
        {!active && !compact && (
          <span
            className={`absolute right-2 w-1.5 h-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${ui.dot}`}
          ></span>
        )}
      </div>
    );

    const node = onClick ? content : <Link to={to}>{content}</Link>;

    // Collapsed: hovering (or tabbing to) an icon pops its name out beside the sidebar
    if (!compact) return node;
    return (
      <div className="relative group/nav">
        {node}
        <div className={`absolute top-1/2 z-[70] hidden -translate-y-1/2 group-hover/nav:block group-focus-within/nav:block ${flyoutSide}`}>
          <div className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium shadow-xl ring-1 ${ui.flyout}`}>{label}</div>
        </div>
      </div>
    );
  };

  /* ======================================================
		COLLAPSIBLE GROUP
		✅ RBAC: hides entire group if no children are visible
	====================================================== */
  const Collapsible = ({ id, icon: Icon, label, children }) => {
    const open = openSections[id];

    // Filter out null children (hidden by RBAC inside NavItem)
    const visibleChildren = React.Children.toArray(children).filter(
      (child) => child !== null,
    );

    // ✅ If nobody can see any item in this group, hide the whole section
    if (visibleChildren.length === 0) return null;

    return (
      <div className={`space-y-0 mb-0! ${isCollapsed ? "relative group/col" : ""}`}>
        <button
          onClick={() => toggleSection(id)}
          className={`
						${baseItem}
						${ui.text}
						w-full justify-between
						${ui.groupHover}
						transition-all ml-1
						${isCollapsed ? "px-2" : ""}
					`}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${ui.iconIdle}`}
            />
            {!isCollapsed && (
              <span className="text-sm font-medium tracking-wide">{label}</span>
            )}
          </div>
          {!isCollapsed && (
            <div
              className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            >
              <ChevronDown className="w-4 h-4 opacity-70" />
            </div>
          )}
        </button>

        {/* Collapsed: hovering (or tabbing into) the group's icon pops out its name and its pages */}
        {isCollapsed && (
          <div className={`absolute top-0 z-[70] hidden group-hover/col:block group-focus-within/col:block ${flyoutSide}`}>
            <div className={`min-w-[210px] rounded-xl p-1.5 shadow-xl ring-1 ${ui.flyout}`}>
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-60">{label}</p>
              <div className="space-y-0.5">
                {visibleChildren.map((child) => React.cloneElement(child, { flyout: true }))}
              </div>
            </div>
          </div>
        )}

        {!isCollapsed && (
          <div
            className={`ml-6 space-y-1 transition-all duration-300 overflow-hidden ${
              open
                ? "max-h-96 opacity-100 mt-1"
                : "max-h-0 opacity-0 mt-0 pointer-events-none"
            }`}
          >
            {visibleChildren}
          </div>
        )}
      </div>
    );
  };

  /* ======================================================
		MENU CONTENT
		✅ RBAC: each item/group gated by its matching permission
		✅ i18n: labels driven by t() from LanguageContext
	====================================================== */
  const MenuContent = () => (
    <>
      <NavItem to="/dashboard" icon={Home} label={t("dashboard")} />

      <NavItem
        to="/airline-codes"
        icon={Plane}
        label={t("airlineCodes")}
        permission="AIRLINE_READ"
      />
      <NavItem
        to="/vendors"
        icon={Store}
        label={t("vendors")}
        permission="VENDOR_READ"
      />
      <NavItem
        to="/customers"
        icon={Users2}
        label={t("customers")}
        permission="CUSTOMER_READ"
      />
      <NavItem
        to="/bank-accounts"
        icon={LandmarkIcon}
        label={t("bankAccounts")}
        permission="BRANCH_READ"
      />

      <Collapsible id="sales" icon={HandCoins} label={t("sales")}>
        <NavItem
          to="/new-services"
          icon={Plus}
          label={t("newServices")}
          permission="SALE_CREATE"
        />
        <NavItem
          to="/sales-report"
          icon={ScrollText}
          label={t("salesReport")}
          any={["SALE_READ", "REFUND_READ"]}
        />
        <NavItem
            to="/report"
            icon={PieChart}
            label={t("reports")}
            permission="REPORT_READ"
          />
        <NavItem
          to="/vat"
          icon={Percent}
          label={t("vat")}
          permission="REPORT_READ"
        />
      </Collapsible>

      <Collapsible id="payments" icon={SaudiRiyal} label={t("payments")}>
        <NavItem
          to="/manage-payments"
          icon={BookCheck}
          label={t("paymentList")}
          permission="PAYMENT_READ"
        />
        <NavItem
        to="/expenses"
        icon={Wallet}
        label={t("expenses")}
        permission="EXPENSE_READ"
      />
      <NavItem
        to="/balance-adjustments"
        icon={Scale}
        label={t("balanceAdjustments")}
        permission="BALANCE_ADJUSTMENT_READ"
      />
      </Collapsible>

      <NavItem
        to="/ledger"
        icon={LandmarkIcon}
        label={t("ledger")}
        permission="LEDGER_READ"
      />


      <NavItem
        to="/users"
        icon={UserCog}
        label={t("users")}
        permission="USER_READ"
      />

      {/* Divider before logout */}
      <div
        className={`my-2 border-t ${ui.divider}`}
      ></div>

      <NavItem
        to="/login"
        icon={LogOut}
        label={t("logout")}
        onClick={handleLogout}
      />
    </>
  );

  /* ======================================================
		MOBILE SIDEBAR
	====================================================== */
  const MobileSidebar = () => (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm print:hidden"
        onClick={() => setMobileOpen(false)}
      />
      <aside
        dir={isRTL ? "rtl" : "ltr"}
        className={`print:hidden fixed top-0 z-50 h-screen w-64 transform transition-transform duration-300 ${
          isRTL ? "right-0 rounded-l-2xl" : "left-0 rounded-r-2xl"
        } ${mobileOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"} ${ui.shell}`}
        style={ui.style}
      >
        <div
          className={`p-5 flex justify-between items-center border-b ${ui.divider}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${ui.logoTile} flex items-center justify-center p-1.5`}
            >
              <img
                src={ui.darkLogo ? LogoDark : LogoLight}
                className="w-full h-full object-contain"
                alt="logo"
              />
            </div>
            <div>
              <p
                className={`font-bold text-sm ${ui.brand}`}
              >
                {t("brand")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className={`p-2 rounded-xl ${ui.closeBtn} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          <MenuContent />
        </nav>
      </aside>
    </>
  );

  /* ======================================================
		RENDER
	====================================================== */
  if (sidebarHidden) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className={`md:hidden print:hidden fixed top-4 ${isRTL ? "right-4" : "left-4"} z-50 p-2.5 rounded-xl ${
            isDarkMode
              ? "bg-gradient-to-r from-slate-700 to-slate-600 shadow-lg shadow-slate-900/40"
              : "bg-slate-800 shadow-lg shadow-slate-400/50"
          } text-white transition-all hover:scale-105 active:scale-95`}
        >
          <Menu className="w-5 h-5" />
        </button>
        {mobileOpen && <MobileSidebar />}
      </>
    );
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`md:hidden print:hidden fixed top-4 ${isRTL ? "right-4" : "left-4"} z-50 p-2.5 rounded-xl ${
          isDarkMode
            ? "bg-gradient-to-t from-slate-800 to-gray-600 shadow-lg shadow-slate-900/40"
            : "bg-slate-800 shadow-lg shadow-slate-400/50"
        } text-white transition-all hover:scale-105 active:scale-95`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <aside
        dir={isRTL ? "rtl" : "ltr"}
        className={`hidden md:block print:hidden fixed z-[60] h-screenshot transition-all duration-300 ${
          isCollapsed ? "w-18" : "w-62"
        } ${ui.shell} rounded-2xl my-2 ${isRTL ? "right-0 mr-2" : "ml-2"}`}
        style={ui.style}
      >
        {/* Collapse / expand handle, on the sidebar's edge */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`absolute top-8 z-[70] flex h-6 w-6 cursor-pointer items-center justify-center rounded-full shadow-md ring-2 transition ${
            isRTL ? "-left-3" : "-right-3"
          } ${ui.handle}`}
        >
          <ChevronsLeft className={`h-3.5 w-3.5 transition-transform duration-300 ${isCollapsed !== isRTL ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={`p-5 flex items-center gap-3 border-b ${ui.divider}`}
          >
            <div
              className={`w-10 h-10 rounded-xl ${ui.logoTile} flex items-center justify-center p-1.5 shadow-md`}
            >
              <img
                src={ui.darkLogo ? LogoDark : LogoLight}
                className="w-full h-full object-contain"
                alt="logo"
              />
            </div>
            {!isCollapsed && (
              <div>
                <p
                  className={`font-bold text-lg ${ui.brand}`}
                >
                  {t("brand")}
                </p>
                <p
                  className={`text-xs ${ui.tagline}`}
                >
                  {t("tagline")}
                </p>
              </div>
            )}
          </div>

          {/* Menu */}
          <nav className={`flex-1 p-4 space-y-2 custom-scrollbar ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}>
            <MenuContent />
          </nav>

          {/* Footer Controls */}
          <div
            className={`${isCollapsed ? "flex flex-col space-y-2" : "flex gap-2"} p-4 border-t ${ui.divider}`}
          >
            <button
              onClick={toggleTheme}
              className={`${baseItem} flex-1 justify-center ${
                isCollapsed ? "px-2" : ""
              } transition-all border ${ui.btn}`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className={`w-5 h-5 ${ui.moon}`} />
              )}
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Sidebar theme"
                  title="Sidebar theme"
                  className={`${baseItem} flex-1 justify-center ${
                    isCollapsed ? "px-2" : ""
                  } transition-all border ${ui.btn}`}
                >
                  <Palette className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side={isRTL ? "left" : "right"} align="end" sideOffset={18} collisionPadding={12} className="z-[80] w-72 p-3 shadow-xl">
                <p className="mb-2 flex items-baseline justify-between text-sm font-semibold text-slate-800">
                  Sidebar theme · {isDarkMode ? "Dark" : "Light"}
                  <span className="text-xs font-normal text-slate-400" dir="rtl">
                    ثيم القائمة
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SIDEBAR_THEMES.map((th) => {
                    const on = th.key === sidebarThemeKey;
                    return (
                      <button
                        key={th.key}
                        type="button"
                        onClick={() => chooseSidebarTheme(th.key)}
                        aria-pressed={on}
                        data-theme-key={th.key}
                        className={`group relative overflow-hidden rounded-xl text-left ring-1 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                          on ? "ring-2 ring-slate-900" : "ring-slate-200"
                        }`}
                      >
                        <span className="block h-14" style={{ background: themeSwatch(th, isDarkMode) }} />
                        <span className="block bg-white px-2 py-1.5">
                          <span className="block truncate text-[11px] font-semibold text-slate-800">{th.name}</span>
                          <span className="block truncate text-[10px] text-slate-400" dir="rtl">
                            {th.nameAr}
                          </span>
                        </span>
                        {on && (
                          <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-slate-900 shadow">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

          </div>
        </div>
      </aside>

      {mobileOpen && <MobileSidebar />}
    </>
  );
};

export default Sidebar;