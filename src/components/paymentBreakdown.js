// Shared by SalesTabComponent + EditSaleTab: sums each sale row's payment
// into Cash / Bank Transfer / Credit, handling PARTIAL splits and
// reconstructing Tabby/Tamara fee details for the Summary section.

const TABBY_FEE_RATE = 0.0699;
const TABBY_FIXED_FEE = 1.5;
const TABBY_VAT_RATE = 0.15;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v) => Number(v) || 0;

// Forward: known Order Amount -> fee breakdown + Net Amount.
function tabbyFromOrder(orderAmount) {
  const order = num(orderAmount);
  const deducted = order * TABBY_FEE_RATE + TABBY_FIXED_FEE; // "Fee (6.99% + 1.5 SAR)"
  const vat = deducted * TABBY_VAT_RATE; // 15% VAT on that fee
  const totalDeduction = deducted + vat; // total taken out of the order (fee + vat)
  return {
    orderAmount: order,
    deducted: round2(deducted),
    vat: round2(vat),
    totalDeduction: round2(totalDeduction),
    netAmount: round2(order - totalDeduction),
  };
}

// Reverse: only the Net Amount survives on the saved Sale (sellPrice, with
// paidAmount zeroed) — reconstruct the Order Amount that would produce it.
const ORDER_MULTIPLIER = 1 - TABBY_FEE_RATE * (1 + TABBY_VAT_RATE);
const ORDER_CONSTANT = TABBY_FIXED_FEE * (1 + TABBY_VAT_RATE);
function tabbyFromNet(netAmount) {
  const orderAmount = round2((num(netAmount) + ORDER_CONSTANT) / ORDER_MULTIPLIER);
  return tabbyFromOrder(orderAmount);
}

// Exported for ExportSalesReport, which reconstructs the same breakdown
// from a row's net settlement amount (sellPrice, or a PARTIAL leg's amount).
export { tabbyFromNet };

const isTabbyCustomer = (customerId, customerOptions) =>
  customerOptions?.find((o) => o.value === customerId)?.customerType === "TABBY_OR_TAMARA";

const customerName = (customerId, customerOptions) =>
  customerOptions?.find((o) => o.value === customerId)?.label;

// One sale row -> its payment leg(s), each { method, amount, customerId,
// customerName?, orderAmount?, feeBreakdown? }. Prefers whatever was just
// chosen in this session (paymentMeta), falls back to the server's resolved
// paymentSummary, then to raw fields for a still-blank new row.
function legsForSale(sale) {
  const meta = sale.paymentMeta;

  if (meta?.type === "PARTIAL") {
    return [
      { method: meta.aMethod, amount: num(meta.aAmount), customerId: meta.aCustomerId, orderAmount: meta.aOrderAmount, feeBreakdown: meta.aFeeBreakdown },
      { method: meta.bMethod, amount: num(meta.bAmount), customerId: meta.bCustomerId, orderAmount: meta.bOrderAmount, feeBreakdown: meta.bFeeBreakdown },
    ];
  }
  if (meta?.type) {
    const amount = meta.type === "CREDIT" ? num(sale.sellPrice) : num(sale.paidAmount ?? sale.sellPrice);
    return [{ method: meta.type, amount, customerId: sale.customerId, orderAmount: meta.orderAmount, feeBreakdown: meta.feeBreakdown }];
  }

  if (sale.paymentSummary) {
    const ps = sale.paymentSummary;
    if (ps.type === "PARTIAL") {
      return (ps.legs || []).map((l) => ({
        method: l.method,
        amount: num(l.amount),
        customerId: l.customerId,
        customerName: l.customerName,
      }));
    }
    return [{ method: ps.type, amount: num(ps.amount), customerId: ps.customerId, customerName: ps.customerName }];
  }

  const pt = String(sale.paymentType || "").toUpperCase();
  if (!pt) return [];
  if (pt === "PARTIAL" && Array.isArray(sale.payments)) {
    return sale.payments.map((l) => ({
      method: String(l.method || "").toUpperCase(),
      amount: num(l.amount),
      customerId: l.customer?.id || l.customerId,
      customerName: l.customer?.customerName,
    }));
  }
  const amount = pt === "CREDIT" ? num(sale.sellPrice) : num(sale.paidAmount ?? sale.sellPrice);
  return [{ method: pt, amount, customerId: sale.customerId }];
}

/**
 * @returns {{ totals: {cash:number, bank:number, credit:number},
 *             tabbyRows: Array<{saleLabel, customerName, orderAmount, deducted, vat, totalDeduction, netAmount}> }}
 */
export function computePaymentBreakdown(sales, customerOptions) {
  const totals = { cash: 0, bank: 0, credit: 0 };
  const tabbyRows = [];

  (sales || []).forEach((sale, idx) => {
    legsForSale(sale).forEach((leg) => {
      const method = String(leg.method || "").toUpperCase();
      if (method === "CASH") totals.cash += leg.amount;
      else if (method === "BANK_TRANSFER") totals.bank += leg.amount;
      else if (method === "CREDIT") {
        totals.credit += leg.amount;
        if (isTabbyCustomer(leg.customerId, customerOptions)) {
          const fee =
            leg.orderAmount != null && leg.feeBreakdown
              ? {
                  orderAmount: num(leg.orderAmount),
                  deducted: num(leg.feeBreakdown.deducted),
                  totalDeduction: num(leg.feeBreakdown.totalDeduction),
                  vat: num(leg.feeBreakdown.vat),
                  netAmount: num(leg.feeBreakdown.amount),
                }
              : tabbyFromNet(leg.amount);
          tabbyRows.push({
            saleLabel: sale.paxName || sale.documentNo || `Sale ${idx + 1}`,
            customerName: leg.customerName || customerName(leg.customerId, customerOptions) || "—",
            ...fee,
          });
        }
      }
    });
  });

  return { totals, tabbyRows };
}
