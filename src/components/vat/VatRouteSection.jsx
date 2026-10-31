"use client";

import { SarAmount } from "./vatCommon";

// One row per route type. "OTHER" only appears when some sales have no route type
// saved, so the rows always add up to the total.
const ROUTES = [
  { key: "ZERO_VAT", label: "Zero-VAT routes" },
  { key: "DOMESTIC", label: "Domestic routes" },
  { key: "MIXED", label: "Mixed routes" },
  { key: "OTHER", label: "No route type", onlyIfUsed: true },
];

const Skeleton = ({ w = "w-24" }) => <span className="inline-block h-4 animate-pulse rounded bg-slate-200/70 align-middle" style={{ width: w === "w-24" ? "6rem" : "4rem" }} />;

/**
 * A VAT report section (Sales or Purchases): the amount per route type with its
 * 15% VAT, then a total row.
 *
 *   amountKey  field on each route holding the amount ("totalSell" | "totalNet")
 *   vatKey     field holding that route's VAT ("sellVat" | "netVat")
 */
export default function VatRouteSection({
  title,
  titleAr,
  amountLabel,
  vatLabel,
  amountKey,
  vatKey,
  routes,
  totalAmount,
  totalVat,
  loading,
}) {
  const visible = ROUTES.filter((r) => !r.onlyIfUsed || (routes?.[r.key]?.count || 0) > 0);

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
      <h2 className="px-5 pb-3 pt-4 text-[15px] font-semibold text-slate-900">
        {title}
        <span className="ml-2 text-[11px] font-normal text-slate-400" dir="rtl">
          {titleAr}
        </span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-2.5 text-left">Route</th>
              <th className="px-5 py-2.5 text-right">{amountLabel}</th>
              <th className="px-5 py-2.5 text-right">{vatLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map(({ key, label }) => (
              <tr key={key}>
                <td className="px-5 py-3 font-medium text-slate-700">{label}</td>
                <td className="px-5 py-3 text-right">
                  {loading ? <Skeleton /> : <SarAmount value={routes?.[key]?.[amountKey]} className="text-slate-800" />}
                </td>
                <td className="px-5 py-3 text-right">
                  {loading ? <Skeleton w="w-16" /> : <SarAmount value={routes?.[key]?.[vatKey]} className="text-slate-600" />}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="vat-print-exact border-t-2 border-slate-300 bg-slate-100">
              <td className="px-5 py-3 font-semibold text-slate-900">Total</td>
              <td className="px-5 py-3 text-right">
                {loading ? <Skeleton /> : <SarAmount value={totalAmount} className="font-bold text-slate-900" />}
              </td>
              <td className="px-5 py-3 text-right">
                {loading ? <Skeleton w="w-16" /> : <SarAmount value={totalVat} className="font-bold text-slate-900" />}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
