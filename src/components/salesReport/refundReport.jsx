"use client";

import { format } from "date-fns";
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

export default function RefundsTab({ refundData, searchQuery, searchBy }) {
  const highlightText = (text, query, field) => {
    if (!query || !text) return text;

    // Only highlight if searching in this specific field or searching all fields
    if (searchBy !== "all" && searchBy !== field) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Refund Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              $
              {refundData
                .reduce((sum, refund) => sum + refund.refundAmount, 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {refundData.length} refund requests
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refund Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              $
              {refundData
                .reduce((sum, refund) => sum + refund.refundFee, 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Total fees collected</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Service Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              $
              {refundData
                .reduce((sum, refund) => sum + refund.serviceCharge, 0)
                .toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Total service charges</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Refund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {refundData.length > 0
                ? (
                    refundData.reduce(
                      (sum, refund) => sum + refund.refundAmount,
                      0
                    ) / refundData.length
                  ).toFixed(2)
                : "0.00"}
            </div>
            <div className="text-xs text-gray-500">Per refund request</div>
          </CardContent>
        </Card>
      </div>

      {/* Refund Details */}
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Document #</TableHead>
                  <TableHead>Airline</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Original Amount</TableHead>
                  <TableHead className="text-right">Refund Fee</TableHead>
                  <TableHead className="text-right">Service Charge</TableHead>
                  <TableHead className="text-right">Refund Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
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
                      <TableCell>
                        {highlightText(
                          format(new Date(refund.date), "MMM dd, yyyy"),
                          searchQuery,
                          "date"
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {highlightText(
                          refund.invoiceNumber,
                          searchQuery,
                          "invoiceNumber"
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {highlightText(
                          refund.documentNumber,
                          searchQuery,
                          "documentNumber"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{refund.airline}</Badge>
                      </TableCell>
                      <TableCell>{refund.customer}</TableCell>
                      <TableCell>{refund.agent}</TableCell>
                      <TableCell>{refund.branch}</TableCell>
                      <TableCell className="text-right">
                        ${refund.originalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        ${refund.refundFee.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ${refund.serviceCharge.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ${refund.refundAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            refund.status === "Processed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={refund.remarks}>
                          {highlightText(
                            refund.remarks || "",
                            searchQuery,
                            "remarks"
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
