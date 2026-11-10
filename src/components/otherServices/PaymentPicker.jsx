"use client";

import { Banknote, Building2, CheckCircle2, FileClock, Landmark } from "lucide-react";
import { Label } from "../../../shadcn/components/ui/label";
import { useBanks } from "./paymentUtils";

export const StatusBadge = ({ status, className = "" }) =>
  status === "DRAFT" ? (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 ${className}`}>
      <FileClock className="h-3 w-3" /> Draft
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 ${className}`}>
      <CheckCircle2 className="h-3 w-3" /> Confirmed
    </span>
  );

const Choice = ({ on, onClick, icon: Icon, label, labelAr, testId }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    data-testid={testId}
    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
      on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
    {labelAr && (
      <span className={`text-[11px] font-normal ${on ? "text-slate-300" : "text-slate-400"}`} dir="rtl">
        {labelAr}
      </span>
    )}
  </button>
);

/** Payment received in: Cash or Bank — and, for Bank, which bank account. */
export function PaymentPicker({ method, bankId, onChange, invalid = false }) {
  const { banks, loading } = useBanks();
  return (
    <div className="space-y-3" data-testid="payment-picker">
      <Label className="flex items-center justify-between text-xs font-medium text-slate-600">
        Payment received in
        <span className="text-[11px] font-normal text-slate-400" dir="rtl">
          الدفع في
        </span>
      </Label>
      <div className="flex gap-2">
        <Choice on={method === "CASH"} onClick={() => onChange({ method: "CASH", bankId: "" })} icon={Banknote} label="Cash" labelAr="نقداً" testId="pay-cash" />
        <Choice on={method === "BANK"} onClick={() => onChange({ method: "BANK", bankId })} icon={Landmark} label="Bank" labelAr="بنك" testId="pay-bank" />
      </div>
      {method === "BANK" && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Building2 className="h-3.5 w-3.5 text-slate-400" /> Bank account <span className="text-rose-500">*</span>
          </Label>
          <select
            value={bankId}
            onChange={(e) => onChange({ method: "BANK", bankId: e.target.value })}
            aria-label="Bank account"
            className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-300 ${
              invalid && !bankId ? "border-rose-300" : "border-slate-200"
            }`}
          >
            <option value="">{loading ? "Loading banks…" : "Select a bank account"}</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} — {b.accountNumber}
              </option>
            ))}
          </select>
        </div>
      )}
      {invalid && !method && <p className="text-[11px] text-rose-500">Choose Cash or Bank.</p>}
      {invalid && method === "BANK" && !bankId && <p className="text-[11px] text-rose-500">Choose the bank account.</p>}
    </div>
  );
}

/** Draft / Confirmed switch. */
export function StatusPicker({ status, onChange }) {
  return (
    <div className="space-y-2" data-testid="status-picker">
      <Label className="flex items-center justify-between text-xs font-medium text-slate-600">
        Status
        <span className="text-[11px] font-normal text-slate-400" dir="rtl">
          الحالة
        </span>
      </Label>
      <div className="flex gap-2">
        <Choice on={status === "DRAFT"} onClick={() => onChange("DRAFT")} icon={FileClock} label="Draft" labelAr="مسودة" testId="status-draft" />
        <Choice on={status === "CONFIRMED"} onClick={() => onChange("CONFIRMED")} icon={CheckCircle2} label="Confirmed" labelAr="مؤكدة" testId="status-confirmed" />
      </div>
      <p className="text-[11px] text-slate-500">
        {status === "DRAFT"
          ? "Saved only — no payment is recorded and nothing is posted to the ledger. Confirm it later."
          : "The payment is received now and posted to the cash / bank ledger."}
      </p>
    </div>
  );
}
