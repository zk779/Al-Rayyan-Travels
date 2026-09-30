"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import {
  Percent,
  FileBarChart,
  TrendingDown,
  SaudiRiyal,
  Printer,
  Search,
  Loader2,
  Receipt,
  Wallet,
  ShoppingCart,
  Filter,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../shadcn/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import { Badge } from "../../shadcn/components/ui/badge";
import { Checkbox } from "../../shadcn/components/ui/checkbox";
import { Label } from "../../shadcn/components/ui/label";
import DateRangeInputs from "../components/DateRangeInputs";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Same bilingual company letterhead used on the invoice pages — printed
// version of this report carries it exactly the same way.
const companyData = {
  name: "AlMadaar Limited Company",
  nameArabic: "شركة المدار ليميتد",
  trn: "314713818300003",
  trnArabic: "٣١٤٧١٣٨١٨٣٠٠٠٠٣",
  crNumber: "7053982455",
  crNumberArabic: "٧٠٥٣٩٨٢٤٥٥",
  address:
    "GGDC6349, Al Mutalla Street 3140, Ar Rawdah Distt, Building No. 6349, Jazan, Kingdom of Saudi Arabia",
  addressArabic:
    "GGDC6349, شارع المطلعة 3140, حي الروضة مبنى رقم 6349, جازان, المملكة العربية السعودية",
  phone: "+966 17 3226260",
  phoneArabic: "+٩٦٦ ١٧ ٣٢٢٦٢٦٠",
  email: "agency@al-madaar.com",
  website: "www.al-madaar.com",
};

