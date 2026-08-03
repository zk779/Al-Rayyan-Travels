import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "../../shadcn/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../shadcn/components/ui/card";
import { Badge } from "../../shadcn/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../shadcn/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../shadcn/components/ui/table";
import {
	CalendarIcon,
	TrendingUp,
	TrendingDown,
	SaudiRiyal,
	Filter,
	Download,
	RefreshCw,
	BookOpen,
	Users,
	Building2,
	CreditCard,
	Wallet,
	FileText,
	ArrowUpRight,
	ArrowDownRight,
	BarChart3,
	X,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	ChevronUp,
	Plane,
	Receipt,
	Banknote,
	RotateCcw,
	Hash,
	User,
	MapPin,
	Calendar,
	ChevronsLeft,
	ChevronsRight,
	Scale,
	Pointer,
} from "lucide-react";
import { format } from "date-fns";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { cn } from "../../shadcn/lib/utils";
import RangeCalendar from "../components/DragCalendar";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/* ======================= HELPERS ======================= */

async function apiRequest(path) {
	const token = localStorage.getItem("token");
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	const data = await res.json();
	if (!res.ok || data?.success === false) {
		throw new Error(data?.error || "Request failed");
	}
	return data;
}

// Plain-text amount formatter — no currency symbol baked in, since the
// Riyal symbol is an icon (SVG), not a text character. Use this only where
// a raw number string is needed (e.g. inside a template literal/CSV export).
const moneyText = (n) =>
	new Intl.NumberFormat("en-US", {
		style: "decimal",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n || 0));

// JSX component — renders the Riyal icon + formatted amount together.
// Use this everywhere an amount is rendered directly in JSX.
function Money({ value, size = 12, className = "" }) {
	return (
		<span className={cn("inline-flex items-center gap-0.5 tabular-nums", className)}>
			<SaudiRiyal className="shrink-0" size={size} />
			{moneyText(value)}
		</span>
	);
}

const ENTRY_CONFIG = {
	OPENING_BALANCE: { color: "bg-sky-50 text-sky-700 border-sky-200", icon: <BookOpen className="w-3 h-3" /> },
	SALE:            { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Plane className="w-3 h-3" /> },
	PAYMENT:         { color: "bg-violet-50 text-violet-700 border-violet-200", icon: <Banknote className="w-3 h-3" /> },
	REFUND:          { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <RotateCcw className="w-3 h-3" /> },
	EXPENSE:         { color: "bg-rose-50 text-rose-700 border-rose-200", icon: <Receipt className="w-3 h-3" /> },
	ADJUSTMENT:      { color: "bg-gray-100 text-gray-700 border-gray-200", icon: <FileText className="w-3 h-3" /> },
};

const entryBadge = (type) => {
	const cfg = ENTRY_CONFIG[type] || ENTRY_CONFIG.ADJUSTMENT;
	return (
		<Badge variant="outline" className={cn("inline-flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 whitespace-nowrap", cfg.color)}>
			{cfg.icon}
			{type.replaceAll("_", " ")}
		</Badge>
	);
};

const accountTypeIcon = (type) => {
	const map = {
		VENDOR:   <Building2 className="w-4 h-4 text-blue-500" />,
		CUSTOMER: <Users className="w-4 h-4 text-emerald-500" />,
		EXPENSE:  <CreditCard className="w-4 h-4 text-rose-500" />,
		CASH:     <Wallet className="w-4 h-4 text-amber-500" />,
		BANK:     <Building2 className="w-4 h-4 text-violet-500" />,
	};
	return map[type] || <FileText className="w-4 h-4 text-gray-400" />;
};

