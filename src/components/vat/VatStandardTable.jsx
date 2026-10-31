"use client";

import { SarAmount } from "./vatCommon";

const Skeleton = () => (
  <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200/70 align-middle" />
);

/**
 * One side of the VAT return: Standard Rated Sales or Standard Rated Purchases.
 * `data` is `sales` / `purchases` from buildStandardRated().
 */
export default function VatStandardTable({ title, titleAr, totalLabel, data, loading }) {
  const cell = (value, className = "text-slate-700") =>
    loading ? <Skeleton /> : <SarAmount value={value} className={className} />;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-5 pt-5">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {titleAr && (
          <span className="text-xs text-slate-400" dir="rtl">
            {titleAr}
          </span>
        )}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 text-left">Category</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">VAT (15%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((r) => (
              <tr key={r.key}>
                <td className="px-5 py-3.5">
                  <span className="block font-medium text-slate-800">{r.label}</span>
                  <span className="block text-[10px] text-slate-400">{r.basis}</span>
                </td>
                <td className="px-5 py-3.5 text-right">{cell(r.amount)}</td>
                <td className="px-5 py-3.5 text-right">{cell(r.vat, "text-slate-600")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="vat-print-exact border-t-2 border-slate-300 bg-slate-100 text-slate-900">
              <td className="px-5 py-3.5 font-semibold">{totalLabel}</td>
              <td className="px-5 py-3.5 text-right">{cell(data.total, "font-bold")}</td>
              <td className="px-5 py-3.5 text-right">{cell(data.vat, "font-bold")}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
