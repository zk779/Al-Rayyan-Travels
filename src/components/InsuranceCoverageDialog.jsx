"use client";

import { useMemo } from "react";
import { format, addDays, addMonths, addYears, isSameDay } from "date-fns";
import {
  ShieldCheck,
  CalendarRange,
  CalendarCheck,
  CalendarX,
  Hourglass,
  Building2,
  Check,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../shadcn/components/ui/dialog";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Calendar } from "../../shadcn/components/ui/calendar";
import { nightsBetween } from "../utils/stayDates";

// Common policy terms. Each one works out the end date from the start date.
const TERM_PRESETS = [
  { label: "7 days", apply: (d) => addDays(d, 7) },
  { label: "14 days", apply: (d) => addDays(d, 14) },
  { label: "1 month", apply: (d) => addMonths(d, 1) },
  { label: "3 months", apply: (d) => addMonths(d, 3) },
  { label: "6 months", apply: (d) => addMonths(d, 6) },
  { label: "1 year", apply: (d) => addYears(d, 1) },
];

/** A single date tile (policy start / end). */
function DateTile({ icon: Icon, label, date, tone }) {
  const tones = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
  return (
    <div className={`flex-1 rounded-xl border px-3.5 py-2.5 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {date ? (
        <div className="mt-0.5">
          <div className="text-lg font-bold leading-tight">{format(date, "dd MMM yyyy")}</div>
          <div className="text-xs opacity-70">{format(date, "EEEE")}</div>
        </div>
      ) : (
        <div className="mt-1 text-sm font-medium opacity-60">Select on calendar</div>
      )}
    </div>
  );
}

const daysLabel = (n) => `${n} day${n === 1 ? "" : "s"}`;

/**
 * Coverage details for one insurance policy: start / end dates and the insurance
 * company / plan. Every edit is applied to the policy immediately through
 * `onUpdate(field, value)`. (A policy keeps its dates in the same checkInDate /
 * checkOutDate fields a hotel stay uses.)
 */
export default function InsuranceCoverageDialog({ open, onOpenChange, sale, onUpdate }) {
  const start = sale?.checkInDate || undefined;
  const end = sale?.checkOutDate || undefined;
  const days = nightsBetween(start, end);

  const range = useMemo(() => ({ from: start, to: end }), [start, end]);

  const handleRange = (next) => {
    const from = next?.from ?? null;
    let to = next?.to ?? null;
    // The policy must end after it starts; a same-day "range" is just the first click.
    if (from && to && to.getTime() <= from.getTime()) to = null;
    onUpdate("checkInDate", from);
    onUpdate("checkOutDate", to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! max-h-[92vh] overflow-y-auto p-0 gap-0 overflow-x-hidden">
        {/* Header band */}
        <DialogHeader className="px-6 pt-6 pb-5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white space-y-1">
          <DialogTitle className="flex items-center gap-2.5 text-xl text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <ShieldCheck className="h-5 w-5" />
            </span>
            Coverage Details
          </DialogTitle>
          <DialogDescription className="text-sky-50/90">
            Choose when the policy starts and ends and — if you have it — the insurance company or plan.
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="grid lg:grid-cols-[auto_1fr] gap-6 p-6">
            {/* ── Dates ── */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <DateTile icon={CalendarCheck} label="Starts" date={start} tone="sky" />
                <DateTile icon={CalendarX} label="Ends" date={end} tone="indigo" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <Calendar
                  mode="range"
                  numberOfMonths={1}
                  selected={range}
                  onSelect={handleRange}
                  defaultMonth={start}
                />
              </div>
            </div>

            {/* ── Insurer + term ── */}
            <div className="min-w-0 space-y-5">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-sky-600" /> Insurance company / plan
                  <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  value={sale.hotelName || ""}
                  onChange={(e) => onUpdate("hotelName", e.target.value)}
                  placeholder="e.g. Tawuniya Travel Gold, Bupa Arabia"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Policy term{" "}
                  {!start && <span className="normal-case font-normal">(pick the start date first)</span>}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {TERM_PRESETS.map((t) => {
                    const active = !!start && !!end && isSameDay(end, t.apply(start));
                    return (
                      <button
                        key={t.label}
                        type="button"
                        disabled={!start}
                        onClick={() => onUpdate("checkOutDate", t.apply(start))}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? "border-sky-500 bg-sky-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {(start || end) && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate("checkInDate", null);
                      onUpdate("checkOutDate", null);
                    }}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Reset dates
                  </button>
                )}
              </div>

              {/* Duration card */}
              <div
                className={`flex items-center gap-4 rounded-2xl border p-4 ${
                  days ? "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50" : "border-dashed border-slate-300 bg-slate-50/60"
                }`}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${days ? "bg-sky-600 text-white" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}
                >
                  <Hourglass className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Coverage period</p>
                  <p className={`text-2xl font-bold leading-tight ${days ? "text-sky-700" : "text-slate-400"}`}>
                    {days ? daysLabel(days) : "—"}
                  </p>
                  {days > 0 && (
                    <p className="text-xs text-slate-500">
                      Valid {format(start, "dd MMM yyyy")} to {format(end, "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarRange className="h-3.5 w-3.5" />
            {start && end
              ? `${format(start, "dd MMM")} → ${format(end, "dd MMM yyyy")} · ${daysLabel(days)}`
              : "The start and end dates are required"}
          </span>
          <Button onClick={() => onOpenChange(false)} className="gap-1.5 bg-sky-600 hover:bg-sky-700">
            <Check className="h-4 w-4" /> Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
