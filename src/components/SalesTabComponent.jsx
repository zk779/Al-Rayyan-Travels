"use client";

import { useState } from "react";
import Select from "react-select";
import { CalendarIcon, Plus, Trash2, Receipt, Calculator } from "lucide-react";
import { format } from "date-fns";

// Import shadcn components
import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";

export default function SalesTabComponent() {
  const [date, setDate] = useState(new Date());
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
      creditDetails: "",
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
        creditDetails: "",
      },
    ]);
  };

  const removeSaleRow = (id) => {
    if (salesItems.length > 1) {
      setSalesItems(salesItems.filter((item) => item.id !== id));
    }
  };

  const updateSaleItem = (id, field, value) => {
    setSalesItems(
      salesItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateProfit = (netPrice, sellPrice) => {
    if (netPrice && sellPrice) {
      return (parseFloat(sellPrice) - parseFloat(netPrice)).toFixed(2);
    }
    return "0.00";
  };

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
    label: `${airline.code} - ${airline.name}`,
  }));

  const vendorOptions = mockVendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.name,
  }));

  const paymentOptions = [
    { value: "cash", label: "Cash" },
    { value: "credit", label: "Credit" },
    { value: "bank-transfer", label: "Bank Transfer" },
  ];

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <Card className="bg-slate-50 mb-2">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">
              Transaction Date:
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal bg-white max-w-60"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
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

        {/* Scrollable Table Container */}
        <Card className="border-l-4 border-l-gray-500 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Sales Details
              </CardTitle>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            {salesItems.map((item) => {
              const isCredit = item.paymentMethod === "credit";
              return (
                <table className="w-full table-auto border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-36">
                        Airline
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-32">
                        Doc Number
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-36">
                        Vendor
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-28">
                        Payment
                      </th>
                      {item.paymentMethod === "credit" && (
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-28">
                          Credit Type
                        </th>
                      )}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-24">
                        Net Price
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-24">
                        Sell Price
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-24">
                        Profit
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-32">
                        Remarks
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 min-w-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      key={item.id}
                      className="border-b hover:bg-gray-25 transition-colors"
                    >
                      {/* Airline */}
                      <td className="px-1 py-2 align-top">
                        <Select
                          options={airlineOptions}
                          value={
                            airlineOptions.find(
                              (o) => o.value === item.airline
                            ) || null
                          }
                          onChange={(o) =>
                            updateSaleItem(item.id, "airline", o?.value)
                          }
                          placeholder="Select"
                          className="text-xs"
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </td>

                      {/* Document Number */}
                      <td className="px-1 py-2">
                        <Input
                          value={item.documentNumber}
                          onChange={(e) =>
                            updateSaleItem(
                              item.id,
                              "documentNumber",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 123"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Vendor */}
                      <td className="px-1 py-2">
                        <Select
                          options={vendorOptions}
                          value={
                            vendorOptions.find(
                              (o) => o.value === item.vendor
                            ) || null
                          }
                          onChange={(o) =>
                            updateSaleItem(item.id, "vendor", o?.value)
                          }
                          placeholder="Select"
                          className="text-xs"
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </td>

                      {/* Payment Method */}
                      <td className="px-1 py-2">
                        <Select
                          options={paymentOptions}
                          value={
                            item.paymentMethod
                              ? {
                                  value: item.paymentMethod,
                                  label: item.paymentMethod,
                                }
                              : null
                          }
                          onChange={(o) =>
                            updateSaleItem(item.id, "paymentMethod", o?.value)
                          }
                          placeholder="Method"
                          className="text-xs"
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </td>

                      {/* Credit Details (Conditional) */}
                      {item.paymentMethod === "credit" && (
                        <td className="px-1 py-2">
                          <Select
                            options={[
                              { value: "installments", label: "Installments" },
                              { value: "credit-card", label: "Credit Card" },
                            ]}
                            value={
                              item.creditDetails
                                ? {
                                    value: item.creditDetails,
                                    label: item.creditDetails,
                                  }
                                : null
                            }
                            onChange={(o) =>
                              updateSaleItem(item.id, "creditDetails", o?.value)
                            }
                            placeholder="Type"
                            className="text-xs"
                            menuPortalTarget={document.body}
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                          />
                        </td>
                      )}

                      {/* Net Price */}
                      <td className="px-1 py-2">
                        <Input
                          type="number"
                          value={item.netPrice}
                          onChange={(e) =>
                            updateSaleItem(item.id, "netPrice", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Sell Price */}
                      <td className="px-1 py-2">
                        <Input
                          type="number"
                          value={item.sellPrice}
                          onChange={(e) =>
                            updateSaleItem(item.id, "sellPrice", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Profit */}
                      <td className="px-1 py-2">
                        <div className="flex items-center gap-1 px-2 py-2 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-700">
                          <Calculator className="h-3 w-3" />$
                          {calculateProfit(item.netPrice, item.sellPrice)}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="px-1 py-2">
                        <Input
                          value={item.remarks}
                          onChange={(e) =>
                            updateSaleItem(item.id, "remarks", e.target.value)
                          }
                          placeholder="Note"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Delete Button */}
                      <td className="px-1 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSaleRow(item.id)}
                          disabled={salesItems.length <= 1}
                          className=" text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })}
          </div>
        </Card>
      </div>

      <Button className="w-full bg-gradient-primary text-white" size="lg">
        Create All Sales ({salesItems.length} items)
      </Button>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Calculator className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {salesItems.length}
              </div>
              <div className="text-sm text-gray-600">Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ${totals.totalNetPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Net Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${totals.totalSellPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Sell Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${totals.totalProfit.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
