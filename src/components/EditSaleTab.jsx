"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Select from "react-select";
import {
  Trash2,
  Receipt,
  Calculator,
  MapPin,
  Eye,
  Plus,
  Route,
  SaudiRiyal,
  Save,
  CalendarIcon,
} from "lucide-react";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Badge } from "../../shadcn/components/ui/badge";
import ManageDestinationsDialog from "./ManageDestinationsDialog";
import { format } from "date-fns";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { appToast } from "../../shadcn/components/ui/appToast";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const compactSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: 32,
    height: 32,
    boxShadow: "none",
    fontSize: "13px",
  }),
  valueContainer: (base) => ({ ...base, height: 32, padding: "0 6px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: 32 }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const routeTypeOptions = [
  { value: "DOMESTIC", label: "Domestic (KSA Only)" },
  { value: "MIXED", label: "Domestic/International (Mixed)" },
  { value: "ZERO_VAT", label: "Zero VAT Route (Non-KSA)" },
];

const paymentOptions = [
  { value: "CASH", label: "Cash" },
  { value: "CREDIT", label: "Credit" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

/* ========================= HELPERS ========================= */
const detectRouteType = (destinations) => {
  if (!destinations?.length) return "";
  const hasKSA = destinations.some((d) => d.airport?.country === "SA");
  const hasNonKSA = destinations.some((d) => d.airport?.country !== "SA");
  if (hasKSA && !hasNonKSA) return "DOMESTIC";
  if (hasKSA && hasNonKSA) return "MIXED";
  if (!hasKSA && hasNonKSA) return "ZERO_VAT";
  return "";
};

const calculateVAT = (profit) => {
  const p = Number(profit) || 0;
  if (p <= 0) return "0.00";
  return ((p / 1.15) * 0.15).toFixed(2);
};

const calculatePaxVAT = (netPrice) => {
  const n = Number(netPrice) || 0;
  if (n <= 0) return "0.00";
  return ((n / 1.15) * 0.15).toFixed(2);
};

const calculateProfit = (net, sell, vat) =>
  (Number(sell || 0) - Number(net || 0) - Number(vat || 0)).toFixed(2);

/* ========================= COMPONENT ========================= */
export default function EditSalesTab({ saleId }) {
  const [uiSales, setUiSales] = useState([]);
  const [destinationDialog, setDestinationDialog] = useState({
    open: false,
    saleId: null,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [airlines, setAirlines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [saleDate, setSaleDate] = useState(null);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  /* ========================= FETCH SALE DATA ========================= */
  useEffect(() => {
    if (!saleId || !token) return;
    const controller = new AbortController();

    async function fetchSale() {
      try {
        setFetching(true);
        const res = await fetch(`${API_BASE}/api/sales/${saleId}`, {
          headers,
          signal: controller.signal,
        });
        const response = await res.json();

        if (!res.ok) throw new Error(response.error || "Failed to fetch sale");

        // 1. Access the main data object
        const invoiceData = response.data;

        // 2. Set Header Information
        if (invoiceData.invoiceNo) setInvoiceNo(invoiceData.invoiceNo);
        if (invoiceData.saleDate) {
          // Ensure it's a Date object for the Calendar component
          setSaleDate(new Date(invoiceData.saleDate));
        }

        // 3. Set Sales Array
        const fetched = Array.isArray(invoiceData.sales)
          ? invoiceData.sales
          : [];
        setUiSales(fetched.map((s) => ({ ...s })));
      } catch (err) {
        if (err.name !== "AbortError") setFetchError(err.message);
      } finally {
        setFetching(false);
      }
    }

    fetchSale();
    return () => controller.abort();
  }, [saleId, token]);

  /* ========================= MASTER DATA ========================= */
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
  }, [headers]);

  /* ========================= DESTINATIONS ASYNC SEARCH ========================= */
  const loadDestinationOptions = useCallback(
    (inputValue) => {
      if (!inputValue || inputValue.length < 2) return Promise.resolve([]);
      return fetch(
        `${API_BASE}/api/destinations/search?q=${encodeURIComponent(inputValue)}&limit=20`,
        { headers },
      )
        .then((r) => r.json())
        .then((j) =>
          j.success && j.data
            ? j.data.map((airport) => ({
                value: airport.iata,
                label: `${airport.iata} - ${airport.city}, ${airport.country}`,
                airport,
              }))
            : [],
        )
        .catch(() => []);
    },
    [headers],
  );

  /* ========================= LOOKUPS ========================= */
  const vendorMap = useMemo(() => {
    const map = {};
    vendors.forEach((v) => (map[v.id] = v));
    return map;
  }, [vendors]);

  const airlineOptions = airlines.map((a) => ({
    value: a.id,
    label: `${a.airlineCode} - ${a.iataName}`,
  }));
  const vendorOptions = vendors.map((v) => ({
    value: v.id,
    label: v.vendorName,
  }));
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.customerName,
  }));

  /* ========================= UPDATE SALE ROW ========================= */
const updateSale = (id, field, value) => {
  // 1. DATA VALIDATION (Outside state setter)
  if (field === "netPrice") {
    const item = uiSales.find((s) => s.id === id);
    const vendor = vendorMap[item?.vendorId];
    const newNetValue = Number(value || 0);

    if (vendor && String(vendor.category).toUpperCase() === "CREDIT") {
      const currentAccountBalance = Number(vendor.account?.balance || 0);
      
      /** * ADD BACK THE ORIGINAL PRICE:
       * Since 'item' is the record currently in state (from the database),
       * we add its existing netPrice back to the balance to see the 
       * true available limit.
       */
      const originalNetPrice = Number(item.netPrice || 0);
      const effectiveBalance = currentAccountBalance + originalNetPrice;

      if (newNetValue > effectiveBalance) {
        appToast.warning(
          "Low Vendor Balance",
          `Insufficient balance.\n\nLimit: ${effectiveBalance}\nEntered: ${newNetValue}`
        );
        return; 
      }
    }
  }

  // 2. STATE UPDATES (Remains the same...)
  setUiSales((prev) => 
    prev.map((item) => {
      if (item.id !== id) return item;

      if (field === "paymentType") {
        const isCredit = String(value).toUpperCase() === "CREDIT";
        return {
          ...item,
          paymentType: value,
          customerId: isCredit ? item.customerId : "",
          paidAmount: isCredit ? item.paidAmount : item.sellPrice || "",
          paxName: isCredit ? "" : item.paxName,
        };
      }

      if (field === "paidAmount") {
        return {
          ...item,
          paidAmount: Math.min(
            Number(value || 0),
            Number(item.sellPrice || 0)
          ),
        };
      }

      if (field === "destinations") {
        const newRouteType = detectRouteType(value);
        const updated = {
          ...item,
          destinations: value,
          routeType: newRouteType,
        };
        if (newRouteType === "DOMESTIC") {
          updated.paxVat = calculatePaxVAT(updated.netPrice);
          updated.miscCharges = "";
        } else if (newRouteType === "ZERO_VAT") {
          updated.paxVat = "";
          updated.vatAmount = "0.00";
        } else {
          updated.paxVat = "";
          updated.miscCharges = "";
        }
        return updated;
      }

      if (field === "netPrice" || field === "sellPrice") {
        const updated = { ...item, [field]: value };
        const profit =
          Number(updated.sellPrice || 0) - Number(updated.netPrice || 0);
        if (updated.routeType === "DOMESTIC")
          updated.paxVat = calculatePaxVAT(updated.netPrice);
        updated.vatAmount =
          updated.routeType === "ZERO_VAT" ? "0.00" : calculateVAT(profit);
        return updated;
      }

      return { ...item, [field]: value };
    })
  );
};

  const removeSale = (id) => {
    setUiSales((prev) => prev.filter((s) => s.id !== id));
  };

  const removeDestination = (saleId, destValue) => {
    setUiSales((prev) =>
      prev.map((item) => {
        if (item.id !== saleId) return item;
        const newDestinations = item.destinations.filter(
          (d) => d.value !== destValue,
        );
        const newRouteType = detectRouteType(newDestinations);
        const updated = {
          ...item,
          destinations: newDestinations,
          routeType: newRouteType,
        };
        if (newRouteType === "DOMESTIC") {
          updated.paxVat = calculatePaxVAT(updated.netPrice);
          updated.miscCharges = "";
        } else if (newRouteType === "ZERO_VAT") {
          updated.paxVat = "";
          updated.vatAmount = "0.00";
        } else {
          updated.paxVat = "";
          updated.miscCharges = "";
        }
        return updated;
      }),
    );
  };

  /* ========================= TOTALS ========================= */
  const totals = uiSales.reduce(
    (acc, item) => {
      const net = Number(item.netPrice) || 0;
      const sell = Number(item.sellPrice) || 0;
      const vat = Number(item.vatAmount) || 0;
      return {
        net: acc.net + net,
        sell: acc.sell + sell,
        profit: acc.profit + (sell - net - vat),
        vat: acc.vat + vat,
        paxVat: acc.paxVat + (Number(item.paxVat) || 0),
        misc: acc.misc + (Number(item.miscCharges) || 0),
      };
    },
    { net: 0, sell: 0, profit: 0, vat: 0, paxVat: 0, misc: 0 },
  );

  /* ========================= SUBMIT (UPDATE) ========================= */
  const handleSubmit = async () => {
    // 1. Initial Check
    if (uiSales.length === 0) {
      appToast.warning("No Changes", "There are no sales to update.");
      return;
    }

    // 2. Validation
    for (const sale of uiSales) {
      if (
        !sale.airlineId ||
        !sale.vendorId ||
        !sale.documentNo ||
        !sale.netPrice ||
        !sale.sellPrice ||
        !sale.paymentType
      ) {
        appToast.error(
          "Missing Information",
          "Please fill all required fields (Airline, Vendor, Document No, Net, Sell, Payment)",
        );
        return;
      }
      if (
        String(sale.paymentType).toUpperCase() === "CREDIT" &&
        !sale.customerId
      ) {
        appToast.error(
          "Customer Required",
          "Customer is required for CREDIT payment type",
        );
        return;
      }
    }

    // 3. Prepare Payload
    const payload = {
      sales: uiSales.map((s) => ({
        id: s.id,
        invoiceNo: invoiceNo,
        saleDate: saleDate ? saleDate.toISOString() : null,
        airlineId: s.airlineId,
        vendorId: s.vendorId,
        customerId: s.customerId || null,
        documentNo: s.documentNo,
        pnr: s.pnr || null,
        routeType: s.routeType || null,
        tripType: s.tripType || "ONE_WAY",
        departureDate: s.departureDate || null,
        returnDate: s.returnDate || null,
        paxName: s.paxName || null,
        destinations: s.destinations || [],
        netPrice: Number(s.netPrice),
        sellPrice: Number(s.sellPrice),
        vatAmount: Number(s.vatAmount || 0),
        paxVat: Number(s.paxVat || 0),
        miscCharges: Number(s.miscCharges || 0),
        paidAmount: Number(s.paidAmount || 0),
        paymentType: s.paymentType,
        remarks: s.remarks || null,
      })),
    };

    // 4. Submit with Promise Toast
    try {
      setLoading(true);

      await appToast.promise(
        fetch(`${API_BASE}/api/sales/${saleId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to update sales");
          }
          return data;
        }),
        {
          loading: "Updating sales record...",
          success: "Sales updated successfully! 🚀",
          error: (err) => err.message || "Failed to update sales",
        },
      );
    } catch (err) {
      // Error is already displayed by the promise toast
      console.error("Update Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ========================= DESTINATION DIALOG ========================= */
  const openDestinationDialog = (id) =>
    setDestinationDialog({ open: true, saleId: id });
  const currentSaleForDialog = uiSales.find(
    (s) => s.id === destinationDialog.saleId,
  );

  /* ========================= LOADING / ERROR STATES ========================= */
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-slate-500 text-sm">Loading sale data...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <p className="text-red-500 text-sm font-medium">
          Failed to load sale: {fetchError}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  /* ========================= UI ========================= */
  return (
    <div className="space-y-4">
      <Card className="bg-slate-50 mb-2">
        <CardContent className="py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice Number */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Invoice Number
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  {fetching ? (
                    <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4 text-indigo-500" />
                  )}
                </div>
                <Input
                  value={fetching ? "Loading..." : invoiceNo}
                  readOnly
                  className="pl-10 pr-16 font-mono text-sm font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-900 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {fetching ? "..." : "Saved"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Original invoice number for this transaction
              </p>
            </div>

            {/* Sale Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Transaction Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={fetching}
                    className="w-full justify-start text-left font-normal h-10 focus-visible:ring-indigo-500"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {fetching ? "Loading date..." : format(saleDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={saleDate}
                    onSelect={(d) => d && setSaleDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">
                Date when this invoice was originally created
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <h3 className="text-lg font-semibold">Edit Sales Items</h3>

      {/* Sales Cards */}
      <div className="space-y-3">
        {uiSales.map((item, index) => {
          const isCredit = String(item.paymentType).toUpperCase() === "CREDIT";
          const profit = calculateProfit(
            item.netPrice,
            item.sellPrice,
            item.vatAmount,
          );

          return (
            <Card
              key={item.id}
              className="border-l-4 border-l-gray-500 shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Sale #{index + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Label className="text-md font-medium text-indigo-700 flex items-center gap-1">
                      <Route className="h-3 w-3" />
                      Route Type :
                    </Label>
                    <Select
                      options={routeTypeOptions}
                      value={
                        routeTypeOptions.find(
                          (o) => o.value === item.routeType,
                        ) || null
                      }
                      placeholder="Based on Destinations"
                      menuPortalTarget={document.body}
                      styles={{
                        ...compactSelectStyles,
                        control: (base) => ({
                          ...compactSelectStyles.control(base),
                          backgroundColor: "#eef2ff",
                          borderColor: "#c7d2fe",
                        }),
                      }}
                      isDisabled
                    />
                    <div className="border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSale(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Row 1: Basic Information */}
                <div
                  className={`grid grid-cols-1 ${isCredit ? "md:grid-cols-8" : "md:grid-cols-7"} gap-3`}
                >
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Airline *
                    </Label>
                    <Select
                      options={airlineOptions}
                      value={
                        airlineOptions.find(
                          (o) => o.value === item.airlineId,
                        ) || null
                      }
                      onChange={(o) =>
                        updateSale(item.id, "airlineId", o?.value)
                      }
                      placeholder="Select airline"
                      menuPortalTarget={document.body}
                      styles={compactSelectStyles}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Vendor *
                    </Label>
                    <Select
                      options={vendorOptions}
                      value={
                        vendorOptions.find((o) => o.value === item.vendorId) ||
                        null
                      }
                      onChange={(o) =>
                        updateSale(item.id, "vendorId", o?.value)
                      }
                      placeholder="Select"
                      menuPortalTarget={document.body}
                      styles={compactSelectStyles}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Document No *
                    </Label>
                    <Input
                      value={item.documentNo}
                      onChange={(e) =>
                        updateSale(item.id, "documentNo", e.target.value)
                      }
                      placeholder="e.g. 123"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Passenger Name
                    </Label>
                    <Input
                      value={item.paxName || ""}
                      onChange={(e) =>
                        updateSale(item.id, "paxName", e.target.value)
                      }
                      placeholder="John Doe"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      PNR
                    </Label>
                    <Input
                      value={item.pnr || ""}
                      onChange={(e) =>
                        updateSale(item.id, "pnr", e.target.value)
                      }
                      placeholder="PNR Code"
                      className="h-8 text-sm"
                    />
                  </div>
                  {/* Destinations */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Destinations
                    </Label>
                    <div className="flex items-center gap-2">
                      {item.destinations?.length > 0 ? (
                        <div className="flex gap-2 w-full">
                          <Badge
                            variant="secondary"
                            size="sm"
                            className="text-xs px-2 w-2/3 py-1 h-8 flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" />
                            {item.destinations.length} selected
                          </Badge>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => openDestinationDialog(item.id)}
                            className="h-8 px-2 w-1/3 text-xs"
                            title="View/Edit Destinations"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openDestinationDialog(item.id)}
                          className="h-8 text-xs px-3 border-dashed w-full"
                        >
                          <Plus className="h-3 w-3 mr-1.5" />
                          Add Destinations
                          <MapPin className="h-3 w-3 ml-1.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Payment *
                    </Label>
                    <Select
                      options={paymentOptions}
                      value={
                        item.paymentType
                          ? paymentOptions.find(
                              (p) =>
                                p.value ===
                                String(item.paymentType).toUpperCase(),
                            ) || null
                          : null
                      }
                      onChange={(o) =>
                        updateSale(item.id, "paymentType", o?.value)
                      }
                      placeholder="Method"
                      menuPortalTarget={document.body}
                      styles={compactSelectStyles}
                    />
                  </div>
                  {isCredit && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">
                        Customer *
                      </Label>
                      <Select
                        options={customerOptions}
                        value={
                          customerOptions.find(
                            (o) => o.value === item.customerId,
                          ) || null
                        }
                        onChange={(o) =>
                          updateSale(item.id, "customerId", o?.value)
                        }
                        placeholder="Select"
                        menuPortalTarget={document.body}
                        styles={compactSelectStyles}
                      />
                    </div>
                  )}
                </div>

                {/* Row 2: Financial Information */}
                <div
                  className={`grid grid-cols-2 ${item.routeType === "DOMESTIC" ? "md:grid-cols-8" : "md:grid-cols-7"} gap-3`}
                >
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Net <SaudiRiyal size={15} />
                    </Label>
                    <Input
                      type="number"
                      value={item.netPrice}
                      onChange={(e) =>
                        updateSale(item.id, "netPrice", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                  {item.routeType === "DOMESTIC" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-orange-700">
                        PAX VAT 15% <SaudiRiyal size={15} />
                      </Label>
                      <div className="flex items-center gap-1 px-2 h-8 bg-orange-50 border border-orange-200 rounded text-xs font-semibold text-orange-700">
                        <Calculator className="h-3 w-3" />$
                        {item.paxVat || "0.00"}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      MISC <SaudiRiyal size={15} />
                    </Label>
                    <Input
                      type="number"
                      value={item.miscCharges}
                      onChange={(e) =>
                        updateSale(item.id, "miscCharges", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Sell <SaudiRiyal size={15} />
                    </Label>
                    <Input
                      type="number"
                      value={item.sellPrice}
                      onChange={(e) =>
                        updateSale(item.id, "sellPrice", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Paid <SaudiRiyal size={15} />
                    </Label>
                    <Input
                      type="number"
                      value={item.paidAmount}
                      onChange={(e) =>
                        updateSale(item.id, "paidAmount", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-blue-700">
                      VAT 15% <SaudiRiyal size={15} />
                    </Label>
                    <div className="flex items-center gap-1 px-2 h-8 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-700">
                      <Calculator className="h-3 w-3" />$
                      {item.vatAmount || "0.00"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-green-700">
                      Profit <SaudiRiyal size={15} />
                    </Label>
                    <div className="flex items-center gap-1 px-2 h-8 bg-green-50 border border-green-200 rounded text-xs font-semibold text-green-700">
                      <Calculator className="h-3 w-3" />${profit}
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Remarks
                    </Label>
                    <Input
                      value={item.remarks || ""}
                      onChange={(e) =>
                        updateSale(item.id, "remarks", e.target.value)
                      }
                      placeholder="Note"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Calculator className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid grid-cols-2 ${uiSales.some((s) => s.routeType === "DOMESTIC") ? "md:grid-cols-7" : "md:grid-cols-6"} gap-4`}
          >
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <div className="text-sm text-slate-600 mb-1 font-medium">
                Total Items
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {uiSales.length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="text-sm text-blue-600 mb-1 font-medium">
                Net Total
              </div>
              <div className="flex items-center gap-1 text-3xl font-bold text-blue-700">
                <SaudiRiyal size={18} />
                {totals.net.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-600 mb-1 font-medium">
                Total MISC
              </div>
              <div className="flex items-center gap-1 text-3xl font-bold text-slate-700">
                <SaudiRiyal size={18} />
                {totals.misc.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="text-sm text-purple-600 mb-1 font-medium">
                Sell Total
              </div>
              <div className="flex items-center gap-1 text-3xl font-bold text-purple-700">
                <SaudiRiyal size={18} />
                {totals.sell.toFixed(2)}
              </div>
            </div>
            {uiSales.some((s) => s.routeType === "DOMESTIC") && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
                <div className="text-sm text-orange-600 mb-1 font-medium">
                  Total PAX VAT
                </div>
                <div className="flex items-center gap-1 text-3xl font-bold text-orange-700">
                  <SaudiRiyal size={18} />
                  {totals.paxVat.toFixed(2)}
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200">
              <div className="text-sm text-indigo-600 mb-1 font-medium">
                Total VAT (15%)
              </div>
              <div className="flex items-center gap-1 text-3xl font-bold text-indigo-700">
                <SaudiRiyal size={18} />
                {totals.vat.toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="text-sm text-green-600 mb-1 font-medium">
                Total Profit
              </div>
              <div className="flex items-center gap-1 text-3xl font-bold text-green-700">
                <SaudiRiyal size={18} />
                {totals.profit.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-primary text-white h-11 px-8 text-base font-semibold gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <ManageDestinationsDialog
        destinationDialog={destinationDialog}
        setDestinationDialog={setDestinationDialog}
        currentSaleForDialog={currentSaleForDialog}
        updateSale={updateSale}
        removeDestination={removeDestination}
        loadDestinationOptions={loadDestinationOptions}
      />
    </div>
  );
}
