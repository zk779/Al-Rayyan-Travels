import { useEffect, useMemo, useState } from "react";
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
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { cn } from "../../shadcn/lib/utils";

import DetailedReportTab from "../components/salesReport/detailedReport";
import BranchReportTab from "../components/salesReport/branchReport";
import RefundsTab from "../components/salesReport/refundReport";

/* ===========================
   MOCK REFUNDS (UNCHANGED)
=========================== */

export const mockRefundData = [
  {
    id: "1",
    date: "2024-03-15",
    invoiceNumber: "INV-001234",
    documentNumber: "RF001234",
    airline: "AA",
    customer: "Mark Davis",
    originalAmount: 520.0,
    refundFee: 50.0,
    serviceCharge: 20.0,
    refundAmount: 450.0,
    agent: "Sarah Johnson",
    branch: "Main Branch",
    status: "Processed",
    remarks: "Customer requested full refund",
  },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function SalesReport() {
  const [activeTab, setActiveTab] = useState("detailed");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [selectedAirline, setSelectedAirline] = useState("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("all");

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===========================
     DATE PRESETS
  =========================== */

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

  /* ===========================
     FETCH SALES FROM API
  =========================== */

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      /**
       * API format:
       * invoice: { invoiceNo, saleDate, sales:[{ vendorName, airlineCode, paymentType, customerName... }] }
       *
       * Flatten invoice -> sale rows for the detailed table
       */
      const flattened = (json.data || []).flatMap((inv) => {
        const invDate = inv.saleDate ? new Date(inv.saleDate) : null;

        return (inv.sales || []).map((sale) => {
          const customerLabel = sale.customerName
            ? `${sale.customerName}`
            : "-";

          return {
            id: sale.id,
            invoiceId: inv.id,
            date: invDate,
            invoiceNumber: inv.invoiceNo,
            documentNumber: sale.documentNo || sale.id, // if backend adds later, it will show
            airline: sale.airlineCode || "-",

            // ✅ NEW: separate vendor & customer (previously customer was vendorName)
            vendor: sale.vendorName || "-",
            customer: customerLabel,
            customerId: sale.customerId || null,

            paymentMethod: sale.paymentType || "-",
            status: sale.status || "-",

            netPrice: Number(sale.netPrice || 0),
            sellPrice: Number(sale.sellPrice || 0),
            profit: Number(sale.profit || 0),

            // placeholders (until you add them in API)
            agent: inv.createdByName,
            branch: "-",
            remarks: sale.remarks || "",
          };
        });
      });

      setSalesData(flattened);
    } catch (err) {
      console.error("Failed to fetch sales", err);
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     METRICS (USING DYNAMIC DATA)
  =========================== */

  const totalSales = useMemo(
    () =>
      salesData.reduce((sum, sale) => sum + (Number(sale.sellPrice) || 0), 0),
    [salesData]
  );

  const totalProfit = useMemo(
    () => salesData.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0),
    [salesData]
  );

  /* ===========================
     FILTER LOGIC (NOW WORKING)
  =========================== */

  const isInDateRange = (d) => {
    if (!d) return false;
    if (!dateRange?.from && !dateRange?.to) return true;

    const dt = new Date(d);
    const from = dateRange?.from ? new Date(dateRange.from) : null;
    const to = dateRange?.to ? new Date(dateRange.to) : null;

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    if (from && dt < from) return false;
    if (to && dt > to) return false;
    return true;
  };

  const filterData = (data) => {
    let out = data;

    // ✅ Date range filter (applies to sales; refunds also have date)
    out = out.filter((item) => isInDateRange(item.date));

    // ✅ Branch/Agent/Airline filters (will work once data comes from API)
    if (selectedBranch !== "all") {
      out = out.filter(
        (x) => (x.branch || "").toLowerCase() === selectedBranch.toLowerCase()
      );
    }
    if (selectedAgent !== "all") {
      out = out.filter(
        (x) => (x.agent || "").toLowerCase() === selectedAgent.toLowerCase()
      );
    }
    if (selectedAirline !== "all") {
      out = out.filter(
        (x) => (x.airline || "").toLowerCase() === selectedAirline.toLowerCase()
      );
    }

    // ✅ Search
    if (!searchQuery.trim()) return out;

    const query = searchQuery.toLowerCase();

    return out.filter((item) => {
      switch (searchBy) {
        case "invoiceNumber":
          return (item.invoiceNumber || "").toLowerCase().includes(query);

        case "documentNumber":
          return (item.documentNumber || "").toLowerCase().includes(query);

        case "date":
          if (!item.date) return false;
          return (
            format(new Date(item.date), "yyyy-MM-dd").includes(query) ||
            format(new Date(item.date), "MMM dd, yyyy")
              .toLowerCase()
              .includes(query)
          );

        case "remarks":
          return (item.remarks || "").toLowerCase().includes(query);

        default:
          return (
            (item.invoiceNumber || "").toLowerCase().includes(query) ||
            (item.documentNumber || "").toLowerCase().includes(query) ||
            (item.vendor || "").toLowerCase().includes(query) ||
            (item.customer || "").toLowerCase().includes(query) ||
            (item.paymentMethod || "").toLowerCase().includes(query) ||
            (item.status || "").toLowerCase().includes(query) ||
            (item.agent || "").toLowerCase().includes(query) ||
            (item.branch || "").toLowerCase().includes(query) ||
            (item.airline || "").toLowerCase().includes(query)
          );
      }
    });
  };

  const filteredSalesData = useMemo(
    () => filterData(salesData),
    [
      salesData,
      searchQuery,
      searchBy,
      dateRange,
      selectedBranch,
      selectedAgent,
      selectedAirline,
    ]
  );

  const filteredRefundData = useMemo(
    () => filterData(mockRefundData),
    [
      searchQuery,
      searchBy,
      dateRange,
      selectedBranch,
      selectedAgent,
      selectedAirline,
    ]
  );

  /* ===========================
     UI (SAME STRUCTURE, DATA FIXED)
  =========================== */

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
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Section */}
            <div className="flex flex-wrap gap-4">
              {/* Search Section */}
              <div className="space-y-2 w-full sm:w-1/3 lg:w-1/6">
                <Label>Search By</Label>
                <Select value={searchBy} onValueChange={setSearchBy}>
                  <SelectTrigger className={"w-full"}>
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
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="remarks">Remarks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Query Section */}
              <div className="space-y-2 w-full sm:w-1/3 lg:w-1/4">
                <Label>Search Query</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={
                      searchBy === "invoiceNumber"
                        ? "Search by invoice number..."
                        : searchBy === "documentNumber"
                        ? "Search by document number..."
                        : searchBy === "date"
                        ? "Search by date (YYYY-MM-DD or MMM DD, YYYY)..."
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

              {/* Date Range Filter */}
              <div className="space-y-2 w-full sm:w-1/4 lg:w-1/6">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
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
                    <div className="p-3 border-b">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDatePreset("today")}
                        >
                          Today
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDatePreset("yesterday")}
                        >
                          Yesterday
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDatePreset("last7days")}
                        >
                          Last 7 days
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDatePreset("last30days")}
                        >
                          Last 30 days
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDatePreset("thisMonth")}
                        >
                          This month
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDatePreset("thisYear")}
                        >
                          This year
                        </Button>
                      </div>
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Branch Filter */}
              <div className="space-y-2 w-full sm:w-1/4 lg:w-1/6">
                <Label>Branch</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                >
                  <SelectTrigger className={"w-full"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="main">Main Branch</SelectItem>
                    <SelectItem value="airport">Airport Branch</SelectItem>
                    <SelectItem value="mall">Mall Branch</SelectItem>
                    <SelectItem value="downtown">Downtown Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Agent Filter */}
              <div className="space-y-2 w-full sm:w-1/4 lg:w-1/6">
                <Label>Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className={"w-full"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    <SelectItem value="mike">Mike Wilson</SelectItem>
                    <SelectItem value="emily">Emily Davis</SelectItem>
                    <SelectItem value="david">David Brown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery ||
              selectedBranch !== "all" ||
              selectedAgent !== "all" ||
              selectedAirline !== "all") && (
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchBy("all");
                    setSelectedBranch("all");
                    setSelectedAgent("all");
                    setSelectedAirline("all");
                    setDateRange({
                      from: subDays(new Date(), 30),
                      to: new Date(),
                    });
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Three Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detailed">Detailed Report</TabsTrigger>
          <TabsTrigger value="branch">Branch Report</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>

        <TabsContent value="detailed">
          <DetailedReportTab
            salesData={filteredSalesData}
            loading={loading}
            searchQuery={searchQuery}
            searchBy={searchBy}
            // handy extras if you want to show metrics in the detailed tab header
            totalSales={totalSales}
            totalProfit={totalProfit}
          />
        </TabsContent>

        <TabsContent value="branch">
          <BranchReportTab
            salesData={filteredSalesData}
            totalSales={totalSales}
          />
        </TabsContent>

        <TabsContent value="refunds">
          <RefundsTab
            refundData={filteredRefundData}
            searchQuery={searchQuery}
            searchBy={searchBy}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