const payStatusColor = {
	DUE:     "bg-rose-50 text-rose-700 border-rose-200",
	PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
	PAID:    "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const refundStatusColor = {
	PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
	APPROVED:  "bg-sky-50 text-sky-700 border-sky-200",
	REJECTED:  "bg-rose-50 text-rose-700 border-rose-200",
	COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/* ======================= DETAIL PANELS ======================= */

function SaleDetail({ sale }) {
	if (!sale) return null;
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{sale.invoice?.invoiceNo && (
				<div className="flex items-start gap-2">
					<Hash className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Invoice</p>
						<p className="text-xs font-semibold text-gray-800">{sale.invoice.invoiceNo}</p>
					</div>
				</div>
			)}
			{sale.pnr && (
				<div className="flex items-start gap-2">
					<Plane className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">PNR</p>
						<p className="text-xs font-semibold text-gray-800">{sale.pnr}</p>
					</div>
				</div>
			)}
			{sale.paxName && (
				<div className="flex items-start gap-2">
					<User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Passenger</p>
						<p className="text-xs font-semibold text-gray-800">{sale.paxName}</p>
					</div>
				</div>
			)}
			{sale.airline?.airlineName && (
				<div className="flex items-start gap-2">
					<Plane className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Airline</p>
						<p className="text-xs font-semibold text-gray-800">
							{sale.airline.airlineName}
							{sale.airline.iataName && <span className="text-gray-400 ml-1">({sale.airline.iataName})</span>}
						</p>
					</div>
				</div>
			)}
			{sale.vendor?.vendorName && (
				<div className="flex items-start gap-2">
					<Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Vendor</p>
						<p className="text-xs font-semibold text-gray-800">{sale.vendor.vendorName}</p>
					</div>
				</div>
			)}
			{sale.customer?.customerName && (
				<div className="flex items-start gap-2">
					<Users className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Customer</p>
						<p className="text-xs font-semibold text-gray-800">{sale.customer.customerName}</p>
					</div>
				</div>
			)}
			{sale.departureDate && (
				<div className="flex items-start gap-2">
					<Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Departure</p>
						<p className="text-xs font-semibold text-gray-800">{format(new Date(sale.departureDate), "MMM dd, yyyy")}</p>
					</div>
				</div>
			)}
			{sale.routeType && (
				<div className="flex items-start gap-2">
					<MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Route</p>
						<p className="text-xs font-semibold text-gray-800">{sale.routeType} · {sale.tripType}</p>
					</div>
				</div>
			)}
			<div className="flex items-start gap-2">
				<SaudiRiyal className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
				<div>
					<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Net / Sell</p>
					<p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
						<Money value={sale.netPrice} /> / <Money value={sale.sellPrice} />
					</p>
				</div>
			</div>
			<div className="flex items-start gap-2">
				<TrendingUp className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
				<div>
					<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Profit</p>
					<p className="text-xs font-semibold text-emerald-700"><Money value={sale.profit} /></p>
				</div>
			</div>
			{sale.paymentStatus && (
				<div className="flex items-start gap-2">
					<Receipt className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Payment</p>
						<Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border mt-0.5", payStatusColor[sale.paymentStatus] || "")}>
							{sale.paymentStatus}
						</Badge>
						<Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border mt-0.5", payStatusColor[sale.paymentStatus] || "")}>
							{sale.paymentType}
						</Badge>
					</div>
				</div>
			)}
			{sale.paidAmount != null && (
				<div className="flex items-start gap-2">
					<Banknote className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Paid</p>
						<p className="text-xs font-semibold text-gray-800"><Money value={sale.paidAmount} /></p>
					</div>
				</div>
			)}
		</div>
	);
}

function PaymentDetail({ payment }) {
	if (!payment) return null;
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{payment.sale?.invoice?.invoiceNo && (
				<div className="flex items-start gap-2">
					<Hash className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Invoice</p>
						<p className="text-xs font-semibold text-gray-800">{payment.sale.invoice.invoiceNo}</p>
					</div>
				</div>
			)}
			{payment.method && (
				<div className="flex items-start gap-2">
					<Banknote className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Method</p>
						<p className="text-xs font-semibold text-gray-800">{payment.method.replaceAll("_", " ")}</p>
					</div>
				</div>
			)}
			{payment.amount != null && (
				<div className="flex items-start gap-2">
					<SaudiRiyal className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Amount</p>
						<p className="text-xs font-semibold text-violet-700"><Money value={payment.amount} /></p>
					</div>
				</div>
			)}
			{payment.bank?.bankName && (
				<div className="flex items-start gap-2">
					<Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Bank</p>
						<p className="text-xs font-semibold text-gray-800">{payment.bank.bankName}</p>
					</div>
				</div>
			)}
			{payment.customer?.customerName && (
				<div className="flex items-start gap-2">
					<Users className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Customer</p>
						<p className="text-xs font-semibold text-gray-800">{payment.customer.customerName}</p>
					</div>
				</div>
			)}
			{payment.sale?.pnr && (
				<div className="flex items-start gap-2">
					<Plane className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">PNR</p>
						<p className="text-xs font-semibold text-gray-800">{payment.sale.pnr}</p>
					</div>
				</div>
			)}
			{payment.sale?.paxName && (
				<div className="flex items-start gap-2">
					<User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Passenger</p>
						<p className="text-xs font-semibold text-gray-800">{payment.sale.paxName}</p>
					</div>
				</div>
			)}
			{payment.paymentDate && (
				<div className="flex items-start gap-2">
					<Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Payment Date</p>
						<p className="text-xs font-semibold text-gray-800">{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</p>
					</div>
				</div>
			)}
			{payment.remarks && (
				<div className="flex items-start gap-2 md:col-span-2">
					<FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Remarks</p>
						<p className="text-xs text-gray-600">{payment.remarks}</p>
					</div>
				</div>
			)}
		</div>
	);
}

