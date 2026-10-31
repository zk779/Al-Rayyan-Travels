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

/**
 * Standard-rated sales and purchases, and the VAT payable on them.
 *
 *  Sales:      Domestic sales + Zero-VAT profit + Mixed profit + No-route sales
 *              (Zero-VAT and Mixed routes count their profit only, never their sales)
 *  Purchases:  Domestic purchases + Returnable-VAT expenses + Tabby/Tamara fees
 *              (Zero-VAT / Mixed routes have no purchases; the expenses and fees count excl. VAT,
 *              each with the VAT paid on it)
 *  Payable VAT = VAT on the sales − VAT on the purchases
 *
 * @param routes      `data.routes` from GET /api/sales/vat-report
 * @param returnable  summarizeReturnable() of the period's Returnable-VAT expenses
 * @param tabby       `data.tabby` from the same report: the fee + VAT paid to Tabby/Tamara
 */
export function buildStandardRated(routes, returnable, tabby) {
  const table = buildVatTable(routes);
  const byKey = Object.fromEntries(table.rows.map((r) => [r.key, r]));

  const salesRows = ["DOMESTIC", "ZERO_VAT", "MIXED", "OTHER"]
    .filter((k) => byKey[k])
    .map((k) => {
      const r = byKey[k];
      // Zero-VAT and Mixed routes are counted on profit alone
      return r.zero || k === "MIXED"
        ? { key: k, label: r.label, basis: "Profit", amount: r.profit, vat: r.profitVat }
        : { key: k, label: r.label, basis: "Total sales", amount: r.totalSales, vat: r.salesVat };
    });

  const purchaseRows = ["DOMESTIC"]
    .filter((k) => byKey[k])
    .map((k) => ({
      key: k,
      label: byKey[k].label,
      basis: "Total purchases",
      amount: byKey[k].totalPurchases,
      vat: byKey[k].purchasesVat,
    }));
  const ret = returnable || { net: 0, vat: 0, count: 0 };
  purchaseRows.push({
    key: "RETURNABLE",
    label: "Returnable VAT Expenses",
    basis: `Net, excl. VAT · ${ret.count} expense${ret.count === 1 ? "" : "s"}`,
    amount: ret.net,
    vat: ret.vat,
  });
  const tb = tabby || { count: 0, fee: 0, vat: 0 };
  purchaseRows.push({
    key: "TABBY",
    label: "Tabby / Tamara Fees",
    basis: `Fee excl. VAT · ${tb.count} sale${tb.count === 1 ? "" : "s"}`,
    amount: tb.fee || 0,
    vat: tb.vat || 0,
  });

  const sum = (rows, field) => fromCents(rows.reduce((a, r) => a + toCents(r[field]), 0));
  const sales = { rows: salesRows, total: sum(salesRows, "amount"), vat: sum(salesRows, "vat") };
  const purchases = { rows: purchaseRows, total: sum(purchaseRows, "amount"), vat: sum(purchaseRows, "vat") };
  const payableVat = fromCents(toCents(sales.vat) - toCents(purchases.vat));

  return { sales, purchases, payableVat, routeTable: table };
}
