"use client";

import { Building2, DollarSign, Users, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
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
// import { Progress } from "@/components/ui/progress";

// Props: salesData (array), totalSales (number)

export default function BranchReportTab({ salesData, totalSales }) {
  // Calculate branch performance
  const branchPerformance = salesData.reduce((acc, sale) => {
    if (!acc[sale.branch]) {
      acc[sale.branch] = { sales: 0, profit: 0, transactions: 0 };
    }
    acc[sale.branch].sales += sale.sellPrice;
    acc[sale.branch].profit += sale.profit;
    acc[sale.branch].transactions += 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(branchPerformance)
              .sort(([, a], [, b]) => b.sales - a.sales)
              .map(([branchName, data]) => {
                const percentage =
                  totalSales > 0 ? (data.sales / totalSales) * 100 : 0;
                const profitMargin =
                  data.sales > 0 ? (data.profit / data.sales) * 100 : 0;
                const avgTransactionValue =
                  data.transactions > 0 ? data.sales / data.transactions : 0;

                // Mock branch details
                const branchDetails = {
                  "Main Branch": {
                    code: "MB001",
                    address: "123 Business District, Downtown",
                    city: "New York",
                    country: "USA",
                    phone: "+1 555 123 4567",
                    email: "main@alrayyan.com",
                    manager: "Sarah Johnson",
                    staffCount: 25,
                    status: "Active",
                  },
                  "Airport Branch": {
                    code: "AB002",
                    address: "Terminal 1, JFK Airport",
                    city: "New York",
                    country: "USA",
                    phone: "+1 555 234 5678",
                    email: "airport@alrayyan.com",
                    manager: "Mike Wilson",
                    staffCount: 15,
                    status: "Active",
                  },
                  "Mall Branch": {
                    code: "ML003",
                    address: "Level 2, Central Mall",
                    city: "Los Angeles",
                    country: "USA",
                    phone: "+1 555 345 6789",
                    email: "mall@alrayyan.com",
                    manager: "Emily Davis",
                    staffCount: 12,
                    status: "Active",
                  },
                  "Downtown Branch": {
                    code: "DT004",
                    address: "456 Main Street",
                    city: "Chicago",
                    country: "USA",
                    phone: "+1 555 456 7890",
                    email: "downtown@alrayyan.com",
                    manager: "David Brown",
                    staffCount: 8,
                    status: "Inactive",
                  },
                };

                const branch = branchDetails[branchName] || {
                  code: "N/A",
                  address: "Address not available",
                  city: "Unknown",
                  country: "Unknown",
                  phone: "N/A",
                  email: "N/A",
                  manager: "Unknown",
                  staffCount: 0,
                  status: "Unknown",
                };

                return (
                  <Card
                    key={branchName}
                    className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            {branchName}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {branch.code}
                            </Badge>
                            <Badge
                              variant={
                                branch.status === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {branch.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${data.sales.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {percentage.toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Branch Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Branch Details
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-medium text-right">
                              {branch.address}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">
                              {branch.city}, {branch.country}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{branch.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{branch.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Manager Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Management
                        </h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Branch Manager:</span>
                          <div className="text-right">
                            <div className="font-medium">{branch.manager}</div>
                            <Badge variant="secondary" className="text-xs">
                              Manager
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Staff Count:</span>
                          <span className="font-medium">
                            {branch.staffCount} employees
                          </span>
                        </div>
                      </div>

                      {/* Financial Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Financial Performance
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">
                              ${data.sales.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Total Sales
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">
                              ${data.profit.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Total Profit
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">
                              {data.transactions}
                            </div>
                            <div className="text-xs text-gray-600">
                              Transactions
                            </div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-lg font-bold text-orange-600">
                              ${avgTransactionValue.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Avg Transaction
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Branch Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Staff Count</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Avg Transaction</TableHead>
                  <TableHead className="text-right">Profit Margin</TableHead>
                  <TableHead className="text-right">Market Share</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(branchPerformance)
                  .sort(([, a], [, b]) => b.sales - a.sales)
                  .map(([branchName, data]) => {
                    const percentage =
                      totalSales > 0 ? (data.sales / totalSales) * 100 : 0;
                    const profitMargin =
                      data.sales > 0 ? (data.profit / data.sales) * 100 : 0;
                    const avgTransactionValue =
                      data.transactions > 0
                        ? data.sales / data.transactions
                        : 0;

                    const branchDetails = {
                      "Main Branch": {
                        manager: "Sarah Johnson",
                        location: "New York, USA",
                        staffCount: 25,
                        status: "Active",
                      },
                      "Airport Branch": {
                        manager: "Mike Wilson",
                        location: "New York, USA",
                        staffCount: 15,
                        status: "Active",
                      },
                      "Mall Branch": {
                        manager: "Emily Davis",
                        location: "Los Angeles, USA",
                        staffCount: 12,
                        status: "Active",
                      },
                      "Downtown Branch": {
                        manager: "David Brown",
                        location: "Chicago, USA",
                        staffCount: 8,
                        status: "Inactive",
                      },
                    };

                    const branch = branchDetails[branchName] || {
                      manager: "Unknown",
                      location: "Unknown",
                      staffCount: 0,
                      status: "Unknown",
                    };

                    return (
                      <TableRow key={branchName}>
                        <TableCell className="font-medium">
                          {branchName}
                        </TableCell>
                        <TableCell>{branch.manager}</TableCell>
                        <TableCell>{branch.location}</TableCell>
                        <TableCell className="text-right">
                          {branch.staffCount}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${data.sales.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          ${data.profit.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {data.transactions}
                        </TableCell>
                        <TableCell className="text-right">
                          ${avgTransactionValue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {profitMargin.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              branch.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {branch.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