function StatCard({ label, labelAr, value, color, icon: Icon, sub }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-${color}-200`}>
      <div className={`flex items-center gap-2 text-xs text-${color}-600 mb-1.5 font-semibold`}>
        <span className={`h-7 w-7 rounded-lg bg-${color}-50 flex items-center justify-center shrink-0`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="leading-tight">
          {label}
          {labelAr && (
            <span className="block text-[10px] font-normal text-slate-400" dir="rtl">
              {labelAr}
            </span>
          )}
        </span>
      </div>
      <div className={`flex items-center gap-1 text-2xl font-bold text-${color}-700`}>
        <SaudiRiyal size={16} />
        {Number(value || 0).toFixed(2)}
      </div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

const getPaymentBadge = (type) => {
  const map = {
    CASH: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CREDIT: "bg-blue-50 text-blue-700 border-blue-200",
    BANK_TRANSFER: "bg-purple-50 text-purple-700 border-purple-200",
    POS: "bg-cyan-50 text-cyan-700 border-cyan-200",
    PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${map[type?.toUpperCase()] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {type || "N/A"}
    </Badge>
  );
};

export default function VatReport() {
  const navigate = useNavigate();
  const [range, setRange] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (range.from) params.set("dateFrom", format(range.from, "yyyy-MM-dd"));
      if (range.to) params.set("dateTo", format(range.to, "yyyy-MM-dd"));
      params.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone);

      const res = await fetch(`${API_BASE}/api/sales/vat-report?${params.toString()}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to generate VAT report");
      setReport(json.data);
      setHasSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  const periodLabel =
    range.from && range.to
      ? `${format(range.from, "dd MMM yyyy")} – ${format(range.to, "dd MMM yyyy")}`
      : range.from
        ? `From ${format(range.from, "dd MMM yyyy")}`
        : range.to
          ? `Up to ${format(range.to, "dd MMM yyyy")}`
          : "All time";

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
      <style>
        {`
          @media print {
            body { background: white !important; }
          }
        `}
      </style>

      {/* This page is a bare, sidebar-less route (see Layout.jsx) so it can
          print cleanly with no app chrome — needs its own back link and
          page padding that Layout would normally provide. */}
      <div className="print:hidden px-6 pt-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      </div>

      <div className="p-6 space-y-6">
      {/* Print-only letterhead */}
      {report && (
        <div className="hidden print:block mb-4 border-b-2 border-gray-900 pb-4">
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              <div className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                {companyData.name}
              </div>
              <div className="text-base font-bold text-gray-900 mb-2" dir="rtl">
                {companyData.nameArabic}
              </div>
              <div className="text-[11px] text-gray-600 space-y-0.5">
                <p>{companyData.address}</p>
                <p dir="rtl">{companyData.addressArabic}</p>
                <p>{companyData.phone} | {companyData.email}</p>
                <p>TRN/الرقم الضريبي: {companyData.trn} / {companyData.trnArabic}</p>
                <p>CR Number/رقم السجل التجاري: {companyData.crNumber} / {companyData.crNumberArabic}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-800 text-white px-4 py-2 rounded font-bold text-lg mb-1">
                VAT REPORT
              </div>
              <div className="text-xs text-gray-600">Period: {periodLabel}</div>
              <div className="text-xs text-gray-600">
                Generated: {format(new Date(), "dd MMM yyyy, HH:mm")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters + actions (screen only) */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-indigo-600" /> VAT Report
          </CardTitle>
          <CardDescription>
            Purchasing and selling totals with their exclusive 15% VAT, refunds
            for the period, and the resulting payable VAT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <DateRangeInputs from={range.from} to={range.to} onChange={setRange} disabled={loading} />
            <div className="flex items-center gap-4">
              {report && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showBreakdown"
                    checked={showBreakdown}
                    onCheckedChange={(v) => setShowBreakdown(!!v)}
                  />
                  <Label htmlFor="showBreakdown" className="text-sm text-slate-600 cursor-pointer">
                    Include sales breakdown
                  </Label>
                </div>
              )}
              <Button onClick={fetchReport} disabled={loading} className="bg-gradient-primary text-white gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Generate Report
              </Button>
              {report && (
                <Button variant="outline" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" /> Print
                </Button>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {!hasSearched && !loading && (
        <Card className="border-dashed border-gray-200 print:hidden">
          <CardContent className="py-16 flex flex-col items-center text-center gap-2">
            <div className="p-3 rounded-full bg-indigo-50">
              <Filter className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Pick a date range (or leave blank for all time) and generate the report
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="print:hidden">
          <CardContent className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-gray-600 font-medium">Crunching the numbers...</p>
          </CardContent>
        </Card>
      )}

      {report && !loading && (
        <>
          {/* Report period — visible on screen too, not just print */}
          <div className="flex items-center gap-2 text-sm text-slate-500 print:hidden">
            <Receipt className="h-4 w-4" />
            Period: <span className="font-medium text-slate-700">{periodLabel}</span>
            <span className="text-slate-300">•</span>
            {report.saleCount} sale{report.saleCount === 1 ? "" : "s"}
          </div>

          {/* Purchasing */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Purchasing (Net)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                label="Total Net / Purchasing Amount"
                labelAr="إجمالي صافي الشراء"
                value={report.totalNet}
                color="blue"
                icon={ShoppingCart}
              />
              <StatCard
                label="Purchasing VAT (15%, exclusive)"
                labelAr="ضريبة الشراء ١٥٪"
                value={report.purchasingVat}
                color="cyan"
                icon={Percent}
                sub="Net × 15%, added on top"
              />
            </div>
          </div>

          {/* Selling */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Wallet className="h-4 w-4" /> Selling
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                label="Total Selling Amount"
                labelAr="إجمالي المبيعات"
                value={report.totalSell}
                color="purple"
                icon={Receipt}
              />
              <StatCard
                label="Selling VAT (15%, exclusive)"
                labelAr="ضريبة المبيعات ١٥٪"
                value={report.sellingVat}
                color="indigo"
                icon={Percent}
                sub="Sell × 15%, added on top"
              />
            </div>
          </div>

          {/* Refunds */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4" /> Refunds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatCard
                label="Total Refund Amount"
                labelAr="إجمالي المبالغ المستردة"
                value={report.totalRefund}
                color="rose"
                icon={TrendingDown}
                sub={`${report.refundCount} refund${report.refundCount === 1 ? "" : "s"}`}
              />
              <StatCard
                label="Refund VAT (15%, exclusive)"
                labelAr="ضريبة المبالغ المستردة ١٥٪"
                value={report.refundVat}
                color="rose"
                icon={Percent}
                sub="Refund × 15%"
              />
            </div>
          </div>

          {/* Payable VAT — the headline result */}
          <div className="rounded-2xl bg-gradient-to-tl from-gray-700 to-gray-900 text-white p-6 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide opacity-80 font-semibold">
                  Total Payable VAT
                  <span className="block text-[11px] font-normal opacity-70" dir="rtl">
                    إجمالي ضريبة القيمة المضافة المستحقة
                  </span>
                </div>
                <div className="text-[11px] opacity-60 mt-1">
                  Selling VAT − Purchasing VAT − Refund VAT
                </div>
              </div>
              <div className="flex items-center gap-1 text-4xl font-bold">
                <SaudiRiyal size={26} />
                {Number(report.payableVat || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Breakdown tables — optional, toggled via "Include sales
              breakdown" above; when off, only the stat cards (and the
              payable VAT headline) show, on both screen and print. */}
          {showBreakdown && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileBarChart className="h-4 w-4" /> Contributing Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.sales.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-500">
                      No sales in this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Document #</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                            <TableHead className="text-right">Sell</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.sales.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="whitespace-nowrap text-xs">
                                {s.saleDate ? format(new Date(s.saleDate), "dd MMM yyyy") : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{s.invoiceNo || "—"}</TableCell>
                              <TableCell className="font-mono text-xs">{s.documentNo || "—"}</TableCell>
                              <TableCell className="text-xs max-w-[140px] truncate" title={s.vendorName}>
                                {s.vendorName || "—"}
                              </TableCell>
                              <TableCell>{getPaymentBadge(s.paymentType)}</TableCell>
                              <TableCell className="text-right text-xs font-medium">
                                {s.netPrice.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium">
                                {s.sellPrice.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingDown className="h-4 w-4" /> Contributing Refunds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.refunds.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-500">
                      No refunds in this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Refund Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Document #</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Refund Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.refunds.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="whitespace-nowrap text-xs">
                                {r.refundDate ? format(new Date(r.refundDate), "dd MMM yyyy") : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{r.invoiceNo || "—"}</TableCell>
                              <TableCell className="font-mono text-xs">{r.documentNo || "—"}</TableCell>
                              <TableCell className="text-xs max-w-[180px] truncate" title={r.refundReason}>
                                {r.refundReason || "—"}
                              </TableCell>
                              <TableCell className="text-right text-xs font-semibold text-rose-700">
                                {r.netRefundToCustomer.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
