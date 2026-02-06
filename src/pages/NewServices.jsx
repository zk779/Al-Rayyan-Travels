"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../shadcn/components/ui/card";
import { Input } from "../../shadcn/components/ui/input";

import SalesTabComponent from "../components/SalesTabComponent";
import RefundTabComponent from "../components/RefundTabComponent";
import SubmitButton from "../components/SubmitButton";
import { appToast } from "../../shadcn/components/ui/appToast";
import { Receipt, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function NewSaleComponent() {
  const [activeTab, setActiveTab] = useState("new-sale");
  const token = localStorage.getItem("token");

  // READ-ONLY display invoice no
  const [invoiceNo, setInvoiceNo] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [fetchingInvoice, setFetchingInvoice] = useState(false);

  const [sales, setSales] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch invoice number whenever saleDate changes
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    async function fetchInvoiceNo() {
      try {
        setFetchingInvoice(true);
        const res = await fetch(
          `${API_BASE}/api/invoice/next?saleDate=${saleDate}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch invoice no");

        setInvoiceNo(data.invoiceNo || "");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          appToast.error(
            "Invoice Error",
            "Failed to fetch invoice number. Please try again."
          );
          setInvoiceNo("");
        }
      } finally {
        setFetchingInvoice(false);
      }
    }

    fetchInvoiceNo();
    return () => controller.abort();
  }, [saleDate, token]);

  /* ======================
     SINGLE SUBMIT HANDLER
  ====================== */
  const handleSubmit = async () => {
    if (sales.length === 0 && refunds.length === 0) {
      appToast.warning(
        "Empty Submission", 
        "Add at least one sale or refund before submitting."
      );
      return;
    }

    // ✅ We DO NOT send invoiceNo anymore
    const payload = {
      saleDate,
      sales,
      refunds,
    };

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // ✅ Success toast
      appToast.invoice(
        "Submission Successful", 
        `Invoice No: ${data?.data?.invoiceNo || invoiceNo}`
      );

      // Reset after success
      setSales([]);
      setRefunds([]);
      setActiveTab("new-sale");

      // Refresh invoiceNo display
      setSaleDate((d) => d);
    } catch (err) {
      appToast.error(
        "Submission Failed",
        err.message || "Failed to submit sales and refunds"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sales Services</CardTitle>
          <CardDescription>
            Add new sales and process refunds in a single invoice
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ======================
              INVOICE HEADER
          ====================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Enhanced Invoice No Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Invoice Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {fetchingInvoice ? (
                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
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
              <p className="text-xs text-gray-500">
                Generated automatically
              </p>
            </div>

            {/* Sale Date Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Sale Date
              </label>
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          {/* ======================
              TABS
          ====================== */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new-sale">New Sale</TabsTrigger>
              <TabsTrigger value="refund">Refund</TabsTrigger>
            </TabsList>

            <TabsContent value="new-sale">
              <SalesTabComponent sales={sales} setSales={setSales} />
            </TabsContent>

            <TabsContent value="refund">
              <RefundTabComponent refunds={refunds} setRefunds={setRefunds} />
            </TabsContent>
          </Tabs>

          {/* ======================
              SUBMIT
          ====================== */}
          <div className="flex justify-center pt-4">
            <SubmitButton onClick={handleSubmit} disabled={loading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}