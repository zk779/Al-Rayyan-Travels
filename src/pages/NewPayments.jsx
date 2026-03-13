"use client";

import { useState } from "react";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Textarea } from "../../shadcn/components/ui/textarea";
import { Badge } from "../../shadcn/components/ui/badge";
import { Separator } from "../../shadcn/components/ui/separator";
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import { Button } from "../../shadcn/components/ui/button";
import {
  Search,
  CalendarIcon,
  Building2,
  User,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileUp,
  X,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../shadcn/lib/utils";
import SlideButton from "../../shadcn/components/ui/slide-button";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const VENDORS = {
  "AL-RAY": {
    id: "V001",
    vendorName: "Al Rayyan Travel Supplier",
    vendorType: "Airline Ticket Supplier",
    category: "DEBIT",
    phone: "+974 4444 1234",
    email: "accounts@alrayyan.qa",
    address: "Al Rayyan Road, Doha, Qatar",
    balance: 12500,
    openingBalance: 15000,
  },
  "QAT-TP": {
    id: "V002",
    vendorName: "Qatar Travel Partners",
    vendorType: "Hotel & Transfers",
    category: "CREDIT",
    phone: "+974 5555 9876",
    email: "billing@qtp.qa",
    address: "West Bay, Doha, Qatar",
    balance: -3200,
    openingBalance: 0,
  },
  "GULF-AIR": {
    id: "V003",
    vendorName: "Gulf Air Solutions",
    vendorType: "GDS Aggregator",
    category: "DEBIT",
    phone: "+973 1111 2222",
    email: "ar@gulfair-sol.com",
    address: "Manama, Bahrain",
    balance: 0,
    openingBalance: 5000,
  },
};
const CUSTOMERS = {
  "JOHN-S": {
    id: "C001",
    customerName: "John Smith",
    customerType: "WALK_IN",
    phone: "+44 7700 900123",
    email: "john.smith@email.com",
    address: "London, UK",
    balance: 4800,
    openingBalance: 0,
  },
  "CORP-XYZ": {
    id: "C002",
    customerName: "XYZ Corporation",
    customerType: "CORPORATE",
    phone: "+974 3333 7777",
    email: "finance@xyz-corp.qa",
    address: "C Ring Road, Doha, Qatar",
    balance: -1500,
    openingBalance: 0,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `QAR ${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const balMeta = (balance, type) => {
  if (balance > 0)
    return type === "vendor"
      ? { label: "Payable", cls: "text-red-600 bg-red-50 border-red-200" }
      : {
          label: "Receivable",
          cls: "text-amber-600 bg-amber-50 border-amber-200",
        };
  if (balance < 0)
    return {
      label: "Credit / Advance",
      cls: "text-blue-600 bg-blue-50 border-blue-200",
    };
  return {
    label: "Settled",
    cls: "text-green-600 bg-green-50 border-green-200",
  };
};

// ── Step Bar ──────────────────────────────────────────────────────────────────
const Steps = ({ step, isVendor }) => {
  const labels = [
    "Select Type",
    isVendor ? "Find Vendor" : "Find Customer",
    "Payment",
  ];
  return (
    <div className="flex items-center justify-center mb-8">
      {labels.map((l, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step > i + 1
                  ? "bg-green-500 text-white"
                  : step === i + 1
                    ? "bg-slate-800 text-white ring-4 ring-slate-100"
                    : "bg-slate-100 text-slate-400",
              )}
            >
              {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[11px] font-medium whitespace-nowrap",
                step >= i + 1 ? "text-slate-700" : "text-slate-400",
              )}
            >
              {l}
            </span>
          </div>
          {i < 2 && (
            <div
              className={cn(
                "w-50 h-0.5 mb-5 mx-1 rounded",
                step > i + 1 ? "bg-green-400" : "bg-slate-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DepositTabComponent() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [entity, setEntity] = useState(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const isVendor = mode === "vendor";
  const newBalance = (entity?.balance ?? 0) - (parseFloat(amount) || 0);
  const { label: balLabel, cls: balCls } = entity
    ? balMeta(entity.balance, mode)
    : { label: "", cls: "" };
  const name = entity
    ? isVendor
      ? entity.vendorName
      : entity.customerName
    : "";

  const search = () => {
    if (!query.trim()) return;
    setSearching(true);
    setTimeout(() => {
      const found = (isVendor ? VENDORS : CUSTOMERS)[query.toUpperCase()];
      setEntity(found ?? null);
      if (!found)
        alert(
          isVendor ? "Try: AL-RAY, QAT-TP, GULF-AIR" : "Try: JOHN-S, CORP-XYZ",
        );
      setSearching(false);
    }, 700);
  };

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2500);
  };

  const reset = () => {
    setStep(1);
    setMode("");
    setQuery("");
    setEntity(null);
    setAmount("");
    setDate(new Date());
    setFile(null);
    setRemarks("");
    setSuccess(false);
  };

  // shared accent classes
  const accentBtn = isVendor
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-violet-600 hover:bg-violet-700";
  const accentBar = isVendor
    ? "from-blue-500 to-indigo-500"
    : "from-violet-500 to-purple-500";

  // ── STEP 1 ─────────────────────────────────────────────────────────────────
  if (step === 1)
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage vendor disbursements and customer receipts
          </p>
        </div>
        <Steps step={1} isVendor={false} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              type: "vendor",
              Icon: Building2,
              title: "Vendor Payment",
              sub: "Pay outstanding amounts to suppliers",
              hoverBorder: "hover:border-blue-300 hover:shadow-blue-100",
              grad: "from-blue-50 to-indigo-50",
              iconBg: "bg-blue-100 group-hover:bg-blue-200",
              iconClr: "text-blue-600",
              cta: "text-blue-600",
            },
            {
              type: "customer",
              Icon: User,
              title: "Customer Payment",
              sub: "Record incoming payments from customers",
              hoverBorder: "hover:border-violet-300 hover:shadow-violet-100",
              grad: "from-violet-50 to-purple-50",
              iconBg: "bg-violet-100 group-hover:bg-violet-200",
              iconClr: "text-violet-600",
              cta: "text-violet-600",
            },
          ].map(
            ({
              type,
              Icon,
              title,
              sub,
              hoverBorder,
              grad,
              iconBg,
              iconClr,
              cta,
            }) => (
              <button
                key={type}
                onClick={() => {
                  setMode(type);
                  setStep(2);
                }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none",
                  hoverBorder,
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br",
                    grad,
                  )}
                />
                <div className="relative">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                      iconBg,
                    )}
                  >
                    <Icon className={cn("w-6 h-6", iconClr)} />
                  </div>
                  <p className="font-bold text-slate-800 text-lg">{title}</p>
                  <p className="text-sm text-slate-500 mt-1">{sub}</p>
                  <div
                    className={cn(
                      "mt-4 flex items-center gap-1 text-xs font-semibold",
                      cta,
                    )}
                  >
                    Get Started <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ),
          )}
        </div>
      </div>
    );

  // ── STEP 2 ─────────────────────────────────────────────────────────────────
  if (step === 2)
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        <Steps step={2} isVendor={isVendor} />

        {/* Search box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
              <Search className="w-4 h-4" /> Search{" "}
              {isVendor ? "Vendor" : "Customer"}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isVendor
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-violet-50 text-violet-700 border-violet-200",
              )}
            >
              {isVendor ? "Vendor Payment" : "Customer Payment"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={
                isVendor
                  ? "e.g. AL-RAY, QAT-TP, GULF-AIR"
                  : "e.g. JOHN-S, CORP-XYZ"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="h-10"
            />
            <Button
              onClick={search}
              disabled={searching || !query.trim()}
              className={cn("h-10 px-5", accentBtn)}
            >
              {searching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Result card */}
        {entity && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
            <div className="p-6">
              {/* Entity header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                      isVendor ? "bg-blue-100" : "bg-violet-100",
                    )}
                  >
                    {isVendor ? (
                      <Building2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-violet-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-500">
                      {isVendor
                        ? entity.vendorType
                        : entity.customerType === "CORPORATE"
                          ? "Corporate Client"
                          : "Walk-in Customer"}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full border",
                    balCls,
                  )}
                >
                  {balLabel}
                </span>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5 text-xs text-slate-500">
                {[
                  [Phone, entity.phone],
                  [Mail, entity.email],
                  [MapPin, entity.address],
                ].map(
                  ([Icon, val], i) =>
                    val && (
                      <span key={i} className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        {val}
                      </span>
                    ),
                )}
              </div>

              <Separator className="mb-5" />

              {/* Balance */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] text-slate-400 mb-1">Opening</p>
                  <p className="font-semibold text-slate-700 text-sm">
                    {fmt(entity.openingBalance)}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-xl border p-3.5 col-span-2",
                    entity.balance > 0
                      ? "bg-red-50 border-red-100"
                      : entity.balance < 0
                        ? "bg-blue-50 border-blue-100"
                        : "bg-green-50 border-green-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] mb-1",
                      entity.balance > 0
                        ? "text-red-500"
                        : entity.balance < 0
                          ? "text-blue-500"
                          : "text-green-500",
                    )}
                  >
                    Current Balance {isVendor && `· ${entity.category} Vendor`}
                  </p>
                  <p
                    className={cn(
                      "font-bold text-2xl",
                      entity.balance > 0
                        ? "text-red-700"
                        : entity.balance < 0
                          ? "text-blue-700"
                          : "text-green-700",
                    )}
                  >
                    {entity.balance < 0 ? "−" : ""}
                    {fmt(entity.balance)}
                  </p>
                </div>
              </div>

              <Button
                className={cn("w-full h-11 font-semibold gap-2", accentBtn)}
                onClick={() => {
                  setAmount(Math.abs(entity.balance).toFixed(2));
                  setStep(3);
                }}
              >
                {isVendor ? "New Vendor Payment" : "Record Customer Payment"}
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setStep(1);
            setEntity(null);
            setQuery("");
          }}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back to selection
        </button>
      </div>
    );

  // ── STEP 3 ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <Steps step={3} isVendor={isVendor} />

      {success ? (
        /* Success */
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-xl mb-1">
            Payment Recorded!
          </h3>
          <p className="text-slate-500 text-sm mb-1">
            {fmt(parseFloat(amount))} recorded for{" "}
            <span className="font-medium">{name}</span>
          </p>
          <p className="text-xs text-slate-400 mb-6">
            New balance:{" "}
            <span
              className={cn(
                "font-semibold",
                newBalance > 0
                  ? "text-red-600"
                  : newBalance < 0
                    ? "text-blue-600"
                    : "text-green-600",
              )}
            >
              {newBalance < 0 ? "−" : ""}
              {fmt(newBalance)}
            </span>
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSuccess(false);
                setAmount("");
                setFile(null);
                setRemarks("");
                setStep(2);
              }}
            >
              New Payment
            </Button>
            <Button className={cn("flex-1", accentBtn)} onClick={reset}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Mini entity strip */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  isVendor ? "bg-blue-100" : "bg-violet-100",
                )}
              >
                {isVendor ? (
                  <Building2 className="w-4 h-4 text-blue-600" />
                ) : (
                  <User className="w-4 h-4 text-violet-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{name}</p>
                <p className="text-xs text-slate-400">
                  Current balance:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      entity.balance > 0
                        ? "text-red-600"
                        : entity.balance < 0
                          ? "text-blue-600"
                          : "text-green-600",
                    )}
                  >
                    {entity.balance < 0 ? "−" : ""}
                    {fmt(entity.balance)}
                  </span>
                </p>
              </div>
            </div>
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full border",
                balCls,
              )}
            >
              {balLabel}
            </span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className={cn("h-1 bg-gradient-to-r", accentBar)} />
            <div className="p-6 space-y-5">
              {/* Balance overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] text-slate-400 mb-1">
                    {isVendor ? "Total Payable" : "Total Receivable"}
                  </p>
                  <p className="font-bold text-slate-800">
                    {fmt(Math.abs(entity.balance))}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-xl border p-3.5 transition-colors",
                    newBalance > 0
                      ? "bg-amber-50 border-amber-100"
                      : newBalance < 0
                        ? "bg-blue-50 border-blue-100"
                        : "bg-green-50 border-green-100",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] mb-1",
                      newBalance > 0
                        ? "text-amber-500"
                        : newBalance < 0
                          ? "text-blue-500"
                          : "text-green-500",
                    )}
                  >
                    Balance After
                  </p>
                  <p
                    className={cn(
                      "font-bold",
                      newBalance > 0
                        ? "text-amber-700"
                        : newBalance < 0
                          ? "text-blue-700"
                          : "text-green-700",
                    )}
                  >
                    {newBalance < 0 ? "−" : ""}
                    {fmt(newBalance)}
                  </p>
                </div>
              </div>

              {/* Contextual hint */}
              {parseFloat(amount) > 0 && (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      newBalance === 0
                        ? "bg-green-400"
                        : newBalance < 0
                          ? "bg-blue-400"
                          : "bg-amber-400",
                    )}
                  />
                  {newBalance === 0
                    ? "This payment fully settles the balance. ✓"
                    : newBalance < 0
                      ? `Overpayment of ${fmt(Math.abs(newBalance))} — will create an advance.`
                      : `${fmt(newBalance)} will remain ${isVendor ? "payable" : "receivable"} after this payment.`}
                </div>
              )}

              <Separator />

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Payment Amount <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">
                    QAR
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-14 h-10 font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Payment Date <span className="text-red-400">*</span>
                </Label>
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal h-10 text-sm text-slate-600"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        setDate(d);
                        setCalOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Attachment */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Attachment
                </Label>
                <label className="flex items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-3.5 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      file ? "bg-green-100" : "bg-slate-100",
                    )}
                  >
                    {file ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <FileUp className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {file ? (
                      <p className="text-sm font-medium text-green-700 truncate">
                        {file.name}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600 font-medium">
                          Click to upload
                        </p>
                        <p className="text-xs text-slate-400">
                          PDF, JPG, PNG — max 10MB
                        </p>
                      </>
                    )}
                  </div>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                      }}
                      className="text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      e.target.files[0] && setFile(e.target.files[0])
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Remarks
                </Label>
                <Textarea
                  placeholder="Add payment notes or reference..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>

              <div className="">
                <SlideButton
                  handlePayment={pay}
                  disabled={processing || !amount || parseFloat(amount) <= 0}
                  price={parseFloat(amount) || 0}
                  isProcessing={processing}
                  className=""
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to search
          </button>
        </>
      )}
    </div>
  );
}
