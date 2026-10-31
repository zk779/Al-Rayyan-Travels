import { rangeParams } from "./vatPeriod";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const MAX_PAGES = 25; // 200 / page — a safety cap, far above any realistic period

/**
 * Every APPROVED "Returnable VAT" expense in the period (a rejected expense is
 * never claimable). The expenses API pages at 200, so keep going until done.
 */
export async function fetchReturnableExpenses(range, signal) {
  const rows = [];
  let page = 1;
  let pages = 1;
  do {
    const params = new URLSearchParams({
      category: "RETURNABLE_VAT",
      status: "APPROVED",
      limit: "200",
      page: String(page),
    });
    if (range.from || range.to) {
      const p = rangeParams(range, { fromKey: "dateFrom", toKey: "dateTo", tzKey: "timeZone" });
      Object.entries(p).forEach(([k, v]) => params.set(k, v));
    }
    const res = await fetch(`${API_BASE}/api/expenses?${params}`, { headers: authHeaders(), signal });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || "Failed to load returnable VAT expenses");
    rows.push(...(json.data || []));
    pages = json.pagination?.pages || 1;
    page += 1;
  } while (page <= pages && page <= MAX_PAGES);
  return rows;
}

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Gross (VAT included), VAT and net (excl. VAT) of a list of Returnable-VAT expenses. */
export function summarizeReturnable(expenses) {
  const gross = r2(expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const vat = r2(expenses.reduce((s, e) => s + (Number(e.vatAmount) || 0), 0));
  return {
    gross,
    vat,
    net: r2(gross - vat),
    count: expenses.length,
    missingVat: expenses.filter((e) => e.vatAmount == null).length,
  };
}

export const EMPTY_TABBY = { count: 0, orderAmount: 0, fee: 0, vat: 0, totalDeduction: 0 };

/**
 * Fee + VAT paid to Tabby / Tamara on the period's sales. It comes with the VAT report
 * (the fee is worked out there from each sale's net settlement amount).
 */
export async function fetchTabbyFees(range, signal) {
  const qs = new URLSearchParams(rangeParams(range)).toString();
  const res = await fetch(`${API_BASE}/api/sales/vat-report?${qs}`, { headers: authHeaders(), signal });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Failed to load Tabby / Tamara fees");
  return { ...EMPTY_TABBY, ...(json.data?.tabby || {}) };
}
