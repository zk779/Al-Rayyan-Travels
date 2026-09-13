"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Separator } from "../../shadcn/components/ui/separator";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Loader2, Send, X, Calendar as CalendarIcon, SaudiRiyal, AlertTriangle } from "lucide-react";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/components/ui/select";
import { format } from "date-fns";
import { appToast } from "../../shadcn/components/ui/appToast";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DEBOUNCE_DELAY = 400;

// Mirrors the backend's inferDefaultRefundType() so the picker starts on
// whatever the API would choose anyway if refundType were omitted.
function inferDefaultRefundType(sale) {
  if (sale.customerType === "TABBY_OR_TAMARA") return "CASH";
  const pt = String(sale.paymentType || "").toUpperCase();
  if ((pt === "CREDIT" || pt === "PARTIAL") && sale.customerId) return "CUSTOMER_LEDGER";
  return pt === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CASH";
}

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

  // Payout method — who/what actually gets netRefundToCustomer.
  const [selectedSale, setSelectedSale] = useState(null); // raw sale from search, for customerType/bankId context
  const [refundType, setRefundType] = useState("CASH");
  const [bankId, setBankId] = useState("");
  const [banks, setBanks] = useState([]);

  const isTabbyTamara = selectedSale?.customerType === "TABBY_OR_TAMARA";
  const hasCreditCustomer =
    !!selectedSale?.customerId &&
    ["CREDIT", "PARTIAL"].includes(String(selectedSale?.paymentType || "").toUpperCase());

  /* ========================= BANKS (for BANK_TRANSFER payout) ========================= */
  useEffect(() => {
    fetch(`${API_BASE}/api/banks?isActive=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setBanks(j.data || []))
      .catch(() => {});
  }, [token]);

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

    setSelectedSale(sale);
    setRefundType(inferDefaultRefundType(sale));
    setBankId(sale.bankId || "");
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

    if (refundType === "BANK_TRANSFER" && !bankId) {
      appToast.warning("Please select which bank account this refund is paid from.");
      setError("Please select which bank account this refund is paid from.");
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
      refundType,
      bankId: refundType === "BANK_TRANSFER" ? bankId : null,
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
    setSelectedSale(null);
    setRefundType("CASH");
    setBankId("");
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

          {/* Refund Payout Method — who/what actually receives the money */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Refund Payout Method</Label>
            <Select value={refundType} onValueChange={setRefundType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER_LEDGER" disabled={!hasCreditCustomer || isTabbyTamara}>
                  Credit to Customer Ledger
                </SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>

            {isTabbyTamara && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  This ticket was booked through <strong>{selectedSale?.customerName}</strong> —
                  refunds must be paid out as Cash or Bank Transfer directly to the traveler.
                  Crediting {selectedSale?.customerName}'s ledger would incorrectly reduce what
                  they still owe you.
                </span>
              </div>
            )}

            {refundType === "BANK_TRANSFER" && (
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName} — {b.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Separator />

          {/* Calculation Summary */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">
              Refund Calculation
            </h4>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Net Price</span>
              <span className="font-medium flex items-center gap-0.5">
                <SaudiRiyal size={13} />
                {refundForm.netPrice || "0.00"}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">- Refund Fee</span>
              <span className="font-medium text-red-600 flex items-center gap-0.5">
                -<SaudiRiyal size={13} />
                {refundForm.refundFee || "0.00"}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between text-sm font-semibold">
              <span className="text-rose-700">Refund to Vendor</span>
              <span className="text-rose-700 flex items-center gap-0.5">
                <SaudiRiyal size={13} />
                {refundVendor}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">- Service Charges</span>
              <span className="font-medium text-red-600 flex items-center gap-0.5">
                -<SaudiRiyal size={13} />
                {refundForm.serviceCharges || "0.00"}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between text-sm font-semibold">
              <span className="text-blue-700">
                {refundType === "CUSTOMER_LEDGER"
                  ? "Credit to Customer Ledger"
                  : refundType === "BANK_TRANSFER"
                    ? "Refund Payout (Bank Transfer)"
                    : "Refund Payout (Cash)"}
              </span>
              <span className="text-blue-700 flex items-center gap-0.5">
                <SaudiRiyal size={13} />
                {refundPax}
              </span>
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
