"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Printer,
  Landmark,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Receipt,
  SaudiRiyal,
  Percent,
  Wallet,
  Building2,
  Banknote,
  Hash,
  ListTree,
  ReceiptText,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import VatPeriodPicker from "../components/vat/VatPeriodPicker";
import { PrintLetterhead, SarAmount } from "../components/vat/vatCommon";
import { money } from "../components/vat/vatFormat";
import { rangeParams, useVatPeriod } from "../components/vat/vatPeriod";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const MAX_PAGES = 25; // 200 / page — a safety cap, far above any realistic period

// Every APPROVED "Returnable VAT" expense in the period (a rejected expense is
// never claimable). The expenses API pages at 200, so keep going until done.
async function fetchReturnableExpenses(range, signal) {
  const rows = [];
  let page = 1;
  let pages = 1;
  do {
    const params = new URLSearchParams({
      category: "RETURNABLE_VAT",
      status: "APPROVED",
      limit: "200",
      page: String(page),
    });
    if (range.from || range.to) {
      const p = rangeParams(range, { fromKey: "dateFrom", toKey: "dateTo", tzKey: "timeZone" });
      Object.entries(p).forEach(([k, v]) => params.set(k, v));
    }
    const res = await fetch(`${API_BASE}/api/expenses?${params}`, { headers: authHeaders(), signal });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || "Failed to load returnable VAT expenses");
    rows.push(...(json.data || []));
    pages = json.pagination?.pages || 1;
    page += 1;
  } while (page <= pages && page <= MAX_PAGES);
  return rows;
}

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const Skeleton = ({ w = "w-20" }) => <span className={`inline-block h-4 ${w} animate-pulse rounded bg-slate-100`} />;

