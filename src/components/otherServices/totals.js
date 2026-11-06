// The invoice's money, worked out the same way the server does (it recalculates and saves its own).
//   prices include VAT : the typed rates already carry 15%   -> amount excl. VAT = total / 1.15
//   prices exclude VAT : 15% is added on top                  -> total = amount + 15%
export const VAT_RATE = 0.15;
export const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const num = (v) => Number(v) || 0;

export const lineAmount = (it) => r2(num(it.qty) * num(it.rate));

export function computeTotals({ items = [], discount = 0, pricesIncludeVat = true }) {
  const subtotal = r2(items.reduce((a, it) => a + lineAmount(it), 0));
  const disc = Math.min(Math.max(r2(num(discount)), 0), subtotal);
  const afterDiscount = r2(subtotal - disc);
  let netAmount;
  let vatAmount;
  let total;
  if (pricesIncludeVat) {
    total = afterDiscount;
    netAmount = r2(total / (1 + VAT_RATE));
    vatAmount = r2(total - netAmount);
  } else {
    netAmount = afterDiscount;
    vatAmount = r2(netAmount * VAT_RATE);
    total = r2(netAmount + vatAmount);
  }
  return { subtotal, discount: disc, netAmount, vatAmount, total };
}
