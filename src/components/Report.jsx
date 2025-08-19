"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Button } from "../../shadcn/components/ui/button";
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
import { Badge } from "../../shadcn/components/ui/badge";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import {
  Download,
  Search,
  Plane,
  Users,
  CreditCard,
  TrendingUp,
  CalendarIcon,
  MapPin,
  SaudiRiyal,
  Ticket,
  TicketCheck,
  TicketCheckIcon,
  TicketIcon,
  TicketsPlane,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { cn } from "../../shadcn/lib/utils";

// Mock data for travel agency
const mockSummaryData = {
  totalRevenue: 125000.5,
  monthlyRevenue: 28500.75,
  todayRevenue: 3200.0,
  totalBookings: 1250,
  totalTickets: 2100,
  totalCustomers: 850,
  pendingPayments: 15200.25,
  completedTrips: 980,
};

const mockBookingsData = [
  {
    id: "INV001",
    date: "2025-08-18",
    mode: "Cash",
    customerName: "Ahmed Al-Rashid",
    document_no: "CO35V8",
    vendor: "Alia Travels",
    sell_price: 2500.0,
    buying_price: 2000.0,
    airline: "Emirates",
    status: "Confirmed",
  },
  {
    id: "INV002",
    date: "2025-08-17",
    mode: "Cash",
    customerName: "Ali Al-Salem",
    document_no: "CO20ER",
    vendor: "Skyline Travels",
    sell_price: 3000.0,
    buying_price: 2500.0,
    airline: "Emirates",
    status: "Confirmed",
  },
  {
    id: "INV003",
    date: "2025-08-16",
    mode: "Online Transfer",
    customerName: "Hassan Al-Mansoori",
    document_no: "CO15TY",
    vendor: "Fly High Travels",
    sell_price: 2500.0,
    buying_price: 2000.0,
    airline: "Emirates",
    status: "Confirmed",
  },
];

const mockPaymentsData = [
  {
    id: "PAY001",
    bookingId: "BK001",
    customerName: "Ahmed Al-Rashid",
    amount: 2500.0,
    paymentDate: "2024-01-15",
    method: "Credit Card",
    status: "Completed",
    type: "Full Payment",
  },
  {
    id: "PAY002",
    bookingId: "BK002",
    customerName: "Fatima Hassan",
    amount: 900.0,
    paymentDate: "2024-01-14",
    method: "Bank Transfer",
    status: "Pending",
    type: "Partial Payment",
  },
];

export default function ReportPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("bookings");
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("booking");
  const [filteredBookings, setFilteredBookings] = useState(mockBookingsData);
  const [filteredPayments, setFilteredPayments] = useState(mockPaymentsData);
  const [summaryData, setSummaryData] = useState(mockSummaryData);
  const [selectedRangeData, setSelectedRangeData] = useState({
    totalRevenue: 0,
    totalBookingsCount: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filter data based on search and date range
  useEffect(() => {
    let filtered = mockBookingsData;

    if (searchText) {
      filtered = filtered.filter(
        (booking) =>
          booking.customerName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchText.toLowerCase()) ||
          booking.destination
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          booking.airline.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredBookings(filtered);

    // Calculate selected range data
    const totalRevenue = filtered.reduce(
      (sum, booking) => sum + booking.amount,
      0
    );
    setSelectedRangeData({
      totalRevenue,
      totalBookingsCount: filtered.length,
    });
  }, [searchText, dateRange]);

  const handleDateRangeChange = (range) => {
    if (range) {
      setDateRange(range);
    }
  };

  const handlePresetDateRange = (preset) => {
    const today = new Date();
    let from, to;

    switch (preset) {
      case "today":
        from = to = today;
        break;
      case "thisWeek":
        from = startOfWeek(today);
        to = endOfWeek(today);
        break;
      case "thisMonth":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case "thisYear":
        from = startOfYear(today);
        to = endOfYear(today);
        break;
      default:
        from = to = today;
    }

    setDateRange({ from, to });
  };

  const handleExport = () => {
    console.log("Exporting travel agency report...");
    // Implementation for export functionality
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Reports</h1>
          <p className="text-gray-500 mt-1">
            Analyze your travel bookings, revenue, and customer data
          </p>
        </div>
        <Button onClick={handleExport} className="mt-4 md:mt-0">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summaryData.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summaryData.monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summaryData.totalBookings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summaryData.totalCustomers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
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
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings, customers..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Search Type */}
            <div className="space-y-2">
              <Label>Search Type</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking">Booking ID</SelectItem>
                  <SelectItem value="customer">Customer Name</SelectItem>
                  <SelectItem value="destination">Destination</SelectItem>
                  <SelectItem value="airline">Airline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Date Presets */}
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <Select onValueChange={handlePresetDateRange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Range Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Selected Range Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${selectedRangeData.totalRevenue.toLocaleString()}
            </div>
            <p className="text-blue-600">Total revenue for selected period</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">
              Selected Range Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {selectedRangeData.totalBookingsCount}
            </div>
            <p className="text-green-600">Total bookings for selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports</CardTitle>
          <CardDescription>
            View detailed information about bookings, payments, and travel data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bookings">
                <Plane className="mr-2 h-4 w-4" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Invoice
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Date
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Mode
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Customer
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Vendor
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Airline
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Document No.
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Sell Price
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Buying Price
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="p-4 font-medium">{booking.id}</td>
                          <td className="p-4 font-medium">{booking.date}</td>
                          <td className="p-4 font-medium">{booking.mode}</td>
                          <td className="p-4">{booking.customerName}</td>
                          <td className="p-4">
                            <div className="flex items-center">
                              {booking.vendor}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <Plane className="mr-1 h-4 w-4 text-muted-foreground" />
                              {booking.airline}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <TicketsPlane className="mr-1 h-4 w-4 text-muted-foreground" />
                              {booking.document_no}
                            </div>
                          </td>
                          <td className="p-4 font-medium ">
                            <div className="flex items-center">
                              <SaudiRiyal size={20} />
                              {booking.sell_price.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4 font-medium ">
                            <div className="flex items-center">
                              <SaudiRiyal size={20} />
                              {booking.buying_price.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Payment ID
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Booking ID
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Customer
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Amount
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Payment Date
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Method
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Type
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="p-4 font-medium">{payment.id}</td>
                          <td className="p-4">{payment.bookingId}</td>
                          <td className="p-4">{payment.customerName}</td>
                          <td className="p-4 font-medium">
                            ${payment.amount.toLocaleString()}
                          </td>
                          <td className="p-4">
                            {format(
                              new Date(payment.paymentDate),
                              "MMM dd, yyyy"
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <CreditCard className="mr-1 h-4 w-4 text-muted-foreground" />
                              {payment.method}
                            </div>
                          </td>
                          <td className="p-4">{payment.type}</td>
                          <td className="p-4">
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top Airlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Emirates</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saudi Airlines</span>
                        <span className="font-medium">30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>American Airlines</span>
                        <span className="font-medium">25%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Popular Destinations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Dubai</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>London</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paris</span>
                        <span className="font-medium">22%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New York</span>
                        <span className="font-medium">15%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Booking Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>This Week</span>
                        <span className="font-medium text-green-600">+12%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>This Month</span>
                        <span className="font-medium text-green-600">+8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Booking</span>
                        <span className="font-medium">$2,100</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
