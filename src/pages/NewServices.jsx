"use client";

import { useState } from "react";
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
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";

import SalesTabComponent from "../components/SalesTabComponent";
import RefundTabComponent from "../components/RefundTabComponent";
import SubmitButton from "../components/SubmitButton";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function NewSaleComponent() {
  const [activeTab, setActiveTab] = useState("new-sale");
  const token = localStorage.getItem("token");

  // 🔑 SHARED STATE (single source of truth)
  const [invoiceNo, setInvoiceNo] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [sales, setSales] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [loading, setLoading] = useState(false);

  /* ======================
     SINGLE SUBMIT HANDLER
  ====================== */
  const handleSubmit = async () => {
    console.log("Submitting:", { invoiceNo, saleDate, sales, refunds });
    if (!invoiceNo) {
      alert("Invoice number is required");
      return;
    }

    if (sales.length === 0 && refunds.length === 0) {
      alert("Add at least one sale or refund");
      return;
    }

    const payload = {
      invoiceNo,
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

      alert("Sales & refunds submitted successfully");

      // 🔄 Reset after success
      setInvoiceNo("");
      setSales([]);
      setRefunds([]);
      setActiveTab("new-sale");
    } catch (err) {
      alert(err.message);
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
            <div>
              <label className="text-sm font-medium">Invoice No</label>
              <Input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-1001"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Sale Date</label>
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
          </div>

          {/* ======================
              TABS (UI ONLY)
          ====================== */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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
              SINGLE SUBMIT BUTTON
          ====================== */}
          <div className="flex justify-center pt-4">
            <SubmitButton onClick={handleSubmit} disabled={loading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
