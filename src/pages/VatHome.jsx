"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileBarChart2, ReceiptText, Percent, SaudiRiyal, TrendingUp, Undo2, ShoppingCart } from "lucide-react";
import { money } from "../components/vat/vatFormat";
import { currentQuarter, currentYear, quarterRange, rangeParams } from "../components/vat/vatPeriod";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

/** Landing page for the VAT area: pick Submit VAT Report or Returnable VAT. */
export default function VatHome() {
  const [snap, setSnap] = useState({ payable: null, returnable: null });
  const quarter = currentQuarter();
  const year = currentYear();

  // A small "this quarter" snapshot on each card — purely informational, so a
  // failure just leaves the figure as "—".
  useEffect(() => {
    const ctrl = new AbortController();
    const range = quarterRange(year, quarter);

    const vatQs = new URLSearchParams(rangeParams(range)).toString();
    fetch(`${API_BASE}/api/sales/vat-report?${vatQs}`, { headers: authHeaders(), signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => j.success && setSnap((s) => ({ ...s, payable: j.data.payableVat })))
      .catch(() => {});

    const expQs = new URLSearchParams({
      category: "RETURNABLE_VAT",
      status: "APPROVED",
      limit: "1",
      ...rangeParams(range, { tzKey: "timeZone" }),
    }).toString();
    fetch(`${API_BASE}/api/expenses?${expQs}`, { headers: authHeaders(), signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => j.success && setSnap((s) => ({ ...s, returnable: j.summary?.totalVat ?? 0 })))
      .catch(() => {});

    return () => ctrl.abort();
  }, [year, quarter]);

  const cards = [
    {
      to: "/vat/submit",
      title: "Submit VAT Report",
      titleAr: "تقديم تقرير ضريبة القيمة المضافة",
      desc: "Output VAT on sales, input VAT on purchases and refund VAT — the net VAT payable for your ZATCA return.",
      icon: FileBarChart2,
      iconBg: "from-gray-600 to-gray-900 shadow-slate-900/25",
      accent: "text-slate-800",
      ring: "hover:ring-slate-400",
      chips: [
        { icon: TrendingUp, label: "Sales" },
        { icon: ShoppingCart, label: "Purchases" },
        { icon: Undo2, label: "Refunds" },
      ],
      statLabel: `Payable VAT · Q${quarter} ${year}`,
      stat: snap.payable,
      cta: "Open report",
    },
    {
      to: "/vat/return",
      title: "Returnable VAT",
      titleAr: "ضريبة القيمة المضافة المستردة",
      desc: "VAT you paid on Returnable VAT expenses — what you can claim back, by branch and by expense.",
      icon: ReceiptText,
      iconBg: "from-gray-600 to-gray-900 shadow-slate-900/25",
      accent: "text-slate-800",
      ring: "hover:ring-slate-400",
      chips: [
        { icon: Percent, label: "15% included" },
        { icon: ReceiptText, label: "Expenses" },
      ],
      statLabel: `Returnable VAT · Q${quarter} ${year}`,
      stat: snap.returnable,
      cta: "Open returnable VAT",
    },
  ];

  return (
    <div className="mx-auto w-full pb-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-md">
          <Percent size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">VAT</h1>
          <p className="text-sm text-slate-500">What would you like to look at?</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${c.ring}`}
          >
            <div className="flex items-start justify-between">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${c.iconBg}`}>
                <c.icon size={26} />
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:bg-slate-900 group-hover:text-white">
                <ArrowRight size={16} />
              </span>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">{c.title}</h2>
            <p className="text-xs text-slate-400" dir="rtl">
              {c.titleAr}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.chips.map((chip) => (
                <span key={chip.label} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <chip.icon size={12} /> {chip.label}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-end justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{c.statLabel}</p>
                <p className={`mt-0.5 flex items-center gap-1 text-2xl font-bold tabular-nums ${c.accent}`}>
                  <SaudiRiyal size={18} />
                  {c.stat == null ? <span className="inline-block h-6 w-20 animate-pulse rounded bg-slate-100" /> : money(c.stat)}
                </p>
              </div>
              <span className={`text-sm font-semibold ${c.accent}`}>{c.cta} →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
