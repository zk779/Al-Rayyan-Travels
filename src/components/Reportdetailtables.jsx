"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Download, Receipt, Undo2, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Badge } from "../../shadcn/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import { money, downloadCsv } from "../utils/reportUtils";

const PAGE_SIZE = 10;

const STATUS_TONE = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  DUE: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

const StatusBadge = ({ value }) =>
  !value ? (
    <span className="text-slate-300">—</span>
  ) : (
    <Badge
      variant="outline"
      className={`font-medium ${STATUS_TONE[value] || "bg-slate-50 text-slate-600 border-slate-200"}`}
    >
      {value}
    </Badge>
  );

const fmtDate = (d) => (d ? format(new Date(d), "MMM dd, yyyy") : "—");

const TABS = [
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "refunds", label: "Refunds", icon: Undo2 },
  { key: "expenses", label: "Expenses", icon: Receipt },
];

function usePagedSearch(rows, searchFields) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((row) =>
      searchFields.some((f) => String(row[f] ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query, searchFields]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setQueryAndReset = (v) => {
    setQuery(v);
    setPage(1);
  };

  return { query, setQuery: setQueryAndReset, page: safePage, setPage, pageCount, filtered, paged };
}

function EmptyState({ label }) {
  return (
    <div className="py-16 text-center text-sm text-slate-400">{label}</div>
  );
}

function Pagination({ page, pageCount, setPage, total }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between px-1 pt-3 text-sm text-slate-500">
      <span>
        Page {page} of {pageCount} · {total} record{total === 1 ? "" : "s"}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= pageCount}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ReportDetailTables({ sales = [], refunds = [], expenses = [], loading }) {
  const [tab, setTab] = useState("sales");

  const salesSearch = usePagedSearch(sales, [
    "invoiceNumber",
    "customer",
    "vendor",
    "agent",
    "airline",
    "pnr",
  ]);
  const refundsSearch = usePagedSearch(refunds, [
    "invoiceNumber",
    "customer",
    "vendor",
    "agent",
    "refundReason",
  ]);
  const expensesSearch = usePagedSearch(expenses, ["category", "branchName", "agent", "description"]);

  const active = tab === "sales" ? salesSearch : tab === "refunds" ? refundsSearch : expensesSearch;

  const handleExport = () => {
    if (tab === "sales") {
      downloadCsv(
        `sales-detail-${format(new Date(), "yyyyMMdd-HHmm")}.csv`,
        ["Date", "Invoice #", "Airline", "Vendor", "Customer", "Agent", "Method", "Payment Status", "Status", "Net", "Sell", "VAT", "Profit", "Paid"],
        salesSearch.filtered.map((s) => [
          s.date ? format(new Date(s.date), "yyyy-MM-dd") : "",
          s.invoiceNumber,
          s.airline,
          s.vendor,
          s.customer || "Walk-in",
          s.agent,
          s.paymentMethod,
          s.paymentStatus,
          s.status,
          s.netPrice?.toFixed(2),
          s.sellPrice?.toFixed(2),
          s.vatTotal?.toFixed(2),
          s.profit?.toFixed(2),
          s.paidAmount?.toFixed(2),
        ]),
      );
    } else if (tab === "refunds") {
      downloadCsv(
        `refunds-detail-${format(new Date(), "yyyyMMdd-HHmm")}.csv`,
        ["Date", "Invoice #", "Vendor", "Customer", "Agent", "Status", "Original", "Customer Refund", "Vendor Refund", "Fee", "Cancellation Charges", "Net Cost"],
        refundsSearch.filtered.map((r) => [
          r.date ? format(new Date(r.date), "yyyy-MM-dd") : "",
          r.invoiceNumber,
          r.vendor,
          r.customer,
          r.agent,
          r.status,
          r.originalAmount?.toFixed(2),
          r.customerRefundAmount?.toFixed(2),
          r.vendorRefundAmount?.toFixed(2),
          r.refundFee?.toFixed(2),
          r.cancellationCharges?.toFixed(2),
          r.netCostToUs?.toFixed(2),
        ]),
      );
    } else {
      downloadCsv(
        `expenses-detail-${format(new Date(), "yyyyMMdd-HHmm")}.csv`,
        ["Date", "Category", "Branch", "Payment Mode", "Agent", "Amount", "Description"],
        expensesSearch.filtered.map((e) => [
          e.expenseDate ? format(new Date(e.expenseDate), "yyyy-MM-dd") : "",
          e.category,
          e.branchName,
          e.paymentMode,
          e.agent,
          e.amount?.toFixed(2),
          e.description,
        ]),
      );
    }
  };

  const summary = useMemo(() => {
    if (tab === "sales") {
      const rows = salesSearch.filtered;
      return [
        { label: "Sell total", value: money(rows.reduce((s, r) => s + (r.sellPrice || 0), 0)) },
        { label: "Profit total", value: money(rows.reduce((s, r) => s + (r.profit || 0), 0)) },
        { label: "VAT total", value: money(rows.reduce((s, r) => s + (r.vatTotal || 0), 0)) },
      ];
    }
    if (tab === "refunds") {
      const rows = refundsSearch.filtered;
      return [
        { label: "Refunded to customers", value: money(rows.reduce((s, r) => s + (r.netRefundToCustomer || 0), 0)) },
        { label: "Cancellation charges", value: money(rows.reduce((s, r) => s + (r.cancellationCharges || 0), 0)) },
      ];
    }
    const rows = expensesSearch.filtered;
    return [{ label: "Expense total", value: money(rows.reduce((s, r) => s + (r.amount || 0), 0)) }];
  }, [tab, salesSearch.filtered, refundsSearch.filtered, expensesSearch.filtered]);

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-base">Transaction Details</CardTitle>
          <CardDescription>Full row-level detail behind the summary above</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export {TABS.find((t) => t.key === tab)?.label} CSV
        </Button>
      </CardHeader>
      <CardContent>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 border-b border-slate-100 mb-4">
          {TABS.map(({ key, label, icon: Icon }) => {
            const count = key === "sales" ? sales.length : key === "refunds" ? refunds.length : expenses.length;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span className="text-xs text-slate-400">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search + summary chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={active.query}
              onChange={(e) => active.setQuery(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.map((s) => (
              <Badge key={s.label} variant="secondary" className="bg-slate-50 text-slate-600 font-normal">
                {s.label}: <span className="ml-1 font-semibold text-slate-800">{s.value}</span>
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading transaction detail…</div>
        ) : (
          <>
            {tab === "sales" &&
              (salesSearch.paged.length === 0 ? (
                <EmptyState label="No sales match this filter." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Airline</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Sell</TableHead>
                        <TableHead className="text-right">VAT</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesSearch.paged.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="whitespace-nowrap text-slate-500">{fmtDate(s.date)}</TableCell>
                          <TableCell className="font-medium">{s.invoiceNumber || "—"}</TableCell>
                          <TableCell>{s.airline}</TableCell>
                          <TableCell>{s.vendor}</TableCell>
                          <TableCell>
                            {s.customer || <span className="italic text-slate-400">Walk-in</span>}
                          </TableCell>
                          <TableCell>{s.agent}</TableCell>
                          <TableCell className="text-slate-500">{s.paymentMethod?.replace("_", " ")}</TableCell>
                          <TableCell>
                            <StatusBadge value={s.paymentStatus} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={s.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{money(s.sellPrice)}</TableCell>
                          <TableCell className="text-right tabular-nums text-slate-500">{money(s.vatTotal)}</TableCell>
                          <TableCell
                            className={`text-right tabular-nums font-medium ${s.profit < 0 ? "text-rose-600" : "text-emerald-700"}`}
                          >
                            {money(s.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}

            {tab === "refunds" &&
              (refundsSearch.paged.length === 0 ? (
                <EmptyState label="No refunds match this filter." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Original</TableHead>
                        <TableHead className="text-right">To Customer</TableHead>
                        <TableHead className="text-right">Cancellation Chg.</TableHead>
                        <TableHead className="text-right">Net Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refundsSearch.paged.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-slate-500">{fmtDate(r.date)}</TableCell>
                          <TableCell className="font-medium">{r.invoiceNumber}</TableCell>
                          <TableCell>{r.vendor}</TableCell>
                          <TableCell>{r.customer}</TableCell>
                          <TableCell>{r.agent}</TableCell>
                          <TableCell>
                            <StatusBadge value={r.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{money(r.originalAmount)}</TableCell>
                          <TableCell className="text-right tabular-nums">{money(r.netRefundToCustomer)}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-700">
                            {money(r.cancellationCharges)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-rose-600">
                            {money(r.netCostToUs)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}

            {tab === "expenses" &&
              (expensesSearch.paged.length === 0 ? (
                <EmptyState label="No expenses match this filter." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expensesSearch.paged.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="whitespace-nowrap text-slate-500">{fmtDate(e.expenseDate)}</TableCell>
                          <TableCell className="font-medium">{e.category?.replace(/_/g, " ")}</TableCell>
                          <TableCell>{e.branchName}</TableCell>
                          <TableCell className="text-slate-500">{e.paymentMode?.replace("_", " ")}</TableCell>
                          <TableCell>{e.agent}</TableCell>
                          <TableCell className="text-slate-500 max-w-[220px] truncate">{e.description || "—"}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-rose-600">
                            {money(e.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}

            <Pagination
              page={active.page}
              pageCount={active.pageCount}
              setPage={active.setPage}
              total={active.filtered.length}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}