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
	DollarSign,
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
} from "lucide-react";
import { format } from "date-fns";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { cn } from "../../shadcn/lib/utils";
import { Calendar } from "../../shadcn/components/ui/calendar";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

const money = (n) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(Number(n || 0));

const entryBadge = (type) => {
	const colors = {
		OPENING_BALANCE: "bg-blue-100 text-blue-700 border-blue-300",
		SALE: "bg-green-100 text-green-700 border-green-300",
		PAYMENT: "bg-purple-100 text-purple-700 border-purple-300",
		REFUND: "bg-orange-100 text-orange-700 border-orange-300",
		EXPENSE: "bg-red-100 text-red-700 border-red-300",
	};

	const color = colors[type] || "bg-gray-100 text-gray-700 border-gray-300";

	return (
		<Badge 
			variant="outline" 
			className={cn("whitespace-nowrap text-xs font-semibold border", color)}
		>
			{type.replaceAll("_", " ")}
		</Badge>
	);
};

const accountTypeIcon = (type) => {
	const icons = {
		VENDOR: <Building2 className="w-5 h-5 text-blue-600" />,
		CUSTOMER: <Users className="w-5 h-5 text-green-600" />,
		EXPENSE: <CreditCard className="w-5 h-5 text-red-600" />,
		CASH: <Wallet className="w-5 h-5 text-amber-600" />,
		BANK: <Building2 className="w-5 h-5 text-purple-600" />,
	};
	return icons[type] || <FileText className="w-5 h-5 text-gray-600" />;
};

/* ======================= COMPONENT ======================= */

