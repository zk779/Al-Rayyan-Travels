"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Separator } from "../../shadcn/components/ui/separator";
import { Checkbox } from "../../shadcn/components/ui/checkbox";
import { Badge } from "../../shadcn/components/ui/badge";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { Button } from "../../shadcn/components/ui/button";
import {
  CalendarIcon,
  User,
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
  normalizeSale,
} from "../components/PaymentComponents/DepositShared";

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — keep in sync with backend limit

async function uploadAttachment(file, setUploading) {
  if (!file) return null;

  // Fail fast on the client before ever hitting Cloudinary
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type}". Allowed: jpg, jpeg, png, webp, pdf`,
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is larger than 10MB");
  }

  setUploading(true);
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const resourceType = file.type === "application/pdf" ? "image" : "auto";

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      { method: "POST", body: form },
    );

    const json = await res.json();

    if (!res.ok || !json.secure_url) {
      throw new Error(json?.error?.message || "Upload failed");
    }

    return json.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err; // let the caller (component) show a toast/error state
  } finally {
    setUploading(false);
  }
}
// payment.customer must include a nested `account` relation.
// payment.ledgerEntries (with saleId + credit) drives the existing allocation.
export default function EditCustomerPayment({ payment, onClose, onSuccess }) {
  const entity = payment.customer;
  const name = entity?.customerName;
  const accentBtn = "bg-violet-600 hover:bg-violet-700";
  const accentBar = "from-violet-500 to-purple-500";

  const oldAllocationMap = useMemo(() => {
    const m = new Map();
    (payment.ledgerEntries || []).forEach((e) => {
      if (e.saleId) m.set(e.saleId, (m.get(e.saleId) || 0) + e.credit);
    });
    return m;
  }, [payment]);

  const liveBalance = entity?.account?.balance ?? 0;
  const currentBalance = liveBalance + payment.amount; // pre-payment balance

  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [selections, setSelections] = useState({}); // { saleId: { checked, amount } }
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

  // Remaining due for a sale, excluding this payment's own old contribution.
  const remainingFor = (sale) =>
    sale.sellPrice - sale.paidAmount + (oldAllocationMap.get(sale.id) || 0);

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
  const hasInvalid = selectedAllocations.some((a) => {
    const sale = salesById.get(a.saleId);
    return !sale || a.amount <= 0 || a.amount > remainingFor(sale) + 0.01;
  });
  const newBalance = currentBalance - totalAmount;
  const { label: balLabel, cls: balCls } = balMeta(
    currentBalance,
    "customer",
    null,
  );

  // ── Load open sales for this customer + any already-allocated (possibly PAID) sales ──
  useEffect(() => {
    (async () => {
      setSalesLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/sales/customerSales?customerId=${entity.id}&paymentStatus=DUE,PARTIAL`,
          { headers: authHeaders() },
        );
        const json = await res.json();
        let list = (json.data || []).map(normalizeSale);

        const missing = [...oldAllocationMap.keys()].filter(
          (id) => !list.some((s) => s.id === id),
        );
        if (missing.length) {
          const fetched = await Promise.all(
            missing.map((id) =>
              fetch(`${API_BASE}/api/sales/saleId/${id}`, {
                headers: authHeaders(),
              }).then((r) => r.json()),
            ),
          );
          fetched.forEach((j) => j.success && list.push(normalizeSale(j.data)));
        }
        setSales(list);

        const sel = {};
        list.forEach((s) => {
          const oldAmt = oldAllocationMap.get(s.id);
          sel[s.id] =
            oldAmt !== undefined
              ? { checked: true, amount: oldAmt.toFixed(2) }
              : {
                  checked: false,
                  amount: (s.sellPrice - s.paidAmount).toFixed(2),
                };
        });
        setSelections(sel);
      } finally {
        setSalesLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/banks?status=true`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => json.success && setBanks(json.data || []))
      .catch(() => {});
  }, []);

  const toggleSale = (sale) =>
    setSelections((prev) => {
      const cur = prev[sale.id] ?? { checked: false, amount: "0" };
      return {
        ...prev,
        [sale.id]: {
          checked: !cur.checked,
          amount: !cur.checked ? remainingFor(sale).toFixed(2) : cur.amount,
        },
      };
    });
  const updateAmount = (saleId, value) =>
    setSelections((prev) => ({
      ...prev,
      [saleId]: { ...prev[saleId], amount: value },
    }));
  const clampAmount = (sale) =>
    setSelections((prev) => {
      const cur = prev[sale.id];
      if (!cur) return prev;
      const max = remainingFor(sale);
      const amt = Math.min(Math.max(parseFloat(cur.amount) || 0, 0), max);
      return { ...prev, [sale.id]: { ...cur, amount: amt.toFixed(2) } };
    });

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
              amount: totalAmount,
              saleAllocations: selectedAllocations,
              method: paymentMethod,
              bankId: paymentMethod === "BANK_TRANSFER" ? bankId : null,
              bankSlipNo:
                paymentMethod === "BANK_TRANSFER" ? bankSlipNo || null : null, // NEW
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
          {fmt(totalAmount)} recorded for{" "}
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
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-100">
            <User className="w-4 h-4 text-violet-600" />
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

      {/* Invoice allocation */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
        <div className="p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">
            Invoices
          </h3>
          {salesLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {sales.map((sale) => {
                const sel = selections[sale.id] ?? {
                  checked: false,
                  amount: "0",
                };
                const max = remainingFor(sale);
                const amt = parseFloat(sel.amount) || 0;
                const invalid = sel.checked && (amt <= 0 || amt > max + 0.01);
                return (
                  <div
                    key={sale.id}
                    className={cn(
                      "rounded-xl border p-3.5",
                      sel.checked
                        ? "border-violet-200 bg-violet-50/50"
                        : "border-slate-200 bg-white",
                      invalid && "border-red-300 bg-red-50/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={sel.checked}
                        onCheckedChange={() => toggleSale(sale)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            Invoice {sale.invoiceNo}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] text-slate-500"
                          >
                            {sale.paymentStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Sell {fmt(sale.sellPrice)} · Available {fmt(max)}
                        </p>
                        {sel.checked && (
                          <div className="relative mt-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
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
                              className="pl-10 h-9 text-sm"
                            />
                          </div>
                        )}
                        {invalid && (
                          <p className="text-[11px] text-red-500 mt-1">
                            Must be &gt; 0 and ≤ {fmt(max)}.
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

      {/* Form card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
              <p className="text-[11px] text-slate-400 mb-1">Payment Total</p>
              <p className="font-bold text-slate-800">{fmt(totalAmount)}</p>
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
              totalAmount <= 0 ||
              hasInvalid ||
              uploading ||
              (paymentMethod === "BANK_TRANSFER" && !bankId)
            }
            price={totalAmount}
            mode="customer"
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
