"use client";

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  FileSearch,
  Hash,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { useIsAdmin } from "../utils/useIsAdmin";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 25;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" });
const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const Step = ({ n, title, done, active, children }) => (
  <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${active ? "ring-slate-300" : "ring-slate-200/80"}`}>
    <div className="mb-3 flex items-center gap-3">
      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${done ? "bg-emerald-600 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : n}
      </span>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    </div>
    {children}
  </section>
);

const Tile = ({ label, value, sub, tone = "text-slate-900" }) => (
  <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-0.5 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
    {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
  </div>
);

const Checks = ({ checks }) => (
  <ul className="mt-3 space-y-1.5" data-testid="checks">
    {checks.map((c) => (
      <li key={c.name} className="flex items-start gap-2 text-xs text-slate-600">
        <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${c.ok ? "text-emerald-600" : "text-rose-600"}`} />
        {c.name}
      </li>
    ))}
  </ul>
);

/**
 * ADMIN ONLY — put the sales invoices in order (sale date, then when they were entered) with no gaps.
 * Preview first (writes nothing) → download the backup file → type RENUMBER → run (all or nothing).
 */
export default function RenumberInvoices() {
  const isAdmin = useIsAdmin();

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [backupFile, setBackupFile] = useState(""); // set once the file has been downloaded
  const [downloading, setDownloading] = useState(false);
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const [restoreInfo, setRestoreInfo] = useState(null); // { backup, check }
  const [restoreTyped, setRestoreTyped] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [restoreError, setRestoreError] = useState("");

  const call = async (path, options = {}) => {
    const res = await fetch(`${API_BASE}/api/invoice-renumber/${path}`, { headers: authHeaders(), ...options });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || "Something went wrong");
    return json;
  };

  const buildPreview = async () => {
    setPreviewing(true);
    setError("");
    setResult(null);
    setBackupFile("");
    setTyped("");
    setPage(1);
    try {
      const json = await call(`preview?tz=${encodeURIComponent(tz())}`);
      setPreview(json.data);
    } catch (err) {
      setPreview(null);
      setError(err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const downloadBackup = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/invoice-renumber/backup?tz=${encodeURIComponent(tz())}&planHash=${preview.planHash}`, { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || "Could not make the backup file");
      const blob = await res.blob();
      const name = res.headers.get("content-disposition")?.match(/filename="(.+?)"/)?.[1] || "renumber-backup.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBackupFile(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const json = await call("run", {
        method: "POST",
        body: JSON.stringify({ tz: tz(), planHash: preview.planHash, confirm: typed, backupDownloaded: !!backupFile }),
      });
      setResult(json);
      setPreview(null);
      setBackupFile("");
      setTyped("");
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const chooseBackup = async (file) => {
    setRestoreInfo(null);
    setRestoreResult(null);
    setRestoreError("");
    setRestoreTyped("");
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      const json = await call("restore", { method: "POST", body: JSON.stringify({ backup, dryRun: true }) });
      setRestoreInfo({ backup, check: json.data, name: file.name });
    } catch (err) {
      setRestoreError(err.message.includes("JSON") ? "That file is not a renumber backup" : err.message);
    }
  };

  const restore = async () => {
    setRestoring(true);
    setRestoreError("");
    try {
      const json = await call("restore", { method: "POST", body: JSON.stringify({ backup: restoreInfo.backup, confirm: restoreTyped }) });
      setRestoreResult(json);
      setRestoreInfo(null);
      setRestoreTyped("");
    } catch (err) {
      setRestoreError(err.message);
    } finally {
      setRestoring(false);
    }
  };

  const rows = useMemo(() => {
    if (!preview) return [];
    const q = search.trim().toLowerCase();
    return preview.rows.filter((r) => (!onlyChanged || r.changed) && (!q || r.oldNo.toLowerCase().includes(q) || r.newNo.toLowerCase().includes(q)));
  }, [preview, onlyChanged, search]);
  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!isAdmin) {
    return <p className="py-24 text-center text-sm text-slate-500">Only an admin can renumber invoices.</p>;
  }

  const canRun = !!preview && !preview.blocked && !preview.nothingToDo && !!backupFile && typed === "RENUMBER" && !running;
  const group = preview?.groups?.[0];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg md:p-7">
        <div className="pointer-events-none absolute -right-14 -top-16 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <Link to="/sales-report" className="relative inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Sales Report
        </Link>
        <div className="relative mt-2 flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Hash size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Renumber invoices in order</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-slate-300">
              Numbers the invoices 0001, 0002, 0003… with no gaps — by sale date, then by when they were entered. The new numbers are carried into the ledger
              descriptions too. Nothing changes until step 3.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" data-testid="run-result">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" /> {result.message}
          </p>
          <p className="mt-1 text-xs text-emerald-700">Every check below passed. The next new invoice continues from the last number.</p>
          <Checks checks={result.data.checks} />
        </div>
      )}

      {/* 1 — preview */}
      <Step n={1} title="Preview — see exactly what would change (writes nothing)" done={!!preview} active={!preview}>
        <Button onClick={buildPreview} disabled={previewing} className="gap-2">
          {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
          {preview ? "Refresh the preview" : "Build the preview"}
        </Button>

        {preview && (
          <div className="mt-5 space-y-4">
            {preview.blocked && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800" data-testid="blocked">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {preview.blockedReasons[0]}
              </div>
            )}
            {preview.nothingToDo && !preview.blocked && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> The invoices are already in order — nothing to do.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Tile label="Invoices" value={preview.totals.invoices} />
              <Tile label="Will change" value={preview.totals.changed} tone="text-indigo-700" />
              <Tile label="Stay as they are" value={preview.totals.unchanged} />
              <Tile label="Ledger texts rewritten" value={preview.texts.rewrite} sub={preview.texts.byTarget.map((t) => t.target).join(", ")} />
              <Tile
                label="Counter"
                value={group?.counter ? `${group.counter.before} → ${group.counter.after}` : "—"}
                sub={group ? `next invoice: ${group.prefix}-${String(group.nextNumber).padStart(4, "0")}` : ""}
              />
            </div>
            {preview.texts.dangling > 0 && (
              <p className="text-xs text-amber-700">
                {preview.texts.dangling} number(s) in descriptions belong to no invoice any more (a deleted one) — they are left exactly as they are.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Find an invoice number…" aria-label="Find an invoice number" className="h-9 w-56 rounded-lg" />
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={onlyChanged} onChange={(e) => { setOnlyChanged(e.target.checked); setPage(1); }} />
                Only the ones that change
              </label>
              <span className="ml-auto text-xs text-slate-400">{rows.length} shown</span>
            </div>

            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full min-w-[640px] text-sm" data-testid="plan-table">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5 text-left">Now</th>
                    <th className="px-2 py-2.5" />
                    <th className="px-4 py-2.5 text-left">Will become</th>
                    <th className="px-4 py-2.5 text-left">Sale date</th>
                    <th className="px-4 py-2.5 text-left">Entered</th>
                    <th className="px-4 py-2.5 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((r) => (
                    <tr key={r.id} className={r.changed ? "" : "text-slate-400"}>
                      <td className="px-4 py-2 font-mono text-xs">{r.oldNo}</td>
                      <td className="px-2 py-2 text-slate-300">{r.changed ? <ArrowRight className="h-3.5 w-3.5" /> : "="}</td>
                      <td className={`px-4 py-2 font-mono text-xs font-semibold ${r.changed ? "text-indigo-700" : ""}`}>{r.newNo}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-xs">{format(new Date(`${r.day}T12:00:00`), "dd MMM yyyy")}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-xs">{format(new Date(r.createdAt), "dd MMM yyyy HH:mm")}</td>
                      <td className="px-4 py-2 text-right text-xs tabular-nums">{r.salesCount}</td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                        Nothing to show.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {rows.length > PAGE_SIZE && (
              <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {page} / {totalPages}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Step>

      {/* 2 — backup */}
      <Step n={2} title="Download the backup file" done={!!backupFile} active={!!preview && !backupFile}>
        <p className="mb-3 text-xs text-slate-500">
          A small file with the old and new numbers, the descriptions that mention them and the counter — enough to put everything back. It is saved on this
          computer, not in the system. Take a full database backup too if you can.
        </p>
        <Button onClick={downloadBackup} disabled={!preview || preview.blocked || preview.nothingToDo || downloading} variant="outline" className="gap-2">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
          Download backup file
        </Button>
        {backupFile && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700" data-testid="backup-done">
            <CheckCircle2 className="h-3.5 w-3.5" /> Downloaded: {backupFile}
          </p>
        )}
      </Step>

      {/* 3 — run */}
      <Step n={3} title="Renumber" done={!!result} active={!!backupFile && !result}>
        <p className="mb-3 text-xs text-slate-500">
          All or nothing: everything is changed together and checked (no gaps, no duplicates, ledger totals and balances exactly as before). If any check fails,
          nothing is changed. Make sure nobody is creating invoices while this runs.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type RENUMBER" aria-label="Type RENUMBER to confirm" disabled={!backupFile} className="h-10 w-48 rounded-lg font-mono" />
          <Button onClick={run} disabled={!canRun} className="gap-2 bg-slate-900">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {running ? "Renumbering…" : "Renumber the invoices"}
          </Button>
        </div>
      </Step>

      {/* undo */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <RotateCcw className="h-4 w-4 text-slate-500" /> Undo a run
        </h2>
        <p className="mb-3 text-xs text-slate-500">Choose the backup file from that run to put the old numbers, descriptions and counter back. It only works while the invoices are still as the run left them.</p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Upload className="h-4 w-4" /> Choose backup file
          <input type="file" accept="application/json,.json" aria-label="Backup file" className="hidden" onChange={(e) => chooseBackup(e.target.files?.[0])} />
        </label>
        {restoreError && <p className="mt-3 text-sm text-rose-600" data-testid="restore-error">{restoreError}</p>}
        {restoreInfo && (
          <div className="mt-4 space-y-3" data-testid="restore-ready">
            <p className="text-sm text-slate-700">
              {restoreInfo.name}: {restoreInfo.check.invoices} invoice number(s) and {restoreInfo.check.texts} description(s) can be put back
              {restoreInfo.check.createdAt ? ` (backup made ${format(new Date(restoreInfo.check.createdAt), "dd MMM yyyy HH:mm")})` : ""}.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Input value={restoreTyped} onChange={(e) => setRestoreTyped(e.target.value)} placeholder="Type RESTORE" aria-label="Type RESTORE to confirm" className="h-10 w-48 rounded-lg font-mono" />
              <Button onClick={restore} disabled={restoreTyped !== "RESTORE" || restoring} variant="outline" className="gap-2 border-rose-300 text-rose-700 hover:bg-rose-50">
                {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Restore the old numbers
              </Button>
            </div>
          </div>
        )}
        {restoreResult && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4" data-testid="restore-result">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> {restoreResult.message}
            </p>
            <Checks checks={restoreResult.data.checks} />
          </div>
        )}
      </section>
    </div>
  );
}