export default function LedgerComponent() {
	const [entries, setEntries] = useState([]);
	const [vendors, setVendors] = useState([]);
	const [customers, setCustomers] = useState([]);

	const [accountType, setAccountType] = useState("VENDOR");
	const [entryType, setEntryType] = useState("ALL");
	const [selectedVendorId, setSelectedVendorId] = useState("all");
	const [selectedCustomerId, setSelectedCustomerId] = useState("all");

	const [dateRange, setDateRange] = useState(() => {
		const now = new Date();
		return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
	});

	const [page, setPage] = useState(1);
	const [limit] = useState(50);
	const [total, setTotal] = useState(0);

	const [isLoading, setIsLoading] = useState(false);

	/* ======================= LOAD MASTER DATA ======================= */

	useEffect(() => {
		apiRequest("/api/vendors").then((r) => setVendors(r.data || [])).catch(console.error);
		apiRequest("/api/customers").then((r) => setCustomers(r.data || [])).catch(console.error);
	}, []);

	/* ======================= FETCH LEDGER ======================= */

	const fetchLedger = useCallback(async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("accountType", accountType);
			params.set("page", page);
			params.set("limit", limit);

			if (entryType !== "ALL") params.set("entryType", entryType);

			if (accountType === "VENDOR" && selectedVendorId !== "all") {
				params.set("vendorId", selectedVendorId);
			}

			if (accountType === "CUSTOMER" && selectedCustomerId !== "all") {
				params.set("customerId", selectedCustomerId);
			}

			if (dateRange?.from) params.set("from", dateRange.from.toISOString());
			if (dateRange?.to) params.set("to", dateRange.to.toISOString());

			const res = await apiRequest(`/api/ledger?${params.toString()}`);
			setEntries(res.data || []);
			setTotal(res.meta?.total || 0);
		} catch (e) {
			console.error(e);
			alert(e.message);
		} finally {
			setIsLoading(false);
		}
	}, [
		accountType,
		entryType,
		selectedVendorId,
		selectedCustomerId,
		dateRange,
		page,
		limit,
	]);

	useEffect(() => {
		fetchLedger();
	}, [fetchLedger]);

	/* ======================= CALCULATIONS ======================= */

	const totals = useMemo(() => {
		return entries.reduce(
			(acc, e) => {
				acc.credit += Number(e.credit || 0);
				acc.debit += Number(e.debit || 0);
				return acc;
			},
			{ credit: 0, debit: 0 }
		);
	}, [entries]);

	const netBalance = totals.credit - totals.debit;
	const isPositive = netBalance >= 0;

	/* ======================= CLEAR FILTERS ======================= */

	const clearFilters = () => {
		setAccountType("VENDOR");
		setEntryType("ALL");
		setSelectedVendorId("all");
		setSelectedCustomerId("all");
		const now = new Date();
		setDateRange({ from: new Date(now.getFullYear(), now.getMonth(), 1), to: now });
		setPage(1);
	};

	const hasActiveFilters = 
		accountType !== "VENDOR" || 
		entryType !== "ALL" || 
		selectedVendorId !== "all" || 
		selectedCustomerId !== "all";

	/* ======================= EXPORT ======================= */

	const exportCSV = () => {
		const rows = [
			[
				"Date",
				"Account",
				"Account Type",
				"Entry Type",
				"Debit",
				"Credit",
				"Balance After",
			],
			...entries.map((e) => [
				format(new Date(e.transactionDate), "yyyy-MM-dd"),
				e.account?.name || "-",
				e.account?.type || "-",
				e.entryType,
				e.debit || "",
				e.credit || "",
				e.balanceAfter ?? "",
			]),
		];

		const csv = rows.map((r) => r.join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `ledger_${format(new Date(), "yyyy-MM-dd")}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	/* ======================= UI ======================= */

	return (
		<div className="p-4 md:p-2 min-h-screen">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<div className="bg-gradient-to-r from-slate-700 to-slate-900 p-3 rounded-xl">
							<BookOpen className="w-8 h-8 text-white" />
						</div>
						<div>
							<h1 className="text-3xl md:text-4xl font-bold text-gray-900">Business Ledger</h1>
							<p className="text-gray-600 mt-1">
								Unified financial ledger for all accounts
							</p>
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<Button 
						variant="outline" 
						onClick={fetchLedger}
						className="hover:bg-blue-50 hover:border-blue-300"
					>
						<RefreshCw
							className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
						/>
						Refresh
					</Button>
					<Button 
						onClick={exportCSV}
						className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
					>
						<Download className="w-4 h-4 mr-2" /> Export CSV
					</Button>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<Card className="shadow-xl border-l-4 border-l-green-500 hover:shadow-2xl transition-shadow">
					<CardContent className="pt-6">
						<div className="flex justify-between items-start mb-4">
							<div>
								<p className="text-sm text-gray-600 font-medium mb-1">Total Credit</p>
								<div className="text-3xl font-bold text-green-600">
									{money(totals.credit)}
								</div>
							</div>
							<div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl">
								<TrendingUp className="w-7 h-7 text-white" />
							</div>
						</div>
						<div className="flex items-center gap-2 text-sm text-green-700">
							<ArrowUpRight className="w-4 h-4" />
							<span className="font-medium">Money In</span>
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-xl border-l-4 border-l-red-500 hover:shadow-2xl transition-shadow">
					<CardContent className="pt-6">
						<div className="flex justify-between items-start mb-4">
							<div>
								<p className="text-sm text-gray-600 font-medium mb-1">Total Debit</p>
								<div className="text-3xl font-bold text-red-600">
									{money(totals.debit)}
								</div>
							</div>
							<div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl">
								<TrendingDown className="w-7 h-7 text-white" />
							</div>
						</div>
						<div className="flex items-center gap-2 text-sm text-red-700">
							<ArrowDownRight className="w-4 h-4" />
							<span className="font-medium">Money Out</span>
						</div>
					</CardContent>
				</Card>

				<Card className={cn(
					"shadow-xl border-l-4 hover:shadow-2xl transition-shadow",
					isPositive ? "border-l-blue-500" : "border-l-orange-500"
				)}>
					<CardContent className="pt-6">
						<div className="flex justify-between items-start mb-4">
							<div>
								<p className="text-sm text-gray-600 font-medium mb-1">Net Balance</p>
								<div className={cn(
									"text-3xl font-bold",
									isPositive ? "text-blue-600" : "text-orange-600"
								)}>
									{money(netBalance)}
								</div>
							</div>
							<div className={cn(
								"p-4 rounded-xl bg-gradient-to-br",
								isPositive ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600"
							)}>
								<DollarSign className="w-7 h-7 text-white" />
							</div>
						</div>
						<div className={cn(
							"flex items-center gap-2 text-sm font-medium",
							isPositive ? "text-blue-700" : "text-orange-700"
						)}>
							<BarChart3 className="w-4 h-4" />
							<span>{isPositive ? "Surplus" : "Deficit"}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card className="shadow-xl mb-8">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg">
								<Filter className="h-5 w-5 text-white" />
							</div>
							<div>
								<CardTitle>Filters & Options</CardTitle>
								<CardDescription className="mt-1">
									Filter ledger entries by account type, entry type, and date range
								</CardDescription>
							</div>
						</div>
						{hasActiveFilters && (
							<Button 
								variant="outline" 
								size="sm"
								onClick={clearFilters}
								className="text-red-600 hover:bg-red-50 hover:text-red-700"
							>
								<X className="w-4 h-4 mr-2" />
								Clear Filters
							</Button>
						)}
					</div>
				</CardHeader>

				<CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
					{/* Account Type */}
					<div>
						<label className="text-sm font-semibold text-gray-700 mb-2 block">
							Account Type
						</label>
						<Select
							value={accountType}
							onValueChange={(v) => {
								setAccountType(v);
								setSelectedVendorId("all");
								setSelectedCustomerId("all");
								setPage(1);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Account Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="VENDOR">
									<div className="flex items-center gap-2">
										<Building2 className="w-4 h-4" />
										Vendor
									</div>
								</SelectItem>
								<SelectItem value="CUSTOMER">
									<div className="flex items-center gap-2">
										<Users className="w-4 h-4" />
										Customer
									</div>
								</SelectItem>
								<SelectItem value="EXPENSE">
									<div className="flex items-center gap-2">
										<CreditCard className="w-4 h-4" />
										Expense
									</div>
								</SelectItem>
								<SelectItem value="CASH">
									<div className="flex items-center gap-2">
										<Wallet className="w-4 h-4" />
										Cash
									</div>
								</SelectItem>
								<SelectItem value="BANK">
									<div className="flex items-center gap-2">
										<Building2 className="w-4 h-4" />
										Bank
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Entry Type */}
					<div>
						<label className="text-sm font-semibold text-gray-700 mb-2 block">
							Entry Type
						</label>
						<Select value={entryType} onValueChange={setEntryType}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Entry Type" />
							</SelectTrigger>
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

					{/* Vendor / Customer */}
					{accountType === "VENDOR" && (
						<div>
							<label className="text-sm font-semibold text-gray-700 mb-2 block">
								Select Vendor
							</label>
							<Select
								value={selectedVendorId}
								onValueChange={setSelectedVendorId}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Supplier" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Vendors</SelectItem>
									{vendors.map((v) => (
										<SelectItem key={v.id} value={v.id}>
											{v.vendorName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{accountType === "CUSTOMER" && (
						<div>
							<label className="text-sm font-semibold text-gray-700 mb-2 block">
								Select Customer
							</label>
							<Select
								value={selectedCustomerId}
								onValueChange={setSelectedCustomerId}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Customer" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Customers</SelectItem>
									{customers.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.customerName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Date Range */}
					<div className={cn(accountType === "VENDOR" || accountType === "CUSTOMER" ? "lg:col-span-2" : "lg:col-span-3")}>
						<label className="text-sm font-semibold text-gray-700 mb-2 block">
							Date Range
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start">
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateRange?.from && dateRange?.to ? (
										<>
											{format(dateRange.from, "MMM dd, yyyy")} -{" "}
											{format(dateRange.to, "MMM dd, yyyy")}
										</>
									) : (
										"Select date range"
									)}
								</Button>
							</PopoverTrigger>

							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									initialFocus
									mode="range"
									defaultMonth={dateRange?.from}
									selected={dateRange}
									onSelect={setDateRange}
									numberOfMonths={2}
								/>
							</PopoverContent>
						</Popover>
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<Card className="shadow-xl">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl">Ledger Entries</CardTitle>
							<CardDescription className="mt-1 text-base">
								Showing {entries.length} of {total} total records
							</CardDescription>
						</div>
						{entries.length > 0 && (
							<Badge variant="outline" className="text-base px-4 py-2">
								{total} Total Entries
							</Badge>
						)}
					</div>
				</CardHeader>

				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-gray-50">
									<TableHead className="font-bold">Date</TableHead>
									<TableHead className="font-bold">Account</TableHead>
									<TableHead className="font-bold">Type</TableHead>
									<TableHead className="font-bold">Entry</TableHead>
									<TableHead className="text-right font-bold">Debit</TableHead>
									<TableHead className="text-right font-bold">Credit</TableHead>
									<TableHead className="text-right font-bold">Balance</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-16">
											<div className="flex flex-col items-center gap-3">
												<RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
												<p className="text-gray-600 font-medium">Loading ledger entries...</p>
											</div>
										</TableCell>
									</TableRow>
								) : entries.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-16">
											<div className="flex flex-col items-center gap-3">
												<BookOpen className="w-12 h-12 text-gray-300" />
												<p className="text-gray-600 font-medium text-lg">No ledger entries found</p>
												<p className="text-gray-400 text-sm">Try adjusting your filters</p>
											</div>
										</TableCell>
									</TableRow>
								) : (
									entries.map((e) => (
										<TableRow key={e.id} className="hover:bg-blue-50 transition-colors">
											<TableCell className="font-medium">
												<div className="flex items-center gap-2">
													<CalendarIcon className="w-4 h-4 text-gray-500" />
													{format(new Date(e.transactionDate), "MMM dd, yyyy")}
												</div>
											</TableCell>
											<TableCell>
												<div className="font-semibold text-gray-900">
													{e.account?.name || "-"}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													{accountTypeIcon(e.account?.type)}
													<span className="font-medium">{e.account?.type}</span>
												</div>
											</TableCell>
											<TableCell>{entryBadge(e.entryType)}</TableCell>
											<TableCell className="text-right">
												{e.debit ? (
													<span className="font-bold text-red-600 text-base">
														{money(e.debit)}
													</span>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												{e.credit ? (
													<span className="font-bold text-green-600 text-base">
														{money(e.credit)}
													</span>
												) : (
													<span className="text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												<span className="font-bold text-blue-600 text-base">
													{money(e.balanceAfter)}
												</span>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination Info */}
					{entries.length > 0 && (
						<div className="mt-6 pt-4 border-t flex justify-between items-center">
							<p className="text-sm text-gray-600">
								Showing <span className="font-semibold">{entries.length}</span> entries
							</p>
							<p className="text-sm text-gray-500">
								Page {page} • Total {total} records
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
