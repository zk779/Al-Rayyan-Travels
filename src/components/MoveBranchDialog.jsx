"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../shadcn/components/ui/dialog";
import { appToast } from "../../shadcn/components/ui/appToast";
import BranchPicker from "./BranchPicker";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/** Admin only: move a sale's invoice (with every sale on it) to another branch. */
export default function MoveBranchDialog({ sale, open, onOpenChange, onMoved }) {
  const [branchId, setBranchId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setBranchId(sale?.branchId || "");
  }, [open, sale]);

  const same = !branchId || branchId === sale?.branchId;

  const move = async () => {
    if (same) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales/${sale.invoiceId}/branch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ branchId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to move the sale");
      appToast.success(`Invoice ${sale.invoiceNo} moved to ${json.data.branchName}`);
      onMoved?.(json.data);
      onOpenChange(false);
    } catch (err) {
      appToast.error(err.message || "Failed to move the sale");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" /> Move to branch
          </DialogTitle>
          <DialogDescription>
            Invoice <span className="font-mono font-semibold text-slate-700">{sale?.invoiceNo}</span> and every sale on it will belong to the branch you pick.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600" data-testid="move-from">
            <span className="text-xs uppercase tracking-wide text-slate-400">Now in</span>
            <span className="font-medium text-slate-800">{sale?.branchName || "No branch"}</span>
            {sale?.branchCode && <span className="text-xs text-slate-400">({sale.branchCode})</span>}
            <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
          </div>
          <BranchPicker value={branchId} onChange={setBranchId} label="Move to" allowDefault={false} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={move} disabled={same || saving} className="gap-2">
            {saving ? "Moving..." : "Move sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
