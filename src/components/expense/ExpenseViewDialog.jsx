"use client";

import { Banknote, Building2, ExternalLink, FileText, Landmark, Paperclip, Percent, SaudiRiyal, UserCog } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../../shadcn/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shadcn/components/ui/dialog";
import { catLabel, fileNameOf, isPdf, money2, savedVatMode } from "./expenseUtils";

const Fact = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">{children || "—"}</dd>
  </div>
);

/** Everything about one expense, read-only. */
export default function ExpenseViewDialog({ expense, onOpenChange, canEdit, onEdit }) {
  const e = expense;
  const mode = e ? savedVatMode(e) : null;
  const vat = e?.vatAmount != null ? Number(e.vatAmount) : 0;

  return (
    <Dialog open={!!e} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {e && (
          <>
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-5 text-left">
              <div className="flex items-start justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-lg">{catLabel(e.category)}</DialogTitle>
                  <DialogDescription className="text-[13px]">
                    {format(new Date(e.expenseDate), "dd MMMM yyyy")} · {e.branch?.name ?? "—"}
                  </DialogDescription>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${e.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                  {e.status === "APPROVED" ? "Approved" : "Rejected"}
                </span>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* amount + VAT */}
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total paid</p>
                <p className="flex items-center gap-1.5 text-3xl font-bold tabular-nums text-slate-900" data-testid="view-amount">
                  <SaudiRiyal className="h-6 w-6 opacity-50" />
                  {money2(e.amount)}
                </p>
                {mode && e.vatAmount != null && (
                  <div className="mt-2 space-y-1 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm" data-testid="view-vat">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                      <Percent className="h-3.5 w-3.5" /> VAT {mode === "INCLUSIVE" ? "included" : "added on top"} · counted in Returnable VAT
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Amount excluding VAT</span>
                      <span className="tabular-nums">{money2(Number(e.amount) - vat)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-amber-800">
                      <span>VAT 15%</span>
                      <span className="tabular-nums">{money2(vat)}</span>
                    </div>
                  </div>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Payment">
                  <span className="inline-flex items-center gap-1.5">
                    {e.paymentMode === "BANK_TRANSFER" ? <Landmark className="h-3.5 w-3.5 text-slate-400" /> : <Banknote className="h-3.5 w-3.5 text-slate-400" />}
                    {e.paymentMode === "BANK_TRANSFER" ? `Bank — ${e.bank?.bankName ?? ""}` : "Cash"}
                  </span>
                </Fact>
                <Fact label="Created by">
                  <span className="inline-flex items-center gap-1.5">
                    <UserCog className="h-3.5 w-3.5 text-slate-400" />
                    {e.createdBy?.fullName}
                  </span>
                </Fact>
                {e.category === "SALARY" && <Fact label="Employee">{e.user?.fullName}</Fact>}
                <Fact label="Branch">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {e.branch?.name}
                  </span>
                </Fact>
              </dl>

              {(e.details || []).length > 0 && (
                <div data-testid="view-details">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">Service details</p>
                  <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {e.details.map((d, i) => (
                      <div key={i} className="grid grid-cols-[2fr_3fr] gap-3 px-3 py-2 text-sm">
                        <dt className="font-medium text-slate-600">{d.label}</dt>
                        <dd className="text-slate-900">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {e.description && (
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    <FileText className="h-3 w-3" /> Description
                  </p>
                  <p className="text-sm text-slate-700">{e.description}</p>
                </div>
              )}

              {e.attachmentUrl && (
                <div data-testid="view-attachment">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    <Paperclip className="h-3 w-3" /> Attachment
                  </p>
                  {!isPdf(e.attachmentUrl) && (
                    <a href={e.attachmentUrl} target="_blank" rel="noreferrer">
                      <img src={e.attachmentUrl} alt="Attachment" className="max-h-64 w-full rounded-xl border border-slate-200 object-contain" />
                    </a>
                  )}
                  <a href={e.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
                    {fileNameOf(e.attachmentUrl)} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {canEdit && (
                <Button onClick={() => onEdit(e)} className="bg-indigo-600 hover:bg-indigo-700">
                  Edit
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
