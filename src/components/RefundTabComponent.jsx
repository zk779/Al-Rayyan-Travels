"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Separator } from "../../shadcn/components/ui/separator";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Loader2, Send, X, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { format } from "date-fns";
import { appToast } from "../../shadcn/components/ui/appToast";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DEBOUNCE_DELAY = 400;

export default function RefundTabComponent() {
  const token = localStorage.getItem("token");
  const debounceRef = useRef(null);

  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refundDate, setRefundDate] = useState(new Date());

  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [refundForm, setRefundForm] = useState({
    documentNumber: "",
    saleId: null,
    airline: "",
    vendorName: "",
    netPrice: "",
    sellPrice: "",
    refundFee: "",
    serviceCharges: "",
    remarks: "",
    refundReason: "",
  });

  const [refundVendor, setRefundVendor] = useState("0.00");
  const [refundPax, setRefundPax] = useState("0.00");

  /* ========================= LIVE SEARCH ========================= */
  useEffect(() => {
    if (!refundForm.documentNumber) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/sales/search?documentNo=${refundForm.documentNumber}`,
          { headers: { Authorization: `Bearer ${token}` } },
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
  }, [refundForm.documentNumber, token]);

  /* ========================= SELECT SALE ========================= */
  const selectSale = (sale) => {
    setShowDropdown(false);
    setSuggestions([]);
    setError("");

    if (sale.status === "REFUNDED") {
      setError("This sale has already been refunded.");
      return;
    }

    setRefundForm({
      documentNumber: sale.documentNo,
      saleId: sale.id,
      airline: sale.airlineCode || sale.airlineName || "",
      vendorName: sale.vendorName || "",
      netPrice: Number(sale.netPrice || 0).toFixed(2),
      sellPrice: Number(sale.sellPrice || 0).toFixed(2),
      refundFee: "",
      serviceCharges: "",
      remarks: "",
      refundReason: "",
    });

    setRefundVendor("0.00");
    setRefundPax("0.00");
  };

  /* ========================= CALCULATIONS ========================= */
  useEffect(() => {
    const net = Number(refundForm.netPrice) || 0;
    const fee = Number(refundForm.refundFee) || 0;
    const service = Number(refundForm.serviceCharges) || 0;

    const vendorAmount = Math.max(net - fee, 0);
    const paxAmount = Math.max(net - fee - service, 0);

    setRefundVendor(vendorAmount.toFixed(2));
    setRefundPax(paxAmount.toFixed(2));
  }, [refundForm]);

  const updateField = (field, value) =>
    setRefundForm((p) => ({ ...p, [field]: value }));

  /* ========================= SUBMIT REFUND ========================= */
  const handleSubmit = async () => {
    // Validation
    if (!refundForm.saleId) {
      appToast.warning("Please select a sale to refund.");
      setError("Please select a sale to refund.");
      return;
    }

    const fee = Number(refundForm.refundFee) || 0;
    const service = Number(refundForm.serviceCharges) || 0;

    if (fee < 0 || service < 0) {
      appToast.warning("Fees and service charges cannot be negative.");
      setError("Fees and service charges cannot be negative.");
      return;
    }

    const payload = {
      saleId: refundForm.saleId,
      refundDate: refundDate.toISOString(),
      refundFee: fee,
      serviceCharges: service,
      refundReason: refundForm.refundReason || null,
      remarks: refundForm.remarks || null,
      originalAmount: Number(refundForm.netPrice) || 0,
      originalSaleAmount: Number(refundForm.sellPrice) || 0,
      vendorRefundAmount: Number(refundVendor) || 0,
      refundableAmount: Number(refundPax) || 0,
    };

    try {
      setLoading(true);

      const res = await appToast.promise(
        fetch(`${API_BASE}/api/refunds`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }),
        {
          loading: "Processing refund...",
          success: "Refund processed successfully!",
          error: "Failed to process refund.",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process refund");
      }


      resetForm();
    } catch (err) {
      console.error(err);

      setError(err.message);

      appToast.error(
        err.message || "Something went wrong while processing the refund.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRefundForm({
      documentNumber: "",
      saleId: null,
      airline: "",
      vendorName: "",
      netPrice: "",
      sellPrice: "",
      refundFee: "",
      serviceCharges: "",
      remarks: "",
      refundReason: "",
    });
    setRefundVendor("0.00");
    setRefundPax("0.00");
    setError("");
    setRefundDate(new Date());
  };

  /* ========================= UI ========================= */
  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div className="bg-slate-50 p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium whitespace-nowrap">
            Refund Date:
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal bg-white max-w-60 h-9"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(refundDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={refundDate}
                onSelect={(d) => d && setRefundDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Search Sale by Document Number
        </Label>
        <div className="relative">
          <Input
            placeholder="Enter document number..."
            value={refundForm.documentNumber}
            onChange={(e) => updateField("documentNumber", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions.length > 0) {
                selectSale(suggestions[0]);
              }
            }}
            className="pr-10"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
          )}

          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
              {suggestions.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => selectSale(sale)}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                    sale.status === "REFUNDED"
                      ? "text-red-500 bg-red-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{sale.documentNo}</div>
                      <div className="text-xs text-gray-500">
                        {sale.airlineCode} • {sale.vendorName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium">{sale.status}</div>
                      <div className="text-xs text-gray-500">
                        ${Number(sale.sellPrice || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md flex items-center justify-between">
          {error}
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Sale Details */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              Sale Information
            </h3>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Airline</Label>
              <Input value={refundForm.airline} disabled className="bg-white" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Vendor</Label>
              <Input
                value={refundForm.vendorName}
                disabled
                className="bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Net Price</Label>
              <Input
                value={refundForm.netPrice}
                disabled
                className="bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Sell Price</Label>
              <Input
                value={refundForm.sellPrice}
                disabled
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Refund Details */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Refund Fee</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={refundForm.refundFee}
                onChange={(e) => updateField("refundFee", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Service Charges</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={refundForm.serviceCharges}
                onChange={(e) => updateField("serviceCharges", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <Separator />

          {/* Calculation Summary */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">
              Refund Calculation
            </h4>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net Price</span>
              <span className="font-medium">
                ${refundForm.netPrice || "0.00"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">- Refund Fee</span>
              <span className="font-medium text-red-600">
                -${refundForm.refundFee || "0.00"}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between text-sm font-semibold">
              <span className="text-rose-700">Refund to Vendor</span>
              <span className="text-rose-700">${refundVendor}</span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">- Service Charges</span>
              <span className="font-medium text-red-600">
                -${refundForm.serviceCharges || "0.00"}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between text-sm font-semibold">
              <span className="text-blue-700">Refund to Customer</span>
              <span className="text-blue-700">${refundPax}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Reason */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Refund Reason</Label>
        <Input
          placeholder="e.g., Customer cancellation, Flight cancelled"
          value={refundForm.refundReason}
          onChange={(e) => updateField("refundReason", e.target.value)}
        />
      </div>

      {/* Remarks */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">Remarks</Label>
        <Textarea
          placeholder="Additional notes..."
          value={refundForm.remarks}
          onChange={(e) => updateField("remarks", e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={resetForm} disabled={loading}>
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || !refundForm.saleId}
          className="bg-gradient-primary text-white h-11 px-8 text-base font-semibold gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Process Refund
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