/** Returnable VAT — the VAT paid on Returnable-VAT expenses, which can be claimed back. */
export default function ReturnableVat() {
  const period = useVatPeriod();
  const { range, ready, label: periodLabel } = period;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fromKey = range.from ? range.from.getTime() : null;
  const toKey = range.to ? range.to.getTime() : null;
  useEffect(() => {
    if (!ready) {
      setExpenses([]);
      setError("");
      return undefined;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError("");
    fetchReturnableExpenses(range, ctrl.signal)
      .then(setExpenses)
      .catch((err) => {
        if (err.name === "AbortError") return;
        setExpenses([]);
        setError(err.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromKey, toKey, ready]);

  const totals = useMemo(() => {
    const gross = r2(expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0));
    const vat = r2(expenses.reduce((s, e) => s + (Number(e.vatAmount) || 0), 0));
    return { gross, vat, net: r2(gross - vat), count: expenses.length };
  }, [expenses]);

  const byBranch = useMemo(() => {
    const map = new Map();
    expenses.forEach((e) => {
      const key = e.branch?.name || "—";
      const row = map.get(key) || { name: key, count: 0, gross: 0, vat: 0 };
      row.count += 1;
      row.gross += Number(e.amount) || 0;
      row.vat += Number(e.vatAmount) || 0;
      map.set(key, row);
    });
    return [...map.values()].map((b) => ({ ...b, gross: r2(b.gross), vat: r2(b.vat) })).sort((a, b) => b.vat - a.vat);
  }, [expenses]);

  const missingVat = expenses.filter((e) => e.vatAmount == null).length;

  return (
    <div className="min-h-screen print:min-h-0">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print {
          body { background: white !important; }
          /* the on-screen horizontal scroll must not clip the printed tables */
          [data-slot="table-container"] { overflow: visible !important; }
          table { min-width: 0 !important; width: 100% !important; }
          .vat-print-exact, .vat-print-exact * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto w-full pb-10">
        <div className="print:hidden">
          <Link to="/vat" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3.5 w-3.5" /> VAT
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-md shadow-slate-900/25">
              <ReceiptText size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Returnable VAT</h1>
              <p className="text-sm text-slate-500">
                VAT paid on your Returnable VAT expenses — the amount you can claim back.
              </p>
            </div>
          </div>
        </div>

        <PrintLetterhead title="Returnable VAT" periodLabel={periodLabel} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] print:block">
          <section className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 md:p-6 lg:sticky lg:top-6 print:hidden">
            <VatPeriodPicker period={period} disabled={loading} />

            <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 ring-1 ring-slate-200">
              Counts <span className="font-semibold">approved</span> expenses in the <span className="font-semibold">Returnable VAT</span>{" "}
              category, by expense date. The amount you enter on an expense already includes 15% VAT.
            </p>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || !expenses.length}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={17} /> Print report
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">Prints exactly what you see on the right</p>
          </section>

          <section className="space-y-4 min-w-0">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 print:hidden">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {!ready && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center print:hidden">
                <span className="rounded-full bg-slate-100 p-3 text-slate-500">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-slate-700">Pick a start and/or end date to see the returnable VAT</p>
              </div>
            )}

            {ready && (
              <>
                {/* Headline */}
                <div className="vat-print-exact relative overflow-hidden rounded-2xl bg-gradient-to-tl from-gray-700 to-gray-900 p-6 text-white shadow-lg print:rounded-lg print:shadow-none">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl print:hidden" />
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-300">
                        <Landmark size={14} /> Total returnable VAT
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-4xl font-bold tabular-nums">
                        {loading ? (
                          <Loader2 className="animate-spin" size={30} />
                        ) : (
                          <>
                            <SaudiRiyal size={28} />
                            {money(totals.vat)}
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">VAT included in the approved Returnable VAT expenses</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">VAT rate 15%</span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-200">
                        <Receipt size={13} /> {periodLabel}
                        <span className="opacity-40">•</span>
                        {totals.count} expense{totals.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <div className="relative mt-5 grid grid-cols-3 gap-2 text-xs">
                    {[
                      ["Gross paid (incl. VAT)", totals.gross],
                      ["Net (excl. VAT)", totals.net],
                      ["Returnable VAT", totals.vat],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-xl bg-white/10 px-3 py-2.5">
                        <p className="text-gray-300">{l}</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums">{loading ? "…" : money(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {missingVat > 0 && !loading && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 print:hidden">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {missingVat} expense{missingVat === 1 ? " has" : "s have"} no VAT saved and {missingVat === 1 ? "is" : "are"} counted as 0.00.
                    Open {missingVat === 1 ? "it" : "them"} in Expenses and save again to record the VAT.
                  </div>
                )}

                {/* By branch */}
                {byBranch.length > 0 && !loading && (
                  <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                    <h2 className="flex items-center gap-2 px-5 pt-5 text-[15px] font-semibold text-slate-900">
                      <Building2 size={16} className="text-slate-600" /> By branch
                    </h2>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[420px] text-sm">
                        <thead>
                          <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-2.5 text-left">Branch</th>
                            <th className="px-5 py-2.5 text-right">Expenses</th>
                            <th className="px-5 py-2.5 text-right">Gross</th>
                            <th className="px-5 py-2.5 text-right">VAT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {byBranch.map((b) => (
                            <tr key={b.name}>
                              <td className="px-5 py-2.5 font-medium text-slate-700">{b.name}</td>
                              <td className="px-5 py-2.5 text-right tabular-nums text-slate-500">{b.count}</td>
                              <td className="px-5 py-2.5 text-right"><SarAmount value={b.gross} className="text-slate-700" /></td>
                              <td className="px-5 py-2.5 text-right"><SarAmount value={b.vat} className="font-semibold text-slate-900" /></td>
                            </tr>
                          ))}
                          <tr className="vat-print-exact bg-slate-100">
                            <td className="px-5 py-3 font-semibold text-slate-900">Total</td>
                            <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">{totals.count}</td>
                            <td className="px-5 py-3 text-right"><SarAmount value={totals.gross} className="font-semibold text-slate-900" /></td>
                            <td className="px-5 py-3 text-right"><SarAmount value={totals.vat} className="text-base font-bold text-slate-900" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expense list */}
                <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                  <div className="flex items-center justify-between px-5 pt-5">
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <ListTree size={16} className="text-slate-600" /> Returnable VAT expenses
                      <span className="text-xs font-normal text-slate-400">({totals.count})</span>
                    </h2>
                    <span className="text-xs text-slate-400">{periodLabel}</span>
                  </div>

                  {loading ? (
                    <div className="space-y-2 p-5">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-9 animate-pulse rounded bg-slate-100" />
                      ))}
                    </div>
                  ) : expenses.length === 0 ? (
                    <div className="flex flex-col items-center gap-1.5 py-14 text-center">
                      <Percent className="h-8 w-8 text-slate-200" />
                      <p className="text-sm font-medium text-slate-500">No returnable VAT expenses in this period</p>
                      <p className="text-xs text-slate-400">
                        Add an expense with the “Returnable VAT” category and it will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/70">
                            <TableHead>Date</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Paid by</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                            <TableHead className="text-right">VAT (15%)</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses.map((e) => {
                            const vat = Number(e.vatAmount) || 0;
                            return (
                              <TableRow key={e.id}>
                                <TableCell className="whitespace-nowrap text-xs">
                                  {format(new Date(e.expenseDate), "dd MMM yyyy")}
                                </TableCell>
                                <TableCell className="text-xs">{e.branch?.name || "—"}</TableCell>
                                <TableCell className="max-w-[220px] truncate text-xs italic text-slate-600" title={e.description || ""}>
                                  {e.description || "—"}
                                </TableCell>
                                <TableCell className="text-xs text-slate-600">
                                  <span className="inline-flex items-center gap-1.5">
                                    {e.paymentMode === "BANK_TRANSFER" ? (
                                      <Wallet className="h-3.5 w-3.5 text-slate-400" />
                                    ) : (
                                      <Banknote className="h-3.5 w-3.5 text-slate-400" />
                                    )}
                                    {e.paymentMode === "BANK_TRANSFER" ? e.bank?.bankName || "Bank" : "Cash"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-xs tabular-nums text-slate-600">
                                  {money(Number(e.amount) - vat)}
                                </TableCell>
                                <TableCell className="text-right text-xs font-semibold tabular-nums text-slate-900">
                                  {e.vatAmount == null ? <span className="text-slate-300">—</span> : money(vat)}
                                </TableCell>
                                <TableCell className="text-right text-xs font-medium tabular-nums text-slate-800">
                                  {money(e.amount)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="vat-print-exact bg-slate-100 hover:bg-slate-100">
                            <TableCell colSpan={4} className="text-xs font-semibold text-slate-900">
                              <span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Total · {totals.count} expense{totals.count === 1 ? "" : "s"}</span>
                            </TableCell>
                            <TableCell className="text-right text-xs font-semibold tabular-nums text-slate-900">{money(totals.net)}</TableCell>
                            <TableCell className="text-right text-sm font-bold tabular-nums text-slate-900">{money(totals.vat)}</TableCell>
                            <TableCell className="text-right text-xs font-semibold tabular-nums text-slate-900">{money(totals.gross)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <p className="px-5 pb-4 pt-3 text-[11px] text-slate-400">
                    Gross is the amount paid (VAT included); Net = Gross − VAT, VAT = Gross × 15/115.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
