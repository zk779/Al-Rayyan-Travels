"use client";

import { useMemo } from "react";
import AsyncSelect from "react-select/async";
import { format, addDays } from "date-fns";
import {
  Hotel,
  MapPin,
  Moon,
  X,
  CalendarRange,
  LogIn,
  LogOut,
  BedDouble,
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

const NIGHT_PRESETS = [1, 2, 3, 5, 7, 14];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 12,
    borderColor: state.isFocused ? "#14b8a6" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(20,184,166,0.15)" : "none",
  }),
  menu: (base) => ({ ...base, zIndex: 9999, borderRadius: 12, overflow: "hidden" }),
};

/** A single date tile (check-in / check-out). */
function DateTile({ icon: Icon, label, date, tone }) {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-700",
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

/**
 * Hotel stay details for one booking: check-in / check-out dates, optional
 * hotel name and the city (or cities). Every edit is applied to the booking
 * immediately through `onUpdate(field, value)`.
 */
export default function HotelStayDialog({
  open,
  onOpenChange,
  sale,
  onUpdate,
  loadCityOptions,
  onRemoveCity,
}) {
  const checkIn = sale?.checkInDate || undefined;
  const checkOut = sale?.checkOutDate || undefined;
  const nights = nightsBetween(checkIn, checkOut);
  const cities = sale?.destinations || [];

  const range = useMemo(() => ({ from: checkIn, to: checkOut }), [checkIn, checkOut]);

  const handleRange = (next) => {
    const from = next?.from ?? null;
    let to = next?.to ?? null;
    // Check-out must be after check-in; a same-day "range" is just the first click.
    if (from && to && to.getTime() <= from.getTime()) to = null;
    onUpdate("checkInDate", from);
    onUpdate("checkOutDate", to);
  };

  const applyNights = (n) => {
    if (!checkIn) return;
    onUpdate("checkOutDate", addDays(checkIn, n));
  };

  const addCity = (selected) => {
    if (!selected) return;
    if (cities.some((c) => c.value === selected.value)) return;
    onUpdate("destinations", [...cities, selected]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! max-h-[92vh] overflow-y-auto p-0 gap-0 overflow-x-hidden">
        {/* Header band */}
        <DialogHeader className="px-6 pt-6 pb-5 bg-gradient-to-r from-teal-600 via-teal-600 to-indigo-600 text-white space-y-1">
          <DialogTitle className="flex items-center gap-2.5 text-xl text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Hotel className="h-5 w-5" />
            </span>
            Hotel Stay Details
          </DialogTitle>
          <DialogDescription className="text-teal-50/90">
            Choose the stay dates, the city and — if you have it — the hotel name.
          </DialogDescription>
        </DialogHeader>

        {sale && (
          <div className="grid lg:grid-cols-[auto_1fr] gap-6 p-6">
            {/* ── Dates ── */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <DateTile icon={LogIn} label="Check-in" date={checkIn} tone="teal" />
                <DateTile icon={LogOut} label="Check-out" date={checkOut} tone="indigo" />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Moon className="h-4 w-4 text-indigo-500" /> Length of stay
                </span>
                <span className={`text-sm font-bold ${nights ? "text-indigo-700" : "text-slate-400"}`}>
                  {nights ? `${nights} night${nights === 1 ? "" : "s"}` : "—"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <Calendar
                  mode="range"
                  numberOfMonths={1}
                  selected={range}
                  onSelect={handleRange}
                  defaultMonth={checkIn}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Quick nights {!checkIn && <span className="normal-case font-normal">(pick check-in first)</span>}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {NIGHT_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={!checkIn}
                      onClick={() => applyNights(n)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        nights === n
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                      }`}
                    >
                      {n}N
                    </button>
                  ))}
                  {(checkIn || checkOut) && (
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
              </div>
            </div>

            {/* ── Hotel + cities ── */}
            <div className="space-y-5 min-w-0">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <BedDouble className="h-3.5 w-3.5 text-teal-600" /> Hotel name
                  <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  value={sale.hotelName || ""}
                  onChange={(e) => onUpdate("hotelName", e.target.value)}
                  placeholder="e.g. Hilton Jeddah, Swissôtel Makkah"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" /> City
                </Label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadCityOptions}
                  value={null}
                  onChange={addCity}
                  placeholder="Search a city (e.g. Jeddah, Dubai, Istanbul)…"
                  styles={selectStyles}
                  noOptionsMessage={({ inputValue }) =>
                    inputValue.length < 2 ? "Type 2+ characters" : "No cities found"
                  }
                />
                <p className="text-xs text-slate-400">
                  Add more than one city if the booking spans several.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Selected ({cities.length})
                </Label>
                {cities.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cities.map((c, i) => (
                      <div
                        key={c.value}
                        className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-teal-300"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-800">
                              {c.airport?.city || c.label}
                            </span>
                            {i === 0 && cities.length > 1 && (
                              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            {c.airport?.country || ""} · {c.value}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveCity(c.value)}
                          className="h-7 w-7 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-8 text-center">
                    <MapPin className="mx-auto mb-1.5 h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-500">No city selected yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarRange className="h-3.5 w-3.5" />
            {checkIn && checkOut
              ? `${format(checkIn, "dd MMM")} → ${format(checkOut, "dd MMM yyyy")} · ${nights} night${nights === 1 ? "" : "s"}`
              : "Check-in and check-out are required"}
          </span>
          <Button onClick={() => onOpenChange(false)} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
            <Check className="h-4 w-4" /> Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
