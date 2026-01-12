"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Separator } from "../../shadcn/components/ui/separator";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DEBOUNCE_DELAY = 400;

export default function RefundTabComponent({ refunds, setRefunds }) {
  const token = localStorage.getItem("token");
  const debounceRef = useRef(null);

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [refundVendor, setRefundVendor] = useState("0.00");
  const [refundPax, setRefundPax] = useState("0.00");

  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [editingRefundId, setEditingRefundId] = useState(null);

  const [refundForm, setRefundForm] = useState({
    documentNumber: "",
    saleId: null,
    airline: "",
    vendorName: "",
    netPrice: "",
    refundFee: "",
    serviceCharges: "",
    remarks: "",
  });

  /* =========================
     LIVE SEARCH (DEBOUNCED)
  ========================= */
  useEffect(() => {
    if (!refundForm.documentNumber || editingRefundId) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/sales/search?documentNo=${refundForm.documentNumber}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (json.success) {
          setSuggestions(json.data || []);
          setShowDropdown(json.data.length > 0);
        }
      } catch {
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(debounceRef.current);
  }, [refundForm.documentNumber, editingRefundId]);

  /* =========================
     SELECT SALE
  ========================= */
  const selectSale = (sale) => {
    setShowDropdown(false);
    setSuggestions([]);
    setError("");

    if (sale.isRefund || sale.status === "REFUNDED") {
      setError("This sale has already been refunded.");
      return;
    }

    setRefundForm({
      documentNumber: sale.documentNo,
      saleId: sale.id,
      airline: sale.airlineCode || "",
      vendorName: sale.vendorName || "",
      netPrice: Number(sale.netPrice).toFixed(2),
      refundFee: "",
      serviceCharges: "",
      remarks: "",
    });

    setRefundVendor("0.00");
    setRefundPax("0.00");
  };

  /* =========================
     ENTER KEY SELECT
  ========================= */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      selectSale(suggestions[0]);
    }
  };

  /* =========================
     REFUND CALCULATIONS
  ========================= */
  useEffect(() => {
    const net = Number(refundForm.netPrice) || 0;
    const fee = Number(refundForm.refundFee) || 0;
    const service = Number(refundForm.serviceCharges) || 0;

    const vendorAmount = Math.max(net - fee, 0);
    const paxAmount = Math.max(vendorAmount - service, 0);

    setRefundVendor(vendorAmount.toFixed(2));
    setRefundPax(paxAmount.toFixed(2));
  }, [refundForm]);

  const updateField = (field, value) =>
    setRefundForm((p) => ({ ...p, [field]: value }));

  /* =========================
     ADD / UPDATE REFUND
  ========================= */
  const saveRefund = () => {
    if (!refundForm.saleId) {
      setError("Please select a sale to refund.");
      return;
    }

    const net = Number(refundForm.netPrice) || 0;
    const fee = Number(refundForm.refundFee) || 0;
    const service = Number(refundForm.serviceCharges) || 0;

    const refundableAmount = Math.max(net - fee - service, 0);

    if (editingRefundId) {
      // UPDATE
      setRefunds(
        refunds.map((r) =>
          r.id === editingRefundId
            ? {
                ...r,
                refundableAmount,
                refundFee: fee,
                serviceCharges: service,
                remarks: refundForm.remarks || null,
              }
            : r
        )
      );
    } else {
      // ADD
      setRefunds([
        ...refunds,
        {
          id: crypto.randomUUID(),
          saleId: refundForm.saleId,
          refundableAmount,
          refundFee: fee,
          serviceCharges: service,
          remarks: refundForm.remarks || null,
        },
      ]);
    }

    resetForm();
  };

  const editRefund = (refund) => {
    setEditingRefundId(refund.id);

    setRefundForm({
      documentNumber: "",
      saleId: refund.saleId,
      airline: "",
      vendorName: "",
      netPrice:
        refund.refundableAmount + refund.refundFee + refund.serviceCharges,
      refundFee: refund.refundFee,
      serviceCharges: refund.serviceCharges,
      remarks: refund.remarks || "",
    });
  };

  const removeRefund = (id) => setRefunds(refunds.filter((r) => r.id !== id));

  const resetForm = () => {
    setRefundForm({
      documentNumber: "",
      saleId: null,
      airline: "",
      vendorName: "",
      netPrice: "",
      refundFee: "",
      serviceCharges: "",
      remarks: "",
    });
    setEditingRefundId(null);
    setRefundVendor("0.00");
    setRefundPax("0.00");
    setError("");
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-4 relative">
      {/* SEARCH */}
      <div className="relative">
        <Input
          placeholder="Search document number..."
          value={refundForm.documentNumber}
          onChange={(e) => updateField("documentNumber", e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!!editingRefundId}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
        )}

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full bg-white border rounded-md shadow mt-1 max-h-60 overflow-auto">
            {suggestions.map((sale) => (
              <div
                key={sale.id}
                onClick={() => selectSale(sale)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  sale.isRefund || sale.status === "REFUNDED"
                    ? "text-red-500 cursor-not-allowed"
                    : ""
                }`}
              >
                <div className="flex justify-between">
                  <span>{sale.documentNo}</span>
                  <span className="text-xs">{sale.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
          {error}
        </div>
      )}

      {/* DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label>Airline</Label>
          <Input value={refundForm.airline} disabled />

          <Label>Vendor</Label>
          <Input value={refundForm.vendorName} disabled />

          <Label>Net Price</Label>
          <Input value={refundForm.netPrice} disabled />
        </div>

        <div className="space-y-3">
          <div className="space-y-3">
            <Label>Refund Fee</Label>
            <Input
              type="number"
              value={refundForm.refundFee}
              onChange={(e) => updateField("refundFee", e.target.value)}
            />
          </div>
          <Label>Service Charges</Label>
          <Input
            type="number"
            value={refundForm.serviceCharges}
            onChange={(e) => updateField("serviceCharges", e.target.value)}
          />

          <Separator />

          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex justify-between">
              <span>Net Price</span>
              <span>${refundForm.netPrice || "0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span>Refund Fee</span>
              <span>${refundForm.refundFee || "0.00"}</span>
            </div>
            <div className="flex justify-between font-semibold text-rose-700">
              <span>Refund Vendor</span>
              <span>${refundVendor}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charges</span>
              <span>${refundForm.serviceCharges || "0.00"}</span>
            </div>
            <div className="flex justify-between font-semibold text-blue-700">
              <span>Refund PAX</span>
              <span>${refundPax}</span>
            </div>
          </div>
        </div>
      </div>

      <Textarea
        placeholder="Remarks"
        value={refundForm.remarks}
        onChange={(e) => updateField("remarks", e.target.value)}
      />

      <div className="flex gap-2">
        <Button onClick={saveRefund}>
          {editingRefundId ? "Update Refund" : "Add Refund"}
        </Button>
        {editingRefundId && (
          <Button variant="ghost" onClick={resetForm}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        )}
      </div>

      {refunds.map((r) => (
        <div
          key={r.id}
          className="flex justify-between items-center border p-2 rounded"
        >
          <span>${r.refundableAmount.toFixed(2)}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => editRefund(r)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeRefund(r.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
