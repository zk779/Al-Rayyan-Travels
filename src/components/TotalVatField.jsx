"use client";

import { Calculator, SaudiRiyal } from "lucide-react";
import { Label } from "../../shadcn/components/ui/label";

const n2 = (v) => Number(v) || 0;
const fmt = (v) => n2(v).toFixed(2);

/**
 * "Total VAT 15%" of a sale row = PAX VAT + the vendor's VAT on its service charges + our own VAT 15%
 * (each one only when it exists). Display only: the three amounts are still calculated and saved exactly
 * as before; this just adds them up.
 */
export default function TotalVatField({ item }) {
  const parts = [
    { key: "pax", label: "PAX", value: n2(item.paxVat) },
    { key: "vendor", label: "Vendor", value: n2(item.vendorVat) },
    { key: "ours", label: "Ours", value: n2(item.vatAmount) },
  ].filter((p) => p.value > 0);
  const total = parts.reduce((a, p) => a + p.value, 0);

  return (
    <div className="space-y-1" data-testid="total-vat">
      <Label className="text-xs font-medium text-blue-700">
        Total VAT 15% <SaudiRiyal size={15} />
      </Label>
      <div className="flex h-8 items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 text-xs font-semibold text-blue-700">
        <Calculator className="h-3 w-3" />
        <span data-testid="total-vat-value">{fmt(total)}</span>
      </div>
      {/* what the total is made of, numbers only: 59.03 + 0.75 + 6.86 */}
      {parts.length > 1 && (
        <p className="text-[10px] leading-tight text-slate-500" data-testid="total-vat-sum">
          {parts.map((p) => fmt(p.value)).join(" + ")}
        </p>
      )}
    </div>
  );
}
