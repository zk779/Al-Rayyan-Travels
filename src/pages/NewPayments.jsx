"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Badge } from "../../shadcn/components/ui/badge";
import { Separator } from "../../shadcn/components/ui/separator";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { Button } from "../../shadcn/components/ui/button";
import {
  Search,
  CalendarIcon,
  Building2,
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
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../shadcn/lib/utils";
import SlideButton from "../../shadcn/components/ui/slide-button";

// ── Backend config ─────────────────────────────────────────────────────────
// Adjust to your actual API base URL via .env (VITE_API_BASE_URL=http://localhost:5000)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ── Attachment constraints ──────────────────────────────────────────────────
// Must mirror the backend's multer/Cloudinary config (middleware/cloudinary.js)
// exactly, or you'll get a valid-looking file rejected server-side after the
// user already filled out the whole form.
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Read the auth token fresh each time it's needed, rather than once at
// render time — avoids a stale/missing token if login happens after mount,
// and guards against environments where localStorage isn't available.
const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

// For plain JSON requests (search, banks list).
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// For multipart/form-data requests (the payment submit, since it may carry
// a file). IMPORTANT: do NOT set "Content-Type" here — the browser needs to
// set it itself so it can include the multipart boundary. Setting it
// manually silently breaks the upload.
const authFormHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `SAR ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const validateFile = (file) => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type ".${ext || "?"}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max is 10MB.`;
  }
  return null;
};

// Vendor DEBIT  -> positive balance = you owe them (Payable)
// Vendor CREDIT -> positive balance = prepaid credit you're holding (good for you)
// Customer      -> positive balance = they owe you (Receivable)
const balMeta = (balance, mode, category) => {
  if (mode === "vendor" && category === "CREDIT") {
    if (balance > 0)
      return {
        label: "Prepaid Credit",
        cls: "text-emerald-600 bg-emerald-50 border-emerald-200",
      };
    return {
      label: "Needs Top-Up",
      cls: "text-amber-600 bg-amber-50 border-amber-200",
    };
  }
  if (balance > 0)
    return mode === "vendor"
      ? { label: "Payable", cls: "text-red-600 bg-red-50 border-red-200" }
      : {
          label: "Receivable",
          cls: "text-amber-600 bg-amber-50 border-amber-200",
        };
  if (balance < 0)
    return {
      label: "Credit / Advance",
      cls: "text-blue-600 bg-blue-50 border-blue-200",
    };
  return {
    label: "Settled",
    cls: "text-green-600 bg-green-50 border-green-200",
  };
};

// Normalize a vendor/customer record from the API into the flat shape this
// component already expects (name, balance as a plain number, etc).
const normalizeEntity = (raw) => ({
  id: raw.id,
  vendorName: raw.vendorName,
  customerName: raw.customerName,
  vendorType: raw.vendorType,
  customerType: raw.customerType,
  category: raw.category, // DEBIT | CREDIT, vendors only
  phone: raw.phone,
  email: raw.email,
  address: raw.address,
  openingBalance: raw.openingBalance ?? 0,
  balance: raw.account?.balance ?? 0,
});

