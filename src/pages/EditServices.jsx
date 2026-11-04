"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

import EditSalesTab from "../components/EditSaleTab";
import VoidTabComponent from "../components/VoidTabComponent";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function EditSaleComponent() {
  const { saleId } = useParams(); // This could be the Invoice ID or Sale ID depending on your routing
  const [activeTab, setActiveTab] = useState("sales");
  const navigate = useNavigate();

  // A void is edited with its own form: look at the invoice first to see which one this is
  const [kind, setKind] = useState("checking"); // "checking" | "sale" | "void"
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/api/sales/${saleId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((j) => setKind((j.data?.sales || []).some((s) => s.status === "VOID") ? "void" : "sale"))
      .catch((err) => {
        if (err.name !== "AbortError") setKind("sale");
      });
    return () => controller.abort();
  }, [saleId]);

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Edit Services</CardTitle>
              <CardDescription>
                Update existing sales transactions or modify processed refunds
              </CardDescription>
            </div>
            {/* Returns to wherever this was opened from (e.g. Sales Report,
                with its search/filters/page intact) instead of a fixed route. */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="group gap-2 rounded-xl border-slate-200 bg-white px-3.5 py-2 text-slate-600 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary/50 dark:hover:bg-primary/10 dark:hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span className="font-medium">Go Back</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="sales">{kind === "void" ? "Edit Void" : "Edit Sale"}</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-6">
              {/* This component will now handle its own fetch/update logic using saleId */}
              {kind === "checking" ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                </div>
              ) : kind === "void" ? (
                <VoidTabComponent invoiceId={saleId} />
              ) : (
                <EditSalesTab saleId={saleId} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
