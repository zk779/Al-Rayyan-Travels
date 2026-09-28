"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Loader2,
  AlertCircle,
  Printer,
  Receipt,
  Calendar as CalendarIcon,
  User,
  Building2,
  MapPin,
  SaudiRiyal,
  Wallet,
  CreditCard,
  Banknote,
  Terminal,
  Undo2,
  Hash,
  Plane,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ─── Badge helpers ──────────────────────────────────────── */
const STATUS_STYLES = {
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  REFUNDED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
};
const PAYMENT_STYLES = {
  CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CREDIT: "bg-blue-50 text-blue-700 border-blue-200",
  BANK_TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
  POS: "bg-cyan-50 text-cyan-700 border-cyan-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
};
const REFUND_PAYOUT_STYLES = {
  CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BANK_TRANSFER: "bg-sky-50 text-sky-700 border-sky-200",
  CUSTOMER_LEDGER: "bg-violet-50 text-violet-700 border-violet-200",
};

const Badge = ({ className, children, title }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

const StatusBadge = ({ status }) => (
  <Badge className={STATUS_STYLES[status?.toUpperCase()] || "bg-gray-100 text-gray-700 border-gray-200"}>
    {status || "N/A"}
  </Badge>
);

const PAYMENT_ICONS = { CASH: Banknote, CREDIT: CreditCard, BANK_TRANSFER: Building2, POS: Terminal, PARTIAL: Wallet };
const PaymentBadge = ({ type }) => {
  const Icon = PAYMENT_ICONS[type?.toUpperCase()] || Wallet;
  return (
    <Badge className={PAYMENT_STYLES[type?.toUpperCase()] || "bg-gray-50 text-gray-700 border-gray-200"}>
      <Icon className="h-3 w-3" /> {type || "N/A"}
    </Badge>
  );
};

const RefundPayoutBadge = ({ refund }) => {
  if (!refund?.refundType) return null;
  const label =
    refund.refundType === "BANK_TRANSFER"
      ? refund.bank?.bankName
        ? `Bank - ${refund.bank.bankName}`
        : "Bank Transfer"
      : refund.refundType === "CUSTOMER_LEDGER"
        ? "Customer Ledger"
        : "Cash";
  return (
    <Badge className={REFUND_PAYOUT_STYLES[refund.refundType] || "bg-gray-50 text-gray-700 border-gray-200"}>
      <Undo2 className="h-3 w-3" /> Refunded via {label}
    </Badge>
  );
};

/* ─── Small field display ──────────────────────────────────── */
const Field = ({ label, value, mono, highlight }) => (
  <div className="space-y-0.5 min-w-0">
    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
    <div
      className={`text-sm truncate ${mono ? "font-mono" : "font-medium"} ${highlight ? "text-slate-900 font-semibold" : "text-slate-700"}`}
      title={typeof value === "string" ? value : undefined}
    >
      {value ?? "—"}
    </div>
  </div>
);

const MoneyField = ({ label, value, tone = "slate" }) => (
  <div className="space-y-0.5">
    <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`flex items-center gap-0.5 text-sm font-semibold text-${tone}-700`}>
      <SaudiRiyal size={12} /> {Number(value || 0).toFixed(2)}
    </div>
  </div>
);

const formatDestinations = (destinations) => {
  if (!destinations || destinations.length === 0) return null;
  return destinations.map((d) => d.value).join(" → ");
};

const formatDate = (d) => (d ? format(new Date(d), "MMM dd, yyyy") : "N/A");

/* ─── Payment method detail line ──────────────────────────── */
function PaymentDetail({ sale }) {
  const ps = sale.paymentSummary;
  if (!ps) return null;

  if (ps.type === "BANK_TRANSFER") {
    return <span>{ps.bankName ? `${ps.bankName}${ps.accountNo ? ` — ${ps.accountNo}` : ""}` : "Bank account"}</span>;
  }
  if (ps.type === "POS") {
    return (
      <span>
        {ps.bankName || "POS"}{ps.terminalId ? ` · Terminal ${ps.terminalId}` : ""}
        {ps.cardType ? ` · ${ps.cardType}` : ""}
        {ps.commissionRate != null ? ` (${ps.commissionRate}%)` : ""}
      </span>
    );
  }
  if (ps.type === "CREDIT") {
    return (
      <span>
        {ps.customerName || "Customer"} — Due {Number(ps.dueAmount || 0).toFixed(2)} SAR
      </span>
    );
  }
  if (ps.type === "PARTIAL") {
    return (
      <span>
        {(ps.legs || [])
          .map((l) => `${l.method} (${Number(l.amount || 0).toFixed(2)})`)
          .join(" + ")}
      </span>
    );
  }
  return null;
}

