"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Copy,
  CornerDownLeft,
  ExternalLink,
  FileStack,
  Hotel,
  Loader2,
  Plane,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  SearchX,
  Store,
  Undo2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useIsAdmin } from "../../utils/useIsAdmin";
import { appToast } from "../../../shadcn/components/ui/appToast";
import { GROUPS, PAGES, PREFIXES, QUICK_ACTIONS, asAmount, fmt, parseQuery, targetOf, vatHelper } from "./searchUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

const ACTION_ICON = { plane: Plane, hotel: Hotel, void: Undo2, refund: RotateCcw, other: FileStack, expense: Receipt, payment: Banknote };
const KIND = {
  sales: { icon: Plane, tone: "bg-indigo-50 text-indigo-600" },
  customers: { icon: User, tone: "bg-emerald-50 text-emerald-600" },
  vendors: { icon: Store, tone: "bg-amber-50 text-amber-600" },
  other: { icon: FileStack, tone: "bg-violet-50 text-violet-600" },
  expenses: { icon: Receipt, tone: "bg-rose-50 text-rose-600" },
  payments: { icon: Banknote, tone: "bg-emerald-50 text-emerald-600" },
  page: { icon: CornerDownLeft, tone: "bg-slate-100 text-slate-500" },
};
const GROUP_TITLE = Object.fromEntries(GROUPS.map((g) => [g.key, g.label]));

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text));
    appToast.success(`Copied ${text}`);
  } catch {
    appToast.error("Could not copy");
  }
};

const Mark = ({ text, term }) => {
  const s = String(text ?? "");
  const t = String(term || "").trim();
  const i = t ? s.toLowerCase().indexOf(t.toLowerCase()) : -1;
  if (i < 0) return <>{s}</>;
  return (
    <>
      {s.slice(0, i)}
      <mark className="rounded bg-amber-100 px-0.5 text-slate-900">{s.slice(i, i + t.length)}</mark>
      {s.slice(i + t.length)}
    </>
  );
};

