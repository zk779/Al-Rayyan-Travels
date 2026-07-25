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
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { format } from "date-fns";
import ManageDestinationsDialog from "./ManageDestinationsDialog";
import EditPaymentDialog from "./EditPaymentDialog";
import { appToast } from "../../shadcn/components/ui/appToast";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ─── Pure helpers ───────────────────────────────────────── */
const detectRouteType = (destinations) => {
  if (!destinations?.length) return "";
  const hasKSA = destinations.some((d) => d.airport?.country === "SA");
  const hasNonKSA = destinations.some((d) => d.airport?.country !== "SA");
  if (hasKSA && !hasNonKSA) return "DOMESTIC";
  if (hasKSA && hasNonKSA) return "MIXED";
  return "ZERO_VAT";
};

const calcVAT = (profit) => {
  const p = Number(profit) || 0;
  return p > 0 ? ((p / 1.15) * 0.15).toFixed(2) : "0.00";
};
const calcPaxVAT = (netPrice) => {
  const n = Number(netPrice) || 0;
  return n > 0 ? ((n / 1.15) * 0.15).toFixed(2) : "0.00";
};
const calcProfit = (net, sell, vat) =>
  (Number(sell || 0) - Number(net || 0) - Number(vat || 0)).toFixed(2);

const applyRouteEffects = (item, routeType) => {
  const u = { ...item, routeType };
  if (routeType === "DOMESTIC") {
    u.paxVat = calcPaxVAT(item.netPrice);
    u.miscCharges = "";
  } else if (routeType === "ZERO_VAT") {
    u.paxVat = "";
    u.vatAmount = "0.00";
  } else {
    u.paxVat = "";
    u.miscCharges = "";
  }
  return u;
};

