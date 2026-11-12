"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Building2, Check, Search } from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../shadcn/components/ui/dialog";
import { appToast } from "../../shadcn/components/ui/appToast";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Admin only: move a sale's invoice (with every sale on it) to another branch.
 *
 * The branches are shown as a list to click — NOT a dropdown. A dropdown menu is drawn outside the
 * dialog (react-select portals it to <body>), and a modal dialog blocks the mouse for everything
 * outside it, so the options could only be reached with the keyboard.
 */
export default function MoveBranchDialog({ sale, open, onOpenChange, onMoved }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setBranchId("");
    setQuery("");
    const controller = new AbortController();
    setLoading(true);
    fetch(`${API_BASE}/api/branches`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, signal: controller.signal })
      .then((r) => r.json())
      .then((j) => setBranches(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, sale?.invoiceId]);

  const target = branches.find((b) => b.id === branchId) || null;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? branches.filter((b) => `${b.name} ${b.code}`.toLowerCase().includes(q)) : branches;
  }, [branches, query]);

  const move = async () => {
    if (!target || target.id === sale?.branchId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales/${sale.invoiceId}/branch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ branchId: target.id }),
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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6 text-left">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 pr-6">
              <DialogTitle className="text-lg">Move to branch</DialogTitle>
              <DialogDescription className="mt-0.5 text-[13px] leading-snug">
                Invoice <span className="font-mono font-semibold text-slate-700">{sale?.invoiceNo}</span> and every sale on it will belong to the branch you pick.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {/* from → to */}
          <div className="grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-200/70" data-testid="move-from">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Now in</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{sale?.branchName || "No branch"}</p>
              {sale?.branchCode && <p className="text-[11px] text-slate-400">{sale.branchCode}</p>}
            </div>
            <span className="grid place-items-center text-slate-300">
              <ArrowRight className="hidden h-4 w-4 sm:block" />
              <ArrowDown className="mx-auto h-4 w-4 sm:hidden" />
            </span>
            <div
              className={`rounded-xl px-3.5 py-2.5 ring-1 transition-colors ${target ? "bg-indigo-50/70 ring-indigo-200" : "border border-dashed border-slate-200 bg-white ring-transparent"}`}
              data-testid="move-to"
            >
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${target ? "text-indigo-400" : "text-slate-400"}`}>Moving to</p>
              <p className={`mt-0.5 truncate text-sm font-semibold ${target ? "text-indigo-900" : "text-slate-400"}`}>{target ? target.name : "Pick a branch below"}</p>
              {target && <p className="text-[11px] text-indigo-400">{target.code}</p>}
            </div>
          </div>

          {/* the branches */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                Choose the branch
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">Admin</span>
              </p>
              {branches.length > 6 && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    aria-label="Search branches"
                    className="h-8 w-40 rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs outline-none focus:border-slate-400"
                  />
                </div>
              )}
            </div>

            <div role="radiogroup" aria-label="Branch" className="-mx-1.5 max-h-60 space-y-1.5 overflow-y-auto px-1.5 py-1.5" data-testid="branch-list">
              {loading && <p className="py-6 text-center text-sm text-slate-400">Loading branches…</p>}
              {!loading && shown.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No branch found.</p>}
              {shown.map((b) => {
                const current = b.id === sale?.branchId;
                const on = b.id === branchId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={current}
                    onClick={() => setBranchId(b.id)}
                    data-testid="branch-option"
                    className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left ring-1 transition-all ${
                      current
                        ? "cursor-not-allowed bg-slate-50 opacity-60 ring-slate-200"
                        : on
                          ? "bg-indigo-50/70 ring-2 ring-indigo-400"
                          : "bg-white ring-slate-200 hover:bg-slate-50 hover:ring-slate-300"
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${on ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{b.name}</span>
                      <span className="block text-[11px] text-slate-400">{b.code}</span>
                    </span>
                    {current ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Current</span>
                    ) : (
                      <span className={`grid h-5 w-5 place-items-center rounded-full ${on ? "bg-indigo-600 text-white" : "ring-1 ring-slate-300"}`}>
                        {on && <Check className="h-3 w-3" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={move} disabled={!target || saving} className="gap-2">
            {saving ? "Moving..." : target ? `Move to ${target.code}` : "Move sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
