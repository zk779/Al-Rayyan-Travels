import { format } from "date-fns";
import { SaudiRiyal } from "lucide-react";
import { companyData, money } from "./vatFormat";

/** Riyal icon + formatted amount. */
export function SarAmount({ value, className = "", size = 14 }) {
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${className}`}>
      <SaudiRiyal size={size} className="opacity-60 shrink-0" />
      {money(value)}
    </span>
  );
}

/** Print-only letterhead (hidden on screen). */
export function PrintLetterhead({ title, periodLabel }) {
  return (
    <div className="hidden print:block mb-4 border-b-2 border-gray-900 pb-4">
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900 uppercase tracking-wide">{companyData.name}</div>
          <div className="text-base font-bold text-gray-900 mb-2" dir="rtl">
            {companyData.nameArabic}
          </div>
          <div className="text-[11px] text-gray-600 space-y-0.5">
            <p>{companyData.address}</p>
            <p dir="rtl">{companyData.addressArabic}</p>
            <p>
              {companyData.phone} | {companyData.email}
            </p>
            <p>
              TRN/الرقم الضريبي: {companyData.trn} / {companyData.trnArabic}
            </p>
            <p>
              CR Number/رقم السجل التجاري: {companyData.crNumber} / {companyData.crNumberArabic}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-gray-800 text-white px-4 py-2 rounded font-bold text-lg mb-1 uppercase">{title}</div>
          <div className="text-xs text-gray-600">Period: {periodLabel}</div>
          <div className="text-xs text-gray-600">Generated: {format(new Date(), "dd MMM yyyy, HH:mm")}</div>
        </div>
      </div>
    </div>
  );
}
