"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CreditCard,
  Banknote,
  Building2,
  Terminal,
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
// METHOD_META covers every real paymentType plus the "BANK_ACCOUNT"
// category (a UI-only grouping over BANK_TRANSFER / POS — never itself
// submitted as a paymentType).
const METHOD_META = {
  CASH: { value: "CASH", label: "Cash", icon: Banknote, color: "emerald" },
  BANK_ACCOUNT: {
    value: "BANK_ACCOUNT",
    label: "Bank Account",
    icon: Building2,
    color: "blue",
  },
  BANK_TRANSFER: {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Building2,
    color: "blue",
  },
  POS: {
    value: "POS",
    label: "POS Machine",
    icon: Terminal,
    color: "cyan",
  },
  CREDIT: { value: "CREDIT", label: "Credit", icon: CreditCard, color: "violet" },
  PARTIAL: {
    value: "PARTIAL",
    label: "Partial / Split",
    icon: SplitSquareHorizontal,
    color: "amber",
  },
};

const METHODS = [
  METHOD_META.CASH,
  METHOD_META.BANK_ACCOUNT,
  METHOD_META.CREDIT,
  METHOD_META.PARTIAL,
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
  cyan: {
    bg: "bg-cyan-50",
    border: "border-cyan-400",
    text: "text-cyan-700",
    ring: "ring-cyan-400",
  },
};

/* ─── Tabby / Tamara fee calculation ─────────────────────
   Fee            = 6.99% of Order Amount
   Deducted       = Fee + 1.5 SAR
   VAT            = 15% of Deducted
   Total Deduction = Deducted + VAT
   Net Amount     = Order Amount - Total Deduction
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

// Inverse of calculateTabbyNetAmount — reconstructs Order Amount from a known
// Net Amount, for re-opening a saved payment without a stored orderAmount.
const TABBY_ORDER_MULTIPLIER = 1 - TABBY_FEE_RATE * (1 + TABBY_VAT_RATE);
const TABBY_ORDER_CONSTANT = TABBY_FIXED_FEE * (1 + TABBY_VAT_RATE);

function reverseTabbyOrderAmount(netAmount) {
  const net = Number(netAmount) || 0;
  const orderAmount = (net + TABBY_ORDER_CONSTANT) / TABBY_ORDER_MULTIPLIER;
  return round2(orderAmount);
}

/* ─── POS commission calculation ─────────────────────────
   Fee (commission) = commissionRate% of Order Amount
   Net Amount        = Order Amount - Fee
--------------------------------------------------------- */
function calculatePosNetAmount(orderAmount, commissionRate) {
  const order = Number(orderAmount) || 0;
  const rate = Number(commissionRate) || 0;
  const fee = round2(order * (rate / 100));
  const amount = round2(order - fee);
  return { fee, amount };
}

// Inverse — reconstructs Order Amount from a known Net Amount + commission
// rate, for re-opening a saved POS payment without a stored orderAmount.
function reversePosOrderAmount(netAmount, commissionRate) {
  const net = Number(netAmount) || 0;
  const rate = Number(commissionRate) || 0;
  if (rate >= 100) return net;
  return round2(net / (1 - rate / 100));
}

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
  menuPortal: (b) => ({ ...b, zIndex: 999999 }),
  menu: (b) => ({ ...b, zIndex: 999999, pointerEvents: "auto" }),
};

