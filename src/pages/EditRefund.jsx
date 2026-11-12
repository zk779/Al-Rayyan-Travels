"use client";

import { useState, useEffect } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Loader2, Save, X, Calendar as CalendarIcon, Lock, ArrowLeft, Receipt, NotebookPen, Wallet, RotateCcw } from "lucide-react";
import { Calendar } from "../../shadcn/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcn/components/ui/popover";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import { appToast } from "../../shadcn/components/ui/appToast";
import { CalcCard, Facts, MoneyInput, Panel, PayoutPicker } from "../components/refund/RefundParts";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // Ensure this matches your .env variable name

const nice = (v) => String(v || "").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const STATUS_TONE = {
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function EditRefundTab() {
  // 1. Initialize token safely
  const { refundId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);
  const [refundDate, setRefundDate] = useState(new Date());
  const [meta, setMeta] = useState(null); // read-only facts about the refund / sale

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

  // Payout method — who/what receives the refund. Editable: switching this
  // reverses the old ledger entry/balance and applies a fresh one on the
  // newly selected account (see refunds.js PUT route).
  const [refundType, setRefundType] = useState("CASH");
  const [bankId, setBankId] = useState("");
  const [banks, setBanks] = useState([]);
  const [saleContext, setSaleContext] = useState(null); // { paymentType, customerId, customerType, bankId }

  const isTabbyTamara = saleContext?.customerType === "TABBY_OR_TAMARA";
  const hasCreditCustomer =
    !!saleContext?.customerId &&
    ["CREDIT", "PARTIAL"].includes(String(saleContext?.paymentType || "").toUpperCase());

  /* =========================
      1. INITIALIZE TOKEN
  ========================= */
  useEffect(() => {
    // Access localStorage only on the client side
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  /* =========================
      BANKS (for BANK_TRANSFER payout)
  ========================= */
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/banks?isActive=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setBanks(j.data || []))
      .catch(() => {});
  }, [token]);

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
          airline: sale.airline?.airlineCode || sale.airline?.airlineName || "N/A",
          vendorName: sale.vendor?.vendorName || "N/A",
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

        setRefundType(data.refundType || "CUSTOMER_LEDGER");
        setBankId(data.bankId || sale.bankId || "");
        setSaleContext({
          paymentType: sale.paymentType,
          customerId: sale.customerId,
          customerType: sale.customer?.customerType,
          customerName: sale.customer?.customerName,
        });
        setMeta({
          status: data.status,
          invoiceNo: sale.invoice?.invoiceNo,
          customerName: sale.customer?.customerName,
          paxName: sale.paxName,
          pnr: sale.pnr,
          paymentType: sale.paymentType,
          processedBy: data.processedBy?.fullName,
        });
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
    setTried(true);
    const fee = Number(refundForm.refundFee) || 0;
    const service = Number(refundForm.serviceCharges) || 0;

    if (fee < 0 || service < 0) {
      setError("Fees and charges cannot be negative.");
      return;
    }

    if (refundType === "BANK_TRANSFER" && !bankId) {
      setError("Please select which bank account this refund is paid from.");
      return;
    }

    const payload = {
      refundDate: refundDate.toISOString(),
      refundFee: fee,
      serviceCharges: service,
      refundReason: refundForm.refundReason || null,
      remarks: refundForm.remarks || null,
      refundType,
      bankId: refundType === "BANK_TRANSFER" ? bankId : null,
    };

    try {
      setLoading(true);
      setError("");

      await appToast.promise(
        fetch(`${API_BASE}/api/refunds/${refundId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.success === false) throw new Error(data.error || "Failed to update refund");
          return data;
        }),
        {
          loading: "Updating refund...",
          success: "Refund updated successfully!",
          error: (err) => err.message || "Failed to update refund",
        },
      );
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
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        <p className="text-gray-500 text-sm">Loading refund details...</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-base font-semibold text-rose-600">Could not load the refund</p>
        <p className="mt-1 text-sm text-slate-500">{error || "Refund not found."}</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-3 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-700 via-rose-900 to-rose-950 p-4 text-white shadow-md md:px-5">
        <div className="pointer-events-none absolute -right-14 -top-16 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <RotateCcw size={18} />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Edit Refund</h1>
              <p className="text-xs text-rose-200/80">
                {refundForm.documentNumber}
                {meta.invoiceNo ? ` · Invoice ${meta.invoiceNo}` : ""}
              </p>
            </div>
            {meta.status && (
              <span className={`ml-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_TONE[meta.status] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>{nice(meta.status)}</span>
            )}
          </div>
          {/* Returns to wherever this was opened from (e.g. Sales Report's
              Refunds tab, with its search/filters/page intact). */}
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="shrink-0 text-rose-400 hover:text-rose-600" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <Panel
            icon={Receipt}
            title="Original sale"
            titleAr="البيع الأصلي"
            right={
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <Lock className="h-3 w-3" /> Locked
              </span>
            }
          >
            <Facts
              items={[
                { label: "Document no.", value: refundForm.documentNumber, mono: true },
                { label: "Invoice", value: meta.invoiceNo, mono: true },
                { label: "Airline", value: refundForm.airline },
                { label: "Vendor", value: refundForm.vendorName },
                { label: "Customer", value: meta.customerName },
                { label: "Passenger", value: meta.paxName },
                { label: "PNR", value: meta.pnr, mono: true },
                { label: "Payment", value: nice(meta.paymentType) },
                { label: "Processed by", value: meta.processedBy },
                { label: "Net price", value: refundForm.netPrice, money: true },
                { label: "Sell price", value: refundForm.sellPrice, money: true },
              ]}
            />
            <p className="mt-3 text-[11px] text-slate-400">The sale itself can't be changed here — only the refund below.</p>
          </Panel>

          <Panel
            icon={Wallet}
            title="Refund details"
            titleAr="تفاصيل الاسترداد"
            right={
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label="Refund date" className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MoneyInput label="Refund fee" hint="Taken by the vendor" value={refundForm.refundFee} onChange={(v) => updateField("refundFee", v)} />
              <MoneyInput label="Service charges" hint="Kept by us" value={refundForm.serviceCharges} onChange={(v) => updateField("serviceCharges", v)} />
            </div>

            {/* Refund Payout Method — who/what actually receives the money.
                Switching this reverses the old ledger entry/balance and
                applies a fresh one on the newly selected account. */}
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
                customerName={saleContext?.customerName}
                bankInvalid={tried}
              />
              <p className="mt-2 text-[11px] text-slate-400">Changing the payout method moves the money: the old entry is reversed and a new one is posted on the account you choose.</p>
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
          <Button onClick={handleSubmit} disabled={loading} className="h-10 w-full gap-2 rounded-lg bg-rose-600 text-base font-semibold text-white shadow-md shadow-rose-900/20 hover:bg-rose-700">
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
        </aside>
      </div>
    </div>
  );
}
