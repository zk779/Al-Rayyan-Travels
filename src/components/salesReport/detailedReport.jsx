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
import { SaudiRiyal } from "lucide-react";

export default function DetailedReportTab({
  salesData,
  searchQuery,
  searchBy,
}) {
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
  function truncateText(text, wordLimit) {
    const words = text.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return text;
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
                • Showing {salesData.length} results for "{searchQuery}"
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
                  <TableHead className="text-right">Net Price</TableHead>
                  <TableHead className="text-right">Sell Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchQuery
                        ? `No transactions found for "${searchQuery}"`
                        : "No transactions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  salesData.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {highlightText(
                          format(new Date(sale.date), "MMM dd, yyyy"),
                          searchQuery,
                          "date"
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {highlightText(
                          sale.invoiceNumber,
                          searchQuery,
                          "invoiceNumber"
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {highlightText(
                          sale.documentNumber,
                          searchQuery,
                          "documentNumber"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{sale.airline}</Badge>
                          <span className="text-sm">{sale.airlineName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{sale.customer}</TableCell>
                      <TableCell>{sale.agent}</TableCell>
                      <TableCell>{sale.branch}</TableCell>
                      <TableCell className="text-right ">
                        <div className="flex items-center justify-end gap-1">
                          <SaudiRiyal size={15} />
                          {sale.netPrice.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <SaudiRiyal size={15} />
                          {sale.sellPrice.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <SaudiRiyal size={15} />
                          {sale.profit.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === "Completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={sale.remarks}>
                          {highlightText(
                            truncateText(sale.remarks || "", 2),
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
