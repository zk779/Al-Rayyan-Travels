"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { Trash2, Receipt, Calculator, MapPin, Eye, X } from "lucide-react";

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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../shadcn/components/ui/dialog";
import { Badge } from "../../shadcn/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* =========================
	COMPACT SELECT STYLES
========================= */
const compactSelectStyles = {
	control: (base, state) => ({
		...base,
		minHeight: 32,
		height: 32,
		borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
		boxShadow: 'none',
		fontSize: '13px',
	}),
	valueContainer: (base) => ({
		...base,
		height: 32,
		padding: '0 6px',
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
	NORMALIZE PAYLOAD (CRITICAL)
========================= */
const normalizeSalesPayload = (sales) =>
	sales.map((s) => ({
		id: s.id,
		airlineId: s.airlineId,
		vendorId: s.vendorId,
		documentNo: s.documentNo,
		netPrice: Number(s.netPrice || 0),
		sellPrice: Number(s.sellPrice || 0),
		paidAmount: Number(s.paidAmount || 0),
		paymentType: s.paymentType,
		customerId:
			String(s.paymentType).toUpperCase() === "CREDIT"
				? s.customerId || null
				: null,
		remarks: s.remarks || null,
		paxName: s.paxName || null, // ✅ MANDATORY
		destinations: s.destinations || [],
		vatAmount: Number(s.vatAmount || 0),
	}));

export default function EditSalesTab({ sales, setSales }) {
	/* =========================
		LOCAL UI STATE
	========================= */
	const [uiSales, setUiSales] = useState([]);
	const [destinationDialog, setDestinationDialog] = useState({ open: false, saleId: null });

	/* =========================
		INIT FROM PARENT (ONCE)
	========================= */
	useEffect(() => {
		if (uiSales.length === 0 && Array.isArray(sales) && sales.length > 0) {
			setUiSales(sales.map((s) => ({ ...s })));
		}
	}, [sales, uiSales.length]);

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
		[token]
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

			return fetch(`${API_BASE}/api/destinations/search?q=${encodeURIComponent(inputValue)}&limit=20`, { headers })
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
		[headers]
	);

	/* =========================
		LOOKUPS
	========================= */
	const vendorMap = useMemo(() => {
		const map = {};
		vendors.forEach((v) => (map[v.id] = v));
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
		UPDATE / DELETE
	========================= */
	const updateSale = (id, field, value) => {
		setUiSales((prev) => {
			const next = prev.map((item) => {
				if (item.id !== id) return item;

				// Vendor balance validation
				if (field === "netPrice") {
					const vendor = vendorMap[item.vendorId];
					const netValue = Number(value || 0);

					if (
						vendor &&
						String(vendor.category).toUpperCase() === "CREDIT"
					) {
						const balance = Number(vendor.account?.balance || 0);
						if (netValue > balance) {
							alert(
								`Insufficient vendor balance.\nAvailable: ${balance}`
							);
							return item;
						}
					}
				}

				// Paid amount constraint
				if (field === "paidAmount") {
					const sell = Number(item.sellPrice || 0);
					return {
						...item,
						paidAmount: Math.min(Number(value || 0), sell),
					};
				}

				// Payment type change logic
				if (field === "paymentType") {
					const isCredit = String(value).toUpperCase() === "CREDIT";
					return {
						...item,
						paymentType: value,
						customerId: isCredit ? item.customerId : "",
						paidAmount: isCredit ? item.paidAmount : item.sellPrice || "",
						// ✅ PAX name stays - it's independent
					};
				}

				// Recalculate VAT when net or sell price changes
				if (field === "netPrice" || field === "sellPrice") {
					const updatedItem = { ...item, [field]: value };
					const net = Number(updatedItem.netPrice) || 0;
					const sell = Number(updatedItem.sellPrice) || 0;
					const profit = sell - net;
					const vatAmount = calculateVAT(profit);
					
					return { ...updatedItem, vatAmount };
				}

				return { ...item, [field]: value };
			});

			setSales(normalizeSalesPayload(next));
			return next;
		});
	};

	const removeSale = (id) => {
		setUiSales((prev) => {
			const next = prev.filter((s) => s.id !== id);
			setSales(normalizeSalesPayload(next));
			return next;
		});
	};

	const removeDestination = (saleId, destValue) => {
		setUiSales((prev) => {
			const next = prev.map((item) => {
				if (item.id !== saleId) return item;
				return {
					...item,
					destinations: item.destinations.filter((d) => d.value !== destValue),
				};
			});
			setSales(normalizeSalesPayload(next));
			return next;
		});
	};

	/* =========================
		CALCULATIONS
	========================= */
	const calculateProfit = (net, sell) =>
		Number(sell || 0) - Number(net || 0);

	const totals = uiSales.reduce(
		(acc, s) => {
			acc.net += Number(s.netPrice || 0);
			acc.sell += Number(s.sellPrice || 0);
			acc.profit += calculateProfit(s.netPrice, s.sellPrice);
			acc.vat += Number(s.vatAmount || 0);
			return acc;
		},
		{ net: 0, sell: 0, profit: 0, vat: 0 }
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
		DESTINATION DIALOG
	========================= */
	const openDestinationDialog = (saleId) => {
		setDestinationDialog({ open: true, saleId });
	};

	const currentSaleForDialog = uiSales.find((s) => s.id === destinationDialog.saleId);

	/* =========================
		UI
	========================= */
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">Edit Sales Items</h3>

			{/* Sales Cards - 2 Row Layout */}
			<div className="space-y-3">
				{uiSales.map((item, index) => {
					const isCredit = String(item.paymentType).toUpperCase() === "CREDIT";
					const profit = calculateProfit(item.netPrice, item.sellPrice);

					return (
						<Card
							key={item.id}
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
										onClick={() => removeSale(item.id)}
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</div>
							</CardHeader>

							<CardContent className="space-y-3">
								{/* Row 1: Basic Information - Always 4 columns */}
								<div className="grid grid-cols-1 md:grid-cols-6 gap-3">
									{/* Airline */}
									<div className="space-y-1">
										<Label className="text-xs font-medium text-slate-600">
											Airline <span className="text-red-500">*</span>
										</Label>
										<Select
											options={airlineOptions}
											value={airlineOptions.find(
												(o) => o.value === item.airlineId
											)}
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
											Vendor <span className="text-red-500">*</span>
										</Label>
										<Select
											options={vendorOptions}
											value={vendorOptions.find(
												(o) => o.value === item.vendorId
											)}
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
											Document No <span className="text-red-500">*</span>
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

									{/* ✅ PAX Name - ALWAYS VISIBLE & MANDATORY */}
									<div className="space-y-1">
										<Label className="text-xs font-medium text-slate-600">
											Passenger Name <span className="text-red-500">*</span>
										</Label>
										<Input
											value={item.paxName || ""}
											onChange={(e) =>
												updateSale(item.id, "paxName", e.target.value)
											}
											placeholder="John Doe"
											className="h-8 text-sm"
										/>
									</div>

									{/* Destinations */}
									<div className="space-y-1">
										<Label className="text-xs font-medium text-slate-600">Destinations</Label>
										<div className="flex items-center gap-2">
											{item.destinations?.length > 0 ? (
												<div className="flex w-full gap-1">
													<Badge variant="secondary" className="w-3/4 text-xs px-2 py-1 h-8 flex items-center gap-1">
														<MapPin className="h-3 w-3" />
														{item.destinations.length} selected
													</Badge>
													<Button
														variant="outline"
														size="sm"
														onClick={() => openDestinationDialog(item.id)}
														className="w-1/4 h-8 px-2 text-xs"
														title="View/Edit Destinations"
													>
														<Eye className="h-3 w-3" />
													</Button>
												</div>
											) : (
												<Button
													variant="outline"
													size="sm"
													onClick={() => openDestinationDialog(item.id)}
													className="h-8 text-xs px-3 border-dashed w-full"
												>
													<MapPin className="h-3 w-3 mr-1.5" />
													Add Destinations
												</Button>
											)}
										</div>

									</div>
										{/* Payment Method */}
									<div className="space-y-1">
										<Label className="text-xs font-medium text-slate-600">
											Payment <span className="text-red-500">*</span>
										</Label>
										<Select
											options={paymentOptions}
											value={paymentOptions.find(
												(p) =>
													p.value ===
													String(item.paymentType).toUpperCase()
											)}
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
								<div className={`grid grid-cols-2 ${isCredit ? "md:grid-cols-7" : "md:grid-cols-6"} gap-3`}>

									{/* ✅ Customer (Only for CREDIT) - Corporate Customer */}
									{isCredit && (
										<div className="space-y-1">
											<Label className="text-xs font-medium text-slate-600">
												Customer <span className="text-red-500">*</span>
											</Label>
											<Select
												options={customerOptions}
												value={customerOptions.find(
													(o) => o.value === item.customerId
												)}
												onChange={(o) =>
													updateSale(item.id, "customerId", o?.value)
												}
												placeholder="Select"
												menuPortalTarget={document.body}
												styles={compactSelectStyles}
											/>
										</div>
									)}

									{/* Net Price */}
									<div className="space-y-1">
										<Label className="text-xs font-medium text-slate-600">Net ($)</Label>
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
										<Label className="text-xs font-medium text-slate-600">Sell ($)</Label>
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
										<Label className="text-xs font-medium text-slate-600">Paid ($)</Label>
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
										<Label className="text-xs font-medium text-green-700">Profit ($)</Label>
										<div className="flex items-center gap-1 px-2 h-8 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-700">
											<Calculator className="h-3 w-3" />
											${profit.toFixed(2)}
										</div>
									</div>

									{/* VAT (Read-only) */}
									<div className="space-y-1">
										<Label className="text-xs font-medium text-blue-700">VAT 15% ($)</Label>
										<Input
											type="text"
											value={`$${Number(item.vatAmount || 0).toFixed(2)}`}
											readOnly
											className="h-8 text-sm bg-blue-50 border-blue-200 font-semibold text-blue-700 cursor-not-allowed"
										/>
									</div>

									{/* Remarks */}
									<div className="space-y-1 md:col-span-2 lg:col-span-1">
										<Label className="text-xs font-medium text-slate-600">Remarks</Label>
										<Input
											value={item.remarks || ""}
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

			{/* Summary Section */}
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
							<div className="text-sm text-slate-600 mb-1 font-medium">Total Items</div>
							<div className="text-3xl font-bold text-slate-800">{uiSales.length}</div>
						</div>

						{/* Net Total */}
						<div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
							<div className="text-sm text-blue-600 mb-1 font-medium">Net Total</div>
							<div className="text-3xl font-bold text-blue-700">${totals.net.toFixed(2)}</div>
						</div>

						{/* Sell Total */}
						<div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
							<div className="text-sm text-purple-600 mb-1 font-medium">Sell Total</div>
							<div className="text-3xl font-bold text-purple-700">${totals.sell.toFixed(2)}</div>
						</div>

						{/* Total Profit */}
						<div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
							<div className="text-sm text-green-600 mb-1 font-medium">Total Profit</div>
							<div className="text-3xl font-bold text-green-700">${totals.profit.toFixed(2)}</div>
						</div>

						{/* Total VAT */}
						<div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
							<div className="text-sm text-indigo-600 mb-1 font-medium">Total VAT (15%)</div>
							<div className="text-3xl font-bold text-indigo-700">${totals.vat.toFixed(2)}</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Destination Management Dialog */}
			<Dialog open={destinationDialog.open} onOpenChange={(open) => setDestinationDialog({ open, saleId: null })}>
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
											updateSale(
												currentSaleForDialog.id,
												"destinations",
												[...(currentSaleForDialog.destinations || []), selected]
											);
										}
									}}
									placeholder="Type to search (e.g., LHR, Dubai, New York)..."
									className="text-sm"
									menuPortalTarget={document.body}
									styles={{
										control: (base, state) => ({
											...base,
											minHeight: 40,
											borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
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
								<Label className="text-sm font-semibold">Selected Destinations ({currentSaleForDialog.destinations?.length || 0})</Label>
								{currentSaleForDialog.destinations?.length > 0 ? (
									<div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-slate-50">
										{currentSaleForDialog.destinations.map((dest, idx) => (
											<div
												key={`${dest.value}-${idx}`}
												className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-md hover:border-blue-300 transition-colors"
											>
												<div className="flex items-center gap-2">
													<MapPin className="h-4 w-4 text-blue-600" />
													<span className="text-sm font-medium">{dest.label}</span>
												</div>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeDestination(currentSaleForDialog.id, dest.value)}
													className="h-7 w-7 p-0 hover:bg-red-50 text-red-500"
												>
													<X className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-lg">
										No destinations added yet. Use the search above to add destinations.
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