/** Why a sale can't be refunded (null = it can). */
export const refundBlock = (sale) => {
  if (sale.voided || sale.status === "VOID") return "Voided ticket — cannot be refunded";
  if (sale.status === "REFUNDED") return "Already refunded";
  return null;
};

/** 1234.5 -> "1,234.50" (display only). */
export const fmt = (n) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const PAYOUT_LABEL = {
  CUSTOMER_LEDGER: "Credit to Customer Ledger",
  BANK_TRANSFER: "Refund Payout (Bank Transfer)",
  CASH: "Refund Payout (Cash)",
};
