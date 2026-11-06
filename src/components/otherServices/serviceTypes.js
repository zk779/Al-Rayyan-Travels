import { Bus, FileCheck2, IdCard, Layers } from "lucide-react";

// The kinds of "other service" an invoice can be for. They are not fixed: a service is added,
// renamed or dropped by editing this list — nothing in the backend needs to change (the invoice
// just stores the key as text).
//
//   detailLabel  heading of the extra column on each line ("Vehicle / Plate" …)
//   units        suggestions for the Unit box (anything can still be typed)
//   notes        the labelled notes offered under the table for this service
//   example      placeholder for the first line's description
export const SERVICE_TYPES = [
  {
    key: "TRANSPORTATION",
    label: "Transportation",
    labelAr: "خدمات النقل",
    hint: "Bus, coach & vehicle rental",
    icon: Bus,
    detailLabel: "Vehicle / Plate",
    units: ["month", "day", "trip", "hour", "km"],
    notes: ["Rental Period", "Route / Site", "Driver / Fuel / Maintenance", "Other Notes"],
    example: "Coaster (Bus) monthly rental incl. driver",
    tone: { tile: "bg-indigo-50 text-indigo-700 ring-indigo-200", on: "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20", badge: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  },
  {
    key: "UMRAH_VISA",
    label: "Umrah Visa",
    labelAr: "تأشيرة عمرة",
    hint: "Visa & Umrah packages",
    icon: FileCheck2,
    detailLabel: "Passenger / Passport No.",
    units: ["pax", "visa", "family", "package"],
    notes: ["Passport Details", "Travel Dates", "Other Notes"],
    example: "Umrah visa",
    tone: { tile: "bg-teal-50 text-teal-700 ring-teal-200", on: "border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20", badge: "bg-teal-50 text-teal-700 ring-teal-200" },
  },
  {
    key: "NADRA",
    label: "NADRA Services",
    labelAr: "خدمات نادرا",
    hint: "CNIC, NICOP & documents",
    icon: IdCard,
    detailLabel: "Applicant / CNIC",
    units: ["application", "service", "document", "pax"],
    notes: ["Service Details", "Reference No.", "Other Notes"],
    example: "NADRA service fee",
    tone: { tile: "bg-rose-50 text-rose-700 ring-rose-200", on: "border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20", badge: "bg-rose-50 text-rose-700 ring-rose-200" },
  },
  {
    key: "OTHER",
    label: "Other",
    labelAr: "خدمات أخرى",
    hint: "Anything else",
    icon: Layers,
    detailLabel: "Details",
    units: ["unit", "service", "day", "month"],
    notes: ["Notes"],
    example: "Service description",
    tone: { tile: "bg-slate-100 text-slate-700 ring-slate-200", on: "border-slate-500 bg-slate-100/70 ring-2 ring-slate-500/20", badge: "bg-slate-100 text-slate-700 ring-slate-200" },
  },
];

const BY_KEY = Object.fromEntries(SERVICE_TYPES.map((s) => [s.key, s]));

/** The config of a service key; a key that is no longer in the list still gets a sensible label. */
export const serviceOf = (key) =>
  BY_KEY[key] || {
    ...BY_KEY.OTHER,
    key,
    label: String(key || "Other")
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  };
