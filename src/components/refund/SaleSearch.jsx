"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ban, CornerDownLeft, FileSearch, Loader2, Plane, SaudiRiyal, Search, X } from "lucide-react";

import { refundBlock } from "./refundUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

const STATUS = {
  COMPLETED: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  PENDING: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  REFUNDED: { label: "Already refunded", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  VOID: { label: "Void", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const Highlight = ({ text, query }) => {
  const q = query.trim();
  const i = q ? String(text).toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {String(text).slice(0, i)}
      <mark className="rounded bg-rose-200 px-0.5 text-rose-950">{String(text).slice(i, i + q.length)}</mark>
      {String(text).slice(i + q.length)}
    </>
  );
};

/**
 * "Search sale by document number": type a few characters, pick the ticket.
 *   - arrow keys + Enter, Escape closes, a click outside closes
 *   - a ticket that was just picked does not search again (the list used to pop back open)
 *   - an old, slower answer can never overwrite a newer one
 * `onChange(text)` is called for every keystroke; `onPick(sale)` when a row is chosen (also for
 * rows that cannot be refunded — the page explains why).
 */
export default function SaleSearch({ value, onChange, onPick, onClear, invalid = false }) {
  const token = localStorage.getItem("token");
  const wrapRef = useRef(null);
  const pickedRef = useRef(null);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [done, setDone] = useState(false); // a search has finished for the current text
  const [active, setActive] = useState(0);

  useEffect(() => {
    const q = value.trim();
    if (q.length < MIN_CHARS) pickedRef.current = null; // emptied (reset / cleared): the same ticket can be searched again
    if (q.length < MIN_CHARS || q === pickedRef.current) {
      setResults([]);
      setSearching(false);
      setDone(false);
      if (q.length < MIN_CHARS) setOpen(false);
      return undefined;
    }
    pickedRef.current = null;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/sales/search?documentNo=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.success) {
          const list = json.data || [];
          setResults(list);
          setActive(Math.max(list.findIndex((s) => !refundBlock(s)), 0));
          setDone(true);
          setOpen(true);
        }
      } catch {
        /* aborted or offline */
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [value, token]);

  useEffect(() => {
    const away = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const pick = (sale) => {
    pickedRef.current = sale.documentNo;
    setOpen(false);
    setResults([]);
    onPick(sale);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[active] || results[0]);
    }
  };

  const showEmpty = open && done && !searching && results.length === 0;
  const listId = useMemo(() => `sale-search-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setDone(false);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Type the document / ticket number…"
          aria-label="Search sale by document number"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className={`h-10 w-full rounded-lg border bg-white pl-9 pr-16 font-mono text-sm tracking-wide text-slate-900 shadow-sm outline-none transition-shadow placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:ring-4 ${
            invalid ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-rose-400 focus:ring-rose-200/80"
          }`}
        />
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {searching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          {value && (
            <button
              type="button"
              onClick={() => {
                pickedRef.current = null;
                setResults([]);
                setOpen(false);
                onClear();
              }}
              aria-label="Clear"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        {value.trim().length > 0 && value.trim().length < MIN_CHARS ? `Type at least ${MIN_CHARS} characters.` : "Part of the number is enough. Use ↑ ↓ and Enter to pick."}
      </p>

      {open && results.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10" data-testid="sale-results">
          {results.map((s, i) => {
            const block = refundBlock(s);
            const st = STATUS[s.voided ? "VOID" : s.status] || STATUS.PENDING;
            const on = i === active;
            return (
              <li key={s.id} role="option" aria-selected={on} aria-disabled={!!block}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(s)}
                  data-testid="sale-result"
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors ${on ? "bg-rose-100/70" : ""} ${block ? "opacity-70" : ""}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${block ? "bg-rose-200 text-rose-700" : "bg-rose-100 text-rose-600"}`}>
                    {block ? <Ban className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm font-semibold text-slate-900">
                      <Highlight text={s.documentNo} query={value} />
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {[s.airlineCode, s.vendorName, s.customerName, s.paxName].filter(Boolean).join(" · ")}
                    </span>
                    {block && <span className="block text-[11px] font-medium text-rose-600">{block}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.cls}`}>{st.label}</span>
                    <span className="mt-0.5 flex items-center justify-end gap-0.5 text-xs font-semibold tabular-nums text-slate-700">
                      <SaudiRiyal className="h-3 w-3 opacity-50" />
                      {Number(s.sellPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </span>
                  {on && <CornerDownLeft className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showEmpty && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center shadow-xl shadow-slate-900/10" data-testid="sale-empty">
          <FileSearch className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-1.5 text-sm font-medium text-slate-600">No sale found for “{value.trim()}”</p>
          <p className="text-xs text-slate-400">Check the document number and try again.</p>
        </div>
      )}
    </div>
  );
}
