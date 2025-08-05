"use client";

import { useState } from "react";
import Select from "react-select"; // Import react-select
import {
  CalendarIcon,
  Search,
  Calculator,
  CreditCard,
  Banknote,
  Building2,
  Plus,
  Trash2,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";

// Update import paths to reference the correct location
import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { Badge } from "../../shadcn/components/ui/badge";
import { Separator } from "../../shadcn/components/ui/separator";

export default function SalesTabComponent() {
  const [date, setDate] = useState(new Date()); // Initialize the date state

  const [salesItems, setSalesItems] = useState([
    {
      id: "1",
      airline: "",
      documentNumber: "",
      vendor: "",
      netPrice: "",
      sellPrice: "",
      paymentMethod: "",
      remarks: "",
    },
  ]);

  const mockAirlines = [
    { code: "AA", name: "American Airlines" },
    { code: "BA", name: "British Airways" },
    { code: "EK", name: "Emirates" },
    { code: "LH", name: "Lufthansa" },
    { code: "QR", name: "Qatar Airways" },
  ];

  const mockVendors = [
    { id: "1", name: "Global Travel Solutions" },
    { id: "2", name: "Sky High Bookings" },
    { id: "3", name: "Premier Travel Partners" },
    { id: "4", name: "Elite Airways Distribution" },
  ];

  // Add new sale row
  const addSaleRow = () => {
    const newId = (salesItems.length + 1).toString();
    setSalesItems([
      ...salesItems,
      {
        id: newId,
        airline: "",
        documentNumber: "",
        vendor: "",
        netPrice: "",
        sellPrice: "",
        paymentMethod: "",
        remarks: "",
      },
    ]);
  };

  // Remove sale row
  const removeSaleRow = (id) => {
    if (salesItems.length > 1) {
      setSalesItems(salesItems.filter((item) => item.id !== id));
    }
  };

  // Update sale item
  const updateSaleItem = (id, field, value) => {
    setSalesItems(
      salesItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Calculate profit for a single item
  const calculateProfit = (netPrice, sellPrice) => {
    if (netPrice && sellPrice) {
      return (parseFloat(sellPrice) - parseFloat(netPrice)).toFixed(2);
    }
    return "0.00";
  };

  // Calculate totals
  const totals = salesItems.reduce(
    (acc, item) => {
      const netPrice = parseFloat(item.netPrice) || 0;
      const sellPrice = parseFloat(item.sellPrice) || 0;
      const profit = sellPrice - netPrice;

      return {
        totalNetPrice: acc.totalNetPrice + netPrice,
        totalSellPrice: acc.totalSellPrice + sellPrice,
        totalProfit: acc.totalProfit + profit,
      };
    },
    { totalNetPrice: 0, totalSellPrice: 0, totalProfit: 0 }
  );

  const airlineOptions = mockAirlines.map((airline) => ({
    value: airline.code,
    label: airline.name,
  }));

  const vendorOptions = mockVendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));

  return (
    <div className="space-y-4">
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="date" className="text-sm font-medium">
              Transaction Date:
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal bg-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Sales Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sales Items</h3>
          <Button
            onClick={addSaleRow}
            className="flex items-center gap-2 bg-gradient-primary text-white"
          >
            <Plus className="h-4 w-4" />
            Add New Sale
          </Button>
        </div>

        {salesItems.map((item, index) => (
          <Card
            key={item.id}
            className="border-l-4 border-l-gray-500 shadow-sm"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Sale #{index + 1}
                </CardTitle>
                {salesItems.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSaleRow(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Airline Code */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Airline Code
                  </Label>
                  <Select
                    options={airlineOptions}
                    value={airlineOptions.find(
                      (option) => option.value === item.airline
                    )}
                    onChange={(selectedOption) =>
                      updateSaleItem(item.id, "airline", selectedOption.value)
                    }
                    className="w-full"
                    placeholder="Select airline"
                  />
                </div>

                {/* Document Number */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Document Number
                  </Label>
                  <Input
                    placeholder="Enter document number"
                    value={item.documentNumber}
                    onChange={(e) =>
                      updateSaleItem(item.id, "documentNumber", e.target.value)
                    }
                    className="h-9"
                  />
                </div>

                {/* Vendor */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Vendor
                  </Label>
                  <Select
                    options={vendorOptions}
                    value={vendorOptions.find(
                      (option) => option.value === item.vendor
                    )}
                    onChange={(selectedOption) =>
                      updateSaleItem(item.id, "vendor", selectedOption.value)
                    }
                    className="w-full"
                    placeholder="Select vendor"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Payment Method
                  </Label>
                  <Select
                    options={[
                      { value: "cash", label: "Cash" },
                      { value: "credit", label: "Credit" },
                      { value: "bank-transfer", label: "Bank Transfer" },
                    ]}
                    value={
                      item.paymentMethod
                        ? {
                            value: item.paymentMethod,
                            label: item.paymentMethod,
                          }
                        : null
                    }
                    onChange={(selectedOption) =>
                      updateSaleItem(
                        item.id,
                        "paymentMethod",
                        selectedOption.value
                      )
                    }
                    className="w-full"
                    placeholder="Select method"
                  />
                </div>
              </div>

              {/* Price Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Net Price (Buying)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={item.netPrice}
                    onChange={(e) =>
                      updateSaleItem(item.id, "netPrice", e.target.value)
                    }
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Sell Price
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={item.sellPrice}
                    onChange={(e) =>
                      updateSaleItem(item.id, "sellPrice", e.target.value)
                    }
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Profit
                  </Label>
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md h-9">
                    <Calculator className="h-3 w-3 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      ${calculateProfit(item.netPrice, item.sellPrice)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Remarks
                  </Label>
                  <Input
                    placeholder="Optional remarks"
                    value={item.remarks}
                    onChange={(e) =>
                      updateSaleItem(item.id, "remarks", e.target.value)
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Transaction Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {salesItems.length}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${totals.totalNetPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Net Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${totals.totalSellPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Sell Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${totals.totalProfit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full bg-gradient-primary text-white" size="lg">
        Create All Sales ({salesItems.length} items)
      </Button>
    </div>
  );
}
