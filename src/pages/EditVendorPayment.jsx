"use client";

import { useState, useEffect } from "react";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Separator } from "../../shadcn/components/ui/separator";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { Button } from "../../shadcn/components/ui/button";
import {
  CalendarIcon,
  Building2,
  CheckCircle2,
  FileUp,
  X,
  Banknote,
  Landmark,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../shadcn/lib/utils";
import SlideButton from "../../shadcn/components/ui/slide-button";
import {
  API_BASE,
  authHeaders,
  fmt,
  balMeta,
} from "../components/PaymentComponents/DepositShared";

const CLOUDINARY_CLOUD_NAME = "REPLACE_WITH_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "REPLACE_WITH_UNSIGNED_PRESET";

async function uploadAttachment(file, setUploading) {
  if (!file) return null;
  setUploading(true);
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: form,
      },
    );
    const json = await res.json();
    if (!json.secure_url) throw new Error("Upload failed");
    return json.secure_url;
  } finally {
    setUploading(false);
  }
}

// payment.vendor must include a nested `account` relation (account.balance).
export default function EditVendorPayment({ payment, onClose, onSuccess }) {
  const vendor = payment.vendor;
  const name = vendor?.vendorName;
  const accentBtn = "bg-blue-600 hover:bg-blue-700";
  const accentBar = "from-blue-500 to-indigo-500";

  // Pre-payment balance: reverse this payment's effect off the live balance.
  const liveBalance = vendor?.account?.balance ?? 0;
  const currentBalance =
    vendor?.category === "CREDIT"
      ? liveBalance - payment.amount
      : liveBalance + payment.amount;

  const [amount, setAmount] = useState(String(payment.amount));
  const [date, setDate] = useState(new Date(payment.transactionDate));
  const [calOpen, setCalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(payment.method);
  const [bankId, setBankId] = useState(payment.bankId ?? "");
  const [bankSlipNo, setBankSlipNo] = useState(payment.bankSlipNo ?? "");
  const [banks, setBanks] = useState([]);
  const [remarks, setRemarks] = useState(payment.remarks ?? "");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [payError, setPayError] = useState("");

  const parsedAmount = parseFloat(amount) || 0;
  const newBalance =
    vendor?.category === "CREDIT"
      ? currentBalance + parsedAmount
      : currentBalance - parsedAmount;
  const { label: balLabel, cls: balCls } = balMeta(
    currentBalance,
    "vendor",
    vendor?.category,
  );

  useEffect(() => {
    fetch(`${API_BASE}/api/banks?status=true`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => json.success && setBanks(json.data || []))
      .catch(() => {});
  }, []);

  const save = () =>
    new Promise(async (resolve, reject) => {
      try {
        setPayError("");
        const attachmentUrl = file
          ? await uploadAttachment(file, setUploading)
          : (payment.attachmentUrl ?? null);
        const res = await fetch(
          `${API_BASE}/api/payments/vendor-customer/${payment.id}`,
          {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({
              amount: parsedAmount,
              method: paymentMethod,
              bankId: paymentMethod === "BANK_TRANSFER" ? bankId : null,
              bankSlipNo:
                paymentMethod === "BANK_TRANSFER" ? bankSlipNo || null : null,
              attachmentUrl,
              remarks: remarks || null,
              transactionDate: date.toISOString(),
            }),
          },
        );
        const json = await res.json();
        if (!json.success) {
          setPayError(json.error || "Update failed");
          reject(new Error(json.error));
          return;
        }
        setSuccess(true);
        onSuccess?.(json.data);
        resolve();
      } catch (err) {
        setPayError(err.message || "Update failed");
        reject(err);
      }
    });

  if (success)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 text-green-500" />
        </div>
        <h3 className="font-bold text-slate-800 text-xl mb-1">
          Payment Updated!
        </h3>
        <p className="text-slate-500 text-sm mb-1">
          {fmt(parsedAmount)} recorded for{" "}
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
        <Button className={cn("w-full", accentBtn)} onClick={onClose}>
          Done
        </Button>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
        {payment.pvNo && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-500">Payment Voucher No.</span>
            <span className="text-sm font-semibold text-slate-700 font-mono">
              {payment.pvNo}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{name}</p>
            <p className="text-xs text-slate-400">
              Balance before payment:{" "}
              <span
                className={cn(
                  "font-medium",
                  currentBalance > 0
                    ? "text-red-600"
                    : currentBalance < 0
                      ? "text-blue-600"
                      : "text-green-600",
                )}
              >
                {currentBalance < 0 ? "−" : ""}
                {fmt(currentBalance)}
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

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
              <p className="text-[11px] text-slate-400 mb-1">Total Payable</p>
              <p className="font-bold text-slate-800">
                {fmt(Math.abs(currentBalance))}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-3.5",
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
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Payment Method <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("CASH");
                  setBankId("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium",
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
                  "flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium",
                  paymentMethod === "BANK_TRANSFER"
                    ? cn("border-transparent text-white", accentBtn)
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                <Landmark className="w-4 h-4" /> Bank Transfer
              </button>
            </div>
          </div>

          {paymentMethod === "BANK_TRANSFER" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Bank <span className="text-red-400">*</span>
              </Label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700"
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

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Attachment
              {payment.attachmentUrl && !file && (
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  (existing file kept — upload to replace)
                </span>
              )}
            </Label>
            <label className="flex items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-3.5 hover:border-slate-300 hover:bg-slate-50">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  file
                    ? "bg-green-100"
                    : payment.attachmentUrl
                      ? "bg-blue-50"
                      : "bg-slate-100",
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
                ) : payment.attachmentUrl ? (
                  <p className="text-sm text-blue-600 font-medium truncate">
                    {payment.attachmentUrl.split("/").pop()}
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 font-medium">
                    Click to upload
                  </p>
                )}
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                  className="text-slate-300 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) =>
                  e.target.files[0] && setFile(e.target.files[0])
                }
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Remarks
            </Label>
            <Textarea
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
            handlePayment={save}
            disabled={
              !amount ||
              parsedAmount <= 0 ||
              uploading ||
              (paymentMethod === "BANK_TRANSFER" && !bankId)
            }
            price={parsedAmount}
            mode="vendor"
          />
        </div>
      </div>

      <button
        onClick={onClose}
        className="text-sm text-slate-400 hover:text-slate-600"
      >
        ← Cancel
      </button>
    </div>
  );
}
