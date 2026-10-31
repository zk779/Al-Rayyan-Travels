"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  FileBarChart2,
  Printer,
  TrendingUp,
  ShoppingCart,
  Undo2,
  Landmark,
  Loader2,
  Info,
  ArrowLeft,
  AlertCircle,
  Receipt,
  SaudiRiyal,
    ListTree,
  Globe2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../../shadcn/components/ui/badge";
import { Checkbox } from "../../shadcn/components/ui/checkbox";
import { Label } from "../../shadcn/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import VatPeriodPicker from "../components/vat/VatPeriodPicker";
import { PrintLetterhead, SarAmount } from "../components/vat/vatCommon";
import { money } from "../components/vat/vatFormat";
import { rangeParams, useVatPeriod } from "../components/vat/vatPeriod";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const getPaymentBadge = (type) => {
  const map = {
    CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CREDIT: "bg-blue-50 text-blue-700 border-blue-200",
    BANK_TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
    POS: "bg-cyan-50 text-cyan-700 border-cyan-200",
    PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[type?.toUpperCase()] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {type || "N/A"}
    </Badge>
  );
};

const Skeleton = ({ w = "w-20" }) => <span className={`inline-block h-4 ${w} animate-pulse rounded bg-slate-100`} />;

/** Submit VAT Report — output VAT, input VAT and net VAT payable for the ZATCA return. */
export default function VatReport() {
  const period = useVatPeriod();
  const { range, ready, label: periodLabel } = period;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Live preview: reloads whenever the period changes
  const fromKey = range.from ? range.from.getTime() : null;
  const toKey = range.to ? range.to.getTime() : null;
  useEffect(() => {
    if (!ready) {
      setReport(null);
      setError("");
      return undefined;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError("");
    const qs = new URLSearchParams(rangeParams(range)).toString();
    fetch(`${API_BASE}/api/sales/vat-report?${qs}`, { headers: authHeaders(), signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to generate VAT report");
        setReport(json.data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setReport(null);
        setError(err.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey, toKey, ready]);

  const r = report || {};
  // Payable VAT = selling VAT − purchasing VAT (worked out here, not by the API).
  // Refund VAT is neither subtracted nor displayed on this page.
  const payableVat = Math.round(((r.sellingVat || 0) - (r.purchasingVat || 0) + Number.EPSILON) * 100) / 100;
  // Sales on a ZERO_VAT route (non-KSA) — a subset of the sales above
  const zeroVatSales = (report?.sales || []).filter((s) => s.routeType === "ZERO_VAT");
  const zeroVat = r.zeroVat || { count: 0, totalSell: 0, totalNet: 0 };
  const zeroShare = r.totalSell > 0 ? (zeroVat.totalSell / r.totalSell) * 100 : 0;
  const rows = [
    {
      label: "Sales",
      labelAr: "المبيعات",
      icon: TrendingUp,
      tint: "bg-slate-100 text-slate-700",
      amount: r.totalSell,
      vat: r.sellingVat,
      hint: "Sell × 15%",
    },
    {
      label: "Purchases",
      labelAr: "المشتريات",
      icon: ShoppingCart,
      tint: "bg-slate-100 text-slate-600",
      amount: r.totalNet,
      vat: r.purchasingVat,
      neg: true,
      hint: "Net × 15%",
    },
  ];

  return (
    <div className="min-h-screen print:min-h-0">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          body { background: white !important; }
          /* the on-screen horizontal scroll must not clip the printed tables */
          [data-slot="table-container"] { overflow: visible !important; }
          table { min-width: 0 !important; width: 100% !important; }
          .vat-print-exact, .vat-print-exact * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto w-full pb-10">
        {/* Header */}
        <div className="print:hidden">
          <Link
            to="/vat"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> VAT
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-md shadow-slate-900/25">
              <FileBarChart2 size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Submit VAT Report</h1>
              <p className="text-sm text-slate-500">
                Output VAT, input VAT and net VAT payable for your ZATCA return.
              </p>
            </div>
          </div>
        </div>

        <PrintLetterhead title="VAT Report" periodLabel={periodLabel} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] print:block">
          {/* Settings */}
          <section className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 md:p-6 lg:sticky lg:top-6 print:hidden">
            <VatPeriodPicker period={period} disabled={loading} />

            <div className="mt-6 flex items-center gap-2">
              <Checkbox id="showBreakdown" checked={showBreakdown} onCheckedChange={(v) => setShowBreakdown(!!v)} />
              <Label htmlFor="showBreakdown" className="cursor-pointer text-sm text-slate-600">
                Include sales &amp; refunds breakdown
              </Label>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={!report || loading}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={17} /> Print report
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">Prints exactly what you see on the right</p>
          </section>

          {/* Preview */}
          <section className="space-y-4 min-w-0">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 print:hidden">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {!ready && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center print:hidden">
                <span className="rounded-full bg-slate-100 p-3 text-slate-500">
                  <FileBarChart2 className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-slate-700">Pick a start and/or end date to see the report</p>
              </div>
            )}

            {ready && (
              <>
                {/* Headline */}
                <div className="vat-print-exact relative overflow-hidden rounded-2xl bg-gradient-to-tl from-gray-700 to-gray-900 p-6 text-white shadow-lg print:rounded-lg print:shadow-none">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl print:hidden" />
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-300">
                        <Landmark size={14} /> Total payable VAT
                        <span className="normal-case text-[11px] opacity-70" dir="rtl">
                          · إجمالي ضريبة القيمة المضافة المستحقة
                        </span>
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-4xl font-bold tabular-nums">
                        {loading ? (
                          <Loader2 className="animate-spin" size={30} />
                        ) : (
                          <>
                            <SaudiRiyal size={28} />
                            {money(payableVat)}
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">Selling VAT − Purchasing VAT</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">VAT rate 15%</span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-200">
                        <Receipt size={13} /> {periodLabel}
                        {report && (
                          <>
                            <span className="opacity-40">•</span>
                            {r.saleCount} sale{r.saleCount === 1 ? "" : "s"}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="relative mt-5 grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Output VAT (sales)", r.sellingVat],
                      ["Input VAT (purchases)", r.purchasingVat],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-xl bg-white/10 px-3 py-2.5">
                        <p className="text-gray-300">{l}</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums">{loading ? "…" : money(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                  <div className="flex items-center justify-between px-5 pt-5">
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <ListTree size={16} className="text-slate-600" /> Breakdown
                    </h2>
                    <span className="text-xs text-slate-400">{periodLabel}</span>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-2.5 text-left">Category</th>
                          <th className="px-5 py-2.5 text-right">Amount</th>
                          <th className="px-5 py-2.5 text-right">VAT (15%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((row) => (
                          <tr key={row.label}>
                            <td className="px-5 py-3">
                              <span className="flex items-center gap-3">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${row.tint}`}>
                                  <row.icon size={15} />
                                </span>
                                <span>
                                  <span className="block font-medium text-slate-700">{row.label}</span>
                                  <span className="block text-[10px] text-slate-400">
                                    {row.hint} · <span dir="rtl">{row.labelAr}</span>
                                  </span>
                                </span>
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              {loading ? <Skeleton /> : <SarAmount value={row.amount} className="text-slate-700" />}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {loading ? (
                                <Skeleton w="w-16" />
                              ) : (
                                <SarAmount
                                  value={row.neg ? -Math.abs(row.vat || 0) : row.vat}
                                  className={row.neg ? "text-rose-600" : "font-semibold text-slate-900"}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="vat-print-exact bg-slate-100">
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            Total payable VAT
                            <span className="block text-[10px] font-normal text-slate-500">
                              Sales VAT − Purchases VAT
                            </span>
                          </td>
                          <td />
                          <td className="px-5 py-3.5 text-right">
                            {loading ? <Skeleton w="w-20" /> : <SarAmount value={payableVat} className="text-base font-bold text-slate-900" />}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {!loading && !report && !error && (
                    <p className="flex items-center gap-2 px-5 py-4 text-xs text-amber-600">
                      <Info size={14} /> No data for this period.
                    </p>
                  )}
                  <p className="px-5 pb-4 pt-3 text-[11px] text-slate-400">
                    Exclusive VAT: 15% added on top of the net and selling totals.
                  </p>
                </div>

                {/* Zero-VAT route sales — a subset of the sales counted above */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                  <div className="flex items-center justify-between px-5 pt-5">
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <Globe2 size={16} className="text-slate-600" /> Zero-VAT route sales
                      <span className="text-xs font-normal text-slate-400">· route type ZERO_VAT (non-KSA)</span>
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {loading ? "…" : `${zeroVat.count} sale${zeroVat.count === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total sales</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">
                        {loading ? <Skeleton w="w-24" /> : <SarAmount value={zeroVat.totalSell} size={15} />}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total net</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">
                        {loading ? <Skeleton w="w-24" /> : <SarAmount value={zeroVat.totalNet} size={15} />}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Share of all sales</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-900">{loading ? <Skeleton w="w-16" /> : `${zeroShare.toFixed(1)}%`}</p>
                    </div>
                  </div>
                </div>

                {/* Optional breakdown tables */}
                {showBreakdown && report && !loading && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                      <h3 className="flex items-center gap-2 px-5 pt-5 text-[15px] font-semibold text-slate-900">
                        <Globe2 size={16} className="text-slate-600" /> Zero-VAT route sales
                        <span className="text-xs font-normal text-slate-400">({zeroVatSales.length})</span>
                      </h3>
                      {zeroVatSales.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-500">No Zero-VAT route sales in this period.</p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/70">
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Document #</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                                <TableHead className="text-right">Sell</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {zeroVatSales.map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell className="whitespace-nowrap text-xs">
                                    {s.saleDate ? format(new Date(s.saleDate), "dd MMM yyyy") : "—"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{s.invoiceNo || "—"}</TableCell>
                                  <TableCell className="font-mono text-xs">{s.documentNo || "—"}</TableCell>
                                  <TableCell className="max-w-[140px] truncate text-xs" title={s.vendorName}>
                                    {s.vendorName || "—"}
                                  </TableCell>
                                  <TableCell>{getPaymentBadge(s.paymentType)}</TableCell>
                                  <TableCell className="text-right text-xs font-medium tabular-nums">{money(s.netPrice)}</TableCell>
                                  <TableCell className="text-right text-xs font-medium tabular-nums">{money(s.sellPrice)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="vat-print-exact bg-slate-100 hover:bg-slate-100">
                                <TableCell colSpan={5} className="text-xs font-semibold text-slate-900">
                                  Total · {zeroVatSales.length} sale{zeroVatSales.length === 1 ? "" : "s"}
                                </TableCell>
                                <TableCell className="text-right text-xs font-semibold tabular-nums text-slate-900">{money(zeroVat.totalNet)}</TableCell>
                                <TableCell className="text-right text-xs font-semibold tabular-nums text-slate-900">{money(zeroVat.totalSell)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                      <h3 className="flex items-center gap-2 px-5 pt-5 text-[15px] font-semibold text-slate-900">
                        <FileBarChart2 size={16} className="text-slate-600" /> Contributing sales
                        <span className="text-xs font-normal text-slate-400">({report.sales.length})</span>
                      </h3>
                      {report.sales.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-500">No sales in this period.</p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/70">
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Document #</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                                <TableHead className="text-right">Sell</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.sales.map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell className="whitespace-nowrap text-xs">
                                    {s.saleDate ? format(new Date(s.saleDate), "dd MMM yyyy") : "—"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{s.invoiceNo || "—"}</TableCell>
                                  <TableCell className="font-mono text-xs">{s.documentNo || "—"}</TableCell>
                                  <TableCell className="max-w-[140px] truncate text-xs" title={s.vendorName}>
                                    {s.vendorName || "—"}
                                  </TableCell>
                                  <TableCell>{getPaymentBadge(s.paymentType)}</TableCell>
                                  <TableCell className="text-right text-xs font-medium tabular-nums">{money(s.netPrice)}</TableCell>
                                  <TableCell className="text-right text-xs font-medium tabular-nums">{money(s.sellPrice)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                      <h3 className="flex items-center gap-2 px-5 pt-5 text-[15px] font-semibold text-slate-900">
                        <Undo2 size={16} className="text-rose-600" /> Contributing refunds
                        <span className="text-xs font-normal text-slate-400">({report.refunds.length})</span>
                      </h3>
                      {report.refunds.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-500">No refunds in this period.</p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/70">
                                <TableHead>Refund date</TableHead>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Document #</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right">Paid to customer</TableHead>
                                <TableHead className="text-right">Original profit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {report.refunds.map((rf) => (
                                <TableRow key={rf.id}>
                                  <TableCell className="whitespace-nowrap text-xs">
                                    {rf.refundDate ? format(new Date(rf.refundDate), "dd MMM yyyy") : "—"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{rf.invoiceNo || "—"}</TableCell>
                                  <TableCell className="font-mono text-xs">{rf.documentNo || "—"}</TableCell>
                                  <TableCell className="max-w-[180px] truncate text-xs" title={rf.refundReason}>
                                    {rf.refundReason || "—"}
                                  </TableCell>
                                  <TableCell className="text-right text-xs tabular-nums text-slate-500">
                                    {money(rf.netRefundToCustomer)}
                                  </TableCell>
                                  <TableCell className="text-right text-xs font-semibold tabular-nums text-rose-700">
                                    {money(rf.originalProfit)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
