import { useEffect, useState, useCallback } from "react";
import { CalendarIcon, Download, Filter, Search, X } from "lucide-react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import RangeCalendar from "../components/DragCalendar";

import DetailedReportTab from "../components/salesReport/detailedReport";
import RefundsTab from "../components/salesReport/refundReport";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const DATE_PRESETS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["last7days", "Last 7 days"],
  ["last30days", "Last 30 days"],
  ["thisMonth", "This month"],
  ["thisYear", "This year"],
];

const DEFAULT_PAGINATION = { total: 0, pages: 1 };
const DEFAULT_SUMMARY = { totalSell: 0, totalProfit: 0 };

// Everything a "search" submits. No date range by default — an unfiltered
// fetch just returns the latest entries (server-side default sort/limit);
// a range only kicks in once the user actually picks one.
const defaultFilters = () => ({
  search: "",
  searchBy: "all",
  dateRange: null,
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

  // `draft` is what the filter controls are bound to (edited freely, no
  // network effect). `applied` is the last submitted snapshot — every
  // fetch, and everything the table renders (highlighting, result counts),
  // is derived from `applied` only. They start out equal so the first
  // load uses sane defaults.
  const [draft, setDraft] = useState(defaultFilters);
  const [applied, setApplied] = useState(draft);
  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

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

  const handleDatePreset = (preset) => {
    const now = new Date();
    switch (preset) {
      case "today":
        setField("dateRange", { from: now, to: now });
        break;
      case "yesterday": {
        const y = subDays(now, 1);
        setField("dateRange", { from: y, to: y });
        break;
      }
      case "last7days":
        setField("dateRange", { from: subDays(now, 6), to: now });
        break;
      case "last30days":
        setField("dateRange", { from: subDays(now, 29), to: now });
        break;
      case "thisMonth":
        setField("dateRange", { from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "thisYear":
        setField("dateRange", { from: startOfYear(now), to: endOfYear(now) });
        break;
      default:
        break;
    }
  };

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
      const { search, dateRange, agent, branch, order } = applied;
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (dateRange?.from)
        params.set(fromKey, format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.set(toKey, format(dateRange.to, "yyyy-MM-dd"));
      // Only ever sent for users who can filter by agent/branch — everyone
      // else has no such dropdown (and no non-"all" value) to send.
      if (canFilterByAgent && agent !== "all") params.set(agentKey, agent);
      if (canViewAllBranches && branch !== "all")
        params.set("branchId", branch);
      params.set(orderKey, order);
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

  /* ── Lazy, tab-aware fetching. Fires on mount, on tab switch, on
     page/pageSize change, and whenever `applied` changes (Search/Clear) —
     all via the `fetchSales`/`fetchRefunds` identity changing. ── */
  useEffect(() => {
    if (activeTab === "detailed" && canViewSales) fetchSales();
  }, [activeTab, fetchSales, canViewSales]);

  useEffect(() => {
    if (activeTab === "refunds" && canViewRefunds) fetchRefunds();
  }, [activeTab, fetchRefunds, canViewRefunds]);

  // Submits the draft filters — the only point where a filter change
  // actually reaches the API.
  const runSearch = () => {
    setApplied(draft);
    setSalesPage(1);
  };

  const clearFilters = () => {
    const f = defaultFilters();
    setDraft(f);
    setApplied(f);
    setSalesPage(1);
  };

  const hasActiveFilters =
    draft.search ||
    draft.dateRange ||
    draft.agent !== "all" ||
    draft.branch !== "all" ||
    draft.order !== "desc";

  // Exports the currently loaded page of sales — matches what's on screen,
  // so it's keyed off `applied` (what was actually fetched), not `draft`.
  const exportCsv = () => {
    const headers = [
      "Date",
      "Invoice #",
      "Airline",
      "Document #",
      "Vendor",
      "Customer",
      "Agent",
      "Payment Type",
      "Pay Status",
      "Sell Price",
      "Status",
      "Remarks",
    ];
    const rows = salesData.map((s) => [
      s.date ? format(s.date, "yyyy-MM-dd") : "",
      s.invoiceNo,
      s.airlineCode,
      s.documentNo,
      s.vendorName,
      s.customerName || "Walk-in",
      s.createdByName,
      s.paymentType,
      s.paymentStatus,
      s.sellPrice?.toFixed(2),
      s.status,
      s.remarks || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const suffix = applied.dateRange
      ? `${format(applied.dateRange.from, "yyyyMMdd")}-${format(applied.dateRange.to, "yyyyMMdd")}`
      : format(new Date(), "yyyyMMdd");
    a.download = `sales-report-${suffix}.csv`;
    a.click();
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
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <p className="text-gray-600">
            Comprehensive sales analytics and performance metrics
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={activeTab !== "detailed" || !salesData.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Auto-fit: each filter claims a 180px+ column and wraps to as
              many rows as needed — no breakpoint/column-count bookkeeping. */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <div className="space-y-2">
              <Label>Search By</Label>
              <Select
                value={draft.searchBy}
                onValueChange={(v) => setField("searchBy", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="invoiceNumber">Invoice Number</SelectItem>
                  <SelectItem value="documentNumber">
                    Document Number
                  </SelectItem>
                  <SelectItem value="remarks">Remarks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Query</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={
                    draft.searchBy === "invoiceNumber"
                      ? "Search by invoice number..."
                      : draft.searchBy === "documentNumber"
                        ? "Search by document number..."
                        : draft.searchBy === "remarks"
                          ? "Search by remarks..."
                          : "Search across all fields..."
                  }
                  value={draft.search}
                  onChange={(e) => setField("search", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full min-w-0 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {draft.dateRange?.from
                        ? draft.dateRange.to
                          ? `${format(draft.dateRange.from, "dd MMM yy")} - ${format(draft.dateRange.to, "dd MMM yy")}`
                          : format(draft.dateRange.from, "dd MMM yy")
                        : "Pick a date range"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b grid grid-cols-2 gap-2">
                    {DATE_PRESETS.map(([key, label]) => (
                      <Button
                        key={key}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDatePreset(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <RangeCalendar
                    defaultMonth={draft.dateRange?.from}
                    selected={draft.dateRange}
                    onSelect={(range) => setField("dateRange", range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {canFilterByAgent && (
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select
                  value={draft.agent}
                  onValueChange={(v) => setField("agent", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
              </div>
            )}

            {canViewAllBranches && (
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={draft.branch}
                  onValueChange={(v) => setField("branch", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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
              </div>
            )}

            <div className="space-y-2">
              <Label>Sort</Label>
              <Select
                value={draft.order}
                onValueChange={(v) => setField("order", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Apply</Label>

              <div className="flex items-center gap-2">
                <Button
                  onClick={runSearch}
                  className="bg-gradient-primary min-w-[140px] h-8"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-8 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              searchQuery={applied.search}
              searchBy={applied.searchBy}
              totalSales={salesSummary.totalSell}
              totalProfit={salesSummary.totalProfit}
              page={salesPage}
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
              searchQuery={applied.search}
              searchBy={applied.searchBy}
            />
          </TabsContent>
        </Tabs>
      ) : canViewSales ? (
        <DetailedReportTab
          salesData={salesData}
          loading={loading}
          searchQuery={applied.search}
          searchBy={applied.searchBy}
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
          searchQuery={applied.search}
          searchBy={applied.searchBy}
        />
      )}
    </div>
  );
}
