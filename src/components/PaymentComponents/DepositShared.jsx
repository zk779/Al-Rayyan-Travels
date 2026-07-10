"use client";

import { cn } from "../../../shadcn/lib/utils";
import { CheckCircle2 } from "lucide-react";

// ── Backend config ─────────────────────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ── Attachment constraints ──────────────────────────────────────────────────
// Must mirror the backend's multer/Cloudinary config (middleware/cloudinary.js)
// exactly, or you'll get a valid-looking file rejected server-side after the
// user already filled out the whole form.
export const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Read the auth token fresh each time it's needed, rather than once at
// render time — avoids a stale/missing token if login happens after mount,
// and guards against environments where localStorage isn't available.
export const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

// For plain JSON requests (search, banks list, sales list).
export const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// For multipart/form-data requests (the payment submit, since it may carry
// a file). IMPORTANT: do NOT set "Content-Type" here — the browser needs to
// set it itself so it can include the multipart boundary. Setting it
// manually silently breaks the upload.
export const authFormHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
export const fmt = (n) =>
  `SAR ${Math.abs(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const validateFile = (file) => {
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
export const balMeta = (balance, mode, category) => {
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

// Normalize a vendor/customer record from the API into the flat shape the
// components expect (name, balance as a plain number, etc).
export const normalizeEntity = (raw) => ({
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

// Normalize a Sale record (as returned alongside its invoice) into the flat
// shape CustomerDepositTab works with. Adjust the raw.* paths here if your
// /api/sales response shape differs.
export const normalizeSale = (raw) => ({
  id: raw.id,
  invoiceNo: raw.invoice?.invoiceNo ?? raw.invoiceNo ?? "—",
  pnr: raw.pnr ?? null,
  paxName: raw.paxName ?? null,
  airlineName: raw.airline?.airlineName ?? null,
  departureDate: raw.departureDate ?? null,
  sellPrice: raw.sellPrice ?? 0,
  paidAmount: raw.paidAmount ?? 0,
  paymentStatus: raw.paymentStatus, // DUE | PARTIAL (only these are ever fetched)
});

// ── Step Bar ─────────────────────────────────────────────────────────────────
// Generic — pass however many step labels the flow needs.
export const StepsBar = ({ step, labels, accentBar }) => (
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
        {i < labels.length - 1 && (
          <div
            className={cn(
              "w-24 h-0.5 mb-5 mx-1 rounded",
              step > i + 1 ? "bg-green-400" : "bg-slate-200",
            )}
          />
        )}
      </div>
    ))}
  </div>
);