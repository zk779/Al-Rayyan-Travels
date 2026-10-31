"use client";

import { SarAmount } from "./vatCommon";

const Skeleton = ({ narrow }) => (
  <span className="inline-block h-4 animate-pulse rounded bg-slate-200/70 align-middle" style={{ width: narrow ? "3.5rem" : "5rem" }} />
);

// Zero-VAT routes: sales VAT / purchases VAT don't apply — only profit VAT does.
const NotApplicable = () => (
  <span className="text-slate-300" title="Not applicable — Zero-VAT routes are taxed on profit only">
    —
  </span>
);

const HEADINGS = [
  { label: "Route", ar: "المسار", align: "left" },
  { label: "Total Sales", ar: "إجمالي المبيعات" },
  // { label: "Sales VAT (15%)", ar: "ضريبة المبيعات (15%)" },
  { label: "Total Purchases", ar: "إجمالي المشتريات" },
  // { label: "Purchases VAT (15%)", ar: "ضريبة المشتريات (15%)" },
  { label: "Profit", ar: "الربح" },
  // { label: "Profit VAT (15%)", ar: "ضريبة الربح (15%)" },
];

/** The single Submit-VAT table: one row per route type, plus a Total row. `table` comes from buildVatTable(). */
export default function VatRouteTable({ table, loading }) {
  const { rows, totals } = table;

  const cell = (value, className = "text-slate-700") =>
    loading ? <Skeleton /> : <SarAmount value={value} className={className} />;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {HEADINGS.map((h) => (
                <th key={h.label} className={`px-4 py-3 ${h.align === "left" ? "text-left" : "text-right"}`}>
                  {h.label}
                  <span className="block text-[10px] font-normal normal-case tracking-normal text-slate-400" dir="rtl">
                    {h.ar}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="px-4 py-3.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-slate-800">{r.label}</span>
                    <span className="text-[11px] text-slate-400" dir="rtl">
                      {r.labelAr}
                    </span>
                  </span>
                  {r.zero && <span className="block text-[10px] text-slate-400">Zero-VAT VAT on profit only</span>}
                </td>
                <td className="px-4 py-3.5 text-right">{cell(r.totalSales)}</td>
                {/* <td className="px-4 py-3.5 text-right">{r.zero ? <NotApplicable /> : cell(r.salesVat, "text-slate-600")}</td> */}
                <td className="px-4 py-3.5 text-right">{cell(r.totalPurchases)}</td>
                {/* <td className="px-4 py-3.5 text-right">
                  {r.zero ? <NotApplicable /> : cell(r.purchasesVat, "text-slate-600")}
                </td> */}
                <td className="px-4 py-3.5 text-right">
                  {cell(r.profit, r.profit < 0 ? "text-rose-600" : "text-slate-800")}
                </td>
                {/* <td className="px-4 py-3.5 text-right">
                  {cell(r.profitVat, r.zero ? "font-semibold text-slate-900" : "text-slate-600")}
                </td> */}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="vat-print-exact border-t-2 border-slate-300 bg-slate-100 text-slate-900">
              <td className="px-4 py-3.5 font-semibold">
                <span className="flex items-baseline justify-between gap-3">
                  Total
                  <span className="text-[11px] font-normal text-slate-500" dir="rtl">
                    الإجمالي
                  </span>
                </span>
              </td>
              <td className="px-4 py-3.5 text-right">{cell(totals.totalSales, "font-bold")}</td>
              {/* <td className="px-4 py-3.5 text-right">{cell(totals.salesVat, "font-bold")}</td> */}
              <td className="px-4 py-3.5 text-right">{cell(totals.totalPurchases, "font-bold")}</td>
              {/* <td className="px-4 py-3.5 text-right">{cell(totals.purchasesVat, "font-bold")}</td> */}
              <td className="px-4 py-3.5 text-right">{cell(totals.profit, "font-bold")}</td>
              {/* <td className="px-4 py-3.5 text-right">{cell(totals.profitVat, "font-bold")}</td> */}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
