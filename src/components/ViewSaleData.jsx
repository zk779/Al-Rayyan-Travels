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
	CheckCircle2,
	XCircle,
	AlertCircle,
	Hash,
	Mail,
	Clock,
} from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../shadcn/components/ui/dialog";

export default function ViewSaleData({ isOpen, onClose, saleData }) {
	if (!saleData) return null;

	const sale = saleData.sales?.[0] || {};

	const money = (val) => {
		const n = Number(val || 0);
		return `$${Math.abs(n).toFixed(2)}`;
	};

	// Status badge variants
	const getStatusBadge = (status) => {
		const statusMap = {
			COMPLETED: {
				bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
				icon: CheckCircle2,
			},
			PAID: {
				bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
				icon: CheckCircle2,
			},
			PENDING: {
				bg: "bg-amber-50 text-amber-700 ring-amber-600/20",
				icon: AlertCircle,
			},
			REFUNDED: {
				bg: "bg-red-50 text-red-700 ring-red-600/20",
				icon: XCircle,
			},
			CANCELLED: {
				bg: "bg-slate-100 text-slate-600 ring-slate-500/20",
				icon: XCircle,
			},
		};

		const config = statusMap[status?.toUpperCase()] || statusMap.PENDING;
		const Icon = config.icon;

		return (
			<span
				className={`${config.bg} ring-1 ring-inset px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap`}
			>
				<Icon className="h-3 w-3 shrink-0" />
				{status || "N/A"}
			</span>
		);
	};

	const getPaymentTypeBadge = (type) => {
		const typeMap = {
			CASH: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
			CREDIT: "bg-blue-50 text-blue-700 ring-blue-600/20",
			BANK_TRANSFER: "bg-violet-50 text-violet-700 ring-violet-600/20",
		};

		return (
			<span
				className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset whitespace-nowrap ${
					typeMap[type?.toUpperCase()] || "bg-slate-100 text-slate-600 ring-slate-500/20"
				}`}
			>
				{type || "N/A"}
			</span>
		);
	};

	// Small reusable field
	const Field = ({ label, value, icon: Icon, mono }) => (
		<div className="min-w-0">
			<p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 mb-0.5">
				{Icon && <Icon className="h-3 w-3 shrink-0" />}
				<span className="truncate">{label}</span>
			</p>
			<p
				className={`font-semibold text-sm sm:text-base text-slate-900 truncate ${
					mono ? "font-mono tracking-tight" : ""
				}`}
				title={typeof value === "string" ? value : undefined}
			>
				{value || "N/A"}
			</p>
		</div>
	);

	const profitPositive = (sale.profit || 0) > 0;
	const profitNegative = (sale.profit || 0) < 0;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-4xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-xl sm:rounded-2xl">
				{/* Header */}
				<DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-xl sm:rounded-t-2xl">
					<DialogTitle className="flex flex-wrap items-center justify-between gap-2 text-lg sm:text-2xl">
						<span className="flex items-center gap-2 text-slate-900">
							<span className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-600 text-white shrink-0">
								<FileText className="h-4 w-4 sm:h-5 sm:w-5" />
							</span>
							<span className="leading-tight">Sale Details</span>
						</span>
						{saleData.invoiceNo && (
							<span className="text-xs sm:text-sm font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
								#{saleData.invoiceNo}
							</span>
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="px-4 sm:px-6 py-5 space-y-5 sm:space-y-6">
					{/* Invoice + Created By — combined top strip */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						{/* Invoice Information */}
						<div className="rounded-xl p-4 sm:p-5 border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
							<h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-blue-900">
								<FileText className="h-4 w-4 text-blue-600" />
								Invoice
							</h3>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
								<Field label="Invoice No." value={saleData.invoiceNo} icon={Hash} />
								<Field
									label="Sale Date"
									icon={Calendar}
									value={
										saleData.saleDate
											? format(new Date(saleData.saleDate), "MMM dd, yyyy")
											: null
									}
								/>
								<Field label="Total Items" value={saleData.salesCount || 0} />
							</div>
						</div>

						{/* Created By */}
						<div className="rounded-xl p-4 sm:p-5 border border-slate-200 bg-slate-50">
							<h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-slate-700">
								<User className="h-4 w-4 text-slate-500" />
								Created by
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
								<Field label="Agent" value={saleData.createdByName} />
								<Field label="Email" value={saleData.createdByEmail} icon={Mail} />
								<Field
									label="Created at"
									icon={Clock}
									value={
										saleData.createdAt
											? format(new Date(saleData.createdAt), "MMM dd, yyyy HH:mm")
											: null
									}
								/>
							</div>
						</div>
					</div>

					{/* Transaction Details */}
					<div className="rounded-xl border border-blue-200 bg-white p-4 sm:p-6">
						<h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center gap-2 text-slate-900">
							<CreditCard className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
							Transaction Details
						</h3>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
							{/* Left Column */}
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 content-start">
								<Field label="Document No." value={sale.documentNo} mono />
								<div className="min-w-0">
									<p className="text-[11px] sm:text-xs text-slate-500 mb-0.5">
										Airline Code
									</p>
									<span className="inline-block text-sm px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-md font-semibold text-blue-800">
										{sale.airlineCode || "N/A"}
									</span>
								</div>
								<Field label="Vendor" value={sale.vendorName} />
								<div className="min-w-0">
									<p className="text-[11px] sm:text-xs text-slate-500 mb-1">
										Payment Type
									</p>
									{getPaymentTypeBadge(sale.paymentType)}
								</div>
								<div className="min-w-0">
									<p className="text-[11px] sm:text-xs text-slate-500 mb-1">
										Payment Status
									</p>
									{getStatusBadge(sale.paymentStatus)}
								</div>
								<div className="min-w-0">
									<p className="text-[11px] sm:text-xs text-slate-500 mb-1">
										Sale Status
									</p>
									{getStatusBadge(sale.status)}
								</div>
							</div>

							{/* Right Column */}
							<div className="space-y-3 sm:space-y-4">
								{sale.customerId && (
									<div className="rounded-lg p-3.5 sm:p-4 border border-violet-200 bg-violet-50">
										<h4 className="font-semibold mb-2.5 flex items-center gap-1.5 text-violet-900 text-sm">
											<User className="h-3.5 w-3.5" />
											Customer
										</h4>
										<div className="grid grid-cols-2 gap-3">
											<Field label="Name" value={sale.customerName} />
											<Field
												label="Phone"
												value={sale.customerPhone}
												icon={Phone}
												mono
											/>
										</div>
									</div>
								)}

								{sale.isRefund && (
									<div className="rounded-lg p-3.5 sm:p-4 border border-red-200 bg-red-50 flex items-center gap-2 text-red-700">
										<XCircle className="h-4 sm:h-5 w-4 sm:w-5 shrink-0" />
										<span className="font-semibold text-sm">
											This sale is a refund
										</span>
									</div>
								)}

								{sale.remarks && (
									<div className="rounded-lg p-3.5 sm:p-4 border border-amber-200 bg-amber-50">
										<p className="text-[11px] text-amber-700 mb-1 font-medium">
											Remarks
										</p>
										<p className="text-sm text-amber-900 italic break-words">
											{sale.remarks}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Financial Summary */}
					<div className="rounded-xl p-4 sm:p-6 border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
						<h3 className="text-sm sm:text-base font-semibold mb-4 flex items-center gap-2 text-slate-900">
							<DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
							Financial Summary
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
							<div className="bg-white rounded-lg p-3.5 sm:p-4 border border-emerald-100">
								<p className="text-xs text-slate-500 mb-1">Net Price</p>
								<p
									className={`text-xl sm:text-2xl font-bold ${
										sale.netPrice < 0 ? "text-red-600" : "text-slate-900"
									}`}
								>
									{sale.netPrice < 0 ? "-" : ""}
									{money(sale.netPrice)}
								</p>
							</div>
							<div className="bg-white rounded-lg p-3.5 sm:p-4 border border-emerald-100">
								<p className="text-xs text-slate-500 mb-1">Sell Price</p>
								<p
									className={`text-xl sm:text-2xl font-bold ${
										sale.sellPrice < 0 ? "text-red-600" : "text-slate-900"
									}`}
								>
									{sale.sellPrice < 0 ? "-" : ""}
									{money(sale.sellPrice)}
								</p>
							</div>
							<div className="bg-white rounded-lg p-3.5 sm:p-4 border border-emerald-100">
								<p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
									{profitPositive ? (
										<TrendingUp className="h-3 w-3 text-emerald-600" />
									) : profitNegative ? (
										<TrendingDown className="h-3 w-3 text-red-600" />
									) : (
										<TrendingUp className="h-3 w-3" />
									)}
									Profit
								</p>
								<p
									className={`text-xl sm:text-2xl font-bold ${
										profitPositive
											? "text-emerald-600"
											: profitNegative
												? "text-red-600"
												: "text-slate-900"
									}`}
								>
									{profitNegative ? "-" : ""}
									{money(sale.profit)}
								</p>
							</div>
						</div>
					</div>

					{/* Invoice Totals */}
					<div className="rounded-xl p-4 sm:p-6 border border-slate-200 bg-slate-50">
						<h3 className="text-sm sm:text-base font-semibold mb-4 text-slate-900">
							Invoice Totals
						</h3>
						<div className="grid grid-cols-3 gap-3 sm:gap-4 text-center sm:text-left">
							<div>
								<p className="text-xs text-slate-500 mb-1">Total Net</p>
								<p className="text-base sm:text-xl font-bold text-slate-900">
									{money(saleData.totalNet)}
								</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 mb-1">Total Sell</p>
								<p className="text-base sm:text-xl font-bold text-slate-900">
									{money(saleData.totalSell)}
								</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 mb-1">Total Profit</p>
								<p
									className={`text-base sm:text-xl font-bold ${
										saleData.totalProfit > 0
											? "text-emerald-600"
											: saleData.totalProfit < 0
												? "text-red-600"
												: "text-slate-900"
									}`}
								>
									{saleData.totalProfit < 0 ? "-" : ""}
									{money(saleData.totalProfit)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}