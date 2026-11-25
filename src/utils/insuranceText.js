import { formatStay, storedNights } from "./stayDates";

// The two "airline" records that represent insurance types (matched on icao_code).
export const INSURANCE_ICAO = new Set(["domesticInsurance", "internationalInsurance"]);

export const isInsuranceSale = (sale) => String(sale?.saleType || "").toUpperCase() === "INSURANCE";

const daysLabel = (n) => `${n} day${n === 1 ? "" : "s"}`;

/** One-line coverage summary for invoices: "Tawuniya Gold · 10 Dec 2026 → 10 Dec 2027 (365 days)". */
export function insuranceCoverageText(sale) {
  const days = storedNights(sale?.checkInDate, sale?.checkOutDate);
  const dates =
    sale?.checkInDate && sale?.checkOutDate
      ? `${formatStay(sale.checkInDate)} → ${formatStay(sale.checkOutDate)}${days ? ` (${daysLabel(days)})` : ""}`
      : "";
  return [sale?.hotelName, dates].filter(Boolean).join(" · ") || "N/A";
}

/** Bilingual invoice description, mirroring the flight / hotel descriptions. */
export function insuranceDescription(sale) {
  const domestic =
    sale?.airline?.icao_code === "domesticInsurance" || sale?.routeType === "DOMESTIC";
  return domestic
    ? "Domestic Insurance Policy / وثيقة تأمين محلية"
    : "International Insurance Policy / وثيقة تأمين دولية";
}

export { storedNights };
