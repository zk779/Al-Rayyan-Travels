"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import {
	Plus,
	Trash2,
	Receipt,
	Calculator,
	CalendarIcon,
	MapPin,
	X,
	Eye,
} from "lucide-react";
import { format } from "date-fns";

// shadcn
import { Button } from "../../shadcn/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../shadcn/components/ui/dialog";
import { Badge } from "../../shadcn/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function SalesTabComponent({ sales, setSales }) {
	/* =========================
	LOCAL STATE
	========================= */
		const [date, setDate] = useState(new Date());
		const [uiSales, setUiSales] = useState([]);
		const [destinationDialog, setDestinationDialog] = useState({
			open: false,
			saleId: null,
		});

		/* =========================
		HELPERS
	========================= */
		const emptyRow = () => ({
			id: crypto.randomUUID(),
			airlineId: "",
			documentNo: "",
			vendorId: "",
			customerId: "",
			netPrice: "",
			sellPrice: "",
			paidAmount: "",
			paymentType: "",
			remarks: "",
			paxName: "",
			destinations: [],
			vatAmount: "",
		});

		const isEmptySale = (s) => {
			return (
				!s.airlineId &&
				!s.documentNo &&
				!s.vendorId &&
				!s.customerId &&
				!s.netPrice &&
				!s.sellPrice &&
				!s.paidAmount &&
				!s.paymentType &&
				!s.remarks &&
				!s.paxName &&
				(!s.destinations || s.destinations.length === 0)
			);
		};

		/* =========================
		INIT UI FROM PARENT
	========================= */
		useEffect(() => {
			if (Array.isArray(sales) && sales.length > 0) {
				const withIds = sales.map((s) => ({
					...emptyRow(),
					...s,
					id: s.id || crypto.randomUUID(),
				}));
				setUiSales(withIds);
			} else {
				setUiSales([emptyRow()]);
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		/* =========================
		MASTER DATA
	========================= */
		const [airlines, setAirlines] = useState([]);
		const [vendors, setVendors] = useState([]);
		const [customers, setCustomers] = useState([]);

		const token = localStorage.getItem("token");

		const headers = useMemo(
			() => ({
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			}),
			[token],
		);

		useEffect(() => {
			fetch(`${API_BASE}/api/airlines`, { headers })
				.then((r) => r.json())
				.then((j) => setAirlines(j.data || []));

			fetch(`${API_BASE}/api/vendors`, { headers })
				.then((r) => r.json())
				.then((j) => setVendors(j.data || []));

			fetch(`${API_BASE}/api/customers?isActive=true`, { headers })
				.then((r) => r.json())
				.then((j) => setCustomers(j.data || []));
		}, [headers]);

		/* =========================
		DESTINATIONS ASYNC SEARCH
	========================= */
		const loadDestinationOptions = useCallback(
			(inputValue) => {
				if (!inputValue || inputValue.length < 2) {
					return Promise.resolve([]);
				}

				return fetch(
					`${API_BASE}/api/destinations/search?q=${encodeURIComponent(inputValue)}&limit=20`,
					{ headers },
				)
					.then((r) => r.json())
					.then((j) => {
						if (j.success && j.data) {
							return j.data.map((airport) => ({
								value: airport.iata,
								label: `${airport.iata} - ${airport.city}, ${airport.country}`,
								airport,
							}));
						}
						return [];
					})
					.catch((err) => {
						console.error("Failed to fetch destinations:", err);
						return [];
					});
			},
			[headers],
		);

		/* =========================
		VENDOR LOOKUP
	========================= */
		const vendorMap = useMemo(() => {
			const map = {};
			vendors.forEach((v) => {
				map[v.id] = v;
			});
			return map;
		}, [vendors]);

		/* =========================
		VAT CALCULATION HELPER
	========================= */
		const calculateVAT = (profit) => {
			const profitNum = Number(profit) || 0;
			if (profitNum <= 0) return "0.00";

			const baseAmount = profitNum / 1.15;
			const vatAmount = baseAmount * 0.15;

			return vatAmount.toFixed(2);
		};

		/* =========================
		SYNC PAYLOAD SALES
	========================= */
		useEffect(() => {
			const cleanedSales = uiSales.filter((s) => !isEmptySale(s));
			setSales(cleanedSales);
		}, [uiSales, setSales]);

		/* =========================
		ROW HANDLING
	========================= */
		const addSaleRow = useCallback(() => {
			const newRow = emptyRow();
			setUiSales((prev) => [...prev, newRow]);

			setTimeout(() => {
				const firstInput = document.querySelector(
					`[data-row-id="${newRow.id}"] input`,
				);
				if (firstInput) {
					firstInput.focus();
				}
			}, 100);
		}, []);

		const removeSaleRow = (id) => {
			setUiSales((prev) => {
				const next = prev.filter((s) => s.id !== id);
				return next.length === 0 ? [emptyRow()] : next;
			});
		};

		const updateSale = (id, field, value) => {
			setUiSales((prev) =>
				prev.map((item) => {
					if (item.id !== id) return item;

					if (field === "netPrice") {
						const vendor = vendorMap[item.vendorId];
						const netValue = Number(value || 0);

						if (vendor && String(vendor.category).toUpperCase() === "CREDIT") {
							const balance = Number(vendor.account?.balance || 0);
							if (netValue > balance) {
								alert(
									`Insufficient vendor balance.\n\nAvailable: ${balance}\nEntered: ${netValue}`,
								);
								return item;
							}
						}
					}

					if (field === "paymentType") {
						const isCredit = String(value).toUpperCase() === "CREDIT";
						return {
							...item,
							paymentType: value,
							customerId: isCredit ? item.customerId : "",
							paidAmount: isCredit ? item.paidAmount : item.sellPrice || "",
							paxName: isCredit ? "" : item.paxName, // ✅ Clear PAX name when switching to CREDIT
						};
					}

					if (field === "paidAmount") {
						const sell = Number(item.sellPrice || 0);
						return { ...item, paidAmount: Math.min(Number(value || 0), sell) };
					}

					if (field === "netPrice" || field === "sellPrice") {
						const updatedItem = { ...item, [field]: value };
						const net = Number(updatedItem.netPrice) || 0;
						const sell = Number(updatedItem.sellPrice) || 0;
						const profit = sell - net;
						const vatAmount = calculateVAT(profit);

						return { ...updatedItem, vatAmount };
					}

					return { ...item, [field]: value };
				}),
			);
		};

		const removeDestination = (saleId, destValue) => {
			setUiSales((prev) =>
				prev.map((item) => {
					if (item.id !== saleId) return item;
					return {
						...item,
						destinations: item.destinations.filter((d) => d.value !== destValue),
					};
				}),
			);
		};

		/* =========================
		KEYBOARD SHORTCUT (Alt+A)
	========================= */
useEffect(() => {
	const handleKeyDown = (e) => {
		const isMac = navigator.platform.toUpperCase().includes("MAC");

		if (
			(isMac && e.metaKey && e.key.toLowerCase() === "a") ||
			(!isMac && e.altKey && e.key.toLowerCase() === "a")
		) {
			e.preventDefault();
			addSaleRow();
		}
	};

	window.addEventListener("keydown", handleKeyDown);
	return () => window.removeEventListener("keydown", handleKeyDown);
}, [addSaleRow]);


	/* =========================
	CALCULATIONS
	========================= */
		const calculateProfit = (net, sell) =>
			net && sell ? (sell - net).toFixed(2) : "0.00";

		const totals = uiSales.reduce(
			(acc, item) => {
				const net = Number(item.netPrice) || 0;
				const sell = Number(item.sellPrice) || 0;
				const vat = Number(item.vatAmount) || 0;
				return {
					net: acc.net + net,
					sell: acc.sell + sell,
					profit: acc.profit + (sell - net),
					vat: acc.vat + vat,
				};
			},
			{ net: 0, sell: 0, profit: 0, vat: 0 },
		);

		/* =========================
		OPTIONS
	========================= */
		const airlineOptions = airlines.map((a) => ({
			value: a.id,
			label: `${a.airlineCode} - ${a.airlineName}`,
		}));

		const vendorOptions = vendors.map((v) => ({
			value: v.id,
			label: v.vendorName,
		}));

		const customerOptions = customers.map((c) => ({
			value: c.id,
			label: c.customerName,
		}));

		const paymentOptions = [
			{ value: "CASH", label: "Cash" },
			{ value: "CREDIT", label: "Credit" },
			{ value: "BANK_TRANSFER", label: "Bank Transfer" },
		];

		/* =========================
		COMPACT SELECT STYLES
	========================= */
		const compactSelectStyles = {
			control: (base, state) => ({
				...base,
				minHeight: 32,
				height: 32,
				borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
				boxShadow: "none",
				fontSize: "13px",
			}),
			valueContainer: (base) => ({
				...base,
				height: 32,
				padding: "0 6px",
			}),
			input: (base) => ({
				...base,
				margin: 0,
				padding: 0,
			}),
			indicatorsContainer: (base) => ({
				...base,
				height: 32,
			}),
			menuPortal: (base) => ({ ...base, zIndex: 9999 }),
		};

		/* =========================
		DESTINATION DIALOG
	========================= */
		const openDestinationDialog = (saleId) => {
			setDestinationDialog({ open: true, saleId });
		};

		const currentSaleForDialog = uiSales.find(
			(s) => s.id === destinationDialog.saleId,
		);

		/* =========================
		UI
	========================= */
		return (
			<div className="space-y-4">
				{/* Date Picker */}
				<Card className="bg-slate-50 mb-2">
					<CardContent className="py-3">
						<div className="flex items-center gap-3">
							<Label className="text-sm font-medium whitespace-nowrap">
								Transaction Date:
							</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="justify-start text-left font-normal bg-white max-w-60 h-9"
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{format(date, "PPP")}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={date}
										onSelect={(d) => d && setDate(d)}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
					</CardContent>
				</Card>

				{/* Header */}
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">Sales Items</h3>
					<Button
						onClick={addSaleRow}
						className="flex items-center gap-2 bg-gradient-primary text-white"
					>
						<Plus className="h-4 w-4" />
						Add New Sale <span className="text-xs opacity-80">(Alt+A)</span>
					</Button>
				</div>

				{/* Sales Cards - 2 Row Layout */}
				<div className="space-y-3">
					{uiSales.map((item, index) => {
						const isCredit = String(item.paymentType).toUpperCase() === "CREDIT";
						const showPaxName = !isCredit; // show by default, hide only for CREDIT

						const profit = calculateProfit(item.netPrice, item.sellPrice);

						return (
							<Card
								key={item.id}
								data-row-id={item.id}
								className="border-l-4 border-l-gray-500 shadow-sm"
							>
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<CardTitle className="text-base flex items-center gap-2">
											<Receipt className="h-4 w-4" />
											Sale #{index + 1}
										</CardTitle>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => removeSaleRow(item.id)}
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</div>
								</CardHeader>

								<CardContent className="space-y-3">
									{/* Row 1: Basic Information */}
									<div
										className={`grid grid-cols-1 md:grid-cols-5 gap-3`}
									>
										{/* Airline */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Airline *
											</Label>
											<Select
												options={airlineOptions}
												value={
													airlineOptions.find(
														(o) => o.value === item.airlineId,
													) || null
												}
												onChange={(o) =>
													updateSale(item.id, "airlineId", o?.value)
												}
												placeholder="Select airline"
												menuPortalTarget={document.body}
												styles={compactSelectStyles}
											/>
										</div>
										{/* Vendor */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Vendor *
											</Label>
											<Select
												options={vendorOptions}
												value={
													vendorOptions.find((o) => o.value === item.vendorId) ||
													null
												}
												onChange={(o) =>
													updateSale(item.id, "vendorId", o?.value)
												}
												placeholder="Select"
												menuPortalTarget={document.body}
												styles={compactSelectStyles}
											/>
										</div>

										{/* Document Number */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Document No *
											</Label>
											<Input
												value={item.documentNo}
												onChange={(e) =>
													updateSale(item.id, "documentNo", e.target.value)
												}
												placeholder="e.g. 123"
												className="h-8 text-sm"
											/>
										</div>



										{/* Destinations */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Destinations
											</Label>
											<div className="flex items-center gap-2">
												{item.destinations?.length > 0 ? (
													<>
														<div className="flex gap-2 w-full">
															<Badge
																variant="secondary"
																size="sm"
																className="text-xs px-2 w-2/3 py-1 h-8 flex items-center gap-1"
																>
																<MapPin className="h-3 w-3" />
																{item.destinations.length} selected
															</Badge>
															<Button
																variant="outline"
																size="xs"
																onClick={() => openDestinationDialog(item.id)}
																className="h-8 px-2 w-1/3 text-xs"
																title="View/Edit Destinations"
															>
																<Eye className="h-3 w-3" />
															</Button>
														</div>
													</>
												) : (
													<Button
														variant="outline"
														size="xs"
														onClick={() => openDestinationDialog(item.id)}
														className="h-8 text-xs px-3 border-dashed w-full"
													>
														<Plus className="h-3 w-3 mr-1.5" />
														Add Destinations
														<MapPin className="h-3 w-3 mr-1.5" />
													</Button>
												)}
											</div>
										</div>
											{/* Payment Method */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Payment *
											</Label>
											<Select
												options={paymentOptions}
												value={
													item.paymentType
														? paymentOptions.find(
															(p) =>
																p.value ===
																String(item.paymentType).toUpperCase(),
															) || null
														: null
												}
												onChange={(o) =>
													updateSale(item.id, "paymentType", o?.value)
												}
												placeholder="Method"
												menuPortalTarget={document.body}
												styles={compactSelectStyles}
											/>
										</div>
									</div>

									{/* Row 2: Financial Information */}
									<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">




										{/* Customer (Only for CREDIT) */}
										{isCredit && (
											<div className="space-y-1">
												<Label className="text-xs font-medium text-slate-600">
													Customer *
												</Label>
												<Select
													options={customerOptions}
													value={
														customerOptions.find(
															(o) => o.value === item.customerId,
														) || null
													}
													onChange={(o) =>
														updateSale(item.id, "customerId", o?.value)
													}
													placeholder="Select"
													menuPortalTarget={document.body}
													styles={compactSelectStyles}
												/>
											</div>
										)}
										{/* PAX Name - Only for CASH or BANK_TRANSFER */}
										{showPaxName && (
											<div className="space-y-1">
												<Label className="text-xs font-medium text-slate-600">
													Passenger Name
												</Label>
												<Input
													value={item.paxName}
													onChange={(e) =>
														updateSale(item.id, "paxName", e.target.value)
													}
													placeholder="John Doe"
													className="h-8 text-sm"
												/>
											</div>
										)}

										{/* Net Price */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Net ($)
											</Label>
											<Input
												type="number"
												value={item.netPrice}
												onChange={(e) =>
													updateSale(item.id, "netPrice", e.target.value)
												}
												placeholder="0.00"
												className="h-8 text-sm"
											/>
										</div>

										{/* Sell Price */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Sell ($)
											</Label>
											<Input
												type="number"
												value={item.sellPrice}
												onChange={(e) =>
													updateSale(item.id, "sellPrice", e.target.value)
												}
												placeholder="0.00"
												className="h-8 text-sm"
											/>
										</div>

										{/* Paid Amount */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Paid ($)
											</Label>
											<Input
												type="number"
												value={item.paidAmount}
												onChange={(e) =>
													updateSale(item.id, "paidAmount", e.target.value)
												}
												placeholder="0.00"
												className="h-8 text-sm"
											/>
										</div>

										{/* Profit (Read-only) */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-green-700">
												Profit ($)
											</Label>
											<div className="flex items-center gap-1 px-2 h-8 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-700">
												<Calculator className="h-3 w-3" />${profit}
											</div>
										</div>

										{/* VAT (Read-only) */}
										<div className="space-y-1">
											<Label className="text-xs font-medium text-blue-700">
												VAT 15% ($)
											</Label>
											<Input
												type="text"
												value={`$${item.vatAmount || "0.00"}`}
												readOnly
												className="h-8 text-sm bg-blue-50 border-blue-200 font-semibold text-blue-700 cursor-not-allowed"
											/>
										</div>

										{/* Remarks */}
										<div className="space-y-1 md:col-span-2 lg:col-span-1">
											<Label className="text-xs font-medium text-slate-600">
												Remarks
											</Label>
											<Input
												value={item.remarks}
												onChange={(e) =>
													updateSale(item.id, "remarks", e.target.value)
												}
												placeholder="Note"
												className="h-8 text-sm"
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				{/* Summary Section - Improved */}
				<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-md">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg flex items-center gap-2 text-blue-800">
							<Calculator className="h-5 w-5" />
							Financial Summary
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
							{/* Total Items */}
							<div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
								<div className="text-sm text-slate-600 mb-1 font-medium">
									Total Items
								</div>
								<div className="text-3xl font-bold text-slate-800">
									{sales.length}
								</div>
							</div>

							{/* Net Total */}
							<div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
								<div className="text-sm text-blue-600 mb-1 font-medium">
									Net Total
								</div>
								<div className="text-3xl font-bold text-blue-700">
									${totals.net.toFixed(2)}
								</div>
							</div>

							{/* Sell Total */}
							<div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
								<div className="text-sm text-purple-600 mb-1 font-medium">
									Sell Total
								</div>
								<div className="text-3xl font-bold text-purple-700">
									${totals.sell.toFixed(2)}
								</div>
							</div>

							{/* Total Profit */}
							<div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
								<div className="text-sm text-green-600 mb-1 font-medium">
									Total Profit
								</div>
								<div className="text-3xl font-bold text-green-700">
									${totals.profit.toFixed(2)}
								</div>
							</div>

							{/* Total VAT */}
							<div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
								<div className="text-sm text-indigo-600 mb-1 font-medium">
									Total VAT (15%)
								</div>
								<div className="text-3xl font-bold text-indigo-700">
									${totals.vat.toFixed(2)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Destination Management Dialog */}
				<Dialog
					open={destinationDialog.open}
					onOpenChange={(open) => setDestinationDialog({ open, saleId: null })}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5 text-blue-600" />
								Manage Destinations
							</DialogTitle>
						</DialogHeader>

						{currentSaleForDialog && (
							<div className="space-y-4">
								{/* Add New Destination */}
								<div className="space-y-2">
									<Label className="text-sm font-semibold">Add Destination</Label>
									<AsyncSelect
										cacheOptions
										defaultOptions={false}
										loadOptions={loadDestinationOptions}
										value={null}
										onChange={(selected) => {
											if (selected) {
												updateSale(currentSaleForDialog.id, "destinations", [
													...(currentSaleForDialog.destinations || []),
													selected,
												]);
											}
										}}
										placeholder="Type to search (e.g., LHR, Dubai, New York)..."
										className="text-sm"
										menuPortalTarget={document.body}
										styles={{
											control: (base, state) => ({
												...base,
												minHeight: 40,
												borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
											}),
											menuPortal: (base) => ({ ...base, zIndex: 9999 }),
										}}
										noOptionsMessage={({ inputValue }) =>
											inputValue.length < 2
												? "Type at least 2 characters to search"
												: "No destinations found"
										}
									/>
								</div>

								{/* Current Destinations */}
								<div className="space-y-2">
									<Label className="text-sm font-semibold">
										Selected Destinations (
										{currentSaleForDialog.destinations?.length || 0})
									</Label>
									{currentSaleForDialog.destinations?.length > 0 ? (
										<div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-slate-50">
											{currentSaleForDialog.destinations.map((dest) => (
												<div
													key={dest.value}
													className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-md hover:border-blue-300 transition-colors"
												>
													<div className="flex items-center gap-2">
														<MapPin className="h-4 w-4 text-blue-600" />
														<span className="text-sm font-medium">
															{dest.label}
														</span>
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															removeDestination(
																currentSaleForDialog.id,
																dest.value,
															)
														}
														className="h-7 w-7 p-0 hover:bg-red-50 text-red-500"
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											))}
										</div>
									) : (
										<div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-lg">
											No destinations added yet. Use the search above to add
											destinations.
										</div>
									)}
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		);
}
