"use client";

import { SaudiRiyal } from "lucide-react";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { vendorVatOf } from "./vendorCharges";

const num = (v) => Number(v) || 0;

/**
 * The two inputs that replace the single Net input: "Net" (the net amount) and "Vendor charges"
 * (the vendor's service charges), with the VAT on them and the resulting net total underneath.
 * `size` matches the form it sits in: "sm" (h-8) or "md" (h-9, rounded). `netBelowFare` (hotel / insurance)
 * shows the net amount in a box right under the basic fare instead of in the note under the vendor charges.
 * `fareWithVat` shows "Net amount" under the basic fare: the row's net price, i.e. the "Net Total" of the summary
 * (basic fare + PAX VAT on a domestic route + vendor charges + the VAT on them − the discount).
 */
export default function VendorNetFields({ item, onChange, size = "sm", netInvalid = false, netRequired = false, netBelowFare = false, fareWithVat = false, children = null }) {
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
        {fareWithVat && num(item.baseNet) > 0 && (() => {
          const chargesVat = vendorVatOf(charges);
          const total = num(item.netPrice);
          const discount = num(item.discount);
          return (
            <div
              className="space-y-0.5 rounded-md bg-teal-50 px-2 py-1 text-[11px] text-teal-800 ring-1 ring-teal-100"
              data-testid="fare-net-amount"
              title={[`${num(item.baseNet).toFixed(2)}${num(item.paxVat) > 0 ? ` + D. Vat ${num(item.paxVat).toFixed(2)}` : ""}`, charges > 0 ? `+ charges ${charges.toFixed(2)} + VAT ${chargesVat.toFixed(2)}` : "", discount > 0 ? `- discount ${discount.toFixed(2)}` : ""].filter(Boolean).join(" ")}
            >
              {discount > 0 && (
                <p className="flex items-center justify-between gap-2 text-teal-700/80" data-testid="fare-discount">
                  <span>Discount</span>
                  <span className="tabular-nums">-{discount.toFixed(2)}</span>
                </p>
              )}
              <p className={`flex items-center justify-between gap-2 ${discount > 0 ? "border-t border-teal-100 pt-0.5" : ""}`}>
                <span>Net amount</span>
                <span className="font-semibold tabular-nums" data-testid="fare-net-amount-value">{total.toFixed(2)}</span>
              </p>
            </div>
          );
        })()}
        {netBelowFare && num(item.netPrice) > 0 && (
          <p
            className="flex items-center justify-between gap-2 rounded-md bg-teal-50 px-2 py-1 text-[11px] text-teal-800 ring-1 ring-teal-100"
            data-testid="net-amount"
          >
            <span>Net amount</span>
            <span className="font-semibold tabular-nums">{num(item.netPrice).toFixed(2)}</span>
          </p>
        )}
      </div>
      {/* PAX VAT goes right after the basic fare */}
      {children}
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
        {netBelowFare || fareWithVat
          ? charges > 0 && (
              <p className="text-[10px] leading-tight text-slate-500" data-testid="vendor-vat-note">
                + VAT {vendorVatOf(charges).toFixed(2)}
              </p>
            )
          : (charges > 0 || num(item.discount) > 0) && (
              <p className="text-[10px] leading-tight text-slate-500" data-testid="vendor-net-total">
                {charges > 0 ? `+ VAT ${vendorVatOf(charges).toFixed(2)} · ` : ""}Net total {num(item.netPrice).toFixed(2)}
              </p>
            )}
      </div>
    </>
  );
}
