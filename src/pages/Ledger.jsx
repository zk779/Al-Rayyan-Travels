import { useState, useMemo } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Badge } from "../../shadcn/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// Mock data for demonstration
const mockTransactions = [
  {
    id: 1,
    date: "2024-01-15",
    supplier: "ABC Electronics",
    description: "Electronic Components Purchase",
    type: "credit",
    amount: 15000,
    status: "completed",
    invoiceNo: "INV-001",
  },
  {
    id: 2,
    date: "2024-01-16",
    supplier: "XYZ Materials",
    description: "Raw Materials",
    type: "debit",
    amount: 8500,
    status: "pending",
    invoiceNo: "INV-002",
  },
  {
    id: 3,
    date: "2024-01-17",
    supplier: "ABC Electronics",
    description: "Payment Received",
    type: "debit",
    amount: 12000,
    status: "completed",
    invoiceNo: "PAY-001",
  },
  {
    id: 4,
    date: "2024-01-18",
    supplier: "Tech Solutions",
    description: "Software License",
    type: "credit",
    amount: 5000,
    status: "completed",
    invoiceNo: "INV-003",
  },
  {
    id: 5,
    date: "2024-01-19",
    supplier: "XYZ Materials",
    description: "Material Supply",
    type: "credit",
    amount: 22000,
    status: "completed",
    invoiceNo: "INV-004",
  },
  {
    id: 6,
    date: "2024-01-20",
    supplier: "Global Supplies",
    description: "Office Supplies",
    type: "credit",
    amount: 3500,
    status: "pending",
    invoiceNo: "INV-005",
  },
  {
    id: 7,
    date: "2024-01-21",
    supplier: "Tech Solutions",
    description: "Payment Made",
    type: "debit",
    amount: 4500,
    status: "completed",
    invoiceNo: "PAY-002",
  },
  {
    id: 8,
    date: "2024-01-22",
    supplier: "ABC Electronics",
    description: "Equipment Purchase",
    type: "credit",
    amount: 18000,
    status: "refunded",
    invoiceNo: "INV-006",
  },
];

const suppliers = [
  "ABC Electronics",
  "XYZ Materials",
  "Tech Solutions",
  "Global Supplies",
];

export default function LedgerComponent() {
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-01-31");
  const [isLoading, setIsLoading] = useState(false);

  // Filter transactions based on supplier and date range
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const start = new Date(startDate);
      const end = new Date(endDate);

      const dateInRange = transactionDate >= start && transactionDate <= end;
      const supplierMatch =
        selectedSupplier === "all" || transaction.supplier === selectedSupplier;

      return dateInRange && supplierMatch;
    });
  }, [selectedSupplier, startDate, endDate]);

  // Calculate totals
  const calculations = useMemo(() => {
    const totalCredit = filteredTransactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebit = filteredTransactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalCredit - totalDebit;

    return { totalCredit, totalDebit, netBalance };
  }, [filteredTransactions]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      refunded: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Supplier Ledger
            </h1>
            <p className="text-gray-600 mt-1">
              Track and manage supplier transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter transactions by supplier and date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Supplier Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Supplier
                </label>
                <Select
                  value={selectedSupplier}
                  onValueChange={setSelectedSupplier}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                  />
                  <CalendarIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                  />
                  <CalendarIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Credit */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Credit
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(calculations.totalCredit)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTransactions.filter((t) => t.type === "credit").length}{" "}
                transactions
              </p>
            </CardContent>
          </Card>

          {/* Total Debit */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Debit
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(calculations.totalDebit)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTransactions.filter((t) => t.type === "debit").length}{" "}
                transactions
              </p>
            </CardContent>
          </Card>

          {/* Net Balance */}
          <Card
            className={`border-l-4 ${
              calculations.netBalance >= 0
                ? "border-l-blue-500"
                : "border-l-orange-500"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Balance
              </CardTitle>
              <DollarSign
                className={`h-4 w-4 ${
                  calculations.netBalance >= 0
                    ? "text-blue-600"
                    : "text-orange-600"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  calculations.netBalance >= 0
                    ? "text-blue-600"
                    : "text-orange-600"
                }`}
              >
                {formatCurrency(Math.abs(calculations.netBalance))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calculations.netBalance >= 0
                  ? "Credit Balance"
                  : "Debit Balance"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Showing {filteredTransactions.length} transactions
              {selectedSupplier !== "all" && ` for ${selectedSupplier}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice/Ref</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                      >
                        No transactions found for the selected criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction, index) => {
                      // Calculate running balance
                      const runningBalance = filteredTransactions
                        .slice(0, index + 1)
                        .reduce((balance, t) => {
                          return t.type === "credit"
                            ? balance + t.amount
                            : balance - t.amount;
                        }, 0);

                      return (
                        <TableRow
                          key={transaction.id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="font-medium">
                            {format(new Date(transaction.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {transaction.invoiceNo}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {transaction.supplier}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-xs truncate"
                              title={transaction.description}
                            >
                              {transaction.description}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            {transaction.type === "credit" ? (
                              <span className="text-green-600 font-semibold">
                                {formatCurrency(transaction.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.type === "debit" ? (
                              <span className="text-red-600 font-semibold">
                                {formatCurrency(transaction.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Footer */}
        {filteredTransactions.length > 0 && (
          <Card className="bg-gray-900 text-white">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-400">
                    Total Transactions
                  </div>
                  <div className="text-2xl font-bold">
                    {filteredTransactions.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Date Range</div>
                  <div className="text-lg font-semibold">
                    {format(new Date(startDate), "MMM dd")} -{" "}
                    {format(new Date(endDate), "MMM dd, yyyy")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Selected Supplier</div>
                  <div className="text-lg font-semibold">
                    {selectedSupplier === "all"
                      ? "All Suppliers"
                      : selectedSupplier}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
