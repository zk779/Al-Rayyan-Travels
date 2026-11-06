"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import ZATCAQRCode from "../components/ZATCAQRGenerator";
import { companyData } from "../components/vat/vatFormat";
import { serviceOf } from "../components/otherServices/serviceTypes";
import { amountInWords } from "../utils/numberToWords";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const money = (v) => (Number(v) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-") : "N/A";

// English and Arabic never share a line (the browser's bidi reordering scrambles label/value
// pairs), so each bilingual field is its own English line plus its own right-aligned Arabic line.
const companyRows = [
  { label: "Address", labelAr: "العنوان", value: companyData.address, valueAr: companyData.addressArabic },
  { label: "CR Number", labelAr: "رقم السجل التجاري", value: companyData.crNumber, valueAr: companyData.crNumberArabic, mono: true },
  { label: "TRN", labelAr: "الرقم الضريبي", value: companyData.trn, valueAr: companyData.trnArabic, mono: true },
  { label: "Phone", labelAr: "الهاتف", value: companyData.phone, valueAr: companyData.phoneArabic },
  { label: "Email / Website", labelAr: "البريد / الموقع الإلكتروني", value: `${companyData.email} | ${companyData.website}` },
];

const Pair = ({ label, labelAr, value, mono }) =>
  value ? (
    <div className="flex items-baseline gap-2 py-1.5 text-xs">
      <span className="shrink-0 text-gray-500">
        {label}
        <span className="ms-1 text-[10px]" dir="rtl">
          {labelAr}
        </span>
        :
      </span>
      <span className={`font-semibold text-gray-900 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  ) : null;

/** The printable invoice for an "Other Service" — same letterhead as the sales invoices. */
export default function OtherServiceInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/other-services/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          signal: controller.signal,
        });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.error || "Failed to load the invoice");
        setInvoice(body.data);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }
  if (error || !invoice) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <p className="text-lg font-semibold text-red-600">Error loading invoice</p>
          <p className="mt-1 text-gray-600">{error || "No invoice data found"}</p>
          <Link to="/other-services" className="mt-4 inline-block text-sm font-medium text-slate-700 underline">
            Back to Other Services
          </Link>
        </div>
      </div>
    );
  }

  const service = serviceOf(invoice.serviceType);
  const qrData = {
    sellerName: companyData.name,
    vatNumber: companyData.trn,
    totalWithVat: Number(invoice.total) || 0,
    vatTotal: Number(invoice.vatAmount) || 0,
    timestamp: new Date(invoice.createdAt || invoice.invoiceDate).toISOString(),
  };
  const customerRows = [
    { label: "Customer Name", labelAr: "اسم العميل", value: invoice.customerName },
    { label: "CR / ID No.", labelAr: "السجل التجاري / الهوية", value: invoice.customerCrNo, mono: true },
    { label: "VAT No.", labelAr: "الرقم الضريبي", value: invoice.customerVatNo, mono: true },
    { label: "Contact", labelAr: "المسؤول", value: invoice.contactPerson },
    { label: "Phone", labelAr: "الهاتف", value: invoice.customerPhone },
    { label: "Email", labelAr: "البريد الإلكتروني", value: invoice.customerEmail },
    { label: "Address", labelAr: "العنوان", value: invoice.customerAddress },
  ].filter((r) => r.value);

  return (
    <>
      <style>
        {`
          @page { size: A4; margin: 8mm; }
          @media print {
            body { background: white !important; padding: 0 !important; }
            .invoice-container { background: white !important; padding-top: 0 !important; padding-bottom: 0 !important; }
            .os-keep { break-inside: avoid; }
            .os-print-exact, .os-print-exact * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>

      <div className="invoice-container min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-6 print:py-0">
        {/* Actions — screen only */}
        <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => navigate("/other-services")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Other Services
          </button>
          <div className="flex items-center gap-2">
            {hasPermission("SALE_EDIT") && (
              <Link
                to={`/other-services/${invoice.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-[210mm] overflow-hidden rounded-2xl bg-white shadow-xl print:rounded-none print:shadow-none" style={{ fontFamily: "Arial, sans-serif" }}>
          <div className="p-8 print:p-0">
            {/* Letterhead — same as the sales invoice */}
            <div className="mb-1 flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="mb-0.5 text-xl font-bold uppercase tracking-wide text-gray-900">
                    <div>{companyData.name}</div>
                    <div>{companyData.nameArabic}</div>
                  </div>
                  <div className="space-y-2 rounded border border-gray-300 bg-gray-50 p-4 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Invoice No. / رقم الفاتورة:</span>
                      <span className="font-bold text-gray-900" data-testid="print-invoice-no">
                        {invoice.invoiceNo}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Date / تاريخ:</span>
                      <span className="font-semibold text-gray-900">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    {invoice.referenceNo && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Ref. No. / رقم المرجع:</span>
                        <span className="font-semibold text-gray-900">{invoice.referenceNo}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {companyRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[12px] font-bold uppercase tracking-wide text-gray-500">{row.label}</div>
                        <div className={`text-gray-900 ${row.mono ? "font-mono" : ""}`}>{row.value || "—"}</div>
                      </div>
                      <div className="text-right" dir="rtl">
                        <div className="text-[12px] font-bold text-gray-500">{row.labelAr}</div>
                        <div className={`text-gray-900 ${row.mono ? "font-mono" : ""}`}>{row.valueAr || ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Service description */}
            <div className="mb-2 mt-2 rounded border border-gray-300 bg-gray-100 px-3 py-2 text-[15px]">
              <div className="flex flex-wrap gap-3">
                <span className="font-bold text-gray-800">Description / الوصف :</span>
                <span className="font-medium text-gray-600">
                  {service.label} <span dir="rtl">/ {service.labelAr}</span>
                </span>
              </div>
            </div>

            <div className="os-print-exact mb-4 flex items-center justify-center gap-8 rounded bg-gradient-to-tl from-gray-600 to-gray-700 py-1 text-white">
              <h2 className="text-lg font-bold">TAX INVOICE</h2>
              <p className="text-lg font-bold" dir="rtl">
                فاتورة ضريبية
              </p>
            </div>

            {/* Customer + job details */}
            <div className="os-keep mb-3 overflow-hidden rounded-md border border-gray-200">
              <div className="grid grid-cols-2 border-b-2 border-gray-400 bg-gray-100">
                <div className="border-r border-gray-300 px-4 py-2.5">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Customer Information</h3>
                </div>
                <div className="px-4 py-2.5 text-right" dir="rtl">
                  <h3 className="text-sm font-bold text-gray-900">معلومات العميل</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-6 px-4 py-2 sm:grid-cols-2 print:grid-cols-2">
                {customerRows.map((r) => (
                  <Pair key={r.label} {...r} />
                ))}
                <Pair label="Project / Location" labelAr="المشروع / الموقع" value={invoice.projectLocation} />
                <Pair label="Payment Terms" labelAr="شروط الدفع" value={invoice.paymentTerms} />
              </div>
            </div>

            {/* Lines */}
            <div className="os-keep mb-3 overflow-hidden rounded-md border border-gray-300">
              <table className="w-full text-xs">
                <thead>
                  <tr className="os-print-exact bg-gradient-to-tl from-gray-600 to-gray-700 text-white">
                    <th className="border-r border-gray-500 px-2 py-2 text-center font-semibold">#</th>
                    <th className="border-r border-gray-500 px-2 py-2 text-left font-semibold">
                      Description <span className="font-normal opacity-90" dir="rtl">/ البيان</span>
                    </th>
                    <th className="border-r border-gray-500 px-2 py-2 text-left font-semibold">{invoice.detailLabel || service.detailLabel}</th>
                    <th className="border-r border-gray-500 px-2 py-2 text-right font-semibold">
                      Qty / Period <span className="font-normal opacity-90" dir="rtl">/ الكمية</span>
                    </th>
                    <th className="border-r border-gray-500 px-2 py-2 text-left font-semibold">
                      Unit <span className="font-normal opacity-90" dir="rtl">/ الوحدة</span>
                    </th>
                    <th className="border-r border-gray-500 px-2 py-2 text-right font-semibold">
                      Rate <span className="font-normal opacity-90" dir="rtl">/ السعر</span>
                    </th>
                    <th className="px-2 py-2 text-right font-semibold">
                      Amount <span className="font-normal opacity-90" dir="rtl">/ المبلغ</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it, i) => (
                    <tr key={i} className="align-top odd:bg-white even:bg-gray-50/60">
                      <td className="border-r border-t border-gray-300 px-2 py-2 text-center text-gray-500">{i + 1}</td>
                      <td className="border-r border-t border-gray-300 px-2 py-2 font-semibold text-gray-900 [overflow-wrap:anywhere]">{it.description}</td>
                      <td className="border-r border-t border-gray-300 px-2 py-2 text-gray-700 [overflow-wrap:anywhere]">{it.detail || "—"}</td>
                      <td className="border-r border-t border-gray-300 px-2 py-2 text-right tabular-nums">{Number(it.qty)}</td>
                      <td className="border-r border-t border-gray-300 px-2 py-2">{it.unit || "—"}</td>
                      <td className="border-r border-t border-gray-300 px-2 py-2 text-right tabular-nums">{money(it.rate)}</td>
                      <td className="border-t border-gray-300 px-2 py-2 text-right font-semibold tabular-nums text-gray-900">{money(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-gray-300 bg-gray-50 px-3 py-1.5 text-[10px] text-gray-500">
                {invoice.pricesIncludeVat
                  ? "Rates and amounts above include 15% VAT. / الأسعار والمبالغ أعلاه شاملة ضريبة القيمة المضافة 15%."
                  : "Rates and amounts above are before 15% VAT. / الأسعار والمبالغ أعلاه قبل ضريبة القيمة المضافة 15%."}
              </p>
            </div>

            {/* Notes */}
            {invoice.notes?.length > 0 && (
              <div className="os-keep mb-3 rounded-md border border-gray-200">
                <div className="grid grid-cols-2 border-b border-gray-300 bg-gray-100 px-4 py-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-900">Service Notes</h3>
                  <h3 className="text-right text-xs font-bold text-gray-900" dir="rtl">
                    ملاحظات الخدمة
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-x-6 px-4 py-2 print:grid-cols-2 sm:grid-cols-2">
                  {invoice.notes.map((n, i) => (
                    <Pair key={i} label={n.label} value={n.value} />
                  ))}
                </div>
              </div>
            )}

            {/* Summary + QR */}
            <div className="os-keep mb-3 flex flex-row-reverse items-start justify-between gap-6">
              <div className="w-full max-w-[330px] overflow-hidden rounded-lg border border-gray-300 shadow-sm">
                <table className="w-full text-xs">
                  <tbody>
                    {invoice.discount > 0 && (
                      <tr className="border-b border-gray-300">
                        <td className="px-4 py-2.5 font-medium text-gray-700">Lines total / إجمالي البنود</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">SAR {money(invoice.subtotal)}</td>
                      </tr>
                    )}
                    {invoice.discount > 0 && (
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-700">Discount / الخصم</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-600">− SAR {money(invoice.discount)}</td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-300">
                      <td className="px-4 py-3 font-medium text-gray-700">Amount excl. VAT / المبلغ بدون الضريبة</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900" data-testid="print-net">
                        SAR {money(invoice.netAmount)}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300 bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">VAT 15% / ضريبة القيمة المضافة</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900" data-testid="print-vat">
                        SAR {money(invoice.vatAmount)}
                      </td>
                    </tr>
                    <tr className="os-print-exact bg-gradient-to-tl from-gray-600 to-gray-700 text-white">
                      <td className="px-4 py-3.5 text-sm font-bold uppercase tracking-wide">Grand Total / المجموع الكلي</td>
                      <td className="px-4 py-3.5 text-right text-xl font-bold tracking-wide" data-testid="print-total">
                        SAR {money(invoice.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-2">
                <ZATCAQRCode invoiceData={qrData} />
              </div>
            </div>

            <div className="os-keep mb-4 rounded border border-gray-300 bg-gray-50 px-4 py-2.5 text-xs">
              <span className="font-bold text-gray-800">Amount in Words / المبلغ كتابةً : </span>
              <span className="font-medium text-gray-700">{amountInWords(invoice.total)}</span>
            </div>

            {/* Acceptance */}
            <div className="os-keep mb-4 grid grid-cols-2 gap-6 text-xs">
              <div className="rounded-md border border-gray-300 p-3">
                <p className="font-bold text-gray-800">
                  Issued by <span className="font-normal" dir="rtl">/ أصدرها</span>
                </p>
                <p className="mt-1 text-gray-600">{invoice.user?.fullName || "—"}</p>
                <div className="mt-8 border-t border-dashed border-gray-400 pt-1 text-[10px] text-gray-500">Signature &amp; Stamp / التوقيع والختم</div>
              </div>
              <div className="rounded-md border border-gray-300 p-3">
                <p className="font-bold text-gray-800">
                  Agreed &amp; accepted by <span className="font-normal" dir="rtl">/ وافق عليه</span>
                </p>
                <p className="mt-1 text-gray-600">{invoice.contactPerson || invoice.customerName}</p>
                <div className="mt-8 border-t border-dashed border-gray-400 pt-1 text-[10px] text-gray-500">Signature &amp; Stamp / التوقيع والختم</div>
              </div>
            </div>

            {/* Terms */}
            <div className="os-keep border-t-2 border-gray-300 pt-4">
              <div className="space-y-1.5 rounded border border-gray-200 bg-gray-50 p-3 text-[10px] leading-relaxed text-gray-600">
                <p>
                  • This is a computer generated invoice. / هذه فاتورة تم إنشاؤها بواسطة الكمبيوتر.
                </p>
                <p>
                  • If you have any queries or dispute on the invoice, please raise the query within 7 days of the invoice otherwise we consider it as accepted. /
                  إذا كان لديك أي استفسارات أو نزاع بشأن الفاتورة، يرجى طرح الاستفسار في غضون 7 أيام من الفاتورة وإلا سنعتبرها مقبولة.
                </p>
              </div>
              <p className="mt-3 text-center text-[11px] font-semibold text-gray-700">
                Thank you for your business <span dir="rtl">/ شكراً لتعاملكم معنا</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
