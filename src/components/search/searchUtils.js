// The header search: what can be typed, where things lead. Pure data + small helpers.

/** "pnr:abc" narrows the search. `scope` is the group asked of the server, `field` what a sale is matched on. */
export const PREFIXES = {
  "inv:": { scope: "sales", field: "inv", label: "Invoice no." },
  "doc:": { scope: "sales", field: "doc", label: "Document no." },
  "pnr:": { scope: "sales", field: "pnr", label: "PNR" },
  "pax:": { scope: "sales", field: "pax", label: "Passenger" },
  "cust:": { scope: "customers", label: "Customers" },
  "vend:": { scope: "vendors", label: "Vendors" },
  "amt:": { scope: "all", amountOnly: true, label: "Amount" },
};

export function parseQuery(raw) {
  const text = String(raw || "");
  const lower = text.trimStart().toLowerCase();
  const prefix = Object.keys(PREFIXES).find((p) => lower.startsWith(p)) || null;
  const term = (prefix ? text.trimStart().slice(prefix.length) : text).trim();
  return { prefix, term, ...(prefix ? PREFIXES[prefix] : {}) };
}

/** A typed number (115, 1,635.19) — also searched as an amount. */
export const asAmount = (term) => {
  const t = String(term || "").replace(/,/g, "").trim();
  return /^\d{1,12}(\.\d{1,2})?$/.test(t) ? Number(t) : null;
};

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
/** 15% VAT both ways: the amount already contains it / it is added on top. */
export const vatHelper = (n) => {
  const net = r2(n / 1.15);
  const onTop = r2(n * 0.15);
  return { included: { net, vat: r2(n - net) }, onTop: { vat: onTop, total: r2(n + onTop) } };
};
export const fmt = (n) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The groups the server can answer, in the order they are shown. `perm` = who may see the chip. */
export const GROUPS = [
  { key: "sales", label: "Sales", perm: "SALE_READ", prefixes: ["inv:", "doc:", "pnr:", "pax:"] },
  { key: "customers", label: "Customers", perm: "CUSTOMER_READ", prefixes: ["cust:"] },
  { key: "vendors", label: "Vendors", perm: "VENDOR_READ", prefixes: ["vend:"] },
  { key: "other", label: "Other services", perm: "OTHER_SERVICE_READ", prefixes: [] },
  { key: "expenses", label: "Expenses", perm: "EXPENSE_READ", prefixes: [] },
  { key: "payments", label: "Payments", perm: "PAYMENT_READ", prefixes: [] },
];

// who sees it: `perm` (one name), `any` (one of these) or `all` (every one of these) — the same rule as the page it opens
export const QUICK_ACTIONS = [
  { label: "New sale", icon: "plane", to: "/new-services/sale", perm: "SALE_CREATE" },
  { label: "Hotel", icon: "hotel", to: "/new-hotel-booking", perm: "HOTEL_CREATE" },
  { label: "Void", icon: "void", to: "/new-services/void", perm: "VOID_CREATE" },
  { label: "Refund", icon: "refund", to: "/new-services/refund", perm: "REFUND_CREATE" },
  { label: "Other service", icon: "other", to: "/other-services/new", perm: "OTHER_SERVICE_CREATE" },
  { label: "Expense", icon: "expense", to: "/expenses?new=1", all: ["EXPENSE_READ", "EXPENSE_CREATE"] },
  { label: "Payment", icon: "payment", to: "/new-payments", perm: "PAYMENT_CREATE" },
];

export const PAGES = [
  { group: "Sales", label: "Sales report", to: "/sales-report", perm: "REPORT_READ" },
  { group: "Sales", label: "New services", to: "/new-services", any: ["SALE_CREATE", "REFUND_CREATE", "HOTEL_CREATE", "VOID_CREATE", "OTHER_SERVICE_READ"] },
  { group: "Sales", label: "Other services", to: "/other-services", perm: "OTHER_SERVICE_READ" },
  { group: "Money", label: "Payments", to: "/manage-payments", perm: "PAYMENT_READ" },
  { group: "Money", label: "Expenses", to: "/expenses", perm: "EXPENSE_READ" },
  { group: "Money", label: "Balance adjustments", to: "/balance-adjustments", perm: "BALANCE_ADJUSTMENT_READ" },
  { group: "Money", label: "Ledger", to: "/ledger", perm: "LEDGER_READ" },
  { group: "Reports", label: "Reports", to: "/report", perm: "REPORT_READ" },
  { group: "Reports", label: "VAT", to: "/vat", perm: "REPORT_READ" },
  { group: "Reports", label: "Returnable VAT", to: "/vat/return", perm: "REPORT_READ" },
  { group: "Setup", label: "Customers", to: "/customers", perm: "CUSTOMER_READ" },
  { group: "Setup", label: "Vendors", to: "/vendors", perm: "VENDOR_READ" },
  { group: "Setup", label: "Airlines", to: "/airline-codes", perm: "AIRLINE_READ" },
  { group: "Setup", label: "Banks", to: "/bank-accounts", perm: "BRANCH_READ" },
  { group: "Setup", label: "Users", to: "/users", perm: "USER_READ" },
];

/** Where a server result leads. */
export const targetOf = (kind, r) => {
  switch (kind) {
    case "sales":
      return `/view-invoice/${r.invoiceId}`;
    case "customers":
      return `/customers?search=${encodeURIComponent(r.name)}`;
    case "vendors":
      return `/vendors?search=${encodeURIComponent(r.name)}`;
    case "other":
      return `/other-services/${r.id}`;
    case "expenses":
      return `/expenses?search=${encodeURIComponent(r.description || r.categoryLabel || "")}`;
    case "payments":
      return `/manage-payments?search=${encodeURIComponent(r.pvNo || r.partyName || "")}&party=${r.partyType || "VENDOR"}`;
    default:
      return r.to;
  }
};
