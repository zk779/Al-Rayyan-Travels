"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "../../../shadcn/components/ui/input";
import { Label } from "../../../shadcn/components/ui/label";
import { Textarea } from "../../../shadcn/components/ui/textarea";
import { Badge } from "../../../shadcn/components/ui/badge";
import { Separator } from "../../../shadcn/components/ui/separator";
import { Checkbox } from "../../../shadcn/components/ui/checkbox";
import { Calendar } from "../../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../shadcn/components/ui/popover";
import { Button } from "../../../shadcn/components/ui/button";
import {
  Search,
  CalendarIcon,
  User,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileUp,
  X,
  Banknote,
  Landmark,
  Receipt,
  PlaneTakeoff,
  Undo2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../../shadcn/lib/utils";
import SlideButton from "../../../shadcn/components/ui/slide-button";
import {
  API_BASE,
  authHeaders,
  authFormHeaders,
  fmt,
  validateFile,
  balMeta,
  normalizeEntity,
  normalizeSale,
  StepsBar,
} from "./DepositShared";

// ── Helper: remaining due for a sale, refund-aware ──────────────────────────
// The backend's /api/sales/customerSales route already returns a `dueAmount`
// that accounts for any refund issued against the sale (originalDue minus
// whatever was refunded back to the customer). We must use that instead of
// recomputing `sellPrice - paidAmount` locally, or a partially-refunded sale
// would still show/allow payment against its pre-refund due amount.
// Falls back to the raw calculation only if `dueAmount` is somehow missing
// (e.g. an older cached response shape), so this never breaks outright.
const getRemainingDue = (sale) =>
  sale?.dueAmount != null
    ? Number(sale.dueAmount)
    : Math.max((sale?.sellPrice ?? 0) - (sale?.paidAmount ?? 0), 0);

// ── Helper: format a sale's date for display (short form) ──────────────────
const formatSaleDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return format(d, "dd MMM yyyy");
};

