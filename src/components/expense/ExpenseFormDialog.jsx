"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  ExternalLink,
  FileText,
  Landmark,
  ListPlus,
  Paperclip,
  Percent,
  Plus,
  SaudiRiyal,
  Trash2,
  Upload,
  User as UserIcon,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../../shadcn/components/ui/button";
import { Input } from "../../../shadcn/components/ui/input";
import { Label } from "../../../shadcn/components/ui/label";
import { Textarea } from "../../../shadcn/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shadcn/components/ui/select";
import { Calendar as CalendarComponent } from "../../../shadcn/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../../shadcn/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../shadcn/components/ui/dialog";
import {
  ACCEPT,
  CATEGORIES,
  MAX_FILE_MB,
  RETURNABLE_VAT,
  buildFormData,
  emptyForm,
  fileNameOf,
  fileProblem,
  formFromExpense,
  money2,
  newDetail,
  sizeLabel,
  vatBreakdown,
} from "./expenseUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const EXPENSES_URL = `${API_BASE}/api/expenses`;

/** A numbered step: the form reads top to bottom, one thing at a time. */
const Step = ({ n, icon: Icon, title, hint, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white">
    <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">{n}</span>
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-indigo-500" />
        {title}
      </h3>
      {hint && <span className="ml-auto hidden text-[11px] text-slate-400 sm:inline">{hint}</span>}
    </header>
    <div className="space-y-3 p-4">{children}</div>
  </section>
);

const Field = ({ label, children, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <Label className="text-xs font-medium text-slate-600">{label}</Label>
    {children}
  </div>
);

const Seg = ({ on, onClick, icon: Icon, children, tone = "indigo", testId, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    disabled={disabled}
    data-testid={testId}
    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
      on
        ? tone === "emerald"
          ? "border-emerald-600 bg-emerald-600 text-white"
          : tone === "rose"
            ? "border-rose-600 bg-rose-600 text-white"
            : "border-indigo-600 bg-indigo-600 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    }`}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

/** Add / edit one expense. The receipt and the service details travel with it. */
export default function ExpenseFormDialog({ open, onOpenChange, expense, branches, banks, users, usersLoading, ensureUsers, onSaved }) {
  const isEdit = !!expense;
  const fileRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(expense ? formFromExpense(expense) : emptyForm());
    setFile(null);
    setRemoveAttachment(false);
    setError("");
    if (expense?.category === "SALARY") ensureUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expense?.id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isReturnable = form.category === RETURNABLE_VAT;
  const vatOn = isReturnable || form.hasVat;
  const vatMode = isReturnable ? "INCLUSIVE" : form.vatMode;
  const calc = useMemo(() => vatBreakdown(form.amount, vatOn ? vatMode : null), [form.amount, vatOn, vatMode]);
  const amountOk = Number(form.amount) > 0;

  const branchUsers = useMemo(() => (form.branchId ? users.filter((u) => u.branchId === form.branchId) : []), [users, form.branchId]);

  const pickCategory = (v) => {
    if (v === "SALARY") ensureUsers();
    set({ category: v, userId: v === "SALARY" ? form.userId : "" });
  };

  const pickFile = (f) => {
    if (!f) return;
    const problem = fileProblem(f);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setFile(f);
    setRemoveAttachment(false);
  };

  const setDetail = (id, patch) => setForm((f) => ({ ...f, details: f.details.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));

  const canSave =
    form.expenseDate &&
    form.branchId &&
    form.category &&
    amountOk &&
    (form.paymentMode === "CASH" || form.bankId) &&
    (form.category !== "SALARY" || form.userId);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(isEdit ? `${EXPENSES_URL}/${expense.id}` : EXPENSES_URL, {
        method: isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }, // the browser sets the multipart type
        body: buildFormData(form, { file, removeAttachment }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || "Save failed");
        return;
      }
      onOpenChange(false);
      onSaved();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const existingUrl = isEdit && expense.attachmentUrl && !removeAttachment ? expense.attachmentUrl : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 pb-3.5 pt-5 text-left">
          <DialogTitle className="text-lg">{isEdit ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {isEdit ? "Update the details of this expense." : "Fill in the steps below — only the first three are required."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-slate-50/60 px-6 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* 1 — what is it, where, when */}
          <Step n={1} icon={FileText} title="What is this expense?" hint="Required">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Branch">
                <Select value={form.branchId} onValueChange={(v) => set({ branchId: v, userId: "" })}>
                  <SelectTrigger className="w-full" aria-label="Branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Category">
                <Select value={form.category} onValueChange={pickCategory}>
                  <SelectTrigger className="w-full" aria-label="Category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Expense date">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal" aria-label="Expense date">
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {form.expenseDate ? format(form.expenseDate, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={form.expenseDate} onSelect={(d) => d && set({ expenseDate: d })} initialFocus />
                  </PopoverContent>
                </Popover>
              </Field>
              {form.category === "SALARY" && (
                <Field label="Employee">
                  {!form.branchId ? (
                    <p className="flex h-9 items-center text-xs text-slate-500">Select a branch first.</p>
                  ) : (
                    <Select value={form.userId} onValueChange={(v) => set({ userId: v })}>
                      <SelectTrigger className="w-full" aria-label="Employee">
                        <SelectValue placeholder={usersLoading ? "Loading employees..." : branchUsers.length === 0 ? "No employees in this branch" : "Select employee"} />
                      </SelectTrigger>
                      <SelectContent>
                        {branchUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              )}
            </div>
          </Step>

          {/* 2 — how much, and the VAT */}
          <Step n={2} icon={SaudiRiyal} title="Amount & VAT" hint="Required">
            <Field label={vatOn ? (vatMode === "INCLUSIVE" ? "Amount (VAT included)" : "Amount (before VAT)") : "Amount"}>
              <div className="relative">
                <SaudiRiyal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => set({ amount: e.target.value })}
                  aria-label="Amount"
                  className="h-11 pl-9 text-lg font-semibold"
                />
              </div>
            </Field>

            <div className="space-y-2" data-testid="vat-box">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Percent className="h-3.5 w-3.5 text-amber-600" /> Is VAT included in this expense?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Seg on={!vatOn} onClick={() => set({ hasVat: false })} testId="vat-no" disabled={isReturnable}>
                  No VAT
                </Seg>
                <Seg on={vatOn} onClick={() => set({ hasVat: true })} testId="vat-yes" tone="rose" disabled={isReturnable}>
                  Yes, VAT 15%
                </Seg>
              </div>
              {isReturnable && <p className="text-[11px] text-amber-700">The “Returnable VAT” category always includes 15% VAT in the amount.</p>}

              {vatOn && (
                <>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="VAT type">
                    <Seg on={vatMode === "INCLUSIVE"} onClick={() => set({ vatMode: "INCLUSIVE" })} testId="vat-inclusive" disabled={isReturnable}>
                      Inclusive
                    </Seg>
                    <Seg on={vatMode === "EXCLUSIVE"} onClick={() => set({ vatMode: "EXCLUSIVE" })} testId="vat-exclusive" disabled={isReturnable}>
                      Exclusive
                    </Seg>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {vatMode === "INCLUSIVE" ? "Inclusive: the amount you typed already contains the 15% VAT." : "Exclusive: 15% VAT is added on top of the amount you typed."}
                  </p>
                </>
              )}
            </div>

            {vatOn && amountOk && (
              <div className="grid grid-cols-3 divide-x divide-amber-200 overflow-hidden rounded-lg bg-amber-50/70 ring-1 ring-amber-200" data-testid="vat-breakdown">
                <div className="px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700/70">Excluding VAT</p>
                  <p className="text-sm font-semibold tabular-nums text-slate-800" data-testid="vat-net">{money2(calc.net)}</p>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700/70">VAT 15%</p>
                  <p className="text-sm font-semibold tabular-nums text-amber-700" data-testid="vat-amount">{money2(calc.vat)}</p>
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700/70">Total paid</p>
                  <p className="text-sm font-bold tabular-nums text-slate-900" data-testid="vat-gross">{money2(calc.gross)}</p>
                </div>
                <p className="col-span-3 border-t border-amber-200 bg-white/60 px-3 py-1 text-[10px] text-slate-500">This VAT is also counted in Returnable VAT.</p>
              </div>
            )}
          </Step>

          {/* 3 — how it was paid */}
          <Step n={3} icon={Wallet} title="Payment" hint="Required">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Paid by">
                <div className="grid grid-cols-2 gap-2">
                  <Seg on={form.paymentMode === "CASH"} onClick={() => set({ paymentMode: "CASH", bankId: "" })} icon={Banknote} testId="mode-cash">
                    Cash
                  </Seg>
                  <Seg on={form.paymentMode === "BANK_TRANSFER"} onClick={() => set({ paymentMode: "BANK_TRANSFER" })} icon={Landmark} testId="mode-bank">
                    Bank
                  </Seg>
                </div>
              </Field>
              <Field label="Status">
                <div className="grid grid-cols-2 gap-2">
                  <Seg on={form.status === "APPROVED"} onClick={() => set({ status: "APPROVED" })} icon={CheckCircle2} tone="emerald" testId="status-approved">
                    Approved
                  </Seg>
                  <Seg on={form.status === "REJECTED"} onClick={() => set({ status: "REJECTED" })} icon={XCircle} tone="rose" testId="status-rejected">
                    Rejected
                  </Seg>
                </div>
              </Field>
            </div>
            {form.paymentMode === "BANK_TRANSFER" && (
              <Field label="Bank account">
                <Select value={form.bankId} onValueChange={(v) => set({ bankId: v })}>
                  <SelectTrigger className="w-full" aria-label="Bank">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.bankName} — {b.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </Step>

          {/* 4 — optional: service details, notes, receipt */}
          <Step n={4} icon={ListPlus} title="Service details" hint="Optional">
            <div className="space-y-2" data-testid="details">
              {form.details.map((d) => (
                <div key={d.id} className="grid grid-cols-[2fr_3fr_auto] items-center gap-2" data-testid="detail-row">
                  <Input value={d.label} onChange={(e) => setDetail(d.id, { label: e.target.value })} placeholder="Label" aria-label="Detail label" className="h-9 font-medium" />
                  <Input value={d.value} onChange={(e) => setDetail(d.id, { value: e.target.value })} placeholder="Details" aria-label="Detail value" className="h-9" />
                  <button
                    type="button"
                    onClick={() => set({ details: form.details.filter((x) => x.id !== d.id) })}
                    aria-label="Remove detail"
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-400">e.g. “Service Name” → Visa renewal. Empty rows are not saved.</p>
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5" onClick={() => set({ details: [...form.details, newDetail()] })}>
                <Plus className="h-3.5 w-3.5" /> Add detail
              </Button>
            </div>
            <Field label="Description">
              <Textarea placeholder="Optional notes..." value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} className="resize-none" />
            </Field>
          </Step>

          <Step n={5} icon={Paperclip} title="Receipt or invoice" hint="Optional">
            {existingUrl && !file && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm" data-testid="current-attachment">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                <a href={existingUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-indigo-600 hover:underline">
                  {fileNameOf(existingUrl)}
                </a>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                <button type="button" onClick={() => setRemoveAttachment(true)} className="text-xs font-medium text-rose-600 hover:underline">
                  Remove
                </button>
              </div>
            )}
            {isEdit && expense.attachmentUrl && removeAttachment && !file && (
              <p className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700" data-testid="attachment-removed">
                The current file will be removed when you save.
                <button type="button" onClick={() => setRemoveAttachment(false)} className="font-semibold underline">
                  Undo
                </button>
              </p>
            )}

            {file ? (
              <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2 text-sm" data-testid="chosen-file">
                <Paperclip className="h-4 w-4 shrink-0 text-indigo-500" />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{file.name}</span>
                <span className="text-xs text-slate-400">{sizeLabel(file.size)}</span>
                <button type="button" onClick={() => setFile(null)} aria-label="Remove chosen file" className="text-slate-400 hover:text-rose-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <Upload className="h-5 w-5 shrink-0 text-slate-400" />
                <span>
                  <span className="block text-sm font-medium text-slate-700">{existingUrl ? "Replace the file" : "Attach a receipt or invoice"}</span>
                  <span className="block text-[11px] text-slate-400">JPG, PNG, WEBP or PDF · max {MAX_FILE_MB} MB</span>
                </span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              aria-label="Attachment"
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </Step>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-3.5">
          <div className="min-w-0" data-testid="paid-summary">
            {amountOk ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">You will pay</p>
                <p className="flex items-center gap-1 text-lg font-bold tabular-nums text-slate-900">
                  <SaudiRiyal className="h-4 w-4 opacity-50" />
                  {money2(calc.gross)}
                  {vatOn && <span className="ml-1 text-xs font-medium text-amber-600">incl. VAT {money2(calc.vat)}</span>}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">Enter the amount</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!canSave || saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : isEdit ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
