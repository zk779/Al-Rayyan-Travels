"use client";

import { Link } from "react-router-dom";
import { ArrowRight, Ban, Briefcase, FileStack, Hotel, Receipt, ShieldCheck, Ticket, Umbrella, Undo2, Zap } from "lucide-react";
import { Card, CardContent } from "../../shadcn/components/ui/card";
import { useAuth } from "../context/AuthContext";

// Each service has its own colour — indigo, rose, teal, sky, slate, amber — carried through its icon tile, tags, number and hover
// ring. Literal class names throughout (Tailwind can't see built-up strings).
const TONES = {
  indigo: {
    bar: "from-indigo-400 via-indigo-500 to-violet-600",
    card: "from-indigo-50 via-white to-white",
    icon: "from-indigo-500 to-violet-600 shadow-indigo-500/40",
    glow: "from-indigo-200/80",
    text: "text-indigo-700",
    chip: "bg-indigo-100/80 text-indigo-800 ring-indigo-200",
    dot: "bg-indigo-500",
    ring: "hover:ring-indigo-300 hover:shadow-indigo-500/20",
    num: "text-indigo-200",
    cta: "bg-indigo-50 text-indigo-700 ring-indigo-200 group-hover:from-indigo-500 group-hover:to-violet-600"
  },
  rose: {
    bar: "from-rose-400 via-rose-500 to-pink-600",
    card: "from-rose-50 via-white to-white",
    icon: "from-rose-500 to-pink-600 shadow-rose-500/40",
    glow: "from-rose-200/80",
    text: "text-rose-700",
    chip: "bg-rose-100/80 text-rose-800 ring-rose-200",
    dot: "bg-rose-500",
    ring: "hover:ring-rose-300 hover:shadow-rose-500/20",
    num: "text-rose-200",
    cta: "bg-rose-50 text-rose-700 ring-rose-200 group-hover:from-rose-500 group-hover:to-pink-600"
  },
  teal: {
    bar: "from-teal-400 via-teal-500 to-emerald-600",
    card: "from-teal-50 via-white to-white",
    icon: "from-teal-500 to-emerald-600 shadow-teal-500/40",
    glow: "from-teal-200/80",
    text: "text-teal-700",
    chip: "bg-teal-100/80 text-teal-800 ring-teal-200",
    dot: "bg-teal-500",
    ring: "hover:ring-teal-300 hover:shadow-teal-500/20",
    num: "text-teal-200",
    cta: "bg-teal-50 text-teal-700 ring-teal-200 group-hover:from-teal-500 group-hover:to-emerald-600"
  },
  sky: {
    bar: "from-sky-400 via-sky-500 to-blue-600",
    card: "from-sky-50 via-white to-white",
    icon: "from-sky-500 to-blue-600 shadow-sky-500/40",
    glow: "from-sky-200/80",
    text: "text-sky-700",
    chip: "bg-sky-100/80 text-sky-800 ring-sky-200",
    dot: "bg-sky-500",
    ring: "hover:ring-sky-300 hover:shadow-sky-500/20",
    num: "text-sky-200",
    cta: "bg-sky-50 text-sky-700 ring-sky-200 group-hover:from-sky-500 group-hover:to-blue-600"
  },
  slate: {
    bar: "from-slate-400 via-slate-500 to-zinc-600",
    card: "from-slate-50 via-white to-white",
    icon: "from-slate-500 to-zinc-600 shadow-slate-500/40",
    glow: "from-slate-200/80",
    text: "text-slate-700",
    chip: "bg-slate-100/80 text-slate-800 ring-slate-200",
    dot: "bg-slate-500",
    ring: "hover:ring-slate-300 hover:shadow-slate-500/20",
    num: "text-slate-200",
    cta: "bg-slate-50 text-slate-700 ring-slate-200 group-hover:from-slate-500 group-hover:to-zinc-600"
  },
  amber: {
    bar: "from-amber-400 via-amber-500 to-orange-600",
    card: "from-amber-50 via-white to-white",
    icon: "from-amber-500 to-orange-600 shadow-amber-500/40",
    glow: "from-amber-200/80",
    text: "text-amber-700",
    chip: "bg-amber-100/80 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    ring: "hover:ring-amber-300 hover:shadow-amber-500/20",
    num: "text-amber-200",
    cta: "bg-amber-50 text-amber-700 ring-amber-200 group-hover:from-amber-500 group-hover:to-orange-600"
  }
};

