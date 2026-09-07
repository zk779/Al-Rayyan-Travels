"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Pencil,
  Trash2,
  SaudiRiyal,
  MoreVertical,
  Filter,
  Undo2,
  Receipt,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shadcn/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shadcn/components/ui/table";
import { Badge } from "../../../shadcn/components/ui/badge";
import { Button } from "../../../shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../shadcn/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shadcn/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../../shadcn/components/ui/dropdown-menu";
import { useAuth } from "../../context/AuthContext"; // ✅ ADD THIS — adjust relative path if needed

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ========================= STATUS BADGE ========================= */
const statusVariant = (status) => {
  switch (String(status).toUpperCase()) {
    case "COMPLETED":
      return "destructive";
    case "PENDING":
      return "secondary";
    case "APPROVED":
      return "outline";
    default:
      return "secondary";
  }
};

/* ========================= HIGHLIGHT ========================= */
const highlightText = (text, query, field, searchBy) => {
  if (!query || !text) return text;
  if (searchBy !== "all" && searchBy !== field) return text;
  const regex = new RegExp(`(${query})`, "gi");
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

/* ========================= VIEW DIALOG ========================= */
function ViewRefundDialog({ refund, onClose }) {
  if (!refund) return null;

  const rows = [
    // { label: "Refund ID", value: refund.id, mono: true },
    // { label: "Sale ID", value: refund.saleId, mono: true },
    { label: "Invoice Number", value: refund.invoiceNumber, mono: true },
    {
      label: "Date",
      value: refund.date ? format(new Date(refund.date), "MMM dd, yyyy") : "-",
    },
    {
      label: "Status",
      value: (
        <Badge variant={statusVariant(refund.status)}>{refund.status}</Badge>
      ),
    },
    { label: "Customer", value: refund.customer || "-" },
    { label: "Vendor", value: refund.vendor || "-" },
    { label: "Agent", value: refund.agent || "-" },
    { label: "Refund Reason", value: refund.refundReason || "-" },
    { label: "Remarks", value: refund.remarks || "-" },
  ];

  const financials = [
    {
      label: "Original Sale Amount",
      value: refund.originalAmount,
      color: "text-slate-700",
    },
    { label: "Net Price", value: refund.netPrice, color: "text-blue-700" },
    { label: "Sell Price", value: refund.sellPrice, color: "text-purple-700" },
    {
      label: "Customer Refund Amount",
      value: refund.customerRefundAmount,
      color: "text-slate-700",
    },
    {
      label: "Vendor Refund Amount",
      value: refund.vendorRefundAmount,
      color: "text-slate-700",
    },
    { label: "Refund Fee", value: refund.refundFee, color: "text-orange-600" },
    {
      label: "Cancellation Charges",
      value: refund.cancellationCharges,
      color: "text-red-600",
    },
    {
      label: "Net Refund to Customer",
      value: refund.netRefundToCustomer,
      color: "text-green-700",
    },
    {
      label: "Net Cost to Us",
      value: refund.netCostToUs,
      color: "text-red-700",
    },
  ];

  return (
    <Dialog open={!!refund} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Refund Details
            <Badge variant={statusVariant(refund.status)}>
              {refund.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Full breakdown of the refund transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2">
            {rows.map(({ label, value, mono }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-500 font-medium">
                  {label}
                </div>
                <div
                  className={`text-sm font-semibold mt-0.5 ${mono ? "font-mono" : ""}`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Financials */}
          <div className="border-t pt-3">
            <div className="text-sm font-semibold text-slate-600 mb-2">
              Financial Breakdown
            </div>
            <div className="grid grid-cols-3 gap-2">
              {financials.map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-white border rounded-lg px-3 py-2"
                >
                  <div className="text-xs text-slate-500 font-medium">
                    {label}
                  </div>
                  <div
                    className={`text-sm font-bold mt-0.5 flex items-center gap-1 ${color}`}
                  >
                    <SaudiRiyal size={13} />
                    {Number(value || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ========================= MAIN COMPONENT ========================= */
export default function RefundsTab({
  refundData,
  loading,
  hasSearched = true,
  searchQuery,
  searchBy,
}) {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canEditRefund = hasPermission("REFUND_EDIT");
  const canDeleteRefund = hasPermission("REFUND_DELETE");
  const hasAnyRowAction = canEditRefund || canDeleteRefund;

  const navigate = useNavigate();
  const [viewRefund, setViewRefund] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const summary = useMemo(
    () => ({
      count: refundData.length,
      netRefunded: refundData.reduce((s, r) => s + (r.netRefundToCustomer || 0), 0),
      cancellationCharges: refundData.reduce((s, r) => s + (r.cancellationCharges || 0), 0),
    }),
    [refundData],
  );

  if (!hasSearched) {
    return (
      <Card className="border-dashed border-gray-200">
        <CardContent className="py-16 flex flex-col items-center text-center gap-2">
          <div className="p-3 rounded-full bg-indigo-50">
            <Filter className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Pick a date range and hit Search to see refund transactions
          </p>
          <p className="text-xs text-gray-400 max-w-sm">
            Or toggle "All time" if you want everything, regardless of date.
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ========================= DELETE ========================= */
  const handleDelete = async () => {
    if (!canDeleteRefund) return; // ✅ RBAC guard
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/refunds/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete refund");
      alert("Refund deleted and reversed successfully!");
      // Reload page to reflect changes
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleEditClick = (refundId) => {
    if (!canEditRefund) return; // ✅ RBAC guard
    navigate(`/edit-refund/${refundId}`);
  };

  /* ========================= UI ========================= */
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Refund Details</CardTitle>
          <CardDescription>
            Complete list of all refund transactions
            {searchQuery && (
              <span className="ml-2 text-blue-600">
                • Showing {refundData.length} results for "{searchQuery}"
                {searchBy !== "all" &&
                  ` in ${searchBy.replace(/([A-Z])/g, " $1").toLowerCase()}`}
              </span>
            )}
          </CardDescription>
          {summary.count > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                <Receipt className="h-4 w-4" /> {summary.count} Refunds
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium">
                <SaudiRiyal size={14} /> {summary.netRefunded.toFixed(2)} Refunded to Customers
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                <Undo2 className="h-4 w-4" /> {summary.cancellationCharges.toFixed(2)} Cancellation Charges
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Inv#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Original Amt</TableHead>
                  <TableHead className="text-right">Vend. Refund</TableHead>
                  <TableHead className="text-right">Cust. Refund</TableHead>
                  <TableHead className="text-right">Refund Fee</TableHead>
                  <TableHead className="text-right">Service Charges</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        Loading refunds...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : refundData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={14}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchQuery
                        ? `No refunds found for "${searchQuery}"`
                        : "No refunds found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  refundData.map((refund) => (
                    <TableRow key={refund.id}>
                      <TableCell className="whitespace-nowrap">
                        {refund.date
                          ? highlightText(
                              format(new Date(refund.date), "MMM dd, yyyy"),
                              searchQuery,
                              "date",
                              searchBy,
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>{refund.invoiceNumber}</TableCell>
                      <TableCell>
                        {highlightText(
                          refund.customer,
                          searchQuery,
                          "customer",
                          searchBy,
                        )}
                      </TableCell>
                      <TableCell>{refund.vendor}</TableCell>
                      <TableCell>{refund.agent}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(refund.status)}>
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-0.5">
                          <SaudiRiyal size={12} />
                          {Number(refund.originalAmount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-0.5">
                          <SaudiRiyal size={12} />
                          {Number(refund.vendorRefundAmount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="flex items-center justify-end gap-0.5">
                          <SaudiRiyal size={12} />
                          {Number(refund.netRefundToCustomer).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        <span className="flex items-center justify-end gap-0.5">
                          <SaudiRiyal size={12} />
                          {Number(refund.refundFee).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        <span className="flex items-center justify-end gap-0.5">
                          <SaudiRiyal size={12} />
                          {Number(refund.cancellationCharges).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[140px]">
                        <div
                          className="truncate text-xs text-slate-600"
                          title={refund.refundReason}
                        >
                          {highlightText(
                            refund.refundReason,
                            searchQuery,
                            "remarks",
                            searchBy,
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {/* ✅ View always visible — page access already implies REFUND_READ */}
                            <DropdownMenuItem
                              variant="ghost"
                              size="sm"
                              title="View Refund"
                              onClick={() => setViewRefund(refund)}
                            >
                              <Eye className="h-4 w-4 text-blue-500" /> View
                              Details
                            </DropdownMenuItem>
                            {/* ✅ RBAC — Edit needs REFUND_EDIT */}
                            {canEditRefund && (
                              <DropdownMenuItem
                                variant="ghost"
                                size="sm"
                                title="Edit Refund"
                                onClick={() => handleEditClick(refund.id)}
                              >
                                <Pencil className="h-4 w-4 text-indigo-500" />{" "}
                                Edit Refund
                              </DropdownMenuItem>
                            )}
                            {/* ✅ RBAC — Delete needs REFUND_DELETE */}
                            {canDeleteRefund && (
                              <DropdownMenuItem
                                variant="ghost"
                                size="sm"
                                title="Delete Refund"
                                onClick={() => setDeleteTarget(refund)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />{" "}
                                Delete Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <ViewRefundDialog
        refund={viewRefund}
        onClose={() => setViewRefund(null)}
      />

      {/* ✅ RBAC — only mount delete dialog if user can delete */}
      {canDeleteRefund && (
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete & Reverse Refund?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this refund and reverse all account
                balance changes. The sale will be restored to{" "}
                <strong>COMPLETED</strong> status. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete & Reverse"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}