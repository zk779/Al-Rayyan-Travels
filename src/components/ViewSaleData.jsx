import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  User,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Phone,
  Hash,
  Mail,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
  Building2,
  Banknote,
  SplitSquareHorizontal,
} from "lucide-react";
import { Badge } from "../../shadcn/components/ui/badge";
import { TableCell, TableRow } from "../../shadcn/components/ui/table";
import { cn } from "../../shadcn/lib/utils";

/* ======================= SHARED HELPERS ======================= */

const money = (val) => {
  const n = Number(val || 0);
  return `$${Math.abs(n).toFixed(2)}`;
};

const paymentTypeColor = {
  CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CREDIT: "bg-sky-50 text-sky-700 border-sky-200",
  BANK_TRANSFER: "bg-violet-50 text-violet-700 border-violet-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
};

const statusColor = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  DUE: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  REFUNDED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

const LEG_META = {
  CASH: { icon: Banknote, chip: "bg-emerald-100 text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50/60" },
  BANK_TRANSFER: { icon: Building2, chip: "bg-blue-100 text-blue-600", border: "border-blue-200", bg: "bg-blue-50/60" },
  CREDIT: { icon: CreditCard, chip: "bg-violet-100 text-violet-600", border: "border-violet-200", bg: "bg-violet-50/60" },
};

// tint tokens per section — drives header icon chip, border, and background together
const TINT = {
  sky: { border: "border-sky-200", bg: "bg-sky-50/40", chip: "bg-sky-100 text-sky-600" },
  violet: { border: "border-violet-200", bg: "bg-violet-50/40", chip: "bg-violet-100 text-violet-600" },
  slate: { border: "border-slate-200", bg: "bg-slate-50/60", chip: "bg-slate-200 text-slate-600" },
  emerald: { border: "border-emerald-200", bg: "bg-emerald-50/40", chip: "bg-emerald-100 text-emerald-600" },
  rose: { border: "border-rose-200", bg: "bg-rose-50/40", chip: "bg-rose-100 text-rose-600" },
  amber: { border: "border-amber-200", bg: "bg-amber-50/40", chip: "bg-amber-100 text-amber-600" },
};

const pill = (label, map) => (
  <Badge
    variant="outline"
    className={cn(
      "text-[10px] px-1.5 py-0 border",
      map[label?.toUpperCase()] || "bg-slate-100 text-slate-600 border-slate-200",
    )}
  >
    {label || "N/A"}
  </Badge>
);

// Small icon + label + value block
function Field({ label, value, icon: Icon, mono }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p
          className={cn("text-xs font-semibold text-gray-800 truncate", mono && "font-mono")}
          title={typeof value === "string" ? value : undefined}
        >
          {value ?? "N/A"}
        </p>
      </div>
    </div>
  );
}

// Bigger stat block for money figures (financial summary / invoice totals)
function StatBlock({ label, value, tone = "slate", icon: Icon }) {
  const toneClass =
    tone === "emerald" ? "text-emerald-700" : tone === "rose" ? "text-rose-700" : "text-slate-800";
  return (
    <div className="bg-white rounded-md p-2.5 border border-black/5 min-w-0">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1 mb-0.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className={cn("text-sm font-bold truncate", toneClass)}>{value}</p>
    </div>
  );
}

/* ======================= SECTION HEADER ======================= */

function SectionHeader({ label, icon: Icon, tint, extra }) {
  const t = TINT[tint] ?? TINT.slate;
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <span className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0", t.chip)}>
          <Icon className="w-3 h-3" />
        </span>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      </div>
      {extra}
    </div>
  );
}

/* ======================= SECTION CONTENT ======================= */