const SERVICES = [
  {
    key: "sale",
    tone: TONES.indigo,
    to: "/new-services/sale",
    no: "01",
    title: "New Sale",
    titleAr: "بيع جديد",
    desc: "Issue a ticket or service to a customer — cash, bank transfer, POS, credit or a split of them.",
    chips: ["Cash", "Bank", "POS", "Credit", "Split"],
    icon: Ticket,
    permission: "SALE_CREATE",
  },
  {
    key: "refund",
    tone: TONES.rose,
    to: "/new-services/refund",
    no: "02",
    title: "Sale Refund",
    titleAr: "استرداد بيع",
    desc: "Refund an existing sale — what goes back to the customer, what the vendor returns, fees and cancellation charges.",
    chips: ["Customer payout", "Vendor refund", "Fees"],
    icon: Undo2,
    permission: "REFUND_CREATE",
  },
  {
    key: "hotel",
    tone: TONES.teal,
    to: "/new-hotel-booking",
    no: "03",
    title: "Hotel Bookings",
    titleAr: "حجوزات الفنادق",
    desc: "Book a domestic or international hotel with its check-in, check-out and nights, paid like any other sale.",
    chips: ["Domestic", "International", "Check-in / out"],
    icon: Hotel,
    permission: "HOTEL_CREATE",
  },
  {
    key: "insurance",
    tone: TONES.sky,
    to: "/new-insurance",
    no: "04",
    title: "Insurance Policies",
    titleAr: "وثائق التأمين",
    desc: "Sell a domestic or international insurance policy with its start and end dates and the insurer, paid like any other sale.",
    chips: ["Domestic", "International", "Policy period"],
    icon: Umbrella,
    permission: "INSURANCE_CREATE",
  },
  {
    key: "void",
    tone: TONES.slate,
    to: "/new-services/void",
    no: "05",
    title: "Void Sale",
    titleAr: "إلغاء بيع (فويد)",
    desc: "Record a ticket cancelled with the vendor inside its void window — only the vendor ledger is touched, never a customer.",
    chips: ["Vendor only", "Credit + debit", "Service charge"],
    icon: Ban,
    permission: "VOID_CREATE",
  },
  {
    key: "other",
    tone: TONES.amber,
    to: "/other-services",
    no: "06",
    title: "Other Services",
    titleAr: "خدمات أخرى",
    desc: "Invoices for everything beyond tickets, hotels and insurance — transportation, Umrah visa and more — with the 15% VAT worked out for you.",
    chips: ["Transportation", "Umrah visa", "VAT invoice"],
    icon: FileStack,
    permission: "OTHER_SERVICE_READ",
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-lg md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
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
              Pick a service to open its form — sales, refunds, hotel bookings, insurance, voids and other services all live here.
            </p>
          </div>
        </div>
      </div>

      {/* Services — two rows of three on a desktop screen (one row when there are 3 or fewer); stacked on smaller screens */}
      <div
        className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": allowed.length <= 3 ? Math.max(allowed.length, 1) : Math.ceil(allowed.length / 2) }}
      >
        {allowed.map((s) => (
          <Link
            key={s.key}
            to={s.to}
            state={{ fromServices: true }} // lets the page opened know it was reached from here
            className={`group relative flex w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${s.tone.card} ${s.tone.ring}`}
          >
            {/* colour bar */}
            <span className={`h-1.5 w-full bg-gradient-to-r ${s.tone.bar}`} />
            {/* soft colour glow, grows on hover */}
            <span className={`pointer-events-none absolute -right-14 top-4 h-44 w-44 rounded-full bg-gradient-to-br ${s.tone.glow} to-transparent blur-2xl transition-all duration-500 group-hover:scale-125`} />

            <div className="relative flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between">
                <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${s.tone.icon}`}>
                  <s.icon size={26} />
                </span>
                <span className={`text-5xl font-black leading-none tracking-tighter ${s.tone.num}`}>{s.no}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h2 className="text-lg font-bold text-slate-900">{s.title}</h2>
                <span className={`text-xs font-medium opacity-70 ${s.tone.text}`} dir="rtl">
                  {s.titleAr}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.desc}</p>

              <div className="mb-5 mt-3.5 flex flex-wrap gap-1.5">
                {s.chips.map((chip) => (
                  <span key={chip} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${s.tone.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.tone.dot}`} />
                    {chip}
                  </span>
                ))}
              </div>

              {/* call to action: tinted pill that floods with the service colour on hover */}
              <span className={`mt-auto flex items-center justify-between rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold ring-1 transition-all duration-300 group-hover:text-white group-hover:shadow-md group-hover:ring-transparent ${s.tone.cta}`}>
                Open {s.title.toLowerCase()}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Good to know */}
      <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
        {TIPS.map((t) => (
          <div key={t.text} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-600">
              <t.icon size={16} />
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
