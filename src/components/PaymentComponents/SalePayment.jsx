"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "../../../shadcn/components/ui/input";
import { Label } from "../../../shadcn/components/ui/label";
import { Textarea } from "../../../shadcn/components/ui/textarea";
import { Badge } from "../../../shadcn/components/ui/badge";
import { Separator } from "../../../shadcn/components/ui/separator";
import { Calendar } from "../../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../shadcn/components/ui/popover";
import { Button } from "../../../shadcn/components/ui/button";
import {
  CalendarIcon,
  User,
  CheckCircle2,
  FileUp,
  X,
  Banknote,
  Landmark,
  Receipt,
  PlaneTakeoff,
  Undo2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../shadcn/lib/utils";
import SlideButton from "../../../shadcn/components/ui/slide-button";

// ── Standalone helpers ───────────────────────────────────────────────────
// NOTE: this component is meant to be self-contained (dropped in as a
// dialog from DetailedReportTab), so these are inlined rather than pulled
// from DepositShared. Adjust relative import depths above if this file
// ends up living somewhere other than alongside detailedReport.jsx.
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(Number(n || 0));

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024;
  const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (!allowed.includes(file.type))
    return "Only PDF, JPG, or PNG files are allowed";
  if (file.size > maxSize) return "File must be under 10MB";
  return "";
};

// NOTE: adjust this path if your GET (fetch sale) and POST (record payment)
// routes for a single sale live somewhere other than /api/Salepayment/:saleId.
const salePaymentUrl = (saleId) => `${API_BASE}/api/salePayment/${saleId}`;
const fetchSaleUrl = (saleId) => `${API_BASE}/api/sales/saleId/${saleId}`;

