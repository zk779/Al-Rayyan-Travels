"use client";

import { useEffect, useState } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Trash2 } from "lucide-react";

export default function EditRefundTab({ refunds, setRefunds }) {
	/* =========================
		LOCAL UI STATE
	========================= */
	const [uiRefunds, setUiRefunds] = useState([]);

	/* =========================
		HELPER — RECALCULATE
	========================= */
	const calcRefundableAmount = (refund) => {
		const original = Number(refund.originalAmount || 0);
		const fee = Number(refund.refundFee || 0);
		const service = Number(refund.serviceCharges || 0);
		return Math.max(original - fee - service, 0);
	};

	/* =========================
		SYNC TO PARENT (FLATTENED PAYLOAD)
	========================= */
	const syncToParent = (nextUiRefunds) => {
		const payload = nextUiRefunds.map((sale) => {
			const r = sale.refund;
			return {
				id: r.id,
				saleId: sale.id,
				refundableAmount: calcRefundableAmount(r),
				refundFee: Number(r.refundFee || 0),
				serviceCharges: Number(r.serviceCharges || 0),
				refundReason: r.refundReason || null,
				refundDate: r.refundDate?.slice(0, 10), // YYYY-MM-DD
				remarks: r.remarks || null,
			};
		});

		setRefunds(payload);
	};

	/* =========================
		INIT FROM PARENT (ONCE)
		refunds = array of SALE objects with refund inside
	========================= */
	useEffect(() => {
		if (
			uiRefunds.length === 0 &&
			Array.isArray(refunds) &&
			refunds.length > 0
		) {
			const cloned = refunds.map((sale) => ({ ...sale }));
			setUiRefunds(cloned);
			syncToParent(cloned); // ✅ IMPORTANT: initial payload sync
		}
	}, [refunds, uiRefunds.length]);

	/* =========================
		UPDATE / DELETE
	========================= */
	const updateRefund = (saleId, field, value) => {
		setUiRefunds((prev) => {
			const next = prev.map((sale) =>
				sale.id === saleId
					? {
						...sale,
						refund: {
							...sale.refund,
							[field]: value,
						},
						}
					: sale
			);

			syncToParent(next);
			return next;
		});
	};

	const removeRefund = (saleId) => {
		setUiRefunds((prev) => {
			const next = prev.filter((sale) => sale.id !== saleId);
			syncToParent(next); // exclusion = delete refund
			return next;
		});
	};

	/* =========================
		CALCULATIONS (READ-ONLY)
	========================= */
	const calcVendorRefund = (sale) =>
		Math.max(
			Number(sale.refund.originalAmount || 0) -
				Number(sale.refund.refundFee || 0),
			0
		);

	const calcPaxRefund = (sale) =>
		Math.max(
			calcVendorRefund(sale) -
				Number(sale.refund.serviceCharges || 0),
			0
		);

	/* =========================
		UI
	========================= */
	return (
		<div className="space-y-4">
			{uiRefunds.length === 0 && (
				<div className="text-sm text-gray-500 italic">
					No refunded items found.
				</div>
			)}

			{uiRefunds.map((sale) => {
				const r = sale.refund;
				const refundableAmount = calcRefundableAmount(r);

				return (
					<div
						key={sale.id}
						className="border rounded-lg p-4 space-y-4 bg-slate-50"
					>
						{/* INFO */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<Label>Document No</Label>
								<Input value={sale.documentNo} disabled />
							</div>

							<div>
								<Label>Original Amount</Label>
								<Input value={r.originalAmount} disabled />
							</div>

							<div>
								<Label>Status</Label>
								<Input value={sale.status} disabled />
							</div>

							<div>
								<Label>Refund Date</Label>
								<Input value={r.refundDate.slice(0, 10)} disabled />
							</div>
						</div>

						{/* EDITABLE */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<Label>Refund Fee</Label>
								<Input
									type="number"
									value={r.refundFee || 0}
									onChange={(e) =>
										updateRefund(
											sale.id,
											"refundFee",
											Number(e.target.value || 0)
										)
									}
								/>
							</div>

							<div>
								<Label>Service Charges</Label>
								<Input
									type="number"
									value={r.serviceCharges || 0}
									onChange={(e) =>
										updateRefund(
											sale.id,
											"serviceCharges",
											Number(e.target.value || 0)
										)
									}
								/>
							</div>

							<div>
								<Label>Refundable Amount</Label>
								<Input value={refundableAmount} disabled />
							</div>
						</div>

						{/* SUMMARY */}
						<div className="grid grid-cols-2 gap-4 text-sm font-semibold">
							<div className="text-rose-700">
								Refund Vendor: ${calcVendorRefund(sale).toFixed(2)}
							</div>
							<div className="text-blue-700">
								Refund PAX: ${calcPaxRefund(sale).toFixed(2)}
							</div>
						</div>

						<div>
							<Label>Refund Reason</Label>
							<Input
								value={r.refundReason || ""}
								onChange={(e) =>
									updateRefund(sale.id, "refundReason", e.target.value)
								}
							/>
						</div>

						<Textarea
							placeholder="Remarks"
							value={r.remarks || ""}
							onChange={(e) =>
								updateRefund(sale.id, "remarks", e.target.value)
							}
						/>

						<div className="flex justify-end">
							<Button
								variant="ghost"
								onClick={() => removeRefund(sale.id)}
							>
								<Trash2 className="h-4 w-4 text-red-500" />
							</Button>
						</div>
					</div>
				);
			})}
		</div>
	);
}
