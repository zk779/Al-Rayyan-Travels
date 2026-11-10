"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, SaudiRiyal } from "lucide-react";
import { Button } from "../../../shadcn/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../shadcn/components/ui/dialog";
import { appToast } from "../../../shadcn/components/ui/appToast";
import { PaymentPicker } from "./PaymentPicker";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const money = (n) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Confirm a draft: pick how the payment was received (Cash / Bank + bank) and post it. */
export default function ConfirmPaymentDialog({ invoice, open, onOpenChange, onConfirmed }) {
  const [pay, setPay] = useState({ method: "", bankId: "" });
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPay({ method: "", bankId: "" });
      setTried(false);
    }
  }, [open, invoice?.id]);

  const incomplete = !pay.method || (pay.method === "BANK" && !pay.bankId);

  const confirm = async () => {
    setTried(true);
    if (incomplete) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/other-services/${invoice.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ paymentMethod: pay.method, bankId: pay.bankId || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to confirm the invoice");
      appToast.success(`Invoice ${invoice.invoiceNo} confirmed`);
      onConfirmed?.(json.data);
      onOpenChange(false);
    } catch (err) {
      appToast.error(err.message || "Failed to confirm the invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Confirm &amp; receive payment
          </DialogTitle>
          <DialogDescription>
            Invoice {invoice?.invoiceNo} · {invoice?.customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
          <span className="text-xs font-medium text-slate-500">Amount received</span>
          <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-slate-900" data-testid="confirm-amount">
            <SaudiRiyal className="h-4 w-4 opacity-50" />
            {money(invoice?.total)}
          </span>
        </div>
        <PaymentPicker method={pay.method} bankId={pay.bankId} onChange={(p) => setPay({ method: p.method, bankId: p.bankId })} invalid={tried} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={saving} className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> {saving ? "Confirming…" : "Confirm invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