const Badge = ({ tone, children }) => <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${tone}`}>{children}</span>;

/** What a server result looks like as a row: { title, sub, badge?, badgeTone?, actions? } */
function describe(kind, r) {
  switch (kind) {
    case "sales": {
      const what = r.saleType === "HOTEL" ? "Hotel booking" : r.status === "VOID" ? "Void ticket" : r.airline;
      const state = r.status === "VOID" ? ["Void", "bg-rose-50 text-rose-700"] : r.status === "REFUNDED" ? ["Refunded", "bg-amber-50 text-amber-700"] : [fmt(r.sellPrice), r.amountMatch ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"];
      return {
        title: r.saleType === "HOTEL" ? r.hotelName || r.documentNo : r.documentNo,
        sub: [r.invoiceNo, what, r.vendorName, r.paxName, r.pnr && `PNR ${r.pnr}`].filter(Boolean).join(" · "),
        badge: state[0],
        badgeTone: state[1],
        rowActions: true,
        copyValue: r.invoiceNo,
      };
    }
    case "customers":
      return { title: r.name, sub: [r.type === "CORPORATE" ? "Corporate" : r.type === "TABBY_OR_TAMARA" ? "Tabby / Tamara" : "Walk-in", r.phone, r.vatId && `ID ${r.vatId}`].filter(Boolean).join(" · "), badge: r.balance ? `Balance ${fmt(r.balance)}` : null, badgeTone: "bg-slate-100 text-slate-600" };
    case "vendors":
      return { title: r.name, sub: ["Vendor", r.phone].filter(Boolean).join(" · "), badge: r.balance ? `Balance ${fmt(r.balance)}` : null, badgeTone: "bg-slate-100 text-slate-600" };
    case "other":
      return { title: r.invoiceNo, sub: [String(r.serviceType || "").replace(/_/g, " ").toLowerCase(), r.customerName].filter(Boolean).join(" · "), badge: r.status === "DRAFT" ? "Draft" : fmt(r.total), badgeTone: r.status === "DRAFT" ? "bg-amber-50 text-amber-700" : r.amountMatch ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700" };
    case "expenses":
      return { title: r.description || r.categoryLabel, sub: [r.categoryLabel, r.firstDetail, r.branchName, r.expenseDate && new Date(r.expenseDate).toISOString().slice(0, 10)].filter(Boolean).join(" · "), badge: fmt(r.amount), badgeTone: r.amountMatch ? "bg-amber-100 text-amber-800" : "bg-rose-50 text-rose-700" };
    case "payments":
      return { title: r.pvNo || "Payment", sub: [r.partyType === "VENDOR" ? "Paid to" : "Received from", r.partyName, String(r.method || "").replace(/_/g, " ").toLowerCase()].filter(Boolean).join(" · "), badge: fmt(r.amount), badgeTone: r.amountMatch ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700" };
    default:
      return { title: r.label, sub: r.sub || "Go to page" };
  }
}

/** The header search: type a number, name or page — pick a result with the mouse or the keyboard. */
export default function GlobalSearch() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  const isAdmin = useIsAdmin(); // prefixes (inv: pnr: cust: …) are an admin tool
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("all");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);

  const parsed = useMemo(() => (isAdmin ? parseQuery(q) : { prefix: null, term: q.trim() }), [q, isAdmin]);
  const effScope = parsed.scope || scope;
  const term = parsed.term;
  const amount = asAmount(term);
  const searchable = term.length >= MIN_CHARS && effScope !== "pages" && (!parsed.amountOnly || amount !== null);

  const allowed = (it) => (it.all ? hasAllPermissions(it.all) : it.any ? hasAnyPermission(it.any) : !it.perm || hasPermission(it.perm));
  const myGroups = useMemo(() => GROUPS.filter((g) => hasPermission(g.perm)), [hasPermission]);
  const actions = useMemo(() => QUICK_ACTIONS.filter(allowed), [hasPermission, hasAnyPermission, hasAllPermissions]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = useMemo(() => PAGES.filter(allowed), [hasPermission, hasAnyPermission, hasAllPermissions]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── ask the server (one light request), after a short pause ── */
  useEffect(() => {
    if (!open || !searchable) {
      setData({});
      setLoading(false);
      setFailed(false);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q: term, scope: effScope });
        if (parsed.field) qs.set("field", parsed.field);
        const res = await fetch(`${API_BASE}/api/search?${qs}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Search failed");
        setData(json.data || {});
        setFailed(false);
        setActive(0);
      } catch (err) {
        if (err.name !== "AbortError") setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [term, effScope, parsed.field, open, searchable, token]);

  /* ── the rows, top to bottom (this order is also the keyboard order) ── */
  const sections = useMemo(() => {
    const out = [];
    const tl = term.toLowerCase();
    if (term && (effScope === "all" || effScope === "pages") && !parsed.prefix) {
      const a = actions.filter((x) => x.label.toLowerCase().includes(tl)).map((x) => ({ kind: "action", key: `a-${x.label}`, to: x.to, row: { title: x.label, sub: "Quick action" }, icon: ACTION_ICON[x.icon] }));
      const p = pages.filter((x) => x.label.toLowerCase().includes(tl)).map((x) => ({ kind: "page", key: `p-${x.label}`, to: x.to, row: { title: x.label, sub: `Go to page · ${x.group}` } }));
      if (a.length) out.push({ key: "actions", title: "Quick actions", items: a });
      if (p.length) out.push({ key: "pages", title: "Pages", items: p });
    }
    for (const g of myGroups) {
      const rows = data[g.key] || [];
      if (!rows.length) continue;
      out.push({ key: g.key, title: g.label, items: rows.map((r) => ({ kind: g.key, key: `${g.key}-${r.id}`, raw: r, to: targetOf(g.key, r), row: describe(g.key, r) })) });
    }
    return out;
  }, [term, effScope, parsed.prefix, actions, pages, myGroups, data]);
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => {
    if (active >= flat.length) setActive(0);
  }, [flat.length, active]);

  /* ── open / close ── */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const go = (to, newTab = false) => {
    if (!to) return;
    if (newTab) window.open(to, "_blank", "noopener,noreferrer");
    else navigate(to);
    setOpen(false);
    setQ("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (q) setQ("");
      else {
        setOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "ArrowDown" && flat.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp" && flat.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flat[active];
      if (it) go(it.to, e.ctrlKey || e.metaKey);
    }
  };

  const showEmptyState = !term;
  const noResult = term.length >= MIN_CHARS && !loading && !failed && flat.length === 0 && (amount === null || effScope === "pages");
  const vat = amount !== null && amount > 0 ? vatHelper(amount) : null;
  const scopes = [{ key: "all", label: "All" }, ...myGroups.map((g) => ({ key: g.key, label: g.label })), { key: "pages", label: "Pages" }];

  return (
    <div ref={rootRef} className="relative w-full max-w-md" data-testid="global-search">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search invoices, tickets, customers, amounts…"
        aria-label="Search"
        role="combobox"
        aria-expanded={open}
        autoComplete="off"
        className="h-10 w-full rounded-xl border bg-muted/50 pl-10 pr-24 text-sm outline-none transition-shadow placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
      <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        {q && (
          <button type="button" aria-label="Clear" onClick={() => { setQ(""); inputRef.current?.focus(); }} className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="hidden rounded border border-slate-300 bg-slate-50 px-1.5 text-[10px] leading-4 text-slate-500 lg:inline">Ctrl K</kbd>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-[560px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10" data-testid="search-panel">
          {/* what to look in */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-3 py-2">
            {scopes.map((s) => {
              const on = effScope === s.key;
              return (
                <button key={s.key} type="button" onClick={() => { setScope(s.key); inputRef.current?.focus(); }} aria-pressed={on} data-testid={`scope-${s.key}`} className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                  {s.label}
                </button>
              );
            })}
            {parsed.prefix && <span className="self-center pl-1 text-[11px] text-slate-400">using <code className="rounded bg-slate-100 px-1">{parsed.prefix}</code></span>}
          </div>

          <div className="max-h-[62vh] overflow-y-auto">
            {showEmptyState && (
              <div data-testid="search-empty">
                {actions.length > 0 && (
                  <div className="px-3 pb-2 pt-2.5">
                    <p className="mb-1.5 px-1 text-[10px] font-semibold tracking-wide text-slate-400">QUICK ACTIONS</p>
                    <div className="flex flex-wrap gap-1.5">
                      {actions.map((a) => {
                        const Icon = ACTION_ICON[a.icon];
                        return (
                          <button key={a.label} type="button" onClick={() => go(a.to)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50">
                            <Icon className="h-3.5 w-3.5 text-slate-500" /> {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {pages.length > 0 && (
                  <div className="px-3 pb-2 pt-1">
                    <p className="mb-1 px-1 text-[10px] font-semibold tracking-wide text-slate-400">GO TO</p>
                    {["Sales", "Money", "Reports", "Setup"].map((grp) => {
                      const list = pages.filter((p) => p.group === grp);
                      if (!list.length) return null;
                      return (
                        <div key={grp} className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 pb-1">
                          <span className="w-14 shrink-0 px-1 text-[11px] text-slate-400">{grp}</span>
                          {list.map((p) => (
                            <button key={p.label} type="button" onClick={() => go(p.to)} className="rounded-md px-2 py-0.5 text-[12.5px] text-slate-700 hover:bg-slate-100">
                              {p.label}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
                {isAdmin && (
                <div className="border-t border-slate-100 px-3 pb-3 pt-2.5" data-testid="prefix-section">
                  <p className="mb-1.5 px-1 text-[10px] font-semibold tracking-wide text-slate-400">NARROW WITH A PREFIX</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(PREFIXES)
                      .filter((p) => PREFIXES[p].amountOnly || myGroups.some((g) => g.key === PREFIXES[p].scope))
                      .map((p) => (
                        <button key={p} type="button" data-testid={`prefix-${p}`} title={PREFIXES[p].label} onClick={() => { setQ(p); inputRef.current?.focus(); }} className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 hover:bg-slate-100">
                          {p}
                        </button>
                      ))}
                  </div>
                  <p className="mt-2 px-1 text-[11.5px] leading-snug text-slate-500">Or type an amount (115) to find matching sales, expenses and payments — and see its VAT.</p>
                </div>
                )}
              </div>
            )}

            {!showEmptyState && term.length < MIN_CHARS && <p className="px-4 py-5 text-center text-xs text-slate-400">Type at least {MIN_CHARS} characters.</p>}

            {/* the VAT of a typed amount */}
            {vat && (
              <div className="mx-3 mt-2.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900" data-testid="vat-helper">
                <p className="mb-0.5 text-[11px] font-medium text-indigo-700">VAT helper · {fmt(amount)} — click a line to copy</p>
                <button type="button" onClick={() => copy(fmt(vat.included.net))} className="flex w-full justify-between py-0.5 text-left hover:underline" data-testid="vat-included">
                  <span>VAT included → excl. {fmt(vat.included.net)}</span>
                  <b className="font-medium">VAT {fmt(vat.included.vat)}</b>
                </button>
                <button type="button" onClick={() => copy(fmt(vat.onTop.total))} className="flex w-full justify-between py-0.5 text-left hover:underline" data-testid="vat-ontop">
                  <span>VAT on top → total {fmt(vat.onTop.total)}</span>
                  <b className="font-medium">VAT {fmt(vat.onTop.vat)}</b>
                </button>
              </div>
            )}

            {sections.map((sec) => (
              <div key={sec.key} className="px-2 pb-1 pt-2" data-testid={`section-${sec.key}`}>
                <p className="px-2 pb-1 text-[10px] font-semibold tracking-wide text-slate-400">
                  {sec.title.toUpperCase()}
                  {amount !== null && sec.items.some((i) => i.raw?.amountMatch) ? " · INCLUDING MATCHING AMOUNT" : ""}
                </p>
                {sec.items.map((it) => {
                  const n = flat.indexOf(it);
                  const on = n === active;
                  const K = KIND[it.kind] || KIND.page;
                  const Icon = it.icon || K.icon;
                  return (
                    <div
                      key={it.key}
                      role="option"
                      aria-selected={on}
                      data-testid="search-row"
                      onMouseEnter={() => setActive(n)}
                      onClick={() => go(it.to)}
                      className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 ${on ? "bg-slate-100" : ""}`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${K.tone}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-slate-900">
                          <Mark text={it.row.title} term={amount === null ? term : ""} />
                        </span>
                        <span className="block truncate text-[11.5px] text-slate-500">
                          <Mark text={it.row.sub} term={amount === null ? term : ""} />
                        </span>
                      </span>
                      {it.row.badge && <span className={on && it.row.rowActions ? "hidden" : ""}><Badge tone={it.row.badgeTone}>{it.row.badge}</Badge></span>}
                      {it.row.rowActions && on && (
                        <span className="flex shrink-0 gap-0.5" data-testid="row-actions">
                          <button type="button" title="Open in a new tab" aria-label="Open in a new tab" onClick={(e) => { e.stopPropagation(); go(it.to, true); }} className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" title="Print the invoice" aria-label="Print the invoice" onClick={(e) => { e.stopPropagation(); window.open(`/invoice-print/${it.raw.id}`, "_blank", "noopener,noreferrer"); }} className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900">
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" title="Copy the invoice number" aria-label="Copy the invoice number" onClick={(e) => { e.stopPropagation(); copy(it.row.copyValue); }} className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                      {on && !it.row.rowActions && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                    </div>
                  );
                })}
              </div>
            ))}

            {failed && <p className="px-4 py-5 text-center text-xs text-rose-600" role="alert">Search failed. Check your connection and try again.</p>}
            {noResult && (
              <div className="px-4 py-6 text-center" data-testid="search-none">
                <SearchX className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-1 text-[13px] font-medium text-slate-600">No match for “{term}”</p>
                <p className="text-xs text-slate-400">Check the number or try part of the name.</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-500">
            <span>
              <kbd className="rounded border border-slate-300 px-1">↑</kbd> <kbd className="rounded border border-slate-300 px-1">↓</kbd> move · <kbd className="rounded border border-slate-300 px-1">↵</kbd> open ·{" "}
              <kbd className="rounded border border-slate-300 px-1">Ctrl ↵</kbd> new tab · <kbd className="rounded border border-slate-300 px-1">Esc</kbd> close
            </span>
            <span>Only what your role can open</span>
          </div>
        </div>
      )}
    </div>
  );
}
