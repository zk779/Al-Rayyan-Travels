"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Trash2, Receipt, Calculator } from "lucide-react";

// shadcn
import { Button } from "../../shadcn/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* =========================
	REACT-SELECT PORTAL STYLES
========================= */
const selectPortalStyles = {
	menuPortal: (base) => ({ ...base, zIndex: 9999 }),
	menu: (base) => ({ ...base, zIndex: 9999 }),
	control: (base) => ({
		...base,
		minHeight: 38,
		height: 38,
	}),
	valueContainer: (base) => ({
		...base,
		padding: "0 8px",
	}),
	indicatorsContainer: (base) => ({
		...base,
		height: 38,
	}),
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
	}));

export default function EditSalesTab({ sales, setSales }) {
	/* =========================
		LOCAL UI STATE
	========================= */
	const [uiSales, setUiSales] = useState([]);

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
	}, []);

	/* =========================
		LOOKUPS
	========================= */
	const vendorMap = useMemo(() => {
		const map = {};
		vendors.forEach((v) => (map[v.id] = v));
		return map;
	}, [vendors]);

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
			return acc;
		},
		{ net: 0, sell: 0, profit: 0 }
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
		UI
	========================= */
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Receipt className="h-4 w-4" />
						Edit Sales
					</CardTitle>
				</CardHeader>

				<CardContent className="overflow-x-auto">
					{uiSales.map((item) => {
						const isCredit =
							String(item.paymentType).toUpperCase() === "CREDIT";

						return (
							<table
								key={item.id}
								className="w-full table-auto border-separate border-spacing-0 text-sm mb-6"
							>
								<thead>
									<tr className="bg-gray-50 border-b">
										<th>Airline</th>
										<th>Doc</th>
										<th>Vendor</th>
										<th>Payment</th>
										{isCredit && <th>Customer</th>}
										<th>Net</th>
										<th>Sell</th>
										<th>Paid</th>
										<th>Profit</th>
										<th>Remarks</th>
										<th />
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<Select
												options={airlineOptions}
												value={airlineOptions.find(
													(o) => o.value === item.airlineId
												)}
												onChange={(o) =>
													updateSale(item.id, "airlineId", o?.value)
												}
												menuPortalTarget={document.body}
												styles={selectPortalStyles}
											/>
										</td>

										<td>
											<Input
												value={item.documentNo}
												onChange={(e) =>
													updateSale(item.id, "documentNo", e.target.value)
												}
											/>
										</td>

										<td>
											<Select
												options={vendorOptions}
												value={vendorOptions.find(
													(o) => o.value === item.vendorId
												)}
												onChange={(o) =>
													updateSale(item.id, "vendorId", o?.value)
												}
												menuPortalTarget={document.body}
												styles={selectPortalStyles}
											/>
										</td>

										<td>
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
												menuPortalTarget={document.body}
												styles={selectPortalStyles}
											/>
										</td>

										{isCredit && (
											<td>
												<Select
													options={customerOptions}
													value={customerOptions.find(
														(o) => o.value === item.customerId
													)}
													onChange={(o) =>
														updateSale(item.id, "customerId", o?.value)
													}
													menuPortalTarget={document.body}
													styles={{
														...selectPortalStyles,
														container: (base) => ({
															...base,
															minWidth: 200,
														}),
														menu: (base) => ({
															...base,
															width: 240,
														}),
													}}
												/>
											</td>
										)}

										<td>
											<Input
												type="number"
												value={item.netPrice}
												onChange={(e) =>
													updateSale(item.id, "netPrice", e.target.value)
												}
											/>
										</td>

										<td>
											<Input
												type="number"
												value={item.sellPrice}
												onChange={(e) =>
													updateSale(item.id, "sellPrice", e.target.value)
												}
											/>
										</td>

										<td>
											<Input
												type="number"
												value={item.paidAmount}
												onChange={(e) =>
													updateSale(item.id, "paidAmount", e.target.value)
												}
											/>
										</td>

										<td>
											<div className="flex items-center gap-1 px-2 py-2 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-700">
												<Calculator className="h-3 w-3" />$
												{calculateProfit(item.netPrice, item.sellPrice)}
											</div>
										</td>

										<td>
											<Input
												value={item.remarks || ""}
												onChange={(e) =>
													updateSale(item.id, "remarks", e.target.value)
												}
											/>
										</td>

										<td>
											<Button
												variant="ghost"
												onClick={() => removeSale(item.id)}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</td>
									</tr>
								</tbody>
							</table>
						);
					})}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="grid grid-cols-4 text-center">
					<div>
						<div className="text-xl font-bold">{uiSales.length}</div>
						<div className="text-sm">Items</div>
					</div>
					<div>
						<div className="text-xl font-bold">${totals.net}</div>
						<div className="text-sm">Net</div>
					</div>
					<div>
						<div className="text-xl font-bold">${totals.sell}</div>
						<div className="text-sm">Sell</div>
					</div>
					<div>
						<div className="text-xl font-bold text-green-600">
							${totals.profit}
						</div>
						<div className="text-sm">Profit</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
