"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Card, CardContent } from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../shadcn/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../shadcn/components/ui/sheet";
import { Skeleton } from "../../shadcn/components/ui/skeleton";
import { cn } from "../../shadcn/lib/utils";
import {
  Building2,
  User,
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
  FileText,
  Paperclip,
  ExternalLink,
  Banknote,
  CreditCard,
  SaudiRiyal,
} from "lucide-react";
import PaymentsTable, {
  MethodBadge,
  CategoryBadge,
} from "../components/PaymentsTable";

// TODO: point this at your existing edit-payment component. It's assumed to
// accept { payment, onClose, onSuccess } — adjust the import path and props
// below to match whatever you actually built. Paste that file's code and I'll
// wire this up exactly.
import EditVendorPayment from "./EditVendorPayment";
import EditCustomerPayment from "./EditCustomerPayment";
import VendorDepositTab from "../components/PaymentComponents/VendorPayment";
import CustomerDepositTab from "../components/PaymentComponents/CustomerPayment";
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ─── Auth ──────────────────────────────────────────────────────────────────
const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// A CUSTOMER-type payment tied to exactly one sale (saleId set) — whether
// it has a real customer attached or not. EditCustomerPayment is built for
// the multi-invoice saleAllocations flow, which doesn't apply here — these
// get routed to EditSalePayment instead.
const isSingleSalePayment = (p) => p?.partyType === "CUSTOMER" && !!p?.saleId;
const isWalkInPayment = (p) =>
  typeof p?.isWalkIn === "boolean"
    ? p.isWalkIn
    : isSingleSalePayment(p) && !p?.customerId;

function saleReference(sale) {
  if (!sale) return null;
  const parts = [];
  if (sale.invoice?.invoiceNo) parts.push(`Invoice ${sale.invoice.invoiceNo}`);
  if (sale.documentNo) parts.push(`Doc# ${sale.documentNo}`);
  return parts.length ? parts.join(" · ") : null;
}

