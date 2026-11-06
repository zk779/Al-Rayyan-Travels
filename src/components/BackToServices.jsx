"use client";

import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/** The "← Services" button that takes you back to the Sales Services page (all the options). */
export default function BackToServices({ className = "" }) {
  return (
    <Link
      to="/new-services"
      className={`group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-md ${className}`}
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
      Services
    </Link>
  );
}
