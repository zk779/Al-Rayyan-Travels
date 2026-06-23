"use client";

import { useMemo, useState } from "react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../shadcn/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../shadcn/components/ui/dialog";
import { Badge } from "../../shadcn/components/ui/badge";
import { Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import DepositTabComponent from "./NewPayments";

const VENDOR_PAYMENTS = [
  {
    id: 1,
    paymentId: "VP001",
    party: "Emirates Airlines",
    invoiceNo: "INV001",
    amount: 5000,
    paymentDate: "2024-01-15",
    method: "Bank Transfer",
    status: "Completed",
    remarks: "Flight booking payment",
  },
  {
    id: 2,
    paymentId: "VP002",
    party: "Al Maktoum Hotel",
    invoiceNo: "INV002",
    amount: 3500,
    paymentDate: "2024-01-16",
    method: "Credit Card",
    status: "Pending",
    remarks: "Hotel reservation",
  },
];

const CUSTOMER_PAYMENTS = [
  {
    id: 1,
    paymentId: "CP001",
    party: "Ahmed Ali",
    invoiceNo: "INV-2024-001",
    amount: 2500,
    paymentDate: "2024-01-15",
    method: "Cash",
    status: "Completed",
    remarks: "Flight booking payment",
  },
  {
    id: 2,
    paymentId: "CP002",
    party: "Fatima Mohammed",
    invoiceNo: "INV-2024-002",
    amount: 4200,
    paymentDate: "2024-01-16",
    method: "Credit Card",
    status: "Completed",
    remarks: "Holiday package",
  },
];

function StatCard({ label, amount, count }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${amount.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">
          {count !== undefined ? `${count} payments` : "All payments"}
        </p>
      </CardContent>
    </Card>
  );
}

function PaymentsTable({
  partyLabel,
  payments,
  search,
  onSearch,
  onAdd,
  onEdit,
  onDelete,
}) {
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) =>
      Object.values(p).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [payments, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${partyLabel.toLowerCase()}, invoice, amount...`}
            className="pl-8"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Payment
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            <TableHead>{partyLabel}</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-sm">
                {payment.paymentId}
              </TableCell>
              <TableCell>{payment.party}</TableCell>
              <TableCell>{payment.invoiceNo}</TableCell>
              <TableCell>${payment.amount.toLocaleString()}</TableCell>
              <TableCell>{payment.paymentDate}</TableCell>
              <TableCell>{payment.method}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    payment.status === "Completed" ? "default" : "secondary"
                  }
                >
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(payment)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(payment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-6"
              >
                No payments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Maps the payload from DepositTabComponent's onSuccess into a table row.
function toPaymentRow(prefix, count, { entity, amount, date, remarks }) {
  return {
    id: Date.now(),
    paymentId: `${prefix}${String(count + 1).padStart(3, "0")}`,
    party: entity?.vendorName ?? entity?.customerName ?? "Unknown",
    invoiceNo: "—",
    amount,
    paymentDate: date ? date.toISOString().slice(0, 10) : "",
    method: "Bank Transfer",
    status: "Completed",
    remarks: remarks || "—",
  };
}

export default function PaymentPage() {
  const [vendorPayments, setVendorPayments] = useState(VENDOR_PAYMENTS);
  const [customerPayments, setCustomerPayments] = useState(CUSTOMER_PAYMENTS);
  const [searchVendor, setSearchVendor] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");

  // null = closed, "vendor" | "customer" = which dialog flow is open
  const [paymentDialogMode, setPaymentDialogMode] = useState(null);

  const totalVendor = useMemo(
    () => vendorPayments.reduce((sum, p) => sum + p.amount, 0),
    [vendorPayments],
  );
  const totalCustomer = useMemo(
    () => customerPayments.reduce((sum, p) => sum + p.amount, 0),
    [customerPayments],
  );

  const handleDeleteVendor = (id) =>
    setVendorPayments((prev) => prev.filter((p) => p.id !== id));
  const handleDeleteCustomer = (id) =>
    setCustomerPayments((prev) => prev.filter((p) => p.id !== id));

  // Editing opens the same dialog flow, pre-scoped to the right mode.
  // (Pre-filling the entity/amount from the existing row is a follow-up —
  // DepositTabComponent would need an `initialEntity`/`initialAmount` prop.)
  const handleEditVendor = () => setPaymentDialogMode("vendor");
  const handleEditCustomer = () => setPaymentDialogMode("customer");

  const closeDialog = () => setPaymentDialogMode(null);

  const handlePaymentSuccess = (payload) => {
    if (payload.mode === "vendor") {
      setVendorPayments((prev) => [
        ...prev,
        toPaymentRow("VP", prev.length, payload),
      ]);
    } else {
      setCustomerPayments((prev) => [
        ...prev,
        toPaymentRow("CP", prev.length, payload),
      ]);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage all vendor and customer payments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Vendor Payments"
          amount={totalVendor}
          count={vendorPayments.length}
        />
        <StatCard
          label="Total Customer Payments"
          amount={totalCustomer}
          count={customerPayments.length}
        />
        <StatCard label="Combined Total" amount={totalVendor + totalCustomer} />
      </div>

      <Tabs defaultValue="vendor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendor">Vendor Payments</TabsTrigger>
          <TabsTrigger value="customer">Customer Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="vendor">
          <PaymentsTable
            partyLabel="Vendor"
            payments={vendorPayments}
            search={searchVendor}
            onSearch={setSearchVendor}
            onAdd={() => setPaymentDialogMode("vendor")}
            onEdit={handleEditVendor}
            onDelete={handleDeleteVendor}
          />
        </TabsContent>

        <TabsContent value="customer">
          <PaymentsTable
            partyLabel="Customer"
            payments={customerPayments}
            search={searchCustomer}
            onSearch={setSearchCustomer}
            onAdd={() => setPaymentDialogMode("customer")}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={paymentDialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {paymentDialogMode === "vendor"
                ? "New Vendor Payment"
                : "New Customer Payment"}
            </DialogTitle>
          </DialogHeader>
          {paymentDialogMode && (
            <DepositTabComponent
              mode={paymentDialogMode}
              onClose={closeDialog}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
