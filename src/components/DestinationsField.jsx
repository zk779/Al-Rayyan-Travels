"use client";

import { ArrowRight, MapPin, Pencil, Plus } from "lucide-react";

const MAX_CODES = 3;

/**
 * The "Destinations" field of a sale row: one clickable field (same width / height as the other inputs)
 * that opens the destinations dialog. Empty it invites you to add destinations; filled it shows the route
 * as airport codes (JED → DXB → LHR), how many places there are, and the city names on hover.
 */
export default function DestinationsField({ destinations = [], onOpen }) {
  const list = destinations || [];
  const count = list.length;
  const codes = list.map((d) => d.value || d.airport?.iata).filter(Boolean);
  const shown = codes.slice(0, MAX_CODES);
  const more = codes.length - shown.length;
  const title = list
    .map((d) => [d.airport?.city, d.airport?.country].filter(Boolean).join(", ") || d.value)
    .join("  →  ");

  if (!count) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Add destinations"
        className="group flex h-8 w-full items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50/60 px-2 text-xs font-medium text-slate-500 transition-all hover:border-indigo-400 hover:bg-indigo-50/60 hover:text-indigo-700"
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-white text-slate-400 ring-1 ring-slate-200 transition-colors group-hover:text-indigo-600 group-hover:ring-indigo-200">
          <Plus className="h-3 w-3" />
        </span>
        <span className="truncate">Add destinations</span>
        <MapPin className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title={title}
      aria-label={`Destinations: ${codes.join(", ")}`}
      className="group flex h-8 w-full items-center gap-2 rounded-md border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 px-2 text-xs transition-all hover:border-indigo-400 hover:shadow-sm"
    >
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-indigo-600 text-white">
        <MapPin className="h-3 w-3" />
      </span>
      <span className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap font-mono font-semibold text-indigo-900">
        {shown.map((c, i) => (
          <span key={`${c}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ArrowRight className="h-3 w-3 shrink-0 text-indigo-400" />}
            {c}
          </span>
        ))}
        {more > 0 && <span className="font-sans text-[10px] font-medium text-indigo-500">+{more}</span>}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5">
        <span className="rounded-full bg-indigo-600/10 px-1.5 py-px text-[10px] font-semibold text-indigo-700">{count}</span>
        <Pencil className="h-3 w-3 text-indigo-300 transition-colors group-hover:text-indigo-600" />
      </span>
    </button>
  );
}
