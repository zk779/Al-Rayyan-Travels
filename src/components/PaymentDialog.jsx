"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Banknote,
  Building2,
  SplitSquareHorizontal,
  Check,
  SaudiRiyal,
} from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Badge } from "../../shadcn/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../shadcn/components/ui/dialog";
import Select from "react-select";

/* ─── Constants ─────────────────────────────────────────── */
const METHODS = [
  { value: "CASH", label: "Cash", icon: Banknote, color: "emerald" },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Building2,
    color: "blue",
  },
  { value: "CREDIT", label: "Credit", icon: CreditCard, color: "violet" },
  {
    value: "PARTIAL",
    label: "Partial / Split",
    icon: SplitSquareHorizontal,
    color: "amber",
  },
];

const PARTIAL_COMBOS = [
  {
    value: "CASH+BANK_TRANSFER",
    label: "Cash + Bank Transfer",
    a: "CASH",
    b: "BANK_TRANSFER",
  },
  { value: "CASH+CREDIT", label: "Cash + Credit", a: "CASH", b: "CREDIT" },
  {
    value: "BANK_TRANSFER+CREDIT",
    label: "Bank Transfer + Credit",
    a: "BANK_TRANSFER",
    b: "CREDIT",
  },
];

const colorMap = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    text: "text-emerald-700",
    ring: "ring-emerald-400",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-700",
    ring: "ring-blue-400",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-400",
    text: "text-violet-700",
    ring: "ring-violet-400",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-700",
    ring: "ring-amber-400",
  },
};

const METHOD_META = Object.fromEntries(METHODS.map((m) => [m.value, m]));

/* ─── Tabby / Tamara fee calculation ─────────────────────
   Fee            = 6.99% of Order Amount
   Deducted       = Fee + 1.5 SAR
   VAT            = 15% of Deducted
   Total Deduction = Deducted + VAT
   Net Amount     = Order Amount - Total Deduction
   e.g. Order 1000 -> Fee 69.9 -> Deducted 71.4 -> VAT 10.71
        -> Total Deduction 82.11 -> Net Amount 917.89
--------------------------------------------------------- */
const TABBY_FEE_RATE = 0.0699;
const TABBY_FIXED_FEE = 1.5;
const TABBY_VAT_RATE = 0.15;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function calculateTabbyNetAmount(orderAmount) {
  const order = Number(orderAmount) || 0;
  const fee = order * TABBY_FEE_RATE;
  const deducted = fee + TABBY_FIXED_FEE;
  const vat = deducted * TABBY_VAT_RATE;
  const totalDeduction = deducted + vat;
  const amount = order - totalDeduction;
  return {
    fee: round2(fee),
    deducted: round2(deducted),
    vat: round2(vat),
    totalDeduction: round2(totalDeduction),
    amount: round2(amount),
  };
}

// Looks up the customerType of a selected customer from the options list.
// IMPORTANT: customerOptions items must include a `customerType` field, e.g.
// { value: customer.id, label: customer.customerName, customerType: customer.customerType }
const getCustomerType = (id, customerOptions) =>
  customerOptions?.find((o) => o.value === id)?.customerType;