// Builds section descriptors. `full: true` sections span both grid columns
// (used for anything with several fields or money figures that need room).
function buildSections(invoice, sale) {
  if (!sale) return [];
  const sections = [];
  const isRefundedRow = sale.status?.toUpperCase() === "REFUNDED";
  const hasLegs = Array.isArray(sale.paymentLegs) && sale.paymentLegs.length > 0;
  const dueAmount = Number(sale.dueAmount ?? Math.max((sale.sellPrice || 0) - (sale.paidAmount || 0), 0));

  // sections.push({
  //   key: "invoice",
  //   label: "Invoice",
  //   icon: FileText,
  //   tint: "sky",
  //   content: (
  //     <div className="grid grid-cols-2 gap-2.5">
  //       <Field label="Invoice No." value={invoice?.invoiceNo} icon={Hash} mono />
  //       <Field
  //         label="Sale Date"
  //         icon={Calendar}
  //         value={invoice?.saleDate ? format(new Date(invoice.saleDate), "MMM dd, yyyy") : null}
  //       />
  //       <Field label="Total Items" value={invoice?.salesCount ?? invoice?.sales?.length ?? "-"} />
  //     </div>
  //   ),
  // });

  // sections.push({
  //   key: "createdBy",
  //   label: "Created By",
  //   icon: User,
  //   tint: "slate",
  //   content: (
  //     <div className="grid grid-cols-2 gap-2.5">
  //       <Field label="Agent" value={invoice?.createdByName ?? sale.agent} icon={User} />
  //       <Field label="Email" value={invoice?.createdByEmail} icon={Mail} />
  //       <Field
  //         label="Created At"
  //         icon={Clock}
  //         value={invoice?.createdAt ? format(new Date(invoice.createdAt), "MMM dd, yyyy HH:mm") : null}
  //       />
  //     </div>
  //   ),
  // });

  // sections.push({
  //   key: "transaction",
  //   label: "Transaction",
  //   icon: CreditCard,
  //   tint: "violet",
  //   full: true,
  //   content: (
  //     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
  //       <Field label="Document No." value={sale.documentNo} icon={Hash} mono />
  //       <Field label="Airline" value={sale.airlineCode} />
  //       <Field label="Vendor" value={sale.vendorName} />
  //       <div className="min-w-0">
  //         <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Payment Type</p>
  //         {pill(sale.paymentType, paymentTypeColor)}
  //       </div>
  //       <div className="min-w-0">
  //         <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Payment Status</p>
  //         {pill(sale.paymentStatus, statusColor)}
  //       </div>
  //       <div className="min-w-0">
  //         <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Sale Status</p>
  //         {pill(sale.status, statusColor)}
  //       </div>
  //     </div>
  //   ),
  // });

  if (sale.customerId) {
    sections.push({
      key: "customer",
      label: "Customer",
      icon: User,
      tint: "violet",
      content: (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Name" value={sale.customerName} icon={User} />
          <Field label="Phone" value={sale.customerPhone} icon={Phone} mono />
        </div>
      ),
    });
  }

  // ── Payment / Money summary — now includes Paid + Due, not just Net/Sell/Profit
  sections.push({
    key: "financial",
    label: "Payment Summary",
    icon: Wallet,
    tint: "emerald",
    full: true,
    content: (
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        <StatBlock label="Net" value={money(sale.netPrice)} />
        <StatBlock label="Sell" value={money(sale.sellPrice)} />
        <StatBlock label="Paid" value={money(sale.paidAmount)} tone="emerald" />
        <StatBlock
          label="Due"
          value={money(dueAmount)}
          tone={dueAmount > 0 ? "rose" : "emerald"}
          icon={dueAmount > 0 ? AlertDueIcon : undefined}
        />
        <StatBlock
          label="Profit"
          value={`${sale.profit < 0 ? "-" : ""}${money(sale.profit)}`}
          tone={sale.profit < 0 ? "rose" : "emerald"}
          icon={sale.profit < 0 ? TrendingDown : TrendingUp}
        />
      </div>
    ),
  });

  // ── Payment Legs — breakdown for PARTIAL sales
  if (hasLegs) {
    sections.push({
      key: "paymentLegs",
      label: "Payment Split",
      icon: SplitSquareHorizontal,
      tint: "amber",
      full: true,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sale.paymentLegs.map((leg) => {
            const meta = LEG_META[leg.method?.toUpperCase()] ?? LEG_META.CASH;
            const LegIcon = meta.icon;
            return (
              <div
                key={leg.id}
                className={cn("rounded-md border p-2 flex items-start gap-2", meta.border, meta.bg)}
              >
                <span className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", meta.chip)}>
                  <LegIcon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-700">
                      {leg.method?.replace("_", " ")}
                    </p>
                    <p className="text-xs font-bold text-gray-800">{money(leg.amount)}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">
                    {leg.method === "BANK_TRANSFER" && leg.bankName}
                    {leg.method === "CREDIT" && leg.customerName}
                    {leg.method === "CASH" && "Cash in hand"}
                    {leg.paymentDate && ` • ${format(new Date(leg.paymentDate), "MMM dd, yyyy")}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ),
    });
  }

  // if (invoice?.totalNet != null || invoice?.totalSell != null || invoice?.totalProfit != null) {
  //   sections.push({
  //     key: "invoiceTotals",
  //     label: "Invoice Totals",
  //     icon: TrendingUp,
  //     tint: "slate",
  //     content: (
  //       <div className="grid grid-cols-3 gap-2">
  //         <StatBlock label="Total Net" value={money(invoice.totalNet)} />
  //         <StatBlock label="Total Sell" value={money(invoice.totalSell)} />
  //         <StatBlock
  //           label="Total Profit"
  //           value={`${invoice.totalProfit < 0 ? "-" : ""}${money(invoice.totalProfit)}`}
  //           tone={invoice.totalProfit < 0 ? "rose" : "emerald"}
  //         />
  //       </div>
  //     ),
  //   });
  // }

  // ── Refund — only rendered on the negative mirror sale (status === REFUNDED)
  if (isRefundedRow && sale.refund) {
    const r = sale.refund;
    sections.push({
      key: "refund",
      label: "Refund Details",
      icon: XCircle,
      tint: "rose",
      full: true,
      content: (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
              <XCircle className="w-3.5 h-3.5" />
              This is a refund entry
            </div>
            {pill(r.status, statusColor)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBlock label="Vendor Refund" value={money(r.vendorRefundAmount)} tone="rose" />
            <StatBlock label="Refund Fee" value={money(r.refundFee)} />
            <StatBlock label="Cancellation Charges" value={money(r.cancellationCharges)} />
            <StatBlock label="Net to Customer" value={money(r.netRefundToCustomer)} tone="rose" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Field
              label="Refund Date"
              icon={Calendar}
              value={r.refundDate ? format(new Date(r.refundDate), "MMM dd, yyyy") : null}
            />
            <Field label="Reason" value={r.refundReason} icon={FileText} />
          </div>
          {r.remarks && (
            <p className="text-xs text-gray-600 italic pt-1 border-t border-rose-100">{r.remarks}</p>
          )}
        </div>
      ),
    });
  }

  if (sale.remarks) {
    sections.push({
      key: "remarks",
      label: "Remarks",
      icon: FileText,
      tint: "amber",
      full: true,
      content: <p className="text-xs text-gray-600 italic">{sale.remarks}</p>,
    });
  }

  return sections;
}

// Small inline icon used conditionally above (kept local to avoid extra import clutter)
function AlertDueIcon(props) {
  return <TrendingDown {...props} />;
}

/* ======================= INLINE DETAIL CONTENT ======================= */

// The content rendered inside the expanded row.
export default function SaleExpandedDetails({ invoice, sale }) {
  const sections = buildSections(invoice, sale);
  if (sections.length === 0) return null;

  return (
    <div className="py-3 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-2.5">
        {sections.map((sec) => {
          const t = TINT[sec.tint] ?? TINT.slate;
          return (
            <div
              key={sec.key}
              className={cn("rounded-lg border p-3", t.border, t.bg, sec.full && "lg:col-span-2")}
            >
              <SectionHeader label={sec.label} icon={sec.icon} tint={sec.tint} />
              {sec.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================= REUSABLE EXPANDABLE ROW ======================= */

// Drop-in replacement for a table row that expands in place — same mechanics
// as the ledger's LedgerRow (click row -> toggle -> render detail row below).
export function ExpandableSaleRow({
  invoice,
  sale,
  colSpan,
  renderRow,
  rowClassName,
  expanded: expandedProp,
  onToggle,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isControlled = expandedProp !== undefined;
  const expanded = isControlled ? expandedProp : internalExpanded;
  const toggle = () => (isControlled ? onToggle?.() : setInternalExpanded((p) => !p));
  const sections = buildSections(invoice, sale);
  const hasDetails = sections.length > 0;

  return (
    <>
      <TableRow
        className={cn(
          "group transition-colors",
          hasDetails ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50",
          expanded && "bg-slate-50",
          rowClassName,
        )}
        onClick={() => hasDetails && toggle()}
      >
        {renderRow(expanded, toggle)}
      </TableRow>

      {expanded && hasDetails && (
        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
          <TableCell colSpan={colSpan} className="py-0">
            <SaleExpandedDetails invoice={invoice} sale={sale} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export { ChevronDown, ChevronUp };