// Route rows and totals for the Submit VAT Report table.
//
// Zero-VAT routes carry no sales VAT or purchases VAT — their VAT is 15% of the
// profit alone. Mixed routes are treated the same way, so they are merged into the
// one "Zero-VAT Routes" row (15% of sales − 15% of purchases is exactly 15% of the
// profit, so nothing changes in the payable VAT). Every other route shows all of the
// columns. Everything is added up in whole cents so the totals never drift by a
// stray fraction.

const toCents = (n) => Math.round((Number(n) || 0) * 100);
const fromCents = (c) => c / 100;

export const VAT_ROUTES = [
  // Zero-VAT + Mixed routes, merged: `from` lists the route types folded into the row
  {
    key: "ZERO_VAT",
    label: "Zero-VAT Routes",
    labelAr: "المسارات ذات النسبة الصفرية",
    note: "Zero-VAT + Mixed routes",
    zero: true,
    from: ["ZERO_VAT", "MIXED"],
  },
  { key: "DOMESTIC", label: "Domestic Routes", labelAr: "المسارات المحلية", note: "KSA-only routes & hotels" },
  // only when some sales have no route type saved, so the rows always add up
  { key: "OTHER", label: "No Route Type", labelAr: "بدون نوع مسار", note: "Route not saved", onlyIfUsed: true },
];

/** @param routes  `data.routes` from GET /api/sales/vat-report */
export function buildVatTable(routes) {
  const rows = VAT_ROUTES.filter((r) => !r.onlyIfUsed || (routes?.[r.key]?.count || 0) > 0).map((r) => {
    // a merged row adds up its route types, in whole cents
    const parts = (r.from || [r.key]).map((k) => routes?.[k] || {});
    const add = (field) => fromCents(parts.reduce((a, d) => a + toCents(d[field]), 0));
    const d = {
      count: parts.reduce((a, x) => a + (x.count || 0), 0),
      totalSell: add("totalSell"),
      sellVat: add("sellVat"),
      totalNet: add("totalNet"),
      netVat: add("netVat"),
      totalProfit: add("totalProfit"),
      profitVat: add("profitVat"),
    };
    return {
      key: r.key,
      label: r.label,
      labelAr: r.labelAr,
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
 *  Sales:      Domestic sales + Zero-VAT profit (Zero-VAT + Mixed routes) + No-route sales
 *              (Zero-VAT / Mixed routes count their profit only, never their sales)
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

  const salesRows = ["DOMESTIC", "ZERO_VAT", "OTHER"]
    .filter((k) => byKey[k])
    .map((k) => {
      const r = byKey[k];
      // Every route shows its total sales; the Zero-VAT row (incl. Mixed) is counted on profit alone
      const row = { key: k, label: r.label, labelAr: r.labelAr, totalSales: r.totalSales };
      return r.zero
        ? { ...row, basis: "Zero-VAT routes · profit counted", amount: r.profit, vat: r.profitVat }
        : { ...row, basis: "Total sales counted", amount: r.totalSales, vat: r.salesVat };
    });

  const purchaseRows = ["DOMESTIC"]
    .filter((k) => byKey[k])
    .map((k) => ({
      key: k,
      label: byKey[k].label,
      labelAr: byKey[k].labelAr,
      basis: "Total purchases",
      amount: byKey[k].totalPurchases,
      vat: byKey[k].purchasesVat,
    }));
  const ret = returnable || { net: 0, vat: 0, count: 0 };
  purchaseRows.push({
    key: "RETURNABLE",
    label: "Returnable VAT Expenses",
    labelAr: "مصروفات ضريبة القيمة المضافة القابلة للاسترداد",
    basis: `Net, excl. VAT · ${ret.count} expense${ret.count === 1 ? "" : "s"}`,
    amount: ret.net,
    vat: ret.vat,
  });
  const tb = tabby || { count: 0, fee: 0, vat: 0 };
  purchaseRows.push({
    key: "TABBY",
    label: "Tabby / Tamara Fees",
    labelAr: "رسوم تابي / تمارا",
    basis: `Fee excl. VAT · ${tb.count} sale${tb.count === 1 ? "" : "s"}`,
    amount: tb.fee || 0,
    vat: tb.vat || 0,
  });

  const sum = (rows, field) => fromCents(rows.reduce((a, r) => a + toCents(r[field]), 0));
  const sales = { rows: salesRows, totalSales: sum(salesRows, "totalSales"), total: sum(salesRows, "amount"), vat: sum(salesRows, "vat") };
  const purchases = { rows: purchaseRows, total: sum(purchaseRows, "amount"), vat: sum(purchaseRows, "vat") };
  const payableVat = fromCents(toCents(sales.vat) - toCents(purchases.vat));

  return { sales, purchases, payableVat, routeTable: table };
}
