"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Card, CardContent } from "../../shadcn/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../shadcn/components/ui/dropdown-menu";
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
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Building2,
  User,
  Banknote,
  CreditCard,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
  FileText,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { cn } from "../../shadcn/lib/utils";
import DepositTabComponent from "./NewPayments";

// TODO: point this at your existing edit-payment component. It's assumed to
// accept { payment, onClose, onSuccess } — adjust the import path and props
// below to match whatever you actually built. Paste that file's code and I'll
// wire this up exactly.
import EditPaymentDialog from "./EditPayment";

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

function MethodBadge({ method }) {
  return method === "BANK_TRANSFER" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
      <CreditCard className="h-3 w-3" /> Bank
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
      <Banknote className="h-3 w-3" /> Cash
    </span>
  );
}

function CategoryBadge({ category }) {
  if (!category) return null;
  return category === "DEBIT" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
      Debit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
      Credit
    </span>
  );
}

// Small identity avatar so rows read at a glance, like most modern
// finance/CRM tables (Stripe, Linear, etc).
function InitialsAvatar({ name, isVendor }) {
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 shadow-sm",
        isVendor
          ? "bg-gradient-to-br from-violet-500 to-violet-600"
          : "bg-gradient-to-br from-sky-500 to-sky-600",
      )}
    >
      {initials}
    </div>
  );
}

function TableSkeleton({ cols }) {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <TableRow key={i}>
          {[...Array(cols)].map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Attachment Preview ───────────────────────────────────────────────────────
// Handles both image attachments (inline preview) and PDFs (embedded viewer),
// with a fallback "open original" link either way.
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

  const partyName =
    payment?.vendor?.vendorName ?? payment?.customer?.customerName ?? "—";
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
                className={`p-2 rounded-lg ${payment.partyType === "VENDOR" ? "bg-violet-100" : "bg-sky-100"}`}
              >
                {payment.partyType === "VENDOR" ? (
                  <Building2 className="h-5 w-5 text-violet-600" />
                ) : (
                  <User className="h-5 w-5 text-sky-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {payment.partyType}
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {partyName}
                </p>
                {payment.vendor?.category && (
                  <CategoryBadge category={payment.vendor.category} />
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

// ─── Payments Table ───────────────────────────────────────────────────────────
const COL_COUNT = 8; // party, [category|bank], amount, date, method, attachment, remarks, actions

function PaymentsTable({
  partyType,
  payments,
  loading,
  search,
  onSearch,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onPreview,
}) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const name = p.vendor?.vendorName ?? p.customer?.customerName ?? "";
      return (
        name.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        String(p.amount).includes(q) ||
        (p.remarks ?? "").toLowerCase().includes(q)
      );
    });
  }, [payments, search]);

  const isVendor = partyType === "VENDOR";

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`Search by ${isVendor ? "vendor" : "customer"}, amount, method…`}
            className="pl-9 bg-white border-slate-200 focus-visible:ring-slate-400"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={onAdd}
          className={cn(
            "gap-2",
            isVendor
              ? "bg-sky-600 hover:bg-sky-700"
              : "bg-violet-600 hover:bg-violet-700",
          )}
        >
          <Plus className="h-4 w-4" />
          Add Payment
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
        <div
          className={cn(
            "h-1 bg-gradient-to-r",
            isVendor
              ? "from-sky-500 to-blue-500"
              : "from-violet-500 to-purple-500",
          )}
        />
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-100">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {isVendor ? "Vendor" : "Customer"}
              </TableHead>
              {isVendor && (
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Category
                </TableHead>
              )}
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                Amount
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Method
              </TableHead>
              {!isVendor && (
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Bank
                </TableHead>
              )}
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Attachment
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Remarks
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableSkeleton cols={COL_COUNT} />}

            {!loading &&
              filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="hover:bg-slate-50/70 cursor-pointer border-slate-50 group transition-colors"
                  onClick={() => onView(p)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar
                        name={p.vendor?.vendorName ?? p.customer?.customerName}
                        isVendor={isVendor}
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {p.vendor?.vendorName ??
                          p.customer?.customerName ??
                          "—"}
                      </span>
                    </div>
                  </TableCell>

                  {isVendor && (
                    <TableCell>
                      <CategoryBadge category={p.vendor?.category} />
                    </TableCell>
                  )}

                  <TableCell className="text-right">
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      SAR{" "}
                      {p.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-slate-500">
                      {new Date(p.transactionDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <MethodBadge method={p.method} />
                  </TableCell>

                  {!isVendor && (
                    <TableCell>
                      <span className="text-sm text-slate-500">
                        {p.bank?.bankName ?? "—"}
                      </span>
                    </TableCell>
                  )}

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {p.attachmentUrl ? (
                      <button
                        onClick={() => onPreview(p.attachmentUrl)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Paperclip className="h-3.5 w-3.5" /> View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className="text-sm text-slate-400 truncate max-w-[140px] block"
                      title={p.remarks || undefined}
                    >
                      {p.remarks || "—"}
                    </span>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(p)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(p)}>
                          <Edit2 className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(p)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <FileText className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No payments found.</p>
                    {search ? (
                      <p className="text-xs">
                        Try adjusting your search query.
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onAdd}
                        className="gap-2 mt-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add your first payment
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {filtered.length} of {payments.length} payments
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchVendor, setSearchVendor] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [addMode, setAddMode] = useState(null); // "vendor" | "customer" | null
  const [editTarget, setEditTarget] = useState(null); // full payment object | null
  const [drawerPaymentId, setDrawerPaymentId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

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
  // stuck on <body> when they close (a known upstream timing bug, worse when
  // multiple overlay primitives — Sheet + Dialog — share the page). Without
  // this, the whole page stops responding to clicks until a hard refresh.
  // Re-running this after every overlay-open-state change, shortly after the
  // close animation finishes, guarantees it always gets cleaned up.
  const anyOverlayOpen =
    drawerOpen ||
    addMode !== null ||
    editTarget !== null ||
    deleteTarget !== null;
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

  const handleDeleteConfirm = async () => {
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

  const handleAddSuccess = () => {
    setAddMode(null);
    load();
  };

  const handleEditSuccess = () => {
    setEditTarget(null);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-sm">
              <DollarSign className="h-5 w-5 text-white" />
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
            value={`SAR ${totalVendor.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            sub={`${vendorPayments.length} transaction${vendorPayments.length !== 1 ? "s" : ""}`}
            icon={TrendingDown}
            trend="down"
          />
          <StatCard
            label="Customer Payments"
            value={`SAR ${totalCustomer.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            sub={`${customerPayments.length} transaction${customerPayments.length !== 1 ? "s" : ""}`}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            label="Net Total"
            value={`SAR ${(totalVendor + totalCustomer).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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
              onAdd={() => setAddMode("vendor")}
              onView={handleView}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
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
              onAdd={() => setAddMode("customer")}
              onView={handleView}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onPreview={setPreviewUrl}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add dialog */}
      <Dialog
        open={addMode !== null}
        onOpenChange={(o) => !o && setAddMode(null)}
      >
        <DialogContent className="max-w-4xl! max-h-[97vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {addMode === "vendor"
                ? "New Vendor Payment"
                : "New Customer Payment"}
            </DialogTitle>
          </DialogHeader>
          {addMode && (
            <DepositTabComponent
              mode={addMode}
              onClose={() => setAddMode(null)}
              onSuccess={handleAddSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="max-w-4xl! max-h-[97vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
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

      {/* Delete confirm */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        partyName={
          deleteTarget?.vendor?.vendorName ??
          deleteTarget?.customer?.customerName ??
          "this payment"
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
