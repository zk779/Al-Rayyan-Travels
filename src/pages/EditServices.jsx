"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "../../shadcn/components/ui/card";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";

import EditSalesTab from "../components/EditSaleTab";
import EditRefundTab from "../components/EditRefundTab";
import Loader from "../components/Loading";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function EditSaleComponent() {
	const { saleId } = useParams();
	const token = localStorage.getItem("token");

	const [activeTab, setActiveTab] = useState("sales");
	const [loading, setLoading] = useState(false);
	const [initialLoading, setInitialLoading] = useState(true);

	// Header
	const [invoiceNo, setInvoiceNo] = useState("");
	const [saleDate, setSaleDate] = useState("");

	// ✅ FINAL PAYLOAD STATES
	const [sales, setSales] = useState([]); // clean sales payload
	const [refunds, setRefunds] = useState([]); // clean refunds payload

	// ✅ UI-ONLY (sales with refund nested)
	const [refundSales, setRefundSales] = useState([]);

	/* ======================
		LOAD INVOICE (SAFE)
	====================== */
	useEffect(() => {
		if (!saleId) return;

		const fetchSale = async () => {
			try {
				setInitialLoading(true);

				const res = await fetch(`${API_BASE}/api/sales/${saleId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				const json = await res.json();
				if (!res.ok) throw new Error(json.error || "Failed to load invoice");

				const data = json.data;
				const allSales = data.sales || [];

				// -------------------------
				// SPLIT SALES VS REFUNDS
				// -------------------------
				const normalSales = allSales.filter((s) => !s.isRefund);

				const refundedSales = allSales.filter(
					(s) => s.isRefund && s.status === "REFUNDED" && s.refund
				);

				// -------------------------
				// BUILD REFUND PAYLOAD IMMEDIATELY
				// (CRITICAL FIX)
				// -------------------------
				const refundPayload = refundedSales.map((sale) => {
					const r = sale.refund;

					return {
						id: r.id,
						saleId: sale.id,
						refundableAmount: Math.max(
							Number(r.originalAmount || 0) -
								Number(r.refundFee || 0) -
								Number(r.serviceCharges || 0),
							0
						),
						refundFee: Number(r.refundFee || 0),
						serviceCharges: Number(r.serviceCharges || 0),
						refundReason: r.refundReason || null,
						refundDate: r.refundDate?.slice(0, 10), // YYYY-MM-DD
						remarks: r.remarks || null,
					};
				});

				// -------------------------
				// PREFILL STATES
				// -------------------------
				setInvoiceNo(data.invoiceNo);
				setSaleDate(data.saleDate?.slice(0, 10));

				setSales(normalSales); // 👈 Sales tab
				setRefundSales(refundedSales); // 👈 Refund tab UI
				setRefunds(refundPayload); // 👈 FINAL PAYLOAD (SAFE)

			} catch (err) {
				alert(err.message);
			} finally {
				setInitialLoading(false);
			}
		};

		fetchSale();
	}, [saleId, token]);

	/* ======================
		UPDATE HANDLER
	====================== */
	const handleUpdate = async () => {
		if (sales.length === 0 && refunds.length === 0) {
			alert("At least one sale or refund is required");
			return;
		}

		const payload = {
			invoiceNo,
			saleDate,
			sales,
			refunds, // ✅ ALWAYS CORRECT NOW
		};

		try {
			setLoading(true);

			const res = await fetch(`${API_BASE}/api/sales/${saleId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Update failed");

			alert("Sale updated successfully");
		} catch (err) {
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	/* ======================
		UI
	====================== */
	return (
		<div className="w-full relative">
			{/* Loading Overlay */}
			{initialLoading && (
				<div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
					<div className="rounded-lg p-8 flex flex-col items-center gap-4">
						<Loader/>
						<p className="text-lg font-medium text-gray-700">Invoice data...</p>
					</div>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Edit Sale</CardTitle>
					<CardDescription>
						Update sales and refunds for this invoice
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* HEADER */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="text-sm font-medium">Invoice No</label>
							<Input value={invoiceNo} disabled />
						</div>

						<div>
							<label className="text-sm font-medium">Sale Date</label>
							<Input
								type="date"
								value={saleDate}
								onChange={(e) => setSaleDate(e.target.value)}
							/>
						</div>
					</div>

					{/* TABS */}
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="sales">Sales</TabsTrigger>
							<TabsTrigger value="refunds">Refunds</TabsTrigger>
						</TabsList>

						<TabsContent value="sales">
							<EditSalesTab sales={sales} setSales={setSales} />
						</TabsContent>

						<TabsContent value="refunds">
							<EditRefundTab
								refunds={refundSales} // 👈 UI data
								setRefunds={setRefunds} // 👈 payload updater
							/>
						</TabsContent>
					</Tabs>

					{/* ACTION */}
					<div className="flex justify-end pt-4">
						<Button onClick={handleUpdate} disabled={loading}>
							{loading ? "Updating..." : "Update Sale"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
