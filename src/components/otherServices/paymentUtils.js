import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/** What to show for an invoice's payment: "Cash", "Bank — Saudi Alawwal Bank" or null (draft). */
export const paymentLabel = (inv) => {
  if (!inv || inv.status !== "CONFIRMED") return null;
  if (inv.paymentMethod === "CASH") return "Cash";
  if (inv.paymentMethod === "BANK") return inv.bank?.bankName ? `Bank — ${inv.bank.bankName}` : "Bank";
  return null;
};

/** The active bank accounts, loaded once for the bank dropdown. */
export function useBanks() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/banks?isActive=true`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((j) => setBanks(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return { banks, loading };
}
