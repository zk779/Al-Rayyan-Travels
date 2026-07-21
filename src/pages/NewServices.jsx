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

import SalesTabComponent from "../components/SalesTabComponent";
import RefundTabComponent from "../components/RefundTabComponent";
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

export default function NewSaleComponent() {
  // ✅ RBAC — permission flags for the two tabs
  const { hasPermission } = useAuth();
  const canCreateSale = hasPermission("SALE_CREATE");
  const canCreateRefund = hasPermission("REFUND_CREATE");

  // ✅ Default to whichever tab the user actually has access to
  const [activeTab, setActiveTab] = useState(
    canCreateSale ? "new-sale" : canCreateRefund ? "refund" : null
  );
  if (!canCreateSale && !canCreateRefund) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            You don't have permission to create sales or refunds.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sales Services</CardTitle>
        </CardHeader>

        <CardContent>
          {/* ✅ RBAC — only show tab switcher if BOTH permissions exist */}
          {canCreateSale && canCreateRefund ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new-sale">New Sale</TabsTrigger>
                <TabsTrigger value="refund">Refund</TabsTrigger>
              </TabsList>

              <TabsContent value="new-sale" className="mt-6">
                <SalesTabComponent />
              </TabsContent>

              <TabsContent value="refund" className="mt-6">
                <RefundTabComponent />
              </TabsContent>
            </Tabs>
          ) : canCreateSale ? (
            <SalesTabComponent />
          ) : (
            <RefundTabComponent />
          )}
        </CardContent>
      </Card>
    </div>
  );
}