function RefundDetail({ refund }) {
	if (!refund) return null;
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{refund.sale?.invoice?.invoiceNo && (
				<div className="flex items-start gap-2">
					<Hash className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Invoice</p>
						<p className="text-xs font-semibold text-gray-800">{refund.sale.invoice.invoiceNo}</p>
					</div>
				</div>
			)}
			{refund.status && (
				<div className="flex items-start gap-2">
					<RotateCcw className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Status</p>
						<Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border mt-0.5", refundStatusColor[refund.status] || "")}>
							{refund.status}
						</Badge>
					</div>
				</div>
			)}
			{refund.sale?.customer?.customerName && (
				<div className="flex items-start gap-2">
					<Users className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Customer</p>
						<p className="text-xs font-semibold text-gray-800">{refund.sale.customer.customerName}</p>
					</div>
				</div>
			)}
			{refund.sale?.paxName && (
				<div className="flex items-start gap-2">
					<User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Passenger</p>
						<p className="text-xs font-semibold text-gray-800">{refund.sale.paxName}</p>
					</div>
				</div>
			)}
			{refund.originalSaleAmount != null && (
				<div className="flex items-start gap-2">
					<SaudiRiyal className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Original Amount</p>
						<p className="text-xs font-semibold text-gray-800"><Money value={refund.originalSaleAmount} /></p>
					</div>
				</div>
			)}
			{refund.customerRefundAmount != null && (
				<div className="flex items-start gap-2">
					<TrendingDown className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Customer Refund</p>
						<p className="text-xs font-semibold text-amber-700"><Money value={refund.customerRefundAmount} /></p>
					</div>
				</div>
			)}
			{refund.refundFee != null && refund.refundFee > 0 && (
				<div className="flex items-start gap-2">
					<Receipt className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Refund Fee</p>
						<p className="text-xs font-semibold text-rose-700"><Money value={refund.refundFee} /></p>
					</div>
				</div>
			)}
			{refund.netCostToUs != null && (
				<div className="flex items-start gap-2">
					<BarChart3 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Net Cost to Us</p>
						<p className="text-xs font-semibold text-rose-700"><Money value={refund.netCostToUs} /></p>
					</div>
				</div>
			)}
			{refund.refundDate && (
				<div className="flex items-start gap-2">
					<Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Refund Date</p>
						<p className="text-xs font-semibold text-gray-800">{format(new Date(refund.refundDate), "MMM dd, yyyy")}</p>
					</div>
				</div>
			)}
			{refund.refundReason && (
				<div className="flex items-start gap-2 md:col-span-2">
					<FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Reason</p>
						<p className="text-xs text-gray-600">{refund.refundReason}</p>
					</div>
				</div>
			)}
		</div>
	);
}

function InvoiceDetail({ invoice }) {
	if (!invoice) return null;
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			<div className="flex items-start gap-2">
				<Hash className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
				<div>
					<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Invoice No.</p>
					<p className="text-xs font-semibold text-gray-800">{invoice.invoiceNo}</p>
				</div>
			</div>
			{invoice.saleDate && (
				<div className="flex items-start gap-2">
					<Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Sale Date</p>
						<p className="text-xs font-semibold text-gray-800">{format(new Date(invoice.saleDate), "MMM dd, yyyy")}</p>
					</div>
				</div>
			)}
			<div className="flex items-start gap-2">
				<SaudiRiyal className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
				<div>
					<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Total Net / Sell</p>
					<p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
						<Money value={invoice.totalNet} /> / <Money value={invoice.totalSell} />
					</p>
				</div>
			</div>
			<div className="flex items-start gap-2">
				<TrendingUp className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
				<div>
					<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Total Profit</p>
					<p className="text-xs font-semibold text-emerald-700"><Money value={invoice.totalProfit} /></p>
				</div>
			</div>
			{invoice.user?.fullName && (
				<div className="flex items-start gap-2">
					<User className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Created By</p>
						<p className="text-xs font-semibold text-gray-800">{invoice.user.fullName}</p>
					</div>
				</div>
			)}
		</div>
	);
}

/* ======================= EXPANDABLE ROW ======================= */

