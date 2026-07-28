import { useEffect, useState, useCallback } from "react";
import { CalendarIcon, Download, Filter, Search } from "lucide-react";
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
import DragRangeCalendar from "../components/DragCalendar";

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

// Delays updating the returned value until `value` stops changing for
// `delay`ms — keeps the search input snappy while avoiding a network
// request on every keystroke.
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SalesReport() {
  // RBAC — permission flags for the two tabs
  const { hasPermission } = useAuth();
  const canViewSales = hasPermission("SALE_READ");
  const canViewRefunds = hasPermission("REFUND_READ");

  // Default to whichever tab the user actually has access to
  const [activeTab, setActiveTab] = useState(
    canViewSales ? "detailed" : canViewRefunds ? "refunds" : null
  );
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest first

  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("all"); // drives placeholder text only —
  // the API already searches invoiceNo/documentNo/remarks together
  const debouncedSearch = useDebouncedValue(searchQuery);

  const [users, setUsers] = useState([]);

  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState(DEFAULT_SUMMARY);
  const [salesPagination, setSalesPagination] = useState(DEFAULT_PAGINATION);
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(20);
  const [loading, setLoading] = useState(false);

  const [refundData, setRefundData] = useState([]);
  const [refundLoading, setRefundLoading] = useState(false);

  const handleDatePreset = (preset) => {
    const now = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: now, to: now });
        break;
      case "yesterday": {
        const y = subDays(now, 1);
        setDateRange({ from: y, to: y });
        break;
      }
      case "last7days":
        setDateRange({ from: subDays(now, 6), to: now });
        break;
      case "last30days":
        setDateRange({ from: subDays(now, 29), to: now });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "thisYear":
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      default:
        break;
    }
  };

  /* ── Users list, once, for the Agent dropdown ── */
  useEffect(() => {
    fetch(`${API_BASE}/api/users`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUsers(json.data || []);
      })
      .catch(() => {});
  }, []);

  /* ── Shared query-string builder for both endpoints ──────────────────
     Each endpoint names its date/agent/order params slightly differently
     (dateFrom/dateTo/createdById/order for sales vs.
      startDate/endDate/processedById/sortOrder for refunds), so the
     caller passes the right key names in. */
  const buildParams = useCallback(
    ({ fromKey, toKey, agentKey, orderKey }) => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (dateRange?.from) params.set(fromKey, format(dateRange.from, "yyyy-MM-dd"));
      if (dateRange?.to) params.set(toKey, format(dateRange.to, "yyyy-MM-dd"));
      if (selectedAgent !== "all") params.set(agentKey, selectedAgent);
      params.set(orderKey, sortOrder);
      // Tells the API which local day dateFrom/dateTo actually mean — the
      // app runs across multiple regions, so this must be the viewer's own
      // timezone rather than a fixed one baked into the backend.
      params.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone);
      return params.toString();
    },
    [debouncedSearch, dateRange, selectedAgent, sortOrder],
  );

  // Any filter change invalidates the current page — jump back to page 1
  // rather than risk landing on a page that no longer exists.
  useEffect(() => {
    setSalesPage(1);
  }, [debouncedSearch, dateRange, selectedAgent, sortOrder, salesPageSize]);

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
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch sales");

      // Rows already arrive in the shape the table & the expanded detail
      // view both need — just tag on a real Date for display/sorting.
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
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to fetch refunds");

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

  /* ── Lazy, tab-aware fetching ──────────────────────────────────────
     Sales load by default (the initial active tab). Refunds only fetch
     once the Refunds tab is actually opened, and both re-fetch whenever
     a filter (or the sales page/page size) changes while their tab is
     the one currently in view. */
  useEffect(() => {
    if (activeTab === "detailed" && canViewSales) fetchSales(); // RBAC guard
  }, [activeTab, fetchSales, canViewSales]);

  useEffect(() => {
    if (activeTab === "refunds" && canViewRefunds) fetchRefunds(); // RBAC guard
  }, [activeTab, fetchRefunds, canViewRefunds]);

  const clearFilters = () => {
    setSearchQuery("");
    setSearchBy("all");
    setSelectedAgent("all");
    setSortOrder("desc");
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
  };

  const hasActiveFilters =
    searchQuery || selectedAgent !== "all" || sortOrder !== "desc";

  // Exports the currently loaded page of sales — matches what's on screen.
  const exportCsv = () => {
    const headers = [
      "Date", "Invoice #", "Airline", "Document #", "Vendor", "Customer",
      "Agent", "Payment Type", "Pay Status", "Sell Price", "Status", "Remarks",
    ];
    const rows = salesData.map((s) => [
      s.date ? format(s.date, "yyyy-MM-dd") : "",
      s.invoiceNo, s.airlineCode, s.documentNo, s.vendorName,
      s.customerName || "Walk-in", s.createdByName, s.paymentType,
      s.paymentStatus, s.sellPrice?.toFixed(2), s.status, s.remarks || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sales-report-${format(dateRange.from, "yyyyMMdd")}-${format(dateRange.to, "yyyyMMdd")}.csv`;
    a.click();
  };

  // RBAC — if user has neither permission, show a simple empty state
  // (this should rarely happen since PermissionRoute already gates the whole
  // page, but it's a sane fallback in case route permissions and tab
  // permissions ever diverge)
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
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2 w-full sm:w-1/3 lg:w-1/6">
              <Label>Search By</Label>
              <Select value={searchBy} onValueChange={setSearchBy}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="invoiceNumber">Invoice Number</SelectItem>
                  <SelectItem value="documentNumber">Document Number</SelectItem>
                  <SelectItem value="remarks">Remarks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 w-full sm:w-1/3 lg:w-1/4">
              <Label>Search Query</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={
                    searchBy === "invoiceNumber"
                      ? "Search by invoice number..."
                      : searchBy === "documentNumber"
                        ? "Search by document number..."
                        : searchBy === "remarks"
                          ? "Search by remarks..."
                          : "Search across all fields..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <div className="space-y-2 w-full sm:w-1/4 lg:w-1/6">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
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
                  {/* Drag-to-select range calendar (mousedown a start date,
                      drag to an end date, release to commit) replaces the
                      old click-click react-day-picker Calendar. */}
                  <DragRangeCalendar
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 w-full sm:w-1/4 lg:w-1/6">
              <Label>Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
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

            <div className="space-y-2 w-full sm:w-1/4 lg:w-1/6">
              <Label>Sort</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      {/* RBAC — if only one permission is granted, skip the Tabs UI entirely
          and just render that single tab's content directly (no tab switcher needed) */}
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
              searchQuery={searchQuery}
              searchBy={searchBy}
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
              searchQuery={searchQuery}
              searchBy={searchBy}
            />
          </TabsContent>
        </Tabs>
      ) : canViewSales ? (
        <DetailedReportTab
          salesData={salesData}
          loading={loading}
          searchQuery={searchQuery}
          searchBy={searchBy}
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
          searchQuery={searchQuery}
          searchBy={searchBy}
        />
      )}
    </div>
  );
}