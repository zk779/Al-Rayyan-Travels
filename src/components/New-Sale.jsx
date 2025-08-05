import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/components/ui/select";
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

// Mock data - replace with actual API calls
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

export default function NewSaleComponent() {
  const [activeTab, setActiveTab] = useState("new-sale");
  const [date, setDate] = useState(new Date());

  // Multiple Sales State
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

  // Refund State
  const [refundForm, setRefundForm] = useState({
    documentNumber: "",
    airline: "",
    vendor: "",
    netPrice: "",
    refundFee: "",
    serviceCharges: "",
    remarks: "",
  });

  // Deposit State
  const [depositForm, setDepositForm] = useState({
    documentNumber: "",
    netPrice: "",
    remarks: "",
  });

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

  // Refund calculations
  const refundPax =
    refundForm.netPrice && refundForm.refundFee && refundForm.serviceCharges
      ? (
          parseFloat(refundForm.netPrice) -
          parseFloat(refundForm.refundFee) -
          parseFloat(refundForm.serviceCharges)
        ).toFixed(2)
      : "0.00";

  const handleSearch = (type, documentNumber) => {
    // Mock search functionality - replace with actual API call
    console.log(`Searching ${type} for document: ${documentNumber}`);

    if (type === "refund") {
      setRefundForm((prev) => ({
        ...prev,
        airline: "AA",
        vendor: "1",
        netPrice: "250.00",
      }));
    } else if (type === "deposit") {
      setDepositForm((prev) => ({
        ...prev,
        netPrice: "180.00",
      }));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Sales Management
          </CardTitle>
          <CardDescription>
            Manage new sales, process refunds, and handle deposits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new-sale">New Sale</TabsTrigger>
              <TabsTrigger value="refund">Refund</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
            </TabsList>

            <TabsContent value="new-sale" className="space-y-6">
              {/* Date Selection */}
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
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Sale
                  </Button>
                </div>

                {salesItems.map((item, index) => (
                  <Card
                    key={item.id}
                    className="border-l-4 border-l-blue-500 shadow-sm"
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
                            value={item.airline}
                            onValueChange={(value) =>
                              updateSaleItem(item.id, "airline", value)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select airline" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockAirlines.map((airline) => (
                                <SelectItem
                                  key={airline.code}
                                  value={airline.code}
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {airline.code}
                                    </Badge>
                                    <span className="text-sm">
                                      {airline.name}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              updateSaleItem(
                                item.id,
                                "documentNumber",
                                e.target.value
                              )
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
                            value={item.vendor}
                            onValueChange={(value) =>
                              updateSaleItem(item.id, "vendor", value)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockVendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  <span className="text-sm">{vendor.name}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-600">
                            Payment Method
                          </Label>
                          <Select
                            value={item.paymentMethod}
                            onValueChange={(value) =>
                              updateSaleItem(item.id, "paymentMethod", value)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">
                                <div className="flex items-center gap-2">
                                  <Banknote className="h-3 w-3" />
                                  <span className="text-sm">Cash</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="credit">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-3 w-3" />
                                  <span className="text-sm">Credit</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="bank-transfer">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3 w-3" />
                                  <span className="text-sm">Bank Transfer</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
                              updateSaleItem(
                                item.id,
                                "netPrice",
                                e.target.value
                              )
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
                              updateSaleItem(
                                item.id,
                                "sellPrice",
                                e.target.value
                              )
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
                      <div className="text-sm text-gray-600">
                        Total Net Price
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ${totals.totalSellPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Sell Price
                      </div>
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

              <Button className="w-full" size="lg">
                Create All Sales ({salesItems.length} items)
              </Button>
            </TabsContent>
            <TabsContent value="refund" className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter document number to search"
                    value={refundForm.documentNumber}
                    onChange={(e) =>
                      setRefundForm((prev) => ({
                        ...prev,
                        documentNumber: e.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleSearch("refund", refundForm.documentNumber)
                    }
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Airline Code (Selected)</Label>
                    <Select value={refundForm.airline} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Auto-filled after search" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockAirlines.map((airline) => (
                          <SelectItem key={airline.code} value={airline.code}>
                            <Badge variant="secondary">{airline.code}</Badge>{" "}
                            {airline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Vendor (Selected)</Label>
                    <Select value={refundForm.vendor} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Auto-filled after search" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockVendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Net Price (Fetched)</Label>
                    <Input
                      value={refundForm.netPrice}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="refundFee">Refund Fee</Label>
                    <Input
                      id="refundFee"
                      type="number"
                      placeholder="0.00"
                      value={refundForm.refundFee}
                      onChange={(e) =>
                        setRefundForm((prev) => ({
                          ...prev,
                          refundFee: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceCharges">Service Charges</Label>
                    <Input
                      id="serviceCharges"
                      type="number"
                      placeholder="0.00"
                      value={refundForm.serviceCharges}
                      onChange={(e) =>
                        setRefundForm((prev) => ({
                          ...prev,
                          serviceCharges: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Refund PAX (Calculated)</Label>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Net Price:</span>
                          <span>${refundForm.netPrice || "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Refund Fee:</span>
                          <span>-${refundForm.refundFee || "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Service Charges:</span>
                          <span>-${refundForm.serviceCharges || "0.00"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-blue-700">
                          <span>Refund PAX:</span>
                          <span>${refundPax}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundRemarks">Remarks</Label>
                <Textarea
                  id="refundRemarks"
                  placeholder="Enter refund remarks..."
                  value={refundForm.remarks}
                  onChange={(e) =>
                    setRefundForm((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                />
              </div>

              <Button className="w-full" size="lg" variant="destructive">
                Process Refund
              </Button>
            </TabsContent>

            {/* DEPOSIT TAB */}
            <TabsContent value="deposit" className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter document number to search"
                    value={depositForm.documentNumber}
                    onChange={(e) =>
                      setDepositForm((prev) => ({
                        ...prev,
                        documentNumber: e.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleSearch("deposit", depositForm.documentNumber)
                    }
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <Label>Net Price (To Pay Supplier)</Label>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-700">
                        Amount to Pay:
                      </span>
                      <span className="text-lg font-semibold text-orange-800">
                        ${depositForm.netPrice || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositRemarks">Remarks</Label>
                  <Textarea
                    id="depositRemarks"
                    placeholder="Enter deposit remarks..."
                    value={depositForm.remarks}
                    onChange={(e) =>
                      setDepositForm((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                  />
                </div>

                <Button className="w-full" size="lg" variant="secondary">
                  Process Deposit Payment
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
