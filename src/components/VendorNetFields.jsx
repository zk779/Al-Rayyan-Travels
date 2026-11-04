"use client";

import { SaudiRiyal } from "lucide-react";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { vendorVatOf } from "./vendorCharges";

const num = (v) => Number(v) || 0;

/**
 * The two inputs that replace the single Net input: "Net" (the net amount) and "Vendor charges"
 * (the vendor's service charges), with the VAT on them and the resulting net total underneath.
 * `size` matches the form it sits in: "sm" (h-8) or "md" (h-9, rounded).
 */
export default function VendorNetFields({ item, onChange, size = "sm", netInvalid = false, netRequired = false }) {
  const inputCls =
    size === "md" ? "h-9 rounded-[10px] text-sm" : "h-8 text-sm";
  const labelCls = size === "md" ? "flex items-center gap-1 text-xs font-medium text-slate-600" : "text-xs font-medium text-slate-600";
  const charges = num(item.vendorServiceCharge);

  return (
    <>
      <div className="space-y-1">
        <Label className={labelCls}>
          Basic Fare {netRequired && <span className="text-rose-500">*</span>} <SaudiRiyal size={size === "md" ? 13 : 15} />
        </Label>
        <Input
          type="tel"
          value={item.baseNet ?? ""}
          onChange={(e) => onChange("baseNet", e.target.value)}
          placeholder="0.00"
          className={`${inputCls} ${netInvalid ? "border-red-300 focus-visible:ring-red-400" : ""}`}
        />
      </div>
      <div className="space-y-1">
        <Label className={labelCls}>
          Vendor charges <SaudiRiyal size={size === "md" ? 13 : 15} />
        </Label>
        <Input
          type="tel"
          value={item.vendorServiceCharge ?? ""}
          onChange={(e) => onChange("vendorServiceCharge", e.target.value)}
          placeholder="0.00"
          className={inputCls}
        />
        {charges > 0 && (
          <p className="text-[10px] leading-tight text-slate-500" data-testid="vendor-net-total">
            + VAT {vendorVatOf(charges).toFixed(2)} · Net total {num(item.netPrice).toFixed(2)}
          </p>
        )}
      </div>
    </>
  );
}
