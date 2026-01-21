import { format } from "date-fns";
import {
	X,
	Calendar,
	User,
	CreditCard,
	FileText,
	DollarSign,
	TrendingUp,
	Phone,
	Wallet,
	CheckCircle2,
	XCircle,
	AlertCircle,
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

	// Status badge variants
	const getStatusBadge = (status) => {
		const statusMap = {
			COMPLETED: { bg: "bg-green-500", icon: CheckCircle2 },
			PAID: { bg: "bg-green-500", icon: CheckCircle2 },
			PENDING: { bg: "bg-yellow-500", icon: AlertCircle },
			REFUNDED: { bg: "bg-red-500", icon: XCircle },
			CANCELLED: { bg: "bg-gray-500", icon: XCircle },
		};

		const config = statusMap[status?.toUpperCase()] || statusMap.PENDING;
		const Icon = config.icon;

		return (
			<span
				className={`${config.bg} text-white px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1`}
			>
				<Icon className="h-3 w-3" />
				{status || "N/A"}
			</span>
		);
	};

	const getPaymentTypeBadge = (type) => {
		const typeMap = {
			CASH: "bg-green-100 text-green-800 border-green-200",
			CREDIT: "bg-blue-100 text-blue-800 border-blue-200",
			BANK_TRANSFER: "bg-purple-100 text-purple-800 border-purple-200",
		};

		return (
			<span
				className={`px-3 py-1 rounded-full text-sm font-medium border ${typeMap[type?.toUpperCase()] || "bg-gray-100"}`}
			>
				{type || "N/A"}
			</span>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-full max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between text-2xl">
						<span className="flex items-center gap-2">
							<FileText className="h-6 w-6 text-blue-600" />
							Sale Details
						</span>
						{/* <button
				onClick={onClose}
				className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
			>
				<X className="h-5 w-5" />
			</button> */}
				</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Invoice Information */}
					<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<FileText className="h-5 w-5 text-blue-600" />
							Invoice Information
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							<div>
								<p className="text-sm text-gray-600">Invoice Number</p>
								<p className="font-semibold text-lg">{saleData.invoiceNo}</p>
							</div>
							<div>
								<p className="text-sm text-gray-600 flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									Sale Date
								</p>
								<p className="font-semibold">
									{saleData.saleDate
										? format(new Date(saleData.saleDate), "MMM dd, yyyy")
										: "N/A"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Total Items</p>
								<p className="font-semibold">{saleData.salesCount || 0}</p>
							</div>
						</div>
					</div>

					{/* Created By Information */}
					<div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<User className="h-5 w-5 text-gray-600" />
							Created By
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<p className="text-sm text-gray-600">Agent Name</p>
								<p className="font-semibold">
									{saleData.createdByName || "N/A"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Email</p>
								<p className="font-semibold text-sm">
									{saleData.createdByEmail || "N/A"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Created At</p>
								<p className="font-semibold text-sm">
									{saleData.createdAt
										? format(new Date(saleData.createdAt), "MMM dd, yyyy HH:mm")
										: "N/A"}
								</p>
							</div>
						</div>
					</div>

					<div className="border-t border-gray-200 my-4"></div>

					{/* Sale Details */}
					<div className="bg-white rounded-lg p-6 border-2 border-blue-200">
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<CreditCard className="h-5 w-5 text-blue-600" />
							Transaction Details
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Left Column */}
							<div className="space-y-4">
								<div>
									<p className="text-sm text-gray-600">Document Number</p>
									<p className="font-semibold text-lg">
										{sale.documentNo || "N/A"}
									</p>
								</div>

								<div>
									<p className="text-sm text-gray-600">Airline Code</p>
									<span className="inline-block text-base px-3 py-1 bg-blue-50 border border-blue-200 rounded-md font-medium">
										{sale.airlineCode || "N/A"}
									</span>
								</div>

								<div>
									<p className="text-sm text-gray-600">Vendor</p>
									<p className="font-semibold">{sale.vendorName || "N/A"}</p>
									{/* <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
										<Wallet className="h-3 w-3" />
										Balance: ${sale.vendorBalance?.toFixed(2) || "0.00"}
									</p> */}
								</div>

								<div>
									<p className="text-sm text-gray-600">Payment Type</p>
									<div className="mt-1">
										{getPaymentTypeBadge(sale.paymentType)}
									</div>
								</div>

								<div>
									<p className="text-sm text-gray-600">Payment Status</p>
									<div className="mt-1">
										{getStatusBadge(sale.paymentStatus)}
									</div>
								</div>

								<div>
									<p className="text-sm text-gray-600">Sale Status</p>
									<div className="mt-1">{getStatusBadge(sale.status)}</div>
								</div>
							</div>

							{/* Right Column */}
							<div className="space-y-4">
								{sale.customerId && (
									<div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
										<h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-900">
											<User className="h-4 w-4" />
											Customer Information
										</h4>
										<div className="space-y-2">
											<div>
												<p className="text-xs text-purple-600">Name</p>
												<p className="font-semibold text-sm">
													{sale.customerName || "N/A"}
												</p>
											</div>
											<div>
												<p className="text-xs text-purple-600 flex items-center gap-1">
													<Phone className="h-3 w-3" />
													Phone
												</p>
												<p className="font-semibold text-sm">
													{sale.customerPhone || "N/A"}
												</p>
											</div>
											{/* <div>
												<p className="text-xs text-purple-600 flex items-center gap-1">
													<Wallet className="h-3 w-3" />
													Balance
												</p>
												<p className="font-semibold text-sm">
													${sale.customerBalance?.toFixed(2) || "0.00"}
												</p>
											</div> */}
										</div>
									</div>
								)}

								{sale.isRefund && (
									<div className="bg-red-50 rounded-lg p-4 border border-red-200">
										<div className="flex items-center gap-2 text-red-700">
											<XCircle className="h-5 w-5" />
											<span className="font-semibold">This is a Refund</span>
										</div>
									</div>
								)}

								{sale.remarks && (
									<div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
										<p className="text-xs text-yellow-700 mb-1">Remarks</p>
										<p className="text-sm text-yellow-900 italic">
											{sale.remarks}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Financial Summary */}
					<div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<DollarSign className="h-5 w-5 text-green-600" />
							Financial Summary
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-2 gap-4">
							<div className="bg-white rounded-lg p-4 border border-green-100">
								<p className="text-sm text-gray-600 mb-1">Net Price</p>
								<p
									className={`text-2xl font-bold ${sale.netPrice < 0 ? "text-red-600" : "text-gray-900"}`}
								>
									${sale.netPrice?.toFixed(2) || "0.00"}
								</p>
							</div>
							<div className="bg-white rounded-lg p-4 border border-green-100">
								<p className="text-sm text-gray-600 mb-1">Sell Price</p>
								<p
									className={`text-2xl font-bold ${sale.sellPrice < 0 ? "text-red-600" : "text-gray-900"}`}
								>
									${sale.sellPrice?.toFixed(2) || "0.00"}
								</p>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
							<div className="bg-white rounded-lg p-4 border border-green-100">
								<p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
									<TrendingUp className="h-3 w-3" />
									Profit
								</p>
								<p
									className={`text-2xl font-bold ${
										sale.profit > 0
											? "text-green-600"
											: sale.profit < 0
												? "text-red-600"
												: "text-gray-900"
									}`}
								>
									${sale.profit?.toFixed(2) || "0.00"}
								</p>
							</div>
						</div>
					</div>

					{/* Invoice Totals */}
					<div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
						<h3 className="text-lg font-semibold mb-4">Invoice Totals</h3>
						<div className="grid grid-cols-3 gap-4">
							<div>
								<p className="text-sm text-gray-600">Total Net</p>
								<p className="text-xl font-bold">
									${saleData.totalNet?.toFixed(2) || "0.00"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Total Sell</p>
								<p className="text-xl font-bold">
									${saleData.totalSell?.toFixed(2) || "0.00"}
								</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Total Profit</p>
								<p
									className={`text-xl font-bold ${
										saleData.totalProfit > 0
											? "text-green-600"
											: saleData.totalProfit < 0
												? "text-red-600"
												: "text-gray-900"
									}`}
								>
									${saleData.totalProfit?.toFixed(2) || "0.00"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
