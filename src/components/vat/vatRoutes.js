// Route rows and totals for the Submit VAT Report table.
//
// Zero-VAT routes carry no sales VAT or purchases VAT — their VAT is 15% of the
// profit alone. Every other route shows all of them (and there, 15% of sales −
// 15% of purchases is exactly 15% of the profit). Everything is added up in whole
// cents so the totals never drift by a stray fraction.

const toCents = (n) => Math.round((Number(n) || 0) * 100);
const fromCents = (c) => c / 100;

export const VAT_ROUTES = [
  { key: "ZERO_VAT", label: "Zero-VAT Routes", note: "Non-KSA routes", zero: true },
  { key: "DOMESTIC", label: "Domestic Routes", note: "KSA-only routes & hotels" },
  { key: "MIXED", label: "Mixed Routes", note: "KSA ↔ international" },
  // only when some sales have no route type saved, so the rows always add up
  { key: "OTHER", label: "No Route Type", note: "Route not saved", onlyIfUsed: true },
];

/** @param routes  `data.routes` from GET /api/sales/vat-report */
export function buildVatTable(routes) {
  const rows = VAT_ROUTES.filter((r) => !r.onlyIfUsed || (routes?.[r.key]?.count || 0) > 0).map((r) => {
    const d = routes?.[r.key] || {};
    return {
      key: r.key,
      label: r.label,
      note: r.note,
      zero: !!r.zero,
      count: d.count || 0,
      totalSales: d.totalSell || 0,
      // not applicable (null) for Zero-VAT routes
      salesVat: r.zero ? null : d.sellVat || 0,
      totalPurchases: d.totalNet || 0,
      purchasesVat: r.zero ? null : d.netVat || 0,
      profit: d.totalProfit || 0,
      profitVat: d.profitVat || 0,
    };
  });

  const sum = (field) => fromCents(rows.reduce((a, r) => a + toCents(r[field]), 0));
  const totals = {
    totalSales: sum("totalSales"),
    salesVat: sum("salesVat"), // Zero-VAT routes contribute nothing here
    totalPurchases: sum("totalPurchases"),
    purchasesVat: sum("purchasesVat"),
    profit: sum("profit"),
    profitVat: sum("profitVat"),
  };

  const zeroProfitVat = rows.find((r) => r.zero)?.profitVat || 0;
  // Output VAT − Input VAT on the VAT-bearing routes, plus the Zero-VAT routes' profit VAT
  const payableVat = fromCents(toCents(totals.salesVat) - toCents(totals.purchasesVat) + toCents(zeroProfitVat));

  return { rows, totals, outputVat: totals.salesVat, inputVat: totals.purchasesVat, zeroProfitVat, payableVat };
}
