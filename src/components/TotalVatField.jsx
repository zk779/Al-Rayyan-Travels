"use client";

import { Calculator, SaudiRiyal } from "lucide-react";
import { Label } from "../../shadcn/components/ui/label";
import { isDomestic, vat15 } from "./vendorCharges";

const n2 = (v) => Number(v) || 0;
const fmt = (v) => n2(v).toFixed(2);

/**
 * "Total VAT 15%" of a sale row = the 15% VAT on the basic fare (the PAX VAT on a domestic route, the same 15% on
 * every other route) + the vendor's VAT on its service charges + our own VAT 15% (each one only when it exists). Display only: the three amounts are still calculated and saved exactly
 * as before; this just adds them up.
 */
export default function TotalVatField({ item, size = "sm" }) {
  const parts = [
    // domestic: the stored PAX VAT (D. Vat); any other route: the same 15% worked out from the basic fare
    { key: "pax", label: "PAX", value: isDomestic(item.routeType) ? n2(item.paxVat) : n2(item.baseNet) > 0 ? vat15(item.baseNet) : 0 },
    { key: "vendor", label: "Vendor", value: n2(item.vendorVat) },
    { key: "ours", label: "Ours", value: n2(item.vatAmount) },
  ].filter((p) => p.value > 0);
  const total = parts.reduce((a, p) => a + p.value, 0);

  return (
    <div className="space-y-1" data-testid="total-vat">
      <Label className="text-xs font-medium text-blue-700">
        Total VAT 15% <SaudiRiyal size={15} />
      </Label>
      <div className={`flex items-center gap-1 border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 ${size === "md" ? "h-9 rounded-[10px] px-2.5" : "h-8 rounded px-2"}`}>
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
