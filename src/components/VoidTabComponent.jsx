"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { format } from "date-fns";
import { Ban, CalendarIcon, Plane, SaudiRiyal, Send, Building2, Save, Info } from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Calendar } from "../../shadcn/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../shadcn/components/ui/popover";
import { appToast } from "../../shadcn/components/ui/appToast";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const VAT_RATE = 0.15;
const HOTEL_ICAO = ["domesticHotel", "internationalHotel"];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const num = (v) => Number(v) || 0;
const money = (n) => round2(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const selectStyles = {
  control: (b, s) => ({
    ...b,
    minHeight: 38,
    height: 38,
    borderRadius: 10,
    boxShadow: s.isFocused ? "0 0 0 3px rgba(100,116,139,0.18)" : "none",
    borderColor: s.isFocused ? "#64748b" : b.borderColor,
    fontSize: "13px",
  }),
  valueContainer: (b) => ({ ...b, height: 38, padding: "0 8px" }),
  input: (b) => ({ ...b, margin: 0, padding: 0 }),
  indicatorsContainer: (b) => ({ ...b, height: 38 }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
};

const FieldLabel = ({ required, children }) => (
  <Label className="flex items-center gap-1 text-xs font-medium text-slate-600">
    {children}
    {required && <span className="text-rose-500">*</span>}
  </Label>
);

const inputClass = (invalid) => `h-9 rounded-[10px] text-sm ${invalid ? "border-rose-300 focus-visible:ring-rose-400" : ""}`;

// A read-only figure the form works out
const Computed = ({ label, hint, value, strong, tone = "slate" }) => (
  <div
    className={`rounded-xl border px-3 py-2 ${
      tone === "emerald" ? "border-emerald-200 bg-emerald-50" : tone === "rose" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
    }`}
  >
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`flex items-center gap-1 tabular-nums ${strong ? "text-lg font-bold text-slate-900" : "text-sm font-semibold text-slate-700"}`}>
      <SaudiRiyal className="h-3.5 w-3.5 opacity-60" /> {money(value)}
    </p>
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const emptyForm = () => ({
  documentNo: "",
  pnr: "",
  paxName: "",
  vendorId: "",
  airlineId: "",
  netPrice: "",
  vendorServiceCharge: "",
  voidCharges: "",
  useCompanyCharge: false,
  companyServiceCharge: "",
  remarks: "",
});

/**
 * A VOID: a ticket cancelled with the vendor inside its void window. It only involves the
 * vendor — two ledger entries, a credit for what the vendor bills us (net + their service
 * charge + 15% VAT on it) and a debit for what they give back (that minus the void charges).
 *
 * `invoiceId` set -> edit that void; otherwise create a new one. (Voids are listed, edited and
 * deleted from the Sales Report like every other sale.)
 */
export default function VoidTabComponent({ invoiceId = null }) {
  const isEdit = !!invoiceId;

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  const [form, setForm] = useState(emptyForm);
  const [saleDate, setSaleDate] = useState(new Date());
  const [saleId, setSaleId] = useState(null); // the sale being edited
  const [vendors, setVendors] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [fetchError, setFetchError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /* ── master data ── */
  useEffect(() => {
    fetch(`${API_BASE}/api/vendors`, { headers })
      .then((r) => r.json())
      .then((j) => setVendors(j.data || []))
      .catch(() => {});
    fetch(`${API_BASE}/api/airlines`, { headers })
      .then((r) => r.json())
      .then((j) => setAirlines((j.data || []).filter((a) => !HOTEL_ICAO.includes(a.icao_code))))
      .catch(() => {});
  }, [headers]);

  const vendorOptions = vendors.map((v) => ({ value: v.id, label: v.vendorName }));
  const airlineOptions = airlines.map((a) => ({ value: a.id, label: `${a.airlineCode || a.iataName || ""} — ${a.airlineName}` }));

  /* ── existing void (edit view) ── */
  useEffect(() => {
    if (!isEdit) return undefined;
    const controller = new AbortController();
    (async () => {
      try {
        setFetching(true);
        const res = await fetch(`${API_BASE}/api/sales/${invoiceId}`, { headers, signal: controller.signal });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to fetch void");
        const s = (body.data.sales || []).find((x) => x.status === "VOID");
        if (!s) throw new Error("This invoice is not a void");
        setSaleId(s.id);
        if (body.data.saleDate) setSaleDate(new Date(body.data.saleDate));
        const nz = (v) => (num(v) ? String(v) : "");
        setForm({
          documentNo: s.documentNo || "",
          pnr: s.pnr || "",
          paxName: s.paxName || "",
          vendorId: s.vendor?.id || s.vendorId || "",
          airlineId: s.airline?.id || s.airlineId || "",
          netPrice: String(s.netPrice ?? ""),
          vendorServiceCharge: nz(s.vendorServiceCharge),
          voidCharges: nz(s.voidCharges),
          useCompanyCharge: num(s.companyServiceCharge) > 0,
          companyServiceCharge: nz(s.companyServiceCharge),
          remarks: s.remarks || "",
        });
      } catch (err) {
        if (err.name !== "AbortError") setFetchError(err.message);
      } finally {
        setFetching(false);
      }
    })();
    return () => controller.abort();
  }, [invoiceId, isEdit, headers]);

  /* ── the figures (the server works them out again and checks) ── */
  const net = num(form.netPrice);
  const vendorCharge = num(form.vendorServiceCharge);
  const vendorVat = round2(vendorCharge * VAT_RATE);
  const credit = round2(net + vendorCharge + vendorVat);
  const voidCharges = num(form.voidCharges);
  const debit = round2(credit - voidCharges);
  const companyCharge = form.useCompanyCharge ? num(form.companyServiceCharge) : 0;
  const companyVat = round2(companyCharge * VAT_RATE);

  const errors = {
    vendor: !form.vendorId,
    airline: !form.airlineId,
    net: !(net > 0),
    charges: vendorCharge < 0 || voidCharges < 0 || companyCharge < 0,
    voidTooHigh: voidCharges > credit,
  };
  const invalid = Object.values(errors).some(Boolean);

  const payloadLine = () => ({
    status: "VOID",
    vendorId: form.vendorId,
    airlineId: form.airlineId,
    documentNo: form.documentNo.trim(),
    pnr: form.pnr.trim(),
    paxName: form.paxName.trim(),
    netPrice: net,
    vendorServiceCharge: vendorCharge,
    vendorVat,
    voidCharges,
    companyServiceCharge: companyCharge,
    remarks: form.remarks.trim(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (invalid) {
      appToast.error("Check the form", errors.voidTooHigh ? "Void charges cannot be more than the vendor credit amount." : "Fill in the required fields.");
      return;
    }
    try {
      setLoading(true);
      await appToast.promise(
        fetch(isEdit ? `${API_BASE}/api/sales/void/${saleId}` : `${API_BASE}/api/sales`, {
          method: isEdit ? "PUT" : "POST",
          headers,
          body: JSON.stringify(
            isEdit
              ? { ...payloadLine(), saleDate: saleDate.toISOString() }
              : { saleDate: saleDate.toISOString(), sales: [payloadLine()] },
          ),
        }).then(async (res) => {
          const d = await res.json();
          if (!res.ok) throw new Error(d.error || "Failed");
          return d;
        }),
        {
          loading: isEdit ? "Updating void..." : "Submitting void...",
          success: (d) => (isEdit ? "Void updated successfully!" : `Invoice ${d?.data?.invoiceNo || ""} Submitted Successfully!`),
          error: (err) => err.message || "Failed to save void",
        },
      );
      if (!isEdit) {
        setForm(emptyForm());
        setSaleDate(new Date());
        setSubmitted(false);
      }
    } catch (err) {
      console.error("Void submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── loading / error (edit) ── */
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
        <span className="text-sm text-slate-500">Loading void...</span>
      </div>
    );
  }
  if (fetchError) {
    return <p className="py-16 text-center text-sm font-medium text-red-500">Failed to load void: {fetchError}</p>;
  }

  const vendorChosen = vendorOptions.find((o) => o.value === form.vendorId) || null;
  const airlineChosen = airlineOptions.find((o) => o.value === form.airlineId) || null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-tl from-gray-700 to-gray-900 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Ban size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold">{isEdit ? "Edit Void" : "New Void"}</h2>
              <p className="text-xs text-gray-300">A ticket cancelled with the vendor — it only involves the vendor ledger, never a customer.</p>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3 text-sm font-medium ring-1 ring-white/25 transition-colors hover:bg-white/25"
              >
                <CalendarIcon className="h-4 w-4 text-gray-200" />
                {saleDate ? format(saleDate, "PPP") : "Select date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={saleDate}
                onSelect={(d) => {
                  if (!d) return;
                  // keep the picked day but stamp the current time (a bare local midnight shifts the day in UTC)
                  const now = new Date();
                  const merged = new Date(d);
                  merged.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                  setSaleDate(merged);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Ticket */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Plane className="h-4 w-4 text-slate-500" /> Ticket
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <FieldLabel>Document No</FieldLabel>
              <Input value={form.documentNo} onChange={(e) => set("documentNo", e.target.value)} placeholder="Ticket number" className={inputClass(false)} />
            </div>
            <div className="space-y-1">
              <FieldLabel>PNR</FieldLabel>
              <Input value={form.pnr} onChange={(e) => set("pnr", e.target.value)} placeholder="PNR" className={inputClass(false)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <FieldLabel>Passenger name</FieldLabel>
              <Input value={form.paxName} onChange={(e) => set("paxName", e.target.value)} placeholder="Passenger name" className={inputClass(false)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <FieldLabel required>Vendor</FieldLabel>
              <Select
                options={vendorOptions}
                value={vendorChosen}
                onChange={(o) => set("vendorId", o?.value || "")}
                placeholder="Select vendor"
                menuPortalTarget={document.body}
                styles={{
                  ...selectStyles,
                  control: (b, s) => ({ ...selectStyles.control(b, s), borderColor: submitted && errors.vendor ? "#fda4af" : selectStyles.control(b, s).borderColor }),
                }}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <FieldLabel required>Airline</FieldLabel>
              <Select
                options={airlineOptions}
                value={airlineChosen}
                onChange={(o) => set("airlineId", o?.value || "")}
                placeholder="Select airline"
                menuPortalTarget={document.body}
                styles={{
                  ...selectStyles,
                  control: (b, s) => ({ ...selectStyles.control(b, s), borderColor: submitted && errors.airline ? "#fda4af" : selectStyles.control(b, s).borderColor }),
                }}
              />
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Building2 className="h-4 w-4 text-slate-500" /> Vendor amounts
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <FieldLabel required>Net amount</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.netPrice}
                onChange={(e) => set("netPrice", e.target.value)}
                placeholder="0.00"
                className={inputClass(submitted && errors.net)}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel>Vendor service charges</FieldLabel>
              <Input type="number" min="0" step="0.01" value={form.vendorServiceCharge} onChange={(e) => set("vendorServiceCharge", e.target.value)} placeholder="0.00" className={inputClass(false)} />
            </div>
            <Computed label="Vendor VAT (15%)" hint="on the service charges, excl." value={vendorVat} />
            <Computed label="Credit entry" hint="net + charges + VAT" value={credit} strong />
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <FieldLabel>Additional / Cancellation / Void charges</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.voidCharges}
                onChange={(e) => set("voidCharges", e.target.value)}
                placeholder="0.00"
                className={inputClass(errors.voidTooHigh)}
              />
              {errors.voidTooHigh && <p className="text-[11px] text-rose-500">Cannot be more than the credit amount.</p>}
            </div>
            <Computed label="Void amount (sell) — debit entry" hint="credit − void charges: what the vendor gives back" value={debit} strong tone="emerald" />
          </div>
        </div>

        {/* Company service charges */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">My company service charges</h3>
              <p className="text-xs text-slate-500">Optional. Our own charge — counted as profit, with its 15% VAT (excl.).</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.useCompanyCharge}
              aria-label="Add my company service charges"
              onClick={() => set("useCompanyCharge", !form.useCompanyCharge)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.useCompanyCharge ? "bg-slate-800" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.useCompanyCharge ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          {form.useCompanyCharge && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <FieldLabel>Company service charges</FieldLabel>
                <Input type="number" min="0" step="0.01" value={form.companyServiceCharge} onChange={(e) => set("companyServiceCharge", e.target.value)} placeholder="0.00" className={inputClass(false)} />
              </div>
              <Computed label="VAT (15%)" hint="saved as the VAT amount" value={companyVat} />
              <Computed label="Profit" hint="the company service charges" value={companyCharge} tone="emerald" />
            </div>
          )}
        </div>

        {/* What gets posted */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="mb-2 flex items-center gap-1.5 font-semibold text-slate-700">
            <Info className="h-3.5 w-3.5" /> Vendor ledger
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-emerald-700">1 · Credit</span> {money(credit)} — net {money(net)} + charges {money(vendorCharge)} + VAT {money(vendorVat)}
            </p>
            <p>
              <span className="font-semibold text-rose-700">2 · Debit</span> {money(debit)} — credit {money(credit)} − void charges {money(voidCharges)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <FieldLabel>Remarks</FieldLabel>
          <Input value={form.remarks} onChange={(e) => set("remarks", e.target.value)} placeholder="Optional" className={inputClass(false)} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="h-11 gap-2 rounded-xl px-6">
            {isEdit ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {loading ? "Saving..." : isEdit ? "Update Void" : "Submit Void"}
          </Button>
        </div>
      </form>
    </div>
  );
}
