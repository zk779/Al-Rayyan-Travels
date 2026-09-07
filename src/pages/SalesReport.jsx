import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Filter, Search, X, RefreshCw, Check, ChevronUp } from "lucide-react";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Badge } from "../../shadcn/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import DateRangeInputs from "../components/DateRangeInputs";

import DetailedReportTab from "../components/salesReport/detailedReport";
import RefundsTab from "../components/salesReport/refundReport";
import ExportSalesReport from "../components/salesReport/ExportSalesReport";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const DEFAULT_PAGINATION = { total: 0, pages: 1 };
const DEFAULT_SUMMARY = { totalSell: 0, totalProfit: 0 };

// Start date is left blank on purpose — nothing loads until the user picks
// one (or toggles "All time") and hits Search. End date defaults to today.
const defaultDateRange = () => ({ from: new Date() , to: new Date() });
const defaultFilters = () => ({
  search: "",
  searchBy: "all",
  agent: "all",
  branch: "all",
  order: "desc", // desc = newest first
});

export default function SalesReport() {
  const { hasPermission } = useAuth();
  const canViewSales = hasPermission("SALE_READ");
  const canViewRefunds = hasPermission("REFUND_READ");
  const canViewAllBranches = hasPermission("SALE_VIEW_ALL");
  const canFilterByAgent =
    hasPermission("SALE_VIEW_BRANCH") || hasPermission("SALE_VIEW_ALL");

  // Default to whichever tab the user actually has access to
  const [activeTab, setActiveTab] = useState(
    canViewSales ? "detailed" : canViewRefunds ? "refunds" : null,
  );

  // `draft*` is what the filter controls are bound to (edited freely, no
  // network effect). `applied` is the last submitted snapshot — every
  // fetch, and everything the tables render (highlighting, result counts),
  // is derived from `applied` only.
  const [draftAllTime, setDraftAllTime] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState(defaultDateRange);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const setField = (key, value) =>
    setDraftFilters((f) => ({ ...f, [key]: value }));

  const [applied, setApplied] = useState(() => ({
    allTime: draftAllTime,
    dateRange: draftDateRange,
    filters: draftFilters,
  }));

  // Nothing has been searched yet — no start date was ever chosen (or "All
  // time" toggled) and Search hasn't been pressed, so both tabs stay empty
  // rather than auto-loading a default range.
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState(DEFAULT_SUMMARY);
  const [salesPagination, setSalesPagination] = useState(DEFAULT_PAGINATION);
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [refundData, setRefundData] = useState([]);
  const [refundLoading, setRefundLoading] = useState(false);

  /* ── Agent list, once, for the Agent dropdown ── */
  useEffect(() => {
    if (!canFilterByAgent) return;
    fetch(`${API_BASE}/api/users`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUsers(json.data || []);
      })
      .catch(() => {});
  }, [canFilterByAgent]);

  /* ── Branch list, once, for the Branch dropdown (SALE_VIEW_ALL only) ── */
  useEffect(() => {
    if (!canViewAllBranches) return;
    fetch(`${API_BASE}/api/branches`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBranches(json.data || []);
      })
      .catch(() => {});
  }, [canViewAllBranches]);

  /* ── Shared query-string builder, driven ONLY by `applied` ── */
  const buildParams = useCallback(
    ({ fromKey, toKey, agentKey, orderKey }) => {
      const { filters, dateRange, allTime } = applied;
      const params = new URLSearchParams();
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (!allTime && dateRange?.from)
        params.set(fromKey, format(dateRange.from, "yyyy-MM-dd"));
      if (!allTime && dateRange?.to)
        params.set(toKey, format(dateRange.to, "yyyy-MM-dd"));
      // Only ever sent for users who can filter by agent/branch — everyone
      // else has no such dropdown (and no non-"all" value) to send.
      if (canFilterByAgent && filters.agent !== "all")
        params.set(agentKey, filters.agent);
      if (canViewAllBranches && filters.branch !== "all")
        params.set("branchId", filters.branch);
      params.set(orderKey, filters.order);
      params.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone);
      return params.toString();
    },
    [applied, canFilterByAgent, canViewAllBranches],
  );

  // Page size is a display control, not a submitted filter — reset to
  // page 1 immediately rather than waiting on Search.
  useEffect(() => {
    setSalesPage(1);
  }, [salesPageSize]);

  /* ── Fetch sales — filtered & paginated server-side ── */
  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildParams({
        fromKey: "dateFrom",
        toKey: "dateTo",
        agentKey: "createdById",
        orderKey: "order",
      });
      const res = await fetch(
        `${API_BASE}/api/sales?${qs}&page=${salesPage}&limit=${salesPageSize}`,
        { headers: authHeaders() },
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to fetch sales");
      setSalesData(
        (json.data || []).map((s) => ({
          ...s,
          date: s.saleDate ? new Date(s.saleDate) : null,
        })),
      );
      setSalesPagination(json.pagination || DEFAULT_PAGINATION);
      setSalesSummary(json.summary || DEFAULT_SUMMARY);
    } catch (err) {
      console.error("Failed to fetch sales", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams, salesPage, salesPageSize]);

  /* ── Fetch refunds — filtered server-side ── */
  const fetchRefunds = useCallback(async () => {
    setRefundLoading(true);
    try {
      const qs = buildParams({
        fromKey: "startDate",
        toKey: "endDate",
        agentKey: "processedById",
        orderKey: "sortOrder",
      });
      const res = await fetch(`${API_BASE}/api/refunds?${qs}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || "Failed to fetch refunds");

      const flattened = (json.data || []).map((refund) => ({
        id: refund.id,
        saleId: refund.saleId,
        date: refund.refundDate ? new Date(refund.refundDate) : null,
        status: refund.status || "-",
        originalAmount: Number(refund.originalSaleAmount || 0),
        customerRefundAmount: Number(refund.customerRefundAmount || 0),
        vendorRefundAmount: Number(refund.vendorRefundAmount || 0),
        refundFee: Number(refund.refundFee || 0),
        cancellationCharges: Number(refund.cancellationCharges || 0),
        netRefundToCustomer: Number(refund.netRefundToCustomer || 0),
        netCostToUs: Number(refund.netCostToUs || 0),
        refundReason: refund.refundReason || "",
        remarks: refund.remarks || "",
        vendor: refund.sale?.vendor?.vendorName || "-",
        customer: refund.sale?.customer?.customerName || "-",
        invoiceNumber: refund.sale?.invoice?.invoiceNo || "-",
        netPrice: Number(refund.sale?.netPrice || 0),
        sellPrice: Number(refund.sale?.sellPrice || 0),
        agent: refund.processedBy?.fullName || "-",
      }));

      setRefundData(flattened);
    } catch (err) {
      console.error("Failed to fetch refunds", err);
      alert(err.message);
    } finally {
      setRefundLoading(false);
    }
  }, [buildParams]);

  /* ── Lazy, tab-aware fetching. Fires on tab switch, page/pageSize change,
     and whenever `applied` changes (Search) — all via the fetchSales/
     fetchRefunds identity changing. Gated on `hasSearched` so nothing loads
     before the user's first Search. ── */
  useEffect(() => {
    if (activeTab === "detailed" && canViewSales && hasSearched) fetchSales();
  }, [activeTab, fetchSales, canViewSales, hasSearched]);

  useEffect(() => {
    if (activeTab === "refunds" && canViewRefunds && hasSearched)
      fetchRefunds();
  }, [activeTab, fetchRefunds, canViewRefunds, hasSearched]);

  // A start date (or "All time") is required — nothing to search otherwise.
  const canApply = draftAllTime || !!draftDateRange.from;

  // Submits the draft filters — the only point where a filter change
  // actually reaches the API.
  const runSearch = () => {
    if (!canApply) return;
    setApplied({
      allTime: draftAllTime,
      dateRange: draftDateRange,
      filters: draftFilters,
    });
    setSalesPage(1);
    setHasSearched(true);
  };

  // Draft differs from what's actually been fetched — the Search button
  // highlights this so it's obvious there are unapplied changes.
  const isDirty =
    draftAllTime !== applied.allTime ||
    draftDateRange.from?.getTime() !== applied.dateRange.from?.getTime() ||
    draftDateRange.to?.getTime() !== applied.dateRange.to?.getTime() ||
    Object.entries(draftFilters).some(([k, v]) => applied.filters[k] !== v);

  // Scoped to just the Advanced Filters panel — Search/Date/Branch/Agent
  // live in the header and aren't touched by this "Clear all".
  const hasActiveFilters =
    draftFilters.searchBy !== "all" || draftFilters.order !== "desc";
  const clearFilters = () => {
    const next = { ...draftFilters, searchBy: "all", order: "desc" };
    setDraftFilters(next);
    setApplied((a) => ({ ...a, filters: next }));
    setSalesPage(1);
  };
  const advancedActiveCount =
    (applied.filters.searchBy !== "all" ? 1 : 0) +
    (applied.filters.order !== "desc" ? 1 : 0);

  const activeLoading = activeTab === "detailed" ? loading : refundLoading;
  const handleRefresh = () => {
    if (activeTab === "detailed") fetchSales();
    else if (activeTab === "refunds") fetchRefunds();
  };

  // RBAC — if user has neither permission, show a simple empty state
  if (!canViewSales && !canViewRefunds) {
    return (
      <div className="w-full mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            You don't have permission to view any report data.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-gray-600">
            Comprehensive sales analytics.
          </p>
        </div>

        {/* Main filters — the ones adjusted most often live right in the
            header. Search By / Sort are one hover away in Advanced Filters. */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1 w-[170px] focus-within:w-[250px] transition-[width] duration-200 focus:*:ring-1 focus:*:ring-offset-1">
            <Label className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                value={draftFilters.search}
                onChange={(e) => setField("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Invoice, doc # or remarks"
                className="pl-8 h-8 text-sm w-full"
              />
            </div>
          </div>

          <DateRangeInputs
            from={draftDateRange.from}
            to={draftDateRange.to}
            onChange={(range) => {
              setDraftAllTime(false);
              setDraftDateRange(range);
            }}
            disabled={draftAllTime}
            compact
          />
          <button
            type="button"
            onClick={() => setDraftAllTime((v) => !v)}
            title="Show every record, ignoring the date range"
            className={`h-8 px-2 rounded-md text-xs font-medium border transition-colors ${
              draftAllTime
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            All time
          </button>

          {canFilterByAgent && (
            <Select
              value={draftFilters.agent}
              onValueChange={(v) => setField("agent", v)}
            >
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {canViewAllBranches && (
            <Select
              value={draftFilters.branch}
              onValueChange={(v) => setField("branch", v)}
            >
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            size="sm"
            onClick={runSearch}
            disabled={!canApply}
            title={canApply ? undefined : "Pick a date range(or All time) first"}
            className="relative gap-1.5 bg-gradient-primary"
          >
            <Search className="h-3.5 w-3.5" /> Search
            {isDirty && canApply && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={!hasSearched || activeLoading}
            title="Refresh"
            className="h-8 w-8"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${activeLoading ? "animate-spin" : ""}`}
            />
          </Button>

          {/* Advanced Filters — icon-only, expands to show its label on
              hover; click toggles the panel below. */}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            title="Advance Filters"
            className={`group flex items-center h-8 gap-1.5 px-2 rounded-md border text-sm transition-colors ${
              filtersOpen
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-0 group-hover:max-w-[110px] opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-200 font-medium">
              Advance Filters
            </span>
            {advancedActiveCount > 0 && (
              <Badge
                variant="secondary"
                className="h-4 px-1 text-[10px] font-semibold"
              >
                {advancedActiveCount}
              </Badge>
            )}
          </button>
          {/* <ExportSalesReport
            sales={salesData}
            disabled={activeTab !== "detailed" || !salesData.length}
            activeTab={activeTab}
          /> */}

        </div>
      </div>

      {/* Advanced Filters — opened via the header's hover icon, not a modal;
          fully hidden when closed so it costs no space. Shares the same
          draft/Search flow as the header's main filters. */}
      {filtersOpen && (
        <Card className="border-slate-200 gap-0! py-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="h-3.5 w-3.5" /> Advanced Filters
              </CardTitle>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Hide <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-1">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">
                  Search By
                </Label>
                <Select
                  value={draftFilters.searchBy}
                  onValueChange={(v) => setField("searchBy", v)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="invoiceNumber">
                      Invoice Number
                    </SelectItem>
                    <SelectItem value="documentNumber">
                      Document Number
                    </SelectItem>
                    <SelectItem value="remarks">Remarks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">
                  Sort
                </Label>
                <Select
                  value={draftFilters.order}
                  onValueChange={(v) => setField("order", v)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest first</SelectItem>
                    <SelectItem value="asc">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-500 h-7"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear all
                </Button>
              ) : (
                <span />
              )}

              <Button
                size="sm"
                onClick={runSearch}
                disabled={!canApply}
                className="relative gap-1.5 bg-gradient-primary"
              >
                <Check className="h-3.5 w-3.5" /> Search
                {isDirty && canApply && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {canViewSales && canViewRefunds ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
          </TabsList>

          <TabsContent value="detailed">
            <DetailedReportTab
              salesData={salesData}
              loading={loading}
              hasSearched={hasSearched}
              searchQuery={applied.filters.search}
              searchBy={applied.filters.searchBy}
              totalSales={salesSummary.totalSell}
              totalProfit={salesSummary.totalProfit}
              page={salesPage}
              activeTab={activeTab}
              pageSize={salesPageSize}
              total={salesPagination.total}
              totalPages={salesPagination.pages}
              onPageChange={setSalesPage}
              onPageSizeChange={setSalesPageSize}
            />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundsTab
              refundData={refundData}
              loading={refundLoading}
              hasSearched={hasSearched}
              searchQuery={applied.filters.search}
              searchBy={applied.filters.searchBy}
            />
          </TabsContent>
        </Tabs>
      ) : canViewSales ? (
        <DetailedReportTab
          salesData={salesData}
          loading={loading}
          hasSearched={hasSearched}
          searchQuery={applied.filters.search}
          searchBy={applied.filters.searchBy}
          totalSales={salesSummary.totalSell}
          totalProfit={salesSummary.totalProfit}
          page={salesPage}
          pageSize={salesPageSize}
          total={salesPagination.total}
          totalPages={salesPagination.pages}
          onPageChange={setSalesPage}
          onPageSizeChange={setSalesPageSize}
        />
      ) : (
        <RefundsTab
          refundData={refundData}
          loading={refundLoading}
          hasSearched={hasSearched}
          searchQuery={applied.filters.search}
          searchBy={applied.filters.searchBy}
        />
      )}
    </div>
  );
}