/* ─── Public helper ──────────────────────────────────────── */
export function paymentDisplayLabel(paymentMeta, paymentType) {
  if (paymentMeta?.type === "PARTIAL") {
    const combo = PARTIAL_COMBOS.find((c) => c.value === paymentMeta.combo);
    return combo ? `Split: ${combo.label}` : "Split Payment";
  }
  if (paymentMeta?.type)
    return METHOD_META[paymentMeta.type]?.label ?? paymentMeta.type;
  if (paymentType)
    return METHOD_META[String(paymentType).toUpperCase()]?.label ?? paymentType;
  return "Select";
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

/* ─── Resolves initial state from sale prop ─────────────────
   Runs eagerly (useState initialiser) so the trigger button
   gets the correct colour/label on first paint without needing
   the dialog to open first.
────────────────────────────────────────────────────────────── */
function resolveState(sale, sell) {
  const pt = String(sale.paymentType || "").toUpperCase();
  const meta = sale.paymentMeta;

  if (meta?.type) {
    if (meta.type !== "PARTIAL") {
      return {
        mode: meta.type,
        amount: String(sale.paidAmount ?? sell),
        customerId: sale.customerId || "",
        bankId: meta.bankId || sale.bankId || "",
        orderAmount: meta.orderAmount ?? "",
        posId: meta.posId || sale.posId || "",
        posCardType: meta.posCardType || sale.posCardType || "",
        posCommissionRate: meta.posCommissionRate ?? sale.posCommissionRate ?? null,
        posOrderAmount: meta.posOrderAmount ?? "",
        partial: emptyPartial(),
      };
    }
    return {
      mode: "PARTIAL",
      amount: "",
      customerId: "",
      bankId: "",
      orderAmount: "",
      posId: "",
      posCardType: "",
      posCommissionRate: null,
      posOrderAmount: "",
      partial: {
        combo: meta.combo ?? "",
        aAmount: String(meta.aAmount ?? ""),
        bAmount: String(meta.bAmount ?? ""),
        aCustomerId: meta.aCustomerId ?? "",
        bCustomerId: meta.bCustomerId ?? "",
        aBankId: meta.aBankId ?? "",
        bBankId: meta.bBankId ?? "",
        aOrderAmount: meta.aOrderAmount ?? "",
        bOrderAmount: meta.bOrderAmount ?? "",
      },
    };
  }

  if (
    pt === "PARTIAL" &&
    Array.isArray(sale.payments) &&
    sale.payments.length >= 2
  ) {
    const legA = sale.payments[0];
    const legB = sale.payments[1];
    const mA = String(legA?.method || "").toUpperCase();
    const mB = String(legB?.method || "").toUpperCase();
    const found = PARTIAL_COMBOS.find((c) => c.value === `${mA}+${mB}`);
    return {
      mode: "PARTIAL",
      amount: "",
      customerId: "",
      bankId: "",
      orderAmount: "",
      posId: "",
      posCardType: "",
      posCommissionRate: null,
      posOrderAmount: "",
      partial: {
        combo: found?.value ?? "",
        aAmount: String(legA?.amount ?? ""),
        bAmount: String(legB?.amount ?? ""),
        aCustomerId: legA?.customer?.id ?? legA?.customerId ?? "",
        bCustomerId: legB?.customer?.id ?? legB?.customerId ?? "",
        aBankId: legA?.bank?.id ?? legA?.bankId ?? "",
        bBankId: legB?.bank?.id ?? legB?.bankId ?? "",
        aOrderAmount: "",
        bOrderAmount: "",
      },
    };
  }

  // No paymentMeta from this session — fall back to whatever the server
  // resolved on this sale (paymentSummary for POS/bank details, plus the
  // raw persisted posCardType/posCommissionRate snapshot fields).
  const ps = sale.paymentSummary;

  return {
    mode: pt,
    amount: String(sale.paidAmount ?? sell),
    customerId: sale.customer?.id ?? sale.customerId ?? "",
    bankId: sale.bank?.id ?? sale.bankId ?? "",
    orderAmount: "",
    posId: sale.pos?.id ?? sale.posId ?? ps?.posId ?? "",
    posCardType: sale.posCardType ?? ps?.cardType ?? "",
    posCommissionRate: sale.posCommissionRate ?? ps?.commissionRate ?? null,
    posOrderAmount: "",
    partial: emptyPartial(),
  };
}

/* ─── Reusable slot fields (CASH / BANK_TRANSFER / CREDIT) ──── */
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
  sellPrice,
}) {
  const slotColor =
    {
      CASH: "bg-emerald-50 border-emerald-200",
      BANK_TRANSFER: "bg-blue-50 border-blue-200",
      CREDIT: "bg-violet-50 border-violet-200",
    }[methodValue] ?? "bg-slate-50 border-slate-200";

  const selectedCustomerType =
    methodValue === "CREDIT"
      ? getCustomerType(customerId, customerOptions)
      : null;
  const isTabbyOrTamara = selectedCustomerType === "TABBY_OR_TAMARA";

  const tabbyCalc = useMemo(() => {
    if (!isTabbyOrTamara || !orderAmount) return null;
    return calculateTabbyNetAmount(orderAmount);
  }, [isTabbyOrTamara, orderAmount]);

  // Restores the Order Amount when re-opening a saved Tabby/Tamara payment.
  // paymentMeta (and its orderAmount) isn't persisted on the Sale model, so
  // on reload we always have to reconstruct it from whatever WAS saved:
  //  1. amount > 0 — a net amount was recorded as paidAmount; reverse the
  //     fee math on that.
  //  2. amount is 0 (the normal case for Tabby/Tamara, since paidAmount is
  //     deliberately zeroed out — see EditSalesTab) — sellPrice is where the
  //     net settlement amount actually lives for these sales, so reverse
  //     the fee math on THAT instead of displaying it as-is.
  const seededOrderAmount = useRef(false);
  useEffect(() => {
    if (isTabbyOrTamara && !orderAmount && !seededOrderAmount.current) {
      const paidNum = Number(amount);
      if (paidNum > 0) {
        seededOrderAmount.current = true;
        setOrderAmount(String(reverseTabbyOrderAmount(amount)));
      } else if (Number(sellPrice) > 0) {
        seededOrderAmount.current = true;
        setOrderAmount(String(reverseTabbyOrderAmount(sellPrice)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabbyOrTamara, orderAmount, amount, sellPrice]);

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
            styles={compact}
          />
        </div>
      )}

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
            styles={compact}
          />
        </div>
      )}
    </div>
  );
}

