import { format } from "date-fns";

// Hotel check-in / check-out are calendar dates, not moments in time. They are
// stored as "<yyyy-MM-dd>T12:00:00.000Z" and read back via their UTC parts, so
// the day a user picked never shifts when the browser's timezone differs from
// the one the booking was made in (local midnight -> UTC would roll back a day).

/** Local calendar Date -> storage ISO string (noon UTC of that calendar day). */
export const toStayISO = (date) =>
  date ? `${format(date, "yyyy-MM-dd")}T12:00:00.000Z` : null;

/** Stored value (ISO string or Date) -> local-midnight Date of the same calendar day. */
export const fromStayISO = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

/** Whole nights between two local calendar dates (0 when either is missing). */
export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return Math.max(Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000), 0);
};

/** Formats a stored stay date for display ("—" when empty). */
export const formatStay = (value, pattern = "dd MMM yyyy") => {
  const d = fromStayISO(value);
  return d ? format(d, pattern) : "—";
};

/** Nights between two stored values (ISO strings / Dates). */
export const storedNights = (checkIn, checkOut) =>
  nightsBetween(fromStayISO(checkIn), fromStayISO(checkOut));
