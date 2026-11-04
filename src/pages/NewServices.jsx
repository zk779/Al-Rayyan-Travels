"use client";

import { Link } from "react-router-dom";
import { ArrowRight, Ban, Briefcase, Hotel, ShieldCheck, Ticket, Undo2 } from "lucide-react";
import { Card, CardContent } from "../../shadcn/components/ui/card";
import { useAuth } from "../context/AuthContext";

// Literal class names throughout (Tailwind can't see classes built from template strings)
const SERVICES = [
  {
    key: "sale",
    to: "/new-services/sale",
    title: "New Sale",
    titleAr: "بيع جديد",
    desc: "Issue a ticket or service to a customer — cash, bank transfer, POS, credit or a split of them.",
    chips: ["Cash", "Bank", "POS", "Credit", "Split"],
    icon: Ticket,
    permission: "SALE_CREATE",
    iconBg: "from-blue-500 to-indigo-600 shadow-indigo-500/30",
    bar: "from-blue-500 to-indigo-600",
    hover: "hover:ring-indigo-300",
    cta: "text-indigo-600",
  },
  {
    key: "refund",
    to: "/new-services/refund",
    title: "Sale Refund",
    titleAr: "استرداد بيع",
    desc: "Refund an existing sale — what goes back to the customer, what the vendor returns, fees and cancellation charges.",
    chips: ["Customer payout", "Vendor refund", "Fees"],
    icon: Undo2,
    permission: "REFUND_CREATE",
    iconBg: "from-rose-500 to-orange-500 shadow-rose-500/30",
    bar: "from-rose-500 to-orange-500",
    hover: "hover:ring-rose-300",
    cta: "text-rose-600",
  },
  {
    key: "hotel",
    to: "/new-hotel-booking",
    title: "Hotel Bookings",
    titleAr: "حجوزات الفنادق",
    desc: "Book a domestic or international hotel with its check-in, check-out and nights, paid like any other sale.",
    chips: ["Domestic", "International", "Check-in / out"],
    icon: Hotel,
    permission: "SALE_CREATE",
    iconBg: "from-teal-500 to-emerald-600 shadow-teal-500/30",
    bar: "from-teal-500 to-emerald-600",
    hover: "hover:ring-teal-300",
    cta: "text-teal-600",
  },
  {
    key: "void",
    to: "/new-services/void",
    title: "Void Sale",
    titleAr: "إلغاء بيع (فويد)",
    desc: "Record a ticket cancelled with the vendor inside its void window — only the vendor ledger is touched, never a customer.",
    chips: ["Vendor only", "Credit + debit", "Optional service charge"],
    icon: Ban,
    permission: "SALE_CREATE",
    iconBg: "from-gray-600 to-gray-900 shadow-slate-900/30",
    bar: "from-gray-600 to-gray-900",
    hover: "hover:ring-slate-400",
    cta: "text-slate-800",
  },
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
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-md">
          <Briefcase size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Sales Services</h1>
          <p className="text-sm text-slate-500">What would you like to do?</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {allowed.map((s) => (
          <Link
            key={s.key}
            to={s.to}
            className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${s.hover}`}
          >
            <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.bar}`} />

            <div className="flex items-start justify-between">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${s.iconBg}`}>
                <s.icon size={26} />
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:bg-slate-900 group-hover:text-white">
                <ArrowRight size={16} />
              </span>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">{s.title}</h2>
            <p className="text-xs text-slate-400" dir="rtl">
              {s.titleAr}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.chips.map((chip) => (
                <span key={chip} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <ShieldCheck size={11} className="opacity-60" /> {chip}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-4">
              <span className={`text-sm font-semibold ${s.cta}`}>Open {s.title.toLowerCase()} →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