const compactSelectStyles = {
  control: (b) => ({
    ...b,
    minHeight: 32,
    height: 32,
    boxShadow: "none",
    fontSize: "13px",
  }),
  valueContainer: (b) => ({ ...b, height: 32, padding: "0 6px" }),
  input: (b) => ({ ...b, margin: 0, padding: 0 }),
  indicatorsContainer: (b) => ({ ...b, height: 32 }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
};

const routeTypeOptions = [
  { value: "DOMESTIC", label: "Domestic (KSA Only)" },
  { value: "MIXED", label: "Domestic/International (Mixed)" },
  { value: "ZERO_VAT", label: "Zero VAT Route (Non-KSA)" },
];

/* ─── Component ──────────────────────────────────────────── */
export default function EditSalesTab({ saleId }) {
  const [uiSales, setUiSales] = useState([]);
  const [saleDate, setSaleDate] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [destinationDialog, setDestinationDialog] = useState({
    open: false,
    saleId: null,
  });

  const [airlines, setAirlines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [banks, setBanks] = useState([]);

  const user = localStorage.getItem("user");

  console.log("EditSalesTab user:", user);
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  /* ── Fetch sale ── */
  useEffect(() => {
    if (!saleId || !token) return;
    const controller = new AbortController();

    (async () => {
      try {
        setFetching(true);
        const res = await fetch(`${API_BASE}/api/sales/${saleId}`, {
          headers,
          signal: controller.signal,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to fetch sale");

        const inv = body.data;
        setInvoiceNo(inv.invoiceNo || "");
        if (inv.saleDate) setSaleDate(new Date(inv.saleDate));
        setUiSales((inv.sales || []).map((s) => ({ ...s })));
      } catch (err) {
        if (err.name !== "AbortError") setFetchError(err.message);
      } finally {
        setFetching(false);
      }
    })();

    return () => controller.abort();
  }, [saleId, token]);

  /* ── Master data ── */
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
    fetch(`${API_BASE}/api/banks?isActive=true`, { headers })
      .then((r) => r.json())
      .then((j) => setBanks(j.data || []));
  }, [headers]);

  /* ── Destination search ── */
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
            ? j.data.map((a) => ({
                value: a.iata,
                label: `${a.iata} - ${a.city}, ${a.country}`,
                airport: a,
              }))
            : [],
        )
        .catch(() => []);
    },
    [headers],
  );

  /* ── Options ── */
  const vendorMap = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v])),
    [vendors],
  );
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
    customerType: c.customerType,
  }));
  const bankOptions = banks.map((b) => ({
    value: b.id,
    label: `${b.bankName} — ${b.accountNumber}`,
  }));

  /* ── Update sale row ── */
  const updateSale = (id, field, value) => {
    // Vendor balance guard for netPrice
    if (field === "netPrice") {
      const item = uiSales.find((s) => s.id === id);
      const vendor = vendorMap[item?.vendorId];
      const newNet = Number(value || 0);
      if (vendor && String(vendor.category).toUpperCase() === "CREDIT") {
        const effectiveBalance =
          Number(vendor.account?.balance || 0) + Number(item.netPrice || 0);
        if (newNet > effectiveBalance) {
          appToast.warning(
            "Low Vendor Balance",
            `Insufficient balance.\n\nLimit: ${effectiveBalance}\nEntered: ${newNet}`,
          );
          return;
        }
      }
    }

    setUiSales((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // Payment dialog result: { paymentType, paymentMeta, customerId, bankId, paidAmount, paxName }
        // Payment dialog result: { paymentType, paymentMeta, customerId, bankId, paidAmount, paxName }
        if (field === "payment") {
          const merged = { ...item, ...value };
          // PARTIAL now sends its own combined sellPrice (both legs) — use it
          // directly instead of mirroring paidAmount, which only reflects the
          // cash/bank portion when a CREDIT leg is involved.
          if (value?.sellPrice !== undefined) {
            merged.sellPrice = value.sellPrice;
          } else if (value?.paidAmount !== undefined) {
            merged.sellPrice = value.paidAmount;
          }
          // Tabby/Tamara: the amount EditPaymentDialog returns is the merchant's
          // net settlement after fees, not money actually collected from the
          // customer up front — so don't carry it into Paid. Sell price still
          // gets updated as usual above; Paid stays 0 for Tabby/Tamara sales.
          const meta = value?.paymentMeta;
          const isTabbyOrTamara =
            meta?.orderAmount != null ||
            meta?.aOrderAmount != null ||
            meta?.bOrderAmount != null;
          if (isTabbyOrTamara) {
            merged.paidAmount = 0;
          }
          return merged;
        }

        if (field === "paidAmount") {
          return {
            ...item,
            paidAmount: Math.min(
              Number(value || 0),
              Number(item.sellPrice || 0),
            ),
          };
        }

        if (field === "destinations") {
          return applyRouteEffects(
            { ...item, destinations: value },
            detectRouteType(value),
          );
        }

        if (field === "netPrice" || field === "sellPrice") {
          const updated = { ...item, [field]: value };
          const profit =
            Number(updated.sellPrice || 0) - Number(updated.netPrice || 0);
          if (updated.routeType === "DOMESTIC")
            updated.paxVat = calcPaxVAT(updated.netPrice);
          updated.vatAmount =
            updated.routeType === "ZERO_VAT" ? "0.00" : calcVAT(profit);
          return updated;
        }

        return { ...item, [field]: value };
      }),
    );
  };

  const removeSale = (id) =>
    setUiSales((prev) => prev.filter((s) => s.id !== id));

  const removeDestination = (saleId, destValue) =>
    setUiSales((prev) =>
      prev.map((item) => {
        if (item.id !== saleId) return item;
        const newDests = item.destinations.filter((d) => d.value !== destValue);
        return applyRouteEffects(
          { ...item, destinations: newDests },
          detectRouteType(newDests),
        );
      }),
    );

  /* ── Totals ── */
  const totals = uiSales.reduce(
    (acc, s) => {
      const net = Number(s.netPrice) || 0;
      const sell = Number(s.sellPrice) || 0;
      const vat = Number(s.vatAmount) || 0;
      return {
        net: acc.net + net,
        sell: acc.sell + sell,
        profit: acc.profit + (sell - net - vat),
        vat: acc.vat + vat,
        paxVat: acc.paxVat + (Number(s.paxVat) || 0),
        misc: acc.misc + (Number(s.miscCharges) || 0),
      };
    },
    { net: 0, sell: 0, profit: 0, vat: 0, paxVat: 0, misc: 0 },
  );

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!uiSales.length) {
      appToast.warning("No Changes", "There are no sales to update.");
      return;
    }

    for (const s of uiSales) {
      if (
        !s.airlineId ||
        !s.vendorId ||
        !s.documentNo ||
        !s.netPrice ||
        !s.sellPrice ||
        !s.paymentType
      ) {
        appToast.error(
          "Missing Information",
          "Please fill all required fields (Airline, Vendor, Document No, Net, Sell, Payment)",
        );
        return;
      }
      if (String(s.paymentType).toUpperCase() === "CREDIT" && !s.customerId) {
        appToast.error(
          "Customer Required",
          "Customer is required for CREDIT payment type",
        );
        return;
      }
      if (
        String(s.paymentType).toUpperCase() === "BANK_TRANSFER" &&
        !s.bankId
      ) {
        appToast.error(
          "Bank Required",
          "Bank account is required for BANK_TRANSFER payment type",
        );
        return;
      }
    }

    const payload = {
      invoiceNo,
      saleDate: saleDate ? saleDate.toISOString() : null,
      sales: uiSales.map((s) => ({
        id: s.id,
        airlineId: s.airlineId,
        vendorId: s.vendorId,
        customerId: s.customerId || null,
        bankId: s.bankId || null,
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
        paymentLegs:
          s.paymentMeta?.type === "PARTIAL"
            ? [
                {
                  method: s.paymentMeta.aMethod,
                  amount: Number(s.paymentMeta.aAmount),
                  bankId: s.paymentMeta.aBankId || null,
                  customerId: s.paymentMeta.aCustomerId || null,
                },
                {
                  method: s.paymentMeta.bMethod,
                  amount: Number(s.paymentMeta.bAmount),
                  bankId: s.paymentMeta.bBankId || null,
                  customerId: s.paymentMeta.bCustomerId || null,
                },
              ]
            : String(s.paymentType).toUpperCase() === "PARTIAL" &&
                Array.isArray(s.payments) &&
                s.payments.length > 0
              ? s.payments.map((leg) => ({
                  method: leg.method,
                  amount: Number(leg.amount),
                  bankId: leg.bank?.id || leg.bankId || null,
                  customerId: leg.customer?.id || leg.customerId || null,
                }))
              : null,
        remarks: s.remarks || null,
      })),
    };

    try {
      setLoading(true);
      await appToast.promise(
        fetch(`${API_BASE}/api/sales/${saleId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        }).then(async (res) => {
          const d = await res.json();
          if (!res.ok) throw new Error(d.error || "Failed to update");
          return d;
        }),
        {
          loading: "Updating sales record...",
          success: "Sales updated successfully!",
          error: (err) => err.message || "Failed to update sales",
        },
      );
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Destination dialog ── */
  const currentSaleForDialog = uiSales.find(
    (s) => s.id === destinationDialog.saleId,
  );

  /* ── Loading / error ── */
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

  /* ─── Render ──────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Invoice header */}
      <Card className="bg-slate-50 mb-2">
        <CardContent className="py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Invoice Number
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <Receipt className="h-4 w-4 text-indigo-500" />
                </div>
                <Input
                  value={invoiceNo}
                  readOnly
                  className="pl-10 pr-16 font-mono text-sm font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-900 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    Saved
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Original invoice number for this transaction
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Transaction Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {saleDate ? format(saleDate, "PPP") : "Select date"}
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

      {/* Sales cards */}
      <div className="space-y-3">
        {uiSales.map((item, index) => {
          const profit = calcProfit(
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
                    <Receipt className="h-4 w-4" /> Sale #{index + 1}
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    <Label className="text-md font-medium text-indigo-700 flex items-center gap-1">
                      <Route className="h-3 w-3" /> Route Type :
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
                        control: (b) => ({
                          ...compactSelectStyles.control(b),
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
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
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
                      Document No *
                    </Label>
                    <Input
                      value={item.documentNo || ""}
                      onChange={(e) =>
                        updateSale(
                          item.id,
                          "documentNo",
                          e.target.value.toUpperCase(),
                        )
                      }
                      placeholder="e.g. 123"
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
                        updateSale(item.id, "pnr", e.target.value.toUpperCase())
                      }
                      placeholder="PNR Code"
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
                        updateSale(
                          item.id,
                          "paxName",
                          e.target.value.toUpperCase(),
                        )
                      }
                      placeholder="John Doe"
                      className="h-8 text-sm"
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
                            className="text-xs px-2 w-2/3 py-1 h-8 flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" />
                            {item.destinations.length} selected
                          </Badge>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              setDestinationDialog({
                                open: true,
                                saleId: item.id,
                              })
                            }
                            className="h-8 px-2 w-1/3 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            setDestinationDialog({
                              open: true,
                              saleId: item.id,
                            })
                          }
                          className="h-8 text-xs px-3 border-dashed w-full"
                        >
                          <Plus className="h-3 w-3 mr-1.5" /> Add Destinations{" "}
                          <MapPin className="h-3 w-3 ml-1.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Payment — EditPaymentDialog */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Payment *
                    </Label>
                    <EditPaymentDialog
                      sale={item}
                      sellPrice={item.sellPrice}
                      customerOptions={customerOptions}
                      bankOptions={bankOptions}
                      onConfirm={(result) =>
                        updateSale(item.id, "payment", result)
                      }
                    />
                  </div>
                </div>

                {/* Row 2: Financials */}
                <div
                  className={`grid grid-cols-2 ${item.routeType === "DOMESTIC" ? "md:grid-cols-8" : "md:grid-cols-7"} gap-3`}
                >
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Net <SaudiRiyal size={15} />
                    </Label>
                    <Input
                      type="number"
                      value={item.netPrice || ""}
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
                      value={item.miscCharges || ""}
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
                      value={item.sellPrice || ""}
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
                      readOnly
                      value={item.paidAmount || ""}
                      onChange={(e) =>
                        updateSale(item.id, "paidAmount", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-8 text-sm cursor-not-allowed"
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

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <Calculator className="h-5 w-5" /> Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid grid-cols-2 ${uiSales.some((s) => s.routeType === "DOMESTIC") ? "md:grid-cols-7" : "md:grid-cols-6"} gap-4`}
          >
            {[
              {
                label: "Total Items",
                value: uiSales.length,
                color: "slate",
                noSAR: true,
              },
              {
                label: "Net Total",
                value: totals.net.toFixed(2),
                color: "blue",
              },
              {
                label: "Total MISC",
                value: totals.misc.toFixed(2),
                color: "slate",
              },
              {
                label: "Sell Total",
                value: totals.sell.toFixed(2),
                color: "purple",
              },
              ...(uiSales.some((s) => s.routeType === "DOMESTIC")
                ? [
                    {
                      label: "Total PAX VAT",
                      value: totals.paxVat.toFixed(2),
                      color: "orange",
                    },
                  ]
                : []),
              {
                label: "Total VAT (15%)",
                value: totals.vat.toFixed(2),
                color: "indigo",
              },
              {
                label: "Total Profit",
                value: totals.profit.toFixed(2),
                color: "green",
              },
            ].map(({ label, value, color, noSAR }) => (
              <div
                key={label}
                className={`bg-white rounded-lg p-4 shadow-sm border border-${color}-200`}
              >
                <div className={`text-sm text-${color}-600 mb-1 font-medium`}>
                  {label}
                </div>
                <div
                  className={`flex items-center gap-1 text-3xl font-bold text-${color}-700`}
                >
                  {!noSAR && <SaudiRiyal size={18} />}
                  {value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-primary text-white h-11 px-8 text-base font-semibold gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Changes
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
