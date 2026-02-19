"use client";

import { useState, useEffect } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Separator } from "../../shadcn/components/ui/separator";
import { Textarea } from "../../shadcn/components/ui/textarea";
import {
  Loader2,
  Save,
  X,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { format } from "date-fns";
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

const API_BASE = import.meta.env.VITE_API_BASE_URL; // Ensure this matches your .env variable name

export default function EditRefundTab() {
  // 1. Initialize token safely
  const { refundId } = useParams();
  const [token, setToken] = useState(null);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refundDate, setRefundDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("refunds");

  // Form State
  const [refundForm, setRefundForm] = useState({
    documentNumber: "",
    airline: "",
    vendorName: "",
    netPrice: "",
    sellPrice: "",
    refundFee: "0",
    serviceCharges: "0",
    remarks: "",
    refundReason: "",
  });

  const [refundVendor, setRefundVendor] = useState("0.00");
  const [refundPax, setRefundPax] = useState("0.00");

  /* =========================
      1. INITIALIZE TOKEN
  ========================= */
  useEffect(() => {
    // Access localStorage only on the client side
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  /* =========================
      2. FETCH DATA (When token & id ready)
  ========================= */
  useEffect(() => {
    // Wait for token and refundId to be present
    if (!token || !refundId) return;

    const fetchRefund = async () => {
      setFetching(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/refunds/${refundId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to fetch refund details");
        }

        const data = json.data;
        const sale = data.sale;

        // Pre-fill form
        setRefundForm({
          documentNumber: sale.documentNo || "N/A",
          airline: sale.airlineCode || sale.airlineName || "N/A",
          vendorName: sale.vendor?.name || "N/A",
          netPrice: Number(sale.netPrice || 0).toFixed(2),
          sellPrice: Number(sale.sellPrice || 0).toFixed(2),
          refundFee: Number(data.refundFee || 0).toString(),
          serviceCharges: Number(data.cancellationCharges || 0).toString(),
          remarks: data.remarks || "",
          refundReason: data.refundReason || "",
        });

        if (data.refundDate) {
          setRefundDate(new Date(data.refundDate));
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    fetchRefund();
  }, [token, refundId]); // Dependencies: Run when these change

  /* =========================
      3. CALCULATIONS
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
      4. SUBMIT UPDATE
  ========================= */
  const handleSubmit = async () => {
    const fee = Number(refundForm.refundFee) || 0;
    const service = Number(refundForm.serviceCharges) || 0;

    if (fee < 0 || service < 0) {
      setError("Fees and charges cannot be negative.");
      return;
    }

    const payload = {
      refundDate: refundDate.toISOString(),
      refundFee: fee,
      serviceCharges: service,
      refundReason: refundForm.refundReason || null,
      remarks: refundForm.remarks || null,
    };

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/refunds/${refundId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update refund");
      }

      alert("Refund updated successfully!");
      if (onUpdate) onUpdate(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      UI
  ========================= */
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-500 text-sm">Loading refund details...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Services</CardTitle>
          <CardDescription>
            Update existing sales transactions or modify processed refunds
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="refunds">Manage Refund</TabsTrigger>
            </TabsList>

            <TabsContent value="refunds" className="mt-6">
              {/* This component will now handle its own fetch/update logic using saleId */}
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

                {/* Warning Banner */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">
                      Editing Existing Refund
                    </h4>
                    <p className="text-xs text-blue-700">
                      Sale information (Document, Prices, Vendor) is locked. You
                      are only modifying the refund parameters.
                    </p>
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
                  {/* Left Column - Sale Details (Disabled) */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                      <h3 className="font-semibold text-sm text-gray-700 mb-3">
                        Original Sale Information
                      </h3>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">
                          Document Number
                        </Label>
                        <Input
                          value={refundForm.documentNumber}
                          disabled
                          className="bg-gray-100 text-gray-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Airline</Label>
                        <Input
                          value={refundForm.airline}
                          disabled
                          className="bg-gray-100 text-gray-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Vendor</Label>
                        <Input
                          value={refundForm.vendorName}
                          disabled
                          className="bg-gray-100 text-gray-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">
                            Net Price
                          </Label>
                          <Input
                            value={refundForm.netPrice}
                            disabled
                            className="bg-gray-100 text-gray-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">
                            Sell Price
                          </Label>
                          <Input
                            value={refundForm.sellPrice}
                            disabled
                            className="bg-gray-100 text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Editable Refund Details */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">
                          Refund Fee
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={refundForm.refundFee}
                          onChange={(e) =>
                            updateField("refundFee", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium">
                          Service Charges
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={refundForm.serviceCharges}
                          onChange={(e) =>
                            updateField("serviceCharges", e.target.value)
                          }
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
                        <span className="text-blue-700">
                          Refund to Customer
                        </span>
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
                    onChange={(e) =>
                      updateField("refundReason", e.target.value)
                    }
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
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-primary text-white h-11 px-8 text-base font-semibold gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Update Refund
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