/* ─── One sale card ──────────────────────────────────────── */
function SaleCard({ sale, index }) {
  const isRefunded = sale.status?.toUpperCase() === "REFUNDED";
  const route = formatDestinations(sale.destinations);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-600 text-[11px] font-semibold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <Hash className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-mono text-sm font-semibold text-slate-800 truncate">
            {sale.documentNo || "—"}
          </span>
          {sale.pnr && (
            <span className="text-xs text-slate-400 shrink-0">
              PNR <span className="font-mono text-slate-600">{sale.pnr}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={sale.status} />
          <PaymentBadge type={sale.paymentType} />
          <RefundPayoutBadge refund={sale.refund} />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Core details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Field label="Passenger" value={sale.paxName} highlight />
          <Field
            label="Airline"
            value={sale.airline ? `${sale.airline.airlineCode} — ${sale.airline.airlineName}` : "N/A"}
          />
          <Field label="Route" value={route || "N/A"} />
          <Field label="Vendor" value={sale.vendor?.vendorName || "N/A"} />
          <Field label="Customer" value={sale.customer?.customerName || "Walk-in"} />
          <Field label="Trip Type" value={sale.tripType || "N/A"} />
        </div>

        <div className="h-px bg-slate-100" />

        {/* Money */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <MoneyField label="Net Price" value={sale.netPrice} />
          <MoneyField label="Sell Price" value={sale.sellPrice} tone="purple" />
          <MoneyField label="Profit" value={sale.profit} tone="green" />
          <MoneyField label="Paid" value={sale.paidAmount} tone="blue" />
          <MoneyField
            label="Due"
            value={Math.max(Number(sale.sellPrice || 0) - Number(sale.paidAmount || 0), 0)}
            tone={Number(sale.sellPrice || 0) - Number(sale.paidAmount || 0) > 0.01 ? "red" : "slate"}
          />
          <MoneyField label="VAT (15%)" value={sale.vatAmount} tone="indigo" />
          <MoneyField label="Misc" value={sale.miscCharges} />
        </div>

        {/* Payment method detail + refund info */}
        {(sale.paymentSummary || sale.refund) && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-slate-400" />
              <PaymentDetail sale={sale} />
            </div>
            {sale.refund && (
              <div className="flex items-center gap-1.5">
                <Undo2 className="h-3.5 w-3.5 text-rose-400" />
                <span>
                  Refund {isRefunded ? "" : "on this sale "}
                  {formatDate(sale.refund.refundDate)} — {Number(sale.refund.netRefundToCustomer || 0).toFixed(2)} SAR
                  {sale.refund.refundReason ? ` (${sale.refund.refundReason})` : ""}
                </span>
              </div>
            )}
          </div>
        )}

        {sale.remarks && (
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            <span className="font-medium text-slate-600">Remarks: </span>
            {sale.remarks}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Summary stat card ──────────────────────────────────── */
const StatCard = ({ label, value, color, icon: Icon, money = true }) => (
  <div className={`bg-white rounded-xl p-4 shadow-sm border border-${color}-200`}>
    <div className={`flex items-center gap-1.5 text-xs text-${color}-600 mb-1 font-medium`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className={`flex items-center gap-1 text-2xl font-bold text-${color}-700`}>
      {money && <SaudiRiyal size={16} />}
      {value}
    </div>
  </div>
);

/* ─── Main page ──────────────────────────────────────────── */
export default function ViewInvoice() {
  const { invoiceId } = useParams();
  const token = localStorage.getItem("token");

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId || !token) return;
    const controller = new AbortController();
    // Guards against React 18 StrictMode's dev-only double-effect-invocation:
    // the first run's request gets aborted almost immediately and a second
    // one starts right after, but the FIRST request's own finally block was
    // still landing afterwards and clobbering `loading` back to false while
    // `invoice` was still null — flashing the error screen for a frame
    // before the real (second) request resolved. Once cleanup has run, this
    // stale run must not touch state at all.
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/sales/${invoiceId}?includeRefunded=true`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch invoice");
        if (!ignore) setInvoice(json.data);
      } catch (err) {
        if (!ignore && err.name !== "AbortError") setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [invoiceId, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-md border border-slate-200 max-w-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-semibold mb-1">Couldn't load invoice</p>
          <p className="text-slate-500 text-sm">{error || "Invoice not found"}</p>
        </div>
      </div>
    );
  }

  const sales = invoice.sales || [];
  const totals = sales.reduce(
    (acc, s) => ({
      net: acc.net + (Number(s.netPrice) || 0),
      sell: acc.sell + (Number(s.sellPrice) || 0),
      profit: acc.profit + (Number(s.profit) || 0),
      paid: acc.paid + (Number(s.paidAmount) || 0),
    }),
    { net: 0, sell: 0, profit: 0, paid: 0 },
  );
  const totalDue = Math.max(totals.sell - totals.paid, 0);
  const refundedCount = sales.filter((s) => s.status?.toUpperCase() === "REFUNDED" || s.refund).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Receipt className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Invoice</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-mono">{invoice.invoiceNo}</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-primary text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        {/* Invoice meta */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Date:</span>
            <span className="font-medium text-slate-800">{formatDate(invoice.saleDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Branch:</span>
            <span className="font-medium text-slate-800">{invoice.branchName || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Created by:</span>
            <span className="font-medium text-slate-800">{invoice.createdByName || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Plane className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Items:</span>
            <span className="font-medium text-slate-800">{sales.length}</span>
          </div>
          {refundedCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Undo2 className="h-4 w-4 text-rose-400" />
              <span className="text-rose-600 font-medium">{refundedCount} refund-related item{refundedCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <StatCard label="Net Total" value={totals.net.toFixed(2)} color="blue" icon={MapPin} />
          <StatCard label="Sell Total" value={totals.sell.toFixed(2)} color="purple" icon={SaudiRiyal} />
          <StatCard label="Profit" value={totals.profit.toFixed(2)} color="green" icon={SaudiRiyal} />
          <StatCard label="Paid" value={totals.paid.toFixed(2)} color="indigo" icon={Wallet} />
          <StatCard label="Due" value={totalDue.toFixed(2)} color={totalDue > 0.01 ? "red" : "slate"} icon={SaudiRiyal} />
        </div>

        {/* Sales */}
        <div className="space-y-4">
          {sales.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No sales found on this invoice.</p>
            </div>
          ) : (
            sales.map((sale, i) => <SaleCard key={sale.id} sale={sale} index={i} />)
          )}
        </div>
      </div>
    </div>
  );
}
