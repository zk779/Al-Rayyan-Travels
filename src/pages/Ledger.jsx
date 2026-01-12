import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "../../shadcn/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { cn } from "../../shadcn/lib/utils";
import { Calendar } from "../../shadcn/components/ui/calendar";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ======================= HELPERS ======================= */

async function apiRequest(path) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n || 0));

const entryBadge = (type) => (
  <Badge variant="outline" className="whitespace-nowrap text-xs">
    {type.replaceAll("_", " ")}
  </Badge>
);

/* ======================= COMPONENT ======================= */

export default function LedgerComponent() {
  const [entries, setEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [accountType, setAccountType] = useState("VENDOR");
  const [entryType, setEntryType] = useState("ALL");
  const [selectedVendorId, setSelectedVendorId] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("all");

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  /* ======================= LOAD MASTER DATA ======================= */

  useEffect(() => {
    apiRequest("/api/vendors").then((r) => setVendors(r.data || []));
    apiRequest("/api/customers").then((r) => setCustomers(r.data || []));
  }, []);

  /* ======================= FETCH LEDGER ======================= */

  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("accountType", accountType);
      params.set("page", page);
      params.set("limit", limit);

      if (entryType !== "ALL") params.set("entryType", entryType);

      if (accountType === "VENDOR" && selectedVendorId !== "all") {
        params.set("vendorId", selectedVendorId);
      }

      if (accountType === "CUSTOMER" && selectedCustomerId !== "all") {
        params.set("customerId", selectedCustomerId);
      }

      if (dateRange?.from) params.set("from", dateRange.from.toISOString());
      if (dateRange?.to) params.set("to", dateRange.to.toISOString());

      const res = await apiRequest(`/api/ledger?${params.toString()}`);
      setEntries(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [
    accountType,
    entryType,
    selectedVendorId,
    selectedCustomerId,
    dateRange,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  /* ======================= CALCULATIONS ======================= */

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => {
        acc.credit += Number(e.credit || 0);
        acc.debit += Number(e.debit || 0);
        return acc;
      },
      { credit: 0, debit: 0 }
    );
  }, [entries]);

  /* ======================= EXPORT ======================= */

  const exportCSV = () => {
    const rows = [
      [
        "Date",
        "Account",
        "Account Type",
        "Entry Type",
        "Debit",
        "Credit",
        "Balance After",
      ],
      ...entries.map((e) => [
        format(new Date(e.transactionDate), "yyyy-MM-dd"),
        e.account?.name || "-",
        e.account?.type || "-",
        e.entryType,
        e.debit || "",
        e.credit || "",
        e.balanceAfter ?? "",
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ======================= UI ======================= */

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ledger</h1>
          <p className="text-muted-foreground">
            Unified business ledger (vendors, customers, accounts)
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLedger}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filters
          </CardTitle>
          <CardDescription>
            Filter ledger entries by supplier and date range
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Account Type */}
          <Select
            value={accountType}
            onValueChange={(v) => {
              setAccountType(v);
              setSelectedVendorId("all");
              setSelectedCustomerId("all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Account Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VENDOR">Vendor</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="BANK">Bank</SelectItem>
            </SelectContent>
          </Select>

          {/* Entry Type */}
          <Select value={entryType} onValueChange={setEntryType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Entry Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Entries</SelectItem>
              <SelectItem value="OPENING_BALANCE">Opening Balance</SelectItem>
              <SelectItem value="SALE">Sale</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
            </SelectContent>
          </Select>

          {/* Vendor / Customer */}
          {accountType === "VENDOR" && (
            <Select
              value={selectedVendorId}
              onValueChange={setSelectedVendorId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {accountType === "CUSTOMER" && (
            <Select
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, "MMM dd")} -{" "}
                {format(dateRange.to, "MMM dd")}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
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
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <TrendingUp className="text-green-600" />
            <div className="text-xl font-bold">{money(totals.credit)}</div>
            <p className="text-sm text-muted-foreground">Total Credit</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <TrendingDown className="text-red-600" />
            <div className="text-xl font-bold">{money(totals.debit)}</div>
            <p className="text-sm text-muted-foreground">Total Debit</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <DollarSign />
            <div className="text-xl font-bold">
              {money(totals.credit - totals.debit)}
            </div>
            <p className="text-sm text-muted-foreground">Net Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
          <CardDescription>{total} records</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Loading ledger...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    No ledger entries found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {format(new Date(e.transactionDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{e.account?.name}</TableCell>
                    <TableCell>{e.account?.type}</TableCell>
                    <TableCell>{entryBadge(e.entryType)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {e.debit ? money(e.debit) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {e.credit ? money(e.credit) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {money(e.balanceAfter)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
