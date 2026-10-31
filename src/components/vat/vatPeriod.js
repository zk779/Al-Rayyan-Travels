import { useMemo, useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";

// KSA VAT returns are filed per calendar quarter.
export const QUARTERS = [
  { q: 1, months: "Jan – Mar" },
  { q: 2, months: "Apr – Jun" },
  { q: 3, months: "Jul – Sep" },
  { q: 4, months: "Oct – Dec" },
];

export const currentQuarter = () => Math.floor(new Date().getMonth() / 3) + 1;
export const currentYear = () => new Date().getFullYear();
export const recentYears = (count = 5) => Array.from({ length: count }, (_, i) => currentYear() - i);

/** First and last day of a calendar quarter, as local dates. */
export const quarterRange = (year, q) => ({
  from: new Date(year, (q - 1) * 3, 1),
  to: new Date(year, (q - 1) * 3 + 3, 0),
});

/**
 * Period state shared by the VAT pages: a calendar quarter, a custom range,
 * or all time. `range` is what to query ({ from, to } — both null for all
 * time); `ready` is false only for an empty custom range (nothing picked yet).
 */
export function useVatPeriod() {
  const [mode, setMode] = useState("quarter"); // quarter | custom | all
  const [year, setYear] = useState(currentYear());
  const [quarter, setQuarter] = useState(currentQuarter());
  const [custom, setCustom] = useState({ from: null, to: null });

  const range = useMemo(() => {
    if (mode === "quarter") return quarterRange(year, quarter);
    if (mode === "all") return { from: null, to: null };
    return custom;
  }, [mode, year, quarter, custom]);

  const ready = mode !== "custom" || !!(custom.from || custom.to);

  const label = useMemo(() => {
    if (mode === "quarter") return `Q${quarter} ${year}`;
    if (mode === "all") return "All time";
    if (custom.from && custom.to)
      return `${format(custom.from, "dd MMM yyyy")} – ${format(custom.to, "dd MMM yyyy")}`;
    if (custom.from) return `From ${format(custom.from, "dd MMM yyyy")}`;
    if (custom.to) return `Up to ${format(custom.to, "dd MMM yyyy")}`;
    return "Custom range";
  }, [mode, year, quarter, custom]);

  const days =
    range.from && range.to ? differenceInCalendarDays(range.to, range.from) + 1 : 0;

  const pickQuarter = (y, q) => {
    setYear(y);
    setQuarter(q);
  };

  return { mode, setMode, year, quarter, custom, setCustom, pickQuarter, range, ready, label, days };
}

/** { from, to } -> the query-string params the APIs expect (plain local dates + timezone). */
export function rangeParams(range, { fromKey = "dateFrom", toKey = "dateTo", tzKey = "tz" } = {}) {
  const params = {};
  if (range.from) params[fromKey] = format(range.from, "yyyy-MM-dd");
  if (range.to) params[toKey] = format(range.to, "yyyy-MM-dd");
  params[tzKey] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return params;
}
