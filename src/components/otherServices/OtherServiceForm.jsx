"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  FilePlus2,
  Hash,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Plus,
  Receipt,
  Save,
  SaudiRiyal,
  Trash2,
  UserRound,
  Building2,
  ListPlus,
} from "lucide-react";
import { Button } from "../../../shadcn/components/ui/button";
import { Input } from "../../../shadcn/components/ui/input";
import { Label } from "../../../shadcn/components/ui/label";
import { Calendar } from "../../../shadcn/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../shadcn/components/ui/popover";
import { appToast } from "../../../shadcn/components/ui/appToast";
import { amountInWords } from "../../utils/numberToWords";
import { SERVICE_TYPES, serviceOf } from "./serviceTypes";
import { computeTotals, lineAmount } from "./totals";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const money = (n) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PAYMENT_TERMS = ["Cash", "Bank transfer", "Monthly", "15 days", "30 days"];

const uid = () => crypto.randomUUID();
const emptyLine = (unit = "") => ({ id: uid(), description: "", detail: "", qty: "1", unit, rate: "" });
const noteRows = (labels) => labels.map((label) => ({ id: uid(), label, value: "" }));

const Field = ({ label, labelAr, required, icon: Icon, children, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
      {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
      {label}
      {required && <span className="text-rose-500">*</span>}
      {labelAr && (
        <span className="ms-auto text-[11px] font-normal text-slate-400" dir="rtl">
          {labelAr}
        </span>
      )}
    </Label>
    {children}
  </div>
);

const Section = ({ icon: Icon, title, titleAr, action, children }) => (
  <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        {title}
        {titleAr && (
          <span className="text-xs font-normal text-slate-400" dir="rtl">
            {titleAr}
          </span>
        )}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const inputCls = (bad) => `h-10 rounded-xl text-sm ${bad ? "border-rose-300 focus-visible:ring-rose-400" : ""}`;

/**
 * The invoice builder for "Other Services" (transportation, Umrah visa, NADRA …). `invoiceId`
 * set -> edit that invoice; otherwise create a new one. Customer details are typed here — they
 * are not linked to the Customers list — and nothing is posted to a ledger.
 */
export default function OtherServiceForm({ invoiceId = null }) {
  const isEdit = !!invoiceId;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0].key);
  const service = serviceOf(serviceType);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [invoiceNo, setInvoiceNo] = useState("");
  const [customer, setCustomer] = useState({
    customerName: "",
    customerCrNo: "",
    customerVatNo: "",
    contactPerson: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
  });
  const [meta, setMeta] = useState({ referenceNo: "", projectLocation: "", paymentTerms: "" });
  const [items, setItems] = useState([emptyLine(SERVICE_TYPES[0].units[0])]);
  const [notes, setNotes] = useState(noteRows(SERVICE_TYPES[0].notes));
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);
  const [discount, setDiscount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [fetchError, setFetchError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  /* ── next invoice number (create): what it will be called; it is only taken on save ── */
  useEffect(() => {
    if (isEdit) return undefined;
    const controller = new AbortController();
    fetch(`${API_BASE}/api/other-services/next-number?invoiceDate=${encodeURIComponent(invoiceDate.toISOString())}`, {
      headers,
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((j) => setInvoiceNo(j.invoiceNo || ""))
      .catch(() => {});
    return () => controller.abort();
  }, [invoiceDate, isEdit, headers]);

  /* ── the invoice being edited ── */
  useEffect(() => {
    if (!isEdit) return undefined;
    const controller = new AbortController();
    (async () => {
      try {
        setFetching(true);
        const res = await fetch(`${API_BASE}/api/other-services/${invoiceId}`, { headers, signal: controller.signal });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error || "Failed to load the invoice");
        const d = body.data;
        setServiceType(d.serviceType);
        setInvoiceNo(d.invoiceNo);
        setInvoiceDate(new Date(d.invoiceDate));
        setCustomer({
          customerName: d.customerName || "",
          customerCrNo: d.customerCrNo || "",
          customerVatNo: d.customerVatNo || "",
          contactPerson: d.contactPerson || "",
          customerPhone: d.customerPhone || "",
          customerEmail: d.customerEmail || "",
          customerAddress: d.customerAddress || "",
        });
        setMeta({ referenceNo: d.referenceNo || "", projectLocation: d.projectLocation || "", paymentTerms: d.paymentTerms || "" });
        setItems(
          (d.items || []).map((it) => ({
            id: uid(),
            description: it.description || "",
            detail: it.detail || "",
            qty: String(it.qty ?? ""),
            unit: it.unit || "",
            rate: String(it.rate ?? ""),
          })),
        );
        setNotes((d.notes || []).map((n) => ({ id: uid(), label: n.label, value: n.value })));
        setPricesIncludeVat(d.pricesIncludeVat !== false);
        setDiscount(d.discount ? String(d.discount) : "");
      } catch (err) {
        if (err.name !== "AbortError") setFetchError(err.message);
      } finally {
        setFetching(false);
      }
    })();
    return () => controller.abort();
  }, [invoiceId, isEdit, headers]);

  /* ── picking a service: its units and notes are offered (what is already typed stays) ── */
  const chooseService = (key) => {
    if (key === serviceType) return;
    const next = serviceOf(key);
    setServiceType(key);
    setItems((prev) => prev.map((it) => (it.unit ? it : { ...it, unit: next.units[0] })));
    setNotes((prev) => {
      const filled = prev.filter((n) => n.value.trim());
      const have = new Set(filled.map((n) => n.label));
      return [...filled, ...noteRows(next.notes.filter((l) => !have.has(l)))];
    });
  };

  const setC = (k, v) => setCustomer((c) => ({ ...c, [k]: v }));
  const setM = (k, v) => setMeta((m) => ({ ...m, [k]: v }));
  const setItem = (id, k, v) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [k]: v } : it)));
  const addItem = () => setItems((prev) => [...prev, emptyLine(prev[prev.length - 1]?.unit || service.units[0])]);
  const removeItem = (id) => setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  const setNote = (id, k, v) => setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, [k]: v } : n)));

  const totals = computeTotals({ items, discount, pricesIncludeVat });
  const discountTooHigh = (Number(discount) || 0) > totals.subtotal;

  const lineErrors = (it) => ({
    description: !it.description.trim(),
    qty: !(Number(it.qty) > 0),
    rate: it.rate === "" || !(Number(it.rate) >= 0),
  });
  const invalid =
    !customer.customerName.trim() || items.some((it) => Object.values(lineErrors(it)).some(Boolean)) || discountTooHigh;

  const handleSave = async () => {
    setSubmitted(true);
    if (invalid) {
      appToast.error("Check the invoice", discountTooHigh ? "The discount is more than the invoice total." : "Fill in the customer name and every line.");
      return;
    }
    const payload = {
      serviceType,
      detailLabel: service.detailLabel,
      invoiceDate: invoiceDate.toISOString(),
      ...customer,
      ...meta,
      pricesIncludeVat,
      discount: Number(discount) || 0,
      items: items.map((it) => ({
        description: it.description.trim(),
        detail: it.detail.trim(),
        qty: Number(it.qty),
        unit: it.unit.trim(),
        rate: Number(it.rate),
      })),
      notes: notes.filter((n) => n.label.trim() && n.value.trim()).map((n) => ({ label: n.label.trim(), value: n.value.trim() })),
    };
    try {
      setLoading(true);
      const saved = await appToast.promise(
        fetch(isEdit ? `${API_BASE}/api/other-services/${invoiceId}` : `${API_BASE}/api/other-services`, {
          method: isEdit ? "PUT" : "POST",
          headers,
          body: JSON.stringify(payload),
        }).then(async (res) => {
          const d = await res.json();
          if (!res.ok || !d.success) throw new Error(d.error || "Failed");
          return d;
        }),
        {
          loading: isEdit ? "Updating invoice..." : "Saving invoice...",
          success: (d) => (isEdit ? "Invoice updated successfully!" : `Invoice ${d?.data?.invoiceNo || ""} saved!`),
          error: (err) => err.message || "Failed to save the invoice",
        },
      );
      navigate(`/other-services/${saved.data.id}`);
    } catch (err) {
      console.error("Other service save error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
        <span className="text-sm text-slate-500">Loading invoice...</span>
      </div>
    );
  }
  if (fetchError) {
    return <p className="py-24 text-center text-sm font-medium text-red-500">Failed to load the invoice: {fetchError}</p>;
  }

  return (
    <div className="mx-auto w-full space-y-6 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg md:p-7">
        <div className="pointer-events-none absolute -right-14 -top-16 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/other-services" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Other Services
            </Link>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <FilePlus2 size={22} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Service Invoice" : "New Service Invoice"}</h1>
                <p className="text-xs text-slate-400" dir="rtl">
                  {isEdit ? "تعديل فاتورة خدمات" : "فاتورة خدمات جديدة"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/15">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{isEdit ? "Invoice No." : "Next Invoice No."}</p>
              <p className="flex items-center gap-1 font-mono text-sm font-semibold" data-testid="invoice-no">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                {invoiceNo || "—"}
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-[54px] items-center gap-2 rounded-xl bg-white/10 px-3.5 text-left ring-1 ring-white/15 transition-colors hover:bg-white/15"
                >
                  <CalendarIcon className="h-4 w-4 text-slate-300" />
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Invoice date</span>
                    <span className="block text-sm font-semibold">{format(invoiceDate, "dd MMM yyyy")}</span>
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={(d) => {
                    if (!d) return;
                    // keep the picked day, stamp the current time (a bare local midnight shifts the day in UTC)
                    const now = new Date();
                    const merged = new Date(d);
                    merged.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                    setInvoiceDate(merged);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ───────── Left: the invoice ───────── */}
        <div className="space-y-6">
          {/* Service */}
          <Section icon={ListPlus} title="Service" titleAr="الخدمة">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {SERVICE_TYPES.map((s) => {
                const on = s.key === serviceType;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => chooseService(s.key)}
                    aria-pressed={on}
                    className={`group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
                      on ? s.tone.on : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${s.tone.tile}`}>
                      <s.icon size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{s.label}</span>
                      <span className="block text-[11px] text-slate-400" dir="rtl">
                        {s.labelAr}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">{s.hint}</span>
                    </span>
                    {on && (
                      <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Customer */}
          <Section icon={UserRound} title="Customer details" titleAr="بيانات العميل">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer / Company name" labelAr="اسم العميل" required icon={Building2} className="sm:col-span-2">
                <Input
                  value={customer.customerName}
                  onChange={(e) => setC("customerName", e.target.value)}
                  placeholder="e.g. Ali Abdulhamid Al Mabyooq Establishment"
                  className={inputCls(submitted && !customer.customerName.trim())}
                />
              </Field>
              <Field label="CR / ID No." labelAr="السجل التجاري / الهوية">
                <Input value={customer.customerCrNo} onChange={(e) => setC("customerCrNo", e.target.value)} placeholder="2053014628" className={inputCls(false)} />
              </Field>
              <Field label="VAT No." labelAr="الرقم الضريبي">
                <Input value={customer.customerVatNo} onChange={(e) => setC("customerVatNo", e.target.value)} placeholder="3xxxxxxxxxxxxx3" className={inputCls(false)} />
              </Field>
              <Field label="Contact person" labelAr="الشخص المسؤول" icon={UserRound}>
                <Input value={customer.contactPerson} onChange={(e) => setC("contactPerson", e.target.value)} placeholder="Mr. Nasir" className={inputCls(false)} />
              </Field>
              <Field label="Phone" labelAr="الهاتف" icon={Phone}>
                <Input value={customer.customerPhone} onChange={(e) => setC("customerPhone", e.target.value)} placeholder="+966 5x xxx xxxx" className={inputCls(false)} />
              </Field>
              <Field label="Email" labelAr="البريد الإلكتروني" icon={Mail}>
                <Input type="email" value={customer.customerEmail} onChange={(e) => setC("customerEmail", e.target.value)} placeholder="name@example.com" className={inputCls(false)} />
              </Field>
              <Field label="Address" labelAr="العنوان" icon={MapPin}>
                <Input value={customer.customerAddress} onChange={(e) => setC("customerAddress", e.target.value)} placeholder="Street, district, city" className={inputCls(false)} />
              </Field>
            </div>
          </Section>

          {/* Invoice details */}
          <Section icon={Receipt} title="Invoice details" titleAr="تفاصيل الفاتورة">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Reference / PO No." labelAr="رقم المرجع">
                <Input value={meta.referenceNo} onChange={(e) => setM("referenceNo", e.target.value)} placeholder="PO-2026-00250" className={inputCls(false)} />
              </Field>
              <Field label="Project / Location" labelAr="المشروع / الموقع">
                <Input value={meta.projectLocation} onChange={(e) => setM("projectLocation", e.target.value)} placeholder="Jubail" className={inputCls(false)} />
              </Field>
              <Field label="Payment terms" labelAr="شروط الدفع">
                <Input list="os-terms" value={meta.paymentTerms} onChange={(e) => setM("paymentTerms", e.target.value)} placeholder="Monthly" className={inputCls(false)} />
                <datalist id="os-terms">
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
            </div>
          </Section>

          {/* Lines */}
          <Section
            icon={Receipt}
            title="Services on this invoice"
            titleAr="تفاصيل الخدمة"
            action={
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1.5 rounded-lg">
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            }
          >
            <datalist id="os-units">
              {service.units.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>

            <div className="hidden grid-cols-12 gap-2 px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
              <span className="col-span-4">
                Description <span className="font-normal normal-case" dir="rtl">/ البيان</span>
              </span>
              <span className="col-span-2">{service.detailLabel}</span>
              <span className="col-span-1">Qty / Period</span>
              <span className="col-span-1">Unit</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => {
                const err = submitted ? lineErrors(it) : {};
                return (
                  <div key={it.id} className="rounded-2xl bg-slate-50/70 p-3 ring-1 ring-slate-200/70" data-testid="line">
                    <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-12">
                      <div className="col-span-2 md:col-span-4">
                        <Label className="mb-1 block text-[11px] text-slate-500 md:hidden">Description</Label>
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600">{idx + 1}</span>
                          <Input
                            value={it.description}
                            onChange={(e) => setItem(it.id, "description", e.target.value)}
                            placeholder={idx === 0 ? service.example : "Description"}
                            aria-label="Description"
                            className={inputCls(err.description)}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-2">
                        <Label className="mb-1 block text-[11px] text-slate-500 md:hidden">{service.detailLabel}</Label>
                        <Input
                          value={it.detail}
                          onChange={(e) => setItem(it.id, "detail", e.target.value)}
                          placeholder={service.detailLabel}
                          aria-label={service.detailLabel}
                          className={inputCls(false)}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label className="mb-1 block text-[11px] text-slate-500 md:hidden">Qty / Period</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={it.qty}
                          onChange={(e) => setItem(it.id, "qty", e.target.value)}
                          aria-label="Qty / Period"
                          className={inputCls(err.qty)}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label className="mb-1 block text-[11px] text-slate-500 md:hidden">Unit</Label>
                        <Input list="os-units" value={it.unit} onChange={(e) => setItem(it.id, "unit", e.target.value)} placeholder="unit" aria-label="Unit" className={inputCls(false)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="mb-1 block text-[11px] text-slate-500 md:hidden">Rate</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={it.rate}
                          onChange={(e) => setItem(it.id, "rate", e.target.value)}
                          placeholder="0.00"
                          aria-label="Rate"
                          className={`${inputCls(err.rate)} md:text-right`}
                        />
                      </div>
                      <div className="flex items-center gap-1 md:col-span-2">
                        <div className="flex h-10 flex-1 items-center justify-end gap-1 rounded-xl bg-white px-3 text-sm font-semibold tabular-nums text-slate-800 ring-1 ring-slate-200" data-testid="line-amount">
                          <SaudiRiyal className="h-3.5 w-3.5 opacity-50" />
                          {money(lineAmount(it))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          disabled={items.length === 1}
                          aria-label="Remove line"
                          className="grid h-10 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Notes */}
          <Section
            icon={NotebookPen}
            title="Service notes"
            titleAr="ملاحظات الخدمة"
            action={
              <Button type="button" variant="outline" size="sm" onClick={() => setNotes((n) => [...n, { id: uid(), label: "", value: "" }])} className="h-8 gap-1.5 rounded-lg">
                <Plus className="h-3.5 w-3.5" /> Add note
              </Button>
            }
          >
            <div className="space-y-2.5">
              {notes.map((n) => (
                <div key={n.id} className="grid grid-cols-12 items-center gap-2" data-testid="note">
                  <Input value={n.label} onChange={(e) => setNote(n.id, "label", e.target.value)} placeholder="Label" aria-label="Note label" className={`${inputCls(false)} col-span-4 font-medium`} />
                  <Input value={n.value} onChange={(e) => setNote(n.id, "value", e.target.value)} placeholder="Details" aria-label="Note details" className={`${inputCls(false)} col-span-7`} />
                  <button
                    type="button"
                    onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                    aria-label="Remove note"
                    className="col-span-1 grid h-10 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-slate-400">No notes. Add one if something should be printed under the table.</p>}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">Notes left empty are not printed.</p>
          </Section>
        </div>

        {/* ───────── Right: summary ───────── */}
        <aside className="h-fit space-y-4 xl:sticky xl:top-6">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Grand total <span className="normal-case" dir="rtl">· المجموع الكلي</span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-4xl font-bold tabular-nums" data-testid="grand-total">
              <SaudiRiyal size={28} className="opacity-70" />
              {money(totals.total)}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-300" data-testid="amount-words">
              {totals.total > 0 ? amountInWords(totals.total) : "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            {/* VAT switch */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Prices include 15% VAT</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {pricesIncludeVat ? "The rates you type already contain the VAT; it is shown separately." : "The rates you type are before VAT; 15% is added on top."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pricesIncludeVat}
                aria-label="Prices include 15% VAT"
                onClick={() => setPricesIncludeVat((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${pricesIncludeVat ? "bg-slate-800" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${pricesIncludeVat ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label className="flex items-center justify-between text-xs font-medium text-slate-600">
                Discount
                <span className="text-[11px] font-normal text-slate-400" dir="rtl">
                  الخصم
                </span>
              </Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
                aria-label="Discount"
                className={inputCls(discountTooHigh)}
              />
              {discountTooHigh && <p className="text-[11px] text-rose-500">More than the invoice total.</p>}
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm" data-testid="breakdown">
              <Row label={`Lines total (${pricesIncludeVat ? "incl." : "excl."} VAT)`} labelAr="إجمالي البنود" value={totals.subtotal} />
              {totals.discount > 0 && <Row label="Discount" labelAr="الخصم" value={-totals.discount} negative />}
              <Row label="Amount excl. VAT" labelAr="المبلغ بدون الضريبة" value={totals.netAmount} strong testId="net" />
              <Row label="VAT 15%" labelAr="ضريبة القيمة المضافة" value={totals.vatAmount} testId="vat" />
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3.5 py-3 text-white">
                <dt className="text-sm font-semibold">
                  Grand total
                  <span className="ms-2 text-[11px] font-normal text-slate-300" dir="rtl">
                    المجموع الكلي
                  </span>
                </dt>
                <dd className="flex items-center gap-1 text-lg font-bold tabular-nums" data-testid="total">
                  <SaudiRiyal size={15} className="opacity-70" />
                  {money(totals.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-2">
              <Button type="button" onClick={handleSave} disabled={loading} className="h-11 gap-2 rounded-xl">
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : isEdit ? "Update invoice" : "Save invoice"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/other-services/${invoiceId}` : "/other-services")} className="h-10 rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, labelAr, value, strong, negative, testId }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-600">
        {label}
        {labelAr && (
          <span className="ms-2 text-[11px] text-slate-400" dir="rtl">
            {labelAr}
          </span>
        )}
      </dt>
      <dd className={`tabular-nums ${strong ? "font-semibold text-slate-900" : "text-slate-700"} ${negative ? "text-rose-600" : ""}`} data-testid={testId}>
        {negative ? "−" : ""}
        {money(Math.abs(value))}
      </dd>
    </div>
  );
}
