"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Select from "react-select";
import {
  Plus,
  Trash2,
  Receipt,
  Calculator,
  CalendarIcon,
  MapPin,
  Eye,
  SaudiRiyal,
  Route,
  Send,
} from "lucide-react";
import { format } from "date-fns";
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
import { Badge } from "../../shadcn/components/ui/badge";
import ManageDestinationsDialog from "./ManageDestinationsDialog";
import PaymentDialog from "./PaymentDialog";
import { appToast } from "../../shadcn/components/ui/appToast";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ─── Pure helpers ───────────────────────────────────────── */
const emptyRow = () => ({
  id: crypto.randomUUID(),
  airlineId: "",
  documentNo: "",
  pnr: "",
  vendorId: "",
  customerId: "",
  netPrice: "",
  sellPrice: "",
  paidAmount: "",
  paymentType: "",
  paymentMeta: null,
  remarks: "",
  paxName: "",
  destinations: [],
  routeType: "",
  tripType: "ONE_WAY",
  departureDate: null,
  returnDate: null,
  paxVat: "",
  miscCharges: "",
  vatAmount: "",
});

const isEmptySale = (s) =>
  !s.airlineId && !s.documentNo && !s.vendorId && !s.netPrice && !s.sellPrice;

const detectRouteType = (destinations = []) => {
  const hasKSA = destinations.some((d) => d.airport?.country === "SA");
  const hasNonKSA = destinations.some((d) => d.airport?.country !== "SA");
  if (!destinations.length) return "";
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

const applyRouteEffects = (item, routeType) => {
  const updated = { ...item, routeType };
  if (routeType === "DOMESTIC") {
    updated.paxVat = calcPaxVAT(item.netPrice);
    updated.miscCharges = "";
  } else if (routeType === "ZERO_VAT") {
    updated.paxVat = "";
    updated.vatAmount = "0.00";
  } else {
    updated.paxVat = "";
    updated.miscCharges = "";
  }
  return updated;
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

/* ─── Required label helper ─────────────────────────────── */
const RequiredLabel = ({ children }) => (
  <Label className="text-xs font-medium text-slate-600 flex items-center gap-0.5">
    {children}
    <span className="text-red-500 ml-0.5">*</span>
  </Label>
);

/* ─── Component ──────────────────────────────────────────── */
export default function SalesTabComponent() {
  const [saleDate, setSaleDate] = useState(new Date());
  const [uiSales, setUiSales] = useState([]);
  const [destinationDialog, setDestinationDialog] = useState({
    open: false,
    saleId: null,
  });
  const [loading, setLoading] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [fetchingInvoice, setFetchingInvoice] = useState(false);
  const [airlines, setAirlines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [banks, setBanks] = useState([]);
  const lastToastValue = useRef(null);

  const token = localStorage.getItem("token");
  // ── CHANGE 1: read role once ──────────────────────────────
  const userRole = localStorage.getItem("user");

  // localStorage returns a string, so parse it first
  const userData = JSON.parse(userRole);

  console.log("User Role:", userData.role);

  const isAdmin = String(userData.role).toUpperCase() === "ADMIN";

  console.log("Is Admin:", isAdmin);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  /* ── Init ── */
  useEffect(() => {
    setUiSales([emptyRow()]);
  }, []);

  /* ── Invoice number ── */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setFetchingInvoice(true);
    fetch(`${API_BASE}/api/invoice/next`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => setInvoiceNo(d.invoiceNo || ""))
      .catch((err) => {
        if (err.name !== "AbortError") {
          appToast.error("Invoice Error", "Failed to fetch invoice number.");
          setInvoiceNo("");
        }
      })
      .finally(() => setFetchingInvoice(false));
    return () => controller.abort();
  }, [saleDate, token]);

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

  const bankOptions = banks.map((b) => ({
    value: b.id,
    label: `${b.bankName} — ${b.accountNumber}`,
  }));

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

  /* ── Vendor map ── */
  const vendorMap = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v])),
    [vendors],
  );

  /* ── Row ops ── */
  const addSaleRow = useCallback(() => {
    const row = emptyRow();
    setUiSales((prev) => [...prev, row]);
    setTimeout(
      () => document.querySelector(`[data-row-id="${row.id}"] input`)?.focus(),
      100,
    );
  }, []);

  const removeSaleRow = (id) =>
    setUiSales((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next.length ? next : [emptyRow()];
    });

  const updateSale = (id, field, value) =>
    setUiSales((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "netPrice") {
          const vendor = vendorMap[item.vendorId];
          const net = Number(value || 0);

          // ── CHANGE 1a: vendor credit balance check (unchanged) ──
          if (vendor && String(vendor.category).toUpperCase() === "CREDIT") {
            const balance = Number(vendor.account?.balance || 0);
            if (net > balance) {
              const key = `${item.id}-${net}`;
              if (lastToastValue.current !== key) {
                appToast.warning(
                  "Low Balance!",
                  `Insufficient vendor balance.\n\nAvailable: ${balance}\nEntered: ${net}`,
                );
                lastToastValue.current = key;
              }
              return item;
            }
          }
          lastToastValue.current = null;

          // ── CHANGE 1b: net > sell check — ADMIN only ──────────
          const sell = Number(item.sellPrice || 0);
          if (sell > 0 && net > sell) {
            if (!isAdmin) {
              appToast.warning(
                "Not Allowed",
                "Net price cannot exceed Sell price. Only Admins can override this.",
              );
              return item; // block non-admins
            }
            // admin: allow but warn
            appToast.warning(
              "Warning",
              "Net price is higher than Sell price. This will result in a loss.",
            );
          }
        }

        if (field === "payment") {
          const merged = { ...item, ...value };
          // Mirror the paid amount into sellPrice too — sellPrice stays
          // fully editable afterward, this just sets its initial value.
          if (value?.paidAmount !== undefined) {
            merged.sellPrice = value.paidAmount;
          }
          // Tabby/Tamara: the amount PaymentDialog returns is the merchant's
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

        // ── CHANGE 2: paidAmount is now readonly — no manual edits ──
        // (field still exists for PaymentDialog to write to, but direct
        //  user input via the input box is blocked — see readOnly on the Input below)

        if (field === "paidAmount") {
          const sell = Number(item.sellPrice || 0);
          return { ...item, paidAmount: Math.min(Number(value || 0), sell) };
        }

        if (field === "destinations") {
          const newRouteType = detectRouteType(value);
          return applyRouteEffects(
            { ...item, destinations: value },
            newRouteType,
          );
        }

        if (field === "netPrice" || field === "sellPrice") {
          const updated = { ...item, [field]: value };
          if (updated.routeType === "DOMESTIC")
            updated.paxVat = calcPaxVAT(updated.netPrice);
          if (updated.routeType !== "ZERO_VAT")
            updated.vatAmount = calcVAT(
              Number(updated.sellPrice || 0) - Number(updated.netPrice || 0),
            );
          else updated.vatAmount = "0.00";
          return updated;
        }

        return { ...item, [field]: value };
      }),
    );

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

  /* ── Keyboard shortcut Alt+A ── */
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? e.metaKey : e.altKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        addSaleRow();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addSaleRow]);

  /* ── Options ── */
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

  /* ── Totals ── */
  const totals = uiSales.reduce(
    (acc, s) => ({
      net: acc.net + (Number(s.netPrice) || 0),
      sell: acc.sell + (Number(s.sellPrice) || 0),
      vat: acc.vat + (Number(s.vatAmount) || 0),
      paxVat: acc.paxVat + (Number(s.paxVat) || 0),
      misc: acc.misc + (Number(s.miscCharges) || 0),
      profit:
        acc.profit +
        ((Number(s.sellPrice) || 0) -
          (Number(s.netPrice) || 0) -
          (Number(s.vatAmount) || 0)),
    }),
    { net: 0, sell: 0, vat: 0, paxVat: 0, misc: 0, profit: 0 },
  );

  /* ── Submit ── */
  const handleSubmit = async () => {
    const cleanedSales = uiSales.filter((s) => !isEmptySale(s));
    if (!cleanedSales.length) {
      appToast.warning(
        "Empty Submission",
        "Add at least one sale before submitting.",
      );
      return;
    }

    for (const s of cleanedSales) {
      if (
        !s.airlineId ||
        !s.vendorId ||
        !s.documentNo ||
        !s.netPrice ||
        !s.sellPrice ||
        !s.paymentType
      ) {
        appToast.warning(
          "Incomplete Sale",
          "Please fill all required fields (Airline, Vendor, Document No, Net, Sell, Payment)",
        );
        return;
      }
      if (String(s.paymentType).toUpperCase() === "CREDIT" && !s.customerId) {
        appToast.warning(
          "Incomplete Sale",
          "Customer is required for CREDIT payment type",
        );
        return;
      }
      if (
        String(s.paymentType).toUpperCase() === "BANK_TRANSFER" &&
        !s.bankId
      ) {
        appToast.warning(
          "Incomplete Sale",
          "Please select a bank account for Bank Transfer payment",
        );
        return;
      }
      if (
        String(s.paymentType).toUpperCase() === "PARTIAL" &&
        (!s.paymentLegs || s.paymentLegs.length === 0)
      ) {
        appToast.warning(
          "Incomplete Sale",
          "Please configure split payment legs",
        );
        return;
      }
    }

    const payload = {
      saleDate: saleDate.toISOString(),
      sales: cleanedSales.map((s) => ({
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
        destinations: s.destinations || null,
        netPrice: Number(s.netPrice),
        sellPrice: Number(s.sellPrice),
        vatAmount: Number(s.vatAmount || 0),
        paxVat: Number(s.paxVat || 0),
        miscCharges: Number(s.miscCharges || 0),
        paidAmount: Number(s.paidAmount || 0),
        paymentType: s.paymentType,
        paymentLegs: s.paymentLegs || null,
        remarks: s.remarks || null,
      })),
    };

    try {
      setLoading(true);
      await appToast.promise(
        fetch(`${API_BASE}/api/sales`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }).then(async (res) => {
          const d = await res.json();
          if (!res.ok) throw new Error(d.error || "Failed");
          return d;
        }),
        {
          loading: "Submitting invoice...",
          success: (d) =>
            `Invoice ${d?.data?.invoiceNo || ""} Submitted Successfully!`,
          error: (err) => err.message || "Failed to submit invoice",
        },
      );
      setUiSales([emptyRow()]);
      setSaleDate(new Date());
    } catch (err) {
      console.error("Submission Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Dialog ── */
  const currentSaleForDialog = uiSales.find(
    (s) => s.id === destinationDialog.saleId,
  );

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Date & Invoice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Invoice Number
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {fetchingInvoice ? (
                <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Receipt className="h-4 w-4 text-indigo-500" />
              )}
            </div>
            <Input
              value={invoiceNo}
              readOnly
              placeholder={fetchingInvoice ? "Loading..." : "No invoice"}
              className="pl-10 pr-16 font-mono text-sm font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-900 cursor-not-allowed focus-visible:ring-indigo-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                Auto
              </span>
            </div>
          </div>
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
                {format(saleDate, "PPP")}
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
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sales Items</h3>
        <Button
          onClick={addSaleRow}
          className="flex items-center gap-2 bg-gradient-primary text-white"
        >
          <Plus className="h-4 w-4" /> Add New Sale{" "}
          <span className="text-xs opacity-80">(Alt+A)</span>
        </Button>
      </div>

      {/* Sales Cards */}
      <div className="space-y-3">
        {uiSales.map((item, index) => {
          const profit = (
            (Number(item.sellPrice) || 0) -
            (Number(item.netPrice) || 0) -
            (Number(item.vatAmount) || 0)
          ).toFixed(2);

          return (
            <Card
              key={item.id}
              data-row-id={item.id}
              className="border-l-4 border-l-gray-500 shadow-sm gap-0!"
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
                      onClick={() => removeSaleRow(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Row 1: Info */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {/* ── CHANGE 3: Airline — required ── */}
                  <div className="space-y-1">
                    <RequiredLabel>Airline</RequiredLabel>
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
                      styles={{
                        ...compactSelectStyles,
                        control: (b) => ({
                          ...compactSelectStyles.control(b),
                          borderColor: !item.airlineId
                            ? "#fca5a5"
                            : b.borderColor,
                        }),
                      }}
                    />
                  </div>

                  {/* ── CHANGE 3: Vendor — required ── */}
                  <div className="space-y-1">
                    <RequiredLabel>Vendor</RequiredLabel>
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
                      styles={{
                        ...compactSelectStyles,
                        control: (b) => ({
                          ...compactSelectStyles.control(b),
                          borderColor: !item.vendorId
                            ? "#fca5a5"
                            : b.borderColor,
                        }),
                      }}
                    />
                  </div>

                  {/* ── CHANGE 3: Document No — required ── */}
                  <div className="space-y-1">
                    <RequiredLabel>Document No</RequiredLabel>
                    <Input
                      value={item.documentNo}
                      onChange={(e) =>
                        updateSale(item.id, "documentNo", e.target.value)
                      }
                      placeholder="e.g. 123"
                      className={`h-8 text-sm ${!item.documentNo ? "border-red-300 focus-visible:ring-red-400" : ""}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      PNR
                    </Label>
                    <Input
                      value={item.pnr}
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
                          <MapPin className="h-3 w-3 mr-1.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ── CHANGE 3: Payment — required ── */}
                  <div className="space-y-1">
                    <RequiredLabel>Payment</RequiredLabel>
                    <PaymentDialog
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
                  {/* ── CHANGE 3: Net — required ── */}
                  <div className="space-y-1">
                    <RequiredLabel>
                      Net <SaudiRiyal size={15} />
                    </RequiredLabel>
                    <Input
                      type="number"
                      value={item.netPrice}
                      onChange={(e) =>
                        updateSale(item.id, "netPrice", e.target.value)
                      }
                      placeholder="0.00"
                      className={`h-8 text-sm ${!item.netPrice ? "border-red-300 focus-visible:ring-red-400" : ""}`}
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

                  {/* ── CHANGE 3: Sell — required ── */}
                  <div className="space-y-1">
                    <RequiredLabel>
                      Sell <SaudiRiyal size={15} />
                    </RequiredLabel>
                    <Input
                      type="number"
                      value={item.sellPrice}
                      onChange={(e) =>
                        updateSale(item.id, "sellPrice", e.target.value)
                      }
                      placeholder="0.00"
                      className={`h-8 text-sm ${!item.sellPrice ? "border-red-300 focus-visible:ring-red-400" : ""}`}
                    />
                  </div>

                  {/* ── CHANGE 2: Paid — readonly ── */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">
                      Paid <SaudiRiyal size={15} />
                      {item.sellPrice > 0 && (
                        <span className="text-red-500 ml-1">
                          {(item.sellPrice - item.paidAmount).toFixed(2)} Due
                        </span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      value={item.paidAmount}
                      readOnly
                      placeholder="0.00"
                      className="h-8 text-sm bg-slate-50 cursor-not-allowed text-slate-500"
                      title="Paid amount is set via the Payment dialog"
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
                      value={item.remarks}
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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-md gap-0!">
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
                value: uiSales.filter((s) => !isEmptySale(s)).length,
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

      {/* Submit */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-primary text-white h-11 px-8 text-base font-semibold gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit Sales
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
