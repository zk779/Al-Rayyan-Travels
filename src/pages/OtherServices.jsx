"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileStack,
  Pencil,
  Percent,
  Plus,
  Receipt,
  Search,
  SaudiRiyal,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { appToast } from "../../shadcn/components/ui/appToast";
import CustomAlertDialog from "../components/CustomAlertDialog";
import BackToServices from "../components/BackToServices";
import { SERVICE_TYPES, serviceOf } from "../components/otherServices/serviceTypes";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 15;
const money = (n) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Stat = ({ icon: Icon, label, labelAr, value, money: isMoney = true, tone }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <span className={`grid h-8 w-8 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span>
        {label}
        <span className="ms-1.5 text-[10px] text-slate-400" dir="rtl">
          {labelAr}
        </span>
      </span>
    </div>
    <p className="mt-3 flex items-center gap-1 text-2xl font-bold tabular-nums text-slate-900">
      {isMoney && <SaudiRiyal className="h-5 w-5 opacity-50" />}
      {isMoney ? money(value) : value}
    </p>
  </div>
);

/** Other Services: invoices for transportation, Umrah visa, NADRA … (their own list, not sales). */
export default function OtherServices() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("SALE_CREATE");
  const canEdit = hasPermission("SALE_EDIT");
  const canDelete = hasPermission("SALE_DELETE");
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ count: 0, netAmount: 0, vatAmount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [serviceType, setServiceType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
        if (debounced) qs.set("search", debounced);
        if (serviceType !== "all") qs.set("serviceType", serviceType);
        if (dateFrom) qs.set("dateFrom", dateFrom);
        if (dateTo) qs.set("dateTo", dateTo);
        const res = await fetch(`${API_BASE}/api/other-services?${qs}`, { headers, signal });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to load the invoices");
        setRows(json.data || []);
        setSummary(json.summary || { count: 0, netAmount: 0, vatAmount: 0, total: 0 });
        setPage(1);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [debounced, serviceType, dateFrom, dateTo, headers],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtered = !!debounced || serviceType !== "all" || !!dateFrom || !!dateTo;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/other-services/${deleteTarget.id}`, { method: "DELETE", headers });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete");
      appToast.success(`Invoice ${deleteTarget.invoiceNo} deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      appToast.error(err.message || "Failed to delete the invoice");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full space-y-6 pb-10">
      <div className="flex justify-end">
        <BackToServices />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg md:p-7">
        <div className="pointer-events-none absolute -right-14 -top-16 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <FileStack size={26} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Other Services</h1>
              <p className="text-sm text-slate-400" dir="rtl">
                خدمات أخرى
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Invoices for transportation, Umrah visa, NADRA and more.</p>
            </div>
          </div>
          {canCreate && (
            <Button asChild className="h-11 gap-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100">
              <Link to="/other-services/new">
                <Plus className="h-4 w-4" /> New invoice
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Receipt} label="Invoices" labelAr="الفواتير" value={summary.count} money={false} tone="bg-slate-100 text-slate-600" />
        <Stat icon={Wallet} label="Amount excl. VAT" labelAr="بدون الضريبة" value={summary.netAmount} tone="bg-indigo-50 text-indigo-600" />
        <Stat icon={Percent} label="VAT 15%" labelAr="الضريبة" value={summary.vatAmount} tone="bg-amber-50 text-amber-600" />
        <Stat icon={SaudiRiyal} label="Grand total" labelAr="الإجمالي" value={summary.total} tone="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice no., customer, reference, phone…"
              aria-label="Search"
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" className="h-10 w-[150px] rounded-xl" />
            <span className="text-xs text-slate-400">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" className="h-10 w-[150px] rounded-xl" />
          </div>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setServiceType("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[{ key: "all", label: "All services" }, ...SERVICE_TYPES].map((s) => {
            const on = serviceType === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setServiceType(s.key)}
                aria-pressed={on}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
                  on ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {error && <p className="px-5 py-4 text-sm text-red-600">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-right">Excl. VAT</th>
                <th className="px-4 py-3 text-right">VAT 15%</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && rows.length === 0 &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <FileStack className="mx-auto h-9 w-9 text-slate-200" />
                    <p className="mt-2 text-sm font-medium text-slate-500">{filtered ? "No invoices match these filters" : "No invoices yet"}</p>
                    {!filtered && canCreate && (
                      <Link to="/other-services/new" className="mt-1 inline-block text-xs font-medium text-slate-700 underline">
                        Create the first one
                      </Link>
                    )}
                  </td>
                </tr>
              )}
              {paged.map((r) => {
                const s = serviceOf(r.serviceType);
                return (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{format(new Date(r.invoiceDate), "dd MMM yyyy")}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{r.invoiceNo}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${s.tone.badge}`}>
                        <s.icon className="h-3 w-3" />
                        {s.label}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="truncate font-medium text-slate-800" title={r.customerName}>
                        {r.customerName}
                      </p>
                      {r.customerPhone && <p className="truncate text-[11px] text-slate-400">{r.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.referenceNo || "—"}</td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-600">{money(r.netAmount)}</td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-600">{money(r.vatAmount)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900">{money(r.total)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <button type="button" title="View / print" aria-label="View invoice" onClick={() => navigate(`/other-services/${r.id}`)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      {canEdit && (
                        <button type="button" title="Edit" aria-label="Edit invoice" onClick={() => navigate(`/other-services/${r.id}/edit`)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button type="button" title="Delete" aria-label="Delete invoice" onClick={() => setDeleteTarget(r)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {canDelete && (
        <CustomAlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          title="Delete this invoice?"
          description={`Invoice ${deleteTarget?.invoiceNo || ""} for ${deleteTarget?.customerName || ""} will be permanently removed. Its number is not reused.`}
          onConfirm={confirmDelete}
          loading={deleting}
          variant="danger"
          confirmText="Delete"
        />
      )}
    </div>
  );
}
