"use client";

import { format } from "date-fns";
import {
	MoreVertical,
	Eye,
	Edit,
	Trash2,
	Loader2,
	DollarSign,
	TrendingUp,
	FileText,
	CreditCard,
	SaudiRiyal,
	Printer,
} from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../shadcn/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../shadcn/components/ui/table";
import { Badge } from "../../../shadcn/components/ui/badge";
import { Button } from "../../../shadcn/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../shadcn/components/ui/dropdown-menu";

import { useNavigate } from "react-router-dom";


export default function DetailedReportTab({
	salesData,
	searchQuery,
	searchBy,
	loading,
	totalSales,
	totalProfit,
	onView,
	onEdit,
	onDelete,
}) {
	const highlightText = (text, query, field) => {
		if (!query || !text) return text;

		// Only highlight if searching in this specific field or searching all fields
		if (searchBy !== "all" && searchBy !== field) return text;

		const regex = new RegExp(`(${query})`, "gi");
		const parts = text.split(regex);

		return parts.map((part, index) =>
			regex.test(part) ? (
				<mark key={index} className="bg-yellow-200 px-1 rounded">
					{part}
				</mark>
			) : (
				part
			)
		);
	};

	const navigate = useNavigate();

	const handleEdit = (invoiceId) => {
		if (!invoiceId) return;

		navigate(`/edit-services/${invoiceId}`);
	};
	const GenerateInvoice = (id) => {
		if (!id) return;
		navigate(`/invoice-print/${id}`);
	};

	function truncateText(text, wordLimit) {
		if (!text) return "";
		const words = text.split(" ");
		if (words.length > wordLimit) {
			return words.slice(0, wordLimit).join(" ") + "...";
		}
		return text;
	}

	const getStatusBadge = (status) => {
		const statusMap = {
			COMPLETED: "bg-green-100 text-green-800 border-green-200",
			PAID: "bg-green-100 text-green-800 border-green-200",
			PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
			REFUNDED: "bg-red-100 text-red-800 border-red-200",
			CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
		};

		const className = statusMap[status?.toUpperCase()] || "bg-gray-100 text-gray-800 border-gray-200";

		return (
			<Badge variant="outline" className={className}>
				{status || "N/A"}
			</Badge>
		);
	};

	const getPaymentStatusBadge = (status) => {
		const statusMap = {
			PAID: "bg-emerald-600 text-white hover:bg-green-600",
			DUE: "bg-red-500 text-white hover:bg-red-600",
			PARTIAL: "bg-orange-400 text-white hover:bg-orange-600",
		};

		const className = statusMap[status?.toUpperCase()] || "bg-gray-500 text-white hover:bg-gray-600";

		return (
			<Badge className={className}>
				{status || "N/A"}
			</Badge>
		);
	};

	const getPaymentMethodBadge = (method) => {
		const methodMap = {
			CASH: "bg-green-50 text-green-700 border-green-200",
			CREDIT: "bg-blue-50 text-blue-700 border-blue-200",
			BANK_TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
		};

		const className = methodMap[method?.toUpperCase()] || "bg-gray-50 text-gray-700 border-gray-200";

		return (
			<Badge variant="outline" className={className}>
				{method || "N/A"}
			</Badge>
		);
	};

	console.log(salesData);

	if (loading) {
		return (
			<Card>
				<CardContent className="py-20">
					<div className="flex flex-col items-center justify-center gap-4">
						<Loader2 className="h-12 w-12 animate-spin text-blue-600" />
						<p className="text-gray-600 font-medium">Loading sales data...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Summary Cards */}


			{/* Transaction Details Table */}
			<Card>
				<CardHeader>
					<CardTitle>Transaction Details</CardTitle>
					<CardDescription>
						Complete list of all sales transactions
						{searchQuery && (
							<span className="ml-2 text-blue-600">
								• Showing {salesData.length} results for "{searchQuery}"
								{searchBy !== "all" &&
									` in ${searchBy.replace(/([A-Z])/g, " $1").toLowerCase()}`}
							</span>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{salesData.length === 0 ? (
						<div className="text-center py-12">
							<FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
							<p className="text-gray-600 font-medium">
								{searchQuery
									? `No transactions found for "${searchQuery}"`
									: "No transactions found"}
							</p>
							<p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-gray-50">
										<TableHead className="font-semibold">Date</TableHead>
										<TableHead className="font-semibold">Invoice #</TableHead>
										<TableHead className="font-semibold">Document #</TableHead>
										<TableHead className="font-semibold">Airline</TableHead>
										<TableHead className="font-semibold">Vendor</TableHead>
										<TableHead className="font-semibold">Customer</TableHead>
										<TableHead className="font-semibold">Agent</TableHead>
										<TableHead className="font-semibold">Payment Type</TableHead>
										<TableHead className="font-semibold">Pay Status</TableHead>
										{/* <TableHead className="font-semibold text-right">Net Price</TableHead> */}
										<TableHead className="font-semibold text-right">Sell Price</TableHead>
										{/* <TableHead className="font-semibold text-right">Profit</TableHead> */}
										<TableHead className="font-semibold">Status</TableHead>
										<TableHead className="font-semibold">Remarks</TableHead>
										<TableHead className="font-semibold text-center">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{salesData.map((sale) => {
										const isProfitable = (sale.profit || 0) >= 0;
										const isRefund = sale.isRefund;

										return (
											<TableRow key={sale.id} className="hover:bg-gray-50">
												<TableCell className="whitespace-nowrap">
													{sale.date
														? highlightText(
															format(new Date(sale.date), "MMM dd, yyyy"),
															searchQuery,
															"date"
														)
														: "N/A"}
												</TableCell>
												<TableCell className="font-mono text-sm">
													{highlightText(
														sale.invoiceNumber,
														searchQuery,
														"invoiceNumber"
													)}
												</TableCell>
												<TableCell className="font-mono text-sm">
													{highlightText(
														sale.documentNumber,
														searchQuery,
														"documentNumber"
													)}
												</TableCell>
												<TableCell>
													<Badge variant="secondary" className="bg-blue-50 text-blue-700">
														{sale.airline}
													</Badge>
												</TableCell>
												<TableCell className="max-w-[140px] truncate" title={sale.vendor}>
													{sale.vendor || "-"}
												</TableCell>
												<TableCell className={`max-w-[140px] truncate ${sale.customer ? 'text-blue-600' : 'text-emerald-600'}`} title={sale.customer}>
													{sale.customer ? sale.customer : "Walkin Customer"}
												</TableCell>
												<TableCell className="max-w-[120px] truncate" title={sale.agent}>
													{sale.agent}
												</TableCell>
												<TableCell>
													{getPaymentMethodBadge(sale.paymentMethod)}
												</TableCell>
												<TableCell>
													{getPaymentStatusBadge(sale.paymentStatus)}
												</TableCell>
												{/* <TableCell className={`text-right font-semibold ${(sale.netPrice || 0) < 0 ? 'text-red-600' : ''}`}>
													<div className="flex items-center justify-end gap-1">
														<SaudiRiyal size={15} />
														{sale.netPrice?.toFixed(2) || "0.00"}
													</div>
												</TableCell> */}
												<TableCell
													className={`text-right font-semibold ${isRefund || (sale.sellPrice || 0) < 0 ? 'text-red-600' : ''
														}`}
												>
													<div className="flex items-center justify-end gap-1">
														<SaudiRiyal size={15} />
														{isRefund
															? `-${sale.Refund.refundableAmount.toFixed(2)}`
															: sale.sellPrice?.toFixed(2) || '0.00'}
													</div>
												</TableCell>

												{/* <TableCell className={`text-right font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
		<div className="flex items-center justify-end gap-1">
			<SaudiRiyal size={15} />
			{sale.profit?.toFixed(2) || "0.00"}
		</div>
	</TableCell> */}
												<TableCell>
													<div className="flex flex-col gap-1">
														{getStatusBadge(sale.status)}
													</div>
												</TableCell>
												<TableCell className="max-w-[150px]">
													<div className="truncate" title={sale.remarks}>
														{highlightText(
															truncateText(sale.remarks || "", 3),
															searchQuery,
															"remarks"
														)}
													</div>
												</TableCell>
												<TableCell className="text-center">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
																<MoreVertical className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuLabel>Actions</DropdownMenuLabel>
															<DropdownMenuSeparator />
															<DropdownMenuItem onClick={() => onView?.(sale)}>
																<Eye className="mr-2 h-4 w-4" />
																View Details
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => handleEdit(sale.invoiceId)}>
																<Edit className="mr-2 h-4 w-4" />
																Edit Invoice
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem onClick={() => GenerateInvoice(sale.id)}>
																<Printer className="mr-2 h-4 w-4" />
																Generate Invoice
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() => onDelete?.(sale)}
																className="text-red-600 focus:text-red-600 focus:bg-red-50"
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