// ── Step Bar (2 steps now: Find → Payment) ───────────────────────────────────
const Steps = ({ step, isVendor }) => {
  const labels = [isVendor ? "Find Vendor" : "Find Customer", "Payment"];
  return (
    <div className="flex items-center justify-center mb-8">
      {labels.map((l, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step > i + 1
                  ? "bg-green-500 text-white"
                  : step === i + 1
                    ? "bg-slate-800 text-white ring-4 ring-slate-100"
                    : "bg-slate-100 text-slate-400",
              )}
            >
              {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium whitespace-nowrap",
                step >= i + 1 ? "text-slate-700" : "text-slate-400",
              )}
            >
              {l}
            </span>
          </div>
          {i < 1 && (
            <div
              className={cn(
                "w-50 h-0.5 mb-5 mx-1 rounded",
                step > i + 1 ? "bg-green-400" : "bg-slate-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
// `mode`: "vendor" | "customer" — passed in by the parent (e.g. which tab's
//   "Add Payment" button was clicked). Required.
// `onClose`: called when the user backs out of the flow (e.g. closes the dialog).
// `onSuccess`: called with the completed payment payload once recorded, so the
//   parent (Payments page) can append it to the right table and close the dialog.
export default function DepositTabComponent({ mode, onClose, onSuccess }) {
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
  const [banks, setBanks] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [success, setSuccess] = useState(false);
  const [payError, setPayError] = useState("");
  const debounceRef = useRef(null);

  const isVendor = mode === "vendor";
  const newBalance =
    isVendor && entity?.category === "CREDIT"
      ? (entity?.balance ?? 0) + (parseFloat(amount) || 0) // topping up increases balance
      : (entity?.balance ?? 0) - (parseFloat(amount) || 0); // paying down decreases balance
  const { label: balLabel, cls: balCls } = entity
    ? balMeta(entity.balance, mode, entity.category)
    : { label: "", cls: "" };
  const name = entity
    ? isVendor
      ? entity.vendorName
      : entity.customerName
    : "";

  // ── Search: debounced call to GET /api/vendors or /api/customers ───────
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
        const endpoint = isVendor ? "vendors" : "customers";
        const searchQuery = encodeURIComponent(query.trim());

        const res = await fetch(
          `${API_BASE}/api/${endpoint}?search=${searchQuery}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isVendor]);

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
  // The file (if any) travels in the same multipart request as the rest of
  // the form fields. The backend's upload.single("attachment") middleware
  // uploads it to Cloudinary and writes the resulting secure_url straight
  // into the payment record — there's no separate client-side Cloudinary
  // call and no attachmentUrl for the client to fabricate.
  //
  // Returns a Promise so SlideButton can show its own loading/success/error
  // state and let the user retry on failure.
  const pay = () => {
    return new Promise(async (resolve, reject) => {
      try {
        setPayError("");
        setUploading(true);

        const form = new FormData();
        form.append("partyType", isVendor ? "VENDOR" : "CUSTOMER");
        if (isVendor) form.append("vendorId", entity.id);
        else form.append("customerId", entity.id);
        form.append("method", paymentMethod);
        if (paymentMethod === "BANK_TRANSFER") form.append("bankId", bankId);
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
          mode,
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
    setPayError("");
    setStep(1);
  };

  // shared accent classes
  const accentBtn = isVendor
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-violet-600 hover:bg-violet-700";
  const accentBar = isVendor
    ? "from-blue-500 to-indigo-500"
    : "from-violet-500 to-purple-500";

  // ── STEP 1: Find Vendor/Customer ────────────────────────────────────────
  if (step === 1)
    return (
      <div className="space-y-4">
        <Steps step={1} isVendor={isVendor} />

        {/* Search box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Search className="w-4 h-4" /> Search{" "}
              {isVendor ? "Vendor" : "Customer"}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isVendor
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-violet-50 text-violet-700 border-violet-200",
              )}
            >
              {isVendor ? "Vendor Payment" : "Customer Payment"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={
                isVendor ? "Type vendor name..." : "Type customer name..."
              }
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
                    {isVendor ? r.vendorName : r.customerName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isVendor ? r.vendorType : r.customerType}
                    {isVendor && r.category ? ` · ${r.category}` : ""}
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
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                      isVendor ? "bg-blue-100" : "bg-violet-100",
                    )}
                  >
                    {isVendor ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-violet-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-500">
                      {isVendor
                        ? entity.vendorType
                        : entity.customerType === "CORPORATE"
                          ? "Corporate Client"
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
                    isVendor && entity.category === "CREDIT"
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
                      isVendor && entity.category === "CREDIT"
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
                    Current Balance {isVendor && `· ${entity.category} Vendor`}
                  </p>
                  <p
                    className={cn(
                      "font-bold text-2xl",
                      isVendor && entity.category === "CREDIT"
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
                  {isVendor && entity.category === "CREDIT" && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pay upfront to top up credit before booking sales.
                    </p>
                  )}
                  {isVendor &&
                    entity.category === "DEBIT" &&
                    entity.balance > 0 && (
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
                {isVendor ? "New Vendor Payment" : "Record Customer Payment"}
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
      <Steps step={2} isVendor={isVendor} />

      {success ? (
        /* Success */
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
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  isVendor ? "bg-blue-100" : "bg-violet-100",
                )}
              >
                {isVendor ? (
                  <Building2 className="w-4 h-4 text-blue-600" />
                ) : (
                  <User className="w-4 h-4 text-violet-600" />
                )}
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
                    {isVendor ? "Total Payable" : "Total Receivable"}
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
                  {isVendor && entity.category === "CREDIT"
                    ? `Topping up by ${fmt(parseFloat(amount))} — no cap on credit vendors.`
                    : newBalance === 0
                      ? "This payment fully settles the balance. ✓"
                      : newBalance < 0
                        ? `Overpayment of ${fmt(Math.abs(newBalance))} is not allowed for this party.`
                        : `${fmt(newBalance)} will remain ${isVendor ? "payable" : "receivable"} after this payment.`}
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
                mode={mode}
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
