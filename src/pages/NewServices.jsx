"use client";

import { Link } from "react-router-dom";
import { ArrowRight, Ban, Briefcase, Hotel, Receipt, ShieldCheck, Ticket, Undo2, Zap } from "lucide-react";
import { Card, CardContent } from "../../shadcn/components/ui/card";
import { useAuth } from "../context/AuthContext";

// Deep, muted tones (the 800/900 shades, no bright colours): each service has its own — indigo, wine,
// teal, slate — carried through its panel, tags, hover ring and button. Literal class names
// throughout (Tailwind can't see built-up strings).
const SERVICES = [
  {
    key: "sale",
    to: "/new-services/sale",
    no: "01",
    title: "New Sale",
    titleAr: "بيع جديد",
    desc: "Issue a ticket or service to a customer — cash, bank transfer, POS, credit or a split of them.",
    chips: ["Cash", "Bank", "POS", "Credit", "Split"],
    icon: Ticket,
    permission: "SALE_CREATE",
    panel: "from-indigo-800 via-indigo-900 to-slate-900",
    iconTile: "bg-indigo-200/15 text-indigo-50 ring-indigo-200/30",
    line: "bg-indigo-300/60",
    dot: "bg-indigo-500",
    chip: "bg-indigo-50/70 text-indigo-800 ring-indigo-100",
    ring: "hover:ring-indigo-300/70",
    cta: "group-hover:border-indigo-900 group-hover:bg-indigo-900",
    arrow: "bg-indigo-100 text-indigo-700",
  },
  {
    key: "refund",
    to: "/new-services/refund",
    no: "02",
    title: "Sale Refund",
    titleAr: "استرداد بيع",
    desc: "Refund an existing sale — what goes back to the customer, what the vendor returns, fees and cancellation charges.",
    chips: ["Customer payout", "Vendor refund", "Fees"],
    icon: Undo2,
    permission: "REFUND_CREATE",
    panel: "from-rose-800 via-rose-900 to-slate-900",
    iconTile: "bg-rose-200/15 text-rose-50 ring-rose-200/30",
    line: "bg-rose-300/60",
    dot: "bg-rose-500",
    chip: "bg-rose-50/70 text-rose-800 ring-rose-100",
    ring: "hover:ring-rose-300/70",
    cta: "group-hover:border-rose-900 group-hover:bg-rose-900",
    arrow: "bg-rose-100 text-rose-700",
  },
  {
    key: "hotel",
    to: "/new-hotel-booking",
    no: "03",
    title: "Hotel Bookings",
    titleAr: "حجوزات الفنادق",
    desc: "Book a domestic or international hotel with its check-in, check-out and nights, paid like any other sale.",
    chips: ["Domestic", "International", "Check-in / out"],
    icon: Hotel,
    permission: "SALE_CREATE",
    panel: "from-teal-800 via-teal-900 to-slate-900",
    iconTile: "bg-teal-200/15 text-teal-50 ring-teal-200/30",
    line: "bg-teal-300/60",
    dot: "bg-teal-500",
    chip: "bg-teal-50/70 text-teal-800 ring-teal-100",
    ring: "hover:ring-teal-300/70",
    cta: "group-hover:border-teal-900 group-hover:bg-teal-900",
    arrow: "bg-teal-100 text-teal-700",
  },
  {
    key: "void",
    to: "/new-services/void",
    no: "04",
    title: "Void Sale",
    titleAr: "إلغاء بيع (فويد)",
    desc: "Record a ticket cancelled with the vendor inside its void window — only the vendor ledger is touched, never a customer.",
    chips: ["Vendor only", "Credit + debit", "Service charge"],
    icon: Ban,
    permission: "SALE_CREATE",
    panel: "from-slate-600 via-slate-700 to-slate-900",
    iconTile: "bg-slate-200/15 text-slate-50 ring-slate-200/30",
    line: "bg-slate-300/60",
    dot: "bg-slate-500",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    ring: "hover:ring-slate-400/70",
    cta: "group-hover:border-slate-900 group-hover:bg-slate-900",
    arrow: "bg-slate-200 text-slate-700",
  },
];

const TIPS = [
  { icon: Zap, text: "Every service posts to the ledgers the moment you submit it." },
  { icon: Receipt, text: "Find, edit or delete anything you create in the Sales Report." },
  { icon: ShieldCheck, text: "Voids touch only the vendor ledger — never a customer." },
];

/** Landing page for Services: pick what to create, each option opens its own page. */
export default function NewServices() {
  const { hasPermission } = useAuth();
  const allowed = SERVICES.filter((s) => hasPermission(s.permission));

  if (allowed.length === 0) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            You don't have permission to create sales or refunds.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-7 text-white shadow-lg md:p-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-slate-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-8 hidden h-24 w-24 rotate-12 rounded-3xl border border-white/5 md:block" />
        <div className="pointer-events-none absolute right-24 top-20 hidden h-16 w-16 -rotate-6 rounded-2xl border border-white/5 md:block" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Briefcase size={26} />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Sales Services</h1>
              <p className="mt-0.5 text-sm text-slate-400" dir="rtl">
                خدمات المبيعات
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-base font-medium text-slate-100">What would you like to do?</p>
            <p className="mt-1 text-sm text-slate-400">
              Pick a service to open its form — sales, refunds, hotel bookings and voids all live here.
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {allowed.map((s) => (
          <Link
            key={s.key}
            to={s.to}
            className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${s.ring}`}
          >
            {/* Panel: a deep, muted shade of the service's colour fading to slate */}
            <div className={`relative flex h-36 items-end justify-between overflow-hidden bg-gradient-to-br p-5 ${s.panel}`}>
              <span className={`absolute inset-x-0 top-0 h-0.5 ${s.line}`} />
              <s.icon
                size={140}
                strokeWidth={1.25}
                className="pointer-events-none absolute -bottom-8 -right-6 rotate-12 text-white/10 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105"
              />

              <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ring-1 backdrop-blur transition-transform duration-300 group-hover:scale-105 ${s.iconTile}`}>
                <s.icon size={26} />
              </span>
              <span className="relative text-3xl font-bold tracking-tight text-white/20">{s.no}</span>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">{s.title}</h2>
                <span className="text-xs text-slate-400" dir="rtl">
                  {s.titleAr}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.chips.map((chip) => (
                  <span
                    key={chip}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${s.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <span className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 group-hover:text-white ${s.cta}`}>
                  Open {s.title.toLowerCase()}
                  <span className={`grid h-7 w-7 place-items-center rounded-full transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/15 group-hover:text-white ${s.arrow}`}>
                    <ArrowRight size={15} />
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Good to know */}
      <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
        {TIPS.map((t) => (
          <div key={t.text} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <t.icon size={16} />
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
