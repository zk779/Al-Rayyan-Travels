import { useState } from "react";
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Plane,
  Download,
  Filter,
  Search,
} from "lucide-react";
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

// Mock sales data
export const mockSalesData = [
  {
    id: "1",
    date: "2024-03-15",
    invoiceNumber: "INV-001234",
    documentNumber: "TK001234",
    airline: "AA",
    customer: "John Smith",
    agent: "Sarah Johnson",
    branch: "Main Branch",
    netPrice: 450.0,
    sellPrice: 520.0,
    profit: 70.0,
    paymentMethod: "Credit Card",
    status: "Completed",
    remarks: "Business class upgrade requested",
  },
  {
    id: "2",
    date: "2024-03-15",
    invoiceNumber: "INV-001235",
    documentNumber: "TK001235",
    airline: "EK",
    customer: "Jane Doe",
    agent: "Mike Wilson",
    branch: "Airport Branch",
    netPrice: 850.0,
    sellPrice: 980.0,
    profit: 130.0,
    paymentMethod: "Cash",
    status: "Completed",
    remarks: "Priority boarding included",
  },
  {
    id: "3",
    date: "2024-03-14",
    invoiceNumber: "INV-001236",
    documentNumber: "TK001236",
    airline: "BA",
    customer: "Bob Johnson",
    agent: "Emily Davis",
    branch: "Mall Branch",
    netPrice: 620.0,
    sellPrice: 720.0,
    profit: 100.0,
    paymentMethod: "Bank Transfer",
    status: "Completed",
    remarks: "Extra baggage allowance",
  },
  {
    id: "4",
    date: "2024-03-14",
    invoiceNumber: "INV-001237",
    documentNumber: "TK001237",
    airline: "QR",
    customer: "Alice Brown",
    agent: "Sarah Johnson",
    branch: "Main Branch",
    netPrice: 750.0,
    sellPrice: 890.0,
    profit: 140.0,
    paymentMethod: "Credit Card",
    status: "Completed",
    remarks: "Frequent flyer miles applied",
  },
  {
    id: "5",
    date: "2024-03-13",
    invoiceNumber: "INV-001238",
    documentNumber: "TK001238",
    airline: "LH",
    customer: "Charlie Wilson",
    agent: "David Brown",
    branch: "Downtown Branch",
    netPrice: 380.0,
    sellPrice: 450.0,
    profit: 70.0,
    paymentMethod: "Cash",
    status: "Pending",
    remarks: "Seat selection pending",
  },
];

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
    remarks: "Customer requested full refund due to medical emergency",
  },
  {
    id: "2",
    date: "2024-03-14",
    invoiceNumber: "INV-001235",
    documentNumber: "RF001235",
    airline: "EK",
    customer: "Lisa Smith",
    originalAmount: 980.0,
    refundFee: 80.0,
    serviceCharge: 30.0,
    refundAmount: 870.0,
    agent: "Mike Wilson",
    branch: "Airport Branch",
    status: "Pending",
    remarks: "Flight cancelled by airline, processing refund",
  },
];

export default function SalesReport() {
  const [activeTab, setActiveTab] = useState("detailed");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [selectedAirline, setSelectedAirline] = useState("all");

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("all");

  // Calculate metrics
  const totalSales = mockSalesData.reduce(
    (sum, sale) => sum + sale.sellPrice,
    0
  );
  const totalProfit = mockSalesData.reduce((sum, sale) => sum + sale.profit, 0);
  const totalTransactions = mockSalesData.length;
  const avgTicketValue = totalSales / totalTransactions;
  const profitMargin = (totalProfit / totalSales) * 100;

  // Previous period comparison (mock data)
  const prevTotalSales = 2150.0;
  const prevTotalProfit = 380.0;
  const prevTransactions = 4;

  const salesGrowth = ((totalSales - prevTotalSales) / prevTotalSales) * 100;
  const profitGrowth =
    ((totalProfit - prevTotalProfit) / prevTotalProfit) * 100;
  const transactionGrowth =
    ((totalTransactions - prevTransactions) / prevTransactions) * 100;

  const handleExportReport = () => {
    console.log("Exporting report...");
  };

  const handleDatePreset = (preset) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: today, to: today });
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateRange({ from: yesterday, to: yesterday });
        break;
      case "last7days":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "last30days":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "thisYear":
        setDateRange({ from: startOfYear(today), to: endOfYear(today) });
        break;
    }
  };

  // Filter data based on search
  const filterData = (data) => {
    if (!searchQuery.trim()) return data;

    return data.filter((item) => {
      const query = searchQuery.toLowerCase();

      switch (searchBy) {
        case "invoiceNumber":
          return item.invoiceNumber?.toLowerCase().includes(query);
        case "documentNumber":
          return item.documentNumber?.toLowerCase().includes(query);
        case "date":
          return (
            format(new Date(item.date), "yyyy-MM-dd").includes(query) ||
            format(new Date(item.date), "MMM dd, yyyy")
              .toLowerCase()
              .includes(query)
          );
        case "remarks":
          return item.remarks?.toLowerCase().includes(query);
        case "all":
        default:
          return (
            item.invoiceNumber?.toLowerCase().includes(query) ||
            item.documentNumber?.toLowerCase().includes(query) ||
            format(new Date(item.date), "yyyy-MM-dd").includes(query) ||
            format(new Date(item.date), "MMM dd, yyyy")
              .toLowerCase()
              .includes(query) ||
            item.remarks?.toLowerCase().includes(query) ||
            item.customer?.toLowerCase().includes(query) ||
            item.agent?.toLowerCase().includes(query) ||
            item.branch?.toLowerCase().includes(query)
          );
      }
    });
  };

  const filteredSalesData = filterData(mockSalesData);
  const filteredRefundData = filterData(mockRefundData);

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive sales analytics and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      {/* Key Metrics - Static at top
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {salesGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={salesGrowth >= 0 ? "text-green-500" : "text-red-500"}
              >
                {Math.abs(salesGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalProfit.toFixed(2)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {profitGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  profitGrowth >= 0 ? "text-green-500" : "text-red-500"
                }
              >
                {Math.abs(profitGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {transactionGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span
                className={
                  transactionGrowth >= 0 ? "text-green-500" : "text-red-500"
                }
              >
                {Math.abs(transactionGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Ticket Value
            </CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgTicketValue.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Profit margin: {profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div> */}
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
            searchQuery={searchQuery}
            searchBy={searchBy}
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
