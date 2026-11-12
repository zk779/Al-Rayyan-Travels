"use client";

import { useState, useEffect } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Input } from "../../shadcn/components/ui/input";
import { Loader2, Send, X, Calendar as CalendarIcon, FileSearch, Receipt, NotebookPen, Wallet, Search, RotateCcw } from "lucide-react";
import { Calendar } from "../../shadcn/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcn/components/ui/popover";
import { format } from "date-fns";
import { appToast } from "../../shadcn/components/ui/appToast";
import SaleSearch from "./refund/SaleSearch";
import { CalcCard, Facts, MoneyInput, Panel, PayoutPicker } from "./refund/RefundParts";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Mirrors the backend's inferDefaultRefundType() so the picker starts on
// whatever the API would choose anyway if refundType were omitted.
function inferDefaultRefundType(sale) {
  if (sale.customerType === "TABBY_OR_TAMARA") return "CASH";
  const pt = String(sale.paymentType || "").toUpperCase();
  if ((pt === "CREDIT" || pt === "PARTIAL") && sale.customerId) return "CUSTOMER_LEDGER";
  return pt === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CASH";
}

const EMPTY_FORM = {
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
};

const nice = (v) => String(v || "").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export default function RefundTabComponent() {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);
  const [refundDate, setRefundDate] = useState(new Date());

  const [refundForm, setRefundForm] = useState(EMPTY_FORM);

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

  /* ========================= SELECT SALE ========================= */
  const selectSale = (sale) => {
    setError("");

    if (sale.status === "REFUNDED") {
      setError("This sale has already been refunded.");
      return;
    }

    // A ticket that has been voided (found by its document number) can never be refunded
    if (sale.voided || sale.status === "VOID") {
      setError(
        `Ticket ${sale.documentNo} is VOID${sale.voidInvoiceNo ? ` (invoice ${sale.voidInvoiceNo})` : ""} — a voided ticket cannot be refunded.`,
      );
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

    setTried(false);
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

  // Typing in the search box after a sale was picked starts over — otherwise the old sale
  // (its id and prices) stayed behind a different-looking document number.
  const onSearchText = (text) => {
    if (refundForm.saleId && text !== refundForm.documentNumber) {
      setRefundForm({ ...EMPTY_FORM, documentNumber: text });
      setRefundVendor("0.00");
      setRefundPax("0.00");
      setSelectedSale(null);
      setRefundType("CASH");
      setBankId("");
      setTried(false);
    } else {
      updateField("documentNumber", text);
    }
  };

  /* ========================= SUBMIT REFUND ========================= */
  const handleSubmit = async () => {
    setTried(true);
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
      setError("");

      // The toast now follows the real outcome: a refused refund used to show "processed
      // successfully" first (the promise resolved with the HTTP response, even for an error).
      await appToast.promise(
        fetch(`${API_BASE}/api/refunds`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.success === false) throw new Error(data.error || "Failed to process refund");
          return data;
        }),
        {
          loading: "Processing refund...",
          success: "Refund processed successfully!",
          error: (err) => err.message || "Failed to process refund.",
        },
      );

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while processing the refund.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRefundForm(EMPTY_FORM);
    setRefundVendor("0.00");
    setRefundPax("0.00");
    setError("");
    setTried(false);
    setRefundDate(new Date());
    setSelectedSale(null);
    setRefundType("CASH");
    setBankId("");
  };

  const hasSale = !!refundForm.saleId;

  /* ========================= UI ========================= */
  return (
    <div className="space-y-3">
      {/* Find the sale */}
      <Panel
        icon={Search}
        title="Find the sale"
        titleAr="ابحث عن البيع"
        right={
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                aria-label="Refund date"
              >
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <span className="text-[11px] text-slate-400">Refund date</span>
                <span className="font-medium">{format(refundDate, "dd MMM yyyy")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={refundDate} onSelect={(d) => d && setRefundDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
        }
      >
        <Label className="mb-1 block text-xs font-medium text-slate-600">Search sale by document number</Label>
        <SaleSearch
          value={refundForm.documentNumber}
          onChange={onSearchText}
          onPick={selectSale}
          onClear={() => {
            onSearchText("");
            setError("");
          }}
          invalid={tried && !hasSale}
        />

        {error && (
          <div className="mt-2 flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="shrink-0 text-rose-400 hover:text-rose-600" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </Panel>

      {!hasSale && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-rose-300 bg-rose-50 px-6 py-8 text-center" data-testid="refund-empty">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white shadow-sm">
            <FileSearch className="h-5 w-5" />
          </span>
          <p className="mt-2 text-sm font-semibold text-rose-900">No sale selected yet</p>
          <p className="mt-0.5 max-w-sm text-xs text-slate-400">Search a document number above and pick the ticket to refund. Its details and the refund calculation appear here.</p>
        </div>
      )}

      {hasSale && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <Panel icon={Receipt} title="Sale information" titleAr="بيانات البيع" right={<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Locked</span>}>
              <Facts
                items={[
                  { label: "Document no.", value: refundForm.documentNumber, mono: true },
                  { label: "Airline", value: refundForm.airline },
                  { label: "Vendor", value: refundForm.vendorName },
                  { label: "Customer", value: selectedSale?.customerName },
                  { label: "Passenger", value: selectedSale?.paxName },
                  { label: "PNR", value: selectedSale?.pnr, mono: true },
                  { label: "Payment", value: nice(selectedSale?.paymentType) },
                  { label: "Net price", value: refundForm.netPrice, money: true },
                  { label: "Sell price", value: refundForm.sellPrice, money: true },
                ]}
              />
            </Panel>

            <Panel icon={Wallet} title="Refund details" titleAr="تفاصيل الاسترداد">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MoneyInput label="Refund fee" hint="Taken by the vendor" value={refundForm.refundFee} onChange={(v) => updateField("refundFee", v)} />
                <MoneyInput label="Service charges" hint="Kept by us" value={refundForm.serviceCharges} onChange={(v) => updateField("serviceCharges", v)} />
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <Label className="mb-1.5 block text-xs font-medium text-slate-600">Refund payout method</Label>
                <PayoutPicker
                  refundType={refundType}
                  onType={setRefundType}
                  bankId={bankId}
                  onBank={setBankId}
                  banks={banks}
                  hasCreditCustomer={hasCreditCustomer}
                  isTabbyTamara={isTabbyTamara}
                  customerName={selectedSale?.customerName}
                  bankInvalid={tried}
                />
              </div>
            </Panel>

            <Panel icon={NotebookPen} title="Reason & notes" titleAr="السبب والملاحظات">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600">Refund reason</Label>
                  <Input
                    placeholder="e.g., Customer cancellation, Flight cancelled"
                    value={refundForm.refundReason}
                    onChange={(e) => updateField("refundReason", e.target.value)}
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600">Remarks</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={refundForm.remarks}
                    onChange={(e) => updateField("remarks", e.target.value)}
                    rows={2}
                    className="min-h-0 resize-none rounded-lg"
                  />
                </div>
              </div>
            </Panel>
          </div>

          <aside className="h-fit space-y-3 xl:sticky xl:top-20">
            <CalcCard
              net={refundForm.netPrice}
              fee={refundForm.refundFee}
              vendorAmount={refundVendor}
              service={refundForm.serviceCharges}
              payout={refundPax}
              refundType={refundType}
            />
            <div className="flex flex-col gap-2">
              <Button onClick={handleSubmit} disabled={loading || !refundForm.saleId} className="h-10 gap-2 rounded-lg bg-rose-600 text-base font-semibold text-white shadow-md shadow-rose-900/20 hover:bg-rose-700">
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
              <Button variant="outline" onClick={resetForm} disabled={loading} className="h-9 gap-2 rounded-lg border-rose-300 text-rose-700 hover:bg-rose-100 hover:text-rose-800">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
