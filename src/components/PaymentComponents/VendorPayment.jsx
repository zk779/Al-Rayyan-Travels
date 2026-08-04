"use client";

import { useState, useEffect, useRef } from "react";
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
  Search,
  CalendarIcon,
  Building2,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileUp,
  X,
  Banknote,
  Landmark,
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
  StepsBar,
} from "./DepositShared";

// ── Vendor Deposit Tab ──────────────────────────────────────────────────────
// `onClose`: called when the user backs out of the flow (e.g. closes the dialog).
// `onSuccess`: called with the completed payment payload once recorded, so the
//   parent (Payments page) can append it to the vendor table and close the dialog.
export default function VendorDepositTab({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = Find, 2 = Payment
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]); // multiple matches -> picker list
  const [searchError, setSearchError] = useState("");
  const [entity, setEntity] = useState(null);
  const [amount, setAmount] = useState("");
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
  const debounceRef = useRef(null);

  const newBalance =
    entity?.category === "CREDIT"
      ? (entity?.balance ?? 0) + (parseFloat(amount) || 0) // topping up increases balance
      : (entity?.balance ?? 0) - (parseFloat(amount) || 0); // paying down decreases balance
  const { label: balLabel, cls: balCls } = entity
    ? balMeta(entity.balance, "vendor", entity.category)
    : { label: "", cls: "" };
  const name = entity?.vendorName ?? "";

  const accentBtn = "bg-blue-600 hover:bg-blue-700";
  const accentBar = "from-blue-500 to-indigo-500";

  // ── Search: debounced call to GET /api/vendors ──────────────────────────
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
          `${API_BASE}/api/vendors?search=${searchQuery}`,
          { method: "GET", headers: authHeaders() },
        );

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

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

  const selectEntity = (e) => {
    setEntity(e);
    setResults([]);
    setQuery("");
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
        form.append("partyType", "VENDOR");
        form.append("vendorId", entity.id);
        form.append("method", paymentMethod);
        if (paymentMethod === "BANK_TRANSFER") {
          form.append("bankId", bankId);
          if (bankSlipNo) form.append("bankSlipNo", bankSlipNo); // NEW
        }
        form.append("amount", String(parseFloat(amount) || 0));
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
          mode: "vendor",
          amount: parseFloat(amount) || 0,
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
    setAmount("");
    setFile(null);
    setFileError("");
    setRemarks("");
    setEntity(null);
    setQuery("");
    setPaymentMethod("CASH");
    setBankId("");
    setBankSlipNo("");
    setPayError("");
    setStep(1);
  };

  // ── STEP 1: Find Vendor ──────────────────────────────────────────────────
  if (step === 1)
    return (
      <div className="space-y-4">
        <StepsBar
          step={1}
          labels={["Find Vendor", "Payment"]}
          accentBar={accentBar}
        />

        {/* Search box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Search className="w-4 h-4" /> Search Vendor
            </h2>
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              Vendor Payment
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type vendor name..."
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
                    {r.vendorName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {r.vendorType}
                    {r.category ? ` · ${r.category}` : ""}
                  </p>
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
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-500">
                      {entity.vendorType}
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
                    entity.category === "CREDIT"
                      ? entity.balance > 0
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-amber-50 border-amber-100"
                      : entity.balance > 0
                        ? "bg-red-50 border-red-100"
                        : entity.balance < 0
                          ? "bg-blue-50 border-blue-100"
                          : "bg-green-50 border-green-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] mb-1",
                      entity.category === "CREDIT"
                        ? entity.balance > 0
                          ? "text-emerald-500"
                          : "text-amber-500"
                        : entity.balance > 0
                          ? "text-red-500"
                          : entity.balance < 0
                            ? "text-blue-500"
                            : "text-green-500",
                    )}
                  >
                    Current Balance · {entity.category} Vendor
                  </p>
                  <p
                    className={cn(
                      "font-bold text-2xl",
                      entity.category === "CREDIT"
                        ? entity.balance > 0
                          ? "text-emerald-700"
                          : "text-amber-700"
                        : entity.balance > 0
                          ? "text-red-700"
                          : entity.balance < 0
                            ? "text-blue-700"
                            : "text-green-700",
                    )}
                  >
                    {entity.balance < 0 ? "−" : ""}
                    {fmt(entity.balance)}
                  </p>
                  {entity.category === "CREDIT" && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pay upfront to top up credit before booking sales.
                    </p>
                  )}
                  {entity.category === "DEBIT" && entity.balance > 0 && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Outstanding dues to settle with this vendor.
                    </p>
                  )}
                </div>
              </div>

              <Button
                className={cn("w-full h-11 font-semibold gap-2", accentBtn)}
                onClick={() => {
                  setAmount(Math.abs(entity.balance).toFixed(2));
                  setStep(2);
                }}
              >
                New Vendor Payment
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

  // ── STEP 2: Payment ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <StepsBar
        step={2}
        labels={["Find Vendor", "Payment"]}
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
            {fmt(parseFloat(amount))} recorded for{" "}
            <span className="font-medium">{name}</span>
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
          {/* Mini entity strip */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100">
                <Building2 className="w-4 h-4 text-blue-600" />
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

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
            <div className="p-6 space-y-5">
              {/* Balance overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Total Payable
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

              {/* Contextual hint */}
              {parseFloat(amount) > 0 && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      newBalance === 0
                        ? "bg-green-400"
                        : newBalance < 0
                          ? "bg-blue-400"
                          : "bg-amber-400",
                    )}
                  />
                  {entity.category === "CREDIT"
                    ? `Topping up by ${fmt(parseFloat(amount))} — no cap on credit vendors.`
                    : newBalance === 0
                      ? "This payment fully settles the balance. ✓"
                      : newBalance < 0
                        ? `Overpayment of ${fmt(Math.abs(newBalance))} is not allowed for this party.`
                        : `${fmt(newBalance)} will remain payable after this payment.`}
                </div>
              )}

              <Separator />

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Payment Amount <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
                    SAR
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-14 h-10 font-medium"
                    placeholder="0.00"
                  />
                </div>
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
                  !amount ||
                  parseFloat(amount) <= 0 ||
                  uploading ||
                  !!fileError ||
                  (paymentMethod === "BANK_TRANSFER" && !bankId)
                }
                price={parseFloat(amount) || 0}
                mode="vendor"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to search
          </button>
        </>
      )}
    </div>
  );
}
