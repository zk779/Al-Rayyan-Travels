"use client";

import { useEffect, useState } from "react";
import { History, User, Clock, FileText, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../shadcn/components/ui/dialog";
import { Badge } from "../../shadcn/components/ui/badge";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const initials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

/* ─── Trigger button ─────────────────────────────────────── */
export default function HistoryButton({ saleId, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors ${className}`}
      >
        <History className="h-3.5 w-3.5" /> History
      </button>
      <HistoryDialog saleId={saleId} open={open} onOpenChange={setOpen} />
    </>
  );
}

/* ─── Dialog ─────────────────────────────────────────────── */
export function HistoryDialog({ saleId, open, onOpenChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!open || !saleId) return;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/sales/${saleId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load history");
        setData(body.data);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [open, saleId, token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-indigo-600" /> Sale History
          </DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Loading history...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <div className="space-y-4">
            {/* Sale meta */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-mono font-medium text-slate-700">
                {data.invoiceNo}
              </span>
              {data.documentNo && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">{data.documentNo}</span>
                </>
              )}
              {data.pnr && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">PNR {data.pnr}</span>
                </>
              )}
            </div>

            {/* Edit count summary */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Timeline
              </span>
              <Badge
                variant="secondary"
                className={`text-xs ${
                  data.editCount > 0
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {data.editCount} {data.editCount === 1 ? "edit" : "edits"}
              </Badge>
            </div>

            {/* Timeline */}
            <div className="relative pl-5 space-y-4">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-200" />

              {/* Created entry */}
              <div className="relative">
                <div className="absolute -left-5 top-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div className="ml-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-emerald-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {initials(data.createdBy.userName)}
                    </div>
                    <span className="text-xs font-semibold text-emerald-800">
                      {data.createdBy.userName || "Unknown"}
                    </span>
                    <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 text-white border-none ml-auto">
                      Created
                    </Badge>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {fmtDate(data.createdBy.createdAt)}
                  </p>
                  {data.createdBy.userEmail && (
                    <p className="text-[11px] text-emerald-700/60">
                      {data.createdBy.userEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit entries */}
              {data.edits.length === 0 ? (
                <div className="relative">
                  <div className="absolute -left-5 top-0.5 h-4 w-4 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                  <p className="ml-2 text-xs text-slate-400 italic py-1">
                    No edits made yet
                  </p>
                </div>
              ) : (
                data.edits.map((e, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-5 top-0.5 h-4 w-4 rounded-full bg-amber-500 ring-4 ring-amber-50 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div className="ml-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/60">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-full bg-amber-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                          {initials(e.userName)}
                        </div>
                        <span className="text-xs font-semibold text-amber-800">
                          {e.userName || "Unknown"}
                        </span>
                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-600 text-white border-none ml-auto">
                          Edit #{data.edits.length - i}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-amber-700/80 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fmtDate(e.updatedAt)}
                      </p>
                      {e.userEmail && (
                        <p className="text-[11px] text-amber-700/60">{e.userEmail}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}