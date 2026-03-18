"use client";

import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { appToast } from "../../shadcn/components/ui/appToast";
import LogoDark from "../assets/logo-dark.png";
import LogoLight from "../assets/logo-light.png";

/* ======================================================
	STYLE TOKENS – CLEAN & SOPHISTICATED
====================================================== */

const baseItem =
	"group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative";

// Sophisticated gradients - Clean slate theme
const lightBg = "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200";
const darkBg = "bg-gradient-to-br from-slate-800 to-gray-600";

const lightText = "text-slate-800";
const darkText = "text-gray-200";

const lightBorder = "border border-slate-300/60 shadow-xl shadow-slate-200/60";
const darkBorder = "border border-white/5 shadow-2xl";

/* ======================================================
	SIDEBAR
====================================================== */

const Sidebar = () => {
	const { isCollapsed, setIsCollapsed, sidebarHidden, setSidebarHidden } =
		useSidebar();
	const { isDarkMode, toggleTheme } = useContext(ThemeContext);
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

	// Logout function
	const handleLogout = () => {
		localStorage.removeItem("token");
		appToast.success("Logged Out", "You have been successfully logged out");
		setTimeout(() => {
			navigate("/login");
		}, 500);
	};

	/* ======================================================
		NAV LINK WITH MODERN ACTIVE INDICATOR
	====================================================== */
	const NavItem = ({ to, icon: Icon, label, onClick }) => {
		const active = activePath === to;

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
					${isDarkMode ? darkText : lightText}
					${isCollapsed ? "justify-center px-2" : ""}
					${active && !isDarkMode ? "bg-slate-800 text-white shadow-lg shadow-slate-400/30 scale-[1.01]" : ""}
					${active && isDarkMode ? "bg-white/10 text-white" : ""}
					${!active && !isDarkMode ? "hover:bg-slate-200/70 hover:scale-[1.01]" : ""}
					${!active && isDarkMode ? "hover:bg-white/5" : ""}
					transition-all ml-1 cursor-pointer
				`}
			>
				{/* Modern line indicator for active item */}
				{active && (
					<span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${isDarkMode ? "bg-blue-400" : "bg-white"
						}`}></span>
				)}

				<Icon
					className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${active
							? "text-white"
							: isDarkMode
								? "text-gray-300"
								: "text-slate-600"
						}`}
				/>
				{!isCollapsed && (
					<span
						className={`text-sm font-medium tracking-wide ${active ? "font-semibold" : ""
							}`}
					>
						{label}
					</span>
				)}

				{/* Badge effect on hover */}
				{!active && !isCollapsed && (
					<span className={`absolute right-2 w-1.5 h-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${isDarkMode ? "bg-blue-400" : "bg-slate-800"
						}`}></span>
				)}
			</div>
		);

		return onClick ? content : <Link to={to}>{content}</Link>;
	};

	/* ======================================================
		COLLAPSIBLE GROUP
	====================================================== */
	const Collapsible = ({ id, icon: Icon, label, children }) => {
		const open = openSections[id];

		return (
			<div className="space-y-0 mb-0!">
				<button
					onClick={() => toggleSection(id)}
					className={`
						${baseItem}
						${isDarkMode ? darkText : lightText}
						w-full justify-between
						${isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-200/70 hover:scale-[1.01]"}
						transition-all ml-1
						${isCollapsed ? "px-2" : ""}
					`}
				>
					<div className="flex items-center gap-3">
						<Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isDarkMode ? "text-gray-300" : "text-slate-600"
							}`} />
						{!isCollapsed && (
							<span className="text-sm font-medium tracking-wide">{label}</span>
						)}
					</div>
					{!isCollapsed && (
						<div className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
							<ChevronDown className="w-4 h-4 opacity-70" />
						</div>
					)}
				</button>

				{!isCollapsed && (
					<div
						className={`ml-6 space-y-1 transition-all duration-300 overflow-hidden ${open
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
			<NavItem to="/bank-accounts" icon={LandmarkIcon} label="Bank Accounts" />

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

			{/* Divider before logout */}
			<div className={`my-2 border-t ${isDarkMode ? "border-white/10" : "border-slate-300"}`}></div>

			<NavItem to="/login" icon={LogOut} label="Logout" onClick={handleLogout} />
		</>
	);

	/* ======================================================
		MOBILE SIDEBAR
	====================================================== */
	const MobileSidebar = () => (
		<>
			<div
				className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
				onClick={() => setMobileOpen(false)}
			/>
			<aside
				className={`fixed top-0 left-0 z-50 h-screen w-64 transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
					} ${isDarkMode ? darkBg : lightBg} ${isDarkMode ? darkText : lightText} ${isDarkMode ? darkBorder : lightBorder} rounded-r-2xl`}
			>
				<div className={`p-5 flex justify-between items-center border-b ${isDarkMode ? "border-white/10" : "border-slate-300"}`}>
					<div className="flex items-center gap-3">
						<div className={`w-10 h-10 rounded-xl ${isDarkMode ? "bg-white/10" : "bg-slate-800"} flex items-center justify-center p-1.5`}>
							<img
								src={isDarkMode ? LogoDark : LogoLight}
								className="w-full h-full object-contain"
								alt="logo"
							/>
						</div>
						<div>
							<p className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-800"}`}>
								Al-Rayyan
							</p>
						</div>
					</div>
					<button
						onClick={() => setMobileOpen(false)}
						className={`p-2 rounded-xl ${isDarkMode ? "bg-white/10 hover:bg-white/20" : "bg-slate-200 hover:bg-slate-300"} transition-colors`}
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
					className={`md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl ${isDarkMode
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
				className={`md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl ${isDarkMode
						? "bg-gradient-to-t from-slate-800 to-gray-600 shadow-lg shadow-slate-900/40"
						: "bg-slate-800 shadow-lg shadow-slate-400/50"
					} text-white transition-all hover:scale-105 active:scale-95`}
			>
				<Menu className="w-5 h-5" />
			</button>

			{/* Desktop Sidebar */}
			<aside
				className={`hidden md:block fixed h-screenshot transition-all duration-300 ${isCollapsed ? "w-18" : "w-62"
					} ${isDarkMode ? darkBg : lightBg} ${isDarkMode ? darkText : lightText
					} ${isDarkMode ? darkBorder : lightBorder} rounded-2xl ml-2 my-2`}
			>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className={`p-5 flex items-center gap-3 border-b ${isDarkMode ? "border-white/10" : "border-slate-300"}`}>
						<div className={`w-10 h-10 rounded-xl ${isDarkMode ? "bg-white/10" : "bg-slate-800"} flex items-center justify-center p-1.5 shadow-md`}>
							<img
								src={isDarkMode ? LogoDark : LogoLight}
								className="w-full h-full object-contain"
								alt="logo"
							/>
						</div>
						{!isCollapsed && (
							<div>
								<p className={`font-bold text-lg ${isDarkMode
										? "text-white"
										: "text-slate-800"
									}`}>
									Al-Rayyan
								</p>
								<p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-slate-500"}`}>
									Travel & Tourism
								</p>
							</div>
						)}
					</div>

					{/* Menu */}
					<nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
						<MenuContent />
					</nav>

					{/* Footer Controls */}
					<div className={`${isCollapsed ? "flex flex-col space-y-2" : "flex gap-2"} p-4 border-t ${isDarkMode ? "border-white/10" : "border-slate-300"}`}>
						<button
							onClick={toggleTheme}
							className={`${baseItem} flex-1 justify-center ${isCollapsed ? "px-2" : ""
								} transition-all border ${isDarkMode
									? "border-white/10 bg-white/5 hover:bg-white/10"
									: "border-slate-300 bg-slate-200 hover:bg-slate-300 hover:scale-105 active:scale-95"
								}`}
						>
							{isDarkMode ? (
								<Sun className="w-5 h-5 text-yellow-400" />
							) : (
								<Moon className="w-5 h-5 text-slate-700" />
							)}
						</button>

						<button
							onClick={() => setIsCollapsed(!isCollapsed)}
							className={`${baseItem} flex-1 justify-center ${isCollapsed ? "px-2" : ""
								} transition-all border ${isDarkMode
									? "border-white/10 bg-white/5 hover:bg-white/10"
									: "border-slate-300 bg-slate-200 hover:bg-slate-300 hover:scale-105 active:scale-95"
								}`}
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