// ── Sale Payment ─────────────────────────────────────────────────────────
// Given a saleId, fetches that sale's full details (refund-adjusted due
// amount included) and records a single payment against it — crediting the
// customer's ledger + balance IF the sale has a customer attached, and
// always crediting the cash/bank ledger + balance regardless.
//
// `saleId`: the sale to pay against.
// `onClose`: called when the user backs out of the flow (e.g. closes the dialog).
// `onSuccess`: called with the completed payment payload once recorded.
export default function SalePayment({ saleId, onClose, onSuccess }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [amount, setAmount] = useState("0.00");
  const [date, setDate] = useState(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // CASH | BANK_TRANSFER
  const [bankId, setBankId] = useState("");
  const [bankSlipNo, setBankSlipNo] = useState("");
  const [banks, setBanks] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState(false);
  const [payError, setPayError] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);

  const accentBtn = "bg-blue-600 hover:bg-blue-700";
  const accentBar = "from-blue-500 to-cyan-500";

  const hasCustomer = !!sale?.customerId && !!sale?.customer;
  const customerBalance = sale?.customer?.account?.balance ?? null;

  // Remaining due is already refund-adjusted by the backend (dueAmount).
  const remainingDue = sale?.dueAmount != null ? Number(sale.dueAmount) : 0;

  const amt = parseFloat(amount) || 0;
  const isAmountInvalid = amt <= 0 || amt > remainingDue + 0.01;

  const newCustomerBalance =
    hasCustomer && customerBalance != null ? customerBalance - amt : null;

  const canPay =
    amt > 0 &&
    !isAmountInvalid &&
    !uploading &&
    !fileError &&
    (paymentMethod !== "BANK_TRANSFER" || !!bankId);

  // ── Fetch the sale ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!saleId) return;
    let cancelled = false;

    const fetchSale = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch(fetchSaleUrl(saleId), {
          method: "GET",
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load sale");

        if (cancelled) return;
        setSale(json.data);
        const due =
          json.data?.dueAmount != null ? Number(json.data.dueAmount) : 0;
        setAmount(due.toFixed(2));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load sale");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSale();
    return () => {
      cancelled = true;
    };
  }, [saleId]);

  // ── Load active banks once (for BANK_TRANSFER method) ──────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/banks?status=true`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBanks(json.data || []);
      })
      .catch(() => {});
  }, []);

  const payFull = () => setAmount(remainingDue.toFixed(2));

  const clampAmount = () => {
    let v = parseFloat(amount) || 0;
    if (v > remainingDue) v = remainingDue;
    if (v < 0) v = 0;
    setAmount(v.toFixed(2));
  };

  const handleFileSelect = (selected) => {
    if (!selected) return;
    const err = validateFile(selected);
    if (err) {
      setFileError(err);
      setFile(null);
      return;
    }
    setFileError("");
    setFile(selected);
  };

  // ── Submit payment ───────────────────────────────────────────────────────
  const pay = () => {
    return new Promise(async (resolve, reject) => {
      try {
        setPayError("");
        setUploading(true);

        const form = new FormData();
        form.append("method", paymentMethod);
        if (paymentMethod === "BANK_TRANSFER") {
          form.append("bankId", bankId);
          if (bankSlipNo) form.append("bankSlipNo", bankSlipNo); // NEW
        }
        form.append("amount", String(amt));
        if (remarks) form.append("remarks", remarks);
        form.append("transactionDate", date.toISOString());
        if (file) form.append("attachment", file);

        const res = await fetch(salePaymentUrl(saleId), {
          method: "POST",
          headers: authHeaders(), // FormData sets its own Content-Type boundary
          body: form,
        });

        let json;
        try {
          json = await res.json();
        } catch {
          throw new Error(`Request failed (${res.status})`);
        }

        if (!json.success) {
          const msg = json.error || `Payment failed (${res.status})`;
          setPayError(msg);
          reject(new Error(msg));
          return;
        }

        setPaymentResult(json.data);
        setSuccess(true);
        onSuccess?.(json.data);
        resolve();
      } catch (err) {
        setPayError(err.message || "Payment failed");
        reject(err);
      } finally {
        setUploading(false);
      }
    });
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading sale details...</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadError || !sale) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-red-700 mb-1">
          Couldn't load this sale
        </p>
        <p className="text-xs text-red-500 mb-4">
          {loadError || "Sale not found"}
        </p>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 text-green-500" />
        </div>
        <h3 className="font-bold text-slate-800 text-xl mb-1">
          Payment Recorded!
        </h3>
        <p className="text-slate-500 text-sm mb-1">
          {fmt(amt)} recorded against Invoice{" "}
          <span className="font-medium">{sale.invoice?.invoiceNo}</span>
        </p>
        {hasCustomer && newCustomerBalance != null && (
          <p className="text-xs text-slate-400 mb-6">
            Customer's new balance:{" "}
            <span
              className={cn(
                "font-semibold",
                newCustomerBalance > 0
                  ? "text-red-600"
                  : newCustomerBalance < 0
                    ? "text-blue-600"
                    : "text-green-600",
              )}
            >
              {newCustomerBalance < 0 ? "−" : ""}
              {fmt(Math.abs(newCustomerBalance))}
            </span>
          </p>
        )}
        <Button className={cn("w-full", accentBtn)} onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Sale summary card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  Invoice {sale.invoice?.invoiceNo ?? "N/A"}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    hasCustomer ? "text-blue-600" : "text-emerald-600",
                  )}
                >
                  {hasCustomer ? (
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" /> {sale.customer.customerName}
                    </span>
                  ) : (
                    "Walk-in Customer"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {sale.isRefunded && (
                <Badge
                  variant="outline"
                  className="text-[10px] text-violet-600 bg-violet-50 border-violet-200 flex items-center gap-1"
                >
                  <Undo2 className="w-3 h-3" />
                  Partial refund applied
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  sale.paymentStatus === "PARTIAL"
                    ? "text-amber-600 bg-amber-50 border-amber-200"
                    : "text-red-600 bg-red-50 border-red-200",
                )}
              >
                {sale.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap mb-3">
            {sale.documentNo && <span>Doc# {sale.documentNo}</span>}
            {sale.paxName && <span>{sale.paxName}</span>}
            {sale.pnr && (
              <span className="flex items-center gap-1">
                <PlaneTakeoff className="w-3 h-3" />
                {sale.pnr}
              </span>
            )}
          </div>

          <Separator className="mb-3" />

          {sale.isRefunded ? (
            <div className="text-xs text-slate-500 leading-relaxed">
              Sell {fmt(sale.sellPrice)} · Paid {fmt(sale.paidAmount)} · Due was{" "}
              <span className="line-through text-slate-400">
                {fmt(sale.sellPrice - sale.paidAmount)}
              </span>{" "}
              — after a refund of{" "}
              <span className="font-medium text-violet-600">
                {fmt(sale.refundedAmount)}
              </span>{" "}
              to the customer,{" "}
              <span className="font-semibold text-slate-700">
                {fmt(remainingDue)} remains payable
              </span>
              .
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Sell {fmt(sale.sellPrice)} · Paid {fmt(sale.paidAmount)} ·{" "}
              <span className="font-semibold text-slate-700">
                Due {fmt(remainingDue)}
              </span>
            </div>
          )}

          {hasCustomer && customerBalance != null && (
            <p className="text-xs text-slate-400 mt-2">
              Customer's current overall balance:{" "}
              <span
                className={cn(
                  "font-medium",
                  customerBalance > 0
                    ? "text-red-600"
                    : customerBalance < 0
                      ? "text-blue-600"
                      : "text-green-600",
                )}
              >
                {customerBalance < 0 ? "−" : ""}
                {fmt(Math.abs(customerBalance))}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Payment form card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Payment Amount <span className="text-red-400">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
                  SAR
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={clampAmount}
                  className="pl-14 h-10 font-medium"
                />
              </div>
              <button
                type="button"
                onClick={payFull}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap px-2"
              >
                Pay full
              </button>
            </div>
            {isAmountInvalid && (
              <p className="text-[11px] text-red-500">
                Amount must be greater than 0 and not exceed the remaining due (
                {fmt(remainingDue)}).
              </p>
            )}
          </div>

          <Separator />

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Payment Method <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={cn(
                  "flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-colors",
                  paymentMethod === "CASH"
                    ? cn("border-transparent text-white", accentBtn)
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={cn(
                  "flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-colors",
                  paymentMethod === "BANK_TRANSFER"
                    ? cn("border-transparent text-white", accentBtn)
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                <Landmark className="w-4 h-4" /> Bank Transfer
              </button>
            </div>
          </div>

          {/* Bank selector */}
          {paymentMethod === "BANK_TRANSFER" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Bank <span className="text-red-400">*</span>
              </Label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select bank...</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {b.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* NEW — Bank slip number */}
          {paymentMethod === "BANK_TRANSFER" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Bank Slip / Transaction No.
              </Label>
              <Input
                placeholder="e.g. 034421313001"
                value={bankSlipNo}
                onChange={(e) => setBankSlipNo(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Payment Date <span className="text-red-400">*</span>
            </Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal h-10 text-sm text-slate-600"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Attachment
            </Label>
            <label className="flex items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-3.5 hover:border-slate-300 hover:bg-slate-50 transition-colors">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  file ? "bg-green-100" : "bg-slate-100",
                )}
              >
                {file ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <FileUp className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {file ? (
                  <p className="text-sm font-medium text-green-700 truncate">
                    {file.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 font-medium">
                      Click to upload
                    </p>
                    <p className="text-xs text-slate-400">
                      PDF, JPG, PNG — max 10MB
                    </p>
                  </>
                )}
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setFileError("");
                  }}
                  className="text-slate-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                className="hidden"
              />
            </label>
            {fileError && <p className="text-xs text-red-500">{fileError}</p>}
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Remarks
            </Label>
            <Textarea
              placeholder="Add payment notes or reference..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {payError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              {payError}
            </p>
          )}

          <SlideButton
            handlePayment={pay}
            disabled={!canPay}
            price={amt}
            mode="customer"
          />
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Cancel
        </button>
      )}
    </div>
  );
}