/* ─── POS payment slot: machine → card type → order amount ──── */
function PosFields({
  posId,
  setPosId,
  posCardType,
  setPosCardType,
  posCommissionRate,
  setPosCommissionRate,
  posOrderAmount,
  setPosOrderAmount,
  amount,
  setAmount,
  posOptions,
}) {
  const selectedPos = posOptions?.find((o) => o.value === posId) || null;
  const cardTypeOptions = (selectedPos?.commissionTypes || []).map((c) => ({
    value: c.cardType,
    label:
      c.commissionRate != null
        ? `${c.cardType} (${c.commissionRate}%)`
        : c.cardType,
    commissionRate: c.commissionRate,
  }));

  const posCalc = useMemo(() => {
    if (!posOrderAmount || posCommissionRate == null) return null;
    return calculatePosNetAmount(posOrderAmount, posCommissionRate);
  }, [posOrderAmount, posCommissionRate]);

  // Restores the Order Amount when re-opening a saved POS payment — the
  // Order Amount itself isn't persisted, only the resulting net amount
  // (paidAmount) plus the frozen commission rate, so reverse the math.
  const seededOrderAmount = useRef(false);
  useEffect(() => {
    if (
      posCardType &&
      posCommissionRate != null &&
      !posOrderAmount &&
      !seededOrderAmount.current
    ) {
      const paidNum = Number(amount);
      if (paidNum > 0) {
        seededOrderAmount.current = true;
        setPosOrderAmount(
          String(reversePosOrderAmount(amount, posCommissionRate)),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posCardType, posCommissionRate, posOrderAmount, amount]);

  useEffect(() => {
    if (posCalc) setAmount(String(posCalc.amount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posCalc]);

  return (
    <div className="space-y-2 p-3 rounded-lg border bg-cyan-50 border-cyan-200">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        POS Machine
      </p>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-slate-600">
          POS Machine *
        </Label>
        <Select
          options={posOptions}
          value={selectedPos}
          onChange={(o) => {
            setPosId(o?.value || "");
            setPosCardType("");
            setPosCommissionRate(null);
            setPosOrderAmount("");
            setAmount("");
          }}
          placeholder="Select POS machine"
          menuPortalTarget={document.body}
          menuPosition="fixed"
          menuShouldBlockScroll={false}
          closeMenuOnScroll={false}
          styles={compact}
        />
      </div>

      {selectedPos && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">
            Card Type *
          </Label>
          <Select
            options={cardTypeOptions}
            value={cardTypeOptions.find((o) => o.value === posCardType) || null}
            onChange={(o) => {
              setPosCardType(o?.value || "");
              setPosCommissionRate(o?.commissionRate ?? null);
              setPosOrderAmount("");
              setAmount("");
            }}
            placeholder="Select card type"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            menuShouldBlockScroll={false}
            closeMenuOnScroll={false}
            styles={compact}
          />
        </div>
      )}

      {posCardType && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-600">
            Order Amount <SaudiRiyal size={11} className="inline" />
          </Label>
          <Input
            type="number"
            value={posOrderAmount}
            onChange={(e) => setPosOrderAmount(e.target.value)}
            placeholder="e.g. 1000"
            className="h-8 text-sm bg-white"
            autoFocus
          />
        </div>
      )}

      {posCalc && (
        <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-cyan-200">
          <div className="flex justify-between">
            <span>Commission ({posCommissionRate}%)</span>
            <span className="font-medium">-{posCalc.fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-cyan-700 pt-1 border-t border-cyan-200 mt-1">
            <span>Sell Amount (after commission)</span>
            <span>{posCalc.amount.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-medium text-slate-600">
          Amount <SaudiRiyal size={11} className="inline" />
          <span className="ml-1 font-normal normal-case text-slate-400">
            (auto-calculated)
          </span>
        </Label>
        <Input
          type="number"
          value={amount}
          readOnly
          disabled
          placeholder="0.00"
          className="h-8 text-sm bg-slate-100 cursor-not-allowed text-slate-500"
        />
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function EditPaymentDialog({
  sale,
  sellPrice,
  customerOptions = [],
  bankOptions = [],
  posOptions = [],
  onConfirm,
}) {
  const sell = Number(sellPrice) || 0;

  const [s, setS] = useState(() => resolveState(sale, sell));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) setS(resolveState(sale, sell));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patch = (obj) => setS((prev) => ({ ...prev, ...obj }));

  const resetFields = () =>
    patch({
      amount: "",
      customerId: "",
      bankId: "",
      orderAmount: "",
      posId: "",
      posCardType: "",
      posCommissionRate: null,
      posOrderAmount: "",
      partial: emptyPartial(),
    });

  const selectedCombo = PARTIAL_COMBOS.find((c) => c.value === s.partial.combo);
  const partialTotal =
    (Number(s.partial.aAmount) || 0) + (Number(s.partial.bAmount) || 0);
  const partialRemaining = sell - partialTotal;

  // Actual cash-in-hand — excludes the CREDIT leg, since that portion is a
  // receivable (due), not money received.
  const partialPaidAmount =
    (selectedCombo?.a !== "CREDIT" ? Number(s.partial.aAmount) || 0 : 0) +
    (selectedCombo?.b !== "CREDIT" ? Number(s.partial.bAmount) || 0 : 0);

  const isTabbyOrTamara =
    s.mode === "CREDIT" &&
    getCustomerType(s.customerId, customerOptions) === "TABBY_OR_TAMARA";

  const aIsTabbyOrTamara =
    selectedCombo?.a === "CREDIT" &&
    getCustomerType(s.partial.aCustomerId, customerOptions) ===
      "TABBY_OR_TAMARA";
  const bIsTabbyOrTamara =
    selectedCombo?.b === "CREDIT" &&
    getCustomerType(s.partial.bCustomerId, customerOptions) ===
      "TABBY_OR_TAMARA";

  const isValid = () => {
    if (!s.mode) return false;
    if (s.mode === "BANK_ACCOUNT") return false; // category screen only
    if (s.mode === "CREDIT" && !s.customerId) return false;
    if (s.mode === "CREDIT" && isTabbyOrTamara) {
      if (!s.orderAmount || Number(s.orderAmount) <= 0) return false;
    }
    if (s.mode === "BANK_TRANSFER" && !s.bankId) return false;
    if (s.mode === "POS") {
      if (!s.posId || !s.posCardType) return false;
      if (!s.posOrderAmount || Number(s.posOrderAmount) <= 0) return false;
    }
    if (s.mode === "PARTIAL") {
      if (!s.partial.combo || !s.partial.aAmount || !s.partial.bAmount)
        return false;
      if (selectedCombo?.a === "CREDIT" && !s.partial.aCustomerId) return false;
      if (selectedCombo?.b === "CREDIT" && !s.partial.bCustomerId) return false;
      if (selectedCombo?.a === "BANK_TRANSFER" && !s.partial.aBankId)
        return false;
      if (selectedCombo?.b === "BANK_TRANSFER" && !s.partial.bBankId)
        return false;
      if (
        aIsTabbyOrTamara &&
        (!s.partial.aOrderAmount || Number(s.partial.aOrderAmount) <= 0)
      )
        return false;
      if (
        bIsTabbyOrTamara &&
        (!s.partial.bOrderAmount || Number(s.partial.bOrderAmount) <= 0)
      )
        return false;
    }
    return true;
  };

  const handleConfirm = () => {
    const result =
      s.mode !== "PARTIAL"
        ? {
            paymentType: s.mode,
            paymentMeta: {
              type: s.mode,
              bankId: s.bankId || null,
              posId: s.mode === "POS" ? s.posId || null : null,
              posCardType: s.mode === "POS" ? s.posCardType || null : null,
              posCommissionRate:
                s.mode === "POS" ? (s.posCommissionRate ?? null) : null,
              ...(s.mode === "POS" && s.posOrderAmount
                ? {
                    posOrderAmount: s.posOrderAmount,
                    posFeeBreakdown: calculatePosNetAmount(
                      s.posOrderAmount,
                      s.posCommissionRate,
                    ),
                  }
                : {}),
              ...(isTabbyOrTamara
                ? {
                    orderAmount: s.orderAmount,
                    feeBreakdown: calculateTabbyNetAmount(s.orderAmount),
                  }
                : {}),
            },
            customerId: s.mode === "CREDIT" ? s.customerId : "",
            bankId: s.mode === "BANK_TRANSFER" ? s.bankId : null,
            posId: s.mode === "POS" ? s.posId : null,
            posCardType: s.mode === "POS" ? s.posCardType : null,
            posCommissionRate: s.mode === "POS" ? s.posCommissionRate : null,
            paidAmount: s.amount || String(sell),
          }
        : {
            paymentType: "PARTIAL",
            paymentMeta: {
              type: "PARTIAL",
              combo: s.partial.combo,
              aMethod: selectedCombo.a,
              bMethod: selectedCombo.b,
              aAmount: s.partial.aAmount,
              bAmount: s.partial.bAmount,
              aCustomerId: s.partial.aCustomerId || null,
              bCustomerId: s.partial.bCustomerId || null,
              aBankId: s.partial.aBankId || null,
              bBankId: s.partial.bBankId || null,
              ...(aIsTabbyOrTamara
                ? {
                    aOrderAmount: s.partial.aOrderAmount,
                    aFeeBreakdown: calculateTabbyNetAmount(
                      s.partial.aOrderAmount,
                    ),
                  }
                : {}),
              ...(bIsTabbyOrTamara
                ? {
                    bOrderAmount: s.partial.bOrderAmount,
                    bFeeBreakdown: calculateTabbyNetAmount(
                      s.partial.bOrderAmount,
                    ),
                  }
                : {}),
            },
            customerId: s.partial.aCustomerId || s.partial.bCustomerId || "",
            bankId: null,
            // Only the CASH/BANK_TRANSFER leg counts as "paid" — the CREDIT
            // leg is a receivable, not cash received.
            paidAmount: String(partialPaidAmount),
            // sellPrice = both legs combined (total the customer owes)
            sellPrice: String(partialTotal),
          };

    onConfirm(result);
    setOpen(false);
  };

  const selectedMethod = METHOD_META[s.mode];
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
              {paymentDisplayLabel(sale.paymentMeta, sale.paymentType)}
            </span>
          </>
        ) : (
          <span>{paymentDisplayLabel(null, sale.paymentType)}</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" /> Edit Payment Method
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => {
              const c = colorMap[m.color];
              const active =
                m.value === "BANK_ACCOUNT"
                  ? s.mode === "BANK_ACCOUNT" ||
                    s.mode === "BANK_TRANSFER" ||
                    s.mode === "POS"
                  : s.mode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => {
                    resetFields();
                    patch({ mode: m.value });
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all
                    ${
                      active
                        ? `${c.bg} ${c.border} ${c.text} ring-2 ${c.ring} ring-offset-1`
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                  {active && <Check className="h-3.5 w-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>

          {s.mode === "CASH" && (
            <SlotFields
              methodValue="CASH"
              amount={s.amount}
              setAmount={(v) => patch({ amount: v })}
            />
          )}

          {s.mode === "BANK_ACCOUNT" && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-600">
                Choose Bank Payment Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    resetFields();
                    patch({ mode: "BANK_TRANSFER" });
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-all aspect-square"
                >
                  <Building2 className="h-6 w-6" />
                  Bank Transfer
                </button>
                <button
                  onClick={() => {
                    resetFields();
                    patch({ mode: "POS" });
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-cyan-300 hover:bg-cyan-50 transition-all aspect-square"
                >
                  <Terminal className="h-6 w-6" />
                  POS Machine
                </button>
              </div>
            </div>
          )}

          {s.mode === "BANK_TRANSFER" && (
            <>
              <button
                onClick={() => {
                  resetFields();
                  patch({ mode: "BANK_ACCOUNT" });
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                ← Change bank payment type
              </button>
              <SlotFields
                methodValue="BANK_TRANSFER"
                amount={s.amount}
                setAmount={(v) => patch({ amount: v })}
                bankId={s.bankId}
                setBankId={(v) => patch({ bankId: v })}
                bankOptions={bankOptions}
              />
            </>
          )}

          {s.mode === "POS" && (
            <>
              <button
                onClick={() => {
                  resetFields();
                  patch({ mode: "BANK_ACCOUNT" });
                }}
                className="text-xs text-cyan-600 hover:underline"
              >
                ← Change bank payment type
              </button>
              <PosFields
                posId={s.posId}
                setPosId={(v) => patch({ posId: v })}
                posCardType={s.posCardType}
                setPosCardType={(v) => patch({ posCardType: v })}
                posCommissionRate={s.posCommissionRate}
                setPosCommissionRate={(v) => patch({ posCommissionRate: v })}
                posOrderAmount={s.posOrderAmount}
                setPosOrderAmount={(v) => patch({ posOrderAmount: v })}
                amount={s.amount}
                setAmount={(v) => patch({ amount: v })}
                posOptions={posOptions}
              />
            </>
          )}

          {s.mode === "CREDIT" && (
            <SlotFields
              methodValue="CREDIT"
              amount={s.amount}
              setAmount={(v) => patch({ amount: v })}
              customerId={s.customerId}
              setCustomerId={(v) => patch({ customerId: v, orderAmount: "" })}
              customerOptions={customerOptions}
              orderAmount={s.orderAmount}
              setOrderAmount={(v) => patch({ orderAmount: v })}
              sellPrice={sell}
            />
          )}

          {s.mode === "PARTIAL" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">
                  Choose Split Type
                </Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PARTIAL_COMBOS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => patch({ partial: emptyPartial(c.value) })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left
                        ${
                          s.partial.combo === c.value
                            ? "bg-amber-50 border-amber-400 text-amber-700 ring-1 ring-amber-400"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                    >
                      {s.partial.combo === c.value ? (
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
                    amount={s.partial.aAmount}
                    setAmount={(v) =>
                      patch({ partial: { ...s.partial, aAmount: v } })
                    }
                    customerId={s.partial.aCustomerId}
                    setCustomerId={(v) =>
                      patch({
                        partial: {
                          ...s.partial,
                          aCustomerId: v,
                          aOrderAmount: "",
                        },
                      })
                    }
                    bankId={s.partial.aBankId}
                    setBankId={(v) =>
                      patch({ partial: { ...s.partial, aBankId: v } })
                    }
                    orderAmount={s.partial.aOrderAmount}
                    setOrderAmount={(v) =>
                      patch({ partial: { ...s.partial, aOrderAmount: v } })
                    }
                    customerOptions={customerOptions}
                    bankOptions={bankOptions}
                  />
                  <SlotFields
                    methodValue={selectedCombo.b}
                    amount={s.partial.bAmount}
                    setAmount={(v) =>
                      patch({ partial: { ...s.partial, bAmount: v } })
                    }
                    customerId={s.partial.bCustomerId}
                    setCustomerId={(v) =>
                      patch({
                        partial: {
                          ...s.partial,
                          bCustomerId: v,
                          bOrderAmount: "",
                        },
                      })
                    }
                    bankId={s.partial.bBankId}
                    setBankId={(v) =>
                      patch({ partial: { ...s.partial, bBankId: v } })
                    }
                    orderAmount={s.partial.bOrderAmount}
                    setOrderAmount={(v) =>
                      patch({ partial: { ...s.partial, bOrderAmount: v } })
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
                      className={`text-xs ${
                        Math.abs(partialRemaining) < 0.01
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-orange-100 text-orange-700 border-orange-200"
                      }`}
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

          {s.mode && (
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