function LedgerRow({ entry }) {
	const [expanded, setExpanded] = useState(false);
	const { details } = entry;
	const hasDetails = details && (details.sale || details.payment || details.refund || details.invoice);

	const renderDetails = () => {
		if (!details) return null;
		const sections = [];
		if (details.sale) sections.push({ label: "Sale Details", content: <SaleDetail sale={details.sale} />, color: "border-emerald-200 bg-emerald-50/40" });
		if (details.payment) sections.push({ label: "Payment Details", content: <PaymentDetail payment={details.payment} />, color: "border-violet-200 bg-violet-50/40" });
		if (details.refund) sections.push({ label: "Refund Details", content: <RefundDetail refund={details.refund} />, color: "border-amber-200 bg-amber-50/40" });
		if (details.invoice && !details.sale) sections.push({ label: "Invoice Details", content: <InvoiceDetail invoice={details.invoice} />, color: "border-sky-200 bg-sky-50/40" });
		if (details.expenseId && !details.sale && !details.payment && !details.refund) {
			sections.push({
				label: "Expense",
				content: (
					<div className="flex items-center gap-2">
						<Receipt className="w-3.5 h-3.5 text-gray-400" />
						<span className="text-xs text-gray-600 font-mono">{details.expenseId}</span>
					</div>
				),
				color: "border-rose-200 bg-rose-50/40"
			});
		}
		return sections;
	};

	const detailSections = renderDetails();
	const hasExpandable = hasDetails && detailSections && detailSections.length > 0;

	return (
		<>
			<TableRow
				className={cn(
					"group transition-colors",
					hasExpandable ? "cursor-pointer hover:bg-slate-50" : "hover:bg-slate-50/50",
					expanded && "bg-slate-50"
				)}
				onClick={() => hasExpandable && setExpanded(p => !p)}
			>
				{/* Date */}
				<TableCell className="py-3">
					<div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium whitespace-nowrap">
						<CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
						{format(new Date(entry.transactionDate), "dd MMM yyyy")}
					</div>
				</TableCell>
				<TableCell className="py-3 max-w-[180px]">
					<div className="text-xs text-gray-600 space-y-0.5">
						{details?.sale?.pnr && (
							<div className="flex items-center gap-1 font-mono font-semibold text-slate-700">
								<span className="text-gray-400">{details.sale.documentNo}</span>
							</div>
						)}
						</div>
				</TableCell>

				{/* Account */}
				<TableCell className="py-3 max-w-[160px]">
					<div className="flex items-center gap-1.5">
						{accountTypeIcon(entry.account?.type)}
						<span className="text-sm font-semibold text-gray-800 truncate" title={entry.account?.name}>
							{entry.account?.name || "—"}
						</span>
					</div>
					<span className="text-[10px] text-gray-400 uppercase tracking-wide ml-6">{entry.account?.type}</span>
				</TableCell>

				{/* Entry Type */}
				<TableCell className="py-3">
					{entryBadge(entry.entryType)}
				</TableCell>

				{/* Reference summary */}
				<TableCell className="py-3 max-w-[180px]">
					<div className="text-xs text-gray-600 space-y-0.5">
						{details?.sale?.pnr && (
							<div className="flex items-center gap-1 font-mono font-semibold text-slate-700">
								<span className="text-gray-400">PNR:</span> {details.sale.pnr}
							</div>
						)}
						{details?.sale?.paxName && (
							<div className="flex items-center gap-1 truncate" title={details.sale.paxName}>
								<User className="w-3 h-3 text-gray-400 shrink-0" /> {details.sale.paxName}
							</div>
						)}
						{details?.payment?.method && !details?.sale && (
							<div className="flex items-center gap-1">
								<Banknote className="w-3 h-3 text-gray-400" />
								{details.payment.method.replaceAll("_", " ")}
							</div>
						)}
						{details?.refund?.status && !details?.sale && (
							<Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", refundStatusColor[details.refund.status] || "")}>
								{details.refund.status}
							</Badge>
						)}
						{details?.invoice?.invoiceNo && !details?.sale && (
							<span className="font-mono text-slate-700">{details.invoice.invoiceNo}</span>
						)}
						{!hasExpandable && entry.remarks && (
							<span className="text-gray-500 italic">{entry.remarks}</span>
						)}
					</div>
				</TableCell>

				{/* Debit */}
				<TableCell className="py-3 text-right">
					{entry.debit ? (
						<span className="font-bold text-rose-600 text-sm">
							<Money value={entry.debit} size={13} />
						</span>
					) : (
						<span className="text-gray-300 text-sm">—</span>
					)}
				</TableCell>

				{/* Credit */}
				<TableCell className="py-3 text-right">
					{entry.credit ? (
						<span className="font-bold text-emerald-600 text-sm">
							<Money value={entry.credit} size={13} />
						</span>
					) : (
						<span className="text-gray-300 text-sm">—</span>
					)}
				</TableCell>

				{/* Balance (running, if available)
				<TableCell className="py-3 text-right">
					<span className="text-sm font-semibold text-slate-700">
						{entry.balanceAfter != null ? <Money value={entry.balanceAfter} size={13} /> : "—"}
					</span>
				</TableCell> */}

				{/* Expand toggle */}
				<TableCell className="py-3 w-8 text-center">
					{hasExpandable ? (
						<span className="text-gray-400 group-hover:text-gray-600 transition-colors">
							{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
						</span>
					) : null}
				</TableCell>
			</TableRow>

			{/* Expanded Detail Row */}
			{expanded && detailSections && detailSections.length > 0 && (
				<TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
					<TableCell colSpan={8} className="py-0">
						<div className="py-3 px-4 space-y-3">
							{detailSections.map((sec, i) => (
								<div key={i} className={cn("rounded-lg border p-3", sec.color)}>
									<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{sec.label}</p>
									{sec.content}
								</div>
							))}
							{entry.remarks && (
								<div className="flex items-start gap-2 px-1">
									<FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
									<p className="text-xs text-gray-500 italic">{entry.remarks}</p>
								</div>
							)}
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}

/* ======================= PAGINATION ======================= */

function Pagination({ page, totalPages, onPage }) {
	if (totalPages <= 1) return null;

	const pages = [];
	const delta = 2;
	const left = Math.max(2, page - delta);
	const right = Math.min(totalPages - 1, page + delta);

	pages.push(1);
	if (left > 2) pages.push("...");
	for (let i = left; i <= right; i++) pages.push(i);
	if (right < totalPages - 1) pages.push("...");
	if (totalPages > 1) pages.push(totalPages);

	return (
		<div className="flex items-center justify-center gap-1 mt-4">
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8"
				onClick={() => onPage(1)}
				disabled={page === 1}
			>
				<ChevronsLeft className="w-4 h-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8"
				onClick={() => onPage(page - 1)}
				disabled={page === 1}
			>
				<ChevronLeft className="w-4 h-4" />
			</Button>

			{pages.map((p, i) =>
				p === "..." ? (
					<span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
				) : (
					<Button
						key={p}
						variant={p === page ? "default" : "outline"}
						size="icon"
						className={cn("h-8 w-8 text-sm", p === page && "bg-slate-800 text-white hover:bg-slate-700")}
						onClick={() => onPage(p)}
					>
						{p}
					</Button>
				)
			)}

			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8"
				onClick={() => onPage(page + 1)}
				disabled={page === totalPages}
			>
				<ChevronRight className="w-4 h-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8"
				onClick={() => onPage(totalPages)}
				disabled={page === totalPages}
			>
				<ChevronsRight className="w-4 h-4" />
			</Button>
		</div>
	);
}

/* ======================= MAIN COMPONENT ======================= */

export default function LedgerComponent() {
	const [entries, setEntries]           = useState([]);
	const [vendors, setVendors]           = useState([]);
	const [customers, setCustomers]       = useState([]);

	const [accountType, setAccountType] = useState("SELECT"); // was "VENDOR"
	const [entryType, setEntryType]       = useState("ALL");
	const [selectedVendorId, setSelectedVendorId]       = useState("all");
	const [selectedCustomerId, setSelectedCustomerId]   = useState("all");
	// Add this alongside your other useState declarations
	const [datePickerOpen, setDatePickerOpen] = useState(false);

	// No default range — an unfiltered fetch just returns the latest entries
	// (server already sorts newest-first); a range only kicks in once picked.
	const [dateRange, setDateRange] = useState(null);

	const [page, setPage]       = useState(1);
	const [limit, setLimit]     = useState(50); // page size — user-adjustable via dropdown
	const [total, setTotal]     = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading]   = useState(false);

	// Server-computed totals for the FULL filtered set (all pages), from
	// GET /api/ledger?...&includeSummary=true → { overall, byAccount }
	const [summary, setSummary] = useState(null);

	/* ---------- Master data ---------- */
	useEffect(() => {
		apiRequest("/api/vendors").then((r) => setVendors(r.data || [])).catch(console.error);
		apiRequest("/api/customers").then((r) => setCustomers(r.data || [])).catch(console.error);
	}, []);

	/* ---------- Fetch ledger ---------- */
	const fetchLedger = useCallback(async () => {
			if (accountType === "SELECT") {
				setEntries([]);
				setTotal(0);
				setTotalPages(1);
				setSummary(null);
				return;
			}
		
			setIsLoading(true);
			try {
			const params = new URLSearchParams();
			params.set("accountType", accountType);
			params.set("page", page);
			params.set("limit", limit);
			params.set("includeDetails", "true");
			params.set("includeSummary", "true");

			if (entryType !== "ALL") params.set("entryType", entryType);
			if (accountType === "VENDOR"   && selectedVendorId   !== "all") params.set("vendorId", selectedVendorId);
			if (accountType === "CUSTOMER" && selectedCustomerId !== "all") params.set("customerId", selectedCustomerId);

			// Send plain local calendar dates (no time/Z) — the backend's
			// localDayRangeToUtc converts these using the timezone below,
			// so we must NOT pre-convert to ISO/UTC here ourselves.
			if (dateRange?.from) params.set("from", format(dateRange.from, "yyyy-MM-dd"));
			if (dateRange?.to)   params.set("to",   format(dateRange.to,   "yyyy-MM-dd"));
			if (dateRange?.from || dateRange?.to) {
				params.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
			}

			const res = await apiRequest(`/api/ledger?${params.toString()}`);
			setEntries(res.data || []);
			setTotal(res.meta?.total || 0);
			setTotalPages(res.meta?.totalPages || 1);
			setSummary(res.summary || null);
		} catch (e) {
			console.error(e);
			alert(e.message);
		} finally {
			setIsLoading(false);
		}
	}, [accountType, entryType, selectedVendorId, selectedCustomerId, dateRange, page, limit]);

	useEffect(() => { fetchLedger(); }, [fetchLedger]);

	/* ---------- Calculations ---------- */

	// Totals for entries loaded on the CURRENT page only.
	const pageTotals = useMemo(() =>
		entries.reduce((acc, e) => {
			acc.credit += Number(e.credit || 0);
			acc.debit  += Number(e.debit  || 0);
			return acc;
		}, { credit: 0, debit: 0 }),
	[entries]);
	const pageNet = pageTotals.credit - pageTotals.debit;

	// Totals across the ENTIRE filtered set (every page), from the server.
	const overallTotals = summary?.overall ?? null;
	const headlineTotals = overallTotals
		? { credit: overallTotals.totalCredit, debit: overallTotals.totalDebit }
		: pageTotals; // fallback while summary hasn't loaded yet
	const netBalance = headlineTotals.credit - headlineTotals.debit;
	const isPositive = netBalance >= 0;

	// When a specific vendor/customer is selected, pull that single account's
	// totals + live balance out of summary.byAccount.
	const selectedReferenceId =
		accountType === "VENDOR"   && selectedVendorId   !== "all" ? selectedVendorId :
		accountType === "CUSTOMER" && selectedCustomerId !== "all" ? selectedCustomerId :
		null;

	const singleAccountSummary = selectedReferenceId
		? summary?.byAccount?.find((a) => a.referenceId === selectedReferenceId) ?? null
		: null;

	/* ---------- Filters ---------- */
	const clearFilters = () => {
	setAccountType("SELECT"); setEntryType("ALL");
	setSelectedVendorId("all"); setSelectedCustomerId("all");
	setDateRange(null);
	setPage(1);
};

	const hasActiveFilters = accountType !== "SELECT" || entryType !== "ALL" || selectedVendorId !== "all" || selectedCustomerId !== "all" || !!dateRange;

	/* ---------- Export ---------- */
	const exportCSV = () => {
		const rows = [
			["Date", "Account", "Account Type", "Entry Type", "PNR", "Passenger", "Debit", "Credit", "Remarks"],
			...entries.map((e) => [
				format(new Date(e.transactionDate), "yyyy-MM-dd"),
				e.account?.name || "",
				e.account?.type || "",
				e.entryType,
				e.details?.sale?.pnr || "",
				e.details?.sale?.paxName || "",
				e.debit  || "",
				e.credit || "",
				e.remarks || "",
			]),
		];
		const csv  = rows.map((r) => r.map(v => `"${v}"`).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url  = URL.createObjectURL(blob);
		const a    = document.createElement("a");
		a.href = url; a.download = `ledger_${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
		URL.revokeObjectURL(url);
	};

	/* ======================= UI ======================= */
	return (
		<div className="p-4 md:p-6 min-h-screen bg-gray-50/60">

			{/* ── Header ── */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
				<div className="flex items-center gap-3">
					<div className="bg-slate-800 p-2.5 rounded-xl shadow-lg">
						<BookOpen className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Ledger</h1>
						<p className="text-sm text-gray-500">Unified financial ledger · all accounts</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={fetchLedger} className="gap-1.5">
						<RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
						Refresh
					</Button>
					<Button size="sm" onClick={exportCSV} className="gap-1.5 bg-slate-800 hover:bg-slate-700 text-white">
						<Download className="w-3.5 h-3.5" /> Export CSV
					</Button>
				</div>
			</div>

			{/* ── Summary Cards (totals across ALL filtered pages) ── */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
				{[
					{
						label: "Total Credit", value: headlineTotals.credit,
						icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
						bg: "bg-emerald-50", border: "border-l-emerald-500",
						sub: "Money In", subColor: "text-emerald-600",
					},
					{
						label: "Total Debit", value: headlineTotals.debit,
						icon: <TrendingDown className="w-5 h-5 text-rose-600" />,
						bg: "bg-rose-50", border: "border-l-rose-500",
						sub: "Money Out", subColor: "text-rose-600",
					},
					{
						label: "Net Balance", value: netBalance,
						icon: <SaudiRiyal className={cn("w-5 h-5", isPositive ? "text-blue-600" : "text-orange-500")} />,
						bg: isPositive ? "bg-blue-50" : "bg-orange-50",
						border: isPositive ? "border-l-blue-500" : "border-l-orange-500",
						sub: isPositive ? "Surplus" : "Deficit",
						subColor: isPositive ? "text-blue-600" : "text-orange-500",
					},
				].map((c) => (
					<Card key={c.label} className={cn("border-l-4 shadow-sm py-0!", c.border)}>
						<CardContent className="p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</span>
								<div className={cn("p-1.5 rounded-lg", c.bg)}>{c.icon}</div>
							</div>
							<div className="text-2xl font-bold text-gray-900">
								<Money value={c.value} size={18} />
							</div>
							<div className={cn("text-xs font-medium mt-1", c.subColor)}>
								{c.sub}
								{overallTotals && <span className="text-gray-400 font-normal"> · all pages</span>}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* ── Single account balance (shown when one vendor/customer is selected) ── */}
			{singleAccountSummary && (
				<div className="mb-6 flex flex-wrap items-center gap-2 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
					{accountTypeIcon(singleAccountSummary.type)}
					<span className="text-sm font-semibold text-gray-800">{singleAccountSummary.name}</span>
					<span className="text-gray-300">•</span>
					<span className="inline-flex items-center gap-1 text-xs text-gray-500">
						<Scale className="w-3.5 h-3.5" /> Live Balance:
					</span>
					<Money value={singleAccountSummary.currentBalance} className="font-bold text-slate-800" />
					<span className="text-gray-300 hidden sm:inline">•</span>
					<span className="text-xs text-gray-500 hidden sm:inline">Filtered Debit/Credit:</span>
					<span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
						<Money value={singleAccountSummary.totalDebit} size={11} />
					</span>
					<span className="hidden sm:inline text-gray-300">/</span>
					<span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
						<Money value={singleAccountSummary.totalCredit} size={11} />
					</span>
				</div>
			)}

			{/* ── Filters ── */}
			<Card className="shadow-sm mb-6 border-gray-200 py-0!">
				<CardContent className="p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
							<Filter className="w-4 h-4 text-gray-500" />
							Filters
						</div>
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearFilters} className="text-rose-600 hover:bg-rose-50 h-7 gap-1 text-xs">
								<X className="w-3 h-3" /> Clear
							</Button>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
						{/* Account Type */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Type</label>
							<Select value={accountType} onValueChange={(v) => { setAccountType(v); setSelectedVendorId("all"); setSelectedCustomerId("all"); setPage(1); }}>
								<SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
								<SelectContent>
									{[["SELECT","Select Account",Pointer],["VENDOR","Vendor",Building2],["CUSTOMER","Customer",Users],["EXPENSE","Expense",CreditCard],["CASH","Cash",Wallet],["BANK","Bank",Building2]].map(([val, label, Icon]) => (
										<SelectItem key={val} value={val}>
											<div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{label}</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Entry Type */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entry Type</label>
							<Select value={entryType} onValueChange={(v) => { setEntryType(v); setPage(1); }}>
								<SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All Entries</SelectItem>
									<SelectItem value="OPENING_BALANCE">Opening Balance</SelectItem>
									<SelectItem value="SALE">Sale</SelectItem>
									<SelectItem value="PAYMENT">Payment</SelectItem>
									<SelectItem value="REFUND">Refund</SelectItem>
									<SelectItem value="EXPENSE">Expense</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Vendor */}
						{accountType === "VENDOR" && (
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</label>
								<Select value={selectedVendorId} onValueChange={(v) => { setSelectedVendorId(v); setPage(1); }}>
									<SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="All Vendors" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Vendors</SelectItem>
										{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>)}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Customer */}
						{accountType === "CUSTOMER" && (
							<div className="space-y-1">
								<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</label>
								<Select value={selectedCustomerId} onValueChange={(v) => { setSelectedCustomerId(v); setPage(1); }}>
									<SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="All Customers" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Customers</SelectItem>
										{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>)}
									</SelectContent>
								</Select>
							</div>
						)}

						<div className={cn("space-y-1", (accountType === "VENDOR" || accountType === "CUSTOMER") ? "lg:col-span-2" : "lg:col-span-3")}>
						<label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Range</label>
							<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
								<PopoverTrigger asChild>
									<Button variant="outline" className="w-full justify-start h-9 text-sm 						font-normal">
										<CalendarIcon className="mr-2 h-3.5 w-3.5 text-gray-400" />
										{dateRange?.from && dateRange?.to
											? <>{format(dateRange.from, "dd MMM yyyy")} — {format(dateRange.to, 						"dd MMM yyyy")}</>
											: <span className="text-gray-400">Pick range…</span>}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									{/* Click-to-select range: 1st click = start date, hover
									    previews the range line, 2nd click = end date. */}
									<RangeCalendar
										defaultMonth={dateRange?.from}
										selected={dateRange}
										onSelect={setDateRange}
										onRangeComplete={() => setDatePickerOpen(false)}
										numberOfMonths={2}
									/>
								</PopoverContent>
							</Popover>
</div>
					</div>
				</CardContent>
			</Card>

			{/* ── Table ── */}
			<Card className="shadow-sm border-gray-200">
				<CardHeader className="pb-3 pt-4 px-4 border-b border-gray-100">
					<div className="flex items-center justify-between flex-wrap gap-2">
						<div>
							<CardTitle className="text-base font-bold text-gray-800">Ledger Entries</CardTitle>
							<CardDescription className="text-xs mt-0.5">
								{isLoading ? "Loading…" : `Showing ${entries.length} of ${total} records • Page ${page} of ${totalPages}`}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							{total > 0 && (
								<Badge variant="outline" className="text-xs px-2 py-1 bg-slate-50 border-slate-200 text-slate-600">
									{total.toLocaleString()} Total
								</Badge>
							)}
							{/* Page size selector */}
							<Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
								<SelectTrigger className="h-8 w-[110px] text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAGE_SIZE_OPTIONS.map((n) => (
										<SelectItem key={n} value={String(n)} className="text-xs">
											{n} / page
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Per-page totals — computed from the entries currently loaded (this page only) */}
					{!isLoading && entries.length > 0 && (
						<div className="flex flex-wrap gap-3 pt-3">
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
								<Receipt className="h-4 w-4" /> {entries.length} Transactions (page)
							</div>
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
								<TrendingUp className="h-4 w-4" /> <Money value={pageTotals.credit} /> Credit (page)
							</div>
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium">
								<TrendingDown className="h-4 w-4" /> <Money value={pageTotals.debit} /> Debit (page)
							</div>
							<div
								className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
									pageNet >= 0 ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"
								)}
							>
								<SaudiRiyal size={14} /> <Money value={pageNet} /> Net (page)
							</div>
						</div>
					)}
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
									<TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 pl-4">Date</TableHead>
									<TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 pl-4">Doc#</TableHead>
									<TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">Account</TableHead>
									<TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">Entry</TableHead>
									<TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3">Reference</TableHead>
									<TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-right">Debit</TableHead>
									<TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-right">Credit</TableHead>
									{/* <TableHead className="text-xs font-bold text-gray-500 uppercase tracking-wide py-3 text-right">Balance</TableHead> */}
									<TableHead className="w-8 py-3" />
								</TableRow>
							</TableHeader>

							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={8} className="text-center py-16">
											<div className="flex flex-col items-center gap-3">
												<RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
												<p className="text-sm text-gray-500">Loading ledger entries…</p>
											</div>
										</TableCell>
									</TableRow>
								) : entries.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} className="text-center py-16">
											<div className="flex flex-col items-center gap-2">
												<BookOpen className="w-10 h-10 text-gray-200" />
												<p className="text-gray-500 font-medium">
													{accountType === "SELECT" ? "Select an account to view its ledger" : "No entries found"}
												</p>
												<p className="text-gray-400 text-sm">
													{accountType === "SELECT" ? "Choose an Account Type above to get started" : "Try adjusting your filters or date range"}
												</p>
											</div>
										</TableCell>
									</TableRow>
									) : (
									entries.map((e) => <LedgerRow key={e.id} entry={e} />)
								)}
							</TableBody>
						</Table>
					</div>

					{/* ── Pagination ── */}
					{!isLoading && entries.length > 0 && (
						<div className="border-t border-gray-100 px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
							<p className="text-xs text-gray-500 order-2 sm:order-1">
								Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> entries
							</p>
							<div className="order-1 sm:order-2">
								<Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}