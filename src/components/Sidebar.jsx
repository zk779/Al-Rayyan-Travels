"use client";

import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	Home,
	Plane,
	Store,
	Users2,
	HandCoins,
	ScrollText,
	PieChart,
	SaudiRiyal,
	BookCheck,
	RotateCcwIcon,
	LandmarkIcon,
	Wallet,
	UserCog,
	LogOut,
	Menu,
	X,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	ChevronUp,
	Sun,
	Moon,
	Plus,
} from "lucide-react";

import { useSidebar } from "../context/SidebarContext";
import { ThemeContext } from "../context/ThemeContext";
import LogoDark from "../assets/logo-dark.png";
import LogoLight from "../assets/logo-light.png";

/* ======================================================
	STYLE TOKENS – MODERN & FUN
====================================================== */

const baseItem =
	"group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative";

const lightBg = "bg-gradient-to-br from-slate-50 to-gray-100";
const darkBg = "bg-gradient-to-br from-slate-800 to-gray-600";

const lightText = "text-gray-800";
const darkText = "text-gray-200";

const accentColor = "text-slate-500 dark:text-slate-300";

/* ======================================================
	SIDEBAR
====================================================== */

const Sidebar = () => {
	const { isCollapsed, setIsCollapsed, sidebarHidden, setSidebarHidden } =
		useSidebar();
	const { isDarkMode, toggleTheme } = useContext(ThemeContext);

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

	/* ======================================================
		NAV LINK WITH PULSE ACTIVE INDICATOR
	====================================================== */
	const NavItem = ({ to, icon: Icon, label }) => {
		const active = activePath === to;

		return (
			<Link
				to={to}
				onClick={() => setActivePath(to)}
				className={`
					${baseItem}
					${isDarkMode ? darkText : lightText}
					${isCollapsed ? "justify-center px-2" : ""}
					hover:scale-[1.02] active:scale-[0.98]
					transition-transform ml-1
				`}
			>
				{/* Pulse dot for active item */}
				{active && !isCollapsed && (
					<span className="absolute -left-2 top-1/2 -translate-y-1/2">
						<span className="relative flex h-3 w-3">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
						</span>
					</span>
				)}

				<Icon
					className={`w-5 h-5 shrink-0 ${
						active ? "text-blue-600 dark:text-blue-300" : ""
					}`}
				/>
				{!isCollapsed && (
					<span
						className={`text-sm font-medium tracking-wide ${
							active ? "font-bold text-blue-700 dark:text-indigo-200" : ""
						}`}
					>
						{label}
					</span>
				)}
			</Link>
		);
	};

	/* ======================================================
		COLLAPSIBLE GROUP
	====================================================== */
	const Collapsible = ({ id, icon: Icon, label, children }) => {
		const open = openSections[id];

		return (
			<div className="space-y-1">
				<button
					onClick={() => toggleSection(id)}
					className={`
						${baseItem}
						${isDarkMode ? darkText : lightText}
						w-full justify-between
						hover:scale-[1.02] active:scale-[0.98] ml-1
						transition-transform
						${isCollapsed ? "px-2" : ""}
					`}
				>
					<div className="flex items-center gap-3">
						<Icon className="w-5 h-5" />
						{!isCollapsed && (
							<span className="text-sm font-medium tracking-wide">{label}</span>
						)}
					</div>
					{!isCollapsed &&
						(open ? (
							<ChevronUp className="w-4 h-4 opacity-70" />
						) : (
							<ChevronDown className="w-4 h-4 opacity-70" />
						))}
				</button>

				{!isCollapsed && (
					<div
						className={`ml-6 space-y-1 transition-all duration-300 overflow-hidden ${
							open
								? "max-h-96 opacity-100 mt-1"
								: "max-h-0 opacity-0 mt-0 pointer-events-none"
						}`}
					>
						{children}
					</div>
				)}
			</div>
		);
	};

	/* ======================================================
		MENU CONTENT
	====================================================== */
	const MenuContent = () => (
		<>
			<NavItem to="/dashboard" icon={Home} label="Dashboard" />
			<NavItem to="/airline-codes" icon={Plane} label="Airline Codes" />
			<NavItem to="/vendors" icon={Store} label="Vendors" />
			<NavItem to="/customers" icon={Users2} label="Customers" />

			<Collapsible id="sales" icon={HandCoins} label="Sales">
				<NavItem to="/new-services" icon={Plus} label="New Services" />
				<NavItem to="/sales-report" icon={ScrollText} label="Sales Report" />
				<NavItem to="/report" icon={PieChart} label="Reports" />
			</Collapsible>

			<Collapsible id="payments" icon={SaudiRiyal} label="Payments">
				<NavItem to="/manage-payments" icon={BookCheck} label="Payment List" />
				<NavItem to="/refund-list" icon={RotateCcwIcon} label="Refunds" />
			</Collapsible>

			<NavItem to="/ledger" icon={LandmarkIcon} label="Ledger" />
			<NavItem to="/expenses" icon={Wallet} label="Expenses" />
			<NavItem to="/users" icon={UserCog} label="Users" />
			<NavItem to="/login" icon={LogOut} label="Logout" />
		</>
	);

	/* ======================================================
		MOBILE SIDEBAR
	====================================================== */
	const MobileSidebar = () => (
		<>
			<div
				className="fixed inset-0 bg-black/50 z-40 backdrop-blur"
				onClick={() => setMobileOpen(false)}
			/>
			<aside
				className={`fixed top-0 left-0 z-50 h-screen w-64 transform transition-transform duration-300 ${
					mobileOpen ? "translate-x-0" : "-translate-x-full"
				} ${isDarkMode ? darkBg : lightBg} ${isDarkMode ? darkText : lightText} shadow-2xl rounded-r-2xl`}
			>
				<div className="p-5 flex justify-between items-center border-b border-white/10">
					<img
						src={isDarkMode ? LogoDark : LogoLight}
						className="w-10 h-10"
						alt="logo"
					/>
					<button
						onClick={() => setMobileOpen(false)}
						className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<nav className="p-4 space-y-2">
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
					className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all hover:scale-105"
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
				className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-full bg-gradient-to-t from-slate-800 to-gray-600 text-white shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all hover:scale-105"
			>
				<Menu className="w-5 h-5" />
			</button>

			{/* Desktop Sidebar */}
			<aside
				className={`hidden md:block fixed h-screenshot transition-all duration-300 ${
					isCollapsed ? "w-18" : "w-62"
				} ${isDarkMode ? darkBg : lightBg} ${
					isDarkMode ? darkText : lightText
				} shadow-2xl rounded-2xl ml-2 my-2 `}
			>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="p-5 flex items-center gap-3 border-b border-white/10">
						<img
							src={isDarkMode ? LogoDark : LogoLight}
							className="w-10 h-10"
							alt="logo"
						/>
						{!isCollapsed && (
							<div>
								<p className={`font-bold text-lg bg-clip-text text-transparent bg-gradient-to-br ${isDarkMode ? "from-gray-200 to-white" : "from-gray-800 to-gray-600"}`}>
									Al-Rayyan
								</p>
								<p className="text-xs opacity-80">Travel & Tourism</p>
							</div>
						)}
					</div>

					{/* Menu */}
					<nav className="flex-1 p-4 space-y-2">
						<MenuContent />
					</nav>

					{/* Footer Controls */}
					<div className={`${isCollapsed ? "block space-y-2" : "flex gap-2"} p-4 border-t border-gray-600/10`}>
						<button
							onClick={toggleTheme}
							className={`${baseItem} w-full justify-center ${
								isCollapsed ? "px-2" : ""
							} hover:scale-[1.02] active:scale-[0.98] transition-transform border ${isDarkMode ? "border-white/10" : "border-gray-600/30"} `}
						>
							{isDarkMode ? (
								<Sun className="w-5 h-5 text-yellow-300" />
							) : (
								<Moon className="w-5 h-5 text-blue-700" />
							)}

						</button>

						<button
							onClick={() => setIsCollapsed(!isCollapsed)}
							className={`${baseItem} w-full justify-center ${
								isCollapsed ? "px-2" : ""
							} hover:scale-[1.02] active:scale-[0.98] transition-transform border ${isDarkMode ? "border-white/10" : "border-gray-600/30"} `}
						>
							{isCollapsed ? (
								<ChevronRight className="w-5 h-5" />
							) : (
								<ChevronLeft className="w-5 h-5" />
							)}
						</button>
					</div>
				</div>
			</aside>

			{mobileOpen && <MobileSidebar />}
		</>
	);
};

export default Sidebar;