// ── Customer Deposit Tab ────────────────────────────────────────────────────
// Unlike vendor payments, a customer payment must be allocated against one or
// more of that customer's open Sales (invoices) whose paymentStatus is DUE or
// PARTIAL. The backend expects a `saleAllocations` array of
// [{ saleId, amount }] — the total `amount` posted to the ledger is the sum
// of those allocations, and each Sale gets its paidAmount/paymentStatus
// updated (PARTIAL or PAID) server-side.
//
// `onClose`: called when the user backs out of the flow (e.g. closes the dialog).
// `onSuccess`: called with the completed payment payload once recorded.
export default function CustomerDepositTab({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = Find, 2 = Select Invoices, 3 = Payment
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [entity, setEntity] = useState(null);

  // Open (DUE/PARTIAL) sales for the selected customer
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");

  // selections: { [saleId]: { checked: bool, amount: string } }
  const [selections, setSelections] = useState({});

  const [date, setDate] = useState(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // CASH | BANK_TRANSFER
  const [bankId, setBankId] = useState("");
  const [banks, setBanks] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState(false);
  const [payError, setPayError] = useState("");
  const debounceRef = useRef(null);

  const accentBtn = "bg-violet-600 hover:bg-violet-700";
  const accentBar = "from-violet-500 to-purple-500";

  const { label: balLabel, cls: balCls } = entity
    ? balMeta(entity.balance, "customer", null)
    : { label: "", cls: "" };
  const name = entity?.customerName ?? "";

  // ── Derived: selected allocations + totals ──────────────────────────────
  const selectedAllocations = useMemo(
    () =>
      Object.entries(selections)
        .filter(([, v]) => v.checked)
        .map(([saleId, v]) => ({ saleId, amount: parseFloat(v.amount) || 0 })),
    [selections],
  );

  const totalAmount = selectedAllocations.reduce((s, a) => s + a.amount, 0);

  const salesById = useMemo(
    () => new Map(sales.map((s) => [s.id, s])),
    [sales],
  );

  // A row is invalid if checked but amount is <= 0 or exceeds the remaining due
  const hasInvalidSelection = selectedAllocations.some((a) => {
    const sale = salesById.get(a.saleId);
    if (!sale) return true;
    const remaining = getRemainingDue(sale);
    return a.amount <= 0 || a.amount > remaining + 0.01;
  });

  const canContinueToPayment =
    selectedAllocations.length > 0 && !hasInvalidSelection;

  const newBalance = (entity?.balance ?? 0) - totalAmount;

  // ── Search: debounced call to GET /api/customers ────────────────────────
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError("");
      return;
    }
    setSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const searchQuery = encodeURIComponent(query.trim());

        const res = await fetch(
          `${API_BASE}/api/customers?search=${searchQuery}`,
          { method: "GET", headers: authHeaders() },
        );

        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Search failed");

        const list = (json.data || []).map(normalizeEntity);
        setResults(list);
        setSearchError(list.length === 0 ? "No matches found" : "");
      } catch (err) {
        setResults([]);
        setSearchError(err.message || "Search failed");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Load active banks once (for BANK_TRANSFER method) ──────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/banks?status=true`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBanks(json.data || []);
      })
      .catch(() => {});
  }, []);

  // ── Fetch this customer's open (DUE/PARTIAL) sales ──────────────────────
  // NOTE: adjust the endpoint/query params below to match your actual sales
  // list route if it differs (e.g. a different param name for status).
  const fetchOpenSales = async (customerId) => {
    setSalesLoading(true);
    setSalesError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/sales/customerSales?customerId=${customerId}&paymentStatus=DUE,PARTIAL`,
        { method: "GET", headers: authHeaders() },
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || "Failed to load invoices");
      let list = (json.data || []).map((raw) => ({
        ...normalizeSale(raw),
        dueAmount: raw.dueAmount,
        isRefunded: raw.isRefunded,
        refundedAmount: raw.refundedAmount,
        saleDate:
          raw.saleDate ?? raw.invoice?.saleDate ?? raw.createdAt ?? null,
      }));

      // ── Sort ascending — oldest invoice first ──────────────────────────
      list = [...list].sort((a, b) => {
        const ta = a.saleDate ? new Date(a.saleDate).getTime() : 0;
        const tb = b.saleDate ? new Date(b.saleDate).getTime() : 0;
        return ta - tb;
      });

      setSales(list);

      // default: pre-check nothing, but pre-fill amount = remaining due
      // (refund-adjusted, via getRemainingDue) for when a row gets checked
      const initial = {};
      list.forEach((s) => {
        initial[s.id] = {
          checked: false,
          amount: getRemainingDue(s).toFixed(2),
        };
      });
      setSelections(initial);

      if (list.length === 0)
        setSalesError("No due or partial invoices for this customer");
    } catch (err) {
      setSales([]);
      setSelections({});
      setSalesError(err.message || "Failed to load invoices");
    } finally {
      setSalesLoading(false);
    }
  };

  const selectEntity = (e) => {
    setEntity(e);
    setResults([]);
    setQuery("");
  };

  const goToInvoices = () => {
    setStep(2);
    fetchOpenSales(entity.id);
  };

  // ── Selection handlers ───────────────────────────────────────────────────
  const toggleSale = (sale) => {
    setSelections((prev) => {
      const cur = prev[sale.id] ?? { checked: false, amount: "0" };
      const remaining = getRemainingDue(sale);
      return {
        ...prev,
        [sale.id]: {
          checked: !cur.checked,
          amount: !cur.checked ? remaining.toFixed(2) : cur.amount,
        },
      };
    });
  };

  const updateAmount = (saleId, value) => {
    setSelections((prev) => ({
      ...prev,
      [saleId]: { ...prev[saleId], amount: value },
    }));
  };

  const clampAmount = (sale) => {
    setSelections((prev) => {
      const cur = prev[sale.id];
      if (!cur) return prev;
      const remaining = getRemainingDue(sale);
      let amt = parseFloat(cur.amount) || 0;
      if (amt > remaining) amt = remaining;
      if (amt < 0) amt = 0;
      return { ...prev, [sale.id]: { ...cur, amount: amt.toFixed(2) } };
    });
  };

  const payFullForSale = (sale) => {
    const remaining = getRemainingDue(sale);
    setSelections((prev) => ({
      ...prev,
      [sale.id]: { checked: true, amount: remaining.toFixed(2) },
    }));
  };

  // ── File select handler ──────────────────────────────────────────────────
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
        form.append("partyType", "CUSTOMER");
        form.append("customerId", entity.id);
        form.append("method", paymentMethod);
        if (paymentMethod === "BANK_TRANSFER") form.append("bankId", bankId);
        form.append("amount", String(totalAmount));
        form.append("saleAllocations", JSON.stringify(selectedAllocations));
        if (remarks) form.append("remarks", remarks);
        form.append("transactionDate", date.toISOString());
        if (file) form.append("attachment", file); // field name must match upload.single("attachment")

        const res = await fetch(`${API_BASE}/api/payments/vendor-customer`, {
          method: "POST",
          headers: authFormHeaders(),
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

        setSuccess(true);
        onSuccess?.({
          entity,
          mode: "customer",
          amount: totalAmount,
          allocations: selectedAllocations,
          date,
          attachmentUrl: json.data?.attachmentUrl ?? null,
          remarks,
          payment: json.data,
        });
        resolve();
      } catch (err) {
        setPayError(err.message || "Payment failed");
        reject(err);
      } finally {
        setUploading(false);
      }
    });
  };

  const startNewPayment = () => {
    setSuccess(false);
    setFile(null);
    setFileError("");
    setRemarks("");
    setEntity(null);
    setQuery("");
    setSales([]);
    setSelections({});
    setPaymentMethod("CASH");
    setBankId("");
    setPayError("");
    setStep(1);
  };

  // ── STEP 1: Find Customer ────────────────────────────────────────────────
  if (step === 1)
    return (
      <div className="space-y-4">
        <StepsBar
          step={1}
          labels={["Find Customer", "Select Invoices", "Payment"]}
          accentBar={accentBar}
        />

        {/* Search box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Search className="w-4 h-4" /> Search Customer
            </h2>
            <Badge
              variant="outline"
              className="text-xs bg-violet-50 text-violet-700 border-violet-200"
            >
              Customer Payment
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type customer name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
              autoFocus
            />
            <div className="h-10 w-10 flex items-center justify-center">
              {searching && (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
          {searchError && (
            <p className="text-xs text-slate-400 mt-2">{searchError}</p>
          )}
        </div>

        {/* Results picker (multiple matches) */}
        {results.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => selectEntity(r)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {r.customerName}
                  </p>
                  <p className="text-xs text-slate-400">{r.customerType}</p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {fmt(r.balance)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Result card */}
        {entity && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
            <div className="p-6">
              {/* Entity header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-100">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-500">
                      {entity.customerType === "CORPORATE"
                        ? "Corporate Client"
                        : entity.customerType === "TABBY_OR_TAMARA"
                          ? "Tabby / Tamara"
                          : "Walk-in Customer"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full border",
                    balCls,
                  )}
                >
                  {balLabel}
                </span>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 text-xs text-slate-500">
                {[
                  [Phone, entity.phone],
                  [Mail, entity.email],
                  [MapPin, entity.address],
                ].map(
                  ([Icon, val], i) =>
                    val && (
                      <span key={i} className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        {val}
                      </span>
                    ),
                )}
              </div>

              <Separator className="mb-5" />

              {/* Balance */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] text-slate-400 mb-1">Opening</p>
                  <p className="font-semibold text-slate-700 text-sm">
                    {fmt(entity.openingBalance)}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-xl border p-3.5 col-span-2",
                    entity.balance > 0
                      ? "bg-amber-50 border-amber-100"
                      : entity.balance < 0
                        ? "bg-blue-50 border-blue-100"
                        : "bg-green-50 border-green-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] mb-1",
                      entity.balance > 0
                        ? "text-amber-500"
                        : entity.balance < 0
                          ? "text-blue-500"
                          : "text-green-500",
                    )}
                  >
                    Current Balance
                  </p>
                  <p
                    className={cn(
                      "font-bold text-2xl",
                      entity.balance > 0
                        ? "text-amber-700"
                        : entity.balance < 0
                          ? "text-blue-700"
                          : "text-green-700",
                    )}
                  >
                    {entity.balance < 0 ? "−" : ""}
                    {fmt(entity.balance)}
                  </p>
                </div>
              </div>

              <Button
                className={cn("w-full h-11 font-semibold gap-2", accentBtn)}
                onClick={goToInvoices}
              >
                View Open Invoices
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>
        )}

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

  // ── STEP 2: Select Invoices ──────────────────────────────────────────────
  if (step === 2)
    return (
      <div className="space-y-4">
        <StepsBar
          step={2}
          labels={["Find Customer", "Select Invoices", "Payment"]}
          accentBar={accentBar}
        />

        {/* Mini entity strip */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-100">
              <User className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{name}</p>
              <p className="text-xs text-slate-400">
                Current balance:{" "}
                <span
                  className={cn(
                    "font-medium",
                    entity.balance > 0
                      ? "text-red-600"
                      : entity.balance < 0
                        ? "text-blue-600"
                        : "text-green-600",
                  )}
                >
                  {entity.balance < 0 ? "−" : ""}
                  {fmt(entity.balance)}
                </span>
              </p>
            </div>
          </div>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full border",
              balCls,
            )}
          >
            {balLabel}
          </span>
        </div>

        {/* Invoice list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
          <div className="p-5">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4" /> Open Invoices (Due / Partial)
            </h3>

            {salesLoading && (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!salesLoading && salesError && (
              <p className="text-sm text-slate-400 text-center py-8">
                {salesError}
              </p>
            )}

            {!salesLoading && sales.length > 0 && (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {sales.map((sale) => {
                  const sel = selections[sale.id] ?? {
                    checked: false,
                    amount: "0",
                  };
                  const remaining = getRemainingDue(sale);
                  const amt = parseFloat(sel.amount) || 0;
                  const rowInvalid =
                    sel.checked && (amt <= 0 || amt > remaining + 0.01);
                  const saleDateLabel = formatSaleDate(sale.saleDate);

                  return (
                    <div
                      key={sale.id}
                      className={cn(
                        "rounded-xl border p-3.5 transition-colors",
                        sel.checked
                          ? "border-violet-200 bg-violet-50/50"
                          : "border-slate-200 bg-white",
                        rowInvalid && "border-red-300 bg-red-50/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={sel.checked}
                          onCheckedChange={() => toggleSale(sale)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800">
                              Invoice {sale.invoiceNo}
                            </p>
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
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                            {saleDateLabel && (
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {saleDateLabel}
                              </span>
                            )}
                            {sale.paxName && <span>{sale.paxName}</span>}
                            {sale.pnr && (
                              <span className="flex items-center gap-1">
                                <PlaneTakeoff className="w-3 h-3" />
                                {sale.pnr}
                              </span>
                            )}
                            {sale.departureDate && (
                              <span>
                                {new Date(
                                  sale.departureDate,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2.5 gap-3">
                            {sale.isRefunded ? (
                              <div className="text-xs text-slate-500 leading-relaxed">
                                Sell {fmt(sale.sellPrice)} · Paid{" "}
                                {fmt(sale.paidAmount)} · Due was{" "}
                                <span className="line-through text-slate-400">
                                  {fmt(sale.sellPrice - sale.paidAmount)}
                                </span>{" "}
                                — after a refund of{" "}
                                <span className="font-medium text-violet-600">
                                  {fmt(sale.refundedAmount)}
                                </span>{" "}
                                to the customer,{" "}
                                <span className="font-semibold text-slate-700">
                                  {fmt(remaining)} remains payable
                                </span>
                                .
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">
                                Sell {fmt(sale.sellPrice)} · Paid{" "}
                                {fmt(sale.paidAmount)} ·{" "}
                                <span className="font-semibold text-slate-700">
                                  Due {fmt(remaining)}
                                </span>
                              </div>
                            )}
                          </div>

                          {sel.checked && (
                            <div className="flex items-center gap-2 mt-2.5">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium select-none">
                                  SAR
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={sel.amount}
                                  onChange={(e) =>
                                    updateAmount(sale.id, e.target.value)
                                  }
                                  onBlur={() => clampAmount(sale)}
                                  className="pl-11 h-9 text-sm font-medium"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => payFullForSale(sale)}
                                className="text-xs font-medium text-violet-600 hover:text-violet-700 whitespace-nowrap px-2"
                              >
                                Pay full
                              </button>
                            </div>
                          )}
                          {rowInvalid && (
                            <p className="text-[11px] text-red-500 mt-1.5">
                              Amount must be greater than 0 and not exceed the
                              remaining due ({fmt(remaining)}).
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Running total */}
        {selectedAllocations.length > 0 && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-violet-500">
                {selectedAllocations.length} invoice
                {selectedAllocations.length > 1 ? "s" : ""} selected
              </p>
              <p className="font-bold text-violet-800 text-lg">
                {fmt(totalAmount)}
              </p>
            </div>
            <Button
              className={cn("h-10 font-semibold gap-2", accentBtn)}
              disabled={!canContinueToPayment}
              onClick={() => setStep(3)}
            >
              Continue to Payment
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <button
          onClick={() => setStep(1)}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back to search
        </button>
      </div>
    );

  // ── STEP 3: Payment ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <StepsBar
        step={3}
        labels={["Find Customer", "Select Invoices", "Payment"]}
        accentBar={accentBar}
      />

      {success ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-xl mb-1">
            Payment Recorded!
          </h3>
          <p className="text-slate-500 text-sm mb-1">
            {fmt(totalAmount)} recorded for{" "}
            <span className="font-medium">{name}</span> across{" "}
            {selectedAllocations.length} invoice
            {selectedAllocations.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-slate-400 mb-6">
            New balance:{" "}
            <span
              className={cn(
                "font-semibold",
                newBalance > 0
                  ? "text-red-600"
                  : newBalance < 0
                    ? "text-blue-600"
                    : "text-green-600",
              )}
            >
              {newBalance < 0 ? "−" : ""}
              {fmt(newBalance)}
            </span>
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={startNewPayment}
            >
              New Payment
            </Button>
            <Button className={cn("flex-1", accentBtn)} onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Selected invoices summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-2.5">
              Paying {selectedAllocations.length} invoice
              {selectedAllocations.length > 1 ? "s" : ""} for{" "}
              <span className="font-medium text-slate-600">{name}</span>
            </p>
            <div className="space-y-2">
              {selectedAllocations.map((a) => {
                const sale = salesById.get(a.saleId);
                const saleDateLabel = formatSaleDate(sale?.saleDate);
                return (
                  <div
                    key={a.saleId}
                    className="flex items-center justify-between text-sm gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-slate-600 truncate">
                        Invoice {sale?.invoiceNo ?? a.saleId}
                      </p>
                      {(sale?.paxName || saleDateLabel) && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {[sale?.paxName, saleDateLabel]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="font-medium text-slate-800 whitespace-nowrap">
                      {fmt(a.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
            <Separator className="my-2.5" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Total
              </span>
              <span className="font-bold text-violet-700">
                {fmt(totalAmount)}
              </span>
            </div>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
            <div className="p-6 space-y-5">
              {/* Balance overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Total Receivable
                  </p>
                  <p className="font-bold text-slate-800">
                    {fmt(Math.abs(entity.balance))}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-xl border p-3.5 transition-colors",
                    newBalance > 0
                      ? "bg-amber-50 border-amber-100"
                      : newBalance < 0
                        ? "bg-blue-50 border-blue-100"
                        : "bg-green-50 border-green-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] mb-1",
                      newBalance > 0
                        ? "text-amber-500"
                        : newBalance < 0
                          ? "text-blue-500"
                          : "text-green-500",
                    )}
                  >
                    Balance After
                  </p>
                  <p
                    className={cn(
                      "font-bold",
                      newBalance > 0
                        ? "text-amber-700"
                        : newBalance < 0
                          ? "text-blue-700"
                          : "text-green-700",
                    )}
                  >
                    {newBalance < 0 ? "−" : ""}
                    {fmt(newBalance)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Payment amount (read-only — derived from selected invoices) */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Payment Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
                    SAR
                  </span>
                  <Input
                    type="text"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    disabled
                    className="pl-14 h-10 font-medium bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Derived from the invoices selected in the previous step.{" "}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-violet-600 hover:underline"
                  >
                    Edit selection
                  </button>
                </p>
              </div>

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

              {/* Bank selector (only for BANK_TRANSFER) */}
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
                {fileError && (
                  <p className="text-xs text-red-500">{fileError}</p>
                )}
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
                disabled={
                  totalAmount <= 0 ||
                  uploading ||
                  !!fileError ||
                  (paymentMethod === "BANK_TRANSFER" && !bankId)
                }
                price={totalAmount}
                mode="customer"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to invoices
          </button>
        </>
      )}
    </div>
  );
}
