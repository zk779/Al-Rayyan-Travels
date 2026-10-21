import { formatStay, storedNights } from "./stayDates";

// The two "airline" records that represent hotel types (matched on icao_code).
export const HOTEL_ICAO = new Set(["domesticHotel", "internationalHotel"]);

export const isHotelSale = (sale) => String(sale?.saleType || "").toUpperCase() === "HOTEL";

const nightsLabel = (n) => `${n} night${n === 1 ? "" : "s"}`;

/** One-line stay summary for invoices: "Hilton Jeddah · Jeddah · 10 Dec 2026 → 13 Dec 2026 (3 nights)". */
export function hotelStayText(sale) {
  const cities = (sale?.destinations || [])
    .map((d) => d.airport?.city || d.value)
    .filter(Boolean)
    .join(", ");
  const nights = storedNights(sale?.checkInDate, sale?.checkOutDate);
  const dates =
    sale?.checkInDate && sale?.checkOutDate
      ? `${formatStay(sale.checkInDate)} → ${formatStay(sale.checkOutDate)}${nights ? ` (${nightsLabel(nights)})` : ""}`
      : "";
  return [sale?.hotelName, cities, dates].filter(Boolean).join(" · ") || "N/A";
}

/** Bilingual invoice description, mirroring the flight descriptions. */
export function hotelDescription(sale) {
  const domestic =
    sale?.airline?.icao_code === "domesticHotel" || sale?.routeType === "DOMESTIC";
  return domestic
    ? "Domestic Hotel Accommodation / إقامة فندقية محلية"
    : "International Hotel Accommodation / إقامة فندقية دولية";
}

export { storedNights };
