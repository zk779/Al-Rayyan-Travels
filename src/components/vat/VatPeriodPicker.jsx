"use client";

import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import DateRangeInputs from "../DateRangeInputs";
import { QUARTERS, currentQuarter, currentYear, recentYears } from "./vatPeriod";

const MODES = [
  { k: "quarter", l: "VAT quarter" },
  { k: "custom", l: "Custom range" },
  { k: "all", l: "All time" },
];

/** Period selector shared by both VAT pages. Driven by `useVatPeriod()`. */
export default function VatPeriodPicker({ period, disabled }) {
  const { mode, setMode, year, quarter, pickQuarter, custom, setCustom, range, days } = period;
  const thisYear = currentYear();
  const thisQuarter = currentQuarter();

  return (
    <div>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
        <CalendarDays size={17} className="text-slate-600" /> Report period
      </h2>

      <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
        {MODES.map((m) => (
          <button
            key={m.k}
            type="button"
            onClick={() => setMode(m.k)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition cursor-pointer ${
              mode === m.k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {m.l}
          </button>
        ))}
      </div>

      {mode === "quarter" && (
        <>
          <label className="mb-1.5 mt-4 block text-xs font-medium text-slate-500">Year</label>
          <div className="flex flex-wrap gap-1.5">
            {recentYears().map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => pickQuarter(y, y === thisYear ? Math.min(quarter, thisQuarter) : quarter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  year === y ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <label className="mb-1.5 mt-4 block text-xs font-medium text-slate-500">Quarter</label>
          <div className="grid grid-cols-2 gap-2">
            {QUARTERS.map((qq) => {
              const future = year === thisYear && qq.q > thisQuarter;
              const current = year === thisYear && qq.q === thisQuarter;
              const active = quarter === qq.q;
              return (
                <button
                  key={qq.q}
                  type="button"
                  disabled={future}
                  onClick={() => pickQuarter(year, qq.q)}
                  className={`relative rounded-xl px-3 py-2.5 text-left ring-1 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "bg-gradient-primary text-white ring-slate-800 shadow-md shadow-slate-900/20"
                      : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-400"
                  }`}
                >
                  <span className="block text-sm font-bold">Q{qq.q}</span>
                  <span className={`block text-[11px] ${active ? "text-gray-200" : "text-slate-400"}`}>{qq.months}</span>
                  {current && (
                    <span
                      className={`absolute right-2 top-2 rounded-full px-1.5 text-[9px] font-semibold ${
                        active ? "bg-white/20" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      In progress
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === "custom" && (
        <>
          <label className="mb-1.5 mt-4 block text-xs font-medium text-slate-500">From – to</label>
          <DateRangeInputs from={custom.from} to={custom.to} onChange={setCustom} disabled={disabled} />
        </>
      )}

      {mode === "all" && (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
          Every record, regardless of date.
        </p>
      )}

      {days > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          {format(range.from, "dd MMM yyyy")} → {format(range.to, "dd MMM yyyy")} · {days} day{days > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}


