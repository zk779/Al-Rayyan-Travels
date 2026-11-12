"use client";

import { AlertTriangle, Banknote, BookUser, Check, Landmark, SaudiRiyal } from "lucide-react";
import { Label } from "../../../shadcn/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shadcn/components/ui/select";
import { PAYOUT_LABEL, fmt } from "./refundUtils";

/** A compact card: a light red title bar with the icon, then the content. */
export const Panel = ({ icon: Icon, title, titleAr, right, children, className = "" }) => (
  <section className={`rounded-xl bg-white shadow-sm ring-1 ring-rose-200/70 ${className}`}>
    <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-rose-100 bg-rose-50/80 px-4 py-2">
      <h3 className="flex items-center gap-2 text-[13px] font-semibold text-rose-950">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-rose-600 text-white">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {title}
        {titleAr && (
          <span className="text-[11px] font-normal text-rose-400" dir="rtl">
            {titleAr}
          </span>
        )}
      </h3>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </section>
);

export const Money = ({ value, className = "" }) => (
  <span className={`inline-flex items-center gap-1 tabular-nums ${className}`}>
    <SaudiRiyal className="h-3.5 w-3.5 opacity-50" />
    {fmt(value)}
  </span>
);

/** label / value in a grid (the locked sale information). */
export const Facts = ({ items }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
    {items
      .filter((i) => i.value !== undefined)
      .map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{i.label}</dt>
          <dd className={`truncate text-[13px] font-medium text-slate-900 ${i.mono ? "font-mono" : ""}`} title={typeof i.value === "string" ? i.value : undefined}>
            {i.money ? <Money value={i.value} /> : i.value || "—"}
          </dd>
        </div>
      ))}
  </dl>
);

/** A number field with the riyal sign. */
export const MoneyInput = ({ label, hint, value, onChange, invalid }) => (
  <div className="space-y-1">
    <Label className="flex items-baseline justify-between gap-2 text-xs font-medium text-slate-600">
      {label}
      {hint && <span className="text-[10px] font-normal text-slate-400">{hint}</span>}
    </Label>
    <div className="relative">
      <SaudiRiyal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        aria-label={label}
        className={`h-9 w-full rounded-lg border bg-white pl-8 pr-3 text-sm tabular-nums outline-none transition-shadow focus:ring-2 ${
          invalid ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:border-rose-400 focus:ring-rose-200/80"
        }`}
      />
    </div>
  </div>
);

const Choice = ({ on, disabled, onClick, icon: Icon, title, sub, testId }) => (
  <button
    type="button"
    role="radio"
    aria-checked={on}
    disabled={disabled}
    onClick={onClick}
    data-testid={testId}
    title={sub}
    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
      disabled
        ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60"
        : on
          ? "border-rose-600 bg-rose-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50/60"
    }`}
  >
    <Icon className={`h-4 w-4 shrink-0 ${on ? "text-white" : "text-rose-500"}`} />
    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{title}</span>
    {on && <Check className="h-3.5 w-3.5 shrink-0" />}
  </button>
);

/**
 * Who / what receives the refund: the customer's ledger, cash, or a bank transfer (+ which bank).
 * Pure display — what is chosen is exactly what the parent sends.
 */
export function PayoutPicker({ refundType, onType, bankId, onBank, banks, hasCreditCustomer, isTabbyTamara, customerName, bankInvalid }) {
  return (
    <div className="space-y-2.5">
      <div role="radiogroup" aria-label="Refund payout method" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Choice on={refundType === "CUSTOMER_LEDGER"} disabled={!hasCreditCustomer || isTabbyTamara} onClick={() => onType("CUSTOMER_LEDGER")} icon={BookUser} title="Customer ledger" sub="Credit the customer's account" testId="payout-ledger" />
        <Choice on={refundType === "CASH"} onClick={() => onType("CASH")} icon={Banknote} title="Cash" sub="Paid out in cash" testId="payout-cash" />
        <Choice on={refundType === "BANK_TRANSFER"} onClick={() => onType("BANK_TRANSFER")} icon={Landmark} title="Bank transfer" sub="Paid from a bank account" testId="payout-bank" />
      </div>

      {isTabbyTamara && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This ticket was booked through <strong>{customerName}</strong> — refunds must be paid out as Cash or Bank Transfer directly to the traveler. Crediting {customerName}'s ledger would incorrectly reduce what they still owe you.
          </span>
        </div>
      )}
      {!isTabbyTamara && !hasCreditCustomer && <p className="text-[11px] text-slate-400">The customer ledger is only available when the sale was on credit to a customer.</p>}

      {refundType === "BANK_TRANSFER" && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">
            Bank account <span className="text-rose-500">*</span>
          </Label>
          <Select value={bankId} onValueChange={onBank}>
            <SelectTrigger className={`h-9 w-full rounded-lg ${bankInvalid && !bankId ? "border-rose-400" : ""}`} aria-label="Bank account">
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.bankName} — {b.accountNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/** The live calculation. The numbers are passed in already worked out by the page. */
export function CalcCard({ net, fee, vendorAmount, service, payout, refundType }) {
  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-rose-700 via-rose-900 to-rose-950 p-4 text-white shadow-md" data-testid="calc">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-100/80">Refund calculation</p>
      <div className="mt-2 space-y-1.5 text-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-rose-100/80">Net price</span>
          <Money value={net} className="font-medium" />
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-rose-100/80">− Refund fee</span>
          <span className="inline-flex items-center gap-1 font-medium tabular-nums text-rose-200">
            −<SaudiRiyal className="h-3.5 w-3.5 opacity-60" />
            {fmt(fee)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 rounded-lg bg-black/20 px-2.5 py-1.5 font-semibold" data-testid="calc-vendor">
          <span>Refund to vendor</span>
          <Money value={vendorAmount} />
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-0.5">
          <span className="text-rose-100/80">− Service charges</span>
          <span className="inline-flex items-center gap-1 font-medium tabular-nums text-rose-200">
            −<SaudiRiyal className="h-3.5 w-3.5 opacity-60" />
            {fmt(service)}
          </span>
        </div>
      </div>
      <div className="mt-3 border-t border-white/15 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-100/80">{PAYOUT_LABEL[refundType] || PAYOUT_LABEL.CASH}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-2xl font-bold tabular-nums" data-testid="calc-payout">
          <SaudiRiyal size={20} className="opacity-60" />
          {fmt(payout)}
        </p>
      </div>
    </div>
  );
}