function partyDisplayName(p) {
  if (isWalkInPayment(p)) return "Walk-in Customer";
  return p?.vendor?.vendorName ?? p?.customer?.customerName ?? "—";
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchAllPayments() {
  const res = await fetch(`${API_BASE}/api/payments/vendor-customer`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to load payments");
  return json.data;
}

async function fetchPaymentById(id) {
  const res = await fetch(`${API_BASE}/api/payments/vendor-customer/${id}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to load payment");
  return json.data;
}

async function deletePayment(id) {
  const res = await fetch(`${API_BASE}/api/payments/vendor-customer/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to delete payment");
}

// ─── Small components ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, trend }) {
  const iconTone =
    trend === "up"
      ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
      : trend === "down"
        ? "bg-gradient-to-br from-rose-400 to-rose-600"
        : "bg-gradient-to-br from-slate-500 to-slate-700";
  return (
    <Card className="border border-slate-100 shadow-sm bg-white transition-shadow hover:shadow-md rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">
              {value}
            </p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl shadow-sm", iconTone)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Attachment Preview ───────────────────────────────────────────────────────
function AttachmentPreviewDialog({ url, onClose }) {
  const open = !!url;
  const isPdf = url?.toLowerCase().includes(".pdf");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl! max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Paperclip className="h-4 w-4 text-slate-400" />
            Attachment
          </DialogTitle>
        </DialogHeader>
        {url && (
          <>
            <div className="flex-1 min-h-0 rounded-xl bg-slate-50 border border-slate-100 overflow-auto flex items-center justify-center">
              {isPdf ? (
                <iframe
                  src={url}
                  title="Attachment preview"
                  className="w-full h-[70vh]"
                />
              ) : (
                <img
                  src={url}
                  alt="Payment attachment"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
            </div>
            <div className="flex justify-end pt-1">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Open Original
                </Button>
              </a>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function PaymentDetailDrawer({ paymentId, open, onClose, onPreview }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paymentId || !open) return;
    setLoading(true);
    setError(null);
    fetchPaymentById(paymentId)
      .then(setPayment)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [paymentId, open]);

  const partyName = payment ? partyDisplayName(payment) : "—";
  const walkIn = payment ? isWalkInPayment(payment) : false;
  const saleRef = payment ? saleReference(payment.sale) : null;
  const isPdf = payment?.attachmentUrl?.toLowerCase().includes(".pdf");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-lg font-semibold text-slate-900">
            Payment Details
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="space-y-4 pt-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-rose-500 gap-2">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {payment && !loading && (
          <div className="pt-6 space-y-6">
            {/* Party */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  payment.partyType === "VENDOR"
                    ? "bg-violet-100"
                    : walkIn
                      ? "bg-slate-200"
                      : "bg-sky-100",
                )}
              >
                {payment.partyType === "VENDOR" ? (
                  <Building2 className="h-5 w-5 text-violet-600" />
                ) : walkIn ? (
                  <Receipt className="h-5 w-5 text-slate-500" />
                ) : (
                  <User className="h-5 w-5 text-sky-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {payment.partyType}
                  {walkIn && " · WALK-IN"}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    walkIn ? "text-slate-500 italic" : "text-slate-800",
                  )}
                >
                  {partyName}
                </p>
                {payment.vendor?.category && (
                  <CategoryBadge category={payment.vendor.category} />
                )}
                {saleRef && (
                  <p className="text-xs text-slate-400 mt-0.5">{saleRef}</p>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-center py-4 border rounded-xl border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                Amount
              </p>
              <p className="text-3xl font-bold text-slate-900 tabular-nums">
                SAR{" "}
                {payment.amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Method",
                  value: <MethodBadge method={payment.method} />,
                },
                {
                  label: "Date",
                  value: new Date(payment.transactionDate).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  ),
                },
                ...(payment.bank
                  ? [
                      { label: "Bank", value: payment.bank.bankName },
                      {
                        label: "Account No.",
                        value: payment.bank.accountNumber,
                      },
                    ]
                  : []),
                ...(payment.remarks
                  ? [{ label: "Remarks", value: payment.remarks, full: true }]
                  : []),
              ].map(({ label, value, full }, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg bg-slate-50 ${full ? "col-span-2" : ""}`}
                >
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    {label}
                  </p>
                  <div className="text-sm font-medium text-slate-700">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Attachment */}
            {payment.attachmentUrl && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Attachment
                </p>
                {isPdf ? (
                  <button
                    onClick={() => onPreview(payment.attachmentUrl)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-rose-100">
                      <FileText className="h-4 w-4 text-rose-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      View PDF attachment
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => onPreview(payment.attachmentUrl)}
                    className="block w-full rounded-xl overflow-hidden border border-slate-100 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={payment.attachmentUrl}
                      alt="Payment attachment"
                      className="w-full h-40 object-cover"
                    />
                  </button>
                )}
              </div>
            )}

            {/* Ledger entries */}
            {payment.ledgerEntries && payment.ledgerEntries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Ledger Entries
                </p>
                <div className="space-y-2">
                  {payment.ledgerEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 text-sm"
                    >
                      <span className="text-xs text-slate-400">
                        {entry.entryType}
                      </span>
                      <div className="flex gap-4">
                        {entry.debit > 0 && (
                          <span className="text-rose-600 font-medium">
                            DR {entry.debit.toLocaleString()}
                          </span>
                        )}
                        {entry.credit > 0 && (
                          <span className="text-emerald-600 font-medium">
                            CR {entry.credit.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({
  open,
  partyName,
  onConfirm,
  onCancel,
  loading,
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Delete Payment</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-slate-600">
            This will permanently remove the payment for{" "}
            <span className="font-semibold text-slate-800">{partyName}</span>{" "}
            and reverse all related ledger entries. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Payment Dialog ────────────────────────────────────────────────────────
function AddPaymentDialog({ partyType, open, onClose, onSuccess }) {
  const isVendor = partyType === "VENDOR";
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl! max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isVendor ? "New Vendor Payment" : "New Customer Payment"}
          </DialogTitle>
        </DialogHeader>
        {open &&
          (isVendor ? (
            <VendorDepositTab onClose={onClose} onSuccess={onSuccess} />
          ) : (
            <CustomerDepositTab onClose={onClose} onSuccess={onSuccess} />
          ))}
      </DialogContent>
    </Dialog>
  );
}

function EditSalePayment({ payment, onClose, onSuccess }) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [method, setMethod] = useState(payment.method);
  const [bankId, setBankId] = useState(
    payment.bankId ?? payment.bank?.id ?? "",
  );
  const [banks, setBanks] = useState([]);
  const [date, setDate] = useState(
    payment.transactionDate ? payment.transactionDate.slice(0, 10) : "",
  );
  const [remarks, setRemarks] = useState(payment.remarks ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/banks?status=true`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => json.success && setBanks(json.data || []))
      .catch(() => {});
  }, []);

  const walkIn = isWalkInPayment(payment);

  const submit = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0)
      return setError("Amount must be greater than 0");
    if (method === "BANK_TRANSFER" && !bankId)
      return setError("Bank is required");

    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/payments/vendor-customer/${payment.id}`,
        {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            amount: amt,
            method,
            bankId: method === "BANK_TRANSFER" ? bankId : undefined,
            remarks,
            transactionDate: date ? new Date(date).toISOString() : undefined,
          }),
        },
      );
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || "Failed to update payment");
      onSuccess?.();
    } catch (e) {
      setError(e.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
        <p className="text-xs text-slate-400 mb-0.5">
          {walkIn
            ? "Walk-in Customer"
            : (payment.customer?.customerName ?? "Customer")}
        </p>
        <p className="text-sm font-medium text-slate-700">
          {saleReference(payment.sale) || "—"}
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label>Amount</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Payment Method</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("CASH")}
            className={cn(
              "flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-colors",
              method === "CASH"
                ? "border-transparent text-white bg-blue-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <Banknote className="w-4 h-4" /> Cash
          </button>
          <button
            type="button"
            onClick={() => setMethod("BANK_TRANSFER")}
            className={cn(
              "flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium transition-colors",
              method === "BANK_TRANSFER"
                ? "border-transparent text-white bg-blue-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <CreditCard className="w-4 h-4" /> Bank Transfer
          </button>
        </div>
      </div>

      {method === "BANK_TRANSFER" && (
        <div className="space-y-1.5">
          <Label>Bank</Label>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
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

      <div className="space-y-1.5">
        <Label>Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Remarks</Label>
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ─── Edit Payment Dialog ───────────────────────────────────────────────────────
// VENDOR -> EditVendorPayment. Single-sale CUSTOMER (walk-in or 1 invoice)
// -> EditSalePayment. Genuine multi-invoice CUSTOMER -> EditCustomerPayment.
function EditPaymentDialog({ payment, onClose, onSuccess }) {
  if (!payment) return null;
  if (payment.partyType === "VENDOR")
    return (
      <EditVendorPayment
        payment={payment}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  if (isSingleSalePayment(payment))
    return (
      <EditSalePayment
        payment={payment}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  return (
    <EditCustomerPayment
      payment={payment}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("PAYMENT_CREATE");
  const canEdit = hasPermission("PAYMENT_EDIT");
  const canDelete = hasPermission("PAYMENT_DELETE");

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchVendor, setSearchVendor] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [editTarget, setEditTarget] = useState(null); // full payment object | null
  const [drawerPaymentId, setDrawerPaymentId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Add-payment dialog: which partyType tab triggered it ("VENDOR" | "CUSTOMER" | null)
  const [addPartyType, setAddPartyType] = useState(null);
  const addDialogOpen = addPartyType !== null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllPayments();
      setPayments(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Fix: Radix Dialog/Sheet overlays can leave `pointer-events: none`
  // stuck on <body> when they close. Re-running this after every overlay-
  // open-state change guarantees it always gets cleaned up.
  const anyOverlayOpen =
    drawerOpen || editTarget !== null || deleteTarget !== null || addDialogOpen;
  useEffect(() => {
    if (anyOverlayOpen) return;
    const timer = setTimeout(() => {
      document.body.style.pointerEvents = "";
    }, 300);
    return () => clearTimeout(timer);
  }, [anyOverlayOpen]);

  const vendorPayments = useMemo(
    () => payments.filter((p) => p.partyType === "VENDOR"),
    [payments],
  );
  const customerPayments = useMemo(
    () => payments.filter((p) => p.partyType === "CUSTOMER"),
    [payments],
  );
  const totalVendor = useMemo(
    () => vendorPayments.reduce((s, p) => s + p.amount, 0),
    [vendorPayments],
  );
  const totalCustomer = useMemo(
    () => customerPayments.reduce((s, p) => s + p.amount, 0),
    [customerPayments],
  );

  const handleView = (p) => {
    setDrawerPaymentId(p.id);
    setDrawerOpen(true);
  };

  // ✅ RBAC guard — used when passing setEditTarget down (see below)
  const handleEditRequest = (p) => {
    if (!canEdit) return;
    setEditTarget(p);
  };

  // ✅ RBAC guard — used when passing setDeleteTarget down (see below)
  const handleDeleteRequest = (p) => {
    if (!canDelete) return;
    setDeleteTarget(p);
  };

  const handleAddRequest = (partyType) => {
    if (!canCreate) return;
    setAddPartyType(partyType);
  };

  const handleDeleteConfirm = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deletePayment(deleteTarget.id);
      setPayments((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setEditTarget(null);
    load();
  };

  const handleAddSuccess = () => {
    setAddPartyType(null);
    load();
  };

  const editDialogTitle =
    editTarget?.partyType === "VENDOR"
      ? "Edit Vendor Payment"
      : isSingleSalePayment(editTarget)
        ? "Edit Sale Payment"
        : "Edit Customer Payment";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-sm">
              <SaudiRiyal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Payments
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage vendor and customer transactions
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-2 text-slate-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={load}
              className="ml-auto text-rose-700 hover:text-rose-800 hover:bg-rose-100"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <StatCard
            label="Vendor Payments"
            value={
              <span className="inline-flex items-center gap-1">
                <SaudiRiyal size={20} />
                {totalVendor.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            }
            sub={`${vendorPayments.length} transaction${vendorPayments.length !== 1 ? "s" : ""}`}
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            label="Customer Payments"
            value={
              <span className="inline-flex items-center gap-1">
                <SaudiRiyal size={20} />
                {totalCustomer.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            }
            sub={`${customerPayments.length} transaction${customerPayments.length !== 1 ? "s" : ""}`}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            label="Net Total"
            value={
              <span className="inline-flex items-center gap-1">
                <SaudiRiyal size={20} />
                {(totalVendor + totalCustomer).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            }
            sub="All transactions combined"
            icon={DollarSign}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vendor" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto rounded-xl">
            <TabsTrigger
              value="vendor"
              className="rounded-lg gap-2 px-4 py-2 text-muted-foreground bg-transparent transition-all duration-200 data-[state=active]:bg-[linear-gradient(to_top_left,#6b7280,#1e293b)] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Building2 className="h-4 w-4" />
              Vendor Payments
              {!loading && (
                <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {vendorPayments.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="customer"
              className="rounded-lg gap-2 px-4 py-2 text-muted-foreground bg-transparent transition-all duration-200 data-[state=active]:bg-[linear-gradient(to_top_left,#6b7280,#1e293b)] data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4" />
              Customer Payments
              {!loading && (
                <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {customerPayments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor">
            <PaymentsTable
              partyType="VENDOR"
              payments={vendorPayments}
              loading={loading}
              search={searchVendor}
              onSearch={setSearchVendor}
              // ✅ RBAC — only pass the handler if permitted, so PaymentsTable
              // can hide the corresponding button when the prop is undefined
              onAdd={canCreate ? () => handleAddRequest("VENDOR") : undefined}
              onView={handleView}
              onEdit={canEdit ? handleEditRequest : undefined}
              onDelete={canDelete ? handleDeleteRequest : undefined}
              onPreview={setPreviewUrl}
            />
          </TabsContent>

          <TabsContent value="customer">
            <PaymentsTable
              partyType="CUSTOMER"
              payments={customerPayments}
              loading={loading}
              search={searchCustomer}
              onSearch={setSearchCustomer}
              onAdd={canCreate ? () => handleAddRequest("CUSTOMER") : undefined}
              onView={handleView}
              onEdit={canEdit ? handleEditRequest : undefined}
              onDelete={canDelete ? handleDeleteRequest : undefined}
              onPreview={setPreviewUrl}
            />
          </TabsContent>
        </Tabs>
      </div>
      <AddPaymentDialog
        partyType={addPartyType}
        open={addDialogOpen}
        onClose={() => setAddPartyType(null)}
        onSuccess={handleAddSuccess}
      />
      {/* ✅ RBAC — only mount edit dialog machinery if user can edit */}
      {canEdit && (
        <Dialog
          open={editTarget !== null}
          onOpenChange={(o) => !o && setEditTarget(null)}
        >
          <DialogContent className="max-w-4xl! max-h-[97vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editDialogTitle}</DialogTitle>
            </DialogHeader>
            {editTarget && (
              <EditPaymentDialog
                payment={editTarget}
                onClose={() => setEditTarget(null)}
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Detail drawer */}
      <PaymentDetailDrawer
        paymentId={drawerPaymentId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPreview={setPreviewUrl}
      />

      {/* Attachment preview */}
      <AttachmentPreviewDialog
        url={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />

      {/* ✅ RBAC — only mount delete dialog if user can delete */}
      {canDelete && (
        <DeleteConfirmDialog
          open={deleteTarget !== null}
          partyName={
            deleteTarget ? partyDisplayName(deleteTarget) : "this payment"
          }
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
