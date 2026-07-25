import React, { createContext, useContext, useState, useEffect } from "react";

export const LanguageContext = createContext();

/* ======================================================
  TRANSLATIONS — add more keys here as you expand
  usage in components (only Header + Sidebar use these): t("dashboard")
====================================================== */
const translations = {
  en: {
    brand: "Al-Madaar",
    tagline: "Travel & Tourism",

    // Header
    searchPlaceholder: "Search customers, invoices, vendors...",
    notifications: "Notifications",
    settings: "Settings",
    profileSettings: "Profile Settings",
    logOut: "Log out",
    language: "Language",

    // Sidebar
    dashboard: "Dashboard",
    airlineCodes: "Airline Codes",
    vendors: "Vendors",
    customers: "Customers",
    bankAccounts: "Bank Accounts",
    sales: "Sales",
    newServices: "New Services",
    salesReport: "Sales Report",
    reports: "Reports",
    payments: "Payments",
    paymentList: "Payment List",
    refunds: "Refunds",
    ledger: "Ledger",
    expenses: "Expenses",
    users: "Users",
    logout: "Logout",
  },
  ar: {
    brand: "المدار",
    tagline: "السفر والسياحة",

    // Header
    searchPlaceholder: "ابحث عن العملاء، الفواتير، الموردين...",
    notifications: "الإشعارات",
    settings: "الإعدادات",
    profileSettings: "إعدادات الملف الشخصي",
    logOut: "تسجيل الخروج",
    language: "اللغة",

    // Sidebar
    dashboard: "لوحة التحكم",
    airlineCodes: "رموز شركات الطيران",
    vendors: "الموردين",
    customers: "العملاء",
    bankAccounts: "الحسابات البنكية",
    sales: "المبيعات",
    newServices: "خدمات جديدة",
    salesReport: "تقرير المبيعات",
    reports: "التقارير",
    payments: "المدفوعات",
    paymentList: "قائمة المدفوعات",
    refunds: "المبالغ المستردة",
    ledger: "دفتر الأستاذ",
    expenses: "المصروفات",
    users: "المستخدمون",
    logout: "تسجيل الخروج",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem("appLanguage") || "en";
  });

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  const t = (key) => translations[language]?.[key] ?? translations.en[key] ?? key;

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;