const compact = {
  control: (b) => ({
    ...b,
    minHeight: 32,
    height: 32,
    fontSize: "13px",
    boxShadow: "none",
  }),
  valueContainer: (b) => ({ ...b, height: 32, padding: "0 6px" }),
  input: (b) => ({ ...b, margin: 0, padding: 0 }),
  indicatorsContainer: (b) => ({ ...b, height: 32 }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
};

export function paymentDisplayLabel(paymentMeta) {
  if (!paymentMeta) return "Select";
  if (paymentMeta.type === "PARTIAL") {
    const combo = PARTIAL_COMBOS.find((c) => c.value === paymentMeta.combo);
    return combo ? `Split: ${combo.label}` : "Split Payment";
  }
  return METHOD_META[paymentMeta.type]?.label ?? paymentMeta.type;
}

const emptyPartial = (combo = "") => ({
  combo,
  aAmount: "",
  bAmount: "",
  aCustomerId: "",
  bCustomerId: "",
  aBankId: "",
  bBankId: "",
  aOrderAmount: "",
  bOrderAmount: "",
});

/* ─── Single payment slot ────────────────────────────────── */
function SlotFields({
  methodValue,
  amount,
  setAmount,
  customerId,
  setCustomerId,
  bankId,
  setBankId,
  orderAmount,
  setOrderAmount,
  customerOptions,
  bankOptions,
}) {
  const slotColor =
    {
      CASH: "bg-emerald-50 border-emerald-200",
      BANK_TRANSFER: "bg-blue-50 border-blue-200",
      CREDIT: "bg-violet-50 border-violet-200",
    }[methodValue] ?? "bg-slate-50 border-slate-200";

  // Only the CREDIT slot has a customer selector, so this is the only
  // place we need to detect a Tabby/Tamara customer.
  const selectedCustomerType =
    methodValue === "CREDIT"
      ? getCustomerType(customerId, customerOptions)
      : null;
  const isTabbyOrTamara = selectedCustomerType === "TABBY_OR_TAMARA";

  const tabbyCalc = useMemo(() => {
    if (!isTabbyOrTamara || !orderAmount) return null;
    return calculateTabbyNetAmount(orderAmount);
  }, [isTabbyOrTamara, orderAmount]);

  // Auto-fill Amount whenever the Order Amount (or the fee calc) changes.
  useEffect(() => {
    if (isTabbyOrTamara && tabbyCalc) {
      setAmount(String(tabbyCalc.amount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabbyOrTamara, tabbyCalc]);

  return (
    <div className={`space-y-2 p-3 rounded-lg border ${slotColor}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {METHOD_META[methodValue]?.label}
      </p>

      {/* Customer selector now sits at the TOP of the slot, above Amount */}
      {methodValue === "CREDIT" && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">
            Customer *
          </Label>
          <Select
            options={customerOptions}
            value={customerOptions?.find((o) => o.value === customerId) || null}
            onChange={(o) => setCustomerId(o?.value || "")}
            placeholder="Select customer"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuShouldBlockScroll={false}
            closeMenuOnScroll={false}
            styles={{
              ...compact,
              menuPortal: (base) => ({
                ...base,
                zIndex: 999999,
              }),
              menu: (base) => ({
                ...base,
                zIndex: 999999,
                pointerEvents: "auto",
              }),
            }}
          />
        </div>
      )}

      {/* Order Amount — appears as soon as a Tabby/Tamara customer is picked */}
      {methodValue === "CREDIT" && isTabbyOrTamara && (
        <div className="space-y-2 p-3 rounded-lg border bg-fuchsia-50 border-fuchsia-200">
          <p className="text-xs font-semibold text-fuchsia-700 uppercase tracking-wide">
            Tabby / Tamara — Order Amount
          </p>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-600">
              Order Amount <SaudiRiyal size={11} className="inline" />
            </Label>
            <Input
              type="number"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              placeholder="e.g. 1000"
              className="h-8 text-sm bg-white"
              autoFocus
            />
          </div>

          {tabbyCalc && (
            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-fuchsia-200">
              <div className="flex justify-between">
                <span>Fee (6.99% + 1.5 SAR)</span>
                <span className="font-medium">
                  {tabbyCalc.deducted.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VAT (15% of fee)</span>
                <span className="font-medium">{tabbyCalc.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total deduction</span>
                <span className="font-medium">
                  {tabbyCalc.totalDeduction.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-fuchsia-700 pt-1 border-t border-fuchsia-200 mt-1">
                <span>Net Amount</span>
                <span>{tabbyCalc.amount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-medium text-slate-600">
          Amount <SaudiRiyal size={11} className="inline" />
          {isTabbyOrTamara && (
            <span className="ml-1 font-normal normal-case text-slate-400">
              (auto-calculated)
            </span>
          )}
        </Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className={`h-8 text-sm ${isTabbyOrTamara ? "bg-slate-100 cursor-not-allowed text-slate-500" : ""}`}
          readOnly={isTabbyOrTamara}
          disabled={isTabbyOrTamara}
        />
      </div>

      {methodValue === "BANK_TRANSFER" && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">
            Bank Account *
          </Label>
          <Select
            options={bankOptions}
            value={bankOptions?.find((o) => o.value === bankId) || null}
            onChange={(o) => setBankId(o?.value || "")}
            placeholder="Select bank"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuShouldBlockScroll={false}
            closeMenuOnScroll={false}
            styles={{
              ...compact,
              menuPortal: (base) => ({
                ...base,
                zIndex: 999999,
              }),
              menu: (base) => ({
                ...base,
                zIndex: 999999,
                pointerEvents: "auto",
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function PaymentDialog({
  sale,
  sellPrice,
  customerOptions = [],
  bankOptions = [],
  onConfirm,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("");
  const [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [bankId, setBankId] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [partial, setPartial] = useState(emptyPartial());

  const sell = Number(sellPrice) || 0;

  console.log(customerOptions);

  /* Restore state from sale when dialog re-opens */
  useEffect(() => {
    if (!open) return;
    const meta = sale.paymentMeta;
    if (!meta) {
      setMode("");
      setAmount("");
      setCustomerId("");
      setBankId("");
      setOrderAmount("");
      setPartial(emptyPartial());
      return;
    }
    setMode(meta.type);
    if (meta.type !== "PARTIAL") {
      setAmount(sale.paidAmount || "");
      setCustomerId(sale.customerId || "");
      setBankId(meta.bankId || "");
      setOrderAmount(meta.orderAmount || "");
      setPartial(emptyPartial());
    } else {
      setOrderAmount("");
      setPartial({
        combo: meta.combo ?? "",
        aAmount: meta.aAmount ?? "",
        bAmount: meta.bAmount ?? "",
        aCustomerId: meta.aCustomerId ?? "",
        bCustomerId: meta.bCustomerId ?? "",
        aBankId: meta.aBankId ?? "",
        bBankId: meta.bBankId ?? "",
        aOrderAmount: meta.aOrderAmount ?? "",
        bOrderAmount: meta.bOrderAmount ?? "",
      });
    }
  }, [open]);

  const selectedCombo = PARTIAL_COMBOS.find((c) => c.value === partial.combo);
  const partialTotal =
    (Number(partial.aAmount) || 0) + (Number(partial.bAmount) || 0);
  const partialRemaining = sell - partialTotal;

  // Tabby/Tamara detection — non-partial CREDIT slot
  const isTabbyOrTamara =
    mode === "CREDIT" &&
    getCustomerType(customerId, customerOptions) === "TABBY_OR_TAMARA";

  // Tabby/Tamara detection — per leg, for Partial combos that include CREDIT
  const aIsTabbyOrTamara =
    selectedCombo?.a === "CREDIT" &&
    getCustomerType(partial.aCustomerId, customerOptions) === "TABBY_OR_TAMARA";
  const bIsTabbyOrTamara =
    selectedCombo?.b === "CREDIT" &&
    getCustomerType(partial.bCustomerId, customerOptions) === "TABBY_OR_TAMARA";

  const isValid = () => {
    if (!mode) return false;
    if (mode === "CREDIT" && !customerId) return false;
    if (mode === "CREDIT" && isTabbyOrTamara) {
      if (!orderAmount || Number(orderAmount) <= 0) return false;
    }
    if (mode === "BANK_TRANSFER" && !bankId) return false;
    if (mode === "PARTIAL") {
      if (!partial.combo || !partial.aAmount || !partial.bAmount) return false;
      if (selectedCombo?.a === "CREDIT" && !partial.aCustomerId) return false;
      if (selectedCombo?.b === "CREDIT" && !partial.bCustomerId) return false;
      if (selectedCombo?.a === "BANK_TRANSFER" && !partial.aBankId)
        return false;
      if (selectedCombo?.b === "BANK_TRANSFER" && !partial.bBankId)
        return false;
      if (
        aIsTabbyOrTamara &&
        (!partial.aOrderAmount || Number(partial.aOrderAmount) <= 0)
      )
        return false;
      if (
        bIsTabbyOrTamara &&
        (!partial.bOrderAmount || Number(partial.bOrderAmount) <= 0)
      )
        return false;
    }
    return true;
  };

  const handleConfirm = () => {
    let result;

    if (mode !== "PARTIAL") {
      result = {
        paymentType: mode,
        paymentMeta: {
          type: mode,
          bankId: bankId || null,
          ...(isTabbyOrTamara
            ? {
                orderAmount,
                feeBreakdown: calculateTabbyNetAmount(orderAmount),
              }
            : {}),
        },
        // top-level fields the sales payload mapper reads directly
        bankId: mode === "BANK_TRANSFER" ? bankId : null,
        customerId: mode === "CREDIT" ? customerId : "",
        paidAmount: amount || String(sell),
        paymentLegs: null,
        paxName: "",
      };
    } else {
      result = {
        paymentType: "PARTIAL",
        paymentMeta: {
          type: "PARTIAL",
          combo: partial.combo,
          aMethod: selectedCombo.a,
          bMethod: selectedCombo.b,
          aAmount: partial.aAmount,
          bAmount: partial.bAmount,
          aCustomerId: partial.aCustomerId || null,
          bCustomerId: partial.bCustomerId || null,
          aBankId: partial.aBankId || null,
          bBankId: partial.bBankId || null,
          ...(aIsTabbyOrTamara
            ? {
                aOrderAmount: partial.aOrderAmount,
                aFeeBreakdown: calculateTabbyNetAmount(partial.aOrderAmount),
              }
            : {}),
          ...(bIsTabbyOrTamara
            ? {
                bOrderAmount: partial.bOrderAmount,
                bFeeBreakdown: calculateTabbyNetAmount(partial.bOrderAmount),
              }
            : {}),
        },
        // paymentLegs — exactly what the backend iterates over
        paymentLegs: [
          {
            method: selectedCombo.a,
            amount: Number(partial.aAmount),
            bankId:
              selectedCombo.a === "BANK_TRANSFER" ? partial.aBankId : null,
            customerId:
              selectedCombo.a === "CREDIT" ? partial.aCustomerId : null,
          },
          {
            method: selectedCombo.b,
            amount: Number(partial.bAmount),
            bankId:
              selectedCombo.b === "BANK_TRANSFER" ? partial.bBankId : null,
            customerId:
              selectedCombo.b === "CREDIT" ? partial.bCustomerId : null,
          },
        ],
        bankId: partial.aBankId || partial.bBankId || null,
        customerId: partial.aCustomerId || partial.bCustomerId || "",
        paidAmount: String(partialTotal),
        paxName: "",
      };
    }

    onConfirm(result);
    setOpen(false);
  };

  const selectedMethod = METHOD_META[mode];
  const triggerColors = selectedMethod ? colorMap[selectedMethod.color] : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`h-8 w-full text-xs font-medium rounded border px-2 flex items-center gap-1.5 transition-all
          ${
            triggerColors
              ? `${triggerColors.bg} ${triggerColors.border} ${triggerColors.text}`
              : "bg-white border-gray-300 text-gray-400 hover:border-gray-400"
          }`}
      >
        {selectedMethod ? (
          <>
            <selectedMethod.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {paymentDisplayLabel(sale.paymentMeta)}
            </span>
          </>
        ) : (
          <span>Select Payment</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> Payment Method
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => {
              const c = colorMap[m.color];
              const active = mode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => {
                    setMode(m.value);
                    setAmount("");
                    setCustomerId("");
                    setBankId("");
                    setOrderAmount("");
                    setPartial(emptyPartial());
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all
                    ${active ? `${c.bg} ${c.border} ${c.text} ring-2 ${c.ring} ring-offset-1` : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                  {active && <Check className="h-3.5 w-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>

          {mode === "CASH" && (
            <SlotFields
              methodValue="CASH"
              amount={amount}
              setAmount={setAmount}
            />
          )}

          {mode === "BANK_TRANSFER" && (
            <SlotFields
              methodValue="BANK_TRANSFER"
              amount={amount}
              setAmount={setAmount}
              bankId={bankId}
              setBankId={setBankId}
              bankOptions={bankOptions}
            />
          )}

          {mode === "CREDIT" && (
            <SlotFields
              methodValue="CREDIT"
              amount={amount}
              setAmount={setAmount}
              customerId={customerId}
              setCustomerId={(id) => {
                setCustomerId(id);
                setOrderAmount(""); // fresh order amount whenever the customer changes
              }}
              customerOptions={customerOptions}
              orderAmount={orderAmount}
              setOrderAmount={setOrderAmount}
            />
          )}

          {mode === "PARTIAL" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">
                  Choose Split Type
                </Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PARTIAL_COMBOS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setPartial(emptyPartial(c.value))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left
                        ${partial.combo === c.value ? "bg-amber-50 border-amber-400 text-amber-700 ring-1 ring-amber-400" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {partial.combo === c.value ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-gray-300 shrink-0" />
                      )}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCombo && (
                <div className="grid grid-cols-2 gap-3">
                  <SlotFields
                    methodValue={selectedCombo.a}
                    amount={partial.aAmount}
                    setAmount={(v) => setPartial((p) => ({ ...p, aAmount: v }))}
                    customerId={partial.aCustomerId}
                    setCustomerId={(v) =>
                      setPartial((p) => ({
                        ...p,
                        aCustomerId: v,
                        aOrderAmount: "",
                      }))
                    }
                    bankId={partial.aBankId}
                    setBankId={(v) => setPartial((p) => ({ ...p, aBankId: v }))}
                    orderAmount={partial.aOrderAmount}
                    setOrderAmount={(v) =>
                      setPartial((p) => ({ ...p, aOrderAmount: v }))
                    }
                    customerOptions={customerOptions}
                    bankOptions={bankOptions}
                  />
                  <SlotFields
                    methodValue={selectedCombo.b}
                    amount={partial.bAmount}
                    setAmount={(v) => setPartial((p) => ({ ...p, bAmount: v }))}
                    customerId={partial.bCustomerId}
                    setCustomerId={(v) =>
                      setPartial((p) => ({
                        ...p,
                        bCustomerId: v,
                        bOrderAmount: "",
                      }))
                    }
                    bankId={partial.bBankId}
                    setBankId={(v) => setPartial((p) => ({ ...p, bBankId: v }))}
                    orderAmount={partial.bOrderAmount}
                    setOrderAmount={(v) =>
                      setPartial((p) => ({ ...p, bOrderAmount: v }))
                    }
                    customerOptions={customerOptions}
                    bankOptions={bankOptions}
                  />
                </div>
              )}

              {selectedCombo && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">
                    Total entered
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-semibold">
                      <SaudiRiyal size={10} className="inline mr-0.5" />
                      {partialTotal.toFixed(2)}
                    </span>
                    <Badge
                      className={`text-xs ${Math.abs(partialRemaining) < 0.01 ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"}`}
                    >
                      {Math.abs(partialRemaining) < 0.01
                        ? "✓ Balanced"
                        : `Remaining: ${partialRemaining.toFixed(2)}`}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode && (
            <Button
              onClick={handleConfirm}
              disabled={!isValid()}
              className="w-full bg-gradient-primary text-white mt-1"
            >
              Confirm Payment
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}