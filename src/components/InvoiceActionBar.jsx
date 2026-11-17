"use client";

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";

/**
 * The bar above a printable invoice (screen only — it never prints): a way back and a Print button.
 * The same bar the Other Services invoice has; the invoice sheet itself is not touched.
 */
export default function InvoiceActionBar({ backTo = "/sales-report", backLabel = "Sales Report" }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 print:hidden" data-testid="invoice-action-bar">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800"
      >
        <Printer className="h-4 w-4" /> Print
      </button>
    </div>
  );
}
