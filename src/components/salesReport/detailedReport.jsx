"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Loader2,
  FileText,
  SaudiRiyal,
  Printer,
  History as HistoryIcon,
  ChevronDown,
  ChevronUp,
  Undo2,
  Wallet,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../shadcn/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../shadcn/components/ui/dialog";

// Import your reusable component
import CustomAlertDialog from "../CustomAlertDialog";
import { ExpandableSaleRow } from "../ViewSaleData";
import { HistoryDialog } from "../SaleHistory";
import SalePayment from "../PaymentComponents/SalePayment";

import { useNavigate } from "react-router-dom";
import { appToast } from "../../../shadcn/components/ui/appToast";
import { useAuth } from "../../context/AuthContext"; // ✅ ADD THIS — adjust relative path if needed

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const COLUMN_COUNT = 14;
const SEARCH_BY_LABELS = {
  invoiceNumber: "invoice number",
  documentNumber: "document number",
  remarks: "remarks",
  date: "date",
};

export default function DetailedReportTab({
  salesData,
  searchQuery,
  searchBy,
  loading,
  totalSales,
  totalProfit,
  resolveSaleDetails,
  onEdit,
  onDelete,
}) {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canEditSale = hasPermission("SALE_EDIT");
  const canDeleteSale = hasPermission("SALE_DELETE");
  const canRecordPaymentPerm = hasPermission("PAYMENT_CREATE");

  const [rows, setRows] = useState(salesData);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);

  const [paymentSaleId, setPaymentSaleId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    setRows(salesData);
  }, [salesData]);
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = String(text).split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const navigate = useNavigate();

  const handleEdit = (invoiceId) => {
    if (!canEditSale) return; // ✅ RBAC guard
    if (!invoiceId) return;
    navigate(`/edit-services/${invoiceId}`);
  };

  const GenerateInvoice = (id) => {
    if (!id) return;
    navigate(`/invoice-print/${id}`);
  };

  const handleConfirmDelete = async () => {
    if (!canDeleteSale) return; // ✅ RBAC guard
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/sales/sale/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        appToast.success("Sale deleted and balances reversed successfully");

        // Remove immediately from local state — don't wait on parent refetch
        setRows((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        if (expandedId === deleteTarget.id) setExpandedId(null);

        setDeleteTarget(null);
        if (onDelete) onDelete(deleteTarget.id);
      } else {
        appToast.error(data.error || "Failed to delete sale");
      }
    } catch (error) {
      console.error(error);
      appToast.error(error.response?.data?.error || "Failed to delete sale");
    } finally {
      setIsDeleting(false);
    }
  };
  const releasePointerEventsLock = () => {
    setTimeout(() => {
      document.body.style.pointerEvents = "";
    }, 0);
  };
  const handlePaymentSuccess = (data) => {
    const updatedSale = data?.sale;
    if (!updatedSale) return;

    setRows((prev) =>
      prev.map((r) =>
        r.id === updatedSale.id
          ? {
              ...r,
              paidAmount: updatedSale.paidAmount,
              paymentStatus: updatedSale.paymentStatus,
            }
          : r,
      ),
    );

    appToast.success("Payment recorded successfully");
  };

  const closePaymentDialog = () => {
    setPaymentSaleId(null);
    releasePointerEventsLock();
  };

  function truncateText(text, wordLimit) {
    if (!text) return "";
    const words = text.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return text;
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      COMPLETED: "bg-green-100 text-green-800 border-green-200",
      PAID: "bg-green-100 text-green-800 border-green-200",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      REFUNDED: "bg-red-100 text-red-800 border-red-200",
      CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
    };
    const className =
      statusMap[status?.toUpperCase()] ||
      "bg-gray-100 text-gray-800 border-gray-200";
    return (
      <Badge variant="outline" className={className}>
        {status || "N/A"}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      PAID: "bg-emerald-600 text-white hover:bg-green-600",
      DUE: "bg-red-500 text-white hover:bg-red-600",
      PARTIAL: "bg-orange-400 text-white hover:bg-orange-600",
    };
    const className =
      statusMap[status?.toUpperCase()] ||
      "bg-gray-500 text-white hover:bg-gray-600";
    return <Badge className={className}>{status || "N/A"}</Badge>;
  };

  const getPaymentMethodBadge = (method) => {
    const methodMap = {
      CASH: "bg-green-50 text-green-700 border-green-200",
      CREDIT: "bg-blue-50 text-blue-700 border-blue-200",
      BANK_TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
    };
    const className =
      methodMap[method?.toUpperCase()] ||
      "bg-gray-50 text-gray-700 border-gray-200";
    return (
      <Badge variant="outline" className={className}>
        {method || "N/A"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-gray-600 font-medium">Loading sales data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Complete list of all sales transactions
            {searchQuery && (
              <span className="ml-2 text-blue-600">
                • Showing {rows.length} results for "{searchQuery}"
                {searchBy && searchBy !== "all" && SEARCH_BY_LABELS[searchBy]
                  ? ` (highlighting matches in ${SEARCH_BY_LABELS[searchBy]})`
                  : ""}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                {searchQuery
                  ? `No transactions found for "${searchQuery}"`
                  : "No transactions found"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Invoice #</TableHead>
                    <TableHead className="font-semibold">Airline</TableHead>
                    <TableHead className="font-semibold">Document #</TableHead>
                    <TableHead className="font-semibold">Vendor</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Agent</TableHead>
                    <TableHead className="font-semibold">
                      Payment Type
                    </TableHead>
                    <TableHead className="font-semibold">Pay Status</TableHead>
                    <TableHead className="font-semibold text-right">
                      Sell Price
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                    <TableHead className="font-semibold text-center">
                      Actions
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((sale) => {
                    const isRefunded =
                      sale.status?.toUpperCase() === "REFUNDED";
                    const hasRefundOnOriginal = !isRefunded && !!sale.Refund;
                    const canRecordPayment =
                      canRecordPaymentPerm && // ✅ RBAC
                      !isRefunded &&
                      ["DUE", "PARTIAL"].includes(
                        sale.paymentStatus?.toUpperCase(),
                      );
                    const { invoice, sale: fullSale } =
                      resolveSaleDetails?.(sale) ?? {};

                    return (
                      <ExpandableSaleRow
                        key={sale.id}
                        invoice={invoice}
                        sale={fullSale}
                        colSpan={COLUMN_COUNT}
                        rowClassName="hover:bg-gray-50"
                        expanded={expandedId === sale.id}
                        onToggle={() =>
                          setExpandedId((prev) =>
                            prev === sale.id ? null : sale.id,
                          )
                        }
                        renderRow={(expanded, toggle) => (
                          <>
                            <TableCell className="whitespace-nowrap">
                              {sale.date
                                ? highlightText(
                                    format(new Date(sale.date), "MMM dd, yyyy"),
                                    searchQuery,
                                  )
                                : "N/A"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {highlightText(sale.invoiceNumber, searchQuery)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-blue-50 text-blue-700"
                              >
                                {sale.airline}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {highlightText(sale.documentNumber, searchQuery)}
                            </TableCell>
                            <TableCell
                              className="max-w-[140px] truncate"
                              title={sale.vendor}
                            >
                              {sale.vendor || "-"}
                            </TableCell>
                            <TableCell
                              className={`max-w-[140px] truncate ${sale.customer ? "text-blue-600" : "text-emerald-600"}`}
                              title={sale.customer}
                            >
                              {sale.customer
                                ? sale.customer
                                : "Walkin Customer"}
                            </TableCell>
                            <TableCell
                              className="max-w-[120px] truncate"
                              title={sale.agent}
                            >
                              {sale.agent}
                            </TableCell>
                            <TableCell>
                              {getPaymentMethodBadge(sale.paymentMethod)}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(sale.paymentStatus)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${isRefunded ? "text-red-600" : ""}`}
                            >
                              <div className="flex items-center justify-end gap-1">
                                <SaudiRiyal size={15} />
                                {isRefunded
                                  ? `-${sale.Refund?.netRefundToCustomer?.toFixed(2) || "0.00"}`
                                  : sale.sellPrice?.toFixed(2) || "0.00"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {getStatusBadge(sale.status)}
                                {hasRefundOnOriginal && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] text-violet-600 bg-violet-50 border-violet-200 flex items-center gap-1 w-fit"
                                  >
                                    <Undo2 className="w-3 h-3" />
                                    Partially refunded
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[150px]">
                              {!isRefunded && (
                                <div className="truncate" title={sale.remarks}>
                                  {highlightText(
                                    truncateText(sale.remarks || "", 3),
                                    searchQuery,
                                  )}
                                </div>
                              )}
                            </TableCell>
                            {/* stopPropagation so opening the dropdown doesn't also toggle the row */}
                            <TableCell
                              className="text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                                  <DropdownMenuSeparator />
                                  {/* ✅ View Details/History always visible — page access already implies SALE_READ */}
                                  <DropdownMenuItem onClick={toggle}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {expanded ? "Hide Details" : "View Details"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setHistoryTarget(sale.id)}
                                  >
                                    <HistoryIcon className="mr-2 h-4 w-4" />
                                    View History
                                  </DropdownMenuItem>
                                  {/* ✅ RBAC — Record Payment needs PAYMENT_CREATE (already folded into canRecordPayment) */}
                                  {canRecordPayment && (
                                    <DropdownMenuItem
                                      onClick={() => setPaymentSaleId(sale.id)}
                                    >
                                      <Wallet className="mr-2 h-4 w-4" />
                                      Record Payment
                                    </DropdownMenuItem>
                                  )}
                                  {!isRefunded && (
                                    <>
                                      {/* ✅ RBAC — Edit Invoice needs SALE_EDIT */}
                                      {canEditSale && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleEdit(sale.invoiceId)
                                          }
                                        >
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit Invoice
                                        </DropdownMenuItem>
                                      )}
                                      {/* ✅ RBAC — Delete Sale needs SALE_DELETE */}
                                      {canDeleteSale && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => setDeleteTarget(sale)}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Sale
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => GenerateInvoice(sale.id)}
                                  >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Generate Invoice
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell className="w-8 text-center">
                              <span className="text-gray-400">
                                {expanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </span>
                            </TableCell>
                          </>
                        )}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ RBAC — only mount delete dialog if user can delete */}
      {canDeleteSale && (
        <CustomAlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          title="Delete Sale & Reverse Ledger?"
          description={`Are you sure you want to delete this specific sale? This will:

        - Permanently remove document ${deleteTarget?.documentNumber}.
        - Reverse ${deleteTarget?.sellPrice} SAR from the customer's balance.
        - Reverse ${deleteTarget?.netPrice} SAR from the vendor's ledger.
        - Automatically update the parent invoice totals.`}
          onConfirm={handleConfirmDelete}
          loading={isDeleting}
          variant="danger"
          confirmText="Delete & Reverse"
        />
      )}

      <HistoryDialog
        saleId={historyTarget}
        open={!!historyTarget}
        onOpenChange={(v) => {
          if (!v) {
            setHistoryTarget(null);

            releasePointerEventsLock();
          }
        }}
      />
      {/* ✅ RBAC — only mount payment dialog if user can create payments */}
      {canRecordPaymentPerm && (
        <Dialog
          open={!!paymentSaleId}
          onOpenChange={(v) => {
            if (!v) closePaymentDialog();
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            {paymentSaleId && (
              <SalePayment
                key={paymentSaleId}
                saleId={paymentSaleId}
                onClose={closePaymentDialog}
                onSuccess={handlePaymentSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}