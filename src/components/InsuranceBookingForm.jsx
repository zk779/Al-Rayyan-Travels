"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Select from "react-select";
import {
  Plus,
  Trash2,
  Receipt,
  Calculator,
  CalendarIcon,
  SaudiRiyal,
  Send,
  Banknote,
  Building2,
  Terminal,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Hourglass,
  UserRound,
  Ticket,
  Pencil,
  Globe2,
  CalendarCheck,
  CalendarX,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "../../shadcn/components/ui/button";
import { Card, CardContent } from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import InsuranceCoverageDialog from "./InsuranceCoverageDialog";
import PaymentDialog from "./PaymentDialog";
import EditPaymentDialog from "./EditPaymentDialog";
import { appToast } from "../../shadcn/components/ui/appToast";
import { computePaymentBreakdown } from "./paymentBreakdown";
import VendorNetFields from "./VendorNetFields";
import TotalVatField from "./TotalVatField";
import { applyVendorParts, isVendorPart, withVendorParts, vendorChargesPayload } from "./vendorCharges";
import { toStayISO, fromStayISO, nightsBetween } from "../utils/stayDates";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ─── The two insurance "airlines" (matched on icao_code) and the VAT each one gets ───
   Domestic insurance      -> same VAT rules as a DOMESTIC route (PAX VAT is inclusive in net).
   International insurance -> same VAT rules as a ZERO_VAT route (no PAX VAT, MISC allowed).
   VAT 15% on profit applies to both, exactly like flights and hotels. */
const INSURANCE_KINDS = {
  domesticInsurance: {
    key: "domesticInsurance",
    routeType: "DOMESTIC",
    label: "Domestic Insurance",
    hint: "Inside KSA · PAX VAT included",
    icon: ShieldCheck,
    ring: "border-sky-500 bg-sky-50 ring-2 ring-sky-500/20",
    chip: "bg-sky-100 text-sky-700",
  },
  internationalInsurance: {
    key: "internationalInsurance",
    routeType: "ZERO_VAT",
    label: "International Insurance",
    hint: "Outside KSA · zero-rated",
    icon: Globe2,
    ring: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20",
    chip: "bg-indigo-100 text-indigo-700",
  },
};

// Literal class names (Tailwind can't see classes built from template strings)
const TONES = {
  slate: {
    box: "border-slate-200",
    label: "text-slate-600",
    value: "text-slate-700",
  },
  blue: {
    box: "border-blue-200",
    label: "text-blue-600",
    value: "text-blue-700",
  },
  purple: {
    box: "border-purple-200",
    label: "text-purple-600",
    value: "text-purple-700",
  },
  indigo: {
    box: "border-indigo-200",
    label: "text-indigo-600",
    value: "text-indigo-700",
  },
  orange: {
    box: "border-orange-200",
    label: "text-orange-600",
    value: "text-orange-700",
  },
  green: {
    box: "border-green-200",
    label: "text-green-600",
    value: "text-green-700",
  },
  emerald: {
    box: "border-emerald-200",
    label: "text-emerald-600",
    value: "text-emerald-700",
  },
  sky: { box: "border-sky-200", label: "text-sky-600", value: "text-sky-700" },
  cyan: {
    box: "border-cyan-200",
    label: "text-cyan-600",
    value: "text-cyan-700",
  },
  violet: {
    box: "border-violet-200",
    label: "text-violet-600",
    value: "text-violet-700",
  },
};

/* ─── Pure helpers ───────────────────────────────────────── */
const emptyRow = () => ({
  id: crypto.randomUUID(),
  airlineId: "",
  documentNo: "",
  pnr: "",
  vendorId: "",
  customerId: "",
  netPrice: "",
  baseNet: "",
  vendorServiceCharge: "",
  vendorVat: "",
  sellPrice: "",
  paidAmount: "",
  paymentType: "",
  paymentMeta: null,
  remarks: "",
  paxName: "",
  hotelName: "",
  checkInDate: null,
  checkOutDate: null,
  routeType: "",
  paxVat: "",
  discount: "",
  vatAmount: "",
});

const isEmptySale = (s) =>
  !s.airlineId && !s.documentNo && !s.vendorId && !s.netPrice && !s.sellPrice;

const calcVAT = (profit) => {
  const p = Number(profit) || 0;
  return p > 0 ? (p * 0.15).toFixed(2) : "0.00";
};

// A booking saved before the pricing was split into basic fare / vendor charges has its vendor VAT
// inside the typed net (and no vendor charges): it opens as a plain basic fare, so its net does not move.
const legacyFix = (s) => (Number(s.vendorServiceCharge) > 0 ? s : { ...s, vendorVat: 0 });

// Re-applies the VAT conditions for the chosen type (same rules as the DOMESTIC / ZERO_VAT flight routes,
// see INSURANCE_KINDS above): domestic -> PAX VAT 15% on top of the basic fare, international -> none. The net
// price follows from the basic fare, the PAX VAT, the vendor charges (+ their VAT) and the discount.
const applyInsuranceEffects = (item, icao) => {
  const routeType = INSURANCE_KINDS[icao]?.routeType || "";
  const updated = { ...item, routeType };
  Object.assign(updated, applyVendorParts(updated, null, null));
  updated.vatAmount = calcVAT(
    Number(updated.sellPrice || 0) - Number(updated.netPrice || 0),
  );
  return updated;
};

const compactSelectStyles = {
  control: (b, s) => ({
    ...b,
    minHeight: 38,
    height: 38,
    borderRadius: 10,
    boxShadow: s.isFocused ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
    borderColor: s.isFocused ? "#0ea5e9" : b.borderColor,
    fontSize: "13px",
  }),
  valueContainer: (b) => ({ ...b, height: 38, padding: "0 8px" }),
  input: (b) => ({ ...b, margin: 0, padding: 0 }),
  indicatorsContainer: (b) => ({ ...b, height: 38 }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
};

const FieldLabel = ({ icon: Icon, required, children }) => (
  <Label className="flex items-center gap-1 text-xs font-medium text-slate-600">
    {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
    {children}
    {required && <span className="text-rose-500">*</span>}
  </Label>
);

const inputClass = (invalid) =>
  `h-9 rounded-[10px] text-sm ${invalid ? "border-rose-300 focus-visible:ring-rose-400" : ""}`;

/* ─── Component ──────────────────────────────────────────── */
// `invoiceId` present -> edit an existing insurance invoice; absent -> create new.
export default function InsuranceBookingForm({ invoiceId = null }) {
  const isEdit = !!invoiceId;

  const [saleDate, setSaleDate] = useState(isEdit ? null : new Date());
  const [uiSales, setUiSales] = useState(isEdit ? [] : [emptyRow()]);
  const [coverageDialog, setCoverageDialog] = useState({ open: false, saleId: null });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [fetchError, setFetchError] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [fetchingInvoice, setFetchingInvoice] = useState(false);
  const [airlines, setAirlines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [banks, setBanks] = useState([]);
  const lastToastValue = useRef(null);
  const docNoCheckTimers = useRef({});
  const lastCheckedDocNo = useRef({});
  const originalNet = useRef({}); // edit mode: net price each sale was saved with

  const token = localStorage.getItem("token");
  let isAdmin = false;
  try {
    isAdmin =
      String(JSON.parse(localStorage.getItem("user"))?.role).toUpperCase() ===
      "ADMIN";
  } catch {
    isAdmin = false;
  }

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  /* ── Invoice number (create only) ── */
  useEffect(() => {
    if (isEdit || !token) return;
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
  }, [saleDate, token, isEdit]);

  /* ── Existing invoice (edit only) ── */
  useEffect(() => {
    if (!isEdit || !token) return;
    const controller = new AbortController();
    (async () => {
      try {
        setFetching(true);
        const res = await fetch(`${API_BASE}/api/sales/${invoiceId}`, {
          headers,
          signal: controller.signal,
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to fetch policy");

        const inv = body.data;
        setInvoiceNo(inv.invoiceNo || "");
        if (inv.saleDate) setSaleDate(new Date(inv.saleDate));
        originalNet.current = Object.fromEntries(
          (inv.sales || []).map((s) => [s.id, Number(s.netPrice) || 0]),
        );
        setUiSales(
          (inv.sales || []).map((s) => ({
            ...withVendorParts(legacyFix(s)),
            hotelName: s.hotelName || "",
            checkInDate: fromStayISO(s.checkInDate),
            checkOutDate: fromStayISO(s.checkOutDate),
          })),
        );
      } catch (err) {
        if (err.name !== "AbortError") setFetchError(err.message);
      } finally {
        setFetching(false);
      }
    })();
    return () => controller.abort();
  }, [invoiceId, token, isEdit, headers]);

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
  const posOptions = banks.flatMap((b) =>
    (b.posMachines || [])
      .filter((p) => p.isActive)
      .map((p) => ({
        value: p.id,
        label: `${b.bankName} — ${p.terminalId || p.providerName || "POS"}`,
        bankId: b.id,
        bankName: b.bankName,
        commissionTypes: p.commissionTypes || [],
      })),
  );

  // The insurance "airlines": id of each kind, and icao lookup by airline id
  const airlineById = useMemo(
    () => Object.fromEntries(airlines.map((a) => [a.id, a])),
    [airlines],
  );
  const insuranceAirlines = useMemo(
    () =>
      Object.fromEntries(
        airlines
          .filter((a) => INSURANCE_KINDS[a.icao_code])
          .map((a) => [a.icao_code, a]),
      ),
    [airlines],
  );
  const kindOf = (item) =>
    INSURANCE_KINDS[airlineById[item.airlineId]?.icao_code] || null;

  /* ── Debounced duplicate Document No check (create only) ── */
  useEffect(() => {
    if (isEdit) return;
    const timers = docNoCheckTimers.current;
    const currentIds = new Set(uiSales.map((s) => s.id));
    Object.keys(timers).forEach((id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timers[id]);
        delete timers[id];
        delete lastCheckedDocNo.current[id];
      }
    });
    uiSales.forEach((item) => {
      const id = item.id;
      const docNo = (item.documentNo || "").trim();
      if (lastCheckedDocNo.current[id] === docNo) return;
      lastCheckedDocNo.current[id] = docNo;
      if (timers[id]) clearTimeout(timers[id]);
      if (!docNo) return;
      timers[id] = setTimeout(() => {
        fetch(
          `${API_BASE}/api/sales/check-document?documentNo=${encodeURIComponent(docNo)}`,
          { headers },
        )
          .then((r) => r.json())
          .then((data) => {
            // a voided ticket can never be sold again (the server refuses it too)
            if (data.success && data.voided) {
              appToast.error(
                "Voided Ticket",
                `Document No "${docNo}" is VOID${data.voidInvoiceNo ? ` (invoice ${data.voidInvoiceNo})` : ""} — a new booking is not allowed.`,
              );
              return;
            }
            if (data.success && data.exists)
              appToast.warning(
                "Duplicate Document No",
                `Document No "${docNo}" already exists.`,
              );
          })
          .catch((err) => console.error("Duplicate check failed:", err));
      }, 500);
    });
  }, [uiSales, headers, isEdit]);

  useEffect(
    () => () => Object.values(docNoCheckTimers.current).forEach(clearTimeout),
    [],
  );

  const vendorMap = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v])),
    [vendors],
  );

  /* ── Row ops ── */
  const addRow = useCallback(() => {
    const row = emptyRow();
    setUiSales((prev) => [...prev, row]);
    setTimeout(
      () => document.querySelector(`[data-row-id="${row.id}"] input`)?.focus(),
      100,
    );
  }, []);

  const removeRow = (id) =>
    setUiSales((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next.length || isEdit ? next : [emptyRow()];
    });

  const updateSale = (id, fieldArg, valueArg) =>
    setUiSales((prev) =>
      prev.map((orig) => {
        if (orig.id !== id) return orig;

        // Basic fare, vendor charges and discount are typed; the row's netPrice follows from them
        // (plus the PAX VAT and the 15% VAT on the charges) and goes through the same checks as before.
        let field = fieldArg;
        let value = valueArg;
        let item = orig;
        if (isVendorPart(fieldArg)) {
          item = { ...orig, ...applyVendorParts(orig, fieldArg, valueArg) };
          field = "netPrice";
          value = item.netPrice;
        }

        if (field === "netPrice") {
          const vendor = vendorMap[item.vendorId];
          const net = Number(value || 0);

          // Vendor credit limit — in edit mode this booking's own saved net is freed up first
          if (vendor && String(vendor.category).toUpperCase() === "CREDIT") {
            const balance =
              Number(vendor.account?.balance || 0) +
              (isEdit ? originalNet.current[item.id] || 0 : 0);
            if (net > balance) {
              const key = `${item.id}-${net}`;
              if (lastToastValue.current !== key) {
                appToast.warning(
                  "Low Balance!",
                  `Insufficient vendor balance.\n\nAvailable: ${balance}\nEntered: ${net}`,
                );
                lastToastValue.current = key;
              }
              return orig;
            }
          }
          lastToastValue.current = null;

          // Net above Sell is a loss — admins only
          const sell = Number(item.sellPrice || 0);
          if (sell > 0 && net > sell) {
            if (!isAdmin) {
              appToast.warning(
                "Not Allowed",
                "Net price cannot exceed Sell price. Only Admins can override this.",
              );
              return orig;
            }
            appToast.warning(
              "Warning",
              "Net price is higher than Sell price. This will result in a loss.",
            );
          }
        }

        if (field === "payment") {
          const merged = { ...item, ...value };
          if (value?.sellPrice !== undefined)
            merged.sellPrice = value.sellPrice;
          else if (value?.paidAmount !== undefined)
            merged.sellPrice = value.paidAmount;

          // Tabby/Tamara pays the merchant later — nothing is collected up front
          const meta = value?.paymentMeta;
          if (
            meta?.orderAmount != null ||
            meta?.aOrderAmount != null ||
            meta?.bOrderAmount != null
          ) {
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

        // Picking Domestic / International Insurance re-applies that type's VAT rules
        if (field === "airlineId") {
          return applyInsuranceEffects(
            { ...item, airlineId: value },
            airlineById[value]?.icao_code,
          );
        }

        if (field === "netPrice" || field === "sellPrice") {
          const updated = { ...item, [field]: value };
          updated.vatAmount = calcVAT(
            Number(updated.sellPrice || 0) - Number(updated.netPrice || 0),
          );
          return updated;
        }

        return { ...item, [field]: value };
      }),
    );

  /* ── Keyboard shortcut Alt+A (create only) ── */
  useEffect(() => {
    if (isEdit) return;
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? e.metaKey : e.altKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        addRow();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addRow, isEdit]);

  /* ── Options ── */
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
      discount: acc.discount + (Number(s.discount) || 0),
      profit:
        acc.profit + ((Number(s.sellPrice) || 0) - (Number(s.netPrice) || 0)),
      days: acc.days + nightsBetween(s.checkInDate, s.checkOutDate),
    }),
    { net: 0, sell: 0, vat: 0, paxVat: 0, discount: 0, profit: 0, days: 0 },
  );

  const { totals: paymentTotals, tabbyRows } = useMemo(
    () => computePaymentBreakdown(uiSales, customerOptions),
    [uiSales, customerOptions],
  );

  /* ── Submit ── */
  const legsFor = (s) => {
    if (!isEdit) return s.paymentLegs || null;
    if (s.paymentMeta?.type === "PARTIAL") {
      const m = s.paymentMeta;
      return ["a", "b"].map((side) => ({
        method: m[`${side}Method`],
        amount: Number(m[`${side}Amount`]),
        bankId: m[`${side}BankId`] || null,
        customerId: m[`${side}CustomerId`] || null,
        posId: m[`${side}PosId`] || null,
        posCardType: m[`${side}PosCardType`] || null,
        posCommissionRate: m[`${side}PosCommissionRate`] ?? null,
      }));
    }
    if (
      String(s.paymentType).toUpperCase() === "PARTIAL" &&
      Array.isArray(s.payments) &&
      s.payments.length > 0
    ) {
      return s.payments.map((leg) => ({
        method: leg.method,
        amount: Number(leg.amount),
        bankId: leg.bank?.id || leg.bankId || null,
        customerId: leg.customer?.id || leg.customerId || null,
        posId: leg.pos?.id || leg.posId || null,
        posCardType: leg.posCardType || null,
        posCommissionRate: leg.posCommissionRate ?? null,
      }));
    }
    return null;
  };

  const handleSubmit = async () => {
    const rows = isEdit ? uiSales : uiSales.filter((s) => !isEmptySale(s));
    if (!rows.length) {
      appToast.warning(
        "Empty Submission",
        "Add at least one insurance policy before submitting.",
      );
      return;
    }

    for (const [i, s] of rows.entries()) {
      const n = `Policy #${i + 1}: `;
      if (!s.airlineId || !kindOf(s)) {
        appToast.warning(
          "Incomplete Policy",
          `${n}choose Domestic or International Insurance`,
        );
        return;
      }
      if (
        !s.vendorId ||
        !s.documentNo ||
        !s.netPrice ||
        !s.sellPrice ||
        !s.paymentType
      ) {
        appToast.warning(
          "Incomplete Policy",
          `${n}fill Vendor, Policy No, Net, Sell and Payment`,
        );
        return;
      }
      if (!s.checkInDate || !s.checkOutDate) {
        appToast.warning(
          "Coverage Details Missing",
          `${n}add the policy start and end dates`,
        );
        return;
      }
      if (nightsBetween(s.checkInDate, s.checkOutDate) < 1) {
        appToast.warning(
          "Invalid Dates",
          `${n}the policy must end after it starts`,
        );
        return;
      }
      const pt = String(s.paymentType).toUpperCase();
      if (pt === "CREDIT" && !s.customerId) {
        appToast.warning(
          "Incomplete Policy",
          `${n}customer is required for CREDIT payment`,
        );
        return;
      }
      if (pt === "BANK_TRANSFER" && !s.bankId) {
        appToast.warning(
          "Incomplete Policy",
          `${n}select a bank account for Bank Transfer`,
        );
        return;
      }
      if (pt === "POS" && !s.posId) {
        appToast.warning(
          "Incomplete Policy",
          `${n}select a POS machine and card type`,
        );
        return;
      }
      if (pt === "PARTIAL" && !legsFor(s)) {
        appToast.warning(
          "Incomplete Policy",
          `${n}configure the split payment`,
        );
        return;
      }
    }

    const toPayload = (s) => ({
      ...(isEdit ? { id: s.id } : {}),
      saleType: "INSURANCE",
      airlineId: s.airlineId,
      vendorId: s.vendorId,
      customerId: s.customerId || null,
      bankId: s.bankId || null,
      posId: s.posId || null,
      posCardType: s.posCardType || null,
      posCommissionRate: s.posCommissionRate ?? null,
      documentNo: s.documentNo,
      pnr: s.pnr || null,
      routeType: s.routeType || null,
      checkInDate: toStayISO(s.checkInDate),
      checkOutDate: toStayISO(s.checkOutDate),
      hotelName: s.hotelName?.trim() || null,
      paxName: s.paxName || null,
      destinations: [],
      netPrice: Number(s.netPrice),
      // vendor charges, the VAT on them and the discount (all inside / taken off the net price)
      ...vendorChargesPayload(s),
      sellPrice: Number(s.sellPrice),
      vatAmount: Number(s.vatAmount || 0),
      paxVat: Number(s.paxVat || 0),
      miscCharges: Number(s.miscCharges || 0),
      paidAmount: Number(s.paidAmount || 0),
      paymentType: s.paymentType,
      paymentLegs: legsFor(s),
      remarks: s.remarks || null,
    });

    const payload = isEdit
      ? {
          invoiceNo,
          saleDate: saleDate ? saleDate.toISOString() : null,
          sales: rows.map(toPayload),
        }
      : { saleDate: saleDate.toISOString(), sales: rows.map(toPayload) };

    try {
      setLoading(true);
      await appToast.promise(
        fetch(
          isEdit
            ? `${API_BASE}/api/sales/${invoiceId}`
            : `${API_BASE}/api/sales`,
          {
            method: isEdit ? "PUT" : "POST",
            headers,
            body: JSON.stringify(payload),
          },
        ).then(async (res) => {
          const d = await res.json();
          if (!res.ok) throw new Error(d.error || "Failed");
          return d;
        }),
        {
          loading: isEdit
            ? "Updating insurance policy..."
            : "Submitting insurance policy...",
          success: (d) =>
            isEdit
              ? "Insurance policy updated successfully!"
              : `Invoice ${d?.data?.invoiceNo || ""} Submitted Successfully!`,
          error: (err) => err.message || "Failed to save insurance policy",
        },
      );
      if (!isEdit) {
        setUiSales([emptyRow()]);
        setSaleDate(new Date());
      }
    } catch (err) {
      console.error("Submission Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentSaleForDialog = uiSales.find((s) => s.id === coverageDialog.saleId);
  const PaymentComponent = isEdit ? EditPaymentDialog : PaymentDialog;

  /* ── Loading / error (edit) ── */
  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <span className="text-sm text-slate-500">Loading insurance policy...</span>
      </div>
    );
  }
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm font-medium text-red-500">
          Failed to load policy: {fetchError}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-700 p-5 sm:p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-indigo-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isEdit ? "Edit Insurance Policy" : "New Insurance Policy"}
              </h2>
              <p className="text-sm text-sky-50/90">
                {isEdit
                  ? "Update the coverage, pricing or payment of this policy"
                  : "Record domestic and international insurance with the same pricing, VAT and payment flow as flights"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[460px]">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                Invoice Number
              </span>
              <div className="flex h-10 items-center gap-2 rounded-xl bg-white/15 px-3 ring-1 ring-white/25 backdrop-blur">
                {fetchingInvoice ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Receipt className="h-4 w-4 text-sky-100" />
                )}
                <span className="font-mono text-sm font-semibold">
                  {invoiceNo || (fetchingInvoice ? "Loading..." : "No invoice")}
                </span>
                <span className="ml-auto rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">
                  {isEdit ? "Saved" : "Auto"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                Transaction Date
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center gap-2 rounded-xl bg-white/15 px-3 text-left text-sm font-medium ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/25"
                  >
                    <CalendarIcon className="h-4 w-4 text-sky-100" />
                    {saleDate ? format(saleDate, "PPP") : "Select date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={saleDate}
                    onSelect={(d) => {
                      if (!d) return;
                      // Keep the picked day but stamp the current time (a bare local midnight shifts the day in UTC)
                      const now = new Date();
                      const merged = new Date(d);
                      merged.setHours(
                        now.getHours(),
                        now.getMinutes(),
                        now.getSeconds(),
                        now.getMilliseconds(),
                      );
                      setSaleDate(merged);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <ShieldCheck className="h-5 w-5 text-sky-600" /> Insurance Policies
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {uiSales.length}
          </span>
        </h3>
        {!isEdit && (
          <Button
            onClick={addRow}
            className="gap-2 bg-sky-600 text-white hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" /> Add Policy{" "}
            <span className="text-xs opacity-80">(Alt+A)</span>
          </Button>
        )}
      </div>

      {/* Booking cards */}
      <div className="space-y-4">
        {uiSales.map((item, index) => {
          const kind = kindOf(item);
          const days = nightsBetween(item.checkInDate, item.checkOutDate);
          const profit = (
            (Number(item.sellPrice) || 0) - (Number(item.netPrice) || 0)
          ).toFixed(2);
          const hasCoverage = item.checkInDate && item.checkOutDate;

          return (
            <Card
              key={item.id}
              data-row-id={item.id}
              className="gap-0! overflow-hidden border-0 py-0 shadow-md ring-1 ring-slate-200"
            >
              {/* Card header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    Policy
                  </span>
                  {kind && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${kind.chip}`}
                    >
                      {kind.label}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(item.id)}
                  className="text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="space-y-5 p-5">
                {/* Insurance type */}
                <div className="space-y-1.5">
                  <FieldLabel required>Insurance Type</FieldLabel>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Object.values(INSURANCE_KINDS).map((k) => {
                      const airline = insuranceAirlines[k.key];
                      const active = kind?.key === k.key;
                      const Icon = k.icon;
                      return (
                        <button
                          key={k.key}
                          type="button"
                          disabled={!airline}
                          onClick={() =>
                            airline &&
                            updateSale(item.id, "airlineId", airline.id)
                          }
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                            active
                              ? k.ring
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${active ? k.chip : "bg-slate-100 text-slate-500"}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-800">
                              {k.label}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {airline
                                ? k.hint
                                : "Not set up — add it under Airlines"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-5">
                  {/* Coverage panel */}
                  <button
                    type="button"
                    onClick={() =>
                      setCoverageDialog({ open: true, saleId: item.id })
                    }
                    className={`group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all lg:col-span-2 ${
                      hasCoverage
                        ? "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 hover:shadow-md"
                        : "border-2 border-dashed border-slate-300 bg-slate-50/60 hover:border-sky-400 hover:bg-sky-50/40"
                    }`}
                  >
                    {hasCoverage || item.hotelName ? (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                              <ShieldCheck className="h-3.5 w-3.5" /> Coverage
                            </div>
                            <p className="mt-0.5 truncate text-base font-bold text-slate-800">
                              {item.hotelName || "Insurer / plan not set"}
                            </p>
                          </div>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-colors group-hover:text-sky-600">
                            <Pencil className="h-3.5 w-3.5" />
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-sky-600">
                              <CalendarCheck className="h-3 w-3" /> Starts
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                              {item.checkInDate
                                ? format(item.checkInDate, "dd MMM yyyy")
                                : "—"}
                            </div>
                          </div>
                          <div className="flex flex-col items-center text-indigo-600">
                            <Hourglass className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">
                              {days || "–"}
                            </span>
                          </div>
                          <div className="flex-1 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-slate-200">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-indigo-600">
                              <CalendarX className="h-3 w-3" /> Ends
                            </div>
                            <div className="text-sm font-bold text-slate-800">
                              {item.checkOutDate
                                ? format(item.checkOutDate, "dd MMM yyyy")
                                : "—"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                            <Hourglass className="h-3 w-3 text-sky-600" />
                            {days ? `${days} day${days === 1 ? "" : "s"} of cover` : "Dates not set"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-200 transition-transform group-hover:scale-105">
                          <ShieldCheck className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            Add coverage details
                          </p>
                          <p className="text-xs text-slate-500">
                            Policy start · end · insurance company / plan
                          </p>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Insured + policy info */}
                  <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:col-span-3">
                    <div className="space-y-1">
                      <FieldLabel icon={UserRound}>Insured Name</FieldLabel>
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
                        className={inputClass(false)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel icon={Ticket} required>
                        Policy No
                      </FieldLabel>
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
                        className={inputClass(!item.documentNo)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel>Certificate / Ref No</FieldLabel>
                      <Input
                        value={item.pnr || ""}
                        onChange={(e) =>
                          updateSale(
                            item.id,
                            "pnr",
                            e.target.value.toUpperCase(),
                          )
                        }
                        placeholder="Certificate or reference no"
                        className={inputClass(false)}
                      />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel required>Vendor</FieldLabel>
                      <Select
                        options={vendorOptions}
                        value={
                          vendorOptions.find(
                            (o) => o.value === item.vendorId,
                          ) || null
                        }
                        onChange={(o) =>
                          updateSale(item.id, "vendorId", o?.value)
                        }
                        placeholder="Select vendor"
                        menuPortalTarget={document.body}
                        styles={{
                          ...compactSelectStyles,
                          control: (b, s) => ({
                            ...compactSelectStyles.control(b, s),
                            borderColor: !item.vendorId
                              ? "#fda4af"
                              : compactSelectStyles.control(b, s).borderColor,
                          }),
                        }}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <FieldLabel>Remarks</FieldLabel>
                      <Input
                        value={item.remarks || ""}
                        onChange={(e) =>
                          updateSale(item.id, "remarks", e.target.value)
                        }
                        placeholder="Passport no, plan class, beneficiaries, notes…"
                        className={inputClass(false)}
                      />
                    </div>
                  </div>
                </div>

{/* Pricing — same layout as a New Sale: basic fare (VAT exclusive), D. Vat, vendor charges + their VAT,
                    discount, sell / paid, profit and the total VAT */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Calculator className="h-3.5 w-3.5" /> Pricing &amp; Payment
                  </div>
                  <div
                    className={`grid grid-cols-2 gap-3 ${item.routeType === "DOMESTIC" ? "md:grid-cols-4 xl:grid-cols-9" : "md:grid-cols-4 xl:grid-cols-8"}`}
                  >
                    {/* Basic fare (typed WITHOUT VAT), then PAX VAT on top of it (domestic only), then the vendor's
                        charges with the VAT on them and the resulting net total underneath */}
                    <VendorNetFields
                      item={item}
                      onChange={(f, v) => updateSale(item.id, f, v)}
                      size="md"
                      netRequired
                      fareWithVat
                      netInvalid={!item.netPrice}
                    >
                      {item.routeType === "DOMESTIC" && (
                        <div className="space-y-1">
                          <Label className="flex items-center gap-1 text-xs font-medium text-orange-700">
                            D. Vat 15%
                            <SaudiRiyal size={13} />
                          </Label>
                          <div className="flex h-9 items-center gap-1 rounded-[10px] border border-orange-200 bg-orange-50 px-2.5 text-xs font-semibold text-orange-700">
                            <Calculator className="h-3 w-3" />{" "}
                            {Number(item.paxVat || 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </VendorNetFields>

                    <div className="space-y-1">
                      <FieldLabel>
                        Discount <SaudiRiyal size={13} />
                      </FieldLabel>
                      <Input
                        type="tel"
                        value={item.discount ?? ""}
                        onChange={(e) =>
                          updateSale(item.id, "discount", e.target.value)
                        }
                        aria-label="Discount"
                        placeholder="0.00"
                        className={inputClass(false)}
                      />
                    </div>

                    <div className="space-y-1">
                      <FieldLabel required>
                        Sell <SaudiRiyal size={13} />
                      </FieldLabel>
                      <Input
                        type="tel"
                        value={item.sellPrice}
                        onChange={(e) =>
                          updateSale(item.id, "sellPrice", e.target.value)
                        }
                        placeholder="0.00"
                        className={inputClass(!item.sellPrice)}
                      />
                    </div>

                    <div className="space-y-1">
                      <FieldLabel>
                        Paid <SaudiRiyal size={13} />
                        {Number(item.sellPrice) > 0 && (
                          <span className="ml-1 text-rose-500">
                            {(item.sellPrice - (item.paidAmount || 0)).toFixed(
                              2,
                            )}{" "}
                            due
                          </span>
                        )}
                      </FieldLabel>
                      <Input
                        type="tel"
                        value={item.paidAmount}
                        readOnly
                        placeholder="0.00"
                        className="h-9 cursor-not-allowed rounded-[10px] bg-slate-100 text-sm text-slate-500"
                        title="Paid amount is set via the Payment dialog"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                        Profit <SaudiRiyal size={13} />
                      </Label>
                      <div className="flex h-9 items-center gap-1 rounded-[10px] border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700">
                        <Calculator className="h-3 w-3" /> {profit}
                      </div>
                      {Number(item.vatAmount) > 0 && (
                        <p
                          className="text-[10px] leading-tight text-slate-500"
                          data-testid="profit-vat"
                        >
                          VAT 15%: {Number(item.vatAmount).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* PAX VAT + vendor VAT + our VAT 15% */}
                    <TotalVatField item={item} size="md" />

                    <div className="col-span-2 space-y-1 md:col-span-1">
                      <FieldLabel required>Payment</FieldLabel>
                      <PaymentComponent
                        sale={item}
                        sellPrice={item.sellPrice}
                        customerOptions={customerOptions}
                        bankOptions={bankOptions}
                        posOptions={posOptions}
                        onConfirm={(result) =>
                          updateSale(item.id, "payment", result)
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="gap-0! overflow-hidden border-0 py-0 shadow-md ring-1 ring-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-5 py-3">
          <Calculator className="h-4 w-4 text-sky-700" />
          <span className="text-sm font-semibold text-slate-700">
            Financial Summary
          </span>
        </div>
        <CardContent className="space-y-4 p-5">
          <div
            className={`grid grid-cols-2 gap-3 ${uiSales.some((s) => s.routeType === "DOMESTIC") ? "md:grid-cols-4 xl:grid-cols-8" : "md:grid-cols-4 xl:grid-cols-7"}`}
          >
            {[
              {
                label: "Policies",
                value: isEdit
                  ? uiSales.length
                  : uiSales.filter((s) => !isEmptySale(s)).length,
                color: "slate",
                noSAR: true,
              },
              {
                label: "Coverage Days",
                value: totals.days,
                color: "indigo",
                noSAR: true,
              },
              {
                label: "Net Total",
                value: totals.net.toFixed(2),
                color: "blue",
              },
              {
                label: "Total Discount",
                value: totals.discount.toFixed(2),
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
                className={`rounded-xl border bg-white p-3.5 shadow-sm ${TONES[color].box}`}
              >
                <div
                  className={`mb-0.5 text-xs font-medium ${TONES[color].label}`}
                >
                  {label}
                </div>
                <div
                  className={`flex items-center gap-1 text-xl font-bold ${TONES[color].value}`}
                >
                  {!noSAR && <SaudiRiyal size={15} />}
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment Breakdown
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                {
                  label: "Cash",
                  value: paymentTotals.cash,
                  color: "emerald",
                  Icon: Banknote,
                },
                {
                  label: "Bank Transfer",
                  value: paymentTotals.bank,
                  color: "sky",
                  Icon: Building2,
                },
                {
                  label: "POS",
                  value: paymentTotals.pos,
                  color: "cyan",
                  Icon: Terminal,
                },
                {
                  label: "Credit",
                  value: paymentTotals.credit,
                  color: "violet",
                  Icon: CreditCard,
                },
              ].map(({ label, value, color, Icon }) => (
                <div
                  key={label}
                  className={`rounded-xl border bg-white p-3.5 shadow-sm ${TONES[color].box}`}
                >
                  <div
                    className={`mb-0.5 flex items-center gap-1.5 text-xs font-medium ${TONES[color].label}`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xl font-bold ${TONES[color].value}`}
                  >
                    <SaudiRiyal size={15} />
                    {value.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {tabbyRows.length > 0 && (
            <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">
              <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-fuchsia-700">
                <Sparkles className="h-4 w-4" /> Tabby / Tamara Details
              </div>
              <div className="space-y-2">
                {tabbyRows.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 gap-2 rounded-lg border border-fuchsia-100 bg-white p-2.5 text-xs sm:grid-cols-5"
                  >
                    <div>
                      <div className="text-slate-400">Policy / Customer</div>
                      <div className="truncate font-semibold text-slate-700">
                        {row.saleLabel} · {row.customerName}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Order Amount</div>
                      <div className="font-semibold text-slate-700">
                        {row.orderAmount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Fee + VAT</div>
                      <div className="font-semibold text-rose-600">
                        -{row.totalDeduction.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">VAT (15%)</div>
                      <div className="font-semibold text-slate-700">
                        {row.vat.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Net Amount</div>
                      <div className="font-semibold text-fuchsia-700">
                        {row.netAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-11 gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 px-8 text-base font-semibold text-white shadow-md hover:from-sky-700 hover:to-indigo-700"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {isEdit ? "Saving..." : "Submitting..."}
            </>
          ) : isEdit ? (
            <>
              <Save className="h-4 w-4" /> Save Changes
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit Policy
            </>
          )}
        </Button>
      </div>

      <InsuranceCoverageDialog
        open={coverageDialog.open}
        onOpenChange={(open) =>
          setCoverageDialog({ open, saleId: open ? coverageDialog.saleId : null })
        }
        sale={currentSaleForDialog}
        onUpdate={(field, value) =>
          currentSaleForDialog &&
          updateSale(currentSaleForDialog.id, field, value)
        }
      />
    </div>
  );
}
