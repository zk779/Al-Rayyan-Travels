"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Plus, Trash2, Receipt, Calculator, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

// shadcn
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

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function SalesTabComponent({ sales, setSales }) {
  /* =========================
     LOCAL STATE
  ========================= */
  const [date, setDate] = useState(new Date());

  // ✅ UI state (what user sees)
  const [uiSales, setUiSales] = useState([]);

  /* =========================
     HELPERS
  ========================= */
  const emptyRow = () => ({
    id: crypto.randomUUID(), // ✅ give an id (needed for update/remove)
    airlineId: "",
    documentNo: "",
    vendorId: "",
    customerId: "",
    netPrice: "",
    sellPrice: "",
    paidAmount: "",
    paymentType: "",
    remarks: "",
  });

  const isEmptySale = (s) => {
    return (
      !s.airlineId &&
      !s.documentNo &&
      !s.vendorId &&
      !s.customerId &&
      !s.netPrice &&
      !s.sellPrice &&
      !s.paidAmount &&
      !s.paymentType &&
      !s.remarks
    );
  };

  /* =========================
     INIT UI FROM PARENT
     - If parent has real sales -> show them
     - If parent empty -> show 1 UI placeholder row
  ========================= */
  useEffect(() => {
    if (Array.isArray(sales) && sales.length > 0) {
      // ensure each row has an id
      const withIds = sales.map((s) => ({
        ...emptyRow(),
        ...s,
        id: s.id || crypto.randomUUID(),
      }));
      setUiSales(withIds);
    } else {
      setUiSales([emptyRow()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     MASTER DATA
  ========================= */
  const [airlines, setAirlines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);

  const token = localStorage.getItem("token");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    fetch(`${API_BASE}/api/airlines`, { headers })
      .then((r) => r.json())
      .then((j) => setAirlines(j.data || []));

    fetch(`${API_BASE}/api/vendors`, { headers })
      .then((r) => r.json())
      .then((j) => setVendors(j.data || []));

    fetch(`${API_BASE}/api/customers?isActive=true`, { headers })
      .then((r) => r.json())
      .then((j) => setCustomers(j.data || []));
  }, []);

  /* =========================
     VENDOR LOOKUP
  ========================= */
  const vendorMap = useMemo(() => {
    const map = {};
    vendors.forEach((v) => {
      map[v.id] = v;
    });
    return map;
  }, [vendors]);

  /* =========================
     SYNC PAYLOAD SALES (IMPORTANT)
     ✅ Parent always receives cleanedSales
     ✅ Refund-only => sales becomes []
  ========================= */
  useEffect(() => {
    const cleanedSales = uiSales.filter((s) => !isEmptySale(s));
    setSales(cleanedSales);
  }, [uiSales, setSales]);

  /* =========================
     ROW HANDLING (UI ONLY)
  ========================= */
  const addSaleRow = () => {
    setUiSales((prev) => [...prev, emptyRow()]);
  };

  const removeSaleRow = (id) => {
    setUiSales((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next.length === 0 ? [emptyRow()] : next; // ✅ always keep 1 row for UI
    });
  };

  const updateSale = (id, field, value) => {
    setUiSales((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        /* =========================
           🔒 VENDOR BALANCE VALIDATION
           (INSTANT – ON CHANGE)
        ========================= */
        if (field === "netPrice") {
          const vendor = vendorMap[item.vendorId];
          const netValue = Number(value || 0);

          // NOTE: You wrote CREDIT here in your code. Keep it as you want.
          // If you actually meant DEBIT, change CREDIT -> DEBIT.
          if (vendor && String(vendor.category).toUpperCase() === "CREDIT") {
            const balance = Number(vendor.account?.balance || 0);
            if (netValue > balance) {
              alert(
                `Insufficient vendor balance.\n\nAvailable: ${balance}\nEntered: ${netValue}`
              );
              return item; // ❌ block update
            }
          }
        }

        if (field === "paymentType") {
          const isCredit = String(value).toUpperCase() === "CREDIT";
          return {
            ...item,
            paymentType: value,
            customerId: isCredit ? item.customerId : "",
            paidAmount: isCredit ? item.paidAmount : item.sellPrice || "",
          };
        }

        if (field === "paidAmount") {
          const sell = Number(item.sellPrice || 0);
          return { ...item, paidAmount: Math.min(Number(value || 0), sell) };
        }

        return { ...item, [field]: value };
      })
    );
  };

  /* =========================
     CALCULATIONS (based on UI rows)
  ========================= */
  const calculateProfit = (net, sell) =>
    net && sell ? (sell - net).toFixed(2) : "0.00";

  const totals = uiSales.reduce(
    (acc, item) => {
      const net = Number(item.netPrice) || 0;
      const sell = Number(item.sellPrice) || 0;
      return {
        net: acc.net + net,
        sell: acc.sell + sell,
        profit: acc.profit + (sell - net),
      };
    },
    { net: 0, sell: 0, profit: 0 }
  );

  /* =========================
     OPTIONS
  ========================= */
  const airlineOptions = airlines.map((a) => ({
    value: a.id,
    label: `${a.airlineCode} - ${a.airlineName}`,
  }));

  const vendorOptions = vendors.map((v) => ({
    value: v.id,
    label: v.vendorName,
  }));

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.customerName,
  }));

  const paymentOptions = [
    { value: "CASH", label: "Cash" },
    { value: "CREDIT", label: "Credit" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
  ];

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <Card className="bg-slate-50 mb-2">
        <CardContent>
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
                  {format(date, "PPP")}
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

        <Card className="border-l-4 border-l-gray-500 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Sales Details
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            {uiSales.map((item) => {
              const isCredit =
                String(item.paymentType).toUpperCase() === "CREDIT";

              return (
                <table
                  key={item.id}
                  className="w-full table-auto border-separate border-spacing-0 text-sm"
                >
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left">Airline</th>
                      <th className="px-3 py-2">Doc</th>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2">Payment</th>
                      {/* ✅ Customer column only shows for CREDIT */}
                      {isCredit && <th className="px-3 py-2">Customer</th>}
                      <th className="px-3 py-2">Net</th>
                      <th className="px-3 py-2">Sell</th>
                      <th className="px-3 py-2">Paid</th>
                      <th className="px-3 py-2">Profit</th>
                      <th className="px-3 py-2">Remarks</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-1 py-2 w-44 align-top">
                        <Select
                          options={airlineOptions}
                          value={
                            airlineOptions.find(
                              (o) => o.value === item.airlineId
                            ) || null
                          }
                          onChange={(o) =>
                            updateSale(item.id, "airlineId", o?.value)
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
                      <td className="px-1 w-44 py-2">
                        <Input
                          value={item.documentNo}
                          onChange={(e) =>
                            updateSale(item.id, "documentNo", e.target.value)
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
                              (o) => o.value === item.vendorId
                            ) || null
                          }
                          onChange={(o) =>
                            updateSale(item.id, "vendorId", o?.value)
                          }
                          placeholder="Select"
                          className="text-xs"
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </td>

                      <td className="px-1 py-2">
                        <Select
                          options={paymentOptions}
                          value={
                            item.paymentType
                              ? paymentOptions.find(
                                  (p) =>
                                    p.value ===
                                    String(item.paymentType).toUpperCase()
                                ) || null
                              : null
                          }
                          onChange={(o) =>
                            updateSale(item.id, "paymentType", o?.value)
                          }
                          placeholder="Method"
                          className="text-xs"
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </td>

                      {isCredit && (
                        <td className="px-1 py-2 w-[180px] min-w-[180px] max-w-[180px] align-top">
                          <Select
                            options={customerOptions}
                            value={
                              customerOptions.find(
                                (o) => o.value === item.customerId
                              ) || null
                            }
                            onChange={(o) =>
                              updateSale(item.id, "customerId", o?.value)
                            }
                            placeholder="Select customer"
                            className="text-xs"
                            menuPortalTarget={document.body}
                            styles={{
                              container: (base) => ({
                                ...base,
                                width: 180,
                                minWidth: 180,
                                maxWidth: 180,
                              }),
                              control: (base) => ({
                                ...base,
                                minHeight: 36,
                                height: 36,
                              }),
                              valueContainer: (base) => ({
                                ...base,
                                paddingTop: 0,
                                paddingBottom: 0,
                              }),
                              indicatorsContainer: (base) => ({
                                ...base,
                                height: 36,
                              }),
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              menu: (base) => ({ ...base, width: 240 }),
                            }}
                          />
                        </td>
                      )}

                      {/* Net Price */}
                      <td className="px-1 w-24 py-2">
                        <Input
                          type="number"
                          value={item.netPrice}
                          onChange={(e) =>
                            updateSale(item.id, "netPrice", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-9 text-sm"
                        />
                      </td>

                      {/* Sell Price */}
                      <td className="px-1 w-24 py-2">
                        <Input
                          type="number"
                          value={item.sellPrice}
                          onChange={(e) =>
                            updateSale(item.id, "sellPrice", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-9 text-sm"
                        />
                      </td>
                      <td className="px-1 w-24 py-2">
                        <Input
                          type="number"
                          value={item.paidAmount}
                          onChange={(e) =>
                            updateSale(item.id, "paidAmount", e.target.value)
                          }
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
                            updateSale(item.id, "remarks", e.target.value)
                          }
                          placeholder="Note"
                          className="h-9 text-sm"
                        />
                      </td>

                      <td>
                        <Button
                          variant="ghost"
                          onClick={() => removeSaleRow(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })}
          </div>
        </Card>

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
                <div className="text-2xl font-bold">{sales.length}</div>
                <div className="text-sm">Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ${totals.net.toFixed(2)}
                </div>
                <div className="text-sm">Net Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ${totals.sell.toFixed(2)}
                </div>
                <div className="text-sm">Sell Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${totals.profit.toFixed(2)}
                </div>
                <div className="text-sm">Profit</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
