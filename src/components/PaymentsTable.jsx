"use client";

import { useMemo } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
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
import { Skeleton } from "../../shadcn/components/ui/skeleton";
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  CreditCard,
  Banknote,
  Eye,
  FileText,
  Paperclip,
  Receipt,
  Split,
} from "lucide-react";
import { cn } from "../../shadcn/lib/utils";

// ─── Badges & small presentational helpers ────────────────────────────────
// Exported (not just local) because PaymentPage's detail drawer also needs
// MethodBadge / CategoryBadge for the same visual language.
export function MethodBadge({ method }) {
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

export function CategoryBadge({ category }) {
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

// A payment is "walk-in" when it's a CUSTOMER-type payment tied to exactly
// one sale (saleId set) but has no actual customer attached. Prefer the
// backend's own `isWalkIn` flag if present; fall back to deriving it here
// so this still works against older cached responses.
function isWalkInPayment(p) {
  if (typeof p.isWalkIn === "boolean") return p.isWalkIn;
  return !p.customerId && !p.vendorId && !!p.saleId;
}

// For a single-sale payment (walk-in or customer-linked), build a compact
// "Invoice X · Doc# Y" reference string from the linked sale, if present.
function saleReference(sale) {
  if (!sale) return null;
  const parts = [];
  if (sale.invoice?.invoiceNo) parts.push(`Invoice ${sale.invoice.invoiceNo}`);
  if (sale.documentNo) parts.push(`Doc# ${sale.documentNo}`);
  return parts.length ? parts.join(" · ") : null;
}

// Count of distinct sales this payment's ledger entries touch — used to
// flag a genuine multi-invoice split payment (2+ distinct saleIds across
// its entries) versus a single-sale or non-sale (plain vendor/customer)
// payment.
function distinctSaleCount(ledgerEntries) {
  if (!Array.isArray(ledgerEntries)) return 0;
  return new Set(ledgerEntries.filter((e) => e.saleId).map((e) => e.saleId)).size;
}

function InitialsAvatar({ name, isVendor, isWalkIn }) {
  if (isWalkIn) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-slate-400 to-slate-500">
        <Receipt className="w-4 h-4 text-white" />
      </div>
    );
  }

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

// party, [category|bank], amount, date, method, attachment, remarks, actions
const COL_COUNT = 8;

// ─── Payments Table ────────────────────────────────────────────────────────
export default function PaymentsTable({
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
  const isVendor = partyType === "VENDOR";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const walkIn = !isVendor && isWalkInPayment(p);
      const name = walkIn
        ? "walk-in customer"
        : (p.vendor?.vendorName ?? p.customer?.customerName ?? "");
      const invoiceNo = p.sale?.invoice?.invoiceNo ?? "";
      const documentNo = p.sale?.documentNo ?? "";

      return (
        name.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        String(p.amount).includes(q) ||
        (p.remarks ?? "").toLowerCase().includes(q) ||
        invoiceNo.toLowerCase().includes(q) ||
        documentNo.toLowerCase().includes(q)
      );
    });
  }, [payments, search, isVendor]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={
              isVendor
                ? "Search by vendor, amount, method…"
                : "Search by customer, invoice #, amount, method…"
            }
            className="pl-9 bg-white border-slate-200 focus-visible:ring-slate-400"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        {/* Navigates to a dedicated "New Payment" page for this party type,
           instead of opening an in-page dialog. */}
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
              filtered.map((p) => {
                const walkIn = !isVendor && isWalkInPayment(p);
                const saleCount = !isVendor ? distinctSaleCount(p.ledgerEntries) : 0;
                const isMultiInvoice = !isVendor && !walkIn && saleCount >= 2;
                const saleRef = !isVendor && !isMultiInvoice ? saleReference(p.sale) : null;
                const displayName = walkIn
                  ? "Walk-in Customer"
                  : (p.vendor?.vendorName ?? p.customer?.customerName ?? "—");

                return (
                  <TableRow
                    key={p.id}
                    className="hover:bg-slate-50/70 cursor-pointer border-slate-50 group transition-colors"
                    onClick={() => onView(p)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar
                          name={displayName}
                          isVendor={isVendor}
                          isWalkIn={walkIn}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "text-sm font-medium truncate",
                                walkIn ? "text-slate-500 italic" : "text-slate-800",
                              )}
                            >
                              {displayName}
                            </span>
                            {isMultiInvoice && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-600 flex-shrink-0">
                                <Split className="h-2.5 w-2.5" />
                                {saleCount} invoices
                              </span>
                            )}
                          </div>
                          {saleRef && (
                            <span
                              className="text-xs text-slate-400 truncate block max-w-[220px]"
                              title={saleRef}
                            >
                              {saleRef}
                            </span>
                          )}
                        </div>
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
                );
              })}

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